# HMAC

RFC 2104 Hash-based Message Authentication Codes (`HMAC-SHA256` and `HMAC-SHA512`) in `voltaire::crypto`.

## API Summary

| Algorithm | Output | Block Size | One-shot Function | Streaming Type |
|-----------|--------|------------|-------------------|----------------|
| HMAC-SHA256 | `[u8; 32]` | 64 bytes | `hmac_sha256(key: &[u8], data: &[u8]) -> [u8; 32]` | `HmacSha256` |
| HMAC-SHA512 | `[u8; 64]` | 128 bytes | `hmac_sha512(key: &[u8], data: &[u8]) -> [u8; 64]` | `HmacSha512` |

## Usage

```rust
use voltaire::crypto::{hmac_sha256, hmac_sha512, HmacSha256, HmacSha512};

// One-shot HMAC-SHA256
let mac256: [u8; 32] = hmac_sha256(b"secret-key", b"hello world");

// Streaming HMAC-SHA256
let mut h256 = HmacSha256::new(b"secret-key");
h256.update(b"hello ");
h256.update(b"world");
assert_eq!(h256.finalize(), mac256);

// One-shot and streaming HMAC-SHA512 (used by BIP-32/39)
let mac512: [u8; 64] = hmac_sha512(b"Bitcoin seed", b"seed-bytes");
let mut h512 = HmacSha512::new(b"Bitcoin seed");
h512.update(b"seed-bytes");
assert_eq!(h512.finalize(), mac512);
```

## Key Handling and Verification

- Keys longer than the underlying hash block size (64 bytes for SHA-256, 128 bytes for SHA-512) are hashed before padding; shorter keys are right-padded with zero bytes per RFC 2104.
- Compare MACs in constant time when authenticating untrusted input to avoid timing side channels.
