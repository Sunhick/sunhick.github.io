---
title: "Miryoku Keymap Reference for the Chocofi"
date: 2026-07-25 11:00:00 -0700
categories: [Keyboards]
tags: [miryoku, keymap, chocofi, split-keyboard, qmk]
---

This is my Miryoku keymap reference for the Chocofi 36-key split keyboard. Miryoku assigns each layer a single purpose — base typing, navigation, numbers, symbols, function keys, and mouse — all activated through the thumb cluster.

<object type="image/svg+xml" data="/assets/img/miryoku_keymap.svg" style="width: 100%; max-width: 788px;">
  Miryoku keymap layout
</object>

## Layers

- **Base** — Colemak-DH with home row mods (hold for Ctrl, Alt, Shift, Super)
- **Nav** — Arrow keys, page up/down, home/end on the right hand
- **Num** — Numpad on the right, symbols on the left
- **Fun** — Function keys, media controls
- **Mouse** — Mouse movement and buttons
- **Sym** — Programming symbols

## Home Row Mods

The home row doubles as modifier keys when held:

| Key Position | Tap | Hold  |
| ------------ | --- | ----- |
| Index        | T/N | GUI   |
| Middle       | S/E | Alt   |
| Ring         | R/I | Ctrl  |
| Pinky        | A/O | Shift |

Timing is everything — I use 200ms tapping term with `PERMISSIVE_HOLD` enabled.
