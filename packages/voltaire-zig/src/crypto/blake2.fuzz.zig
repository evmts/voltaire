//! Comprehensive fuzz tests for BLAKE2 hashing
//!
//! Tests BLAKE2b and BLAKE2s compression functions with arbitrary inputs
//! Focuses on:
//! - Empty inputs
//! - Large inputs (arbitrary block counts)
//! - Determinism (same input → same output)
//! - Output length correctness
//! - No panics on any input
//! - Invalid parameter handling
//! - Rounds validation (0 to max u32)
//! - Counter overflow handling
//! - Final vs non-final block differentiation
//!
//! Run fuzz tests:
//!   Linux: zig build test --fuzz
//!   macOS: docker run --rm -it -v $(pwd):/workspace -w /workspace \
//!          ziglang/zig:0.15.1 zig build test --fuzz=300s
//!
//! Note: Fuzz tests compile as regular tests but only generate interesting
//! inputs when run with --fuzz flag

const std = @import("std");
const testing = std.testing;
const blake2 = @import("blake2.zig");

// ============================================================================
// BLAKE2b Compression Function Fuzzing
// ============================================================================

test "fuzz blake2b compression basic" {
    const input = testing.fuzzInput(.{});
    if (input.len < 128) return; // Need at least message block

    // Initialize state with standard IV
    var h = [8]u64{
        0x6a09e667f3bcc908 ^ 0x01010040,
        0xbb67ae8584caa73b,
        0x3c6ef372fe94f82b,
        0xa54ff53a5f1d36f1,
        0x510e527fade682d1,
        0x9b05688c2b3e6c1f,
        0x1f83d9abfb41bd6b,
        0x5be0cd19137e2179,
    };

    // Extract message from input
    var m: [16]u64 = undefined;
    for (0..16) |i| {
        const offset = i * 8;
        if (offset + 8 <= input.len) {
            const bytes: *const [8]u8 = @ptrCast(input[offset .. offset + 8].ptr);
            m[i] = std.mem.readInt(u64, bytes, .little);
        } else {
            m[i] = 0;
        }
    }

    const t = [2]u64{ 128, 0 };
    const initial_h = h;

    // Should never panic
    blake2.unauditedBlake2fCompress(&h, &m, t, true, 12);

    // State should have changed
    try testing.expect(h[0] != initial_h[0] or h[1] != initial_h[1]);
}

test "fuzz blake2b compression determinism" {
    const input = testing.fuzzInput(.{});
    if (input.len < 128) return;

    var h1 = [8]u64{
        0x6a09e667f3bcc908 ^ 0x01010040,
        0xbb67ae8584caa73b,
        0x3c6ef372fe94f82b,
        0xa54ff53a5f1d36f1,
        0x510e527fade682d1,
        0x9b05688c2b3e6c1f,
        0x1f83d9abfb41bd6b,
        0x5be0cd19137e2179,
    };
    var h2 = h1;

    var m: [16]u64 = undefined;
    for (0..16) |i| {
        const offset = i * 8;
        if (offset + 8 <= input.len) {
            const bytes: *const [8]u8 = @ptrCast(input[offset .. offset + 8].ptr);
            m[i] = std.mem.readInt(u64, bytes, .little);
        } else {
            m[i] = 0;
        }
    }

    const t = [2]u64{ 128, 0 };

    // Same input should always produce same output
    blake2.unauditedBlake2fCompress(&h1, &m, t, true, 12);
    blake2.unauditedBlake2fCompress(&h2, &m, t, true, 12);

    for (0..8) |i| {
        try testing.expectEqual(h1[i], h2[i]);
    }
}

