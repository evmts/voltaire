//! Selector - 4-byte function/error selector for Ethereum ABI
//!
//! A Selector is the first 4 bytes of the keccak256 hash of a function
//! or error signature. Used to identify which function is being called
//! in EVM calldata.
//!
//! ## Usage
//! ```zig
//! const Selector = @import("primitives").Selector;
//!
//! // From function signature
//! const sel = Selector.fromSignature("transfer(address,uint256)");
//! // sel = [0xa9, 0x05, 0x9c, 0xbb]
//!
//! // From hex string
//! const sel2 = try Selector.fromHex("0xa9059cbb");
//!
//! // Convert to hex
//! const hex = Selector.toHex(sel); // "0xa9059cbb"
//! ```

const std = @import("std");
const crypto = std.crypto;

/// Selector size in bytes (4 bytes = 32 bits)
pub const SIZE = 4;

/// Selector type - 4 bytes
pub const Selector = [SIZE]u8;

/// Zero selector constant
pub const ZERO: Selector = [_]u8{0} ** SIZE;

// ============================================================================
// Constructors
// ============================================================================

/// Create Selector from function/event/error signature string.
/// Computes keccak256(signature) and takes first 4 bytes.
pub fn fromSignature(signature: []const u8) Selector {
    var hash: [32]u8 = undefined;
    crypto.hash.sha3.Keccak256.hash(signature, &hash, .{});
    return hash[0..4].*;
}

test "fromSignature - transfer" {
    const sel = fromSignature("transfer(address,uint256)");
    const expected = [4]u8{ 0xa9, 0x05, 0x9c, 0xbb };
    try std.testing.expectEqual(expected, sel);
}

test "fromSignature - approve" {
    const sel = fromSignature("approve(address,uint256)");
    const expected = [4]u8{ 0x09, 0x5e, 0xa7, 0xb3 };
    try std.testing.expectEqual(expected, sel);
}

test "fromSignature - balanceOf" {
    const sel = fromSignature("balanceOf(address)");
    const expected = [4]u8{ 0x70, 0xa0, 0x82, 0x31 };
    try std.testing.expectEqual(expected, sel);
}

test "fromSignature - totalSupply" {
    const sel = fromSignature("totalSupply()");
    const expected = [4]u8{ 0x18, 0x16, 0x0d, 0xdd };
    try std.testing.expectEqual(expected, sel);
}

test "fromSignature - swap" {
    const sel = fromSignature("swap(uint256,uint256,address,bytes)");
    const expected = [4]u8{ 0x02, 0x2c, 0x0d, 0x9f };
    try std.testing.expectEqual(expected, sel);
}

/// Create Selector from raw bytes. Input must be exactly 4 bytes.
pub fn fromBytes(bytes: []const u8) !Selector {
    if (bytes.len != SIZE) {
        return error.InvalidSelectorLength;
    }
    var result: Selector = undefined;
    @memcpy(&result, bytes);
    return result;
}

test "fromBytes - valid 4 bytes" {
    const bytes = [_]u8{ 0xa9, 0x05, 0x9c, 0xbb };
    const sel = try fromBytes(&bytes);
    try std.testing.expectEqual(bytes, sel);
}

test "fromBytes - invalid length" {
    const bytes = [_]u8{ 0xa9, 0x05 };
    try std.testing.expectError(error.InvalidSelectorLength, fromBytes(&bytes));
}

/// Create Selector from hex string (with 0x prefix).
pub fn fromHex(hex: []const u8) !Selector {
    if (hex.len < 2 or hex[0] != '0' or (hex[1] != 'x' and hex[1] != 'X')) {
        return error.InvalidHexFormat;
    }

    const hex_digits = hex[2..];
    if (hex_digits.len != SIZE * 2) {
        return error.InvalidSelectorHexLength;
    }

    var result: Selector = undefined;
    _ = std.fmt.hexToBytes(&result, hex_digits) catch return error.InvalidHexCharacter;
    return result;
}

test "fromHex - valid hex" {
    const sel = try fromHex("0xa9059cbb");
    const expected = [4]u8{ 0xa9, 0x05, 0x9c, 0xbb };
    try std.testing.expectEqual(expected, sel);
}

test "fromHex - uppercase" {
    const sel = try fromHex("0xA9059CBB");
    const expected = [4]u8{ 0xa9, 0x05, 0x9c, 0xbb };
    try std.testing.expectEqual(expected, sel);
}

test "fromHex - missing prefix" {
    try std.testing.expectError(error.InvalidHexFormat, fromHex("a9059cbb"));
}

test "fromHex - invalid length" {
    try std.testing.expectError(error.InvalidSelectorHexLength, fromHex("0xa9"));
}

test "fromHex - invalid chars" {
    try std.testing.expectError(error.InvalidHexCharacter, fromHex("0xa905ggbb"));
}

/// Generic constructor - accepts bytes or hex string
pub fn from(value: anytype) !Selector {
    const T = @TypeOf(value);
    if (T == Selector) return value;

    if (T == []const u8 or T == []u8) {
        // Check if it's hex (starts with 0x)
        if (value.len >= 2 and value[0] == '0' and (value[1] == 'x' or value[1] == 'X')) {
            return fromHex(value);
        }
        // Try as raw bytes
        return fromBytes(value);
    }

    // Handle pointer to fixed-size array (including string literals)
    const info = @typeInfo(T);
    if (info == .pointer) {
        const child = info.pointer.child;
        const child_info = @typeInfo(child);
        if (child_info == .array) {
            const slice: []const u8 = value;
            if (slice.len >= 2 and slice[0] == '0' and (slice[1] == 'x' or slice[1] == 'X')) {
                return fromHex(slice);
            }
            return fromBytes(slice);
        }
    }

    if (T == *const [SIZE]u8 or T == *[SIZE]u8) {
        return value.*;
    }

    if (T == [SIZE]u8) {
        return value;
    }

    @compileError("Unsupported type for Selector.from: " ++ @typeName(T));
}

