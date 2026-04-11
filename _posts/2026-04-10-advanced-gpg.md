---
title: "Advanced GPG: Web of Trust, Subkey Rotation, Offline Primary Keys, and Hardened Configuration"
date: 2026-04-10 18:00:00 -0700
categories: [Security]
tags: [gpg, web-of-trust, subkeys, encryption, key-rotation, advanced]
---

The [GPG fundamentals post](/posts/gpg-keys-and-yubikey/) covered key hierarchy, subkey generation, and YubiKey integration. This post goes deeper — Web of Trust mechanics, subkey rotation without breaking trust, air-gapped primary key management, hardened `gpg.conf`, keyserver strategies, multiple identities, and troubleshooting the rough edges.

## Web of Trust

The Web of Trust (WoT) is GPG's decentralized trust model. Instead of a central certificate authority, users vouch for each other's identities by signing each other's keys.

### How It Works

1. You verify someone's identity (in person, video call, etc.)
2. You verify their key fingerprint out-of-band
3. You sign their public key with your primary (certify) key
4. They do the same for you
5. Third parties who trust you can now transitively trust the person you signed

### Signing Someone's Key

```bash
# Import their public key
gpg --import alice-public.asc

# Verify the fingerprint matches what they gave you
gpg --fingerprint alice@example.com

# Sign their key (requires your primary key)
gpg --sign-key alice@example.com

# Export the signed key back to them
gpg --armor --export alice@example.com > alice-signed.asc
```

Or upload directly to a keyserver:

```bash
gpg --send-keys <alice-key-id>
```

### Trust Levels

When signing a key, GPG asks how carefully you verified the identity:

| Level | Meaning |
|-------|---------|
| 0 — Unknown | You make no claim about verification |
| 1 — No trust | You don't trust this person to verify others |
| 2 — Marginal | You somewhat trust their identity verification |
| 3 — Full | You fully trust their identity verification |
| 4 — Ultimate | Reserved for your own keys |

These trust levels feed into GPG's validity calculation:

- A key signed by one fully trusted key is considered valid
- A key signed by three marginally trusted keys is considered valid
- You can adjust these thresholds in `gpg.conf`

### Setting Owner Trust

```bash
gpg --edit-key alice@example.com
gpg> trust
# Select trust level (1-5)
gpg> save
```

### Viewing the Trust Path

```bash
# Show trust database
gpg --check-trustdb

# Show how a specific key is validated
gpg --list-keys --with-colons alice@example.com | grep -E "^(pub|uid)"

# Verbose trust path
gpg --check-sigs alice@example.com
```

## Multiple UIDs (Identities)

A single GPG key can have multiple User IDs — useful if you have separate email addresses for work, personal, and open source.

### Adding UIDs

```bash
gpg --edit-key $KEYID
gpg> adduid
# Enter new name and email
gpg> save
```

### Setting a Primary UID

```bash
gpg --edit-key $KEYID
gpg> uid 2          # Select the UID you want as primary
gpg> primary
gpg> save
```

### Revoking a UID

If you leave a job or stop using an email:

```bash
gpg --edit-key $KEYID
gpg> uid 3          # Select the UID to revoke
gpg> revuid
gpg> save

# Publish the update
gpg --send-keys $KEYID
```

The revoked UID stays on the key (for historical verification) but is marked as invalid.

### UID Best Practices

- Add UIDs for all email addresses you actively use for signed communication
- Set your most-used identity as the primary UID
- Revoke UIDs promptly when they become inactive
- Each UID can be independently signed by others in the Web of Trust

## Subkey Rotation

Subkeys should be rotated periodically. The goal is to limit the window of exposure if a subkey is compromised, while keeping your identity (primary key) stable.

### When to Rotate

- Before a subkey expires (extend or replace)
- After a suspected compromise
- When changing hardware tokens
- On a regular schedule (annually or biannually)

### Extending Expiration (Preferred)

If the subkey hasn't been compromised, extending the expiration is simpler and preserves existing signatures:

```bash
# Requires the primary key (bring it out of offline storage)
gpg --edit-key $KEYID

gpg> key 1          # Select the subkey
gpg> expire
# Enter new expiration (e.g., 2y)
gpg> key 1          # Deselect
# Repeat for other subkeys
gpg> save

# Publish the updated key
gpg --send-keys $KEYID
```

### Replacing a Subkey (After Compromise)

If a subkey is compromised, revoke it and generate a new one:

```bash
gpg --edit-key $KEYID

# Revoke the compromised subkey
gpg> key 1          # Select it
gpg> revkey
gpg> key 1          # Deselect

# Add a replacement
gpg> addkey
# Choose algorithm and capabilities
gpg> save

# Publish immediately
gpg --send-keys $KEYID
```

Then transfer the new subkey to your YubiKey:

```bash
gpg --edit-key $KEYID
gpg> key <new-key-number>
gpg> keytocard
gpg> save
```

### Rotation Without Downtime

1. Generate the new subkey while the old one is still valid
2. Transfer the new subkey to the YubiKey
3. Publish the updated public key
4. Wait for propagation (give it a day or two)
5. Revoke the old subkey
6. Publish again

This ensures there's no gap where correspondents can't encrypt to you or verify your signatures.

## Air-Gapped Primary Key Management

The primary key should never touch a networked machine. Here's how to manage it on an air-gapped system.

### Setting Up the Air-Gapped Environment

Options, from most to least paranoid:

1. A dedicated laptop that never connects to any network, booted from a live USB (Tails OS)
2. A Raspberry Pi with no network interfaces enabled
3. A virtual machine with all networking disabled

### Workflow

```
┌─────────────────┐     USB drive      ┌──────────────────┐
│  Air-gapped     │ ◄──────────────── │  Daily machine    │
│  machine        │                    │  (subkeys only)   │
│  (primary key)  │ ────────────────► │                    │
│                 │     USB drive      │                    │
└─────────────────┘                    └──────────────────┘
```

### Operations on the Air-Gapped Machine

```bash
# Import the primary key backup
gpg --import primary-key-backup.asc

# --- Certify a new subkey ---
gpg --edit-key $KEYID
gpg> addkey
# ... generate subkey ...
gpg> save

# --- Sign someone's key ---
gpg --import their-public-key.asc
gpg --sign-key their@email.com

# --- Extend subkey expiration ---
gpg --edit-key $KEYID
gpg> key 1
gpg> expire
gpg> save

# --- Export updated public key to USB ---
gpg --armor --export $KEYID > /mnt/usb/public-key-updated.asc

# --- Export new subkeys for transfer to YubiKey ---
gpg --armor --export-secret-subkeys $KEYID > /mnt/usb/subkeys-new.asc
```

### On the Daily Machine

```bash
# Import the updated public key
gpg --import /mnt/usb/public-key-updated.asc

# If transferring new subkeys to YubiKey:
gpg --import /mnt/usb/subkeys-new.asc
gpg --edit-key $KEYID
# keytocard for each new subkey
gpg> save

# Publish
gpg --send-keys $KEYID
```

### Secure the USB Transfer

- Use an encrypted USB drive (LUKS on Linux, FileVault on macOS)
- Wipe the USB after each transfer
- Never plug the USB into an untrusted machine
- Consider using QR codes for small data transfers (public key fingerprints, signatures) to avoid USB entirely

## Hardened gpg.conf

The default `gpg.conf` is permissive. Here's a hardened configuration for `~/.gnupg/gpg.conf`:

```
# Behavior
no-greeting
no-emit-version
no-comments
export-options export-minimal

# Display
keyid-format 0xlong
with-fingerprint
list-options show-uid-validity
verify-options show-uid-validity

# Algorithms — prefer strong, modern options
personal-cipher-preferences AES256 AES192 AES
personal-digest-preferences SHA512 SHA384 SHA256
personal-compress-preferences ZLIB BZIP2 ZIP Uncompressed
default-preference-list SHA512 SHA384 SHA256 AES256 AES192 AES ZLIB BZIP2 ZIP Uncompressed
cert-digest-algo SHA512
s2k-digest-algo SHA512
s2k-cipher-algo AES256

# Keyserver
keyserver hkps://keys.openpgp.org
keyserver-options no-honor-keyserver-url
keyserver-options include-revoked

# Trust model
trust-model tofu+pgp

# Charset
charset utf-8
```

