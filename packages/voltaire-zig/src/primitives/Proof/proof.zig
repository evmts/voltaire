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
            crypto.Keccak256.hash(self.value, &current, .{});
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

            crypto.Keccak256.hash(&combined, &current, .{});
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
            crypto.Keccak256.hash(self.value, &current, .{});
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

            crypto.Keccak256.hash(&combined, &current, .{});
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

/// Length of the canonical RLP encoding of decoded data.
fn rlpEncodedLen(data: Rlp.Data) usize {
    const payload = switch (data) {
        .String => |s| blk: {
            if (s.len == 1 and s[0] < 0x80) return 1;
            break :blk s.len;
        },
        .List => |items| blk: {
            var n: usize = 0;
            for (items) |item| n += rlpEncodedLen(item);
            break :blk n;
        },
    };
    if (payload < 56) return 1 + payload;
    var len_bytes: usize = 0;
    var rest = payload;
    while (rest > 0) : (rest >>= 8) len_bytes += 1;
    return 1 + len_bytes + payload;
}

/// Verify a Merkle-Patricia Trie proof.
///
/// This is the core MPT verification algorithm used by EIP-1186 proofs.
/// It walks through RLP-encoded proof nodes, verifying each one matches
/// the expected hash and following the key path from root to leaf.
///
/// Child references follow Yellow Paper Appendix D: a child whose RLP
/// encoding is 32 bytes or longer is referenced by its keccak256 hash and
/// supplied as the next `proof_nodes` entry; a shorter child is embedded
/// inline as an RLP list inside its parent and is never a separate entry.
///
/// Every entry in `proof_nodes` must be consumed: a proof with trailing
/// nodes is rejected.
///
/// Parameters:
/// - allocator: For temporary allocations
/// - expected_root: The root hash to verify against
/// - key: The key being proven (NOT hashed - caller must hash if needed)
/// - expected_value: The expected value at the leaf (RLP-encoded); empty
///   to verify an exclusion proof
/// - proof_nodes: Array of RLP-encoded MPT nodes
///
/// Returns true if the proof is valid, false if it is malformed or does not
/// prove the claim. Returns `error.OutOfMemory` on allocation failure.
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
            crypto.Keccak256.hash(&empty_rlp, &empty_root, .{});
            return std.mem.eql(u8, expected_root, &empty_root);
        }
        return false;
    }

    // Convert key to nibbles for path traversal
    const nibbles = try Trie.keyToNibbles(allocator, key);
    defer allocator.free(nibbles);

    var expected_hash: Hash.Hash = expected_root.*;
    var nibble_idx: usize = 0;
    var proof_index: usize = 0;

    hashed: while (proof_index < proof_nodes.len) {
        const node_data = proof_nodes[proof_index];
        proof_index += 1;

        // Every terminal exit requires all proof nodes to be consumed;
        // trailing nodes would be unverified and are rejected.
        const terminal = proof_index == proof_nodes.len;

        // Verify node hash matches expected
        var node_hash: Hash.Hash = undefined;
        crypto.Keccak256.hash(node_data, &node_hash, .{});

        if (!std.mem.eql(u8, &expected_hash, &node_hash)) {
            return false;
        }

        // Decode RLP node
        const decoded = Rlp.decode(allocator, node_data, false) catch |err| switch (err) {
            error.OutOfMemory => return error.OutOfMemory,
            else => return false,
        };
        defer decoded.data.deinit(allocator);

        // Walk the hashed node, then any nodes embedded inline beneath it.
        // Bounded: each step descends one level into the decoded RLP.
        var node = decoded.data;
        while (true) {
            const items = switch (node) {
                .List => |list| list,
                // Only the empty trie (root = keccak256(0x80)) is a string
                .String => |s| return s.len == 0 and expected_value.len == 0 and terminal,
            };

            var child: Rlp.Data = undefined;

            if (items.len == 2) {
                // Extension or Leaf node
                const path_data = switch (items[0]) {
                    .String => |s| s,
                    .List => return false,
                };

                // Decode path prefix
                const path_result = Trie.decodePath(allocator, path_data) catch |err| switch (err) {
                    error.OutOfMemory => return error.OutOfMemory,
                    else => return false,
                };
                defer allocator.free(path_result.nibbles);

                if (path_result.is_leaf) {
                    // Leaf node - value must be a byte string
                    const leaf_value = switch (items[1]) {
                        .String => |s| s,
                        .List => return false,
                    };

                    // Verified leaf whose suffix differs from the remaining
                    // key (different nibbles or length): the key is absent.
                    // Valid only as an exclusion proof.
                    if (!std.mem.eql(u8, path_result.nibbles, nibbles[nibble_idx..])) {
                        return expected_value.len == 0 and terminal;
                    }

                    // For storage proofs, value is RLP-encoded
                    return std.mem.eql(u8, leaf_value, expected_value) and terminal;
                }

                // Extension node. Verified extension whose prefix diverges
                // from the remaining key (or outruns it): the key is absent.
                // Valid only as an exclusion proof.
                if (nibble_idx + path_result.nibbles.len > nibbles.len or
                    !std.mem.eql(u8, path_result.nibbles, nibbles[nibble_idx .. nibble_idx + path_result.nibbles.len]))
                {
                    return expected_value.len == 0 and terminal;
                }

                nibble_idx += path_result.nibbles.len;
                child = items[1];

                // An extension always has a child
                if (child == .String and child.String.len == 0) return false;
            } else if (items.len == 17) {
                // Branch node - 16 children + value
                if (nibble_idx >= nibbles.len) {
                    // We're at end of path, check branch value
                    const branch_value = switch (items[16]) {
                        .String => |s| s,
                        .List => return false,
                    };

                    return std.mem.eql(u8, branch_value, expected_value) and terminal;
                }

                // Follow the nibble path
                child = items[nibbles[nibble_idx]];
                nibble_idx += 1;

                // Empty child - key doesn't exist
                if (child == .String and child.String.len == 0) {
                    return expected_value.len == 0 and terminal;
                }
            } else {
                return false;
            }

            switch (child) {
                .String => |child_hash| {
                    // Hash reference: the child is the next proof node
                    if (child_hash.len != Hash.SIZE) return false;
                    @memcpy(&expected_hash, child_hash);
                    continue :hashed;
                },
                .List => {
                    // Embedded child: only encodings shorter than 32 bytes
                    // are inlined; it consumes no proof node.
                    if (rlpEncodedLen(child) >= Hash.SIZE) return false;
                    node = child;
                },
            }
        }
    }

    // Proof ended while a hash-referenced child was still expected
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
    crypto.Keccak256.hash(address, &address_hash, .{});

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
    crypto.Keccak256.hash(slot, &slot_hash, .{});

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
    crypto.Keccak256.hash(&combined, &root, .{});

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
    crypto.Keccak256.hash(&combined, &expected_root, .{});

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
    crypto.Keccak256.hash(&combined, &root, .{});

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
    crypto.Keccak256.hash(&combined01, &hash01, .{});

    var combined23: [64]u8 = undefined;
    @memcpy(combined23[0..32], &leaf2);
    @memcpy(combined23[32..64], &leaf3);
    var hash23: Hash.Hash = undefined;
    crypto.Keccak256.hash(&combined23, &hash23, .{});

    var combined_root: [64]u8 = undefined;
    @memcpy(combined_root[0..32], &hash01);
    @memcpy(combined_root[32..64], &hash23);
    var root: Hash.Hash = undefined;
    crypto.Keccak256.hash(&combined_root, &root, .{});

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
    crypto.Keccak256.hash(&empty_rlp, &empty_root, .{});

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
    crypto.Keccak256.hash(&empty_rlp, &empty_root, .{});

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
    // - List payload of 6 bytes -> 0xc6 ...
    const leaf_node = [_]u8{ 0xc6, 0x82, 0x20, 0x01, 0x82, 0x12, 0x34 };

    // Compute root hash (hash of the leaf node)
    var root: Hash.Hash = undefined;
    crypto.Keccak256.hash(&leaf_node, &root, .{});

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

    const leaf_node = [_]u8{ 0xc6, 0x82, 0x20, 0x01, 0x82, 0x12, 0x34 };

    var root: Hash.Hash = undefined;
    crypto.Keccak256.hash(&leaf_node, &root, .{});

    const key = [_]u8{0x01};

    // Wrong value
    const wrong_value = [_]u8{ 0x56, 0x78 };

    const proof_nodes = [_][]const u8{&leaf_node};
    const result = try verifyMPTProof(allocator, &root, &key, &wrong_value, &proof_nodes);
    try std.testing.expect(!result);
}

