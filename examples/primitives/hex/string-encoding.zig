//! String Encoding Example
//!
//! Demonstrates:
//! - UTF-8 string encoding to hex
//! - Hex decoding to UTF-8 strings
//! - Round-trip conversions
//! - Common string encoding patterns
//!
//! Run with: zig build run-example -- primitives/hex/string-encoding.zig

const std = @import("std");
const primitives = @import("primitives");
const Hex = primitives.Hex;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("\n=== String Encoding ===\n\n", .{});

    try basicEncoding(allocator);
    try multiWordStrings(allocator);
    try smartContractStrings(allocator);
    try functionSignatures(allocator);
    try abiEncoding(allocator);

    std.debug.print("\n=== Example completed ===\n\n", .{});
}

fn basicEncoding(allocator: std.mem.Allocator) !void {
    std.debug.print("1. Basic string encoding:\n", .{});

    const text = "hello";

    // Encode to hex
    const hex = try Hex.stringToHex(allocator, text);
    defer allocator.free(hex);

    std.debug.print("  \"{s}\" → {s}\n", .{ text, hex });

    // Decode back
    const decoded = try Hex.hexToString(allocator, hex);
    defer allocator.free(decoded);

    std.debug.print("  {s} → \"{s}\"\n", .{ hex, decoded });
    std.debug.print("  Round-trip match: {}\n", .{std.mem.eql(u8, text, decoded)});

    // Empty string
    const empty = "";
    const hex_empty = try Hex.stringToHex(allocator, empty);
    defer allocator.free(hex_empty);

    std.debug.print("  Empty string → {s}\n", .{hex_empty});

    std.debug.print("\n", .{});
}

fn multiWordStrings(allocator: std.mem.Allocator) !void {
    std.debug.print("2. Multi-word strings:\n", .{});

    const text = "Hello, Ethereum!";

    const hex = try Hex.stringToHex(allocator, text);
    defer allocator.free(hex);

    const hex_bytes = try Hex.hexToBytes(allocator, hex);
    defer allocator.free(hex_bytes);

    std.debug.print("  \"{s}\"\n", .{text});
    std.debug.print("  Encoded: {s}\n", .{hex});
    std.debug.print("  Size: {} bytes\n", .{hex_bytes.len});

    // Decode
    const decoded = try Hex.hexToString(allocator, hex);
    defer allocator.free(decoded);

    std.debug.print("  Decoded: \"{s}\"\n", .{decoded});

    std.debug.print("\n", .{});
}

fn smartContractStrings(allocator: std.mem.Allocator) !void {
    std.debug.print("3. Smart contract strings:\n", .{});

    // Token name
    const token_name = "MyToken";
    const name_hex = try Hex.stringToHex(allocator, token_name);
    defer allocator.free(name_hex);

    std.debug.print("  Token name: \"{s}\"\n", .{token_name});
    std.debug.print("  Encoded: {s}\n", .{name_hex});

    // Token symbol
    const symbol = "MTK";
    const symbol_hex = try Hex.stringToHex(allocator, symbol);
    defer allocator.free(symbol_hex);

    std.debug.print("  Symbol: \"{s}\"\n", .{symbol});
    std.debug.print("  Encoded: {s}\n", .{symbol_hex});

    // URI
    const uri = "https://example.com/metadata/1";
    const uri_hex = try Hex.stringToHex(allocator, uri);
    defer allocator.free(uri_hex);

    const uri_bytes = try Hex.hexToBytes(allocator, uri_hex);
    defer allocator.free(uri_bytes);

    std.debug.print("  URI: \"{s}\"\n", .{uri});
    std.debug.print("  Encoded: {s}\n", .{uri_hex});
    std.debug.print("  Size: {} bytes\n", .{uri_bytes.len});

    std.debug.print("\n", .{});
}

fn functionSignatures(allocator: std.mem.Allocator) !void {
    std.debug.print("4. Function signatures:\n", .{});

    const signatures = [_][]const u8{
        "transfer(address,uint256)",
        "approve(address,uint256)",
        "balanceOf(address)",
        "totalSupply()",
    };

    for (signatures) |sig| {
        const hex = try Hex.stringToHex(allocator, sig);
        defer allocator.free(hex);

        const bytes = try Hex.hexToBytes(allocator, hex);
        defer allocator.free(bytes);

        std.debug.print("  \"{s}\"\n", .{sig});
        std.debug.print("    Hex: {s}\n", .{hex});
        std.debug.print("    Size: {} bytes\n", .{bytes.len});
    }

    std.debug.print("\n", .{});
}

fn abiEncoding(allocator: std.mem.Allocator) !void {
    std.debug.print("5. Padding strings for ABI encoding:\n", .{});

    const message = "Hello";

    // Encode message to hex
    const message_hex_str = try Hex.stringToHex(allocator, message);
    defer allocator.free(message_hex_str);

    const message_bytes = try Hex.hexToBytes(allocator, message_hex_str);
    defer allocator.free(message_bytes);

    std.debug.print("  Message: \"{s}\"\n", .{message});
    std.debug.print("  Encoded: {s}\n", .{message_hex_str});

    // String ABI encoding: offset + length + data (right-padded)
    const offset: u256 = 32;
    const offset_hex = try Hex.u256ToHex(allocator, offset);
    defer allocator.free(offset_hex);
    const offset_bytes = try Hex.hexToBytes(allocator, offset_hex);
    defer allocator.free(offset_bytes);
    const offset_padded = try Hex.padLeft(allocator, offset_bytes, 32);
    defer allocator.free(offset_padded);

    const length: u256 = message.len;
    const length_hex = try Hex.u256ToHex(allocator, length);
    defer allocator.free(length_hex);
    const length_bytes = try Hex.hexToBytes(allocator, length_hex);
    defer allocator.free(length_bytes);
    const length_padded = try Hex.padLeft(allocator, length_bytes, 32);
    defer allocator.free(length_padded);

    const padded_data = try Hex.padRight(allocator, message_bytes, 32);
    defer allocator.free(padded_data);

    // Concatenate all parts
    const parts = [_][]const u8{ offset_padded, length_padded, padded_data };
    const encoded = try Hex.concat(allocator, &parts);
    defer allocator.free(encoded);

    const encoded_hex = try Hex.bytesToHex(allocator, encoded);
    defer allocator.free(encoded_hex);

    std.debug.print("  Offset: 32\n", .{});
    std.debug.print("  Length: {}\n", .{length});
    std.debug.print("  Data size: {} bytes\n", .{padded_data.len});
    std.debug.print("  Full encoding size: {} bytes\n", .{encoded.len});

    // Decode
    const decoded_length_slice = Hex.slice(encoded, 32, 64);
    // Convert to u256 (simplified - just check length)
    std.debug.print("  Decoded length section size: {} bytes\n", .{decoded_length_slice.len});

    const encoded_data = Hex.slice(encoded, 64, 96);
    const trimmed_data = Hex.slice(encoded_data, 0, @intCast(message.len));

    const trimmed_hex = try Hex.bytesToHex(allocator, trimmed_data);
    defer allocator.free(trimmed_hex);

    const decoded_message = try Hex.hexToString(allocator, trimmed_hex);
    defer allocator.free(decoded_message);

    std.debug.print("  Decoded message: \"{s}\"\n", .{decoded_message});
    std.debug.print("  Match: {}\n", .{std.mem.eql(u8, message, decoded_message)});

    std.debug.print("\n", .{});
}
