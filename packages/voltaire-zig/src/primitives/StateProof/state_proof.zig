//! StateProof - EIP-1186 account proof type for Ethereum
//!
//! This module provides an account state proof structure for verifying
//! account data against a known state root. State proofs enable light clients
//! and trustless systems to verify account state without full node execution.
//!
//! The proof structure includes:
//! - Account proof: RLP-encoded Merkle Patricia Trie nodes from state root to account
//! - Account fields: nonce, balance, codeHash, storageHash
//! - Storage proofs: Optional array of proofs for specific storage slots
//!
//! ## Usage
//! ```zig
//! const StateProof = @import("primitives").StateProof;
//!
//! // Create a state proof
//! const proof = StateProof.init(address, account_proof, balance, ...);
//!
//! // Verify against state root
//! const is_valid = try proof.verify(&state_root);
//! ```
//!
//! @see EIP-1186: https://eips.ethereum.org/EIPS/eip-1186
//! @see JSON-RPC eth_getProof method

const std = @import("std");
const Hash = @import("../Hash/Hash.zig");
const Address = @import("../Address/address.zig");
const State = @import("../State/state.zig");
const StorageProof = @import("../StorageProof/storage_proof.zig").StorageProof;
const crypto = @import("crypto");

/// Maximum number of proof elements (limits trie depth)
pub const MAX_PROOF_DEPTH: usize = 256;

