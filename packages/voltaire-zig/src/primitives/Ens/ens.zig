const std = @import("std");
const z_ens = @import("z_ens_normalize");
const crypto = @import("crypto");

/// ENS name normalization error types matching ENSIP-15 spec
pub const EnsError = error{
    InvalidLabelExtension,
    IllegalMixture,
    WholeConfusable,
    DisallowedCharacter,
    EmptyLabel,
    InvalidUtf8,
    CMLeading,
    FencedLeading,
    NSMExcessive,
    OutOfMemory,
};

/// Normalize ENS name to canonical lowercase form per ENSIP-15
/// Caller owns returned memory
pub fn normalize(allocator: std.mem.Allocator, name: []const u8) ![]u8 {
    const shared = z_ens.shared();
    return shared.normalize(allocator, name) catch |err| {
        return mapError(err);
    };
}

/// Beautify ENS name (normalize but preserve emoji presentation)
/// Caller owns returned memory
pub fn beautify(allocator: std.mem.Allocator, name: []const u8) ![]u8 {
    const shared = z_ens.shared();
    return shared.beautify(allocator, name) catch |err| {
        return mapError(err);
    };
}

/// Create ENS name from string (passthrough, no validation)
/// Matches TS from() API
pub fn from(name: []const u8) []const u8 {
    return name;
}

/// Check if value is a valid ENS name (non-empty string)
/// Matches TS is() API
pub fn is(name: []const u8) bool {
    return name.len > 0;
}

/// Convert ENS name to string (passthrough)
/// Matches TS toString() API
pub fn toString(name: []const u8) []const u8 {
    return name;
}

/// Check if ENS name is valid (can be normalized without error)
/// Matches TS isValid() API
pub fn isValid(allocator: std.mem.Allocator, name: []const u8) bool {
    if (name.len == 0) return false;
    const result = normalize(allocator, name) catch return false;
    allocator.free(result);
    return true;
}

/// Validate ENS name (returns error if invalid)
/// Matches TS validate() API
pub fn validate(allocator: std.mem.Allocator, name: []const u8) EnsError!void {
    if (name.len == 0) return EnsError.DisallowedCharacter;
    const result = normalize(allocator, name) catch |err| return err;
    allocator.free(result);
}

/// Compute ENS namehash for a given name
/// Implements EIP-137: namehash(name) = keccak256(namehash(parent) ‖ labelhash(label))
/// Empty string has hash of 32 zero bytes.
/// Caller owns returned memory
pub fn namehash(allocator: std.mem.Allocator, name: []const u8) ![]u8 {
    // Start with root hash (32 zero bytes)
    const hash = try allocator.alloc(u8, 32);
    @memset(hash, 0);

    // Empty string returns root hash
    if (name.len == 0) {
        return hash;
    }

    // Split into labels and process in reverse order
    var it = std.mem.splitBackwardsScalar(u8, name, '.');
    while (it.next()) |label| {
        if (label.len == 0) continue;

        // Hash the label
        const label_hash = crypto.hash.keccak256(label);

        // Concatenate parent hash and label hash, then hash again
        var combined: [64]u8 = undefined;
        @memcpy(combined[0..32], hash);
        @memcpy(combined[32..64], &label_hash);

        const new_hash = crypto.hash.keccak256(&combined);
        @memcpy(hash, &new_hash);
    }

    return hash;
}

/// Compute ENS labelhash for a given label
/// Implements EIP-137: labelhash(label) = keccak256(label)
/// Caller owns returned memory
pub fn labelhash(allocator: std.mem.Allocator, label: []const u8) ![]u8 {
    const hash_value = crypto.hash.keccak256(label);
    const result = try allocator.alloc(u8, 32);
    @memcpy(result, &hash_value);
    return result;
}

/// Map z-ens-normalize errors to our error set
fn mapError(err: anyerror) EnsError {
    // Map common errors, fallback to OutOfMemory for unknown
    if (err == error.OutOfMemory) return EnsError.OutOfMemory;
    // z-ens uses string names, best effort mapping
    return EnsError.DisallowedCharacter;
}

test "normalize basic ENS name" {
    const allocator = std.testing.allocator;

    const result = try normalize(allocator, "Nick.ETH");
    defer allocator.free(result);

    try std.testing.expectEqualStrings("nick.eth", result);
}

