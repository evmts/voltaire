# Keccak256

Pure TypeScript Keccak256 implementation using @noble/hashes.

## Overview

Keccak256 is the cryptographic hash function used throughout Ethereum for:
- Computing contract addresses
- Hashing transaction data
- Function and event signatures
- Merkle tree construction
- EVM SHA3 opcode

This implementation provides a data-first API following the primitives pattern with full type safety and performance optimizations.

## Constants

- `DIGEST_SIZE`: 32 bytes (256 bits)
- `RATE`: 136 bytes (1088 bits) - Keccak-256 rate
- `STATE_SIZE`: 25 u64 words (1600 bits) - Internal state size

## API

### Core Hashing

#### `hash(data: Uint8Array): Hash`

Hash raw bytes with Keccak-256.

```typescript
const data = new Uint8Array([1, 2, 3, 4, 5]);
const digest = Keccak256.hash(data);
// Hash (32 bytes)
```

#### `hashString(str: string): Hash`

Hash UTF-8 encoded string with Keccak-256.

```typescript
const digest = Keccak256.hashString("hello");
// Hash (32 bytes)
```

**Test Vectors:**
- `""` → `0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470`
- `"abc"` → `0x4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45`
- `"hello"` → `0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8`

#### `hashHex(hex: string): Hash`

Hash hex string with Keccak-256. Accepts with or without 0x prefix.

```typescript
const digest = Keccak256.hashHex("0x1234");
// Equivalent to: Keccak256.hash(new Uint8Array([0x12, 0x34]))
```

**Throws:**
- If hex string has odd length
- If hex string contains invalid characters

#### `hashMultiple(chunks: readonly Uint8Array[]): Hash`

Hash multiple chunks in sequence. Equivalent to hashing the concatenation.

```typescript
const digest = Keccak256.hashMultiple([chunk1, chunk2, chunk3]);
// Equivalent to: Keccak256.hash(concat(chunk1, chunk2, chunk3))
```

### Ethereum Utilities

#### `selector(signature: string): Uint8Array`

Compute function selector (first 4 bytes of Keccak-256 hash).

```typescript
const selector = Keccak256.selector("transfer(address,uint256)");
// Uint8Array([0xa9, 0x05, 0x9c, 0xbb])
```

**Common Selectors:**
- `transfer(address,uint256)` → `0xa9059cbb`
- `balanceOf(address)` → `0x70a08231`
- `approve(address,uint256)` → `0x095ea7b3`

#### `topic(signature: string): Hash`

Compute event topic (32-byte Keccak-256 hash).

```typescript
const topic = Keccak256.topic("Transfer(address,address,uint256)");
// Hash (32 bytes)
```

**Common Topics:**
- `Transfer(address,address,uint256)` → `0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef`
- `Approval(address,address,uint256)` → `0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925`

#### `contractAddress(sender: Uint8Array, nonce: bigint): Uint8Array`

Compute contract address from deployer and nonce (CREATE).

```typescript
const deployer = new Uint8Array(20); // 20-byte address
const nonce = 0n;
const address = Keccak256.contractAddress(deployer, nonce);
// Uint8Array (20 bytes)
```

**Formula:** `keccak256(rlp([sender, nonce]))[12:]`

**Throws:**
- If sender is not 20 bytes

#### `create2Address(sender: Uint8Array, salt: Uint8Array, initCodeHash: Uint8Array): Uint8Array`

Compute CREATE2 address.

```typescript
const deployer = new Uint8Array(20);
const salt = new Uint8Array(32);
const initCodeHash = new Uint8Array(32);
const address = Keccak256.create2Address(deployer, salt, initCodeHash);
// Uint8Array (20 bytes)
```

**Formula:** `keccak256(0xff ++ sender ++ salt ++ keccak256(init_code))[12:]`

**Throws:**
- If sender is not 20 bytes
- If salt is not 32 bytes
- If initCodeHash is not 32 bytes

## Usage Examples

### Basic Hashing

```typescript
import { Keccak256 } from './keccak256.js';

// Hash bytes
const data = new Uint8Array([1, 2, 3, 4, 5]);
const hash = Keccak256.hash(data);

// Hash string
const hash = Keccak256.hashString("hello world");

// Hash hex
const hash = Keccak256.hashHex("0xdeadbeef");
```

### Function Signatures

```typescript
// Compute function selector
const transferSelector = Keccak256.selector("transfer(address,uint256)");
console.log(transferSelector); // Uint8Array([0xa9, 0x05, 0x9c, 0xbb])

// Build calldata
const calldata = new Uint8Array([...transferSelector, ...encodedArgs]);
```

### Event Filtering

```typescript
// Compute event topic
const transferTopic = Keccak256.topic("Transfer(address,address,uint256)");

// Filter logs
const logs = await provider.getLogs({
  topics: [transferTopic],
  fromBlock: 0,
  toBlock: 'latest'
});
```

