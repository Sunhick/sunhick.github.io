---
title: "YubiKey 5C Modules: Functionalities and How to Secure Them"
date: 2026-04-10 12:00:00 -0700
categories: [Security]
tags: [yubikey, hardware-security, authentication, fido2, openpgp]
---

The YubiKey 5C is a USB-C hardware security key from Yubico that packs multiple cryptographic modules into a single device. Each module serves a distinct purpose, and understanding them is key to getting the most out of your YubiKey while keeping it locked down.

## Modules Overview

The YubiKey 5C ships with several independent applets (modules), each implementing a different protocol or standard.

### FIDO2 / WebAuthn

FIDO2 is the modern passwordless authentication standard. The YubiKey 5C supports both FIDO2 and the older FIDO U2F protocol.

- Enables passwordless login and strong second-factor authentication
- Works with any site or service that supports WebAuthn (GitHub, Google, Microsoft, AWS, etc.)
- Supports resident keys (discoverable credentials) for truly passwordless flows
- Backed by on-device ECDSA (P-256) key generation — private keys never leave the device

### PIV (Personal Identity Verification)

The PIV module turns the YubiKey into a smart card compliant with NIST SP 800-73.

- Supports RSA 2048/3072/4096 and ECC P-256/P-384 key pairs
- Provides four standard key slots: Authentication (9a), Digital Signature (9c), Key Management (9d), and Card Authentication (9e)
- Up to 20 additional retired key slots for key history
- Used for SSH authentication, S/MIME email signing/encryption, Windows smart card login, and client certificate auth

### OpenPGP

The OpenPGP applet implements the OpenPGP smart card specification (v3.4).

- Stores up to three PGP keys: Signing, Encryption, and Authentication
- Supports RSA up to 4096-bit and ECC (curve25519, NIST curves)
- Integrates with GnuPG for git commit signing, email encryption, and SSH via `gpg-agent`
- Key operations happen on-device — the private key material is never exposed to the host

### OTP (One-Time Password)

The YubiKey 5C has two OTP slots, each configurable independently.

- Yubico OTP — a 44-character one-time password validated against Yubico's cloud or a self-hosted server
- HMAC-SHA1 Challenge-Response — useful for offline authentication (e.g., KeePassXC database unlock)
- Static Password — stores a fixed string (up to 38 characters) that the key "types" when triggered
- OATH-HOTP — counter-based one-time passwords

### OATH (TOTP/HOTP)

A separate OATH applet stores up to 32 OATH credentials.

- Supports TOTP (time-based) and HOTP (counter-based) codes
- Managed via the Yubico Authenticator app
- Replaces phone-based authenticator apps with a hardware-bound alternative

## Securing Your YubiKey 5C

Out of the box, the YubiKey ships with default PINs and no lock-down. Here's how to harden each module.

### Set and Change Default PINs

Each module has its own PIN/password. Change them all from the defaults immediately.

| Module | Default PIN | Default Admin/PUK |
|--------|------------|-------------------|
| FIDO2 | None (no PIN set) | N/A |
| PIV | `123456` | PUK: `12345678`, Management Key: `010203...` (48 hex chars) |
| OpenPGP | `123456` | Admin PIN: `12345678` |

```bash
# Set FIDO2 PIN (via ykman)
ykman fido access change-pin --new-pin <YOUR_PIN>

# Change PIV PIN and PUK
ykman piv access change-pin -P 123456 -n <NEW_PIN>
ykman piv access change-puk -p 12345678 -n <NEW_PUK>

# Change PIV management key (use a random 24-byte hex key)
ykman piv access change-management-key

# Change OpenPGP PINs
ykman openpgp access change-pin
ykman openpgp access change-admin-pin
```

### Lock Down the Configuration

Prevent accidental or malicious reconfiguration of the OTP slots:

```bash
# Lock the YubiKey configuration with an access code
ykman otp settings --new-access-code <HEX_CODE>
```

### Disable Unused Modules

If you only use FIDO2 and PIV, disable the rest to reduce your attack surface:

```bash
# List enabled applications
ykman config usb --list

# Disable OTP over USB
ykman config usb --disable OTP

# Disable OpenPGP over NFC (if not needed)
ykman config nfc --disable OPENPGP
```

### Restrict FIDO2 with a PIN

Always set a FIDO2 PIN. Without one, anyone with physical access to the key can authenticate:

```bash
ykman fido access change-pin
```

For higher assurance, enable the `alwaysUv` (always require user verification) policy:

```bash
ykman fido config toggle-always-uv
```

### Protect PIV with PIN Policy and Touch Policy

When generating or importing PIV keys, enforce PIN entry and physical touch per operation:

```bash
# Generate a key requiring PIN + touch for every use
ykman piv keys generate \
  --algorithm ECCP256 \
  --pin-policy ALWAYS \
  --touch-policy ALWAYS \
  9a public.pem
```

Pin policy options: `NEVER`, `ONCE`, `ALWAYS`, `MATCH_ONCE`, `MATCH_ALWAYS`
Touch policy options: `NEVER`, `ALWAYS`, `CACHED`

### Lock Down OpenPGP

- Set retry counters to a low value (e.g., 3 attempts) to limit brute-force attempts
- Enable touch requirement for key operations via `ykman openpgp keys set-touch`

```bash
# Require touch for signing operations
ykman openpgp keys set-touch sig on

# Require touch for encryption
ykman openpgp keys set-touch enc on

# Require touch for authentication
ykman openpgp keys set-touch aut on
```

### Physical Security

No amount of software configuration helps if someone walks off with your key.

- Keep a backup YubiKey enrolled in all your accounts and stored securely (e.g., a safe)
- Register multiple keys per service so you're not locked out if one is lost
- Use a keychain or lanyard to keep the key on your person
- If a key is lost or stolen, immediately revoke it from all enrolled services

## Quick Reference: ykman Commands

```bash
ykman info                          # Device info and firmware version
ykman config usb --list             # List enabled USB applications
ykman config nfc --list             # List enabled NFC applications
ykman fido info                     # FIDO2 module status
ykman piv info                      # PIV module status
ykman openpgp info                  # OpenPGP module status
ykman oath accounts list            # List stored OATH credentials
ykman otp info                      # OTP slot configuration
```

## Best Practices

### Enrollment and Lifecycle

- Register at least two YubiKeys per account — a primary and a backup stored in a secure location (safe, lockbox)
- Document which services each key is enrolled in; keep this inventory updated
- When onboarding a new key, enroll it across all your services in one session to avoid partial coverage
- Periodically audit your enrolled services and remove stale or unused credentials

### PIN and Secret Management

- Use unique, strong PINs for each module — don't reuse PINs across FIDO2, PIV, and OpenPGP
- Never write PINs on or near the key itself
- Store PINs in a password manager, not in plaintext files
- Change the PIV management key from the default to a randomly generated 24-byte value and store it securely
- Set PUK (PIN Unblock Key) to something strong — it's your recovery path if you lock yourself out

### Key Generation

- Always generate keys on-device rather than importing them — this ensures private key material never exists outside the YubiKey
- Prefer ECC (P-256 or P-384 for PIV, curve25519 for OpenPGP) over RSA for better performance and equivalent security
- For OpenPGP, use separate subkeys for signing, encryption, and authentication rather than a single key for all purposes
- Set key expiration dates on OpenPGP keys and rotate them periodically

### Access Policies

- Enable touch policy (`ALWAYS` or `CACHED`) on all PIV slots to prevent silent key use by malware
- Set PIN policy to `ALWAYS` for high-value operations (code signing, SSH to production)
- Use `CACHED` touch policy for frequent operations where `ALWAYS` would be disruptive (e.g., git commit signing)
- Enable `alwaysUv` on FIDO2 so user verification is required for every assertion, not just registration

### Operational Security

- Never leave your YubiKey plugged in when unattended — remove it when stepping away
- Disable NFC entirely if you only use USB-C, to eliminate a wireless attack vector
- Disable modules you don't use to minimize attack surface
- Keep `ykman` (YubiKey Manager) updated to get the latest security fixes and features
- Avoid using the static password OTP slot — it offers no replay protection and is the weakest module

### Firmware and Supply Chain

- Purchase YubiKeys only from Yubico directly or authorized resellers
- Verify the device attestation certificate after receiving a new key to confirm authenticity
- Note that YubiKey firmware cannot be updated — this is by design to prevent tampering, but it means you should replace keys if critical vulnerabilities are found in your firmware version

### Recovery Planning

- Have a documented recovery plan for lost or compromised keys
- Store backup recovery codes for FIDO2-enrolled services in your password manager
- If a key is lost or stolen, revoke it from all services immediately — don't wait
- Test your backup key periodically to confirm it still works across all enrolled services

### Developer-Specific Tips

- Use the PIV module or OpenPGP authentication subkey for SSH instead of file-based keys
- Sign git commits with the OpenPGP module — configure `gpg-agent` with `enable-ssh-support` to also handle SSH through the same key
- For CI/CD systems that need hardware key attestation, use PIV attestation certificates to prove keys were generated on-device
- When using the OATH module as a TOTP replacement, pair it with Yubico Authenticator on a single trusted workstation

## Wrapping Up

The YubiKey 5C is a versatile device, but its security is only as strong as its configuration. Change the defaults, disable what you don't use, enforce PINs and touch policies, and always have a backup key. A few minutes of setup goes a long way toward keeping your accounts and keys safe.
