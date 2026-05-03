---
title: "Advanced Git Internals: Packfile Mechanics, Merge Strategies, and the Wire Protocol"
date: 2026-05-03 14:00:00 -0700
categories: [Version Control]
tags: [git, internals, plumbing, packfiles, merge-strategies, protocol, performance]
---

The [intermediate article]({% post_url 2026-05-03-git-internals %}) covered the object model, refs, the index, and how merge and rebase work at a high level. This goes further — into the details that matter when you're debugging performance problems in large repos, writing git tooling, or trying to understand why a merge produced an unexpected result.

## Packfile Format and Delta Compression

The intermediate article mentioned that git packs objects into packfiles. Here's how that actually works.

### Packfile Structure

A packfile (`.git/objects/pack/*.pack`) is a single binary file containing multiple objects. Its companion index file (`.idx`) provides O(1) lookup by hash.

```
PACK header:
  4 bytes: "PACK" magic
  4 bytes: version (2)
  4 bytes: number of objects

For each object:
  variable: type + size (variable-length encoding)
  variable: compressed data (zlib)

20 bytes: SHA-1 checksum of the entire pack
```

Objects in a packfile come in two flavors:

- **Undeltified** — the full object, zlib-compressed. Types: commit, tree, blob, tag.
- **Deltified** — stored as a delta against a base object. Types: `ofs_delta` (base referenced by offset within the pack) or `ref_delta` (base referenced by SHA-1 hash).

```bash
# Inspect a packfile in detail
git verify-pack -v .git/objects/pack/*.idx

# Output format:
# <hash> <type> <size> <size-in-pack> <offset> [<depth> <base-hash>]
# Deltified objects show depth and base
```

### How Delta Compression Works

Git's delta format is a copy/insert instruction stream, not a traditional diff. It says "copy bytes 0-500 from the base, then insert these 20 new bytes, then copy bytes 520-1000 from the base."

```
Delta format:
  source-size (variable-length int)
  target-size (variable-length int)
  instructions:
    0xxxxxxx = insert next N bytes literally (N = low 7 bits)
    1xxxxxxx = copy from source (offset + size encoded in remaining bits)
```

This is more compact than a line-based diff because it operates on raw bytes. A 1MB binary file with a 10-byte change produces a delta of roughly 30 bytes — the copy instruction for the unchanged prefix, the insert for the change, and the copy for the unchanged suffix.

### Delta Chain Depth

Deltas can chain — object A is a delta against B, which is a delta against C, which is undeltified. Reconstructing A requires reading C, applying B's delta, then applying A's delta.

```bash
# See delta chain depths
git verify-pack -v .git/objects/pack/*.idx | sort -k5 -n | tail -20

# The depth column shows how many deltas must be applied
# Default max depth: 50 (configurable via pack.depth)
```

Deep chains save space but cost CPU during reads. Git balances this with `pack.depth` (max chain length, default 50) and `pack.window` (how many objects to consider as delta bases, default 10).

```bash
# Repack with aggressive settings
git repack -a -d --depth=250 --window=250

# Repack with default settings
git repack -a -d
```

### Packfile Index Format (v2)

The `.idx` file provides fast lookup:

```
Header:
  4 bytes: magic (0xff744f63)
  4 bytes: version (2)

Fanout table:
  256 * 4 bytes: cumulative count of objects with hash starting 00, 01, ..., ff

SHA-1 table:
  N * 20 bytes: sorted list of all object hashes

CRC32 table:
  N * 4 bytes: CRC32 of each object's packed data

Offset table:
  N * 4 bytes: offset into packfile (or index into large offset table if MSB set)

Large offset table (optional):
  M * 8 bytes: 64-bit offsets for packfiles > 2GB

Trailer:
  20 bytes: SHA-1 of the packfile
  20 bytes: SHA-1 of this index
```

The fanout table is the key to fast lookup. To find hash `a1b2c3...`, git reads `fanout[0xa1]` to get the range of objects starting with `a1`, then binary searches within that range. Two disk reads for any object in a pack of millions.

### Multi-Pack Index (MIDX)

Large repositories (monorepos, kernel) can have hundreds of packfiles. The multi-pack index (`.git/objects/pack/multi-pack-index`) provides a single lookup across all packs.

```bash
# Generate a multi-pack index
git multi-pack-index write

# Verify it
git multi-pack-index verify

# Repack using the MIDX
git multi-pack-index repack --batch-size=0
```

