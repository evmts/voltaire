# Phase 3: State Loading Infrastructure for Block Verification

## Context
You are implementing Phase 3 of the block verification test system. This phase creates the infrastructure to load the exact blockchain state at block 23000000, enabling accurate transaction execution that matches the network's historical state.

## Current State Management Analysis

### Existing State Components
Based on codebase analysis, the current state system includes:

**Database Interface (`src/evm/state/database_interface.zig`)**:
- `DatabaseInterface` with vtable pattern for pluggable backends
- `Account` struct with balance, nonce, code_hash, storage_root
- Operations: get_account, set_account, get_storage, set_storage, get_code, set_code
- Snapshot support for rollback functionality

**Memory Database (`src/evm/state/memory_database.zig`)**:
- Fast in-memory implementation using HashMaps
- Complete interface implementation with O(1) operations
- Snapshot/revert functionality for transaction rollback
- Proper memory management with cleanup

**EVM State (`src/evm/state/state.zig`)**:
- `EvmState` managing accounts, storage, transient storage, logs
- Database interface integration for persistent state
- Local management of transaction-scoped data (logs, selfdestructs)

### Current Limitations
The existing system lacks remote state loading capabilities:
1. No network-based state fetching from RPC endpoints
2. No lazy loading of accounts/storage on-demand
3. No caching layer for frequently accessed state
4. No historical state access at specific block numbers

## Implementation Requirements

### Task Overview
Create a network-backed database implementation that fetches state on-demand from an Ethereum RPC endpoint, with intelligent caching and lazy loading to minimize network requests while ensuring accuracy.

### Core Architecture

<details>
<summary><strong>1. Network Database Implementation</strong></summary>

