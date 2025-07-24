# Blockchain State Management

Comprehensive state management system providing persistent storage, transactional semantics, and efficient state tracking for EVM execution.

## Purpose

The state module provides:
- Abstract database interface for pluggable storage backends
- In-memory database implementation for testing
- Journal system for transactional state changes
- Event logging infrastructure
- State snapshots and reverts for nested calls

## Architecture

The state system uses a layered architecture:
1. **Database Interface**: Abstract storage operations
2. **State Layer**: EVM-specific state management
3. **Journal System**: Change tracking and reverts
4. **Storage Backends**: Pluggable implementations

This design enables different storage backends while maintaining consistent EVM semantics.

## Files

### `state.zig`
Main state management layer interfacing between EVM and database.

**Structure**:
```zig
EvmState = struct {
    // Database interface for persistent state
    db: DatabaseInterface,
    
    // Transaction-scoped state
    transient_storage: HashMap(TransientStorageKey, u256),
    logs: ArrayList(EvmLog),
    selfdestruct_list: ArrayList(Address),
}
```

**Key Responsibilities**:
- **Persistent State**: Delegates to database interface
  - Account balances, nonces, code
  - Contract storage slots
  - State root calculations
  
- **Transient State**: Manages locally
  - Transient storage (cleared after transaction)
  - Event logs (emitted during execution)
  - Selfdestruct set (cleanup list)

**Main Methods**:
- `init()`: Create state with database backend
- `get_account()`: Retrieve account info
- `set_balance()`, `set_nonce()`: Update account
- `get_storage()`, `set_storage()`: Storage access
- `get_transient_storage()`: EIP-1153 storage
- `emit_log()`: Add event log
- `clear_transaction_state()`: Reset transient data

**Design Pattern**: Clear separation between persistent and transient state

**Used By**: EVM main execution loop

### `database_interface.zig`
Abstract interface for blockchain state storage.

**Account Structure**:
```zig
Account = struct {
    balance: u256,
    nonce: u64,
    code_hash: [32]u8,
    storage_root: [32]u8,
}
```

**Interface Methods**:
```zig
DatabaseInterface = struct {
    // Vtable for runtime polymorphism
    vtable: *const VTable,
    ptr: *anyopaque,
    
    // Account operations
    get_account(address: [20]u8) !?Account,
    set_account(address: [20]u8, account: Account) !void,
    delete_account(address: [20]u8) !void,
    account_exists(address: [20]u8) !bool,
    
    // Storage operations
    get_storage(address: [20]u8, key: u256) !u256,
    set_storage(address: [20]u8, key: u256, value: u256) !void,
    
    // Code operations
    get_code(hash: [32]u8) !?[]const u8,
    set_code(hash: [32]u8, code: []const u8) !void,
    
    // State management
    state_root() ![32]u8,
    
    // Snapshot operations
    snapshot() !SnapshotId,
    revert_to_snapshot(id: SnapshotId) !void,
    commit_snapshot(id: SnapshotId) !void,
    
    // Batch operations
    apply_batch(operations: []const Operation) !void,
}
```

**Vtable Pattern**: Enables runtime polymorphism without traditional OOP

**Error Types**:
- `AccountNotFound`
- `StorageError`
- `SnapshotError`
- `CodeNotFound`

**Used By**: State layer, different database backends

### `memory_database.zig`
In-memory implementation of database interface.

**Data Structures**:
```zig
MemoryDatabase = struct {
    allocator: Allocator,
    accounts: HashMap([20]u8, Account),
    storage: HashMap(StorageKey, u256),
    code: HashMap([32]u8, []u8),
    snapshots: ArrayList(Snapshot),
}
```

**Features**:
- Hash map-based storage for O(1) lookups
- Full snapshot support with deep copying
- Batch operation optimization
- Memory-efficient storage