The MIDX is especially important for partial clones and repos served by hosting platforms — it avoids opening every packfile to find a single object.

## Commit Graph

The commit graph file (`.git/objects/info/commit-graph`) is an acceleration structure for commit traversal. Without it, git must decompress and parse every commit object to walk history. With it, commit metadata is available in a fixed-size binary format.

```bash
# Generate the commit graph
git commit-graph write --reachable

# Verify it
git commit-graph verify
```

### What It Stores

For each commit:
- OID (object hash)
- Tree OID
- Parent positions (indices into the graph, not hashes — O(1) parent lookup)
- Commit timestamp
- Generation number

### Generation Numbers

The generation number of a commit is 1 + max(generation numbers of parents). The root commit has generation 1. This enables a critical optimization: if commit A has generation 10 and commit B has generation 50, then A cannot be an ancestor of B if A's generation is higher than B's. Git can skip entire branches of the DAG without reading them.

```bash
# See generation numbers
git log --format="%H %ct" | head -5
# The commit-graph stores these internally; you can't query them directly
# but git log, merge-base, and rev-list all use them automatically
```

Before generation numbers, `git merge-base` on a repo with 1M commits required walking potentially all of them. With generation numbers, it can prune huge portions of the graph.

### Changed-Path Bloom Filters

Git 2.27+ can store Bloom filters in the commit graph that record which paths changed in each commit.

```bash
# Write commit graph with Bloom filters
git commit-graph write --reachable --changed-paths
```

This accelerates `git log -- path/to/file` dramatically. Without Bloom filters, git must diff every commit's tree against its parent to check if the path changed. With them, git checks the Bloom filter first — if it says "definitely not changed," git skips the commit entirely. False positives are possible (git falls back to the full diff), but false negatives are not.

On large repos, this turns `git log -- deeply/nested/file.txt` from minutes to seconds.

## Merge Strategies in Depth

The intermediate article covered three-way merge basics. Here's the full picture.

### ort (Ostensibly Recursive's Twin)

Since Git 2.34, `ort` is the default merge strategy, replacing `recursive`. It's a complete rewrite that's faster and handles edge cases better.

Key differences from `recursive`:
- Operates on the index directly instead of checking out files to the working directory during intermediate steps
- Handles rename detection more efficiently
- Produces cleaner results for directory renames
- Significantly faster on large repos (10-100x in some cases)

```bash
# Explicitly use ort
git merge -s ort feature

# Fall back to recursive (old default)
git merge -s recursive feature
```

### Rename Detection

During merge, git needs to detect files that were renamed. It doesn't track renames explicitly — it infers them by comparing the trees.

```bash
# See what git considers a rename
git diff --find-renames HEAD~1 HEAD

# Adjust the similarity threshold (default 50%)
git diff -M60% HEAD~1 HEAD

# During merge, rename detection uses:
git merge -X rename-threshold=60% feature
```

The algorithm:
1. Find files that exist in the base but not in one side (deleted)
2. Find files that exist in one side but not in the base (added)
3. Compare deleted files against added files by content similarity
4. If similarity exceeds the threshold (default 50%), it's a rename

This is O(n*m) where n is deleted files and m is added files. For large merges with many file changes, rename detection can be slow. Git caps it:

```bash
# Default limit: 1000 files
git config merge.renameLimit

# Increase for large merges
git config merge.renameLimit 10000

# Disable rename detection entirely
git merge -X no-renames feature
```

### Merge with Subtree Strategy

The `subtree` strategy handles merging a repository that lives in a subdirectory of another:

```bash
# Merge repo B into subdirectory lib/ of repo A
git merge -s subtree B/main
```

Git shifts the tree of one side to match the other. This is how some projects manage vendored dependencies without submodules.

### Octopus Merge

An octopus merge combines more than two branches simultaneously. Git uses the `octopus` strategy automatically when you merge multiple branches:

```bash
git merge feature-a feature-b feature-c
```

The octopus strategy only works if there are no conflicts. If any pair of branches conflicts, it aborts. This is intentional — octopus merges are for integrating multiple independent feature branches, not for resolving conflicts.

```bash
git cat-file -p HEAD  # after octopus merge
# tree ...
# parent <main's hash>
# parent <feature-a's hash>
# parent <feature-b's hash>
# parent <feature-c's hash>
```

### Ours Strategy vs Ours Option

These are different things:

```bash
# Strategy: completely ignore the other branch's changes
# Result tree is identical to HEAD
git merge -s ours feature

# Option: during a recursive/ort merge, prefer our side on conflicts
# Non-conflicting changes from both sides are still merged
git merge -X ours feature
```

`-s ours` is useful for recording that a branch was merged (for history) without taking any of its changes. `-X ours` is for "merge normally but auto-resolve conflicts in our favor."

## The Wire Protocol (v2)

Git protocol v2 (default since Git 2.26) is how git clients and servers communicate during fetch and push.

### Protocol v2 Capabilities

```bash
# See the protocol negotiation
GIT_TRACE_PACKET=1 git fetch origin 2>&1 | head -30
```

The conversation:

```
Client → Server: git-upload-pack /repo.git (with capabilities)
Server → Client: list of capabilities (ls-refs, fetch, server-option)
Client → Server: command=ls-refs (list references)
Server → Client: ref advertisements
Client → Server: command=fetch (with want/have negotiation)
Server → Client: packfile with requested objects
```

### Want/Have Negotiation

The most interesting part of fetch is the negotiation — the client tells the server what it wants and what it already has, and the server computes the minimal packfile.

```
Client: want <hash-of-remote-main>
Client: want <hash-of-remote-feature>
Client: have <hash-of-local-commit-1>
Client: have <hash-of-local-commit-2>
...
Server: ACK <hash>  (I have this too, we share history here)
Server: NAK         (I don't have any of your "have" objects)
```

The server walks backward from the wanted commits until it reaches commits the client already has (ACKed), then sends everything in between as a packfile.

### Partial Clone and Sparse Checkout

Protocol v2 enables partial clones — cloning a repo without downloading all blobs.

```bash
# Clone without blobs (download on demand)
git clone --filter=blob:none <url>

# Clone without blobs larger than 1MB
git clone --filter=blob:limit=1m <url>

# Clone without trees (extreme — only commits)
git clone --filter=tree:0 <url>
```

When you checkout a file that wasn't downloaded, git fetches it on demand from the remote. This is how you work with multi-GB monorepos without cloning the entire history.

Sparse checkout complements this by limiting which directories are checked out:

```bash
git sparse-checkout init --cone
git sparse-checkout set src/my-component tests/my-component
```

Together, partial clone + sparse checkout means you can work in a 100GB monorepo while only downloading and checking out the 50MB you actually need.

## Grafts and Replace Objects

### Replace Objects

`git replace` creates an object that transparently substitutes for another. Every git command that reads the original object sees the replacement instead.

```bash
# Replace a commit (e.g., to fix a commit message in published history)
git replace <original-hash> <replacement-hash>

# List replacements
git replace -l

# Delete a replacement
git replace -d <original-hash>

# Replacements live in refs/replace/
ls .git/refs/replace/
```

Use cases:
- Stitching together repositories (replace the root commit of repo B with a commit in repo A to create a unified history)
- Fixing metadata in published commits without rewriting history
- Creating shallow history boundaries

```bash
# Stitch two repos: make commit X appear to be a child of commit Y
echo "tree $(git cat-file -p X | grep tree | cut -d' ' -f2)
parent Y
author ...
committer ...

Stitched history" | git hash-object -t commit -w --stdin
# => Z

git replace X Z
# Now git log shows X's parent as Y
```

### Shallow Clones and Grafts

A shallow clone has truncated history — commits beyond the depth limit have no parents.

```bash
# Clone with limited history
git clone --depth=1 <url>

# Deepen later
git fetch --deepen=10

# Convert to full clone
git fetch --unshallow
```

Shallow boundaries are stored in `.git/shallow`. Each line is a commit hash that has had its parents removed. Git treats these as root commits.

```bash
cat .git/shallow
# abc123... (this commit's parents were stripped)
```

## Worktrees

`git worktree` lets you check out multiple branches simultaneously in separate directories, sharing a single `.git` repository.

```bash
# Add a worktree for a feature branch
git worktree add ../feature-work feature-branch

# List worktrees
git worktree list

# Remove a worktree
git worktree remove ../feature-work
```

Internally, the secondary worktree has a `.git` file (not directory) that points back to the main repo:

```bash
cat ../feature-work/.git
# gitdir: /path/to/main-repo/.git/worktrees/feature-work
```

The main repo tracks worktrees in `.git/worktrees/<name>/`, which contains the worktree's HEAD, index, and refs. The object store is shared — no duplication.

