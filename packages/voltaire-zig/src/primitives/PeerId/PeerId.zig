//! PeerId - Ethereum Peer Identifier
//!
//! A PeerId is a 64-byte uncompressed secp256k1 public key (without 0x04 prefix)
//! used to identify peers in the devp2p protocol.
//!
//! ## Enode URL Format
//! enode://PUBKEY@IP:PORT?discport=DISCPORT
//! - PUBKEY: 128 hex character node ID (64-byte public key)
//! - IP: IPv4 or IPv6 address
//! - PORT: TCP port for RLPx connection
//! - DISCPORT: (optional) UDP port for peer discovery
//!
//! ## Example
//! ```
//! enode://6f8a80d14311c39f35f516fa664deaaaa13e85b2f7493f37f6144d86991ec012937307647bd3b9a82abe2974e1407241d54947bbb39763a4cac9f77166ad92a0@10.3.58.6:30303?discport=30301
//! ```
//!
//! ## Usage
//! ```zig
//! const PeerId = @import("primitives").PeerId;
//!
//! // From hex string
//! const peer = try PeerId.fromHex("6f8a80d1...");
//!
//! // From public key
//! const peer2 = PeerId.fromPublicKey(pub_key);
//!
//! // To enode URL
//! const enode = try peer.toEnode(allocator, "10.3.58.6", 30303, null);
//! defer allocator.free(enode);
//! ```

const std = @import("std");
const PublicKey = @import("../PublicKey/PublicKey.zig");

/// PeerId - 64-byte public key identifying a devp2p peer
/// Stored as raw bytes (x,y coordinates), without 0x04 prefix
pub const PeerId = [64]u8;

/// Parsed enode URL components
pub const EnodeComponents = struct {
    /// Node public key (64 bytes)
    public_key: PeerId,
    /// IP address string
    ip: []const u8,
    /// TCP port for RLPx
    port: u16,
    /// UDP port for discovery (optional)
    discovery_port: ?u16,
};

/// Enode URL prefix
const ENODE_PREFIX = "enode://";

/// Create PeerId from raw bytes
pub fn from(bytes: [64]u8) PeerId {
    return bytes;
}

/// Create PeerId from byte slice
/// Returns error if slice is not exactly 64 bytes
pub fn fromSlice(bytes: []const u8) !PeerId {
    if (bytes.len != 64) return error.InvalidLength;
    var result: PeerId = undefined;
    @memcpy(&result, bytes);
    return result;
}

/// Create PeerId from hex string
/// Accepts with or without 0x prefix
/// Expects 64 bytes (128 hex characters)
pub fn fromHex(hex_str: []const u8) !PeerId {
    var slice = hex_str;
    if (slice.len >= 2 and slice[0] == '0' and (slice[1] == 'x' or slice[1] == 'X')) {
        if (slice.len != 130) return error.InvalidHexLength;
        slice = slice[2..];
    } else {
        if (slice.len != 128) return error.InvalidHexLength;
    }

    var result: PeerId = undefined;
    _ = std.fmt.hexToBytes(&result, slice) catch return error.InvalidHexFormat;
    return result;
}

/// Create PeerId from secp256k1 PublicKey
pub fn fromPublicKey(pk: PublicKey) PeerId {
    return pk.bytes;
}

/// Convert PeerId to hex string (128 characters, no prefix)
pub fn toHex(peer_id: PeerId) [128]u8 {
    var result: [128]u8 = undefined;
    _ = std.fmt.bytesToHex(&result, &peer_id, .lower);
    return result;
}

/// Convert PeerId to hex string with 0x prefix (130 characters)
pub fn toHexPrefixed(peer_id: PeerId) [130]u8 {
    var result: [130]u8 = undefined;
    result[0] = '0';
    result[1] = 'x';
    _ = std.fmt.bytesToHex(result[2..], &peer_id, .lower);
    return result;
}

/// Convert PeerId to PublicKey
pub fn toPublicKey(peer_id: PeerId) PublicKey {
    return .{ .bytes = peer_id };
}

