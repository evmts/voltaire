//! Hex Utilities Example
//!
//! Demonstrates all hex utility functions from primitives.Hex module.
//! Run with: zig build example-hex

const std = @import("std");
const primitives = @import("primitives");
const Hex = primitives.Hex;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("\n=== Hex Utilities Example ===\n\n", .{});

    // 1. Validating hex strings
    try demonstrateValidation();

    // 2. Converting between hex and bytes
    try demonstrateHexToBytes(allocator);

    // 3. Converting bytes to hex
    try demonstrateBytesToHex(allocator);

    // 4. Converting hex to/from strings
    try demonstrateStringConversions(allocator);

    // 5. Converting hex to/from u256
    try demonstrateNumericConversions(allocator);

    // 6. Padding operations
    try demonstratePadding(allocator);

    // 7. Trimming zeros
    try demonstrateTrimming();

    // 8. Additional utilities
    try demonstrateUtilities(allocator);

    std.debug.print("=== All examples completed successfully ===\n\n", .{});
}

fn demonstrateValidation() !void {
    std.debug.print("1. Hex Validation (isHex)\n", .{});
    std.debug.print("   Purpose: Check if a string is a valid Ethereum hex string\n\n", .{});

    const test_cases = [_]struct { input: []const u8, expected: bool }{
        .{ .input = "0x1234abcd", .expected = true },
        .{ .input = "0xdeadbeef", .expected = true },
        .{ .input = "0xABCDEF", .expected = true },
        .{ .input = "1234abcd", .expected = false }, // Missing 0x prefix
        .{ .input = "0x", .expected = false }, // Too short (needs at least one hex digit)
        .{ .input = "0xGHI", .expected = false }, // Invalid characters
        .{ .input = "0x 123", .expected = false }, // Contains space
    };

    for (test_cases) |case| {
        const result = Hex.isHex(case.input);
        std.debug.print("   isHex(\"{s}\") = {}\n", .{ case.input, result });
        if (result != case.expected) {
            std.debug.print("   ERROR: Expected {}, got {}\n", .{ case.expected, result });
            return error.ValidationFailed;
        }
    }
    std.debug.print("\n", .{});
}

fn demonstrateHexToBytes(allocator: std.mem.Allocator) !void {
    std.debug.print("2. Hex to Bytes Conversion (hexToBytes)\n", .{});
    std.debug.print("   Purpose: Convert hex string to byte array\n\n", .{});

    // Basic conversion
    const hex1 = "0x1234abcd";
    const bytes1 = try Hex.hexToBytes(allocator, hex1);
    defer allocator.free(bytes1);

    std.debug.print("   Input:  {s}\n", .{hex1});
    std.debug.print("   Output: [", .{});
    for (bytes1, 0..) |byte, i| {
        if (i > 0) std.debug.print(", ", .{});
        std.debug.print("0x{x:0>2}", .{byte});
    }
    std.debug.print("]\n\n", .{});

    // Empty hex string
    const hex2 = "0x";
    const bytes2 = try Hex.hexToBytes(allocator, hex2);
    defer allocator.free(bytes2);
    std.debug.print("   Empty hex \"0x\" produces {} bytes\n\n", .{bytes2.len});

    // Ethereum address example
    const address_hex = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1";
    const address_bytes = try Hex.hexToBytes(allocator, address_hex);
    defer allocator.free(address_bytes);
    std.debug.print("   Ethereum address: {s}\n", .{address_hex});
    std.debug.print("   Byte length: {} (expected 20 for addresses)\n\n", .{address_bytes.len});
}

fn demonstrateBytesToHex(allocator: std.mem.Allocator) !void {
    std.debug.print("3. Bytes to Hex Conversion (bytesToHex)\n", .{});
    std.debug.print("   Purpose: Convert byte array to hex string\n\n", .{});

    // Basic conversion
    const bytes1 = [_]u8{ 0x12, 0x34, 0xab, 0xcd };
    const hex1 = try Hex.bytesToHex(allocator, &bytes1);
    defer allocator.free(hex1);

    std.debug.print("   Input:  [0x12, 0x34, 0xab, 0xcd]\n", .{});
    std.debug.print("   Output: {s}\n\n", .{hex1});

    // String to hex encoding
    const message = "Hello, Ethereum!";
    const hex2 = try Hex.bytesToHex(allocator, message);
    defer allocator.free(hex2);

    std.debug.print("   Encoding text: \"{s}\"\n", .{message});
    std.debug.print("   As hex: {s}\n\n", .{hex2});

    // Empty bytes
    const empty_bytes = [_]u8{};
    const hex3 = try Hex.bytesToHex(allocator, &empty_bytes);
    defer allocator.free(hex3);
    std.debug.print("   Empty bytes produce: {s}\n\n", .{hex3});
}