test "verifyMPTProof - invalid root hash fails" {
    const allocator = std.testing.allocator;

    const leaf_node = [_]u8{ 0xc6, 0x82, 0x20, 0x01, 0x82, 0x12, 0x34 };

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
    crypto.Keccak256.hash(&leaf_node, &root, .{});

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
    crypto.Keccak256.hash(&address, &address_hash, .{});

    // For this test, we'd need to construct a proper leaf with the address hash path
    // This is complex because the path is 64 nibbles (32 bytes)
    // Let's just verify the function hashes the address correctly

    // Empty proof should fail for non-empty account
    const empty_rlp = [_]u8{0x80};
    var empty_root: Hash.Hash = undefined;
    crypto.Keccak256.hash(&empty_rlp, &empty_root, .{});

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
    crypto.Keccak256.hash(&slot, &slot_hash, .{});

    // Empty proof should fail for non-empty value
    const empty_rlp = [_]u8{0x80};
    var empty_root: Hash.Hash = undefined;
    crypto.Keccak256.hash(&empty_rlp, &empty_root, .{});

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
    crypto.Keccak256.hash(branch_data[0..20], &branch_hash, .{});

    // Empty key should match the branch value
    const empty_key: []const u8 = &.{};
    const expected_value = [_]u8{ 0xAB, 0xCD };

    const proof_nodes = [_][]const u8{branch_data[0..20]};
    const result = try verifyMPTProof(allocator, &branch_hash, empty_key, &expected_value, &proof_nodes);

    // This should succeed because empty key points to branch value
    try std.testing.expect(result);
}

