---
title: Ox Blobs API Reference
description: Quick reference for migrating from Voltaire Blob to Ox Blobs
---

# Ox Blobs API Reference

## Quick Reference: Voltaire Blob → Ox Blobs

This document provides a quick lookup for migrating from Voltaire's Blob module to Ox's Blobs module.

### Constants

```typescript
// Size Constants
Blob.bytesPerFieldElement       // 32 (bytes in a field element)
Blob.fieldElementsPerBlob        // 4096 (field elements per blob)
Blob.bytesPerBlob                // 131,072 (total bytes per blob)
Blob.maxBytesPerTransaction      // 786,432 (max bytes in tx: 6 blobs × 131,072)
```

### Creating Blobs

```typescript
// From hex string
const blobs = Blob.from('0xdeadbeef')
const blobs = Blob.from(hexString, { as: 'Hex' })

// From Uint8Array
const blobs = Blob.from(bytes, { as: 'Bytes' })

// Default return type matches input type
// from('0x...') returns Hex array
// from(Uint8Array) returns Bytes array
```

### Data Conversion

```typescript
// Back to original data (auto-detects type)
const data = Blob.to(blobs)           // Returns Hex | Bytes
const data = Blob.to(blobs, 'Hex')    // Explicitly Hex
const data = Blob.to(blobs, 'Bytes')  // Explicitly Bytes

// Specific conversions
const hex = Blob.toHex(blobs)         // Always Hex
const bytes = Blob.toBytes(blobs)     // Always Bytes
```

### KZG Operations

```typescript
import { kzg } from 'c-kzg'

// Generate commitments from blobs
const commitments = Blob.toCommitments(blobs, { kzg })
const commitments = Blob.toCommitments(blobs, {
  kzg,
  as: 'Bytes'  // Default is 'Hex'
})

// Generate proofs (requires commitments)
const proofs = Blob.toProofs(blobs, { commitments, kzg })
const proofs = Blob.toProofs(blobs, {
  commitments,
  kzg,
  as: 'Bytes'  // Default is 'Hex'
})
```

### Versioned Hashes

```typescript
// From blobs directly (computes commitments internally)
const versionedHashes = Blob.toVersionedHashes(blobs, { kzg })
const versionedHashes = Blob.toVersionedHashes(blobs, {
  kzg,
  as: 'Bytes'  // Default is 'Hex'
})

// From commitments directly (no KZG needed)
const versionedHashes = Blob.commitmentsToVersionedHashes(commitments)
const versionedHashes = Blob.commitmentsToVersionedHashes(commitments, {
  as: 'Bytes',
  version: 1  // Default is 1 (KZG version)
})

// Single commitment → versioned hash
const versionedHash = Blob.commitmentToVersionedHash(commitment)
const versionedHash = Blob.commitmentToVersionedHash(commitment, {
  as: 'Bytes',
  version: 1
})
```

### Sidecars (Complete Blob Proofs)

```typescript
// Create sidecars with auto-generated commitments/proofs
const sidecars = Blob.toSidecars(blobs, { kzg })

// Create sidecars with explicit commitments/proofs
const sidecars = Blob.toSidecars(blobs, {
  commitments,
  proofs
})

// Extract versioned hashes from sidecars
const versionedHashes = Blob.sidecarsToVersionedHashes(sidecars)
const versionedHashes = Blob.sidecarsToVersionedHashes(sidecars, {
  as: 'Bytes',
  version: 2
})
```

## Type System

```typescript
// Blob and Blobs are type aliases over Hex | Bytes
type Blob<T extends Hex | Bytes = Hex | Bytes> = T
type Blobs<T extends Hex | Bytes = Hex | Bytes> = readonly Blob<T>[]

// BlobSidecar combines blob + commitment + proof
type BlobSidecar<T = Hex | Bytes> = {
  blob: T
  commitment: T
  proof: T
}
type BlobSidecars<T = Hex | Bytes> = readonly BlobSidecar<T>[]

// Usage examples
const hexBlobs: Blob.Blobs<Hex> = Blob.from('0x...', { as: 'Hex' })
const bytesBlobs: Blob.Blobs<Bytes> = Blob.from(uint8array, { as: 'Bytes' })
const sidecar: Blob.BlobSidecar<Hex> = sidecars[0]
```

## Error Handling

