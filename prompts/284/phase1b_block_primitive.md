# Phase 1B: Block with Transactions Primitive Implementation

## Context
You are implementing the second atomic component of Phase 1: the BlockWithTransactions primitive type. This represents a complete Ethereum block containing full transaction objects (not just hashes), which is essential for comprehensive block verification and analysis.

## Prerequisites
- **Phase 1A must be completed**: This prompt depends on the TransactionReceipt primitive
- **Existing Transaction types**: Leverages the existing transaction.zig module

## Objective
Create a robust, well-tested `BlockWithTransactions` primitive in `src/primitives/block.zig` that can handle all Ethereum block formats and transaction types while maintaining efficient memory management.

## Technical Specification

### BlockWithTransactions Structure
The BlockWithTransactions represents a complete Ethereum block with full transaction data:

**Block Identification**:
- `hash: Hash` - Keccak256 hash of the block header
- `number: u64` - Block number (height) in the blockchain
- `parent_hash: Hash` - Hash of the previous block

**Block Metadata**:
- `timestamp: u64` - Unix timestamp when block was mined
- `miner: Address` - Address of the block miner/validator
- `difficulty: u256` - Mining difficulty (0 for PoS blocks)
- `total_difficulty: u256` - Cumulative difficulty up to this block
- `size: u64` - Block size in bytes

**Gas and Fees**:
- `gas_limit: u64` - Maximum gas allowed in this block
- `gas_used: u64` - Total gas consumed by all transactions
- `base_fee_per_gas: ?u256` - EIP-1559 base fee (null for pre-London blocks)

**Merkle Roots**:
- `state_root: Hash` - Root hash of the state trie after block execution
- `transactions_root: Hash` - Root hash of the transactions trie
- `receipts_root: Hash` - Root hash of the receipts trie

**Transaction Data**:
- `transactions: []Transaction.Transaction` - Array of full transaction objects

### Block Type Compatibility
- **Pre-EIP-1559**: base_fee_per_gas is null
- **Post-EIP-1559**: base_fee_per_gas contains the base fee
- **All Transaction Types**: Supports Legacy, EIP-2930, EIP-1559, EIP-4844 transactions
- **Proof-of-Stake**: difficulty may be 0, miner is the validator

## Implementation Requirements

### File Structure
```zig
//! Ethereum Block with Transactions - Complete block data structure
//!
//! Represents a full Ethereum block including all transaction data,
//! not just transaction hashes. This is essential for block verification
//! and detailed transaction analysis.
//!
//! ## Block Evolution
//! - Pre-EIP-1559: No base fee, simple gas pricing
//! - EIP-1559 (London): Base fee mechanism for dynamic pricing
//! - EIP-4844 (Cancun): Blob transactions support
//! - Proof-of-Stake: Difficulty may be 0, miner is validator
//!
//! ## Memory Management
//! BlockWithTransactions owns its transactions array and is responsible
//! for cleanup. Always call deinit() to prevent memory leaks.
//!
//! ## Usage Example
//! ```zig
//! var block = BlockWithTransactions{
//!     .transactions = try allocator.alloc(Transaction.Transaction, tx_count),
//!     // ... other fields
//! };
//! defer block.deinit(allocator);
//! ```

const std = @import("std");
const testing = std.testing;
const Transaction = @import("transaction.zig");
const Address = @import("address.zig").Address;
const crypto_pkg = @import("crypto");
const Hash = crypto_pkg.Hash;
const Allocator = std.mem.Allocator;

