# Hash Algorithms

Additional cryptographic hash functions beyond Keccak-256.

## Overview

The library provides implementations of SHA-256, RIPEMD-160, and BLAKE2b hash functions, primarily for Bitcoin interoperability and legacy system support. All implementations use audited libraries (@noble/hashes).

## SHA-256

Standard SHA-2 family hash (256-bit output).

### API

```typescript
import { Sha256 } from '@tevm/primitives';

// Hash data
const hash = Sha256.hash(new Uint8Array([1, 2, 3]));  // 32 bytes

// Hash string (UTF-8 encoded)
const hash = Sha256.hashString('hello world');

// Hash hex data
const hash = Sha256.hashHex('0xdeadbeef');

// Incremental hashing
const hasher = Sha256.create();
hasher.update(chunk1);
hasher.update(chunk2);
const hash = hasher.digest();  // 32 bytes
```

### Use Cases

- Bitcoin transaction/block hashing (double SHA-256)
- Legacy system interoperability
- Cross-chain bridges
- EVM precompile 0x02

### Example: Bitcoin Double-SHA256

```typescript
function doubleSha256(data: Uint8Array): Uint8Array {
    const firstHash = Sha256.hash(data);
    return Sha256.hash(firstHash);
}

// Bitcoin block header hash
const blockHeaderHash = doubleSha256(blockHeaderBytes);
```

## RIPEMD-160

RACE Integrity Primitives Evaluation Message Digest (160-bit output).

### API

```typescript
import { Ripemd160 } from '@tevm/primitives';

// Hash data
const hash = Ripemd160.hash(new Uint8Array([1, 2, 3]));  // 20 bytes

// Hash string
const hash = Ripemd160.hashString('hello');

// Hash hex data
const hash = Ripemd160.hashHex('0x1234');
```

### Use Cases

- Bitcoin address generation (SHA-256 then RIPEMD-160)
- Legacy cryptographic systems
- EVM precompile 0x03

### Example: Bitcoin Address

```typescript
function publicKeyToAddress(publicKey: Uint8Array): Uint8Array {
    // Step 1: SHA-256 of public key
    const sha256Hash = Sha256.hash(publicKey);

    // Step 2: RIPEMD-160 of result
    const ripemd160Hash = Ripemd160.hash(sha256Hash);

    // Step 3: Add version byte + checksum (not shown)
    return ripemd160Hash;  // 20 bytes
}
```

## BLAKE2b

Modern hash function, faster than SHA-2/SHA-3.

### API

```typescript
import { Blake2b } from '@tevm/primitives';

// Hash with default 64-byte output
const hash = Blake2b.hash(data);

// Variable output length (1-64 bytes)
const hash20 = Blake2b.hash(data, 20);  // 20 bytes
const hash32 = Blake2b.hash(data, 32);  // 32 bytes
const hash64 = Blake2b.hash(data, 64);  // 64 bytes (default)

// Hash string
const hash = Blake2b.hashString('hello', 32);

// Incremental hashing
const hasher = Blake2b.create(32);  // 32-byte output
hasher.update(chunk1);
hasher.update(chunk2);
const hash = hasher.digest();
```

### Use Cases

- Zcash Sapling shielded transactions
- High-performance hashing (faster than SHA-256)
- Modern cryptographic protocols
- EVM precompile 0x09 (Blake2F compression function)

### Example: Zcash Interoperability

```typescript
// Blake2b with personalization (Zcash-style)
function zcashHash(data: Uint8Array, personalization: string): Uint8Array {
    // Blake2b with custom parameters
    const hash = Blake2b.hash(data, 32);
    // Note: Full Zcash implementation requires personalization parameter
    return hash;
}
```

## Comparison

| Algorithm | Output Size | Speed (MB/s) | Primary Use |
|-----------|-------------|--------------|-------------|
| Keccak-256 | 32 bytes | ~500 | Ethereum (everything) |
| SHA-256 | 32 bytes | ~300 | Bitcoin, legacy systems |
| RIPEMD-160 | 20 bytes | ~200 | Bitcoin addresses |
| BLAKE2b | 1-64 bytes | ~800 | Zcash, modern protocols |

*Speeds approximate, vary by platform

## Implementation Notes

### Audited Libraries

All hash implementations use audited libraries:
- **@noble/hashes** - Pure TypeScript, audited, no dependencies
- Hardware acceleration when available (SHA-256)

### No Native Dependencies

Unlike Keccak-256 which has optional Zig/WASM optimization, these hash functions use pure TypeScript:
- Works in all JavaScript environments
- No build step required
- Consistent behavior across platforms

### Incremental Hashing

For large data, use incremental hashing:

```typescript
const hasher = Sha256.create();

// Process 1GB file in chunks
for (const chunk of largeFileChunks) {
    hasher.update(chunk);
}

const finalHash = hasher.digest();
```

This avoids loading entire dataset into memory.

## Security Notes

1. **SHA-256**: Secure, widely used, no known practical attacks
2. **RIPEMD-160**: Generally secure but shorter output (160 bits) means easier brute force than 256-bit hashes
3. **BLAKE2b**: Modern, secure, faster than SHA-2

### Collision Resistance

- **256-bit output** (Keccak-256, SHA-256, BLAKE2b-256): ~2^128 operations
- **160-bit output** (RIPEMD-160): ~2^80 operations

Use 256-bit hashes for new protocols.

## Testing

Test coverage in:
- `sha256.test.ts`, `sha256.bench.ts`
- `ripemd160.test.ts`, `ripemd160.bench.ts`
- `blake2.test.ts`, `blake2.bench.ts`

Test vectors from:
- NIST test vectors (SHA-256)
- Bitcoin reference implementations
- Zcash test vectors (BLAKE2b)

## References

- [FIPS 180-4](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.180-4.pdf) - SHA-2 Standard
- [RIPEMD-160](https://homes.esat.kuleuven.be/~bosselae/ripemd160.html) - Original specification
- [BLAKE2](https://blake2.net/) - Official BLAKE2 website
- [Bitcoin Developer Guide](https://developer.bitcoin.org/reference/transactions.html#opcodes) - Bitcoin hashing
- [Zcash Protocol Spec](https://zips.z.cash/protocol/protocol.pdf) - BLAKE2b usage

## Zig API

```zig
const crypto = @import("crypto");

// SHA-256
const sha_hash = try crypto.sha256(allocator, data);
defer allocator.free(sha_hash);

// RIPEMD-160
const ripemd_hash = try crypto.ripemd160(allocator, data);
defer allocator.free(ripemd_hash);

// BLAKE2b
const blake_hash = try crypto.blake2b(allocator, data, 32);
defer allocator.free(blake_hash);
```
