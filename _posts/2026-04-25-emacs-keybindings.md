---
title: "Emacs Keybindings: A Comprehensive Reference from Basics to Advanced"
date: 2026-04-25 10:00:00 -0700
categories: [Editors]
tags: [emacs, keybindings, productivity, magit, eglot, org-mode]
---

This is the keybinding reference I wish I had when I started using Emacs seriously. It covers the built-in defaults, the package bindings I actually use daily, and the muscle memory that makes Emacs feel fast once it clicks.

Notation: `C-` = Ctrl, `M-` = Alt/Option, `S-` = Shift, `SPC` = Space, `RET` = Enter, `DEL` = Backspace.

## Navigation

The basics that replace your arrow keys. Once these are in your fingers, you never leave the home row.

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
| `C-l` | Recenter screen (cycles top/center/bottom) |
| `M-g g` | Go to line number |
| `M-g c` | Go to char position |

### Structural Navigation

These move by language-level constructs — parenthesized expressions, function definitions, balanced delimiters. They work across every language mode.

| Key | Action |
|-----|--------|
| `C-M-f` | Forward sexp (balanced expression) |
| `C-M-b` | Backward sexp |
| `C-M-a` | Beginning of defun |
| `C-M-e` | End of defun |
| `C-M-u` | Up sexp (out of enclosing parens) |
| `C-M-d` | Down sexp (into nested parens) |
| `C-M-n` | Next sexp (same nesting level) |
| `C-M-p` | Previous sexp (same nesting level) |

The `C-M-` prefix is the "structural" prefix. If you remember nothing else, remember that `C-` moves by character, `M-` moves by word, and `C-M-` moves by structure.

## Editing

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
| `M-q` | Fill paragraph (rewrap to fill-column) |
| `C-M-k` | Kill sexp |
| `C-o` | Open line (insert newline below) |
| `C-j` | Newline and indent |

The kill ring is Emacs's clipboard history. `C-y` pastes the most recent kill, then `M-y` cycles through older kills. It's a stack you never knew you needed until you have it.

## Mark and Region

| Key | Action |
|-----|--------|
| `C-SPC` | Set mark (start selection) |
| `C-x h` | Select all |
| `M-h` | Mark paragraph |
| `C-M-h` | Mark function |
| `C-M-SPC` | Mark sexp |
| `C-x C-x` | Exchange point and mark (flip selection direction) |

`C-SPC` then move — that's how you select. No shift-arrow gymnastics. `C-x C-x` is underrated — it lets you adjust the other end of your selection without losing it.

## Search and Replace

| Key | Action |
|-----|--------|
| `C-s` | Isearch forward |
| `C-r` | Isearch backward |
| `C-M-s` | Isearch forward (regexp) |
| `C-M-r` | Isearch backward (regexp) |
| `M-%` | Query replace |
| `C-M-%` | Query replace (regexp) |
| `M-s o` | Occur (list all matches in buffer) |
| `M-s h r` | Highlight regexp |
| `M-s h u` | Unhighlight regexp |

During isearch, `C-s` again jumps to the next match. `C-r` reverses direction. `M-s o` from inside isearch sends your search term to occur — a great way to get an overview of all matches.

## Files and Buffers

| Key | Action |
|-----|--------|
| `C-x C-f` | Find file |
| `C-x C-s` | Save file |
| `C-x C-w` | Save as |
| `C-x s` | Save all modified buffers |
| `C-x b` | Switch buffer (with vertico completion) |
| `C-x C-b` | List buffers (ibuffer) |
| `C-x k` | Kill buffer |
| `C-x C-r` | Find file read-only |
| `C-x C-v` | Find alternate file (replace current buffer) |

## Windows

Emacs windows are splits within a frame. The `C-x` prefix owns window management.

| Key | Action |
|-----|--------|
| `C-x 0` | Delete current window |
| `C-x 1` | Delete other windows (maximize current) |
| `C-x 2` | Split horizontally (top/bottom) |
| `C-x 3` | Split vertically (left/right) |
| `C-x o` | Switch to other window |
| `C-x ^` | Enlarge window vertically |
| `C-x }` | Enlarge window horizontally |
| `C-x {` | Shrink window horizontally |

### Windmove

Directional window switching with shift-arrow. Wraps around at edges.

| Key | Action |
|-----|--------|
| `S-<left>` | Move to left window |
| `S-<right>` | Move to right window |
| `S-<up>` | Move to upper window |
| `S-<down>` | Move to lower window |

## Registers and Bookmarks

Registers are single-character slots that store positions, text, or window configurations. Bookmarks are named and persist across sessions.

