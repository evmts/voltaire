//! ErrorSignature - 4-byte error selector for Solidity custom errors
//!
//! An ErrorSignature is the first 4 bytes of keccak256 of an error signature,
//! identical to function selectors. Used to identify custom errors in revert data.
//!
//! ## Well-known Errors
//! - `Error(string)` - 0x08c379a0 - Standard require/revert with message
//! - `Panic(uint256)` - 0x4e487b71 - Solidity panic codes
//!
//! ## Usage
//! ```zig
//! const ErrorSignature = @import("primitives").ErrorSignature;
//!
//! // From error signature
//! const sel = ErrorSignature.fromSignature("InsufficientBalance(uint256,uint256)");
//!
//! // Check for standard errors
//! if (ErrorSignature.equals(sel, ErrorSignature.ERROR)) {
//!     // Handle require/revert with message
//! }
//! ```

const std = @import("std");
const crypto = std.crypto;

/// ErrorSignature size in bytes (4 bytes = 32 bits)
pub const SIZE = 4;

/// ErrorSignature type - 4 bytes
pub const ErrorSignature = [SIZE]u8;

/// Zero error signature constant
pub const ZERO: ErrorSignature = [_]u8{0} ** SIZE;

// ============================================================================
// Well-known error signatures (precomputed)
// ============================================================================

/// Error(string) - Standard require/revert with message
/// keccak256("Error(string)")[:4] = 0x08c379a0
pub const ERROR: ErrorSignature = [_]u8{ 0x08, 0xc3, 0x79, 0xa0 };

/// Panic(uint256) - Solidity panic codes
/// keccak256("Panic(uint256)")[:4] = 0x4e487b71
pub const PANIC: ErrorSignature = [_]u8{ 0x4e, 0x48, 0x7b, 0x71 };

// ============================================================================
// Constructors
// ============================================================================

/// Create ErrorSignature from error signature string.
/// Computes keccak256(signature) and takes first 4 bytes.
pub fn fromSignature(signature: []const u8) ErrorSignature {
    var hash: [32]u8 = undefined;
    crypto.hash.sha3.Keccak256.hash(signature, &hash, .{});
    return hash[0..4].*;
}

test "fromSignature - InsufficientBalance" {
    const sel = fromSignature("InsufficientBalance(uint256,uint256)");
    try std.testing.expectEqualStrings("0xcf479181", &toHex(sel));
}

test "fromSignature - Unauthorized" {
    const sel = fromSignature("Unauthorized()");
    try std.testing.expectEqualStrings("0x82b42900", &toHex(sel));
}

test "fromSignature - Panic" {
    const sel = fromSignature("Panic(uint256)");
    try std.testing.expectEqualStrings("0x4e487b71", &toHex(sel));
}

test "fromSignature - Error" {
    const sel = fromSignature("Error(string)");
    try std.testing.expectEqualStrings("0x08c379a0", &toHex(sel));
}

test "ERROR constant" {
    const computed = fromSignature("Error(string)");
    try std.testing.expect(equals(ERROR, computed));
    try std.testing.expectEqualStrings("0x08c379a0", &toHex(ERROR));
}

test "PANIC constant" {
    const computed = fromSignature("Panic(uint256)");
    try std.testing.expect(equals(PANIC, computed));
    try std.testing.expectEqualStrings("0x4e487b71", &toHex(PANIC));
}

/// Create ErrorSignature from raw bytes. Input must be exactly 4 bytes.
pub fn fromBytes(bytes: []const u8) !ErrorSignature {
    if (bytes.len != SIZE) {
        return error.InvalidErrorSignatureLength;
    }
    var result: ErrorSignature = undefined;
    @memcpy(&result, bytes);
    return result;
}

test "fromBytes - valid 4 bytes" {
    const bytes = [_]u8{ 0xcf, 0x47, 0x91, 0x81 };
    const sel = try fromBytes(&bytes);
    try std.testing.expectEqual(bytes, sel);
}

test "fromBytes - invalid length" {
    const bytes = [_]u8{ 0xcf, 0x47 };
    try std.testing.expectError(error.InvalidErrorSignatureLength, fromBytes(&bytes));
}

