# Blob Module (EIP-4844)

Complete blob encoding/decoding, KZG commitments, and versioned hashes for Ethereum's EIP-4844 blob transactions.

## EIP-4844 Overview

EIP-4844 introduces "blob-carrying transactions" to Ethereum, enabling large data availability at lower cost:

- **Blob size**: 131,072 bytes (128 KB) = 4096 field elements × 32 bytes
- **Max per transaction**: 6 blobs
- **Blob gas**: 131,072 per blob (2^17)
- **Target gas per block**: 393,216 (3 blobs)
- **Data availability**: Blobs are stored temporarily (~18 days), not in execution layer state

## Core Types

```typescript
import { Blob } from '@tevm/voltaire';

// Blob data (exactly 131072 bytes)
type Blob.Data = Uint8Array;

// KZG commitment (48 bytes)
type Blob.Commitment = Uint8Array;

// KZG proof (48 bytes)
type Blob.Proof = Uint8Array;

// Versioned hash (32 bytes) - commitment hash with version prefix
type Blob.VersionedHash = Uint8Array;
```

## Constants

```typescript
Blob.SIZE                      // 131072 (128 KB)
Blob.FIELD_ELEMENTS_PER_BLOB   // 4096
Blob.BYTES_PER_FIELD_ELEMENT   // 32
Blob.MAX_PER_TRANSACTION       // 6
Blob.COMMITMENT_VERSION_KZG    // 0x01
Blob.GAS_PER_BLOB              // 131072 (2^17)
Blob.TARGET_GAS_PER_BLOCK      // 393216 (3 blobs)
```

## Data Encoding/Decoding

### Encode Data to Blob

```typescript
// Standard form
const data = new TextEncoder().encode("Hello, blob!");
const blob: Blob.Data = Blob.fromData(data);

// Max data size: SIZE - 8 bytes (for length prefix)
const maxData = new Uint8Array(Blob.SIZE - 8);
const maxBlob = Blob.fromData(maxData);
```

Encoding format:
- 8 bytes: length prefix (little-endian uint64)
- N bytes: actual data
- Padding: zeros to fill remaining space

### Decode Blob to Data

```typescript
// this: pattern
const data = Blob.toData.call(blob);
const text = new TextDecoder().decode(data);
```

### Validate Blob

```typescript
// Type guard
if (Blob.isValid(blob)) {
  // blob is Blob.Data
}

// Check exact size
Blob.isValid(blob); // true if blob.length === SIZE
```

## KZG Operations

**Note**: KZG operations require c-kzg-4844 library (not yet implemented).

### Generate Commitment

```typescript
// this: pattern
const commitment: Blob.Commitment = Blob.toCommitment.call(blob);
// Currently throws: "Not implemented: requires c-kzg-4844 library"
```

### Generate Proof

```typescript
// this: pattern
const commitment = Blob.toCommitment.call(blob);
const proof: Blob.Proof = Blob.toProof.call(blob, commitment);
// Currently throws: "Not implemented: requires c-kzg-4844 library"
```

### Verify Proof

```typescript
// Single verification
const isValid = Blob.verify.call(blob, commitment, proof);
// Currently throws: "Not implemented: requires c-kzg-4844 library"

// Batch verification (more efficient for multiple blobs)
const isValid = Blob.verifyBatch(
  [blob1, blob2, blob3],
  [commitment1, commitment2, commitment3],
  [proof1, proof2, proof3]
);
```

## Versioned Hashes

Versioned hashes are used in transaction `blobVersionedHashes` field.

### Create Versioned Hash

```typescript
// this: pattern
const hash: Blob.VersionedHash = await Blob.toVersionedHash.call(commitment);
// Currently throws: "Not implemented: requires SHA-256"

// Convenience form
const hash = await Blob.Commitment.toVersionedHash.call(commitment);
```

Formula: `COMMITMENT_VERSION_KZG || sha256(commitment)[1:]`

### Validate Versioned Hash

```typescript
// Check size and version byte
Blob.VersionedHash.isValid(hash); // true if 32 bytes with version 0x01

// this: pattern
Blob.isValidVersion.call(hash); // true if correct version

// Get version byte
const version = Blob.VersionedHash.getVersion(hash);
const version = Blob.VersionedHash.version.call(hash); // convenience form
```

## Utility Functions

### Calculate Gas Cost

```typescript
// Gas for N blobs
const gas = Blob.calculateGas(3); // 393216 (3 × 131072)
const gas = Blob.calculateGas(6); // 786432 (max per transaction)
```

### Estimate Blob Count

```typescript
// Estimate blobs needed for data size
const count = Blob.estimateBlobCount(200000); // 2 blobs
const count = Blob.estimateBlobCount(100000); // 1 blob
```

Calculation: `ceil(dataSize / (SIZE - 8))`

### Split Large Data

```typescript
// Split data into multiple blobs
const largeData = new Uint8Array(300000);
const blobs = Blob.splitData(largeData); // [blob1, blob2, blob3]

// Max 6 blobs per transaction
const tooLarge = new Uint8Array(1000000);
Blob.splitData(tooLarge); // throws: "Data too large"
```