/// StateProof represents an EIP-1186 account proof with storage proofs.
///
/// EIP-1186 defines a standard for providing Merkle proofs of account state and
/// storage values. This enables light clients and trustless systems to verify
/// account data without executing transactions or trusting external providers.
pub const StateProof = struct {
    /// The address of the account being proven.
    address: Address.Address,

    /// Array of RLP-encoded Merkle Patricia Trie nodes.
    /// Forms the path from the state root to this account's leaf node.
    /// Nodes are ordered from root to leaf.
    account_proof: []const []const u8,

    /// Account balance in Wei.
    balance: u256,

    /// Keccak256 hash of the account's bytecode.
    /// For EOAs, this is EMPTY_CODE_HASH.
    code_hash: Hash.Hash,

    /// Transaction count (EOA) or contract creation count.
    nonce: u64,

    /// Root hash of the account's storage trie.
    /// Storage proofs must verify against this root.
    storage_hash: Hash.Hash,

    /// Array of proofs for specific storage slots.
    /// Each proof demonstrates a key-value pair in the account's storage.
    storage_proofs: []const StorageProof,

    /// Internal flag indicating if memory is owned
    _owned: bool = false,

    const Self = @This();

    // ============================================================================
    // Constructors
    // ============================================================================

    /// Create a StateProof (non-owning).
    /// The caller must ensure the proof data outlives the StateProof.
    pub fn init(
        address: Address.Address,
        account_proof: []const []const u8,
        balance: u256,
        code_hash: Hash.Hash,
        nonce: u64,
        storage_hash: Hash.Hash,
        storage_proofs: []const StorageProof,
    ) Self {
        return Self{
            .address = address,
            .account_proof = account_proof,
            .balance = balance,
            .code_hash = code_hash,
            .nonce = nonce,
            .storage_hash = storage_hash,
            .storage_proofs = storage_proofs,
            ._owned = false,
        };
    }

    /// Create a StateProof by copying all data (owning).
    /// The returned StateProof owns its memory and must be freed with deinit().
    pub fn from(
        allocator: std.mem.Allocator,
        address: Address.Address,
        account_proof: []const []const u8,
        balance: u256,
        code_hash: Hash.Hash,
        nonce: u64,
        storage_hash: Hash.Hash,
        storage_proofs: []const StorageProof,
    ) !Self {
        if (account_proof.len > MAX_PROOF_DEPTH) {
            return error.ProofTooDeep;
        }

        // Copy account proof nodes
        const owned_account_proof = try allocator.alloc([]const u8, account_proof.len);
        errdefer allocator.free(owned_account_proof);

        var copied_account: usize = 0;
        errdefer {
            for (owned_account_proof[0..copied_account]) |node| {
                allocator.free(node);
            }
        }

        for (account_proof, 0..) |node, i| {
            owned_account_proof[i] = try allocator.dupe(u8, node);
            copied_account += 1;
        }

        // Copy storage proofs
        const owned_storage_proofs = try allocator.alloc(StorageProof, storage_proofs.len);
        errdefer allocator.free(owned_storage_proofs);

        var copied_storage: usize = 0;
        errdefer {
            for (owned_storage_proofs[0..copied_storage]) |*sp| {
                sp.deinit(allocator);
            }
        }

        for (storage_proofs, 0..) |sp, i| {
            owned_storage_proofs[i] = try sp.clone(allocator);
            copied_storage += 1;
        }

        return Self{
            .address = address,
            .account_proof = owned_account_proof,
            .balance = balance,
            .code_hash = code_hash,
            .nonce = nonce,
            .storage_hash = storage_hash,
            .storage_proofs = owned_storage_proofs,
            ._owned = true,
        };
    }

    /// Create a StateProof for an Externally Owned Account (EOA).
    /// Sets code_hash to EMPTY_CODE_HASH and storage_hash to EMPTY_TRIE_ROOT.
    pub fn forEOA(
        allocator: std.mem.Allocator,
        address: Address.Address,
        account_proof: []const []const u8,
        balance: u256,
        nonce: u64,
    ) !Self {
        return from(
            allocator,
            address,
            account_proof,
            balance,
            State.EMPTY_CODE_HASH,
            nonce,
            State.EMPTY_TRIE_ROOT,
            &[_]StorageProof{},
        );
    }

    /// Free owned memory.
    pub fn deinit(self: Self, allocator: std.mem.Allocator) void {
        if (self._owned) {
            for (self.account_proof) |node| {
                allocator.free(node);
            }
            allocator.free(self.account_proof);

            for (self.storage_proofs) |*sp| {
                // StorageProof is const, so we need to cast
                var mutable_sp = sp.*;
                mutable_sp.deinit(allocator);
            }
            allocator.free(self.storage_proofs);
        }
    }

    // ============================================================================
    // Validation
    // ============================================================================

    /// Compare two StateProofs for equality.
    /// All fields must match including all storage proofs.
    pub fn equals(a: *const Self, b: *const Self) bool {
        // Check address
        if (!Address.equals(a.address, b.address)) {
            return false;
        }

        // Check balance
        if (a.balance != b.balance) {
            return false;
        }

        // Check code_hash
        if (!Hash.equals(&a.code_hash, &b.code_hash)) {
            return false;
        }

        // Check nonce
        if (a.nonce != b.nonce) {
            return false;
        }

        // Check storage_hash
        if (!Hash.equals(&a.storage_hash, &b.storage_hash)) {
            return false;
        }

        // Check account_proof length
        if (a.account_proof.len != b.account_proof.len) {
            return false;
        }

        // Check each account_proof element
        for (a.account_proof, b.account_proof) |proof_a, proof_b| {
            if (!std.mem.eql(u8, proof_a, proof_b)) {
                return false;
            }
        }

        // Check storage_proofs length
        if (a.storage_proofs.len != b.storage_proofs.len) {
            return false;
        }

        // Check each storage_proof
        for (a.storage_proofs, b.storage_proofs) |*sp_a, *sp_b| {
            if (!StorageProof.equals(sp_a, sp_b)) {
                return false;
            }
        }

        return true;
    }

    /// Check if this is an empty/non-existent account.
    pub fn isEmptyAccount(self: *const Self) bool {
        return self.nonce == 0 and
            self.balance == 0 and
            Hash.equals(&self.code_hash, &State.EMPTY_CODE_HASH) and
            Hash.equals(&self.storage_hash, &State.EMPTY_TRIE_ROOT);
    }

    /// Check if this is an EOA (externally owned account).
    pub fn isEOA(self: *const Self) bool {
        return Hash.equals(&self.code_hash, &State.EMPTY_CODE_HASH);
    }

    /// Check if this is a contract account.
    pub fn isContract(self: *const Self) bool {
        return !self.isEOA();
    }

    /// Get the number of storage proofs.
    pub fn storageProofCount(self: *const Self) usize {
        return self.storage_proofs.len;
    }

    // ============================================================================
    // Accessors
    // ============================================================================

    /// Get storage proof for a specific slot, if it exists.
    pub fn getStorageProofForSlot(self: *const Self, slot: u256) ?*const StorageProof {
        for (self.storage_proofs) |*sp| {
            if (sp.key.slot == slot) {
                return sp;
            }
        }
        return null;
    }

    /// Get the account address as hex string.
    pub fn addressHex(self: *const Self) [42]u8 {
        return Address.toHex(self.address);
    }

    // ============================================================================
    // Verification
    // ============================================================================

    /// Compute the address hash used as the key in the state trie.
    /// Per Ethereum spec, this is keccak256(address).
    pub fn computeAddressHash(self: *const Self) Hash.Hash {
        return Hash.keccak256(&self.address.bytes);
    }

    /// Verify this account proof against a state root.
    ///
    /// This verifies that:
    /// 1. The account proof is valid against the state root
    /// 2. The account data (nonce, balance, storageHash, codeHash) matches
    ///
    /// Parameters:
    /// - allocator: For temporary allocations during RLP decoding
    /// - state_root: The state root to verify against
    ///
    /// Returns true if the proof is valid.
    pub fn verify(self: *const Self, allocator: std.mem.Allocator, state_root: *const Hash.Hash) !bool {
        const ProofModule = @import("../Proof/proof.zig");
        const Rlp = @import("../Rlp/Rlp.zig");

        // Build RLP-encoded account data: [nonce, balance, storageHash, codeHash]
        // Encode each field
        const nonce_rlp = try Rlp.encode(allocator, self.nonce);
        defer allocator.free(nonce_rlp);

        const balance_rlp = try Rlp.encode(allocator, self.balance);
        defer allocator.free(balance_rlp);

        const storage_hash_rlp = try Rlp.encode(allocator, &self.storage_hash);
        defer allocator.free(storage_hash_rlp);

        const code_hash_rlp = try Rlp.encode(allocator, &self.code_hash);
        defer allocator.free(code_hash_rlp);

        // Encode as list
        const account_data = [_][]const u8{ nonce_rlp, balance_rlp, storage_hash_rlp, code_hash_rlp };
        const account_rlp = try Rlp.encode(allocator, &account_data);
        defer allocator.free(account_rlp);

        return ProofModule.verifyAccountProof(
            allocator,
            state_root,
            &self.address.bytes,
            account_rlp,
            self.account_proof,
        );
    }

    /// Verify all storage proofs against the account's storage root.
    ///
    /// This verifies that each storage proof is valid against self.storage_hash.
    ///
    /// Parameters:
    /// - allocator: For temporary allocations during RLP decoding
    ///
    /// Returns true if all storage proofs are valid.
    pub fn verifyStorageProofs(self: *const Self, allocator: std.mem.Allocator) !bool {
        for (self.storage_proofs) |*sp| {
            const valid = try sp.verify(allocator, &self.storage_hash);
            if (!valid) {
                return false;
            }
        }
        return true;
    }

    /// Verify both account proof and all storage proofs.
    ///
    /// This is a convenience function that calls both verify() and verifyStorageProofs().
    ///
    /// Parameters:
    /// - allocator: For temporary allocations during RLP decoding
    /// - state_root: The state root to verify against
    ///
    /// Returns true if both account and all storage proofs are valid.
    pub fn verifyAll(self: *const Self, allocator: std.mem.Allocator, state_root: *const Hash.Hash) !bool {
        const account_valid = try self.verify(allocator, state_root);
        if (!account_valid) {
            return false;
        }

        return self.verifyStorageProofs(allocator);
    }

    // ============================================================================
    // Manipulation
    // ============================================================================

    /// Create a deep copy of the state proof.
    pub fn clone(self: *const Self, allocator: std.mem.Allocator) !Self {
        return from(
            allocator,
            self.address,
            self.account_proof,
            self.balance,
            self.code_hash,
            self.nonce,
            self.storage_hash,
            self.storage_proofs,
        );
    }
};

