# Transaction Building System

This document describes the Zig implementation of the transaction building system, which provides a high-level interface for creating, preparing, and managing Ethereum transactions.

## Overview

The transaction building system provides:
- **TransactionRequest**: High-level request structure for building transactions
- **TransactionBuilder**: Core building and management functionality
- **TransactionUtils**: Utility functions for transaction analysis
- **Comprehensive Testing**: Full test coverage for all functionality

## Core Components

### TransactionRequest

A flexible request structure that allows building different transaction types:

```zig
pub const TransactionRequest = struct {
    from: ?Address = null,
    to: ?TxKind = null,
    gas: ?u64 = null,
    gas_price: ?U256 = null,
    max_fee_per_gas: ?U256 = null,
    max_priority_fee_per_gas: ?U256 = null,
    value: ?U256 = null,
    data: ?[]const u8 = null,
    nonce: ?u64 = null,
    chain_id: ?ChainId = null,
    access_list: ?AccessList = null,
    transaction_type: ?TxType = null,
};
```

#### Automatic Transaction Type Detection

The system automatically determines the appropriate transaction type:
- **Legacy**: When only `gas_price` is provided
- **EIP-1559**: When `max_fee_per_gas` or `max_priority_fee_per_gas` is provided
- **Manual**: When `transaction_type` is explicitly set

### TransactionBuilder

The main interface for building and managing transactions:

```zig
var builder = TransactionBuilder.init(allocator);

// Build a transaction
const tx = try builder.buildTransaction(request);

// Prepare request with defaults
const prepared = builder.prepareTransactionRequest(request);

// Sign transaction (placeholder implementation)
const signed = try builder.signTransaction(tx, private_key);

// Get transaction hash
const hash = try builder.getTransactionHash(tx);
```

### TransactionUtils

Utility functions for transaction analysis:

```zig
// Estimate gas for a transaction
const gas = TransactionUtils.estimateGas(tx);

// Check if transaction creates a contract
const is_creation = TransactionUtils.isContractCreation(tx);

// Get transaction type
const tx_type = TransactionUtils.getTransactionType(tx);
```

## Supported Transaction Types

### Legacy Transactions (Type 0x00)

```zig
const request = TransactionRequest{
    .to = TxKind{ .call = recipient_address },
    .value = 1000000000000000000, // 1 ETH
    .gas = 21000,
    .gas_price = 20000000000, // 20 gwei
    .nonce = 0,
    .transaction_type = .legacy,
};
```

### EIP-1559 Transactions (Type 0x02)

```zig
const request = TransactionRequest{
    .to = TxKind{ .call = recipient_address },
    .value = 1000000000000000000, // 1 ETH
    .gas = 21000,
    .max_fee_per_gas = 20000000000, // 20 gwei
    .max_priority_fee_per_gas = 1000000000, // 1 gwei
    .nonce = 0,
    .chain_id = 1, // Mainnet
    .transaction_type = .eip1559,
};
```

### Contract Creation

```zig
const request = TransactionRequest{
    .to = TxKind.create, // Contract creation
    .value = 0,
    .gas = 1000000, // Higher gas for contract deployment
    .gas_price = 20000000000,
    .data = contract_bytecode,
    .transaction_type = .legacy,
};
```

## Default Values and Preparation

The `prepareTransactionRequest` method applies sensible defaults:

| Field | Default Value | Condition |
|-------|---------------|-----------|
| `gas` | 21000 | For simple transfers |
| `gas` | 100000 | When `data` is provided |
| `transaction_type` | `.legacy` | When no EIP-1559 fields |
| `transaction_type` | `.eip1559` | When `max_fee_per_gas` present |
| `gas_price` | 20000000000 | Legacy transactions (20 gwei) |
| `max_fee_per_gas` | 20000000000 | EIP-1559 transactions (20 gwei) |
| `max_priority_fee_per_gas` | 1000000000 | EIP-1559 transactions (1 gwei) |
| `chain_id` | 1 | EIP-1559 transactions (Mainnet) |

## Gas Estimation

The system provides basic gas estimation:

```zig
const estimated_gas = TransactionUtils.estimateGas(tx);
```

Gas estimation formula:
- **Base Gas**: 21,000 gas
- **Data Gas**: 16 gas per byte of transaction data
- **Total**: Base + Data gas

For more accurate estimation, integrate with the EVM execution engine.

## Error Handling

The system defines comprehensive error types:

```zig
pub const TransactionBuildingError = error{
    InvalidTransactionType,
    SerializationError,
    DeserializationError,
    InvalidChainId,
    InvalidData,
    OutOfMemory,
};
```

## Testing

The implementation includes comprehensive tests covering:
- Transaction request conversion
- Transaction builder functionality
- Gas estimation accuracy
- Transaction type detection
- Request preparation
- All transaction types (Legacy, EIP-1559)

Run tests with:
```bash
zig test src/transaction_building_simple.zig
```

## Usage Examples

### Simple ETH Transfer (Legacy)

```zig
const allocator = std.heap.page_allocator;
var builder = TransactionBuilder.init(allocator);

const request = TransactionRequest{
    .to = TxKind{ .call = recipient_address },
    .value = 1000000000000000000, // 1 ETH in wei
    .gas_price = 20000000000, // 20 gwei
};

const prepared = builder.prepareTransactionRequest(request);
const tx = try builder.buildTransaction(prepared);
```

### EIP-1559 Transaction with Priority Fee

```zig
const request = TransactionRequest{
    .to = TxKind{ .call = recipient_address },
    .value = 500000000000000000, // 0.5 ETH
    .max_fee_per_gas = 30000000000, // 30 gwei
    .max_priority_fee_per_gas = 2000000000, // 2 gwei
    .chain_id = 1, // Mainnet
};

const tx = try builder.buildTransaction(request);
```

### Contract Deployment

```zig
const request = TransactionRequest{
    .to = TxKind.create,
    .value = 0,
    .gas = 2000000, // High gas limit for deployment
    .gas_price = 25000000000, // 25 gwei
    .data = contract_bytecode,
};

const tx = try builder.buildTransaction(request);
```

## Integration with Reference Implementations

This implementation follows patterns from:
- **Viem**: TypeScript transaction utilities and serialization
- **Ox**: Modern Ethereum transaction handling
- **Alloy**: Rust-based transaction types and RLP encoding

The Zig implementation maintains compatibility while providing memory safety and performance benefits.

## Future Enhancements

The current implementation provides a solid foundation. Future enhancements will include:
1. **RLP Serialization**: Complete transaction encoding/decoding
2. **ECDSA Signing**: Real cryptographic signing (currently placeholder)
3. **Advanced Gas Estimation**: Integration with EVM execution
4. **EIP-2930 and EIP-4844**: Extended transaction type support
5. **Transaction Pool**: Memory pool management
6. **Broadcast Support**: Network transaction submission

## Performance Characteristics

The Zig implementation provides:
- **Zero-allocation defaults**: Most operations avoid memory allocation
- **Type Safety**: Compile-time transaction type validation
- **Memory Efficiency**: Minimal runtime overhead
- **Fast Execution**: Optimized for high-throughput scenarios

This makes it suitable for high-performance applications like MEV bots, block builders, and RPC endpoints. 