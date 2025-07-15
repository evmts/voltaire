# Ethereum Transaction Types in Zig

This document describes the Zig implementation of all Ethereum transaction types based on the EIP-2718 specification and subsequent improvements.

## Overview

The transaction types implementation provides comprehensive support for all current Ethereum transaction formats:

1. **Legacy Transactions (Type 0x00)** - Pre-EIP-2718 format
2. **EIP-2930 Transactions (Type 0x01)** - Access list transactions
3. **EIP-1559 Transactions (Type 0x02)** - Fee market transactions
4. **EIP-4844 Transactions (Type 0x03)** - Blob transactions
5. **EIP-7702 Transactions (Type 0x04)** - Authorization transactions

## Core Types

### Basic Types

```zig
pub const ChainId = u64;           // Ethereum chain identifier
pub const U256 = u256;            // 256-bit unsigned integer
pub const Address = [20]u8;       // Ethereum address (20 bytes)
pub const B256 = [32]u8;          // 256-bit hash (32 bytes)
pub const Bytes = []u8;           // Dynamic byte array
```

### Transaction Type Enum

```zig
pub const TxType = enum(u8) {
    legacy = 0x00,
    eip2930 = 0x01,
    eip1559 = 0x02,
    eip4844 = 0x03,
    eip7702 = 0x04,
};
```

### Transaction Destination

```zig
pub const TxKind = union(enum) {
    call: Address,  // Transaction to an existing address
    create,         // Contract creation transaction
};
```

## Transaction Structures

### Legacy Transaction (Type 0x00)

The original Ethereum transaction format, used before EIP-2718:

```zig
pub const TxLegacy = struct {
    chain_id: ?ChainId,      // Optional for pre-EIP-155 transactions
    nonce: u64,
    gas_price: u128,         // Single gas price (not dynamic)
    gas_limit: u64,
    to: TxKind,              // Can be contract creation
    value: U256,
    input: Bytes,
};
```

**Key Features:**
- Uses a single `gas_price` (no dynamic fees)
- `chain_id` is optional for pre-EIP-155 compatibility
- Can create contracts when `to` is `TxKind.create`

### EIP-2930 Transaction (Type 0x01)

Introduces access lists to reduce gas costs for known storage accesses:

```zig
pub const TxEip2930 = struct {
    chain_id: ChainId,       // Required
    nonce: u64,
    gas_price: u128,         // Still uses single gas price
    gas_limit: u64,
    to: TxKind,
    value: U256,
    access_list: AccessList, // New: predefines accessed addresses/storage
    input: Bytes,
};
```

**Key Features:**
- Mandatory `chain_id`
- Includes `access_list` for gas optimization
- Still uses legacy fee structure

### EIP-1559 Transaction (Type 0x02)

Introduces dynamic fee structure with base fee and priority fee:

```zig
pub const TxEip1559 = struct {
    chain_id: ChainId,
    nonce: u64,
    gas_limit: u64,
    max_fee_per_gas: u128,          // Gas fee cap
    max_priority_fee_per_gas: u128, // Miner tip
    to: TxKind,
    value: U256,
    access_list: AccessList,
    input: Bytes,
};
```

**Key Features:**
- Dynamic fee structure with `max_fee_per_gas` and `max_priority_fee_per_gas`
- More predictable fee market
- Includes access list support

### EIP-4844 Transaction (Type 0x03)

Blob transactions for data availability scaling:

```zig
pub const TxEip4844 = struct {
    chain_id: ChainId,
    nonce: u64,
    gas_limit: u64,
    max_fee_per_gas: u128,
    max_priority_fee_per_gas: u128,
    to: Address,                     // Must be address (no contract creation)
    value: U256,
    access_list: AccessList,
    blob_versioned_hashes: []B256,   // Hashes of blob data
    max_fee_per_blob_gas: u128,      // Blob gas fee cap
    input: Bytes,
};
```

**Key Features:**
- Cannot create contracts (`to` must be an address)
- Includes blob data references via `blob_versioned_hashes`
- Separate fee market for blob gas via `max_fee_per_blob_gas`
- Used for data availability scaling solutions

### EIP-7702 Transaction (Type 0x04)

Authorization transactions for account abstraction:

```zig
pub const TxEip7702 = struct {
    chain_id: ChainId,
    nonce: u64,
    gas_limit: u64,
    max_fee_per_gas: u128,
    max_priority_fee_per_gas: u128,
    to: Address,                           // Must be address
    value: U256,
    access_list: AccessList,
    authorization_list: []SignedAuthorization, // Account authorizations
    input: Bytes,
};
```

**Key Features:**
- Cannot create contracts
- Includes `authorization_list` for account abstraction
- Enables temporary code delegation via authorizations

## Supporting Structures

### Access List