pub const BlockWithTransactions = struct {
    // Block identification
    hash: Hash,
    number: u64,
    parent_hash: Hash,
    
    // Block metadata
    timestamp: u64,
    miner: Address,
    difficulty: u256,
    total_difficulty: u256,
    size: u64,
    
    // Gas and fees
    gas_limit: u64,
    gas_used: u64,
    base_fee_per_gas: ?u256, // null for pre-EIP-1559 blocks
    
    // Merkle roots
    state_root: Hash,
    transactions_root: Hash,
    receipts_root: Hash,
    
    // Transaction data
    transactions: []Transaction.Transaction,
    
    /// Clean up allocated memory for transactions array
    pub fn deinit(self: *const BlockWithTransactions, allocator: Allocator) void {
        for (self.transactions) |*tx| {
            tx.deinit(allocator);
        }
        allocator.free(self.transactions);
    }
    
    /// Get the number of transactions in this block
    pub fn getTransactionCount(self: *const BlockWithTransactions) usize {
        return self.transactions.len;
    }
    
    /// Check if this is an EIP-1559 block (has base fee)
    pub fn hasBaseFee(self: *const BlockWithTransactions) bool {
        return self.base_fee_per_gas != null;
    }
    
    /// Check if this is a Proof-of-Stake block (difficulty is 0)
    pub fn isProofOfStake(self: *const BlockWithTransactions) bool {
        return self.difficulty == 0;
    }
    
    /// Get the base fee per gas (0 if not EIP-1559)
    pub fn getBaseFee(self: *const BlockWithTransactions) u256 {
        return self.base_fee_per_gas orelse 0;
    }
    
    /// Calculate gas utilization percentage (0-100)
    pub fn getGasUtilization(self: *const BlockWithTransactions) u8 {
        if (self.gas_limit == 0) return 0;
        const utilization = (self.gas_used * 100) / self.gas_limit;
        return @intCast(std.math.min(utilization, 100));
    }
    
    /// Find transaction by hash (linear search)
    pub fn findTransaction(self: *const BlockWithTransactions, tx_hash: Hash) ?*const Transaction.Transaction {
        for (self.transactions) |*tx| {
            if (std.mem.eql(u8, &tx.getHash().bytes, &tx_hash.bytes)) {
                return tx;
            }
        }
        return null;
    }
    
    /// Get transaction by index
    pub fn getTransaction(self: *const BlockWithTransactions, index: usize) ?*const Transaction.Transaction {
        if (index >= self.transactions.len) return null;
        return &self.transactions[index];
    }
    
    /// Check if block is empty (no transactions)
    pub fn isEmpty(self: *const BlockWithTransactions) bool {
        return self.transactions.len == 0;
    }
};
```

### Memory Management Requirements
1. **Ownership**: BlockWithTransactions owns its transactions array
2. **Cleanup**: Must call `deinit()` to free transactions and their internal data
3. **Transaction Lifecycle**: Each transaction must properly clean up its own data
4. **Error Handling**: Use `errdefer` when transferring ownership to caller

### Helper Methods
Implement these convenience methods:
- `getTransactionCount()` - Returns number of transactions
- `hasBaseFee()` - Returns true if EIP-1559 block
- `isProofOfStake()` - Returns true if difficulty is 0
- `getBaseFee()` - Returns base fee or 0
- `getGasUtilization()` - Returns gas usage percentage
- `findTransaction()` - Find transaction by hash
- `getTransaction()` - Get transaction by index
- `isEmpty()` - Check if block has no transactions

## Testing Requirements

### Test Categories
1. **Basic Construction** - Create block with minimal fields
2. **Memory Management** - Verify proper cleanup with deinit()
3. **Helper Methods** - Test all convenience methods
4. **Transaction Management** - Add/find/access transactions
5. **EIP Compatibility** - Test pre/post EIP-1559 blocks
6. **Edge Cases** - Handle empty blocks, large blocks, PoS blocks

### Required Test Cases

```zig
test "BlockWithTransactions basic construction and cleanup" {
    const allocator = testing.allocator;
    
    // Create empty block
    var transactions = try allocator.alloc(Transaction.Transaction, 0);
    const block = BlockWithTransactions{
        .hash = Hash.ZERO,
        .number = 1000000,
        .parent_hash = Hash.ZERO,
        .timestamp = 1640995200, // 2022-01-01
        .miner = Address.ZERO,
        .difficulty = 1000000000000000,
        .total_difficulty = 50000000000000000000,
        .size = 1024,
        .gas_limit = 30000000,
        .gas_used = 0,
        .base_fee_per_gas = null, // Pre-EIP-1559
        .state_root = Hash.ZERO,
        .transactions_root = Hash.ZERO,
        .receipts_root = Hash.ZERO,
        .transactions = transactions,
    };
    defer block.deinit(allocator);
    
    try testing.expectEqual(@as(usize, 0), block.getTransactionCount());
    try testing.expect(block.isEmpty());
    try testing.expect(!block.hasBaseFee());
    try testing.expect(!block.isProofOfStake());
    try testing.expectEqual(@as(u8, 0), block.getGasUtilization());
}

