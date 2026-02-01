//! ProtocolVersion - Ethereum Protocol Version Identifier
//!
//! Represents a protocol version string used for peer-to-peer communication.
//! Format: "protocol/version" (e.g., "eth/67", "snap/1")
//!
//! ## Common Protocol Versions
//! - eth/66: ETH66 protocol
//! - eth/67: ETH67 protocol (current standard)
//! - eth/68: ETH68 protocol
//! - snap/1: Snapshot protocol
//!
//! ## Usage
//! ```zig
//! const proto = ProtocolVersion.ETH_67;
//! const equal = ProtocolVersion.equals(proto, ProtocolVersion.ETH_67);
//! const str = proto.toString();
//! ```

const std = @import("std");

/// ProtocolVersion - stored as a bounded string
/// Format: "protocol/version" with max 32 chars (e.g., "eth/67")
pub const ProtocolVersion = struct {
    protocol: []const u8,
    version: u32,

    const Self = @This();

    /// Maximum protocol name length
    pub const MAX_PROTOCOL_LEN = 16;

    /// Create ProtocolVersion from protocol name and version number
    pub fn init(protocol: []const u8, version: u32) Self {
        return .{ .protocol = protocol, .version = version };
    }

    /// Check if two protocol versions are equal
    pub fn equals(self: Self, other: Self) bool {
        return self.version == other.version and std.mem.eql(u8, self.protocol, other.protocol);
    }

    /// Compare two protocol versions for ordering
    /// Returns negative if self < other, positive if self > other, 0 if equal
    /// Only compares versions within the same protocol family
    /// Returns 0 for different protocols (not comparable)
    pub fn compare(self: Self, other: Self) i32 {
        // Different protocols - not comparable
        if (!std.mem.eql(u8, self.protocol, other.protocol)) {
            return 0;
        }
        // Compare version numbers
        if (self.version < other.version) return -1;
        if (self.version > other.version) return 1;
        return 0;
    }

    /// Format as "protocol/version" string
    /// Caller owns returned memory
    pub fn toString(self: Self, allocator: std.mem.Allocator) ![]u8 {
        return std.fmt.allocPrint(allocator, "{s}/{d}", .{ self.protocol, self.version });
    }

    /// Get protocol name
    pub fn getProtocol(self: Self) []const u8 {
        return self.protocol;
    }

    /// Get version number
    pub fn getVersion(self: Self) u32 {
        return self.version;
    }

    /// Convert version to number (just the version part)
    pub fn toNumber(self: Self) u32 {
        return self.version;
    }

    /// Convert version to hex string (version only, no 0x prefix)
    pub fn toHex(self: Self, buf: []u8) []const u8 {
        const hex_chars = "0123456789abcdef";
        var value = self.version;

        // Find number of significant hex digits
        var temp = value;
        var digits: usize = 0;
        while (temp > 0) : (digits += 1) {
            temp >>= 4;
        }
        if (digits == 0) digits = 1;

        var i: usize = digits;
        while (i > 0) {
            i -= 1;
            buf[i] = hex_chars[@intCast(value & 0xf)];
            value >>= 4;
        }

        return buf[0..digits];
    }
};

// Well-known protocol versions
pub const ETH_66 = ProtocolVersion.init("eth", 66);
pub const ETH_67 = ProtocolVersion.init("eth", 67);
pub const ETH_68 = ProtocolVersion.init("eth", 68);
pub const SNAP_1 = ProtocolVersion.init("snap", 1);

/// Create ProtocolVersion from string "protocol/version"
/// Returns null if format is invalid
pub fn fromString(str: []const u8) ?ProtocolVersion {
    const sep_idx = std.mem.indexOf(u8, str, "/") orelse return null;
    if (sep_idx == 0 or sep_idx >= str.len - 1) return null;

    const protocol = str[0..sep_idx];
    const version_str = str[sep_idx + 1 ..];

    const version = std.fmt.parseInt(u32, version_str, 10) catch return null;

    return ProtocolVersion.init(protocol, version);
}

/// Create ProtocolVersion from protocol name and version number
pub fn from(protocol: []const u8, version: u32) ProtocolVersion {
    return ProtocolVersion.init(protocol, version);
}

