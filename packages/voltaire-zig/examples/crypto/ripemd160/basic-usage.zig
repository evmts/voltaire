const std = @import("std");
const crypto = @import("crypto");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("=== Basic RIPEMD160 Usage ===\n\n", .{});

    // 1. Hash raw bytes
    std.debug.print("1. Hash Raw Bytes\n", .{});
    std.debug.print("-" ** 40 ++ "\n", .{});

    const data = [_]u8{ 1, 2, 3, 4, 5 };
    const hash = try crypto.Ripemd160.hash(&data, allocator);
    defer allocator.free(hash);

    std.debug.print("Input:  [{d}, {d}, {d}, {d}, {d}]\n", .{ data[0], data[1], data[2], data[3], data[4] });
    std.debug.print("Output: 0x", .{});
    for (hash) |byte| {
        std.debug.print("{x:0>2}", .{byte});
    }
    std.debug.print("\nLength: {d} bytes (always 20 bytes)\n\n", .{hash.len});

    // 2. Hash UTF-8 string
    std.debug.print("2. Hash UTF-8 String\n", .{});
    std.debug.print("-" ** 40 ++ "\n", .{});

    const message = "hello";
    const message_hash = try crypto.Ripemd160.hash(message, allocator);
    defer allocator.free(message_hash);

    std.debug.print("Input:  \"{s}\"\n", .{message});
    std.debug.print("Output: 0x", .{});
    for (message_hash) |byte| {
        std.debug.print("{x:0>2}", .{byte});
    }
    std.debug.print("\n\n", .{});

    // 3. Empty string hash
    std.debug.print("3. Empty String Hash\n", .{});
    std.debug.print("-" ** 40 ++ "\n", .{});

    const empty_hash = try crypto.Ripemd160.hash("", allocator);
    defer allocator.free(empty_hash);

    std.debug.print("Input:  \"\" (empty string)\n", .{});
    std.debug.print("Output: 0x", .{});
    for (empty_hash) |byte| {
        std.debug.print("{x:0>2}", .{byte});
    }
    std.debug.print("\n", .{});

    // Verify against official test vector
    const expected_empty = [_]u8{
        0x9c, 0x11, 0x85, 0xa5, 0xc5, 0xe9, 0xfc, 0x54,
        0x61, 0x28, 0x08, 0x97, 0x7e, 0xe8, 0xf5, 0x48,
        0xb2, 0x25, 0x8d, 0x31,
    };
    const is_correct = std.mem.eql(u8, empty_hash, &expected_empty);
    std.debug.print("Matches official test vector: {}\n\n", .{is_correct});

    // 4. Official test vectors
    std.debug.print("4. Official Test Vectors\n", .{});
    std.debug.print("-" ** 40 ++ "\n", .{});

    const test_a = try crypto.Ripemd160.hash("a", allocator);
    defer allocator.free(test_a);
    const expected_a = [_]u8{
        0x0b, 0xdc, 0x9d, 0x2d, 0x25, 0x6b, 0x3e, 0xe9,
        0xda, 0xae, 0x34, 0x7b, 0xe6, 0xf4, 0xdc, 0x83,
        0x5a, 0x46, 0x7f, 0xfe,
    };
    std.debug.print("Input: \"a\"\n", .{});
    std.debug.print("Hash:  0x", .{});
    for (test_a) |byte| std.debug.print("{x:0>2}", .{byte});
    std.debug.print("\nMatch: {}\n\n", .{std.mem.eql(u8, test_a, &expected_a)});

    const test_abc = try crypto.Ripemd160.hash("abc", allocator);
    defer allocator.free(test_abc);
    const expected_abc = [_]u8{
        0x8e, 0xb2, 0x08, 0xf7, 0xe0, 0x5d, 0x98, 0x7a,
        0x9b, 0x04, 0x4a, 0x8e, 0x98, 0xc6, 0xb0, 0x87,
        0xf1, 0x5a, 0x0b, 0xfc,
    };
    std.debug.print("Input: \"abc\"\n", .{});
    std.debug.print("Hash:  0x", .{});
    for (test_abc) |byte| std.debug.print("{x:0>2}", .{byte});
    std.debug.print("\nMatch: {}\n\n", .{std.mem.eql(u8, test_abc, &expected_abc)});

    const test_msg = try crypto.Ripemd160.hash("message digest", allocator);
    defer allocator.free(test_msg);
    const expected_msg = [_]u8{
        0x5d, 0x06, 0x89, 0xef, 0x49, 0xd2, 0xfa, 0xe5,
        0x72, 0xb8, 0x81, 0xb1, 0x23, 0xa8, 0x5f, 0xfa,
        0x21, 0x59, 0x5f, 0x36,
    };
    std.debug.print("Input: \"message digest\"\n", .{});
    std.debug.print("Hash:  0x", .{});
    for (test_msg) |byte| std.debug.print("{x:0>2}", .{byte});
    std.debug.print("\nMatch: {}\n\n", .{std.mem.eql(u8, test_msg, &expected_msg)});

    // 5. Determinism
    std.debug.print("5. Deterministic Hashing\n", .{});
    std.debug.print("-" ** 40 ++ "\n", .{});

    const input = "Bitcoin uses RIPEMD160";
    const hash1 = try crypto.Ripemd160.hash(input, allocator);
    defer allocator.free(hash1);
    const hash2 = try crypto.Ripemd160.hash(input, allocator);
    defer allocator.free(hash2);
    const hash3 = try crypto.Ripemd160.hash(input, allocator);
    defer allocator.free(hash3);

    std.debug.print("Input: \"{s}\"\n", .{input});
    std.debug.print("Hash 1: 0x", .{});
    for (hash1) |byte| std.debug.print("{x:0>2}", .{byte});
    std.debug.print("\nHash 2: 0x", .{});
    for (hash2) |byte| std.debug.print("{x:0>2}", .{byte});
    std.debug.print("\nHash 3: 0x", .{});
    for (hash3) |byte| std.debug.print("{x:0>2}", .{byte});

    const all_equal = std.mem.eql(u8, hash1, hash2) and std.mem.eql(u8, hash2, hash3);
    std.debug.print("\nAll equal: {}\n\n", .{all_equal});

    // 6. Fixed 20-byte output
    std.debug.print("6. Fixed 20-Byte Output\n", .{});
    std.debug.print("-" ** 40 ++ "\n", .{});

    const short_input = "a";
    const long_input = "The quick brown fox jumps over the lazy dog";

    const short_hash = try crypto.Ripemd160.hash(short_input, allocator);
    defer allocator.free(short_hash);
    const long_hash = try crypto.Ripemd160.hash(long_input, allocator);
    defer allocator.free(long_hash);

    std.debug.print("Short input: \"{s}\"\n", .{short_input});
    std.debug.print("Hash:        0x", .{});
    for (short_hash) |byte| std.debug.print("{x:0>2}", .{byte});
    std.debug.print("\nLength:      {d} bytes\n", .{short_hash.len});

    std.debug.print("\nLong input:  \"{s}\"\n", .{long_input});
    std.debug.print("Hash:        0x", .{});
    for (long_hash) |byte| std.debug.print("{x:0>2}", .{byte});
    std.debug.print("\nLength:      {d} bytes\n", .{long_hash.len});

    std.debug.print("\nRIPEMD160 always produces 20-byte output (160 bits)\n\n", .{});

    // 7. Security level
    std.debug.print("7. Security Level\n", .{});
    std.debug.print("-" ** 40 ++ "\n", .{});
    std.debug.print("RIPEMD160 provides:\n", .{});
    std.debug.print("- 160-bit output size\n", .{});
    std.debug.print("- ~80-bit collision resistance (birthday bound)\n", .{});
    std.debug.print("- ~160-bit preimage resistance\n", .{});
    std.debug.print("\nThis is acceptable for Bitcoin addresses because:\n", .{});
    std.debug.print("- Combined with SHA-256 (double hashing)\n", .{});
    std.debug.print("- Address collisions require breaking both algorithms\n", .{});
    std.debug.print("- 20-byte addresses reduce blockchain storage\n\n", .{});

    // 8. Legacy status
    std.debug.print("8. Legacy Function (Bitcoin Context)\n", .{});
    std.debug.print("-" ** 40 ++ "\n", .{});
    std.debug.print("RIPEMD160 is considered legacy:\n", .{});
    std.debug.print("- Designed in 1996 (pre-SHA-256)\n", .{});
    std.debug.print("- Used in Bitcoin since 2009\n", .{});
    std.debug.print("- Maintained for Bitcoin compatibility\n", .{});
    std.debug.print("- Not recommended for new applications\n", .{});
    std.debug.print("\nFor new projects, prefer:\n", .{});
    std.debug.print("- SHA-256 (256-bit, widely supported)\n", .{});
    std.debug.print("- Blake2b (faster, variable output)\n", .{});
    std.debug.print("- Keccak-256 (Ethereum compatibility)\n\n", .{});

    std.debug.print("=== Complete ===\n", .{});
}