### What Each Section Does

- `no-emit-version` / `no-comments`: Don't leak GPG version info in signatures and encrypted messages
- `export-minimal`: Strip unnecessary data when exporting keys (reduces key size)
- `personal-*-preferences`: Force strong algorithms; recipients see these as your preferred ciphers
- `cert-digest-algo SHA512`: Use SHA-512 for key certifications (default is SHA-256, which is fine, but SHA-512 is stronger)
- `s2k-*`: Strengthen the passphrase-to-key derivation
- `trust-model tofu+pgp`: Combine Trust on First Use with the classic Web of Trust — practical for most users
- `keyserver-options no-honor-keyserver-url`: Ignore keyserver URLs embedded in keys (prevents tracking)

## Keyserver Strategy

Keyservers are how you distribute and discover public keys. The landscape has changed significantly — here's the current state.

### Recommended Keyservers

| Server | URL | Notes |
|--------|-----|-------|
| keys.openpgp.org | `hkps://keys.openpgp.org` | Email-verified, privacy-respecting, no third-party signatures |
| Ubuntu keyserver | `hkps://keyserver.ubuntu.com` | Traditional SKS-style, stores third-party signatures |
| keys.mailvelope.com | `hkps://keys.mailvelope.com` | Web Key Directory compatible |

### keys.openpgp.org vs Traditional Keyservers

`keys.openpgp.org` is the modern choice:
- Requires email verification before publishing UIDs
- Strips third-party signatures (reduces key bloat)
- Doesn't allow enumeration of all keys
- Better privacy — no one can attach arbitrary UIDs or signatures to your key

Traditional keyservers (SKS pool) are append-only:
- Anyone can upload signatures to your key
- Vulnerable to key poisoning (flooding a key with signatures)
- Useful if you rely on the Web of Trust for third-party signature distribution

### Publishing Your Key

```bash
# To keys.openpgp.org (will send verification email)
gpg --keyserver hkps://keys.openpgp.org --send-keys $KEYID

# To Ubuntu keyserver
gpg --keyserver hkps://keyserver.ubuntu.com --send-keys $KEYID

# Publish to both for maximum discoverability
```

### Web Key Directory (WKD)

If you control your email domain, WKD lets people find your key via your email address without a keyserver:

```bash
# Generate the WKD hash for your email
gpg --with-wkd-hash --fingerprint your@domain.com

# Export your key in WKD format
gpg --export --no-armor your@domain.com > \
  .well-known/openpgpkey/hu/<wkd-hash>
```

Host the file at `https://domain.com/.well-known/openpgpkey/hu/<hash>`. GPG clients will find it automatically.

## Automated Signature Verification

For teams and CI/CD pipelines, you can automate GPG signature verification to enforce signed commits and artifacts.

### Verifying Git Commits

```bash
# Verify a single commit
git verify-commit HEAD

# Verify a range of commits
git log --show-signature -n 10

# In CI: fail if the latest commit isn't signed by a trusted key
git verify-commit HEAD 2>&1 | grep -q "Good signature" || {
  echo "ERROR: Commit is not signed by a trusted key"
  exit 1
}
```

### Verifying Git Tags

```bash
# Verify a signed tag
git verify-tag v1.0.0

# Create a signed tag
git tag -s v1.0.0 -m "Release 1.0.0"
```

### Setting Up a CI Trust Store

```bash
# Create a dedicated keyring for CI
export GNUPGHOME=/tmp/ci-gpg
mkdir -p $GNUPGHOME
chmod 700 $GNUPGHOME

# Import trusted developer keys
gpg --import team-keys.asc

# Trust them
echo "<fingerprint>:6:" | gpg --import-ownertrust

# Now verify
git -c gpg.program="gpg --homedir $GNUPGHOME" verify-commit HEAD
```

### Verifying File Signatures

