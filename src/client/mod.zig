// =============================================================================
// Guillotine Ethereum Client
// =============================================================================

const std = @import("std");

// =============================================================================
// Core Client Exports
// =============================================================================

pub const Client = @import("client.zig").Client;
pub const ClientConfig = @import("client.zig").ClientConfig;
pub const ClientError = @import("client.zig").ClientError;

// Convenience functions
pub const createHttpClient = @import("client.zig").createHttpClient;
pub const createHttpClientWithChainId = @import("client.zig").createHttpClientWithChainId;

// =============================================================================
// Transport Layer Exports
// =============================================================================

pub const Transport = @import("transport/mod.zig").Transport;
pub const TransportConfig = @import("transport/mod.zig").TransportConfig;
pub const TransportError = @import("transport/mod.zig").TransportError;

// HTTP Transport
pub const HttpTransport = @import("transport/mod.zig").HttpTransport;
pub const HttpConfig = @import("transport/mod.zig").HttpConfig;

// =============================================================================
// JSON-RPC Exports
// =============================================================================

pub const JsonRpcRequest = @import("jsonrpc/types.zig").JsonRpcRequest;
pub const JsonRpcResponse = @import("jsonrpc/types.zig").JsonRpcResponse;
pub const JsonValue = @import("jsonrpc/types.zig").JsonValue;
pub const JsonRpcError = @import("jsonrpc/types.zig").JsonRpcError;
pub const generateId = @import("jsonrpc/types.zig").generateId;

// JSON-RPC Method Helpers
pub const jsonrpc = @import("jsonrpc/methods.zig").jsonrpc;
pub const createRequest = @import("jsonrpc/methods.zig").createRequest;
pub const handleError = @import("jsonrpc/methods.zig").handleError;

// =============================================================================
// Type Definitions
// =============================================================================

// Re-export common types for convenience
pub const Allocator = std.mem.Allocator;

// =============================================================================
// Usage Examples
// =============================================================================

// Example usage patterns (for documentation)
pub const examples = struct {

    // Basic HTTP client usage
    pub fn basicHttpClient(allocator: Allocator, url: []const u8) !Client {
        return createHttpClient(allocator, url);
    }

    // HTTP client with chain ID
    pub fn httpClientWithChainId(allocator: Allocator, url: []const u8, chain_id: u64) !Client {
        return createHttpClientWithChainId(allocator, url, chain_id);
    }

    // Direct EIP-1193 style request
    pub fn directRequest(client: *Client, method: []const u8, params: JsonValue) !JsonRpcResponse {
        const req = client.createRequest(method, params);
        return client.request(req);
    }

    // Using helper methods
    pub fn chainIdRequest(client: *Client) !u64 {
        const req = jsonrpc.chainId.request();
        const res = try client.request(req);
        return jsonrpc.chainId.response(res);
    }
};

// =============================================================================
// Tests
// =============================================================================

const testing = std.testing;

test "Client module exports" {
    // Test that all exports are accessible
    const allocator = testing.allocator;

    // Test client creation
    var client = try createHttpClient(allocator, "https://test.com");
    defer client.deinit();

    // Test that client is properly initialized
    try testing.expectEqualStrings("http", client.getTransportType());
    try testing.expect(client.isConnected());
}

test "Transport config creation" {
    const config = TransportConfig.http_config("https://test.com");
    switch (config) {
        .http => |http_config| {
            try testing.expectEqualStrings("https://test.com", http_config.url);
        },
        .ipc => {
            try testing.expect(false); // This test should create HTTP config
        },
    }
}

test "JSON-RPC request creation" {
    const req = jsonrpc.chainId.request();
    try testing.expectEqualStrings("eth_chainId", req.method);
    try testing.expect(req.id > 0);
}

test "JsonValue creation" {
    const str_val = JsonValue.fromString("test");
    try testing.expectEqualStrings("test", try str_val.toString());

    const num_val = JsonValue.fromU64(42);
    try testing.expect(try num_val.toU64() == 42);
}

test "Client configuration" {
    const allocator = testing.allocator;

    const transport_config = TransportConfig.http_config("https://test.com");
    const client_config = ClientConfig.init(transport_config)
        .withChainId(1)
        .withTimeout(10000);

    var client = try Client.init(allocator, client_config);
    defer client.deinit();

    try testing.expect(client.getChainId().? == 1);
}

test "Example usage patterns" {
    const allocator = testing.allocator;

    // Test basic HTTP client
    var client = try examples.basicHttpClient(allocator, "https://test.com");
    defer client.deinit();

    try testing.expectEqualStrings("http", client.getTransportType());

    // Test HTTP client with chain ID
    var client_with_chain = try examples.httpClientWithChainId(allocator, "https://test.com", 1);
    defer client_with_chain.deinit();

    try testing.expect(client_with_chain.getChainId().? == 1);
}