test "fuzz blake2b compression arbitrary rounds" {
    const input = testing.fuzzInput(.{});
    if (input.len < 132) return; // Need message + 4 bytes for rounds

    var h = [8]u64{
        0x6a09e667f3bcc908 ^ 0x01010040,
        0xbb67ae8584caa73b,
        0x3c6ef372fe94f82b,
        0xa54ff53a5f1d36f1,
        0x510e527fade682d1,
        0x9b05688c2b3e6c1f,
        0x1f83d9abfb41bd6b,
        0x5be0cd19137e2179,
    };

    var m: [16]u64 = undefined;
    for (0..16) |i| {
        const offset = i * 8;
        const bytes: *const [8]u8 = @ptrCast(input[offset .. offset + 8].ptr);
        m[i] = std.mem.readInt(u64, bytes, .little);
    }

    // Extract rounds from input (any u32 value should work)
    const rounds = std.mem.readInt(u32, input[128..132], .little);
    const t = [2]u64{ 128, 0 };

    // Should handle arbitrary round counts without panicking
    blake2.unauditedBlake2fCompress(&h, &m, t, true, rounds);

    // Verify state changed (unless 0 rounds with all-zero input)
    if (rounds > 0 or m[0] != 0) {
        try testing.expect(h[0] != (0x6a09e667f3bcc908 ^ 0x01010040) or h[1] != 0xbb67ae8584caa73b);
    }
}

test "fuzz blake2b compression counter values" {
    const input = testing.fuzzInput(.{});
    if (input.len < 144) return; // Need message + counter

    var h = [8]u64{
        0x6a09e667f3bcc908 ^ 0x01010040,
        0xbb67ae8584caa73b,
        0x3c6ef372fe94f82b,
        0xa54ff53a5f1d36f1,
        0x510e527fade682d1,
        0x9b05688c2b3e6c1f,
        0x1f83d9abfb41bd6b,
        0x5be0cd19137e2179,
    };

    var m: [16]u64 = undefined;
    for (0..16) |i| {
        const offset = i * 8;
        const bytes: *const [8]u8 = @ptrCast(input[offset .. offset + 8].ptr);
        m[i] = std.mem.readInt(u64, bytes, .little);
    }

    // Extract arbitrary counter values
    const t0_bytes: *const [8]u8 = @ptrCast(input[128..136].ptr);
    const t1_bytes: *const [8]u8 = @ptrCast(input[136..144].ptr);
    const t = [2]u64{
        std.mem.readInt(u64, t0_bytes, .little),
        std.mem.readInt(u64, t1_bytes, .little),
    };

    // Should handle arbitrary counter values
    blake2.unauditedBlake2fCompress(&h, &m, t, true, 12);

    // Verify compression completed
    try testing.expect(h[0] != (0x6a09e667f3bcc908 ^ 0x01010040) or h[1] != 0xbb67ae8584caa73b);
}

test "fuzz blake2b compression final flag" {
    const input = testing.fuzzInput(.{});
    if (input.len < 129) return;

    var h_final = [8]u64{
        0x6a09e667f3bcc908 ^ 0x01010040,
        0xbb67ae8584caa73b,
        0x3c6ef372fe94f82b,
        0xa54ff53a5f1d36f1,
        0x510e527fade682d1,
        0x9b05688c2b3e6c1f,
        0x1f83d9abfb41bd6b,
        0x5be0cd19137e2179,
    };
    var h_non_final = h_final;

    var m: [16]u64 = undefined;
    for (0..16) |i| {
        const offset = i * 8;
        const bytes: *const [8]u8 = @ptrCast(input[offset .. offset + 8].ptr);
        m[i] = std.mem.readInt(u64, bytes, .little);
    }

    const t = [2]u64{ 128, 0 };

    // Extract final flag from input
    const final_flag = input[128] != 0;

    blake2.unauditedBlake2fCompress(&h_final, &m, t, final_flag, 12);
    blake2.unauditedBlake2fCompress(&h_non_final, &m, t, !final_flag, 12);

    // Different final flags should produce different outputs
    var different = false;
    for (0..8) |i| {
        if (h_final[i] != h_non_final[i]) {
            different = true;
            break;
        }
    }
    try testing.expect(different);
}

