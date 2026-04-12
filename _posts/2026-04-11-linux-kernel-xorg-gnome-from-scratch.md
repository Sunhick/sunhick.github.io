---
title: "Building a Linux Desktop from Scratch: Kernel, Xorg, and GNOME Compiled from Source"
date: 2026-04-11 10:00:00 -0700
categories: [Linux]
tags: [linux-kernel, xorg, gnome, compilation, from-scratch]
---

This is a walkthrough of building a working Linux desktop environment entirely from source — the kernel, Xorg display server, and a full GNOME desktop with its filesystem stack. No package manager, no prebuilt binaries. Everything compiled by hand.

This is not a quick weekend project. It's a deep exercise in understanding how a Linux graphical desktop actually fits together, from the kernel's DRM subsystem all the way up to GNOME Shell rendering on your screen.

## Prerequisites

You need a working Linux host system to bootstrap from. This can be an existing distro installation or an LFS (Linux From Scratch) base system. You'll also need:

- GCC 13+ (or Clang 17+)
- GNU Make, Meson, Ninja, CMake
- Python 3.10+
- pkg-config
- Git
- At least 50 GB of free disk space
- Patience

Set up a prefix for all your compiled software:

```bash
export PREFIX=/opt/desktop
export PATH=$PREFIX/bin:$PATH
export PKG_CONFIG_PATH=$PREFIX/lib/pkgconfig:$PREFIX/lib64/pkgconfig:$PREFIX/share/pkgconfig
export LD_LIBRARY_PATH=$PREFIX/lib:$PREFIX/lib64
export ACLOCAL_PATH=$PREFIX/share/aclocal
export XDG_DATA_DIRS=$PREFIX/share:/usr/share
export MAKEFLAGS="-j$(nproc)"
```

Add these to a file you can source repeatedly:

```bash
cat > ~/desktop-env.sh << 'EOF'
export PREFIX=/opt/desktop
export PATH=$PREFIX/bin:$PATH
export PKG_CONFIG_PATH=$PREFIX/lib/pkgconfig:$PREFIX/lib64/pkgconfig:$PREFIX/share/pkgconfig
export LD_LIBRARY_PATH=$PREFIX/lib:$PREFIX/lib64
export ACLOCAL_PATH=$PREFIX/share/aclocal
export XDG_DATA_DIRS=$PREFIX/share:/usr/share
export MAKEFLAGS="-j$(nproc)"
EOF

source ~/desktop-env.sh
```

## Part 1: The Linux Kernel

The kernel needs to be configured with the right subsystems for a graphical desktop — DRM (Direct Rendering Manager), framebuffer, input devices, and filesystem support.

### Fetch and Extract

```bash
KERNEL_VERSION=6.8.9
curl -O https://cdn.kernel.org/pub/linux/kernel/v6.x/linux-$KERNEL_VERSION.tar.xz
tar xf linux-$KERNEL_VERSION.tar.xz
cd linux-$KERNEL_VERSION
```

### Configure

Start from the default config and enable what we need:

```bash
make defconfig
```

Then open the menu-driven configurator:

```bash
make menuconfig
```

Ensure these are enabled (built-in `[*]` or module `[M]`):

```
Device Drivers --->
  Graphics support --->
    [*] Direct Rendering Manager (DRM)
    [M]   Intel 8xx/9xx/G3x/G4x/HD Graphics    # or your GPU
    [M]   AMD GPU                                 # if AMD
    [M]   Nouveau (NVIDIA)                        # if NVIDIA
    [*]   Enable legacy fbdev support for your modesetting driver
    Console display driver support --->
      [*] Framebuffer Console support

  Input device support --->
    [*] Event interface
    [*] Keyboards --->
      [*] AT keyboard
    [*] Mice --->
      [*] PS/2 mouse
      [*] USB HID Boot Protocol drivers

  HID support --->
    [*] HID bus support
    [*] Generic HID driver
    USB HID support --->
      [*] USB HID transport layer

  USB support --->
    [*] xHCI HCD (USB 3.0) support
    [*] EHCI HCD (USB 2.0) support

File systems --->
  [*] Ext4 POSIX Access Control Lists
  [*] Ext4 Security Labels
  [*] The Extended 4 (ext4) filesystem
  Pseudo filesystems --->
    [*] /proc file system support
    [*] sysfs file system support
    [*] Tmpfs virtual memory file system support
  FUSE (Filesystem in Userspace) support --->
    [*] FUSE (Filesystem in Userspace) support
  [*] Inotify support for userspace

Networking support --->
  Networking options --->
    [*] Unix domain sockets    # Required for D-Bus and Xorg

General setup --->
  [*] Control Group support
  [*] Namespaces support
  [*] Enable eventfd() system call
  [*] Enable signalfd() system call
  [*] Enable timerfd() system call
  [*] Enable eventpoll support
```

