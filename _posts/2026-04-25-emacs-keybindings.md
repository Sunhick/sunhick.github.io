---
title: "Emacs Keybindings: A Comprehensive Reference from Basics to Advanced"
date: 2026-04-25 10:00:00 -0700
categories: [Editors]
tags: [emacs, keybindings, productivity, magit, eglot, org-mode]
---

<style>
.content:has(> .kb-post) {
  columns: 2;
  column-gap: 2rem;
}
@media (max-width: 849px) {
  .content:has(> .kb-post) { columns: 1; }
}
.content:has(> .kb-post) h2 {
  column-span: all;
}
.content:has(> .kb-post) hr {
  column-span: all;
}
.content:has(> .kb-post) h3 {
  margin-top: 0.5rem;
}
.content:has(> .kb-post) .table-wrapper,
.content:has(> .kb-post) h3,
.content:has(> .kb-post) p,
.content:has(> .kb-post) ul {
  break-inside: avoid;
}
</style>

<div class="kb-post"></div>

This is the keybinding reference I wish I had when I started using Emacs seriously. It covers the built-in defaults, the package bindings I actually use daily, and the muscle memory that makes Emacs feel fast once it clicks.

Notation: `C-` = Ctrl, `M-` = Alt/Option, `S-` = Shift, `SPC` = Space, `RET` = Enter, `DEL` = Backspace.

---

## Core Bindings

### Navigation

| Key | Action |
|-----|--------|
| `C-f` | Forward char |
| `C-b` | Backward char |
| `M-f` | Forward word |
| `M-b` | Backward word |
| `C-n` | Next line |
| `C-p` | Previous line |
| `C-a` | Beginning of line |
| `C-e` | End of line |
| `M-<` | Beginning of buffer |
| `M->` | End of buffer |
| `C-v` | Scroll down (page) |
| `M-v` | Scroll up (page) |
| `C-l` | Recenter screen |
| `M-g g` | Go to line number |
| `M-g c` | Go to char position |

### Structural Navigation

| Key | Action |
|-----|--------|
| `C-M-f` | Forward sexp |
| `C-M-b` | Backward sexp |
| `C-M-a` | Beginning of defun |
| `C-M-e` | End of defun |
| `C-M-u` | Up sexp (out of parens) |
| `C-M-d` | Down sexp (into parens) |
| `C-M-n` | Next sexp (same level) |
| `C-M-p` | Previous sexp (same level) |

`C-` moves by character, `M-` moves by word, `C-M-` moves by structure.

### Editing

| Key | Action |
|-----|--------|
| `C-d` | Delete char forward |
| `DEL` | Delete char backward |
| `M-d` | Kill word forward |
| `M-DEL` | Kill word backward |
| `C-k` | Kill to end of line |
| `C-w` | Kill region (cut) |
| `M-w` | Copy region |
| `C-y` | Yank (paste) |
| `M-y` | Cycle yank ring (after `C-y`) |
| `C-/` | Undo |
| `C-x u` | Undo (alternate) |
| `C-t` | Transpose chars |
| `M-t` | Transpose words |
| `C-x C-t` | Transpose lines |
| `M-u` | Uppercase word |
| `M-l` | Lowercase word |
| `M-c` | Capitalize word |
| `M-SPC` | Cycle spacing |
| `M-q` | Fill paragraph |
| `C-M-k` | Kill sexp |
| `C-o` | Open line |
| `C-j` | Newline and indent |

### Mark and Region

| Key | Action |
|-----|--------|
| `C-SPC` | Set mark (start selection) |
| `C-x h` | Select all |
| `M-h` | Mark paragraph |
| `C-M-h` | Mark function |
| `C-M-SPC` | Mark sexp |
| `C-x C-x` | Exchange point and mark |

### Search and Replace