test "BlockWithTransactions EIP-1559 block" {
    const allocator = testing.allocator;
    
    var transactions = try allocator.alloc(Transaction.Transaction, 0);
    const block = BlockWithTransactions{
        .hash = Hash.ZERO,
        .number = 15000000, // Post-London
        .parent_hash = Hash.ZERO,
        .timestamp = 1660000000,
        .miner = Address.ZERO,
        .difficulty = 1000000000000000,
        .total_difficulty = 60000000000000000000,
        .size = 2048,
        .gas_limit = 30000000,
        .gas_used = 15000000, // 50% utilization
        .base_fee_per_gas = 20000000000, // 20 gwei
        .state_root = Hash.ZERO,
        .transactions_root = Hash.ZERO,
        .receipts_root = Hash.ZERO,
        .transactions = transactions,
    };
    defer block.deinit(allocator);
    
    try testing.expect(block.hasBaseFee());
    try testing.expectEqual(@as(u256, 20000000000), block.getBaseFee());
    try testing.expectEqual(@as(u8, 50), block.getGasUtilization());
}

test "BlockWithTransactions Proof-of-Stake block" {
    const allocator = testing.allocator;
    
    var transactions = try allocator.alloc(Transaction.Transaction, 0);
    const block = BlockWithTransactions{
        .hash = Hash.ZERO,
        .number = 18000000, // Post-Merge
        .parent_hash = Hash.ZERO,
        .timestamp = 1670000000,
        .miner = Address.ZERO, // Actually validator
        .difficulty = 0, // PoS has no difficulty
        .total_difficulty = 58750003716598352816469,
        .size = 1500,
        .gas_limit = 30000000,
        .gas_used = 12000000,
        .base_fee_per_gas = 15000000000, // 15 gwei
        .state_root = Hash.ZERO,
        .transactions_root = Hash.ZERO,
        .receipts_root = Hash.ZERO,
        .transactions = transactions,
    };
    defer block.deinit(allocator);
    
    try testing.expect(block.isProofOfStake());
    try testing.expect(block.hasBaseFee());
    try testing.expectEqual(@as(u8, 40), block.getGasUtilization());
}

