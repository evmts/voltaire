const std = @import("std");
const crypto = @import("root").crypto;
const blake3 = crypto.Blake3;

/// Binary State Tree (EIP-7864) - Unified tree structure for Ethereum state
///
/// Key features:
/// - 32-byte keys (31-byte stem + 1-byte subindex)
/// - Four node types: Internal, Stem, Leaf, Empty
/// - BLAKE3 hashing (current draft, TBD in final spec)
/// - Minimal internal branching for efficiency
pub const BinaryTree = @This();

/// 31-byte stem defines tree path, last byte defines subindex within stem
pub const Stem = [31]u8;

/// Account basic data layout at index 0
pub const AccountData = packed struct {
    version: u8,
    code_size: u24,
    nonce: u64,
    balance: u128,
};

/// Node types in the binary tree
pub const Node = union(enum) {
    empty: void,
    internal: InternalNode,
    stem: StemNode,
    leaf: LeafNode,
};

/// Internal node contains left and right child hashes
pub const InternalNode = struct {
    left: [32]u8,
    right: [32]u8,
};

/// Stem node contains 31-byte stem and 256 potential values
pub const StemNode = struct {
    stem: Stem,
    values: [256]?[32]u8,
};

/// Leaf node contains 32-byte value
pub const LeafNode = struct {
    value: [32]u8,
};

/// Convert address to 32-byte key format (prepend 12 zero bytes)
pub fn addressToKey(addr: [20]u8) [32]u8 {
    var k: [32]u8 = undefined;
    @memset(k[0..12], 0);
    @memcpy(k[12..32], &addr);
    return k;
}

/// Split 32-byte key into stem and subindex
pub fn splitKey(k: [32]u8) struct { stem: Stem, idx: u8 } {
    var stem: Stem = undefined;
    @memcpy(&stem, k[0..31]);
    return .{ .stem = stem, .idx = k[31] };
}

/// Hash internal node (left || right)
pub fn hashInternal(l: [32]u8, r: [32]u8) [32]u8 {
    // If both children are zero, parent hash is zero
    const lz = std.mem.allEqual(u8, &l, 0);
    const rz = std.mem.allEqual(u8, &r, 0);
    if (lz and rz) return [_]u8{0} ** 32;

    var h: [32]u8 = undefined;
    var hasher = blake3.init(.{});
    hasher.update(&l);
    hasher.update(&r);
    hasher.final(&h);
    return h;
}

/// Hash stem node
pub fn hashStem(node: StemNode) [32]u8 {
    var h: [32]u8 = undefined;
    var hasher = blake3.init(.{});
    hasher.update(&node.stem);

    for (node.values) |mv| {
        if (mv) |v| {
            hasher.update(&v);
        } else {
            hasher.update(&([_]u8{0} ** 32));
        }
    }

    hasher.final(&h);
    return h;
}

/// Hash leaf node
pub fn hashLeaf(node: LeafNode) [32]u8 {
    var h: [32]u8 = undefined;
    var hasher = blake3.init(.{});
    hasher.update(&node.value);
    hasher.final(&h);
    return h;
}

/// Hash any node type
pub fn hashNode(node: Node) [32]u8 {
    return switch (node) {
        .empty => [_]u8{0} ** 32,
        .internal => |n| hashInternal(n.left, n.right),
        .stem => |n| hashStem(n),
        .leaf => |n| hashLeaf(n),
    };
}

/// Get stem at bit position
pub fn getStemBit(stem: Stem, pos: usize) u1 {
    if (pos >= 248) return 0;
    const byte_idx = pos / 8;
    const bit_idx: u3 = @intCast(7 - (pos % 8));
    return @intCast((stem[byte_idx] >> bit_idx) & 1);
}

/// Tree structure
allocator: std.mem.Allocator,
root: Node,

pub fn init(a: std.mem.Allocator) BinaryTree {
    return .{
        .allocator = a,
        .root = .empty,
    };
}

pub fn deinit(self: *BinaryTree) void {
    _ = self;
    // Node cleanup handled by allocator
}