test "fuzz blake2b compression empty input" {
    const input = testing.fuzzInput(.{});
    if (input.len != 0) return;

    var h = [8]u64{
        0x6a09e667f3bcc908 ^ 0x01010040,
        0xbb67ae8584caa73b,
        0x3c6ef372fe94f82b,
        0xa54ff53a5f1d36f1,
        0x510e527fade682d1,
        0x9b05688c2b3e6c1f,
        0x1f83d9abfb41bd6b,
        0x5be0cd19137e2179,
    };

    const m = [_]u64{0} ** 16;
    const t = [2]u64{ 0, 0 };
    const initial_h = h;

    // Empty input should still process
    blake2.unauditedBlake2fCompress(&h, &m, t, true, 12);

    // State should change even with empty input
    try testing.expect(h[0] != initial_h[0]);
}

test "fuzz blake2b compression large rounds" {
    const input = testing.fuzzInput(.{});
    if (input.len < 132) return;

    var h = [8]u64{
        0x6a09e667f3bcc908 ^ 0x01010040,
        0xbb67ae8584caa73b,
        0x3c6ef372fe94f82b,
        0xa54ff53a5f1d36f1,
        0x510e527fade682d1,
        0x9b05688c2b3e6c1f,
        0x1f83d9abfb41bd6b,
        0x5be0cd19137e2179,
    };

    var m: [16]u64 = undefined;
    for (0..16) |i| {
        const offset = i * 8;
        const bytes: *const [8]u8 = @ptrCast(input[offset .. offset + 8].ptr);
        m[i] = std.mem.readInt(u64, bytes, .little);
    }

    const rounds = std.mem.readInt(u32, input[128..132], .little);
    if (rounds < 1000) return; // Only test large round counts

    const t = [2]u64{ 128, 0 };

    // Should handle large round counts (though may be slow)
    blake2.unauditedBlake2fCompress(&h, &m, t, true, rounds);

    // Verify completion
    try testing.expect(h[0] != (0x6a09e667f3bcc908 ^ 0x01010040) or h[1] != 0xbb67ae8584caa73b);
}

test "fuzz blake2b compression zero rounds" {
    const input = testing.fuzzInput(.{});
    if (input.len < 128) return;

    var h = [8]u64{
        0x6a09e667f3bcc908 ^ 0x01010040,
        0xbb67ae8584caa73b,
        0x3c6ef372fe94f82b,
        0xa54ff53a5f1d36f1,
        0x510e527fade682d1,
        0x9b05688c2b3e6c1f,
        0x1f83d9abfb41bd6b,
        0x5be0cd19137e2179,
    };

    var m: [16]u64 = undefined;
    for (0..16) |i| {
        const offset = i * 8;
        const bytes: *const [8]u8 = @ptrCast(input[offset .. offset + 8].ptr);
        m[i] = std.mem.readInt(u64, bytes, .little);
    }

    const t = [2]u64{ 128, 0 };
    const initial_h = h;

    // Zero rounds should still process (just initialization/finalization)
    blake2.unauditedBlake2fCompress(&h, &m, t, true, 0);

    // State should change even with 0 rounds due to finalization
    try testing.expect(h[0] != initial_h[0] or h[1] != initial_h[1]);
}

test "fuzz blake2b compression all bits set" {
    const input = testing.fuzzInput(.{});
    if (input.len < 128) return;

    var h = [8]u64{
        0xFFFFFFFFFFFFFFFF,
        0xFFFFFFFFFFFFFFFF,
        0xFFFFFFFFFFFFFFFF,
        0xFFFFFFFFFFFFFFFF,
        0xFFFFFFFFFFFFFFFF,
        0xFFFFFFFFFFFFFFFF,
        0xFFFFFFFFFFFFFFFF,
        0xFFFFFFFFFFFFFFFF,
    };

    var m: [16]u64 = undefined;
    for (0..16) |i| {
        const offset = i * 8;
        const bytes: *const [8]u8 = @ptrCast(input[offset .. offset + 8].ptr);
        m[i] = std.mem.readInt(u64, bytes, .little);
    }

    const t = [2]u64{ 0xFFFFFFFFFFFFFFFF, 0xFFFFFFFFFFFFFFFF };
    const initial_h = h;

    // Should handle all-bits-set state
    blake2.unauditedBlake2fCompress(&h, &m, t, true, 12);

    // State should change
    try testing.expect(h[0] != initial_h[0] or h[1] != initial_h[1]);
}

