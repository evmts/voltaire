const std = @import("std");
const precompiles = @import("precompiles");

/// Blake2f Precompile (0x09) - Basic Usage
///
/// Address: 0x0000000000000000000000000000000000000009
/// Introduced: Istanbul (EIP-152)
///
/// Blake2f is the compression function of Blake2b hash algorithm.
/// It processes 128-byte blocks with configurable rounds.
///
/// Gas Cost: 1 gas per round (e.g., 12 rounds = 12 gas)
///
/// Input: Exactly 213 bytes
///   - Bytes 0-3:    rounds (big-endian u32)
///   - Bytes 4-67:   h (state vector, 8x u64 little-endian)
///   - Bytes 68-195: m (message block, 16x u64 little-endian)
///   - Bytes 196-211: t (offset counters, 2x u64 little-endian)
///   - Byte 212:     f (final block flag, 0x00 or 0x01)
///
/// Output: 64 bytes (new state vector)
pub fn main() !void {
    const stdout = std.io.getStdOut().writer();

    try stdout.print("=== Blake2f Precompile Basic Usage ===\n\n", .{});

    // Blake2b IV (initialization vector) for Blake2b-512
    const BLAKE2B_IV = [8]u64{
        0x6a09e667f3bcc908, // sqrt(2)
        0xbb67ae8584caa73b, // sqrt(3)
        0x3c6ef372fe94f82b, // sqrt(5)
        0xa54ff53a5f1d36f1, // sqrt(7)
        0x510e527fade682d1, // sqrt(11)
        0x9b05688c2b3e6c1f, // sqrt(13)
        0x1f83d9abfb41bd6b, // sqrt(17)
        0x5be0cd19137e2179, // sqrt(19)
    };

    // Example 1: Standard Blake2f compression (12 rounds)
    try stdout.print("1. Standard Blake2f Compression (12 rounds)\n", .{});
    try stdout.print("{s}\n", .{"-" ** 50});

    var input1: [213]u8 = [_]u8{0} ** 213;

    // Set rounds: 12 (big-endian)
    std.mem.writeInt(u32, input1[0..4], 12, .big);

    // Set state h: Blake2b IV XOR parameter block
    const param_block: u64 = 0x01010040; // digest_length=64, fanout=1, depth=1
    for (BLAKE2B_IV, 0..) |iv, i| {
        const value = if (i == 0) iv ^ param_block else iv;
        std.mem.writeInt(u64, input1[4 + i * 8 ..][0..8], value, .little);
    }

    // Message m: all zeros (already initialized)
    // Offset counters t: [0, 0] (already initialized)
    // Final flag f: 0x01
    input1[212] = 0x01;

    try stdout.print("Input configuration:\n", .{});
    try stdout.print("  Rounds: 12\n", .{});
    try stdout.print("  State h: Blake2b-512 IV (XOR parameter block)\n", .{});
    try stdout.print("  Message: empty (all zeros)\n", .{});
    try stdout.print("  Offset: 0 bytes processed\n", .{});
    try stdout.print("  Final: true\n\n", .{});

    var output1: [64]u8 = undefined;
    const gas1 = try precompiles.blake2f(&input1, &output1);

    try stdout.print("✓ Success\n", .{});
    try stdout.print("  Gas used: {d}\n", .{gas1});
    try stdout.print("  Output: {d} bytes (new state)\n", .{output1.len});

    const hash_prefix = output1[0..16];
    try stdout.print("  Hash prefix: 0x", .{});
    for (hash_prefix) |b| {
        try stdout.print("{x:0>2}", .{b});
    }
    try stdout.print("\n\n", .{});

    // Example 2: Hash message "abc"
    try stdout.print("2. Hash Message \"abc\"\n", .{});
    try stdout.print("{s}\n", .{"-" ** 50});

    var input2: [213]u8 = [_]u8{0} ** 213;

    // Set rounds: 12
    std.mem.writeInt(u32, input2[0..4], 12, .big);

    // Set state h: same IV
    for (BLAKE2B_IV, 0..) |iv, i| {
        const value = if (i == 0) iv ^ param_block else iv;
        std.mem.writeInt(u64, input2[4 + i * 8 ..][0..8], value, .little);
    }

    // Set message m: "abc"
    input2[68] = 'a';
    input2[69] = 'b';
    input2[70] = 'c';

    // Set offset counter t: [3, 0] (3 bytes processed)
    std.mem.writeInt(u64, input2[196..204], 3, .little);
    std.mem.writeInt(u64, input2[204..212], 0, .little);

    // Set final flag f: 0x01
    input2[212] = 0x01;

    try stdout.print("Input configuration:\n", .{});
    try stdout.print("  Rounds: 12\n", .{});
    try stdout.print("  Message: \"abc\" (3 bytes)\n", .{});
    try stdout.print("  Offset: 3 bytes processed\n", .{});
    try stdout.print("  Final: true\n\n", .{});

    var output2: [64]u8 = undefined;
    const gas2 = try precompiles.blake2f(&input2, &output2);

    try stdout.print("✓ Success\n", .{});
    try stdout.print("  Gas used: {d}\n", .{gas2});
    try stdout.print("  Blake2b(\"abc\"): 0x", .{});
    for (output2) |b| {
        try stdout.print("{x:0>2}", .{b});
    }
    try stdout.print("\n\n", .{});

    // Example 3: Variable rounds (gas cost demonstration)
    try stdout.print("3. Variable Rounds (Gas Cost)\n", .{});
    try stdout.print("{s}\n", .{"-" ** 50});

    const round_tests = [_]u32{ 1, 12, 100, 1000 };
    for (round_tests) |rounds| {
        var input: [213]u8 = [_]u8{0} ** 213;
        std.mem.writeInt(u32, input[0..4], rounds, .big);

        for (BLAKE2B_IV, 0..) |iv, i| {
            const value = if (i == 0) iv ^ param_block else iv;
            std.mem.writeInt(u64, input[4 + i * 8 ..][0..8], value, .little);
        }
        input[212] = 0x01;

        var output: [64]u8 = undefined;
        const gas = try precompiles.blake2f(&input, &output);

        try stdout.print("  {d:>4} rounds → {d} gas\n", .{ rounds, gas });
    }

    try stdout.print("\n", .{});

    // Example 4: Error cases
    try stdout.print("4. Error Cases\n", .{});
    try stdout.print("{s}\n", .{"-" ** 50});

    // Wrong input length
    var wrong_length: [212]u8 = [_]u8{0} ** 212;
    var output4: [64]u8 = undefined;
    const result4a = precompiles.blake2f(&wrong_length, &output4);
    try stdout.print("Wrong input length (212): ", .{});
    if (result4a) |_| {
        try stdout.print("unexpected success\n", .{});
    } else |_| {
        try stdout.print("✓ failed as expected\n", .{});
    }

    // Invalid final flag
    var input4c: [213]u8 = [_]u8{0} ** 213;
    std.mem.writeInt(u32, input4c[0..4], 12, .big);
    input4c[212] = 0x02; // Invalid
    const result4c = precompiles.blake2f(&input4c, &output4);
    try stdout.print("Invalid final flag (0x02): ", .{});
    if (result4c) |_| {
        try stdout.print("unexpected success\n", .{});
    } else |_| {
        try stdout.print("✓ failed as expected\n", .{});
    }

    try stdout.print("\n", .{});

    // Example 5: Byte order demonstration
    try stdout.print("5. Byte Order (Little-Endian)\n", .{});
    try stdout.print("{s}\n", .{"-" ** 50});
    try stdout.print("Blake2f uses little-endian for h, m, t (unlike most EVM)\n", .{});
    try stdout.print("Only the rounds field is big-endian.\n\n", .{});

    const test_value: u64 = 0x0102030405060708;
    var le_bytes: [8]u8 = undefined;
    std.mem.writeInt(u64, &le_bytes, test_value, .little);

    try stdout.print("Value: 0x{x}\n", .{test_value});
    try stdout.print("Little-endian bytes: ", .{});
    for (le_bytes) |b| {
        try stdout.print("0x{x:0>2} ", .{b});
    }
    try stdout.print("\n", .{});
    try stdout.print("Expected: 0x08 0x07 0x06 0x05 0x04 0x03 0x02 0x01\n\n", .{});

    try stdout.print("=== Complete ===\n\n", .{});
    try stdout.print("Key Points:\n", .{});
    try stdout.print("- Blake2f is extremely gas-efficient: ~0.09 gas/byte\n", .{});
    try stdout.print("- 12 rounds is standard Blake2b compression\n", .{});
    try stdout.print("- Input must be exactly 213 bytes\n", .{});
    try stdout.print("- Most fields are little-endian (except rounds)\n", .{});
    try stdout.print("- Used for Zcash bridges and efficient hashing\n", .{});
}