test "from - Selector passthrough" {
    const sel: Selector = [_]u8{ 0xa9, 0x05, 0x9c, 0xbb };
    const result = try from(sel);
    try std.testing.expectEqual(sel, result);
}

test "from - hex string" {
    const result = try from("0xa9059cbb");
    const expected = [4]u8{ 0xa9, 0x05, 0x9c, 0xbb };
    try std.testing.expectEqual(expected, result);
}

test "from - raw bytes" {
    const bytes = [_]u8{ 0xa9, 0x05, 0x9c, 0xbb };
    const result = try from(bytes[0..]);
    try std.testing.expectEqual(bytes, result);
}

// ============================================================================
// Converters
// ============================================================================

/// Convert Selector to bytes slice
pub fn toBytes(sel: *const Selector) []const u8 {
    return sel[0..];
}

test "toBytes - returns correct slice" {
    const sel: Selector = [_]u8{ 0xa9, 0x05, 0x9c, 0xbb };
    const bytes = toBytes(&sel);
    try std.testing.expectEqual(@as(usize, SIZE), bytes.len);
    try std.testing.expectEqual(@as(u8, 0xa9), bytes[0]);
}

/// Convert Selector to hex string with 0x prefix (fixed-size, no allocation)
pub fn toHex(sel: Selector) [2 + SIZE * 2]u8 {
    var result: [2 + SIZE * 2]u8 = undefined;
    result[0] = '0';
    result[1] = 'x';
    const hex = std.fmt.bytesToHex(&sel, .lower);
    @memcpy(result[2..], &hex);
    return result;
}

test "toHex - correct format" {
    const sel = [4]u8{ 0xa9, 0x05, 0x9c, 0xbb };
    const hex = toHex(sel);
    try std.testing.expectEqualStrings("0xa9059cbb", &hex);
}

test "toHex - zero selector" {
    const sel = ZERO;
    const hex = toHex(sel);
    try std.testing.expectEqualStrings("0x00000000", &hex);
}

/// Alias for toHex
pub fn toString(sel: Selector) [2 + SIZE * 2]u8 {
    return toHex(sel);
}

// ============================================================================
// Validation
// ============================================================================

/// Compare two selectors for equality
pub fn equals(a: Selector, b: Selector) bool {
    return std.mem.eql(u8, &a, &b);
}

test "equals - same selector" {
    const sel = fromSignature("transfer(address,uint256)");
    try std.testing.expect(equals(sel, sel));
}

test "equals - identical selectors" {
    const sel1 = fromSignature("transfer(address,uint256)");
    const sel2 = try fromHex("0xa9059cbb");
    try std.testing.expect(equals(sel1, sel2));
}

test "equals - different selectors" {
    const sel1 = fromSignature("transfer(address,uint256)");
    const sel2 = fromSignature("approve(address,uint256)");
    try std.testing.expect(!equals(sel1, sel2));
}

/// Check if selector is all zeros
pub fn isZero(sel: Selector) bool {
    return equals(sel, ZERO);
}

test "isZero - zero selector" {
    try std.testing.expect(isZero(ZERO));
}

test "isZero - non-zero selector" {
    const sel = fromSignature("transfer(address,uint256)");
    try std.testing.expect(!isZero(sel));
}

/// Check if a hex string is valid selector format
pub fn isValidHex(hex: []const u8) bool {
    if (hex.len != SIZE * 2 + 2) return false;
    if (hex[0] != '0' or (hex[1] != 'x' and hex[1] != 'X')) return false;

    for (hex[2..]) |c| {
        if (!std.ascii.isHex(c)) return false;
    }

    return true;
}

test "isValidHex - valid" {
    try std.testing.expect(isValidHex("0xa9059cbb"));
    try std.testing.expect(isValidHex("0xA9059CBB"));
}

test "isValidHex - invalid" {
    try std.testing.expect(!isValidHex("a9059cbb")); // missing 0x
    try std.testing.expect(!isValidHex("0xa905")); // too short
    try std.testing.expect(!isValidHex("0xa9059cbbaa")); // too long
    try std.testing.expect(!isValidHex("0xa905ggbb")); // invalid chars
}

// ============================================================================
// Manipulation
// ============================================================================

/// Create a copy of the selector
pub fn clone(sel: Selector) Selector {
    return sel;
}

test "clone - creates copy" {
    const original = fromSignature("transfer(address,uint256)");
    const copy = clone(original);
    try std.testing.expect(equals(original, copy));
}

/// Convert selector to u32 (big-endian)
pub fn toU32(sel: Selector) u32 {
    return std.mem.readInt(u32, &sel, .big);
}

test "toU32 - correct conversion" {
    const sel = [4]u8{ 0xa9, 0x05, 0x9c, 0xbb };
    try std.testing.expectEqual(@as(u32, 0xa9059cbb), toU32(sel));
}

/// Create selector from u32 (big-endian)
pub fn fromU32(value: u32) Selector {
    var sel: Selector = undefined;
    std.mem.writeInt(u32, &sel, value, .big);
    return sel;
}

test "fromU32 - correct conversion" {
    const sel = fromU32(0xa9059cbb);
    const expected = [4]u8{ 0xa9, 0x05, 0x9c, 0xbb };
    try std.testing.expectEqual(expected, sel);
}

test "u32 round-trip" {
    const original: u32 = 0xdeadbeef;
    const sel = fromU32(original);
    const back = toU32(sel);
    try std.testing.expectEqual(original, back);
}
