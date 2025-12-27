//! NodeInfo - Ethereum Node Information
//!
//! Represents node information from admin_nodeInfo RPC method.
//! Contains metadata about the local Ethereum node including:
//! - Network identity (enode, ID, IP)
//! - Protocol information
//! - Chain state (genesis, head, difficulty)
//! - Listening ports
//!
//! @see https://geth.ethereum.org/docs/interacting-with-geth/rpc/ns-admin#admin-nodeinfo
//!
//! ## Usage
//! ```zig
//! const node = NodeInfo.init(enode, id, ip, listen_addr, name, ports, protocols);
//! std.debug.print("Node: {s}\n", .{node.name});
//! if (node.getEthProtocol()) |eth| {
//!     std.debug.print("Network ID: {d}\n", .{eth.network});
//! }
//! ```

const std = @import("std");
const PeerId = @import("../PeerId/PeerId.zig");
const NetworkId = @import("../NetworkId/NetworkId.zig");

/// Network ports configuration
pub const Ports = struct {
    /// UDP discovery port
    discovery: u16,
    /// TCP listener port
    listener: u16,
};

/// Ethereum protocol information for node
pub const EthProtocolInfo = struct {
    /// Network ID
    network: NetworkId.NetworkId,
    /// Total difficulty of the chain
    difficulty: u256,
    /// Genesis block hash (32 bytes)
    genesis: [32]u8,
    /// Current head block hash (32 bytes)
    head: [32]u8,
    // Note: config field from TS is omitted - can add as needed
};

/// Protocol-specific information
pub const Protocols = struct {
    /// Ethereum protocol info (if supported)
    eth: ?EthProtocolInfo = null,
    // Other protocols (snap, les, etc.) can be added here
};

/// Node information structure
pub const NodeInfo = struct {
    /// Enode URL of the node
    enode: PeerId.PeerId,
    /// Node ID (hex-encoded public key)
    id: []const u8,
    /// External IP address
    ip: []const u8,
    /// Listen address (IP:PORT)
    listen_addr: []const u8,
    /// Client identifier (e.g., "Geth/v1.10.26-stable/linux-amd64/go1.19.5")
    name: []const u8,
    /// Network ports
    ports: Ports,
    /// Protocol-specific information
    protocols: Protocols,

    const Self = @This();

    /// Get protocol information by name
    /// Currently only supports "eth"
    pub fn getProtocol(self: Self, protocol_name: []const u8) ?EthProtocolInfo {
        if (std.mem.eql(u8, protocol_name, "eth")) {
            return self.protocols.eth;
        }
        return null;
    }

    /// Get Ethereum protocol info (if node supports eth protocol)
    pub fn getEthProtocol(self: Self) ?EthProtocolInfo {
        return self.protocols.eth;
    }

    /// Check if node supports Ethereum protocol
    pub fn supportsEth(self: Self) bool {
        return self.protocols.eth != null;
    }

    /// Get network ID (if eth protocol supported)
    pub fn getNetworkId(self: Self) ?NetworkId.NetworkId {
        if (self.protocols.eth) |eth| {
            return eth.network;
        }
        return null;
    }

    /// Get TCP listener port
    pub fn getListenerPort(self: Self) u16 {
        return self.ports.listener;
    }

    /// Get UDP discovery port
    pub fn getDiscoveryPort(self: Self) u16 {
        return self.ports.discovery;
    }

    /// Check if this is a mainnet node (by network ID)
    pub fn isMainnet(self: Self) bool {
        if (self.protocols.eth) |eth| {
            return NetworkId.isMainnet(eth.network);
        }
        return false;
    }

    /// Get the node's public key from enode URL
    pub fn getPublicKey(self: Self) ?[]const u8 {
        return self.enode.getNodeId();
    }

    /// Check equality with another NodeInfo
    pub fn equals(self: Self, other: Self) bool {
        // Compare by node ID (most unique identifier)
        return std.mem.eql(u8, self.id, other.id);
    }

    /// Parse enode URL components from this node's enode
    pub fn parseEnode(self: Self) !PeerId.EnodeComponents {
        return self.enode.parse();
    }

    /// Format as enode URL string
    /// Returns the stored enode URL
    pub fn toEnode(self: Self) []const u8 {
        return self.enode.toString();
    }
};

/// Create NodeInfo from components
pub fn init(
    enode: PeerId.PeerId,
    id: []const u8,
    ip: []const u8,
    listen_addr: []const u8,
    name: []const u8,
    ports: Ports,
    protocols: Protocols,
) NodeInfo {
    return .{
        .enode = enode,
        .id = id,
        .ip = ip,
        .listen_addr = listen_addr,
        .name = name,
        .ports = ports,
        .protocols = protocols,
    };
}

/// Alias for init - create NodeInfo from components
pub const from = init;