| Key | Action |
|-----|--------|
| `C-x r SPC` | Save point to register |
| `C-x r j` | Jump to register |
| `C-x r s` | Copy region to register |
| `C-x r i` | Insert register contents |
| `C-x r m` | Set bookmark |
| `C-x r b` | Jump to bookmark |
| `C-x r l` | List bookmarks |

Registers are ephemeral (gone when Emacs exits). Bookmarks survive. Use registers for within-session jumping, bookmarks for places you return to across days.

## Help

Emacs is self-documenting. The help system is one of its genuine superpowers.

| Key | Action |
|-----|--------|
| `C-h k` | Describe key (what does this key do?) |
| `C-h f` | Describe function |
| `C-h v` | Describe variable |
| `C-h m` | Describe current modes and their bindings |
| `C-h b` | List all active keybindings |
| `C-h a` | Apropos (search commands by keyword) |
| `C-h i` | Info manual |
| `C-h t` | Tutorial |

`C-h k` then press any key — it tells you exactly what that key does. `C-h m` shows every binding active in your current buffer. These two alone will teach you more than any cheat sheet.

---

## Package Keybindings

Everything below comes from packages. These are the bindings that turn Emacs from a text editor into a development environment.

### Magit (Git)

`C-x g` opens magit-status — the best Git interface ever built.

| Key | Action |
|-----|--------|
| `C-x g` | Open magit-status |

Inside magit-status, everything is single-key:

| Key | Action |
|-----|--------|
| `s` | Stage file/hunk |
| `u` | Unstage file/hunk |
| `c c` | Commit |
| `C-c C-c` | Confirm commit message |
| `C-c C-k` | Cancel commit |
| `P p` | Push |
| `F p` | Pull |
| `b b` | Switch branch |
| `b c` | Create branch |
| `l l` | Log (current branch) |
| `l a` | Log (all branches) |
| `d d` | Diff |
| `D` | Diff popup |
| `f` | Fetch |
| `r` | Rebase popup |
| `m` | Merge popup |
| `t` | Tag popup |
| `z` | Stash popup |
| `g` | Refresh |
| `q` | Quit |
| `TAB` | Toggle section visibility |
| `$` | Show process output |

Magit's staging is hunk-level by default. Move point to a specific hunk within a diff and press `s` — only that hunk gets staged. This alone replaces `git add -p` and does it better.

### FZF (Fuzzy Finder)

All under the `C-c f` prefix:

| Key | Action |
|-----|--------|
| `C-c f f` | Find git files |
| `C-c f g` | FZF in git repo |
| `C-c f d` | FZF in directory |
| `C-c f s` | Git grep (search content) |
| `C-c f p` | FZF in project |

### Ripgrep (rg)

Project-wide text search. Fast enough to use interactively.

| Key | Action |
|-----|--------|
| `M-x rg` | Ripgrep search |
| `M-x rg-project` | Search in project |
| `M-x rg-dwim` | Search for thing at point |
| `C-c s` | Ripgrep menu (after first rg use) |

Inside the rg results buffer:

| Key | Action |
|-----|--------|
| `n` | Next match |
| `p` | Previous match |
| `RET` | Visit match |
| `e` | Edit results (wgrep mode) |
| `g` | Rerun search |
| `q` | Quit |

The `e` key is the killer feature — it drops you into wgrep mode where you can edit the search results directly, then save to apply changes across all matched files. Project-wide find-and-replace in seconds.

### Multiple Cursors

| Key | Action |
|-----|--------|
| `C->` | Mark next occurrence like this |
| `C-<` | Mark previous occurrence like this |
| `C-c C-<` | Mark all occurrences like this |

While active, type normally — all cursors edit simultaneously. `C-g` exits.

### Corfu (Completion Popup)

In-buffer completion that appears automatically.

| Key | Action |
|-----|--------|
| (auto) | Popup appears after 2 chars, 0.2s delay |
| `TAB` | Select/expand completion |
| `M-n` | Next candidate |
| `M-p` | Previous candidate |
| `RET` | Accept completion |
| `C-g` | Quit completion |

### Vertico (Minibuffer Completion)

Vertical completion for all minibuffer prompts — file finding, buffer switching, M-x, everything.

| Key | Action |
|-----|--------|
| `C-n` / `↓` | Next candidate |
| `C-p` / `↑` | Previous candidate |
| `RET` | Accept candidate |
| `TAB` | Insert candidate (partial completion) |
| `C-g` | Quit |

Uses orderless matching — type space-separated words in any order. "buf swi" matches "switch-to-buffer". Marginalia shows annotations (file size, docstrings, etc.) alongside candidates.

### Eglot (LSP)

Language server integration. Auto-enabled for Python and Rust via mode hooks.

