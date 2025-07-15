const std = @import("std");
const testing = std.testing;
const Hex = @import("hex.zig");

// Test hex validation
test "is_valid_hex" {
    // Valid hex strings
    try testing.expect(Hex.is_valid_hex("0x"));
    try testing.expect(Hex.is_valid_hex("0x0"));
    try testing.expect(Hex.is_valid_hex("0x00"));
    try testing.expect(Hex.is_valid_hex("0x0123456789abcdef"));
    try testing.expect(Hex.is_valid_hex("0x0123456789ABCDEF"));
    try testing.expect(Hex.is_valid_hex("0xdeadbeef"));
    
    // Invalid hex strings
    try testing.expect(!Hex.is_valid_hex(""));
    try testing.expect(!Hex.is_valid_hex("0"));
    try testing.expect(!Hex.is_valid_hex("00"));
    try testing.expect(!Hex.is_valid_hex("0xg"));
    try testing.expect(!Hex.is_valid_hex("0x0123456789abcdefg"));
    try testing.expect(!Hex.is_valid_hex("0x "));
    try testing.expect(!Hex.is_valid_hex(" 0x00"));
    try testing.expect(!Hex.is_valid_hex("0x00 "));
}

// Test from bytes
test "from_bytes basic" {
    const allocator = testing.allocator;
    
    // Empty bytes
    const empty = try Hex.from_bytes(allocator, &[_]u8{});
    defer allocator.free(empty);
    try testing.expectEqualStrings("0x", empty);
    
    // Single byte
    const single = try Hex.from_bytes(allocator, &[_]u8{0x61});
    defer allocator.free(single);
    try testing.expectEqualStrings("0x61", single);
    
    // Multiple bytes
    const multiple = try Hex.from_bytes(allocator, &[_]u8{ 0x61, 0x62, 0x63 });
    defer allocator.free(multiple);
    try testing.expectEqualStrings("0x616263", multiple);
    
    // "Hello World!"
    const hello = try Hex.from_bytes(allocator, "Hello World!");
    defer allocator.free(hello);
    try testing.expectEqualStrings("0x48656c6c6f20576f726c6421", hello);
}

test "from_bytes with specific case" {
    const allocator = testing.allocator;
    
    const bytes = [_]u8{ 0xde, 0xad, 0xbe, 0xef };
    
    // Lowercase (default)
    const lower = try Hex.from_bytes(allocator, &bytes);
    defer allocator.free(lower);
    try testing.expectEqualStrings("0xdeadbeef", lower);
    
    // Uppercase
    const upper = try Hex.from_bytes_upper(allocator, &bytes);
    defer allocator.free(upper);
    try testing.expectEqualStrings("0xDEADBEEF", upper);
}

// Test to bytes
test "to_bytes basic" {
    const allocator = testing.allocator;
    
    // Empty hex
    const empty = try Hex.to_bytes(allocator, "0x");
    defer allocator.free(empty);
    try testing.expectEqual(@as(usize, 0), empty.len);
    
    // Single byte
    const single = try Hex.to_bytes(allocator, "0x61");
    defer allocator.free(single);
    try testing.expectEqualSlices(u8, &[_]u8{0x61}, single);
    
    // Multiple bytes
    const multiple = try Hex.to_bytes(allocator, "0x616263");
    defer allocator.free(multiple);
    try testing.expectEqualSlices(u8, &[_]u8{ 0x61, 0x62, 0x63 }, multiple);
    
    // Mixed case
    const mixed = try Hex.to_bytes(allocator, "0xDeAdBeEf");
    defer allocator.free(mixed);
    try testing.expectEqualSlices(u8, &[_]u8{ 0xde, 0xad, 0xbe, 0xef }, mixed);
}

test "to_bytes odd length" {
    const allocator = testing.allocator;
    
    // Odd length should pad with leading zero
    const odd = try Hex.to_bytes(allocator, "0x1");
    defer allocator.free(odd);
    try testing.expectEqualSlices(u8, &[_]u8{0x01}, odd);
    
    const odd2 = try Hex.to_bytes(allocator, "0x123");
    defer allocator.free(odd2);
    try testing.expectEqualSlices(u8, &[_]u8{ 0x01, 0x23 }, odd2);
}

