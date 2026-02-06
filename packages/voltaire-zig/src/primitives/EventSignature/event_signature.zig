//! EventSignature - 32-byte event topic hash for Ethereum events
//!
//! An EventSignature is the full keccak256 hash of an event signature.
//! Unlike function selectors (4 bytes), event topics are the full 32-byte hash.
//! This is topic0 in EVM event logs for non-anonymous events.
//!
//! ## Usage
//! ```zig
//! const EventSignature = @import("primitives").EventSignature;
//!
//! // From event signature
//! const topic = EventSignature.fromSignature("Transfer(address,address,uint256)");
//! // topic = keccak256("Transfer(address,address,uint256)")
//!
//! // From hex string
//! const topic2 = try EventSignature.fromHex("0xddf252ad...");
//!
//! // Convert to hex
//! const hex = EventSignature.toHex(topic);
//! ```

const std = @import("std");
const crypto = std.crypto;

/// EventSignature size in bytes (32 bytes = 256 bits)
pub const SIZE = 32;

/// EventSignature type - 32 bytes (full keccak256 hash)
pub const EventSignature = [SIZE]u8;

/// Zero event signature constant
pub const ZERO: EventSignature = [_]u8{0} ** SIZE;

// ============================================================================
// Well-known event signatures (precomputed)
// ============================================================================

/// Transfer(address indexed from, address indexed to, uint256 value)
/// ERC20/ERC721 Transfer event
/// keccak256("Transfer(address,address,uint256)")
pub const TRANSFER: EventSignature = [_]u8{
    0xdd, 0xf2, 0x52, 0xad, 0x1b, 0xe2, 0xc8, 0x9b,
    0x69, 0xc2, 0xb0, 0x68, 0xfc, 0x37, 0x8d, 0xaa,
    0x95, 0x2b, 0xa7, 0xf1, 0x63, 0xc4, 0xa1, 0x16,
    0x28, 0xf5, 0x5a, 0x4d, 0xf5, 0x23, 0xb3, 0xef,
};

/// Approval(address indexed owner, address indexed spender, uint256 value)
/// ERC20 Approval event
/// keccak256("Approval(address,address,uint256)")
pub const APPROVAL: EventSignature = [_]u8{
    0x8c, 0x5b, 0xe1, 0xe5, 0xeb, 0xec, 0x7d, 0x5b,
    0xd1, 0x4f, 0x71, 0x42, 0x7d, 0x1e, 0x84, 0xf3,
    0xdd, 0x03, 0x14, 0xc0, 0xf7, 0xb2, 0x29, 0x1e,
    0x5b, 0x20, 0x0a, 0xc8, 0xc7, 0xc3, 0xb9, 0x25,
};

// ============================================================================
// Constructors
// ============================================================================

/// Create EventSignature from event signature string.
/// Computes keccak256(signature) - full 32-byte hash.
pub fn fromSignature(signature: []const u8) EventSignature {
    var hash: EventSignature = undefined;
    crypto.hash.sha3.Keccak256.hash(signature, &hash, .{});
    return hash;
}

test "fromSignature - Transfer event" {
    const topic = fromSignature("Transfer(address,address,uint256)");
    const hex = toHex(topic);
    try std.testing.expectEqualStrings("0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef", &hex);
}

test "fromSignature - Approval event" {
    const topic = fromSignature("Approval(address,address,uint256)");
    const hex = toHex(topic);
    try std.testing.expectEqualStrings("0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925", &hex);
}

test "fromSignature - Deposit event" {
    const topic = fromSignature("Deposit(uint256)");
    // Just verify it produces a valid hash
    try std.testing.expect(!isZero(topic));
}

test "fromSignature - complex Swap event" {
    const topic = fromSignature("Swap(address,uint256,uint256,uint256,uint256,address)");
    const hex = toHex(topic);
    try std.testing.expectEqualStrings("0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822", &hex);
}

test "TRANSFER constant" {
    const computed = fromSignature("Transfer(address,address,uint256)");
    try std.testing.expect(equals(TRANSFER, computed));
}

test "APPROVAL constant" {
    const computed = fromSignature("Approval(address,address,uint256)");
    try std.testing.expect(equals(APPROVAL, computed));
}

/// Create EventSignature from raw bytes. Input must be exactly 32 bytes.
pub fn fromBytes(bytes: []const u8) !EventSignature {
    if (bytes.len != SIZE) {
        return error.InvalidEventSignatureLength;
    }
    var result: EventSignature = undefined;
    @memcpy(&result, bytes);
    return result;
}

test "fromBytes - valid 32 bytes" {
    var bytes: [32]u8 = undefined;
    @memset(&bytes, 0xab);
    const sig = try fromBytes(&bytes);
    try std.testing.expectEqual(bytes, sig);
}

test "fromBytes - invalid length" {
    const bytes = [_]u8{ 0xa9, 0x05 };
    try std.testing.expectError(error.InvalidEventSignatureLength, fromBytes(&bytes));
}

/// Create EventSignature from hex string (with 0x prefix).
pub fn fromHex(hex: []const u8) !EventSignature {
    if (hex.len < 2 or hex[0] != '0' or (hex[1] != 'x' and hex[1] != 'X')) {
        return error.InvalidHexFormat;
    }

    const hex_digits = hex[2..];
    if (hex_digits.len != SIZE * 2) {
        return error.InvalidEventSignatureHexLength;
    }

    var result: EventSignature = undefined;
    _ = std.fmt.hexToBytes(&result, hex_digits) catch return error.InvalidHexCharacter;
    return result;
}

