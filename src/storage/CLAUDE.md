# CLAUDE.md - Storage Module AI Context

## MISSION CRITICAL: State Consistency and Fund Safety

The storage module manages Ethereum world state including account balances, contract storage, and code. **ANY bug in state management can result in consensus failures, double-spending, or permanent loss of funds.** State consistency is paramount.

## Critical Implementation Details

### EVM Storage Specifications (IMMUTABLE REQUIREMENTS)

**Account State**: Balance, nonce, storage root, code hash
**Storage Layout**: 256-bit key-value pairs per contract
**Access Patterns**: Cold/warm storage gas pricing (EIP-2929)
**State Root**: Merkle Patricia Trie commitment
**Checkpointing**: Reversible state changes for failed transactions

### Core Files and Critical Responsibilities

**File: `database.zig`** - World state database interface
**File: `journal.zig`** - Transaction-level state change tracking
**File: `access_list.zig`** - EIP-2929 cold/warm storage tracking
**File: `memory_database.zig`** - In-memory state for testing
**File: `self_destruct.zig`** - Contract destruction handling
**File: `created_contracts.zig`** - New contract tracking

## State Change Journal System

### Transaction Boundaries (CONSENSUS CRITICAL)
```zig
// Journal entry for reversible state changes
pub const JournalEntry = union(enum) {
    AccountTouched: Address,
    AccountLoaded: struct { address: Address, info: AccountInfo },
    StorageChanged: struct { address: Address, key: u256, value: u256 },
    BalanceTransfer: struct { from: Address, to: Address, amount: u256 },
    SelfDestruct: Address,
    ContractCreated: struct { address: Address, code: []u8 },
};
```

### Checkpoint Management
```zig
// CRITICAL: All state changes must be journaled
pub fn create_checkpoint(self: *Self) u32 {
    const checkpoint_id = self.journal.entries.items.len;
    return @intCast(checkpoint_id);
}

// Rollback to checkpoint on transaction failure
pub fn rollback_to_checkpoint(self: *Self, checkpoint: u32) !void {
    while (self.journal.entries.items.len > checkpoint) {
        const entry = self.journal.entries.pop();
        try self.revert_journal_entry(entry);
    }
}
```

## Access List Management (EIP-2929)

### Cold/Warm Storage Pricing
```zig
// Gas costs based on access patterns
pub const COLD_ACCOUNT_ACCESS = 2600;
pub const WARM_ACCOUNT_ACCESS = 100;
pub const COLD_SLOAD = 2100;
pub const WARM_SLOAD = 100;

// Track accessed addresses and storage slots
pub fn access_account(self: *Self, address: Address) u64 {
    if (self.access_list.contains_address(address)) {
        return WARM_ACCOUNT_ACCESS;
    } else {
        self.access_list.add_address(address);
        return COLD_ACCOUNT_ACCESS;
    }
}
```

## Storage Operations Safety

### SLOAD Implementation
```zig
pub fn sload(self: *Self, address: Address, key: u256) !struct { value: u256, gas: u64 } {
    // Gas calculation based on cold/warm access
    const gas_cost = if (self.access_list.contains_storage(address, key))
        WARM_SLOAD else COLD_SLOAD;

    // Add to access list for future warm access
    if (!self.access_list.contains_storage(address, key)) {
        self.access_list.add_storage(address, key);
    }

    // Load from storage with journaling
    const value = try self.database.get_storage(address, key);
    try self.journal.record_storage_access(address, key, value);

    return .{ .value = value, .gas = gas_cost };
}
```

### SSTORE Implementation
```zig
pub fn sstore(self: *Self, address: Address, key: u256, value: u256) !u64 {
    const original = try self.database.get_original_storage(address, key);
    const current = try self.database.get_storage(address, key);

    // EIP-2200 gas cost calculation
    const gas_cost = calculate_sstore_gas(original, current, value);

    // Journal the change for potential rollback
    try self.journal.record_storage_change(address, key, current, value);

    // Apply the change
    try self.database.set_storage(address, key, value);

    return gas_cost;
}
```

## Account Management

### Balance Operations (FUND SAFETY CRITICAL)
```zig
pub fn transfer_balance(self: *Self, from: Address, to: Address, amount: u256) !void {
    const from_info = try self.get_account_info(from);
    if (from_info.balance < amount) {
        return error.InsufficientBalance;
    }

    // Journal for potential rollback
    try self.journal.record_balance_transfer(from, to, amount);

    // Atomic balance update
    from_info.balance -= amount;
    const to_info = try self.get_account_info(to);
    to_info.balance += amount;

    try self.set_account_info(from, from_info);
    try self.set_account_info(to, to_info);
}
```

