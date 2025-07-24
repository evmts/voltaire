# Access List

EIP-2929 & EIP-2930 implementation for tracking accessed addresses and storage slots during EVM execution. The access list is critical for accurate gas accounting, distinguishing between "cold" (first access) and "warm" (subsequent access) operations.

## Purpose

The access list serves two main functions:
1. **Gas Cost Calculation**: Implements EIP-2929 gas pricing where cold accesses cost significantly more than warm accesses
2. **Transaction Optimization**: Supports EIP-2930 typed transactions that can pre-declare accessed addresses and storage slots

## Gas Costs

- **Cold address access**: 2,600 gas
- **Warm address access**: 100 gas  
- **Cold storage slot access**: 2,100 gas
- **Warm storage slot access**: 100 gas
- **Cold CALL extra cost**: 2,500 gas (difference between cold and warm)

## Files

### `access_list.zig`
Main implementation of the access list data structure and operations.

**Key Features**:
- Tracks warm addresses using `AutoHashMap`
- Tracks warm storage slots using custom `HashMap` with pre-sized buckets
- Pre-warms transaction origin, block coinbase, and recipient addresses
- Provides gas cost calculations for address and storage accesses
- Includes comprehensive benchmarks showing sub-microsecond access times

**Performance Characteristics**:
- Sequential access patterns show measurable performance benefits over random access
- Average address access: ~2-10 ns per operation
- Average storage access: ~2-10 ns per operation
- Optimized for common access patterns with branch hints

**Used By**: The EVM main execution loop (`evm.zig`) for all operations that access addresses or storage (SLOAD, SSTORE, CALL, DELEGATECALL, etc.)

### `access_list_storage_key.zig`
Defines the compound key structure for storage slot tracking.

**Structure**:
```zig
address: Address  // Contract address
slot: u256       // Storage slot number
```

**Features**:
- Custom hash function using Wyhash for efficient HashMap operations
- Equality comparison for HashMap lookups

**Used By**: `access_list.zig` for the storage slots HashMap

### `access_list_storage_key_context.zig`
HashMap context adapter for `AccessListStorageKey`.

**Purpose**: Provides the required interface for Zig's HashMap implementation, delegating to the key's own hash and equality methods.

**Used By**: `access_list.zig` when creating the storage slots HashMap

### `context.zig`
Transaction and block execution context containing all environmental data accessible by smart contracts.

**Contains**:
- `tx_origin`: Transaction originator (ORIGIN opcode)
- `gas_price`: Gas price for the transaction (GASPRICE opcode)
- `block_number`: Current block number (NUMBER opcode)
- `block_timestamp`: Current block timestamp (TIMESTAMP opcode)
- `block_coinbase`: Block miner address (COINBASE opcode)
- `block_difficulty`: Block difficulty/prevrandao (DIFFICULTY/PREVRANDAO opcodes)
- `block_gas_limit`: Block gas limit (GASLIMIT opcode)
- `chain_id`: Chain identifier (CHAINID opcode)
- `block_base_fee`: EIP-1559 base fee (BASEFEE opcode)
- `blob_hashes`: EIP-4844 blob hashes
- `blob_base_fee`: EIP-4844 blob base fee (BLOBBASEFEE opcode)

**Used By**: 
- `access_list.zig` for pre-warming origin and coinbase addresses
- Various EVM operations that need environmental data

## Usage in EVM

The access list is used throughout the EVM execution:

1. **Transaction Start**: `init_transaction()` pre-warms origin, coinbase, and recipient
2. **Storage Operations**: SLOAD/SSTORE check and update storage slot warmth
3. **External Calls**: CALL/DELEGATECALL/STATICCALL check and update address warmth
4. **Gas Calculation**: All operations query the access list for accurate gas costs

## Testing

The module includes:
- Unit tests for basic functionality
- Benchmarks for performance analysis
- Comprehensive fuzz tests covering:
  - Large-scale access patterns
  - Gas optimization scenarios
  - Memory efficiency
  - Transaction patterns
  - Hash collision handling

## Performance Notes

- Uses `@branchHint(.likely)` for warm accesses as they're more common after initial setup
- HashMap for storage slots is pre-sized to 80 buckets for typical contract usage
- Clear operation retains capacity to avoid reallocation across transactions
- Sequential access patterns show better cache performance than random access