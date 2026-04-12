---
title: "YubiKey PINs, Credentials, and Lockout Behavior: A Complete Reference"
date: 2026-04-12 10:00:00 -0700
categories: [Security]
tags: [yubikey, hardware-security, authentication, fido2, openpgp, piv]
---

Every module on a YubiKey has its own PIN, its own retry limit, and its own consequences when you get it wrong too many times. Some lock you out of a single function. Others wipe the entire module. This post is a reference for all of it — what protects what, what the defaults are, and what happens when things go sideways.

If you haven't read the overview of YubiKey 5C modules and how to secure them, start [there](/posts/yubikey-5c-modules-functionalities-and-how-to-secure-them/) first.

## Module PINs and Lockout Behavior

Each module on the YubiKey operates independently. A lockout on one module doesn't affect the others.

| Module | Common Use Case | PIN/Credential Type | Default Value | Retry Limit | Lockout / Failure Result |
|--------|----------------|--------------------|--------------:|:-----------:|--------------------------|
| FIDO2 | Passwordless (Passkeys), WebAuthn | User PIN | None (set on first use) | 8 attempts | Resets FIDO module; wipes all resident keys (Passkeys) |
| PIV (Smart Card) | Windows/macOS Login, SSH, PKCS#11 | User PIN | `123456` | 3 attempts (up to 15) | PIN blocks. Requires PUK to unblock |
| PIV (Unblocking) | Unlocking a blocked PIV PIN | PUK | `12345678` | 3 attempts | PIV module locks; requires full reset (wipes certs) |
| OpenPGP | GPG Encryption, Signed Commits, SSH | User PIN | `123456` | 3 attempts | PIN blocks. Requires Admin PIN to unblock |
| OpenPGP (Admin) | Managing PGP keys/settings | Admin PIN | `12345678` | 3 attempts | OpenPGP module locks; requires full reset |
| OATH | TOTP (Google Authenticator-style codes) | Session Password | None | N/A | Secured via Yubico Authenticator; no hardware wipe |
| FIDO U2F | Legacy Two-Factor (2FA) | None | N/A | N/A | Secured via physical touch only |
| OTP | Yubico OTP, Static Passwords | None | N/A | N/A | Secured via physical touch (Slot 1 or 2) |

A few things worth calling out:

- FIDO2 is the most aggressive — exhaust the PIN retries and the entire FIDO module resets, destroying all resident keys. There's no PUK or admin recovery path. You re-enroll from scratch.
- PIV has a two-tier recovery model. Block the PIN, use the PUK to unblock it. Block the PUK, and the PIV module is bricked until you do a full reset (which wipes all certificates and keys).
- OpenPGP mirrors the PIV pattern. The Admin PIN unblocks the User PIN. But if you exhaust the Admin PIN retries, the OpenPGP applet locks and requires a full reset.
- OATH, FIDO U2F, and OTP don't have PIN-based lockout at all. OATH relies on the Yubico Authenticator app for access control. U2F and OTP rely purely on physical touch.

## Management Keys and Access Controls

Beyond user-facing PINs, the YubiKey has several administrative credentials that control device configuration and key management operations.

| Control Type | Applies To | Purpose | Format |
|-------------|-----------|---------|--------|
| Management Key | PIV (Smart Card) | Authenticates admin actions like generating key pairs, importing certificates, or changing PIN retry limits | 24-byte hex string (3DES) or 16/32-byte (AES) |
| Configuration Lock | Whole Device | Prevents changing which apps are enabled (e.g., disabling NFC) or modifying overall device info | 16-byte hex value |
| OTP Access Code | OTP Slots 1 & 2 | Prevents unauthorized overwriting or reading of the configuration in your two OTP slots | 6-byte hex value |
| Reset PIN | PIV / OpenPGP | Not a separate key — refers to the PUK (PIV) or Admin PIN (OpenPGP) used to unblock a blocked user PIN | Numeric (usually 6-8 digits) |

### PIV Management Key

The PIV management key is the most important administrative credential on the device. It gates all privileged PIV operations:

- Generating or importing key pairs
- Importing certificates
- Changing PIN/PUK retry limits
- Resetting the PIN retry counter

The default is a well-known 3DES key (`010203040506070801020304050607080102030405060708`). Change it immediately.

```bash
# Change to a randomly generated management key
ykman piv access change-management-key

# Or specify the algorithm (AES-256 recommended on firmware 5.4+)
ykman piv access change-management-key --algorithm AES256
```

You can also protect the management key with the PIN, so you don't have to store a separate 24-byte hex value:

```bash
# Derive management key from PIN (PIN-protected management key)
ykman piv access change-management-key --protect
```