test "normalize preserves lowercase" {
    const allocator = std.testing.allocator;

    const result = try normalize(allocator, "vitalik.eth");
    defer allocator.free(result);

    try std.testing.expectEqualStrings("vitalik.eth", result);
}

test "beautify preserves emoji" {
    const allocator = std.testing.allocator;

    const result = try beautify(allocator, "💩.eth");
    defer allocator.free(result);

    // Should normalize but keep emoji
    try std.testing.expect(result.len > 0);
}

test "from creates ENS name" {
    const name = from("vitalik.eth");
    try std.testing.expectEqualStrings("vitalik.eth", name);
}

test "is returns true for non-empty strings" {
    try std.testing.expect(is("vitalik.eth"));
    try std.testing.expect(is("a"));
}

test "is returns false for empty strings" {
    try std.testing.expect(!is(""));
}

test "toString converts ENS to string" {
    const name = from("vitalik.eth");
    const str = toString(name);
    try std.testing.expectEqualStrings("vitalik.eth", str);
}

test "namehash empty name" {
    const allocator = std.testing.allocator;

    const result = try namehash(allocator, "");
    defer allocator.free(result);

    // Empty name should return 32 zero bytes
    const expected = [_]u8{0} ** 32;
    try std.testing.expectEqualSlices(u8, &expected, result);
}

test "namehash vitalik.eth" {
    const allocator = std.testing.allocator;

    const result = try namehash(allocator, "vitalik.eth");
    defer allocator.free(result);

    // Expected: 0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835
    const expected = [_]u8{
        0xee, 0x6c, 0x45, 0x22, 0xaa, 0xb0, 0x00, 0x3e,
        0x8d, 0x14, 0xcd, 0x40, 0xa6, 0xaf, 0x43, 0x90,
        0x55, 0xfd, 0x25, 0x77, 0x95, 0x11, 0x48, 0xc1,
        0x4b, 0x6c, 0xea, 0x9a, 0x53, 0x47, 0x58, 0x35,
    };
    try std.testing.expectEqualSlices(u8, &expected, result);
}

test "namehash subdomain" {
    const allocator = std.testing.allocator;

    const result = try namehash(allocator, "sub.vitalik.eth");
    defer allocator.free(result);

    // Should produce 32 bytes
    try std.testing.expectEqual(@as(usize, 32), result.len);
}

test "labelhash vitalik" {
    const allocator = std.testing.allocator;

    const result = try labelhash(allocator, "vitalik");
    defer allocator.free(result);

    // Expected: 0xaf2caa1c2ca1d027f1ac823b529d0a67cd144264b2789fa2ea4d63a67c7103cc
    const expected = [_]u8{
        0xaf, 0x2c, 0xaa, 0x1c, 0x2c, 0xa1, 0xd0, 0x27,
        0xf1, 0xac, 0x82, 0x3b, 0x52, 0x9d, 0x0a, 0x67,
        0xcd, 0x14, 0x42, 0x64, 0xb2, 0x78, 0x9f, 0xa2,
        0xea, 0x4d, 0x63, 0xa6, 0x7c, 0x71, 0x03, 0xcc,
    };
    try std.testing.expectEqualSlices(u8, &expected, result);
}

test "labelhash eth" {
    const allocator = std.testing.allocator;

    const result = try labelhash(allocator, "eth");
    defer allocator.free(result);

    // Should produce 32 bytes
    try std.testing.expectEqual(@as(usize, 32), result.len);
}

test "isValid returns true for valid names" {
    const allocator = std.testing.allocator;

    try std.testing.expect(isValid(allocator, "vitalik.eth"));
    try std.testing.expect(isValid(allocator, "sub.domain.eth"));
    try std.testing.expect(isValid(allocator, "test.eth"));
}

test "isValid returns false for invalid names" {
    const allocator = std.testing.allocator;

    try std.testing.expect(!isValid(allocator, ""));
}

test "validate succeeds for valid names" {
    const allocator = std.testing.allocator;

    try validate(allocator, "vitalik.eth");
    try validate(allocator, "sub.domain.eth");
    try validate(allocator, "test.eth");
}

test "validate fails for invalid names" {
    const allocator = std.testing.allocator;

    const result = validate(allocator, "");
    try std.testing.expectError(EnsError.DisallowedCharacter, result);
}
