---
title: "Building a Wireless TOTEM Split Keyboard: Lessons Learned"
date: 2026-10-28 10:00:00 -0700
categories: [Keyboards]
tags: [totem, split-keyboard, bluetooth, zmk, miryoku, xiao-ble, soldering, multimeter]
---

![Finished TOTEM split keyboard in a black resin case](/assets/img/totem-split-keyboard.jpg)
_The finished TOTEM: both halves in black resin cases printed by JLC3DP._

After the [Chocofi build]({% post_url 2026-07-25-chocofi-split-keyboard-build %}), I wanted to cut the cable. The **TOTEM** is a 38-key split keyboard designed around the Seeed XIAO BLE (nRF52840), so each half runs on its own battery and the halves talk to each other, and to the host, over Bluetooth. It runs ZMK instead of QMK, and I kept the same Miryoku layout so my muscle memory carried over. The full keymap is in the [TOTEM Miryoku cheatsheet]({% post_url 2026-10-28-totem-miryoku-cheatsheet %}).

A wireless build adds a few parts to get wrong: a battery, a power switch, and a reset button on each half. Here's what I learned.

## Sourcing Parts: Order Early

I ordered parts from four places:

- **PCBs** from JLCPCB.
- **Case** from JLC's 3D printing service, in black resin.
- **Microcontrollers** (XIAO BLE) from Seeed's official store, so I knew I was getting genuine boards.
- **Everything else** from AliExpress: diodes, switches, hotswap sockets, batteries, power switches, reset buttons, and standoffs.

AliExpress is cheap, but shipping is slow, and the waiting is a real buzz kill. You're ready to build, and one small part is still somewhere in transit. So do your research up front: confirm every part against the build guide (footprint, size, and quantity), then order everything early and all at once. Ordering early also means the slow parts arrive while you're still waiting on the PCBs and the case.

## Flash and Test the Controller Before Soldering

Before soldering a XIAO to the PCB, plug it into USB, flash the ZMK firmware, and check that it shows up and works. Once it's soldered on, a dead or faulty board is a painful desoldering job. Testing it first takes a couple of minutes and rules out the controller before you've committed to it.

## Use a Generous Amount of Flux

On the Chocofi my flux pen ran dry halfway through. This time I used flux freely on every joint, and it made a real difference. Solder flows onto the pad and pin, wets properly, and leaves a clean, shiny joint instead of a dull blob. It matters most on the small pads: diodes, the XIAO's castellated edges, and the battery leads.

Too little flux is how you end up with cold joints that look fine and then fail intermittently. Excess flux cleans off with isopropyl alcohol, so err on the side of more.

## Heat the Pad, Not the Solder

Flux helps, but technique matters too. Hold the iron so it touches both the pad and the component lead, wait a second or two for them to heat up, and then feed solder into the joint, not onto the iron tip. The solder should flow into the joint on its own.

If you melt solder on the iron and dab it onto a cold pad, it sits on top without bonding. That's a cold solder joint: dull, lumpy, and unreliable. A good joint is shiny and smooth, like a small cone or fillet around the pin. If a joint looks wrong, add a little flux and reheat it.

## Buy Spare Parts

Order extras of the small parts. With AliExpress lead times, a missing spare can stall the build for weeks:

- **Diodes**: they're tiny, easy to drop, easy to launch off the tweezers, and easy to overheat.
- **Switches**: a bent pin or a scratchy switch is easier to swap than to fix.
- **Hotswap sockets**: these are the ones that hurt. A socket with a lifted or bridged joint means a dead key, and you can't swap in a spare you don't have.

Spares cost very little. Waiting a week for a reorder to replace one part costs a lot more.

## Get the Right M2 Standoffs

The case is held together with M2 standoffs, and the length matters more than I expected. If they're too short, the case pinches the PCB and stresses the switches. If they're too long, the case rattles and the halves feel hollow. Check the case design for the standoff height it expects and buy that size, so the PCB sits snugly with no gaps or flex.

## Test Everything With a Multimeter Before Powering On

This is the most important lesson. Before you connect a battery or USB, use a multimeter in continuity mode to check:

- **Battery connections**: the battery leads go to the correct pads, the polarity is right, and positive is not shorted to ground. Reversed or shorted LiPo leads can destroy the controller or worse.
- **Power switch**: the switch actually connects and disconnects the battery path.
- **Reset button**: the reset pin connects to ground when the button is pressed.

Do these checks **without power connected**. Continuity mode drives its own small test current, and measuring a live circuit gives misleading readings or can damage the meter.

### Not Every Pin Pair Will Buzz

This confused me at first. When I probed the power switch and the reset switch, the multimeter didn't beep on every combination of pins, and I assumed I'd botched the joints. That's actually how they're supposed to behave:

- A **slide power switch** only connects certain pins, and only in one position. Pins that aren't meant to connect, or the "off" position, stay silent.
- A **reset button** is momentary. Its contacts only connect while you're pressing it, so it only buzzes with the button held down.

So check the switches against their pinouts. Find out which pins should connect in which state, and test those. Silence on a pair that's supposed to be open is correct. Silence on a pair that's supposed to be closed is a real problem.

## Don't Blindly Follow AI or LLMs

I used an LLM to help along the way, and it was useful for explaining concepts and for ZMK config syntax. It was also confidently wrong at times, the kind of plausible-sounding answer that's dangerous when a battery is involved. Pinouts, battery polarity, and wiring are not the place to trust a generated answer.

Use the AI to understand things, then verify against the actual sources: the TOTEM build guide, the XIAO BLE pinout and datasheet, and the ZMK documentation. Then confirm on the board itself with the multimeter. The Chocofi taught me to read the datasheet before touching the MCU. The TOTEM taught me the same rule applies to AI answers.

## Firmware: ZMK With Miryoku

Since the XIAO BLE is an nRF52840, the firmware is ZMK, built from the [Miryoku ZMK](https://github.com/manna-harbour/miryoku_zmk) repo with the QWERTY alphas option. Each half gets its own `.uf2`. Double-tap reset, the half mounts as a USB drive, and you drag the file onto it. Once Miryoku is flashed, there's also a bootloader key on the Nav and Num layers, so you don't need to reach for the reset button for later updates.

## Seeing Both Batteries: ZMK Battery Center

With two batteries, you want to know when either half is running low. Out of the box, you only see one. The left half is the split central, the one talking to the host, and by default ZMK reports only the central's battery. macOS shows that single value, so the right half can quietly run flat with no warning.

Getting the right half's level takes two steps.

**1. Have the firmware report it.** Add two options to the left (central) half's config:

```conf
# config/totem_left.conf
CONFIG_ZMK_SPLIT_BLE_CENTRAL_BATTERY_LEVEL_FETCHING=y
CONFIG_ZMK_SPLIT_BLE_CENTRAL_BATTERY_LEVEL_PROXY=y
```

`FETCHING` makes the left half poll the right half for its battery level, and `PROXY` exposes it to the host as a second Battery characteristic. The [ZMK battery docs](https://zmk.dev/docs/config/battery) say you need both. These options only exist on the central side, so they go in the left half's conf, not a shared one.

**2. Use a host app that can read it.** Even with the firmware reporting both levels, macOS Settings and the Bluetooth menu still show only one battery. They don't display the extra characteristic. This is where [ZMK Battery Center](https://github.com/kot149/zmk-battery-center) comes in. It's a small system tray app that reads every battery level the keyboard reports and shows the left and right halves separately. It can also notify you when a battery gets low.

You need both steps. Without the config, there's no peripheral battery level for the app to read. Without the app, macOS has the level and doesn't show it.

## Was It Worth It

Yes. No cable between the halves means I can put them wherever my shoulders want, and the layout is identical to the Chocofi, so switching boards costs nothing.

If you're building one, my short list:

- Research every part, then order early. AliExpress shipping is slow.
- Buy the microcontroller from the official store.
- Flash and test the controller before soldering it.
- Use plenty of flux, and heat the pad before adding solder to avoid cold joints.
- Buy spare diodes, switches, and hotswap sockets.
- Buy the M2 standoffs your case is designed for.
- Test the battery, power switch, and reset button with a multimeter before any power goes in, and know which pins should buzz.
- Check AI answers against the datasheet and the board itself.
- Enable peripheral battery reporting and install ZMK Battery Center, or you'll only ever see the left half's battery.
