---
title: "Cryptographic Key Linking: How Keys Are Derived, Bound, and Hierarchically Related"
date: 2026-05-16 14:00:00 -0700
categories: [Security]
tags: [cryptography, key-derivation, hkdf, bip32, signal-protocol, gpg, elliptic-curves]
---

A recurring pattern in cryptography: you have one master key and need to derive multiple purpose-specific keys from it, or you need to prove that two keys are mathematically related without revealing either one. This post covers the algorithms and protocols that cryptographically link keys — from the asymmetric key pairs you use daily to hierarchical derivation schemes and forward-secret ratchets.

## Asymmetric Key Pairs: The Foundation

The most fundamental form of key linking. Two keys are generated together such that an operation with one can only be reversed with the other.

### RSA

Two keys linked through the difficulty of factoring large numbers.

```
Key generation:
  1. Choose two large primes p, q
  2. Compute n = p * q
  3. Compute φ(n) = (p-1)(q-1)
  4. Choose e (public exponent, typically 65537)
  5. Compute d = e^(-1) mod φ(n)

Public key:  (n, e)
Private key: (n, d)

Encrypt: ciphertext = message^e mod n
Decrypt: message = ciphertext^d mod n
Sign:    signature = hash^d mod n
Verify:  hash == signature^e mod n
```

The link: knowing `d` requires factoring `n` into `p` and `q`. For 2048+ bit keys, this is computationally infeasible. The two keys are bound by the mathematical relationship `e * d ≡ 1 (mod φ(n))`.

### Elliptic Curve (ECC)

Two keys linked through the elliptic curve discrete logarithm problem.

```
Key generation:
  1. Choose a curve (e.g., Curve25519, P-256)
  2. G = generator point on the curve
  3. Choose random scalar k (private key)
  4. Compute K = k * G (public key, a point on the curve)

Private key: k (256-bit integer)
Public key:  K (point on the curve)
```

The link: given `K` and `G`, finding `k` requires solving the discrete logarithm problem on the elliptic curve. Point multiplication is easy (compute `k * G` in milliseconds), but the reverse (given `K` and `G`, find `k`) is infeasible for properly chosen curves.

This is more compact than RSA — a 256-bit ECC key provides equivalent security to a 3072-bit RSA key.

### Diffie-Hellman Key Agreement

Two parties each generate a key pair and derive a shared secret without transmitting it.

```
Alice:                          Bob:
  a = random (private)            b = random (private)
  A = a * G (public)             B = b * G (public)

  Exchange public keys:
  Alice sends A to Bob
  Bob sends B to Alice

  Shared secret:
  Alice computes: s = a * B = a * b * G
  Bob computes:   s = b * A = b * a * G
  
  Both arrive at the same point: a * b * G
```

The link: both parties independently compute the same shared secret. An eavesdropper who sees `A` and `B` cannot compute `a * b * G` without knowing either `a` or `b` (the computational Diffie-Hellman assumption).

## Key Derivation Functions (KDFs)

A KDF takes a source of key material and deterministically produces one or more derived keys. The derived keys are cryptographically linked to the source — knowing the source lets you recompute any derived key, but knowing a derived key doesn't reveal the source.

### HKDF (HMAC-based KDF)

The standard KDF for modern protocols (TLS 1.3, Signal, Noise Framework). Two phases:

```
1. Extract: condense input key material into a fixed-length pseudorandom key
   PRK = HMAC-SHA256(salt, input_key_material)

2. Expand: produce output keys of any length
   T(1) = HMAC-SHA256(PRK, info || 0x01)
   T(2) = HMAC-SHA256(PRK, T(1) || info || 0x02)
   T(3) = HMAC-SHA256(PRK, T(2) || info || 0x03)
   ...
   Output = T(1) || T(2) || T(3) || ...
```

The `info` parameter is the key differentiator — it lets you derive multiple independent keys from the same master:

```
master_secret = <from key exchange>

encryption_key = HKDF-Expand(master_secret, "encryption", 32)
signing_key    = HKDF-Expand(master_secret, "signing", 32)
auth_key       = HKDF-Expand(master_secret, "authentication", 32)
```

Each derived key is cryptographically linked to the master — they're deterministic functions of it — but knowing one derived key reveals nothing about the others or the master (assuming HMAC-SHA256 is secure).

### PBKDF2 and Argon2

For deriving keys from passwords (low-entropy input):

```
PBKDF2:
  key = PBKDF2(password, salt, iterations=600000, key_length=32)

Argon2id (modern, memory-hard):
  key = Argon2id(password, salt, time=3, memory=64MB, parallelism=4)
```

These are deliberately slow — they make brute-force attacks on the password expensive. The derived key is linked to the password, but the computational cost of the link is tunable.

## Hierarchical Deterministic Key Derivation (BIP-32)

BIP-32 defines a tree of key pairs derived from a single seed. This is how cryptocurrency wallets generate millions of addresses from one backup phrase.

### The Derivation Function

```
Parent key + index → Child key

Specifically:
  child_key = HMAC-SHA512(parent_chain_code, parent_public_key || index)
  
  Left 256 bits:  child_private_key = parent_private_key + left_bits (mod n)
  Right 256 bits: child_chain_code (used for further derivation)
```

The chain code is the secret sauce — it's additional entropy that prevents someone who knows a child public key from deriving sibling keys.

### The Key Tree

```
Seed (128-512 bits, from mnemonic phrase)
  │
  ├─ Master key (m)
  │   chain_code = HMAC-SHA512("Bitcoin seed", seed)[32:]
  │   private_key = HMAC-SHA512("Bitcoin seed", seed)[:32]
  │
  ├─ m/44' (purpose: BIP-44 multi-account)
  │   ├─ m/44'/0' (coin: Bitcoin)
  │   │   ├─ m/44'/0'/0' (account 0)
  │   │   │   ├─ m/44'/0'/0'/0 (external chain)
  │   │   │   │   ├─ m/44'/0'/0'/0/0 (address 0)
  │   │   │   │   ├─ m/44'/0'/0'/0/1 (address 1)
  │   │   │   │   └─ ...
  │   │   │   └─ m/44'/0'/0'/1 (internal/change chain)
  │   │   └─ m/44'/0'/1' (account 1)
  │   └─ m/44'/60' (coin: Ethereum)
  └─ ...
```

The `'` denotes hardened derivation — uses the private key in the HMAC input, preventing public-key-only derivation of children.

### Properties

| Property | Meaning |
|----------|---------|
| Deterministic | Same seed always produces same tree |
| Hierarchical | Parent can derive all descendants |
| One-way (hardened) | Child cannot derive parent |
| Public derivation | Extended public key can derive child public keys (non-hardened only) |
| Independent | Knowing one leaf reveals nothing about siblings |

The cryptographic link: every key in the tree is a deterministic function of the seed. Back up the seed once, recover the entire tree. But compromise one leaf key and the rest remain safe (with hardened derivation).

## OpenPGP Subkey Binding

GPG/OpenPGP uses a different model — subkeys are bound to a primary key through cryptographic signatures rather than derivation.

```
Primary key (certification + signing)
  │
  ├─ Subkey A (signing) — bound by primary key signature
  ├─ Subkey B (encryption) — bound by primary key signature
  └─ Subkey C (authentication) — bound by primary key signature
```

### How Binding Works

The primary key signs a binding signature over the subkey:

```
Binding signature contains:
  - Subkey public key material
  - Key flags (what the subkey can do)
  - Creation timestamp
  - Expiration (optional)
  - Issuer (primary key fingerprint)

Signature = Sign(primary_private_key, hash(primary_public_key || subkey_public_key || metadata))
```

Anyone with the primary public key can verify that a subkey is legitimately bound to it. The subkeys are not mathematically derived from the primary — they're independently generated key pairs that are linked by the primary key's signature.

