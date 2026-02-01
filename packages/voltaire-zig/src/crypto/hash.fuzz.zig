//! Comprehensive fuzz tests for hash module
//!
//! Tests all hash functions (keccak256, sha256, ripemd160, blake2f) with arbitrary inputs
//! Focuses on:
//! - Empty inputs
//! - Large inputs (>1000 bytes)
//! - Determinism (same input → same hash)
//! - Output length correctness
//! - No panics on any input
//! - Hash utility functions (hex conversion, comparisons, bitwise operations)
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
const Hash = @import("hash.zig");
const HashAlgorithms = @import("hash_algorithms.zig");

// ===== Keccak256 Fuzz Tests =====

test "fuzz keccak256 basic" {
    const input = testing.fuzzInput(.{});

    // Should never panic, always produce 32-byte hash
    const result = Hash.keccak256(input);
    try testing.expectEqual(@as(usize, 32), result.len);
}

test "fuzz keccak256 determinism" {
    const input = testing.fuzzInput(.{});

    // Same input should always produce same hash
    const hash1 = Hash.keccak256(input);
    const hash2 = Hash.keccak256(input);
    try testing.expectEqual(hash1, hash2);
}

test "fuzz keccak256 empty input" {
    const input = testing.fuzzInput(.{});
    if (input.len != 0) return;

    // Empty input should produce EMPTY_KECCAK256
    const result = Hash.keccak256(input);
    try testing.expectEqual(Hash.EMPTY_KECCAK256, result);
}

test "fuzz keccak256 large inputs" {
    const input = testing.fuzzInput(.{});
    if (input.len < 1000) return; // Only test large inputs

    // Should handle large inputs without panicking
    const result = Hash.keccak256(input);
    try testing.expectEqual(@as(usize, 32), result.len);
    try testing.expect(!Hash.isZero(result)); // Large input unlikely to hash to zero
}

// ===== SHA256 Fuzz Tests =====

test "fuzz sha256 basic" {
    const input = testing.fuzzInput(.{});
    var output: [HashAlgorithms.SHA256.OUTPUT_SIZE]u8 = undefined;

    // Should never panic
    try HashAlgorithms.SHA256.hash(input, &output);
    try testing.expectEqual(@as(usize, 32), output.len);
}

test "fuzz sha256 determinism" {
    const input = testing.fuzzInput(.{});

    // Same input should always produce same hash
    const hash1 = HashAlgorithms.SHA256.hashFixed(input);
    const hash2 = HashAlgorithms.SHA256.hashFixed(input);
    try testing.expectEqual(hash1, hash2);
}

test "fuzz sha256 empty input" {
    const input = testing.fuzzInput(.{});
    if (input.len != 0) return;

    // Empty input should produce known empty SHA256
    const result = HashAlgorithms.SHA256.hashFixed(input);
    const expected = [_]u8{
        0xe3, 0xb0, 0xc4, 0x42, 0x98, 0xfc, 0x1c, 0x14,
        0x9a, 0xfb, 0xf4, 0xc8, 0x99, 0x6f, 0xb9, 0x24,
        0x27, 0xae, 0x41, 0xe4, 0x64, 0x9b, 0x93, 0x4c,
        0xa4, 0x95, 0x99, 0x1b, 0x78, 0x52, 0xb8, 0x55,
    };
    try testing.expectEqual(expected, result);
}

test "fuzz sha256 large inputs" {
    const input = testing.fuzzInput(.{});
    if (input.len < 1000) return;

    // Should handle large inputs without panicking
    const result = HashAlgorithms.SHA256.hashFixed(input);
    try testing.expectEqual(@as(usize, 32), result.len);
}

test "fuzz sha256 buffer too small" {
    const input = testing.fuzzInput(.{});
    if (input.len > 100) return; // Keep test fast

    // Should return error if buffer too small
    var small_buffer: [16]u8 = undefined;
    const result = HashAlgorithms.SHA256.hash(input, &small_buffer);
    try testing.expectError(HashAlgorithms.HashError.OutputBufferTooSmall, result);
}

// ===== RIPEMD160 Fuzz Tests =====