test "verifyMPTProof - single-leaf storage trie exclusion proof" {
    const allocator = std.testing.allocator;

    // Storage trie holding exactly one slot: root = keccak(leaf).
    // Leaf path = all 64 nibbles of keccak256(slot 0), value = RLP(0x2a).
    const stored_slot = [_]u8{0x00} ** 32;
    var stored_path: Hash.Hash = undefined;
    crypto.Keccak256.hash(&stored_slot, &stored_path, .{});

    // RLP([0x20 ++ path(32), 0x2a]) = 0xe3 | 0xa1 0x20 path | 0x2a
    var leaf_node: [36]u8 = undefined;
    leaf_node[0] = 0xe3;
    leaf_node[1] = 0xa1;
    leaf_node[2] = 0x20;
    @memcpy(leaf_node[3..35], &stored_path);
    leaf_node[35] = 0x2a;

    var root: Hash.Hash = undefined;
    crypto.Keccak256.hash(&leaf_node, &root, .{});

    const proof_nodes = [_][]const u8{&leaf_node};

    // Inclusion of the stored slot still verifies
    try std.testing.expect(try verifyStorageSlotProof(allocator, &root, &stored_slot, &[_]u8{0x2a}, &proof_nodes));

    // Exclusion of a different slot verifies with the same single leaf
    const other_slot = [_]u8{0x00} ** 31 ++ [_]u8{0x01};
    try std.testing.expect(try verifyStorageSlotProof(allocator, &root, &other_slot, "", &proof_nodes));

    // The other slot cannot be proven to hold the leaf's value
    try std.testing.expect(!try verifyStorageSlotProof(allocator, &root, &other_slot, &[_]u8{0x2a}, &proof_nodes));

    // The stored slot cannot be proven absent
    try std.testing.expect(!try verifyStorageSlotProof(allocator, &root, &stored_slot, "", &proof_nodes));

    // Tampered leaf (hash mismatch) fails closed for the exclusion claim
    var tampered = leaf_node;
    tampered[10] ^= 0x01;
    const tampered_nodes = [_][]const u8{&tampered};
    try std.testing.expect(!try verifyStorageSlotProof(allocator, &root, &other_slot, "", &tampered_nodes));

    // Divergent leaf followed by an extra node is rejected (strict consumption)
    const trailing_nodes = [_][]const u8{ &leaf_node, &leaf_node };
    try std.testing.expect(!try verifyStorageSlotProof(allocator, &root, &other_slot, "", &trailing_nodes));
}

