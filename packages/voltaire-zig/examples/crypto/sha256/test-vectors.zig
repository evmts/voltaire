const std = @import("std");
const crypto = @import("crypto");
const SHA256 = crypto.SHA256;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("=== SHA256 NIST Test Vectors ===\n\n", .{});
    std.debug.print("Running NIST FIPS 180-4 test vectors...\n\n", .{});

    var passed: u32 = 0;
    var failed: u32 = 0;

    // Test 1: Empty string
    {
        std.debug.print("Test: Empty string\n", .{});
        std.debug.print("{s}\n", .{"-" ** 70});

        const input = "";
        const expected = [_]u8{
            0xe3, 0xb0, 0xc4, 0x42, 0x98, 0xfc, 0x1c, 0x14,
            0x9a, 0xfb, 0xf4, 0xc8, 0x99, 0x6f, 0xb9, 0x24,
            0x27, 0xae, 0x41, 0xe4, 0x64, 0x9b, 0x93, 0x4c,
            0xa4, 0x95, 0x99, 0x1b, 0x78, 0x52, 0xb8, 0x55,
        };

        const hash = SHA256.hash(input);
        const is_match = std.mem.eql(u8, &hash, &expected);

        std.debug.print("Input:    \"{s}\"\n", .{input});
        std.debug.print("Expected: 0x{s}\n", .{std.fmt.fmtSliceHexLower(&expected)});
        std.debug.print("Got:      0x{s}\n", .{std.fmt.fmtSliceHexLower(&hash)});
        std.debug.print("Status:   {s}\n\n", .{if (is_match) "✓ PASS" else "✗ FAIL"});

        if (is_match) passed += 1 else failed += 1;
    }

    // Test 2: "abc"
    {
        std.debug.print("Test: abc\n", .{});
        std.debug.print("{s}\n", .{"-" ** 70});

        const input = "abc";
        const expected = [_]u8{
            0xba, 0x78, 0x16, 0xbf, 0x8f, 0x01, 0xcf, 0xea,
            0x41, 0x41, 0x40, 0xde, 0x5d, 0xae, 0x22, 0x23,
            0xb0, 0x03, 0x61, 0xa3, 0x96, 0x17, 0x7a, 0x9c,
            0xb4, 0x10, 0xff, 0x61, 0xf2, 0x00, 0x15, 0xad,
        };

        const hash = SHA256.hash(input);
        const is_match = std.mem.eql(u8, &hash, &expected);

        std.debug.print("Input:    \"{s}\"\n", .{input});
        std.debug.print("Expected: 0x{s}\n", .{std.fmt.fmtSliceHexLower(&expected)});
        std.debug.print("Got:      0x{s}\n", .{std.fmt.fmtSliceHexLower(&hash)});
        std.debug.print("Status:   {s}\n\n", .{if (is_match) "✓ PASS" else "✗ FAIL"});

        if (is_match) passed += 1 else failed += 1;
    }

    // Test 3: "hello world"
    {
        std.debug.print("Test: hello world\n", .{});
        std.debug.print("{s}\n", .{"-" ** 70});

        const input = "hello world";
        const expected = [_]u8{
            0xb9, 0x4d, 0x27, 0xb9, 0x93, 0x4d, 0x3e, 0x08,
            0xa5, 0x2e, 0x52, 0xd7, 0xda, 0x7d, 0xab, 0xfa,
            0xc4, 0x84, 0xef, 0xe3, 0x7a, 0x53, 0x80, 0xee,
            0x90, 0x88, 0xf7, 0xac, 0xe2, 0xef, 0xcd, 0xe9,
        };

        const hash = SHA256.hash(input);
        const is_match = std.mem.eql(u8, &hash, &expected);

        std.debug.print("Input:    \"{s}\"\n", .{input});
        std.debug.print("Expected: 0x{s}\n", .{std.fmt.fmtSliceHexLower(&expected)});
        std.debug.print("Got:      0x{s}\n", .{std.fmt.fmtSliceHexLower(&hash)});
        std.debug.print("Status:   {s}\n\n", .{if (is_match) "✓ PASS" else "✗ FAIL"});

        if (is_match) passed += 1 else failed += 1;
    }

    // Test 4: 448-bit message
    {
        std.debug.print("Test: 448-bit message\n", .{});
        std.debug.print("{s}\n", .{"-" ** 70});

        const input = "abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq";
        const expected = [_]u8{
            0x24, 0x8d, 0x6a, 0x61, 0xd2, 0x06, 0x38, 0xb8,
            0xe5, 0xc0, 0x26, 0x93, 0x0c, 0x3e, 0x60, 0x39,
            0xa3, 0x3c, 0xe4, 0x59, 0x64, 0xff, 0x21, 0x67,
            0xf6, 0xec, 0xed, 0xd4, 0x19, 0xdb, 0x06, 0xc1,
        };

        const hash = SHA256.hash(input);
        const is_match = std.mem.eql(u8, &hash, &expected);

        std.debug.print("Input:    \"{s}\"\n", .{input});
        std.debug.print("Expected: 0x{s}\n", .{std.fmt.fmtSliceHexLower(&expected)});
        std.debug.print("Got:      0x{s}\n", .{std.fmt.fmtSliceHexLower(&hash)});
        std.debug.print("Status:   {s}\n\n", .{if (is_match) "✓ PASS" else "✗ FAIL"});

        if (is_match) passed += 1 else failed += 1;
    }

    // Test 5: 896-bit message
    {
        std.debug.print("Test: 896-bit message\n", .{});
        std.debug.print("{s}\n", .{"-" ** 70});

        const input = "abcdefghbcdefghicdefghijdefghijkefghijklfghijklmghijklmnhijklmnoijklmnopjklmnopqklmnopqrlmnopqrsmnopqrstnopqrstu";
        const expected = [_]u8{
            0xcf, 0x5b, 0x16, 0xa7, 0x78, 0xaf, 0x83, 0x80,
            0x03, 0x6c, 0xe5, 0x9e, 0x7b, 0x04, 0x92, 0x37,
            0x0b, 0x24, 0x9b, 0x11, 0xe8, 0xf0, 0x7a, 0x51,
            0xaf, 0xac, 0x45, 0x03, 0x7a, 0xfe, 0xe9, 0xd1,
        };

        const hash = SHA256.hash(input);
        const is_match = std.mem.eql(u8, &hash, &expected);

        std.debug.print("Input:    \"{s}...\" ({} bytes)\n", .{ input[0..47], input.len });
        std.debug.print("Expected: 0x{s}\n", .{std.fmt.fmtSliceHexLower(&expected)});
        std.debug.print("Got:      0x{s}\n", .{std.fmt.fmtSliceHexLower(&hash)});
        std.debug.print("Status:   {s}\n\n", .{if (is_match) "✓ PASS" else "✗ FAIL"});

        if (is_match) passed += 1 else failed += 1;
    }

    // Test 6: One million 'a' characters
    {
        std.debug.print("Test: One million \"a\" characters\n", .{});
        std.debug.print("{s}\n", .{"-" ** 70});

        const expected = [_]u8{
            0xcd, 0xc7, 0x6e, 0x5c, 0x99, 0x14, 0xfb, 0x92,
            0x81, 0xa1, 0xc7, 0xe2, 0x84, 0xd7, 0x3e, 0x67,
            0xf1, 0x80, 0x9a, 0x48, 0xa4, 0x97, 0x20, 0x0e,
            0x04, 0x6d, 0x39, 0xcc, 0xc7, 0x11, 0x2c, 0xd0,
        };

        std.debug.print("Input:    1,000,000 × \"a\"\n", .{});
        std.debug.print("Expected: 0x{s}\n", .{std.fmt.fmtSliceHexLower(&expected)});

        const timer = try std.time.Timer.start();

        // Use streaming API for memory efficiency
        var hasher = SHA256.init();
        const chunk_size = 10000;
        var chunk = try allocator.alloc(u8, chunk_size);
        defer allocator.free(chunk);
        @memset(chunk, 'a');

        var i: usize = 0;
        while (i < 100) : (i += 1) {
            hasher.update(chunk);
        }

        const hash = hasher.final();
        const elapsed = timer.read();

        const is_match = std.mem.eql(u8, &hash, &expected);

        std.debug.print("Got:      0x{s}\n", .{std.fmt.fmtSliceHexLower(&hash)});
        std.debug.print("Time:     {d:.2} ms\n", .{@as(f64, @floatFromInt(elapsed)) / 1_000_000.0});
        std.debug.print("Status:   {s}\n\n", .{if (is_match) "✓ PASS" else "✗ FAIL"});

        if (is_match) passed += 1 else failed += 1;
    }

    // Edge case tests
    std.debug.print("Edge Case Tests\n", .{});
    std.debug.print("{s}\n", .{"-" ** 70});

    // Single byte (0x00)
    {
        const input = [_]u8{0x00};
        const expected = [_]u8{
            0x6e, 0x34, 0x0b, 0x9c, 0xff, 0xb3, 0x7a, 0x98,
            0x9c, 0xa5, 0x44, 0xe6, 0xbb, 0x78, 0x0a, 0x2c,
            0x78, 0x90, 0x1d, 0x3f, 0xb3, 0x37, 0x38, 0x76,
            0x85, 0x11, 0xa3, 0x06, 0x17, 0xaf, 0xa0, 0x1d,
        };
        const hash = SHA256.hash(&input);
        const is_match = std.mem.eql(u8, &hash, &expected);
        std.debug.print("Single byte (0x00): {s}\n", .{if (is_match) "✓ PASS" else "✗ FAIL"});
        if (is_match) passed += 1 else failed += 1;
    }

    // All zeros (32 bytes)
    {
        const input = [_]u8{0x00} ** 32;
        const expected = [_]u8{
            0x66, 0x68, 0x7a, 0xad, 0xf8, 0x62, 0xbd, 0x77,
            0x6c, 0x8f, 0xc1, 0x8b, 0x8e, 0x9f, 0x8e, 0x20,
            0x08, 0x97, 0x14, 0x85, 0x6e, 0xe2, 0x33, 0xb3,
            0x90, 0x2a, 0x59, 0x1d, 0x0d, 0x5f, 0x29, 0x25,
        };
        const hash = SHA256.hash(&input);
        const is_match = std.mem.eql(u8, &hash, &expected);
        std.debug.print("All zeros (32 bytes): {s}\n", .{if (is_match) "✓ PASS" else "✗ FAIL"});
        if (is_match) passed += 1 else failed += 1;
    }

    // All ones (32 bytes)
    {
        const input = [_]u8{0xFF} ** 32;
        const expected = [_]u8{
            0xaf, 0x96, 0x13, 0x76, 0x0f, 0x72, 0x63, 0x5f,
            0xbd, 0xb4, 0x4a, 0x5a, 0x0a, 0x63, 0xc3, 0x9f,
            0x12, 0xaf, 0x30, 0xf9, 0x50, 0xa6, 0xee, 0x5c,
            0x97, 0x1b, 0xe1, 0x88, 0xe8, 0x9c, 0x40, 0x51,
        };
        const hash = SHA256.hash(&input);
        const is_match = std.mem.eql(u8, &hash, &expected);
        std.debug.print("All ones (32 bytes): {s}\n", .{if (is_match) "✓ PASS" else "✗ FAIL"});
        if (is_match) passed += 1 else failed += 1;
    }

    std.debug.print("\n", .{});

    // Unicode tests
    std.debug.print("Unicode Tests\n", .{});
    std.debug.print("{s}\n", .{"-" ** 70});

    // Emoji
    {
        const input = "🚀";
        const bytes = [_]u8{ 0xF0, 0x9F, 0x9A, 0x80 };
        const string_hash = SHA256.hash(input);
        const bytes_hash = SHA256.hash(&bytes);
        const is_match = std.mem.eql(u8, &string_hash, &bytes_hash);
        std.debug.print("Emoji 🚀: {s}\n", .{if (is_match) "✓ PASS" else "✗ FAIL"});
        std.debug.print("  UTF-8 bytes: 0x{s}\n", .{std.fmt.fmtSliceHexLower(&bytes)});
        std.debug.print("  Hash:        0x{s}...\n", .{std.fmt.fmtSliceHexLower(string_hash[0..20])});
        if (is_match) passed += 1 else failed += 1;
    }

    // Chinese
    {
        const input = "你好";
        const bytes = [_]u8{ 0xE4, 0xBD, 0xA0, 0xE5, 0xA5, 0xBD };
        const string_hash = SHA256.hash(input);
        const bytes_hash = SHA256.hash(&bytes);
        const is_match = std.mem.eql(u8, &string_hash, &bytes_hash);
        std.debug.print("Chinese 你好: {s}\n", .{if (is_match) "✓ PASS" else "✗ FAIL"});
        std.debug.print("  UTF-8 bytes: 0x{s}\n", .{std.fmt.fmtSliceHexLower(&bytes)});
        std.debug.print("  Hash:        0x{s}...\n", .{std.fmt.fmtSliceHexLower(string_hash[0..20])});
        if (is_match) passed += 1 else failed += 1;
    }

    std.debug.print("\n", .{});

    // Summary
    std.debug.print("{s}\n", .{"=" ** 70});
    std.debug.print("Test Summary\n", .{});
    std.debug.print("{s}\n", .{"=" ** 70});
    std.debug.print("Total tests:  {}\n", .{passed + failed});
    std.debug.print("Passed:       {} ✓\n", .{passed});
    std.debug.print("Failed:       {}\n", .{failed});

    if (failed == 0) {
        std.debug.print("\n🎉 All tests passed! Implementation is correct.\n", .{});
    } else {
        std.debug.print("\n⚠️  Some tests failed. Check implementation.\n", .{});
    }

    std.debug.print("\n=== Test Vectors Complete ===\n", .{});
}