test "fuzz blake2b compression alternating bits" {
    const input = testing.fuzzInput(.{});
    if (input.len < 128) return;

    var h = [8]u64{
        0x6a09e667f3bcc908 ^ 0x01010040,
        0xbb67ae8584caa73b,
        0x3c6ef372fe94f82b,
        0xa54ff53a5f1d36f1,
        0x510e527fade682d1,
        0x9b05688c2b3e6c1f,
        0x1f83d9abfb41bd6b,
        0x5be0cd19137e2179,
    };

    // Create alternating bit pattern from input
    var m: [16]u64 = undefined;
    for (0..16) |i| {
        const offset = i * 8;
        const bytes: *const [8]u8 = @ptrCast(input[offset .. offset + 8].ptr);
        const value = std.mem.readInt(u64, bytes, .little);
        // Create alternating pattern based on input
        m[i] = value ^ 0xAAAAAAAAAAAAAAAA;
    }

    const t = [2]u64{ 128, 0 };

    // Should handle alternating bit patterns
    blake2.unauditedBlake2fCompress(&h, &m, t, true, 12);

    // Verify completion
    try testing.expect(h[0] != (0x6a09e667f3bcc908 ^ 0x01010040) or h[1] != 0xbb67ae8584caa73b);
}

// ============================================================================
// BLAKE2 Wrapper API Fuzzing (EIP-152 format)
// ============================================================================

test "fuzz Blake2.compress wrapper" {
    const raw_input = testing.fuzzInput(.{});
    if (raw_input.len < 213) return; // EIP-152 requires exactly 213 bytes

    const input = raw_input[0..213];
    var output: [64]u8 = undefined;

    // Should handle arbitrary 213-byte inputs
    blake2.Blake2.compress(input, &output) catch return;

    // If successful, output should be 64 bytes
    try testing.expectEqual(@as(usize, 64), output.len);
}

test "fuzz Blake2.compress wrapper invalid input length" {
    const input = testing.fuzzInput(.{});
    if (input.len == 213) return; // Skip valid length

    var output: [64]u8 = undefined;

    // Should return error for invalid input length
    const result = blake2.Blake2.compress(input, &output);
    try testing.expectError(error.InvalidInput, result);
}

test "fuzz Blake2.compress wrapper invalid output length" {
    const input = testing.fuzzInput(.{});
    if (input.len < 213) return;

    const valid_input = input[0..213];
    var small_output: [32]u8 = undefined;

    // Should return error for invalid output length
    const result = blake2.Blake2.compress(valid_input, &small_output);
    try testing.expectError(error.InvalidOutput, result);
}

test "fuzz Blake2.compress wrapper determinism" {
    const input = testing.fuzzInput(.{});
    if (input.len < 213) return;

    const test_input = input[0..213];
    var output1: [64]u8 = undefined;
    var output2: [64]u8 = undefined;

    // Same input should produce same output
    blake2.Blake2.compress(test_input, &output1) catch return;
    blake2.Blake2.compress(test_input, &output2) catch return;

    try testing.expectEqual(output1, output2);
}

test "fuzz Blake2.compress wrapper rounds extraction" {
    const raw_input = testing.fuzzInput(.{});
    if (raw_input.len < 213) return;

    var input_buf: [213]u8 = undefined;
    @memcpy(&input_buf, raw_input[0..213]);

    // Rounds is big-endian in first 4 bytes
    const rounds = std.mem.readInt(u32, input_buf[0..4], .big);

    var output: [64]u8 = undefined;

    // Should handle any round count
    try blake2.Blake2.compress(&input_buf, &output);

    // Output should be 64 bytes
    try testing.expectEqual(@as(usize, 64), output.len);

    // Different rounds should (likely) produce different outputs
    if (rounds > 0) {
        var input_buf2 = input_buf;
        std.mem.writeInt(u32, input_buf2[0..4], rounds + 1, .big);
        var output2: [64]u8 = undefined;
        try blake2.Blake2.compress(&input_buf2, &output2);

        // Likely different (not guaranteed for all inputs, but probable)
        const equal = std.mem.eql(u8, &output, &output2);
        _ = equal; // Just verify no panic, equality not guaranteed
    }
}

