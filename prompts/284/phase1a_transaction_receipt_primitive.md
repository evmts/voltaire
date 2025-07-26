# Phase 1A: Transaction Receipt Primitive Implementation

## Context
You are implementing the first atomic component of Phase 1: the TransactionReceipt primitive type. This is a foundational data structure that represents the result of executing an Ethereum transaction, including gas usage, contract creation, event logs, and execution status.

## Objective
Create a robust, well-tested `TransactionReceipt` primitive in `src/primitives/receipt.zig` that follows Guillotine's architecture patterns and memory management standards.

## Technical Specification

### TransactionReceipt Structure
The TransactionReceipt represents the execution result of a transaction and contains:

**Core Identification**:
- `transaction_hash: Hash` - Keccak256 hash of the transaction
- `transaction_index: u64` - Position of transaction within the block (0-based)
- `block_hash: Hash` - Hash of the block containing this transaction
- `block_number: u64` - Block number containing this transaction

**Execution Context**:
- `from: Address` - Address that sent the transaction
- `to: ?Address` - Recipient address (null for contract creation)
- `contract_address: ?Address` - Address of created contract (null for regular transactions)

**Gas and Fees**:
- `cumulative_gas_used: u64` - Total gas used by all transactions up to and including this one
- `gas_used: u64` - Gas used by this specific transaction
- `effective_gas_price: u256` - Actual gas price paid (important for EIP-1559)

**Execution Results**:
- `status: u8` - Execution status (1 = success, 0 = failure)
- `logs: []EventLog` - Array of events emitted during execution

### EIP Compliance Notes
- **EIP-658**: Status field (replaces root field in post-Byzantium)
- **EIP-1559**: Effective gas price field for dynamic fee transactions
- **EIP-2930**: Access list transactions still use same receipt format
- **EIP-4844**: Blob transactions may have additional fields in future

## Implementation Requirements

### File Structure
```zig
//! Transaction Receipt - Ethereum transaction execution results
//!
//! Represents the result of executing a transaction, including gas usage,
//! contract creation, event logs, and execution status.
//!
//! ## EIP Compliance
//! - EIP-658: Post-Byzantium status field
//! - EIP-1559: Effective gas price for dynamic fee transactions
//! - EIP-2930: Compatible with access list transactions
//! - EIP-4844: Forward compatible with blob transactions
//!
//! ## Memory Management
//! TransactionReceipt owns its logs array and is responsible for cleanup.
//! Always call deinit() to prevent memory leaks.
//!
//! ## Usage Example
//! ```zig
//! var receipt = TransactionReceipt{
//!     .transaction_hash = tx_hash,
//!     .logs = try allocator.alloc(EventLog, log_count),
//!     // ... other fields
//! };
//! defer receipt.deinit(allocator);
//! ```

const std = @import("std");
const testing = std.testing;
const Address = @import("address.zig").Address;
const EventLog = @import("event_log.zig").EventLog;
const crypto_pkg = @import("crypto");
const Hash = crypto_pkg.Hash;
const Allocator = std.mem.Allocator;