| Key | Action |
|-----|--------|
| `C-s` | Isearch forward |
| `C-r` | Isearch backward |
| `C-M-s` | Isearch forward (regexp) |
| `C-M-r` | Isearch backward (regexp) |
| `M-%` | Query replace |
| `C-M-%` | Query replace (regexp) |
| `M-s o` | Occur (list matches) |
| `M-s h r` | Highlight regexp |
| `M-s h u` | Unhighlight regexp |

### Files and Buffers

| Key | Action |
|-----|--------|
| `C-x C-f` | Find file |
| `C-x C-s` | Save file |
| `C-x C-w` | Save as |
| `C-x s` | Save all modified buffers |
| `C-x b` | Switch buffer |
| `C-x C-b` | List buffers (ibuffer) |
| `C-x k` | Kill buffer |
| `C-x C-r` | Find file read-only |
| `C-x C-v` | Find alternate file |

### Windows

| Key | Action |
|-----|--------|
| `C-x 0` | Delete current window |
| `C-x 1` | Delete other windows |
| `C-x 2` | Split horizontally |
| `C-x 3` | Split vertically |
| `C-x o` | Switch to other window |
| `C-x ^` | Enlarge vertically |
| `C-x }` | Enlarge horizontally |
| `C-x {` | Shrink horizontally |
| `S-<arrow>` | Windmove (directional) |

### Tab-Bar Mode (Workspaces)

Invisible workspaces — tab bar is hidden, but tabs are active. Switch by number.

| Key | Action |
|-----|--------|
| `C-x t 2` | New tab |
| `C-x t 0` | Close current tab |
| `C-x t 1` | Close all other tabs |
| `C-x t o` | Next tab |
| `C-x t O` | Previous tab |
| `C-x t r` | Rename tab |
| `C-x t m` | Move tab |
| `M-1` through `M-5` | Switch to tab by number |

Each tab has its own window configuration. Use them like virtual desktops — one tab for code, one for shell, one for notes.

### Winner Mode (Window Undo)

Undo/redo window configuration changes. Accidentally closed a split? Undo it.

| Key | Action |
|-----|--------|
| `C-c <left>` | Undo window config change |
| `C-c <right>` | Redo window config change |

Works across any window operation — splits, deletes, resizes. The entire window layout history is tracked.

### Registers and Bookmarks

| Key | Action |
|-----|--------|
| `C-x r SPC` | Save point to register |
| `C-x r j` | Jump to register |
| `C-x r s` | Copy region to register |
| `C-x r i` | Insert register contents |
| `C-x r w` | Save window config |
| `C-x r f` | Save frame config |
| `C-x r m` | Set bookmark |
| `C-x r b` | Jump to bookmark |
| `C-x r l` | List bookmarks |

### Help

| Key | Action |
|-----|--------|
| `C-h k` | Describe key |
| `C-h f` | Describe function |
| `C-h v` | Describe variable |
| `C-h m` | Describe current modes |
| `C-h b` | List all keybindings |
| `C-h a` | Apropos (search commands) |
| `C-h i` | Info manual |
| `C-h t` | Tutorial |

## Package Keybindings

### Magit (Git)

| Key | Action |
|-----|--------|
| `C-x g` | Open magit-status |
| `s` / `u` | Stage / unstage |
| `c c` | Commit |
| `C-c C-c` | Confirm commit message |
| `C-c C-k` | Cancel commit |
| `P p` | Push |
| `F p` | Pull |
| `b b` / `b c` | Switch / create branch |
| `l l` / `l a` | Log current / all |
| `d d` | Diff |
| `f` | Fetch |
| `r` | Rebase popup |
| `m` | Merge popup |
| `t` | Tag popup |
| `z` | Stash popup |
| `g` / `q` | Refresh / quit |
| `TAB` | Toggle section |
| `$` | Show process output |

### FZF (Fuzzy Finder)

| Key | Action |
|-----|--------|
| `C-c f f` | Find git files |
| `C-c f g` | FZF in git repo |
| `C-c f d` | FZF in directory |
| `C-c f s` | Git grep |
| `C-c f p` | FZF in project |

