const std = @import("std");
const crypto = @import("crypto");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("=== Basic Blake2 Usage ===\n\n", .{});

    // 1. Hash with default 64-byte output
    std.debug.print("1. Default 64-Byte Output\n", .{});
    std.debug.print("-" ** 40 ++ "\n", .{});

    const data = [_]u8{ 1, 2, 3, 4, 5 };
    const hash64 = try crypto.Blake2.hash(&data, 64, allocator);
    defer allocator.free(hash64);

    std.debug.print("Input:  [{d}, {d}, {d}, {d}, {d}]\n", .{ data[0], data[1], data[2], data[3], data[4] });
    std.debug.print("Output: 0x", .{});
    for (hash64) |byte| {
        std.debug.print("{x:0>2}", .{byte});
    }
    std.debug.print("\nLength: {d} bytes (default)\n\n", .{hash64.len});

    // 2. Hash with custom 32-byte output (BLAKE2b-256)
    std.debug.print("2. Custom 32-Byte Output (SHA-256 equivalent)\n", .{});
    std.debug.print("-" ** 40 ++ "\n", .{});

    const hash32 = try crypto.Blake2.hash(&data, 32, allocator);
    defer allocator.free(hash32);

    std.debug.print("Input:  [{d}, {d}, {d}, {d}, {d}]\n", .{ data[0], data[1], data[2], data[3], data[4] });
    std.debug.print("Output: 0x", .{});
    for (hash32) |byte| {
        std.debug.print("{x:0>2}", .{byte});
    }
    std.debug.print("\nLength: {d} bytes\n\n", .{hash32.len});

    // 3. Hash UTF-8 string
    std.debug.print("3. Hash UTF-8 String\n", .{});
    std.debug.print("-" ** 40 ++ "\n", .{});

    const message = "hello";
    const message_hash = try crypto.Blake2.hash(message, 64, allocator);
    defer allocator.free(message_hash);

    std.debug.print("Input:  \"{s}\"\n", .{message});
    std.debug.print("Output: 0x", .{});
    for (message_hash) |byte| {
        std.debug.print("{x:0>2}", .{byte});
    }
    std.debug.print("\nLength: {d} bytes\n\n", .{message_hash.len});

    // 4. Variable output lengths
    std.debug.print("4. Variable Output Lengths (1-64 bytes)\n", .{});
    std.debug.print("-" ** 40 ++ "\n", .{});

    const input = "test";
    const hash1 = try crypto.Blake2.hash(input, 1, allocator);
    defer allocator.free(hash1);
    const hash20 = try crypto.Blake2.hash(input, 20, allocator);
    defer allocator.free(hash20);
    const hash48 = try crypto.Blake2.hash(input, 48, allocator);
    defer allocator.free(hash48);

    std.debug.print("Input: \"{s}\"\n\n", .{input});

    std.debug.print("1-byte:  0x", .{});
    for (hash1) |byte| {
        std.debug.print("{x:0>2}", .{byte});
    }
    std.debug.print("\n20-byte: 0x", .{});
    for (hash20) |byte| {
        std.debug.print("{x:0>2}", .{byte});
    }

    const hash32_var = try crypto.Blake2.hash(input, 32, allocator);
    defer allocator.free(hash32_var);
    std.debug.print("\n32-byte: 0x", .{});
    for (hash32_var) |byte| {
        std.debug.print("{x:0>2}", .{byte});
    }

    std.debug.print("\n48-byte: 0x", .{});
    for (hash48) |byte| {
        std.debug.print("{x:0>2}", .{byte});
    }

    const hash64_var = try crypto.Blake2.hash(input, 64, allocator);
    defer allocator.free(hash64_var);
    std.debug.print("\n64-byte: 0x", .{});
    for (hash64_var) |byte| {
        std.debug.print("{x:0>2}", .{byte});
    }
    std.debug.print("\n\n", .{});

    std.debug.print("Note: Each length produces a completely different hash\n", .{});
    std.debug.print("(NOT just truncation of longer output)\n\n", .{});

    // 5. Empty input
    std.debug.print("5. Empty Input Hash\n", .{});
    std.debug.print("-" ** 40 ++ "\n", .{});

    const empty_hash = try crypto.Blake2.hash("", 64, allocator);
    defer allocator.free(empty_hash);

    std.debug.print("Input:  \"\" (empty string)\n", .{});
    std.debug.print("Output: 0x", .{});
    for (empty_hash) |byte| {
        std.debug.print("{x:0>2}", .{byte});
    }
    std.debug.print("\n", .{});

    // RFC 7693 test vector
    const expected = [_]u8{
        0x78, 0x6a, 0x02, 0xf7, 0x42, 0x01, 0x59, 0x03,
        0xc6, 0xc6, 0xfd, 0x85, 0x25, 0x52, 0xd2, 0x72,
        0x91, 0x2f, 0x47, 0x40, 0xe1, 0x58, 0x47, 0x61,
        0x8a, 0x86, 0xe2, 0x17, 0xf7, 0x1f, 0x54, 0x19,
        0xd2, 0x5e, 0x10, 0x31, 0xaf, 0xee, 0x58, 0x53,
        0x13, 0x89, 0x64, 0x44, 0x93, 0x4e, 0xb0, 0x4b,
        0x90, 0x3a, 0x68, 0x5b, 0x14, 0x48, 0xb7, 0x55,
        0xd5, 0x6f, 0x70, 0x1a, 0xfe, 0x9b, 0xe2, 0xce,
    };

    const matches = std.mem.eql(u8, empty_hash, &expected);
    std.debug.print("Matches RFC 7693: {}\n\n", .{matches});

    // 6. Determinism
    std.debug.print("6. Deterministic Hashing\n", .{});
    std.debug.print("-" ** 40 ++ "\n", .{});

    const test_input = "Blake2 is fast";
    const test_hash1 = try crypto.Blake2.hash(test_input, 32, allocator);
    defer allocator.free(test_hash1);
    const test_hash2 = try crypto.Blake2.hash(test_input, 32, allocator);
    defer allocator.free(test_hash2);
    const test_hash3 = try crypto.Blake2.hash(test_input, 32, allocator);
    defer allocator.free(test_hash3);

    std.debug.print("Input: \"{s}\"\n", .{test_input});
    std.debug.print("Hash 1: 0x", .{});
    for (test_hash1) |byte| std.debug.print("{x:0>2}", .{byte});
    std.debug.print("\nHash 2: 0x", .{});
    for (test_hash2) |byte| std.debug.print("{x:0>2}", .{byte});
    std.debug.print("\nHash 3: 0x", .{});
    for (test_hash3) |byte| std.debug.print("{x:0>2}", .{byte});

    const all_equal = std.mem.eql(u8, test_hash1, test_hash2) and std.mem.eql(u8, test_hash2, test_hash3);
    std.debug.print("\nAll equal: {}\n\n", .{all_equal});

    // 7. Flexible output sizes
    std.debug.print("7. Flexible Output Sizes for Different Use Cases\n", .{});
    std.debug.print("-" ** 40 ++ "\n", .{});

    const sample_data = [_]u8{0xAB} ** 100;

    const checksum = try crypto.Blake2.hash(&sample_data, 16, allocator);
    defer allocator.free(checksum);
    const address_hash = try crypto.Blake2.hash(&sample_data, 20, allocator);
    defer allocator.free(address_hash);
    const standard_hash = try crypto.Blake2.hash(&sample_data, 32, allocator);
    defer allocator.free(standard_hash);
    const max_hash = try crypto.Blake2.hash(&sample_data, 64, allocator);
    defer allocator.free(max_hash);

    std.debug.print("Input: 100 bytes of 0xAB\n\n", .{});
    std.debug.print("16-byte checksum:       0x", .{});
    for (checksum) |byte| std.debug.print("{x:0>2}", .{byte});
    std.debug.print("\n20-byte address hash:   0x", .{});
    for (address_hash) |byte| std.debug.print("{x:0>2}", .{byte});
    std.debug.print("\n32-byte standard hash:  0x", .{});
    for (standard_hash) |byte| std.debug.print("{x:0>2}", .{byte});
    std.debug.print("\n64-byte maximum hash:   0x", .{});
    for (max_hash[0..32]) |byte| std.debug.print("{x:0>2}", .{byte}); // First half only
    std.debug.print("...\n\n", .{});

    std.debug.print("=== Complete ===\n", .{});
}