/// Create ProtocolVersion from hex string (version only, assumes "eth" protocol)
/// Returns null if invalid hex
pub fn fromHex(hex: []const u8) ?ProtocolVersion {
    const start: usize = if (hex.len >= 2 and hex[0] == '0' and (hex[1] == 'x' or hex[1] == 'X')) 2 else 0;
    if (start >= hex.len) return null;

    var result: u32 = 0;
    for (hex[start..]) |c| {
        const digit: u32 = switch (c) {
            '0'...'9' => c - '0',
            'a'...'f' => c - 'a' + 10,
            'A'...'F' => c - 'A' + 10,
            else => return null,
        };
        result = result *% 16 +% digit;
    }
    return ProtocolVersion.init("eth", result);
}

/// Check equality between two protocol versions (free function)
pub fn equals(a: ProtocolVersion, b: ProtocolVersion) bool {
    return a.equals(b);
}

// Tests

test "ProtocolVersion: init creates protocol version" {
    const proto = ProtocolVersion.init("eth", 67);
    try std.testing.expectEqualStrings("eth", proto.protocol);
    try std.testing.expectEqual(@as(u32, 67), proto.version);
}

test "ProtocolVersion: constants are correct values" {
    try std.testing.expectEqualStrings("eth", ETH_66.protocol);
    try std.testing.expectEqual(@as(u32, 66), ETH_66.version);

    try std.testing.expectEqualStrings("eth", ETH_67.protocol);
    try std.testing.expectEqual(@as(u32, 67), ETH_67.version);

    try std.testing.expectEqualStrings("eth", ETH_68.protocol);
    try std.testing.expectEqual(@as(u32, 68), ETH_68.version);

    try std.testing.expectEqualStrings("snap", SNAP_1.protocol);
    try std.testing.expectEqual(@as(u32, 1), SNAP_1.version);
}

test "ProtocolVersion: equals returns true for same protocol" {
    const proto1 = ProtocolVersion.init("eth", 67);
    const proto2 = ProtocolVersion.init("eth", 67);
    try std.testing.expect(proto1.equals(proto2));
}

test "ProtocolVersion: equals returns false for different version" {
    const proto1 = ProtocolVersion.init("eth", 66);
    const proto2 = ProtocolVersion.init("eth", 67);
    try std.testing.expect(!proto1.equals(proto2));
}

test "ProtocolVersion: equals returns false for different protocol" {
    const proto1 = ProtocolVersion.init("eth", 1);
    const proto2 = ProtocolVersion.init("snap", 1);
    try std.testing.expect(!proto1.equals(proto2));
}

test "ProtocolVersion: equals with constants" {
    try std.testing.expect(ETH_67.equals(ProtocolVersion.init("eth", 67)));
    try std.testing.expect(!ETH_66.equals(ETH_67));
}

test "ProtocolVersion: compare same protocol different versions" {
    try std.testing.expectEqual(@as(i32, -1), ETH_66.compare(ETH_67));
    try std.testing.expectEqual(@as(i32, 1), ETH_67.compare(ETH_66));
    try std.testing.expectEqual(@as(i32, 0), ETH_67.compare(ETH_67));
}

test "ProtocolVersion: compare different protocols" {
    // Different protocols are not comparable - returns 0
    try std.testing.expectEqual(@as(i32, 0), ETH_67.compare(SNAP_1));
}

test "ProtocolVersion: toString formats correctly" {
    const proto = ProtocolVersion.init("eth", 67);
    const str = try proto.toString(std.testing.allocator);
    defer std.testing.allocator.free(str);
    try std.testing.expectEqualStrings("eth/67", str);
}

test "ProtocolVersion: toString with snap" {
    const str = try SNAP_1.toString(std.testing.allocator);
    defer std.testing.allocator.free(str);
    try std.testing.expectEqualStrings("snap/1", str);
}

test "ProtocolVersion: fromString parses valid format" {
    const proto = fromString("eth/67") orelse unreachable;
    try std.testing.expectEqualStrings("eth", proto.protocol);
    try std.testing.expectEqual(@as(u32, 67), proto.version);
}

