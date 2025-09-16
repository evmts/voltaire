# ForkedDatabase Design Document

## Overview

This document outlines the design for implementing a ForkedDatabase in Zig for the Guillotine EVM, enabling fork mode execution similar to Foundry's Anvil. The design includes a shared LRU cache infrastructure, pluggable RPC client abstraction, and integration with the existing journal system.

## Architecture Components

### 1. Core Storage Abstraction Layer

```
┌─────────────────────────────────────────────────────────┐
│                     EVM                                  │
│                                                          │
│  - Uses StorageInterface for all state operations       │
│  - Unaware of underlying implementation                  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│               StorageInterface (trait)                   │
│                                                          │
│  - get_account()                                        │
│  - set_account()                                        │
│  - get_storage()                                        │
│  - set_storage()                                        │
│  - get_code()                                           │
│  - set_code()                                           │
│  - create_snapshot()                                    │
│  - revert_to_snapshot()                                 │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┬──────────────┐
        ▼                         ▼              ▼
┌──────────────┐      ┌──────────────┐  ┌──────────────┐
│   Database   │      │ForkedDatabase│  │ TestDatabase │
│              │      │              │  │              │
│ (In-memory)  │      │ (Fork mode) │  │  (Testing)   │
└──────────────┘      └──────────────┘  └──────────────┘
```

### 2. Shared LRU Cache Infrastructure

```zig
// src/storage/lru_cache.zig
pub fn LruCache(comptime K: type, comptime V: type, comptime Config: LruCacheConfig) type {
    return struct {
        const Self = @This();
        
        // Core data structures
        map: std.HashMap(K, *Node, Config.HashContext, Config.max_load_percentage),
        list: DoublyLinkedList(Node),
        capacity: usize,
        size: usize,
        allocator: std.mem.Allocator,
        
        // Statistics
        hits: u64,
        misses: u64,
        evictions: u64,
        
        const Node = struct {
            key: K,
            value: V,
            prev: ?*Node,
            next: ?*Node,
        };
        
        pub fn init(allocator: std.mem.Allocator, capacity: usize) Self {
            // Initialize with given capacity
        }
        
        pub fn get(self: *Self, key: K) ?V {
            // Move to front on access (LRU policy)
        }
        
        pub fn put(self: *Self, key: K, value: V) !void {
            // Add new entry, evict if at capacity
        }
        
        pub fn contains(self: *Self, key: K) bool {
            // Check if key exists without updating position
        }
        
        pub fn clear(self: *Self) void {
            // Remove all entries
        }
    };
}

pub const LruCacheConfig = struct {
    HashContext: type = std.hash_map.AutoContext,
    max_load_percentage: u8 = 80,
    enable_statistics: bool = true,
};
```

### 3. Cache Layers Architecture

```zig
// src/storage/cache_layers.zig
pub const CacheLayers = struct {
    /// L1: Hot data cache (small, very fast)
    /// Used for frequently accessed accounts/storage in current transaction
    l1_accounts: LruCache([20]u8, Account, .{ .capacity = 128 }),
    l1_storage: LruCache(StorageKey, u256, .{ .capacity = 256 }),
    l1_code: LruCache([20]u8, []const u8, .{ .capacity = 32 }),
    
    /// L2: Warm data cache (medium, fast)
    /// Used for data accessed in recent blocks
    l2_accounts: LruCache([20]u8, Account, .{ .capacity = 1024 }),
    l2_storage: LruCache(StorageKey, u256, .{ .capacity = 4096 }),
    l2_code: LruCache([20]u8, []const u8, .{ .capacity = 256 }),
    
    /// L3: Cold data cache (large, slower but still in-memory)
    /// Used for fork data fetched from remote
    l3_accounts: LruCache([20]u8, Account, .{ .capacity = 10000 }),
    l3_storage: LruCache(StorageKey, u256, .{ .capacity = 100000 }),
    l3_code: LruCache([20]u8, []const u8, .{ .capacity = 1000 }),
    
    pub fn get_account(self: *CacheLayers, address: [20]u8) ?Account {
        // Check L1 → L2 → L3
        if (self.l1_accounts.get(address)) |account| return account;
        if (self.l2_accounts.get(address)) |account| {
            // Promote to L1
            self.l1_accounts.put(address, account) catch {};
            return account;
        }
        if (self.l3_accounts.get(address)) |account| {
            // Promote to L2 (not L1 to avoid thrashing)
            self.l2_accounts.put(address, account) catch {};
            return account;
        }
        return null;
    }
};
```