**File: `src/evm/state/network_database.zig`**
```zig
const std = @import("std");
const primitives = @import("primitives");
const Address = primitives.Address.Address;
const Hash = primitives.Hash;
const StorageKey = primitives.StorageKey;
const DatabaseInterface = @import("database_interface.zig").DatabaseInterface;
const DatabaseError = @import("database_interface.zig").DatabaseError;
const Account = @import("database_interface.zig").Account;
const Provider = @import("provider").Provider;

/// Network-backed database that fetches state from Ethereum RPC
pub const NetworkDatabase = struct {
    allocator: std.mem.Allocator,
    provider: *Provider,
    block_number: u64,
    
    // Caching layers
    account_cache: std.HashMap(Address, ?Account, AddressContext, 80),
    storage_cache: std.HashMap(StorageKey, u256, StorageKeyContext, 80),
    code_cache: std.HashMap(Hash, []u8, HashContext, 80),
    
    // Track what we've fetched to avoid redundant requests
    fetched_accounts: std.HashMap(Address, void, AddressContext, 80),
    fetched_storage: std.HashMap(StorageKey, void, StorageKeyContext, 80),
    
    pub fn init(allocator: std.mem.Allocator, provider: *Provider, block_number: u64) NetworkDatabase {
        return NetworkDatabase{
            .allocator = allocator,
            .provider = provider,
            .block_number = block_number,
            .account_cache = std.HashMap(Address, ?Account, AddressContext, 80).init(allocator),
            .storage_cache = std.HashMap(StorageKey, u256, StorageKeyContext, 80).init(allocator),
            .code_cache = std.HashMap(Hash, []u8, HashContext, 80).init(allocator),
            .fetched_accounts = std.HashMap(Address, void, AddressContext, 80).init(allocator),
            .fetched_storage = std.HashMap(StorageKey, void, StorageKeyContext, 80).init(allocator),
        };
    }
    
    pub fn deinit(self: *NetworkDatabase) void {
        // Free cached code
        var code_iter = self.code_cache.iterator();
        while (code_iter.next()) |entry| {
            self.allocator.free(entry.value_ptr.*);
        }
        
        self.account_cache.deinit();
        self.storage_cache.deinit();
        self.code_cache.deinit();
        self.fetched_accounts.deinit();
        self.fetched_storage.deinit();
    }
    
    pub fn to_database_interface(self: *NetworkDatabase) DatabaseInterface {
        return DatabaseInterface{
            .ptr = self,
            .vtable = &.{
                .get_account = getAccount,
                .set_account = setAccount,
                .get_storage = getStorage,
                .set_storage = setStorage,
                .get_code = getCode,
                .set_code = setCode,
                .create_snapshot = createSnapshot,
                .revert_to_snapshot = revertToSnapshot,
                .commit_snapshot = commitSnapshot,
            },
        };
    }
    
    // Implementation of database interface methods
    fn getAccount(ptr: *anyopaque, address: Address) DatabaseError!Account {
        const self: *NetworkDatabase = @ptrCast(@alignCast(ptr));
        
        // Check cache first
        if (self.account_cache.get(address)) |cached_account| {
            return cached_account orelse return DatabaseError.AccountNotFound;
        }
        
        // Fetch from network if not cached
        const account = self.fetchAccountFromNetwork(address) catch |err| switch (err) {
            error.AccountNotFound => {
                // Cache the fact that account doesn't exist
                try self.account_cache.put(address, null);
                try self.fetched_accounts.put(address, {});
                return DatabaseError.AccountNotFound;
            },
            else => return DatabaseError.NetworkError,
        };
        
        // Cache the result
        try self.account_cache.put(address, account);
        try self.fetched_accounts.put(address, {});
        
        return account;
    }
    
    fn setAccount(ptr: *anyopaque, address: Address, account: Account) DatabaseError!void {
        const self: *NetworkDatabase = @ptrCast(@alignCast(ptr));
        
        // Update cache - this is a local modification
        try self.account_cache.put(address, account);
    }
    
    fn getStorage(ptr: *anyopaque, address: Address, slot: Hash) DatabaseError!u256 {
        const self: *NetworkDatabase = @ptrCast(@alignCast(ptr));
        
        const storage_key = StorageKey{ .address = address, .slot = slot };
        
        // Check cache first
        if (self.storage_cache.get(storage_key)) |cached_value| {
            return cached_value;
        }
        
        // Fetch from network
        const value = self.fetchStorageFromNetwork(address, slot) catch |err| switch (err) {
            error.StorageNotFound => 0, // Empty storage slots return 0
            else => return DatabaseError.NetworkError,
        };
        
        // Cache the result
        try self.storage_cache.put(storage_key, value);
        try self.fetched_storage.put(storage_key, {});
        
        return value;
    }
    
    fn setStorage(ptr: *anyopaque, address: Address, slot: Hash, value: u256) DatabaseError!void {
        const self: *NetworkDatabase = @ptrCast(@alignCast(ptr));
        
        const storage_key = StorageKey{ .address = address, .slot = slot };
        
        // Update cache - this is a local modification
        try self.storage_cache.put(storage_key, value);
    }
    
    fn getCode(ptr: *anyopaque, code_hash: Hash) DatabaseError![]const u8 {
        const self: *NetworkDatabase = @ptrCast(@alignCast(ptr));
        
        // Check cache first
        if (self.code_cache.get(code_hash)) |cached_code| {
            return cached_code;
        }
        
        // For network database, we need to fetch code by address, not hash
        // This requires maintaining a reverse mapping or fetching differently
        return DatabaseError.CodeNotFound;
    }
    
    fn setCode(ptr: *anyopaque, code_hash: Hash, code: []const u8) DatabaseError!void {
        const self: *NetworkDatabase = @ptrCast(@alignCast(ptr));
        
        // Cache the code
        const code_copy = try self.allocator.dupe(u8, code);
        try self.code_cache.put(code_hash, code_copy);
    }
    
    // Network fetching methods
    fn fetchAccountFromNetwork(self: *NetworkDatabase, address: Address) !Account {
        const block_tag = try std.fmt.allocPrint(self.allocator, "0x{x}", .{self.block_number});
        defer self.allocator.free(block_tag);
        
        // Fetch balance
        const balance = self.provider.getBalanceAtBlock(address, block_tag) catch |err| switch (err) {
            error.AccountNotFound => return error.AccountNotFound,
            else => return error.NetworkError,
        };
        
        // Fetch nonce
        const nonce = self.provider.getTransactionCountAtBlock(address, block_tag) catch |err| switch (err) {
            error.AccountNotFound => return error.AccountNotFound,
            else => return error.NetworkError,
        };
        
        // Fetch code
        const code = self.provider.getCodeAtBlock(address, block_tag) catch |err| switch (err) {
            error.AccountNotFound => &[_]u8{},
            else => return error.NetworkError,
        };
        
        // Calculate code hash
        var code_hash: [32]u8 = undefined;
        if (code.len == 0) {
            code_hash = [_]u8{0} ** 32;
        } else {
            const hash_result = std.crypto.hash.sha3.Keccak256.hash(code, &code_hash);
            _ = hash_result;
        }
        
        // Storage root is not available via RPC, use zero hash
        const storage_root = [_]u8{0} ** 32;
        
        return Account{
            .balance = balance,
            .nonce = nonce,
            .code_hash = code_hash,
            .storage_root = storage_root,
        };
    }
    
    fn fetchStorageFromNetwork(self: *NetworkDatabase, address: Address, slot: Hash) !u256 {
        const block_tag = try std.fmt.allocPrint(self.allocator, "0x{x}", .{self.block_number});
        defer self.allocator.free(block_tag);
        
        return self.provider.getStorageAtBlock(address, slot, block_tag) catch |err| switch (err) {
            error.StorageNotFound => 0,
            else => return error.NetworkError,
        };
    }
};
```
</details>

