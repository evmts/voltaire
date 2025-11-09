//! Basic Hex Usage Example
//!
//! Demonstrates:
//! - Creating hex strings from various input types
//! - Basic validation and type checking
//! - Converting between hex and other formats
//! - Size checking
//!
//! Run with: zig build run-example -- primitives/hex/basic-usage.zig

const std = @import("std");
const primitives = @import("primitives");
const Hex = primitives.Hex;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("\n=== Basic Hex Usage ===\n\n", .{});

    try demonstrateCreation(allocator);
    try demonstrateValidation();
    try demonstrateConversions(allocator);
    try demonstrateSize(allocator);

    std.debug.print("\n=== Example completed ===\n\n", .{});
}

fn demonstrateCreation(allocator: std.mem.Allocator) !void {
    std.debug.print("1. Creating Hex:\n", .{});

    // From hex string (via validation)
    const hex1 = "0x1234";
    if (Hex.isHex(hex1)) {
        std.debug.print("  From string: {s}\n", .{hex1});
    }

    // From bytes
    const bytes = [_]u8{ 0x12, 0x34, 0xab, 0xcd };
    const hex2 = try Hex.bytesToHex(allocator, &bytes);
    defer allocator.free(hex2);
    std.debug.print("  From bytes: {s}\n", .{hex2});

    // From number (u256)
    const number: u256 = 255;
    const hex3 = try Hex.u256ToHex(allocator, number);
    defer allocator.free(hex3);
    std.debug.print("  From number (255): {s}\n", .{hex3});

    // From string (UTF-8 encoding)
    const text = "hello";
    const hex5 = try Hex.stringToHex(allocator, text);
    defer allocator.free(hex5);
    std.debug.print("  From UTF-8 string: {s}\n", .{hex5});

    std.debug.print("\n", .{});
}

fn demonstrateValidation() !void {
    std.debug.print("2. Validation:\n", .{});

    // Valid hex strings
    const valid_cases = [_][]const u8{
        "0x1234abcd",
        "0xdeadbeef",
        "0xABCDEF",
    };

    for (valid_cases) |hex| {
        const is_valid = Hex.isHex(hex);
        std.debug.print("  \"{s}\" is valid: {}\n", .{ hex, is_valid });
    }

    // Invalid hex strings
    const invalid_cases = [_][]const u8{
        "1234",      // Missing 0x prefix
        "0xGHI",     // Invalid characters
        "0x 123",    // Contains space
    };

    for (invalid_cases) |hex| {
        const is_valid = Hex.isHex(hex);
        std.debug.print("  \"{s}\" is valid: {}\n", .{ hex, is_valid });
    }

    std.debug.print("\n", .{});
}

fn demonstrateConversions(allocator: std.mem.Allocator) !void {
    std.debug.print("3. Conversions:\n", .{});

    // "hello" encoded as hex
    const data = "0x68656c6c6f";

    // To bytes
    const converted_bytes = try Hex.hexToBytes(allocator, data);
    defer allocator.free(converted_bytes);
    std.debug.print("  To bytes: [", .{});
    for (converted_bytes, 0..) |byte, i| {
        if (i > 0) std.debug.print(", ", .{});
        std.debug.print("0x{x:0>2}", .{byte});
    }
    std.debug.print("]\n", .{});

    // To string (UTF-8 decode)
    const str = try Hex.hexToString(allocator, data);
    defer allocator.free(str);
    std.debug.print("  To UTF-8 string: \"{s}\"\n", .{str});

    // To u256
    const small_hex = "0xff";
    const num = try Hex.hexToU256(small_hex);
    std.debug.print("  To number: {}\n", .{num});

    // To u256 from larger value
    const bigint = try Hex.hexToU256(data);
    std.debug.print("  To u256: {}\n", .{bigint});

    std.debug.print("\n", .{});
}

fn demonstrateSize(allocator: std.mem.Allocator) !void {
    std.debug.print("4. Size operations:\n", .{});

    // Ethereum address (20 bytes)
    const addr = "0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e";

    // Convert to bytes to check size
    const addr_bytes = try Hex.hexToBytes(allocator, addr);
    defer allocator.free(addr_bytes);

    std.debug.print("  Address size: {} bytes\n", .{addr_bytes.len});
    std.debug.print("  Is 20 bytes? {}\n", .{addr_bytes.len == 20});
    std.debug.print("  Is 32 bytes? {}\n", .{addr_bytes.len == 32});

    if (addr_bytes.len == 20) {
        std.debug.print("  ✓ Address is exactly 20 bytes\n", .{});
    }

    std.debug.print("\n", .{});
}