// Tests

fn createTestNode(with_eth: bool) NodeInfo {
    const enode = PeerId.from("enode://abc123def456@192.168.1.1:30303") catch unreachable;
    var genesis: [32]u8 = undefined;
    var head: [32]u8 = undefined;
    @memset(&genesis, 0xAA);
    @memset(&head, 0xBB);

    const eth_info: ?EthProtocolInfo = if (with_eth) .{
        .network = NetworkId.MAINNET,
        .difficulty = 123456789,
        .genesis = genesis,
        .head = head,
    } else null;

    return init(
        enode,
        "abc123def456",
        "192.168.1.1",
        "192.168.1.1:30303",
        "Geth/v1.10.26-stable/linux-amd64/go1.19.5",
        .{ .discovery = 30301, .listener = 30303 },
        .{ .eth = eth_info },
    );
}

test "NodeInfo: getProtocol returns eth info" {
    const node = createTestNode(true);
    const eth = node.getProtocol("eth") orelse unreachable;
    try std.testing.expectEqual(NetworkId.MAINNET, eth.network);
}

test "NodeInfo: getProtocol returns null for unknown protocol" {
    const node = createTestNode(true);
    try std.testing.expectEqual(@as(?EthProtocolInfo, null), node.getProtocol("snap"));
    try std.testing.expectEqual(@as(?EthProtocolInfo, null), node.getProtocol("les"));
}

test "NodeInfo: getEthProtocol returns info when supported" {
    const node = createTestNode(true);
    const eth = node.getEthProtocol() orelse unreachable;
    try std.testing.expectEqual(NetworkId.MAINNET, eth.network);
    try std.testing.expectEqual(@as(u256, 123456789), eth.difficulty);
}

test "NodeInfo: getEthProtocol returns null when not supported" {
    const node = createTestNode(false);
    try std.testing.expectEqual(@as(?EthProtocolInfo, null), node.getEthProtocol());
}

test "NodeInfo: supportsEth returns correct value" {
    const node_with_eth = createTestNode(true);
    try std.testing.expect(node_with_eth.supportsEth());

    const node_without_eth = createTestNode(false);
    try std.testing.expect(!node_without_eth.supportsEth());
}

test "NodeInfo: getNetworkId returns ID when eth supported" {
    const node = createTestNode(true);
    const net_id = node.getNetworkId() orelse unreachable;
    try std.testing.expectEqual(NetworkId.MAINNET, net_id);
}

test "NodeInfo: getNetworkId returns null when eth not supported" {
    const node = createTestNode(false);
    try std.testing.expectEqual(@as(?NetworkId.NetworkId, null), node.getNetworkId());
}

test "NodeInfo: getListenerPort returns correct port" {
    const node = createTestNode(true);
    try std.testing.expectEqual(@as(u16, 30303), node.getListenerPort());
}

test "NodeInfo: getDiscoveryPort returns correct port" {
    const node = createTestNode(true);
    try std.testing.expectEqual(@as(u16, 30301), node.getDiscoveryPort());
}

test "NodeInfo: isMainnet returns true for mainnet node" {
    const node = createTestNode(true);
    try std.testing.expect(node.isMainnet());
}

test "NodeInfo: isMainnet returns false when eth not supported" {
    const node = createTestNode(false);
    try std.testing.expect(!node.isMainnet());
}

test "NodeInfo: isMainnet returns false for non-mainnet" {
    const enode = PeerId.from("enode://abc@192.168.1.1:30303") catch unreachable;
    var genesis: [32]u8 = undefined;
    var head: [32]u8 = undefined;
    @memset(&genesis, 0);
    @memset(&head, 0);

    const node = init(
        enode,
        "abc",
        "192.168.1.1",
        "192.168.1.1:30303",
        "Geth/v1.10.26",
        .{ .discovery = 30301, .listener = 30303 },
        .{ .eth = .{
            .network = NetworkId.SEPOLIA,
            .difficulty = 0,
            .genesis = genesis,
            .head = head,
        } },
    );
    try std.testing.expect(!node.isMainnet());
}

test "NodeInfo: getPublicKey returns node ID from enode" {
    const node = createTestNode(true);
    const pubkey = node.getPublicKey() orelse unreachable;
    try std.testing.expectEqualStrings("abc123def456", pubkey);
}

test "NodeInfo: access name field" {
    const node = createTestNode(true);
    try std.testing.expectEqualStrings("Geth/v1.10.26-stable/linux-amd64/go1.19.5", node.name);
}

test "NodeInfo: access ip field" {
    const node = createTestNode(true);
    try std.testing.expectEqualStrings("192.168.1.1", node.ip);
}

test "NodeInfo: access listen_addr field" {
    const node = createTestNode(true);
    try std.testing.expectEqualStrings("192.168.1.1:30303", node.listen_addr);
}