```typescript
import * as Blob from '@voltaire/primitives/Blob'

try {
  const blobs = Blob.from(tooLargeData)
} catch (error) {
  if (error instanceof Blob.BlobSizeTooLargeError) {
    // Blob exceeds 131,072 bytes
  } else if (error instanceof Blob.EmptyBlobError) {
    // Empty data provided
  } else if (error instanceof Blob.EmptyBlobVersionedHashesError) {
    // No versioned hashes generated
  } else if (error instanceof Blob.InvalidVersionedHashSizeError) {
    // Versioned hash has wrong size
  } else if (error instanceof Blob.InvalidVersionedHashVersionError) {
    // Versioned hash has invalid version byte
  }
}
```

## Common Patterns

### EIP-4844 Blob Transaction Flow

```typescript
import * as Blob from '@voltaire/primitives/Blob'
import { kzg } from 'c-kzg'

// 1. Create blobs from data
const blobs = Blob.from(data)

// 2. Generate commitments and proofs (required for Beacon Chain)
const commitments = Blob.toCommitments(blobs, { kzg })
const proofs = Blob.toProofs(blobs, { commitments, kzg })

// 3. Create sidecars for Beacon Chain submission
const sidecars = Blob.toSidecars(blobs, { commitments, proofs })

// 4. Get versioned hashes for transaction
const blobVersionedHashes = Blob.toVersionedHashes(blobs, { kzg })

// 5. Create transaction
const tx = {
  type: 'eip4844',
  blobVersionedHashes,
  blobs // Include in JSON-RPC call
}
```

### Batch Processing

```typescript
// Process multiple data items
const dataItems = ['data1', 'data2', 'data3']
const allBlobs = dataItems.map(d => Blob.from(d))

// Generate all commitments
const commitmentLists = allBlobs.map(blobs =>
  Blob.toCommitments(blobs, { kzg })
)

// Flatten for batch operations
const allCommitments = commitmentLists.flat()
const allVersionedHashes = Blob.commitmentsToVersionedHashes(allCommitments)
```

### Type-Safe Conversions

```typescript
// Type inference
const hexBlobs = Blob.from('0xdeadbeef') // Type: Blobs<Hex>
const hexBack = Blob.toHex(hexBlobs)     // Type: Hex

const byteBlobs = Blob.from(uint8, { as: 'Bytes' }) // Type: Blobs<Bytes>
const bytesBack = Blob.toBytes(byteBlobs)           // Type: Bytes

// Explicit type specification
const hexBlobs2 = Blob.from('0x...', { as: 'Hex' })    // Hex array
const byteBlobs2 = Blob.from('0x...', { as: 'Bytes' }) // Bytes array
```

## Naming Comparison

| Operation | Voltaire | Ox Blobs | Note |
|-----------|----------|----------|------|
| Create | `Blob.from()` | `Blobs.from()` | Same function, different namespace |
| Reconstruct | `Blob.toData()` | `Blob.to()` | Ox uses `to()` |
| To Hex | `Blob.toHex()` | `Blobs.toHex()` | Same |
| To Bytes | N/A | `Blobs.toBytes()` | New in Ox |
| Commitments | `Blob.toCommitment()` | `Blobs.toCommitments()` | Plural in Ox (batch) |
| Proofs | `Blob.toProof()` | `Blobs.toProofs()` | Plural in Ox (batch) |
| Versioned Hashes | `Blob.toVersionedHash()` | `Blobs.toVersionedHashes()` | Plural in Ox |
| Single Hash | N/A | `Blobs.commitmentToVersionedHash()` | New explicit API |
| Batch Hashes | N/A | `Blobs.commitmentsToVersionedHashes()` | New explicit API |
| Sidecars | N/A | `Blobs.toSidecars()` | New in Ox |
| Sidecar Hashes | N/A | `Blobs.sidecarsToVersionedHashes()` | New in Ox |

## Module Imports

```typescript
// Ox module (for reference)
import * as OxBlobs from 'ox/Blobs'

// Voltaire module (use this)
import * as Blob from '@voltaire/primitives/Blob'
// or
import { from, toHex, toCommitments } from '@voltaire/primitives/Blob'
// or (for namespace style)
import { Blob } from '@voltaire/primitives/Blob'
Blob.from('0x...')
```

---

**Last Updated:** 2025-11-09
**Ox Version:** 0.9.14
**Status:** Migration Complete ✅