/// Create ErrorSignature from hex string (with 0x prefix).
pub fn fromHex(hex: []const u8) !ErrorSignature {
    if (hex.len < 2 or hex[0] != '0' or (hex[1] != 'x' and hex[1] != 'X')) {
        return error.InvalidHexFormat;
    }

    const hex_digits = hex[2..];
    if (hex_digits.len != SIZE * 2) {
        return error.InvalidErrorSignatureHexLength;
    }

    var result: ErrorSignature = undefined;
    _ = std.fmt.hexToBytes(&result, hex_digits) catch return error.InvalidHexCharacter;
    return result;
}

test "fromHex - valid hex" {
    const sel = try fromHex("0xcf479181");
    const expected = fromSignature("InsufficientBalance(uint256,uint256)");
    try std.testing.expect(equals(sel, expected));
}

test "fromHex - missing prefix" {
    try std.testing.expectError(error.InvalidHexFormat, fromHex("cf479181"));
}

test "fromHex - invalid length" {
    try std.testing.expectError(error.InvalidErrorSignatureHexLength, fromHex("0xcf47"));
}

test "fromHex - invalid chars" {
    try std.testing.expectError(error.InvalidHexCharacter, fromHex("0xcf47ggbb"));
}

/// Generic constructor - accepts bytes or hex string
pub fn from(value: anytype) !ErrorSignature {
    const T = @TypeOf(value);
    if (T == ErrorSignature) return value;

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

    @compileError("Unsupported type for ErrorSignature.from: " ++ @typeName(T));
}

test "from - ErrorSignature passthrough" {
    const sel = fromSignature("Unauthorized()");
    const result = try from(sel);
    try std.testing.expect(equals(sel, result));
}

test "from - hex string" {
    const result = try from("0xcf479181");
    const expected = fromSignature("InsufficientBalance(uint256,uint256)");
    try std.testing.expect(equals(result, expected));
}

// ============================================================================
// Converters
// ============================================================================

/// Convert ErrorSignature to bytes slice
pub fn toBytes(sel: *const ErrorSignature) []const u8 {
    return sel[0..];
}

test "toBytes - returns correct slice" {
    const sel = fromSignature("Unauthorized()");
    const bytes = toBytes(&sel);
    try std.testing.expectEqual(@as(usize, SIZE), bytes.len);
}

/// Convert ErrorSignature to hex string with 0x prefix (fixed-size, no allocation)
pub fn toHex(sel: ErrorSignature) [2 + SIZE * 2]u8 {
    var result: [2 + SIZE * 2]u8 = undefined;
    result[0] = '0';
    result[1] = 'x';
    const hex = std.fmt.bytesToHex(&sel, .lower);
    @memcpy(result[2..], &hex);
    return result;
}

test "toHex - correct format" {
    const sel = fromSignature("InsufficientBalance(uint256,uint256)");
    const hex = toHex(sel);
    try std.testing.expectEqualStrings("0xcf479181", &hex);
}

test "toHex - zero signature" {
    const hex = toHex(ZERO);
    try std.testing.expectEqualStrings("0x00000000", &hex);
}

/// Alias for toHex
pub fn toString(sel: ErrorSignature) [2 + SIZE * 2]u8 {
    return toHex(sel);
}

/// Compute full 32-byte topic hash from error signature string.
/// This is the full keccak256 hash (not truncated to 4 bytes).
pub fn toTopic(signature: []const u8) [32]u8 {
    var hash: [32]u8 = undefined;
    crypto.hash.sha3.Keccak256.hash(signature, &hash, .{});
    return hash;
}

test "toTopic - full 32-byte hash" {
    const topic = toTopic("Error(string)");
    // Full keccak256 hash starts with selector bytes
    try std.testing.expectEqual(@as(u8, 0x08), topic[0]);
    try std.testing.expectEqual(@as(u8, 0xc3), topic[1]);
    try std.testing.expectEqual(@as(u8, 0x79), topic[2]);
    try std.testing.expectEqual(@as(u8, 0xa0), topic[3]);
    // Verify it's a proper 32-byte hash
    try std.testing.expectEqual(@as(usize, 32), topic.len);
}

