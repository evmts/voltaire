const std = @import("std");
const crypto = std.crypto;
const testing = std.testing;

// Hash types
pub const Hash = [32]u8;
pub const B256 = Hash;
pub const BlockHash = Hash;
pub const TxHash = Hash;
pub const StorageKey = Hash;
pub const StorageValue = Hash;
pub const Selector = [4]u8;

// Keccak256 implementation
const Keccak256 = crypto.hash.sha3.Keccak256;

// Constants
pub const ZERO_HASH: Hash = [_]u8{0} ** 32;
pub const EMPTY_KECCAK256: Hash = [32]u8{
    0xc5, 0xd2, 0x46, 0x01, 0x86, 0xf7, 0x23, 0x3c,
    0x92, 0x7e, 0x7d, 0xb2, 0xdc, 0xc7, 0x03, 0xc0,
    0xe5, 0x00, 0xb6, 0x53, 0xca, 0x82, 0x27, 0x3b,
    0x7b, 0xfa, 0xd8, 0x04, 0x5d, 0x85, 0xa4, 0x70,
};

// Hash creation functions
pub fn zero() Hash {
    return ZERO_HASH;
}

pub fn from_bytes(bytes: [32]u8) Hash {
    return bytes;
}

pub fn from_slice(slice: []const u8) !Hash {
    if (slice.len != 32) return error.InvalidLength;
    var hash: Hash = undefined;
    @memcpy(&hash, slice);
    return hash;
}

pub fn from_hex(hex: []const u8) !Hash {
    if (hex.len < 2 or !std.mem.eql(u8, hex[0..2], "0x"))
        return error.InvalidHexFormat;

    if (hex.len != 66) return error.InvalidHexLength; // 0x + 64 hex chars

    var hash: Hash = undefined;
    _ = std.fmt.hexToBytes(&hash, hex[2..]) catch return error.InvalidHexString;
    return hash;
}

pub fn from_hex_comptime(comptime hex: []const u8) Hash {
    if (hex.len < 2 or !std.mem.eql(u8, hex[0..2], "0x"))
        @compileError("hex must start with '0x'");

    if (hex.len != 66) @compileError("hex must be 66 characters long");

    var hash: Hash = undefined;
    _ = std.fmt.hexToBytes(&hash, hex[2..]) catch @compileError("invalid hex string");
    return hash;
}

// Hash utility functions
pub fn to_hex(hash: Hash) [66]u8 {
    var result: [66]u8 = undefined;
    result[0] = '0';
    result[1] = 'x';
    const hex = std.fmt.bytesToHex(&hash, .lower);
    @memcpy(result[2..], &hex);
    return result;
}

pub fn to_hex_upper(hash: Hash) [66]u8 {
    var result: [66]u8 = undefined;
    result[0] = '0';
    result[1] = 'x';
    const hex = std.fmt.bytesToHex(&hash, .upper);
    @memcpy(result[2..], &hex);
    return result;
}

pub fn is_zero(hash: Hash) bool {
    return std.mem.eql(u8, &hash, &ZERO_HASH);
}

pub fn equal(a: Hash, b: Hash) bool {
    return std.mem.eql(u8, &a, &b);
}

// Keccak256 hashing functions
pub fn keccak256(data: []const u8) Hash {
    var hash: Hash = undefined;
    Keccak256.hash(data, &hash, .{});
    return hash;
}

pub fn keccak256_empty() Hash {
    return EMPTY_KECCAK256;
}

// EIP-191 message hashing
pub fn eip191_hash_message(message: []const u8, allocator: std.mem.Allocator) !Hash {
    const prefix = "\x19Ethereum Signed Message:\n";
    const length_str = try std.fmt.allocPrint(allocator, "{d}", .{message.len});
    defer allocator.free(length_str);

    const total_len = prefix.len + length_str.len + message.len;
    const full_message = try allocator.alloc(u8, total_len);
    defer allocator.free(full_message);

    @memcpy(full_message[0..prefix.len], prefix);
    @memcpy(full_message[prefix.len .. prefix.len + length_str.len], length_str);
    @memcpy(full_message[prefix.len + length_str.len ..], message);

    return keccak256(full_message);
}