### Build and Install

```bash
make -j$(nproc)
make modules_install
make install
```

This installs the kernel to `/boot` and modules to `/lib/modules/$KERNEL_VERSION`. Update your bootloader (GRUB, systemd-boot, etc.) to point to the new kernel.

### Verify After Reboot

```bash
uname -r
# Should show your compiled kernel version

ls /dev/dri/
# Should show card0, renderD128 — confirms DRM is working

cat /proc/filesystems | grep -E "ext4|fuse|tmpfs"
# Confirms filesystem support
```

## Part 2: Foundation Libraries

Before Xorg or GNOME, you need a stack of foundational libraries. Order matters — each layer depends on the one before it.

### util-macros (X.Org build macros)

```bash
git clone https://gitlab.freedesktop.org/xorg/util/macros.git
cd macros
./autogen.sh --prefix=$PREFIX
make install
cd ..
```

### xorgproto (X11 protocol headers)

```bash
git clone https://gitlab.freedesktop.org/xorg/proto/xorgproto.git
cd xorgproto
meson setup build --prefix=$PREFIX
ninja -C build install
cd ..
```

### libffi

```bash
curl -LO https://github.com/libffi/libffi/releases/download/v3.4.6/libffi-3.4.6.tar.gz
tar xf libffi-3.4.6.tar.gz
cd libffi-3.4.6
./configure --prefix=$PREFIX
make && make install
cd ..
```

### GLib (foundation for everything GTK/GNOME)

```bash
git clone https://gitlab.gnome.org/GNOME/glib.git -b 2.80.0
cd glib
meson setup build --prefix=$PREFIX -Dtests=false
ninja -C build install
cd ..
```

### Wayland and Wayland-Protocols

Even though we're building Xorg, modern GNOME components reference Wayland:

```bash
# wayland
git clone https://gitlab.freedesktop.org/wayland/wayland.git -b 1.22.0
cd wayland
meson setup build --prefix=$PREFIX -Ddocumentation=false -Dtests=false
ninja -C build install
cd ..

# wayland-protocols
git clone https://gitlab.freedesktop.org/wayland/wayland-protocols.git -b 1.36
cd wayland-protocols
meson setup build --prefix=$PREFIX -Dtests=false
ninja -C build install
cd ..
```

### libdrm

```bash
git clone https://gitlab.freedesktop.org/mesa/drm.git -b libdrm-2.4.120
cd drm
meson setup build --prefix=$PREFIX
ninja -C build install
cd ..
```

### Mesa (OpenGL/Vulkan — the userspace GPU driver)

Mesa is the bridge between your kernel's DRM driver and OpenGL/Vulkan applications. GNOME Shell requires OpenGL ES 2.0 at minimum.

```bash
git clone https://gitlab.freedesktop.org/mesa/mesa.git -b mesa-24.0.5
cd mesa
meson setup build --prefix=$PREFIX \
  -Dgallium-drivers=iris,radeonsi,nouveau,swrast \
  -Dvulkan-drivers=intel,amd \
  -Dglx=dri \
  -Degl=enabled \
  -Dgles2=enabled \
  -Dplatforms=x11,wayland \
  -Dllvm=enabled
ninja -C build install
cd ..
```

Adjust `gallium-drivers` and `vulkan-drivers` for your GPU. Use `swrast` as a software fallback.

### Verify Mesa

```bash
$PREFIX/bin/glxinfo | head -20
# Should show your GPU and OpenGL version
```

## Part 3: Xorg Display Server

Xorg is built from many small components. Here's the dependency chain.

### xtrans, libXau, libXdmcp (transport and auth)

```bash
for lib in xtrans libXau libXdmcp; do
  git clone https://gitlab.freedesktop.org/xorg/lib/$lib.git
  cd $lib
  ./autogen.sh --prefix=$PREFIX
  make && make install
  cd ..
done
```

### xcb-proto and libxcb

```bash
git clone https://gitlab.freedesktop.org/xorg/lib/libxcb.git
# xcb-proto first
git clone https://gitlab.freedesktop.org/xorg/proto/xcb-proto.git
cd xcb-proto
./autogen.sh --prefix=$PREFIX
make && make install
cd ..

cd libxcb
./autogen.sh --prefix=$PREFIX
make && make install
cd ..
```

### libX11 and friends

```bash
for lib in libX11 libXext libXfixes libXi libXrender libXrandr \
           libXcursor libXcomposite libXdamage libXtst libXt \
           libXmu libXpm libXaw libXinerama libXfont2 libxkbfile \
           libICE libSM; do
  git clone https://gitlab.freedesktop.org/xorg/lib/$lib.git
  cd $lib
  if [ -f meson.build ]; then
    meson setup build --prefix=$PREFIX
    ninja -C build install
  else
    ./autogen.sh --prefix=$PREFIX
    make && make install
  fi
  cd ..
done
```

