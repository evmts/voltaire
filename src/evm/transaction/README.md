# Transaction Handling

Implementation of Ethereum transaction types with focus on EIP-4844 blob transactions for Layer 2 data availability.

## Purpose

The transaction module provides:
- Transaction type definitions and validation
- EIP-4844 blob transaction support
- Access list handling for EIP-2929/2930
- Transaction encoding and hashing
- Fee calculation and validation

## Architecture

The module currently implements:
1. **Blob Transactions (Type 0x03)**: EIP-4844 for L2 data availability
2. **Infrastructure**: For future transaction types (Legacy, EIP-1559, EIP-2930)

## Files

### `index.zig`
Module entry point and exports.

**Exports**:
- `BlobTransaction` type
- `BLOB_TX_TYPE` constant (0x03)

**Purpose**: Clean module interface for transaction handling

**Used By**: EVM main module, transaction processing

### `blob_transaction.zig`
EIP-4844 blob transaction implementation.

**Structure**:
```zig
BlobTransaction = struct {
    // EIP-1559 base fields
    chain_id: u64,
    nonce: u64,
    max_priority_fee_per_gas: u256,
    max_fee_per_gas: u256,
    gas_limit: u64,
    to: ?Address,                    // Must have recipient
    value: u256,
    data: []const u8,
    access_list: AccessList,
    
    // EIP-4844 blob fields
    max_fee_per_blob_gas: u256,
    blob_versioned_hashes: []const VersionedHash,
    
    // Sidecar data (not in transaction hash)
    blobs: ?[]const Blob,
    commitments: ?[]const KZGCommitment,
    proofs: ?[]const KZGProof,
    
    // Signature
    v: u256,
    r: u256,
    s: u256,
}
```

**Key Constraints**:
- Must have recipient (no contract creation)
- Blob count: 1 to MAX_BLOBS_PER_TRANSACTION (6)
- Each blob: 128KB (4096 field elements)
- Separate blob gas market from regular gas

**Key Methods**:
- `init()`: Create with validation
- `validate()`: Check all constraints
- `getBlobGas()`: Calculate blob gas usage
- `hash()`: Transaction hash (excluding sidecars)
- `signingHash()`: Hash for signature verification
- `recoverSender()`: Extract sender from signature

**Validation Checks**:
1. Blob count within limits
2. Versioned hashes match commitments
3. KZG proofs verify (if sidecar present)
4. Gas limits reasonable
5. Signature valid

**Blob Gas Calculation**:
```zig
blob_gas = blob_count × GAS_PER_BLOB
// GAS_PER_BLOB = 131,072 (128KB)
```

**Used By**: Transaction pool, block building, execution

## Transaction Types Overview

### Currently Implemented

#### Type 0x03: Blob Transaction (EIP-4844)
- Extends EIP-1559 with blob data
- For rollup data availability
- Separate blob fee market
- KZG commitment scheme

### Planned Support

#### Type 0x00: Legacy Transaction
- Original transaction format
- Single gas price field
- No access lists

#### Type 0x01: Access List Transaction (EIP-2930)
- Adds access list for gas savings
- Prepares for EIP-2929 gas changes
- Optional access list

#### Type 0x02: Dynamic Fee Transaction (EIP-1559)
- Base fee + priority fee model
- Max fee per gas limits
- Improved fee predictability

## Access Lists

Access lists (EIP-2930) declare storage/addresses to be accessed:
```zig
AccessList = []const AccessListItem

AccessListItem = struct {
    address: Address,
    storage_keys: []const u256,
}
```

**Benefits**:
- Gas savings (pre-warm storage)
- Prevents breaking changes from gas repricing
- Better gas estimation

## Transaction Lifecycle

### 1. Creation and Validation
```zig
const tx = try BlobTransaction.init(allocator, .{
    .to = recipient,
    .value = amount,
    .blob_versioned_hashes = &hashes,
    // ... other fields
});
```

### 2. Signature and Sender Recovery
```zig
const sender = try tx.recoverSender();
```

### 3. Gas and Fee Validation
```zig
// Regular gas
if (tx.max_fee_per_gas < base_fee) return error.FeeTooLow;

// Blob gas
const blob_gas = tx.getBlobGas();
if (tx.max_fee_per_blob_gas < blob_base_fee) return error.BlobFeeTooLow;
```

### 4. Execution
- Transfer value
- Execute transaction data
- Consume gas
- Update state

## Memory Management

**Ownership Rules**:
- Transaction owns dynamic arrays (data, access_list, etc.)
- Caller manages transaction lifetime
- Deep copying for persistence

**Cleanup Pattern**:
```zig
var tx = try BlobTransaction.init(allocator, params);
defer tx.deinit(allocator);
```

## Encoding and Hashing

### Transaction Hash
Excludes blob sidecar data:
```
hash = keccak256(0x03 || rlp([chain_id, nonce, ...]))
```

### Signing Hash
For signature generation/verification:
```
signing_hash = keccak256(0x03 || rlp([...tx_fields]))
```

### Blob Versioned Hash
Commitment to blob data:
```
versioned_hash = 0x01 || keccak256(commitment)[1:]
```

## Security Considerations

1. **Blob Validation**: KZG proofs prevent invalid blobs
2. **Fee Protection**: Separate markets prevent DoS
3. **Signature Security**: EIP-155 replay protection
4. **Gas Limits**: Prevent resource exhaustion
5. **Access Control**: No contract creation in blob transactions

## Testing

The module includes tests for:
- Transaction validation rules
- Blob gas calculations
- Signature verification
- Edge cases and error conditions
- Integration with EVM execution

## Future Enhancements

1. **Complete Transaction Types**:
   - Legacy transaction support
   - EIP-1559 transaction support
   - EIP-2930 transaction support

2. **Optimizations**:
   - RLP encoding optimization
   - Batch signature verification
   - Parallel blob verification

3. **Features**:
   - Transaction pool integration
   - Priority fee estimation
   - MEV protection mechanisms

## Performance Notes

- Blob verification is expensive (~2-3ms per blob)
- Signature recovery cached where possible
- Access lists reduce storage access costs
- Blob data not stored in state (pruned after ~2 weeks)