test "to_bytes invalid hex" {
    const allocator = testing.allocator;
    
    // Missing 0x prefix
    const result1 = Hex.to_bytes(allocator, "deadbeef");
    try testing.expectError(Hex.HexError.MissingPrefix, result1);
    
    // Invalid character
    const result2 = Hex.to_bytes(allocator, "0xdeadbeeg");
    try testing.expectError(error.InvalidCharacter, result2);
}

// Test from/to conversions with various types
test "from_u256" {
    const allocator = testing.allocator;
    
    // Zero
    const zero = try Hex.from_u256(allocator, 0);
    defer allocator.free(zero);
    try testing.expectEqualStrings("0x0", zero);
    
    // Small number
    const small = try Hex.from_u256(allocator, 69420);
    defer allocator.free(small);
    try testing.expectEqualStrings("0x10f2c", small);
    
    // Large number
    const large = try Hex.from_u256(allocator, 0xdeadbeef);
    defer allocator.free(large);
    try testing.expectEqualStrings("0xdeadbeef", large);
    
    // Max u256
    const max = try Hex.from_u256(allocator, std.math.maxInt(u256));
    defer allocator.free(max);
    try testing.expectEqualStrings("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff", max);
}

test "to_u256" {
    // Zero
    const zero = try Hex.to_u256("0x0");
    try testing.expectEqual(@as(u256, 0), zero);
    
    // Small number
    const small = try Hex.to_u256("0x10f2c");
    try testing.expectEqual(@as(u256, 69420), small);
    
    // Large number
    const large = try Hex.to_u256("0xdeadbeef");
    try testing.expectEqual(@as(u256, 0xdeadbeef), large);
    
    // Max u256
    const max = try Hex.to_u256("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
    try testing.expectEqual(std.math.maxInt(u256), max);
}

test "to_u256 overflow" {
    // This would overflow u256
    const result = Hex.to_u256("0x10000000000000000000000000000000000000000000000000000000000000000");
    try testing.expectError(Hex.HexError.Overflow, result);
}

// Test slice operations
test "slice hex string" {
    const allocator = testing.allocator;
    
    // Slice from beginning
    const slice1 = try Hex.slice(allocator, "0xdeadbeef", 0, 4);
    defer allocator.free(slice1);
    try testing.expectEqualStrings("0xdead", slice1);
    
    // Slice from middle
    const slice2 = try Hex.slice(allocator, "0xdeadbeefcafe", 4, 8);
    defer allocator.free(slice2);
    try testing.expectEqualStrings("0xbeef", slice2);
    
    // Slice to end
    const slice3 = try Hex.slice(allocator, "0xdeadbeef", 4, null);
    defer allocator.free(slice3);
    try testing.expectEqualStrings("0xbeef", slice3);
}

test "slice bounds checking" {
    const allocator = testing.allocator;
    
    // Start beyond length
    const result1 = Hex.slice(allocator, "0xdead", 10, null);
    try testing.expectError(Hex.HexError.SliceOutOfBounds, result1);
    
    // End before start
    const result2 = Hex.slice(allocator, "0xdead", 4, 2);
    try testing.expectError(Hex.HexError.SliceOutOfBounds, result2);
}

// Test concatenation
test "concat hex strings" {
    const allocator = testing.allocator;
    
    const hex_strings = [_][]const u8{ "0x00", "0x01", "0x02" };
    const concatenated = try Hex.concat(allocator, &hex_strings);
    defer allocator.free(concatenated);
    try testing.expectEqualStrings("0x000102", concatenated);
    
    // With mixed lengths
    const mixed = [_][]const u8{ "0x0", "0x1", "0x69", "0x420" };
    const mixed_concat = try Hex.concat(allocator, &mixed);
    defer allocator.free(mixed_concat);
    try testing.expectEqualStrings("0x0169420", mixed_concat);
}

test "concat with padding" {
    const allocator = testing.allocator;
    
    // Each item padded to 32 bytes
    const hex_strings = [_][]const u8{ "0x01", "0x02", "0x03" };
    const padded = try Hex.concat_padded(allocator, &hex_strings, 32);
    defer allocator.free(padded);
    
    const expected = "0x" ++
        "0000000000000000000000000000000000000000000000000000000000000001" ++
        "0000000000000000000000000000000000000000000000000000000000000002" ++
        "0000000000000000000000000000000000000000000000000000000000000003";
    try testing.expectEqualStrings(expected, padded);
}

// Test padding
test "pad hex left" {
    const allocator = testing.allocator;
    
    const padded = try Hex.pad_left(allocator, "0x123", 4);
    defer allocator.free(padded);
    try testing.expectEqualStrings("0x0123", padded);
    
    const padded2 = try Hex.pad_left(allocator, "0x1", 8);
    defer allocator.free(padded2);
    try testing.expectEqualStrings("0x00000001", padded2);
}

test "pad hex right" {
    const allocator = testing.allocator;
    
    const padded = try Hex.pad_right(allocator, "0x123", 4);
    defer allocator.free(padded);
    try testing.expectEqualStrings("0x1230", padded);
    
    const padded2 = try Hex.pad_right(allocator, "0x1", 8);
    defer allocator.free(padded2);
    try testing.expectEqualStrings("0x10000000", padded2);
}

// Test strip
test "strip leading zeros" {
    const allocator = testing.allocator;
    
    const stripped = try Hex.strip_zeros(allocator, "0x0000123");
    defer allocator.free(stripped);
    try testing.expectEqualStrings("0x123", stripped);
    
    const stripped2 = try Hex.strip_zeros(allocator, "0x00000000");
    defer allocator.free(stripped2);
    try testing.expectEqualStrings("0x0", stripped2);
    
    const no_strip = try Hex.strip_zeros(allocator, "0x123000");
    defer allocator.free(no_strip);
    try testing.expectEqualStrings("0x123000", no_strip);
}

// Test size calculation
test "hex size" {
    try testing.expectEqual(@as(usize, 0), Hex.size("0x"));
    try testing.expectEqual(@as(usize, 1), Hex.size("0x00"));
    try testing.expectEqual(@as(usize, 1), Hex.size("0x01"));
    try testing.expectEqual(@as(usize, 2), Hex.size("0x0001"));
    try testing.expectEqual(@as(usize, 4), Hex.size("0xdeadbeef"));
    try testing.expectEqual(@as(usize, 32), Hex.size("0x0000000000000000000000000000000000000000000000000000000000000000"));
}

// Test comparison
test "hex equality" {
    try testing.expect(Hex.equal("0x01", "0x1"));
    try testing.expect(Hex.equal("0x00", "0x0"));
    try testing.expect(Hex.equal("0xdeadbeef", "0xdeadbeef"));
    try testing.expect(Hex.equal("0xDeAdBeEf", "0xdeadbeef")); // Case insensitive
    
    try testing.expect(!Hex.equal("0x01", "0x02"));
    try testing.expect(!Hex.equal("0x1", "0x10"));
}

// Test common patterns
test "is zero" {
    try testing.expect(Hex.is_zero("0x"));
    try testing.expect(Hex.is_zero("0x0"));
    try testing.expect(Hex.is_zero("0x00"));
    try testing.expect(Hex.is_zero("0x0000"));
    
    try testing.expect(!Hex.is_zero("0x1"));
    try testing.expect(!Hex.is_zero("0x01"));
    try testing.expect(!Hex.is_zero("0x00001"));
}

// Test edge cases
test "empty string handling" {
    const allocator = testing.allocator;
    
    const result = Hex.to_bytes(allocator, "");
    try testing.expectError(Hex.HexError.MissingPrefix, result);
}

test "only prefix" {
    const allocator = testing.allocator;
    
    const bytes = try Hex.to_bytes(allocator, "0x");
    defer allocator.free(bytes);
    try testing.expectEqual(@as(usize, 0), bytes.len);
}