# KZG Commitments for EIP-4844

Complete TypeScript implementation of KZG (Kate-Zaverucha-Goldberg) polynomial commitment scheme for Ethereum EIP-4844 blob transactions.

## Overview

KZG commitments enable efficient verification of blob data without requiring the full data. This is the foundation of Proto-Danksharding (EIP-4844), which significantly reduces L2 data availability costs.

### What is KZG?

KZG is a polynomial commitment scheme that allows:
- **Commitment**: Create a small (48 bytes) cryptographic commitment to a large (128 KB) blob
- **Proof Generation**: Prove the value of the polynomial at any point
- **Verification**: Verify proofs efficiently without the original data

### EIP-4844 Blob Format

- **Blob Size**: 131,072 bytes (128 KB)
- **Field Elements**: 4,096 elements × 32 bytes each
- **Commitment Size**: 48 bytes (BLS12-381 G1 point)
- **Proof Size**: 48 bytes (BLS12-381 G1 point)

## Installation

```bash
npm install c-kzg
```

The `c-kzg` package provides optimized native bindings to the reference C implementation.

## Quick Start

```typescript
import { Kzg } from './kzg.js';

// Initialize trusted setup (required once)
Kzg.loadTrustedSetup();

// Create or receive a blob
const blob = Kzg.generateRandomBlob();

// Generate commitment
const commitment = Kzg.blobToKzgCommitment(blob);

// Compute proof at evaluation point
const z = new Uint8Array(32);
const { proof, y } = Kzg.computeKzgProof(blob, z);

// Verify proof
const valid = Kzg.verifyKzgProof(commitment, z, y, proof);
console.log('Proof valid:', valid); // true

// Cleanup on shutdown
Kzg.freeTrustedSetup();
```

## API Reference

### Initialization

#### `Kzg.loadTrustedSetup(filePath?: string): void`

Load trusted setup parameters from embedded data or file.

**Parameters:**
- `filePath` (optional): Path to trusted setup file. If omitted, uses embedded setup.

**Throws:**
- `KzgError`: If loading fails

**Example:**
```typescript
// Use embedded setup (recommended)
Kzg.loadTrustedSetup();

// Or load from file
Kzg.loadTrustedSetup('./trusted_setup.txt');
```

**Notes:**
- Call once during application startup
- Thread-safe for concurrent initialization
- Idempotent (safe to call multiple times)

#### `Kzg.freeTrustedSetup(): void`

Free trusted setup resources.

**Example:**
```typescript
// Cleanup on application shutdown
Kzg.freeTrustedSetup();
```

#### `Kzg.isInitialized(): boolean`

Check if trusted setup is loaded.

**Returns:** `true` if initialized

**Example:**
```typescript
if (!Kzg.isInitialized()) {
  Kzg.loadTrustedSetup();
}
```

### Core Operations

#### `Kzg.blobToKzgCommitment(blob: Blob): KzgCommitment`

Convert blob to KZG commitment.

**Parameters:**
- `blob`: Blob data (131,072 bytes)

**Returns:** KZG commitment (48 bytes)

**Throws:**
- `KzgNotInitializedError`: If trusted setup not loaded
- `KzgInvalidBlobError`: If blob format invalid
- `KzgError`: If commitment computation fails

**Example:**
```typescript
const blob = new Uint8Array(131072);
// ... fill blob with data ...
const commitment = Kzg.blobToKzgCommitment(blob);
```

**Performance:** ~0.67ms per blob (1,500 ops/sec)

#### `Kzg.computeKzgProof(blob: Blob, z: Bytes32): ProofResult`

Compute KZG proof for blob at evaluation point.

**Parameters:**
- `blob`: Blob data (131,072 bytes)
- `z`: Evaluation point (32 bytes)

**Returns:** Object with:
- `proof`: KZG proof (48 bytes)
- `y`: Evaluation result (32 bytes)

**Throws:**
- `KzgNotInitializedError`: If trusted setup not loaded
- `KzgInvalidBlobError`: If blob format invalid
- `KzgError`: If proof computation fails

