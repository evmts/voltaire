# Hash Algorithms Comparison

Comprehensive comparison of cryptographic hash algorithm implementations across guil (@tevm/primitives), ethers, and viem.

## Overview

This documentation covers three essential cryptographic hash functions used in blockchain and cryptocurrency applications:

1. **sha256** - SHA-256 (Secure Hash Algorithm 256-bit)
2. **ripemd160** - RIPEMD-160 (RACE Integrity Primitives Evaluation Message Digest 160-bit)
3. **blake2b** - BLAKE2b (Fast cryptographic hash optimized for 64-bit platforms)

## Current Implementation Status

### Guil (@tevm/primitives)

**Status**: Stub implementations awaiting C API bindings

All three hash functions are currently stubbed in guil and will throw errors when called:

```typescript
// src/crypto/hash-algorithms.ts
export function sha256(data: Uint8Array | string): string {
    throw new Error("not implemented - requires C API binding");
}

export function ripemd160(data: Uint8Array | string): string {
    throw new Error("not implemented - requires C API binding");
}

export function blake2b(data: Uint8Array | string): string {
    throw new Error("not implemented - requires C API binding");
}
```

**Why C API Bindings?**

Guil is built on a Zig backend for maximum performance. These hash algorithms will be implemented in Zig and exposed to JavaScript via Foreign Function Interface (FFI). This approach provides:

- **Zero-copy operations**: Direct memory access without JavaScript overhead
- **Native performance**: Compiled Zig code runs at native speeds
- **Memory safety**: Zig's compile-time memory safety guarantees
- **Consistency**: Same implementation across all platforms

**Expected Timeline**: These implementations are planned for a future release once the FFI layer is fully established.

### Ethers.js

**Status**: Fully implemented and production-ready

Ethers provides native implementations for SHA-256 and RIPEMD-160:

- `sha256(data: BytesLike): string` - Returns 32-byte hex string
- `ripemd160(data: BytesLike): string` - Returns 20-byte hex string
- BLAKE2b is **not included** in ethers

### Viem

**Status**: Fully implemented via @noble/hashes re-exports

Viem provides SHA-256 and RIPEMD-160 by re-exporting from the audited @noble/hashes library:

- `sha256(value: Hex | ByteArray, to?: "bytes" | "hex"): Hex | ByteArray`
- `ripemd160(value: Hex | ByteArray, to?: "bytes" | "hex"): Hex | ByteArray`
- BLAKE2b is **not included** in viem (but available in @noble/hashes)

## Hash Algorithm Details

### SHA-256 (Secure Hash Algorithm 256-bit)

**Overview**: SHA-256 is part of the SHA-2 family of cryptographic hash functions designed by the NSA. It produces a 256-bit (32-byte) hash value.

**Use Cases in Crypto**:
- Bitcoin addresses (part of the process)
- Bitcoin transaction IDs
- Bitcoin mining (double SHA-256)
- Merkle tree construction
- General-purpose cryptographic hashing

**Output**: 32 bytes (64 hex characters)

**Properties**:
- Deterministic: Same input always produces same output
- One-way: Computationally infeasible to reverse
- Collision-resistant: Hard to find two inputs with same hash
- Avalanche effect: Small input change drastically changes output

**Test Vector**:
```
Input:  "abc"
SHA-256: ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad
```

### RIPEMD-160

**Overview**: RIPEMD-160 (RACE Integrity Primitives Evaluation Message Digest) is a 160-bit cryptographic hash function developed in Europe as an alternative to SHA-1.

**Use Cases in Crypto**:
- Bitcoin addresses (SHA-256 then RIPEMD-160 of public key)
- Bitcoin Pay-to-PubKey-Hash (P2PKH) addresses
- Bitcoin Pay-to-Script-Hash (P2SH) addresses
- Compact hash representation

**Output**: 20 bytes (40 hex characters)

**Bitcoin Address Generation**:
```
Public Key → SHA-256 → RIPEMD-160 → Base58Check → Bitcoin Address
```