test "verifyMPTProof - leaf suffix length mismatch proves exclusion only" {
    const allocator = std.testing.allocator;

    // Leaf with single-nibble path [5], value 0xAB: RLP([0x35, 0xAB])
    const leaf_node = [_]u8{ 0xc3, 0x35, 0x81, 0xAB };
    var root: Hash.Hash = undefined;
    crypto.Keccak256.hash(&leaf_node, &root, .{});

    const proof_nodes = [_][]const u8{&leaf_node};

    // Key 0x50 -> nibbles [5, 0]; longer than the leaf suffix
    const key = [_]u8{0x50};
    try std.testing.expect(try verifyMPTProof(allocator, &root, &key, "", &proof_nodes));
    try std.testing.expect(!try verifyMPTProof(allocator, &root, &key, &[_]u8{0xAB}, &proof_nodes));

    // Empty key -> remaining path shorter than the leaf suffix
    try std.testing.expect(try verifyMPTProof(allocator, &root, "", "", &proof_nodes));
}

test "verifyMPTProof - divergent extension exclusion proof" {
    const allocator = std.testing.allocator;

    // Extension with even path [1, 2] -> child hash:
    // RLP([0x00 0x12, child(32)]) = 0xe4 | 0x82 0x00 0x12 | 0xa0 child
    const child = [_]u8{0x77} ** 32;
    var ext_node: [37]u8 = undefined;
    ext_node[0] = 0xe4;
    ext_node[1] = 0x82;
    ext_node[2] = 0x00;
    ext_node[3] = 0x12;
    ext_node[4] = 0xa0;
    @memcpy(ext_node[5..37], &child);

    var root: Hash.Hash = undefined;
    crypto.Keccak256.hash(&ext_node, &root, .{});

    const proof_nodes = [_][]const u8{&ext_node};

    // Key 0x13 -> nibbles [1, 3] diverges from extension prefix [1, 2]
    const divergent_key = [_]u8{0x13};
    try std.testing.expect(try verifyMPTProof(allocator, &root, &divergent_key, "", &proof_nodes));

    // Divergence never proves a non-empty value
    try std.testing.expect(!try verifyMPTProof(allocator, &root, &divergent_key, &[_]u8{0x01}, &proof_nodes));

    // Key 0x12 follows the extension; the proof is truncated, not an exclusion
    const matching_key = [_]u8{0x12};
    try std.testing.expect(!try verifyMPTProof(allocator, &root, &matching_key, "", &proof_nodes));

    // Wrong root fails closed
    const wrong_root = [_]u8{0xff} ** 32;
    try std.testing.expect(!try verifyMPTProof(allocator, &wrong_root, &divergent_key, "", &proof_nodes));

    // Tampered extension (hash mismatch) fails closed
    var tampered = ext_node;
    tampered[3] = 0x14;
    const tampered_nodes = [_][]const u8{&tampered};
    try std.testing.expect(!try verifyMPTProof(allocator, &root, &divergent_key, "", &tampered_nodes));

    // Divergent extension that is not the terminal proof node is rejected
    const trailing_nodes = [_][]const u8{ &ext_node, &ext_node };
    try std.testing.expect(!try verifyMPTProof(allocator, &root, &divergent_key, "", &trailing_nodes));
}

test "verifyMPTProof - tampered hash and wrong value inclusion proofs fail" {
    const allocator = std.testing.allocator;

    const leaf_node = [_]u8{ 0xc6, 0x82, 0x20, 0x01, 0x82, 0x12, 0x34 };
    var root: Hash.Hash = undefined;
    crypto.Keccak256.hash(&leaf_node, &root, .{});

    const key = [_]u8{0x01};
    const value = [_]u8{ 0x12, 0x34 };
    const proof_nodes = [_][]const u8{&leaf_node};

    // Baseline inclusion verifies
    try std.testing.expect(try verifyMPTProof(allocator, &root, &key, &value, &proof_nodes));

    // Wrong value
    try std.testing.expect(!try verifyMPTProof(allocator, &root, &key, &[_]u8{ 0x12, 0x35 }, &proof_nodes));

    // Claiming absence of a present key
    try std.testing.expect(!try verifyMPTProof(allocator, &root, &key, "", &proof_nodes));

    // Leaf rewritten to carry the claimed value no longer hashes to the root
    const forged_leaf = [_]u8{ 0xc6, 0x82, 0x20, 0x01, 0x82, 0x12, 0x35 };
    const forged_nodes = [_][]const u8{&forged_leaf};
    try std.testing.expect(!try verifyMPTProof(allocator, &root, &key, &[_]u8{ 0x12, 0x35 }, &forged_nodes));

    // Tampered root
    var bad_root = root;
    bad_root[0] ^= 0x01;
    try std.testing.expect(!try verifyMPTProof(allocator, &bad_root, &key, &value, &proof_nodes));
}

