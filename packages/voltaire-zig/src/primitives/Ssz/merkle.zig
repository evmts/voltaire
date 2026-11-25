const std = @import("std");
const sha256 = std.crypto.hash.sha2.Sha256;

/// SSZ Merkleization
/// See: https://github.com/ethereum/consensus-specs/blob/dev/ssz/simple-serialize.md
///
/// Hash tree root computation for Merkle proofs
const CHUNK_SIZE = 32;
const ZERO_HASH = @as([32]u8, @splat(0));

/// Chunks data into 32-byte leaves, padding the last chunk with zeros if needed
fn chunkify(allocator: std.mem.Allocator, data: []const u8) ![][CHUNK_SIZE]u8 {
    const chunk_count = (data.len + CHUNK_SIZE - 1) / CHUNK_SIZE;
    const chunks = try allocator.alloc([CHUNK_SIZE]u8, chunk_count);
    errdefer allocator.free(chunks);

    var i: usize = 0;
    while (i < chunk_count) : (i += 1) {
        const start = i * CHUNK_SIZE;
        const end = @min(start + CHUNK_SIZE, data.len);
        const len = end - start;

        @memcpy(chunks[i][0..len], data[start..end]);
        if (len < CHUNK_SIZE) {
            @memset(chunks[i][len..], 0);
        }
    }

    return chunks;
}

/// Hashes two 32-byte values together
pub fn hashPair(left: [32]u8, right: [32]u8) [32]u8 {
    var hasher = sha256.init(.{});
    hasher.update(&left);
    hasher.update(&right);
    var result: [32]u8 = undefined;
    hasher.final(&result);
    return result;
}

/// Computes the next power of 2 >= n
fn nextPowerOfTwo(n: usize) usize {
    if (n == 0) return 1;
    var result: usize = 1;
    while (result < n) {
        result *= 2;
    }
    return result;
}

/// Merkleizes a list of chunks into a single root hash
fn merkleizeChunks(allocator: std.mem.Allocator, chunks: [][CHUNK_SIZE]u8) ![32]u8 {
    if (chunks.len == 0) return ZERO_HASH;
    if (chunks.len == 1) return chunks[0];

    // Pad to next power of 2
    const target_len = nextPowerOfTwo(chunks.len);
    var layer = try allocator.alloc([CHUNK_SIZE]u8, target_len);
    defer allocator.free(layer);

    // Copy chunks and pad with zero hashes
    @memcpy(layer[0..chunks.len], chunks);
    for (chunks.len..target_len) |i| {
        layer[i] = ZERO_HASH;
    }

    // Build Merkle tree bottom-up
    while (layer.len > 1) {
        const next_len = layer.len / 2;
        const next_layer = try allocator.alloc([CHUNK_SIZE]u8, next_len);
        errdefer allocator.free(next_layer);

        var i: usize = 0;
        while (i < next_len) : (i += 1) {
            next_layer[i] = hashPair(layer[i * 2], layer[i * 2 + 1]);
        }

        allocator.free(layer);
        layer = next_layer;
    }

    const result = layer[0];
    return result;
}

/// Computes the hash tree root of raw data
/// Caller does not own returned memory (it's a value type)
pub fn hashTreeRoot(allocator: std.mem.Allocator, data: []const u8) ![32]u8 {
    const chunks = try chunkify(allocator, data);
    defer allocator.free(chunks);

    return try merkleizeChunks(allocator, chunks);
}

/// Computes the hash tree root of a basic type (u8, u16, u32, u64, u256, bool)
pub fn hashTreeRootBasic(comptime T: type, value: T) [32]u8 {
    var result = ZERO_HASH;

    switch (@typeInfo(T)) {
        .int => |int| {
            const bytes = std.mem.asBytes(&value);
            const len = int.bits / 8;
            @memcpy(result[0..len], bytes);
        },
        .bool => {
            result[0] = if (value) 1 else 0;
        },
        else => @compileError("Unsupported type for hashTreeRootBasic"),
    }

    return result;
}