pub const TransactionReceipt = struct {
    // Core identification
    transaction_hash: Hash,
    transaction_index: u64,
    block_hash: Hash,
    block_number: u64,
    
    // Execution context
    from: Address,
    to: ?Address,
    contract_address: ?Address,
    
    // Gas and fees
    cumulative_gas_used: u64,
    gas_used: u64,
    effective_gas_price: u256,
    
    // Execution results
    status: u8,
    logs: []EventLog,
    
    /// Clean up allocated memory for logs array
    pub fn deinit(self: *const TransactionReceipt, allocator: Allocator) void {
        for (self.logs) |*log| {
            log.deinit(allocator);
        }
        allocator.free(self.logs);
    }
    
    /// Check if transaction executed successfully
    pub fn isSuccess(self: *const TransactionReceipt) bool {
        return self.status == 1;
    }
    
    /// Check if transaction failed
    pub fn isFailure(self: *const TransactionReceipt) bool {
        return self.status == 0;
    }
    
    /// Check if this receipt represents a contract creation
    pub fn isContractCreation(self: *const TransactionReceipt) bool {
        return self.contract_address != null;
    }
    
    /// Get the number of events emitted
    pub fn getLogCount(self: *const TransactionReceipt) usize {
        return self.logs.len;
    }
};
```

### Memory Management Requirements
1. **Ownership**: TransactionReceipt owns its logs array
2. **Cleanup**: Must call `deinit()` to free logs and their internal data
3. **Error Handling**: Use `errdefer` when transferring ownership to caller
4. **Allocation Pattern**: Prefer upfront allocation for logs array

### Helper Methods
Implement these convenience methods:
- `isSuccess()` - Returns true if status == 1
- `isFailure()` - Returns true if status == 0  
- `isContractCreation()` - Returns true if contract_address is not null
- `getLogCount()` - Returns number of logs

## Testing Requirements

### Test Categories
1. **Basic Construction** - Create receipt with minimal fields
2. **Memory Management** - Verify proper cleanup with deinit()
3. **Helper Methods** - Test all convenience methods
4. **Edge Cases** - Handle null fields, empty logs, large values
5. **Integration** - Work with existing EventLog and Address types

### Required Test Cases

```zig
test "TransactionReceipt basic construction and cleanup" {
    const allocator = testing.allocator;
    
    // Create minimal receipt
    var logs = try allocator.alloc(EventLog, 0);
    const receipt = TransactionReceipt{
        .transaction_hash = Hash.ZERO,
        .transaction_index = 0,
        .block_hash = Hash.ZERO,
        .block_number = 1000000,
        .from = Address.ZERO,
        .to = null,
        .contract_address = null,
        .cumulative_gas_used = 21000,
        .gas_used = 21000,
        .effective_gas_price = 20000000000, // 20 gwei
        .status = 1,
        .logs = logs,
    };
    defer receipt.deinit(allocator);
    
    try testing.expect(receipt.isSuccess());
    try testing.expect(!receipt.isFailure());
    try testing.expectEqual(@as(usize, 0), receipt.getLogCount());
}

test "TransactionReceipt contract creation" {
    const allocator = testing.allocator;
    
    const contract_addr = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f6E97b");
    var logs = try allocator.alloc(EventLog, 0);
    
    const receipt = TransactionReceipt{
        .transaction_hash = Hash.ZERO,
        .transaction_index = 5,
        .block_hash = Hash.ZERO,
        .block_number = 2000000,
        .from = Address.ZERO,
        .to = null, // Contract creation has null 'to'
        .contract_address = contract_addr,
        .cumulative_gas_used = 500000,
        .gas_used = 300000,
        .effective_gas_price = 25000000000, // 25 gwei
        .status = 1,
        .logs = logs,
    };
    defer receipt.deinit(allocator);
    
    try testing.expect(receipt.isContractCreation());
    try testing.expectEqual(contract_addr, receipt.contract_address.?);
}

test "TransactionReceipt failed transaction" {
    const allocator = testing.allocator;
    
    var logs = try allocator.alloc(EventLog, 0);
    const receipt = TransactionReceipt{
        .transaction_hash = Hash.ZERO,
        .transaction_index = 10,
        .block_hash = Hash.ZERO,
        .block_number = 3000000,
        .from = Address.ZERO,
        .to = Address.ZERO,
        .contract_address = null,
        .cumulative_gas_used = 100000,
        .gas_used = 50000,
        .effective_gas_price = 15000000000, // 15 gwei
        .status = 0, // Failed transaction
        .logs = logs,
    };
    defer receipt.deinit(allocator);
    
    try testing.expect(receipt.isFailure());
    try testing.expect(!receipt.isSuccess());
    try testing.expect(!receipt.isContractCreation());
}