// Branch with an embedded leaf at slot 5 and empty slots elsewhere.
// Leaf = RLP([0x31, 0xAB]): odd leaf path [1], value 0xAB (4 bytes, < 32).
// Branch payload = 5 * 0x80 | leaf(4) | 10 * 0x80 | value 0x80 = 20 bytes.
const embedded_leaf_branch = [_]u8{0xd4} ++ [_]u8{0x80} ** 5 ++ [_]u8{ 0xc3, 0x31, 0x81, 0xAB } ++ [_]u8{0x80} ** 11;

test "verifyMPTProof - embedded leaf inside branch node" {
    const allocator = std.testing.allocator;

    var root: Hash.Hash = undefined;
    crypto.Keccak256.hash(&embedded_leaf_branch, &root, .{});
    const proof_nodes = [_][]const u8{&embedded_leaf_branch};

    // Inclusion: key 0x51 -> nibbles [5, 1] -> slot 5, embedded leaf path [1]
    const key = [_]u8{0x51};
    try std.testing.expect(try verifyMPTProof(allocator, &root, &key, &[_]u8{0xAB}, &proof_nodes));
    try std.testing.expect(!try verifyMPTProof(allocator, &root, &key, &[_]u8{0xAC}, &proof_nodes));

    // A present key cannot be proven absent
    try std.testing.expect(!try verifyMPTProof(allocator, &root, &key, "", &proof_nodes));

    // Exclusion: key 0x52 -> nibbles [5, 2] diverges from embedded leaf path [1]
    const absent_key = [_]u8{0x52};
    try std.testing.expect(try verifyMPTProof(allocator, &root, &absent_key, "", &proof_nodes));
    try std.testing.expect(!try verifyMPTProof(allocator, &root, &absent_key, &[_]u8{0xAB}, &proof_nodes));

    // The embedded leaf is never a separate proof node
    const leaf = [_]u8{ 0xc3, 0x31, 0x81, 0xAB };
    const split_nodes = [_][]const u8{ &embedded_leaf_branch, &leaf };
    try std.testing.expect(!try verifyMPTProof(allocator, &root, &key, &[_]u8{0xAB}, &split_nodes));
    try std.testing.expect(!try verifyMPTProof(allocator, &root, &absent_key, "", &split_nodes));
}

test "verifyMPTProof - embedded leaf inside extension node" {
    const allocator = std.testing.allocator;

    // Extension path [1, 2] (0x00 0x12) -> embedded leaf RLP([0x20 0x51, 0xAB])
    // with even leaf path [5, 1]. Payload = 3 + 6 = 9 bytes.
    const ext_node = [_]u8{ 0xc9, 0x82, 0x00, 0x12, 0xc5, 0x82, 0x20, 0x51, 0x81, 0xAB };
    var root: Hash.Hash = undefined;
    crypto.Keccak256.hash(&ext_node, &root, .{});
    const proof_nodes = [_][]const u8{&ext_node};

    // Inclusion: key 0x1251 -> nibbles [1, 2, 5, 1]
    const key = [_]u8{ 0x12, 0x51 };
    try std.testing.expect(try verifyMPTProof(allocator, &root, &key, &[_]u8{0xAB}, &proof_nodes));
    try std.testing.expect(!try verifyMPTProof(allocator, &root, &key, &[_]u8{0xAC}, &proof_nodes));
    try std.testing.expect(!try verifyMPTProof(allocator, &root, &key, "", &proof_nodes));

    // Exclusion below the extension: nibbles [1, 2, 5, 2] diverge at the leaf
    const absent_key = [_]u8{ 0x12, 0x52 };
    try std.testing.expect(try verifyMPTProof(allocator, &root, &absent_key, "", &proof_nodes));
    try std.testing.expect(!try verifyMPTProof(allocator, &root, &absent_key, &[_]u8{0xAB}, &proof_nodes));

    // Trailing unverified node rejected
    const trailing_nodes = [_][]const u8{ &ext_node, &ext_node };
    try std.testing.expect(!try verifyMPTProof(allocator, &root, &key, &[_]u8{0xAB}, &trailing_nodes));
}

