//! PeerInfo - Ethereum Peer Information
//!
//! Represents peer information from admin_peers RPC method.
//! Contains metadata about a connected peer including:
//! - Peer identity (ID, name, capabilities)
//! - Network connection details (local/remote addresses, direction)
//! - Protocol-specific state (difficulty, head block)
//!
//! @see https://geth.ethereum.org/docs/interacting-with-geth/rpc/ns-admin#admin-peers
//!
//! ## Usage
//! ```zig
//! const peer = PeerInfo.init(id, "Geth/v1.10.26", &caps, network, protocols);
//! if (peer.isInbound()) {
//!     std.debug.print("Inbound peer: {s}\n", .{peer.name});
//! }
//! ```

const std = @import("std");
const PeerId = @import("../PeerId/PeerId.zig");
const ProtocolVersion = @import("../ProtocolVersion/ProtocolVersion.zig");

/// Network connection information
pub const NetworkInfo = struct {
    /// Local endpoint (IP:PORT)
    local_address: []const u8,
    /// Remote endpoint (IP:PORT)
    remote_address: []const u8,
    /// True if inbound connection
    inbound: bool,
    /// True if trusted peer
    trusted: bool,
    /// True if static node
    static: bool,
};

/// Ethereum protocol information
pub const EthProtocolInfo = struct {
    /// Protocol version
    version: ProtocolVersion.ProtocolVersion,
    /// Total difficulty of peer's chain (as hex string or u256)
    difficulty: u256,
    /// Peer's head block hash (32 bytes)
    head: [32]u8,
};

/// Protocol-specific information
pub const Protocols = struct {
    /// Ethereum protocol info (if supported)
    eth: ?EthProtocolInfo = null,
    // Other protocols can be added here as needed
};

/// Peer information structure
pub const PeerInfo = struct {
    /// Peer ID (enode URL)
    id: PeerId.PeerId,
    /// Remote client identifier (e.g., "Geth/v1.10.26-stable")
    name: []const u8,
    /// Supported capabilities (e.g., ["eth/67", "snap/1"])
    caps: []const []const u8,
    /// Network connection information
    network: NetworkInfo,
    /// Protocol-specific information
    protocols: Protocols,

    const Self = @This();

    /// Check if peer connection is inbound
    pub fn isInbound(self: Self) bool {
        return self.network.inbound;
    }

    /// Check if peer connection is outbound
    pub fn isOutbound(self: Self) bool {
        return !self.network.inbound;
    }

    /// Check if peer is trusted
    pub fn isTrusted(self: Self) bool {
        return self.network.trusted;
    }

    /// Check if peer is a static node
    pub fn isStatic(self: Self) bool {
        return self.network.static;
    }

    /// Check if peer supports a specific capability
    pub fn hasCapability(self: Self, capability: []const u8) bool {
        for (self.caps) |cap| {
            if (std.mem.eql(u8, cap, capability)) {
                return true;
            }
        }
        return false;
    }

    /// Get Ethereum protocol info (if peer supports eth protocol)
    pub fn getEthProtocol(self: Self) ?EthProtocolInfo {
        return self.protocols.eth;
    }

    /// Check if peer supports Ethereum protocol
    pub fn supportsEth(self: Self) bool {
        return self.protocols.eth != null;
    }

    /// Compare two peers by ID
    pub fn equals(self: Self, other: Self) bool {
        return self.id.equals(other.id);
    }
};

/// Create PeerInfo
pub fn init(
    id: PeerId.PeerId,
    name: []const u8,
    caps: []const []const u8,
    network: NetworkInfo,
    protocols: Protocols,
) PeerInfo {
    return .{
        .id = id,
        .name = name,
        .caps = caps,
        .network = network,
        .protocols = protocols,
    };
}

// Tests

const test_caps = [_][]const u8{ "eth/67", "snap/1" };

fn createTestPeer(inbound: bool) PeerInfo {
    const peer_id = PeerId.from("enode://abc@127.0.0.1:30303") catch unreachable;
    return init(
        peer_id,
        "Geth/v1.10.26-stable",
        &test_caps,
        .{
            .local_address = "192.168.1.1:30303",
            .remote_address = "10.0.0.1:30303",
            .inbound = inbound,
            .trusted = false,
            .static = false,
        },
        .{ .eth = null },
    );
}

test "PeerInfo: isInbound returns true for inbound peer" {
    const peer = createTestPeer(true);
    try std.testing.expect(peer.isInbound());
}

test "PeerInfo: isInbound returns false for outbound peer" {
    const peer = createTestPeer(false);
    try std.testing.expect(!peer.isInbound());
}

test "PeerInfo: isOutbound returns true for outbound peer" {
    const peer = createTestPeer(false);
    try std.testing.expect(peer.isOutbound());
}

test "PeerInfo: isOutbound returns false for inbound peer" {
    const peer = createTestPeer(true);
    try std.testing.expect(!peer.isOutbound());
}

test "PeerInfo: isTrusted returns correct value" {
    const peer_id = PeerId.from("enode://abc@127.0.0.1:30303") catch unreachable;
    const peer = init(
        peer_id,
        "Geth/v1.10.26",
        &test_caps,
        .{
            .local_address = "192.168.1.1:30303",
            .remote_address = "10.0.0.1:30303",
            .inbound = false,
            .trusted = true,
            .static = false,
        },
        .{ .eth = null },
    );
    try std.testing.expect(peer.isTrusted());
}