```zig
pub const AccessListItem = struct {
    address: Address,
    storage_keys: []B256,
};

pub const AccessList = []AccessListItem;
```

Used in EIP-2930+ transactions to predeclare accessed accounts and storage slots for gas optimization.

### Signed Authorization

```zig
pub const SignedAuthorization = struct {
    chain_id: ChainId,
    address: Address,
    nonce: ?u64,        // Optional nonce
    y_parity: u8,
    r: U256,
    s: U256,
};
```

Used in EIP-7702 transactions to authorize temporary code delegation.

## Unified Transaction Interface

### TypedTransaction Union

```zig
pub const TypedTransaction = union(TxType) {
    legacy: TxLegacy,
    eip2930: TxEip2930,
    eip1559: TxEip1559,
    eip4844: TxEip4844,
    eip7702: TxEip7702,
};
```

Provides a unified interface for handling any transaction type with common methods:

- `txType()` - Get the transaction type
- `chainId()` - Get chain ID (if available)
- `nonce()` - Get transaction nonce
- `gasLimit()` - Get gas limit
- `value()` - Get transaction value
- `isCreate()` - Check if creates a contract
- `isDynamicFee()` - Check if uses dynamic fees
- `accessList()` - Get access list (if available)
- `maxFeePerGas()` - Get max fee per gas
- `maxPriorityFeePerGas()` - Get priority fee (if available)
- `maxFeePerBlobGas()` - Get blob gas fee (if available)

## Transaction Utilities

### TransactionUtils

```zig
pub const TransactionUtils = struct {
    pub fn typeFromByte(type_byte: u8) !TxType
    pub fn supportsDynamicFees(tx_type: TxType) bool
    pub fn supportsAccessList(tx_type: TxType) bool
    pub fn supportsBlobs(tx_type: TxType) bool
    pub fn supportsAuthorizations(tx_type: TxType) bool
};
```

Utility functions for working with transaction types.

## Usage Examples

### Creating a Legacy Transaction

```zig
const legacy_tx = TxLegacy{
    .chain_id = 1, // Ethereum mainnet
    .nonce = 42,
    .gas_price = 20_000_000_000, // 20 gwei
    .gas_limit = 21_000,
    .to = TxKind{ .call = recipient_address },
    .value = 1_000_000_000_000_000_000, // 1 ETH
    .input = &[_]u8{}, // Empty data
};
```

### Creating an EIP-1559 Transaction

```zig
const eip1559_tx = TxEip1559{
    .chain_id = 1,
    .nonce = 42,
    .gas_limit = 21_000,
    .max_fee_per_gas = 30_000_000_000, // 30 gwei max
    .max_priority_fee_per_gas = 2_000_000_000, // 2 gwei tip
    .to = TxKind{ .call = recipient_address },
    .value = 1_000_000_000_000_000_000,
    .access_list = &[_]AccessListItem{},
    .input = &[_]u8{},
};
```

### Working with TypedTransaction

```zig
const typed_tx = TypedTransaction{ .eip1559 = eip1559_tx };

std.debug.print("Transaction type: {}\n", .{typed_tx.txType()});
std.debug.print("Uses dynamic fees: {}\n", .{typed_tx.isDynamicFee()});
std.debug.print("Nonce: {}\n", .{typed_tx.nonce()});
```

## Transaction Type Comparison

| Feature | Legacy | EIP-2930 | EIP-1559 | EIP-4844 | EIP-7702 |
|---------|--------|----------|----------|----------|----------|
| Dynamic Fees | ❌ | ❌ | ✅ | ✅ | ✅ |
| Access List | ❌ | ✅ | ✅ | ✅ | ✅ |
| Contract Creation | ✅ | ✅ | ✅ | ❌ | ❌ |
| Blob Support | ❌ | ❌ | ❌ | ✅ | ❌ |
| Authorizations | ❌ | ❌ | ❌ | ❌ | ✅ |
| Chain ID Required | ❌* | ✅ | ✅ | ✅ | ✅ |

*Optional for Legacy transactions

## Implementation Notes

1. **Memory Management**: All dynamic arrays (`Bytes`, `AccessList`, etc.) require proper memory management in Zig. Use appropriate allocators.

2. **Error Handling**: The `TransactionUtils.typeFromByte()` function returns an error union. Always handle the potential `UnknownTransactionType` error.

3. **Type Safety**: The union-based `TypedTransaction` provides compile-time guarantees about which fields are available for each transaction type.

4. **EIP-4844 Constraints**: EIP-4844 transactions cannot create contracts and must specify blob-related fields.

5. **EIP-7702 Constraints**: EIP-7702 transactions cannot create contracts and must include authorization lists.

This implementation provides a complete, type-safe representation of all Ethereum transaction types while maintaining compatibility with the existing ecosystem's conventions. 