| Key | Action |
|-----|--------|
| `M-.` | Go to definition |
| `M-,` | Go back (xref pop) |
| `M-?` | Find references |
| `C-c C-r` | Rename symbol |
| `C-c C-a` | Code actions |
| `M-x eglot-format` | Format buffer |
| `M-x eglot-format-buffer` | Format entire buffer |
| `C-h .` | Show documentation at point (eldoc) |
| `M-x eglot-code-action-organize-imports` | Organize imports |

`M-.` and `M-,` are the bread and butter — jump to definition, then pop back. They work across files, across packages, into library source code. `M-?` finds every reference to the symbol at point.

### Smartparens

Auto-pairs `()`, `[]`, `{}`, `""`, `''` globally. The structural navigation keys from the Navigation section above (`C-M-f`, `C-M-b`, etc.) are enhanced by smartparens to work correctly with all delimiter types.

| Key | Action |
|-----|--------|
| `C-M-f` | Forward sexp |
| `C-M-b` | Backward sexp |
| `C-M-k` | Kill sexp |
| `C-M-SPC` | Mark sexp |
| `C-M-u` | Up sexp (out of parens) |
| `C-M-d` | Down sexp (into parens) |
| `C-M-n` | Next sexp (same level) |
| `C-M-p` | Previous sexp (same level) |

### Which-Key

Not a keybinding itself — it shows you available keybindings. After pressing any prefix key (like `C-x` or `C-c`), wait 0.5 seconds and a popup appears showing all continuations. Press `C-h` during any prefix to trigger it immediately.

This is how you discover bindings you forgot or never knew existed.

### Go Mode

| Key | Action |
|-----|--------|
| `C-c C-r` | Remove unused imports |
| `C-c C-g` | Go to imports |
| `C-c C-f` | Run gofmt |

Auto-formats on save via `gofmt-before-save` hook.

### Org Mode

Org is Emacs's outliner, planner, and literate programming environment. It has more keybindings than most standalone applications.

| Key | Action |
|-----|--------|
| `TAB` | Cycle visibility (fold/unfold heading) |
| `S-TAB` | Cycle global visibility (all headings) |
| `M-RET` | New heading at same level |
| `M-S-RET` | New TODO heading |
| `C-c C-t` | Toggle TODO state |
| `C-c C-s` | Schedule |
| `C-c C-d` | Deadline |
| `C-c C-c` | Toggle checkbox / execute block |
| `C-c '` | Edit source block in native mode |
| `C-c C-e` | Export dispatcher (HTML, PDF, etc.) |
| `C-c C-l` | Insert/edit link |
| `C-c C-o` | Open link at point |
| `C-c a` | Agenda |
| `C-c c` | Capture (quick note/task entry) |
| `M-<up>` | Move subtree up |
| `M-<down>` | Move subtree down |
| `M-<left>` | Promote heading (decrease level) |
| `M-<right>` | Demote heading (increase level) |

`C-c '` is worth highlighting — inside a source block, it opens a dedicated buffer in the language's major mode with full syntax highlighting, completion, and LSP support. Edit there, `C-c '` again to return.

### Ediff (Diff/Merge)

Side-by-side diff and merge tool. All keys work in the ediff control panel — use `C-x o` to focus it if needed.

| Key | Action |
|-----|--------|
| `n` | Next difference |
| `p` | Previous difference |
| `j` | Jump to specific difference |
| `a` | Copy A → B (diff) / Choose A (merge) |
| `b` | Copy B → A (diff) / Choose B (merge) |
| `r a` | Restore region in buffer A |
| `r b` | Restore region in buffer B |
| `\|` | Toggle vertical/horizontal split |
| `v` | Scroll down both buffers |
| `V` | Scroll up both buffers |
| `w a` | Save buffer A |
| `w b` | Save buffer B |
| `!` | Recompute differences |
| `q` | Quit (saves merge result) |
| `?` | Show all keybindings |

---

## Patterns Worth Internalizing

A few meta-patterns that make the keybinding system predictable:

- `C-x` prefix = global operations (files, buffers, windows, registers)
- `C-c` prefix = mode-specific and user bindings
- `C-h` prefix = help
- `M-x` = run any command by name (the escape hatch for everything)
- `C-` moves by character, `M-` moves by word, `C-M-` moves by structure
- Kill (`C-k`, `C-w`, `M-d`) saves to the kill ring. Delete (`C-d`, `DEL`) doesn't.
- Prefix any command with `C-u` for a numeric argument: `C-u 10 C-n` moves down 10 lines
- `C-g` cancels anything — the universal "get me out of here"

The real productivity comes not from memorizing every binding, but from knowing the patterns well enough to guess what a binding might be — and using `C-h` to confirm.