test "ProtocolVersion: fromString parses snap/1" {
    const proto = fromString("snap/1") orelse unreachable;
    try std.testing.expectEqualStrings("snap", proto.protocol);
    try std.testing.expectEqual(@as(u32, 1), proto.version);
}

test "ProtocolVersion: fromString returns null for invalid format" {
    try std.testing.expectEqual(@as(?ProtocolVersion, null), fromString("eth67"));
    try std.testing.expectEqual(@as(?ProtocolVersion, null), fromString("/67"));
    try std.testing.expectEqual(@as(?ProtocolVersion, null), fromString("eth/"));
    try std.testing.expectEqual(@as(?ProtocolVersion, null), fromString("eth/abc"));
    try std.testing.expectEqual(@as(?ProtocolVersion, null), fromString(""));
}

test "ProtocolVersion: from creates protocol version" {
    const proto = from("eth", 68);
    try std.testing.expectEqualStrings("eth", proto.protocol);
    try std.testing.expectEqual(@as(u32, 68), proto.version);
}

test "ProtocolVersion: getProtocol returns protocol name" {
    try std.testing.expectEqualStrings("eth", ETH_67.getProtocol());
    try std.testing.expectEqualStrings("snap", SNAP_1.getProtocol());
}

test "ProtocolVersion: getVersion returns version number" {
    try std.testing.expectEqual(@as(u32, 67), ETH_67.getVersion());
    try std.testing.expectEqual(@as(u32, 1), SNAP_1.getVersion());
}

test "ProtocolVersion: toNumber returns version" {
    try std.testing.expectEqual(@as(u32, 66), ETH_66.toNumber());
    try std.testing.expectEqual(@as(u32, 67), ETH_67.toNumber());
    try std.testing.expectEqual(@as(u32, 68), ETH_68.toNumber());
    try std.testing.expectEqual(@as(u32, 1), SNAP_1.toNumber());
}

test "ProtocolVersion: toHex returns hex string" {
    var buf: [8]u8 = undefined;
    try std.testing.expectEqualStrings("42", ETH_66.toHex(&buf)); // 66 = 0x42
    try std.testing.expectEqualStrings("43", ETH_67.toHex(&buf)); // 67 = 0x43
    try std.testing.expectEqualStrings("44", ETH_68.toHex(&buf)); // 68 = 0x44
    try std.testing.expectEqualStrings("1", SNAP_1.toHex(&buf));
}

test "ProtocolVersion: fromHex parses valid hex" {
    const proto = fromHex("43") orelse unreachable;
    try std.testing.expectEqualStrings("eth", proto.protocol);
    try std.testing.expectEqual(@as(u32, 67), proto.version);
}

test "ProtocolVersion: fromHex with 0x prefix" {
    const proto = fromHex("0x43") orelse unreachable;
    try std.testing.expect(proto.equals(ETH_67));
}

test "ProtocolVersion: fromHex returns null for invalid input" {
    try std.testing.expect(fromHex("") == null);
    try std.testing.expect(fromHex("0x") == null);
    try std.testing.expect(fromHex("xyz") == null);
}

test "ProtocolVersion: free function equals" {
    try std.testing.expect(equals(ETH_67, from("eth", 67)));
    try std.testing.expect(!equals(ETH_66, ETH_67));
}

test "ProtocolVersion: complete workflow" {
    // Parse from string
    const proto = fromString("eth/67") orelse unreachable;

    // Check equality
    try std.testing.expect(proto.equals(ETH_67));

    // Compare versions
    try std.testing.expectEqual(@as(i32, 1), proto.compare(ETH_66));
    try std.testing.expectEqual(@as(i32, -1), proto.compare(ETH_68));

    // Convert to string
    const str = try proto.toString(std.testing.allocator);
    defer std.testing.allocator.free(str);
    try std.testing.expectEqualStrings("eth/67", str);

    // toNumber and toHex
    try std.testing.expectEqual(@as(u32, 67), proto.toNumber());
    var buf: [8]u8 = undefined;
    try std.testing.expectEqualStrings("43", proto.toHex(&buf));
}
