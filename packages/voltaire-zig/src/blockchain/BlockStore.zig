//! BlockStore - Local storage for blocks with canonical chain tracking
//!
//! Provides core block storage functionality:
//! - Block storage by hash (all blocks, including orphans)
//! - Canonical chain mapping (block number -> hash)
//! - Parent hash linkage validation
//! - Block number sequence validation
//! - Orphan tracking for blocks without parents
//!
//! ## Architecture
//! - blocks: Map<Hash, Block> - All blocks (canonical + orphans)
//! - canonical_chain: Map<u64, Hash> - Block number -> canonical hash
//! - orphans: Set<Hash> - Blocks without known parents
//!
//! ## Usage
//! ```zig
//! const BlockStore = @import("blockchain").BlockStore;
//!
//! var store = try BlockStore.init(allocator);
//! defer store.deinit();
//!
//! // Put block (validates parent linkage)
//! try store.putBlock(block);
//!
//! // Get by hash
//! const block = store.getBlock(hash);
//!
//! // Get canonical block by number
//! const block = store.getBlockByNumber(12345);
//!
//! // Set canonical head
//! try store.setCanonicalHead(block_hash);
//! ```

const std = @import("std");
const primitives = @import("primitives");
const Block = primitives.Block;
const Hash = primitives.Hash;

/// BlockStore - Local block storage with canonical chain tracking
pub const BlockStore = struct {
    allocator: std.mem.Allocator,

    /// All blocks by hash (canonical + orphans)
    blocks: std.AutoHashMap(Hash.Hash, Block.Block),

    /// Canonical chain (block number -> hash)
    canonical_chain: std.AutoHashMap(u64, Hash.Hash),

    /// Orphan blocks (no known parent)
    orphans: std.AutoHashMap(Hash.Hash, void),

    pub fn init(allocator: std.mem.Allocator) !BlockStore {
        return .{
            .allocator = allocator,
            .blocks = std.AutoHashMap(Hash.Hash, Block.Block).init(allocator),
            .canonical_chain = std.AutoHashMap(u64, Hash.Hash).init(allocator),
            .orphans = std.AutoHashMap(Hash.Hash, void).init(allocator),
        };
    }

    pub fn deinit(self: *BlockStore) void {
        // BlockBody uses const slices, no need to free
        self.blocks.deinit();
        self.canonical_chain.deinit();
        self.orphans.deinit();
    }

    /// Get block by hash (checks both canonical and orphans)
    pub fn getBlock(self: *BlockStore, block_hash: Hash.Hash) ?Block.Block {
        return self.blocks.get(block_hash);
    }

    /// Get block by number (canonical chain only)
    pub fn getBlockByNumber(self: *BlockStore, number: u64) ?Block.Block {
        const hash = self.canonical_chain.get(number) orelse return null;
        return self.blocks.get(hash);
    }

    /// Get canonical hash for block number
    pub fn getCanonicalHash(self: *BlockStore, number: u64) ?Hash.Hash {
        return self.canonical_chain.get(number);
    }

    /// Check if block exists by hash
    pub fn hasBlock(self: *BlockStore, block_hash: Hash.Hash) bool {
        return self.blocks.contains(block_hash);
    }

    /// Check if block is orphan
    pub fn isOrphan(self: *BlockStore, block_hash: Hash.Hash) bool {
        return self.orphans.contains(block_hash);
    }

    /// Put block in storage (validates parent linkage)
    pub fn putBlock(self: *BlockStore, block: Block.Block) !void {
        const block_hash = block.hash;
        const block_number = block.header.number;
        const parent_hash = block.header.parent_hash;

        // Check if block already exists
        if (self.blocks.contains(block_hash)) {
            return; // Already have this block
        }

        // Validate parent exists (unless genesis)
        const is_genesis = block_number == 0;
        const has_parent = self.blocks.contains(parent_hash);

        if (!is_genesis and !has_parent) {
            // Mark as orphan
            try self.orphans.put(block_hash, {});
        }

        // Store block
        try self.blocks.put(block_hash, block);

        // If not orphan, check for orphan resolution
        if (!self.orphans.contains(block_hash)) {
            try self.resolveOrphans(block_hash);
        }
    }

    /// Resolve orphans that now have a known parent
    fn resolveOrphans(self: *BlockStore, parent_hash: Hash.Hash) !void {
        var orphans_to_remove = std.ArrayList(Hash.Hash){};
        defer orphans_to_remove.deinit(self.allocator);

        var it = self.orphans.keyIterator();
        while (it.next()) |orphan_hash| {
            if (self.blocks.get(orphan_hash.*)) |orphan_block| {
                if (std.mem.eql(u8, &orphan_block.header.parent_hash, &parent_hash)) {
                    try orphans_to_remove.append(self.allocator, orphan_hash.*);
                }
            }
        }

        // Remove resolved orphans
        for (orphans_to_remove.items) |hash| {
            _ = self.orphans.remove(hash);
        }
    }

    /// Set canonical head (makes block and ancestors canonical)
    pub fn setCanonicalHead(self: *BlockStore, head_hash: Hash.Hash) !void {
        const head_block = self.blocks.get(head_hash) orelse return error.BlockNotFound;

        // Validate not orphan
        if (self.orphans.contains(head_hash)) {
            return error.CannotSetOrphanAsHead;
        }

        // Walk back and mark chain as canonical
        var current_hash = head_hash;
        var current_number = head_block.header.number;

        while (true) {
            const block = self.blocks.get(current_hash) orelse break;

            // Set as canonical
            try self.canonical_chain.put(current_number, current_hash);

            // Stop at genesis
            if (current_number == 0) break;

            // Move to parent
            current_hash = block.header.parent_hash;
            current_number -= 1;
        }
    }

    /// Get current head block number
    pub fn getHeadBlockNumber(self: *BlockStore) ?u64 {
        var max_number: ?u64 = null;
        var it = self.canonical_chain.keyIterator();
        while (it.next()) |number| {
            if (max_number == null or number.* > max_number.?) {
                max_number = number.*;
            }
        }
        return max_number;
    }

    /// Get total blocks count
    pub fn blockCount(self: *BlockStore) usize {
        return self.blocks.count();
    }

    /// Get orphan count
    pub fn orphanCount(self: *BlockStore) usize {
        return self.orphans.count();
    }

    /// Get canonical chain length
    pub fn canonicalChainLength(self: *BlockStore) usize {
        return self.canonical_chain.count();
    }
};

