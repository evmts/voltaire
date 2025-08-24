# Journal Documentation

## Overview

The Journal system provides configurable state change tracking for EVM transaction execution, enabling proper transaction rollback and revert functionality. It records all state modifications during execution and supports efficient snapshot-based rollback for nested calls and transaction failures.

## Architecture & Design

### Core Design Principles

1. **Snapshot-Based Rollback**: Create snapshots at any point, revert all changes back to that snapshot
2. **Comprehensive Tracking**: Records all state changes (storage, balance, nonce, code, account lifecycle)
3. **Configurable Types**: Parameterized by snapshot ID, word size, and nonce types for optimization
4. **Efficient Search**: Backwards traversal to find original values during execution
5. **Memory Efficiency**: Configurable initial capacity and optional data-oriented layout

### Journal Architecture

```
Snapshot Timeline:
┌─────────┬─────────┬─────────┬─────────┬─────────┐
│ Snap 0  │ Snap 1  │ Snap 2  │ Snap 3  │ Current │
└─────────┴─────────┴─────────┴─────────┴─────────┘

Journal Entries (chronological):
[Entry₀] [Entry₁] [Entry₂] [Entry₃] [Entry₄] [Entry₅]
   ↑        ↑        ↑        ↑        ↑
  Snap 0   Snap 1   Snap 1   Snap 2   Snap 3
```

**Revert Operation**: Remove all entries with `snapshot_id >= target_id`

## API Reference

### Configuration

```zig
pub const JournalConfig = struct {
    SnapshotIdType: type = u32,           // Snapshot ID type (u8, u16, u32, u64)
    WordType: type = u256,               // EVM word type for values
    NonceType: type = u64,               // Account nonce type
    initial_capacity: usize = 128,       // Initial entry capacity
    use_soa: bool = false,               // Data-oriented design (future)
    
    pub fn validate(comptime self: JournalConfig) void;  // Compile-time validation
    pub fn get_optimal_snapshot_type(max_snapshots: usize) type; // Auto-select type
};
```

**Pre-defined Configurations**:

```zig
pub const default_config = JournalConfig{};         // Standard EVM settings

pub const minimal_config = JournalConfig{           // Testing/minimal use
    .SnapshotIdType = u8,
    .WordType = u64,
    .NonceType = u32,
    .initial_capacity = 16,
};

pub const performance_config = JournalConfig{       // High-performance settings
    .SnapshotIdType = u16,
    .WordType = u256,
    .NonceType = u64,
    .initial_capacity = 256,
    .use_soa = true,
};
```

### Factory Function

```zig
pub fn Journal(comptime config: JournalConfig) type {
    // Returns specialized journal type with configuration
}
```

### Journal Instance Management

```zig
// Initialize journal with allocator
pub fn init(allocator: std.mem.Allocator) Self

// Clean up journal resources
pub fn deinit(self: *Self) void

// Clear all entries and reset snapshot counter
pub fn clear(self: *Self) void

// Get number of entries
pub fn entry_count(self: *const Self) usize
```

### Snapshot Management

```zig
// Create new snapshot and return ID
pub fn create_snapshot(self: *Self) SnapshotIdType

// Revert all changes back to specific snapshot
pub fn revert_to_snapshot(self: *Self, snapshot_id: SnapshotIdType) void
```

**Usage Pattern**:
```zig
const snapshot = journal.create_snapshot();
// ... perform operations that may fail ...
if (should_revert) {
    journal.revert_to_snapshot(snapshot);  // Undo all changes
}
```

### State Change Recording

#### Storage Changes

```zig
// Record storage slot modification
pub fn record_storage_change(
    self: *Self, 
    snapshot_id: SnapshotIdType, 
    address: Address, 
    key: WordType, 
    original_value: WordType
) !void
```

#### Account Balance Changes

```zig
// Record balance modification
pub fn record_balance_change(
    self: *Self, 
    snapshot_id: SnapshotIdType, 
    address: Address, 
    original_balance: WordType
) !void
```

#### Account Nonce Changes