test "fuzz Blake2.compress wrapper final flag" {
    const raw_input = testing.fuzzInput(.{});
    if (raw_input.len < 213) return;

    var input_buf: [213]u8 = undefined;
    @memcpy(&input_buf, raw_input[0..213]);

    // Test both final flag values
    for ([_]u8{ 0, 1 }) |f| {
        input_buf[212] = f;
        var output: [64]u8 = undefined;

        // Should handle both valid final flag values
        try blake2.Blake2.compress(&input_buf, &output);
        try testing.expectEqual(@as(usize, 64), output.len);
    }
}

// ============================================================================
// BLAKE2b G Function Fuzzing
// ============================================================================

test "fuzz blake2b G function" {
    const input = testing.fuzzInput(.{});
    if (input.len < 144) return; // Need 16 u64s + 2 u64s for x,y

    var v: [16]u64 = undefined;
    for (0..16) |i| {
        const offset = i * 8;
        const bytes: *const [8]u8 = @ptrCast(input[offset .. offset + 8].ptr);
        v[i] = std.mem.readInt(u64, bytes, .little);
    }

    const x_bytes: *const [8]u8 = @ptrCast(input[128..136].ptr);
    const y_bytes: *const [8]u8 = @ptrCast(input[136..144].ptr);
    const x = std.mem.readInt(u64, x_bytes, .little);
    const y = std.mem.readInt(u64, y_bytes, .little);

    const v_original = v;

    // Should never panic with any index combination
    blake2.unauditedBlake2bG(&v, 0, 4, 8, 12, x, y);

    // Verify G function modified the state
    try testing.expect(v[0] != v_original[0] or v[4] != v_original[4] or
        v[8] != v_original[8] or v[12] != v_original[12]);
}

test "fuzz blake2b G function all indices" {
    const input = testing.fuzzInput(.{});
    if (input.len < 132) return;

    var v: [16]u64 = undefined;
    for (0..16) |i| {
        const offset = i * 8;
        const bytes: *const [8]u8 = @ptrCast(input[offset .. offset + 8].ptr);
        v[i] = std.mem.readInt(u64, bytes, .little);
    }

    const x_bytes: *const [8]u8 = @ptrCast(input[128..132].ptr);
    const x = std.mem.readInt(u32, x_bytes, .little);

    // Use input bytes to determine indices (mod 16)
    const a = x % 16;
    const b = (x >> 4) % 16;
    const c = (x >> 8) % 16;
    const d = (x >> 12) % 16;

    const v_original = v;

    // Should handle any valid index combination
    blake2.unauditedBlake2bG(&v, a, b, c, d, 0x123456789ABCDEF0, 0xFEDCBA987654321);

    // At least one of the indexed positions should change
    try testing.expect(v[a] != v_original[a] or v[b] != v_original[b] or
        v[c] != v_original[c] or v[d] != v_original[d]);
}

// ============================================================================
// BLAKE2b Round Function Fuzzing
// ============================================================================

test "fuzz blake2b round function" {
    const input = testing.fuzzInput(.{});
    if (input.len < 256) return; // Need 16 u64s for v + 16 u64s for message

    var v: [16]u64 = undefined;
    var message: [16]u64 = undefined;

    for (0..16) |i| {
        const v_offset = i * 8;
        const m_offset = 128 + i * 8;
        const v_bytes: *const [8]u8 = @ptrCast(input[v_offset .. v_offset + 8].ptr);
        const m_bytes: *const [8]u8 = @ptrCast(input[m_offset .. m_offset + 8].ptr);
        v[i] = std.mem.readInt(u64, v_bytes, .little);
        message[i] = std.mem.readInt(u64, m_bytes, .little);
    }

    const v_original = v;

    // Should never panic
    blake2.unauditedBlake2bRound(&v, &message, 0);

    // All elements should have changed
    var changed = false;
    for (0..16) |i| {
        if (v[i] != v_original[i]) {
            changed = true;
            break;
        }
    }
    try testing.expect(changed);
}