### Ripgrep (rg)

| Key | Action |
|-----|--------|
| `M-x rg` | Ripgrep search |
| `M-x rg-project` | Search in project |
| `M-x rg-dwim` | Search thing at point |
| `C-c s` | Ripgrep menu |

In results: `n`/`p` navigate, `RET` visits, `e` enters wgrep, `g` reruns, `q` quits.

### Multiple Cursors

| Key | Action |
|-----|--------|
| `C->` | Mark next like this |
| `C-<` | Mark previous like this |
| `C-c C-<` | Mark all like this |

### Corfu (Completion)

| Key | Action |
|-----|--------|
| (auto) | Popup after 2 chars |
| `TAB` | Select/expand |
| `M-n` / `M-p` | Next / previous |
| `RET` | Accept |
| `C-g` | Quit |

### Vertico (Minibuffer)

| Key | Action |
|-----|--------|
| `C-n` / `C-p` | Next / previous |
| `RET` | Accept |
| `TAB` | Partial insert |
| `C-g` | Quit |

Orderless matching — type words in any order.

### Eglot (LSP)

| Key | Action |
|-----|--------|
| `M-.` | Go to definition |
| `M-,` | Go back |
| `M-?` | Find references |
| `C-c C-r` | Rename symbol |
| `C-c C-a` | Code actions |
| `M-x eglot-format` | Format buffer |
| `C-h .` | Show docs (eldoc) |

### Smartparens

| Key | Action |
|-----|--------|
| `C-M-f` / `C-M-b` | Forward / backward sexp |
| `C-M-k` | Kill sexp |
| `C-M-SPC` | Mark sexp |
| `C-M-u` / `C-M-d` | Up / down sexp |
| `C-M-n` / `C-M-p` | Next / previous sexp |

### Go Mode

| Key | Action |
|-----|--------|
| `C-c C-r` | Remove unused imports |
| `C-c C-g` | Go to imports |
| `C-c C-f` | Run gofmt |

### Org Mode

| Key | Action |
|-----|--------|
| `TAB` | Cycle visibility |
| `S-TAB` | Cycle global visibility |
| `M-RET` | New heading |
| `M-S-RET` | New TODO heading |
| `C-c C-t` | Toggle TODO state |
| `C-c C-s` | Schedule |
| `C-c C-d` | Deadline |
| `C-c C-c` | Toggle checkbox / execute |
| `C-c '` | Edit source block |
| `C-c C-e` | Export dispatcher |
| `C-c C-l` | Insert/edit link |
| `C-c C-o` | Open link at point |
| `C-c a` | Agenda |
| `C-c c` | Capture |
| `C-c C-w` | Refile heading |
| `C-c C-x C-a` | Archive subtree |
| `C-c /` | Sparse tree (filter by regexp/TODO/etc.) |
| `C-c .` | Insert timestamp |
| `C-c C-x p` | Set property |
| `M-<up/down>` | Move subtree |
| `M-<left/right>` | Promote / demote |
| `C-c C-x C-i` | Clock in |
| `C-c C-x C-o` | Clock out |

### Org Capture

`C-c c` opens the capture dispatcher. Templates define what gets captured and where it goes.

| Key | Action |
|-----|--------|
| `C-c c` | Open capture templates |
| `C-c C-c` | Finalize capture (save and close) |
| `C-c C-w` | Refile capture to different location |
| `C-c C-k` | Abort capture (discard) |

During capture:
- Type your note/task in the capture buffer
- `C-c C-c` saves it to the configured target file and heading
- `C-c C-w` lets you choose a different refile target before saving
- `C-c C-k` discards without saving

In the agenda (`C-c a`):