With `--protect`, the management key is stored on the YubiKey encrypted under the PIN. You authenticate with just the PIN for admin operations. This is convenient but means a compromised PIN grants full PIV admin access.

### Configuration Lock

The configuration lock prevents changes to the device-level settings — which modules are enabled over USB and NFC, device info, etc.

```bash
# Set a configuration lock code
ykman config set-lock-code --new-lock-code <32_HEX_CHARS>

# Remove the lock code
ykman config set-lock-code --clear
```

Once set, any `ykman config` command that modifies the device requires the lock code. This is useful in enterprise deployments where you don't want users disabling modules.

### OTP Access Code

Each OTP slot can be protected with a 6-byte access code. Without it, anyone with `ykman` can overwrite your OTP slot configuration.

```bash
# Set an access code on slot 1
ykman otp settings --new-access-code <12_HEX_CHARS> 1

# Reconfigure a protected slot (requires the current access code)
ykman otp settings --access-code <CURRENT_CODE> --new-access-code <NEW_CODE> 1
```

## Lockout Recovery Paths

When you hit a lockout, the recovery path depends on which module and which credential is blocked.

### FIDO2 PIN Blocked

No recovery. The FIDO2 module resets automatically after 8 consecutive failures, wiping all resident keys and discoverable credentials.

```bash
# After lockout, you can set a new PIN on the now-empty module
ykman fido access change-pin
```

You'll need to re-enroll the key with every service that used FIDO2 credentials.

### PIV PIN Blocked

Use the PUK to unblock:

```bash
ykman piv access unblock-pin -p <PUK> -n <NEW_PIN>
```

If the PUK is also blocked, the only option is a full PIV reset:

```bash
# WARNING: This wipes all PIV keys and certificates
ykman piv reset
```

### OpenPGP PIN Blocked

Use the Admin PIN to unblock:

```bash
# Via ykman
ykman openpgp access unblock-pin -a <ADMIN_PIN> -n <NEW_PIN>

# Or via gpg
gpg --card-edit
> admin
> passwd
# Select "unblock PIN"
```

If the Admin PIN is also blocked, full reset:

```bash
# WARNING: This wipes all OpenPGP keys
ykman openpgp reset
```

### Full Device Reset

If you need to start completely fresh across all modules:

```bash
ykman fido reset
ykman piv reset
ykman openpgp reset
ykman oath reset
ykman otp delete 1
ykman otp delete 2
```

There's no single "factory reset" command. Each module resets independently.

## Retry Counter Configuration

Some modules let you customize the number of PIN retries before lockout.

### PIV

PIV retry counters are configurable between 1 and 15 for both PIN and PUK. Requires the management key.

```bash
# Set PIN retries to 5, PUK retries to 5
ykman piv access set-retries 5 5
```

This resets both the PIN and PUK to their defaults (`123456` and `12345678`), so change them again immediately after.

### OpenPGP

OpenPGP retry counters are set via the admin interface. The default is 3 for both User PIN and Admin PIN.

```bash
# Set retry counters: user PIN, reset code, admin PIN
ykman openpgp access set-retries 3 3 3
```

### FIDO2

The FIDO2 retry limit is fixed at 8 and cannot be changed. This is part of the CTAP2 specification.

## Practical Recommendations

- Change every default PIN and management key before using the device for anything real. The defaults are publicly documented.
- Store your PUK, Admin PIN, and management key in a password manager — not on a sticky note, not in a plaintext file.
- Use different PINs for each module. If your PIV PIN is compromised, it shouldn't also unlock your OpenPGP keys.
- Set PIV retry counters to something reasonable — 5 is a good balance between security and fat-finger tolerance. The default of 3 is tight.
- Keep a backup YubiKey enrolled in all services. A FIDO2 lockout wipes your passkeys with no recovery. A backup key is your safety net.
- Test your recovery path. Block a PIN on a test key intentionally and walk through the unblock process so you know it works before you need it under pressure.

## Quick Reference: Checking Current State

```bash
# See retry counters and PIN status for each module
ykman fido info          # Shows PIN set status and retries remaining
ykman piv info           # Shows PIN/PUK retries remaining
ykman openpgp info       # Shows PIN/Admin PIN retries remaining
ykman oath info          # Shows if password is set
ykman otp info           # Shows slot configuration
ykman info               # Overall device info, serial, firmware, enabled apps
```

## Wrapping Up

The YubiKey's multi-module design means there's no single PIN that rules them all. Each module has its own credentials, its own retry limits, and its own failure modes. Knowing the lockout behavior before you hit it is the difference between a minor inconvenience and re-enrolling a key across every service you own.

