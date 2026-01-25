# Review: Add EIP-2930, EIP-4844, EIP-7702 Transaction Support

## Priority: 🔴 CRITICAL

## Summary

The Signer currently only supports Legacy (type 0) and EIP-1559 (type 2) transactions. Missing support for EIP-2930 (type 1), EIP-4844 (type 3 - blob), and EIP-7702 (type 4 - set code).

## Current State

**File**: [SignerService.ts#L101-L102](../src/services/Signer/SignerService.ts#L101-L102)

```typescript
// Note: EIP-2930 (type 1) is NOT currently supported. If you provide
// `accessList` with `gasPrice` (legacy fee model), the accessList will be ignored
```

## Missing Features

### EIP-2930 (Type 1) - Access List Transactions
- `accessList` with `gasPrice` (not EIP-1559 fees)
- Reduces gas for storage access

### EIP-4844 (Type 3) - Blob Transactions
Missing fields in `TransactionRequest`:
- `blobVersionedHashes: Hex[]`
- `maxFeePerBlobGas: bigint`
- `blobs: Blob[]`
- `kzgCommitments: Hex[]`
- `kzgProofs: Hex[]`

### EIP-7702 (Type 4) - Set Code Transactions  
Missing fields:
- `authorizationList: Authorization[]`
- Where `Authorization = { chainId, address, nonce, v, r, s }`

## Fix Required

### 1. Update TransactionRequest type

```typescript
export type TransactionRequest = {
  // ... existing fields
  
  // Transaction type (auto-detected if not provided)
  readonly type?: 0 | 1 | 2 | 3 | 4;
  
  // EIP-4844 blob fields
  readonly blobVersionedHashes?: readonly Hex[];
  readonly maxFeePerBlobGas?: bigint;
  readonly blobs?: readonly Uint8Array[];
  readonly kzgCommitments?: readonly Hex[];
  readonly kzgProofs?: readonly Hex[];
  
  // EIP-7702 authorization
  readonly authorizationList?: readonly Authorization[];
};
```

### 2. Update serializeTransaction

The underlying `VoltaireTransaction` primitives already support all 5 types - the serializer just needs to detect and use them.

### 3. Update type detection logic

```typescript
const getTransactionType = (tx: TransactionRequest): 0 | 1 | 2 | 3 | 4 => {
  if (tx.type !== undefined) return tx.type;
  if (tx.authorizationList) return 4;
  if (tx.blobVersionedHashes) return 3;
  if (tx.maxFeePerGas !== undefined) return 2;
  if (tx.accessList && tx.gasPrice !== undefined) return 1;
  return 0;
};
```

## Impact

- Cannot send blob transactions (L2 data availability)
- Cannot use EIP-7702 for smart account delegation
- Inefficient gas usage when access lists would help

## Testing

- Test each transaction type serialization
- Test type auto-detection
- Test blob sidecar handling
- Test authorization list signing