// ============================================================================
// Tests
// ============================================================================

test "StateProof.init - creates non-owning proof" {
    const addr = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0");
    const node1 = [_]u8{0xf8} ** 32;
    const account_proof = [_][]const u8{&node1};
    const storage_proofs: []const StorageProof = &.{};

    const proof = StateProof.init(
        addr,
        &account_proof,
        1000000000000000000, // 1 ETH
        State.EMPTY_CODE_HASH,
        5,
        State.EMPTY_TRIE_ROOT,
        storage_proofs,
    );

    try std.testing.expect(Address.equals(addr, proof.address));
    try std.testing.expectEqual(@as(u256, 1000000000000000000), proof.balance);
    try std.testing.expectEqual(@as(u64, 5), proof.nonce);
    try std.testing.expectEqual(false, proof._owned);
}

test "StateProof.from - creates owning copy" {
    const allocator = std.testing.allocator;

    const addr = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0");
    const node1 = [_]u8{0xf8} ** 32;
    const account_proof = [_][]const u8{&node1};
    const storage_proofs: []const StorageProof = &.{};

    const proof = try StateProof.from(
        allocator,
        addr,
        &account_proof,
        1000000000000000000,
        State.EMPTY_CODE_HASH,
        5,
        State.EMPTY_TRIE_ROOT,
        storage_proofs,
    );
    defer proof.deinit(allocator);

    try std.testing.expectEqual(@as(u256, 1000000000000000000), proof.balance);
    try std.testing.expectEqual(true, proof._owned);
}

