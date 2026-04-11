---
title: "Advanced YubiKey 5C: PIV, FIDO2 Resident Keys, Attestation, and Multi-Machine Workflows"
date: 2026-04-10 16:00:00 -0700
categories: [Security]
tags: [yubikey, piv, fido2, attestation, ssh, advanced]
---

The [first post](/posts/yubikey-5c-modules/) covered the YubiKey 5C modules and basic hardening. The [GPG post](/posts/gpg-keys-and-yubikey/) walked through subkeys and OpenPGP integration. This post goes deeper — PIV-based SSH and TLS, FIDO2 resident keys, device attestation, HMAC challenge-response, multi-machine workflows, and scripting with `ykman`.

## PIV-Based SSH Authentication

The OpenPGP approach to SSH (via `gpg-agent`) works well, but PIV offers an alternative that integrates directly with OpenSSH without needing GPG at all. Since OpenSSH 8.2, PKCS#11 and FIDO2 are natively supported.

### Generate a PIV Key for SSH

```bash
# Generate an ECC P-256 key in the Authentication slot (9a)
# PIN required every time, touch required every time
ykman piv keys generate \
  --algorithm ECCP256 \
  --pin-policy ALWAYS \
  --touch-policy ALWAYS \
  9a pubkey.pem

# Create a self-signed certificate (required by PIV spec)
ykman piv certificates generate \
  --subject "CN=SSH Key" \
  --valid-days 730 \
  9a pubkey.pem
```

### Use PIV with SSH via PKCS#11

```bash
# Extract the SSH public key from the PIV slot
ssh-keygen -D /usr/local/lib/libykcs11.dylib -e

# Add to your SSH config (~/.ssh/config)
# Host *
#   PKCS11Provider /usr/local/lib/libykcs11.dylib

# Or specify per-connection
ssh -I /usr/local/lib/libykcs11.dylib user@host
```

The library path varies by OS:
- macOS (Homebrew): `/usr/local/lib/libykcs11.dylib` or `/opt/homebrew/lib/libykcs11.dylib`
- Linux: `/usr/lib/x86_64-linux-gnu/libykcs11.so`

### PIV vs OpenPGP for SSH