### Cross-Certification

Since OpenPGP v4, subkeys also sign back to the primary (cross-certification / back-signature):

```
Primary signs subkey: "I authorize this subkey"
Subkey signs primary: "I acknowledge this primary"
```

This prevents an attacker from taking your subkey and binding it to their own primary key. Both directions of the link must be present.

### Why This Design?

Unlike BIP-32 where all keys are derived from one seed, OpenPGP subkeys are independent key pairs. This means:
- You can generate subkeys on a hardware token (YubiKey) without the primary key present
- Subkeys can use different algorithms than the primary
- Revoking a subkey doesn't require regenerating anything
- The primary key can be kept offline permanently

The trade-off: you can't recover subkeys from the primary key alone (unlike BIP-32 where the seed recovers everything).

## Signal Protocol: Double Ratchet

Signal's key management links keys forward in time — each message key is derived from the previous state, and old keys are deleted. This provides forward secrecy: compromising the current key doesn't reveal past messages.

### The Ratchet

```
Root key (from initial key exchange)
  │
  ├─ DH Ratchet step (new ephemeral DH exchange)
  │   └─ New chain key
  │       ├─ Message key 0 (used once, then deleted)
  │       ├─ Message key 1
  │       └─ Message key 2
  │
  ├─ DH Ratchet step (another DH exchange)
  │   └─ New chain key
  │       ├─ Message key 0
  │       └─ ...
  └─ ...
```

### Key Derivation Chain

```
Chain key[n] → HMAC-SHA256(chain_key[n], 0x01) → Message key[n]
Chain key[n] → HMAC-SHA256(chain_key[n], 0x02) → Chain key[n+1]
```

Each chain key produces one message key and the next chain key. The chain key is then deleted. This is a one-way ratchet — you can go forward (derive the next key) but never backward (recover a previous key from the current one).

### The DH Ratchet

Periodically, both parties perform a new Diffie-Hellman exchange with fresh ephemeral keys:

```
Alice sends message with new ephemeral public key A'
Bob receives, computes new shared secret: DH(b, A') 
Bob derives new root key and sending chain key from shared secret
Bob sends reply with new ephemeral public key B'
Alice receives, computes: DH(a', B')
Alice derives new root key and receiving chain key
```

This means even if an attacker compromises the current chain key, the next DH ratchet step produces a completely new chain that the attacker can't follow. The keys are linked forward by HMAC chains, but the DH ratchet periodically "heals" the link by introducing fresh randomness.

### Properties

| Property | Mechanism |
|----------|-----------|
| Forward secrecy | Old chain keys are deleted; can't derive backward |
| Post-compromise security | DH ratchet introduces fresh entropy |
| Message independence | Each message key is used once |
| Out-of-order tolerance | Chain keys can skip ahead |

## Key Encapsulation Mechanisms (KEM)

KEMs are the post-quantum approach to key linking. Instead of Diffie-Hellman (vulnerable to quantum computers), a KEM generates a shared secret that's encapsulated (encrypted) under the recipient's public key.

```
Key generation:
  (public_key, private_key) = KEM.KeyGen()

Encapsulation (sender):
  (shared_secret, ciphertext) = KEM.Encaps(public_key)

Decapsulation (recipient):
  shared_secret = KEM.Decaps(private_key, ciphertext)
```

The shared secret is cryptographically linked to both the recipient's key pair and the randomness used during encapsulation. ML-KEM (formerly Kyber), the NIST post-quantum standard, works this way.

The link: the ciphertext can only be decapsulated by the holder of the private key. The shared secret is bound to both the public key (through encapsulation) and the private key (through decapsulation).

## Threshold Schemes: Distributed Key Linking

### Shamir's Secret Sharing

Split a secret into N shares where any K shares can reconstruct it, but K-1 shares reveal nothing.