### Contract Deployment

```typescript
// Predict CREATE address
const deployerAddress = new Uint8Array(20);
const nonce = 5n;
const futureAddress = Keccak256.contractAddress(deployerAddress, nonce);

// Predict CREATE2 address
const salt = new Uint8Array(32);
const initCodeHash = Keccak256.hash(initCode);
const deterministicAddress = Keccak256.create2Address(
  deployerAddress,
  salt,
  initCodeHash
);
```

### Multiple Chunks

```typescript
// Hash in chunks (useful for streaming)
const chunks = [chunk1, chunk2, chunk3];
const hash = Keccak256.hashMultiple(chunks);

// Equivalent to:
const combined = new Uint8Array([...chunk1, ...chunk2, ...chunk3]);
const hash = Keccak256.hash(combined);
```

## Performance

Benchmark results (ops/sec) on M1 MacBook Pro:

### Hash Performance by Size

| Input Size | Ops/Sec | Throughput |
|-----------|---------|------------|
| Empty     | 376K    | N/A        |
| 32 bytes  | 370K    | 11.3 MB/s  |
| 256 bytes | 190K    | 46.3 MB/s  |
| 1 KB      | 49K     | 48.0 MB/s  |
| 4 KB      | 13K     | 50.6 MB/s  |
| 16 KB     | 3.3K    | 51.3 MB/s  |
| 64 KB     | 837     | 52.3 MB/s  |

### Operation Performance

| Operation | Ops/Sec |
|-----------|---------|
| hash (32B) | 370K |
| hashString | 354K |
| hashHex | 329K |
| selector | 355K |
| topic | 354K |
| contractAddress | 317K |
| create2Address | 345K |

Performance characteristics:
- Small inputs (<1KB): Overhead-dominated, ~350-370K ops/sec
- Large inputs (>4KB): Throughput-limited, ~50 MB/s
- Selector/topic computation: ~354-355K ops/sec
- Address derivation: ~317-345K ops/sec

## Implementation Details

### Noble Hashes

Uses `@noble/hashes/sha3` for the underlying Keccak-256 implementation:
- Audited cryptographic library
- Pure TypeScript (no native dependencies)
- Constant-time operations
- Well-tested against official test vectors

### Memory Safety

- All functions create new Uint8Array instances
- Input data is never modified
- No shared state between calls
- Safe for concurrent use

### Type Safety

- Returns branded `Hash` type (32-byte Uint8Array)
- Full TypeScript type inference
- Compile-time length checking where possible
- Runtime validation for dynamic inputs

## Known Test Vectors

Empty string:
```
keccak256("") = 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470
```

"abc":
```
keccak256("abc") = 0x4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45
```

"The quick brown fox jumps over the lazy dog":
```
keccak256(...) = 0x4d741b6f1eb29cb2a9b9911c82f56fa8d73b04959d3d9d222895df6c0b28aa15
```

Single zero byte:
```
keccak256(0x00) = 0xbc36789e7a1e281436464229828f817d6612f7b477d66591ff96a9e064bcc98a
```

Single 0xFF byte:
```
keccak256(0xFF) = 0x8b1a944cf13a9a1c08facb2c9e98623ef3254d2ddb48113885c3e8e97fec8db9
```

## Edge Cases

### Empty Input
```typescript
const hash = Keccak256.hash(new Uint8Array(0));
// Returns: 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470
```

### Rate Boundary
Input size at rate boundary (136 bytes) is handled correctly:
```typescript
const data = new Uint8Array(136);
const hash = Keccak256.hash(data);
```

### Large Inputs
Tested with inputs up to 1MB:
```typescript
const data = new Uint8Array(1024 * 1024);
const hash = Keccak256.hash(data); // Works correctly
```

### Unicode
UTF-8 encoding handles all Unicode correctly:
```typescript
const hash = Keccak256.hashString("Hello 世界 🌍");
```

## Security Considerations

1. **Constant-time**: The underlying @noble/hashes implementation uses constant-time operations
2. **Side-channel resistance**: No timing attacks on hash computation
3. **Memory safety**: No buffer overflows or undefined behavior
4. **Audited**: @noble/hashes is audited and widely used
5. **Test vectors**: Validated against official Keccak test vectors

## Related

- `Hash` - Hash type and utilities
- `Address` - Ethereum address type
- `@noble/hashes` - Underlying cryptography library

## References

- [Keccak Specification](https://keccak.team/files/Keccak-reference-3.0.pdf)
- [FIPS 202](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.202.pdf) - SHA-3 Standard
- [Ethereum Yellow Paper](https://ethereum.github.io/yellowpaper/paper.pdf)
- [@noble/hashes](https://github.com/paulmillr/noble-hashes)