Some of these will fail if built out of order. The list above is roughly correct, but you may need to iterate. If a build fails on a missing dependency, build that dependency first and retry.

### xkbcomp and xkeyboard-config

```bash
# xkbcomp
git clone https://gitlab.freedesktop.org/xorg/app/xkbcomp.git
cd xkbcomp
./autogen.sh --prefix=$PREFIX
make && make install
cd ..

# xkeyboard-config
git clone https://gitlab.freedesktop.org/xkeyboard-config/xkeyboard-config.git
cd xkeyboard-config
meson setup build --prefix=$PREFIX
ninja -C build install
cd ..
```

### pixman

```bash
git clone https://gitlab.freedesktop.org/pixman/pixman.git
cd pixman
meson setup build --prefix=$PREFIX
ninja -C build install
cd ..
```

### Xorg Server

```bash
git clone https://gitlab.freedesktop.org/xorg/xserver.git -b xorg-server-21.1.13
cd xserver
meson setup build --prefix=$PREFIX \
  -Dglamor=true \
  -Dxorg=true \
  -Dxephyr=false \
  -Dxnest=false \
  -Dxvfb=false \
  -Dxwayland=true \
  -Dsuid_wrapper=true
ninja -C build install
cd ..
```

### Xorg Input and Video Drivers

```bash
# Input drivers
for drv in xf86-input-libinput xf86-input-evdev; do
  git clone https://gitlab.freedesktop.org/xorg/driver/$drv.git
  cd $drv
  ./autogen.sh --prefix=$PREFIX
  make && make install
  cd ..
done

# Video driver (choose based on your GPU)
# Intel:
git clone https://gitlab.freedesktop.org/xorg/driver/xf86-video-intel.git
cd xf86-video-intel
./autogen.sh --prefix=$PREFIX --enable-sna --enable-uxa
make && make install
cd ..

# AMD: xf86-video-amdgpu
# NVIDIA: use nouveau or the proprietary driver
```

### Test Xorg

```bash
# Create a minimal xorg.conf
cat > /etc/X11/xorg.conf << 'EOF'
Section "ServerLayout"
    Identifier     "Layout0"
    Screen         "Screen0"
EndSection

Section "Device"
    Identifier     "Device0"
    Driver         "modesetting"    # Generic KMS driver, works with most GPUs
EndSection

Section "Screen"
    Identifier     "Screen0"
    Device         "Device0"
EndSection
EOF

# Start X with a simple terminal
startx /usr/bin/xterm -- $PREFIX/bin/Xorg
```

If you see an xterm window, Xorg is working.

## Part 4: D-Bus and System Services

GNOME requires D-Bus for inter-process communication and several system services.

### D-Bus

```bash
git clone https://gitlab.freedesktop.org/dbus/dbus.git -b dbus-1.14.10
cd dbus
meson setup build --prefix=$PREFIX \
  -Dsystemd=disabled \
  -Dxml_docs=disabled
ninja -C build install
cd ..
```

Create the D-Bus machine ID:

```bash
$PREFIX/bin/dbus-uuidgen --ensure
```

### polkit (PolicyKit)

```bash
git clone https://github.com/polkit-org/polkit.git -b 124
cd polkit
meson setup build --prefix=$PREFIX \
  -Dsystemd=disabled \
  -Djs_engine=duktape \
  -Dtests=false
ninja -C build install
cd ..
```

### UPower (power management)

```bash
git clone https://gitlab.freedesktop.org/upower/upower.git -b v1.90.4
cd upower
meson setup build --prefix=$PREFIX -Dsystemd=disabled -Dgtk-doc=false
ninja -C build install
cd ..
```

### AccountsService

```bash
git clone https://gitlab.freedesktop.org/accountsservice/accountsservice.git
cd accountsservice
meson setup build --prefix=$PREFIX -Dsystemd=false -Dgtk_doc=false
ninja -C build install
cd ..
```

## Part 5: GTK and GNOME Libraries

### Cairo

```bash
git clone https://gitlab.freedesktop.org/cairo/cairo.git -b 1.18.0
cd cairo
meson setup build --prefix=$PREFIX -Dtests=disabled
ninja -C build install
cd ..
```

### Pango

```bash
git clone https://gitlab.gnome.org/GNOME/pango.git -b 1.52.0
cd pango
meson setup build --prefix=$PREFIX
ninja -C build install
cd ..
```

### GdkPixbuf

```bash
git clone https://gitlab.gnome.org/GNOME/gdk-pixbuf.git -b 2.42.12
cd gdk-pixbuf
meson setup build --prefix=$PREFIX -Dman=false -Dgtk_doc=false
ninja -C build install
cd ..
```

