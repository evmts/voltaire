//! NetworkId - Ethereum Network Identifier
//!
//! Represents an Ethereum network ID used for peer-to-peer network identification.
//! Note: NetworkId is NOT the same as ChainId (EIP-155).
//! ChainId is used for replay protection in transactions,
//! while NetworkId is used for peer-to-peer network identification.
//!
//! ## Common Network IDs
//! - Mainnet: 1
//! - Goerli: 5 (deprecated)
//! - Sepolia: 11155111
//! - Holesky: 17000
//!
//! ## Usage
//! ```zig
//! const net = NetworkId.MAINNET;
//! const equal = net.equals(NetworkId.MAINNET);
//! const num = net.toNumber();
//! ```

const std = @import("std");

/// NetworkId type - u64 representing a network identifier
pub const NetworkId = u64;

// Well-known network IDs
pub const MAINNET: NetworkId = 1;
pub const ROPSTEN: NetworkId = 3;
pub const RINKEBY: NetworkId = 4;
pub const GOERLI: NetworkId = 5;
pub const SEPOLIA: NetworkId = 11155111;
pub const HOLESKY: NetworkId = 17000;

/// Create NetworkId from u64 value
/// No validation needed - all u64 values are valid network IDs
pub fn from(value: u64) NetworkId {
    return value;
}

/// Check if two network IDs are equal
pub fn equals(self: NetworkId, other: NetworkId) bool {
    return self == other;
}

/// Convert NetworkId to u64 number
pub fn toNumber(self: NetworkId) u64 {
    return self;
}

/// Check if network ID is Ethereum mainnet
pub fn isMainnet(self: NetworkId) bool {
    return self == MAINNET;
}

/// Create NetworkId from hex string (with or without 0x prefix)
/// Returns null if invalid hex
pub fn fromHex(hex: []const u8) ?NetworkId {
    const start: usize = if (hex.len >= 2 and hex[0] == '0' and (hex[1] == 'x' or hex[1] == 'X')) 2 else 0;
    if (start >= hex.len) return null;

    var result: u64 = 0;
    for (hex[start..]) |c| {
        const digit: u64 = switch (c) {
            '0'...'9' => c - '0',
            'a'...'f' => c - 'a' + 10,
            'A'...'F' => c - 'A' + 10,
            else => return null,
        };
        result = result *% 16 +% digit;
    }
    return result;
}

/// Convert NetworkId to hex string (lowercase, no 0x prefix)
/// Buffer must be at least 16 bytes (64-bit value = 16 hex chars max)
pub fn toHex(self: NetworkId, buf: []u8) []const u8 {
    const hex_chars = "0123456789abcdef";
    var value = self;

    // Find number of significant hex digits
    var temp = value;
    var digits: usize = 0;
    while (temp > 0) : (digits += 1) {
        temp >>= 4;
    }
    if (digits == 0) digits = 1; // At least one digit for 0

    // Fill buffer from right to left
    var i: usize = digits;
    while (i > 0) {
        i -= 1;
        buf[i] = hex_chars[@intCast(value & 0xf)];
        value >>= 4;
    }

    return buf[0..digits];
}

// Tests

test "NetworkId: from creates network ID" {
    const net = from(1);
    try std.testing.expectEqual(@as(NetworkId, 1), net);
}

test "NetworkId: from accepts any u64" {
    _ = from(0);
    _ = from(1);
    _ = from(11155111);
    _ = from(std.math.maxInt(u64));
}

test "NetworkId: constants are correct values" {
    try std.testing.expectEqual(@as(NetworkId, 1), MAINNET);
    try std.testing.expectEqual(@as(NetworkId, 3), ROPSTEN);
    try std.testing.expectEqual(@as(NetworkId, 4), RINKEBY);
    try std.testing.expectEqual(@as(NetworkId, 5), GOERLI);
    try std.testing.expectEqual(@as(NetworkId, 11155111), SEPOLIA);
    try std.testing.expectEqual(@as(NetworkId, 17000), HOLESKY);
}

test "NetworkId: equals returns true for same network" {
    const net1 = from(1);
    const net2 = from(1);
    try std.testing.expect(equals(net1, net2));
}

test "NetworkId: equals returns false for different networks" {
    const net1 = from(1);
    const net2 = from(5);
    try std.testing.expect(!equals(net1, net2));
}