test "BlockWithTransactions with transactions" {
    const allocator = testing.allocator;
    
    // Create mock transactions
    var transactions = try allocator.alloc(Transaction.Transaction, 2);
    
    // Mock legacy transaction
    transactions[0] = Transaction.Transaction{
        .legacy = Transaction.LegacyTransaction{
            .nonce = 0,
            .gas_price = 20000000000,
            .gas_limit = 21000,
            .to = Address.ZERO,
            .value = 1000000000000000000, // 1 ETH
            .data = &[_]u8{},
            .v = 27,
            .r = [_]u8{0} ** 32,
            .s = [_]u8{0} ** 32,
        },
    };
    
    // Mock EIP-1559 transaction
    transactions[1] = Transaction.Transaction{
        .eip1559 = Transaction.Eip1559Transaction{
            .chain_id = 1,
            .nonce = 1,
            .max_priority_fee_per_gas = 2000000000,
            .max_fee_per_gas = 25000000000,
            .gas_limit = 50000,
            .to = Address.ZERO,
            .value = 500000000000000000, // 0.5 ETH
            .data = &[_]u8{},
            .access_list = &[_]Transaction.AccessListItem{},
            .y_parity = 0,
            .r = [_]u8{0} ** 32,
            .s = [_]u8{0} ** 32,
        },
    };
    
    const block = BlockWithTransactions{
        .hash = Hash.ZERO,
        .number = 16000000,
        .parent_hash = Hash.ZERO,
        .timestamp = 1675000000,
        .miner = Address.ZERO,
        .difficulty = 0,
        .total_difficulty = 59000000000000000000,
        .size = 4096,
        .gas_limit = 30000000,
        .gas_used = 71000, // Sum of transaction gas limits
        .base_fee_per_gas = 18000000000,
        .state_root = Hash.ZERO,
        .transactions_root = Hash.ZERO,
        .receipts_root = Hash.ZERO,
        .transactions = transactions,
    };
    defer block.deinit(allocator);
    
    try testing.expectEqual(@as(usize, 2), block.getTransactionCount());
    try testing.expect(!block.isEmpty());
    
    // Test transaction access
    const tx0 = block.getTransaction(0);
    try testing.expect(tx0 != null);
    try testing.expect(tx0.?.* == .legacy);
    
    const tx1 = block.getTransaction(1);
    try testing.expect(tx1 != null);
    try testing.expect(tx1.?.* == .eip1559);
    
    // Test out of bounds
    const tx_invalid = block.getTransaction(2);
    try testing.expect(tx_invalid == null);
}

test "BlockWithTransactions transaction search" {
    const allocator = testing.allocator;
    
    var transactions = try allocator.alloc(Transaction.Transaction, 1);
    transactions[0] = Transaction.Transaction{
        .legacy = Transaction.LegacyTransaction{
            .nonce = 42,
            .gas_price = 20000000000,
            .gas_limit = 21000,
            .to = Address.ZERO,
            .value = 1000000000000000000,
            .data = &[_]u8{},
            .v = 27,
            .r = [_]u8{1} ** 32, // Unique signature
            .s = [_]u8{2} ** 32,
        },
    };
    
    const block = BlockWithTransactions{
        .hash = Hash.ZERO,
        .number = 17000000,
        .parent_hash = Hash.ZERO,
        .timestamp = 1680000000,
        .miner = Address.ZERO,
        .difficulty = 0,
        .total_difficulty = 59500000000000000000,
        .size = 2048,
        .gas_limit = 30000000,
        .gas_used = 21000,
        .base_fee_per_gas = 12000000000,
        .state_root = Hash.ZERO,
        .transactions_root = Hash.ZERO,
        .receipts_root = Hash.ZERO,
        .transactions = transactions,
    };
    defer block.deinit(allocator);
    
    // Calculate expected transaction hash
    const expected_hash = transactions[0].getHash();
    
    // Test finding transaction
    const found_tx = block.findTransaction(expected_hash);
    try testing.expect(found_tx != null);
    try testing.expect(found_tx.?.* == .legacy);
    
    // Test not finding transaction
    const not_found = block.findTransaction(Hash.ZERO);
    try testing.expect(not_found == null);
}

