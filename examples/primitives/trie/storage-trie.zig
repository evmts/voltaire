//! Storage Trie
//!
//! Demonstrates building a contract storage trie, similar to how Ethereum
//! stores contract state variables in a separate trie per contract.

const std = @import("std");
const primitives = @import("primitives");
const Trie = primitives.Trie;
const crypto = @import("crypto");

/// Compute storage key for a mapping (slot, key) -> Keccak256(key || slot)
fn computeStorageKey(allocator: std.mem.Allocator, slot: u256, key: []const u8) ![32]u8 {
    var hasher = crypto.Keccak256.init(.{});

    // Hash: key || slot
    hasher.update(key);
    const slot_bytes = std.mem.toBytes(slot);
    hasher.update(&slot_bytes);

    var hash: [32]u8 = undefined;
    hasher.final(&hash);
    return hash;
}

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("=== Contract Storage Trie ===\n\n", .{});
    std.debug.print("Simulating ERC20 token contract storage:\n\n", .{});

    // Create storage trie for a contract
    var storage_trie = Trie.init(allocator);
    defer storage_trie.deinit();

    // Storage slot 0: owner address
    const slot0 = [_]u8{0} ** 32;
    const owner_addr = [_]u8{0x12, 0x34} ++ [_]u8{0} ** 18;
    try storage_trie.put(&slot0, &owner_addr);
    std.debug.print("Slot 0 (owner): 0x{x:0>40}\n", .{std.fmt.fmtSliceHexLower(&owner_addr)});

    // Storage slot 1: total supply
    const slot1 = [_]u8{0} ** 31 ++ [_]u8{1};
    const total_supply: u256 = 1_000_000_000_000_000_000_000_000; // 1M tokens (18 decimals)
    const supply_bytes = std.mem.toBytes(total_supply);
    try storage_trie.put(&slot1, &supply_bytes);
    std.debug.print("Slot 1 (totalSupply): {} (1M tokens)\n", .{total_supply});

    // Storage slot 2: balances mapping
    // balances[owner_addr] = 500k tokens
    const balance_slot = try computeStorageKey(allocator, 2, &owner_addr);
    const owner_balance: u256 = 500_000_000_000_000_000_000_000;
    const balance_bytes = std.mem.toBytes(owner_balance);
    try storage_trie.put(&balance_slot, &balance_bytes);
    std.debug.print("\nSlot 2 mapping (balances):\n", .{});
    std.debug.print("  balances[0x{x:0>40}] = {} (500k tokens)\n", .{
        std.fmt.fmtSliceHexLower(&owner_addr),
        owner_balance,
    });

    // Another balance: different address
    const addr2 = [_]u8{0xAB, 0xCD} ++ [_]u8{0} ** 18;
    const balance_slot2 = try computeStorageKey(allocator, 2, &addr2);
    const balance2: u256 = 300_000_000_000_000_000_000_000;
    const balance2_bytes = std.mem.toBytes(balance2);
    try storage_trie.put(&balance_slot2, &balance2_bytes);
    std.debug.print("  balances[0x{x:0>40}] = {} (300k tokens)\n", .{
        std.fmt.fmtSliceHexLower(&addr2),
        balance2,
    });

    // Storage slot 3: allowances mapping (nested mapping)
    // allowances[owner_addr][spender_addr] = 100k tokens
    const spender_addr = [_]u8{0x56, 0x78} ++ [_]u8{0} ** 18;

    // First compute inner mapping key
    const inner_key = try computeStorageKey(allocator, 3, &owner_addr);
    // Then compute outer mapping key
    const allowance_slot = try computeStorageKey(allocator, @as(u256, @bitCast(inner_key)), &spender_addr);
    const allowance: u256 = 100_000_000_000_000_000_000_000;
    const allowance_bytes = std.mem.toBytes(allowance);
    try storage_trie.put(&allowance_slot, &allowance_bytes);
    std.debug.print("\nSlot 3 nested mapping (allowances):\n", .{});
    std.debug.print("  allowances[0x{x:0>40}][0x{x:0>40}] = {} (100k tokens)\n", .{
        std.fmt.fmtSliceHexLower(&owner_addr),
        std.fmt.fmtSliceHexLower(&spender_addr),
        allowance,
    });

    // Compute storage root
    const storage_root = storage_trie.root_hash();
    std.debug.print("\n=== Storage Root ===\n", .{});
    std.debug.print("Root Hash: 0x{x:0>64}\n", .{std.fmt.fmtSliceHexLower(&storage_root.?)});
    std.debug.print("\nThis storage root would be stored in the account's state.\n", .{});

    // Verify retrieval
    std.debug.print("\n=== Verification ===\n", .{});
    const retrieved_owner = try storage_trie.get(&slot0);
    std.debug.print("✓ Retrieved owner: 0x{x:0>40}\n", .{std.fmt.fmtSliceHexLower(retrieved_owner.?)});

    const retrieved_supply = try storage_trie.get(&slot1);
    const supply_val = std.mem.bytesToValue(u256, retrieved_supply.?);
    std.debug.print("✓ Retrieved total supply: {}\n", .{supply_val});

    std.debug.print("\n✓ Storage trie built successfully\n", .{});
}