<details>
<summary><strong>2. Enhanced Provider Methods for Historical State</strong></summary>

**Extensions to `src/provider/provider.zig`**:
```zig
/// Get account balance at specific block
pub fn getBalanceAtBlock(self: *Provider, address: Address, block_tag: []const u8) !u256 {
    var params = std.json.Array.init(self.allocator);
    defer params.deinit();
    
    const addr_hex = try std.fmt.allocPrint(self.allocator, "0x{s}", .{std.fmt.fmtSliceHexLower(&address.bytes)});
    defer self.allocator.free(addr_hex);
    
    try params.append(std.json.Value{ .string = addr_hex });
    try params.append(std.json.Value{ .string = block_tag });
    
    const result = try self.request("eth_getBalance", std.json.Value{ .array = params });
    defer self.allocator.free(result);
    
    return try parseHexU256(result);
}

/// Get transaction count (nonce) at specific block
pub fn getTransactionCountAtBlock(self: *Provider, address: Address, block_tag: []const u8) !u64 {
    var params = std.json.Array.init(self.allocator);
    defer params.deinit();
    
    const addr_hex = try std.fmt.allocPrint(self.allocator, "0x{s}", .{std.fmt.fmtSliceHexLower(&address.bytes)});
    defer self.allocator.free(addr_hex);
    
    try params.append(std.json.Value{ .string = addr_hex });
    try params.append(std.json.Value{ .string = block_tag });
    
    const result = try self.request("eth_getTransactionCount", std.json.Value{ .array = params });
    defer self.allocator.free(result);
    
    return try parseHexU64(result);
}

/// Get contract code at specific block
pub fn getCodeAtBlock(self: *Provider, address: Address, block_tag: []const u8) ![]u8 {
    var params = std.json.Array.init(self.allocator);
    defer params.deinit();
    
    const addr_hex = try std.fmt.allocPrint(self.allocator, "0x{s}", .{std.fmt.fmtSliceHexLower(&address.bytes)});
    defer self.allocator.free(addr_hex);
    
    try params.append(std.json.Value{ .string = addr_hex });
    try params.append(std.json.Value{ .string = block_tag });
    
    const result = try self.request("eth_getCode", std.json.Value{ .array = params });
    defer self.allocator.free(result);
    
    return try parseHexBytes(self.allocator, result);
}

/// Get storage value at specific block
pub fn getStorageAtBlock(self: *Provider, address: Address, slot: Hash, block_tag: []const u8) !u256 {
    var params = std.json.Array.init(self.allocator);
    defer params.deinit();
    
    const addr_hex = try std.fmt.allocPrint(self.allocator, "0x{s}", .{std.fmt.fmtSliceHexLower(&address.bytes)});
    defer self.allocator.free(addr_hex);
    
    const slot_hex = try std.fmt.allocPrint(self.allocator, "0x{s}", .{std.fmt.fmtSliceHexLower(&slot.bytes)});
    defer self.allocator.free(slot_hex);
    
    try params.append(std.json.Value{ .string = addr_hex });
    try params.append(std.json.Value{ .string = slot_hex });
    try params.append(std.json.Value{ .string = block_tag });
    
    const result = try self.request("eth_getStorageAt", std.json.Value{ .array = params });
    defer self.allocator.free(result);
    
    return try parseHexU256(result);
}
```
</details>

