const std = @import("std");
const crypto = @import("crypto");

/// Basic Keccak256 Usage
///
/// Demonstrates fundamental hashing operations:
/// - Hash raw bytes
/// - Hash UTF-8 strings
/// - Compare hashes
/// - Verify determinism and avalanche effect
pub fn main() !void {
    const stdout = std.io.getStdOut().writer();

    try stdout.print("=== Basic Keccak256 Usage ===\n\n", .{});

    // 1. Hash raw bytes
    try stdout.print("1. Hash Raw Bytes\n", .{});
    try stdout.print("{s}\n", .{"-" ** 40});

    const data = [_]u8{ 1, 2, 3, 4, 5 };
    var hash: [32]u8 = undefined;
    try crypto.keccak_asm.keccak256(&data, &hash);

    try stdout.print("Input:  [{d}, {d}, {d}, {d}, {d}]\n", .{ data[0], data[1], data[2], data[3], data[4] });
    try stdout.print("Output: ", .{});
    for (hash) |byte| {
        try stdout.print("{x:0>2}", .{byte});
    }
    try stdout.print("\nLength: {d} bytes\n\n", .{hash.len});

    // 2. Hash UTF-8 string
    try stdout.print("2. Hash UTF-8 String\n", .{});
    try stdout.print("{s}\n", .{"-" ** 40});

    const message = "hello";
    var message_hash: [32]u8 = undefined;
    try crypto.keccak_asm.keccak256(message, &message_hash);

    try stdout.print("Input:  \"{s}\"\n", .{message});
    try stdout.print("Output: 0x", .{});
    for (message_hash) |byte| {
        try stdout.print("{x:0>2}", .{byte});
    }

    // Verify against known test vector
    const expected_hello = [_]u8{
        0x1c, 0x8a, 0xff, 0x95, 0x06, 0x85, 0xc2, 0xed,
        0x4b, 0xc3, 0x17, 0x4f, 0x34, 0x72, 0x28, 0x7b,
        0x56, 0xd9, 0x51, 0x7b, 0x9c, 0x94, 0x81, 0x27,
        0x31, 0x9a, 0x09, 0xa7, 0xa3, 0x6d, 0xea, 0xc8,
    };
    const is_correct = std.mem.eql(u8, &message_hash, &expected_hello);
    try stdout.print("\nMatches expected: {}\n\n", .{is_correct});

    // 3. Hash hex-encoded data (manual decode)
    try stdout.print("3. Hash Hex-Encoded Data\n", .{});
    try stdout.print("{s}\n", .{"-" ** 40});

    const hex_bytes = [_]u8{ 0xde, 0xad, 0xbe, 0xef };
    var hex_hash: [32]u8 = undefined;
    try crypto.keccak_asm.keccak256(&hex_bytes, &hex_hash);

    try stdout.print("Input:  0xdeadbeef\n", .{});
    try stdout.print("Output: 0x", .{});
    for (hex_hash) |byte| {
        try stdout.print("{x:0>2}", .{byte});
    }
    try stdout.print("\n\n", .{});

    // 4. Empty input (produces known constant)
    try stdout.print("4. Empty Input Hash\n", .{});
    try stdout.print("{s}\n", .{"-" ** 40});

    const empty: []const u8 = &.{};
    var empty_hash: [32]u8 = undefined;
    try crypto.keccak_asm.keccak256(empty, &empty_hash);

    try stdout.print("Input:  \"\" (empty string)\n", .{});
    try stdout.print("Output: 0x", .{});
    for (empty_hash) |byte| {
        try stdout.print("{x:0>2}", .{byte});
    }

    // This is the EMPTY_KECCAK256 constant
    const expected_empty = [_]u8{
        0xc5, 0xd2, 0x46, 0x01, 0x86, 0xf7, 0x23, 0x3c,
        0x92, 0x7e, 0x7d, 0xb2, 0xdc, 0xc7, 0x03, 0xc0,
        0xe5, 0x00, 0xb6, 0x53, 0xca, 0x82, 0x27, 0x3b,
        0x7b, 0xfa, 0xd8, 0x04, 0x5d, 0x85, 0xa4, 0x70,
    };
    const is_empty_correct = std.mem.eql(u8, &empty_hash, &expected_empty);
    try stdout.print("\nThis is EMPTY_KECCAK256: {}\n\n", .{is_empty_correct});

    // 5. Determinism - same input always produces same output
    try stdout.print("5. Deterministic Hashing\n", .{});
    try stdout.print("{s}\n", .{"-" ** 40});

    const input = "test";
    var hash1: [32]u8 = undefined;
    var hash2: [32]u8 = undefined;
    var hash3: [32]u8 = undefined;

    try crypto.keccak_asm.keccak256(input, &hash1);
    try crypto.keccak_asm.keccak256(input, &hash2);
    try crypto.keccak_asm.keccak256(input, &hash3);

    try stdout.print("Input: \"{s}\"\n", .{input});
    try stdout.print("Hash 1: 0x", .{});
    for (hash1) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("\nHash 2: 0x", .{});
    for (hash2) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("\nHash 3: 0x", .{});
    for (hash3) |byte| try stdout.print("{x:0>2}", .{byte});

    const all_equal = std.mem.eql(u8, &hash1, &hash2) and std.mem.eql(u8, &hash2, &hash3);
    try stdout.print("\nAll equal: {}\n\n", .{all_equal});

    // 6. Avalanche effect - small input change causes large output change
    try stdout.print("6. Avalanche Effect\n", .{});
    try stdout.print("{s}\n", .{"-" ** 40});

    const original = "The quick brown fox jumps over the lazy dog";
    const modified = "The quick brown fox jumps over the lazy doh"; // Changed last letter

    var original_hash: [32]u8 = undefined;
    var modified_hash: [32]u8 = undefined;

    try crypto.keccak_asm.keccak256(original, &original_hash);
    try crypto.keccak_asm.keccak256(modified, &modified_hash);

    try stdout.print("Original: \"{s}\"\n", .{original});
    try stdout.print("Hash:     0x", .{});
    for (original_hash) |byte| try stdout.print("{x:0>2}", .{byte});

    try stdout.print("\n\nModified: \"{s}\"\n", .{modified});
    try stdout.print("Hash:     0x", .{});
    for (modified_hash) |byte| try stdout.print("{x:0>2}", .{byte});

    // Count differing bits
    var different_bits: u32 = 0;
    for (original_hash, modified_hash) |b1, b2| {
        different_bits += @popCount(b1 ^ b2);
    }

    const percent = @as(f64, @floatFromInt(different_bits)) / 256.0 * 100.0;
    try stdout.print("\n\nDifferent bits: {d}/256 ({d:.1}%)\n", .{ different_bits, percent });
    try stdout.print("Small input change causes ~50% of output bits to flip\n\n", .{});

    try stdout.print("=== Complete ===\n", .{});
}