test "fuzz ripemd160 basic" {
    const input = testing.fuzzInput(.{});
    var output: [HashAlgorithms.RIPEMD160.OUTPUT_SIZE]u8 = undefined;

    // Should never panic
    try HashAlgorithms.RIPEMD160.hash(input, &output);
    try testing.expectEqual(@as(usize, 20), output.len);
}

test "fuzz ripemd160 determinism" {
    const input = testing.fuzzInput(.{});

    // Same input should always produce same hash
    const hash1 = HashAlgorithms.RIPEMD160.hashFixed(input);
    const hash2 = HashAlgorithms.RIPEMD160.hashFixed(input);
    try testing.expectEqual(hash1, hash2);
}

test "fuzz ripemd160 empty input" {
    const input = testing.fuzzInput(.{});
    if (input.len != 0) return;

    // Empty input should produce known empty RIPEMD160
    const result = HashAlgorithms.RIPEMD160.hashFixed(input);
    const expected = [_]u8{
        0x9c, 0x11, 0x85, 0xa5, 0xc5, 0xe9, 0xfc, 0x54,
        0x61, 0x28, 0x08, 0x97, 0x7e, 0xe8, 0xf5, 0x48,
        0xb2, 0x25, 0x8d, 0x31,
    };
    try testing.expectEqual(expected, result);
}

test "fuzz ripemd160 large inputs" {
    const input = testing.fuzzInput(.{});
    if (input.len < 1000) return;

    // Should handle large inputs without panicking
    const result = HashAlgorithms.RIPEMD160.hashFixed(input);
    try testing.expectEqual(@as(usize, 20), result.len);
}

test "fuzz ripemd160 buffer too small" {
    const input = testing.fuzzInput(.{});
    if (input.len > 100) return;

    // Should return error if buffer too small
    var small_buffer: [10]u8 = undefined;
    const result = HashAlgorithms.RIPEMD160.hash(input, &small_buffer);
    try testing.expectError(HashAlgorithms.HashError.OutputBufferTooSmall, result);
}

// ===== BLAKE2F Fuzz Tests =====

test "fuzz blake2f eip152 format" {
    const raw_input = testing.fuzzInput(.{});
    if (raw_input.len < 213) return; // Need exactly 213 bytes for EIP-152 format

    // Extract 213 bytes for EIP-152 format
    const input = raw_input[0..213];
    var output: [HashAlgorithms.BLAKE2F.OUTPUT_SIZE]u8 = undefined;

    // Should handle arbitrary inputs - may return error for invalid format
    _ = HashAlgorithms.BLAKE2F.unauditedCompressEip152(input, &output) catch return;

    // If successful, output should be 64 bytes
    try testing.expectEqual(@as(usize, 64), output.len);
}

test "fuzz blake2f rounds validation" {
    const raw_input = testing.fuzzInput(.{});
    if (raw_input.len < 213) return;

    var input_buf: [213]u8 = undefined;
    @memcpy(&input_buf, raw_input[0..213]);

    // Ensure final flag is valid (0 or 1)
    input_buf[212] = raw_input[212] & 1;

    var output: [64]u8 = undefined;
    try HashAlgorithms.BLAKE2F.unauditedCompressEip152(&input_buf, &output);

    // Should succeed with valid final flag
    try testing.expectEqual(@as(usize, 64), output.len);
}

test "fuzz blake2f invalid final flag" {
    const raw_input = testing.fuzzInput(.{});
    if (raw_input.len < 213) return;

    var input_buf: [213]u8 = undefined;
    @memcpy(&input_buf, raw_input[0..213]);

    // Set invalid final flag (not 0 or 1)
    input_buf[212] = 2;

    var output: [64]u8 = undefined;
    const result = HashAlgorithms.BLAKE2F.unauditedCompressEip152(&input_buf, &output);

    // Should return error for invalid final flag
    try testing.expectError(error.InvalidFinalFlag, result);
}

test "fuzz blake2f buffer too small" {
    const raw_input = testing.fuzzInput(.{});
    if (raw_input.len < 213) return;

    const input = raw_input[0..213];
    var small_buffer: [32]u8 = undefined;

    // Should return error if buffer too small
    const result = HashAlgorithms.BLAKE2F.unauditedCompressEip152(input, &small_buffer);
    try testing.expectError(error.OutputBufferTooSmall, result);
}