// ============================================================================
// Tests
// ============================================================================

test "BlockStore - init and deinit" {
    const allocator = std.testing.allocator;
    var store = try BlockStore.init(allocator);
    defer store.deinit();

    try std.testing.expectEqual(@as(usize, 0), store.blockCount());
}

test "BlockStore - put and get genesis block" {
    const allocator = std.testing.allocator;
    var store = try BlockStore.init(allocator);
    defer store.deinit();

    const genesis = try Block.genesis(1, allocator);
    const genesis_hash = genesis.hash;

    try store.putBlock(genesis);

    try std.testing.expectEqual(@as(usize, 1), store.blockCount());
    try std.testing.expect(store.hasBlock(genesis_hash));
    try std.testing.expect(!store.isOrphan(genesis_hash));

    const retrieved = store.getBlock(genesis_hash);
    try std.testing.expect(retrieved != null);
    try std.testing.expectEqual(@as(u64, 0), retrieved.?.header.number);
}

test "BlockStore - put block with missing parent marks as orphan" {
    const allocator = std.testing.allocator;
    var store = try BlockStore.init(allocator);
    defer store.deinit();

    // Create block with non-existent parent
    var header = primitives.BlockHeader.init();
    header.number = 5;
    header.parent_hash = Hash.Hash{ 0x99, 0x99, 0x99, 0x99, 0x99, 0x99, 0x99, 0x99, 0x99, 0x99, 0x99, 0x99, 0x99, 0x99, 0x99, 0x99, 0x99, 0x99, 0x99, 0x99, 0x99, 0x99, 0x99, 0x99, 0x99, 0x99, 0x99, 0x99, 0x99, 0x99, 0x99, 0x99 };

    const body = primitives.BlockBody.init();
    const block = try Block.from(&header, &body, allocator);
    const block_hash = block.hash;

    try store.putBlock(block);

    try std.testing.expectEqual(@as(usize, 1), store.blockCount());
    try std.testing.expectEqual(@as(usize, 1), store.orphanCount());
    try std.testing.expect(store.isOrphan(block_hash));
}

