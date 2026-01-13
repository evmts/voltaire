//! ForkBlockCache - Remote block fetching with caching
//!
//! Fetches blocks from remote RPC provider with local caching:
//! - RPC vtable for async block fetching
//! - Simple FIFO cache (10k blocks)
//! - Fork boundary checking (blocks ≤ forkBlock from remote)
//! - Async callback pattern for RPC operations
//!
//! ## Architecture
//! - cache: Map<Hash, Block> - Recently fetched blocks
//! - cache_queue: FIFO for eviction
//! - rpc_vtable: Function pointers for remote fetching
//! - fork_block_number: Fork point (read-only boundary)
//!
//! ## Usage
//! ```zig
//! const ForkBlockCache = @import("blockchain").ForkBlockCache;
//!
//! const vtable = RpcVTable{
//!     .fetch_block_by_number = myFetchByNumber,
//!     .fetch_block_by_hash = myFetchByHash,
//! };
//!
//! var cache = try ForkBlockCache.init(allocator, vtable, fork_block);
//! defer cache.deinit();
//!
//! // Fetch block (tries cache first, then RPC)
//! const block = try cache.getBlockByNumber(12345);
//! ```

const std = @import("std");
const primitives = @import("primitives");
const Block = primitives.Block;
const Hash = primitives.Hash;

/// Max cache size (10k blocks)
const MAX_CACHE_SIZE: usize = 10_000;

/// RPC vtable for async block fetching
pub const RpcVTable = struct {
    /// Context pointer (opaque, passed to all RPC functions)
    context: *anyopaque,

    /// Fetch block by number (returns null if not found)
    /// Async: May return immediately with cached result or trigger async fetch
    fetch_block_by_number: *const fn (ctx: *anyopaque, number: u64) ?Block.Block,

    /// Fetch block by hash (returns null if not found)
    fetch_block_by_hash: *const fn (ctx: *anyopaque, hash: Hash.Hash) ?Block.Block,
};

/// ForkBlockCache - Remote block fetching with local cache
pub const ForkBlockCache = struct {
    allocator: std.mem.Allocator,

    /// Fork block number (blocks ≤ this are read-only from remote)
    fork_block_number: u64,

    /// RPC vtable for remote fetching
    rpc_vtable: RpcVTable,

    /// Block cache (hash -> block)
    cache: std.AutoHashMap(Hash.Hash, Block.Block),

    /// Cache FIFO queue (for eviction)
    cache_queue: std.ArrayList(Hash.Hash),

    pub fn init(allocator: std.mem.Allocator, rpc_vtable: RpcVTable, fork_block_number: u64) !ForkBlockCache {
        return .{
            .allocator = allocator,
            .fork_block_number = fork_block_number,
            .rpc_vtable = rpc_vtable,
            .cache = std.AutoHashMap(Hash.Hash, Block.Block).init(allocator),
            .cache_queue = std.ArrayList(Hash.Hash){},
        };
    }

    pub fn deinit(self: *ForkBlockCache) void {
        // BlockBody uses const slices, no need to free
        self.cache.deinit();
        self.cache_queue.deinit(self.allocator);
    }

    /// Check if block number is within fork boundary
    pub fn isForkBlock(self: *ForkBlockCache, number: u64) bool {
        return number <= self.fork_block_number;
    }

    /// Get block by number (cache -> RPC)
    pub fn getBlockByNumber(self: *ForkBlockCache, number: u64) ?Block.Block {
        // Check if within fork boundary
        if (!self.isForkBlock(number)) {
            return null; // Beyond fork, not available from remote
        }

        // Try RPC fetch (may be cached in RPC layer)
        const maybe_block = self.rpc_vtable.fetch_block_by_number(self.rpc_vtable.context, number);
        if (maybe_block) |block| {
            // Cache the result
            self.putCache(block) catch {}; // Ignore cache errors
            return block;
        }

        return null;
    }

    /// Get block by hash (cache -> RPC)
    pub fn getBlockByHash(self: *ForkBlockCache, hash: Hash.Hash) ?Block.Block {
        // Try local cache first
        if (self.cache.get(hash)) |block| {
            return block;
        }

        // Try RPC fetch
        const maybe_block = self.rpc_vtable.fetch_block_by_hash(self.rpc_vtable.context, hash);
        if (maybe_block) |block| {
            // Verify within fork boundary
            if (!self.isForkBlock(block.header.number)) {
                return null;
            }

            // Cache the result
            self.putCache(block) catch {}; // Ignore cache errors
            return block;
        }

        return null;
    }

    /// Put block in cache (with FIFO eviction)
    fn putCache(self: *ForkBlockCache, block: Block.Block) !void {
        const block_hash = block.hash;

        // Check if already cached
        if (self.cache.contains(block_hash)) {
            return;
        }

        // Evict if at capacity
        if (self.cache.count() >= MAX_CACHE_SIZE) {
            try self.evictOldest();
        }

        // Add to cache
        try self.cache.put(block_hash, block);
        try self.cache_queue.append(self.allocator, block_hash);
    }

    /// Evict oldest block from cache (FIFO)
    fn evictOldest(self: *ForkBlockCache) !void {
        if (self.cache_queue.items.len == 0) return;

        // Remove oldest
        const oldest_hash = self.cache_queue.orderedRemove(0);

        // BlockBody uses const slices, just remove from map
        _ = self.cache.remove(oldest_hash);
    }

    /// Get cache size
    pub fn cacheSize(self: *ForkBlockCache) usize {
        return self.cache.count();
    }

    /// Check if block is cached
    pub fn isCached(self: *ForkBlockCache, hash: Hash.Hash) bool {
        return self.cache.contains(hash);
    }
};