test "PeerInfo: isStatic returns correct value" {
    const peer_id = PeerId.from("enode://abc@127.0.0.1:30303") catch unreachable;
    const peer = init(
        peer_id,
        "Geth/v1.10.26",
        &test_caps,
        .{
            .local_address = "192.168.1.1:30303",
            .remote_address = "10.0.0.1:30303",
            .inbound = false,
            .trusted = false,
            .static = true,
        },
        .{ .eth = null },
    );
    try std.testing.expect(peer.isStatic());
}

test "PeerInfo: hasCapability returns true for supported capability" {
    const peer = createTestPeer(false);
    try std.testing.expect(peer.hasCapability("eth/67"));
    try std.testing.expect(peer.hasCapability("snap/1"));
}

test "PeerInfo: hasCapability returns false for unsupported capability" {
    const peer = createTestPeer(false);
    try std.testing.expect(!peer.hasCapability("eth/66"));
    try std.testing.expect(!peer.hasCapability("les/2"));
}

test "PeerInfo: getEthProtocol returns null when not supported" {
    const peer = createTestPeer(false);
    try std.testing.expectEqual(@as(?EthProtocolInfo, null), peer.getEthProtocol());
}

test "PeerInfo: getEthProtocol returns info when supported" {
    const peer_id = PeerId.from("enode://abc@127.0.0.1:30303") catch unreachable;
    var head: [32]u8 = undefined;
    @memset(&head, 0xAB);

    const peer = init(
        peer_id,
        "Geth/v1.10.26",
        &test_caps,
        .{
            .local_address = "192.168.1.1:30303",
            .remote_address = "10.0.0.1:30303",
            .inbound = false,
            .trusted = false,
            .static = false,
        },
        .{ .eth = .{
            .version = ProtocolVersion.ETH_67,
            .difficulty = 12345678,
            .head = head,
        } },
    );

    const eth = peer.getEthProtocol() orelse unreachable;
    try std.testing.expect(eth.version.equals(ProtocolVersion.ETH_67));
    try std.testing.expectEqual(@as(u256, 12345678), eth.difficulty);
}

test "PeerInfo: supportsEth returns correct value" {
    const peer_without_eth = createTestPeer(false);
    try std.testing.expect(!peer_without_eth.supportsEth());

    const peer_id = PeerId.from("enode://abc@127.0.0.1:30303") catch unreachable;
    var head: [32]u8 = undefined;
    @memset(&head, 0);

    const peer_with_eth = init(
        peer_id,
        "Geth/v1.10.26",
        &test_caps,
        .{
            .local_address = "192.168.1.1:30303",
            .remote_address = "10.0.0.1:30303",
            .inbound = false,
            .trusted = false,
            .static = false,
        },
        .{ .eth = .{
            .version = ProtocolVersion.ETH_67,
            .difficulty = 0,
            .head = head,
        } },
    );
    try std.testing.expect(peer_with_eth.supportsEth());
}

test "PeerInfo: equals compares by ID" {
    const peer1 = createTestPeer(true);
    const peer2 = createTestPeer(false); // Different inbound status, same ID
    try std.testing.expect(peer1.equals(peer2));

    const peer_id_diff = PeerId.from("enode://def@127.0.0.1:30303") catch unreachable;
    const peer3 = init(
        peer_id_diff,
        "Geth/v1.10.26",
        &test_caps,
        .{
            .local_address = "192.168.1.1:30303",
            .remote_address = "10.0.0.1:30303",
            .inbound = true,
            .trusted = false,
            .static = false,
        },
        .{ .eth = null },
    );
    try std.testing.expect(!peer1.equals(peer3));
}

test "PeerInfo: access name field" {
    const peer = createTestPeer(false);
    try std.testing.expectEqualStrings("Geth/v1.10.26-stable", peer.name);
}

test "PeerInfo: access network addresses" {
    const peer = createTestPeer(false);
    try std.testing.expectEqualStrings("192.168.1.1:30303", peer.network.local_address);
    try std.testing.expectEqualStrings("10.0.0.1:30303", peer.network.remote_address);
}

test "PeerInfo: complete workflow" {
    const peer_id = PeerId.from("enode://abc@10.0.0.1:30303") catch unreachable;
    var head: [32]u8 = undefined;
    @memset(&head, 0xCD);

    const peer = init(
        peer_id,
        "Geth/v1.10.26-stable-abc123",
        &test_caps,
        .{
            .local_address = "192.168.1.100:30303",
            .remote_address = "10.0.0.1:30303",
            .inbound = true,
            .trusted = true,
            .static = false,
        },
        .{ .eth = .{
            .version = ProtocolVersion.ETH_68,
            .difficulty = 999999999999,
            .head = head,
        } },
    );

    // Check connection properties
    try std.testing.expect(peer.isInbound());
    try std.testing.expect(peer.isTrusted());
    try std.testing.expect(!peer.isStatic());

    // Check capabilities
    try std.testing.expect(peer.hasCapability("eth/67"));
    try std.testing.expect(peer.hasCapability("snap/1"));
    try std.testing.expect(!peer.hasCapability("eth/66"));

    // Check protocol info
    try std.testing.expect(peer.supportsEth());
    const eth = peer.getEthProtocol() orelse unreachable;
    try std.testing.expect(eth.version.equals(ProtocolVersion.ETH_68));
}
