# Storage Module

## Overview

The Storage module provides comprehensive EVM state management including account data, contract storage, and transaction journaling. It implements a high-performance in-memory database with snapshot support, access list management, and self-destruct tracking.

This module handles all persistent state for EVM execution including account balances, nonces, contract code, persistent storage (SSTORE/SLOAD), and transient storage (EIP-1153). The implementation uses hash maps for efficient lookups and provides complete EVM state management without vtable overhead.

## Core Components

### Primary Files

- **`database.zig`** - Main database implementation with account and storage management
- **`database_interface_account.zig`** - Account data structure and interface definitions
- **`memory_database.zig`** - In-memory database implementation optimized for testing
- **`journal.zig`** - Transaction journaling system for state changes and reverts
- **`journal_entry.zig`** - Individual journal entry definitions for different state changes
- **`journal_config.zig`** - Configuration options for journaling behavior
- **`access_list.zig`** - EIP-2930 access list implementation for gas optimization
- **`access_list_config.zig`** - Access list configuration and validation
- **`created_contracts.zig`** - Tracking of contracts created during transaction execution
- **`self_destruct.zig`** - Self-destruct contract management and cleanup
- **`static_wrappers.zig`** - Static interface wrappers for external integration

### Benchmarking and Testing

- **`database_interface_bench.zig`** - Database operation benchmarks
- **`journal_bench.zig`** - Journal system performance benchmarks

## Key Data Structures

### Database Structure
```zig
pub const Database = struct {
    accounts: std.HashMap([20]u8, Account, ArrayHashContext, std.hash_map.default_max_load_percentage),
    storage: std.HashMap(StorageKey, u256, StorageKeyContext, std.hash_map.default_max_load_percentage),
    transient_storage: std.HashMap(StorageKey, u256, StorageKeyContext, std.hash_map.default_max_load_percentage),
    code_storage: std.HashMap([32]u8, []const u8, ArrayHashContext, std.hash_map.default_max_load_percentage),
    snapshots: std.ArrayList(Snapshot),
    next_snapshot_id: u64,
    allocator: std.mem.Allocator,
    
    // Core operations
    pub fn get_account(self: *const Self, address: [20]u8) ?Account
    pub fn set_account(self: *Self, address: [20]u8, account: Account) !void
    pub fn get_storage(self: *const Self, address: [20]u8, key: u256) u256
    pub fn set_storage(self: *Self, address: [20]u8, key: u256, value: u256) !void
};
```

### Account Structure
```zig
pub const Account = struct {
    balance: u256 = 0,
    nonce: u64 = 0,
    code_hash: [32]u8 = EMPTY_CODE_HASH,
    storage_root: [32]u8 = EMPTY_STORAGE_ROOT,
    
    pub const EMPTY_CODE_HASH: [32]u8 = [_]u8{0} ** 32;
    pub const EMPTY_STORAGE_ROOT: [32]u8 = [_]u8{0} ** 32;
    
    pub fn is_empty(self: Account) bool {
        return self.balance == 0 and 
               self.nonce == 0 and 
               std.mem.eql(u8, &self.code_hash, &EMPTY_CODE_HASH);
    }
};
```

### Storage Key
```zig
pub const StorageKey = struct {
    address: [20]u8,
    slot: u256,
    
    pub fn init(address: [20]u8, slot: u256) StorageKey {
        return StorageKey{ .address = address, .slot = slot };
    }
};
```

### Journal System
```zig
pub const Journal = struct {
    entries: std.ArrayList(JournalEntry),
    checkpoints: std.ArrayList(usize),
    allocator: std.mem.Allocator,
    
    pub fn create_checkpoint(self: *Self) usize
    pub fn commit_checkpoint(self: *Self) void
    pub fn revert_to_checkpoint(self: *Self, checkpoint: usize) void
};

pub const JournalEntry = union(enum) {
    account_created: AccountCreated,
    account_destroyed: AccountDestroyed,
    balance_change: BalanceChange,
    nonce_change: NonceChange,
    storage_change: StorageChange,
    transient_storage_change: TransientStorageChange,
    code_change: CodeChange,
    access_list_address: AccessListAddress,
    access_list_storage: AccessListStorage,
};
```

## Performance Considerations

### Hash Map Optimization
Database uses specialized hash contexts for optimal performance:
```zig
const ArrayHashContext = struct {
    pub fn hash(self: @This(), key: anytype) u64 {
        _ = self;
        return std.hash.Wyhash.hash(0, std.mem.asBytes(&key));
    }
    
    pub fn eql(self: @This(), a: anytype, b: anytype) bool {
        _ = self;
        return std.mem.eql(u8, std.mem.asBytes(&a), std.mem.asBytes(&b));
    }
};
```

### Storage Key Hashing
Efficient hashing for storage keys combining address and slot:
```zig
const StorageKeyContext = struct {
    pub fn hash(self: @This(), key: StorageKey) u64 {
        _ = self;
        var hasher = std.hash.Wyhash.init(0);
        hasher.update(&key.address);
        hasher.update(std.mem.asBytes(&key.slot));
        return hasher.final();
    }
};
```

### Memory Pool Management
Database uses pre-allocated pools for frequently created objects:
```zig
pub const DatabasePool = struct {
    journal_entries: std.heap.MemoryPool(JournalEntry),
    snapshots: std.heap.MemoryPool(Snapshot),
    
    pub fn get_journal_entry(self: *Self) !*JournalEntry {
        return try self.journal_entries.create();
    }
};
```

## Usage Examples