// ============================================================================
// Validation
// ============================================================================

/// Compare two error signatures for equality
pub fn equals(a: ErrorSignature, b: ErrorSignature) bool {
    return std.mem.eql(u8, &a, &b);
}

test "equals - same signature" {
    const sel1 = fromSignature("Unauthorized()");
    const sel2 = fromSignature("Unauthorized()");
    try std.testing.expect(equals(sel1, sel2));
}

test "equals - different signatures" {
    const sel1 = fromSignature("Unauthorized()");
    const sel2 = fromSignature("Error(string)");
    try std.testing.expect(!equals(sel1, sel2));
}

/// Check if error signature is all zeros
pub fn isZero(sel: ErrorSignature) bool {
    return equals(sel, ZERO);
}

test "isZero - zero signature" {
    try std.testing.expect(isZero(ZERO));
}

test "isZero - non-zero signature" {
    const sel = fromSignature("Unauthorized()");
    try std.testing.expect(!isZero(sel));
}

/// Check if a hex string is valid error signature format
pub fn isValidHex(hex: []const u8) bool {
    if (hex.len != SIZE * 2 + 2) return false;
    if (hex[0] != '0' or (hex[1] != 'x' and hex[1] != 'X')) return false;

    for (hex[2..]) |c| {
        if (!std.ascii.isHex(c)) return false;
    }

    return true;
}

test "isValidHex - valid" {
    try std.testing.expect(isValidHex("0xcf479181"));
    try std.testing.expect(isValidHex("0xCF479181"));
}

test "isValidHex - invalid" {
    try std.testing.expect(!isValidHex("cf479181")); // missing 0x
    try std.testing.expect(!isValidHex("0xcf47")); // too short
    try std.testing.expect(!isValidHex("0xcf479181aa")); // too long
}

// ============================================================================
// Manipulation
// ============================================================================

/// Create a copy of the error signature
pub fn clone(sel: ErrorSignature) ErrorSignature {
    return sel;
}

test "clone - creates copy" {
    const original = fromSignature("Unauthorized()");
    const copy = clone(original);
    try std.testing.expect(equals(original, copy));
}

/// Convert error signature to u32 (big-endian)
pub fn toU32(sel: ErrorSignature) u32 {
    return std.mem.readInt(u32, &sel, .big);
}

test "toU32 - correct conversion" {
    const sel = try fromHex("0x08c379a0");
    try std.testing.expectEqual(@as(u32, 0x08c379a0), toU32(sel));
}

/// Create error signature from u32 (big-endian)
pub fn fromU32(value: u32) ErrorSignature {
    var sel: ErrorSignature = undefined;
    std.mem.writeInt(u32, &sel, value, .big);
    return sel;
}

test "fromU32 - correct conversion" {
    const sel = fromU32(0x08c379a0);
    try std.testing.expect(equals(sel, ERROR));
}

// ============================================================================
// Error Classification
// ============================================================================

/// Check if this is the standard Error(string) selector
pub fn isStandardError(sel: ErrorSignature) bool {
    return equals(sel, ERROR);
}

test "isStandardError - true" {
    try std.testing.expect(isStandardError(ERROR));
}

test "isStandardError - false" {
    const custom = fromSignature("CustomError()");
    try std.testing.expect(!isStandardError(custom));
}

/// Check if this is the standard Panic(uint256) selector
pub fn isPanic(sel: ErrorSignature) bool {
    return equals(sel, PANIC);
}

test "isPanic - true" {
    try std.testing.expect(isPanic(PANIC));
}

test "isPanic - false" {
    try std.testing.expect(!isPanic(ERROR));
}

/// Check if this is a standard error (Error or Panic)
pub fn isStandard(sel: ErrorSignature) bool {
    return isStandardError(sel) or isPanic(sel);
}

test "isStandard - Error" {
    try std.testing.expect(isStandard(ERROR));
}

test "isStandard - Panic" {
    try std.testing.expect(isStandard(PANIC));
}

test "isStandard - custom" {
    const custom = fromSignature("CustomError()");
    try std.testing.expect(!isStandard(custom));
}