test "StateProof.forEOA - creates EOA proof" {
    const allocator = std.testing.allocator;

    const addr = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0");
    const node1 = [_]u8{0xf8} ** 32;
    const account_proof = [_][]const u8{&node1};

    const proof = try StateProof.forEOA(
        allocator,
        addr,
        &account_proof,
        1000000000000000000,
        5,
    );
    defer proof.deinit(allocator);

    try std.testing.expect(proof.isEOA());
    try std.testing.expect(!proof.isContract());
    try std.testing.expect(Hash.equals(&proof.code_hash, &State.EMPTY_CODE_HASH));
    try std.testing.expect(Hash.equals(&proof.storage_hash, &State.EMPTY_TRIE_ROOT));
}

test "StateProof.equals - identical proofs" {
    const addr = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0");
    const node1 = [_]u8{0xf8} ** 32;
    const account_proof = [_][]const u8{&node1};
    const storage_proofs: []const StorageProof = &.{};

    const proof1 = StateProof.init(
        addr,
        &account_proof,
        1000000000000000000,
        State.EMPTY_CODE_HASH,
        5,
        State.EMPTY_TRIE_ROOT,
        storage_proofs,
    );
    const proof2 = StateProof.init(
        addr,
        &account_proof,
        1000000000000000000,
        State.EMPTY_CODE_HASH,
        5,
        State.EMPTY_TRIE_ROOT,
        storage_proofs,
    );

    try std.testing.expect(StateProof.equals(&proof1, &proof2));
}

test "StateProof.equals - different addresses" {
    const addr1 = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0");
    const addr2 = try Address.fromHex("0xabcdefabcdefabcdefabcdefabcdefabcdefabcd");
    const node1 = [_]u8{0xf8} ** 32;
    const account_proof = [_][]const u8{&node1};
    const storage_proofs: []const StorageProof = &.{};

    const proof1 = StateProof.init(
        addr1,
        &account_proof,
        1000000000000000000,
        State.EMPTY_CODE_HASH,
        5,
        State.EMPTY_TRIE_ROOT,
        storage_proofs,
    );
    const proof2 = StateProof.init(
        addr2,
        &account_proof,
        1000000000000000000,
        State.EMPTY_CODE_HASH,
        5,
        State.EMPTY_TRIE_ROOT,
        storage_proofs,
    );

    try std.testing.expect(!StateProof.equals(&proof1, &proof2));
}