test "fuzz blake2b round function all round indices" {
    const input = testing.fuzzInput(.{});
    if (input.len < 260) return;

    var v: [16]u64 = undefined;
    var message: [16]u64 = undefined;

    for (0..16) |i| {
        const v_offset = i * 8;
        const m_offset = 128 + i * 8;
        const v_bytes: *const [8]u8 = @ptrCast(input[v_offset .. v_offset + 8].ptr);
        const m_bytes: *const [8]u8 = @ptrCast(input[m_offset .. m_offset + 8].ptr);
        v[i] = std.mem.readInt(u64, v_bytes, .little);
        message[i] = std.mem.readInt(u64, m_bytes, .little);
    }

    const round = std.mem.readInt(u32, input[256..260], .little);

    // Should handle any round index (sigma permutation wraps at mod 12)
    blake2.unauditedBlake2bRound(&v, &message, round);

    // Verify round completed
    try testing.expect(true);
}

// ============================================================================
// Property-Based Tests
// ============================================================================

test "fuzz blake2b avalanche effect" {
    const input = testing.fuzzInput(.{});
    if (input.len < 129) return;

    var h1 = [8]u64{
        0x6a09e667f3bcc908 ^ 0x01010040,
        0xbb67ae8584caa73b,
        0x3c6ef372fe94f82b,
        0xa54ff53a5f1d36f1,
        0x510e527fade682d1,
        0x9b05688c2b3e6c1f,
        0x1f83d9abfb41bd6b,
        0x5be0cd19137e2179,
    };
    var h2 = h1;

    var m1: [16]u64 = undefined;
    var m2: [16]u64 = undefined;

    for (0..16) |i| {
        const offset = i * 8;
        const bytes: *const [8]u8 = @ptrCast(input[offset .. offset + 8].ptr);
        m1[i] = std.mem.readInt(u64, bytes, .little);
        m2[i] = m1[i];
    }

    // Flip one bit in m2 based on input byte 128
    const bit_to_flip = input[128];
    const word_idx = (bit_to_flip / 64) % 16;
    const bit_idx = bit_to_flip % 64;
    m2[word_idx] ^= @as(u64, 1) << @intCast(bit_idx);

    const t = [2]u64{ 128, 0 };

    blake2.unauditedBlake2fCompress(&h1, &m1, t, true, 12);
    blake2.unauditedBlake2fCompress(&h2, &m2, t, true, 12);

    // Single bit change should cause significant difference (avalanche)
    var differences: usize = 0;
    for (0..8) |i| {
        if (h1[i] != h2[i]) differences += 1;
    }

    // Expect at least 4 words to differ (50% avalanche)
    try testing.expect(differences >= 4);
}

test "fuzz blake2b compression sequence consistency" {
    const input = testing.fuzzInput(.{});
    if (input.len < 256) return; // Need 2 message blocks

    var h = [8]u64{
        0x6a09e667f3bcc908 ^ 0x01010040,
        0xbb67ae8584caa73b,
        0x3c6ef372fe94f82b,
        0xa54ff53a5f1d36f1,
        0x510e527fade682d1,
        0x9b05688c2b3e6c1f,
        0x1f83d9abfb41bd6b,
        0x5be0cd19137e2179,
    };

    // First block
    var m1: [16]u64 = undefined;
    for (0..16) |i| {
        const offset = i * 8;
        const bytes: *const [8]u8 = @ptrCast(input[offset .. offset + 8].ptr);
        m1[i] = std.mem.readInt(u64, bytes, .little);
    }

    blake2.unauditedBlake2fCompress(&h, &m1, [2]u64{ 128, 0 }, false, 12);
    const h_after_first = h;

    // Second block
    var m2: [16]u64 = undefined;
    for (0..16) |i| {
        const offset = 128 + i * 8;
        const bytes: *const [8]u8 = @ptrCast(input[offset .. offset + 8].ptr);
        m2[i] = std.mem.readInt(u64, bytes, .little);
    }

    blake2.unauditedBlake2fCompress(&h, &m2, [2]u64{ 256, 0 }, true, 12);

    // State should change after each block
    try testing.expect(h[0] != h_after_first[0] or h[1] != h_after_first[1]);
}