<details>
<summary><strong>3. Hybrid Database for Performance</strong></summary>

**File: `src/evm/state/hybrid_database.zig`**
```zig
/// Hybrid database combining network fetching with local caching
pub const HybridDatabase = struct {
    allocator: std.mem.Allocator,
    network_db: NetworkDatabase,
    memory_db: MemoryDatabase,
    
    pub fn init(allocator: std.mem.Allocator, provider: *Provider, block_number: u64) HybridDatabase {
        return HybridDatabase{
            .allocator = allocator,
            .network_db = NetworkDatabase.init(allocator, provider, block_number),
            .memory_db = MemoryDatabase.init(allocator),
        };
    }
    
    pub fn deinit(self: *HybridDatabase) void {
        self.network_db.deinit();
        self.memory_db.deinit();
    }
    
    pub fn to_database_interface(self: *HybridDatabase) DatabaseInterface {
        return DatabaseInterface{
            .ptr = self,
            .vtable = &.{
                .get_account = getAccount,
                .set_account = setAccount,
                .get_storage = getStorage,
                .set_storage = setStorage,
                .get_code = getCode,
                .set_code = setCode,
                .create_snapshot = createSnapshot,
                .revert_to_snapshot = revertToSnapshot,
                .commit_snapshot = commitSnapshot,
            },
        };
    }
    
    fn getAccount(ptr: *anyopaque, address: Address) DatabaseError!Account {
        const self: *HybridDatabase = @ptrCast(@alignCast(ptr));
        
        // Try memory database first (for local modifications)
        if (self.memory_db.vtable.get_account(self.memory_db.ptr, address)) |account| {
            return account;
        } else |err| switch (err) {
            DatabaseError.AccountNotFound => {
                // Fall back to network database
                const account = try self.network_db.vtable.get_account(self.network_db.ptr, address);
                
                // Cache in memory database for future access
                try self.memory_db.vtable.set_account(self.memory_db.ptr, address, account);
                
                return account;
            },
            else => return err,
        }
    }
    
    fn setAccount(ptr: *anyopaque, address: Address, account: Account) DatabaseError!void {
        const self: *HybridDatabase = @ptrCast(@alignCast(ptr));
        
        // Always set in memory database (local modifications)
        return self.memory_db.vtable.set_account(self.memory_db.ptr, address, account);
    }
    
    // Similar pattern for storage and code operations...
};
```
</details>

<details>
<summary><strong>4. State Preloading Optimization</strong></summary>