### ATK / at-spi2 (Accessibility)

```bash
git clone https://gitlab.gnome.org/GNOME/at-spi2-core.git -b 2.52.0
cd at-spi2-core
meson setup build --prefix=$PREFIX -Ddocs=false -Dtests=false
ninja -C build install
cd ..
```

### GTK 4

```bash
git clone https://gitlab.gnome.org/GNOME/gtk.git -b 4.14.0
cd gtk
meson setup build --prefix=$PREFIX \
  -Dx11-backend=true \
  -Dwayland-backend=true \
  -Dmedia-gstreamer=disabled \
  -Dbuild-tests=false \
  -Ddemos=false \
  -Dbuild-examples=false \
  -Dintrospection=enabled
ninja -C build install
cd ..
```

### libadwaita (GNOME's UI library)

```bash
git clone https://gitlab.gnome.org/GNOME/libadwaita.git -b 1.5.0
cd libadwaita
meson setup build --prefix=$PREFIX -Dtests=false -Dexamples=false
ninja -C build install
cd ..
```

## Part 6: GNOME Core Components

### GSettings Schemas (gsettings-desktop-schemas)

```bash
git clone https://gitlab.gnome.org/GNOME/gsettings-desktop-schemas.git -b 46.0
cd gsettings-desktop-schemas
meson setup build --prefix=$PREFIX
ninja -C build install
cd ..

# Compile schemas
glib-compile-schemas $PREFIX/share/glib-2.0/schemas/
```

### Mutter (GNOME's Window Manager / Compositor)

Mutter is the compositor that GNOME Shell runs on top of. It handles window management, compositing, and display management.

```bash
git clone https://gitlab.gnome.org/GNOME/mutter.git -b 46.0
cd mutter
meson setup build --prefix=$PREFIX \
  -Dtests=false \
  -Dprofiler=false \
  -Ddocs=false
ninja -C build install
cd ..
```

### GNOME Shell

```bash
git clone https://gitlab.gnome.org/GNOME/gnome-shell.git -b 46.0
cd gnome-shell
meson setup build --prefix=$PREFIX \
  -Dtests=false \
  -Dman=false
ninja -C build install
cd ..
```

### GNOME Session

```bash
git clone https://gitlab.gnome.org/GNOME/gnome-session.git -b 46.0
cd gnome-session
meson setup build --prefix=$PREFIX -Dsystemd_journal=false
ninja -C build install
cd ..
```

### GDM (GNOME Display Manager)

```bash
git clone https://gitlab.gnome.org/GNOME/gdm.git -b 46.0
cd gdm
meson setup build --prefix=$PREFIX \
  -Dsystemd-journal=false \
  -Dplymouth=disabled \
  -Ddefault-pam-config=lfs
ninja -C build install
cd ..
```

## Part 7: GNOME Filesystem Stack (GVfs and GVFS Backends)

GVfs is GNOME's virtual filesystem layer. It's what makes the file manager (Nautilus) able to browse network shares, MTP devices, trash, and more.

### FUSE (Userspace Filesystem)

Your kernel should already have FUSE support (we enabled it in Part 1). Now build the userspace tools:

```bash
git clone https://github.com/libfuse/libfuse.git -b fuse-3.16.2
cd libfuse
meson setup build --prefix=$PREFIX -Dtests=false -Dexamples=false
ninja -C build install
cd ..
```

### libsoup (HTTP client library for GNOME)

```bash
git clone https://gitlab.gnome.org/GNOME/libsoup.git -b 3.4.4
cd libsoup
meson setup build --prefix=$PREFIX -Dtests=false -Ddocs=false
ninja -C build install
cd ..
```

### GVfs

```bash
git clone https://gitlab.gnome.org/GNOME/gvfs.git -b 1.54.0
cd gvfs
meson setup build --prefix=$PREFIX \
  -Dsystemd=none \
  -Dman=false \
  -Dsmb=false \
  -Dafc=false \
  -Dgoa=false \
  -Dgoogle=false \
  -Dnfs=false \
  -Dsftp=enabled \
  -Dtrash=true \
  -Dfuse=true \
  -Dmtp=false \
  -Dgphoto2=false \
  -Dudisks2=true
ninja -C build install
cd ..
```

The flags above build a minimal GVfs with:
- Local filesystem access
- SFTP (SSH file transfer)
- Trash support
- FUSE mount support
- UDisks2 integration (for removable media)

You can enable more backends later (`-Dsmb=true` for Samba, `-Dmtp=true` for Android devices, etc.) by installing their dependencies and rebuilding.

### UDisks2 (Disk Management)

