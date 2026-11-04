---
title: "TOTEM Miryoku (QWERTY) Cheatsheet"
date: 2026-10-28 11:00:00 -0700
categories: [Keyboards]
tags: [totem, miryoku, zmk, keymap, split-keyboard, bluetooth, cheatsheet]
---

This is my Miryoku cheatsheet for the TOTEM, a 38-key wireless split keyboard running ZMK. It's built from the compiled firmware keymap, so it matches what's actually on the board rather than what Miryoku documents in general.

<object type="image/svg+xml" data="/assets/img/totem-keymap.svg" style="width: 100%; max-width: 872px;">
  TOTEM Miryoku keymap layout
</object>

**Legend**

- Small text under a key = what it does when **held**.
- Grey dashed keys = duplicates (outer pinkies) or keys that do nothing on the TOTEM.
- Red = bootloader. Blue = layer switch (double-tap). Pink = the thumb you're holding.

Keys below are named by their position on the QWERTY Base layer. "Hold X + tap Y" means keep X held down while you tap Y. "Double-tap" means two taps within 200 ms.

> **Stuck? Press reset once on the left half.** It boots back to Base and keeps your pairings and Bluetooth slots.
{: .prompt-tip }

## How the Layers Work

Hold a thumb key to turn on its layer, and release it to turn the layer off.

| Hold (thumb)        | Layer                      | Keys appear on |
| ------------------- | -------------------------- | -------------- |
| Esc (left outer)    | Media (Bluetooth, volume)  | right hand     |
| Space (left middle) | Nav (arrows, editing)      | right hand     |
| Tab (left inner)    | Mouse                      | right hand     |
| Enter (right inner) | Sym                        | left hand      |
| Bksp (right middle) | Num                        | left hand      |
| Del (right outer)   | Fun (F-keys)               | left hand      |
| Z or `/` (pinky)    | Button (clipboard, clicks) | both hands     |

The rule: one thumb holds the layer, and the **other** hand types. The hand holding the layer keeps its home-row mods, so you can combine them.

## Turning Things On and Off

### Layer Lock (Stay on a Layer Without Holding)

Hold the layer's thumb key, double-tap the lock key, then let go.

| Lock  | Activate                      | Deactivate       |
| ----- | ----------------------------- | ---------------- |
| Nav   | hold Space + double-tap **V** | double-tap **R** |
| Mouse | hold Tab + double-tap **V**   | double-tap **R** |
| Media | hold Esc + double-tap **V**   | double-tap **R** |
| Num   | hold Bksp + double-tap **M**  | double-tap **U** |
| Sym   | hold Enter + double-tap **M** | double-tap **U** |
| Fun   | hold Del + double-tap **M**   | double-tap **U** |

You can also lock a layer from the opposite thumb. That keeps one hand free, for example to type numbers with your left hand while your right stays on the mouse.

| Lock                        | Activate                      | Deactivate       |
| --------------------------- | ----------------------------- | ---------------- |
| Num, from the left thumb    | hold Space + double-tap **C** | double-tap **U** |
| Sym, from the left thumb    | hold Tab + double-tap **C**   | double-tap **U** |
| Fun, from the left thumb    | hold Esc + double-tap **C**   | double-tap **U** |
| Nav, from the right thumb   | hold Bksp + double-tap **,**  | double-tap **R** |
| Mouse, from the right thumb | hold Enter + double-tap **,** | double-tap **R** |
| Media, from the right thumb | hold Del + double-tap **,**   | double-tap **R** |

While a layer is locked, the other hand's home row works as plain modifiers with no tap timing. With Nav locked, hold F (Shift) and press the arrows to select text.

### Which Layer Am I Stuck On?

Tap the **R** position once and see what it types:

| R types                 | You're on           | Get out                      |
| ----------------------- | ------------------- | ---------------------------- |
| r, and holds work       | Base (or Extra)     | nothing to do                |
| 9                       | Num                 | double-tap U                 |
| (                       | Sym                 | double-tap U                 |
| F9                      | Fun                 | double-tap U                 |
| nothing                 | Nav, Mouse or Media | double-tap R                 |
| p, and holds don't work | Tap                 | press reset on the left half |

On Nav, Mouse and Media, R is the Base lock key. A single tap does nothing, which is why it types nothing.

### Tap and Extra Layers

| Mode                                                  | Activate                                                       | Deactivate                                                    |
| ----------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------- |
| **Tap** (plain letters, no hold-taps, good for games) | hold Space + double-tap **W**, or hold Bksp + double-tap **O** | ⚠ no key: press **reset on the left half**, or power-cycle it |
| **Extra** (a second alphas layout)                    | hold Space + double-tap **E**, or hold Bksp + double-tap **I** | hold Space + double-tap **R**                                 |

The Tap layer has no layer keys, so nothing on it switches back. Its letters are also **Colemak-DH**, not QWERTY, unless you add `#define MIRYOKU_TAP_QWERTY` to `custom_config.h`. In my build the Extra layer is QWERTY, the same as Base. Add `#define MIRYOKU_EXTRA_COLEMAKDH` to make it a Colemak-DH layout you can switch to with all the layer keys still working.

### Typing Helpers

| Feature                              | Activate                            | Deactivate                                                  |
| ------------------------------------ | ----------------------------------- | ----------------------------------------------------------- |
| Home-row mod (see below)             | hold the key past 200 ms            | release                                                     |
| Right Option / AltGr                 | hold **X** or **.**                 | release                                                     |
| **Caps Word** (one word in capitals) | hold Space + tap **H**              | the first space or punctuation, or hold Space + tap H again |
| **Caps Lock**                        | hold Space + hold **F** + tap **H** | do the same again                                           |

Caps Word keeps going through letters, numbers, `_`, Bksp and Del, so `MY_CONST_2` works in one go.

### Bluetooth

All of these are on the Media layer: hold **Esc** with your left thumb.

| Action                         | How                                                                                         |
| ------------------------------ | ------------------------------------------------------------------------------------------- |
| Switch to slot 0 / 1 / 2 / 3   | hold Esc + tap **M** / **,** / **.** / **/**                                                |
| Clear a slot (unpair)          | hold Esc + hold **F** + tap that slot's key, then choose **Forget This Device** on the host |
| Pair a new host                | switch to an empty or cleared slot, then pair "TOTEM" from the host                         |
| Toggle output, USB ↔ Bluetooth | hold Esc + tap **N**                                                                        |
| Force output to USB            | hold Esc + hold **F** + tap **N**                                                           |

I use slot 0 for my main Mac, 1 for a second computer, 2 for a tablet or phone, and keep 3 spare.

**Battery of both halves**: by default, ZMK and macOS only show the left (central) half's battery. To see the right half too, enable the two options below in the left half's config, then use [ZMK Battery Center](https://github.com/kot149/zmk-battery-center) to view them. macOS Settings shows only one value even with the options enabled.

```conf
# config/totem_left.conf
CONFIG_ZMK_SPLIT_BLE_CENTRAL_BATTERY_LEVEL_FETCHING=y
CONFIG_ZMK_SPLIT_BLE_CENTRAL_BATTERY_LEVEL_PROXY=y
```

`FETCHING` makes the left half poll the right half for its level, and `PROXY` exposes it to the host as an extra Battery characteristic. The symbols only exist when the half is built as the split central, so they go in the left-only conf. More detail in the [build post]({% post_url 2026-10-28-totem-bluetooth-split-keyboard-build %}#seeing-both-batteries-zmk-battery-center).

### Media and Mouse

| Feature               | How                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| Volume, tracks, play  | hold Esc: J previous, K volume down, L volume up, `'` next. Right thumbs: stop, play/pause, mute |
| Move and scroll       | hold Tab: J K L `'` move the pointer, M , . / scroll. Right thumbs click: right, left, middle    |
| Mouse without holding | hold Tab + double-tap **V**, and double-tap **R** to leave                                       |

### Flashing and Resets

| Action                     | Activate                                                              | Deactivate                                 |
| -------------------------- | --------------------------------------------------------------------- | ------------------------------------------ |
| **Bootloader, left half**  | hold Space + tap **Q** (or the left outer pinky), or double-tap reset | press reset once, or drag a `.uf2` onto it |
| **Bootloader, right half** | hold Bksp + tap **P** (or the right outer pinky), or double-tap reset | the same                                   |
| Restart a half             | press reset once                                                      |                                            |

In bootloader mode, the half mounts as a USB drive. Drag the matching `.uf2` onto it and it reboots into the new firmware.

> The bootloader keys fire on **one** tap, including the outer pinky key. If a half suddenly stops typing and shows up as a USB drive, it's in bootloader mode. Press reset once.
{: .prompt-warning }

**Wiping all pairings** takes ZMK's `settings_reset` firmware, built for the XIAO BLE with the `settings_reset` shield. Do it to **both** halves:

1. Put each half in bootloader mode and drag `settings_reset` onto it.
2. Flash each half with its normal `totem_left` or `totem_right` firmware again.
3. Remove the TOTEM from your computer's Bluetooth settings, then pair it again.

If you wipe only one half, the halves can no longer connect to each other.

## Tips and Tricks

### Home-Row Mods (200 ms, tap-preferred)

- A/' = Cmd, S/L = Opt, D/K = Ctrl, F/J = Shift.
- Type normally and roll quickly. Hold a key on purpose when you want the mod.
- For shortcuts, use the mod on the opposite hand: Cmd+C = hold `'` and tap C.
- If letters come out as mods while you type fast, it's the timing. Miryoku hard-codes the 200 ms tapping term in `miryoku.h`, so a `#define` in `custom_config.h` gets overwritten. Override the hold-tap behaviors at the end of `config/totem.keymap` instead, after the `miryoku.dtsi` include:

```c
&u_mt {                              // home-row mods
    tapping-term-ms = <220>;
    require-prior-idle-ms = <150>;   // fast typing always gives letters
};
```

### Editing Combos

- Select text: hold Space (Nav) + hold F (Shift) + arrow keys (J K L ; row = ← ↓ ↑ →).
- Select a word on macOS: Space + hold S (Opt) + F (Shift) + arrows.
- Home/End/PgUp/PgDn sit under the arrows on the Nav layer.

### Numbers and Symbols

- Hold Bksp: the left hand becomes a numpad (7 8 9 / 4 5 6 / 1 2 3). The left thumbs give `.` `0` `-`.
- Hold Enter: same positions, shifted symbols (`& * ( $ % ^ ! @ #`). The left thumbs give `( ) _`.

### Clipboard: Know Your OS

- The Nav, Mouse and Button clipboard keys send Ctrl+Ins / Shift+Ins / Shift+Del / Undo / Again.
- These work on **Windows/Linux**. macOS ignores them, so on Mac use the home-row Cmd instead (hold `'` + C/V/X/Z).
- Button layer (hold Z or `/`): clipboard keys on both hands, plus mouse clicks on the thumbs.

### Keys That Do Nothing on the TOTEM

- Media layer: RGB Tog/Mode/Hue/Sat/Bri and Ext Pwr. The TOTEM has no LEDs and no switched power.

## Regenerating the Diagram

The SVG is drawn with [keymap-drawer](https://github.com/caksoylar/keymap-drawer) from a YAML description of the layers and a physical layout JSON:

```bash
keymap draw -j docs/cheatsheet/totem-layout.json -l LAYOUT \
  docs/cheatsheet/totem-keymap.yaml -o docs/cheatsheet/totem-keymap.svg
```

Keeping the YAML next to the firmware config means a keymap change and its cheatsheet update land together.
