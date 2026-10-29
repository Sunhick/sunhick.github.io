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

## How the Layers Work

| Hold (thumb)        | Layer  | Keys appear on |
| ------------------- | ------ | -------------- |
| Esc (left outer)    | Media  | right hand     |
| Space (left middle) | Nav    | right hand     |
| Tab (left inner)    | Mouse  | right hand     |
| Enter (right inner) | Sym    | left hand      |
| Bksp (right middle) | Num    | left hand      |
| Del (right outer)   | Fun    | left hand      |
| Z or `/` (pinky)    | Button | both hands     |

The rule: one thumb holds the layer, and the **other** hand types. The hand holding the layer keeps its home-row mods, so you can combine them.

## Tips and Tricks

### Home-Row Mods (200 ms, tap-preferred)

- A/' = Cmd, S/L = Opt, D/K = Ctrl, F/J = Shift.
- Type normally and roll quickly. Hold a key on purpose when you want the mod.
- For shortcuts, use the mod on the opposite hand: Cmd+C = hold `'` and tap C.
- If letters come out as mods while you type fast, it's the timing. The tapping term can be raised in `custom_config.h`.

### Editing Combos

- Select text: hold Space (Nav) + hold F (Shift) + arrow keys (J K L ; row = ← ↓ ↑ →).
- Select a word on macOS: Space + hold S (Opt) + F (Shift) + arrows.
- Home/End/PgUp/PgDn sit under the arrows on the Nav layer.

### Caps Word

- Hold Space and tap H. The next word is typed in capitals, and it turns off at the first space or punctuation. Good for `CONSTANT_NAMES`.
- Shift + that key = real Caps Lock.

### Numbers and Symbols

- Hold Bksp: the left hand becomes a numpad (7 8 9 / 4 5 6 / 1 2 3). The left thumbs give `.` `0` `-`.
- Hold Enter: same positions, shifted symbols (`& * ( $ % ^ ! @ #`). The left thumbs give `( ) _`.

### Layer Lock (No Holding)

- Double-tap the blue key with the layer's name to stay on that layer. For example, on Nav, double-tap the Nav key (V position).
- To get back, double-tap **Base** (R position on left-hand layers, U on right-hand layers).
- Double-tap **Tap** to switch to a layer with no hold-taps. That's useful for games. Double-tap Base to return.

### Bluetooth (Hold Esc → Media Layer)

- Right bottom row: `M` = BT0, `,` = BT1, `.` = BT2, `/` = BT3. `N` = toggle USB ↔ BLE.
- Clear a profile: hold F (Shift) and tap that BT key. Then remove the keyboard on the host and pair again.
- **Battery of both halves**: by default, ZMK and macOS only show the left (central) half's battery. To see the right half too, enable the two options below in the left half's config, then use [ZMK Battery Center](https://github.com/kot149/zmk-battery-center) to view them. macOS Settings shows only one value even with the options enabled.

```conf
# config/totem_left.conf
CONFIG_ZMK_SPLIT_BLE_CENTRAL_BATTERY_LEVEL_FETCHING=y
CONFIG_ZMK_SPLIT_BLE_CENTRAL_BATTERY_LEVEL_PROXY=y
```

`FETCHING` makes the left half poll the right half for its level, and `PROXY` exposes it to the host as an extra Battery characteristic. The symbols only exist when the half is built as the split central, so they go in the left-only conf. More detail in the [build post]({% post_url 2026-10-28-totem-bluetooth-split-keyboard-build %}#seeing-both-batteries-zmk-battery-center).

### Flash Without the Reset Button

- Left half: hold Space + tap **Q**. Right half: hold Bksp + tap **P**.
- The half you press it on mounts as a UF2 drive. Drag the matching `.uf2` onto it.
- ⚠ It's a single press, including on the outer pinky key. If a half stops typing, it's probably in bootloader mode. Press reset or power-cycle it.

### Clipboard: Know Your OS

- The Nav, Mouse and Button clipboard keys send Ctrl+Ins / Shift+Ins / Shift+Del / Undo / Again.
- These work on **Windows/Linux**. macOS ignores them, so on Mac use the home-row Cmd instead (hold `'` + C/V/X/Z).
- Button layer (hold Z or `/`): clipboard keys on both hands, plus mouse clicks on the thumbs.

### Mouse (Hold Tab)

- Right home row moves the pointer, the bottom row scrolls, and the right thumbs click (R / L / M).

### Keys That Do Nothing on the TOTEM

- Media layer: RGB Tog/Mode/Hue/Sat/Bri and Ext Pwr. The TOTEM has no LEDs and no switched power.

## Regenerating the Diagram

The SVG is drawn with [keymap-drawer](https://github.com/caksoylar/keymap-drawer) from a YAML description of the layers and a physical layout JSON:

```bash
keymap draw -j docs/cheatsheet/totem-layout.json -l LAYOUT \
  docs/cheatsheet/totem-keymap.yaml -o docs/cheatsheet/totem-keymap.svg
```

Keeping the YAML next to the firmware config means a keymap change and its cheatsheet update land together.