```bash
git clone https://github.com/storaged-project/udisks.git -b udisks-2.10.1
cd udisks
./autogen.sh --prefix=$PREFIX --disable-man --enable-fhs-media
make && make install
cd ..
```

### Nautilus (GNOME Files)

```bash
git clone https://gitlab.gnome.org/GNOME/nautilus.git -b 46.0
cd nautilus
meson setup build --prefix=$PREFIX -Dtests=none -Ddocs=false
ninja -C build install
cd ..
```

## Part 8: Putting It All Together

### Create a GNOME Session Entry

```bash
mkdir -p $PREFIX/share/xsessions

cat > $PREFIX/share/xsessions/gnome-xorg.desktop << EOF
[Desktop Entry]
Name=GNOME on Xorg
Comment=GNOME desktop environment (X11)
Exec=$PREFIX/bin/gnome-session --session=gnome
TryExec=$PREFIX/bin/gnome-session
Type=Application
DesktopNames=GNOME
EOF
```

### Start D-Bus and Launch GNOME

If you're not using a display manager (GDM), you can start GNOME manually:

```bash
# Start D-Bus session bus
eval $(dbus-launch --sh-syntax)

# Start Xorg in the background
$PREFIX/bin/Xorg :1 vt1 &
export DISPLAY=:1

# Wait for X to be ready
sleep 2

# Launch GNOME Session
$PREFIX/bin/gnome-session --session=gnome
```

Or create a `.xinitrc` for `startx`:

```bash
cat > ~/.xinitrc << 'EOF'
source ~/desktop-env.sh
eval $(dbus-launch --sh-syntax)
exec gnome-session --session=gnome
EOF

startx -- $PREFIX/bin/Xorg
```

### Using GDM Instead

If you built GDM and want a proper login screen:

```bash
# Create the gdm user
useradd -r -s /sbin/nologin gdm

# Start GDM
$PREFIX/sbin/gdm
```

GDM will start Xorg (or Xwayland) and present the login screen. Select "GNOME on Xorg" from the session picker.

## Part 9: The Boot Chain — Kernel to GNOME Desktop

This is the part most guides skip. Understanding how control passes from the kernel all the way to a GNOME session on your screen is critical when you're building everything from scratch.

### The Complete Handoff Sequence

```
BIOS/UEFI
  └─► Bootloader (GRUB / systemd-boot)
        └─► Linux Kernel
              ├─ Mounts root filesystem
              ├─ Initializes DRM (GPU), input devices, filesystems
              └─► Executes /sbin/init (PID 1)
                    └─► Init system (SysVinit / OpenRC / systemd)
                          ├─ Mounts filesystems (/proc, /sys, /dev, /tmp)
                          ├─ Starts udevd (device manager)
                          ├─ Starts D-Bus system bus
                          ├─ Starts polkitd, UPower, UDisks2, AccountsService
                          └─► Starts Display Manager (GDM)
                                ├─ Starts Xorg server (or Xwayland)
                                ├─ Presents login screen (greeter)
                                └─► On login: starts user session
                                      ├─ D-Bus session bus
                                      ├─ gnome-session
                                      │    ├─ Mutter (window manager / compositor)
                                      │    ├─ GNOME Shell (desktop UI)
                                      │    ├─ GVfs daemons (virtual filesystem)
                                      │    └─ Settings daemon, keyring, etc.
                                      └─ User applications
```

### Step 1: Kernel → Init (The `init=` Handoff)

When the kernel finishes hardware initialization, it does exactly one thing in userspace: execute the init process. By default it looks for `/sbin/init`, but you can override this with the `init=` kernel parameter.

```
# In your bootloader config (e.g., GRUB)
linux /boot/vmlinuz root=/dev/sda2 init=/sbin/init
```

The kernel:
1. Decompresses itself into memory
2. Initializes CPU, memory management, and the scheduler
3. Probes hardware — this is where DRM (GPU), USB, input devices, and filesystems are initialized
4. Mounts the root filesystem (specified by `root=`)
5. Executes `/sbin/init` as PID 1 — from this point, the kernel is done with boot and just provides system calls

If `/sbin/init` doesn't exist or fails, you get a kernel panic. This is the most common failure point when building from scratch.

### Step 2: Building an Init System

You have three main choices. Since we're building from scratch, SysVinit or OpenRC are the most straightforward (systemd has a massive dependency tree).

#### Option A: SysVinit (Classic, Simple)

```bash
# Build SysVinit
curl -LO https://github.com/slicer69/sysvinit/releases/download/3.09/sysvinit-3.09.tar.xz
tar xf sysvinit-3.09.tar.xz
cd sysvinit-3.09
make
make install
cd ..
```

SysVinit uses runlevels. For a graphical desktop, you want runlevel 5:

| Runlevel | Purpose |
|----------|---------|
| 0 | Halt |
| 1 | Single user (recovery) |
| 2 | Multi-user, no networking |
| 3 | Multi-user with networking (text mode) |
| 5 | Multi-user with networking and GUI |
| 6 | Reboot |

Configure `/etc/inittab`:

```bash
cat > /etc/inittab << 'EOF'
# Default runlevel: 5 (graphical)
id:5:initdefault:

# System initialization
si::sysinit:/etc/init.d/rcS

# Runlevel scripts
l0:0:wait:/etc/init.d/rc 0
l1:1:wait:/etc/init.d/rc 1
l2:2:wait:/etc/init.d/rc 2
l3:3:wait:/etc/init.d/rc 3
l5:5:wait:/etc/init.d/rc 5
l6:6:wait:/etc/init.d/rc 6

# Virtual consoles
1:2345:respawn:/sbin/agetty --noclear tty1 9600
2:2345:respawn:/sbin/agetty tty2 9600
3:2345:respawn:/sbin/agetty tty3 9600

# What to do at the "Three Finger Salute"
ca:12345:ctrlaltdel:/sbin/shutdown -t1 -a -r now
EOF
```

The key line is `id:5:initdefault:` — this tells init to boot into runlevel 5 (graphical).

#### Option B: OpenRC (Modern SysVinit Alternative)

```bash
git clone https://github.com/OpenRC/openrc.git -b 0.54
cd openrc
make
make install
cd ..
```

OpenRC uses named runlevels instead of numbers and has better dependency tracking between services.

### Step 3: Init → System Services (The rcS / rc Scripts)

When init enters runlevel 5, it executes the scripts in `/etc/init.d/` (via the `rc` script). Here's what needs to start, in order:

#### Boot Script (`/etc/init.d/rcS`)

```bash
#!/bin/sh
# Mount virtual filesystems
mount -t proc proc /proc
mount -t sysfs sysfs /sys
mount -t devtmpfs devtmpfs /dev
mkdir -p /dev/pts /dev/shm
mount -t devpts devpts /dev/pts
mount -t tmpfs tmpfs /dev/shm
mount -t tmpfs tmpfs /tmp

# Start udev (device manager — creates device nodes in /dev)
/sbin/udevd --daemon
udevadm trigger --action=add
udevadm settle

# Set hostname
hostname $(cat /etc/hostname)

# Mount remaining filesystems from /etc/fstab
mount -a

# Set system clock
hwclock --hctosys
```

#### udev: Why It Matters

udev is the device manager. When the kernel detects hardware (GPU, keyboard, mouse, USB), it sends events to udev, which creates the device nodes in `/dev/`. Without udev:
- No `/dev/dri/card0` → Xorg can't talk to the GPU
- No `/dev/input/event*` → no keyboard or mouse input
- No `/dev/fuse` → GVfs FUSE mounts won't work

Build eudev (the standalone fork):

```bash
git clone https://github.com/eudev-project/eudev.git -b v3.2.14
cd eudev
./autogen.sh
./configure --prefix=$PREFIX
make && make install
cd ..
```

### Step 4: Init → D-Bus System Bus

D-Bus is the IPC backbone. Almost every GNOME component communicates through it. The system bus must start before any desktop services.

Create the init script `/etc/init.d/dbus`:

```bash
#!/bin/sh
### BEGIN INIT INFO
# Provides:          dbus
# Required-Start:    $local_fs $remote_fs
# Default-Start:     2 3 5
# Description:       D-Bus system message bus
### END INIT INFO

DAEMON=$PREFIX/bin/dbus-daemon
PIDFILE=/var/run/dbus/pid

case "$1" in
  start)
    echo "Starting D-Bus system bus..."
    mkdir -p /var/run/dbus
    $DAEMON --system
    ;;
  stop)
    echo "Stopping D-Bus system bus..."
    kill $(cat $PIDFILE)
    ;;
  *)
    echo "Usage: $0 {start|stop}"
    exit 1
    ;;
esac
```

```bash
chmod +x /etc/init.d/dbus
ln -s ../init.d/dbus /etc/rc5.d/S20dbus
```

The `S20` prefix means "start at priority 20" — lower numbers start first.

### Step 5: Init → System Daemons (polkit, UPower, UDisks2)

These daemons register on the D-Bus system bus and provide services that GNOME needs:

```bash
# /etc/init.d/system-daemons
#!/bin/sh
case "$1" in
  start)
    echo "Starting polkitd..."
    $PREFIX/lib/polkit-1/polkitd --no-debug &

    echo "Starting UPower..."
    $PREFIX/libexec/upowerd &

    echo "Starting UDisks2..."
    $PREFIX/libexec/udisks2/udisksd --no-debug &

    echo "Starting accounts-daemon..."
    $PREFIX/libexec/accounts-daemon &
    ;;
  stop)
    killall polkitd upowerd udisksd accounts-daemon
    ;;
esac
```