test "NetworkId: equals with constants" {
    try std.testing.expect(equals(MAINNET, from(1)));
    try std.testing.expect(equals(SEPOLIA, from(11155111)));
    try std.testing.expect(!equals(MAINNET, SEPOLIA));
}

test "NetworkId: isMainnet returns true for mainnet" {
    const net = MAINNET;
    try std.testing.expect(isMainnet(net));
}

test "NetworkId: isMainnet returns false for other networks" {
    try std.testing.expect(!isMainnet(GOERLI));
    try std.testing.expect(!isMainnet(SEPOLIA));
    try std.testing.expect(!isMainnet(from(999)));
}

test "NetworkId: toNumber returns underlying value" {
    const net = from(11155111);
    try std.testing.expectEqual(@as(u64, 11155111), toNumber(net));
}

test "NetworkId: toNumber works with constants" {
    try std.testing.expectEqual(@as(u64, 1), toNumber(MAINNET));
    try std.testing.expectEqual(@as(u64, 11155111), toNumber(SEPOLIA));
    try std.testing.expectEqual(@as(u64, 17000), toNumber(HOLESKY));
}

test "NetworkId: toHex returns hex string" {
    var buf: [16]u8 = undefined;

    // Mainnet = 1
    try std.testing.expectEqualStrings("1", toHex(MAINNET, &buf));

    // Goerli = 5
    try std.testing.expectEqualStrings("5", toHex(GOERLI, &buf));

    // Sepolia = 11155111 = 0xaa36a7
    try std.testing.expectEqualStrings("aa36a7", toHex(SEPOLIA, &buf));

    // Holesky = 17000 = 0x4268
    try std.testing.expectEqualStrings("4268", toHex(HOLESKY, &buf));
}

test "NetworkId: toHex with zero" {
    var buf: [16]u8 = undefined;
    try std.testing.expectEqualStrings("0", toHex(from(0), &buf));
}

test "NetworkId: toHex max value" {
    var buf: [16]u8 = undefined;
    try std.testing.expectEqualStrings("ffffffffffffffff", toHex(from(std.math.maxInt(u64)), &buf));
}

test "NetworkId: fromHex parses valid hex" {
    try std.testing.expectEqual(@as(?NetworkId, 1), fromHex("1"));
    try std.testing.expectEqual(@as(?NetworkId, 1), fromHex("0x1"));
    try std.testing.expectEqual(@as(?NetworkId, 1), fromHex("0X1"));
    try std.testing.expectEqual(@as(?NetworkId, 11155111), fromHex("aa36a7"));
    try std.testing.expectEqual(@as(?NetworkId, 11155111), fromHex("0xaa36a7"));
    try std.testing.expectEqual(@as(?NetworkId, 11155111), fromHex("AA36A7"));
}

test "NetworkId: fromHex returns null for invalid input" {
    try std.testing.expectEqual(@as(?NetworkId, null), fromHex(""));
    try std.testing.expectEqual(@as(?NetworkId, null), fromHex("0x"));
    try std.testing.expectEqual(@as(?NetworkId, null), fromHex("xyz"));
    try std.testing.expectEqual(@as(?NetworkId, null), fromHex("0xgg"));
}

test "NetworkId: fromHex roundtrip with toHex" {
    var buf: [16]u8 = undefined;
    const original: NetworkId = 11155111;
    const hex = toHex(original, &buf);
    const parsed = fromHex(hex) orelse unreachable;
    try std.testing.expectEqual(original, parsed);
}

test "NetworkId: complete workflow" {
    // Create from value
    const net = from(1);

    // Check if mainnet
    try std.testing.expect(isMainnet(net));

    // Compare networks
    try std.testing.expect(equals(net, MAINNET));
    try std.testing.expect(!equals(net, SEPOLIA));

    // Convert back to number
    const num = toNumber(net);
    try std.testing.expectEqual(@as(u64, 1), num);

    // Convert to hex
    var buf: [16]u8 = undefined;
    try std.testing.expectEqualStrings("1", toHex(net, &buf));

    // Parse from hex
    const from_hex = fromHex("0x1") orelse unreachable;
    try std.testing.expectEqual(net, from_hex);
}