/// Format PeerId as enode URL
/// Format: enode://PUBKEY@IP:PORT or enode://PUBKEY@IP:PORT?discport=DISCPORT
/// Caller owns returned memory
pub fn toEnode(
    peer_id: PeerId,
    allocator: std.mem.Allocator,
    ip: []const u8,
    port: u16,
    discovery_port: ?u16,
) ![]u8 {
    const pubkey_hex = toHex(peer_id);

    if (discovery_port) |dp| {
        return std.fmt.allocPrint(allocator, "enode://{s}@{s}:{d}?discport={d}", .{ pubkey_hex, ip, port, dp });
    } else {
        return std.fmt.allocPrint(allocator, "enode://{s}@{s}:{d}", .{ pubkey_hex, ip, port });
    }
}

/// Check if two PeerIds are equal
pub fn equals(a: PeerId, b: PeerId) bool {
    return std.mem.eql(u8, &a, &b);
}

/// Parse enode URL into components
/// Returns error if not a valid enode URL format
pub fn parseEnode(enode: []const u8) !EnodeComponents {
    if (!std.mem.startsWith(u8, enode, ENODE_PREFIX)) {
        return error.InvalidEnodePrefix;
    }

    // Remove enode:// prefix
    const without_prefix = enode[ENODE_PREFIX.len..];

    // Find @ separator
    const at_idx = std.mem.indexOf(u8, without_prefix, "@") orelse return error.MissingAtSeparator;
    if (at_idx == 0) return error.MissingAtSeparator;

    const pubkey_hex = without_prefix[0..at_idx];

    // Validate public key - should be 128 hex chars
    if (pubkey_hex.len != 128) return error.InvalidPublicKeyLength;

    // Parse hex to bytes
    var public_key: PeerId = undefined;
    _ = std.fmt.hexToBytes(&public_key, pubkey_hex) catch return error.InvalidPublicKeyHex;

    const address_part = without_prefix[at_idx + 1 ..];

    // Split address part into IP:PORT and query string
    const query_idx = std.mem.indexOf(u8, address_part, "?");
    const ip_port_part = if (query_idx) |idx| address_part[0..idx] else address_part;
    const query_part = if (query_idx) |idx| address_part[idx + 1 ..] else null;

    // Parse IP and port
    var ip: []const u8 = undefined;
    var port: u16 = undefined;

    if (ip_port_part.len > 0 and ip_port_part[0] == '[') {
        // IPv6 format: [ip]:port
        const close_bracket = std.mem.indexOf(u8, ip_port_part, "]") orelse return error.InvalidIPv6Format;
        ip = ip_port_part[1..close_bracket];
        if (close_bracket + 2 >= ip_port_part.len) return error.MissingPort;
        const port_str = ip_port_part[close_bracket + 2 ..];
        port = std.fmt.parseInt(u16, port_str, 10) catch return error.InvalidPort;
    } else {
        // IPv4 format: ip:port
        const last_colon = std.mem.lastIndexOf(u8, ip_port_part, ":") orelse return error.MissingPort;
        ip = ip_port_part[0..last_colon];
        const port_str = ip_port_part[last_colon + 1 ..];
        port = std.fmt.parseInt(u16, port_str, 10) catch return error.InvalidPort;
    }

    // Parse discovery port from query string
    var discovery_port: ?u16 = null;
    if (query_part) |query| {
        // Simple query parser for discport=VALUE
        if (std.mem.indexOf(u8, query, "discport=")) |discport_idx| {
            const value_start = discport_idx + 9; // len("discport=")
            const value_end = std.mem.indexOfAny(u8, query[value_start..], "&") orelse query.len - value_start;
            const discport_str = query[value_start .. value_start + value_end];
            discovery_port = std.fmt.parseInt(u16, discport_str, 10) catch return error.InvalidDiscoveryPort;
        }
    }

    return .{
        .public_key = public_key,
        .ip = ip,
        .port = port,
        .discovery_port = discovery_port,
    };
}

/// Create PeerId from enode URL
pub fn fromEnode(enode: []const u8) !PeerId {
    const components = try parseEnode(enode);
    return components.public_key;
}

// ============================================================================
// Tests
// ============================================================================

test "PeerId: from creates from bytes" {
    var bytes: [64]u8 = undefined;
    @memset(&bytes, 0xAB);

    const peer = from(bytes);
    try std.testing.expectEqualSlices(u8, &bytes, &peer);
}

test "PeerId: fromSlice creates from slice" {
    var bytes: [64]u8 = undefined;
    @memset(&bytes, 0xCD);

    const peer = try fromSlice(&bytes);
    try std.testing.expectEqualSlices(u8, &bytes, &peer);
}