**Properties**:
- Shorter output than SHA-256 (160 vs 256 bits)
- Designed with multiple parallel paths for security
- Resistant to known cryptographic attacks
- Part of Bitcoin's address generation since genesis

**Test Vector**:
```
Input:  "abc"
RIPEMD-160: 8eb208f7e05d987a9b044a8e98c6b087f15a0bfc
```

### BLAKE2b

**Overview**: BLAKE2 is a cryptographic hash function faster than MD5, SHA-1, SHA-2, and SHA-3, yet more secure than MD5 and SHA-1. BLAKE2b is optimized for 64-bit platforms.

**Use Cases in Crypto**:
- Zcash (Equihash proof-of-work)
- Nano cryptocurrency
- Ethereum 2.0 / Beacon Chain (BLS signatures)
- IPFS content addressing (multihash format)
- General-purpose hashing with performance requirements

**Output**: Variable length, default 64 bytes (128 hex characters)

**Properties**:
- Faster than SHA-256 while maintaining security
- Configurable output length (1-64 bytes)
- Optional keying for MAC functionality
- Optional salt and personalization parameters
- Resistant to timing attacks

**Advanced Features**:
- **Keyed hashing**: Acts as a MAC (Message Authentication Code)
- **Personalization**: Prevents hash collisions across different applications
- **Salt**: Additional randomization parameter

**Test Vector**:
```
Input:  "abc"
BLAKE2b-512: ba80a53f981c4d0d6a2797b69f12f6e94c212f14685ac4b74b12bb6fdbffa2d17d87c5392aab792dc252d5de4533cc9518d38aa8dbf1925ab92386edd4009923
```

## Usage Examples

### Temporary Solution: Using @noble/hashes

While guil's native implementations are in development, you can use @noble/hashes directly:

```typescript
import { sha256 } from '@noble/hashes/sha256.js';
import { ripemd160 } from '@noble/hashes/ripemd160.js';
import { blake2b } from '@noble/hashes/blake2b.js';
import { bytesToHex } from '@noble/hashes/utils.js';

// SHA-256
const data = new Uint8Array([0x61, 0x62, 0x63]); // "abc"
const sha256Hash = sha256(data);
console.log(`0x${bytesToHex(sha256Hash)}`);
// 0xba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad

// RIPEMD-160
const ripemd160Hash = ripemd160(data);
console.log(`0x${bytesToHex(ripemd160Hash)}`);
// 0x8eb208f7e05d987a9b044a8e98c6b087f15a0bfc

// BLAKE2b (default 64 bytes)
const blake2bHash = blake2b(data);
console.log(`0x${bytesToHex(blake2bHash)}`);

// BLAKE2b with custom output length
const blake2b32 = blake2b(data, { dkLen: 32 });
console.log(`0x${bytesToHex(blake2b32)}`);
```

### Ethers.js

```typescript
import { sha256, ripemd160 } from 'ethers';

// SHA-256
const sha256Hash = sha256('0x616263'); // "abc" in hex
console.log(sha256Hash);
// 0xba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad

// From Uint8Array
const data = new Uint8Array([0x61, 0x62, 0x63]);
const sha256Hash2 = sha256(data);
console.log(sha256Hash2);

// RIPEMD-160
const ripemd160Hash = ripemd160('0x616263');
console.log(ripemd160Hash);
// 0x8eb208f7e05d987a9b044a8e98c6b087f15a0bfc

// BLAKE2b: Not available in ethers
// Use @noble/hashes directly for BLAKE2b
```

### Viem

```typescript
import { sha256, ripemd160 } from 'viem';

// SHA-256 (returns hex by default)
const sha256Hash = sha256('0x616263'); // "abc" in hex
console.log(sha256Hash);
// 0xba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad

// From Uint8Array
const data = new Uint8Array([0x61, 0x62, 0x63]);
const sha256Hash2 = sha256(data);
console.log(sha256Hash2);

// Return as bytes
const sha256Bytes = sha256(data, 'bytes');
console.log(sha256Bytes); // Uint8Array

// RIPEMD-160
const ripemd160Hash = ripemd160('0x616263');
console.log(ripemd160Hash);
// 0x8eb208f7e05d987a9b044a8e98c6b087f15a0bfc

// BLAKE2b: Not available in viem
// Use @noble/hashes directly for BLAKE2b
```

