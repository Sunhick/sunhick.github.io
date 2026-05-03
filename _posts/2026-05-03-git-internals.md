---
title: "Git Internals: Objects, Refs, and the Machinery Behind the Porcelain"
date: 2026-05-03 10:00:00 -0700
categories: [Version Control]
tags: [git, internals, plumbing, objects, refs, distributed-systems]
---

Most git tutorials teach you the commands — commit, branch, merge, rebase. This post goes a level deeper into how git actually stores and tracks your code. Understanding the internals turns git from a tool you memorize into a tool you reason about. When a merge goes sideways or a rebase produces something unexpected, knowing what's happening under the hood is the difference between panic and a calm `git reflog`.

Git is fundamentally a content-addressable filesystem with a version control system built on top. Everything else — branches, tags, merges, the staging area — is machinery layered over four object types and a handful of reference files.

## The Object Model

Git stores everything as objects in `.git/objects/`. Every object is identified by the SHA-1 hash of its content. There are exactly four types.

### Blobs

A blob stores file content. No filename, no permissions — just raw bytes.

```bash
# Create a blob manually
echo "hello world" | git hash-object -w --stdin
# => 95d09f2b10159347eece71399a7e2e907ea3df4f

# Read it back
git cat-file -p 95d09f2b10159347eece71399a7e2e907ea3df4f
# => hello world

# Check its type
git cat-file -t 95d09f2b10159347eece71399a7e2e907ea3df4f
# => blob
```

The same content always produces the same hash. If two files in your repo have identical content, git stores one blob and points to it twice. This is automatic deduplication.

### Trees

A tree is a directory listing. It maps filenames and permissions to blobs (files) or other trees (subdirectories).

```bash
# Look at the tree for the current commit
git cat-file -p HEAD^{tree}
# 100644 blob 95d09f2...   README.md
# 040000 tree a1b2c3d...   src
# 100755 blob e4f5a6b...   build.sh
```

The format: `<mode> <type> <hash>\t<name>`. Modes you'll see:

| Mode | Meaning |
|------|---------|
| `100644` | Regular file |
| `100755` | Executable file |
| `120000` | Symbolic link |
| `040000` | Subdirectory (tree) |
| `160000` | Submodule (commit reference) |

Trees are recursive. A tree for the root directory points to trees for subdirectories, which point to more trees, all the way down to blobs at the leaves. This forms a Merkle tree — if any file anywhere in the tree changes, every tree hash up to the root changes too.

### Commits

A commit points to a tree (the snapshot of the entire project at that point) plus metadata.

```bash
git cat-file -p HEAD
# tree a1b2c3d4e5f6...
# parent 9f8e7d6c5b4a...
# author Sunil Murthy <sunhick@gmail.com> 1714700000 -0700
# committer Sunil Murthy <sunhick@gmail.com> 1714700000 -0700
#
# feat(posts): Add git internals article
```

A commit contains:
- `tree` — the root tree hash (the full project snapshot)
- `parent` — zero or more parent commit hashes (zero for the initial commit, one for normal commits, two or more for merges)
- `author` — who wrote the change and when
- `committer` — who applied the change and when (different during cherry-pick, rebase, or `--amend`)
- The commit message

The parent chain is what forms the history graph. Git's history is a directed acyclic graph (DAG) of commits, not a linear sequence.

### Tags (Annotated)

An annotated tag is an object that points to a commit with extra metadata — tagger, date, message, and optionally a GPG signature.

```bash
git cat-file -p v1.0.0
# object 9f8e7d6c5b4a...
# type commit
# tag v1.0.0
# tagger Sunil Murthy <sunhick@gmail.com> 1714700000 -0700
#
# Release 1.0.0
```

Lightweight tags (created with `git tag name` without `-a` or `-m`) are not objects — they're just refs. More on that below.

### How Objects Are Stored

Every object is stored as: `<type> <size>\0<content>`, compressed with zlib, in `.git/objects/<first-2-chars>/<remaining-38-chars>`.

```bash
# See the raw object files
ls .git/objects/95/d09f2b10159347eece71399a7e2e907ea3df4f

# Count all objects
find .git/objects -type f | wc -l
```

Once a repository grows, git packs objects into `.git/objects/pack/*.pack` files for efficiency. Packfiles use delta compression — similar objects are stored as deltas against a base object. This is why git repos are surprisingly small even with long histories.