| Key | Action |
|-----|--------|
| `a` | Agenda view (week) |
| `t` | TODO list |
| `s` | Search |
| `m` | Match tags |
| `n` / `p` | Next / previous item |
| `RET` | Go to entry |
| `t` | Toggle TODO state |
| `I` / `O` | Clock in / out |
| `r` | Refresh |
| `q` | Quit agenda |

### Ediff (Diff/Merge)

| Key | Action |
|-----|--------|
| `n` / `p` | Next / previous diff |
| `j` | Jump to diff |
| `a` | Copy A to B / choose A |
| `b` | Copy B to A / choose B |
| `r a` / `r b` | Restore region A / B |
| `v` / `V` | Scroll down / up |
| `w a` / `w b` | Save buffer A / B |
| `!` | Recompute diffs |
| `q` | Quit |

### Dired (File Manager)

| Key | Action |
|-----|--------|
| `C-x d` | Open dired |
| `RET` | Open file |
| `^` | Parent directory |
| `m` / `u` / `U` | Mark / unmark / unmark all |
| `t` | Toggle marks |
| `% m` | Mark by regexp |
| `d` / `x` | Flag / execute deletion |
| `D` | Delete immediately |
| `C` / `R` | Copy / rename |
| `Z` | Compress/decompress |
| `!` | Shell command on marked |
| `C-x C-q` | wdired (edit filenames) |
| `C-c C-c` | Commit wdired |

### Proced (Process Manager)

Built-in process manager. Open with `M-x proced`.

| Key | Action |
|-----|--------|
| `M-x proced` | Open process list |
| `g` | Refresh process list |
| `m` | Mark process |
| `u` | Unmark process |
| `M` | Mark all |
| `U` | Unmark all |
| `d` | Mark for deletion (SIGTERM) |
| `x` | Execute marks (send signals) |
| `k` | Send signal to process at point |
| `s` | Sort by column (toggle) |
| `f` | Filter processes |
| `t` | Toggle tree view |
| `RET` | Refine (show children of process) |
| `n` / `p` | Next / previous process |
| `q` | Quit proced |

Like `top`/`htop` but inside Emacs. Mark multiple processes and send signals in bulk.

## Advanced Built-in Commands

### Keyboard Macros

| Key | Action |
|-----|--------|
| `C-x (` | Start recording |
| `C-x )` | Stop recording |
| `C-x e` | Execute (then `e` to repeat) |
| `C-u 0 C-x e` | Execute until error |
| `C-u 50 C-x e` | Execute 50 times |
| `C-x C-k n` | Name last macro |
| `C-x C-k b` | Bind macro to key |
| `C-x C-k e` | Edit last macro |
| `C-x C-k r` | Apply to each line in region |
| `C-x C-k C-c` | Set counter |
| `C-x C-k C-i` | Insert counter |
| `C-x C-k C-a` | Set increment |

### Rectangle Operations

| Key | Action |
|-----|--------|
| `C-x SPC` | Rectangle mark mode |
| `C-x r k` | Kill rectangle |
| `C-x r y` | Yank rectangle |
| `C-x r d` | Delete rectangle |
| `C-x r o` | Open (insert space) |
| `C-x r c` | Clear (replace with spaces) |
| `C-x r t` | Replace with string |
| `C-x r N` | Number lines |

### Narrowing

| Key | Action |
|-----|--------|
| `C-x n n` | Narrow to region |
| `C-x n d` | Narrow to defun |
| `C-x n p` | Narrow to page |
| `C-x n w` | Widen (restore) |

### Shell and Process Interaction

| Key | Action |
|-----|--------|
| `M-!` | Shell command |
| `M-&` | Async shell command |
| `M-x shell` | Interactive shell |
| `M-x eshell` | Emacs shell |
| `M-x term` | Terminal emulator |
| `M-x compile` | Run compile |
| `M-x recompile` | Rerun compile |

### Advanced Isearch

While isearch is active:

| Key | Action |
|-----|--------|
| `M-e` | Edit search string |
| `C-w` | Yank word at point |
| `C-M-y` | Yank char at point |
| `M-s .` | Symbol at point |
| `M-s w` | Toggle word mode |
| `M-s r` | Toggle regexp mode |
| `M-s c` | Toggle case sensitivity |
| `M-s o` | Occur with search |
| `M-n` / `M-p` | Search history |

### Numeric / Universal Arguments

| Key | Action |
|-----|--------|
| `C-u` | Universal arg (4) |
| `C-u C-u` | 16 |
| `C-u 8` / `M-8` | Numeric arg 8 |
| `C-u -` / `M--` | Negative arg |

How `C-u` modifies commands:

| Key | Effect |
|-----|--------|
| `C-u 10 C-n` | Move down 10 lines |
| `C-u C-k` | Kill entire line |
| `C-u C-SPC` | Pop mark ring |
| `C-u C-l` | Recenter at top |

### Dynamic Abbreviation

| Key | Action |
|-----|--------|
| `M-/` | Dabbrev expand |
| `C-M-/` | Dabbrev completion |
| `M-x hippie-expand` | Multi-method expand |

### Repeat

| Key | Action |
|-----|--------|
| `C-x z` | Repeat last command |
| `z` | Keep repeating |

### Indirect Buffers

| Key | Action |
|-----|--------|
| `M-x clone-indirect-buffer` | Clone buffer |
| `C-x 4 c` | Clone in other window |

### Align

| Key | Action |
|-----|--------|
| `M-x align` | Auto-align region |
| `M-x align-regexp` | Align on regexp |
| `M-x align-current` | Align current section |

### Sort and Reverse

| Key | Action |
|-----|--------|
| `M-x sort-lines` | Sort alphabetically |
| `M-x sort-fields` | Sort by Nth field |
| `M-x sort-numeric-fields` | Sort numerically |
| `M-x reverse-region` | Reverse lines |
| `M-x delete-duplicate-lines` | Remove duplicates |

### Calc

| Key | Action |
|-----|--------|
| `C-x * c` | Open calc |
| `C-x * q` | Quick calc (minibuffer) |
| `C-x * e` | Embedded mode |
| `C-x * g` | Grab region to stack |
| `C-x * y` | Yank result to buffer |

### Whitespace