| Aspect | PIV (PKCS#11) | OpenPGP (gpg-agent) |
|--------|--------------|---------------------|
| SSH integration | Native via PKCS#11 | Requires gpg-agent as SSH agent |
| Key algorithms | RSA, ECC P-256/P-384 | RSA, ECC ed25519/cv25519 |
| Touch policy | Per-slot, set at key generation | Per-key, changeable after |
| PIN caching | Controlled by PIN policy | Controlled by gpg-agent TTL |
| Additional software | libykcs11 only | Full GnuPG stack |
| Key slots | 24 slots available | 3 slots (sig, enc, auth) |

Choose PIV if you want a lighter stack. Choose OpenPGP if you also need signing and encryption through GPG.

## PIV for Client Certificate Authentication (mTLS)

PIV keys aren't just for SSH. They work anywhere PKCS#11 is supported, including mutual TLS.

### Generate a CSR from the YubiKey

```bash
# Generate key in the Digital Signature slot (9c)
ykman piv keys generate \
  --algorithm ECCP384 \
  --pin-policy ALWAYS \
  --touch-policy ALWAYS \
  9c pubkey-9c.pem

# Generate a CSR (signed on-device)
ykman piv certificates request \
  --subject "CN=yourname,O=YourOrg" \
  9c pubkey-9c.pem csr.pem
```

Send `csr.pem` to your CA. When you get the signed certificate back:

```bash
# Import the signed certificate
ykman piv certificates import 9c signed-cert.pem
```

Now any application that supports PKCS#11 can use this for mTLS — curl, browsers (via security module), custom applications.

```bash
# curl with YubiKey-backed client cert
curl --cert-type P11 \
  --cert "pkcs11:manufacturer=Yubico" \
  https://mtls.example.com/api
```

## FIDO2 Resident Keys (Discoverable Credentials)

Standard FIDO2 credentials are server-side discoverable — the relying party sends a credential ID and the YubiKey uses it to locate the key. Resident keys flip this: the credential is stored on the YubiKey itself, enabling truly passwordless flows where the user doesn't even need to provide a username.

### How Resident Keys Work

1. During registration, the relying party requests a resident key (discoverable credential)
2. The YubiKey stores the credential internally (limited to ~25 resident keys on the 5C)
3. During authentication, the YubiKey can enumerate stored credentials for a given relying party
4. The user selects their identity and authenticates — no username, no password

### Managing Resident Keys

```bash
# List all stored resident keys
ykman fido credentials list

# Delete a specific credential
ykman fido credentials delete <credential-id>
```

### FIDO2 SSH Keys (OpenSSH 8.2+)

OpenSSH supports FIDO2 natively with `ed25519-sk` and `ecdsa-sk` key types. Resident keys make these portable across machines.

```bash
# Generate a resident FIDO2 SSH key
ssh-keygen -t ed25519-sk -O resident -O verify-required -O application=ssh:personal

# The key is stored on the YubiKey
# -O resident: store on device (discoverable)
# -O verify-required: require PIN + touch
# -O application: label to distinguish multiple SSH keys
```

On a new machine, pull the key from the YubiKey:

```bash
# Import resident keys from the YubiKey into ~/.ssh/
ssh-keygen -K

# This creates id_ed25519_sk and id_ed25519_sk.pub
```

This is the simplest way to have portable SSH keys across machines without copying private key files.

### Resident Key Capacity Planning

The YubiKey 5C stores approximately 25 resident keys. Plan accordingly:

- Use resident keys only for services where passwordless is essential
- Use non-resident FIDO2 for services where you can provide a username
- Track your resident key inventory with `ykman fido credentials list`
- Delete credentials for services you no longer use

## Device Attestation

Attestation lets you cryptographically prove that a key was generated on a genuine YubiKey, not in software. This is valuable for enterprise environments and zero-trust architectures.

### PIV Attestation

Every YubiKey ships with a factory-installed attestation certificate signed by Yubico's CA. When you generate a key in a PIV slot, you can get an attestation certificate proving it was generated on-device.

```bash
# Generate attestation for the key in slot 9a
ykman piv keys attest 9a attestation-9a.pem

# View the attestation certificate
openssl x509 -in attestation-9a.pem -text -noout

# Get the intermediate (device) attestation certificate
ykman piv certificates export f9 intermediate.pem
```

To verify the chain:

```bash
# Download Yubico's PIV root CA
curl -o yubico-piv-ca.pem https://developers.yubico.com/PIV/Introduction/piv-attestation-ca.pem

# Verify the chain: root -> intermediate -> attestation
openssl verify -CAfile yubico-piv-ca.pem \
  -untrusted intermediate.pem \
  attestation-9a.pem
```

The attestation certificate contains:
- The public key that was generated
- The YubiKey serial number
- The firmware version
- The PIN and touch policies set at generation time

### FIDO2 Attestation

FIDO2 attestation happens automatically during registration. The relying party receives an attestation statement proving the credential was created on a certified authenticator. This is handled by the WebAuthn protocol — no manual steps needed.

Enterprise environments can use attestation to enforce that only hardware keys (not software authenticators) are registered.

## HMAC-SHA1 Challenge-Response

The OTP module's HMAC-SHA1 challenge-response mode is useful for offline scenarios where you need hardware-bound authentication without a network.

### KeePassXC Integration

The most common use case: locking your password database with a YubiKey challenge-response in addition to a passphrase.

```bash
# Configure slot 2 for HMAC-SHA1 challenge-response
ykman otp chalresp --touch --generate 2
```

In KeePassXC:
1. Create or open a database
2. Go to Database → Database Security
3. Add "Key File or YubiKey Challenge-Response"
4. Select your YubiKey and slot 2

Now opening the database requires both your passphrase and the YubiKey. The challenge-response is computed on-device — the secret never leaves the hardware.

### Setting Up on a Backup YubiKey

The HMAC secret must be identical on both keys for KeePassXC to work with either one:

```bash
# Program the same secret on both keys
# First, generate a 20-byte hex secret
SECRET=$(openssl rand -hex 20)

# Program slot 2 on the primary key
ykman otp chalresp --touch 2 $SECRET

# Program slot 2 on the backup key
ykman otp chalresp --touch 2 $SECRET

# Clear the secret from your shell history
unset SECRET
history -c
```

## Multi-Machine Workflows

Using a YubiKey across multiple machines requires some planning, especially when different modules have different portability characteristics.

### FIDO2: Zero Setup on New Machines

FIDO2 credentials are the most portable — plug in the YubiKey and authenticate. No drivers, no configuration, no key import. This is why FIDO2 is the preferred method for web service authentication.

For FIDO2 SSH with resident keys:

```bash
# On any new machine, just run:
ssh-keygen -K
# Your SSH keys are now available locally
```

### PIV: Requires PKCS#11 Library

Each machine needs the PKCS#11 library installed:

```bash
# macOS
brew install yubico-piv-tool

# Ubuntu/Debian
sudo apt install ykcs11

# Add to SSH config once per machine
echo 'PKCS11Provider /path/to/libykcs11.so' >> ~/.ssh/config
```

### OpenPGP: Requires GPG Keyring Setup

Each machine needs your public key imported and the card stubs set up:

```bash
# Import your public key
gpg --import public-key.asc

# Or fetch from a keyserver
gpg --recv-keys $KEYID

# Tell GPG to learn the card
gpg --card-status

# Verify stubs are in place
gpg -K
# Should show ssb> for all subkeys
```

### Switching Between YubiKeys on the Same Machine

When you swap between a primary and backup YubiKey (both holding the same keys):

```bash
# For OpenPGP
gpg-connect-agent "scd serialno" "learn --force" /bye

# For PIV — no action needed, PKCS#11 detects the new card automatically

# For FIDO2 — no action needed, credentials are per-key
```

## Scripting and Automation with ykman

`ykman` is fully scriptable. Here are patterns for automating YubiKey provisioning and auditing.

### Provisioning a New YubiKey

```bash
#!/bin/bash
# provision-yubikey.sh — configure a fresh YubiKey

set -euo pipefail

echo "=== YubiKey Provisioning ==="

# Verify a YubiKey is connected
ykman info || { echo "No YubiKey detected"; exit 1; }

# Disable unused interfaces
echo "Disabling unused modules..."
ykman config usb --disable OTP --force
ykman config nfc --disable-all --force

# Set FIDO2 PIN
echo "Setting FIDO2 PIN..."
ykman fido access change-pin

# Change PIV PINs
echo "Changing PIV credentials..."
ykman piv access change-pin -P 123456
ykman piv access change-puk -p 12345678
ykman piv access change-management-key --generate --protect

# Generate PIV SSH key
echo "Generating PIV SSH key..."
ykman piv keys generate \
  --algorithm ECCP256 \
  --pin-policy ALWAYS \
  --touch-policy ALWAYS \
  9a /tmp/pubkey.pem

ykman piv certificates generate \
  --subject "CN=SSH Key $(date +%Y%m%d)" \
  --valid-days 730 \
  9a /tmp/pubkey.pem

# Extract SSH public key
echo "SSH public key:"
ssh-keygen -D /usr/local/lib/libykcs11.dylib -e

# Change OpenPGP PINs
echo "Changing OpenPGP PINs..."
ykman openpgp access change-pin
ykman openpgp access change-admin-pin

# Enable touch for OpenPGP
ykman openpgp keys set-touch sig on
ykman openpgp keys set-touch enc on
ykman openpgp keys set-touch aut on

# Configure HMAC-SHA1 for KeePassXC (slot 2)
echo "Configuring HMAC-SHA1 challenge-response..."
ykman otp chalresp --touch --generate 2

echo "=== Provisioning Complete ==="
ykman info
```

### Auditing a YubiKey

```bash
#!/bin/bash
# audit-yubikey.sh — report on YubiKey configuration

set -euo pipefail

echo "=== YubiKey Audit Report ==="
echo "Date: $(date)"
echo ""

echo "--- Device Info ---"
ykman info
echo ""

echo "--- USB Applications ---"
ykman config usb --list
echo ""

echo "--- NFC Applications ---"
ykman config nfc --list
echo ""

echo "--- FIDO2 Info ---"
ykman fido info
echo ""

echo "--- FIDO2 Resident Keys ---"
ykman fido credentials list 2>/dev/null || echo "(PIN required or no credentials)"
echo ""

echo "--- PIV Certificates ---"
for slot in 9a 9c 9d 9e; do
  echo "Slot $slot:"
  ykman piv certificates export $slot - 2>/dev/null | \
    openssl x509 -noout -subject -dates 2>/dev/null || echo "  (empty)"
done
echo ""

echo "--- OpenPGP Info ---"
ykman openpgp info
echo ""

echo "--- OTP Slots ---"
ykman otp info
echo ""

echo "--- OATH Accounts ---"
ykman oath accounts list 2>/dev/null || echo "(password required or no accounts)"

echo ""
echo "=== End of Report ==="
```

## Advanced FIDO2: Enterprise Attestation and PIN Complexity

### Minimum PIN Length

For environments that require stronger PINs:

```bash
# Set minimum PIN length to 8 characters
ykman fido config set-min-pin-length 8

# Force PIN change on next use
ykman fido config force-pin-change
```

### Enterprise Attestation

The YubiKey 5C supports enterprise attestation mode, which includes the device serial number in FIDO2 attestation statements. This allows organizations to tie credentials to specific physical keys.

Enterprise attestation must be enabled explicitly:

```bash
ykman fido config enable-ep-attestation
```

This is useful for asset tracking and compliance — you can verify not just that a hardware key was used, but which specific key.

## Best Practices for Advanced Usage

### PIV Slot Strategy

Use slots intentionally:

| Slot | Purpose | Recommended Use |
|------|---------|----------------|
| 9a | Authentication | SSH, VPN, system login |
| 9c | Digital Signature | Code signing, document signing (always requires PIN) |
| 9d | Key Management | Encrypting data at rest, key wrapping |
| 9e | Card Authentication | Physical access, low-security operations (no PIN required) |

Don't put high-value keys in slot 9e — it's designed for convenience, not security.

### Certificate Lifecycle

- Set certificate validity to match your key rotation schedule (1-2 years)
- Track certificate expiration dates and renew before they lapse
- Use the retired key slots (82-95) to keep old keys accessible for decrypting historical data
- Automate certificate renewal with your CA if possible

### FIDO2 Credential Hygiene

- Audit resident keys quarterly — remove credentials for services you no longer use
- Use the `application` parameter when generating SSH keys to label them meaningfully
- Keep a record of which relying parties have non-resident credentials (you can't list those from the key)
- When decommissioning a YubiKey, reset the FIDO2 applet: `ykman fido reset`

### Module Isolation

Each module on the YubiKey is independent. Use this to your advantage:

- Use FIDO2 for web authentication (strongest, most portable)
- Use PIV for SSH and mTLS (native OS integration, no GPG dependency)
- Use OpenPGP for git signing and email encryption (GPG ecosystem)
- Use OATH for TOTP where FIDO2 isn't supported
- Use HMAC-SHA1 for offline scenarios (KeePassXC)

Don't try to do everything through one module. Each has strengths for specific use cases.

### Disaster Recovery Matrix

| Scenario | Impact | Recovery |
|----------|--------|----------|
| Lost primary YubiKey | No access via that key | Use backup YubiKey; revoke lost key from all services |
| Both YubiKeys lost | No hardware-backed access | Use recovery codes; restore GPG from offline backup |
| Forgotten PIV PIN | Locked after retries | Use PUK to reset PIN; if PUK also locked, reset PIV applet |
| Forgotten FIDO2 PIN | Locked after 8 attempts | Reset FIDO2 applet (destroys all credentials); re-enroll |
| Forgotten OpenPGP PIN | Locked after retries | Use Admin PIN to reset; if Admin PIN locked, reset applet |
| Compromised key | Attacker has physical access | Revoke all credentials immediately; rotate all secrets |

## Wrapping Up

The YubiKey 5C is more than a FIDO2 token. PIV gives you native SSH and mTLS without GPG. Resident keys make FIDO2 SSH portable across machines. Attestation proves key provenance for zero-trust environments. And scripting with `ykman` lets you standardize provisioning across a team. Combined with the fundamentals from the [first](/posts/yubikey-5c-modules/) and [second](/posts/gpg-keys-and-yubikey/) posts, you've got a complete hardware security setup.