test "PeerId: fromSlice rejects invalid length" {
    const short: [32]u8 = undefined;
    try std.testing.expectError(error.InvalidLength, fromSlice(&short));
}

test "PeerId: fromHex creates from hex string" {
    const hex = "6f8a80d14311c39f35f516fa664deaaaa13e85b2f7493f37f6144d86991ec012937307647bd3b9a82abe2974e1407241d54947bbb39763a4cac9f77166ad92a0";
    const peer = try fromHex(hex);

    try std.testing.expectEqual(@as(u8, 0x6f), peer[0]);
    try std.testing.expectEqual(@as(u8, 0x8a), peer[1]);
}

test "PeerId: fromHex with 0x prefix" {
    const hex = "0x6f8a80d14311c39f35f516fa664deaaaa13e85b2f7493f37f6144d86991ec012937307647bd3b9a82abe2974e1407241d54947bbb39763a4cac9f77166ad92a0";
    const peer = try fromHex(hex);

    try std.testing.expectEqual(@as(u8, 0x6f), peer[0]);
}

test "PeerId: fromHex rejects invalid length" {
    try std.testing.expectError(error.InvalidHexLength, fromHex("abc123"));
    try std.testing.expectError(error.InvalidHexLength, fromHex("0xabc123"));
}

test "PeerId: fromPublicKey creates from PublicKey" {
    var pk: PublicKey = undefined;
    @memset(&pk.bytes, 0xEF);

    const peer = fromPublicKey(pk);
    try std.testing.expectEqualSlices(u8, &pk.bytes, &peer);
}

test "PeerId: toHex converts to hex string" {
    var peer: PeerId = undefined;
    @memset(&peer, 0x42);

    const hex = toHex(peer);

    try std.testing.expectEqual(@as(usize, 128), hex.len);
    try std.testing.expectEqual(@as(u8, '4'), hex[0]);
    try std.testing.expectEqual(@as(u8, '2'), hex[1]);
}

test "PeerId: toHexPrefixed includes 0x prefix" {
    var peer: PeerId = undefined;
    @memset(&peer, 0x42);

    const hex = toHexPrefixed(peer);

    try std.testing.expectEqual(@as(usize, 130), hex.len);
    try std.testing.expectEqual(@as(u8, '0'), hex[0]);
    try std.testing.expectEqual(@as(u8, 'x'), hex[1]);
    try std.testing.expectEqual(@as(u8, '4'), hex[2]);
}

test "PeerId: toPublicKey converts to PublicKey" {
    var peer: PeerId = undefined;
    @memset(&peer, 0xAA);

    const pk = toPublicKey(peer);
    try std.testing.expectEqualSlices(u8, &peer, &pk.bytes);
}

test "PeerId: toEnode formats as enode URL" {
    var peer: PeerId = undefined;
    @memset(&peer, 0xAB);

    const enode = try toEnode(peer, std.testing.allocator, "192.168.1.1", 30303, null);
    defer std.testing.allocator.free(enode);

    try std.testing.expect(std.mem.startsWith(u8, enode, "enode://"));
    try std.testing.expect(std.mem.indexOf(u8, enode, "@192.168.1.1:30303") != null);
}

test "PeerId: toEnode with discovery port" {
    var peer: PeerId = undefined;
    @memset(&peer, 0xCD);

    const enode = try toEnode(peer, std.testing.allocator, "10.0.0.1", 30303, 30301);
    defer std.testing.allocator.free(enode);

    try std.testing.expect(std.mem.indexOf(u8, enode, "?discport=30301") != null);
}

test "PeerId: equals returns true for same peer" {
    var peer1: PeerId = undefined;
    @memset(&peer1, 0x11);

    var peer2: PeerId = undefined;
    @memset(&peer2, 0x11);

    try std.testing.expect(equals(peer1, peer2));
}

test "PeerId: equals returns false for different peers" {
    var peer1: PeerId = undefined;
    @memset(&peer1, 0x11);

    var peer2: PeerId = undefined;
    @memset(&peer2, 0x22);

    try std.testing.expect(!equals(peer1, peer2));
}