// Selector creation (for function signatures)
pub fn selector_from_signature(signature: []const u8) Selector {
    const hash = keccak256(signature);
    return hash[0..4].*;
}

// Hash comparison and ordering
pub fn compare(a: Hash, b: Hash) std.math.Order {
    return std.mem.order(u8, &a, &b);
}

pub fn less_than(a: Hash, b: Hash) bool {
    return compare(a, b) == .lt;
}

pub fn greater_than(a: Hash, b: Hash) bool {
    return compare(a, b) == .gt;
}

// Hash arithmetic (for Merkle tree operations)
pub fn xor(a: Hash, b: Hash) Hash {
    var result: Hash = undefined;
    for (0..32) |i| {
        result[i] = a[i] ^ b[i];
    }
    return result;
}

pub fn bit_and(a: Hash, b: Hash) Hash {
    var result: Hash = undefined;
    for (0..32) |i| {
        result[i] = a[i] & b[i];
    }
    return result;
}

pub fn bit_or(a: Hash, b: Hash) Hash {
    var result: Hash = undefined;
    for (0..32) |i| {
        result[i] = a[i] | b[i];
    }
    return result;
}

pub fn bit_not(a: Hash) Hash {
    var result: Hash = undefined;
    for (0..32) |i| {
        result[i] = ~a[i];
    }
    return result;
}

// Hash to/from integer conversion
pub fn to_u256(hash: Hash) u256 {
    var result: u256 = 0;
    for (hash) |byte| {
        result = (result << 8) | byte;
    }
    return result;
}

pub fn from_u256(value: u256) Hash {
    var hash: Hash = undefined;
    var v = value;
    for (0..32) |i| {
        hash[31 - i] = @truncate(v & 0xFF);
        v >>= 8;
    }
    return hash;
}

// Tests
test "hash creation and conversion" {
    // Test zero hash
    const zero_hash = zero();
    try testing.expect(is_zero(zero_hash));

    // Test from_bytes
    const test_bytes = [_]u8{ 0x12, 0x34 } ++ [_]u8{0} ** 30;
    const hash_from_bytes = from_bytes(test_bytes);
    try testing.expectEqual(test_bytes, hash_from_bytes);

    // Test hex conversion
    const hex_str = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    const hash_from_hex = try from_hex(hex_str);
    const hex_result = to_hex(hash_from_hex);
    try testing.expectEqualStrings(hex_str, &hex_result);
}

test "keccak256 hashing" {
    // Test empty string hash
    const empty_hash = keccak256("");
    try testing.expectEqual(EMPTY_KECCAK256, empty_hash);

    // Test known hash
    const hello_hash = keccak256("hello");
    const expected_hex = "0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8";
    const expected_hash = try from_hex(expected_hex);
    try testing.expectEqual(expected_hash, hello_hash);
}

test "hash comparison and arithmetic" {
    const hash1 = from_u256(0x1234);
    const hash2 = from_u256(0x5678);

    // Test comparison
    try testing.expect(less_than(hash1, hash2));
    try testing.expect(greater_than(hash2, hash1));
    try testing.expect(!equal(hash1, hash2));

    // Test XOR
    const xor_result = xor(hash1, hash2);
    const expected_xor = from_u256(0x1234 ^ 0x5678);
    try testing.expectEqual(expected_xor, xor_result);
}

test "selector creation" {
    const signature = "transfer(address,uint256)";
    const selector = selector_from_signature(signature);
    const expected = [4]u8{ 0xa9, 0x05, 0x9c, 0xbb };
    try testing.expectEqual(expected, selector);
}

test "u256 conversion" {
    const value: u256 = 0x123456789abcdef0;
    const hash = from_u256(value);
    const converted_back = to_u256(hash);
    try testing.expectEqual(value, converted_back);
}

test "EIP-191 message hashing" {
    const allocator = testing.allocator;
    const message = "Hello, Ethereum!";
    const hash = try eip191_hash_message(message, allocator);

    // The hash should not be zero
    try testing.expect(!is_zero(hash));

    // Should be deterministic
    const hash2 = try eip191_hash_message(message, allocator);
    try testing.expectEqual(hash, hash2);
}
