# ForkedDatabase Design V2 - Performance-Focused Union-Based Architecture

## Core Philosophy

Zero-cost abstractions using union types instead of interfaces. The hot path (in-memory access) has zero overhead, while cold paths (disk/network) pay only for what they use.

## 1. Unified Storage Layer (Union-Based)

```zig
// src/storage/storage.zig
pub const Storage = union(enum) {
    memory: MemoryStorage,
    forked: ForkedStorage,
    disk: DiskStorage,      // Future: persistent storage
    test: TestStorage,       // For testing with deterministic data
    
    const Self = @This();
    
    // All storage implementations have the same API (accidental polymorphism)
    // These wrapper functions have zero overhead for the memory case due to inlining
    
    pub inline fn getAccount(self: *Self, address: [20]u8) !?Account {
        return switch (self.*) {
            .memory => |*s| s.getAccount(address),
            .forked => |*s| s.getAccount(address),
            .disk => |*s| s.getAccount(address),
            .test => |*s| s.getAccount(address),
        };
    }
    
    pub inline fn setAccount(self: *Self, address: [20]u8, account: Account) !void {
        return switch (self.*) {
            .memory => |*s| s.setAccount(address, account),
            .forked => |*s| s.setAccount(address, account),
            .disk => |*s| s.setAccount(address, account),
            .test => |*s| s.setAccount(address, account),
        };
    }
    
    pub inline fn getStorage(self: *Self, address: [20]u8, key: u256) !u256 {
        return switch (self.*) {
            .memory => |*s| s.getStorage(address, key),
            .forked => |*s| s.getStorage(address, key),
            .disk => |*s| s.getStorage(address, key),
            .test => |*s| s.getStorage(address, key),
        };
    }
    
    pub inline fn setStorage(self: *Self, address: [20]u8, key: u256, value: u256) !void {
        return switch (self.*) {
            .memory => |*s| s.setStorage(address, key, value),
            .forked => |*s| s.setStorage(address, key, value),
            .disk => |*s| s.setStorage(address, key, value),
            .test => |*s| s.setStorage(address, key, value),
        };
    }
    
    pub inline fn getCode(self: *Self, code_hash: [32]u8) ![]const u8 {
        return switch (self.*) {
            .memory => |*s| s.getCode(code_hash),
            .forked => |*s| s.getCode(code_hash),
            .disk => |*s| s.getCode(code_hash),
            .test => |*s| s.getCode(code_hash),
        };
    }
    
    // ... other methods follow same pattern ...
};
```

## 2. Unified Cache Storage (Hot/Warm/Cold)