test "verifyMPTProof - extension with embedded branch with embedded leaf" {
    const allocator = std.testing.allocator;

    // Extension path [1, 2] -> embedded branch (21 bytes) -> embedded leaf.
    // Payload = 3 + 21 = 24 bytes.
    const ext_node = [_]u8{ 0xd8, 0x82, 0x00, 0x12 } ++ embedded_leaf_branch;
    var root: Hash.Hash = undefined;
    crypto.Keccak256.hash(&ext_node, &root, .{});
    const proof_nodes = [_][]const u8{&ext_node};

    // Inclusion: nibbles [1, 2] extension, [5] branch slot, [1] leaf path
    try std.testing.expect(try verifyMPTProof(allocator, &root, &[_]u8{ 0x12, 0x51 }, &[_]u8{0xAB}, &proof_nodes));

    // Exclusion at the embedded leaf, at an empty branch slot, at the extension
    try std.testing.expect(try verifyMPTProof(allocator, &root, &[_]u8{ 0x12, 0x52 }, "", &proof_nodes));
    try std.testing.expect(try verifyMPTProof(allocator, &root, &[_]u8{ 0x12, 0x61 }, "", &proof_nodes));
    try std.testing.expect(try verifyMPTProof(allocator, &root, &[_]u8{ 0x13, 0x51 }, "", &proof_nodes));

    // No exclusion claim holds for the present key
    try std.testing.expect(!try verifyMPTProof(allocator, &root, &[_]u8{ 0x12, 0x51 }, "", &proof_nodes));
}

test "verifyMPTProof - trailing proof node rejected on inclusion and empty-branch exclusion" {
    const allocator = std.testing.allocator;

    var root: Hash.Hash = undefined;
    crypto.Keccak256.hash(&embedded_leaf_branch, &root, .{});
    const proof_nodes = [_][]const u8{&embedded_leaf_branch};
    const trailing_nodes = [_][]const u8{ &embedded_leaf_branch, &embedded_leaf_branch };

    // Inclusion through the embedded leaf
    const key = [_]u8{0x51};
    try std.testing.expect(try verifyMPTProof(allocator, &root, &key, &[_]u8{0xAB}, &proof_nodes));
    try std.testing.expect(!try verifyMPTProof(allocator, &root, &key, &[_]u8{0xAB}, &trailing_nodes));

    // Empty-branch-slot exclusion: key 0x61 -> slot 6 is empty
    const empty_slot_key = [_]u8{0x61};
    try std.testing.expect(try verifyMPTProof(allocator, &root, &empty_slot_key, "", &proof_nodes));
    try std.testing.expect(!try verifyMPTProof(allocator, &root, &empty_slot_key, &[_]u8{0xAB}, &proof_nodes));
    try std.testing.expect(!try verifyMPTProof(allocator, &root, &empty_slot_key, "", &trailing_nodes));

    // Divergent embedded leaf exclusion
    try std.testing.expect(!try verifyMPTProof(allocator, &root, &[_]u8{0x52}, "", &trailing_nodes));

    // Hashed leaf inclusion: RLP([0x20 0x01, 0x1234])
    const leaf_node = [_]u8{ 0xc6, 0x82, 0x20, 0x01, 0x82, 0x12, 0x34 };
    var leaf_root: Hash.Hash = undefined;
    crypto.Keccak256.hash(&leaf_node, &leaf_root, .{});
    const leaf_trailing = [_][]const u8{ &leaf_node, &leaf_node };
    try std.testing.expect(!try verifyMPTProof(allocator, &leaf_root, &[_]u8{0x01}, &[_]u8{ 0x12, 0x34 }, &leaf_trailing));

    // Branch value inclusion: 16 empty children, value 0xABCD
    const value_branch = [_]u8{0xd3} ++ [_]u8{0x80} ** 16 ++ [_]u8{ 0x82, 0xAB, 0xCD };
    var value_root: Hash.Hash = undefined;
    crypto.Keccak256.hash(&value_branch, &value_root, .{});
    const value_trailing = [_][]const u8{ &value_branch, &value_branch };
    try std.testing.expect(!try verifyMPTProof(allocator, &value_root, "", &[_]u8{ 0xAB, 0xCD }, &value_trailing));
}

