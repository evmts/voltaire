//! Transaction Trie
//!
//! Demonstrates building a transaction trie for a block. In Ethereum, each block
//! contains a trie of transactions ordered by their index in the block.

const std = @import("std");
const primitives = @import("primitives");
const Trie = primitives.Trie;

/// Simplified transaction representation
const Transaction = struct {
    from: [20]u8,
    to: [20]u8,
    value: u128,
    nonce: u64,
    gas_limit: u64,

    /// Encode transaction to bytes (simplified - production uses RLP)
    pub fn encode(self: Transaction, allocator: std.mem.Allocator) ![]u8 {
        var list = std.ArrayList(u8).init(allocator);
        defer list.deinit();

        try list.appendSlice(&self.from);
        try list.appendSlice(&self.to);
        try list.writer().writeInt(u128, self.value, .big);
        try list.writer().writeInt(u64, self.nonce, .big);
        try list.writer().writeInt(u64, self.gas_limit, .big);

        return try list.toOwnedSlice();
    }
};

/// Encode transaction index for use as trie key
fn encodeIndex(allocator: std.mem.Allocator, index: usize) ![]u8 {
    // Simple encoding: convert index to bytes (production uses RLP)
    var buf: [8]u8 = undefined;
    std.mem.writeInt(u64, &buf, @as(u64, @intCast(index)), .big);

    // Remove leading zeros for compact representation
    var start: usize = 0;
    while (start < buf.len - 1 and buf[start] == 0) : (start += 1) {}

    return try allocator.dupe(u8, buf[start..]);
}

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("=== Transaction Trie (Block Transactions) ===\n\n", .{});

    // Create transaction trie
    var tx_trie = Trie.init(allocator);
    defer tx_trie.deinit();

    // Transaction 0: Transfer
    const tx0 = Transaction{
        .from = [_]u8{0x12} ++ [_]u8{0} ** 19,
        .to = [_]u8{0x34} ++ [_]u8{0} ** 19,
        .value = 1_000_000_000_000_000_000, // 1 ETH
        .nonce = 5,
        .gas_limit = 21000,
    };
    const encoded0 = try tx0.encode(allocator);
    defer allocator.free(encoded0);
    const key0 = try encodeIndex(allocator, 0);
    defer allocator.free(key0);
    try tx_trie.put(key0, encoded0);

    std.debug.print("Transaction 0:\n", .{});
    std.debug.print("  From:  0x{x:0>40}\n", .{std.fmt.fmtSliceHexLower(&tx0.from)});
    std.debug.print("  To:    0x{x:0>40}\n", .{std.fmt.fmtSliceHexLower(&tx0.to)});
    std.debug.print("  Value: {} wei (1 ETH)\n", .{tx0.value});
    std.debug.print("  Nonce: {}\n", .{tx0.nonce});
    std.debug.print("  Gas:   {}\n", .{tx0.gas_limit});

    // Transaction 1: Contract call
    const tx1 = Transaction{
        .from = [_]u8{0x56} ++ [_]u8{0} ** 19,
        .to = [_]u8{0xAB} ++ [_]u8{0} ** 19,
        .value = 0, // No ETH transfer
        .nonce = 10,
        .gas_limit = 100000,
    };
    const encoded1 = try tx1.encode(allocator);
    defer allocator.free(encoded1);
    const key1 = try encodeIndex(allocator, 1);
    defer allocator.free(key1);
    try tx_trie.put(key1, encoded1);

    std.debug.print("\nTransaction 1:\n", .{});
    std.debug.print("  From:  0x{x:0>40}\n", .{std.fmt.fmtSliceHexLower(&tx1.from)});
    std.debug.print("  To:    0x{x:0>40}\n", .{std.fmt.fmtSliceHexLower(&tx1.to)});
    std.debug.print("  Value: {} wei (contract call)\n", .{tx1.value});
    std.debug.print("  Nonce: {}\n", .{tx1.nonce});
    std.debug.print("  Gas:   {}\n", .{tx1.gas_limit});

    // Transaction 2: Another transfer
    const tx2 = Transaction{
        .from = [_]u8{0x78} ++ [_]u8{0} ** 19,
        .to = [_]u8{0x9A} ++ [_]u8{0} ** 19,
        .value = 500_000_000_000_000_000, // 0.5 ETH
        .nonce = 3,
        .gas_limit = 21000,
    };
    const encoded2 = try tx2.encode(allocator);
    defer allocator.free(encoded2);
    const key2 = try encodeIndex(allocator, 2);
    defer allocator.free(key2);
    try tx_trie.put(key2, encoded2);

    std.debug.print("\nTransaction 2:\n", .{});
    std.debug.print("  From:  0x{x:0>40}\n", .{std.fmt.fmtSliceHexLower(&tx2.from)});
    std.debug.print("  To:    0x{x:0>40}\n", .{std.fmt.fmtSliceHexLower(&tx2.to)});
    std.debug.print("  Value: {} wei (0.5 ETH)\n", .{tx2.value});
    std.debug.print("  Nonce: {}\n", .{tx2.nonce});
    std.debug.print("  Gas:   {}\n", .{tx2.gas_limit});

    // Compute transaction root
    const tx_root = tx_trie.root_hash();
    std.debug.print("\n=== Transaction Root ===\n", .{});
    std.debug.print("Root Hash: 0x{x:0>64}\n", .{std.fmt.fmtSliceHexLower(&tx_root.?)});
    std.debug.print("\nThis transaction root would be stored in the block header.\n", .{});

    // Verify transactions can be retrieved by index
    std.debug.print("\n=== Verification ===\n", .{});
    const key1_verify = try encodeIndex(allocator, 1);
    defer allocator.free(key1_verify);
    const retrieved = try tx_trie.get(key1_verify);
    std.debug.print("✓ Successfully retrieved transaction at index 1\n", .{});
    std.debug.print("  Encoded length: {} bytes\n", .{retrieved.?.len});

    std.debug.print("\n✓ Transaction trie built successfully\n", .{});
}
