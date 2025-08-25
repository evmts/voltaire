# EVM Journaling Fixes Summary

## Current State

The EVM has a comprehensive journaling system (`journal.zig`) that can track and revert state changes. However, not all state-modifying operations are properly integrated with this system.

## Key Issues Identified

### 1. SSTORE Operation ✅ ALREADY FIXED
- **Current**: Frame's `sstore()` method already uses `host.set_storage()` when a host is available
- **Status**: Working correctly - no changes needed

### 2. Balance Transfers ❌ MISSING
- **Issue**: Direct balance modifications during CALL operations don't go through journaling
- **Required Fix**: Implement `transfer_value()` method in EVM that:
  ```zig
  pub fn transfer_value(self: *Self, from: Address, to: Address, value: u256) !void {
      // Record original balances
      const from_account = (try self.database.get_account(from)) orelse return error.AccountNotFound;
      const to_account = (try self.database.get_account(to)) orelse .{};
      
      try self.journal.record_balance_change(self.current_snapshot_id, from, from_account.balance);
      try self.journal.record_balance_change(self.current_snapshot_id, to, to_account.balance);
      
      // Update balances
      // ... transfer logic ...
  }
  ```

### 3. Nonce Changes ❌ MISSING
- **Issue**: CREATE/CREATE2 operations increment nonce without journaling
- **Required Fix**: Journal nonce changes before incrementing:
  ```zig
  // In CREATE operation
  const original_nonce = creator_account.nonce;
  try self.journal.record_nonce_change(self.current_snapshot_id, creator_address, original_nonce);
  creator_account.nonce += 1;
  ```

### 4. Code/Account Creation ❌ MISSING
- **Issue**: New accounts created by CREATE/CREATE2 aren't journaled
- **Required Fix**: 
  - Journal `account_created` when creating new accounts
  - Journal `code_change` when setting contract code

### 5. SELFDESTRUCT ❌ MISSING
- **Issue**: Account destruction and balance transfer aren't journaled
- **Required Fix**: 
  - Journal `account_destroyed` with beneficiary and balance
  - Journal balance changes for beneficiary

## Implementation Pattern

All state changes should follow this pattern:

1. **Read original state**
2. **Record in journal** with current snapshot ID
3. **Modify database**

Example:
```zig
// Wrong - direct database access
try database.set_storage(address, key, value);

// Correct - through journaling method
const original = try database.get_storage(address, key);
try journal.record_storage_change(snapshot_id, address, key, original);
try database.set_storage(address, key, value);
```

## Host Interface Integration

The Host interface (`host.zig`) already has the necessary methods:
- `set_storage` - ✅ Properly journals storage changes
- `record_storage_change` - ✅ Available for manual journaling
- `create_snapshot` / `revert_to_snapshot` - ✅ Snapshot management

What's missing is using these methods consistently for ALL state changes.

## Testing Strategy

1. Create comprehensive integration tests that:
   - Perform state changes (storage, balance, nonce, code)
   - Create snapshots
   - Make additional changes
   - Revert to snapshot
   - Verify all state is properly restored

2. Test nested calls with multiple revert levels

3. Test all opcodes that modify state:
   - SSTORE ✅
   - CALL with value transfer ❌
   - CREATE/CREATE2 ❌
   - SELFDESTRUCT ❌

## Next Steps

1. Implement `transfer_value()` method in EVM
2. Update CREATE/CREATE2 handlers to journal nonce and code changes
3. Update SELFDESTRUCT handler to journal destruction
4. Add comprehensive integration tests
5. Verify all state changes go through journaling

## Build Issues

Note: There are some build errors in `frame_interpreter.zig` related to stack peek operations that need to be fixed separately. The journaling architecture itself is sound.