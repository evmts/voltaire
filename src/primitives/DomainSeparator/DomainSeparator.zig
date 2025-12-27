//! DomainSeparator - EIP-712 Domain Separator Hash
//!
//! A 32-byte hash used in EIP-712 signature verification for domain separation.
//! Computed as keccak256 of the encoded domain.
//!
//! ## Usage
//! ```zig
//! const DomainSeparator = @import("primitives").DomainSeparator;
//!
//! // Create from hash bytes
//! const sep = DomainSeparator.fromBytes(&bytes);
//!
//! // Create from hex string
//! const sep2 = try DomainSeparator.fromHex("0x...");
//!
//! // Compare
//! const equal = sep.equals(sep2);
//! ```

const std = @import("std");

/// Domain separator size in bytes
pub const SIZE = 32;

/// DomainSeparator - 32-byte hash for EIP-712 domain separation
pub const DomainSeparator = struct {
    bytes: [SIZE]u8,

    /// Zero domain separator constant
    pub const ZERO: DomainSeparator = .{ .bytes = [_]u8{0} ** SIZE };

    /// Create DomainSeparator from bytes
    pub fn fromBytes(bytes: []const u8) !DomainSeparator {
        if (bytes.len != SIZE) return error.InvalidDomainSeparatorLength;
        var result: DomainSeparator = undefined;
        @memcpy(&result.bytes, bytes);
        return result;
    }

    /// Create DomainSeparator from 32-byte array
    pub fn from(bytes: [SIZE]u8) DomainSeparator {
        return .{ .bytes = bytes };
    }

    /// Create DomainSeparator from hex string
    pub fn fromHex(hex: []const u8) !DomainSeparator {
        var slice = hex;
        if (slice.len >= 2 and slice[0] == '0' and (slice[1] == 'x' or slice[1] == 'X')) {
            slice = slice[2..];
        }
        if (slice.len != SIZE * 2) return error.InvalidDomainSeparatorLength;

        var result: DomainSeparator = undefined;
        _ = std.fmt.hexToBytes(&result.bytes, slice) catch return error.InvalidHexString;
        return result;
    }

    /// Convert to hex string with 0x prefix
    pub fn toHex(self: DomainSeparator) [SIZE * 2 + 2]u8 {
        var result: [SIZE * 2 + 2]u8 = undefined;
        result[0] = '0';
        result[1] = 'x';
        const hex = std.fmt.bytesToHex(&self.bytes, .lower);
        @memcpy(result[2..], &hex);
        return result;
    }

    /// Get bytes slice
    pub fn toBytes(self: *const DomainSeparator) []const u8 {
        return &self.bytes;
    }

    /// Check if two DomainSeparators are equal
    pub fn equals(self: DomainSeparator, other: DomainSeparator) bool {
        return std.mem.eql(u8, &self.bytes, &other.bytes);
    }

    /// Check if domain separator is zero
    pub fn isZero(self: DomainSeparator) bool {
        return self.equals(ZERO);
    }
};

// ============================================================================
// Tests
// ============================================================================

test "DomainSeparator: fromBytes creates from 32 bytes" {
    const bytes = [_]u8{0xab} ** SIZE;
    const sep = try DomainSeparator.fromBytes(&bytes);
    try std.testing.expectEqualSlices(u8, &bytes, &sep.bytes);
}

test "DomainSeparator: fromBytes rejects invalid length" {
    const bytes = [_]u8{0xab} ** 16;
    try std.testing.expectError(error.InvalidDomainSeparatorLength, DomainSeparator.fromBytes(&bytes));
}

test "DomainSeparator: from creates from array" {
    const bytes = [_]u8{0xcd} ** SIZE;
    const sep = DomainSeparator.from(bytes);
    try std.testing.expectEqualSlices(u8, &bytes, &sep.bytes);
}

test "DomainSeparator: fromHex with 0x prefix" {
    const hex = "0x" ++ ("ab" ** SIZE);
    const sep = try DomainSeparator.fromHex(hex);
    try std.testing.expectEqual(@as(u8, 0xab), sep.bytes[0]);
    try std.testing.expectEqual(@as(u8, 0xab), sep.bytes[31]);
}

test "DomainSeparator: fromHex without prefix" {
    const hex = "cd" ** SIZE;
    const sep = try DomainSeparator.fromHex(hex);
    try std.testing.expectEqual(@as(u8, 0xcd), sep.bytes[0]);
}

test "DomainSeparator: fromHex invalid length" {
    try std.testing.expectError(error.InvalidDomainSeparatorLength, DomainSeparator.fromHex("0x1234"));
}

test "DomainSeparator: fromHex invalid chars" {
    const hex = "0x" ++ ("zz" ** SIZE);
    try std.testing.expectError(error.InvalidHexString, DomainSeparator.fromHex(hex));
}

test "DomainSeparator: toHex returns correct format" {
    const bytes = [_]u8{0xff} ** SIZE;
    const sep = DomainSeparator.from(bytes);
    const hex = sep.toHex();

    try std.testing.expect(std.mem.startsWith(u8, &hex, "0x"));
    try std.testing.expectEqual(@as(usize, 66), hex.len);
}

test "DomainSeparator: toHex and fromHex roundtrip" {
    const bytes = [_]u8{0xab} ** SIZE;
    const sep = DomainSeparator.from(bytes);
    const hex = sep.toHex();
    const decoded = try DomainSeparator.fromHex(&hex);
    try std.testing.expect(sep.equals(decoded));
}

test "DomainSeparator: toBytes returns correct slice" {
    const bytes = [_]u8{0x12} ** SIZE;
    const sep = DomainSeparator.from(bytes);
    const slice = sep.toBytes();
    try std.testing.expectEqual(@as(usize, SIZE), slice.len);
    try std.testing.expectEqualSlices(u8, &bytes, slice);
}

test "DomainSeparator: equals same" {
    const sep = DomainSeparator.from([_]u8{0xaa} ** SIZE);
    try std.testing.expect(sep.equals(sep));
}

test "DomainSeparator: equals identical" {
    const a = DomainSeparator.from([_]u8{0xaa} ** SIZE);
    const b = DomainSeparator.from([_]u8{0xaa} ** SIZE);
    try std.testing.expect(a.equals(b));
}

test "DomainSeparator: equals different" {
    const a = DomainSeparator.from([_]u8{0xaa} ** SIZE);
    const b = DomainSeparator.from([_]u8{0xbb} ** SIZE);
    try std.testing.expect(!a.equals(b));
}

test "DomainSeparator: isZero true" {
    const sep = DomainSeparator.ZERO;
    try std.testing.expect(sep.isZero());
}

test "DomainSeparator: isZero false" {
    var bytes = [_]u8{0} ** SIZE;
    bytes[0] = 1;
    const sep = DomainSeparator.from(bytes);
    try std.testing.expect(!sep.isZero());
}

test "DomainSeparator: ZERO constant" {
    const sep = DomainSeparator.ZERO;
    for (sep.bytes) |b| {
        try std.testing.expectEqual(@as(u8, 0), b);
    }
}
