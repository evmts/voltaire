# Blob Module → Ox Blobs Migration

**Status:** Completed
**Date:** 2025-11-09
**Migration File:** `src/primitives/Blob/index.ox.ts`
**Test File:** `src/primitives/Blob/index.ox.test.ts`

---

## Overview

Voltaire's Blob module has been successfully migrated to use Ox's `Blobs` module for EIP-4844 blob transaction support. This enables code sharing with the Viem ecosystem while maintaining Voltaire's API.

**Ox Version:** 0.9.14
**Ox Module:** `Blobs` (plural)
**Voltaire Module:** `Blob` (singular)

---

## Key Naming Difference

| Aspect | Voltaire | Ox |
|--------|----------|-----|
| Module Name | `Blob` (singular) | `Blobs` (plural) |
| Import Path | `'@voltaire/primitives/Blob'` | `'ox/Blobs'` |
| Functions | `Blob.from()`, `Blob.toHex()` | `Blobs.from()`, `Blobs.toHex()` |

**Solution:** The migration file (`index.ox.ts`) imports from `ox/Blobs` and re-exports with Voltaire's naming conventions. This allows existing Voltaire code to continue working while leveraging Ox's implementation.

---

## API Coverage: 20 Exports

Ox provides comprehensive blob support with the following 20 core exports:

### Constructors
- `from()` - Create blobs from data (Hex or Bytes)

### Converters
- `to()` - Reconstruct data from blobs
- `toHex()` - Convert blobs to hex string
- `toBytes()` - Convert blobs to Uint8Array

### Commitments
- `toCommitments()` - Generate KZG commitments from blobs
- `toProofs()` - Generate KZG proofs for blobs
- `commitmentToVersionedHash()` - Single commitment → versioned hash
- `commitmentsToVersionedHashes()` - Batch commitments → versioned hashes

### Sidecars
- `toSidecars()` - Create BlobSidecars (blob + commitment + proof)
- `sidecarsToVersionedHashes()` - Extract versioned hashes from sidecars

### Versioned Hashes
- `toVersionedHashes()` - Direct blobs → versioned hashes (requires KZG)

### Types
- `Blob<T>` - Individual blob type
- `Blobs<T>` - Array of blobs
- `BlobSidecar<T>` - Blob + commitment + proof
- `BlobSidecars<T>` - Array of sidecars

### Constants
- `bytesPerFieldElement` - 32 bytes
- `fieldElementsPerBlob` - 4096 elements
- `bytesPerBlob` - 131,072 bytes (4096 * 32)
- `maxBytesPerTransaction` - 786,432 bytes (131,072 * 6)

### Error Types
- `BlobSizeTooLargeError` - Blob exceeds max size
- `EmptyBlobError` - Empty blob data
- `EmptyBlobVersionedHashesError` - No versioned hashes
- `InvalidVersionedHashSizeError` - Hash size mismatch
- `InvalidVersionedHashVersionError` - Invalid version byte

---

## Implementation Details

### Module Structure
```typescript
// src/primitives/Blob/index.ox.ts

// Main re-exports from Ox
export { from, to, toHex, toBytes, ... } from 'ox/Blobs'

// Compatibility aliases (optional)
export { commitmentsToVersionedHashes as toVersionedHashesFromCommitments } from 'ox/Blobs'

// Future: Voltaire-specific extensions (if needed)
// export { splitData, joinData, isValid, calculateGas, ... } from './extensions/index.js'
```

### Usage Example
```typescript
import * as Blob from '@voltaire/primitives/Blob'
import { kzg } from 'c-kzg'

// Create blobs from data
const blobs = Blob.from('0xdeadbeef')
const blobs = Blob.from(hexString, { as: 'Hex' })
const blobs = Blob.from(bytes, { as: 'Bytes' })

// Reconstruct data
const hex = Blob.toHex(blobs)
const bytes = Blob.toBytes(blobs)

// Generate commitments and proofs
const commitments = Blob.toCommitments(blobs, { kzg })
const proofs = Blob.toProofs(blobs, { commitments, kzg })

// Create sidecars for blob transactions
const sidecars = Blob.toSidecars(blobs, { kzg })

// Get versioned hashes for EIP-4844 txs
const versionedHashes = Blob.toVersionedHashes(blobs, { kzg })
```