test "fromHex - valid hex" {
    const sig = try fromHex("0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef");
    const expected = fromSignature("Transfer(address,address,uint256)");
    try std.testing.expect(equals(sig, expected));
}

test "fromHex - missing prefix" {
    const hex = "ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
    try std.testing.expectError(error.InvalidHexFormat, fromHex(hex));
}

test "fromHex - invalid length" {
    try std.testing.expectError(error.InvalidEventSignatureHexLength, fromHex("0xa9059cbb"));
}

/// Generic constructor - accepts bytes or hex string
pub fn from(value: anytype) !EventSignature {
    const T = @TypeOf(value);
    if (T == EventSignature) return value;

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

    @compileError("Unsupported type for EventSignature.from: " ++ @typeName(T));
}

test "from - EventSignature passthrough" {
    const sig = fromSignature("Transfer(address,address,uint256)");
    const result = try from(sig);
    try std.testing.expect(equals(sig, result));
}

test "from - hex string" {
    const result = try from("0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef");
    const expected = fromSignature("Transfer(address,address,uint256)");
    try std.testing.expect(equals(result, expected));
}

// ============================================================================
// Converters
// ============================================================================

/// Convert EventSignature to bytes slice
pub fn toBytes(sig: *const EventSignature) []const u8 {
    return sig[0..];
}

test "toBytes - returns correct slice" {
    const sig = fromSignature("Transfer(address,address,uint256)");
    const bytes = toBytes(&sig);
    try std.testing.expectEqual(@as(usize, SIZE), bytes.len);
}

/// Convert EventSignature to hex string with 0x prefix (fixed-size, no allocation)
pub fn toHex(sig: EventSignature) [2 + SIZE * 2]u8 {
    var result: [2 + SIZE * 2]u8 = undefined;
    result[0] = '0';
    result[1] = 'x';
    const hex = std.fmt.bytesToHex(&sig, .lower);
    @memcpy(result[2..], &hex);
    return result;
}

test "toHex - correct format" {
    const sig = fromSignature("Transfer(address,address,uint256)");
    const hex = toHex(sig);
    try std.testing.expectEqualStrings("0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef", &hex);
}

test "toHex - zero signature" {
    const hex = toHex(ZERO);
    try std.testing.expectEqualStrings("0x0000000000000000000000000000000000000000000000000000000000000000", &hex);
}

/// Alias for toHex
pub fn toString(sig: EventSignature) [2 + SIZE * 2]u8 {
    return toHex(sig);
}

// ============================================================================
// Validation
// ============================================================================

/// Compare two event signatures for equality
pub fn equals(a: EventSignature, b: EventSignature) bool {
    return std.mem.eql(u8, &a, &b);
}

test "equals - same signature" {
    const sig = fromSignature("Transfer(address,address,uint256)");
    try std.testing.expect(equals(sig, sig));
}

test "equals - from hex and signature" {
    const sig1 = fromSignature("Transfer(address,address,uint256)");
    const sig2 = try fromHex("0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef");
    try std.testing.expect(equals(sig1, sig2));
}

test "equals - different signatures" {
    const sig1 = fromSignature("Transfer(address,address,uint256)");
    const sig2 = fromSignature("Approval(address,address,uint256)");
    try std.testing.expect(!equals(sig1, sig2));
}

/// Check if event signature is all zeros
pub fn isZero(sig: EventSignature) bool {
    return equals(sig, ZERO);
}

test "isZero - zero signature" {
    try std.testing.expect(isZero(ZERO));
}

test "isZero - non-zero signature" {
    const sig = fromSignature("Transfer(address,address,uint256)");
    try std.testing.expect(!isZero(sig));
}

/// Check if a hex string is valid event signature format
pub fn isValidHex(hex: []const u8) bool {
    if (hex.len != SIZE * 2 + 2) return false;
    if (hex[0] != '0' or (hex[1] != 'x' and hex[1] != 'X')) return false;

    for (hex[2..]) |c| {
        if (!std.ascii.isHex(c)) return false;
    }

    return true;
}

test "isValidHex - valid" {
    try std.testing.expect(isValidHex("0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"));
}

test "isValidHex - invalid" {
    try std.testing.expect(!isValidHex("0xa9059cbb")); // too short (selector size)
    try std.testing.expect(!isValidHex("ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef")); // missing 0x
}

// ============================================================================
// Manipulation
// ============================================================================

/// Create a copy of the event signature
pub fn clone(sig: EventSignature) EventSignature {
    return sig;
}

test "clone - creates copy" {
    const original = fromSignature("Transfer(address,address,uint256)");
    const copy = clone(original);
    try std.testing.expect(equals(original, copy));
}

/// Get the 4-byte selector portion (first 4 bytes of event signature)
/// Useful for some event filtering scenarios
pub fn toSelector(sig: EventSignature) [4]u8 {
    return sig[0..4].*;
}

test "toSelector - first 4 bytes" {
    const sig = fromSignature("Transfer(address,address,uint256)");
    const sel = toSelector(sig);
    const expected = [4]u8{ 0xdd, 0xf2, 0x52, 0xad };
    try std.testing.expectEqual(expected, sel);
}

/// Get the full 32-byte topic hash (returns self).
/// EventSignature already is the full topic hash.
/// This function exists for API consistency with FunctionSignature/ErrorSignature.
pub fn toTopic(sig: EventSignature) EventSignature {
    return sig;
}

test "toTopic - returns full hash" {
    const sig = fromSignature("Transfer(address,address,uint256)");
    const topic = toTopic(sig);
    try std.testing.expect(equals(sig, topic));
}