```bash
# Manually trigger packing
git gc

# Inspect packfiles
git verify-pack -v .git/objects/pack/*.idx | head -20
```

## Refs: Named Pointers to Objects

Objects are identified by 40-character hex hashes. Nobody wants to type those. Refs are human-readable names that point to object hashes.

### The Refs Directory

```bash
ls -la .git/refs/
# heads/    — local branches
# tags/     — tags
# remotes/  — remote-tracking branches

# A branch is literally a file containing a commit hash
cat .git/refs/heads/main
# 9f8e7d6c5b4a3d2e1f0a9b8c7d6e5f4a3b2c1d0e

# A tag (lightweight) is the same thing
cat .git/refs/tags/v1.0.0
# 9f8e7d6c5b4a3d2e1f0a9b8c7d6e5f4a3b2c1d0e
```

A branch is a pointer to a commit. That's it. Creating a branch is writing 41 bytes (40 hex chars + newline) to a file. This is why git branches are cheap.

### HEAD

`HEAD` is the special ref that tells git where you are right now.

```bash
# Usually points to a branch (symbolic ref)
cat .git/HEAD
# ref: refs/heads/main

# In detached HEAD state, points directly to a commit
cat .git/HEAD
# 9f8e7d6c5b4a3d2e1f0a9b8c7d6e5f4a3b2c1d0e
```

When `HEAD` points to a branch and you make a commit, git:
1. Creates the new commit object (pointing to the current commit as parent)
2. Updates the branch ref to point to the new commit
3. `HEAD` still points to the branch, which now points to the new commit

When `HEAD` is detached (pointing directly to a commit), new commits create "orphan" commits that no branch tracks. They'll be garbage collected eventually unless you create a branch pointing to them.

### Reflog: The Safety Net

Every time a ref changes, git records the old and new values in the reflog.

```bash
# See where HEAD has been
git reflog
# 9f8e7d6 HEAD@{0}: commit: feat: add git internals article
# 4ab6fde HEAD@{1}: commit: fix: two-column layout
# 4dc7c78 HEAD@{2}: commit: feat: emacs keybindings

# See where a specific branch has been
git reflog show main

# Recover a "lost" commit
git reflog | grep "the thing I lost"
git checkout <hash>
git branch recovered-work
```

The reflog is local only (not pushed) and expires after 90 days by default. It's your undo history for git operations — rebase gone wrong, accidental branch deletion, bad reset. As long as the reflog entry exists, the commit is recoverable.

## The Index (Staging Area)

The index is the file `.git/index`. It's a binary file that represents the next commit you're about to make — a flat list of every file that will be in the snapshot, with their blob hashes, permissions, and timestamps.

```bash
# See the index contents
git ls-files --stage
# 100644 95d09f2b... 0    README.md
# 100644 a1b2c3d4... 0    src/main.rs
# 100755 e4f5a6b7... 0    build.sh
```

The third column (0) is the stage number. During a clean state, everything is stage 0. During a merge conflict, git stores multiple versions:

| Stage | Meaning |
|-------|---------|
| 0 | Normal (no conflict) |
| 1 | Common ancestor |
| 2 | Ours (current branch) |
| 3 | Theirs (branch being merged) |

```bash
# During a conflict, see all stages
git ls-files --unmerged
# 100644 aaa... 1    conflicted-file.txt   (ancestor)
# 100644 bbb... 2    conflicted-file.txt   (ours)
# 100644 ccc... 3    conflicted-file.txt   (theirs)
```

This is how git tracks conflicts — it's not magic, it's three blob entries for the same path in the index.

### The Three Trees

Git operations make more sense when you think in terms of three trees:

| Tree | Location | What it represents |
|------|----------|--------------------|
| HEAD | `.git/HEAD` → commit → tree | Last committed snapshot |
| Index | `.git/index` | Next commit (staging area) |
| Working Directory | Your actual files | What you see and edit |

- `git add` copies from working directory → index
- `git commit` copies from index → new commit (updates HEAD)
- `git checkout` copies from commit → index → working directory
- `git reset --soft` moves HEAD only
- `git reset --mixed` moves HEAD, resets index (default)
- `git reset --hard` moves HEAD, resets index, resets working directory