test "NodeInfo: access id field" {
    const node = createTestNode(true);
    try std.testing.expectEqualStrings("abc123def456", node.id);
}

test "NodeInfo: complete workflow" {
    const enode = PeerId.from("enode://6f8a80d14311c39f35f516fa664deaaaa13e85b2f7493f37f6144d86991ec012937307647bd3b9a82abe2974e1407241d54947bbb39763a4cac9f77166ad92a0@203.0.113.100:30303") catch unreachable;
    var genesis: [32]u8 = undefined;
    var head: [32]u8 = undefined;
    @memset(&genesis, 0xD4);
    @memset(&head, 0xE5);

    const node = init(
        enode,
        "6f8a80d14311c39f35f516fa664deaaaa13e85b2f7493f37f6144d86991ec012937307647bd3b9a82abe2974e1407241d54947bbb39763a4cac9f77166ad92a0",
        "203.0.113.100",
        "0.0.0.0:30303",
        "Geth/v1.13.0-stable/linux-amd64/go1.21.0",
        .{ .discovery = 30301, .listener = 30303 },
        .{ .eth = .{
            .network = NetworkId.MAINNET,
            .difficulty = 58750003716598352816469,
            .genesis = genesis,
            .head = head,
        } },
    );

    // Check basic info
    try std.testing.expectEqualStrings("Geth/v1.13.0-stable/linux-amd64/go1.21.0", node.name);
    try std.testing.expectEqualStrings("203.0.113.100", node.ip);

    // Check ports
    try std.testing.expectEqual(@as(u16, 30303), node.getListenerPort());
    try std.testing.expectEqual(@as(u16, 30301), node.getDiscoveryPort());

    // Check network
    try std.testing.expect(node.isMainnet());
    try std.testing.expect(node.supportsEth());

    // Check protocol info
    const eth = node.getEthProtocol() orelse unreachable;
    try std.testing.expectEqual(NetworkId.MAINNET, eth.network);

    // Get network ID
    const net_id = node.getNetworkId() orelse unreachable;
    try std.testing.expect(NetworkId.isMainnet(net_id));
}

test "NodeInfo: equals returns true for same node ID" {
    const node1 = createTestNode(true);
    const node2 = createTestNode(true);
    try std.testing.expect(node1.equals(node2));
}

test "NodeInfo: equals returns false for different node IDs" {
    const node1 = createTestNode(true);
    const enode2 = PeerId.from("enode://different@192.168.1.2:30304") catch unreachable;
    const node2 = init(
        enode2,
        "different_id",
        "192.168.1.2",
        "192.168.1.2:30304",
        "Geth/v1.10.26-stable",
        .{ .discovery = 30301, .listener = 30304 },
        .{ .eth = null },
    );
    try std.testing.expect(!node1.equals(node2));
}

test "NodeInfo: toEnode returns enode URL string" {
    const node = createTestNode(true);
    const enode_str = node.toEnode();
    try std.testing.expect(std.mem.startsWith(u8, enode_str, "enode://"));
}

test "NodeInfo: parseEnode extracts components" {
    const enode_str = "enode://6f8a80d14311c39f35f516fa664deaaaa13e85b2f7493f37f6144d86991ec012937307647bd3b9a82abe2974e1407241d54947bbb39763a4cac9f77166ad92a0@192.168.1.100:30303?discport=30301";
    const enode = PeerId.from(enode_str) catch unreachable;
    var genesis: [32]u8 = undefined;
    var head: [32]u8 = undefined;
    @memset(&genesis, 0);
    @memset(&head, 0);

    const node = init(
        enode,
        "6f8a80d14311c39f35f516fa664deaaaa13e85b2f7493f37f6144d86991ec012937307647bd3b9a82abe2974e1407241d54947bbb39763a4cac9f77166ad92a0",
        "192.168.1.100",
        "192.168.1.100:30303",
        "Geth/v1.10.26",
        .{ .discovery = 30301, .listener = 30303 },
        .{ .eth = null },
    );

    const parsed = try node.parseEnode();
    try std.testing.expectEqualStrings("192.168.1.100", parsed.ip);
    try std.testing.expectEqual(@as(u16, 30303), parsed.port);
    try std.testing.expectEqual(@as(?u16, 30301), parsed.discovery_port);
}

test "NodeInfo: from alias works same as init" {
    const enode = PeerId.from("enode://abc@10.0.0.1:30303") catch unreachable;
    const node = from(
        enode,
        "abc",
        "10.0.0.1",
        "10.0.0.1:30303",
        "TestNode",
        .{ .discovery = 30301, .listener = 30303 },
        .{ .eth = null },
    );
    try std.testing.expectEqualStrings("TestNode", node.name);
    try std.testing.expectEqualStrings("10.0.0.1", node.ip);
}