### Contract Creation
```zig
pub fn create_contract(self: *Self, address: Address, code: []const u8, balance: u256) !void {
    // Check address is not already used
    const existing = try self.get_account_info(address);
    if (existing.nonce != 0 or existing.code_hash != EMPTY_CODE_HASH) {
        return error.AddressCollision;
    }

    // Journal contract creation
    try self.journal.record_contract_creation(address, code);

    // Set account info
    const account_info = AccountInfo{
        .balance = balance,
        .nonce = 1, // Contracts start with nonce 1
        .code_hash = crypto.keccak256(code),
    };

    try self.set_account_info(address, account_info);
    try self.database.set_code(address, code);
}
```

## Self-Destruct Handling

### Contract Destruction (EIP-6780)
```zig
pub fn self_destruct(self: *Self, address: Address, beneficiary: Address) !void {
    // Only contracts created in same transaction can be destructed
    if (!self.created_contracts.contains(address)) {
        // Just send balance, don't destroy
        const info = try self.get_account_info(address);
        try self.transfer_balance(address, beneficiary, info.balance);
        return;
    }

    // Journal self-destruct for rollback
    try self.journal.record_self_destruct(address);

    // Transfer balance and mark for destruction
    const info = try self.get_account_info(address);
    try self.transfer_balance(address, beneficiary, info.balance);
    try self.self_destruct_list.add(address);
}
```

## Database Interface Abstraction

### Storage Backend Interface
```zig
pub const DatabaseInterface = struct {
    // Account operations
    get_account_info: *const fn (Address) !AccountInfo,
    set_account_info: *const fn (Address, AccountInfo) !void,

    // Storage operations
    get_storage: *const fn (Address, u256) !u256,
    set_storage: *const fn (Address, u256, u256) !void,

    // Code operations
    get_code: *const fn (Address) ![]const u8,
    set_code: *const fn (Address, []const u8) !void,
};
```

## Critical Error Handling

### State Corruption Prevention
```zig
// NEVER allow inconsistent state
pub fn validate_state_consistency(self: *Self) !void {
    for (self.journal.entries.items) |entry| {
        switch (entry) {
            .BalanceTransfer => |transfer| {
                // Verify balance constraints
                const from_info = try self.get_account_info(transfer.from);
                const to_info = try self.get_account_info(transfer.to);
                // Additional validation logic...
            },
            // Other entry types...
        }
    }
}
```

### Rollback Safety
```zig
// MUST be able to rollback any state change
pub fn revert_journal_entry(self: *Self, entry: JournalEntry) !void {
    switch (entry) {
        .StorageChanged => |change| {
            try self.database.set_storage(change.address, change.key, change.old_value);
        },
        .BalanceTransfer => |transfer| {
            // Reverse the transfer
            try self.transfer_balance(transfer.to, transfer.from, transfer.amount);
        },
        // Handle all other entry types...
    }
}
```

## Performance Optimization

### Access Pattern Optimization
- Cache frequently accessed accounts
- Batch storage operations where possible
- Minimize database round trips
- Use access list to avoid redundant cold access costs

### Memory Management
- Pool allocation for temporary storage
- Reuse journal entry objects
- Efficient data structures for access tracking

## Testing Requirements

### Unit Tests MUST Cover
- Balance transfer edge cases (zero, maximum values)
- Storage operation gas costs (cold/warm access)
- Journal rollback for all entry types
- Contract creation address collision handling
- Self-destruct behavior (EIP-6780 compliance)

### Integration Tests
- Multi-transaction state consistency
- Large-scale storage operations
- Database backend compatibility
- Access list performance impact

## Emergency Procedures

### State Corruption Detection
1. **Immediate Halt**: Stop all state modifications
2. **Consistency Check**: Validate all account balances and storage
3. **Journal Analysis**: Review recent state changes
4. **Rollback Strategy**: Determine safe rollback point

### Consensus Failure
1. **Reference Comparison**: Compare state with other implementations
2. **Transaction Replay**: Re-execute transactions with logging
3. **State Dump**: Export complete world state for analysis
4. **Fix Implementation**: Address root cause with minimal changes

Remember: **State consistency is non-negotiable.** Any bug in storage operations can permanently corrupt the blockchain state or enable theft. Always prioritize correctness and implement comprehensive rollback mechanisms.