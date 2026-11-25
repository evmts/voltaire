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

    /// Initialize a local-only blockchain with a genesis block.
    pub fn initWithGenesis(allocator: std.mem.Allocator, chain_id: u64) !Blockchain {
        var chain = try Blockchain.init(allocator, null);
        const genesis = try Block.genesis(chain_id, allocator);
        try chain.putBlock(genesis);
        try chain.setCanonicalHead(genesis.hash);
        return chain;
    }

    pub fn deinit(self: *Blockchain) void {
        self.block_store.deinit();
    }

    // ========================================================================
    // Read Operations (local → fork cache → remote)
    // ========================================================================

    /// Get block by hash (tries local first, then fork cache)
    pub fn getBlockByHash(self: *Blockchain, hash: Hash.Hash) !?Block.Block {
        // Try local store first
        if (self.block_store.getBlock(hash)) |block| {
            return block;
        }

        // Try fork cache (if available)
        if (self.fork_cache) |cache| {
            return try cache.getBlockByHash(hash);
        }

        return null;
    }

    /// Get block by number (tries local canonical first, then fork cache)
    pub fn getBlockByNumber(self: *Blockchain, number: u64) !?Block.Block {
        // Try local canonical chain first
        if (self.block_store.getBlockByNumber(number)) |block| {
            return block;
        }

        // Try fork cache (if available)
        if (self.fork_cache) |cache| {
            return try cache.getBlockByNumber(number);
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

    pub const GetCanonicalHeadBlockError = error{MissingCanonicalHead};

    /// Returns the canonical head block (local only).
    pub fn getCanonicalHeadBlock(self: *Blockchain) GetCanonicalHeadBlockError!Block.Block {
        const head_number = self.getHeadBlockNumber() orelse return error.MissingCanonicalHead;
        const head_hash = self.getCanonicalHash(head_number) orelse return error.MissingCanonicalHead;
        return self.getBlockLocal(head_hash) orelse error.MissingCanonicalHead;
    }

    pub const BlockTag = enum { latest, earliest, pending };

    pub const GetBlockByTagError = error{
        MissingCanonicalHead,
        MissingGenesisBlock,
        NotImplemented,
    };

    /// Returns a block by tag (local only). Pending is not implemented.
    pub fn getBlockByTag(self: *Blockchain, tag: BlockTag) GetBlockByTagError!Block.Block {
        return switch (tag) {
            .latest => self.getCanonicalHeadBlock() catch error.MissingCanonicalHead,
            .earliest => self.getBlockByNumberLocal(0) orelse error.MissingGenesisBlock,
            .pending => error.NotImplemented,
        };
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

    // ========================================================================
    // Local Access (no fork-cache, no allocations)
    // ========================================================================

    /// Returns a block by hash from the local store only (no fork-cache fetch).
    pub fn getBlockLocal(self: *Blockchain, hash: Hash.Hash) ?Block.Block {
        return self.block_store.getBlock(hash);
    }

    /// Returns a canonical block by number from the local store only.
    pub fn getBlockByNumberLocal(self: *Blockchain, number: u64) ?Block.Block {
        const h = self.getCanonicalHash(number) orelse return null;
        return self.getBlockLocal(h);
    }

    // ========================================================================
    // Canonicality Checks
    // ========================================================================

    /// Returns true if the given hash is canonical at its block number (local-only).
    pub fn isCanonical(self: *Blockchain, hash: Hash.Hash) bool {
        const local = self.getBlockLocal(hash) orelse return false;
        const number = local.header.number;
        const canonical = self.getCanonicalHash(number) orelse return false;
        return Hash.equals(&canonical, &hash);
    }

    fn isCanonicalAt(self: *Blockchain, number: u64, hash: Hash.Hash) bool {
        const canonical = self.getCanonicalHash(number) orelse return false;
        return Hash.equals(&canonical, &hash);
    }

    pub const IsCanonicalStrictError = error{MissingBlock};

    /// Strict local canonicality check with optional missing-hash error.
    pub fn isCanonicalStrict(
        self: *Blockchain,
        hash: Hash.Hash,
        throw_on_missing_hash: bool,
    ) IsCanonicalStrictError!bool {
        const local = self.getBlockLocal(hash) orelse {
            if (throw_on_missing_hash) return error.MissingBlock;
            return false;
        };
        return self.isCanonicalAt(local.header.number, hash);
    }

    /// Returns true if the given hash is canonical, allowing fork-cache fetches.
    pub fn isCanonicalOrFetch(self: *Blockchain, hash: Hash.Hash) !bool {
        const maybe_block = try self.getBlockByHash(hash);
        const block = maybe_block orelse return false;
        const number = block.header.number;
        const canonical = self.getCanonicalHash(number) orelse return false;
        return Hash.equals(&canonical, &hash);
    }

    // ========================================================================
    // Parent / Ancestor Helpers
    // ========================================================================

    pub const ParentHeaderError = error{MissingParentHeader};

    /// Returns the parent header from the local store or a typed error.
    pub fn parentHeaderLocal(
        self: *Blockchain,
        header: *const primitives.BlockHeader.BlockHeader,
    ) ParentHeaderError!primitives.BlockHeader.BlockHeader {
        const parent = self.getBlockLocal(header.parent_hash) orelse
            return error.MissingParentHeader;
        return parent.header;
    }

    const AncestorLookupError = error{
        MissingStartBlock,
        MissingAncestorBlock,
        MalformedAncestorBlock,
    };

    fn ancestorHashLocal(
        self: *Blockchain,
        start: Hash.Hash,
        distance: u64,
    ) AncestorLookupError!Hash.Hash {
        var current_block = self.getBlockLocal(start) orelse return error.MissingStartBlock;
        if (distance == 0) return current_block.hash;

        var i: u64 = 0;
        while (i < distance) : (i += 1) {
            if (current_block.header.number == 0) return error.MissingAncestorBlock;

            const parent_hash = current_block.header.parent_hash;
            const parent_block = self.getBlockLocal(parent_hash) orelse return error.MissingAncestorBlock;
            if (parent_block.header.number != current_block.header.number - 1) {
                return error.MalformedAncestorBlock;
            }

            current_block = parent_block;
        }
        return current_block.hash;
    }

    // ========================================================================
    // BLOCKHASH Helpers
    // ========================================================================

    pub const BlockHashByNumberStrictError = error{
        MissingTipBlock,
        InconsistentTipContext,
        MissingAncestorBlock,
        MalformedAncestorBlock,
    };

    /// Returns the `BLOCKHASH` value for `number` in an execution context (local-only).
    /// Returns `null` whenever the hash cannot be resolved in-range.
    pub fn blockHashByNumberLocal(
        self: *Blockchain,
        tip_hash: Hash.Hash,
        execution_block_number: u64,
        number: u64,
    ) ?Hash.Hash {
        return self.blockHashByNumberLocalStrict(
            tip_hash,
            execution_block_number,
            number,
        ) catch |err| switch (err) {
            error.MissingTipBlock => null,
            error.InconsistentTipContext => null,
            error.MissingAncestorBlock => null,
            error.MalformedAncestorBlock => null,
        };
    }

    /// Strict local `BLOCKHASH` helper returning typed errors.
    pub fn blockHashByNumberLocalStrict(
        self: *Blockchain,
        tip_hash: Hash.Hash,
        execution_block_number: u64,
        number: u64,
    ) BlockHashByNumberStrictError!?Hash.Hash {
        if (number >= execution_block_number) return null;
        if (execution_block_number == 0) return null;

        const depth_from_execution = execution_block_number - number;
        if (depth_from_execution > 256) return null;

        const tip_block = self.getBlockLocal(tip_hash) orelse return error.MissingTipBlock;
        const expected_tip_number = execution_block_number - 1;
        if (tip_block.header.number != expected_tip_number) return error.InconsistentTipContext;

        const distance_from_tip = depth_from_execution - 1;
        return self.ancestorHashLocal(tip_hash, distance_from_tip) catch |err| switch (err) {
            error.MissingStartBlock => error.MissingTipBlock,
            error.MissingAncestorBlock => error.MissingAncestorBlock,
            error.MalformedAncestorBlock => error.MalformedAncestorBlock,
        };
    }

    // ========================================================================
    // Recent Block Hashes
    // ========================================================================

    pub const RecentBlockHashesError = error{
        MissingTipBlock,
        MissingAncestorBlock,
        MalformedAncestorBlock,
    };

    /// Collects up to 256 recent block hashes from local storage in spec order.
    pub fn last256BlockHashesLocal(
        self: *Blockchain,
        tip_hash: Hash.Hash,
        out: *[256]Hash.Hash,
    ) RecentBlockHashesError![]const Hash.Hash {
        const tip_block = self.getBlockLocal(tip_hash) orelse return error.MissingTipBlock;
        const expected_len: usize = if (tip_block.header.number >= 255)
            256
        else
            @intCast(tip_block.header.number + 1);

        var write_start: usize = out.len;
        var cursor_hash = tip_hash;
        var cursor_block = tip_block;
        var written: usize = 0;

        while (written < expected_len) : (written += 1) {
            write_start -= 1;
            out[write_start] = cursor_hash;

            if (written + 1 == expected_len) break;
            if (cursor_block.header.number == 0) return error.MissingAncestorBlock;

            const expected_parent_number = cursor_block.header.number - 1;
            cursor_hash = cursor_block.header.parent_hash;
            cursor_block = self.getBlockLocal(cursor_hash) orelse return error.MissingAncestorBlock;
            if (cursor_block.header.number != expected_parent_number) return error.MalformedAncestorBlock;
        }

        return out[write_start..];
    }

    pub const Last256BlockHashesFromHeadError = RecentBlockHashesError || error{MissingCanonicalHead};

    /// Collects up to 256 recent block hashes from the canonical head (local only).
    pub fn last256BlockHashesLocalFromCanonicalHead(
        self: *Blockchain,
        out: *[256]Hash.Hash,
    ) Last256BlockHashesFromHeadError![]const Hash.Hash {
        const head = self.getCanonicalHeadBlock() catch return error.MissingCanonicalHead;
        return self.last256BlockHashesLocal(head.hash, out);
    }

    // ========================================================================
    // Common Ancestor
    // ========================================================================

    pub const CommonAncestorError = error{
        MissingBlockA,
        MissingBlockB,
        MissingAncestorBlock,
        MalformedAncestorBlock,
    };

    /// Finds the lowest common ancestor hash of two blocks using local store only.
    pub fn commonAncestorHashLocal(
        self: *Blockchain,
        a: Hash.Hash,
        b: Hash.Hash,
    ) ?Hash.Hash {
        return self.commonAncestorHashLocalStrict(a, b) catch |err| switch (err) {
            error.MissingBlockA => null,
            error.MissingBlockB => null,
            error.MissingAncestorBlock => null,
            error.MalformedAncestorBlock => null,
        };
    }

    /// Strict local common-ancestor helper returning typed errors.
    pub fn commonAncestorHashLocalStrict(
        self: *Blockchain,
        a: Hash.Hash,
        b: Hash.Hash,
    ) CommonAncestorError!?Hash.Hash {
        const na_block = self.getBlockLocal(a) orelse return error.MissingBlockA;
        const nb_block = self.getBlockLocal(b) orelse return error.MissingBlockB;

        if (Hash.equals(&a, &b)) return a;

        var ha = na_block.header.number;
        var hb = nb_block.header.number;
        var ah = a;
        var bh = b;

        while (ha > hb) : (ha -= 1) {
            const blk = self.getBlockLocal(ah) orelse return error.MissingAncestorBlock;
            if (blk.header.number != ha) return error.MalformedAncestorBlock;
            if (ha == 0) return null;
            ah = blk.header.parent_hash;
        }
        while (hb > ha) : (hb -= 1) {
            const blk = self.getBlockLocal(bh) orelse return error.MissingAncestorBlock;
            if (blk.header.number != hb) return error.MalformedAncestorBlock;
            if (hb == 0) return null;
            bh = blk.header.parent_hash;
        }

        var level = ha;
        const remaining_hops_with_genesis, const hops_overflow = @addWithOverflow(ha, 1);
        if (hops_overflow != 0) return error.MalformedAncestorBlock;
        var remaining_hops = remaining_hops_with_genesis;
        while (remaining_hops > 0) : (remaining_hops -= 1) {
            const ab = self.getBlockLocal(ah) orelse return error.MissingAncestorBlock;
            const bb = self.getBlockLocal(bh) orelse return error.MissingAncestorBlock;
            if (ab.header.number != level or bb.header.number != level) return error.MalformedAncestorBlock;
            if (Hash.equals(&ah, &bh)) return ah;
            if (level == 0) return null;
            ah = ab.header.parent_hash;
            bh = bb.header.parent_hash;
            level -= 1;
        }
        return null;
    }

    // ========================================================================
    // Canonical Divergence & Reorg Depth
    // ========================================================================

    const CanonicalHeadSnapshotError = error{
        MissingCanonicalHash,
        MissingCanonicalHeadBlock,
        MalformedCanonicalHead,
    };

    fn canonicalHeadHashSnapshotLocal(self: *Blockchain) CanonicalHeadSnapshotError!?Hash.Hash {
        const number = self.getHeadBlockNumber() orelse return null;
        const canonical = self.getCanonicalHash(number) orelse return error.MissingCanonicalHash;
        const block = self.getBlockLocal(canonical) orelse return error.MissingCanonicalHeadBlock;
        if (block.header.number != number) return error.MalformedCanonicalHead;
        return canonical;
    }

    pub const CanonicalDivergenceError = CanonicalHeadSnapshotError || CommonAncestorError || error{
        MissingCanonicalHead,
        MissingCommonAncestor,
    };

    /// Returns whether `candidate_head` diverges from the current canonical head.
    pub fn hasCanonicalDivergenceLocal(
        self: *Blockchain,
        candidate_head: Hash.Hash,
    ) CanonicalDivergenceError!bool {
        const canonical_head = (try self.canonicalHeadHashSnapshotLocal()) orelse return error.MissingCanonicalHead;

        if (Hash.equals(&canonical_head, &candidate_head)) return false;

        const ancestor = (try self.commonAncestorHashLocalStrict(canonical_head, candidate_head)) orelse
            return error.MissingCommonAncestor;
        if (Hash.equals(&ancestor, &canonical_head)) return false;
        if (Hash.equals(&ancestor, &candidate_head)) return false;
        return true;
    }

    const ReorgDepthContext = struct {
        canonical_head_number: u64,
        candidate_head_number: u64,
        ancestor_number: u64,
    };

    const ReorgDepthContextError = CanonicalHeadSnapshotError || CommonAncestorError || error{
        MissingCanonicalHead,
        MissingCanonicalHeadBlock,
        MissingCandidateHeadBlock,
        MissingCommonAncestor,
        MissingCommonAncestorBlock,
    };

    fn reorgDepthContextLocal(
        self: *Blockchain,
        candidate_head: Hash.Hash,
    ) ReorgDepthContextError!ReorgDepthContext {
        const canonical_head = (try self.canonicalHeadHashSnapshotLocal()) orelse return error.MissingCanonicalHead;
        const canonical_head_block = self.getBlockLocal(canonical_head) orelse return error.MissingCanonicalHeadBlock;
        const candidate_head_block = self.getBlockLocal(candidate_head) orelse return error.MissingCandidateHeadBlock;
        const ancestor = (try self.commonAncestorHashLocalStrict(canonical_head, candidate_head)) orelse
            return error.MissingCommonAncestor;
        const ancestor_block = self.getBlockLocal(ancestor) orelse return error.MissingCommonAncestorBlock;

        return .{
            .canonical_head_number = canonical_head_block.header.number,
            .candidate_head_number = candidate_head_block.header.number,
            .ancestor_number = ancestor_block.header.number,
        };
    }

    pub const ReorgDepthError = ReorgDepthContextError || error{MalformedReorgContext};

    fn reorgDepthFromAncestor(descendant_number: u64, ancestor_number: u64) ReorgDepthError!u64 {
        if (ancestor_number > descendant_number) return error.MalformedReorgContext;
        return descendant_number - ancestor_number;
    }

    /// Returns local-only reorg depth from canonical head to common ancestor.
    pub fn canonicalReorgDepthLocal(
        self: *Blockchain,
        candidate_head: Hash.Hash,
    ) ReorgDepthError!u64 {
        const ctx = try self.reorgDepthContextLocal(candidate_head);
        return reorgDepthFromAncestor(ctx.canonical_head_number, ctx.ancestor_number);
    }

    /// Returns local-only candidate-branch depth from candidate head to common ancestor.
    pub fn candidateReorgDepthLocal(
        self: *Blockchain,
        candidate_head: Hash.Hash,
    ) ReorgDepthError!u64 {
        const ctx = try self.reorgDepthContextLocal(candidate_head);
        return reorgDepthFromAncestor(ctx.candidate_head_number, ctx.ancestor_number);
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

    const retrieved = try blockchain.getBlockByHash(genesis_hash);
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

    const retrieved = try blockchain.getBlockByNumber(0);
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

    var fork_cache = try ForkBlockCache.init(allocator, 1000);
    defer fork_cache.deinit();

    var blockchain = try Blockchain.init(allocator, &fork_cache);
    defer blockchain.deinit();

    try std.testing.expectError(error.RpcPending, blockchain.getBlockByNumber(0));

    const request = fork_cache.nextRequest() orelse {
        try std.testing.expect(false);
        return;
    };
    const hash_hex = "0x" ++ (@as(*const [(32) * 2]u8, @ptrCast(&@as([32][2]u8, @splat("11".*)))));
    const response = try std.fmt.allocPrint(allocator, "{{\"hash\":\"{s}\",\"number\":\"0x0\"}}", .{hash_hex});
    defer allocator.free(response);
    try fork_cache.continueRequest(request.id, response);

    const block = try blockchain.getBlockByNumber(0);
    try std.testing.expect(block != null);
    try std.testing.expectEqual(@as(u64, 0), block.?.header.number);
}

test "Blockchain - local takes precedence over fork cache" {
    const allocator = std.testing.allocator;

    var fork_cache = try ForkBlockCache.init(allocator, 1000);
    defer fork_cache.deinit();

    var blockchain = try Blockchain.init(allocator, &fork_cache);
    defer blockchain.deinit();

    // Put local genesis
    const local_genesis = try Block.genesis(1, allocator);
    try blockchain.putBlock(local_genesis);
    try blockchain.setCanonicalHead(local_genesis.hash);

    // Fetch should return local (not fork cache)
    const block = try blockchain.getBlockByNumber(0);
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

// ============================================================================
// Local Access Tests
// ============================================================================

test "Blockchain - getBlockLocal returns null for missing" {
    const allocator = std.testing.allocator;
    var blockchain = try Blockchain.init(allocator, null);
    defer blockchain.deinit();

    try std.testing.expect(blockchain.getBlockLocal(Hash.ZERO) == null);
}

test "Blockchain - getBlockLocal returns stored block" {
    const allocator = std.testing.allocator;
    var blockchain = try Blockchain.init(allocator, null);
    defer blockchain.deinit();

    const genesis = try Block.genesis(1, allocator);
    try blockchain.putBlock(genesis);

    const result = blockchain.getBlockLocal(genesis.hash);
    try std.testing.expect(result != null);
    try std.testing.expectEqualSlices(u8, &genesis.hash, &result.?.hash);
}

test "Blockchain - getBlockByNumberLocal returns null when not canonical" {
    const allocator = std.testing.allocator;
    var blockchain = try Blockchain.init(allocator, null);
    defer blockchain.deinit();

    const genesis = try Block.genesis(1, allocator);
    try blockchain.putBlock(genesis);

    try std.testing.expect(blockchain.getBlockByNumberLocal(0) == null);
}

test "Blockchain - getBlockByNumberLocal returns canonical block" {
    const allocator = std.testing.allocator;
    var blockchain = try Blockchain.init(allocator, null);
    defer blockchain.deinit();

    const genesis = try Block.genesis(1, allocator);
    try blockchain.putBlock(genesis);
    try blockchain.setCanonicalHead(genesis.hash);

    const result = blockchain.getBlockByNumberLocal(0);
    try std.testing.expect(result != null);
    try std.testing.expectEqualSlices(u8, &genesis.hash, &result.?.hash);
}

// ============================================================================
// Canonicality Tests
// ============================================================================

test "Blockchain - isCanonical returns false for missing hash" {
    const allocator = std.testing.allocator;
    var blockchain = try Blockchain.init(allocator, null);
    defer blockchain.deinit();

    try std.testing.expect(!blockchain.isCanonical(Hash.ZERO));
}

test "Blockchain - isCanonical returns true for canonical block" {
    const allocator = std.testing.allocator;
    var blockchain = try Blockchain.init(allocator, null);
    defer blockchain.deinit();

    const genesis = try Block.genesis(1, allocator);
    try blockchain.putBlock(genesis);
    try blockchain.setCanonicalHead(genesis.hash);

    try std.testing.expect(blockchain.isCanonical(genesis.hash));
}

test "Blockchain - isCanonicalStrict returns error for missing with throw" {
    const allocator = std.testing.allocator;
    var blockchain = try Blockchain.init(allocator, null);
    defer blockchain.deinit();

    try std.testing.expectError(error.MissingBlock, blockchain.isCanonicalStrict(Hash.ZERO, true));
}

test "Blockchain - isCanonicalStrict returns false for missing without throw" {
    const allocator = std.testing.allocator;
    var blockchain = try Blockchain.init(allocator, null);
    defer blockchain.deinit();

    try std.testing.expect(!(try blockchain.isCanonicalStrict(Hash.ZERO, false)));
}

test "Blockchain - isCanonicalOrFetch returns false for missing" {
    const allocator = std.testing.allocator;
    var blockchain = try Blockchain.init(allocator, null);
    defer blockchain.deinit();

    try std.testing.expect(!(try blockchain.isCanonicalOrFetch(Hash.ZERO)));
}

test "Blockchain - isCanonicalOrFetch returns true for canonical block" {
    const allocator = std.testing.allocator;
    var blockchain = try Blockchain.init(allocator, null);
    defer blockchain.deinit();

    const genesis = try Block.genesis(1, allocator);
    try blockchain.putBlock(genesis);
    try blockchain.setCanonicalHead(genesis.hash);

    try std.testing.expect(try blockchain.isCanonicalOrFetch(genesis.hash));
}

// ============================================================================
// Parent Header Tests
// ============================================================================

test "Blockchain - parentHeaderLocal returns error for missing parent" {
    const allocator = std.testing.allocator;
    var blockchain = try Blockchain.init(allocator, null);
    defer blockchain.deinit();

    var hdr = primitives.BlockHeader.init();
    hdr.parent_hash = Hash.ZERO;
    try std.testing.expectError(error.MissingParentHeader, blockchain.parentHeaderLocal(&hdr));
}

test "Blockchain - parentHeaderLocal returns parent header" {
    const allocator = std.testing.allocator;
    var blockchain = try Blockchain.init(allocator, null);
    defer blockchain.deinit();

    const genesis = try Block.genesis(1, allocator);
    try blockchain.putBlock(genesis);

    var hdr = primitives.BlockHeader.init();
    hdr.number = 1;
    hdr.parent_hash = genesis.hash;

    const parent = try blockchain.parentHeaderLocal(&hdr);
    try std.testing.expectEqual(@as(u64, 0), parent.number);
}

// ============================================================================
// BLOCKHASH Tests
// ============================================================================

test "Blockchain - blockHashByNumberLocal returns null for future number" {
    const allocator = std.testing.allocator;
    var blockchain = try Blockchain.init(allocator, null);
    defer blockchain.deinit();

    const genesis = try Block.genesis(1, allocator);
    try blockchain.putBlock(genesis);
    try blockchain.setCanonicalHead(genesis.hash);

    try std.testing.expect(blockchain.blockHashByNumberLocal(genesis.hash, 1, 1) == null);
    try std.testing.expect(blockchain.blockHashByNumberLocal(genesis.hash, 1, 2) == null);
}

test "Blockchain - blockHashByNumberLocal returns hash for valid ancestor" {
    const allocator = std.testing.allocator;
    var blockchain = try Blockchain.init(allocator, null);
    defer blockchain.deinit();

    const genesis = try Block.genesis(1, allocator);
    try blockchain.putBlock(genesis);
    try blockchain.setCanonicalHead(genesis.hash);

    var h1 = primitives.BlockHeader.init();
    h1.number = 1;
    h1.parent_hash = genesis.hash;
    const b1 = try Block.from(&h1, &primitives.BlockBody.init(), allocator);
    try blockchain.putBlock(b1);

    const result = blockchain.blockHashByNumberLocal(b1.hash, 2, 1);
    try std.testing.expect(result != null);
    try std.testing.expectEqualSlices(u8, &b1.hash, &result.?);
}

test "Blockchain - blockHashByNumberLocalStrict returns error for missing tip" {
    const allocator = std.testing.allocator;
    var blockchain = try Blockchain.init(allocator, null);
    defer blockchain.deinit();

    try std.testing.expectError(error.MissingTipBlock, blockchain.blockHashByNumberLocalStrict(Hash.ZERO, 1, 0));
}

// ============================================================================
// Recent Block Hashes Tests
// ============================================================================

test "Blockchain - last256BlockHashesLocal returns tip for genesis" {
    const allocator = std.testing.allocator;
    var blockchain = try Blockchain.init(allocator, null);
    defer blockchain.deinit();

    const genesis = try Block.genesis(1, allocator);
    try blockchain.putBlock(genesis);
    try blockchain.setCanonicalHead(genesis.hash);

    var buf: [256]Hash.Hash = undefined;
    const hashes = try blockchain.last256BlockHashesLocal(genesis.hash, &buf);

    try std.testing.expectEqual(@as(usize, 1), hashes.len);
    try std.testing.expectEqualSlices(u8, &genesis.hash, &hashes[0]);
}

test "Blockchain - last256BlockHashesLocal returns error for missing tip" {
    const allocator = std.testing.allocator;
    var blockchain = try Blockchain.init(allocator, null);
    defer blockchain.deinit();

    var buf: [256]Hash.Hash = undefined;
    try std.testing.expectError(error.MissingTipBlock, blockchain.last256BlockHashesLocal(Hash.ZERO, &buf));
}

// ============================================================================
// Common Ancestor Tests
// ============================================================================

test "Blockchain - commonAncestorHashLocal returns null when either missing" {
    const allocator = std.testing.allocator;
    var blockchain = try Blockchain.init(allocator, null);
    defer blockchain.deinit();

    try std.testing.expect(blockchain.commonAncestorHashLocal(Hash.ZERO, Hash.ZERO) == null);
}

test "Blockchain - commonAncestorHashLocalStrict returns typed error when either missing" {
    const allocator = std.testing.allocator;
    var blockchain = try Blockchain.init(allocator, null);
    defer blockchain.deinit();

    try std.testing.expectError(error.MissingBlockA, blockchain.commonAncestorHashLocalStrict(Hash.ZERO, Hash.ZERO));
}

test "Blockchain - commonAncestorHashLocal returns self when equal" {
    const allocator = std.testing.allocator;
    var blockchain = try Blockchain.init(allocator, null);
    defer blockchain.deinit();

    const genesis = try Block.genesis(1, allocator);
    try blockchain.putBlock(genesis);

    const lca = blockchain.commonAncestorHashLocal(genesis.hash, genesis.hash) orelse return error.Unreachable;
    try std.testing.expectEqualSlices(u8, &genesis.hash, &lca);
}

test "Blockchain - commonAncestorHashLocal finds ancestor across fork" {
    const allocator = std.testing.allocator;
    var blockchain = try Blockchain.init(allocator, null);
    defer blockchain.deinit();

    const genesis = try Block.genesis(1, allocator);
    try blockchain.putBlock(genesis);

    var h1a = primitives.BlockHeader.init();
    h1a.number = 1;
    h1a.parent_hash = genesis.hash;
    h1a.timestamp = 1;
    const b1a = try Block.from(&h1a, &primitives.BlockBody.init(), allocator);
    try blockchain.putBlock(b1a);

    var h1b = primitives.BlockHeader.init();
    h1b.number = 1;
    h1b.parent_hash = genesis.hash;
    h1b.timestamp = 2;
    const b1b = try Block.from(&h1b, &primitives.BlockBody.init(), allocator);
    try blockchain.putBlock(b1b);

    const lca = blockchain.commonAncestorHashLocal(b1a.hash, b1b.hash) orelse return error.Unreachable;
    try std.testing.expectEqualSlices(u8, &genesis.hash, &lca);
}

// ============================================================================
// Divergence & Reorg Tests
// ============================================================================

test "Blockchain - hasCanonicalDivergenceLocal returns error for empty chain" {
    const allocator = std.testing.allocator;
    var blockchain = try Blockchain.init(allocator, null);
    defer blockchain.deinit();

    try std.testing.expectError(error.MissingCanonicalHead, blockchain.hasCanonicalDivergenceLocal(Hash.ZERO));
}

test "Blockchain - hasCanonicalDivergenceLocal returns false for current head" {
    const allocator = std.testing.allocator;
    var blockchain = try Blockchain.init(allocator, null);
    defer blockchain.deinit();

    const genesis = try Block.genesis(1, allocator);
    try blockchain.putBlock(genesis);
    try blockchain.setCanonicalHead(genesis.hash);

    try std.testing.expect(!(try blockchain.hasCanonicalDivergenceLocal(genesis.hash)));
}

test "Blockchain - hasCanonicalDivergenceLocal returns true for forked head" {
    const allocator = std.testing.allocator;
    var blockchain = try Blockchain.init(allocator, null);
    defer blockchain.deinit();

    const genesis = try Block.genesis(1, allocator);
    try blockchain.putBlock(genesis);
    try blockchain.setCanonicalHead(genesis.hash);

    var h1a = primitives.BlockHeader.init();
    h1a.number = 1;
    h1a.parent_hash = genesis.hash;
    h1a.timestamp = 1;
    const b1a = try Block.from(&h1a, &primitives.BlockBody.init(), allocator);
    try blockchain.putBlock(b1a);
    try blockchain.setCanonicalHead(b1a.hash);

    var h1b = primitives.BlockHeader.init();
    h1b.number = 1;
    h1b.parent_hash = genesis.hash;
    h1b.timestamp = 2;
    const b1b = try Block.from(&h1b, &primitives.BlockBody.init(), allocator);
    try blockchain.putBlock(b1b);

    try std.testing.expect(try blockchain.hasCanonicalDivergenceLocal(b1b.hash));
}

test "Blockchain - canonicalReorgDepthLocal returns error for empty chain" {
    const allocator = std.testing.allocator;
    var blockchain = try Blockchain.init(allocator, null);
    defer blockchain.deinit();

    try std.testing.expectError(error.MissingCanonicalHead, blockchain.canonicalReorgDepthLocal(Hash.ZERO));
}

test "Blockchain - canonicalReorgDepthLocal returns zero for canonical head" {
    const allocator = std.testing.allocator;
    var blockchain = try Blockchain.init(allocator, null);
    defer blockchain.deinit();

    const genesis = try Block.genesis(1, allocator);
    try blockchain.putBlock(genesis);
    try blockchain.setCanonicalHead(genesis.hash);

    try std.testing.expectEqual(@as(u64, 0), try blockchain.canonicalReorgDepthLocal(genesis.hash));
}

test "Blockchain - candidateReorgDepthLocal returns error for empty chain" {
    const allocator = std.testing.allocator;
    var blockchain = try Blockchain.init(allocator, null);
    defer blockchain.deinit();

    try std.testing.expectError(error.MissingCanonicalHead, blockchain.candidateReorgDepthLocal(Hash.ZERO));
}
