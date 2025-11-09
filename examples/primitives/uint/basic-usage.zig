//! Uint Basic Usage Example
//!
//! Demonstrates:
//! - Creating Uint values from different formats
//! - Converting between formats
//! - Basic comparisons
//! - Constants usage

const std = @import("std");
const primitives = @import("primitives");
const Uint = primitives.Uint;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("\n=== Uint Basic Usage Example ===\n\n", .{});

    // 1. Creating Uint values
    std.debug.print("1. Creating Uint Values\n", .{});
    std.debug.print("   --------------------\n", .{});

    // From u256
    const from_u256: u256 = 100;
    std.debug.print("   From u256 100: {}\n", .{from_u256});

    // From hex string
    const from_hex = try Uint.fromHex("0xff");
    std.debug.print("   From hex \"0xff\": {}\n", .{from_hex});

    // From decimal string
    const from_string = try Uint.fromString("12345");
    std.debug.print("   From string \"12345\": {}\n\n", .{from_string});

    // 2. Conversions
    std.debug.print("2. Format Conversions\n", .{});
    std.debug.print("   -----------------\n", .{});

    const value: u256 = 255;
    std.debug.print("   Value: {}\n", .{value});

    // To hex
    const hex_padded = try Uint.toHex(allocator, value, true);
    defer allocator.free(hex_padded);
    const hex_compact = try Uint.toHex(allocator, value, false);
    defer allocator.free(hex_compact);

    std.debug.print("   Padded hex: {s}\n", .{hex_padded});
    std.debug.print("   Compact hex: {s}\n", .{hex_compact});

    // To string
    const decimal_str = try Uint.toString(allocator, value);
    defer allocator.free(decimal_str);
    std.debug.print("   Decimal: {s}\n\n", .{decimal_str});

    // 3. Working with bytes
    std.debug.print("3. Byte Representation\n", .{});
    std.debug.print("   ------------------\n", .{});

    const byte_value: u256 = 256;
    var bytes: [32]u8 = undefined;
    Uint.toBytes(byte_value, &bytes);

    std.debug.print("   Value: {}\n", .{byte_value});
    std.debug.print("   As bytes (32-byte array, big-endian):\n", .{});
    std.debug.print("   - Bytes [0-3]: [{}, {}, {}, {}]\n", .{ bytes[0], bytes[1], bytes[2], bytes[3] });
    std.debug.print("   - Bytes [28-31]: [{}, {}, {}, {}]\n", .{ bytes[28], bytes[29], bytes[30], bytes[31] });
    std.debug.print("   - Total length: {} bytes\n\n", .{bytes.len});

    // Round-trip conversion
    const from_bytes = Uint.fromBytes(&bytes);
    std.debug.print("   Round-trip: {}\n\n", .{byte_value == from_bytes});

    // 4. Comparisons
    std.debug.print("4. Comparisons\n", .{});
    std.debug.print("   -----------\n", .{});

    const a: u256 = 100;
    const b: u256 = 200;
    const c: u256 = 100;

    std.debug.print("   a = {}, b = {}, c = {}\n", .{ a, b, c });
    std.debug.print("   a == b: {}\n", .{a == b});
    std.debug.print("   a == c: {}\n", .{a == c});
    std.debug.print("   a < b: {}\n", .{a < b});
    std.debug.print("   b > a: {}\n", .{b > a});
    std.debug.print("   a <= c: {}\n\n", .{a <= c});

    // 5. Constants
    std.debug.print("5. Using Constants\n", .{});
    std.debug.print("   --------------\n", .{});

    const zero: u256 = 0;
    const one: u256 = 1;
    const max: u256 = std.math.maxInt(u256);

    std.debug.print("   ZERO: {}\n", .{zero});
    std.debug.print("   ONE: {}\n", .{one});
    std.debug.print("   MAX: {} (first 50 chars)\n", .{max});
    std.debug.print("   SIZE: 32 bytes\n\n", .{});

    // Check if value is zero
    const zero_check: u256 = 0;
    const non_zero: u256 = 42;
    std.debug.print("   {} is zero: {}\n", .{ zero_check, zero_check == 0 });
    std.debug.print("   {} is zero: {}\n\n", .{ non_zero, non_zero == 0 });

    // 6. Safe parsing with try
    std.debug.print("6. Safe Parsing\n", .{});
    std.debug.print("   -----------\n", .{});

    std.debug.print("   Valid inputs:\n", .{});

    const valid1 = Uint.fromHex("0xff") catch null;
    std.debug.print("   - fromHex(\"0xff\"): {?}\n", .{valid1});

    const valid2 = Uint.fromString("42") catch null;
    std.debug.print("   - fromString(\"42\"): {?}\n", .{valid2});

    std.debug.print("\n   Invalid inputs:\n", .{});

    const invalid1 = Uint.fromHex("0xGG") catch null;
    std.debug.print("   - fromHex(\"0xGG\"): {?}\n", .{invalid1});

    const invalid2 = Uint.fromString("invalid") catch null;
    std.debug.print("   - fromString(\"invalid\"): {?}\n", .{invalid2});

    std.debug.print("\n=== Example Complete ===\n\n", .{});
}
