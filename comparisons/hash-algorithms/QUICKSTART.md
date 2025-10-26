# Hash Algorithms Quick Reference

Quick reference for using SHA-256, RIPEMD-160, and BLAKE2b across guil, ethers, and viem.

## Current Status (2025)

| Function | Guil | Ethers | Viem | @noble/hashes |
|----------|------|--------|------|---------------|
| sha256 | ⏳ Coming Soon | ✓ Ready | ✓ Ready | ✓ Ready |
| ripemd160 | ⏳ Coming Soon | ✓ Ready | ✓ Ready | ✓ Ready |
| blake2b | ⏳ Coming Soon | ❌ N/A | ❌ N/A | ✓ Ready |

## Quick Start Examples

### SHA-256

**Using Ethers**:
```typescript
import { sha256 } from 'ethers';

const hash = sha256('0x616263'); // "abc"
// 0xba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad
```

**Using Viem**:
```typescript
import { sha256 } from 'viem';

const hash = sha256('0x616263'); // "abc"
// 0xba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad

// Return as bytes
const bytes = sha256('0x616263', 'bytes');
```

**Using @noble/hashes**:
```typescript
import { sha256 } from '@noble/hashes/sha256.js';
import { bytesToHex } from '@noble/hashes/utils.js';

const hash = sha256(new Uint8Array([0x61, 0x62, 0x63]));
const hex = `0x${bytesToHex(hash)}`;
```

### RIPEMD-160

**Using Ethers**:
```typescript
import { ripemd160 } from 'ethers';

const hash = ripemd160('0x616263'); // "abc"
// 0x8eb208f7e05d987a9b044a8e98c6b087f15a0bfc
```

**Using Viem**:
```typescript
import { ripemd160 } from 'viem';

const hash = ripemd160('0x616263'); // "abc"
// 0x8eb208f7e05d987a9b044a8e98c6b087f15a0bfc
```

**Using @noble/hashes**:
```typescript
import { ripemd160 } from '@noble/hashes/ripemd160.js';
import { bytesToHex } from '@noble/hashes/utils.js';

const hash = ripemd160(new Uint8Array([0x61, 0x62, 0x63]));
const hex = `0x${bytesToHex(hash)}`;
```

### BLAKE2b

**Using @noble/hashes** (only option):
```typescript
import { blake2b } from '@noble/hashes/blake2b.js';
import { bytesToHex } from '@noble/hashes/utils.js';

// Default 64 bytes
const hash = blake2b(new Uint8Array([0x61, 0x62, 0x63]));
const hex = `0x${bytesToHex(hash)}`;

// Custom output length (32 bytes)
const hash32 = blake2b(new Uint8Array([0x61, 0x62, 0x63]), { dkLen: 32 });

// With key (MAC mode)
const key = new Uint8Array(32);
const mac = blake2b(data, { key });
```

## Common Use Cases

### Bitcoin Address Generation

```typescript
import { sha256, ripemd160 } from 'ethers'; // or viem

function publicKeyToHash160(publicKey: string): string {
    const sha = sha256(publicKey);
    const ripe = ripemd160(sha);
    return ripe;
}
```

### Merkle Tree

```typescript
import { sha256 } from 'viem';

function merkleRoot(leaves: string[]): string {
    let layer = leaves.map(leaf => sha256(leaf));
    while (layer.length > 1) {
        const nextLayer = [];
        for (let i = 0; i < layer.length; i += 2) {
            const left = layer[i];
            const right = layer[i + 1] || left;
            nextLayer.push(sha256(left + right.slice(2)));
        }
        layer = nextLayer;
    }
    return layer[0];
}
```

### BLAKE2b MAC

```typescript
import { blake2b } from '@noble/hashes/blake2b.js';

function createMAC(message: Uint8Array, key: Uint8Array): Uint8Array {
    return blake2b(message, { key, dkLen: 32 });
}
```

## Installation

**Ethers**:
```bash
npm install ethers
# or
bun add ethers
```

**Viem**:
```bash
npm install viem
# or
bun add viem
```

**@noble/hashes**:
```bash
npm install @noble/hashes
# or
bun add @noble/hashes
```

## Recommendation

**Right now**: Use viem or @noble/hashes for best bundle size and performance.

**When guil implements**: Migrate to guil for native performance.

## Test Vectors

### SHA-256
```typescript
sha256('0x') === '0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
sha256('0x616263') === '0xba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
```

### RIPEMD-160
```typescript
ripemd160('0x') === '0x9c1185a5c5e9fc54612808977ee8f548b2258d31'
ripemd160('0x616263') === '0x8eb208f7e05d987a9b044a8e98c6b087f15a0bfc'
```

### BLAKE2b
```typescript
blake2b('0x616263') === '0xba80a53f981c4d0d6a2797b69f12f6e94c212f14685ac4b74b12bb6fdbffa2d1...'
```

## More Information

- **Comprehensive Guide**: [README.md](./README.md)
- **Detailed Comparison**: [docs.md](./docs.md)
- **Implementation Summary**: [SUMMARY.md](./SUMMARY.md)
- **Source Code**: `/Users/williamcory/primitives/src/crypto/hash-algorithms.ts`