fn demonstrateStringConversions(allocator: std.mem.Allocator) !void {
    std.debug.print("4. String Conversions (hexToString, stringToHex)\n", .{});
    std.debug.print("   Purpose: Convert between text strings and hex encoding\n\n", .{});

    // String to hex
    const original_text = "Ethereum";
    const hex_encoded = try Hex.stringToHex(allocator, original_text);
    defer allocator.free(hex_encoded);

    std.debug.print("   Original text: \"{s}\"\n", .{original_text});
    std.debug.print("   Hex encoded:   {s}\n\n", .{hex_encoded});

    // Hex to string (decode)
    const decoded_text = try Hex.hexToString(allocator, hex_encoded);
    defer allocator.free(decoded_text);

    std.debug.print("   Decoded back:  \"{s}\"\n", .{decoded_text});
    std.debug.print("   Match: {}\n\n", .{std.mem.eql(u8, original_text, decoded_text)});
}

fn demonstrateNumericConversions(allocator: std.mem.Allocator) !void {
    std.debug.print("5. Numeric Conversions (hexToU256, u256ToHex)\n", .{});
    std.debug.print("   Purpose: Convert between hex strings and 256-bit unsigned integers\n\n", .{});

    // Small number
    const value1: u256 = 42;
    const hex1 = try Hex.u256ToHex(allocator, value1);
    defer allocator.free(hex1);

    std.debug.print("   Number: {}\n", .{value1});
    std.debug.print("   As hex: {s}\n\n", .{hex1});

    // Large number (1 ETH in wei)
    const one_eth: u256 = 1_000_000_000_000_000_000;
    const hex2 = try Hex.u256ToHex(allocator, one_eth);
    defer allocator.free(hex2);

    std.debug.print("   1 ETH in wei: {}\n", .{one_eth});
    std.debug.print("   As hex: {s}\n\n", .{hex2});

    // Hex to u256
    const hex_value = "0xdeadbeef";
    const parsed = try Hex.hexToU256(hex_value);

    std.debug.print("   Hex string: {s}\n", .{hex_value});
    std.debug.print("   As u256: {}\n", .{parsed});
    std.debug.print("   As u256 (decimal): {d}\n\n", .{parsed});

    // Maximum u256 value
    const max_value = std.math.maxInt(u256);
    const hex3 = try Hex.u256ToHex(allocator, max_value);
    defer allocator.free(hex3);

    std.debug.print("   Max u256: {s}\n", .{hex3});
    std.debug.print("   Length: {} characters\n\n", .{hex3.len});
}

fn demonstratePadding(allocator: std.mem.Allocator) !void {
    std.debug.print("6. Padding Operations (padLeft, padRight)\n", .{});
    std.debug.print("   Purpose: Pad byte arrays to a target length with zeros\n\n", .{});

    const original = [_]u8{ 0xab, 0xcd };

    // Pad left (prepend zeros)
    const padded_left = try Hex.padLeft(allocator, &original, 4);
    defer allocator.free(padded_left);

    std.debug.print("   Original bytes: [0xab, 0xcd] (length: {})\n", .{original.len});
    std.debug.print("   Padded left to 4 bytes: [", .{});
    for (padded_left, 0..) |byte, i| {
        if (i > 0) std.debug.print(", ", .{});
        std.debug.print("0x{x:0>2}", .{byte});
    }
    std.debug.print("]\n\n", .{});

    // Pad right (append zeros)
    const padded_right = try Hex.padRight(allocator, &original, 4);
    defer allocator.free(padded_right);

    std.debug.print("   Padded right to 4 bytes: [", .{});
    for (padded_right, 0..) |byte, i| {
        if (i > 0) std.debug.print(", ", .{});
        std.debug.print("0x{x:0>2}", .{byte});
    }
    std.debug.print("]\n\n", .{});

    // Pad to 32 bytes (common for Ethereum storage slots)
    const padded_32 = try Hex.padLeft(allocator, &original, 32);
    defer allocator.free(padded_32);

    std.debug.print("   Padded left to 32 bytes (storage slot size)\n", .{});
    std.debug.print("   First 4 bytes: [", .{});
    for (padded_32[0..4], 0..) |byte, i| {
        if (i > 0) std.debug.print(", ", .{});
        std.debug.print("0x{x:0>2}", .{byte});
    }
    std.debug.print("]\n", .{});
    std.debug.print("   Last 4 bytes:  [", .{});
    for (padded_32[28..32], 0..) |byte, i| {
        if (i > 0) std.debug.print(", ", .{});
        std.debug.print("0x{x:0>2}", .{byte});
    }
    std.debug.print("]\n\n", .{});
}

