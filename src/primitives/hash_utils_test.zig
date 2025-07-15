const std = @import("std");
const testing = std.testing;
const hash = @import("hash_utils.zig");

// Test basic hash operations
test "create zero hash" {
    const zero_hash = hash.zero();
    try testing.expect(hash.is_zero(zero_hash));
    try testing.expectEqualSlices(u8, &hash.ZERO_HASH, &zero_hash);
}

test "hash from bytes" {
    const test_bytes = [_]u8{ 0x12, 0x34 } ++ [_]u8{0} ** 30;
    const hash_from_bytes = hash.from_bytes(test_bytes);
    try testing.expectEqual(test_bytes, hash_from_bytes);
}

test "hash from slice" {
    const slice: []const u8 = &[_]u8{0xde, 0xad, 0xbe, 0xef} ++ [_]u8{0} ** 28;
    const hash_from_slice = try hash.from_slice(slice);
    try testing.expectEqualSlices(u8, slice, &hash_from_slice);
}

test "hash from slice invalid length" {
    const slice: []const u8 = &[_]u8{0xde, 0xad, 0xbe, 0xef}; // Only 4 bytes
    const result = hash.from_slice(slice);
    try testing.expectError(error.InvalidLength, result);
}

// Test hex conversion
test "hash from hex" {
    const hex_str = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    const hash_from_hex = try hash.from_hex(hex_str);
    
    const expected_bytes = [_]u8{
        0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef,
        0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef,
        0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef,
        0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef,
    };
    try testing.expectEqual(expected_bytes, hash_from_hex);
}

test "hash to hex" {
    const test_hash = hash.from_bytes([_]u8{
        0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef,
        0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef,
        0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef,
        0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef,
    });
    
    const hex_result = hash.to_hex(test_hash);
    const expected = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    try testing.expectEqualStrings(expected, &hex_result);
}

test "hash to hex uppercase" {
    const test_hash = hash.from_bytes([_]u8{
        0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef,
        0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef,
        0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef,
        0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef,
    });
    
    const hex_result = hash.to_hex_upper(test_hash);
    const expected = "0x1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF";
    try testing.expectEqualStrings(expected, &hex_result);
}

// Test keccak256 hashing
test "keccak256 empty string" {
    const empty_hash = hash.keccak256("");
    try testing.expectEqual(hash.EMPTY_KECCAK256, empty_hash);
    try testing.expectEqual(hash.keccak256_empty(), empty_hash);
}

test "keccak256 known values" {
    // Test "hello" hash
    const hello_hash = hash.keccak256("hello");
    const expected_hello = try hash.from_hex("0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8");
    try testing.expectEqual(expected_hello, hello_hash);
    
    // Test "Hello World!"
    const hello_world_hash = hash.keccak256("Hello World!");
    const expected_hw_bytes = [_]u8{
        0x3e, 0xa2, 0xf1, 0xd0, 0xab, 0xf3, 0xfc, 0x66,
        0xcf, 0x29, 0xee, 0xbb, 0x70, 0xcb, 0xd4, 0xe7,
        0xfe, 0x76, 0x2e, 0xf8, 0xa0, 0x9b, 0xcc, 0x06,
        0xc8, 0xed, 0xf6, 0x41, 0x23, 0x0a, 0xfe, 0xc0,
    };
    try testing.expectEqual(expected_hw_bytes, hello_world_hash);
}

test "keccak256 with bytes input" {
    const bytes = [_]u8{ 0xde, 0xad, 0xbe, 0xef };
    const bytes_hash = hash.keccak256(&bytes);
    
    // Should produce consistent hash
    const bytes_hash2 = hash.keccak256(&bytes);
    try testing.expectEqual(bytes_hash, bytes_hash2);
}

// Test EIP-191 message hashing
test "eip191 hash message" {
    const allocator = testing.allocator;
    
    const message = "Hello, Ethereum!";
    const hashed = try hash.eip191_hash_message(message, allocator);
    
    // The hash should not be zero
    try testing.expect(!hash.is_zero(hashed));
    
    // Should be deterministic
    const hashed2 = try hash.eip191_hash_message(message, allocator);
    try testing.expectEqual(hashed, hashed2);
}

test "eip191 hash message with different lengths" {
    const allocator = testing.allocator;
    
    // Test empty message
    const empty_hash = try hash.eip191_hash_message("", allocator);
    try testing.expect(!hash.is_zero(empty_hash));
    
    // Test longer message
    const long_message = "This is a much longer message that should still hash correctly";
    const long_hash = try hash.eip191_hash_message(long_message, allocator);
    try testing.expect(!hash.is_zero(long_hash));
    
    // Different messages should produce different hashes
    try testing.expect(!hash.equal(empty_hash, long_hash));
}