**Snapshot Implementation**:
- Creates deep copy of all state
- Supports nested snapshots
- O(n) snapshot creation (n = state size)
- O(1) revert by swapping pointers

**Performance Characteristics**:
- Account lookup: O(1) average
- Storage access: O(1) average
- Snapshot: O(n) where n = state size
- Revert: O(1) pointer swap

**Used By**: Tests, development environments

### `journal.zig`
Comprehensive change tracking for state modifications.

**Journal Entry Types**:
```zig
JournalEntry = union(enum) {
    storage_changed: StorageChange,
    balance_changed: BalanceChange,
    transient_storage_changed: TransientStorageChange,
    nonce_changed: NonceChange,
    account_loaded: AccountLoaded,
    code_changed: CodeChange,
    account_destroyed: AccountDestroyed,
    account_touched: AccountTouched,
    account_created: AccountCreated,
    log_created: LogCreated,
}
```

**Key Components**:
- **Journal**: Append-only log of state changes
- **Checkpoint**: Marks position for snapshot/revert
- **Revert Logic**: Processes entries in reverse order

**Usage Pattern**:
```zig
// 1. Create checkpoint
const checkpoint = journal.checkpoint();

// 2. Record changes before applying
try journal.record(.{ .balance_changed = .{
    .address = address,
    .old_balance = old,
    .new_balance = new,
}});

// 3. Apply actual change
account.balance = new;

// 4. Revert if needed
journal.revert(checkpoint);
```

**Performance**:
- Checkpoint creation: O(1)
- Change recording: O(1) append
- Revert: O(n) where n = changes since checkpoint

**Used By**: EVM for transaction reverts

### `evm_log.zig`
Event log structure for Ethereum events.

**Structure**:
```zig
EvmLog = struct {
    address: [20]u8,      // Contract that emitted
    topics: []const u256, // Indexed data (0-4 items)
    data: []const u8,     // Non-indexed data
}
```

**Features**:
- Supports 0-4 topics (LOG0-LOG4)
- Arbitrary length data field
- Memory managed with proper cleanup

**Cloning**: Logs are cloned when stored to ensure persistence

**Used By**: LOG opcodes, state management

### `database_factory.zig`
Factory pattern for creating database instances.

**Purpose**: Simplifies database creation and configuration

**Supported Types**:
- In-memory database
- Future: RocksDB, LMDB, etc.

**Used By**: VM initialization, tests

## State Change Flow

### Normal Execution
1. Read current state from database
2. Record change in journal
3. Apply change to state
4. Continue execution

### Revert Scenario
1. Exception or REVERT opcode
2. Process journal in reverse
3. Restore original values
4. Discard changes since checkpoint

### Transaction Completion
1. Clear transient storage
2. Process selfdestruct list
3. Commit or discard logs
4. Update database

## Memory Management

### Ownership Rules
- Database owns persistent state
- State layer owns transient data
- Journal entries reference (not own) data
- Logs are cloned for persistence

### Cleanup Patterns
```zig
// State cleanup
defer state.deinit();

// Clear transaction data
state.clear_transaction_state();

// Database cleanup
defer db.deinit();
```

## Testing Strategy

The module includes:
- Unit tests for each component
- Integration tests for state transitions
- Snapshot/revert scenario tests
- Memory leak detection tests
- Concurrent access tests (future)

## Performance Optimizations

1. **Hash Maps**: O(1) average case lookups
2. **Batch Operations**: Reduce database round trips
3. **Lazy Loading**: Load only accessed state
4. **Journal Efficiency**: Minimal memory overhead
5. **Snapshot Strategy**: Copy-on-write semantics

## Security Considerations

- State isolation between transactions
- Atomic updates or full revert
- No partial state corruption
- Proper cleanup of sensitive data
- Deterministic state transitions

## Future Enhancements

- Merkle Patricia Trie integration
- Persistent database backends
- State pruning strategies
- Parallel state access
- State rent mechanisms