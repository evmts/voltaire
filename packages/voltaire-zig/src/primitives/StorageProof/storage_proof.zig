//! StorageProof - EIP-1186 storage proof type for Ethereum
//!
//! This module provides a storage proof structure for verifying individual
//! storage slot values in a contract's storage trie. Storage proofs are part
//! of the StateProof structure defined in EIP-1186.
//!
//! Each storage proof demonstrates that a specific storage key-value pair exists
//! (or doesn't exist) in a contract's storage trie at a given block.
//!
//! ## Usage
//! ```zig
//! const StorageProof = @import("primitives").StorageProof;
//!
//! // Create a storage proof
//! const proof = StorageProof.init(key, value, &proof_nodes);
//!
//! // Verify against a storage root
//! const is_valid = try proof.verify(allocator, &storage_root);
//! ```
//!
//! @see EIP-1186: https://eips.ethereum.org/EIPS/eip-1186

const std = @import("std");
const Hash = @import("../Hash/Hash.zig");
const StorageValue = @import("../StorageValue/StorageValue.zig");
const State = @import("../State/state.zig");
const crypto = @import("crypto");

/// Maximum number of proof elements (limits trie depth)
pub const MAX_PROOF_DEPTH: usize = 256;

/// StorageProof represents an EIP-1186 storage proof for a single storage slot.
///
/// Each storage proof demonstrates that a specific storage key-value pair exists
/// (or doesn't exist) in a contract's storage trie at a given block.
pub const StorageProof = struct {
    /// The storage slot being proven (address + slot number).
    key: State.StorageKey,

    /// The value stored at this slot (32 bytes).
    /// Zero if the slot is uninitialized or was cleared.
    value: StorageValue.StorageValue,

    /// Array of RLP-encoded Merkle Patricia Trie nodes.
    /// Forms the path from the storage root hash to this storage slot.
    /// Nodes are ordered from root to leaf.
    proof: []const []const u8,

    /// Internal flag indicating if memory is owned
    _owned: bool = false,

    const Self = @This();

    // ============================================================================
    // Constructors
    // ============================================================================

    /// Create a StorageProof (non-owning).
    /// The caller must ensure the proof data outlives the StorageProof.
    pub fn init(key: State.StorageKey, value: StorageValue.StorageValue, proof_nodes: []const []const u8) Self {
        return Self{
            .key = key,
            .value = value,
            .proof = proof_nodes,
            ._owned = false,
        };
    }

    /// Create a StorageProof by copying all data (owning).
    /// The returned StorageProof owns its memory and must be freed with deinit().
    pub fn from(
        allocator: std.mem.Allocator,
        key: State.StorageKey,
        value: StorageValue.StorageValue,
        proof_nodes: []const []const u8,
    ) !Self {
        if (proof_nodes.len > MAX_PROOF_DEPTH) {
            return error.ProofTooDeep;
        }

        // Copy proof nodes
        const owned_proof = try allocator.alloc([]const u8, proof_nodes.len);
        errdefer allocator.free(owned_proof);

        var copied: usize = 0;
        errdefer {
            for (owned_proof[0..copied]) |node| {
                allocator.free(node);
            }
        }

        for (proof_nodes, 0..) |node, i| {
            owned_proof[i] = try allocator.dupe(u8, node);
            copied += 1;
        }

        return Self{
            .key = key,
            .value = value,
            .proof = owned_proof,
            ._owned = true,
        };
    }

    /// Create a StorageProof from a slot number and value.
    /// Convenience function when address is already in StorageKey.
    pub fn fromSlot(
        allocator: std.mem.Allocator,
        address: [20]u8,
        slot: u256,
        value: u256,
        proof_nodes: []const []const u8,
    ) !Self {
        const key = State.StorageKey{
            .address = address,
            .slot = slot,
        };
        const storage_value = StorageValue.fromUint256(value);
        return from(allocator, key, storage_value, proof_nodes);
    }

    /// Free owned memory.
    pub fn deinit(self: Self, allocator: std.mem.Allocator) void {
        if (self._owned) {
            for (self.proof) |node| {
                allocator.free(node);
            }
            allocator.free(self.proof);
        }
    }

    // ============================================================================
    // Validation
    // ============================================================================

    /// Compare two StorageProofs for equality.
    /// All fields (key, value, and proof elements) must match.
    pub fn equals(a: *const Self, b: *const Self) bool {
        // Check key equality
        if (!State.StorageKey.eql(a.key, b.key)) {
            return false;
        }

        // Check value equality
        if (!StorageValue.equals(&a.value, &b.value)) {
            return false;
        }

        // Check proof array length
        if (a.proof.len != b.proof.len) {
            return false;
        }

        // Check each proof element
        for (a.proof, b.proof) |proof_a, proof_b| {
            if (!std.mem.eql(u8, proof_a, proof_b)) {
                return false;
            }
        }

        return true;
    }

    /// Check if proof is empty (no proof nodes).
    pub fn isEmpty(self: *const Self) bool {
        return self.proof.len == 0;
    }

    /// Get the number of proof elements.
    pub fn depth(self: *const Self) usize {
        return self.proof.len;
    }

    /// Check if the storage value is zero (slot uninitialized).
    pub fn isZeroValue(self: *const Self) bool {
        return StorageValue.isZero(&self.value);
    }

    // ============================================================================
    // Accessors
    // ============================================================================

    /// Get the storage slot number.
    pub fn getSlot(self: *const Self) u256 {
        return self.key.slot;
    }

    /// Get the storage value as u256.
    pub fn getValueU256(self: *const Self) u256 {
        return StorageValue.toUint256(&self.value);
    }

    /// Get the contract address.
    pub fn getAddress(self: *const Self) [20]u8 {
        return self.key.address;
    }

    // ============================================================================
    // Verification
    // ============================================================================

    /// Compute the storage key hash used in the trie.
    /// Per EIP-1186, the key is keccak256(slot) where slot is padded to 32 bytes.
    pub fn computeKeyHash(self: *const Self) Hash.Hash {
        var slot_bytes: [32]u8 = undefined;
        std.mem.writeInt(u256, &slot_bytes, self.key.slot, .big);
        return Hash.keccak256(&slot_bytes);
    }

    /// Verify this storage proof against a storage root.
    ///
    /// This verifies that the storage slot has the claimed value in the
    /// account's storage trie with the given root.
    ///
    /// Parameters:
    /// - allocator: For temporary allocations during RLP decoding
    /// - storage_root: The storage root to verify against (from account data)
    ///
    /// Returns true if the proof is valid.
    pub fn verify(self: *const Self, allocator: std.mem.Allocator, storage_root: *const Hash.Hash) !bool {
        const ProofModule = @import("../Proof/proof.zig");
        const Rlp = @import("../Rlp/Rlp.zig");

        // Compute the slot key hash (keccak256 of 32-byte big-endian slot)
        var slot_bytes: [32]u8 = undefined;
        std.mem.writeInt(u256, &slot_bytes, self.key.slot, .big);

        // RLP encode the value
        const value_rlp = if (StorageValue.isZero(&self.value))
            try Rlp.encode(allocator, &[_]u8{})
        else
            try Rlp.encode(allocator, &self.value);
        defer allocator.free(value_rlp);

        return ProofModule.verifyStorageSlotProof(
            allocator,
            storage_root,
            &slot_bytes,
            value_rlp,
            self.proof,
        );
    }

    // ============================================================================
    // Manipulation
    // ============================================================================

    /// Create a deep copy of the storage proof.
    pub fn clone(self: *const Self, allocator: std.mem.Allocator) !Self {
        return from(allocator, self.key, self.value, self.proof);
    }
};