Every git command is a manipulation of these three trees. Once you see it this way, commands like `reset`, `checkout`, and `restore` stop being confusing.

## How Merge Actually Works

A merge combines two lines of development. Here's what git does internally.

### Fast-Forward Merge

If the target branch is a direct ancestor of the branch being merged, git just moves the pointer forward. No merge commit needed.

```
Before:
A --- B --- C (main)
              \
               D --- E (feature)

git checkout main && git merge feature

After (fast-forward):
A --- B --- C --- D --- E (main, feature)
```

Git moves `main` to point to `E`. No new objects created.

### Three-Way Merge

When both branches have diverged, git finds the merge base (common ancestor) and does a three-way comparison.

```
Before:
A --- B --- C (main)
      \
       D --- E (feature)

Merge base: B
Ours: C
Theirs: E
```

For each file, git compares three versions:
1. If only one side changed the file → take that version
2. If both sides changed the file in the same way → take either (they're identical)
3. If both sides changed the file differently → conflict

```bash
# Find the merge base manually
git merge-base main feature
# => <hash of B>

# See what changed on each side
git diff B..C    # what main did
git diff B..E    # what feature did
```

The merge commit has two parents:

```bash
git cat-file -p HEAD   # after merge
# tree ...
# parent <C's hash>
# parent <E's hash>
# ...
```

### Recursive Merge Strategy

When there are multiple possible merge bases (criss-cross merges), git uses the "recursive" strategy — it merges the merge bases first to create a virtual ancestor, then uses that as the base. This is the default strategy and handles most cases correctly.

## How Rebase Actually Works

Rebase replays commits onto a new base. It's not moving commits — it's creating new ones.

```
Before:
A --- B --- C (main)
      \
       D --- E (feature)

git checkout feature && git rebase main

After:
A --- B --- C (main)
              \
               D' --- E' (feature)
```

What git does:
1. Find the merge base (`B`)
2. Compute the diff for each commit on feature (`B→D`, `D→E`)
3. Reset feature to `main` (`C`)
4. Apply each diff as a new commit (`D'`, `E'`)

`D'` and `E'` are new commit objects with new hashes — they have different parents and possibly different trees than `D` and `E`. The original `D` and `E` still exist in the object store (and in the reflog) but no branch points to them anymore.

This is why you don't rebase commits that have been pushed — anyone who based work on `D` or `E` now has commits that don't exist in the rebased history.

### Interactive Rebase Internals

`git rebase -i` generates a todo list and processes it sequentially:

```
pick D feat: add login
pick E feat: add logout
```

Each instruction (`pick`, `squash`, `edit`, `reword`, `drop`) tells git what to do with that commit during replay. `squash` combines a commit with the previous one. `edit` pauses the rebase so you can amend. `drop` skips the commit entirely.

Under the hood, the rebase state is stored in `.git/rebase-merge/` (or `.git/rebase-apply/`). If a rebase is interrupted, these directories contain the todo list, current position, and patch data. `git rebase --abort` deletes this directory and restores the original branch position from the reflog.

## Pack Files and Garbage Collection

### Loose vs Packed Objects

New objects start as loose files — one file per object in `.git/objects/`. As the repo grows, `git gc` (or `git repack`) packs them into packfiles.

```bash
# See loose objects
find .git/objects -type f -not -path '*/pack/*' | wc -l

# See packfiles
ls -lh .git/objects/pack/

# Trigger garbage collection
git gc
```

A packfile (`.pack`) contains multiple objects, delta-compressed. The index file (`.idx`) provides fast lookup by hash. Git finds the best delta chains automatically — a 1MB file that changed by one line is stored as the full file plus a tiny delta, not two 1MB blobs.

### What Gets Garbage Collected

`git gc` removes objects that are:
- Not reachable from any ref (branch, tag, HEAD)
- Not in the reflog
- Older than the expiry period (default: 2 weeks for unreachable, 90 days for reflog)

This is why "deleted" commits are recoverable for a while — they're unreachable but not yet garbage collected. After `git gc --prune=now`, they're gone for real.

```bash
# See unreachable objects
git fsck --unreachable

# See what would be pruned
git gc --dry-run

# Nuclear option: prune everything unreachable right now
git gc --prune=now
```

## Plumbing Commands

Git has two layers: porcelain (user-facing commands) and plumbing (low-level primitives). The plumbing commands are what porcelain is built on.

### Reading Objects

```bash
# Show object content
git cat-file -p <hash>

# Show object type
git cat-file -t <hash>

# Show object size
git cat-file -s <hash>
```

### Writing Objects

```bash
# Create a blob from stdin
echo "content" | git hash-object -w --stdin

# Create a blob from a file
git hash-object -w path/to/file

# Create a tree from the index
git write-tree

# Create a commit from a tree
echo "commit message" | git commit-tree <tree-hash> -p <parent-hash>
```

### Building a Commit by Hand

You can construct a commit entirely from plumbing commands:

```bash
# 1. Create blobs
echo "hello" | git hash-object -w --stdin
# => abc123...

# 2. Build the index
git update-index --add --cacheinfo 100644,abc123...,hello.txt

# 3. Write the index as a tree
git write-tree
# => def456...

# 4. Create the commit
echo "manual commit" | git commit-tree def456... -p HEAD
# => 789abc...

# 5. Update the branch ref
git update-ref refs/heads/main 789abc...
```

This is exactly what `git commit` does internally — it's just automated.

### Inspecting History

```bash
# Walk the commit graph
git rev-list HEAD

# Show commits reachable from A but not B
git rev-list B..A

# Show commits reachable from either but not both
git rev-list A...B

# Count commits
git rev-list --count HEAD

# Find which commit introduced a file
git log --diff-filter=A -- path/to/file
```

### Ref Manipulation

```bash
# Read a ref
git rev-parse HEAD
git rev-parse main
git rev-parse HEAD~3

# Update a ref
git update-ref refs/heads/main <new-hash>

# Delete a ref
git update-ref -d refs/heads/old-branch

# List all refs
git for-each-ref
git for-each-ref --format='%(refname:short) %(objectname:short)' refs/heads/
```

## Transfer Protocols

When you push or fetch, git transfers objects between repositories. Understanding this helps debug remote issues.

### What Happens During Fetch

1. Git asks the remote: "what refs do you have and what do they point to?"
2. Compares with local refs to determine what's new
3. Requests the missing objects (commits, trees, blobs)
4. The remote sends a packfile containing just the missing objects
5. Git updates remote-tracking refs (`refs/remotes/origin/*`)

```bash
# See what the remote has without fetching
git ls-remote origin

# Fetch with verbose output to see the negotiation
GIT_TRACE=1 git fetch origin
```

### What Happens During Push

1. Git tells the remote: "I want to update ref X from old-hash to new-hash"
2. Sends a packfile with objects the remote doesn't have
3. The remote verifies the update is a fast-forward (unless force push)
4. The remote updates its refs

If the remote ref has moved since you last fetched, the push is rejected (non-fast-forward). This is the "someone else pushed first" scenario — you need to fetch and merge/rebase before pushing.

## Practical Debugging

### Finding What Changed

```bash
# What commit introduced this line?
git log -S "function_name" --oneline

# What commit last touched this line?
git blame -L 10,20 path/to/file

# What changed between two commits?
git diff HEAD~5..HEAD --stat

# What files were touched by a commit?
git diff-tree --no-commit-id -r <hash>
```

### Finding Lost Work

```bash
# Check the reflog first
git reflog

# Find dangling commits (no branch points to them)
git fsck --lost-found

# Recover dangling commits
ls .git/lost-found/commit/
git show <hash>
git branch recovered <hash>
```

### Verifying Repository Integrity

```bash
# Full integrity check
git fsck --full

# Verify packfile integrity
git verify-pack -v .git/objects/pack/*.idx

# Check for corruption
git fsck --strict
```

## Wrapping Up

Git's internals are simpler than most people expect. Four object types (blob, tree, commit, tag), a content-addressable store, and named pointers (refs). Everything else — branches, merges, rebases, the staging area — is built from these primitives. The plumbing commands let you manipulate them directly, and the reflog keeps a safety net under all of it.

The next time a merge conflict looks confusing, remember: git is comparing three trees (base, ours, theirs) and marking the files where both sides diverged. The next time a rebase goes wrong, remember: the original commits are still in the reflog for 90 days. And the next time someone says "git is complicated," you can explain that it's actually a content-addressable filesystem with a DAG on top — the complexity is in the porcelain, not the plumbing.