fn demonstrateTrimming() !void {
    std.debug.print("7. Trimming Zeros (trimLeftZeros, trimRightZeros)\n", .{});
    std.debug.print("   Purpose: Remove leading or trailing zero bytes\n\n", .{});

    const bytes_with_zeros = [_]u8{ 0x00, 0x00, 0xab, 0xcd, 0x00, 0x00 };

    std.debug.print("   Original: [", .{});
    for (bytes_with_zeros, 0..) |byte, i| {
        if (i > 0) std.debug.print(", ", .{});
        std.debug.print("0x{x:0>2}", .{byte});
    }
    std.debug.print("] (length: {})\n\n", .{bytes_with_zeros.len});

    // Trim left zeros
    const trimmed_left = Hex.trimLeftZeros(&bytes_with_zeros);
    std.debug.print("   Trimmed left: [", .{});
    for (trimmed_left, 0..) |byte, i| {
        if (i > 0) std.debug.print(", ", .{});
        std.debug.print("0x{x:0>2}", .{byte});
    }
    std.debug.print("] (length: {})\n\n", .{trimmed_left.len});

    // Trim right zeros
    const trimmed_right = Hex.trimRightZeros(&bytes_with_zeros);
    std.debug.print("   Trimmed right: [", .{});
    for (trimmed_right, 0..) |byte, i| {
        if (i > 0) std.debug.print(", ", .{});
        std.debug.print("0x{x:0>2}", .{byte});
    }
    std.debug.print("] (length: {})\n\n", .{trimmed_right.len});

    // All zeros case
    const all_zeros = [_]u8{ 0x00, 0x00, 0x00 };
    const trimmed_all = Hex.trimLeftZeros(&all_zeros);
    std.debug.print("   All zeros [0x00, 0x00, 0x00] trimmed left: length = {}\n\n", .{trimmed_all.len});
}

fn demonstrateUtilities(allocator: std.mem.Allocator) !void {
    std.debug.print("8. Additional Utilities (concat, slice, size)\n", .{});
    std.debug.print("   Purpose: Common byte array operations\n\n", .{});

    const bytes1 = [_]u8{ 0x12, 0x34 };
    const bytes2 = [_]u8{ 0xab, 0xcd };
    const bytes3 = [_]u8{ 0xef, 0x01 };

    // Concatenation
    const arrays = [_][]const u8{ &bytes1, &bytes2, &bytes3 };
    const concatenated = try Hex.concat(allocator, &arrays);
    defer allocator.free(concatenated);

    std.debug.print("   Array 1: [0x12, 0x34]\n", .{});
    std.debug.print("   Array 2: [0xab, 0xcd]\n", .{});
    std.debug.print("   Array 3: [0xef, 0x01]\n", .{});
    std.debug.print("   Concatenated: [", .{});
    for (concatenated, 0..) |byte, i| {
        if (i > 0) std.debug.print(", ", .{});
        std.debug.print("0x{x:0>2}", .{byte});
    }
    std.debug.print("]\n\n", .{});

    // Slicing
    const data = [_]u8{ 0x00, 0x11, 0x22, 0x33, 0x44, 0x55 };
    const sliced = Hex.slice(&data, 2, 5);

    std.debug.print("   Original: [0x00, 0x11, 0x22, 0x33, 0x44, 0x55]\n", .{});
    std.debug.print("   Slice [2..5]: [", .{});
    for (sliced, 0..) |byte, i| {
        if (i > 0) std.debug.print(", ", .{});
        std.debug.print("0x{x:0>2}", .{byte});
    }
    std.debug.print("]\n\n", .{});

    // Size
    const size_result = Hex.size(&data);
    std.debug.print("   Size of array: {} bytes\n\n", .{size_result});
}
