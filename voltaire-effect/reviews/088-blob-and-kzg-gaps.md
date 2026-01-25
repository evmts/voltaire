# Blob and KZG Gaps (EIP-4844)

**Date**: 2026-01-25
**Priority**: Medium
**Category**: Protocol Support

## Overview

EIP-4844 (Proto-Danksharding) is live on mainnet. viem has comprehensive blob utilities that voltaire-effect lacks.

## Blob Utilities

### viem Blob Functions

| Function | Purpose | voltaire-effect |
|----------|---------|-----------------|
| `toBlobs` | Data → Blobs | ❌ |
| `fromBlobs` | Blobs → Data | ❌ |
| `toBlobSidecars` | Create blob sidecars | ❌ |
| `blobsToCommitments` | Blobs → KZG commitments | ❌ |
| `blobsToProofs` | Blobs → KZG proofs | ❌ |
| `commitmentsToVersionedHashes` | Commitments → Versioned hashes | ❌ |
| `commitmentToVersionedHash` | Single commitment → hash | ❌ |
| `sidecarsToVersionedHashes` | Sidecars → hashes | ❌ |

### How viem Handles Blobs

```typescript
import { toBlobs, toBlobSidecars } from 'viem'
import * as kzg from 'c-kzg'

// Convert data to blobs
const blobs = toBlobs({ data: '0x...' })

// Create sidecars with commitments and proofs
const sidecars = toBlobSidecars({
  blobs,
  kzg
})

// Send blob transaction
await client.sendTransaction({
  to: '0x...',
  blobs,
  kzg,
  maxFeePerBlobGas: 1000000000n
})
```

### voltaire-effect Current State

**TransactionRequest supports**:
- ✅ `blobVersionedHashes` - Can include versioned hashes
- ✅ `maxFeePerBlobGas` - Can set blob gas price

**Missing**:
- ❌ No `blobs` field in TransactionRequest
- ❌ No blob serialization utilities
- ❌ No KZG integration for commitment/proof generation
- ❌ No `sidecars` support
- ❌ No `getBlobBaseFee` RPC method

## Provider Gaps

### getBlobBaseFee

**viem**:
```typescript
const blobBaseFee = await client.getBlobBaseFee()
// Returns: bigint (current blob base fee in wei)
```

**voltaire-effect**: Not implemented.

**Impact**: Can't estimate blob transaction costs.

### Blob Gas in Receipts

Transaction receipts should include:
- `blobGasUsed` - Blob gas consumed
- `blobGasPrice` - Effective blob gas price

Need to verify if voltaire-effect parses these from receipts.

## prepareTransactionRequest Gaps

### viem Auto-fills Blob Fields

```typescript
// viem prepareTransactionRequest automatically:
const request = await client.prepareTransactionRequest({
  to: '0x...',
  blobs,
  kzg,
  parameters: ['blobVersionedHashes', 'sidecars']
})

// Generates:
// - blobVersionedHashes from blobs + kzg
// - sidecars (blobs + commitments + proofs)
```

### voltaire-effect Signer

Does NOT auto-generate blob fields. User must pre-compute:
- versioned hashes
- sidecars

## KZG Integration

### viem Chain-Level KZG

Chains can specify their own KZG setup:
```typescript
const chain = {
  // ...
  kzg: {
    blobToKzgCommitment: (blob) => ...,
    computeBlobKzgProof: (blob, commitment) => ...
  }
}
```

### voltaire-effect

Has `KzgService` in `src/crypto/` but:
- Not integrated with transactions
- Not integrated with chain config
- Implementation may be incomplete

## Recommendations

### High Priority

1. **Add `getBlobBaseFee` to ProviderService**
   ```typescript
   readonly getBlobBaseFee: () => Effect<bigint, ProviderError>
   ```

2. **Add `blobs` and `sidecars` to TransactionRequest**
   ```typescript
   interface TransactionRequest {
     // existing...
     blobs?: Blob[]
     sidecars?: BlobSidecar[]
   }
   ```

3. **Parse blob fields in receipts**
   - `blobGasUsed`
   - `blobGasPrice`

### Medium Priority

4. **Add blob utilities**
   - `toBlobs(data)` - Convert data to blob format
   - `fromBlobs(blobs)` - Decode blobs back to data
   - `toBlobSidecars({ blobs, kzg })`

5. **Add commitment/proof utilities**
   - `blobsToCommitments`
   - `blobsToProofs`
   - `commitmentsToVersionedHashes`

6. **Integrate KZG with Signer**
   - Auto-compute versioned hashes from blobs
   - Auto-generate sidecars

### Lower Priority

7. **Add KZG to ChainConfig**
   - Allow chain-specific KZG implementations

8. **Add blob validation**
   - Validate blob size (128KB each)
   - Validate max blobs per transaction (6)
