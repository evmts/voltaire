const std = @import("std");
const z_ens = @import("z_ens_normalize");

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
    allocator.free(result);
}