test "PeerId: parseEnode parses valid enode" {
    const enode = "enode://6f8a80d14311c39f35f516fa664deaaaa13e85b2f7493f37f6144d86991ec012937307647bd3b9a82abe2974e1407241d54947bbb39763a4cac9f77166ad92a0@10.3.58.6:30303";

    const parsed = try parseEnode(enode);

    try std.testing.expectEqualStrings("10.3.58.6", parsed.ip);
    try std.testing.expectEqual(@as(u16, 30303), parsed.port);
    try std.testing.expectEqual(@as(?u16, null), parsed.discovery_port);
    try std.testing.expectEqual(@as(u8, 0x6f), parsed.public_key[0]);
}

test "PeerId: parseEnode with discovery port" {
    const enode = "enode://6f8a80d14311c39f35f516fa664deaaaa13e85b2f7493f37f6144d86991ec012937307647bd3b9a82abe2974e1407241d54947bbb39763a4cac9f77166ad92a0@10.3.58.6:30303?discport=30301";

    const parsed = try parseEnode(enode);

    try std.testing.expectEqual(@as(?u16, 30301), parsed.discovery_port);
}

test "PeerId: parseEnode rejects invalid prefix" {
    try std.testing.expectError(error.InvalidEnodePrefix, parseEnode("http://abc@127.0.0.1:30303"));
}

test "PeerId: parseEnode rejects missing @" {
    try std.testing.expectError(error.MissingAtSeparator, parseEnode("enode://abc123"));
}

test "PeerId: parseEnode rejects invalid pubkey length" {
    try std.testing.expectError(error.InvalidPublicKeyLength, parseEnode("enode://abc@127.0.0.1:30303"));
}

test "PeerId: fromEnode extracts PeerId from enode URL" {
    const enode = "enode://6f8a80d14311c39f35f516fa664deaaaa13e85b2f7493f37f6144d86991ec012937307647bd3b9a82abe2974e1407241d54947bbb39763a4cac9f77166ad92a0@192.168.1.1:30303";

    const peer = try fromEnode(enode);

    try std.testing.expectEqual(@as(u8, 0x6f), peer[0]);
    try std.testing.expectEqual(@as(u8, 0xa0), peer[63]);
}

test "PeerId: round trip hex" {
    const original_hex = "6f8a80d14311c39f35f516fa664deaaaa13e85b2f7493f37f6144d86991ec012937307647bd3b9a82abe2974e1407241d54947bbb39763a4cac9f77166ad92a0";
    const peer = try fromHex(original_hex);
    const result_hex = toHex(peer);

    try std.testing.expectEqualStrings(original_hex, &result_hex);
}

test "PeerId: round trip enode" {
    const original_enode = "enode://6f8a80d14311c39f35f516fa664deaaaa13e85b2f7493f37f6144d86991ec012937307647bd3b9a82abe2974e1407241d54947bbb39763a4cac9f77166ad92a0@192.168.1.100:30303?discport=30301";

    // Parse original enode
    const parsed = try parseEnode(original_enode);

    // Recreate enode URL
    const recreated = try toEnode(parsed.public_key, std.testing.allocator, parsed.ip, parsed.port, parsed.discovery_port);
    defer std.testing.allocator.free(recreated);

    // Compare (should match)
    try std.testing.expectEqualStrings(original_enode, recreated);
}

test "PeerId: complete workflow" {
    // Create PeerId from hex
    const hex = "6f8a80d14311c39f35f516fa664deaaaa13e85b2f7493f37f6144d86991ec012937307647bd3b9a82abe2974e1407241d54947bbb39763a4cac9f77166ad92a0";
    const peer = try fromHex(hex);

    // Convert to PublicKey
    const pk = toPublicKey(peer);
    try std.testing.expectEqualSlices(u8, &peer, &pk.bytes);

    // Generate enode URL
    const enode = try toEnode(peer, std.testing.allocator, "10.3.58.6", 30303, 30301);
    defer std.testing.allocator.free(enode);

    // Parse enode and verify
    const parsed = try parseEnode(enode);
    try std.testing.expect(equals(peer, parsed.public_key));
    try std.testing.expectEqualStrings("10.3.58.6", parsed.ip);
    try std.testing.expectEqual(@as(u16, 30303), parsed.port);
    try std.testing.expectEqual(@as(?u16, 30301), parsed.discovery_port);
}