// ============================================================================
// Tests
// ============================================================================

test "StorageProof.init - creates non-owning proof" {
    const addr = [_]u8{0x42} ** 20;
    const key = State.StorageKey{ .address = addr, .slot = 42 };
    const value = StorageValue.fromUint256(123);
    const node1 = [_]u8{0xaa} ** 32;
    const proof_nodes = [_][]const u8{&node1};

    const proof = StorageProof.init(key, value, &proof_nodes);

    try std.testing.expectEqual(@as(u256, 42), proof.key.slot);
    try std.testing.expectEqual(@as(usize, 1), proof.proof.len);
    try std.testing.expectEqual(false, proof._owned);
}

test "StorageProof.from - creates owning copy" {
    const allocator = std.testing.allocator;

    const addr = [_]u8{0x42} ** 20;
    const key = State.StorageKey{ .address = addr, .slot = 42 };
    const value = StorageValue.fromUint256(123);
    const node1 = [_]u8{0xaa} ** 32;
    const proof_nodes = [_][]const u8{&node1};

    const proof = try StorageProof.from(allocator, key, value, &proof_nodes);
    defer proof.deinit(allocator);

    try std.testing.expectEqual(@as(u256, 42), proof.key.slot);
    try std.testing.expectEqual(@as(usize, 1), proof.proof.len);
    try std.testing.expectEqual(true, proof._owned);
}

test "StorageProof.fromSlot - convenience constructor" {
    const allocator = std.testing.allocator;

    const addr = [_]u8{0x11} ** 20;
    const node1 = [_]u8{0xbb} ** 32;
    const proof_nodes = [_][]const u8{&node1};

    const proof = try StorageProof.fromSlot(allocator, addr, 100, 999, &proof_nodes);
    defer proof.deinit(allocator);

    try std.testing.expectEqual(@as(u256, 100), proof.getSlot());
    try std.testing.expectEqual(@as(u256, 999), proof.getValueU256());
    try std.testing.expect(std.mem.eql(u8, &addr, &proof.getAddress()));
}