**Example:**
```typescript
const z = new Uint8Array(32);
z[31] = 0x42; // evaluation point

const { proof, y } = Kzg.computeKzgProof(blob, z);
console.log('y = polynomial(z):', y);
```

**Performance:** ~1.25ms per proof (800 ops/sec)

#### `Kzg.verifyKzgProof(commitment: KzgCommitment, z: Bytes32, y: Bytes32, proof: KzgProof): boolean`

Verify KZG proof.

**Parameters:**
- `commitment`: KZG commitment (48 bytes)
- `z`: Evaluation point (32 bytes)
- `y`: Claimed evaluation result (32 bytes)
- `proof`: KZG proof (48 bytes)

**Returns:** `true` if valid, `false` otherwise

**Throws:**
- `KzgNotInitializedError`: If trusted setup not loaded
- `KzgError`: If verification fails due to invalid inputs

**Example:**
```typescript
const valid = Kzg.verifyKzgProof(commitment, z, y, proof);
if (!valid) {
  throw new Error('Invalid proof');
}
```

**Performance:** ~0.2ms per verification (5,000 ops/sec)

### Optimized Verification

#### `Kzg.verifyBlobKzgProof(blob: Blob, commitment: KzgCommitment, proof: KzgProof): boolean`

Verify blob KZG proof (optimized for blob verification).

**Parameters:**
- `blob`: Blob data (131,072 bytes)
- `commitment`: KZG commitment (48 bytes)
- `proof`: KZG proof (48 bytes)

**Returns:** `true` if valid, `false` otherwise

**Example:**
```typescript
const valid = Kzg.verifyBlobKzgProof(blob, commitment, proof);
```

**Performance:** ~0.5ms per verification (2,000 ops/sec)

#### `Kzg.verifyBlobKzgProofBatch(blobs: Blob[], commitments: KzgCommitment[], proofs: KzgProof[]): boolean`

Verify multiple blob KZG proofs efficiently.

**Parameters:**
- `blobs`: Array of blobs
- `commitments`: Array of commitments (same length)
- `proofs`: Array of proofs (same length)

**Returns:** `true` if all valid, `false` otherwise

**Throws:**
- `KzgError`: If arrays have different lengths

**Example:**
```typescript
const valid = Kzg.verifyBlobKzgProofBatch(
  [blob1, blob2, blob3],
  [commitment1, commitment2, commitment3],
  [proof1, proof2, proof3]
);
```

**Performance:**
- 2 blobs: ~0.67ms (1,500 ops/sec)
- 5 blobs: ~1.25ms (800 ops/sec)

### Utilities

#### `Kzg.validateBlob(blob: Blob): void`

Validate blob format.

**Parameters:**
- `blob`: Blob to validate

**Throws:**
- `KzgInvalidBlobError`: If blob is invalid

**Example:**
```typescript
try {
  Kzg.validateBlob(blob);
  console.log('Blob valid');
} catch (error) {
  console.error('Invalid blob:', error.message);
}
```

#### `Kzg.createEmptyBlob(): Blob`

Create empty blob filled with zeros.

**Returns:** Zero-filled blob (131,072 bytes)

**Example:**
```typescript
const blob = Kzg.createEmptyBlob();
```

**Performance:** ~0.002ms (500,000 ops/sec)

#### `Kzg.generateRandomBlob(seed?: number): Blob`

Generate random valid blob.

**Parameters:**
- `seed` (optional): Seed for deterministic generation

**Returns:** Random blob with valid field elements

**Example:**
```typescript
// Random blob
const blob1 = Kzg.generateRandomBlob();

// Deterministic blob
const blob2 = Kzg.generateRandomBlob(12345);
```

**Performance:** ~0.02ms (50,000 ops/sec)

**Note:** For testing only. Use proper data for production.

## Type Definitions

```typescript
// Blob data (131,072 bytes)
type Blob = Uint8Array;

// KZG commitment (48 bytes, BLS12-381 G1 point)
type KzgCommitment = Uint8Array;

// KZG proof (48 bytes, BLS12-381 G1 point)
type KzgProof = Uint8Array;

// Field element (32 bytes)
type Bytes32 = Uint8Array;

// Proof computation result
interface ProofResult {
  proof: KzgProof;
  y: Bytes32;
}
```

