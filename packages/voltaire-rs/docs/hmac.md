# HMAC

Hash-based Message Authentication Code for verifying data integrity and authenticity.

## Overview

HMAC combines a cryptographic hash with a secret key to produce a message authentication code (MAC). This module provides:

- **HMAC-SHA256** - 32-byte MAC using SHA-256
- **HMAC-SHA512** - 64-byte MAC using SHA-512

## HMAC-SHA256

```rust
use voltaire::crypto::{hmac_sha256, HmacSha256};

// One-shot
let mac = hmac_sha256(b"secret-key", b"message");

// Streaming
let mut hmac = HmacSha256::new(b"secret-key");
hmac.update(b"hello");
hmac.update(b" world");
let mac = hmac.finalize();
```

## HMAC-SHA512

```rust
use voltaire::crypto::{hmac_sha512, HmacSha512};

// One-shot
let mac = hmac_sha512(b"secret-key", b"message");

// Streaming
let mut hmac = HmacSha512::new(b"secret-key");
hmac.update(b"hello");
hmac.update(b" world");
let mac = hmac.finalize();
```

## Key Handling

Keys are processed according to RFC 2104:
- Keys longer than block size are hashed first
- Keys shorter than block size are zero-padded

```rust
use voltaire::crypto::hmac_sha256;

// Short key (padded internally)
let mac = hmac_sha256(b"key", b"data");

// Long key (hashed internally) - same security
let long_key = [0xaa; 200];
let mac = hmac_sha256(&long_key, b"data");
```

## Use Cases

- **API authentication** - Signing requests with shared secrets
- **Token verification** - Validating JWT signatures
- **Key derivation** - Used in HKDF and PBKDF2
- **Data integrity** - Detecting tampering with authenticated data

## Security Notes

- Use constant-time comparison when verifying MACs
- Keys should be at least 256 bits for SHA-256, 512 bits for SHA-512
- Never reuse keys across different security domains