/// Insert value at key
pub fn insert(self: *BinaryTree, k: [32]u8, v: [32]u8) !void {
    const split = splitKey(k);
    self.root = try self.insertNode(self.root, split.stem, split.idx, v, 0);
}

fn insertNode(self: *BinaryTree, node: Node, stem: Stem, idx: u8, v: [32]u8, depth: usize) std.mem.Allocator.Error!Node {
    switch (node) {
        .empty => {
            // Create new stem node
            var sn = StemNode{
                .stem = stem,
                .values = [_]?[32]u8{null} ** 256,
            };
            sn.values[idx] = v;
            return .{ .stem = sn };
        },
        .stem => |sn| {
            if (std.mem.eql(u8, &sn.stem, &stem)) {
                // Same stem, update value
                var updated = sn;
                updated.values[idx] = v;
                return .{ .stem = updated };
            } else {
                // Different stem, need to split into internal nodes
                return try self.splitStems(sn, stem, idx, v, depth);
            }
        },
        .internal => |in| {
            const bit = getStemBit(stem, depth);
            if (bit == 0) {
                const new_left = try self.insertNode(.{ .internal = .{
                    .left = in.left,
                    .right = in.right,
                } }, stem, idx, v, depth + 1);
                return .{ .internal = .{
                    .left = hashNode(new_left),
                    .right = in.right,
                } };
            } else {
                const new_right = try self.insertNode(.{ .internal = .{
                    .left = in.left,
                    .right = in.right,
                } }, stem, idx, v, depth + 1);
                return .{ .internal = .{
                    .left = in.left,
                    .right = hashNode(new_right),
                } };
            }
        },
        .leaf => {
            // Should not happen in proper tree structure
            return error.InvalidTreeState;
        },
    }
}

fn splitStems(self: *BinaryTree, existing: StemNode, new_stem: Stem, new_idx: u8, new_val: [32]u8, depth: usize) std.mem.Allocator.Error!Node {
    const existing_bit = getStemBit(existing.stem, depth);
    const new_bit = getStemBit(new_stem, depth);

    if (existing_bit == new_bit) {
        // Continue splitting
        const child = try self.splitStems(existing, new_stem, new_idx, new_val, depth + 1);
        const child_hash = hashNode(child);

        if (existing_bit == 0) {
            return .{ .internal = .{
                .left = child_hash,
                .right = [_]u8{0} ** 32,
            } };
        } else {
            return .{ .internal = .{
                .left = [_]u8{0} ** 32,
                .right = child_hash,
            } };
        }
    } else {
        // Diverged, create internal node
        var new_sn = StemNode{
            .stem = new_stem,
            .values = [_]?[32]u8{null} ** 256,
        };
        new_sn.values[new_idx] = new_val;

        const existing_hash = hashNode(.{ .stem = existing });
        const new_hash = hashNode(.{ .stem = new_sn });

        if (existing_bit == 0) {
            return .{ .internal = .{
                .left = existing_hash,
                .right = new_hash,
            } };
        } else {
            return .{ .internal = .{
                .left = new_hash,
                .right = existing_hash,
            } };
        }
    }
}

/// Get value at key
pub fn get(self: *BinaryTree, k: [32]u8) ?[32]u8 {
    const split = splitKey(k);
    return self.getNode(self.root, split.stem, split.idx, 0);
}

fn getNode(self: *BinaryTree, node: Node, stem: Stem, idx: u8, depth: usize) ?[32]u8 {
    _ = self;
    switch (node) {
        .empty => return null,
        .stem => |sn| {
            if (std.mem.eql(u8, &sn.stem, &stem)) {
                return sn.values[idx];
            }
            return null;
        },
        .internal => |in| {
            const bit = getStemBit(stem, depth);
            const child_hash = if (bit == 0) in.left else in.right;
            _ = child_hash;
            // Would need to traverse to child node
            // Simplified for now
            return null;
        },
        .leaf => return null,
    }
}