| Key | Action |
|-----|--------|
| `M-\` | Delete surrounding whitespace |
| `M-SPC` | Collapse to single space |
| `C-x C-o` | Delete blank lines |
| `M-^` | Join with previous line |
| `M-x whitespace-mode` | Visualize whitespace |
| `M-x untabify` | Tabs to spaces |

### Tramp (Remote Editing)

| Key | Action |
|-----|--------|
| `C-x C-f /ssh:host:/path` | Open remote file |
| `C-x C-f /sudo::/etc/hosts` | Open as root |
| `C-x d /ssh:host:/dir/` | Remote dired |

### Hideshow (Code Folding)

| Key | Action |
|-----|--------|
| `C-c @ C-h` | Hide block |
| `C-c @ C-s` | Show block |
| `C-c @ C-c` | Toggle block |
| `C-c @ C-M-h` | Hide all |
| `C-c @ C-M-s` | Show all |

### Imenu (Buffer Index)

| Key | Action |
|-----|--------|
| `M-x imenu` | Jump to definition |
| `M-g i` | Imenu (alternate) |

### Recursive Editing

| Key | Action |
|-----|--------|
| `C-r` (in query-replace) | Enter recursive edit |
| `C-M-c` | Exit recursive edit |
| `C-]` | Abort recursive edit |

### Macro Query

| Key | Action |
|-----|--------|
| `C-x q` (recording) | Insert query point |
| `SPC` / `y` (playback) | Continue |
| `DEL` / `n` (playback) | Skip iteration |
| `RET` / `q` (playback) | Stop |
| `C-r` (playback) | Recursive edit |

### Miscellaneous

| Key | Action |
|-----|--------|
| `C-x C-e` | Eval last sexp |
| `M-:` | Eval expression |
| `C-x =` | Char info at point |
| `C-x 8 RET` | Insert Unicode by name |
| `M-x revert-buffer` | Reload from disk |
| `C-x C-+` / `C-x C--` | Zoom in / out |
| `M-x ffap` | Find file at point |

### EWW (Emacs Web Wowser)

Built-in web browser. Open with `M-x eww`.

| Key | Action |
|-----|--------|
| `G` | Prompt for new URL |
| `g` | Reload current page |
| `l` | Go back in history |
| `r` | Go forward in history |
| `TAB` | Next link |
| `S-TAB` | Previous link |
| `RET` | Follow link at point |
| `v` | View page source |
| `SPC` | Scroll down |
| `DEL` / `S-SPC` | Scroll up |
| `n` / `p` | Scroll by line |
| `b` | Add bookmark |
| `B` | List bookmarks |
| `H` | List browsing history |
| `w` | Copy current URL to kill ring |
| `d` | Download URL |
| `R` | Toggle readable mode (strips clutter) |
| `F` | Toggle fonts (use document fonts or not) |
| `M-C` | Toggle colors |
| `D` | Toggle display of images |
| `q` | Quit eww buffer |
| `S` | List all open eww buffers |
| `+` / `-` | Increase / decrease text size |
| `C-c C-c` | Submit form at point |
| `&` | Open current URL in external browser |
| `C-u M-x eww` | Open URL in new eww buffer |

`R` (readable mode) is the killer feature — it strips navigation, ads, and sidebars, leaving just the article content. Works surprisingly well on most sites.

### Elfeed (RSS Reader)

Open with `M-x elfeed`. Update feeds with `M-x elfeed-update`.

In the search buffer (feed list):

| Key | Action |
|-----|--------|
| `g` / `G` | Refresh feed / refresh all feeds |
| `RET` | Open entry |
| `b` | Open entry in browser |
| `s` | Update search filter |
| `S` | Set new search filter |
| `r` | Mark as read |
| `u` | Mark as unread |
| `+` | Add tag |
| `-` | Remove tag |
| `n` / `p` | Next / previous entry |
| `y` | Yank (copy) entry URL |
| `*` | Star/unstar entry (toggle `starred` tag) |
| `q` | Quit elfeed |

In the entry buffer (reading an article):

| Key | Action |
|-----|--------|
| `n` / `p` | Next / previous entry |
| `b` | Open in browser |
| `g` | Refresh entry |
| `SPC` / `S-SPC` | Scroll down / up |
| `+` / `-` | Add / remove tag |
| `u` | Toggle unread |
| `y` | Yank entry URL |
| `q` | Back to search buffer |

Filter syntax examples:
- `@6-months-ago +unread` — unread entries from last 6 months
- `+unread +blog` — unread entries tagged "blog"
- `@1-week-ago +unread -junk` — last week, unread, exclude "junk" tag
- `#10 +unread` — first 10 unread entries
- `=Title regex` — entries matching title regex

Tags are prefixed with `+` (include) or `-` (exclude). Time filters use `@`. Count limits use `#`. Title search uses `=`.

## Patterns Worth Internalizing

- `C-x` prefix = global operations (files, buffers, windows, registers)
- `C-c` prefix = mode-specific and user bindings
- `C-h` prefix = help
- `M-x` = run any command by name (the escape hatch for everything)
- `C-` moves by character, `M-` moves by word, `C-M-` moves by structure
- Kill (`C-k`, `C-w`, `M-d`) saves to the kill ring. Delete (`C-d`, `DEL`) doesn't.
- Prefix any command with `C-u` for a numeric argument: `C-u 10 C-n` moves down 10 lines
- `C-g` cancels anything — the universal "get me out of here"

The real productivity comes not from memorizing every binding, but from knowing the patterns well enough to guess what a binding might be — and using `C-h` to confirm.
