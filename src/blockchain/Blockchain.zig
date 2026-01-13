//! Blockchain - Main orchestrator combining local storage and remote fork cache
//!
//! Provides unified block access across local and remote sources:
//! - Read flow: local store → fork cache → remote RPC
//! - Write flow: local store only (fork cache is read-only)
//! - Fork semantics: Blocks ≤ forkBlock from remote, > forkBlock local
//!
//! ## Architecture
//! - block_store: Local storage (canonical chain + orphans)
//! - fork_cache: Optional remote fetching (read-only)
//! - Unified read interface (transparent local/remote)
//!
//! ## Usage
//! ```zig
//! const Blockchain = @import("blockchain").Blockchain;
//!
//! var blockchain = try Blockchain.init(allocator, fork_cache);
//! defer blockchain.deinit();
//!
//! // Read (tries local first, then remote)
//! const block = blockchain.getBlockByNumber(12345);
//!
//! // Write (local only)
//! try blockchain.putBlock(block);
//!
//! // Set canonical head
//! try blockchain.setCanonicalHead(hash);
//! ```

const std = @import("std");
const primitives = @import("primitives");
const Block = primitives.Block;
const Hash = primitives.Hash;
const BlockStore = @import("BlockStore.zig").BlockStore;
const ForkBlockCache = @import("ForkBlockCache.zig").ForkBlockCache;

/// Blockchain - Unified block access (local + remote)
pub const Blockchain = struct {
    allocator: std.mem.Allocator,

    /// Local block storage
    block_store: BlockStore,

    /// Optional fork cache (remote fetching)
    fork_cache: ?*ForkBlockCache,

    pub fn init(allocator: std.mem.Allocator, fork_cache: ?*ForkBlockCache) !Blockchain {
        return .{
            .allocator = allocator,
            .block_store = try BlockStore.init(allocator),
            .fork_cache = fork_cache,
        };
    }

    pub fn deinit(self: *Blockchain) void {
        self.block_store.deinit();
    }

    // ========================================================================
    // Read Operations (local → fork cache → remote)
    // ========================================================================

    /// Get block by hash (tries local first, then fork cache)
    pub fn getBlockByHash(self: *Blockchain, hash: Hash.Hash) ?Block.Block {
        // Try local store first
        if (self.block_store.getBlock(hash)) |block| {
            return block;
        }

        // Try fork cache (if available)
        if (self.fork_cache) |cache| {
            return cache.getBlockByHash(hash);
        }

        return null;
    }

    /// Get block by number (tries local canonical first, then fork cache)
    pub fn getBlockByNumber(self: *Blockchain, number: u64) ?Block.Block {
        // Try local canonical chain first
        if (self.block_store.getBlockByNumber(number)) |block| {
            return block;
        }

        // Try fork cache (if available)
        if (self.fork_cache) |cache| {
            return cache.getBlockByNumber(number);
        }

        return null;
    }

    /// Get canonical hash for block number (local only)
    pub fn getCanonicalHash(self: *Blockchain, number: u64) ?Hash.Hash {
        return self.block_store.getCanonicalHash(number);
    }

    /// Check if block exists (local or fork cache)
    pub fn hasBlock(self: *Blockchain, hash: Hash.Hash) bool {
        // Check local
        if (self.block_store.hasBlock(hash)) {
            return true;
        }

        // Check fork cache
        if (self.fork_cache) |cache| {
            if (cache.isCached(hash)) {
                return true;
            }
        }

        return false;
    }

    /// Get current head block number (local canonical chain)
    pub fn getHeadBlockNumber(self: *Blockchain) ?u64 {
        return self.block_store.getHeadBlockNumber();
    }

    // ========================================================================
    // Write Operations (local only)
    // ========================================================================

    /// Put block in local storage (validates parent linkage)
    pub fn putBlock(self: *Blockchain, block: Block.Block) !void {
        try self.block_store.putBlock(block);
    }

    /// Set canonical head (makes block and ancestors canonical)
    pub fn setCanonicalHead(self: *Blockchain, head_hash: Hash.Hash) !void {
        try self.block_store.setCanonicalHead(head_hash);
    }

    // ========================================================================
    // Statistics
    // ========================================================================

    /// Get total blocks in local storage
    pub fn localBlockCount(self: *Blockchain) usize {
        return self.block_store.blockCount();
    }

    /// Get orphan count in local storage
    pub fn orphanCount(self: *Blockchain) usize {
        return self.block_store.orphanCount();
    }

    /// Get canonical chain length (local)
    pub fn canonicalChainLength(self: *Blockchain) usize {
        return self.block_store.canonicalChainLength();
    }

    /// Check if block is within fork boundary
    pub fn isForkBlock(self: *Blockchain, number: u64) bool {
        if (self.fork_cache) |cache| {
            return cache.isForkBlock(number);
        }
        return false;
    }
};

// ============================================================================
// Tests
// ============================================================================

test "Blockchain - init without fork cache" {
    const allocator = std.testing.allocator;
    var blockchain = try Blockchain.init(allocator, null);
    defer blockchain.deinit();

    try std.testing.expectEqual(@as(usize, 0), blockchain.localBlockCount());
}

test "Blockchain - put and get block (local only)" {
    const allocator = std.testing.allocator;
    var blockchain = try Blockchain.init(allocator, null);
    defer blockchain.deinit();

    const genesis = try Block.genesis(1, allocator);
    const genesis_hash = genesis.hash;

    try blockchain.putBlock(genesis);

    const retrieved = blockchain.getBlockByHash(genesis_hash);
    try std.testing.expect(retrieved != null);
    try std.testing.expectEqual(@as(u64, 0), retrieved.?.header.number);
}