/// Compute root hash
pub fn rootHash(self: *BinaryTree) [32]u8 {
    return hashNode(self.root);
}

test "BinaryTree - addressToKey" {
    const addr = [_]u8{ 0xf3, 0x9f } ++ [_]u8{0} ** 18;
    const k = addressToKey(addr);

    try std.testing.expectEqual(@as(usize, 32), k.len);
    try std.testing.expectEqual(@as(u8, 0), k[0]);
    try std.testing.expectEqual(@as(u8, 0xf3), k[12]);
    try std.testing.expectEqual(@as(u8, 0x9f), k[13]);
}

test "BinaryTree - splitKey" {
    var k: [32]u8 = undefined;
    @memset(&k, 0xaa);
    k[31] = 0x42;

    const split = splitKey(k);
    try std.testing.expectEqual(@as(u8, 0x42), split.idx);
    try std.testing.expectEqual(@as(u8, 0xaa), split.stem[0]);
    try std.testing.expectEqual(@as(u8, 0xaa), split.stem[30]);
}

test "BinaryTree - hashInternal zero children" {
    const zero = [_]u8{0} ** 32;
    const h = hashInternal(zero, zero);
    try std.testing.expectEqualSlices(u8, &zero, &h);
}

test "BinaryTree - hashInternal non-zero children" {
    const l = [_]u8{0x01} ++ [_]u8{0} ** 31;
    const r = [_]u8{0x02} ++ [_]u8{0} ** 31;
    const h = hashInternal(l, r);

    // Should not be all zeros
    var all_zero = true;
    for (h) |b| {
        if (b != 0) {
            all_zero = false;
            break;
        }
    }
    try std.testing.expect(!all_zero);
}

test "BinaryTree - init and deinit" {
    var tree = init(std.testing.allocator);
    defer tree.deinit();

    const h = tree.rootHash();
    const zero = [_]u8{0} ** 32;
    try std.testing.expectEqualSlices(u8, &zero, &h);
}

test "BinaryTree - insert single value" {
    var tree = init(std.testing.allocator);
    defer tree.deinit();

    var k: [32]u8 = undefined;
    @memset(&k, 0);
    k[31] = 5;

    var v: [32]u8 = undefined;
    @memset(&v, 0);
    v[31] = 0x42;

    try tree.insert(k, v);

    const h = tree.rootHash();
    const zero = [_]u8{0} ** 32;
    const is_zero = std.mem.eql(u8, &h, &zero);
    try std.testing.expect(!is_zero);
}

test "BinaryTree - insert and get" {
    var tree = init(std.testing.allocator);
    defer tree.deinit();

    var k: [32]u8 = undefined;
    @memset(&k, 0);
    k[31] = 10;

    var v: [32]u8 = undefined;
    @memset(&v, 0);
    v[31] = 0x99;

    try tree.insert(k, v);

    const retrieved = tree.get(k);
    try std.testing.expect(retrieved != null);
    if (retrieved) |r| {
        try std.testing.expectEqual(@as(u8, 0x99), r[31]);
    }
}

test "BinaryTree - getStemBit" {
    var stem: Stem = undefined;
    @memset(&stem, 0);
    stem[0] = 0b10101010;

    try std.testing.expectEqual(@as(u1, 1), getStemBit(stem, 0));
    try std.testing.expectEqual(@as(u1, 0), getStemBit(stem, 1));
    try std.testing.expectEqual(@as(u1, 1), getStemBit(stem, 2));
    try std.testing.expectEqual(@as(u1, 0), getStemBit(stem, 3));
}

test "BinaryTree - AccountData layout" {
    const acc = AccountData{
        .version = 1,
        .code_size = 1024,
        .nonce = 42,
        .balance = 1000000000000000000,
    };

    try std.testing.expectEqual(@as(u8, 1), acc.version);
    try std.testing.expectEqual(@as(u24, 1024), acc.code_size);
    try std.testing.expectEqual(@as(u64, 42), acc.nonce);
    try std.testing.expectEqual(@as(u128, 1000000000000000000), acc.balance);
}