## Bitcoin Address Generation Example

Here's how these hash functions work together to create a Bitcoin address:

```typescript
import { sha256 } from 'ethers'; // or viem
import { ripemd160 } from 'ethers'; // or viem
import { base58 } from 'some-base58-library';

function generateBitcoinAddress(publicKey: string): string {
    // Step 1: SHA-256 of public key
    const sha256Hash = sha256(publicKey);

    // Step 2: RIPEMD-160 of the SHA-256 hash
    const ripemd160Hash = ripemd160(sha256Hash);

    // Step 3: Add version byte (0x00 for mainnet)
    const versioned = '0x00' + ripemd160Hash.slice(2);

    // Step 4: Double SHA-256 for checksum
    const checksum1 = sha256(versioned);
    const checksum2 = sha256(checksum1);
    const checksum = checksum2.slice(0, 10); // First 4 bytes

    // Step 5: Concatenate and encode with Base58
    const final = versioned + checksum.slice(2);
    return base58.encode(final);
}
```

## Performance Considerations

### Expected Performance (when implemented)

**Guil (Zig + FFI)**:
- Expected to be the fastest due to native compilation
- Zero-copy operations reduce memory overhead
- Consistent performance across all platforms

**Ethers**:
- Optimized JavaScript implementations
- Good performance for most use cases
- Larger bundle size due to included implementations

**Viem**:
- Uses @noble/hashes (audited, minimal implementation)
- Excellent performance with small bundle size
- Tree-shakeable imports

### Performance Benchmarking

Currently, benchmarks cannot be run for guil implementations since they are stubs. Once implemented, this directory will include:

```
comparisons/hash-algorithms/
├── sha256/
│   ├── guil.ts           # Native Zig implementation
│   ├── ethers.ts         # Ethers implementation
│   └── viem.ts           # Viem/@noble implementation
├── ripemd160/
│   ├── guil.ts
│   ├── ethers.ts
│   └── viem.ts
├── blake2b/
│   ├── guil.ts
│   ├── ethers.ts         # N/A (not in ethers)
│   └── viem.ts           # N/A (not in viem)
├── sha256.bench.ts
├── ripemd160.bench.ts
└── blake2b.bench.ts
```

## Migration Path

### When Guil Implements These Functions

Once guil's native implementations are available:

**Before (temporary solution)**:
```typescript
import { sha256 } from '@noble/hashes/sha256.js';
import { bytesToHex } from '@noble/hashes/utils.js';

const hash = sha256(data);
const hex = `0x${bytesToHex(hash)}`;
```

**After (native guil)**:
```typescript
import { sha256 } from '@tevm/primitives/crypto';

const hex = sha256(data); // Returns hex string with 0x prefix
```

### Benefits After Migration

1. **Performance**: Native Zig implementations will be significantly faster
2. **Consistency**: Same implementation across Node.js, Bun, Deno, browsers
3. **Type Safety**: Full TypeScript support with proper types
4. **Bundle Size**: Smaller bundles due to native bindings
5. **Memory Safety**: Zig's compile-time guarantees prevent memory bugs

## Security Considerations

### Cryptographic Security

All three hash functions are considered cryptographically secure for their intended use cases:

- **SHA-256**: Secure for general-purpose hashing, no known practical attacks
- **RIPEMD-160**: Secure for Bitcoin address generation, though shorter than SHA-256
- **BLAKE2b**: Secure and faster than SHA-256, suitable for modern applications

### Implementation Security

- **@noble/hashes**: Audited implementation, widely used in production
- **Ethers**: Battle-tested in production, used by millions
- **Viem**: Re-exports from @noble/hashes, inherits its security properties
- **Guil (future)**: Will undergo security audits before production release

### Constant-Time Operations

Cryptographic implementations should be resistant to timing attacks. Guil's future Zig implementations will ensure:

- Constant-time comparisons
- No data-dependent branches in critical paths
- Secure memory clearing after use

## Test Vectors