test "StateProof.equals - different balances" {
    const addr = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0");
    const node1 = [_]u8{0xf8} ** 32;
    const account_proof = [_][]const u8{&node1};
    const storage_proofs: []const StorageProof = &.{};

    const proof1 = StateProof.init(
        addr,
        &account_proof,
        1000000000000000000,
        State.EMPTY_CODE_HASH,
        5,
        State.EMPTY_TRIE_ROOT,
        storage_proofs,
    );
    const proof2 = StateProof.init(
        addr,
        &account_proof,
        2000000000000000000, // Different balance
        State.EMPTY_CODE_HASH,
        5,
        State.EMPTY_TRIE_ROOT,
        storage_proofs,
    );

    try std.testing.expect(!StateProof.equals(&proof1, &proof2));
}

test "StateProof.equals - different nonces" {
    const addr = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0");
    const node1 = [_]u8{0xf8} ** 32;
    const account_proof = [_][]const u8{&node1};
    const storage_proofs: []const StorageProof = &.{};

    const proof1 = StateProof.init(
        addr,
        &account_proof,
        1000000000000000000,
        State.EMPTY_CODE_HASH,
        5,
        State.EMPTY_TRIE_ROOT,
        storage_proofs,
    );
    const proof2 = StateProof.init(
        addr,
        &account_proof,
        1000000000000000000,
        State.EMPTY_CODE_HASH,
        6, // Different nonce
        State.EMPTY_TRIE_ROOT,
        storage_proofs,
    );

    try std.testing.expect(!StateProof.equals(&proof1, &proof2));
}

test "StateProof.isEmptyAccount - empty account" {
    const addr = try Address.fromHex("0x0000000000000000000000000000000000000000");
    const node1 = [_]u8{0xf8} ** 32;
    const account_proof = [_][]const u8{&node1};
    const storage_proofs: []const StorageProof = &.{};

    const proof = StateProof.init(
        addr,
        &account_proof,
        0, // Zero balance
        State.EMPTY_CODE_HASH,
        0, // Zero nonce
        State.EMPTY_TRIE_ROOT,
        storage_proofs,
    );

    try std.testing.expect(proof.isEmptyAccount());
}

test "StateProof.isEmptyAccount - non-empty account" {
    const addr = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0");
    const node1 = [_]u8{0xf8} ** 32;
    const account_proof = [_][]const u8{&node1};
    const storage_proofs: []const StorageProof = &.{};

    const proof = StateProof.init(
        addr,
        &account_proof,
        1000000000000000000, // Has balance
        State.EMPTY_CODE_HASH,
        0,
        State.EMPTY_TRIE_ROOT,
        storage_proofs,
    );

    try std.testing.expect(!proof.isEmptyAccount());
}

test "StateProof.isContract - contract account" {
    const addr = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0");
    const node1 = [_]u8{0xf8} ** 32;
    const account_proof = [_][]const u8{&node1};
    const storage_proofs: []const StorageProof = &.{};
    const contract_code_hash = [_]u8{0xab} ** 32; // Non-empty code hash

    const proof = StateProof.init(
        addr,
        &account_proof,
        0,
        contract_code_hash,
        1,
        State.EMPTY_TRIE_ROOT,
        storage_proofs,
    );

    try std.testing.expect(proof.isContract());
    try std.testing.expect(!proof.isEOA());
}

test "StateProof.storageProofCount - returns correct count" {
    const allocator = std.testing.allocator;

    const addr = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0");
    const node1 = [_]u8{0xf8} ** 32;
    const account_proof = [_][]const u8{&node1};

    // Create some storage proofs
    const storage_addr = [_]u8{0x42} ** 20;
    const key1 = State.StorageKey{ .address = storage_addr, .slot = 0 };
    const key2 = State.StorageKey{ .address = storage_addr, .slot = 1 };
    const value = @import("../StorageValue/StorageValue.zig").ZERO;
    const empty_proof: []const []const u8 = &.{};

    const sp1 = StorageProof.init(key1, value, empty_proof);
    const sp2 = StorageProof.init(key2, value, empty_proof);
    const storage_proofs = [_]StorageProof{ sp1, sp2 };

    const proof = try StateProof.from(
        allocator,
        addr,
        &account_proof,
        0,
        State.EMPTY_CODE_HASH,
        0,
        State.EMPTY_TRIE_ROOT,
        &storage_proofs,
    );
    defer proof.deinit(allocator);

    try std.testing.expectEqual(@as(usize, 2), proof.storageProofCount());
}