// Test selector creation
test "selector from signature" {
    // Test standard ERC20 transfer function
    const transfer_sig = "transfer(address,uint256)";
    const selector = hash.selector_from_signature(transfer_sig);
    const expected_selector = [4]u8{ 0xa9, 0x05, 0x9c, 0xbb };
    try testing.expectEqual(expected_selector, selector);
    
    // Test balanceOf function
    const balance_sig = "balanceOf(address)";
    const balance_selector = hash.selector_from_signature(balance_sig);
    const expected_balance = [4]u8{ 0x70, 0xa0, 0x82, 0x31 };
    try testing.expectEqual(expected_balance, balance_selector);
}

// Test hash comparison
test "hash comparison and ordering" {
    const hash1 = hash.from_u256(0x1234);
    const hash2 = hash.from_u256(0x5678);
    const hash3 = hash.from_u256(0x1234); // Same as hash1
    
    // Test equality
    try testing.expect(hash.equal(hash1, hash3));
    try testing.expect(!hash.equal(hash1, hash2));
    
    // Test comparison
    try testing.expect(hash.less_than(hash1, hash2));
    try testing.expect(!hash.less_than(hash2, hash1));
    try testing.expect(!hash.less_than(hash1, hash3)); // Equal values
    
    try testing.expect(hash.greater_than(hash2, hash1));
    try testing.expect(!hash.greater_than(hash1, hash2));
    
    // Test compare function
    try testing.expectEqual(std.math.Order.lt, hash.compare(hash1, hash2));
    try testing.expectEqual(std.math.Order.gt, hash.compare(hash2, hash1));
    try testing.expectEqual(std.math.Order.eq, hash.compare(hash1, hash3));
}

// Test hash arithmetic operations
test "hash bitwise operations" {
    const hash1 = hash.from_u256(0x1234);
    const hash2 = hash.from_u256(0x5678);
    
    // Test XOR
    const xor_result = hash.xor(hash1, hash2);
    const expected_xor = hash.from_u256(0x1234 ^ 0x5678);
    try testing.expectEqual(expected_xor, xor_result);
    
    // Test AND
    const and_result = hash.bit_and(hash1, hash2);
    const expected_and = hash.from_u256(0x1234 & 0x5678);
    try testing.expectEqual(expected_and, and_result);
    
    // Test OR
    const or_result = hash.bit_or(hash1, hash2);
    const expected_or = hash.from_u256(0x1234 | 0x5678);
    try testing.expectEqual(expected_or, or_result);
    
    // Test NOT
    const not_result = hash.bit_not(hash1);
    const value_1234: u256 = 0x1234;
    const expected_not = hash.from_u256(~value_1234);
    try testing.expectEqual(expected_not, not_result);
}

// Test u256 conversion
test "hash to/from u256 conversion" {
    const test_values = [_]u256{
        0,
        1,
        0x123456789abcdef0,
        std.math.maxInt(u256),
    };
    
    for (test_values) |value| {
        const hash_val = hash.from_u256(value);
        const converted_back = hash.to_u256(hash_val);
        try testing.expectEqual(value, converted_back);
    }
}

// Test edge cases
test "hash invalid hex format" {
    // Missing 0x prefix
    const result1 = hash.from_hex("1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef");
    try testing.expectError(error.InvalidHexFormat, result1);
    
    // Invalid length
    const result2 = hash.from_hex("0x1234");
    try testing.expectError(error.InvalidHexLength, result2);
    
    // Invalid characters
    const result3 = hash.from_hex("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdeg");
    try testing.expectError(error.InvalidHexString, result3);
}

// Test comptime hex conversion
test "hash from hex comptime" {
    const comptime_hash = hash.from_hex_comptime("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef");
    const expected_bytes = [_]u8{
        0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef,
        0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef,
        0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef,
        0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef,
    };
    try testing.expectEqual(expected_bytes, comptime_hash);
}

// Test known blockchain hashes
test "well known hash values" {
    // Test that constants are correct
    try testing.expectEqual(@as(usize, 32), hash.ZERO_HASH.len);
    try testing.expect(hash.is_zero(hash.ZERO_HASH));
    
    // Empty keccak256 should be a specific value
    const empty_keccak = hash.keccak256("");
    try testing.expectEqual(hash.EMPTY_KECCAK256, empty_keccak);
    
    // Verify the constant matches expected value
    const expected_empty = [32]u8{
        0xc5, 0xd2, 0x46, 0x01, 0x86, 0xf7, 0x23, 0x3c,
        0x92, 0x7e, 0x7d, 0xb2, 0xdc, 0xc7, 0x03, 0xc0,
        0xe5, 0x00, 0xb6, 0x53, 0xca, 0x82, 0x27, 0x3b,
        0x7b, 0xfa, 0xd8, 0x04, 0x5d, 0x85, 0xa4, 0x70,
    };
    try testing.expectEqual(expected_empty, hash.EMPTY_KECCAK256);
}