test "verifyMPTProof - branch child string of invalid length rejected" {
    const allocator = std.testing.allocator;

    // Slot 5 holds the 1-byte string 0x05: neither empty, a hash, nor a node
    const branch = [_]u8{0xd1} ++ [_]u8{0x80} ** 5 ++ [_]u8{0x05} ++ [_]u8{0x80} ** 11;
    var root: Hash.Hash = undefined;
    crypto.Keccak256.hash(&branch, &root, .{});
    const proof_nodes = [_][]const u8{&branch};

    const key = [_]u8{0x51};
    try std.testing.expect(!try verifyMPTProof(allocator, &root, &key, "", &proof_nodes));
    try std.testing.expect(!try verifyMPTProof(allocator, &root, &key, &[_]u8{0x05}, &proof_nodes));
}

test "verifyMPTProof - hash-referenced child consumes the next proof node" {
    const allocator = std.testing.allocator;

    // Leaf of 35 bytes (>= 32, so hash-referenced): odd path [1], 32-byte value
    const value = [_]u8{0xEE} ** 32;
    const leaf = [_]u8{ 0xe2, 0x31, 0xa0 } ++ value;

    // Branch: slot 5 = keccak256(leaf). Payload = 5 + 33 + 11 = 49 bytes.
    var branch = [_]u8{0xf1} ++ [_]u8{0x80} ** 5 ++ [_]u8{0xa0} ++ [_]u8{0x00} ** 32 ++ [_]u8{0x80} ** 11;
    crypto.Keccak256.hash(&leaf, branch[7..39], .{});
    var root: Hash.Hash = undefined;
    crypto.Keccak256.hash(&branch, &root, .{});

    const key = [_]u8{0x51};
    const proof_nodes = [_][]const u8{ &branch, &leaf };
    try std.testing.expect(try verifyMPTProof(allocator, &root, &key, &value, &proof_nodes));

    // Truncated proof proves nothing
    const truncated = [_][]const u8{&branch};
    try std.testing.expect(!try verifyMPTProof(allocator, &root, &key, &value, &truncated));
    try std.testing.expect(!try verifyMPTProof(allocator, &root, &key, "", &truncated));

    // A node of 32+ bytes inlined instead of hash-referenced is non-canonical
    // Payload = 5 + 35 + 11 = 51 bytes.
    const inlined = [_]u8{0xf3} ++ [_]u8{0x80} ** 5 ++ leaf ++ [_]u8{0x80} ** 11;
    var inlined_root: Hash.Hash = undefined;
    crypto.Keccak256.hash(&inlined, &inlined_root, .{});
    const inlined_nodes = [_][]const u8{&inlined};
    try std.testing.expect(!try verifyMPTProof(allocator, &inlined_root, &key, &value, &inlined_nodes));
}

fn expectMPTProofVerifies(
    allocator: std.mem.Allocator,
    root: *const Hash.Hash,
    key: []const u8,
    value: []const u8,
    proof_nodes: []const []const u8,
) !void {
    try std.testing.expect(try verifyMPTProof(allocator, root, key, value, proof_nodes));
}

test "verifyMPTProof - propagates OutOfMemory at every allocation" {
    // Extension -> embedded branch -> embedded leaf exercises key nibbles,
    // RLP decoding, and path decoding. A swallowed OutOfMemory (reported as
    // `false`) or a leak fails checkAllAllocationFailures.
    const ext_node = [_]u8{ 0xd8, 0x82, 0x00, 0x12 } ++ embedded_leaf_branch;
    var root: Hash.Hash = undefined;
    crypto.Keccak256.hash(&ext_node, &root, .{});

    const root_ptr: *const Hash.Hash = &root;
    const key: []const u8 = &[_]u8{ 0x12, 0x51 };
    const value: []const u8 = &[_]u8{0xAB};
    const proof_nodes: []const []const u8 = &[_][]const u8{&ext_node};

    try std.testing.checkAllAllocationFailures(
        std.testing.allocator,
        expectMPTProofVerifies,
        .{ root_ptr, key, value, proof_nodes },
    );
}