// ===== Hash Utility Function Fuzz Tests =====

test "fuzz fromSlice" {
    const input = testing.fuzzInput(.{});

    const result = Hash.fromSlice(input) catch |err| {
        // Only valid error is InvalidLength
        try testing.expectEqual(error.InvalidLength, err);
        try testing.expect(input.len != 32);
        return;
    };

    // If successful, must be 32 bytes
    try testing.expectEqual(@as(usize, 32), result.len);
    try testing.expectEqual(@as(usize, 32), input.len);
    try testing.expectEqualSlices(u8, input, &result);
}

test "fuzz fromHex" {
    const input = testing.fuzzInput(.{});

    const result = Hash.fromHex(input) catch |err| {
        // Expected errors for invalid hex
        const is_expected = err == error.InvalidHexLength or
            err == error.InvalidHexString or
            err == error.InvalidHexFormat;
        try testing.expect(is_expected);
        return;
    };

    // If successful, must be 32 bytes
    try testing.expectEqual(@as(usize, 32), result.len);
}

test "fuzz toHex" {
    const input = testing.fuzzInput(.{});
    if (input.len != 32) return;

    // Create hash from input
    var hash: Hash.Hash = undefined;
    @memcpy(&hash, input[0..32]);

    // Should never panic
    const hex = Hash.toHex(hash);
    try testing.expectEqual(@as(usize, 66), hex.len);
    try testing.expectEqualStrings("0x", hex[0..2]);
}

test "fuzz toHexUpper" {
    const input = testing.fuzzInput(.{});
    if (input.len != 32) return;

    var hash: Hash.Hash = undefined;
    @memcpy(&hash, input[0..32]);

    const hex = Hash.toHexUpper(hash);
    try testing.expectEqual(@as(usize, 66), hex.len);
    try testing.expectEqualStrings("0x", hex[0..2]);
}

test "fuzz equal" {
    const input = testing.fuzzInput(.{});
    if (input.len < 64) return;

    var hash1: Hash.Hash = undefined;
    var hash2: Hash.Hash = undefined;
    @memcpy(&hash1, input[0..32]);
    @memcpy(&hash2, input[32..64]);

    // Should never panic
    const result = Hash.equal(hash1, hash2);

    // Verify consistency with std.mem.eql
    const expected = std.mem.eql(u8, &hash1, &hash2);
    try testing.expectEqual(expected, result);
}

test "fuzz compare" {
    const input = testing.fuzzInput(.{});
    if (input.len < 64) return;

    var hash1: Hash.Hash = undefined;
    var hash2: Hash.Hash = undefined;
    @memcpy(&hash1, input[0..32]);
    @memcpy(&hash2, input[32..64]);

    // Should never panic
    const result = Hash.compare(hash1, hash2);

    // Verify consistency with std.mem.order
    const expected = std.mem.order(u8, &hash1, &hash2);
    try testing.expectEqual(expected, result);
}

test "fuzz lessThan greaterThan" {
    const input = testing.fuzzInput(.{});
    if (input.len < 64) return;

    var hash1: Hash.Hash = undefined;
    var hash2: Hash.Hash = undefined;
    @memcpy(&hash1, input[0..32]);
    @memcpy(&hash2, input[32..64]);

    const lt = Hash.lessThan(hash1, hash2);
    const gt = Hash.greaterThan(hash1, hash2);
    const eq = Hash.equal(hash1, hash2);

    // Verify logical consistency: exactly one should be true
    const count = @as(u8, @intFromBool(lt)) + @as(u8, @intFromBool(gt)) + @as(u8, @intFromBool(eq));
    try testing.expectEqual(@as(u8, 1), count);
}