```
Secret: s
Threshold: k (minimum shares needed)
Total shares: n

Construction:
  1. Choose random polynomial of degree k-1:
     f(x) = s + a1*x + a2*x^2 + ... + a(k-1)*x^(k-1)
  2. Evaluate at n points:
     share_i = f(i) for i = 1, 2, ..., n

Reconstruction:
  Given k shares, use Lagrange interpolation to recover f(0) = s
```

The shares are linked through the polynomial — any K of them determine the polynomial uniquely (and thus the secret), but fewer than K shares leave the secret information-theoretically hidden.

### Threshold Signatures (Schnorr, FROST)

Multiple parties each hold a key share. They collaborate to produce a single signature that's indistinguishable from a regular signature, without any party revealing their share.

```
Setup:
  - n parties, threshold t
  - Each party i holds share s_i
  - Combined public key: P = s_1*G + s_2*G + ... + s_n*G

Signing (simplified):
  1. Each party generates nonce share r_i, broadcasts R_i = r_i * G
  2. Aggregate nonce: R = R_1 + R_2 + ... + R_t
  3. Each party computes partial signature: z_i = r_i + H(R, P, message) * s_i
  4. Aggregate: z = z_1 + z_2 + ... + z_t
  5. Final signature: (R, z)

Verification (standard Schnorr):
  z * G == R + H(R, P, message) * P
```

The key shares are linked through the additive structure — they sum to the full private key, but no subset smaller than the threshold reveals it.

## Certificate Chains: Hierarchical Trust

X.509 certificate chains link keys through a hierarchy of signatures:

```
Root CA (self-signed, trusted by OS/browser)
  │ signs
  ├─ Intermediate CA
  │   │ signs
  │   ├─ Server certificate (example.com)
  │   └─ Server certificate (api.example.com)
  │
  └─ Intermediate CA 2
      │ signs
      └─ Client certificate (device-abc)
```

Each certificate contains:
- Subject's public key
- Issuer's identity
- Signature from the issuer's private key
- Validity period
- Constraints (what the key can be used for)

The link: the issuer's signature over the subject's public key. Anyone who trusts the root CA can verify the entire chain — root signed intermediate, intermediate signed leaf. The leaf key is cryptographically linked to the root through the chain of signatures.

### Key Properties of Certificate Chains

| Property | Mechanism |
|----------|-----------|
| Delegation | CA signs subordinate CAs |
| Revocation | CRL or OCSP invalidates a certificate |
| Constraint | Path length, key usage, name constraints |
| Expiration | Certificates have validity periods |
| Transparency | CT logs make all issued certificates auditable |

## Comparing Approaches

| Scheme | Link Type | Recovery | Forward Secrecy | Use Case |
|--------|-----------|----------|-----------------|----------|
| RSA/ECC key pair | Mathematical inverse | Neither key derives the other | No | Authentication, encryption |
| HKDF | Deterministic derivation | Master derives all children | No | Protocol key separation |
| BIP-32 | Hierarchical derivation | Seed recovers entire tree | No | Wallet address generation |
| OpenPGP subkeys | Signature binding | Independent keys, not derivable | No | Identity + role separation |
| Signal ratchet | Forward chain + DH | Cannot recover past keys | Yes | Messaging |
| Shamir sharing | Polynomial evaluation | K shares recover secret | No | Distributed custody |
| Certificate chain | Signature hierarchy | Parent signs children | No | PKI trust delegation |

## Wrapping Up

Every scheme here solves the same fundamental problem: establishing a verifiable relationship between keys without revealing the keys themselves. The differences are in what properties you need — can you recover child keys from a parent? Should compromising one key compromise others? Do you need forward secrecy? Do you need distributed trust?

The choice depends on your threat model. BIP-32 optimizes for backup (one seed recovers everything). Signal optimizes for forward secrecy (past keys are unrecoverable by design). OpenPGP optimizes for operational flexibility (rotate subkeys without changing identity). Certificate chains optimize for delegated trust (a root authority vouches for subordinates).

Understanding these linking mechanisms is what lets you evaluate whether a system's key management actually provides the security properties it claims.