```zig
// Record nonce modification
pub fn record_nonce_change(
    self: *Self, 
    snapshot_id: SnapshotIdType, 
    address: Address, 
    original_nonce: NonceType
) !void
```

#### Code Changes

```zig
// Record contract code modification
pub fn record_code_change(
    self: *Self, 
    snapshot_id: SnapshotIdType, 
    address: Address, 
    original_code_hash: [32]u8
) !void
```

#### Account Lifecycle

```zig
// Record account creation
pub fn record_account_created(
    self: *Self, 
    snapshot_id: SnapshotIdType, 
    address: Address
) !void

// Record account destruction (SELFDESTRUCT)
pub fn record_account_destroyed(
    self: *Self, 
    snapshot_id: SnapshotIdType, 
    address: Address, 
    beneficiary: Address, 
    balance: WordType
) !void
```

### Query Operations

```zig
// Find original storage value (searches backwards through journal)
pub fn get_original_storage(
    self: *const Self, 
    address: Address, 
    slot: WordType
) ?WordType

// Find original balance value
pub fn get_original_balance(
    self: *const Self, 
    address: Address
) ?WordType

// Get all entries for specific snapshot
pub fn get_snapshot_entries(
    self: *const Self, 
    snapshot_id: SnapshotIdType, 
    allocator: std.mem.Allocator
) ![]Entry
```

## Journal Entry Types

### Entry Structure

```zig
pub const JournalEntry = struct {
    snapshot_id: SnapshotIdType,    // When this change occurred
    data: Data,                     // The actual change data
    
    pub const Data = union(enum) {
        storage_change: StorageChange,
        balance_change: BalanceChange,
        nonce_change: NonceChange,
        code_change: CodeChange,
        account_created: AccountCreated,
        account_destroyed: AccountDestroyed,
    };
};
```

### Change Type Details

#### StorageChange

```zig
pub const StorageChange = struct {
    address: Address,           // Contract address
    key: WordType,             // Storage slot key
    original_value: WordType,   // Value before change
};
```

**Usage**: Records SSTORE operations for proper gas refund calculation and rollback.

#### BalanceChange

```zig
pub const BalanceChange = struct {
    address: Address,           // Account address
    original_balance: WordType, // Balance before change
};
```

**Usage**: Records balance modifications from transfers, contract calls, mining rewards.

#### NonceChange

```zig
pub const NonceChange = struct {
    address: Address,         // Account address
    original_nonce: NonceType, // Nonce before increment
};
```

**Usage**: Records nonce increments for transaction replay protection.

#### CodeChange

```zig
pub const CodeChange = struct {
    address: Address,           // Contract address
    original_code_hash: [32]u8, // Code hash before change
};
```

**Usage**: Records contract code deployment or modification.

#### AccountCreated

```zig
pub const AccountCreated = struct {
    address: Address,  // Address of created account
};
```

**Usage**: Records new account creation for proper cleanup on revert.

#### AccountDestroyed

```zig
pub const AccountDestroyed = struct {
    address: Address,      // Address of destroyed contract
    beneficiary: Address,  // Recipient of remaining balance
    balance: WordType,     // Transferred balance
};
```

**Usage**: Records SELFDESTRUCT operations for EIP-6780 compliance.

## Performance Characteristics

### Snapshot Operations

- **Create Snapshot**: O(1) - simple counter increment
- **Revert to Snapshot**: O(n) where n = entries since snapshot
- **Memory**: Linear with number of state changes

### Search Operations

- **Find Original Value**: O(n) backward search through entries
- **Optimization**: Most recent changes found first (typical case)
- **Worst Case**: Search entire journal for oldest changes

### Memory Management

```zig
// Journal growth pattern
Initial: 128 entries capacity
Growth: ArrayList automatic doubling
Revert: Shrinks but retains capacity for reuse
```

**Benefits**:
- Pre-allocated capacity reduces allocations during execution
- Revert operations preserve capacity for subsequent operations
- ArrayList growth amortizes allocation costs

## Testing

### Test Coverage

The journal system includes comprehensive tests for:

1. **Basic Operations**: Snapshot creation, entry recording, counter management
2. **Revert Functionality**: Snapshot rollback, entry removal, state restoration
3. **Search Operations**: Original value lookup, backward traversal
4. **Entry Types**: All change types record correctly with proper data
5. **Configuration**: Different type configurations work correctly
6. **Edge Cases**: Empty journal, multiple reverts, invalid snapshots

### Test Execution

```bash
# Run all journal tests
zig build test

# Run journal-specific tests
zig build test -- --test-filter "Journal"
```

### Critical Test Scenarios

1. **Nested Snapshots**: Multiple snapshots with proper revert ordering
2. **Type Safety**: Different configurations maintain type safety
3. **Memory Management**: Proper allocation and deallocation
4. **Search Accuracy**: Original value lookup returns correct results
5. **Entry Integrity**: All entry types serialize/deserialize correctly

## Context within EVM

### Integration with EVM Execution

The Journal is embedded within the EVM for transaction-level state tracking:

```zig
pub const Evm = struct {
    journal: JournalType,   // Configured journal instance
    // ... other EVM components
    
    pub fn execute_transaction(self: *Self, tx: Transaction) !Result {
        const tx_snapshot = self.journal.create_snapshot();
        defer if (should_revert) self.journal.revert_to_snapshot(tx_snapshot);
        
        // Execute transaction...
        const result = self.execute_call(call_params);
        
        if (result.is_error()) {
            self.journal.revert_to_snapshot(tx_snapshot);
        }
        
        return result;
    }
};
```

### Integration with Host Interface

The Host uses the Journal for state change tracking:

```zig
// Host implementation
pub fn set_storage(self: *Self, address: Address, slot: u256, value: u256) !void {
    // Record original value before change
    if (self.journal.get_original_storage(address, slot) == null) {
        const original = self.database.get_storage(address, slot);
        try self.journal.record_storage_change(
            self.current_snapshot_id, 
            address, 
            slot, 
            original
        );
    }
    
    // Apply the change
    try self.database.set_storage(address, slot, value);
}
```

### Nested Call Support

Journals enable proper nested call rollback:

```zig
// Frame execution with nested calls
pub fn execute_call(self: *Self, params: CallParams) !CallResult {
    const call_snapshot = self.journal.create_snapshot();
    
    // Execute call...
    const result = self.execute_bytecode(params.bytecode);
    
    if (result.should_revert()) {
        // Revert all changes made during this call
        self.journal.revert_to_snapshot(call_snapshot);
        return CallResult.revert(result.return_data);
    }
    
    return CallResult.success(result.return_data);
}
```

## EVM Specification Compliance

### Transaction Rollback

1. **Failed Transactions**: All state changes reverted except gas consumption
2. **REVERT Opcode**: Rollback to transaction start, preserve return data
3. **Out of Gas**: Rollback all changes, consume all provided gas
4. **Exception Handling**: Any runtime error triggers complete rollback

### Nested Call Semantics

1. **Call Failure**: Only the failing call reverted, parent continues
2. **Static Calls**: No state changes allowed, journal validates this
3. **Delegate Calls**: Changes applied to caller's storage, proper tracking
4. **Create Failures**: New contract creation reverted completely

### Gas Refund Tracking

The Journal enables accurate gas refund calculation:

1. **Storage Clearing**: SSTORE from non-zero to zero gives refund
2. **Original Values**: Journal tracks original values for refund calculation
3. **SELFDESTRUCT**: Account destruction provides gas refund
4. **Refund Limits**: Maximum refund based on gas consumed

## Data-Oriented Design Considerations

### Current Structure (Array of Structures)

```zig
// Current: Array of complete entries
entries: []JournalEntry
```

**Benefits**: Simple implementation, good cache locality for full entry access

### Future Structure (Structure of Arrays)

```zig  
// Future: Separate arrays for different data types (when use_soa = true)
snapshot_ids: []SnapshotIdType,
entry_types: []EntryType,
addresses: []Address,
storage_keys: []WordType,
// ... parallel arrays
```

**Benefits**: Better cache utilization for specific queries, reduced memory usage

The Journal provides essential transaction rollback functionality while maintaining high performance and EVM specification compliance through configurable, type-safe state change tracking.