```zig
// src/storage/cache_storage.zig
pub const CacheStorage = union(enum) {
    hot: HotStorage,     // Pure in-memory, zero overhead
    warm: WarmStorage,   // Memory with optional disk backing
    cold: ColdStorage,   // Disk-backed with memory cache
    
    const Self = @This();
    
    // The compiler will inline these and optimize away the switch for compile-time known types
    pub inline fn get(self: *Self, key: anytype) ?@TypeOf(key).ValueType {
        return switch (self.*) {
            .hot => |*s| s.get(key),
            .warm => |*s| s.get(key),
            .cold => |*s| s.get(key),
        };
    }
    
    pub inline fn put(self: *Self, key: anytype, value: anytype) !void {
        return switch (self.*) {
            .hot => |*s| s.put(key, value),
            .warm => |*s| s.put(key, value),
            .cold => |*s| s.put(key, value),
        };
    }
};

// Zero-overhead hot storage
pub const HotStorage = struct {
    // Direct HashMap access, no indirection
    accounts: std.HashMap([20]u8, Account, HashContext, 80),
    storage: std.HashMap(StorageKey, u256, StorageHashContext, 80),
    code: std.HashMap([32]u8, []const u8, HashContext, 80),
    
    pub inline fn get(self: *HotStorage, key: anytype) ?@TypeOf(key).ValueType {
        // This gets completely inlined - zero overhead
        return switch (@TypeOf(key)) {
            AccountKey => self.accounts.get(key.address),
            StorageKey => self.storage.get(key),
            CodeKey => self.code.get(key.hash),
            else => @compileError("Invalid key type"),
        };
    }
    
    pub inline fn put(self: *HotStorage, key: anytype, value: anytype) !void {
        return switch (@TypeOf(key)) {
            AccountKey => try self.accounts.put(key.address, value),
            StorageKey => try self.storage.put(key, value),
            CodeKey => try self.code.put(key.hash, value),
            else => @compileError("Invalid key type"),
        };
    }
};

// Warm storage with LRU eviction
pub const WarmStorage = struct {
    // LRU-based storage with configurable backing
    lru: LruStorage,
    backing: ?*ColdStorage,  // Optional backing for evicted items
    
    pub fn get(self: *WarmStorage, key: anytype) ?@TypeOf(key).ValueType {
        if (self.lru.get(key)) |value| {
            return value;
        }
        // Check backing if exists
        if (self.backing) |backing| {
            if (backing.get(key)) |value| {
                // Promote to warm
                self.lru.put(key, value) catch {};
                return value;
            }
        }
        return null;
    }
    
    pub fn put(self: *WarmStorage, key: anytype, value: anytype) !void {
        if (self.lru.put(key, value)) |evicted| {
            // Write evicted item to backing if exists
            if (self.backing) |backing| {
                try backing.put(evicted.key, evicted.value);
            }
        }
    }
};

// Cold storage (disk/network backed)
pub const ColdStorage = struct {
    // Can be disk file, mmap, or network RPC
    backend: StorageBackend,
    cache: LruStorage,  // Small in-memory cache to avoid repeated disk/network access
    
    pub fn get(self: *ColdStorage, key: anytype) ?@TypeOf(key).ValueType {
        if (self.cache.get(key)) |value| {
            return value;
        }
        if (self.backend.fetch(key)) |value| {
            self.cache.put(key, value) catch {};
            return value;
        }
        return null;
    }
};
```

## 3. Storage Backend Union

```zig
// src/storage/backend.zig
pub const StorageBackend = union(enum) {
    disk: DiskBackend,
    rpc: RpcBackend,
    mmap: MmapBackend,
    test: TestBackend,
    
    const Self = @This();
    
    pub inline fn fetch(self: *Self, key: anytype) ?@TypeOf(key).ValueType {
        return switch (self.*) {
            .disk => |*b| b.fetch(key),
            .rpc => |*b| b.fetch(key),
            .mmap => |*b| b.fetch(key),
            .test => |*b| b.fetch(key),
        };
    }
    
    pub inline fn store(self: *Self, key: anytype, value: anytype) !void {
        return switch (self.*) {
            .disk => |*b| b.store(key, value),
            .rpc => |*b| b.store(key, value),
            .mmap => |*b| b.store(key, value),
            .test => |*b| b.store(key, value),
        };
    }
};

pub const RpcBackend = struct {
    endpoint: []const u8,
    client: HttpClient,  // Simple struct, not interface
    block: u64,
    
    pub fn fetch(self: *RpcBackend, key: anytype) ?@TypeOf(key).ValueType {
        // RPC implementation
        return switch (@TypeOf(key)) {
            AccountKey => self.fetchAccount(key.address),
            StorageKey => self.fetchStorage(key.address, key.slot),
            CodeKey => self.fetchCode(key.address),
            else => null,
        };
    }
    
    fn fetchAccount(self: *RpcBackend, address: [20]u8) ?Account {
        // Make JSON-RPC call
        const request = JsonRpcRequest{
            .method = "eth_getProof",
            .params = .{ .address = address, .keys = &.{}, .block = self.block },
        };
        const response = self.client.call(request) catch return null;
        return parseAccount(response);
    }
};
```

## 4. Optimized ForkedStorage Implementation