---

## Compatibility Notes

### High Compatibility
- **Constructors:** `Blob.from()` → `Blobs.from()` ✅ Direct match
- **Converters:** `toHex()`, `toBytes()`, `to()` ✅ Direct match
- **Commitments:** `toCommitments()`, `toProofs()` ✅ Direct match
- **Versioned Hashes:** `toVersionedHashes()`, `commitmentToVersionedHash()` ✅ Direct match

### API Differences
- Ox has explicit `commitmentsToVersionedHashes()` (batch) vs Voltaire's single `toVersionedHashes()`
- Ox exports `sidecarsToVersionedHashes()` for sidecar-based hash generation

### Missing Functions from Voltaire
The following Voltaire-specific utilities are NOT in Ox and may be kept as extensions:
- `splitData()` / `joinData()` - Data splitting for multiple blobs
- `isValid()` / `isValidVersion()` - Validation utilities
- `calculateGas()` / `estimateBlobCount()` - Gas estimation
- `verify()` / `verifyBatch()` - Proof verification

**Decision:** Keep in comments for future consideration. Can be added to `extensions/` if needed.

---

## Test Coverage

### Test File: `src/primitives/Blob/index.ox.test.ts`

Tests verify:
1. **Type Exports** - Blob, Blobs, BlobSidecar, BlobSidecars
2. **Constants** - bytesPerFieldElement, fieldElementsPerBlob, etc.
3. **Core Functions** - from(), to(), toHex(), toBytes()
4. **Error Types** - All 5 error classes exported correctly
5. **API Coverage** - 20+ exports verified
6. **Integration** - Works with Ox Hex module
7. **Documentation** - Naming difference clearly documented

**Test Result:** ✅ All tests passing

```
TAP version 13
ok 1 - /Users/williamcory/voltaire/src/primitives/Blob/index.ox.test.ts
tests 1
pass 1
fail 0
duration_ms 288.635833
```

---

## Migration Checklist

- [x] Create `index.ox.ts` with Ox Blobs imports
- [x] Map 20 core Ox exports
- [x] Document naming difference (Blobs vs Blob)
- [x] Create comprehensive test file
- [x] Verify all tests pass
- [x] Document missing Voltaire utilities
- [x] Add comments for future extensions

---

## Next Steps

1. **Update Import Paths** - Gradually migrate existing code to use `index.ox.ts`
2. **Evaluate Extensions** - Determine if Voltaire-specific utilities should be kept
3. **Performance Testing** - Benchmark against old implementation if performance critical
4. **Integration** - Test with EIP-4844 transaction workflows
5. **Documentation** - Update user docs with Ox Blobs API

---

## References

- **Ox Blobs Module:** https://oxlib.sh/docs#blobs
- **EIP-4844:** Proto-danksharding (Blob Carrying Transactions)
- **C-KZG-4844:** KZG implementation for blob commitments
- **Viem Blob Support:** Uses same Ox Blobs module for ecosystem compatibility

---

## Files Created

1. `/Users/williamcory/voltaire/src/primitives/Blob/index.ox.ts`
   - Ox Blobs re-exports and compatibility layer
   - 90 lines

2. `/Users/williamcory/voltaire/src/primitives/Blob/index.ox.test.ts`
   - Comprehensive test coverage
   - 212 lines
   - All tests passing ✅

3. `/Users/williamcory/voltaire/BLOB_OX_MIGRATION.md`
   - This migration document
   - Reference for naming differences and API coverage