```bash
# Sign a release artifact
gpg --detach-sign --armor release-v1.0.tar.gz
# Creates release-v1.0.tar.gz.asc

# Verify
gpg --verify release-v1.0.tar.gz.asc release-v1.0.tar.gz
```

## Cross-Certification and Key Transition

When you need to move to a new primary key (algorithm upgrade, key compromise, or starting fresh), cross-certification helps your contacts trust the transition.

### Key Transition Statement

Create a signed statement with both the old and new keys:

```bash
cat > transition-statement.txt << 'EOF'
GPG Key Transition Statement

Date: 2026-04-10

I am transitioning from my old GPG key to a new one.

Old key: 0xOLDKEYFINGERPRINT
New key: 0xNEWKEYFINGERPRINT

This statement is signed by both keys to prove ownership of both.

Please update your records and sign my new key at your convenience.
EOF

# Sign with the old key
gpg --default-key 0xOLDKEY --clearsign transition-statement.txt
mv transition-statement.txt.asc transition-old-sig.txt

# Sign with the new key
gpg --default-key 0xNEWKEY --clearsign transition-statement.txt
mv transition-statement.txt.asc transition-new-sig.txt
```

### Cross-Sign the Keys

```bash
# Sign the new key with the old key
gpg --default-key 0xOLDKEY --sign-key 0xNEWKEY

# Sign the old key with the new key
gpg --default-key 0xNEWKEY --sign-key 0xOLDKEY

# Publish both
gpg --send-keys 0xOLDKEY 0xNEWKEY
```

### Revoke the Old Key (After Transition Period)

Give people time to update (30-90 days), then:

```bash
# Import the revocation certificate for the old key
gpg --import old-revocation-cert.asc

# Publish the revocation
gpg --send-keys 0xOLDKEY
```

## Notation and Policy URLs

GPG supports attaching metadata to signatures via notations. This is useful for linking signatures to policies or adding machine-readable context.

```bash
# Add a notation to all signatures (in gpg.conf)
# sig-notation issuer-fpr@notations.openpgp.fifthhorseman.net=%g

# Add a policy URL to certifications
# cert-policy-url https://yourdomain.com/gpg-policy.html

# Sign with an inline notation
gpg --sig-notation reason@example.com="code review approved" \
  --detach-sign artifact.tar.gz
```

Policy URLs are useful for organizations that want to document their key signing practices.

## gpg-agent Advanced Configuration

Beyond the basics covered in the [first post](/posts/gpg-keys-and-yubikey/), here are advanced agent configurations.

### Restricting Agent Access

```bash
# ~/.gnupg/gpg-agent.conf

# Only allow access from the current TTY
enable-ssh-support
default-cache-ttl 600
max-cache-ttl 7200

# Require confirmation for each key use (extra paranoid)
# no-allow-external-cache

# Log all agent operations (useful for auditing)
log-file ~/.gnupg/gpg-agent.log
verbose

# Use a specific pinentry for SSH operations
pinentry-program /usr/local/bin/pinentry-mac
```

### Multiple SSH Keys via gpg-agent

If you have multiple authentication subkeys (e.g., one per YubiKey or one per identity):

```bash
# ~/.gnupg/sshcontrol
# Add keygrips of authentication subkeys you want exposed via SSH

# Get the keygrip
gpg -K --with-keygrip

# Add to sshcontrol (the keygrip of the [A] subkey)
echo "ABC123DEF456..." >> ~/.gnupg/sshcontrol
```

### Forwarding gpg-agent Over SSH

You can use your local YubiKey-backed GPG keys on a remote machine by forwarding the agent socket:

```bash
# On the local machine, find the agent socket
gpgconf --list-dirs agent-extra-socket
# e.g., /Users/you/.gnupg/S.gpg-agent.extra

# On the remote machine, find where GPG expects the socket
gpgconf --list-dirs agent-socket
# e.g., /run/user/1000/gnupg/S.gpg-agent

# SSH with agent forwarding
ssh -R /run/user/1000/gnupg/S.gpg-agent:/Users/you/.gnupg/S.gpg-agent.extra remote-host
```

Or in `~/.ssh/config`:

```
Host remote-host
  RemoteForward /run/user/1000/gnupg/S.gpg-agent /Users/you/.gnupg/S.gpg-agent.extra
  # Ensure the remote socket is removed on connect
  StreamLocalBindUnlink yes
```

On the remote machine, GPG operations will be forwarded to your local YubiKey. The remote machine never sees your private keys.

## Troubleshooting

### "No secret key" When Key Is on YubiKey

```bash
# GPG lost track of the card. Re-learn it:
gpg-connect-agent "scd serialno" "learn --force" /bye

# If that doesn't work, delete the stubs and re-import:
gpg --delete-secret-keys $KEYID
gpg --card-status
```

### "Unusable public key" or "No public key"

The public key isn't in your keyring. The YubiKey only holds private keys:

```bash
# Import from backup or keyserver
gpg --recv-keys $KEYID
# or
gpg --import public-key.asc
```

### gpg-agent Not Responding

```bash
# Kill and restart
gpgconf --kill gpg-agent
gpgconf --launch gpg-agent

# Verify it's running
gpg-connect-agent /bye
```

### SSH Not Using gpg-agent

```bash
# Verify environment variables
echo $SSH_AUTH_SOCK
# Should point to: $(gpgconf --list-dirs agent-ssh-socket)

# Check that the auth key is listed
ssh-add -L
# Should show your GPG authentication subkey

# If empty, check sshcontrol file has the right keygrip
gpg -K --with-keygrip | grep -A1 "\[A\]"
```

### Pinentry Not Appearing

```bash
# Verify GPG_TTY is set
echo $GPG_TTY
# Should output your current TTY (e.g., /dev/ttys001)

# If not set, add to your shell profile:
export GPG_TTY=$(tty)

# For GUI pinentry on macOS:
# Ensure pinentry-mac is installed
brew install pinentry-mac

# Verify gpg-agent.conf points to it
grep pinentry ~/.gnupg/gpg-agent.conf
```

### "Card error" or "No card"

```bash
# Check if the YubiKey is detected
ykman info

# Check if pcscd (smart card daemon) is running (Linux)
systemctl status pcscd

# On macOS, the built-in smart card framework should handle it
# Try unplugging and replugging the YubiKey

# Reset the scdaemon
gpg-connect-agent "scd killscd" /bye
gpg-connect-agent "scd serialno" /bye
```

## Best Practices for Advanced Usage

### Algorithm Selection

- Use ed25519/cv25519 for new keys — smallest key size, fastest operations, strong security
- Avoid RSA below 3072 bits for any new key generation
- If you need RSA (compatibility with older systems), use 4096 bits
- For encryption subkeys, cv25519 (Curve25519) is the modern choice over RSA

### Keyring Hygiene

- Periodically refresh keys from keyservers: `gpg --refresh-keys`
- Remove keys you no longer need: `gpg --delete-keys <id>`
- Export a minimal public key for distribution: `gpg --export --export-options export-minimal`
- Back up your `~/.gnupg/trustdb.gpg` alongside your key backups — it stores your trust decisions

### Signature Hygiene

- Always use detached signatures for files (`.asc` alongside the file) rather than clearsign
- For git, use `commit.gpgsign` and `tag.gpgsign` globally
- Verify signatures you receive — don't just trust that a file "came from the right person"
- Check signature timestamps to detect backdated signatures

### Defense in Depth

- Primary key offline on air-gapped machine
- Subkeys on YubiKey with touch policy enabled
- Strong passphrase on the primary key backup
- Revocation certificate stored separately from the primary key backup
- Multiple backup locations (different physical sites)
- Regular rotation schedule documented and followed

## Wrapping Up

GPG's power comes from its flexibility, but that flexibility means there's a lot to configure correctly. A hardened `gpg.conf`, proper keyserver strategy, regular subkey rotation, and an air-gapped primary key give you a setup that's resilient against both key compromise and key loss. Combined with the [YubiKey integration](/posts/gpg-keys-and-yubikey/) and [hardware security](/posts/advanced-yubikey-5c/) covered in the earlier posts, you've got a comprehensive cryptographic identity that's portable, recoverable, and hard to compromise.