test "StorageProof.equals - identical proofs" {
    const addr = [_]u8{0x42} ** 20;
    const key = State.StorageKey{ .address = addr, .slot = 42 };
    const value = StorageValue.fromUint256(123);
    const node1 = [_]u8{0xaa} ** 32;
    const proof_nodes = [_][]const u8{&node1};

    const proof1 = StorageProof.init(key, value, &proof_nodes);
    const proof2 = StorageProof.init(key, value, &proof_nodes);

    try std.testing.expect(StorageProof.equals(&proof1, &proof2));
}

test "StorageProof.equals - different keys" {
    const addr = [_]u8{0x42} ** 20;
    const key1 = State.StorageKey{ .address = addr, .slot = 42 };
    const key2 = State.StorageKey{ .address = addr, .slot = 43 };
    const value = StorageValue.fromUint256(123);
    const node1 = [_]u8{0xaa} ** 32;
    const proof_nodes = [_][]const u8{&node1};

    const proof1 = StorageProof.init(key1, value, &proof_nodes);
    const proof2 = StorageProof.init(key2, value, &proof_nodes);

    try std.testing.expect(!StorageProof.equals(&proof1, &proof2));
}

test "StorageProof.equals - different values" {
    const addr = [_]u8{0x42} ** 20;
    const key = State.StorageKey{ .address = addr, .slot = 42 };
    const value1 = StorageValue.fromUint256(123);
    const value2 = StorageValue.fromUint256(456);
    const node1 = [_]u8{0xaa} ** 32;
    const proof_nodes = [_][]const u8{&node1};

    const proof1 = StorageProof.init(key, value1, &proof_nodes);
    const proof2 = StorageProof.init(key, value2, &proof_nodes);

    try std.testing.expect(!StorageProof.equals(&proof1, &proof2));
}

test "StorageProof.equals - different proof lengths" {
    const addr = [_]u8{0x42} ** 20;
    const key = State.StorageKey{ .address = addr, .slot = 42 };
    const value = StorageValue.fromUint256(123);
    const node1 = [_]u8{0xaa} ** 32;
    const node2 = [_]u8{0xbb} ** 32;
    const proof_nodes1 = [_][]const u8{&node1};
    const proof_nodes2 = [_][]const u8{ &node1, &node2 };

    const proof1 = StorageProof.init(key, value, &proof_nodes1);
    const proof2 = StorageProof.init(key, value, &proof_nodes2);

    try std.testing.expect(!StorageProof.equals(&proof1, &proof2));
}

test "StorageProof.equals - different proof elements" {
    const addr = [_]u8{0x42} ** 20;
    const key = State.StorageKey{ .address = addr, .slot = 42 };
    const value = StorageValue.fromUint256(123);
    const node1 = [_]u8{0xaa} ** 32;
    const node2 = [_]u8{0xbb} ** 32;
    const proof_nodes1 = [_][]const u8{&node1};
    const proof_nodes2 = [_][]const u8{&node2};

    const proof1 = StorageProof.init(key, value, &proof_nodes1);
    const proof2 = StorageProof.init(key, value, &proof_nodes2);

    try std.testing.expect(!StorageProof.equals(&proof1, &proof2));
}

test "StorageProof.isEmpty - empty proof" {
    const addr = [_]u8{0x42} ** 20;
    const key = State.StorageKey{ .address = addr, .slot = 0 };
    const value = StorageValue.ZERO;
    const empty_nodes: []const []const u8 = &.{};

    const proof = StorageProof.init(key, value, empty_nodes);
    try std.testing.expect(proof.isEmpty());
}

test "StorageProof.isEmpty - non-empty proof" {
    const addr = [_]u8{0x42} ** 20;
    const key = State.StorageKey{ .address = addr, .slot = 0 };
    const value = StorageValue.ZERO;
    const node = [_]u8{0xaa} ** 32;
    const proof_nodes = [_][]const u8{&node};

    const proof = StorageProof.init(key, value, &proof_nodes);
    try std.testing.expect(!proof.isEmpty());
}

test "StorageProof.isZeroValue - zero value" {
    const addr = [_]u8{0x42} ** 20;
    const key = State.StorageKey{ .address = addr, .slot = 0 };
    const value = StorageValue.ZERO;
    const empty_nodes: []const []const u8 = &.{};

    const proof = StorageProof.init(key, value, empty_nodes);
    try std.testing.expect(proof.isZeroValue());
}