// ============================================================================
// Tests
// ============================================================================

// Mock RPC context (exported for tests in other modules)
pub const MockRpcContext = struct {
    blocks_by_number: std.AutoHashMap(u64, Block.Block),
    blocks_by_hash: std.AutoHashMap(Hash.Hash, Block.Block),

    pub fn init(allocator: std.mem.Allocator) MockRpcContext {
        return .{
            .blocks_by_number = std.AutoHashMap(u64, Block.Block).init(allocator),
            .blocks_by_hash = std.AutoHashMap(Hash.Hash, Block.Block).init(allocator),
        };
    }

    pub fn deinit(self: *MockRpcContext) void {
        self.blocks_by_number.deinit();
        self.blocks_by_hash.deinit();
    }

    pub fn addBlock(self: *MockRpcContext, block: Block.Block) !void {
        try self.blocks_by_number.put(block.header.number, block);
        try self.blocks_by_hash.put(block.hash, block);
    }
};

pub fn mockFetchByNumber(ctx: *anyopaque, number: u64) ?Block.Block {
    const mock_ctx: *MockRpcContext = @ptrCast(@alignCast(ctx));
    return mock_ctx.blocks_by_number.get(number);
}

pub fn mockFetchByHash(ctx: *anyopaque, hash: Hash.Hash) ?Block.Block {
    const mock_ctx: *MockRpcContext = @ptrCast(@alignCast(ctx));
    return mock_ctx.blocks_by_hash.get(hash);
}

test "ForkBlockCache - init and deinit" {
    const allocator = std.testing.allocator;

    var mock_ctx = MockRpcContext.init(allocator);
    defer mock_ctx.deinit();

    const vtable = RpcVTable{
        .context = @ptrCast(&mock_ctx),
        .fetch_block_by_number = mockFetchByNumber,
        .fetch_block_by_hash = mockFetchByHash,
    };

    var cache = try ForkBlockCache.init(allocator, vtable, 1000);
    defer cache.deinit();

    try std.testing.expectEqual(@as(usize, 0), cache.cacheSize());
}