test "TransactionReceipt with event logs" {
    const allocator = testing.allocator;
    
    // Create mock event logs
    var logs = try allocator.alloc(EventLog, 2);
    logs[0] = EventLog{
        .address = Address.ZERO,
        .topics = &[_]Hash{},
        .data = &[_]u8{},
        .block_number = 4000000,
        .transaction_hash = Hash.ZERO,
        .transaction_index = 15,
        .log_index = 0,
        .removed = false,
    };
    logs[1] = EventLog{
        .address = Address.ZERO,
        .topics = &[_]Hash{},
        .data = &[_]u8{},
        .block_number = 4000000,
        .transaction_hash = Hash.ZERO,
        .transaction_index = 15,
        .log_index = 1,
        .removed = false,
    };
    
    const receipt = TransactionReceipt{
        .transaction_hash = Hash.ZERO,
        .transaction_index = 15,
        .block_hash = Hash.ZERO,
        .block_number = 4000000,
        .from = Address.ZERO,
        .to = Address.ZERO,
        .contract_address = null,
        .cumulative_gas_used = 200000,
        .gas_used = 150000,
        .effective_gas_price = 30000000000, // 30 gwei
        .status = 1,
        .logs = logs,
    };
    defer receipt.deinit(allocator);
    
    try testing.expectEqual(@as(usize, 2), receipt.getLogCount());
    try testing.expect(receipt.isSuccess());
}

test "TransactionReceipt memory management with complex logs" {
    const allocator = testing.allocator;
    
    // Create logs with allocated data to test proper cleanup
    var logs = try allocator.alloc(EventLog, 1);
    const log_data = try allocator.dupe(u8, "test event data");
    const topics = try allocator.alloc(Hash, 1);
    topics[0] = Hash.ZERO;
    
    logs[0] = EventLog{
        .address = Address.ZERO,
        .topics = topics,
        .data = log_data,
        .block_number = 5000000,
        .transaction_hash = Hash.ZERO,
        .transaction_index = 20,
        .log_index = 0,
        .removed = false,
    };
    
    const receipt = TransactionReceipt{
        .transaction_hash = Hash.ZERO,
        .transaction_index = 20,
        .block_hash = Hash.ZERO,
        .block_number = 5000000,
        .from = Address.ZERO,
        .to = Address.ZERO,
        .contract_address = null,
        .cumulative_gas_used = 75000,
        .gas_used = 75000,
        .effective_gas_price = 10000000000, // 10 gwei
        .status = 1,
        .logs = logs,
    };
    defer receipt.deinit(allocator);
    
    try testing.expectEqual(@as(usize, 1), receipt.getLogCount());
}
```

### Edge Case Testing
- **Large Values**: Test with maximum u64 and u256 values
- **Null Fields**: Verify proper handling of optional fields
- **Empty Logs**: Test with zero-length logs array
- **Memory Pressure**: Test allocation failures and cleanup

## Integration Requirements

### Export to Primitives Module
Add to `src/primitives/root.zig`:
```zig
pub const TransactionReceipt = @import("receipt.zig").TransactionReceipt;
```

### Dependencies
- `Address` from `address.zig` - Must handle all address operations
- `EventLog` from `event_log.zig` - Must properly manage log lifecycle
- `Hash` from crypto package - For transaction and block hashes

## Success Criteria
- [ ] `src/primitives/receipt.zig` compiles without errors
- [ ] All test cases pass with `zig build test`
- [ ] Memory management verified (no leaks in tests)
- [ ] Helper methods work correctly
- [ ] Integration with existing primitives confirmed
- [ ] Export added to `src/primitives/root.zig`
- [ ] Code follows CLAUDE.md standards (camelCase, defer patterns)

## Common Pitfalls to Avoid
1. **Memory Leaks**: Forgetting to call deinit() on EventLog elements
2. **Null Pointer Issues**: Not handling optional fields properly
3. **Integer Overflow**: Not validating large gas values
4. **Status Values**: Using values other than 0/1 for status field
5. **Log Ownership**: Confusion about who owns the logs array

## Performance Considerations
- **Memory Layout**: Struct fields ordered for optimal packing
- **Allocation Strategy**: Single allocation for logs array when possible
- **Copy Semantics**: Avoid unnecessary copying of large data
- **Cache Locality**: Keep related fields together in memory

This atomic prompt focuses solely on implementing a robust, well-tested TransactionReceipt primitive that will serve as the foundation for the provider system and future block verification tests.