### 4. RPC Client Abstraction

```zig
// src/storage/rpc_client.zig
pub const RpcClient = struct {
    /// Interface for pluggable RPC implementations
    pub const Interface = struct {
        /// Function pointers for RPC operations
        get_proof_fn: *const fn (self: *anyopaque, address: [20]u8, keys: []const u256, block: BlockTag) anyerror!AccountProof,
        get_storage_at_fn: *const fn (self: *anyopaque, address: [20]u8, slot: u256, block: BlockTag) anyerror!u256,
        get_code_fn: *const fn (self: *anyopaque, address: [20]u8, block: BlockTag) anyerror![]const u8,
        get_balance_fn: *const fn (self: *anyopaque, address: [20]u8, block: BlockTag) anyerror!u256,
        get_nonce_fn: *const fn (self: *anyopaque, address: [20]u8, block: BlockTag) anyerror!u64,
        
        /// Context pointer (implementation-specific data)
        context: *anyopaque,
        
        pub fn getProof(self: Interface, address: [20]u8, keys: []const u256, block: BlockTag) !AccountProof {
            return self.get_proof_fn(self.context, address, keys, block);
        }
        
        pub fn getStorageAt(self: Interface, address: [20]u8, slot: u256, block: BlockTag) !u256 {
            return self.get_storage_at_fn(self.context, address, slot, block);
        }
        
        pub fn getCode(self: Interface, address: [20]u8, block: BlockTag) ![]const u8 {
            return self.get_code_fn(self.context, address, block);
        }
    };
    
    pub const BlockTag = union(enum) {
        latest,
        earliest,
        pending,
        number: u64,
        hash: [32]u8,
    };
    
    pub const AccountProof = struct {
        address: [20]u8,
        balance: u256,
        nonce: u64,
        code_hash: [32]u8,
        storage_hash: [32]u8,
        account_proof: []const []const u8,
        storage_proof: []const StorageProof,
    };
    
    pub const StorageProof = struct {
        key: u256,
        value: u256,
        proof: []const []const u8,
    };
};

// src/storage/http_rpc_client.zig
pub const HttpRpcClient = struct {
    allocator: std.mem.Allocator,
    client: std.http.Client,
    endpoint: []const u8,
    block_tag: RpcClient.BlockTag,
    
    pub fn init(allocator: std.mem.Allocator, endpoint: []const u8, block_tag: RpcClient.BlockTag) !HttpRpcClient {
        return HttpRpcClient{
            .allocator = allocator,
            .client = std.http.Client{ .allocator = allocator },
            .endpoint = endpoint,
            .block_tag = block_tag,
        };
    }
    
    pub fn interface(self: *HttpRpcClient) RpcClient.Interface {
        return .{
            .get_proof_fn = getProof,
            .get_storage_at_fn = getStorageAt,
            .get_code_fn = getCode,
            .get_balance_fn = getBalance,
            .get_nonce_fn = getNonce,
            .context = self,
        };
    }
    
    fn getProof(ctx: *anyopaque, address: [20]u8, keys: []const u256, block: RpcClient.BlockTag) !RpcClient.AccountProof {
        const self = @as(*HttpRpcClient, @ptrCast(@alignCast(ctx)));
        // Implement JSON-RPC eth_getProof call
    }
    
    fn getStorageAt(ctx: *anyopaque, address: [20]u8, slot: u256, block: RpcClient.BlockTag) !u256 {
        const self = @as(*HttpRpcClient, @ptrCast(@alignCast(ctx)));
        // Implement JSON-RPC eth_getStorageAt call
    }
    
    fn getCode(ctx: *anyopaque, address: [20]u8, block: RpcClient.BlockTag) ![]const u8 {
        const self = @as(*HttpRpcClient, @ptrCast(@alignCast(ctx)));
        // Implement JSON-RPC eth_getCode call
    }
};
```