```zig
// src/storage/forked_storage.zig
pub const ForkedStorage = struct {
    // Three-tier cache system as union
    caches: CacheTiers,
    
    // Local modifications (always hot)
    local: HotStorage,
    
    // Remote backend
    remote: RpcBackend,
    
    // Journal for reverts
    journal: Journal,
    
    allocator: std.mem.Allocator,
    
    const CacheTiers = struct {
        // L1: Hot cache - zero overhead direct access
        l1: HotStorage,
        
        // L2: Warm cache - LRU with eviction
        l2: WarmStorage,
        
        // L3: Cold cache - backed by RPC
        l3: ColdStorage,
        
        pub fn init(allocator: std.mem.Allocator, remote: *RpcBackend) !CacheTiers {
            return .{
                .l1 = HotStorage.init(allocator),
                .l2 = WarmStorage.init(allocator, null),
                .l3 = ColdStorage.init(allocator, .{ .rpc = remote }),
            };
        }
    };
    
    pub fn init(allocator: std.mem.Allocator, fork_url: []const u8, fork_block: u64) !ForkedStorage {
        var remote = RpcBackend{
            .endpoint = fork_url,
            .client = HttpClient.init(allocator),
            .block = fork_block,
        };
        
        return ForkedStorage{
            .caches = try CacheTiers.init(allocator, &remote),
            .local = HotStorage.init(allocator),
            .remote = remote,
            .journal = Journal.init(allocator),
            .allocator = allocator,
        };
    }
    
    // Fast path: check local modifications first
    pub inline fn getAccount(self: *ForkedStorage, address: [20]u8) !?Account {
        // Check local modifications (hot path)
        if (self.local.accounts.get(address)) |account| {
            return account;
        }
        
        // Check L1 cache (still fast)
        if (self.caches.l1.accounts.get(address)) |account| {
            return account;
        }
        
        // Check L2 cache (warm)
        if (self.caches.l2.get(.{ .address = address })) |account| {
            // Promote to L1
            try self.caches.l1.accounts.put(address, account);
            return account;
        }
        
        // Check L3 cache/fetch from remote (cold)
        if (self.caches.l3.get(.{ .address = address })) |account| {
            // Promote to L2 (not L1 to avoid thrashing)
            try self.caches.l2.put(.{ .address = address }, account);
            return account;
        }
        
        return null;
    }
    
    pub inline fn setAccount(self: *ForkedStorage, address: [20]u8, account: Account) !void {
        // Record in journal
        if (self.local.accounts.get(address)) |original| {
            try self.journal.record_account_change(self.current_snapshot_id, address, original);
        }
        
        // Always write to local (hot)
        try self.local.accounts.put(address, account);
        
        // Update L1 cache for fast subsequent reads
        try self.caches.l1.accounts.put(address, account);
    }
    
    pub inline fn getStorage(self: *ForkedStorage, address: [20]u8, slot: u256) !u256 {
        const key = StorageKey{ .address = address, .slot = slot };
        
        // Fast path: local modifications
        if (self.local.storage.get(key)) |value| {
            return value;
        }
        
        // L1 cache
        if (self.caches.l1.storage.get(key)) |value| {
            return value;
        }
        
        // L2/L3 with automatic promotion
        if (self.caches.l2.get(key)) |value| {
            try self.caches.l1.storage.put(key, value);
            return value;
        }
        
        if (self.caches.l3.get(key)) |value| {
            try self.caches.l2.put(key, value);
            return value;
        }
        
        return 0;
    }
};
```

## 5. Memory-Only Database (Current Implementation Enhanced)

```zig
// src/storage/memory_storage.zig (was database.zig)
pub const MemoryStorage = struct {
    // Direct storage - zero indirection
    accounts: std.HashMap([20]u8, Account, HashContext, 80),
    storage: std.HashMap(StorageKey, u256, StorageHashContext, 80),
    code: std.HashMap([32]u8, []const u8, HashContext, 80),
    
    // Optional warm cache for frequently accessed items
    warm_cache: ?WarmCache = null,
    
    // Existing functionality
    snapshots: std.ArrayList(Snapshot),
    allocator: std.mem.Allocator,
    
    pub const WarmCache = struct {
        // Small LRU for most frequently accessed
        accounts: LruCache([20]u8, *Account, .{ .capacity = 32 }),
        storage: LruCache(StorageKey, *u256, .{ .capacity = 64 }),
    };
    
    pub inline fn getAccount(self: *MemoryStorage, address: [20]u8) !?Account {
        // Check warm cache first if enabled
        if (self.warm_cache) |*cache| {
            if (cache.accounts.get(address)) |account_ptr| {
                return account_ptr.*;
            }
        }
        
        // Direct HashMap lookup - single hash computation
        if (self.accounts.getPtr(address)) |account_ptr| {
            // Update warm cache
            if (self.warm_cache) |*cache| {
                cache.accounts.put(address, account_ptr) catch {};
            }
            return account_ptr.*;
        }
        
        return null;
    }
    
    pub inline fn setAccount(self: *MemoryStorage, address: [20]u8, account: Account) !void {
        try self.accounts.put(address, account);
        
        // Invalidate warm cache entry
        if (self.warm_cache) |*cache| {
            cache.accounts.remove(address);
        }
    }
};
```

