const std = @import("std");
const crypto = @import("crypto");
const SHA256 = crypto.SHA256;

pub fn main() !void {
    std.debug.print("=== SHA256 Basic Usage ===\n\n", .{});

    // Example 1: Hash raw bytes
    std.debug.print("1. Hashing Raw Bytes\n", .{});
    std.debug.print("{s}\n", .{"-" ** 50});
    const data = [_]u8{ 1, 2, 3, 4, 5 };
    const hash1 = SHA256.hash(&data);
    std.debug.print("Input: {any}\n", .{data});
    std.debug.print("Hash (32 bytes): {any}...\n", .{hash1[0..8].*});
    std.debug.print("Hash (hex): 0x{s}\n\n", .{std.fmt.fmtSliceHexLower(&hash1)});

    // Example 2: Hash UTF-8 strings
    std.debug.print("2. Hashing Strings\n", .{});
    std.debug.print("{s}\n", .{"-" ** 50});
    const message = "hello world";
    const hash2 = SHA256.hash(message);
    std.debug.print("Input: {s}\n", .{message});
    std.debug.print("Hash: 0x{s}\n\n", .{std.fmt.fmtSliceHexLower(&hash2)});

    // Verify NIST test vector
    const abc = "abc";
    const abc_hash = SHA256.hash(abc);
    std.debug.print("NIST test vector \"abc\": 0x{s}\n", .{std.fmt.fmtSliceHexLower(&abc_hash)});
    std.debug.print("Expected: 0xba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad\n", .{});

    // Manual verification
    const expected_abc = [_]u8{
        0xba, 0x78, 0x16, 0xbf, 0x8f, 0x01, 0xcf, 0xea,
        0x41, 0x41, 0x40, 0xde, 0x5d, 0xae, 0x22, 0x23,
        0xb0, 0x03, 0x61, 0xa3, 0x96, 0x17, 0x7a, 0x9c,
        0xb4, 0x10, 0xff, 0x61, 0xf2, 0x00, 0x15, 0xad,
    };
    std.debug.print("Match: {}\n\n", .{std.mem.eql(u8, &abc_hash, &expected_abc)});

    // Example 3: Hash hex-encoded data
    std.debug.print("3. Hashing Hex Data\n", .{});
    std.debug.print("{s}\n", .{"-" ** 50});
    const hex_data = [_]u8{ 0xde, 0xad, 0xbe, 0xef };
    const hash3 = SHA256.hash(&hex_data);
    std.debug.print("Input (hex): 0xdeadbeef\n", .{});
    std.debug.print("Hash: 0x{s}\n\n", .{std.fmt.fmtSliceHexLower(&hash3)});

    // Example 4: Empty string (produces known constant)
    std.debug.print("4. Empty String Hash\n", .{});
    std.debug.print("{s}\n", .{"-" ** 50});
    const empty = "";
    const empty_hash = SHA256.hash(empty);
    std.debug.print("Empty string hash: 0x{s}\n", .{std.fmt.fmtSliceHexLower(&empty_hash)});
    std.debug.print("Expected: 0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855\n", .{});

    const expected_empty = [_]u8{
        0xe3, 0xb0, 0xc4, 0x42, 0x98, 0xfc, 0x1c, 0x14,
        0x9a, 0xfb, 0xf4, 0xc8, 0x99, 0x6f, 0xb9, 0x24,
        0x27, 0xae, 0x41, 0xe4, 0x64, 0x9b, 0x93, 0x4c,
        0xa4, 0x95, 0x99, 0x1b, 0x78, 0x52, 0xb8, 0x55,
    };
    std.debug.print("Match: {}\n\n", .{std.mem.eql(u8, &empty_hash, &expected_empty)});

    // Example 5: Unicode handling
    std.debug.print("5. Unicode Strings\n", .{});
    std.debug.print("{s}\n", .{"-" ** 50});
    const emoji = "🚀"; // UTF-8: F0 9F 9A 80
    const emoji_hash = SHA256.hash(emoji);
    std.debug.print("Emoji \"🚀\": 0x{s}\n", .{std.fmt.fmtSliceHexLower(&emoji_hash)});

    const chinese = "你好"; // UTF-8 encoded
    const chinese_hash = SHA256.hash(chinese);
    std.debug.print("Chinese \"你好\": 0x{s}\n\n", .{std.fmt.fmtSliceHexLower(&chinese_hash)});

    // Example 6: Determinism - same input always produces same hash
    std.debug.print("6. Deterministic Output\n", .{});
    std.debug.print("{s}\n", .{"-" ** 50});
    const input = [_]u8{ 42, 42, 42 };
    const hash_a = SHA256.hash(&input);
    const hash_b = SHA256.hash(&input);
    const hash_c = SHA256.hash(&input);
    std.debug.print("Input: {any}\n", .{input});
    std.debug.print("Hash 1: 0x{s}\n", .{std.fmt.fmtSliceHexLower(&hash_a)});
    std.debug.print("Hash 2: 0x{s}\n", .{std.fmt.fmtSliceHexLower(&hash_b)});
    std.debug.print("Hash 3: 0x{s}\n", .{std.fmt.fmtSliceHexLower(&hash_c)});
    const all_equal = std.mem.eql(u8, &hash_a, &hash_b) and std.mem.eql(u8, &hash_b, &hash_c);
    std.debug.print("All identical: {}\n\n", .{all_equal});

    // Example 7: Avalanche effect - small change = big difference
    std.debug.print("7. Avalanche Effect\n", .{});
    std.debug.print("{s}\n", .{"-" ** 50});
    const input1 = [_]u8{ 1, 2, 3, 4, 5 };
    const input2 = [_]u8{ 1, 2, 3, 4, 6 }; // Last byte different
    const hash_input1 = SHA256.hash(&input1);
    const hash_input2 = SHA256.hash(&input2);

    std.debug.print("Input 1: {any}\n", .{input1});
    std.debug.print("Hash 1:  0x{s}\n", .{std.fmt.fmtSliceHexLower(&hash_input1)});
    std.debug.print("Input 2: {any} (last byte different)\n", .{input2});
    std.debug.print("Hash 2:  0x{s}\n", .{std.fmt.fmtSliceHexLower(&hash_input2)});

    // Count differing bits
    var differing_bits: u32 = 0;
    for (hash_input1, hash_input2) |a, b| {
        const xor = a ^ b;
        differing_bits += @popCount(xor);
    }
    std.debug.print("Differing bits: {} / 256 (~50% expected)\n\n", .{differing_bits});

    std.debug.print("=== Basic Usage Complete ===\n", .{});
}