### 5. ForkedDatabase Implementation

```zig
// src/storage/forked_database.zig
pub const ForkedDatabase = struct {
    /// Base database for local modifications
    local: Database,
    
    /// Multi-level cache system
    caches: CacheLayers,
    
    /// RPC client for fetching remote state
    rpc_client: RpcClient.Interface,
    
    /// Fork configuration
    fork_block: u64,
    fork_url: []const u8,
    
    /// Journal integration
    journal: Journal,
    
    /// Allocator
    allocator: std.mem.Allocator,
    
    pub fn init(allocator: std.mem.Allocator, fork_url: []const u8, fork_block: u64) !ForkedDatabase {
        var http_client = try HttpRpcClient.init(allocator, fork_url, .{ .number = fork_block });
        
        return ForkedDatabase{
            .local = Database.init(allocator),
            .caches = try CacheLayers.init(allocator),
            .rpc_client = http_client.interface(),
            .fork_block = fork_block,
            .fork_url = fork_url,
            .journal = Journal.init(allocator),
            .allocator = allocator,
        };
    }
    
    // StorageInterface implementation
    pub fn get_account(self: *ForkedDatabase, address: [20]u8) Error!?Account {
        // 1. Check local database (modifications)
        if (self.local.get_account(address)) |account| {
            return account;
        }
        
        // 2. Check cache hierarchy
        if (self.caches.get_account(address)) |account| {
            return account;
        }
        
        // 3. Fetch from remote
        const proof = try self.rpc_client.getProof(address, &.{}, .{ .number = self.fork_block });
        
        const account = Account{
            .balance = proof.balance,
            .nonce = proof.nonce,
            .code_hash = proof.code_hash,
            .storage_root = proof.storage_hash,
        };
        
        // 4. Cache in L3 (cold cache)
        try self.caches.l3_accounts.put(address, account);
        
        return account;
    }
    
    pub fn set_account(self: *ForkedDatabase, address: [20]u8, account: Account) Error!void {
        // Record in journal for revert capability
        if (try self.local.get_account(address)) |original| {
            try self.journal.record_account_change(self.current_snapshot_id, address, original);
        }
        
        // Store in local database (modifications layer)
        try self.local.set_account(address, account);
        
        // Update L1 cache (hot data)
        try self.caches.l1_accounts.put(address, account);
    }
    
    pub fn get_storage(self: *ForkedDatabase, address: [20]u8, key: u256) Error!u256 {
        // 1. Check local modifications
        if (try self.local.get_storage(address, key)) |value| {
            return value;
        }
        
        // 2. Check cache hierarchy
        const storage_key = StorageKey{ .address = address, .key = key };
        if (self.caches.get_storage(storage_key)) |value| {
            return value;
        }
        
        // 3. Fetch from remote
        const value = try self.rpc_client.getStorageAt(address, key, .{ .number = self.fork_block });
        
        // 4. Cache in L3
        try self.caches.l3_storage.put(storage_key, value);
        
        return value;
    }
    
    pub fn get_code(self: *ForkedDatabase, address: [20]u8) Error![]const u8 {
        // 1. Check local
        if (try self.local.get_code_by_address(address)) |code| {
            return code;
        }
        
        // 2. Check caches
        if (self.caches.get_code(address)) |code| {
            return code;
        }
        
        // 3. Fetch from remote
        const code = try self.rpc_client.getCode(address, .{ .number = self.fork_block });
        
        // 4. Store in cache
        const code_copy = try self.allocator.dupe(u8, code);
        try self.caches.l3_code.put(address, code_copy);
        
        return code_copy;
    }
};
```