/// Binary Merkle tree over 32-byte leaves, matching the TypeScript
/// `MerkleTree` primitive: Keccak256(left ++ right) node hashing, odd
/// levels padded to the next power of two by repeating the last leaf.
pub const MerkleTree = struct {
    root: [32]u8,
    depth: usize,
    /// Owned copy of the input leaves.
    leaves: [][32]u8,

    pub const Error = error{ EmptyTree, LeafIndexOutOfBounds, InvalidProofLength };

    /// Proof that `leaf` sits at `leaf_index` in a tree of `tree_depth`.
    pub const Proof = struct {
        leaf: [32]u8,
        /// Owned sibling hashes, leaf level first.
        siblings: [][32]u8,
        leaf_index: usize,
        tree_depth: usize,

        pub fn deinit(self: Proof, allocator: std.mem.Allocator) void {
            allocator.free(self.siblings);
        }
    };

    fn keccakPair(left: [32]u8, right: [32]u8) [32]u8 {
        var h = std.crypto.hash.sha3.Keccak256.init(.{});
        h.update(&left);
        h.update(&right);
        var out: [32]u8 = undefined;
        h.final(&out);
        return out;
    }

    fn treeDepth(n: usize) usize {
        if (n <= 1) return 0;
        return std.math.log2_int_ceil(usize, n);
    }

    /// Builds the padded bottom level. Caller owns returned slice.
    fn paddedLevel(allocator: std.mem.Allocator, leaves: []const [32]u8, depth: usize) ![][32]u8 {
        const target = @as(usize, 1) << @intCast(depth);
        const level = try allocator.alloc([32]u8, target);
        @memcpy(level[0..leaves.len], leaves);
        for (leaves.len..target) |i| level[i] = leaves[leaves.len - 1];
        return level;
    }

    /// Hashes `level` in place into its parent level; returns the parent slice.
    fn reduce(level: [][32]u8) [][32]u8 {
        const n = level.len / 2;
        for (0..n) |i| level[i] = keccakPair(level[2 * i], level[2 * i + 1]);
        return level[0..n];
    }

    /// Creates a tree from leaf hashes. Caller owns result; call `deinit`.
    pub fn from(allocator: std.mem.Allocator, leaves: []const [32]u8) !MerkleTree {
        if (leaves.len == 0) return Error.EmptyTree;
        const owned = try allocator.dupe([32]u8, leaves);
        errdefer allocator.free(owned);

        const depth = treeDepth(leaves.len);
        const level = try paddedLevel(allocator, leaves, depth);
        defer allocator.free(level);

        var cur = level;
        while (cur.len > 1) cur = reduce(cur);

        return .{ .root = cur[0], .depth = depth, .leaves = owned };
    }

    pub fn deinit(self: MerkleTree, allocator: std.mem.Allocator) void {
        allocator.free(self.leaves);
    }

    pub fn getRoot(self: MerkleTree) [32]u8 {
        return self.root;
    }

    pub fn getLeaves(self: MerkleTree) []const [32]u8 {
        return self.leaves;
    }

    /// Generates an inclusion proof for the leaf at `leaf_index`.
    /// Caller owns result; call `Proof.deinit`.
    pub fn getProof(self: MerkleTree, allocator: std.mem.Allocator, leaf_index: usize) !Proof {
        return proofFromLeaves(allocator, self.leaves, leaf_index);
    }

    /// Generates an inclusion proof directly from leaves (TS `getProof`).
    pub fn proofFromLeaves(allocator: std.mem.Allocator, leaves: []const [32]u8, leaf_index: usize) !Proof {
        if (leaves.len == 0) return Error.EmptyTree;
        if (leaf_index >= leaves.len) return Error.LeafIndexOutOfBounds;

        const depth = treeDepth(leaves.len);
        const siblings = try allocator.alloc([32]u8, depth);
        errdefer allocator.free(siblings);

        const level = try paddedLevel(allocator, leaves, depth);
        defer allocator.free(level);

        var cur = level;
        var index = leaf_index;
        var d: usize = 0;
        while (cur.len > 1) : (d += 1) {
            siblings[d] = cur[index ^ 1];
            cur = reduce(cur);
            index /= 2;
        }

        return .{ .leaf = leaves[leaf_index], .siblings = siblings, .leaf_index = leaf_index, .tree_depth = depth };
    }

    /// Verifies `proof` against `expected_root`.
    /// Returns `error.InvalidProofLength` if siblings.len != tree_depth.
    pub fn verify(proof: Proof, expected_root: [32]u8) Error!bool {
        if (proof.siblings.len != proof.tree_depth) return Error.InvalidProofLength;

        var cur = proof.leaf;
        var index = proof.leaf_index;
        for (proof.siblings) |sibling| {
            cur = if (index % 2 == 0) keccakPair(cur, sibling) else keccakPair(sibling, cur);
            index /= 2;
        }
        return std.mem.eql(u8, &cur, &expected_root);
    }
};

test "MerkleTree from empty errors" {
    try std.testing.expectError(MerkleTree.Error.EmptyTree, MerkleTree.from(std.testing.allocator, &.{}));
}