### Basic Database Operations
```zig
const Database = @import("database.zig").Database;
const Account = @import("database_interface_account.zig").Account;

var db = try Database.init(allocator);
defer db.deinit();

// Create account
const address = [_]u8{1} ++ [_]u8{0} ** 19; // 0x01...
var account = Account{
    .balance = 1000000000000000000, // 1 ETH in wei
    .nonce = 0,
};

// Store account
try db.set_account(address, account);

// Retrieve account
const stored_account = db.get_account(address);
std.debug.assert(stored_account.?.balance == 1000000000000000000);
```

### Storage Operations
```zig
// Set contract storage
const contract_address = [_]u8{2} ++ [_]u8{0} ** 19;
const storage_slot: u256 = 0;
const storage_value: u256 = 0xDEADBEEF;

try db.set_storage(contract_address, storage_slot, storage_value);

// Get contract storage  
const retrieved_value = db.get_storage(contract_address, storage_slot);
std.debug.assert(retrieved_value == 0xDEADBEEF);
```

### Transient Storage (EIP-1153)
```zig
// Set transient storage (cleared at end of transaction)
try db.set_transient_storage(contract_address, storage_slot, 12345);

// Get transient storage
const transient_value = db.get_transient_storage(contract_address, storage_slot);
std.debug.assert(transient_value == 12345);

// Transient storage is automatically cleared between transactions
db.clear_transient_storage();
```

### Snapshot and Revert System
```zig
// Create snapshot before state changes
const snapshot_id = db.create_snapshot();

// Make some changes
const original_balance = db.get_account(address).?.balance;
try db.set_balance(address, 2000000000000000000); // 2 ETH

// Verify change
std.debug.assert(db.get_account(address).?.balance == 2000000000000000000);

// Revert to snapshot
db.revert_to_snapshot(snapshot_id);

// Balance restored
std.debug.assert(db.get_account(address).?.balance == original_balance);
```

### Journal System Usage
```zig
const Journal = @import("journal.zig").Journal;

var journal = try Journal.init(allocator);
defer journal.deinit();

// Create checkpoint
const checkpoint = journal.create_checkpoint();

// Track state changes
try journal.log_balance_change(address, old_balance, new_balance);
try journal.log_storage_change(contract_address, slot, old_value, new_value);

// Commit changes
journal.commit_checkpoint();

// Or revert changes
journal.revert_to_checkpoint(checkpoint);
```

### Access List Management
```zig
const AccessList = @import("access_list.zig").AccessList;

var access_list = try AccessList.init(allocator);
defer access_list.deinit();

// Add address to access list (EIP-2930)
const warm_address = [_]u8{3} ++ [_]u8{0} ** 19;
try access_list.add_address(warm_address);

// Add storage slot to access list
try access_list.add_storage_slot(warm_address, 5);

// Check if address/slot is warm
std.debug.assert(access_list.is_address_warm(warm_address));
std.debug.assert(access_list.is_storage_warm(warm_address, 5));
```

## State Management

### Account Lifecycle
```zig
// Create new account
pub fn create_account(db: *Database, address: [20]u8) !void {
    const new_account = Account{
        .balance = 0,
        .nonce = 0,
        .code_hash = Account.EMPTY_CODE_HASH,
        .storage_root = Account.EMPTY_STORAGE_ROOT,
    };
    try db.set_account(address, new_account);
}

// Self-destruct account
pub fn self_destruct(db: *Database, address: [20]u8, beneficiary: [20]u8) !void {
    const account = db.get_account(address) orelse return;
    
    // Transfer balance to beneficiary
    if (account.balance > 0) {
        try db.transfer_balance(address, beneficiary, account.balance);
    }
    
    // Mark for destruction
    try db.mark_self_destructed(address);
}
```

### Contract Code Management
```zig
// Store contract code
pub fn set_code(db: *Database, address: [20]u8, code: []const u8) !void {
    const code_hash = keccak256(code);
    
    // Store code by hash
    const owned_code = try db.allocator.dupe(u8, code);
    try db.code_storage.put(code_hash, owned_code);
    
    // Update account code hash
    var account = db.get_account(address) orelse Account{};
    account.code_hash = code_hash;
    try db.set_account(address, account);
}

// Retrieve contract code
pub fn get_code(db: *const Database, address: [20]u8) ?[]const u8 {
    const account = db.get_account(address) orelse return null;
    if (std.mem.eql(u8, &account.code_hash, &Account.EMPTY_CODE_HASH)) {
        return &[_]u8{}; // Empty code
    }
    return db.code_storage.get(account.code_hash);
}
```

## Integration Notes

### With Frame Module
Storage integrates with Frame for:
- SLOAD/SSTORE opcode implementation
- TLOAD/TSTORE transient storage operations
- Account balance and nonce queries
- Contract code deployment and retrieval

### With EVM Module
Database provides:
- Complete state management for transaction execution
- Snapshot/revert functionality for nested calls
- Gas cost calculation for storage operations
- Access list warmness tracking for gas optimization

### With Instructions Module
Storage handlers support:
- Balance queries for BALANCE opcode
- Storage operations for SLOAD/SSTORE
- Code operations for CODECOPY/CODESIZE
- Context queries for ADDRESS/CALLER opcodes

## Error Handling

Storage operations use comprehensive error types:
- `AccountNotFound` - Access to non-existent account
- `StorageNotFound` - Access to uninitialized storage slot
- `CodeNotFound` - Reference to missing contract code
- `OutOfMemory` - Allocation failure during operation
- `DatabaseCorrupted` - Inconsistent internal state

All operations maintain ACID properties with proper cleanup through defer patterns and comprehensive error propagation.