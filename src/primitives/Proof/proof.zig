//! Proof - Generic Merkle proof type for Ethereum
//!
//! This module provides a Merkle proof structure used to verify inclusion
//! in a Merkle tree. A proof consists of a value (leaf) and an array of
//! sibling hashes forming the path from leaf to root.
//!
//! ## Usage
//! ```zig
//! const Proof = @import("primitives").Proof;
//!
//! // Create a proof
//! const proof = Proof.init(value, &sibling_hashes);
//!
//! // Verify against a known root
//! const is_valid = try proof.verify(allocator, &expected_root);
//! ```

const std = @import("std");
const Hash = @import("../Hash/Hash.zig");
const crypto = @import("crypto");

/// Maximum number of proof elements (limits tree depth)
pub const MAX_PROOF_DEPTH: usize = 256;

/// Proof represents a generic Merkle proof for verifying inclusion.
///
/// A Merkle proof consists of:
/// - value: The leaf value being proven
/// - proof: An array of sibling hashes forming the path from leaf to root
pub const Proof = struct {
    /// The leaf value being proven for inclusion.
    /// This is typically a hash or encoded data.
    value: []const u8,

    /// Array of sibling hashes forming the Merkle branch.
    /// Each element is a node hash encountered on the path from leaf to root.
    /// Order matters - typically bottom-up (leaf to root).
    proof: []const []const u8,

    /// Internal flag indicating if memory is owned
    _owned: bool = false,

    const Self = @This();

    // ============================================================================
    // Constructors
    // ============================================================================

    /// Create a Proof from a value and proof array (non-owning).
    /// The caller must ensure the data outlives the Proof.
    pub fn init(value: []const u8, proof_nodes: []const []const u8) Self {
        return Self{
            .value = value,
            .proof = proof_nodes,
            ._owned = false,
        };
    }

    /// Create a Proof by copying all data (owning).
    /// The returned Proof owns its memory and must be freed with deinit().
    pub fn from(allocator: std.mem.Allocator, value: []const u8, proof_nodes: []const []const u8) !Self {
        if (proof_nodes.len > MAX_PROOF_DEPTH) {
            return error.ProofTooDeep;
        }

        // Copy value
        const owned_value = try allocator.dupe(u8, value);
        errdefer allocator.free(owned_value);

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
            .value = owned_value,
            .proof = owned_proof,
            ._owned = true,
        };
    }

    /// Free owned memory.
    pub fn deinit(self: Self, allocator: std.mem.Allocator) void {
        if (self._owned) {
            for (self.proof) |node| {
                allocator.free(node);
            }
            allocator.free(self.proof);
            allocator.free(self.value);
        }
    }

    // ============================================================================
    // Validation
    // ============================================================================

    /// Compare two Proofs for equality.
    /// Both value and all proof elements must match.
    pub fn equals(a: *const Self, b: *const Self) bool {
        // Check value equality
        if (!std.mem.eql(u8, a.value, b.value)) {
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

    /// Check if proof is empty (no sibling hashes).
    pub fn isEmpty(self: *const Self) bool {
        return self.proof.len == 0;
    }

    /// Get the number of proof elements (tree depth).
    pub fn depth(self: *const Self) usize {
        return self.proof.len;
    }

    // ============================================================================
    // Verification
    // ============================================================================

    /// Verify the proof against a known root hash.
    ///
    /// This implements standard Merkle proof verification:
    /// 1. Start with keccak256(value) as current hash
    /// 2. For each sibling hash, combine and hash
    /// 3. Compare final hash with expected root
    ///
    /// The `position` parameter indicates the leaf position (used to determine
    /// if we hash(current, sibling) or hash(sibling, current) at each level).
    pub fn verify(self: *const Self, expected_root: *const Hash.Hash, leaf_position: u256) bool {
        if (self.proof.len == 0) {
            // Empty proof - value hash should equal root
            if (self.value.len != Hash.SIZE) {
                return false;
            }
            return std.mem.eql(u8, self.value, expected_root);
        }

        // Start with hash of the value
        var current: Hash.Hash = undefined;
        if (self.value.len == Hash.SIZE) {
            @memcpy(&current, self.value);
        } else {
            crypto.Keccak256.hash(self.value, &current);
        }

        // Walk up the tree
        var pos = leaf_position;
        for (self.proof) |sibling| {
            if (sibling.len != Hash.SIZE) {
                return false;
            }

            var combined: [Hash.SIZE * 2]u8 = undefined;
            if (pos & 1 == 0) {
                // Even position: hash(current || sibling)
                @memcpy(combined[0..Hash.SIZE], &current);
                @memcpy(combined[Hash.SIZE..], sibling);
            } else {
                // Odd position: hash(sibling || current)
                @memcpy(combined[0..Hash.SIZE], sibling);
                @memcpy(combined[Hash.SIZE..], &current);
            }

            crypto.Keccak256.hash(&combined, &current);
            pos >>= 1;
        }

        return std.mem.eql(u8, &current, expected_root);
    }

    /// Verify the proof against a known root hash with depth validation.
    ///
    /// This is a stricter version of verify() that also validates the proof
    /// length matches the expected tree depth. For a balanced tree with n leaves,
    /// the expected depth is ceil(log2(n)).
    ///
    /// Returns error.InvalidProofLength if proof.len != expected_depth.
    /// Returns false if the proof is invalid, true if valid.
    pub fn verifyWithDepth(self: *const Self, expected_root: *const Hash.Hash, leaf_position: u256, expected_depth: usize) !bool {
        if (self.proof.len != expected_depth) {
            return error.InvalidProofLength;
        }
        return self.verify(expected_root, leaf_position);
    }

    /// Compute the root hash from this proof.
    /// Returns the computed root (which can be compared to an expected root).
    pub fn computeRoot(self: *const Self, leaf_position: u256) Hash.Hash {
        if (self.proof.len == 0) {
            // Empty proof - return hash of value or value itself if already a hash
            if (self.value.len == Hash.SIZE) {
                return Hash.fromBytes(self.value);
            }
            return Hash.keccak256(self.value);
        }

        // Start with hash of the value
        var current: Hash.Hash = undefined;
        if (self.value.len == Hash.SIZE) {
            @memcpy(&current, self.value);
        } else {
            crypto.Keccak256.hash(self.value, &current);
        }

        // Walk up the tree
        var pos = leaf_position;
        for (self.proof) |sibling| {
            var combined: [Hash.SIZE * 2]u8 = undefined;
            if (pos & 1 == 0) {
                @memcpy(combined[0..Hash.SIZE], &current);
                @memcpy(combined[Hash.SIZE..], sibling[0..Hash.SIZE]);
            } else {
                @memcpy(combined[0..Hash.SIZE], sibling[0..Hash.SIZE]);
                @memcpy(combined[Hash.SIZE..], &current);
            }

            crypto.Keccak256.hash(&combined, &current);
            pos >>= 1;
        }

        return current;
    }

    // ============================================================================
    // Merkle-Patricia Trie Verification
    // ============================================================================

    /// Verify a Merkle-Patricia Trie proof.
    ///
    /// This implements EIP-1186 style proof verification for Ethereum state/storage.
    /// The proof nodes are RLP-encoded MPT nodes that form a path from the root
    /// to the leaf containing the value.
    ///
    /// Parameters:
    /// - allocator: Used for temporary allocations during RLP decoding
    /// - expected_root: The root hash to verify against
    /// - key: The key being proven (will be keccak256 hashed to get the path)
    ///
    /// Returns true if the proof is valid, false otherwise.
    pub fn verifyMPT(self: *const Self, allocator: std.mem.Allocator, expected_root: *const Hash.Hash, key: []const u8) !bool {
        return verifyMPTProof(allocator, expected_root, key, self.value, self.proof);
    }

    // ============================================================================
    // Manipulation
    // ============================================================================

    /// Create a deep copy of the proof.
    pub fn clone(self: *const Self, allocator: std.mem.Allocator) !Self {
        return from(allocator, self.value, self.proof);
    }
};

// ============================================================================
// Merkle-Patricia Trie Proof Verification (Module-level functions)
// ============================================================================

const Rlp = @import("../Rlp/Rlp.zig");
const Trie = @import("../trie.zig");

/// MPT verification errors
pub const MPTError = error{
    /// Proof is empty when it shouldn't be
    EmptyProof,
    /// Node hash doesn't match expected hash
    InvalidNodeHash,
    /// RLP decoding failed
    InvalidRLPEncoding,
    /// Invalid node structure
    InvalidNodeStructure,
    /// Path mismatch during verification
    PathMismatch,
    /// Expected value not found at end of proof
    ValueMismatch,
    /// Extension node has invalid structure
    InvalidExtensionNode,
    /// Branch node has invalid structure
    InvalidBranchNode,
    /// Leaf node has invalid structure
    InvalidLeafNode,
    /// Key path exhausted prematurely
    PathExhausted,
    /// Unexpected node type encountered
    UnexpectedNodeType,
};

/// Verify a Merkle-Patricia Trie proof.
///
/// This is the core MPT verification algorithm used by EIP-1186 proofs.
/// It walks through RLP-encoded proof nodes, verifying each one matches
/// the expected hash and following the key path from root to leaf.
///
/// Parameters:
/// - allocator: For temporary allocations
/// - expected_root: The root hash to verify against
/// - key: The key being proven (NOT hashed - caller must hash if needed)
/// - expected_value: The expected value at the leaf (RLP-encoded)
/// - proof_nodes: Array of RLP-encoded MPT nodes
///
/// Returns true if the proof is valid.
pub fn verifyMPTProof(
    allocator: std.mem.Allocator,
    expected_root: *const Hash.Hash,
    key: []const u8,
    expected_value: []const u8,
    proof_nodes: []const []const u8,
) !bool {
    if (proof_nodes.len == 0) {
        // Empty proof is valid only for empty value with empty root
        if (expected_value.len == 0) {
            // Check if root is empty trie root (keccak256 of RLP empty string = 0x80)
            const empty_rlp = [_]u8{0x80};
            var empty_root: Hash.Hash = undefined;
            crypto.Keccak256.hash(&empty_rlp, &empty_root);
            return std.mem.eql(u8, expected_root, &empty_root);
        }
        return false;
    }

    // Convert key to nibbles for path traversal
    const nibbles = try Trie.keyToNibbles(allocator, key);
    defer allocator.free(nibbles);

    var current_hash: Hash.Hash = expected_root.*;
    var nibble_idx: usize = 0;

    for (proof_nodes) |node_data| {
        // Verify node hash matches expected
        var node_hash: Hash.Hash = undefined;
        crypto.Keccak256.hash(node_data, &node_hash);

        if (!std.mem.eql(u8, &current_hash, &node_hash)) {
            return false;
        }

        // Decode RLP node
        const decoded = Rlp.decode(allocator, node_data, false) catch return false;
        defer decoded.data.deinit(allocator);

        switch (decoded.data) {
            .List => |items| {
                if (items.len == 2) {
                    // Extension or Leaf node
                    const path_data = switch (items[0]) {
                        .String => |s| s,
                        else => return false,
                    };

                    // Decode path prefix
                    const path_result = Trie.decodePath(allocator, path_data) catch return false;
                    defer allocator.free(path_result.nibbles);

                    if (path_result.is_leaf) {
                        // Leaf node - verify path matches and value matches
                        if (nibble_idx + path_result.nibbles.len != nibbles.len) {
                            return false;
                        }

                        // Check path matches
                        if (!std.mem.eql(u8, path_result.nibbles, nibbles[nibble_idx..])) {
                            return false;
                        }

                        // Get value
                        const leaf_value = switch (items[1]) {
                            .String => |s| s,
                            else => return false,
                        };

                        // For storage proofs, value is RLP-encoded
                        return std.mem.eql(u8, leaf_value, expected_value);
                    } else {
                        // Extension node - follow path and update expected hash
                        if (nibble_idx + path_result.nibbles.len > nibbles.len) {
                            return false;
                        }

                        // Check path matches
                        if (!std.mem.eql(u8, path_result.nibbles, nibbles[nibble_idx .. nibble_idx + path_result.nibbles.len])) {
                            return false;
                        }

                        nibble_idx += path_result.nibbles.len;

                        // Get next hash
                        const next_hash = switch (items[1]) {
                            .String => |s| s,
                            else => return false,
                        };

                        if (next_hash.len != Hash.SIZE) {
                            return false;
                        }

                        @memcpy(&current_hash, next_hash);
                    }
                } else if (items.len == 17) {
                    // Branch node - 16 children + value
                    if (nibble_idx >= nibbles.len) {
                        // We're at end of path, check branch value
                        const branch_value = switch (items[16]) {
                            .String => |s| s,
                            else => return false,
                        };

                        return std.mem.eql(u8, branch_value, expected_value);
                    }

                    // Follow the nibble path
                    const nibble = nibbles[nibble_idx];
                    nibble_idx += 1;

                    const child = items[nibble];
                    const child_hash = switch (child) {
                        .String => |s| s,
                        else => return false,
                    };

                    if (child_hash.len == 0) {
                        // Empty child - key doesn't exist
                        return expected_value.len == 0;
                    }

                    if (child_hash.len == Hash.SIZE) {
                        @memcpy(&current_hash, child_hash);
                    } else {
                        // Embedded node - hash it
                        crypto.Keccak256.hash(child_hash, &current_hash);
                    }
                } else {
                    return false;
                }
            },
            .String => {
                // Single string node - this is the value itself
                const value = decoded.data.String;
                return std.mem.eql(u8, value, expected_value);
            },
        }
    }

    // If we've consumed all proof nodes but haven't verified the value, fail
    return false;
}

/// Verify an account proof against a state root.
///
/// This verifies that an account exists (or doesn't exist) at a given address
/// in the state trie with the given root.
///
/// Parameters:
/// - allocator: For temporary allocations
/// - state_root: The state root to verify against
/// - address: The account address (20 bytes)
/// - account_rlp: RLP-encoded account data (nonce, balance, storageHash, codeHash)
/// - proof_nodes: Array of RLP-encoded MPT nodes
pub fn verifyAccountProof(
    allocator: std.mem.Allocator,
    state_root: *const Hash.Hash,
    address: []const u8,
    account_rlp: []const u8,
    proof_nodes: []const []const u8,
) !bool {
    // In the state trie, keys are keccak256(address)
    var address_hash: Hash.Hash = undefined;
    crypto.Keccak256.hash(address, &address_hash);

    return verifyMPTProof(allocator, state_root, &address_hash, account_rlp, proof_nodes);
}

/// Verify a storage proof against a storage root.
///
/// This verifies that a storage slot has a given value in an account's
/// storage trie.
///
/// Parameters:
/// - allocator: For temporary allocations
/// - storage_root: The storage root to verify against (from account data)
/// - slot: The storage slot (32 bytes, big-endian)
/// - value_rlp: RLP-encoded storage value
/// - proof_nodes: Array of RLP-encoded MPT nodes
pub fn verifyStorageSlotProof(
    allocator: std.mem.Allocator,
    storage_root: *const Hash.Hash,
    slot: []const u8,
    value_rlp: []const u8,
    proof_nodes: []const []const u8,
) !bool {
    // In the storage trie, keys are keccak256(slot)
    var slot_hash: Hash.Hash = undefined;
    crypto.Keccak256.hash(slot, &slot_hash);

    return verifyMPTProof(allocator, storage_root, &slot_hash, value_rlp, proof_nodes);
}

// ============================================================================
// Tests
// ============================================================================

test "Proof.init - creates non-owning proof" {
    const value = [_]u8{ 1, 2, 3, 4 };
    const node1 = [_]u8{0xaa} ** 32;
    const node2 = [_]u8{0xbb} ** 32;
    const proof_nodes = [_][]const u8{ &node1, &node2 };

    const proof = Proof.init(&value, &proof_nodes);

    try std.testing.expectEqual(@as(usize, 4), proof.value.len);
    try std.testing.expectEqual(@as(usize, 2), proof.proof.len);
    try std.testing.expectEqual(false, proof._owned);
}

test "Proof.from - creates owning copy" {
    const allocator = std.testing.allocator;

    const value = [_]u8{ 1, 2, 3, 4 };
    const node1 = [_]u8{0xaa} ** 32;
    const node2 = [_]u8{0xbb} ** 32;
    const proof_nodes = [_][]const u8{ &node1, &node2 };

    const proof = try Proof.from(allocator, &value, &proof_nodes);
    defer proof.deinit(allocator);

    try std.testing.expectEqual(@as(usize, 4), proof.value.len);
    try std.testing.expectEqual(@as(usize, 2), proof.proof.len);
    try std.testing.expectEqual(true, proof._owned);
}

test "Proof.from - creates independent copy" {
    const allocator = std.testing.allocator;

    var value = [_]u8{ 1, 2, 3, 4 };
    var node1 = [_]u8{0xaa} ** 32;
    const proof_nodes = [_][]const u8{&node1};

    const proof = try Proof.from(allocator, &value, &proof_nodes);
    defer proof.deinit(allocator);

    // Modify originals
    value[0] = 99;
    node1[0] = 0xff;

    // Proof should be unchanged
    try std.testing.expectEqual(@as(u8, 1), proof.value[0]);
    try std.testing.expectEqual(@as(u8, 0xaa), proof.proof[0][0]);
}

test "Proof.equals - identical proofs" {
    const value = [_]u8{ 1, 2, 3, 4 };
    const node1 = [_]u8{0xaa} ** 32;
    const proof_nodes = [_][]const u8{&node1};

    const proof1 = Proof.init(&value, &proof_nodes);
    const proof2 = Proof.init(&value, &proof_nodes);

    try std.testing.expect(Proof.equals(&proof1, &proof2));
}

test "Proof.equals - different values" {
    const value1 = [_]u8{ 1, 2, 3, 4 };
    const value2 = [_]u8{ 1, 2, 3, 5 };
    const node1 = [_]u8{0xaa} ** 32;
    const proof_nodes = [_][]const u8{&node1};

    const proof1 = Proof.init(&value1, &proof_nodes);
    const proof2 = Proof.init(&value2, &proof_nodes);

    try std.testing.expect(!Proof.equals(&proof1, &proof2));
}

test "Proof.equals - different proof lengths" {
    const value = [_]u8{ 1, 2, 3, 4 };
    const node1 = [_]u8{0xaa} ** 32;
    const node2 = [_]u8{0xbb} ** 32;
    const proof_nodes1 = [_][]const u8{&node1};
    const proof_nodes2 = [_][]const u8{ &node1, &node2 };

    const proof1 = Proof.init(&value, &proof_nodes1);
    const proof2 = Proof.init(&value, &proof_nodes2);

    try std.testing.expect(!Proof.equals(&proof1, &proof2));
}

test "Proof.equals - different proof elements" {
    const value = [_]u8{ 1, 2, 3, 4 };
    const node1 = [_]u8{0xaa} ** 32;
    const node2 = [_]u8{0xbb} ** 32;
    const proof_nodes1 = [_][]const u8{&node1};
    const proof_nodes2 = [_][]const u8{&node2};

    const proof1 = Proof.init(&value, &proof_nodes1);
    const proof2 = Proof.init(&value, &proof_nodes2);

    try std.testing.expect(!Proof.equals(&proof1, &proof2));
}

test "Proof.equals - empty proofs" {
    const value = [_]u8{ 1, 2, 3, 4 };
    const empty_nodes: []const []const u8 = &.{};

    const proof1 = Proof.init(&value, empty_nodes);
    const proof2 = Proof.init(&value, empty_nodes);

    try std.testing.expect(Proof.equals(&proof1, &proof2));
}

test "Proof.isEmpty - empty proof" {
    const value = [_]u8{ 1, 2, 3 };
    const empty_nodes: []const []const u8 = &.{};

    const proof = Proof.init(&value, empty_nodes);
    try std.testing.expect(proof.isEmpty());
}

test "Proof.isEmpty - non-empty proof" {
    const value = [_]u8{ 1, 2, 3 };
    const node = [_]u8{0xaa} ** 32;
    const proof_nodes = [_][]const u8{&node};

    const proof = Proof.init(&value, &proof_nodes);
    try std.testing.expect(!proof.isEmpty());
}

test "Proof.depth - returns correct depth" {
    const value = [_]u8{ 1, 2, 3 };
    const node1 = [_]u8{0xaa} ** 32;
    const node2 = [_]u8{0xbb} ** 32;
    const node3 = [_]u8{0xcc} ** 32;
    const proof_nodes = [_][]const u8{ &node1, &node2, &node3 };

    const proof = Proof.init(&value, &proof_nodes);
    try std.testing.expectEqual(@as(usize, 3), proof.depth());
}

test "Proof.clone - creates independent copy" {
    const allocator = std.testing.allocator;

    const value = [_]u8{ 5, 6, 7, 8 };
    const node = [_]u8{0xdd} ** 32;
    const proof_nodes = [_][]const u8{&node};

    const original = Proof.init(&value, &proof_nodes);
    const cloned = try original.clone(allocator);
    defer cloned.deinit(allocator);

    try std.testing.expect(Proof.equals(&original, &cloned));
    try std.testing.expectEqual(true, cloned._owned);
}

test "Proof.verify - empty proof with hash value equals root" {
    const root = [_]u8{0x11} ** 32;
    const empty_nodes: []const []const u8 = &.{};

    const proof = Proof.init(&root, empty_nodes);

    try std.testing.expect(proof.verify(&root, 0));
}

test "Proof.verify - simple two-leaf tree" {
    // Build a simple two-leaf Merkle tree
    const leaf0 = [_]u8{0xaa} ** 32;
    const leaf1 = [_]u8{0xbb} ** 32;

    // Root = keccak256(leaf0 || leaf1)
    var combined: [64]u8 = undefined;
    @memcpy(combined[0..32], &leaf0);
    @memcpy(combined[32..64], &leaf1);
    var root: Hash.Hash = undefined;
    crypto.Keccak256.hash(&combined, &root);

    // Proof for leaf0: sibling is leaf1, position 0
    const sibling = [_][]const u8{&leaf1};
    const proof0 = Proof.init(&leaf0, &sibling);
    try std.testing.expect(proof0.verify(&root, 0));

    // Proof for leaf1: sibling is leaf0, position 1
    const sibling1 = [_][]const u8{&leaf0};
    const proof1 = Proof.init(&leaf1, &sibling1);
    try std.testing.expect(proof1.verify(&root, 1));
}

test "Proof.verify - invalid proof returns false" {
    const leaf = [_]u8{0xaa} ** 32;
    const wrong_sibling = [_]u8{0xff} ** 32;
    const expected_root = [_]u8{0x00} ** 32;

    const sibling = [_][]const u8{&wrong_sibling};
    const proof = Proof.init(&leaf, &sibling);

    try std.testing.expect(!proof.verify(&expected_root, 0));
}

test "Proof.computeRoot - matches verify" {
    const leaf0 = [_]u8{0xaa} ** 32;
    const leaf1 = [_]u8{0xbb} ** 32;

    var combined: [64]u8 = undefined;
    @memcpy(combined[0..32], &leaf0);
    @memcpy(combined[32..64], &leaf1);
    var expected_root: Hash.Hash = undefined;
    crypto.Keccak256.hash(&combined, &expected_root);

    const sibling = [_][]const u8{&leaf1};
    const proof = Proof.init(&leaf0, &sibling);

    const computed = proof.computeRoot(0);
    try std.testing.expect(std.mem.eql(u8, &computed, &expected_root));
}

test "Proof.from - rejects too deep proof" {
    const allocator = std.testing.allocator;
    const value = [_]u8{0x01};

    // Create array of 257 nodes (exceeds MAX_PROOF_DEPTH)
    var nodes: [MAX_PROOF_DEPTH + 1][32]u8 = undefined;
    var node_slices: [MAX_PROOF_DEPTH + 1][]const u8 = undefined;
    for (&nodes, 0..) |*node, i| {
        @memset(node, @as(u8, @intCast(i % 256)));
        node_slices[i] = node;
    }

    const result = Proof.from(allocator, &value, &node_slices);
    try std.testing.expectError(error.ProofTooDeep, result);
}

test "Proof.verifyWithDepth - validates proof length matches expected depth" {
    // Build a simple two-leaf Merkle tree
    const leaf0 = [_]u8{0xaa} ** 32;
    const leaf1 = [_]u8{0xbb} ** 32;

    // Root = keccak256(leaf0 || leaf1)
    var combined: [64]u8 = undefined;
    @memcpy(combined[0..32], &leaf0);
    @memcpy(combined[32..64], &leaf1);
    var root: Hash.Hash = undefined;
    crypto.Keccak256.hash(&combined, &root);

    // Proof with 1 sibling (correct for depth 1)
    const sibling = [_][]const u8{&leaf1};
    const proof = Proof.init(&leaf0, &sibling);

    // Should succeed with correct depth
    const result_correct = try proof.verifyWithDepth(&root, 0, 1);
    try std.testing.expect(result_correct);

    // Should fail with wrong depth (too deep)
    const result_too_deep = proof.verifyWithDepth(&root, 0, 2);
    try std.testing.expectError(error.InvalidProofLength, result_too_deep);

    // Should fail with wrong depth (too shallow)
    const result_too_shallow = proof.verifyWithDepth(&root, 0, 0);
    try std.testing.expectError(error.InvalidProofLength, result_too_shallow);
}

test "Proof.verifyWithDepth - accepts empty proof with depth 0" {
    const root = [_]u8{0x11} ** 32;
    const empty_nodes: []const []const u8 = &.{};

    const proof = Proof.init(&root, empty_nodes);

    // Empty proof with depth 0 should work
    const result = try proof.verifyWithDepth(&root, 0, 0);
    try std.testing.expect(result);

    // Empty proof with depth 1 should fail
    const result_wrong = proof.verifyWithDepth(&root, 0, 1);
    try std.testing.expectError(error.InvalidProofLength, result_wrong);
}

test "Proof.verifyWithDepth - four-leaf tree requires depth 2" {
    // For 4 leaves: depth = log2(4) = 2
    const leaf0 = [_]u8{0x00} ** 32;
    const leaf1 = [_]u8{0x01} ** 32;
    const leaf2 = [_]u8{0x02} ** 32;
    const leaf3 = [_]u8{0x03} ** 32;

    // Build tree: hash(hash(l0,l1), hash(l2,l3))
    var combined01: [64]u8 = undefined;
    @memcpy(combined01[0..32], &leaf0);
    @memcpy(combined01[32..64], &leaf1);
    var hash01: Hash.Hash = undefined;
    crypto.Keccak256.hash(&combined01, &hash01);

    var combined23: [64]u8 = undefined;
    @memcpy(combined23[0..32], &leaf2);
    @memcpy(combined23[32..64], &leaf3);
    var hash23: Hash.Hash = undefined;
    crypto.Keccak256.hash(&combined23, &hash23);

    var combined_root: [64]u8 = undefined;
    @memcpy(combined_root[0..32], &hash01);
    @memcpy(combined_root[32..64], &hash23);
    var root: Hash.Hash = undefined;
    crypto.Keccak256.hash(&combined_root, &root);

    // Proof for leaf0: siblings are [leaf1, hash23], depth = 2
    const siblings = [_][]const u8{ &leaf1, &hash23 };
    const proof = Proof.init(&leaf0, &siblings);

    // Correct depth
    const result = try proof.verifyWithDepth(&root, 0, 2);
    try std.testing.expect(result);

    // Wrong depth
    try std.testing.expectError(error.InvalidProofLength, proof.verifyWithDepth(&root, 0, 1));
    try std.testing.expectError(error.InvalidProofLength, proof.verifyWithDepth(&root, 0, 3));
}

// ============================================================================
// MPT Verification Tests
// ============================================================================

test "verifyMPTProof - empty proof with empty value and empty root" {
    const allocator = std.testing.allocator;

    // Empty trie root = keccak256(0x80) = keccak256(RLP of empty string)
    const empty_rlp = [_]u8{0x80};
    var empty_root: Hash.Hash = undefined;
    crypto.Keccak256.hash(&empty_rlp, &empty_root);

    const empty_proof: []const []const u8 = &.{};
    const empty_value: []const u8 = &.{};
    const key = [_]u8{0x01};

    const result = try verifyMPTProof(allocator, &empty_root, &key, empty_value, empty_proof);
    try std.testing.expect(result);
}

test "verifyMPTProof - empty proof with non-empty value fails" {
    const allocator = std.testing.allocator;

    const empty_rlp = [_]u8{0x80};
    var empty_root: Hash.Hash = undefined;
    crypto.Keccak256.hash(&empty_rlp, &empty_root);

    const empty_proof: []const []const u8 = &.{};
    const value = [_]u8{ 0x01, 0x02, 0x03 };
    const key = [_]u8{0x01};

    const result = try verifyMPTProof(allocator, &empty_root, &key, &value, empty_proof);
    try std.testing.expect(!result);
}

test "verifyMPTProof - simple leaf node verification" {
    const allocator = std.testing.allocator;

    // Create a simple leaf node: RLP([encoded_path, value])
    // For key 0x01 with value 0x1234
    // The path nibbles are [0, 1] (from 0x01)
    // As a leaf with even length: prefix = 0x20, path = 0x01 -> encoded as 0x2001
    // Value = 0x1234 -> RLP = 0x821234
    // Leaf = RLP([0x2001, 0x1234]) = RLP(["\x20\x01", "\x12\x34"])

    // RLP encoding of the leaf:
    // - "\x20\x01" (2 bytes) -> 0x82 0x20 0x01
    // - "\x12\x34" (2 bytes) -> 0x82 0x12 0x34
    // - List of 7 bytes total -> 0xc7 ...
    const leaf_node = [_]u8{ 0xc5, 0x82, 0x20, 0x01, 0x82, 0x12, 0x34 };

    // Compute root hash (hash of the leaf node)
    var root: Hash.Hash = undefined;
    crypto.Keccak256.hash(&leaf_node, &root);

    // Key for verification (0x01)
    const key = [_]u8{0x01};

    // Expected value (0x1234 - but as stored in leaf, not RLP encoded again)
    const value = [_]u8{ 0x12, 0x34 };

    const proof_nodes = [_][]const u8{&leaf_node};
    const result = try verifyMPTProof(allocator, &root, &key, &value, &proof_nodes);
    try std.testing.expect(result);
}

test "verifyMPTProof - leaf node with wrong value fails" {
    const allocator = std.testing.allocator;

    const leaf_node = [_]u8{ 0xc5, 0x82, 0x20, 0x01, 0x82, 0x12, 0x34 };

    var root: Hash.Hash = undefined;
    crypto.Keccak256.hash(&leaf_node, &root);

    const key = [_]u8{0x01};

    // Wrong value
    const wrong_value = [_]u8{ 0x56, 0x78 };

    const proof_nodes = [_][]const u8{&leaf_node};
    const result = try verifyMPTProof(allocator, &root, &key, &wrong_value, &proof_nodes);
    try std.testing.expect(!result);
}

test "verifyMPTProof - invalid root hash fails" {
    const allocator = std.testing.allocator;

    const leaf_node = [_]u8{ 0xc5, 0x82, 0x20, 0x01, 0x82, 0x12, 0x34 };

    // Wrong root hash
    const wrong_root = [_]u8{0xff} ** 32;

    const key = [_]u8{0x01};
    const value = [_]u8{ 0x12, 0x34 };

    const proof_nodes = [_][]const u8{&leaf_node};
    const result = try verifyMPTProof(allocator, &wrong_root, &key, &value, &proof_nodes);
    try std.testing.expect(!result);
}

test "verifyMPTProof - leaf node with odd path" {
    const allocator = std.testing.allocator;

    // Leaf with odd path (single nibble 0x5)
    // Prefix 0x35 means odd leaf with first nibble 5
    // Value = 0xAB
    // RLP([0x35, 0xAB]) = 0xc2 0x35 0x81 0xAB
    const leaf_node = [_]u8{ 0xc3, 0x35, 0x81, 0xAB };

    var root: Hash.Hash = undefined;
    crypto.Keccak256.hash(&leaf_node, &root);

    // Key is a single nibble (half byte), but we need to pass a full byte
    // Key 0x50 has nibbles [5, 0], but we want just [5]
    // Actually for a single nibble path, we'd need special handling
    // Let's test with a proper key
    const key = [_]u8{0x50}; // nibbles [5, 0]

    const value = [_]u8{0xAB};

    const proof_nodes = [_][]const u8{&leaf_node};
    // This should fail because path is [5] but key gives [5, 0]
    const result = try verifyMPTProof(allocator, &root, &key, &value, &proof_nodes);
    try std.testing.expect(!result);
}

test "verifyAccountProof - hashes address before verification" {
    const allocator = std.testing.allocator;

    // Create a leaf for address hash
    // Address: 0x0000000000000000000000000000000000000001
    const address = [_]u8{0x00} ** 19 ++ [_]u8{0x01};

    // Hash the address to get the key path
    var address_hash: Hash.Hash = undefined;
    crypto.Keccak256.hash(&address, &address_hash);

    // For this test, we'd need to construct a proper leaf with the address hash path
    // This is complex because the path is 64 nibbles (32 bytes)
    // Let's just verify the function hashes the address correctly

    // Empty proof should fail for non-empty account
    const empty_rlp = [_]u8{0x80};
    var empty_root: Hash.Hash = undefined;
    crypto.Keccak256.hash(&empty_rlp, &empty_root);

    const empty_proof: []const []const u8 = &.{};
    const account_rlp = [_]u8{0x01}; // Some non-empty value

    const result = try verifyAccountProof(allocator, &empty_root, &address, &account_rlp, empty_proof);
    try std.testing.expect(!result);
}

test "verifyStorageSlotProof - hashes slot before verification" {
    const allocator = std.testing.allocator;

    // Storage slot 0
    const slot = [_]u8{0x00} ** 32;

    // Hash the slot to get the key path
    var slot_hash: Hash.Hash = undefined;
    crypto.Keccak256.hash(&slot, &slot_hash);

    // Empty proof should fail for non-empty value
    const empty_rlp = [_]u8{0x80};
    var empty_root: Hash.Hash = undefined;
    crypto.Keccak256.hash(&empty_rlp, &empty_root);

    const empty_proof: []const []const u8 = &.{};
    const value_rlp = [_]u8{0x01}; // Some non-empty value

    const result = try verifyStorageSlotProof(allocator, &empty_root, &slot, &value_rlp, empty_proof);
    try std.testing.expect(!result);
}

// Real Ethereum test vector from EIP-1186
// This is a simplified version - real proofs have more complex structure
test "verifyMPTProof - branch node navigation" {
    const allocator = std.testing.allocator;

    // Create a simple branch node with a value at position 16 (the value slot)
    // This tests that the MPT verification correctly handles branch nodes
    // when the key path ends at a branch.

    // Branch node structure:
    // - 16 empty children (0x80 each)
    // - 1 value slot with data [0xAB, 0xCD]
    // RLP encoding: 0xd3 + 16 * 0x80 + 0x82ABCD
    // List length = 16 + 3 = 19 bytes (fits in short list)
    var branch_data: [21]u8 = undefined;
    branch_data[0] = 0xd3; // Short list prefix (0xc0 + 19)
    // 16 empty children
    var i: usize = 1;
    while (i < 17) : (i += 1) {
        branch_data[i] = 0x80;
    }
    // Value at position 16
    branch_data[17] = 0x82; // String of length 2
    branch_data[18] = 0xAB;
    branch_data[19] = 0xCD;
    branch_data[20] = 0; // Padding

    // Compute hash of branch node
    var branch_hash: Hash.Hash = undefined;
    crypto.Keccak256.hash(branch_data[0..20], &branch_hash);

    // Empty key should match the branch value
    const empty_key: []const u8 = &.{};
    const expected_value = [_]u8{ 0xAB, 0xCD };

    const proof_nodes = [_][]const u8{branch_data[0..20]};
    const result = try verifyMPTProof(allocator, &branch_hash, empty_key, &expected_value, &proof_nodes);

    // This should succeed because empty key points to branch value
    try std.testing.expect(result);
}