### 6. StorageInterface Trait

```zig
// src/storage/storage_interface.zig
pub const StorageInterface = struct {
    // Virtual function table
    const VTable = struct {
        get_account: *const fn (ctx: *anyopaque, address: [20]u8) anyerror!?Account,
        set_account: *const fn (ctx: *anyopaque, address: [20]u8, account: Account) anyerror!void,
        delete_account: *const fn (ctx: *anyopaque, address: [20]u8) anyerror!void,
        get_storage: *const fn (ctx: *anyopaque, address: [20]u8, key: u256) anyerror!u256,
        set_storage: *const fn (ctx: *anyopaque, address: [20]u8, key: u256, value: u256) anyerror!void,
        get_code: *const fn (ctx: *anyopaque, code_hash: [32]u8) anyerror![]const u8,
        get_code_by_address: *const fn (ctx: *anyopaque, address: [20]u8) anyerror![]const u8,
        set_code: *const fn (ctx: *anyopaque, code: []const u8) anyerror![32]u8,
        create_snapshot: *const fn (ctx: *anyopaque) anyerror!u64,
        revert_to_snapshot: *const fn (ctx: *anyopaque, id: u64) anyerror!void,
        commit_snapshot: *const fn (ctx: *anyopaque, id: u64) anyerror!void,
    };
    
    vtable: *const VTable,
    context: *anyopaque,
    
    // Wrapper functions
    pub fn getAccount(self: StorageInterface, address: [20]u8) !?Account {
        return self.vtable.get_account(self.context, address);
    }
    
    pub fn setAccount(self: StorageInterface, address: [20]u8, account: Account) !void {
        return self.vtable.set_account(self.context, address, account);
    }
    
    // ... other wrapper functions ...
    
    // Factory functions for different implementations
    pub fn fromDatabase(db: *Database) StorageInterface {
        const vtable = struct {
            const vt: VTable = .{
                .get_account = Database.getAccountWrapper,
                .set_account = Database.setAccountWrapper,
                // ... other function pointers ...
            };
        }.vt;
        
        return .{
            .vtable = &vtable,
            .context = db,
        };
    }
    
    pub fn fromForkedDatabase(db: *ForkedDatabase) StorageInterface {
        const vtable = struct {
            const vt: VTable = .{
                .get_account = ForkedDatabase.getAccountWrapper,
                .set_account = ForkedDatabase.setAccountWrapper,
                // ... other function pointers ...
            };
        }.vt;
        
        return .{
            .vtable = &vtable,
            .context = db,
        };
    }
};
```

### 7. EVM Integration

```zig
// Modified src/evm.zig
pub fn Evm(comptime config: EvmConfig) type {
    return struct {
        const Self = @This();
        
        // Change from concrete Database to interface
        storage: StorageInterface,  // Was: database: *Database
        
        // ... rest of EVM fields ...
        
        pub fn init(
            allocator: std.mem.Allocator,
            storage: StorageInterface,  // Was: database: *Database
            block_info: BlockInfo,
            context: TransactionContext,
            gas_price: u256,
            origin: primitives.Address,
            hardfork_config: Hardfork,
        ) !Self {
            // ... initialization code ...
            
            var self = Self{
                .storage = storage,  // Was: .database = database
                // ... other fields ...
            };
            
            // ... rest of init ...
        }
        
        // Update all database accesses to use storage interface
        fn transferWithBalanceChecks(self: *Self, from: primitives.Address, to: primitives.Address, value: u256, snapshot_id: Journal.SnapshotIdType) !void {
            var from_account = try self.storage.getAccount(from.bytes) orelse Account.zero();
            // ... rest of implementation ...
        }
    };
}
```