```bash
chmod +x /etc/init.d/system-daemons
ln -s ../init.d/system-daemons /etc/rc5.d/S30system-daemons
```

### Step 6: Init → Display Manager (GDM)

GDM is the bridge between the init system and the graphical session. When init starts GDM:

1. GDM launches Xorg (or Xwayland) as root
2. Xorg initializes the GPU via DRM, sets the display mode, and starts listening for input
3. GDM renders the login greeter on the X display
4. User enters credentials → GDM authenticates via PAM
5. GDM starts a user session

Create `/etc/init.d/gdm`:

```bash
#!/bin/sh
### BEGIN INIT INFO
# Provides:          gdm
# Required-Start:    dbus system-daemons
# Default-Start:     5
# Description:       GNOME Display Manager
### END INIT INFO

case "$1" in
  start)
    echo "Starting GDM..."
    $PREFIX/sbin/gdm &
    ;;
  stop)
    echo "Stopping GDM..."
    killall gdm
    ;;
esac
```

```bash
chmod +x /etc/init.d/gdm
ln -s ../init.d/gdm /etc/rc5.d/S99gdm
```

`S99` — GDM starts last, after all services it depends on.

### Step 7: GDM → Xorg → GNOME Session

When GDM starts Xorg, here's the detailed handoff:

```
GDM (PID 1's child)
  │
  ├─ Forks Xorg process
  │    ├─ Opens /dev/dri/card0 (GPU via kernel DRM)
  │    ├─ Loads input drivers (libinput → /dev/input/event*)
  │    ├─ Sets display resolution via KMS (Kernel Mode Setting)
  │    └─ Listens on DISPLAY=:0 (Unix socket /tmp/.X11-unix/X0)
  │
  ├─ Renders greeter on :0
  │
  └─ On successful login:
       ├─ Sets up user environment (HOME, PATH, XDG_* variables)
       ├─ Starts D-Bus session bus (per-user)
       ├─ Executes gnome-session --session=gnome
       │    │
       │    ├─ Reads /usr/share/gnome-session/sessions/gnome.session
       │    ├─ Starts required components:
       │    │    ├─ org.gnome.Shell (Mutter + GNOME Shell)
       │    │    │    ├─ Mutter connects to Xorg via DISPLAY
       │    │    │    ├─ Mutter becomes the compositing window manager
       │    │    │    ├─ GNOME Shell renders the desktop (panel, dash, overview)
       │    │    │    └─ Uses OpenGL (Mesa → DRM → GPU)
       │    │    │
       │    │    ├─ org.gnome.SettingsDaemon (manages themes, input, power)
       │    │    ├─ org.gnome.Keyring (secrets and SSH agent)
       │    │    └─ GVfs daemons (virtual filesystem mounts)
       │    │
       │    └─ Session is now ready — user sees the desktop
       │
       └─ Nautilus, Terminal, etc. launched by user
```

### Step 8: Without GDM (Manual startx Flow)

If you don't want a display manager, the flow is simpler but manual:

```
Login on tty1 (agetty → /bin/login → shell)
  └─► User runs: startx
        └─► xinit reads ~/.xinitrc
              ├─ Starts Xorg in background
              └─ Executes gnome-session
                    └─ (same as above from gnome-session onward)
```

The `.xinitrc` we created earlier handles this:

```bash
#!/bin/sh
source ~/desktop-env.sh

# Start D-Bus session bus (since GDM isn't doing it for us)
eval $(dbus-launch --sh-syntax)

# Start GVfs daemon
$PREFIX/libexec/gvfsd &

# Launch GNOME
exec gnome-session --session=gnome
```

### The Complete Init Script Dependency Chain

```
/etc/rc5.d/
  S01mountvirtfs    → mount /proc, /sys, /dev, /dev/pts, /dev/shm, /tmp
  S05udev           → start udevd, trigger device events, wait for settle
  S10networking     → bring up lo and eth0/wlan0
  S20dbus           → start D-Bus system bus
  S30system-daemons → polkitd, upowerd, udisksd, accounts-daemon
  S99gdm            → start GDM → Xorg → GNOME session
```

Each `S` script runs in numeric order. If any step fails, everything after it breaks:
- No udev → no `/dev/dri/card0` → Xorg fails
- No D-Bus → polkit, UPower, GDM all fail
- No polkit → GNOME can't perform privileged operations (mount disks, suspend, etc.)

### Kernel Parameters That Affect the GUI

These kernel command-line parameters (set in your bootloader) influence the graphical boot:

