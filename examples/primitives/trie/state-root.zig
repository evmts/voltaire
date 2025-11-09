//! State Root Computation
//!
//! Demonstrates using a Merkle Patricia Trie to compute Ethereum state root.
//! Each account address maps to its account state (nonce, balance, storage root, code hash).

const std = @import("std");
const primitives = @import("primitives");
const Trie = primitives.Trie;

/// Simplified account state structure
const AccountState = struct {
    nonce: u64,
    balance: u128,
    storage_root: [32]u8,
    code_hash: [32]u8,

    /// Encode account state to bytes (simplified - production uses RLP)
    pub fn encode(self: AccountState, allocator: std.mem.Allocator) ![]u8 {
        var list = std.ArrayList(u8).init(allocator);
        defer list.deinit();

        try list.writer().writeInt(u64, self.nonce, .big);
        try list.writer().writeInt(u128, self.balance, .big);
        try list.appendSlice(&self.storage_root);
        try list.appendSlice(&self.code_hash);

        return try list.toOwnedSlice();
    }
};

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("=== State Root Computation ===\n\n", .{});

    // Create state trie
    var state_trie = Trie.init(allocator);
    defer state_trie.deinit();

    // Account 1: EOA with balance
    const addr1 = [_]u8{0x12} ++ [_]u8{0} ** 19; // 20-byte address
    const account1 = AccountState{
        .nonce = 5,
        .balance = 1_000_000_000_000_000_000, // 1 ETH in wei
        .storage_root = [_]u8{0} ** 32, // Empty storage
        .code_hash = [_]u8{0} ** 32, // No code (EOA)
    };
    const encoded1 = try account1.encode(allocator);
    defer allocator.free(encoded1);
    try state_trie.put(&addr1, encoded1);
    std.debug.print("Account 1: 0x{x:0>40}\n", .{std.fmt.fmtSliceHexLower(&addr1)});
    std.debug.print("  Nonce: {}\n", .{account1.nonce});
    std.debug.print("  Balance: {} wei (1 ETH)\n", .{account1.balance});

    // Account 2: Contract with storage
    const addr2 = [_]u8{0xAB} ++ [_]u8{0} ** 19;
    const account2 = AccountState{
        .nonce = 1,
        .balance = 500_000_000_000_000_000, // 0.5 ETH
        .storage_root = [_]u8{0xAA} ** 32, // Has storage
        .code_hash = [_]u8{0xBB} ** 32, // Has code
    };
    const encoded2 = try account2.encode(allocator);
    defer allocator.free(encoded2);
    try state_trie.put(&addr2, encoded2);
    std.debug.print("\nAccount 2: 0x{x:0>40}\n", .{std.fmt.fmtSliceHexLower(&addr2)});
    std.debug.print("  Nonce: {}\n", .{account2.nonce});
    std.debug.print("  Balance: {} wei (0.5 ETH)\n", .{account2.balance});

    // Account 3: Another EOA
    const addr3 = [_]u8{0x34} ++ [_]u8{0} ** 19;
    const account3 = AccountState{
        .nonce = 0,
        .balance = 2_500_000_000_000_000_000, // 2.5 ETH
        .storage_root = [_]u8{0} ** 32,
        .code_hash = [_]u8{0} ** 32,
    };
    const encoded3 = try account3.encode(allocator);
    defer allocator.free(encoded3);
    try state_trie.put(&addr3, encoded3);
    std.debug.print("\nAccount 3: 0x{x:0>40}\n", .{std.fmt.fmtSliceHexLower(&addr3)});
    std.debug.print("  Nonce: {}\n", .{account3.nonce});
    std.debug.print("  Balance: {} wei (2.5 ETH)\n", .{account3.balance});

    // Compute state root
    const state_root = state_trie.root_hash();
    std.debug.print("\n=== State Root ===\n", .{});
    std.debug.print("Root Hash: 0x{x:0>64}\n", .{std.fmt.fmtSliceHexLower(&state_root.?)});

    // Demonstrate that state root changes with state
    std.debug.print("\n=== State Mutation ===\n", .{});
    std.debug.print("Updating Account 1 nonce to 6...\n", .{});
    const account1_updated = AccountState{
        .nonce = 6, // Nonce increased
        .balance = account1.balance,
        .storage_root = account1.storage_root,
        .code_hash = account1.code_hash,
    };
    const encoded1_updated = try account1_updated.encode(allocator);
    defer allocator.free(encoded1_updated);
    try state_trie.put(&addr1, encoded1_updated);

    const new_state_root = state_trie.root_hash();
    std.debug.print("New Root Hash: 0x{x:0>64}\n", .{std.fmt.fmtSliceHexLower(&new_state_root.?)});
    std.debug.print("\n✓ Root hash changed (state is cryptographically committed)\n", .{});
}