## Constants

```typescript
// EIP-4844 constants
BYTES_PER_BLOB = 131072;           // 128 KB
BYTES_PER_COMMITMENT = 48;         // BLS12-381 G1 point
BYTES_PER_PROOF = 48;              // BLS12-381 G1 point
BYTES_PER_FIELD_ELEMENT = 32;      // 256-bit field element
FIELD_ELEMENTS_PER_BLOB = 4096;    // 128 KB / 32 bytes
```

## Error Types

### `KzgError`
Base error for KZG operations.

### `KzgNotInitializedError`
Trusted setup not loaded. Call `Kzg.loadTrustedSetup()` first.

### `KzgInvalidBlobError`
Invalid blob format:
- Wrong size (not 131,072 bytes)
- Invalid field elements (top byte not zero)

### `KzgVerificationError`
Proof verification error.

## Usage Patterns

### Basic Workflow

```typescript
import { Kzg } from './kzg.js';

// Initialize once
Kzg.loadTrustedSetup();

// Process blob
const blob = await fetchBlob();
const commitment = Kzg.blobToKzgCommitment(blob);

// Generate proof
const z = new Uint8Array(32);
const { proof, y } = Kzg.computeKzgProof(blob, z);

// Verify
const valid = Kzg.verifyKzgProof(commitment, z, y, proof);

// Cleanup
Kzg.freeTrustedSetup();
```

### Batch Processing

```typescript
// Process multiple blobs efficiently
const blobs = await fetchBlobs();
const commitments = blobs.map(blob =>
  Kzg.blobToKzgCommitment(blob)
);

// Batch verification is faster
const valid = Kzg.verifyBlobKzgProofBatch(
  blobs,
  commitments,
  proofs
);
```

### Error Handling

```typescript
try {
  const commitment = Kzg.blobToKzgCommitment(blob);
} catch (error) {
  if (error instanceof KzgNotInitializedError) {
    Kzg.loadTrustedSetup();
    // retry
  } else if (error instanceof KzgInvalidBlobError) {
    console.error('Invalid blob format:', error.message);
  } else {
    console.error('KZG error:', error);
  }
}
```

### Singleton Pattern

```typescript
// Create singleton instance
class KzgService {
  private static initialized = false;

  static async init() {
    if (!this.initialized) {
      Kzg.loadTrustedSetup();
      this.initialized = true;
    }
  }

  static async shutdown() {
    if (this.initialized) {
      Kzg.freeTrustedSetup();
      this.initialized = false;
    }
  }

  static verifyBlob(blob: Blob, commitment: KzgCommitment, proof: KzgProof) {
    if (!this.initialized) {
      throw new Error('KzgService not initialized');
    }
    return Kzg.verifyBlobKzgProof(blob, commitment, proof);
  }
}

// Usage
await KzgService.init();
const valid = KzgService.verifyBlob(blob, commitment, proof);
await KzgService.shutdown();
```

## Performance Characteristics

| Operation | Time | Ops/Sec | Notes |
|-----------|------|---------|-------|
| `blobToKzgCommitment` | ~0.67ms | 1,500 | Most expensive operation |
| `computeKzgProof` | ~1.25ms | 800 | Proof generation |
| `verifyKzgProof` | ~0.2ms | 5,000 | Fast verification |
| `verifyBlobKzgProof` | ~0.5ms | 2,000 | Optimized for blobs |
| `verifyBlobKzgProofBatch` (5) | ~1.25ms | 800 | Batch verification benefit |
| `createEmptyBlob` | ~0.002ms | 500,000 | Memory allocation |
| `generateRandomBlob` | ~0.02ms | 50,000 | PRNG + validation |

**Notes:**
- Times approximate, hardware-dependent
- Batch operations show significant benefits
- Verification is much faster than generation
- Native C implementation provides optimal performance

## Trusted Setup

### What is it?

The trusted setup is a set of pre-computed cryptographic parameters required for KZG operations. It consists of:
- 4,096 G1 points (BLS12-381 curve)
- 65 G2 points (BLS12-381 curve)
- Generated through Ethereum's KZG Ceremony