test "MerkleTree single leaf root is leaf" {
    const allocator = std.testing.allocator;
    const a = @as([32]u8, @splat(0x11));
    const tree = try MerkleTree.from(allocator, &.{a});
    defer tree.deinit(allocator);
    try std.testing.expectEqual(a, tree.getRoot());
    try std.testing.expectEqual(@as(usize, 0), tree.depth);

    const proof = try tree.getProof(allocator, 0);
    defer proof.deinit(allocator);
    try std.testing.expectEqual(@as(usize, 0), proof.siblings.len);
    try std.testing.expect(try MerkleTree.verify(proof, a));
}

test "MerkleTree keccak256 known vector" {
    // keccak256(0x00 ** 64)
    const allocator = std.testing.allocator;
    const z = @as([32]u8, @splat(0));
    const tree = try MerkleTree.from(allocator, &.{ z, z });
    defer tree.deinit(allocator);
    var expected: [32]u8 = undefined;
    _ = try std.fmt.hexToBytes(&expected, "ad3228b676f7d3cd4284a5443f17f1962b36e491b30a40b2405849e597ba5fb5");
    try std.testing.expectEqual(expected, tree.getRoot());
}

test "MerkleTree odd leaves pad with last leaf" {
    const allocator = std.testing.allocator;
    const a = @as([32]u8, @splat(1));
    const b = @as([32]u8, @splat(2));
    const c = @as([32]u8, @splat(3));
    const tree = try MerkleTree.from(allocator, &.{ a, b, c });
    defer tree.deinit(allocator);

    const expected = MerkleTree.keccakPair(MerkleTree.keccakPair(a, b), MerkleTree.keccakPair(c, c));
    try std.testing.expectEqual(expected, tree.getRoot());
    try std.testing.expectEqual(@as(usize, 2), tree.depth);
    try std.testing.expectEqual(@as(usize, 3), tree.getLeaves().len);
    try std.testing.expectEqual(c, tree.getLeaves()[2]);
}

test "MerkleTree proofs verify for every leaf" {
    const allocator = std.testing.allocator;
    var leaves: [5][32]u8 = undefined;
    for (&leaves, 0..) |*l, i| l.* = @as([32]u8, @splat(@intCast(i + 1)));
    const tree = try MerkleTree.from(allocator, &leaves);
    defer tree.deinit(allocator);
    try std.testing.expectEqual(@as(usize, 3), tree.depth);

    for (0..leaves.len) |i| {
        const proof = try tree.getProof(allocator, i);
        defer proof.deinit(allocator);
        try std.testing.expectEqual(@as(usize, 3), proof.siblings.len);
        try std.testing.expectEqual(leaves[i], proof.leaf);
        try std.testing.expect(try MerkleTree.verify(proof, tree.getRoot()));
    }
}

test "MerkleTree proof sibling order" {
    const allocator = std.testing.allocator;
    const a = @as([32]u8, @splat(1));
    const b = @as([32]u8, @splat(2));
    const c = @as([32]u8, @splat(3));
    const d = @as([32]u8, @splat(4));
    const proof = try MerkleTree.proofFromLeaves(allocator, &.{ a, b, c, d }, 2);
    defer proof.deinit(allocator);
    try std.testing.expectEqual(d, proof.siblings[0]);
    try std.testing.expectEqual(MerkleTree.keccakPair(a, b), proof.siblings[1]);
}

test "MerkleTree verify rejects tampered proof" {
    const allocator = std.testing.allocator;
    const leaves = [_][32]u8{ @as([32]u8, @splat(1)), @as([32]u8, @splat(2)), @as([32]u8, @splat(3)), @as([32]u8, @splat(4)) };
    const tree = try MerkleTree.from(allocator, &leaves);
    defer tree.deinit(allocator);

    var proof = try tree.getProof(allocator, 1);
    defer proof.deinit(allocator);

    const good_leaf = proof.leaf;
    proof.leaf[0] ^= 0xff;
    try std.testing.expect(!try MerkleTree.verify(proof, tree.getRoot()));
    proof.leaf = good_leaf;

    proof.leaf_index = 0;
    try std.testing.expect(!try MerkleTree.verify(proof, tree.getRoot()));
    proof.leaf_index = 1;

    try std.testing.expect(!try MerkleTree.verify(proof, @as([32]u8, @splat(0))));
}