test "StateProof.getStorageProofForSlot - finds existing slot" {
    const addr = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0");
    const node1 = [_]u8{0xf8} ** 32;
    const account_proof = [_][]const u8{&node1};

    const storage_addr = [_]u8{0x42} ** 20;
    const key1 = State.StorageKey{ .address = storage_addr, .slot = 42 };
    const key2 = State.StorageKey{ .address = storage_addr, .slot = 100 };
    const value = @import("../StorageValue/StorageValue.zig").ZERO;
    const empty_proof: []const []const u8 = &.{};

    const sp1 = StorageProof.init(key1, value, empty_proof);
    const sp2 = StorageProof.init(key2, value, empty_proof);
    const storage_proofs = [_]StorageProof{ sp1, sp2 };

    const proof = StateProof.init(
        addr,
        &account_proof,
        0,
        State.EMPTY_CODE_HASH,
        0,
        State.EMPTY_TRIE_ROOT,
        &storage_proofs,
    );

    const found = proof.getStorageProofForSlot(42);
    try std.testing.expect(found != null);
    try std.testing.expectEqual(@as(u256, 42), found.?.key.slot);

    const not_found = proof.getStorageProofForSlot(999);
    try std.testing.expect(not_found == null);
}

test "StateProof.computeAddressHash - computes keccak256 of address" {
    const addr = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0");
    const node1 = [_]u8{0xf8} ** 32;
    const account_proof = [_][]const u8{&node1};
    const storage_proofs: []const StorageProof = &.{};

    const proof = StateProof.init(
        addr,
        &account_proof,
        0,
        State.EMPTY_CODE_HASH,
        0,
        State.EMPTY_TRIE_ROOT,
        storage_proofs,
    );

    const hash = proof.computeAddressHash();
    const expected = Hash.keccak256(&addr.bytes);

    try std.testing.expect(Hash.equals(&hash, &expected));
}

test "StateProof.clone - creates independent copy" {
    const allocator = std.testing.allocator;

    const addr = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0");
    const node1 = [_]u8{0xf8} ** 32;
    const account_proof = [_][]const u8{&node1};
    const storage_proofs: []const StorageProof = &.{};

    const original = StateProof.init(
        addr,
        &account_proof,
        1000000000000000000,
        State.EMPTY_CODE_HASH,
        5,
        State.EMPTY_TRIE_ROOT,
        storage_proofs,
    );

    const cloned = try original.clone(allocator);
    defer cloned.deinit(allocator);

    try std.testing.expect(StateProof.equals(&original, &cloned));
    try std.testing.expectEqual(true, cloned._owned);
}

test "StateProof.from - rejects too deep proof" {
    const allocator = std.testing.allocator;

    const addr = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0");
    const storage_proofs: []const StorageProof = &.{};

    // Create array of 257 nodes (exceeds MAX_PROOF_DEPTH)
    var nodes: [MAX_PROOF_DEPTH + 1][32]u8 = undefined;
    var node_slices: [MAX_PROOF_DEPTH + 1][]const u8 = undefined;
    for (&nodes, 0..) |*node, i| {
        @memset(node, @as(u8, @intCast(i % 256)));
        node_slices[i] = node;
    }

    const result = StateProof.from(
        allocator,
        addr,
        &node_slices,
        0,
        State.EMPTY_CODE_HASH,
        0,
        State.EMPTY_TRIE_ROOT,
        storage_proofs,
    );
    try std.testing.expectError(error.ProofTooDeep, result);
}

test "StateProof.addressHex - returns hex string" {
    const addr = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0");
    const node1 = [_]u8{0xf8} ** 32;
    const account_proof = [_][]const u8{&node1};
    const storage_proofs: []const StorageProof = &.{};

    const proof = StateProof.init(
        addr,
        &account_proof,
        0,
        State.EMPTY_CODE_HASH,
        0,
        State.EMPTY_TRIE_ROOT,
        storage_proofs,
    );

    const hex = proof.addressHex();
    try std.testing.expect(std.mem.startsWith(u8, &hex, "0x"));
    try std.testing.expectEqual(@as(usize, 42), hex.len);
}