test "BlockWithTransactions gas utilization edge cases" {
    const allocator = testing.allocator;
    
    var transactions = try allocator.alloc(Transaction.Transaction, 0);
    
    // Test 100% utilization
    var block_full = BlockWithTransactions{
        .hash = Hash.ZERO,
        .number = 18000000,
        .parent_hash = Hash.ZERO,
        .timestamp = 1685000000,
        .miner = Address.ZERO,
        .difficulty = 0,
        .total_difficulty = 60000000000000000000,
        .size = 1024,
        .gas_limit = 30000000,
        .gas_used = 30000000, // 100% utilization
        .base_fee_per_gas = 10000000000,
        .state_root = Hash.ZERO,
        .transactions_root = Hash.ZERO,
        .receipts_root = Hash.ZERO,
        .transactions = transactions,
    };
    defer block_full.deinit(allocator);
    
    try testing.expectEqual(@as(u8, 100), block_full.getGasUtilization());
    
    // Test zero gas limit (edge case)
    transactions = try allocator.alloc(Transaction.Transaction, 0);
    var block_zero = BlockWithTransactions{
        .hash = Hash.ZERO,
        .number = 0,
        .parent_hash = Hash.ZERO,
        .timestamp = 0,
        .miner = Address.ZERO,
        .difficulty = 0,
        .total_difficulty = 0,
        .size = 0,
        .gas_limit = 0, // Edge case
        .gas_used = 0,
        .base_fee_per_gas = null,
        .state_root = Hash.ZERO,
        .transactions_root = Hash.ZERO,
        .receipts_root = Hash.ZERO,
        .transactions = transactions,
    };
    defer block_zero.deinit(allocator);
    
    try testing.expectEqual(@as(u8, 0), block_zero.getGasUtilization());
}
```

### Edge Case Testing
- **Empty Blocks**: Blocks with no transactions
- **Large Blocks**: Blocks with many transactions
- **Mixed Transaction Types**: Blocks with different transaction types
- **Extreme Values**: Maximum gas limits, large difficulties
- **PoS Transition**: Blocks around the merge

## Integration Requirements

### Export to Primitives Module
Add to `src/primitives/root.zig`:
```zig
pub const BlockWithTransactions = @import("block.zig").BlockWithTransactions;
```

### Dependencies
- `Transaction` from `transaction.zig` - Must handle all transaction types
- `Address` from `address.zig` - For miner/validator addresses
- `Hash` from crypto package - For all hash fields

### Transaction Integration
The block must properly integrate with the existing Transaction union:
```zig
// Must work with all transaction variants
pub const Transaction = union(enum) {
    legacy: LegacyTransaction,
    eip2930: Eip2930Transaction,
    eip1559: Eip1559Transaction,
    eip4844: Eip4844Transaction,
    // ... future transaction types
};
```

## Success Criteria
- [ ] `src/primitives/block.zig` compiles without errors
- [ ] All test cases pass with `zig build test`
- [ ] Memory management verified (no leaks in tests)
- [ ] Helper methods work correctly for all block types
- [ ] Integration with existing Transaction types confirmed
- [ ] Export added to `src/primitives/root.zig`
- [ ] Code follows CLAUDE.md standards (camelCase, defer patterns)
- [ ] Handles all Ethereum block evolution (pre/post EIP-1559, PoS)

## Common Pitfalls to Avoid
1. **Memory Leaks**: Forgetting to call deinit() on Transaction elements
2. **Transaction Hash Calculation**: Incorrect hash computation for transaction search
3. **Optional Field Handling**: Not properly handling null base_fee_per_gas
4. **Integer Overflow**: Not validating large gas/difficulty values
5. **Array Bounds**: Not checking transaction index bounds
6. **PoS Assumptions**: Assuming all blocks have non-zero difficulty

## Performance Considerations
- **Memory Layout**: Struct fields ordered for optimal packing
- **Transaction Search**: Linear search is acceptable for block-level operations
- **Allocation Strategy**: Single allocation for transactions array when possible
- **Cache Locality**: Keep related fields together in memory
- **Large Blocks**: Consider memory pressure with blocks containing many transactions

## Future Compatibility
- **New Transaction Types**: Structure supports adding new transaction variants
- **Additional Fields**: Room for future EIP additions
- **Merkle Proof Support**: Structure supports future merkle proof verification
- **Blob Transactions**: Compatible with EIP-4844 blob transaction data

This atomic prompt focuses solely on implementing a robust, well-tested BlockWithTransactions primitive that can handle the full spectrum of Ethereum block formats and will serve as a foundation for comprehensive block verification.