test "MerkleTree verify rejects wrong proof length" {
    const allocator = std.testing.allocator;
    const leaves = [_][32]u8{ @as([32]u8, @splat(1)), @as([32]u8, @splat(2)) };
    const tree = try MerkleTree.from(allocator, &leaves);
    defer tree.deinit(allocator);
    var proof = try tree.getProof(allocator, 0);
    defer proof.deinit(allocator);
    proof.tree_depth = 2;
    try std.testing.expectError(MerkleTree.Error.InvalidProofLength, MerkleTree.verify(proof, tree.getRoot()));
}

test "MerkleTree getProof out of bounds" {
    const allocator = std.testing.allocator;
    const leaves = [_][32]u8{ @as([32]u8, @splat(1)), @as([32]u8, @splat(2)) };
    try std.testing.expectError(MerkleTree.Error.LeafIndexOutOfBounds, MerkleTree.proofFromLeaves(allocator, &leaves, 2));
    try std.testing.expectError(MerkleTree.Error.EmptyTree, MerkleTree.proofFromLeaves(allocator, &.{}, 0));
}

test "chunkify single chunk" {
    const allocator = std.testing.allocator;
    const data = @as([16]u8, @splat(1)); // Half chunk
    const chunks = try chunkify(allocator, &data);
    defer allocator.free(chunks);

    try std.testing.expectEqual(@as(usize, 1), chunks.len);
    try std.testing.expectEqual(@as(u8, 1), chunks[0][0]);
    try std.testing.expectEqual(@as(u8, 1), chunks[0][15]);
    try std.testing.expectEqual(@as(u8, 0), chunks[0][16]); // padding
    try std.testing.expectEqual(@as(u8, 0), chunks[0][31]); // padding
}

test "chunkify multiple chunks" {
    const allocator = std.testing.allocator;
    const data = @as([64]u8, @splat(0xAA)); // Two full chunks
    const chunks = try chunkify(allocator, &data);
    defer allocator.free(chunks);

    try std.testing.expectEqual(@as(usize, 2), chunks.len);
    try std.testing.expectEqual(@as(u8, 0xAA), chunks[0][0]);
    try std.testing.expectEqual(@as(u8, 0xAA), chunks[1][31]);
}

test "hashPair" {
    const left = ZERO_HASH;
    const right = ZERO_HASH;
    const result = hashPair(left, right);

    // Hash of two zero hashes should be deterministic
    try std.testing.expect(result[0] != 0 or result[1] != 0); // Not all zeros
}

test "nextPowerOfTwo" {
    try std.testing.expectEqual(@as(usize, 1), nextPowerOfTwo(0));
    try std.testing.expectEqual(@as(usize, 1), nextPowerOfTwo(1));
    try std.testing.expectEqual(@as(usize, 2), nextPowerOfTwo(2));
    try std.testing.expectEqual(@as(usize, 4), nextPowerOfTwo(3));
    try std.testing.expectEqual(@as(usize, 4), nextPowerOfTwo(4));
    try std.testing.expectEqual(@as(usize, 8), nextPowerOfTwo(5));
    try std.testing.expectEqual(@as(usize, 16), nextPowerOfTwo(15));
}

test "hashTreeRoot empty" {
    const allocator = std.testing.allocator;
    const data = [_]u8{};
    const root = try hashTreeRoot(allocator, &data);
    try std.testing.expectEqual(ZERO_HASH, root);
}

test "hashTreeRoot single byte" {
    const allocator = std.testing.allocator;
    const data = [_]u8{42};
    const root = try hashTreeRoot(allocator, &data);

    // Should be a 32-byte hash (not all zeros)
    try std.testing.expect(root[0] != 0 or root[1] != 0);
}

test "hashTreeRootBasic u8" {
    const root = hashTreeRootBasic(u8, 42);
    try std.testing.expectEqual(@as(u8, 42), root[0]);
    try std.testing.expectEqual(@as(u8, 0), root[1]);
}

test "hashTreeRootBasic bool" {
    const root_true = hashTreeRootBasic(bool, true);
    const root_false = hashTreeRootBasic(bool, false);
    try std.testing.expectEqual(@as(u8, 1), root_true[0]);
    try std.testing.expectEqual(@as(u8, 0), root_false[0]);
}

test "hashTreeRootBasic u64" {
    const root = hashTreeRootBasic(u64, 0x0102030405060708);
    try std.testing.expectEqual(@as(u8, 0x08), root[0]); // little-endian
    try std.testing.expectEqual(@as(u8, 0x07), root[1]);
    try std.testing.expectEqual(@as(u8, 0x01), root[7]);
    try std.testing.expectEqual(@as(u8, 0), root[8]); // padding
}
