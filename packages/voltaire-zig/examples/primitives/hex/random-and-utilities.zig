//! Random Generation and Utilities Example
//!
//! Demonstrates:
//! - Creating zero-filled hex values
//! - Size utilities
//! - Common Ethereum patterns
//!
//! Run with: zig build run-example -- primitives/hex/random-and-utilities.zig

const std = @import("std");
const primitives = @import("primitives");
const Hex = primitives.Hex;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("\n=== Random Generation and Utilities ===\n\n", .{});

    try demonstrateSize();
    try demonstrateEquality(allocator);
    try demonstrateUtilities(allocator);
    try ethereumConstants();

    std.debug.print("\n=== Example completed ===\n\n", .{});
}

fn demonstrateSize() !void {
    std.debug.print("1. Size utilities:\n", .{});

    // Different sized hex strings
    const hash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"; // 32 bytes
    const address = "0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e"; // 20 bytes
    const selector = "0xa9059cbb"; // 4 bytes
    const empty = "0x"; // 0 bytes

    // Calculate sizes by string length
    const hash_size = (hash.len - 2) / 2;
    const address_size = (address.len - 2) / 2;
    const selector_size = (selector.len - 2) / 2;
    const empty_size = (empty.len - 2) / 2;

    std.debug.print("  Hash size: {} bytes\n", .{hash_size});
    std.debug.print("  Address size: {} bytes\n", .{address_size});
    std.debug.print("  Selector size: {} bytes\n", .{selector_size});
    std.debug.print("  Empty size: {} bytes\n", .{empty_size});

    // Size validation
    std.debug.print("  Hash is 32 bytes? {}\n", .{hash_size == 32});
    std.debug.print("  Address is 20 bytes? {}\n", .{address_size == 20});
    std.debug.print("  Selector is 4 bytes? {}\n", .{selector_size == 4});

    std.debug.print("\n", .{});
}

fn demonstrateEquality(allocator: std.mem.Allocator) !void {
    std.debug.print("2. Equality checking:\n", .{});

    const addr1 = "0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e";
    const addr2 = "0x742d35cc6634c0532925a3b844bc9e7595f51e3e"; // Different case
    const addr3 = "0x0000000000000000000000000000000000000000";

    // Convert to bytes for comparison
    const bytes1 = try Hex.hexToBytes(allocator, addr1);
    defer allocator.free(bytes1);

    const bytes2 = try Hex.hexToBytes(allocator, addr2);
    defer allocator.free(bytes2);

    const bytes3 = try Hex.hexToBytes(allocator, addr3);
    defer allocator.free(bytes3);

    const equal_1_2 = std.mem.eql(u8, bytes1, bytes2);
    const equal_1_3 = std.mem.eql(u8, bytes1, bytes3);

    std.debug.print("  Address 1: {s}\n", .{addr1});
    std.debug.print("  Address 2: {s}\n", .{addr2});
    std.debug.print("  Are equal (case-insensitive): {}\n", .{equal_1_2});
    std.debug.print("  Equal to different address: {}\n", .{equal_1_3});

    // Check if zero address
    const zero_address = [_]u8{0} ** 20;
    const is_zero = std.mem.eql(u8, bytes3, &zero_address);
    std.debug.print("  Is addr3 zero address? {}\n", .{is_zero});

    std.debug.print("\n", .{});
}

fn demonstrateUtilities(allocator: std.mem.Allocator) !void {
    std.debug.print("3. Utilities:\n", .{});

    // Concatenation
    const part1 = [_]u8{ 0x12, 0x34 };
    const part2 = [_]u8{ 0xab, 0xcd };
    const parts = [_][]const u8{ &part1, &part2 };

    const concatenated = try Hex.concat(allocator, &parts);
    defer allocator.free(concatenated);

    std.debug.print("  Concatenated: [", .{});
    for (concatenated, 0..) |byte, i| {
        if (i > 0) std.debug.print(", ", .{});
        std.debug.print("0x{x:0>2}", .{byte});
    }
    std.debug.print("]\n", .{});

    // Slicing
    const data = [_]u8{ 0x00, 0x11, 0x22, 0x33, 0x44 };
    const sliced = Hex.slice(&data, 1, 4);

    std.debug.print("  Sliced [1..4]: [", .{});
    for (sliced, 0..) |byte, i| {
        if (i > 0) std.debug.print(", ", .{});
        std.debug.print("0x{x:0>2}", .{byte});
    }
    std.debug.print("]\n", .{});

    // Size
    std.debug.print("  Original size: {} bytes\n", .{data.len});
    std.debug.print("  Sliced size: {} bytes\n", .{sliced.len});

    std.debug.print("\n", .{});
}

fn ethereumConstants() !void {
    std.debug.print("4. Common Ethereum constants:\n", .{});

    // Zero address (burn address)
    const zero_address = [_]u8{0} ** 20;
    std.debug.print("  Burn address: 0x", .{});
    for (zero_address) |byte| {
        std.debug.print("{x:0>2}", .{byte});
    }
    std.debug.print("\n", .{});

    // Empty root hash
    const empty_root = [_]u8{0} ** 32;
    std.debug.print("  Empty root (first 8 bytes): 0x", .{});
    for (empty_root[0..8]) |byte| {
        std.debug.print("{x:0>2}", .{byte});
    }
    std.debug.print("...\n", .{});

    // Function selector (4 bytes)
    const transfer_selector = [_]u8{ 0xa9, 0x05, 0x9c, 0xbb };
    std.debug.print("  Transfer selector: 0x", .{});
    for (transfer_selector) |byte| {
        std.debug.print("{x:0>2}", .{byte});
    }
    std.debug.print("\n", .{});
    std.debug.print("  Is 4 bytes? {}\n", .{transfer_selector.len == 4});

    // Storage slot (32 bytes)
    const storage_slot = [_]u8{0} ** 32;
    std.debug.print("  Storage slot size: {} bytes\n", .{storage_slot.len});

    // Signature size (65 bytes: r + s + v)
    const signature_size: usize = 65;
    std.debug.print("  Signature size: {} bytes\n", .{signature_size});

    std.debug.print("\n", .{});
}