test "StorageProof.isZeroValue - non-zero value" {
    const addr = [_]u8{0x42} ** 20;
    const key = State.StorageKey{ .address = addr, .slot = 0 };
    const value = StorageValue.fromUint256(1);
    const empty_nodes: []const []const u8 = &.{};

    const proof = StorageProof.init(key, value, empty_nodes);
    try std.testing.expect(!proof.isZeroValue());
}

test "StorageProof.depth - returns correct depth" {
    const addr = [_]u8{0x42} ** 20;
    const key = State.StorageKey{ .address = addr, .slot = 0 };
    const value = StorageValue.ZERO;
    const node1 = [_]u8{0xaa} ** 32;
    const node2 = [_]u8{0xbb} ** 32;
    const node3 = [_]u8{0xcc} ** 32;
    const proof_nodes = [_][]const u8{ &node1, &node2, &node3 };

    const proof = StorageProof.init(key, value, &proof_nodes);
    try std.testing.expectEqual(@as(usize, 3), proof.depth());
}

test "StorageProof.getSlot - returns slot number" {
    const addr = [_]u8{0x42} ** 20;
    const key = State.StorageKey{ .address = addr, .slot = 12345 };
    const value = StorageValue.ZERO;
    const empty_nodes: []const []const u8 = &.{};

    const proof = StorageProof.init(key, value, empty_nodes);
    try std.testing.expectEqual(@as(u256, 12345), proof.getSlot());
}

test "StorageProof.getValueU256 - returns value as u256" {
    const addr = [_]u8{0x42} ** 20;
    const key = State.StorageKey{ .address = addr, .slot = 0 };
    const value = StorageValue.fromUint256(0xdeadbeef);
    const empty_nodes: []const []const u8 = &.{};

    const proof = StorageProof.init(key, value, empty_nodes);
    try std.testing.expectEqual(@as(u256, 0xdeadbeef), proof.getValueU256());
}

test "StorageProof.computeKeyHash - computes keccak256 of slot" {
    const addr = [_]u8{0x42} ** 20;
    const key = State.StorageKey{ .address = addr, .slot = 0 };
    const value = StorageValue.ZERO;
    const empty_nodes: []const []const u8 = &.{};

    const proof = StorageProof.init(key, value, empty_nodes);
    const key_hash = proof.computeKeyHash();

    // Verify by computing manually
    var slot_bytes: [32]u8 = undefined;
    std.mem.writeInt(u256, &slot_bytes, 0, .big);
    const expected = Hash.keccak256(&slot_bytes);

    try std.testing.expect(std.mem.eql(u8, &key_hash, &expected));
}

test "StorageProof.clone - creates independent copy" {
    const allocator = std.testing.allocator;

    const addr = [_]u8{0x42} ** 20;
    const key = State.StorageKey{ .address = addr, .slot = 42 };
    const value = StorageValue.fromUint256(123);
    const node1 = [_]u8{0xaa} ** 32;
    const proof_nodes = [_][]const u8{&node1};

    const original = StorageProof.init(key, value, &proof_nodes);
    const cloned = try original.clone(allocator);
    defer cloned.deinit(allocator);

    try std.testing.expect(StorageProof.equals(&original, &cloned));
    try std.testing.expectEqual(true, cloned._owned);
}

test "StorageProof.from - rejects too deep proof" {
    const allocator = std.testing.allocator;

    const addr = [_]u8{0x42} ** 20;
    const key = State.StorageKey{ .address = addr, .slot = 0 };
    const value = StorageValue.ZERO;

    // Create array of 257 nodes (exceeds MAX_PROOF_DEPTH)
    var nodes: [MAX_PROOF_DEPTH + 1][32]u8 = undefined;
    var node_slices: [MAX_PROOF_DEPTH + 1][]const u8 = undefined;
    for (&nodes, 0..) |*node, i| {
        @memset(node, @as(u8, @intCast(i % 256)));
        node_slices[i] = node;
    }

    const result = StorageProof.from(allocator, key, value, &node_slices);
    try std.testing.expectError(error.ProofTooDeep, result);
}

test "StorageProof - different addresses same slot are not equal" {
    const addr1 = [_]u8{0x11} ** 20;
    const addr2 = [_]u8{0x22} ** 20;
    const key1 = State.StorageKey{ .address = addr1, .slot = 42 };
    const key2 = State.StorageKey{ .address = addr2, .slot = 42 };
    const value = StorageValue.fromUint256(123);
    const empty_nodes: []const []const u8 = &.{};

    const proof1 = StorageProof.init(key1, value, empty_nodes);
    const proof2 = StorageProof.init(key2, value, empty_nodes);

    try std.testing.expect(!StorageProof.equals(&proof1, &proof2));
}