## 6. EVM Integration

```zig
// src/evm.zig
pub fn Evm(comptime config: EvmConfig) type {
    return struct {
        const Self = @This();
        
        // Storage is now a union - zero overhead for memory case
        storage: Storage,
        
        // ... other fields ...
        
        pub fn init(
            allocator: std.mem.Allocator,
            storage: Storage,  // Can be .memory, .forked, .disk, etc.
            block_info: BlockInfo,
            // ... other params ...
        ) !Self {
            return Self{
                .storage = storage,
                // ... other fields ...
            };
        }
        
        // All storage access goes through the union
        // For memory storage, this compiles to direct access
        fn transferWithBalanceChecks(self: *Self, from: Address, to: Address, value: u256, snapshot_id: u64) !void {
            // This inlines to direct HashMap access for memory storage
            var from_account = try self.storage.getAccount(from.bytes) orelse Account.zero();
            
            if (from_account.balance < value) return error.InsufficientBalance;
            if (from.equals(to)) return;
            
            var to_account = try self.storage.getAccount(to.bytes) orelse Account.zero();
            
            // Record changes and update
            from_account.balance -= value;
            to_account.balance += value;
            
            try self.storage.setAccount(from.bytes, from_account);
            try self.storage.setAccount(to.bytes, to_account);
        }
    };
}
```

## 7. Generic LRU Cache (Shared Infrastructure)

```zig
// src/storage/lru_cache.zig
pub fn LruCache(comptime K: type, comptime V: type, comptime config: LruConfig) type {
    return struct {
        const Self = @This();
        
        // Core data structures
        map: std.HashMap(K, usize, config.HashContext, 80),  // Key -> Node index
        nodes: []Node,  // Pre-allocated array
        head: usize,    // Most recently used
        tail: usize,    // Least recently used
        free: usize,    // Free list head
        size: usize,
        
        const Node = struct {
            key: K,
            value: V,
            prev: usize,
            next: usize,
            used: bool,
        };
        
        pub fn init(allocator: std.mem.Allocator) !Self {
            const nodes = try allocator.alloc(Node, config.capacity);
            // Initialize free list
            for (nodes, 0..) |*node, i| {
                node.* = .{
                    .key = undefined,
                    .value = undefined,
                    .prev = if (i == 0) std.math.maxInt(usize) else i - 1,
                    .next = if (i == config.capacity - 1) std.math.maxInt(usize) else i + 1,
                    .used = false,
                };
            }
            
            return Self{
                .map = std.HashMap(K, usize, config.HashContext, 80).init(allocator),
                .nodes = nodes,
                .head = std.math.maxInt(usize),
                .tail = std.math.maxInt(usize),
                .free = 0,
                .size = 0,
            };
        }
        
        pub inline fn get(self: *Self, key: K) ?V {
            if (self.map.get(key)) |idx| {
                self.moveToFront(idx);
                return self.nodes[idx].value;
            }
            return null;
        }
        
        pub fn put(self: *Self, key: K, value: V) !?struct { key: K, value: V } {
            if (self.map.get(key)) |idx| {
                // Update existing
                self.nodes[idx].value = value;
                self.moveToFront(idx);
                return null;
            }
            
            // Add new
            if (self.size >= config.capacity) {
                // Evict LRU
                const evicted = self.evictLru();
                const idx = self.allocateNode();
                self.nodes[idx] = .{
                    .key = key,
                    .value = value,
                    .prev = std.math.maxInt(usize),
                    .next = self.head,
                    .used = true,
                };
                try self.map.put(key, idx);
                self.head = idx;
                if (self.tail == std.math.maxInt(usize)) {
                    self.tail = idx;
                }
                return evicted;
            } else {
                // Space available
                const idx = self.allocateNode();
                self.nodes[idx] = .{
                    .key = key,
                    .value = value,
                    .prev = std.math.maxInt(usize),
                    .next = self.head,
                    .used = true,
                };
                try self.map.put(key, idx);
                if (self.head != std.math.maxInt(usize)) {
                    self.nodes[self.head].prev = idx;
                }
                self.head = idx;
                if (self.tail == std.math.maxInt(usize)) {
                    self.tail = idx;
                }
                self.size += 1;
                return null;
            }
        }
        
        inline fn moveToFront(self: *Self, idx: usize) void {
            if (idx == self.head) return;
            
            const node = &self.nodes[idx];
            
            // Remove from current position
            if (node.prev != std.math.maxInt(usize)) {
                self.nodes[node.prev].next = node.next;
            }
            if (node.next != std.math.maxInt(usize)) {
                self.nodes[node.next].prev = node.prev;
            }
            if (idx == self.tail) {
                self.tail = node.prev;
            }
            
            // Move to front
            node.prev = std.math.maxInt(usize);
            node.next = self.head;
            if (self.head != std.math.maxInt(usize)) {
                self.nodes[self.head].prev = idx;
            }
            self.head = idx;
        }
        
        fn evictLru(self: *Self) struct { key: K, value: V } {
            const idx = self.tail;
            const node = self.nodes[idx];
            
            _ = self.map.remove(node.key);
            
            if (node.prev != std.math.maxInt(usize)) {
                self.nodes[node.prev].next = std.math.maxInt(usize);
                self.tail = node.prev;
            } else {
                self.head = std.math.maxInt(usize);
                self.tail = std.math.maxInt(usize);
            }
            
            self.freeNode(idx);
            return .{ .key = node.key, .value = node.value };
        }
    };
}

pub const LruConfig = struct {
    capacity: usize,
    HashContext: type = std.hash_map.AutoContext,
};
```