```
# Force a specific video mode
video=1920x1080@60

# Quiet boot (suppress kernel messages before GUI)
quiet

# Use a specific console for kernel messages
console=tty1

# Force DRM driver for a specific GPU
i915.modeset=1          # Intel
amdgpu.modeset=1        # AMD
nouveau.modeset=1       # NVIDIA (open source)

# Disable GPU driver (fallback to framebuffer)
nomodeset                # Use only if DRM is broken
```

## The Full Dependency Graph

Here's a simplified view of how everything connects:

```
┌─────────────────────────────────────────────────────┐
│                    GNOME Shell                       │
│              (gnome-shell, gnome-session)            │
├──────────────┬──────────────┬───────────────────────┤
│   Nautilus   │    Mutter    │    GNOME Settings      │
│  (GVfs/FUSE) │ (compositor) │                        │
├──────────────┴──────┬───────┴───────────────────────┤
│        GTK 4        │        libadwaita              │
├─────────────────────┴───────────────────────────────┤
│  Cairo  │  Pango  │  GdkPixbuf  │  at-spi2-core     │
├─────────┴─────────┴─────────────┴───────────────────┤
│                      GLib                            │
├─────────────────────────────────────────────────────┤
│  D-Bus  │  polkit  │  UPower  │  UDisks2             │
├─────────┴──────────┴──────────┴─────────────────────┤
│              Xorg Server + Mesa (OpenGL)              │
├──────────────┬──────────────┬───────────────────────┤
│   libX11     │   libxcb     │   pixman               │
│   libXi      │   libXrandr  │   libdrm               │
├──────────────┴──────────────┴───────────────────────┤
│              Linux Kernel (DRM, evdev, FUSE)          │
└─────────────────────────────────────────────────────┘
```

## Troubleshooting

### "No screens found" from Xorg

- Check that your kernel has DRM support for your GPU: `ls /dev/dri/`
- Verify Mesa was built with the right gallium driver
- Check Xorg log: `cat /var/log/Xorg.0.log | grep -E "EE|WW"`
- Try the `modesetting` driver instead of a GPU-specific one

### GNOME Shell crashes on launch

- Verify OpenGL works: `glxinfo | grep "OpenGL renderer"`
- If it says `llvmpipe`, you're using software rendering — check your GPU driver
- Check `~/.local/share/gnome-shell/` for crash logs
- Run with debug output: `MUTTER_DEBUG=1 gnome-shell --replace`

### GVfs mounts not appearing in Nautilus

- Verify D-Bus is running: `echo $DBUS_SESSION_BUS_ADDRESS`
- Check that GVfs daemons are installed: `ls $PREFIX/libexec/gvfsd*`
- Verify FUSE is working: `ls /dev/fuse`
- Check GVfs logs: `G_MESSAGES_DEBUG=all gvfsd`

### Missing schemas or icons

```bash
# Recompile GSettings schemas
glib-compile-schemas $PREFIX/share/glib-2.0/schemas/

# Update icon cache
gtk4-update-icon-cache $PREFIX/share/icons/hicolor/

# Update desktop database
update-desktop-database $PREFIX/share/applications/
```

### pkg-config can't find a library

```bash
# Verify your PKG_CONFIG_PATH includes the right directories
echo $PKG_CONFIG_PATH

# Check if the .pc file exists
find $PREFIX -name "*.pc" | grep <library-name>

# If it's in lib64 instead of lib, make sure both are in PKG_CONFIG_PATH
```

## Best Practices

### Build Order Discipline

- Always build dependencies before dependents — there's no package manager to resolve this for you
- Keep a build log documenting the exact order and versions you used
- Use a script to automate the full build so it's reproducible

### Version Pinning

- Pin every component to a specific release tag, not `main` or `master`
- GNOME components should all be from the same release cycle (e.g., all 46.x)
- Mixing versions across GNOME releases will cause ABI mismatches and crashes

### Isolation

- Use a dedicated `$PREFIX` to avoid polluting your host system
- Never install to `/usr` — that's your host distro's territory
- If something breaks, you can `rm -rf $PREFIX` and start over without affecting the base system

### Incremental Builds

- Meson and Ninja support incremental builds — if you change one library, you only need to rebuild it and its dependents
- Keep your source trees around; don't delete them after building
- Use `ninja -C build install` to rebuild and reinstall after changes

### Documentation

- Keep a `BUILD_ORDER.txt` listing every component, version, and configure flags
- This becomes your personal "Linux From Scratch" recipe
- Future you will thank present you when something needs rebuilding

## Wrapping Up

Building a full GNOME desktop from source is one of the most thorough ways to understand how a Linux graphical environment works. The kernel provides DRM and input handling, Mesa translates GPU commands to OpenGL, Xorg manages the display, and GNOME layers a full desktop on top with GTK, Mutter, and GVfs tying it all together. It's a lot of moving parts, but each one has a clear role, and building them yourself makes that architecture tangible.