**File: `src/evm/state/state_preloader.zig`**
```zig
/// Preloads state for a transaction to minimize network requests during execution
pub const StatePreloader = struct {
    allocator: std.mem.Allocator,
    provider: *Provider,
    block_number: u64,
    
    pub fn init(allocator: std.mem.Allocator, provider: *Provider, block_number: u64) StatePreloader {
        return StatePreloader{
            .allocator = allocator,
            .provider = provider,
            .block_number = block_number,
        };
    }
    
    /// Preload state for a transaction by analyzing its access patterns
    pub fn preloadForTransaction(self: *StatePreloader, tx: Transaction, database: *HybridDatabase) !void {
        // Preload sender account
        try self.preloadAccount(tx.from, database);
        
        // Preload recipient account if present
        if (tx.to) |to_address| {
            try self.preloadAccount(to_address, database);
        }
        
        // Preload access list if present (EIP-2930/1559 transactions)
        if (tx.access_list) |access_list| {
            for (access_list) |access_item| {
                try self.preloadAccount(access_item.address, database);
                
                for (access_item.storage_keys) |storage_key| {
                    _ = try database.getStorage(access_item.address, storage_key);
                }
            }
        }
        
        // For contract creation, preload code deployment address
        if (tx.to == null) {
            const contract_address = calculateContractAddress(tx.from, tx.nonce);
            try self.preloadAccount(contract_address, database);
        }
    }
    
    fn preloadAccount(self: *StatePreloader, address: Address, database: *HybridDatabase) !void {
        // This will trigger network fetch and caching
        _ = try database.getAccount(address);
        
        // Preload code if it's a contract
        const account = try database.getAccount(address);
        if (!std.mem.eql(u8, &account.code_hash, &[_]u8{0} ** 32)) {
            _ = try database.getCode(account.code_hash);
        }
    }
    
    fn calculateContractAddress(sender: Address, nonce: u64) Address {
        // Implement CREATE address calculation
        // address = keccak256(rlp([sender, nonce]))[12:]
        // This is a simplified version
        return Address.ZERO;
    }
};
```
</details>

### Integration with Transaction Execution

<details>
<summary><strong>5. Transaction Execution with State Loading</strong></summary>

**File: `src/evm/transaction_executor.zig`**
```zig
/// Execute a transaction with proper state loading
pub const TransactionExecutor = struct {
    allocator: std.mem.Allocator,
    provider: *Provider,
    
    pub fn init(allocator: std.mem.Allocator, provider: *Provider) TransactionExecutor {
        return TransactionExecutor{
            .allocator = allocator,
            .provider = provider,
        };
    }
    
    /// Execute a transaction at a specific block with proper state loading
    pub fn executeTransaction(
        self: *TransactionExecutor,
        tx: Transaction,
        block_number: u64,
        block_context: BlockContext,
    ) !TransactionResult {
        // Create hybrid database for this execution
        var hybrid_db = HybridDatabase.init(self.allocator, self.provider, block_number);
        defer hybrid_db.deinit();
        
        // Preload state for the transaction
        var preloader = StatePreloader.init(self.allocator, self.provider, block_number);
        try preloader.preloadForTransaction(tx, &hybrid_db);
        
        // Create EVM instance
        const db_interface = hybrid_db.to_database_interface();
        var evm = try Evm.init(self.allocator, db_interface);
        defer evm.deinit();
        
        // Set up execution context
        evm.context = Context{
            .block_number = block_number,
            .timestamp = block_context.timestamp,
            .gas_limit = block_context.gas_limit,
            .base_fee = block_context.base_fee,
            .coinbase = block_context.coinbase,
            .difficulty = block_context.difficulty,
        };
        
        // Execute the transaction
        return try self.executeTransactionInternal(&evm, tx);
    }
    
    fn executeTransactionInternal(self: *TransactionExecutor, evm: *Evm, tx: Transaction) !TransactionResult {
        // Create contract for execution
        var contract = try self.createContractFromTransaction(evm, tx);
        defer contract.deinit(self.allocator, null);
        
        // Execute with EVM
        const result = try evm.interpret(&contract, tx.data);
        
        return TransactionResult{
            .success = result.status == .Success,
            .gas_used = result.gas_used,
            .return_data = if (result.output) |output| 
                try self.allocator.dupe(u8, output) 
            else 
                try self.allocator.alloc(u8, 0),
            .logs = try self.collectLogs(evm),
        };
    }
    
    fn createContractFromTransaction(self: *TransactionExecutor, evm: *Evm, tx: Transaction) !Contract {
        // Implementation depends on transaction type and whether it's a call or create
        if (tx.to) |to_address| {
            // Contract call
            const code = try evm.state.get_code_by_address(to_address);
            return Contract.init_at_address(
                tx.from,
                to_address,
                tx.value,
                tx.gas_limit,
                code,
                tx.data,
                false, // not static
            );
        } else {
            // Contract creation
            return Contract.init_at_address(
                tx.from,
                calculateContractAddress(tx.from, tx.nonce),
                tx.value,
                tx.gas_limit,
                tx.data, // data is the contract code for creation
                &[_]u8{}, // no input data
                false,
            );
        }
    }
    
    fn collectLogs(self: *TransactionExecutor, evm: *Evm) ![]EventLog {
        // Collect logs from EVM state
        const logs = evm.state.logs.items;
        var result = try self.allocator.alloc(EventLog, logs.len);
        
        for (logs, 0..) |log, i| {
            result[i] = EventLog{
                .address = log.address,
                .topics = try self.allocator.dupe(Hash, log.topics),
                .data = try self.allocator.dupe(u8, log.data),
                .block_number = null, // Will be set by caller
                .transaction_hash = null, // Will be set by caller
                .transaction_index = null, // Will be set by caller
                .log_index = null, // Will be set by caller
                .removed = false,
            };
        }
        
        return result;
    }
};

pub const TransactionResult = struct {
    success: bool,
    gas_used: u64,
    return_data: []u8,
    logs: []EventLog,
    
    pub fn deinit(self: *const TransactionResult, allocator: std.mem.Allocator) void {
        allocator.free(self.return_data);
        for (self.logs) |log| {
            log.deinit(allocator);
        }
        allocator.free(self.logs);
    }
};

pub const BlockContext = struct {
    timestamp: u64,
    gas_limit: u64,
    base_fee: ?u256,
    coinbase: Address,
    difficulty: u256,
};
```
</details>

