---
title: "GPG Primary Keys, Subkeys, and YubiKey Integration"
date: 2026-04-10 14:00:00 -0700
categories: [Security]
tags: [gpg, yubikey, encryption, subkeys, openpgp]
---

GPG (GNU Privacy Guard) is the open-source implementation of the OpenPGP standard. It handles encryption, signing, and authentication using a hierarchical key structure. Pairing it with a YubiKey moves your private keys off your machine entirely, which is about as good as it gets for key security.

## Key Hierarchy: Primary and Subkeys

GPG uses a tree structure. At the root is your primary key, and branching off it are subkeys — each dedicated to a specific purpose.

### Primary Key (Master Key)

The primary key is your identity. It:

- Certifies (signs) your subkeys and other people's keys
- Establishes your Web of Trust relationships
- Is identified by your key fingerprint
- Should have the `[C]` (Certify) capability only

The primary key is the most sensitive piece of your GPG setup. If it's compromised, your entire key hierarchy is compromised. If it's lost, you can't revoke or rotate subkeys.

### Subkeys

Subkeys do the actual day-to-day work. Each has a single capability:

| Capability | Flag | Purpose |
|-----------|------|---------|
| Sign | `[S]` | Sign data, git commits, emails |
| Encrypt | `[E]` | Encrypt and decrypt data and messages |
| Authenticate | `[A]` | SSH authentication via `gpg-agent` |

Subkeys are bound to the primary key via a certification signature. They can be rotated, revoked, or replaced independently without affecting your identity.

### Why This Separation Matters

- You can keep the primary key offline and only use subkeys on your daily machine
- If a subkey is compromised, revoke it and issue a new one — your identity stays intact
- Different subkeys can live on different devices (e.g., one YubiKey for work, another for personal)
- Subkey rotation doesn't require re-establishing trust with others

## Generating a Proper Key Hierarchy

### Step 1: Generate the Primary Key (Certify Only)

```bash
gpg --quick-generate-key "Your Name <your@email.com>" ed25519 cert 0
```

This creates an ed25519 primary key with only the Certify capability and no expiration. Note the key ID output — you'll need it.

```bash
export KEYID="<your-key-fingerprint>"
```

### Step 2: Add Subkeys

```bash
# Signing subkey (2 year expiry)
gpg --quick-add-key $KEYID ed25519 sign 2y

# Encryption subkey (2 year expiry)
gpg --quick-add-key $KEYID cv25519 encr 2y

# Authentication subkey (2 year expiry)
gpg --quick-add-key $KEYID ed25519 auth 2y
```

### Step 3: Verify the Hierarchy

```bash
gpg -K --keyid-format long
```

You should see something like:

```
sec   ed25519/0xABCDEF1234567890 2026-04-10 [C]
uid                   [ultimate] Your Name <your@email.com>
ssb   ed25519/0x1111111111111111 2026-04-10 [S] [expires: 2028-04-10]
ssb   cv25519/0x2222222222222222 2026-04-10 [E] [expires: 2028-04-10]
ssb   ed25519/0x3333333333333333 2026-04-10 [A] [expires: 2028-04-10]
```

### Step 4: Generate a Revocation Certificate

```bash
gpg --gen-revoke --armor $KEYID > revocation-cert.asc
```

Store this somewhere safe and offline. You'll need it if your primary key is ever compromised or lost.

### Step 5: Back Up the Primary Key

```bash
# Export the full key (primary + subkeys)
gpg --armor --export-secret-keys $KEYID > primary-key-backup.asc

# Export subkeys only (for daily use without the primary)
gpg --armor --export-secret-subkeys $KEYID > subkeys-only.asc
```

Store `primary-key-backup.asc` on encrypted offline media (USB drive in a safe, etc.). You'll only need it to certify new subkeys or sign other people's keys.

## Moving Subkeys to a YubiKey

This is where things get good. Once subkeys are on the YubiKey, the private key material is deleted from your machine. All crypto operations happen on the hardware token.

### Prerequisites

- YubiKey 5C (or any YubiKey 5 series) with OpenPGP applet enabled
- `ykman` and `gpg` installed
- Default OpenPGP PINs changed (see the [YubiKey 5C modules post](/posts/yubikey-5c-modules/))

### Transfer Subkeys to the YubiKey

```bash
gpg --edit-key $KEYID
```

Inside the GPG interactive prompt:

```
gpg> key 1          # Select the signing subkey
gpg> keytocard
Please select where to store the key:
   (1) Signature key
Your selection? 1

gpg> key 1          # Deselect
gpg> key 2          # Select the encryption subkey
gpg> keytocard
Please select where to store the key:
   (2) Encryption key
Your selection? 2

gpg> key 2          # Deselect
gpg> key 3          # Select the authentication subkey
gpg> keytocard
Please select where to store the key:
   (3) Authentication key
Your selection? 3

gpg> save
```

`keytocard` is a destructive move — the private subkey is removed from your local keyring and exists only on the YubiKey. This is why you backed up first.

### Verify Keys Are on the Card

```bash
gpg --card-status
```

You should see your three subkeys listed under the Signature, Encryption, and Authentication slots.