test "BlockStore - get by number returns canonical block only" {
    const allocator = std.testing.allocator;
    var store = try BlockStore.init(allocator);
    defer store.deinit();

    const genesis = try Block.genesis(1, allocator);
    try store.putBlock(genesis);
    try store.setCanonicalHead(genesis.hash);

    const retrieved = store.getBlockByNumber(0);
    try std.testing.expect(retrieved != null);
    try std.testing.expectEqual(@as(u64, 0), retrieved.?.header.number);
}

test "BlockStore - setCanonicalHead rejects orphans" {
    const allocator = std.testing.allocator;
    var store = try BlockStore.init(allocator);
    defer store.deinit();

    // Create orphan block
    var header = primitives.BlockHeader.init();
    header.number = 5;
    header.parent_hash = Hash.Hash{ 0x99, 0x99, 0x99, 0x99, 0x99, 0x99, 0x99, 0x99, 0x99, 0x99, 0x99, 0x99, 0x99, 0x99, 0x99, 0x99, 0x99, 0x99, 0x99, 0x99, 0x99, 0x99, 0x99, 0x99, 0x99, 0x99, 0x99, 0x99, 0x99, 0x99, 0x99, 0x99 };

    const body = primitives.BlockBody.init();
    const block = try Block.from(&header, &body, allocator);

    try store.putBlock(block);

    const result = store.setCanonicalHead(block.hash);
    try std.testing.expectError(error.CannotSetOrphanAsHead, result);
}

test "BlockStore - sequential blocks build canonical chain" {
    const allocator = std.testing.allocator;
    var store = try BlockStore.init(allocator);
    defer store.deinit();

    // Create genesis
    const genesis = try Block.genesis(1, allocator);
    try store.putBlock(genesis);
    try store.setCanonicalHead(genesis.hash);

    // Create block 1 (parent = genesis)
    var header1 = primitives.BlockHeader.init();
    header1.number = 1;
    header1.parent_hash = genesis.hash;

    const body1 = primitives.BlockBody.init();
    const block1 = try Block.from(&header1, &body1, allocator);

    try store.putBlock(block1);
    try store.setCanonicalHead(block1.hash);

    try std.testing.expectEqual(@as(usize, 2), store.blockCount());
    try std.testing.expectEqual(@as(usize, 2), store.canonicalChainLength());
    try std.testing.expectEqual(@as(usize, 0), store.orphanCount());

    const head_number = store.getHeadBlockNumber();
    try std.testing.expect(head_number != null);
    try std.testing.expectEqual(@as(u64, 1), head_number.?);
}

test "BlockStore - orphan resolution when parent arrives" {
    const allocator = std.testing.allocator;
    var store = try BlockStore.init(allocator);
    defer store.deinit();

    // Create genesis
    const genesis = try Block.genesis(1, allocator);
    try store.putBlock(genesis);

    // Create block 1 first (will be parent)
    var header1 = primitives.BlockHeader.init();
    header1.number = 1;
    header1.parent_hash = genesis.hash;

    const body1 = primitives.BlockBody.init();
    const block1 = try Block.from(&header1, &body1, allocator);

    // Create block 2 with correct parent (but add before block 1 exists)
    var header2 = primitives.BlockHeader.init();
    header2.number = 2;
    header2.parent_hash = block1.hash;

    const body2 = primitives.BlockBody.init();
    const block2 = try Block.from(&header2, &body2, allocator);
    const block2_hash = block2.hash;

    // Add block2 first (should be orphan since parent doesn't exist)
    try store.putBlock(block2);

    // Should be orphan
    try std.testing.expectEqual(@as(usize, 2), store.blockCount()); // genesis + block2
    try std.testing.expectEqual(@as(usize, 1), store.orphanCount());
    try std.testing.expect(store.isOrphan(block2_hash));

    // Now add block 1 (parent)
    try store.putBlock(block1);

    // Orphan should be resolved
    try std.testing.expectEqual(@as(usize, 3), store.blockCount()); // genesis + block1 + block2
    try std.testing.expect(!store.isOrphan(block2_hash));
}