## Implementation Steps

### Step 1: Create Network Database
1. Implement `NetworkDatabase` in `src/evm/state/network_database.zig`
2. Add caching layers and lazy loading logic
3. Implement all database interface methods

### Step 2: Extend Provider APIs
1. Add historical state methods to `src/provider/provider.zig`
2. Implement proper block tag handling
3. Add error handling for non-existent state

### Step 3: Create Hybrid Database
1. Implement `HybridDatabase` combining network and memory databases
2. Add intelligent fallback logic
3. Optimize for common access patterns

### Step 4: Add State Preloading
1. Implement `StatePreloader` for transaction analysis
2. Add access list processing
3. Implement contract address calculation

### Step 5: Create Transaction Executor
1. Implement `TransactionExecutor` with state loading
2. Add proper context setup
3. Integrate with EVM execution

## Testing Strategy

### Unit Tests Required
```zig
test "NetworkDatabase fetches account from RPC" {
    // Test account fetching with mock provider
}

test "NetworkDatabase caches fetched data" {
    // Test that repeated requests use cache
}

test "HybridDatabase prefers local modifications" {
    // Test that local changes override network data
}

test "StatePreloader loads access list correctly" {
    // Test preloading with EIP-2930 transaction
}

test "TransactionExecutor handles contract creation" {
    // Test CREATE transaction execution
}
```

### Integration Tests
```zig
test "Execute historical transaction with network state" {
    // Execute a real transaction from block 23000000
}

test "State loading performance with large transaction" {
    // Test performance with complex DeFi transaction
}
```

## Success Criteria

### Functional Requirements
- [ ] NetworkDatabase fetches state correctly from RPC
- [ ] Caching reduces redundant network requests
- [ ] HybridDatabase handles local modifications properly
- [ ] TransactionExecutor produces accurate results

### Performance Requirements
- [ ] State preloading minimizes execution-time network requests
- [ ] Caching provides significant speedup for repeated access
- [ ] Memory usage is reasonable for large state sets

### Accuracy Requirements
- [ ] Fetched state matches network state exactly
- [ ] Transaction execution results match network results
- [ ] All edge cases (empty accounts, zero storage) handled correctly

## Integration with Other Phases
This phase provides:
- **For Phase 4**: Complete transaction execution with accurate historical state
- **For Phase 1**: Enhanced provider methods for state fetching
- **For Phase 2**: State context for trace comparison

## Notes
- Focus on accuracy over performance initially
- Consider implementing state diff optimization for consecutive blocks
- Plan for batch state fetching to reduce RPC calls
- Handle rate limiting and network errors gracefully
- Consider implementing state proof verification for additional security