On your local keyring, `gpg -K` will now show `ssb>` instead of `ssb` — the `>` indicates the key is a stub pointing to the smart card.

## Using GPG with YubiKey Day-to-Day

### Git Commit Signing

```bash
# Configure git to use your signing subkey
git config --global user.signingkey $KEYID
git config --global commit.gpgsign true

# Sign a commit (happens automatically with the above config)
git commit -m "feat: add new feature"
# YubiKey will blink — touch it to authorize the signature
```

### SSH via gpg-agent

The authentication subkey on your YubiKey can replace traditional SSH keys.

```bash
# Add to ~/.gnupg/gpg-agent.conf
enable-ssh-support

# Add to your shell profile (~/.bashrc or ~/.zshrc)
export GPG_TTY=$(tty)
export SSH_AUTH_SOCK=$(gpgconf --list-dirs agent-ssh-socket)

# Restart the agent
gpgconf --kill gpg-agent
gpgconf --launch gpg-agent

# Get your SSH public key
gpg --export-ssh-key $KEYID
```

Add the output to `~/.ssh/authorized_keys` on remote hosts or to GitHub/GitLab SSH keys.

### Email Encryption and Signing

Most email clients that support OpenPGP (Thunderbird, mutt, neomutt) will automatically detect the YubiKey-backed keys through gpg-agent. No special configuration beyond the standard GPG mail setup is needed.

### Decrypting Files

```bash
# Encrypt a file to yourself
gpg --encrypt --recipient $KEYID secret.txt

# Decrypt (YubiKey must be plugged in)
gpg --decrypt secret.txt.gpg
```

## Setting Up a Backup YubiKey

You should have a second YubiKey with the same subkeys. Since `keytocard` is destructive, you need to restore from backup before transferring to the second key.

```bash
# Remove the current keyring stubs
gpg --delete-secret-keys $KEYID

# Re-import the full backup
gpg --import primary-key-backup.asc

# Now transfer to the second YubiKey
gpg --edit-key $KEYID
# Repeat the keytocard process for all three subkeys
```

After this, both YubiKeys hold the same subkeys. Either one can be used interchangeably.

When switching between YubiKeys on the same machine:

```bash
# Tell GPG to re-learn which card has the keys
gpg-connect-agent "scd serialno" "learn --force" /bye
```

## Best Practices

### Key Management

- Keep the primary key offline — only bring it out to certify new subkeys, sign other people's keys, or update expiration dates
- Set subkey expiration to 1-2 years and rotate before they expire
- Extend expiration dates rather than generating new subkeys when possible (preserves trust)
- Publish your public key to a keyserver (`gpg --send-keys $KEYID`) and keep it updated after changes
- Use a strong passphrase on the primary key backup — this is your last line of defense

### YubiKey-Specific

- Always change the default OpenPGP PIN (`123456`) and Admin PIN (`12345678`) before transferring keys
- Enable touch requirement for all three key slots to prevent silent operations by malware
- Set retry counters appropriately — too low and you risk locking yourself out, too high and brute force becomes easier (3 is the default and a good balance)
- Label your YubiKeys (primary vs backup) so you know which is which
- Store the backup YubiKey in a physically secure location separate from the primary

### Operational Security

- Never export private subkeys from the YubiKey — the whole point is that they can't leave the hardware
- Use `gpg --armor --export $KEYID` to share your public key, never `--export-secret-keys`
- Verify key fingerprints out-of-band when exchanging keys with others
- Revoke compromised subkeys immediately and publish the updated key to keyservers
- Keep a printed copy of your revocation certificate in a secure location

### gpg-agent Configuration

Recommended settings for `~/.gnupg/gpg-agent.conf`:

```
enable-ssh-support
default-cache-ttl 600
max-cache-ttl 7200
pinentry-program /usr/local/bin/pinentry-mac  # macOS
```

- `default-cache-ttl 600` — cache the PIN for 10 minutes of inactivity
- `max-cache-ttl 7200` — force re-entry after 2 hours regardless of activity
- Keep these values reasonable; longer cache times are convenient but reduce security

### Git and Development Workflow

- Set `commit.gpgsign = true` globally so you never forget to sign
- Add your GPG key to GitHub/GitLab so commits show as "Verified"
- Use the authentication subkey for SSH to consolidate your key management into one device
- For CI/CD environments that need signature verification, export and trust your public key in the pipeline

### Recovery Checklist

If things go wrong, here's what you need:

1. Primary key backup (`primary-key-backup.asc`) — to restore full control
2. Revocation certificate (`revocation-cert.asc`) — to revoke a compromised key
3. Backup YubiKey — to continue working while you sort things out
4. Passphrase for the primary key backup — stored in a password manager or written down securely

Without item 1, you can still revoke (item 2) but you'll need to start fresh with a new key hierarchy. Without item 2, you can't revoke a compromised key if you've also lost the primary backup. Keep both safe.

## Wrapping Up

The combination of GPG's key hierarchy and YubiKey's hardware isolation gives you a setup where your private keys are never on disk, signing requires physical presence, and key compromise is limited to individual subkeys that can be rotated without rebuilding trust. It takes some upfront effort to set up, but once it's running, the daily workflow is just plug in and touch.