### Join Multiple Blobs

```typescript
// Reconstruct original data
const blobs = Blob.splitData(largeData);
const reconstructed = Blob.joinData(blobs);
// reconstructed === largeData
```

## Common Patterns

### Splitting Large Data for Transaction

```typescript
// 1. Estimate blobs needed
const dataSize = myData.length;
const blobCount = Blob.estimateBlobCount(dataSize);

if (blobCount > Blob.MAX_PER_TRANSACTION) {
  throw new Error(`Data requires ${blobCount} blobs (max 6)`);
}

// 2. Calculate gas cost
const blobGas = Blob.calculateGas(blobCount);
console.log(`Blob gas required: ${blobGas}`);

// 3. Split into blobs
const blobs = Blob.splitData(myData);
```

### Full Verification Workflow (When KZG Implemented)

```typescript
// 1. Create blobs from data
const data = new Uint8Array(300000);
const blobs = Blob.splitData(data);

// 2. Generate commitments
const commitments = blobs.map(blob => Blob.toCommitment.call(blob));

// 3. Generate proofs
const proofs = blobs.map((blob, i) =>
  Blob.toProof.call(blob, commitments[i])
);

// 4. Verify batch (more efficient than individual)
const isValid = Blob.verifyBatch(blobs, commitments, proofs);

// 5. Create versioned hashes for transaction
const versionedHashes = await Promise.all(
  commitments.map(c => Blob.toVersionedHash.call(c))
);

// 6. Include in transaction
const tx = {
  // ... other fields
  blobVersionedHashes: versionedHashes,
  blobs: blobs,
  commitments: commitments,
  proofs: proofs,
};
```

### Roundtrip Data Encoding

```typescript
// Small data (< 128 KB)
const original = new TextEncoder().encode("My data");
const blob = Blob.fromData(original);
const recovered = Blob.toData.call(blob);
// recovered === original

// Large data (splits automatically)
const largeData = new Uint8Array(500000);
const blobs = Blob.splitData(largeData);
const recovered = Blob.joinData(blobs);
// recovered === largeData
```

## Type Guards

All validators provide type narrowing:

```typescript
// Blob validation
function processBlob(data: Uint8Array) {
  if (!Blob.isValid(data)) {
    throw new Error("Invalid blob");
  }
  // data is now Blob.Data
  const decoded = Blob.toData.call(data);
}

// Commitment validation
function processCommitment(c: Uint8Array) {
  if (Blob.Commitment.isValid(c)) {
    // c is now Blob.Commitment
    const hash = await Blob.toVersionedHash.call(c);
  }
}

// Proof validation
function processProof(p: Uint8Array) {
  if (Blob.Proof.isValid(p)) {
    // p is now Blob.Proof
  }
}

// Versioned hash validation
function processHash(h: Uint8Array) {
  if (Blob.VersionedHash.isValid(h)) {
    // h is now Blob.VersionedHash
    const version = Blob.VersionedHash.version.call(h);
  }
}
```

## Best Practices

### Data Size Limits

```typescript
// Always check size before encoding
const maxDataPerBlob = Blob.SIZE - 8; // 131064 bytes

if (data.length > maxDataPerBlob) {
  // Use splitData for automatic handling
  const blobs = Blob.splitData(data);
} else {
  const blob = Blob.fromData(data);
}
```

### Gas Estimation

```typescript
// Estimate before transaction
const blobCount = Blob.estimateBlobCount(data.length);
const blobGas = Blob.calculateGas(blobCount);

console.log(`Transaction will use ${blobCount} blobs`);
console.log(`Blob gas: ${blobGas}`);
console.log(`Gas per blob: ${Blob.GAS_PER_BLOB}`);
```

### Batch Operations

```typescript
// For multiple blobs, use batch verification (when implemented)
// More efficient than verifying individually
const isValid = Blob.verifyBatch(blobs, commitments, proofs);

// vs individual (less efficient)
const results = blobs.map((blob, i) =>
  Blob.verify.call(blob, commitments[i], proofs[i])
);
```

### Error Handling

```typescript
try {
  const blob = Blob.fromData(data);
} catch (err) {
  if (err.message.includes("Data too large")) {
    // Handle oversized data
    const blobs = Blob.splitData(data);
  }
}

// Validate before operations
if (!Blob.isValid(blob)) {
  throw new Error("Invalid blob size");
}

if (!Blob.Commitment.isValid(commitment)) {
  throw new Error("Invalid commitment size");
}
```

## Performance Considerations

- **Encoding**: ~50-500k ops/sec depending on data size
- **Decoding**: ~100-800k ops/sec depending on data size
- **Validation**: ~10M+ ops/sec (simple length check)
- **Splitting/Joining**: Scales linearly with data size

Benchmark results available in `blob.bench.ts`.

## References

- [EIP-4844 Specification](https://eips.ethereum.org/EIPS/eip-4844)
- [c-kzg-4844 Library](https://github.com/ethereum/c-kzg-4844)
- [KZG Commitments](https://dankradfeist.de/ethereum/2020/06/16/kate-polynomial-commitments.html)