### SHA-256 Test Vectors

```typescript
// Empty string
sha256('') === '0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'

// "abc"
sha256('0x616263') === '0xba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'

// "hello world"
sha256('0x68656c6c6f20776f726c64') === '0xb94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9'
```

### RIPEMD-160 Test Vectors

```typescript
// Empty string
ripemd160('') === '0x9c1185a5c5e9fc54612808977ee8f548b2258d31'

// "abc"
ripemd160('0x616263') === '0x8eb208f7e05d987a9b044a8e98c6b087f15a0bfc'

// "hello world"
ripemd160('0x68656c6c6f20776f726c64') === '0x98c615784ccb5fe5936fbc0cbe9dfdb408d92f0f'
```

### BLAKE2b Test Vectors

```typescript
// Empty string (512-bit)
blake2b('') === '0x786a02f742015903c6c6fd852552d272912f4740e15847618a86e217f71f5419d25e1031afee585313896444934eb04b903a685b1448b755d56f701afe9be2ce'

// "abc" (512-bit)
blake2b('0x616263') === '0xba80a53f981c4d0d6a2797b69f12f6e94c212f14685ac4b74b12bb6fdbffa2d17d87c5392aab792dc252d5de4533cc9518d38aa8dbf1925ab92386edd4009923'
```

## Related Documentation

### Specifications
- [SHA-256 (FIPS 180-4)](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.180-4.pdf)
- [RIPEMD-160 Original Paper](https://homes.esat.kuleuven.be/~bosselae/ripemd160.html)
- [BLAKE2 Specification](https://www.blake2.net/blake2.pdf)

### Library Documentation
- [Ethers Crypto Documentation](https://docs.ethers.org/v6/api/crypto/)
- [Viem Utilities](https://viem.sh/docs/utilities/sha256)
- [@noble/hashes GitHub](https://github.com/paulmillr/noble-hashes)

### Bitcoin
- [Bitcoin Developer Guide - Address Generation](https://developer.bitcoin.org/devguide/wallets.html)
- [Technical Background of Bitcoin Addresses](https://en.bitcoin.it/wiki/Technical_background_of_version_1_Bitcoin_addresses)

### Source Files
- Guil: `/Users/williamcory/primitives/src/crypto/hash-algorithms.ts`
- Detailed comparison: `/Users/williamcory/primitives/comparisons/hash-algorithms/docs.md`

## FAQ

### Why are these functions not implemented in guil yet?

These functions require FFI (Foreign Function Interface) bindings to the Zig backend. The team is prioritizing core Ethereum primitives (Keccak-256, ECDSA) before implementing these supplementary hash functions.

### Can I use @noble/hashes in production with guil?

Yes! @noble/hashes is a production-ready, audited library used by viem and many other projects. It's an excellent temporary solution until guil's native implementations are ready.

### Will guil support BLAKE2b if ethers and viem don't?

Yes. BLAKE2b is used in several blockchain protocols (Zcash, Ethereum 2.0 BLS signatures, etc.) and will be included in guil's comprehensive crypto suite.

### How will performance compare when guil implements these?

Zig's native compilation should provide 2-5x performance improvements over JavaScript implementations, similar to the performance gains seen in other guil primitives.

### Should I wait for guil implementations or use alternatives now?

Use alternatives now. @noble/hashes is production-ready, secure, and performant. You can easily migrate to guil's implementations when they're released.

## Summary

| Feature | Guil (Planned) | Ethers | Viem |
|---------|----------------|---------|------|
| SHA-256 | Coming Soon | ✓ | ✓ |
| RIPEMD-160 | Coming Soon | ✓ | ✓ |
| BLAKE2b | Coming Soon | ✗ | ✗ (use @noble) |
| Implementation | Native Zig + FFI | JavaScript | @noble/hashes |
| Bundle Size | Smallest | Largest | Medium |
| Performance | Fastest (expected) | Good | Excellent |
| Production Ready | No | Yes | Yes |

**Recommendation**: Use @noble/hashes directly or via viem/ethers until guil's implementations are released. Plan for easy migration when native implementations become available.