test "Blockchain - get by number (local canonical)" {
    const allocator = std.testing.allocator;
    var blockchain = try Blockchain.init(allocator, null);
    defer blockchain.deinit();

    const genesis = try Block.genesis(1, allocator);
    try blockchain.putBlock(genesis);
    try blockchain.setCanonicalHead(genesis.hash);

    const retrieved = blockchain.getBlockByNumber(0);
    try std.testing.expect(retrieved != null);
    try std.testing.expectEqual(@as(u64, 0), retrieved.?.header.number);
}

test "Blockchain - set canonical head" {
    const allocator = std.testing.allocator;
    var blockchain = try Blockchain.init(allocator, null);
    defer blockchain.deinit();

    const genesis = try Block.genesis(1, allocator);
    try blockchain.putBlock(genesis);
    try blockchain.setCanonicalHead(genesis.hash);

    const head_number = blockchain.getHeadBlockNumber();
    try std.testing.expect(head_number != null);
    try std.testing.expectEqual(@as(u64, 0), head_number.?);
}

test "Blockchain - read flow with fork cache" {
    const allocator = std.testing.allocator;

    // Setup mock RPC
    const MockRpcContext = @import("ForkBlockCache.zig").MockRpcContext;
    var mock_ctx = MockRpcContext.init(allocator);
    defer mock_ctx.deinit();

    const fork_genesis = try Block.genesis(1, allocator);
    try mock_ctx.addBlock(fork_genesis);

    const vtable = @import("ForkBlockCache.zig").RpcVTable{
        .context = @ptrCast(&mock_ctx),
        .fetch_block_by_number = @import("ForkBlockCache.zig").mockFetchByNumber,
        .fetch_block_by_hash = @import("ForkBlockCache.zig").mockFetchByHash,
    };

    var fork_cache = try ForkBlockCache.init(allocator, vtable, 1000);
    defer fork_cache.deinit();

    var blockchain = try Blockchain.init(allocator, &fork_cache);
    defer blockchain.deinit();

    // Fetch from fork cache (not in local)
    const block = blockchain.getBlockByNumber(0);
    try std.testing.expect(block != null);
    try std.testing.expectEqual(@as(u64, 0), block.?.header.number);
}

test "Blockchain - local takes precedence over fork cache" {
    const allocator = std.testing.allocator;

    // Setup mock RPC
    const MockRpcContext = @import("ForkBlockCache.zig").MockRpcContext;
    var mock_ctx = MockRpcContext.init(allocator);
    defer mock_ctx.deinit();

    const fork_genesis = try Block.genesis(1, allocator);
    try mock_ctx.addBlock(fork_genesis);

    const vtable = @import("ForkBlockCache.zig").RpcVTable{
        .context = @ptrCast(&mock_ctx),
        .fetch_block_by_number = @import("ForkBlockCache.zig").mockFetchByNumber,
        .fetch_block_by_hash = @import("ForkBlockCache.zig").mockFetchByHash,
    };

    var fork_cache = try ForkBlockCache.init(allocator, vtable, 1000);
    defer fork_cache.deinit();

    var blockchain = try Blockchain.init(allocator, &fork_cache);
    defer blockchain.deinit();

    // Put local genesis
    const local_genesis = try Block.genesis(1, allocator);
    try blockchain.putBlock(local_genesis);
    try blockchain.setCanonicalHead(local_genesis.hash);

    // Fetch should return local (not fork cache)
    const block = blockchain.getBlockByNumber(0);
    try std.testing.expect(block != null);
    try std.testing.expectEqual(@as(u64, 0), block.?.header.number);

    // Hash should match local
    try std.testing.expectEqualSlices(u8, &local_genesis.hash, &block.?.hash);
}

test "Blockchain - sequential blocks build local chain" {
    const allocator = std.testing.allocator;
    var blockchain = try Blockchain.init(allocator, null);
    defer blockchain.deinit();

    // Genesis
    const genesis = try Block.genesis(1, allocator);
    try blockchain.putBlock(genesis);
    try blockchain.setCanonicalHead(genesis.hash);

    // Block 1
    var header1 = primitives.BlockHeader.init();
    header1.number = 1;
    header1.parent_hash = genesis.hash;
    const body1 = primitives.BlockBody.init();
    const block1 = try Block.from(&header1, &body1, allocator);

    try blockchain.putBlock(block1);
    try blockchain.setCanonicalHead(block1.hash);

    try std.testing.expectEqual(@as(usize, 2), blockchain.localBlockCount());
    try std.testing.expectEqual(@as(usize, 2), blockchain.canonicalChainLength());
    try std.testing.expectEqual(@as(usize, 0), blockchain.orphanCount());

    const head = blockchain.getHeadBlockNumber();
    try std.testing.expect(head != null);
    try std.testing.expectEqual(@as(u64, 1), head.?);
}

test "Blockchain - statistics methods" {
    const allocator = std.testing.allocator;
    var blockchain = try Blockchain.init(allocator, null);
    defer blockchain.deinit();

    const genesis = try Block.genesis(1, allocator);
    try blockchain.putBlock(genesis);
    try blockchain.setCanonicalHead(genesis.hash);

    try std.testing.expectEqual(@as(usize, 1), blockchain.localBlockCount());
    try std.testing.expectEqual(@as(usize, 1), blockchain.canonicalChainLength());
    try std.testing.expectEqual(@as(usize, 0), blockchain.orphanCount());
}