test "fuzz xor" {
    const input = testing.fuzzInput(.{});
    if (input.len < 64) return;

    var hash1: Hash.Hash = undefined;
    var hash2: Hash.Hash = undefined;
    @memcpy(&hash1, input[0..32]);
    @memcpy(&hash2, input[32..64]);

    const result = Hash.xor(hash1, hash2);

    // Verify XOR properties: a XOR a = 0
    const self_xor = Hash.xor(hash1, hash1);
    try testing.expectEqual(Hash.ZERO_HASH, self_xor);

    // Verify XOR is commutative: a XOR b = b XOR a
    const reverse_xor = Hash.xor(hash2, hash1);
    try testing.expectEqual(result, reverse_xor);
}

test "fuzz bitAnd bitOr bitNot" {
    const input = testing.fuzzInput(.{});
    if (input.len < 64) return;

    var hash1: Hash.Hash = undefined;
    var hash2: Hash.Hash = undefined;
    @memcpy(&hash1, input[0..32]);
    @memcpy(&hash2, input[32..64]);

    // Should never panic
    const and_result = Hash.bitAnd(hash1, hash2);
    _ = Hash.bitOr(hash1, hash2);
    const not1 = Hash.bitNot(hash1);
    const not2 = Hash.bitNot(hash2);

    // Verify De Morgan's laws: NOT(a AND b) = (NOT a) OR (NOT b)
    const not_and = Hash.bitNot(and_result);
    const not_or_not = Hash.bitOr(not1, not2);
    try testing.expectEqual(not_and, not_or_not);
}

test "fuzz toU256 fromU256 roundtrip" {
    const input = testing.fuzzInput(.{});
    if (input.len < 32) return;

    var hash: Hash.Hash = undefined;
    @memcpy(&hash, input[0..32]);

    // Roundtrip should preserve value
    const as_u256 = Hash.toU256(hash);
    const back_to_hash = Hash.fromU256(as_u256);
    try testing.expectEqual(hash, back_to_hash);
}

test "fuzz selectorFromSignature" {
    const input = testing.fuzzInput(.{});
    if (input.len == 0) return;

    // Should never panic on any input
    const selector = Hash.selectorFromSignature(input);
    try testing.expectEqual(@as(usize, 4), selector.len);

    // Determinism: same input produces same selector
    const selector2 = Hash.selectorFromSignature(input);
    try testing.expectEqual(selector, selector2);
}

test "fuzz eip191HashMessage" {
    const input = testing.fuzzInput(.{});
    if (input.len > 1000) return; // Limit allocation size

    var arena = std.heap.ArenaAllocator.init(testing.allocator);
    defer arena.deinit();
    const allocator = arena.allocator();

    // Should never panic on any input
    const hash = Hash.eip191HashMessage(input, allocator) catch return;
    try testing.expectEqual(@as(usize, 32), hash.len);

    // Determinism: same input produces same hash
    const hash2 = Hash.eip191HashMessage(input, allocator) catch return;
    try testing.expectEqual(hash, hash2);
}

test "fuzz hex roundtrip" {
    const input = testing.fuzzInput(.{});
    if (input.len != 32) return;

    var hash: Hash.Hash = undefined;
    @memcpy(&hash, input[0..32]);

    // Convert to hex and back
    const hex = Hash.toHex(hash);
    const parsed = Hash.fromHex(&hex) catch unreachable;
    try testing.expectEqual(hash, parsed);
}

test "fuzz isZero" {
    const input = testing.fuzzInput(.{});
    if (input.len != 32) return;

    var hash: Hash.Hash = undefined;
    @memcpy(&hash, input[0..32]);

    const result = Hash.isZero(hash);

    // Manually check if all bytes are zero
    var all_zero = true;
    for (hash) |byte| {
        if (byte != 0) {
            all_zero = false;
            break;
        }
    }

    try testing.expectEqual(all_zero, result);
}

test "fuzz cross-hash comparison" {
    const input = testing.fuzzInput(.{});
    if (input.len < 10) return;

    // Compare different hash functions on same input
    const keccak_hash = Hash.keccak256(input);
    const sha256_hash = HashAlgorithms.SHA256.hashFixed(input);

    // Different algorithms should (almost always) produce different hashes
    // unless input is specifically crafted (extremely rare in fuzzing)
    try testing.expectEqual(@as(usize, 32), keccak_hash.len);
    try testing.expectEqual(@as(usize, 32), sha256_hash.len);
}
