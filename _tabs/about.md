---
# the default layout is 'page'
icon: fas fa-user
order: 1
---

# Hello, I'm Sunil Murthy

I'm a software engineer with **8+ years of experience** building reliable systems, from low-level C/C++ to large-scale services. I care about **correctness**, **security**, and understanding how things actually work, all the way down.

This blog is where I write about what I'm learning and building. I tend to go deep: the posts are long-form references I'd want to have myself.

## Core Expertise

- **Distributed Systems and Formal Methods**: designing fault-tolerant systems and verifying them with TLA+ and PlusCal before writing code. I've written a [series on TLA+]({% post_url 2026-04-11-tla-plus-and-pluscal %}), from the basics to refinement and TLC performance tuning.
- **Security and Authentication**: authentication systems, OAuth2 and OpenID Connect, and applied cryptography. I use GPG and YubiKeys daily, and I've written about subkeys, offline primary keys, and YubiKey PINs and lockout behavior.
- **Systems Programming**: C/C++ from the kernel up to the browser, and digging into internals like Git's object model and wire protocol.
- **Testing**: property-based testing with Hypothesis and fast-check, to find the bugs example-based tests miss.

## Open Source

Large open-source codebases have taught me more than almost anything else. I've contributed to **Chromium**, and I also work on and study the **Linux kernel** and **Skia**, the 2D graphics library behind Chrome and Android. Reading and changing code at that scale shows how real systems handle performance, portability, and long-term maintenance. It's also why I built a [Linux desktop from source]({% post_url 2026-04-11-linux-kernel-xorg-gnome-from-scratch %}): to see how the kernel, Xorg, and GNOME fit together.

## Building Keyboards

My latest personal projects are keyboards. Good split ergonomic keyboards are expensive to buy, so I build my own. I started with a wired [Chocofi]({% post_url 2026-07-25-chocofi-split-keyboard-build %}) on QMK and moved to a wireless [TOTEM]({% post_url 2026-10-28-totem-bluetooth-split-keyboard-build %}) running ZMK. Both use the Miryoku layout on 36 and 38 keys. That means ordering PCBs and parts, soldering, flashing firmware, and a lot of learning from mistakes like misreading a pinout.

## Beyond Code

I also spend too much time tuning my tools. I live in **Emacs**, sign my commits with a YubiKey, and like a setup where every key does something on purpose.

## How I Approach Software

- **Correctness first**: model the tricky parts formally, and test with properties, not just examples.
- **Security by design**: build it into every layer from the start, not bolted on later.
- **Understand the layer below**: knowing how Git, Linux, or the firmware works makes debugging much faster.
- **Write it down**: if I had to learn it the hard way, it's worth a post.