test "ForkBlockCache - isForkBlock boundary check" {
    const allocator = std.testing.allocator;

    var mock_ctx = MockRpcContext.init(allocator);
    defer mock_ctx.deinit();

    const vtable = RpcVTable{
        .context = @ptrCast(&mock_ctx),
        .fetch_block_by_number = mockFetchByNumber,
        .fetch_block_by_hash = mockFetchByHash,
    };

    var cache = try ForkBlockCache.init(allocator, vtable, 1000);
    defer cache.deinit();

    try std.testing.expect(cache.isForkBlock(500));
    try std.testing.expect(cache.isForkBlock(1000));
    try std.testing.expect(!cache.isForkBlock(1001));
    try std.testing.expect(!cache.isForkBlock(2000));
}

test "ForkBlockCache - fetch by number (RPC hit)" {
    const allocator = std.testing.allocator;

    var mock_ctx = MockRpcContext.init(allocator);
    defer mock_ctx.deinit();

    // Add test block to mock RPC
    const genesis = try Block.genesis(1, allocator);
    try mock_ctx.addBlock(genesis);

    const vtable = RpcVTable{
        .context = @ptrCast(&mock_ctx),
        .fetch_block_by_number = mockFetchByNumber,
        .fetch_block_by_hash = mockFetchByHash,
    };

    var cache = try ForkBlockCache.init(allocator, vtable, 1000);
    defer cache.deinit();

    const block = cache.getBlockByNumber(0);
    try std.testing.expect(block != null);
    try std.testing.expectEqual(@as(u64, 0), block.?.header.number);
}

test "ForkBlockCache - fetch beyond fork returns null" {
    const allocator = std.testing.allocator;

    var mock_ctx = MockRpcContext.init(allocator);
    defer mock_ctx.deinit();

    const vtable = RpcVTable{
        .context = @ptrCast(&mock_ctx),
        .fetch_block_by_number = mockFetchByNumber,
        .fetch_block_by_hash = mockFetchByHash,
    };

    var cache = try ForkBlockCache.init(allocator, vtable, 100);
    defer cache.deinit();

    // Try to fetch block 500 (beyond fork at 100)
    const block = cache.getBlockByNumber(500);
    try std.testing.expect(block == null);
}

test "ForkBlockCache - fetch by hash (RPC hit)" {
    const allocator = std.testing.allocator;

    var mock_ctx = MockRpcContext.init(allocator);
    defer mock_ctx.deinit();

    const genesis = try Block.genesis(1, allocator);
    const genesis_hash = genesis.hash;
    try mock_ctx.addBlock(genesis);

    const vtable = RpcVTable{
        .context = @ptrCast(&mock_ctx),
        .fetch_block_by_number = mockFetchByNumber,
        .fetch_block_by_hash = mockFetchByHash,
    };

    var cache = try ForkBlockCache.init(allocator, vtable, 1000);
    defer cache.deinit();

    const block = cache.getBlockByHash(genesis_hash);
    try std.testing.expect(block != null);
    try std.testing.expectEqual(@as(u64, 0), block.?.header.number);
}

test "ForkBlockCache - cache persistence across fetches" {
    const allocator = std.testing.allocator;

    var mock_ctx = MockRpcContext.init(allocator);
    defer mock_ctx.deinit();

    const genesis = try Block.genesis(1, allocator);
    const genesis_hash = genesis.hash;
    try mock_ctx.addBlock(genesis);

    const vtable = RpcVTable{
        .context = @ptrCast(&mock_ctx),
        .fetch_block_by_number = mockFetchByNumber,
        .fetch_block_by_hash = mockFetchByHash,
    };

    var cache = try ForkBlockCache.init(allocator, vtable, 1000);
    defer cache.deinit();

    // First fetch (RPC)
    _ = cache.getBlockByNumber(0);

    // Check cache
    try std.testing.expect(cache.isCached(genesis_hash));
    try std.testing.expectEqual(@as(usize, 1), cache.cacheSize());
}