This is useful for:
- Running tests on one branch while developing on another
- Reviewing a PR without stashing your current work
- Building multiple branches simultaneously

## Fsmonitor and Filesystem Caching

On large repos, `git status` can be slow because it stats every file in the working directory. Fsmonitor hooks into the OS filesystem watcher to track which files changed since the last query.

```bash
# Enable the built-in fsmonitor daemon (Git 2.37+)
git config core.fsmonitor true

# Check if it's running
git fsmonitor--daemon status

# Manually trigger a query
git fsmonitor--daemon query
```

On macOS, this uses FSEvents. On Linux, inotify. On Windows, ReadDirectoryChangesW. The result: `git status` on a 300,000-file repo goes from 2 seconds to 50 milliseconds.

### Untracked Cache

The untracked cache remembers which directories contain no untracked files, so git can skip scanning them entirely.

```bash
git config core.untrackedCache true
git update-index --untracked-cache
```

Combined with fsmonitor, this makes `git status` nearly instant on any repo size.

## SHA-256 Transition

Git is transitioning from SHA-1 to SHA-256. As of Git 2.42+, you can create SHA-256 repositories:

```bash
git init --object-format=sha256
```

SHA-256 hashes are 64 hex characters instead of 40. The object format is otherwise identical — blobs, trees, commits, and tags work the same way.

The transition is happening gradually:
- New repos can opt into SHA-256
- Existing SHA-1 repos will eventually be convertible
- The wire protocol supports hash negotiation so SHA-1 and SHA-256 repos can interoperate

The motivation isn't collision attacks on git specifically (the SHA-1 collision attack requires chosen-prefix control that's hard to exploit in git objects), but defense in depth and alignment with modern cryptographic standards.

## Hooks in Depth

Git hooks are scripts in `.git/hooks/` that run at specific points in the git workflow.

### Hook Execution Model

Hooks run in the repo's working directory with specific environment variables set. Their exit code matters:

| Exit Code | Effect |
|-----------|--------|
| 0 | Hook succeeded, operation continues |
| Non-zero | Hook failed, operation aborted (for pre-* hooks) |

Post-hooks (post-commit, post-merge, etc.) can't abort the operation — it already happened.

### Useful Hook Patterns

```bash
# pre-commit: run linter on staged files only
#!/bin/bash
git diff --cached --name-only --diff-filter=ACM | \
  grep '\.py$' | xargs -r python -m flake8

# prepare-commit-msg: add branch name to commit message
#!/bin/bash
BRANCH=$(git symbolic-ref --short HEAD 2>/dev/null)
if [ -n "$BRANCH" ]; then
  sed -i.bak -e "1s/^/[$BRANCH] /" "$1"
fi

# pre-push: run tests before allowing push
#!/bin/bash
make test

# post-checkout: install dependencies when switching branches
#!/bin/bash
# $3 is 1 for branch checkout, 0 for file checkout
if [ "$3" = "1" ]; then
  npm install --silent 2>/dev/null
fi
```

### Server-Side Hooks

On the receiving end of a push:

| Hook | When | Can Reject? |
|------|------|-------------|
| `pre-receive` | Before any refs are updated | Yes |
| `update` | Once per ref being updated | Yes (per-ref) |
| `post-receive` | After all refs are updated | No |
| `post-update` | After refs are updated (simpler) | No |

`pre-receive` gets the old and new hash for each ref on stdin. This is where hosting platforms implement branch protection, required reviews, and CI gates.

```bash
# pre-receive: reject force pushes to main
#!/bin/bash
while read oldrev newrev refname; do
  if [ "$refname" = "refs/heads/main" ]; then
    if ! git merge-base --is-ancestor "$oldrev" "$newrev"; then
      echo "ERROR: Force push to main is not allowed"
      exit 1
    fi
  fi
done
```

## Wrapping Up

The advanced internals — packfile delta compression, commit graphs with Bloom filters, the wire protocol's want/have negotiation, partial clones — are what make git scale from a 10-file project to a million-file monorepo. Most developers never need to think about them, but when you're debugging why `git status` takes 5 seconds, why a fetch transferred more data than expected, or why a merge produced a surprising result, this is where the answers live.

The tools are all there: `git verify-pack` for packfile inspection, `GIT_TRACE_PACKET` for protocol debugging, `git replace` for history surgery, and `git fsmonitor--daemon` for filesystem performance. Git exposes its internals more than almost any other tool — you just have to know where to look.