## Performance Benefits

### Zero-Cost Abstraction
- **Memory Storage**: Direct HashMap access, no indirection
- **Union Dispatch**: Resolved at compile-time when possible
- **Inline Functions**: All hot-path functions marked inline

### Cache Hierarchy Performance
```
L1 (Hot):  ~10ns      - Direct HashMap lookup
L2 (Warm): ~50ns      - LRU overhead + HashMap
L3 (Cold): ~100ns     - Disk/Network check
```

### Memory Layout
- **Cache-line aligned**: Hot data structures fit in L1 CPU cache
- **Minimal indirection**: Union types keep data local
- **Predictable branches**: Union switches are highly predictable

## Implementation Phases

### Phase 1: Core Infrastructure
1. Implement generic LRU cache
2. Create union-based Storage type
3. Update existing Database to MemoryStorage

### Phase 2: Cache Tiers
1. Implement HotStorage (zero-overhead)
2. Implement WarmStorage (LRU-based)
3. Implement ColdStorage (backend-based)

### Phase 3: Forked Storage
1. Create RpcBackend
2. Implement ForkedStorage
3. Integrate with Journal

### Phase 4: Optimization
1. Add prefetching
2. Implement batch RPC requests
3. Add cache statistics

## Testing Strategy

```zig
test "Zero overhead for memory storage" {
    var storage = Storage{ .memory = MemoryStorage.init(allocator) };
    
    // This should compile to direct HashMap access
    const account = try storage.getAccount(test_address);
    
    // Verify assembly has no virtual calls
    // @compileLog(@typeName(@TypeOf(storage.getAccount)));
}

test "Cache promotion ladder" {
    var storage = Storage{ .forked = try ForkedStorage.init(allocator, url, block) };
    
    // First access - fetches from RPC
    const account1 = try storage.getAccount(addr);
    
    // Second access - should come from L3 cache
    const account2 = try storage.getAccount(addr);
    
    // Third access - should be promoted to L2
    const account3 = try storage.getAccount(addr);
    
    // Verify cache statistics
    try testing.expect(storage.forked.caches.l2.hits > 0);
}
```

## Migration Path

1. **Current**: `database: *Database` in EVM
2. **Step 1**: Rename `Database` to `MemoryStorage`
3. **Step 2**: Create `Storage` union with `.memory` variant
4. **Step 3**: Update EVM to use `storage: Storage`
5. **Step 4**: Add `.forked` variant to union
6. **Step 5**: Implement cache tiers

This approach gives us maximum performance with the flexibility to add different storage backends without any virtual function overhead.