## Implementation Phases

### Phase 1: Cache Infrastructure
1. Implement generic LRU cache
2. Create multi-level cache system
3. Add cache statistics and monitoring

### Phase 2: Storage Interface Abstraction
1. Define StorageInterface trait
2. Refactor Database to implement interface
3. Update EVM to use StorageInterface

### Phase 3: RPC Client
1. Implement RPC client interface
2. Create HTTP JSON-RPC implementation
3. Add request batching and retry logic

### Phase 4: ForkedDatabase Core
1. Implement basic ForkedDatabase
2. Integrate cache layers
3. Add journal support for fork state

### Phase 5: Optimization
1. Add cache warming strategies
2. Implement prefetching for likely-accessed data
3. Add metrics and performance monitoring

## Performance Considerations

### Cache Sizing Strategy
- **L1 (Hot)**: 128-256 entries, sub-microsecond access
- **L2 (Warm)**: 1K-4K entries, microsecond access
- **L3 (Cold)**: 10K-100K entries, prevent remote fetches

### Memory Usage
- Estimated memory per account: ~200 bytes
- Estimated memory per storage slot: ~64 bytes
- Total cache memory budget: ~50-100 MB

### Optimization Techniques
1. **Batch RPC requests**: Group multiple requests in single RPC call
2. **Predictive prefetching**: Fetch related accounts/storage proactively
3. **Compression**: Compress cached bytecode
4. **Lazy loading**: Only fetch data when actually accessed

## Testing Strategy

### Unit Tests
- LRU cache correctness
- Cache eviction policies
- RPC client mocking
- Storage interface compliance

### Integration Tests
- Fork mode with real networks
- Cache hit/miss ratios
- Journal replay correctness
- Performance benchmarks

### Differential Testing
- Compare ForkedDatabase results with reference implementation
- Verify state consistency across snapshots
- Test edge cases (reorgs, uncle blocks)

## Future Enhancements

1. **Persistent Cache**: Save cache to disk between runs
2. **Multi-fork Support**: Support multiple fork sources
3. **State Diff Tracking**: Track modifications from fork point
4. **WebSocket RPC**: Real-time state updates
5. **Proof Verification**: Verify Merkle proofs for security

## Migration Path

1. **Current State**: Direct Database usage in EVM
2. **Step 1**: Add StorageInterface, Database implements it
3. **Step 2**: Add cache layers to Database
4. **Step 3**: Implement ForkedDatabase
5. **Step 4**: Enable fork mode in CLI

## Appendix: Configuration

```zig
pub const ForkConfig = struct {
    /// RPC endpoint URL
    url: []const u8,
    
    /// Block number to fork from
    block_number: ?u64 = null,
    
    /// Block hash to fork from (alternative to number)
    block_hash: ?[32]u8 = null,
    
    /// Cache configuration
    cache_config: CacheConfig = .{},
    
    /// RPC request configuration
    rpc_config: RpcConfig = .{},
};

pub const CacheConfig = struct {
    /// L1 cache sizes
    l1_accounts: usize = 128,
    l1_storage: usize = 256,
    l1_code: usize = 32,
    
    /// L2 cache sizes
    l2_accounts: usize = 1024,
    l2_storage: usize = 4096,
    l2_code: usize = 256,
    
    /// L3 cache sizes
    l3_accounts: usize = 10000,
    l3_storage: usize = 100000,
    l3_code: usize = 1000,
    
    /// Enable cache statistics
    enable_stats: bool = true,
};

pub const RpcConfig = struct {
    /// Maximum concurrent requests
    max_concurrent: usize = 10,
    
    /// Request timeout in milliseconds
    timeout_ms: u64 = 30000,
    
    /// Maximum retries
    max_retries: u32 = 3,
    
    /// Batch size for bulk requests
    batch_size: usize = 100,
};
```