### Security

The trusted setup is:
- **Public**: Anyone can verify the parameters
- **Trusted**: Assumes at least one ceremony participant was honest
- **Reusable**: Same setup for all EIP-4844 operations
- **Verifiable**: Integrity checked via SHA-256 hash

### Loading Options

**Embedded Setup (Recommended):**
```typescript
Kzg.loadTrustedSetup();
```
- ~788 KB embedded in c-kzg package
- No file I/O required
- Immediate availability

**File-Based Setup:**
```typescript
Kzg.loadTrustedSetup('./trusted_setup.txt');
```
- Load from custom file
- Useful for verification or custom setups

### Verification

```typescript
// The trusted setup is automatically verified on load
// SHA-256: d39b9f2d047cc9dca2de58f264b6a09448ccd34db967881a6713eacacf0f26b7
```

## EIP-4844 Integration

### Blob Transaction Structure

```typescript
interface BlobTransaction {
  // Standard transaction fields
  chainId: bigint;
  nonce: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  gasLimit: bigint;
  to: Address;
  value: bigint;
  data: Uint8Array;
  accessList: AccessList;

  // Blob-specific fields
  maxFeePerBlobGas: bigint;
  blobVersionedHashes: Hash[];

  // Sidecar (not in transaction, sent separately)
  blobs?: Blob[];
  commitments?: KzgCommitment[];
  proofs?: KzgProof[];
}
```

### Computing Blob Versioned Hash

```typescript
import { Hash } from '../primitives/hash.js';

function computeBlobVersionedHash(commitment: KzgCommitment): Hash {
  const hash = Hash.sha256(commitment);
  // Set version byte
  hash[0] = 0x01; // BLOB_COMMITMENT_VERSION_KZG
  return hash;
}
```

### Full Blob Transaction Flow

```typescript
// 1. Prepare blob data
const blob = encodeDataToBlob(data);

// 2. Generate commitment
const commitment = Kzg.blobToKzgCommitment(blob);

// 3. Compute proof (for specific challenge)
const z = new Uint8Array(32);
const { proof, y } = Kzg.computeKzgProof(blob, z);

// 4. Create versioned hash
const versionedHash = computeBlobVersionedHash(commitment);

// 5. Create transaction
const tx = {
  // ... standard fields ...
  maxFeePerBlobGas: 1n,
  blobVersionedHashes: [versionedHash],

  // Sidecar
  blobs: [blob],
  commitments: [commitment],
  proofs: [proof],
};

// 6. Verify before sending
const valid = Kzg.verifyBlobKzgProof(blob, commitment, proof);
if (!valid) {
  throw new Error('Invalid blob proof');
}

// 7. Send transaction
await sendBlobTransaction(tx);
```

## Testing

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { Kzg } from './kzg.js';

describe('KZG', () => {
  beforeAll(() => {
    Kzg.loadTrustedSetup();
  });

  it('should verify valid proof', () => {
    const blob = Kzg.generateRandomBlob(42);
    const commitment = Kzg.blobToKzgCommitment(blob);
    const z = new Uint8Array(32);
    const { proof, y } = Kzg.computeKzgProof(blob, z);

    expect(Kzg.verifyKzgProof(commitment, z, y, proof)).toBe(true);
  });
});
```

## References

### Specifications
- [EIP-4844: Shard Blob Transactions](https://eips.ethereum.org/EIPS/eip-4844)
- [KZG Polynomial Commitments](https://dankradfeist.de/ethereum/2020/06/16/kate-polynomial-commitments.html)
- [Proto-Danksharding FAQ](https://notes.ethereum.org/@vbuterin/proto_danksharding_faq)

### Implementation
- [c-kzg-4844](https://github.com/ethereum/c-kzg-4844) - Reference C implementation
- [KZG Ceremony](https://ceremony.ethereum.org/) - Trusted setup generation

### Cryptography
- [BLS12-381 Curve](https://hackmd.io/@benjaminion/bls12-381)
- [Kate et al. Paper](https://www.iacr.org/archive/asiacrypt2010/6477178/6477178.pdf)

## License

MIT

## Contributing

Issues and PRs welcome at the repository.
