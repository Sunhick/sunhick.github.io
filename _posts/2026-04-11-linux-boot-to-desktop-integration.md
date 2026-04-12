---
title: "From Power Button to Desktop: How Linux, Xorg, and GNOME Actually Connect"
date: 2026-04-11 14:00:00 -0700
categories: [Linux]
tags: [linux-kernel, xorg, gnome, boot-process, drm, dbus, integration]
---

You know what the kernel does. You know what GNOME does. But how does a framebuffer in kernel memory become pixels managed by Mutter? How does a USB interrupt from your keyboard become a keypress in a GTK text field? How does `init` know to start a display manager, and how does that display manager negotiate with the kernel for GPU access?

This post is about the seams — the exact interfaces, protocols, file descriptors, and IPC mechanisms that stitch the Linux graphics stack together.

## The Boot Handoff: Firmware → Bootloader → Kernel → Init

### UEFI → Bootloader

UEFI firmware reads the ESP (EFI System Partition), finds the bootloader binary at `/EFI/BOOT/BOOTX64.EFI` (or a registered path), and executes it. GRUB or systemd-boot takes over.

The bootloader's job is to:
1. Load the kernel image (`vmlinuz`) into memory
2. Load the initramfs (initial RAM filesystem) into memory
3. Pass the kernel command line (root device, init path, video mode, etc.)
4. Transfer control to the kernel entry point

```
# What the bootloader passes to the kernel
linux /boot/vmlinuz-6.8.9 root=/dev/sda2 ro init=/sbin/init quiet
initrd /boot/initramfs-6.8.9.img
```

### Kernel Early Boot → Root Mount

The kernel decompresses, initializes the CPU, memory manager, and scheduler, then unpacks the initramfs into a tmpfs root. The initramfs is a minimal userspace whose only job is to mount the real root filesystem.

Inside the initramfs:
1. `/init` (a shell script or busybox binary) runs as PID 1
2. It loads necessary kernel modules (filesystem drivers, disk controller drivers, LVM, LUKS)
3. It finds and mounts the real root filesystem
4. It calls `switch_root` — this replaces the initramfs root with the real root and `exec`s the real init

```c
// Simplified kernel code path (init/main.c)
kernel_init()
  → try_to_run_init_process("/sbin/init")    // default
  → try_to_run_init_process("/etc/init")     // fallback
  → try_to_run_init_process("/bin/init")     // fallback
  → try_to_run_init_process("/bin/sh")       // emergency
  → panic("No working init found")
```

The `init=` kernel parameter overrides this search. The kernel `exec`s the init binary, which becomes PID 1. From this point, the kernel never initiates userspace activity again — it only responds to system calls.

### The PID 1 Contract

PID 1 has special responsibilities that no other process has:

- It's the ancestor of all userspace processes
- It must reap orphaned zombie processes (children whose parents died)
- If PID 1 exits, the kernel panics
- It receives signals differently (SIGTERM doesn't kill it by default)
- It's responsible for bringing the system to a defined state (runlevels / targets)

This is why init systems are complex — they're not just "start some services." They're the foundation of process lifecycle management.

## Init → System Services: The Dependency Chain

### What Init Actually Does

When SysVinit enters runlevel 5 (graphical), it reads `/etc/inittab` and executes the `rc` script, which runs every script in `/etc/rc5.d/` in alphabetical order:

```
S01mountvirtfs → S05udev → S10networking → S20dbus → S30polkit → S99gdm
```

Each `S` script is a symlink to a script in `/etc/init.d/`. The number determines order. This is a linear dependency chain — if S20dbus fails, everything after it that needs D-Bus will also fail.

With systemd, dependencies are declared explicitly and services start in parallel:

```ini
# gdm.service
[Unit]
After=dbus.service polkit.service upower.service
Requires=dbus.service
```

But the logical dependency chain is the same regardless of init system.

### Virtual Filesystem Mounts (The Kernel-Userspace Interface)

Before any service can start, init must mount the virtual filesystems. These aren't on disk — they're kernel data structures exposed as files:

```bash
mount -t proc     proc     /proc      # Process info, kernel tunables
mount -t sysfs    sysfs    /sys       # Device/driver model
mount -t devtmpfs devtmpfs /dev       # Device nodes
mount -t devpts   devpts   /dev/pts   # Pseudo-terminal devices
mount -t tmpfs    tmpfs    /dev/shm   # POSIX shared memory
mount -t tmpfs    tmpfs    /run       # Runtime state (PID files, sockets)
```

Why each matters for the graphics stack:

| Mount | What Uses It | Why |
|-------|-------------|-----|
| `/proc` | Everything | Process info, `/proc/self/fd` for file descriptor passing |
| `/sys` | udev, Xorg, Mesa | GPU device attributes at `/sys/class/drm/card0/` |
| `/dev` | Xorg, Mesa, libinput | `/dev/dri/card0` (GPU), `/dev/input/event*` (input devices) |
| `/dev/pts` | Terminal emulators | Pseudo-terminals for GNOME Terminal, xterm |
| `/dev/shm` | Xorg, Mutter, Mesa | Shared memory for buffer passing between processes |
| `/run` | D-Bus, GDM, Xorg | Runtime sockets: `/run/dbus/system_bus_socket`, `/run/gdm/` |

## udev: How the Kernel Tells Userspace About Hardware

The kernel discovers hardware during boot (PCI enumeration, USB probing, etc.) and creates entries in `/sys`. But `/dev` nodes don't appear by themselves — that's udev's job.

### The Kernel → udev Communication Path

```
Kernel detects GPU on PCI bus
  │
  ├─ Creates sysfs entry: /sys/devices/pci0000:00/0000:00:02.0/
  │    ├─ vendor, device, class, driver, etc.
  │    └─ drm/card0/  (DRM subsystem registered this device)
  │
  └─ Sends uevent via netlink socket to userspace
       │
       └─ udevd receives the uevent
            ├─ Matches against rules in /etc/udev/rules.d/ and /lib/udev/rules.d/
            ├─ Creates /dev/dri/card0 (major 226, minor 0)
            ├─ Creates /dev/dri/renderD128 (major 226, minor 128)
            ├─ Sets permissions (typically root:video, mode 0660)
            └─ Runs any trigger scripts (e.g., loading firmware)
```

The uevent is a key=value message over a netlink socket:

```
ACTION=add
DEVPATH=/devices/pci0000:00/0000:00:02.0/drm/card0
SUBSYSTEM=drm
DEVNAME=/dev/dri/card0
DEVTYPE=drm_minor
MAJOR=226
MINOR=0
```

### Why This Matters for Xorg

Xorg doesn't scan PCI buses itself. It either:
1. Opens `/dev/dri/card0` directly (modesetting driver)
2. Uses udev to enumerate available GPUs via `libudev`

If udev hasn't finished processing when Xorg starts, Xorg won't find the GPU. This is why init scripts call `udevadm settle` — it blocks until all pending uevents are processed.

### Input Devices Follow the Same Path

```
Kernel detects USB keyboard
  └─ Creates /sys/class/input/event3/
  └─ Sends uevent
       └─ udevd creates /dev/input/event3
            └─ libinput (used by Xorg) opens /dev/input/event3
                 └─ Reads evdev events (EV_KEY, EV_REL, EV_ABS)
```

The evdev protocol is the kernel's interface for input devices. Every keypress, mouse move, and touchpad gesture is an `input_event` struct:

```c
struct input_event {
    struct timeval time;    // timestamp
    __u16 type;             // EV_KEY, EV_REL, EV_ABS, EV_SYN
    __u16 code;             // KEY_A, REL_X, BTN_LEFT, etc.
    __s32 value;            // 1=press, 0=release, or axis value
};
```

## D-Bus: The IPC Backbone

D-Bus is how every component above the kernel communicates. There are two buses:

### System Bus vs Session Bus

```
┌─────────────────────────────────────────────────┐
│                  System Bus                      │
│         /run/dbus/system_bus_socket              │
│                                                  │
│  Clients:          Services:                     │
│  - GDM             - org.freedesktop.UPower      │
│  - NetworkManager  - org.freedesktop.UDisks2     │
│  - GNOME Shell     - org.freedesktop.PolicyKit1  │
│                    - org.freedesktop.Accounts    │
│                    - org.freedesktop.login1      │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│              Session Bus (per user)              │
│    /run/user/1000/bus  (or abstract socket)      │
│                                                  │
│  Clients:          Services:                     │
│  - Nautilus        - org.gnome.Shell             │
│  - GNOME Terminal  - org.gnome.SettingsDaemon    │
│  - Firefox         - org.gnome.Keyring           │
│                    - org.gtk.vfs.Daemon (GVfs)   │
│                    - org.freedesktop.Notifications│
└─────────────────────────────────────────────────┘
```

### How D-Bus Activation Works

Most D-Bus services aren't started manually — they're activated on demand. When a client sends a message to `org.freedesktop.UPower` and no one is listening, D-Bus reads the `.service` file:

```ini
# /usr/share/dbus-1/system-services/org.freedesktop.UPower.service
[D-BUS Service]
Name=org.freedesktop.UPower
Exec=/usr/libexec/upowerd
User=root
```

D-Bus starts the daemon, waits for it to register its bus name, then delivers the message. This is why you don't always need explicit init scripts for every GNOME service — D-Bus auto-starts them.

### The D-Bus Message Flow (Concrete Example)

When you click "Suspend" in GNOME:

```
GNOME Shell (JavaScript)
  │ calls org.freedesktop.login1.Manager.Suspend()
  │ on the system bus
  │
  ├─► D-Bus daemon routes to logind
  │
  ├─► logind checks with polkitd:
  │     "Is this user allowed to suspend?"
  │     → polkitd checks /usr/share/polkit-1/actions/
  │     → Returns: yes (or prompts for password)
  │
  ├─► logind calls org.freedesktop.UPower.Suspend()
  │     → UPower writes to /sys/power/state
  │     → Kernel suspends the machine
  │
  └─► On resume: reverse path, GNOME Shell redraws
```

Every step crosses a D-Bus boundary. Without D-Bus, GNOME Shell has no way to talk to logind, and logind has no way to check permissions with polkit.

## The DRM/KMS Interface: How Xorg Talks to the GPU

This is the most critical integration point. DRM (Direct Rendering Manager) and KMS (Kernel Mode Setting) are the kernel interfaces that Xorg and Mesa use to control the GPU.

### The File Descriptor Model

Everything goes through file descriptors on `/dev/dri/card0`:

```
Xorg opens /dev/dri/card0
  │
  ├─ ioctl(fd, DRM_IOCTL_SET_MASTER)
  │    → Xorg becomes the DRM master (only one process can be master)
  │    → DRM master can set display modes, manage CRTCs, page flip
  │
  ├─ ioctl(fd, DRM_IOCTL_MODE_GETRESOURCES)
  │    → Returns: list of CRTCs, connectors, encoders
  │    → CRTC = display pipeline (scanout engine)
  │    → Connector = physical output (HDMI, DP, eDP)
  │    → Encoder = signal converter (digital→HDMI, digital→DP)
  │
  ├─ ioctl(fd, DRM_IOCTL_MODE_SETCRTC)
  │    → Sets resolution, refresh rate, connects CRTC to connector
  │    → This is "mode setting" — the KMS part
  │
  └─ ioctl(fd, DRM_IOCTL_MODE_PAGE_FLIP)
       → Swaps the displayed framebuffer (double buffering)
       → Kernel signals completion via DRM event on the fd
```

### DRM Master and Why It Matters

Only one process can be the DRM master at a time. This is how VT (virtual terminal) switching works:

```
User is on GNOME desktop (Xorg is DRM master on VT7)
  │
  User presses Ctrl+Alt+F3
  │
  ├─ Kernel sends VT switch signal to Xorg
  ├─ Xorg calls ioctl(fd, DRM_IOCTL_DROP_MASTER)
  │    → Xorg can no longer change display modes
  ├─ Kernel switches to VT3 (text console)
  │    → fbcon (framebuffer console) takes over the display
  │
  User presses Ctrl+Alt+F7
  │
  ├─ Kernel sends VT switch signal
  ├─ Xorg calls ioctl(fd, DRM_IOCTL_SET_MASTER)
  │    → Xorg regains control of the display
  └─ Xorg restores the mode and redraws
```

GDM manages this for login/logout transitions. When you log out, GDM tells Xorg to release DRM master, then starts a new Xorg for the greeter.

### The Rendering Pipeline: Mesa's Role

Mesa is the userspace OpenGL/Vulkan implementation. It translates API calls into GPU-specific command buffers:

```
GNOME Shell calls glDrawArrays() (OpenGL)
  │
  ├─ Mesa's Gallium driver (e.g., iris for Intel)
  │    ├─ Translates to GPU-specific command buffer
  │    ├─ Allocates GPU memory via:
  │    │    ioctl(fd, DRM_IOCTL_GEM_CREATE)  → allocate buffer object
  │    │    ioctl(fd, DRM_IOCTL_GEM_MMAP)    → map to userspace
  │    │
  │    └─ Submits command buffer to GPU via:
  │         ioctl(fd, DRM_IOCTL_SUBMIT)  → kernel queues for GPU execution
  │
  ├─ GPU executes commands, writes pixels to framebuffer
  │
  └─ Mutter calls eglSwapBuffers()
       └─ Mesa calls ioctl(fd, DRM_IOCTL_MODE_PAGE_FLIP)
            └─ Kernel swaps the displayed buffer at next vblank
```

The key insight: Mesa and Xorg share the same `/dev/dri/card0` file descriptor (via DRI3 — see below). Mesa does the rendering, Xorg/Mutter does the display management.

## Xorg ↔ Clients: The X11 Protocol and DRI3

### The X11 Socket

Xorg listens on a Unix domain socket. Every X client (GTK apps, GNOME Shell, terminals) connects to it:

```
/tmp/.X11-unix/X0          → Unix socket for display :0
$DISPLAY=:0                → Tells clients which socket to connect to
```

The X11 protocol is a request/response/event protocol over this socket:

```
Client (GTK app)                    Xorg Server
     │                                   │
     ├─ CreateWindow request ──────────► │
     │                                   ├─ Allocates window ID
     │ ◄────────────── CreateWindow reply │
     │                                   │
     ├─ MapWindow request ─────────────► │
     │                                   ├─ Makes window visible
     │                                   ├─ Sends Expose event ──► Client
     │                                   │
     │ ◄──────────── KeyPress event ──── │ (from libinput → Xorg → client)
     │                                   │
     ├─ PutImage request ──────────────► │ (old way: send pixels over socket)
     │        OR                         │
     ├─ DRI3 PixmapFromBuffers ────────► │ (new way: share GPU buffer directly)
     │                                   │
```

### DRI3: Zero-Copy Buffer Sharing

The old way (DRI2 and before): the client renders into a buffer, then copies pixels to Xorg over the socket. Slow.

DRI3 eliminates the copy. The client and server share GPU buffers via file descriptors:

```
Client (Mesa rendering for a GTK app)
  │
  ├─ Allocates GPU buffer via DRM GEM
  │    fd = open("/dev/dri/renderD128")
  │    ioctl(fd, DRM_IOCTL_GEM_CREATE, &bo)
  │
  ├─ Renders into the buffer (OpenGL draw calls)
  │
  ├─ Exports the buffer as a DMA-BUF file descriptor
  │    ioctl(fd, DRM_IOCTL_PRIME_HANDLE_TO_FD, &dmabuf_fd)
  │
  ├─ Sends dmabuf_fd to Xorg via DRI3 PixmapFromBuffers
  │    (file descriptor passing over Unix socket using SCM_RIGHTS)
  │
  └─ Xorg imports the buffer
       ioctl(card_fd, DRM_IOCTL_PRIME_FD_TO_HANDLE, &dmabuf_fd)
       → Now Xorg has a handle to the same GPU memory
       → Mutter composites this buffer with other windows
       → Page flip to display
```

The critical mechanism here is `SCM_RIGHTS` — the ability to pass file descriptors between processes over Unix domain sockets. This is how a GTK app's rendered frame gets to Mutter without ever being copied through main memory.

### /dev/dri/card0 vs /dev/dri/renderD128

```
/dev/dri/card0       → "Primary node" — mode setting, display control
                        Only DRM master (Xorg) should use this
                        Requires root or DRM master privileges

/dev/dri/renderD128  → "Render node" — GPU computation and rendering only
                        Any user in the "render" or "video" group can open this
                        Used by Mesa in client applications
                        Cannot set display modes or page flip
```

This separation is a security boundary. Your web browser can use the GPU for rendering (via renderD128) without being able to change your display resolution or read other windows' framebuffers (which would require card0).

## GDM → Xorg → GNOME Session: The Login Flow in Detail

### GDM's Internal Architecture

GDM isn't a single process. It's a multi-process system with privilege separation:

```
gdm (main daemon, runs as root)
  │
  ├─ gdm-session-worker (runs as root, handles PAM authentication)
  │
  ├─ Xorg (runs as root initially, drops to user after setup)
  │    └─ Opened /dev/dri/card0 as DRM master
  │
  └─ gnome-shell --mode=gdm (runs as "gdm" user, renders the greeter)
       └─ Connects to Xorg via DISPLAY=:0
```

### The Authentication Sequence

```
1. GDM starts Xorg on VT7
     Xorg: open("/dev/dri/card0") → DRM master
     Xorg: ioctl(DRM_IOCTL_MODE_SETCRTC) → set 1920x1080
     Xorg: listens on /tmp/.X11-unix/X0

2. GDM starts gnome-shell --mode=gdm (as user "gdm")
     Shell connects to :0
     Shell renders login screen via Mutter → Mesa → DRM

3. User types username + password
     Keypress: kernel evdev → Xorg → X11 KeyPress event → Shell

4. Shell sends credentials to gdm-session-worker via D-Bus
     gdm-session-worker calls PAM:
       pam_authenticate() → checks /etc/shadow (or LDAP, etc.)

5. PAM returns success

6. gdm-session-worker:
     a. Creates a new session (setsid, setuid to the user)
     b. Sets environment: HOME, USER, DISPLAY, XDG_RUNTIME_DIR
     c. Starts D-Bus session bus for the user
     d. Starts gnome-session --session=gnome

7. GDM tells the greeter Shell to exit
     Xorg remains running, now serving the user's session
```

### XDG_RUNTIME_DIR: The Per-User Runtime Directory

This is a critical piece of the integration that's easy to miss:

```bash
XDG_RUNTIME_DIR=/run/user/1000
```

This directory is:
- Created by logind (or PAM) when the user logs in
- Owned by the user, mode 0700
- Stored on tmpfs (RAM-backed, fast)
- Cleaned up when the user's last session ends

It holds:
- D-Bus session socket: `/run/user/1000/bus`
- PulseAudio socket: `/run/user/1000/pulse/native`
- Wayland socket: `/run/user/1000/wayland-0` (if using Wayland)
- GVfs mount points: `/run/user/1000/gvfs/`
- Application runtime state

Without `XDG_RUNTIME_DIR`, GNOME session startup fails because D-Bus, PulseAudio, and GVfs can't create their sockets.

## gnome-session: Orchestrating the Desktop

### What gnome-session Actually Does

`gnome-session` reads a session definition file and starts components in dependency order:

```ini
# /usr/share/gnome-session/sessions/gnome.session
[GNOME Session]
Name=GNOME
RequiredComponents=org.gnome.Shell;org.gnome.SettingsDaemon.A11ySettings;org.gnome.SettingsDaemon.Color;org.gnome.SettingsDaemon.Datetime;org.gnome.SettingsDaemon.Housekeeping;org.gnome.SettingsDaemon.Keyboard;org.gnome.SettingsDaemon.MediaKeys;org.gnome.SettingsDaemon.Power;org.gnome.SettingsDaemon.PrintNotifications;org.gnome.SettingsDaemon.Rfkill;org.gnome.SettingsDaemon.ScreensaverProxy;org.gnome.SettingsDaemon.Sharing;org.gnome.SettingsDaemon.Smartcard;org.gnome.SettingsDaemon.Sound;org.gnome.SettingsDaemon.UsbProtection;org.gnome.SettingsDaemon.Wacom;org.gnome.SettingsDaemon.XSettings;
```

Each component has a `.desktop` file in `/usr/share/applications/`:

```ini
# org.gnome.Shell.desktop
[Desktop Entry]
Name=GNOME Shell
Exec=gnome-shell
X-GNOME-Autostart-Phase=DisplayServer
```

### The Startup Phases

gnome-session starts components in phases, waiting for each phase to complete:

```
Phase 1: EarlyInitialization
  └─ gnome-keyring-daemon (secrets, SSH agent)

Phase 2: PreDisplayServer
  └─ (empty on X11, used for Wayland compositor setup)

Phase 3: DisplayServer
  └─ GNOME Shell (which embeds Mutter)
       ├─ Mutter registers as the window manager with Xorg
       │    → Xorg sends SubstructureRedirect to Mutter for all windows
       │    → Mutter now controls window placement, decoration, compositing
       ├─ Mutter creates an OpenGL compositing surface
       │    → eglCreateContext() → Mesa → DRM
       └─ GNOME Shell renders the desktop UI (panel, dash, overview)

Phase 4: Initialization
  └─ All SettingsDaemon components start
       ├─ XSettings: pushes GTK theme, font, DPI to Xorg
       ├─ Color: loads ICC profiles, sets gamma ramps via XRandR
       ├─ Power: monitors UPower via D-Bus, manages screen brightness
       ├─ Keyboard: loads XKB layout via Xorg
       └─ MediaKeys: grabs global hotkeys (volume, brightness)

Phase 5: WindowManager
  └─ (Mutter signals it's ready to manage windows)

Phase 6: Panel
  └─ (GNOME Shell signals the panel is drawn)

Phase 7: Desktop
  └─ (Desktop is ready, autostart apps can launch)

Phase 8: Application
  └─ ~/.config/autostart/*.desktop entries launch
       └─ e.g., Nautilus desktop icons, chat clients, etc.
```

If any RequiredComponent fails to register on D-Bus within the timeout, gnome-session considers the startup failed and may fall back to a recovery session.

## Mutter ↔ Xorg: The Compositing Window Manager Interface

### How Mutter Becomes the Window Manager

When Mutter starts, it does this:

```c
// Simplified Mutter startup
XSelectInput(display, root_window, SubstructureRedirectMask | SubstructureNotifyMask);
```

This single Xlib call is what makes Mutter the window manager. `SubstructureRedirectMask` tells Xorg: "redirect all window management requests (map, configure, resize) to me instead of handling them directly."

Only one client can set this mask on the root window. If another window manager is already running, this call fails with a `BadAccess` error.

### The Compositing Pipeline

```
Application renders frame (Mesa → GPU buffer)
  │
  ├─ DRI3: passes DMA-BUF fd to Xorg
  │
  ├─ Xorg notifies Mutter: "window has new content" (Damage event)
  │
  ├─ Mutter's compositor:
  │    ├─ Imports all window buffers as OpenGL textures
  │    │    (via EGL_EXT_image_dma_buf_import)
  │    ├─ Renders the composite scene:
  │    │    ├─ Background wallpaper (texture)
  │    │    ├─ Window 1 (texture, with position/size from WM)
  │    │    ├─ Window 2 (texture, with transparency/shadow)
  │    │    ├─ GNOME Shell UI (panel, dash — rendered by Clutter/St)
  │    │    └─ Cursor overlay
  │    ├─ All composited into a single framebuffer
  │    └─ eglSwapBuffers() → Mesa → DRM page flip
  │
  └─ Display shows the composited frame at next vblank
```

The key integration point: Mutter doesn't draw window contents. It takes GPU buffers from applications (via DRI3/DMA-BUF), composites them as textures, and presents the result. The applications and the compositor share GPU memory without copying.

## Input Event Flow: Keyboard to Application

Here's the complete path of a keypress from hardware to application:

```
USB keyboard sends HID report (hardware interrupt)
  │
  ├─ Kernel USB HID driver decodes the report
  │    └─ Generates input_event: {type=EV_KEY, code=KEY_A, value=1}
  │    └─ Writes to /dev/input/event3
  │
  ├─ Xorg's libinput module:
  │    └─ read() on /dev/input/event3
  │    └─ Converts evdev event to X11 KeyPress event
  │    └─ Applies XKB keymap (scancode → keysym: KEY_A → 'a' or 'A')
  │
  ├─ Xorg delivers KeyPress event to the focused window
  │    └─ Sends over /tmp/.X11-unix/X0 to the client
  │
  ├─ GTK (in the application):
  │    └─ GDK reads the X11 event from the socket
  │    └─ Translates to GDK event (GdkEventKey)
  │    └─ Dispatches through GTK's event propagation:
  │         capture phase → target widget → bubble phase
  │    └─ GtkTextView inserts the character
  │    └─ Triggers a redraw
  │
  └─ Application renders updated frame
       └─ Mesa → GPU → DRI3 → Mutter composites → display
```

Total latency from keypress to pixel: typically 20-50ms on a well-configured system.

### Focus Management

How does Xorg know which window gets the keypress? Mutter manages focus:

```
User clicks on a window
  │
  ├─ Kernel: evdev ButtonPress → /dev/input/event*
  ├─ Xorg: libinput reads it, generates X11 ButtonPress
  ├─ Xorg: delivers to Mutter (because SubstructureRedirect)
  ├─ Mutter: determines which window was clicked (hit testing)
  ├─ Mutter: calls XSetInputFocus(display, clicked_window)
  ├─ Xorg: updates internal focus state
  └─ Future KeyPress events go to the focused window
```

## GVfs: How Nautilus Accesses Filesystems

GVfs is the layer that makes Nautilus able to browse not just local files but also SFTP servers, MTP devices, and trash.

### The Architecture

```
Nautilus (or any GIO-using app)
  │
  ├─ GIO API: g_file_new_for_uri("sftp://server/path")
  │
  ├─ GIO checks the URI scheme → "sftp"
  │    └─ Looks up the GVfs backend for "sftp"
  │
  ├─ D-Bus call to org.gtk.vfs.Daemon
  │    └─ gvfsd (main daemon) spawns gvfsd-sftp
  │         └─ gvfsd-sftp opens SSH connection to server
  │         └─ Registers mount on D-Bus
  │
  ├─ GIO reads/writes via D-Bus messages to gvfsd-sftp
  │    (for GIO-aware apps — zero-copy via D-Bus fd passing)
  │
  └─ For non-GIO apps (e.g., vim, cat):
       └─ gvfsd-fuse mounts at /run/user/1000/gvfs/
            └─ FUSE: kernel redirects filesystem calls to gvfsd-fuse
                 └─ gvfsd-fuse translates to GVfs D-Bus calls
                 └─ Result: sftp://server/path appears as a local directory
```

### The FUSE Integration

FUSE (Filesystem in Userspace) is the kernel mechanism that makes this work for non-GIO apps:

```
cat /run/user/1000/gvfs/sftp:host=server/path/file.txt
  │
  ├─ Kernel VFS: open() syscall
  ├─ Kernel sees the mountpoint is FUSE
  ├─ Kernel writes request to /dev/fuse fd (held by gvfsd-fuse)
  ├─ gvfsd-fuse reads the FUSE request
  ├─ gvfsd-fuse calls GVfs D-Bus API → gvfsd-sftp → SSH → remote file
  ├─ gvfsd-fuse writes response back to /dev/fuse
  └─ Kernel returns data to cat's read() syscall
```

This is why we enabled FUSE in the kernel config and built libfuse — without it, only GIO-native apps could access GVfs mounts.

## Putting It All Together: The Complete Data Flow

Here's every integration point in a single scenario — user opens a terminal and types a command:

```
1. HARDWARE → KERNEL
   USB keyboard interrupt → HID driver → evdev → /dev/input/event3

2. KERNEL → XORG
   Xorg's libinput reads /dev/input/event3 via read() syscall
   Converts to X11 KeyPress event

3. XORG → APPLICATION (via X11 protocol)
   KeyPress sent over /tmp/.X11-unix/X0 to GNOME Terminal
   GDK reads socket, dispatches to VTE terminal widget

4. APPLICATION → MESA (rendering)
   VTE updates terminal buffer, triggers redraw
   GTK calls Cairo → Cairo calls OpenGL → Mesa translates to GPU commands
   Mesa: ioctl(renderD128, DRM_IOCTL_SUBMIT) → GPU renders

5. APPLICATION → XORG (buffer sharing via DRI3)
   Mesa exports GPU buffer as DMA-BUF fd
   Sends fd to Xorg via DRI3 PixmapFromBuffers (SCM_RIGHTS)

6. XORG → MUTTER (damage notification)
   Xorg sends Damage event to Mutter: "GNOME Terminal has new content"

7. MUTTER → MESA → KERNEL → DISPLAY (compositing)
   Mutter imports all window buffers as GL textures
   Composites: wallpaper + all windows + shell UI + cursor
   eglSwapBuffers() → Mesa → ioctl(card0, DRM_IOCTL_MODE_PAGE_FLIP)
   Kernel swaps framebuffer at vblank → pixels on screen

8. THROUGHOUT: D-BUS
   GNOME Terminal → org.freedesktop.Notifications (if bell)
   Mutter → org.gnome.SettingsDaemon.XSettings (theme/font info)
   GVfs → org.gtk.vfs.Daemon (if terminal accesses a GVfs mount)
```

## The Socket and File Descriptor Map

Every integration point is a file descriptor. Here's what a running GNOME session looks like from the kernel's perspective:

```
/tmp/.X11-unix/X0              Xorg ↔ all X11 clients
/run/dbus/system_bus_socket    System D-Bus (polkit, UPower, UDisks2, logind)
/run/user/1000/bus             Session D-Bus (Shell, GVfs, Settings, apps)
/dev/dri/card0                 Xorg (DRM master — mode setting, page flip)
/dev/dri/renderD128            Mesa in every app (GPU rendering)
/dev/input/event*              Xorg/libinput (keyboard, mouse, touchpad)
/dev/fuse                      gvfsd-fuse (GVfs FUSE mounts)
/dev/pts/*                     Terminal emulators (pseudo-terminals)
/run/user/1000/gvfs/           GVfs FUSE mountpoints
/proc/self/fd/                 File descriptor passing (DRI3, D-Bus)
```

Everything is a file descriptor. The kernel provides the file descriptors. Userspace components connect to each other by opening, sharing, and passing these file descriptors. That's the fundamental integration model of the entire Linux graphics stack.

## Wrapping Up

The Linux desktop is a stack of well-defined interfaces: the kernel exposes hardware through `/dev` and `/sys`, udev populates device nodes, DRM/KMS provides GPU access through ioctls on `/dev/dri/*`, Xorg manages the display and input routing over a Unix socket, Mesa translates OpenGL to GPU commands through the same DRM interface, D-Bus connects every service through message passing, and GNOME Shell composites everything through shared GPU buffers. No component knows about the internals of any other — they communicate exclusively through these interfaces. Understanding the seams is understanding the system.
