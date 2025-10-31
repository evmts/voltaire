# RIPEMD160

Legacy cryptographic hash function producing 20-byte (160-bit) hashes. Primary use in Bitcoin address generation.

## Overview

RIPEMD160 (RACE Integrity Primitives Evaluation Message Digest 160-bit) is a cryptographic hash function designed in 1996. While superseded by SHA-2/SHA-3 for modern applications, RIPEMD160 remains critical for Bitcoin and other cryptocurrency systems.

**Key Properties:**
- Output: 20 bytes (160 bits)
- Block size: 64 bytes (512 bits)
- Deterministic
- Collision resistant (theoretically)
- Pre-image resistant
- Avalanche effect

## API

### `Ripemd160.hash(data: Uint8Array | string): Uint8Array`

Compute RIPEMD160 hash of data.

```typescript
import { Ripemd160 } from '@tevm/voltaire';

// Hash bytes
const data = new Uint8Array([1, 2, 3, 4]);
const hash = Ripemd160.hash(data);
// Uint8Array(20) [...]

// Hash string
const hash2 = Ripemd160.hash("hello");
// Uint8Array(20) [0x10, 0x8f, ...]
```

### `Ripemd160.hashString(str: string): Uint8Array`

Hash UTF-8 string.

```typescript
const hash = Ripemd160.hashString("message");
// Uint8Array(20)
```

## Usage Examples

### Bitcoin Address Generation

Bitcoin uses RIPEMD160(SHA256(pubkey)) for address generation:

```typescript
import { Ripemd160 } from '@tevm/voltaire';
import { Hash } from '@tevm/voltaire';

// Step 1: SHA256 of public key
const pubkey = new Uint8Array([/* public key bytes */]);
const sha256Hash = Hash.keccak256(pubkey); // In real Bitcoin, use SHA256

// Step 2: RIPEMD160 of SHA256 hash
const pubkeyHash = Ripemd160.hash(sha256Hash);
// pubkeyHash is 20 bytes - used in Bitcoin addresses
```

### Data Fingerprinting

```typescript
const data = new Uint8Array(1024).fill(42);
const fingerprint = Ripemd160.hash(data);
// 20-byte unique identifier
```

### String Hashing

```typescript
const message = "The quick brown fox jumps over the lazy dog";
const hash = Ripemd160.hashString(message);
// 160-bit hash of message
```

## Performance Characteristics

Typical performance on modern hardware:

- **32 bytes**: ~500,000 ops/sec (~0.002ms per hash)
- **1 KB**: ~100,000 ops/sec (~0.01ms per hash)
- **64 KB**: ~2,000 ops/sec (~0.5ms per hash)
- **1 MB**: ~100 ops/sec (~10ms per hash)

RIPEMD160 is slower than modern hash functions like SHA-256 or BLAKE2 but adequate for its legacy use cases.

## Implementation

Uses `@noble/hashes/ripemd160` - a well-tested, audited TypeScript implementation.

**Security Notes:**
- RIPEMD160 is cryptographically secure but considered legacy
- For new applications, prefer SHA-256, SHA-3, or BLAKE2/BLAKE3
- Only use RIPEMD160 for compatibility (e.g., Bitcoin)

## Legacy Context

### Why RIPEMD160 Exists

RIPEMD160 was designed as an alternative to MD5 and SHA-1 during the mid-1990s cryptographic hash function development. It was part of the RIPEMD family created by European researchers.

### Bitcoin's Choice

Bitcoin (2008) chose RIPEMD160 for address generation for several reasons:

1. **Shorter addresses**: 20 bytes vs 32 bytes (SHA-256), reducing address size
2. **Defense in depth**: Using two different hash functions (SHA-256 + RIPEMD160) provides redundancy
3. **Mature algorithm**: Well-studied by 2008
4. **No known attacks**: At the time, RIPEMD160 had no practical attacks

### Modern Status

- **Legacy status**: Not recommended for new applications
- **Still secure**: No practical attacks known (as of 2025)
- **Bitcoin dependency**: Cannot be changed due to consensus rules
- **Alternatives**: SHA-256, SHA-3, BLAKE2b, BLAKE3 preferred for new systems

## Test Vectors

Official RIPEMD160 test vectors:

```typescript
// Empty string
Ripemd160.hashString('');
// [0x9c, 0x11, 0x85, 0xa5, 0xc5, 0xe9, 0xfc, 0x54,
//  0x61, 0x28, 0x08, 0x97, 0x7e, 0xe8, 0xf5, 0x48,
//  0xb2, 0x25, 0x8d, 0x31]

// "abc"
Ripemd160.hashString('abc');
// [0x8e, 0xb2, 0x08, 0xf7, 0xe0, 0x5d, 0x98, 0x7a,
//  0x9b, 0x04, 0x4a, 0x8e, 0x98, 0xc6, 0xb0, 0x87,
//  0xf1, 0x5a, 0x0b, 0xfc]

// "hello"
Ripemd160.hashString('hello');
// [0x10, 0x8f, 0x07, 0xb8, 0x38, 0x25, 0x11, 0x5b,
//  0x01, 0x3f, 0x03, 0xc8, 0x13, 0xb9, 0xa8, 0xa7,
//  0x29, 0xf8, 0xaa, 0xbb]
```

## References

- [RIPEMD160 Specification](https://homes.esat.kuleuven.be/~bosselae/ripemd160.html)
- [Bitcoin Address Generation](https://en.bitcoin.it/wiki/Technical_background_of_version_1_Bitcoin_addresses)
- [@noble/hashes](https://github.com/paulmillr/noble-hashes)
