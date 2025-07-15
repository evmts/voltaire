const std = @import("std");
const Allocator = std.mem.Allocator;

// Import transport layer
const Transport = @import("transport/mod.zig").Transport;
const TransportConfig = @import("transport/mod.zig").TransportConfig;
const TransportError = @import("transport/mod.zig").TransportError;

// Import JSON-RPC types
const JsonRpcRequest = @import("jsonrpc/types.zig").JsonRpcRequest;
const JsonRpcResponse = @import("jsonrpc/types.zig").JsonRpcResponse;
const JsonValue = @import("jsonrpc/types.zig").JsonValue;
const generateId = @import("jsonrpc/types.zig").generateId;

// =============================================================================
// Client Configuration
// =============================================================================

pub const ClientConfig = struct {
    transport: TransportConfig,
    account: ?[]const u8 = null, // Simplified for now
    chain_id: ?u64 = null,
    request_timeout: u32 = 30000, // 30 seconds
    max_retries: u8 = 3,

    pub fn init(transport: TransportConfig) ClientConfig {
        return ClientConfig{
            .transport = transport,
        };
    }

    pub fn withChainId(self: ClientConfig, chain_id: u64) ClientConfig {
        return ClientConfig{
            .transport = self.transport,
            .account = self.account,
            .chain_id = chain_id,
            .request_timeout = self.request_timeout,
            .max_retries = self.max_retries,
        };
    }

    pub fn withAccount(self: ClientConfig, account: []const u8) ClientConfig {
        return ClientConfig{
            .transport = self.transport,
            .account = account,
            .chain_id = self.chain_id,
            .request_timeout = self.request_timeout,
            .max_retries = self.max_retries,
        };
    }

    pub fn withTimeout(self: ClientConfig, timeout: u32) ClientConfig {
        return ClientConfig{
            .transport = self.transport,
            .account = self.account,
            .chain_id = self.chain_id,
            .request_timeout = timeout,
            .max_retries = self.max_retries,
        };
    }
};

// =============================================================================
// Client Error Types
// =============================================================================

pub const ClientError = error{
    TransportError,
    JsonRpcError,
    InvalidResponse,
    NetworkError,
    Timeout,
    InvalidRequest,
    AccountRequired,
    ChainIdRequired,
    OutOfMemory,
    InvalidJson,
} || Allocator.Error;

// =============================================================================
// Main Client Implementation
// =============================================================================

pub const Client = struct {
    allocator: Allocator,
    transport: Transport,
    account: ?[]const u8,
    chain_id: ?u64,
    request_timeout: u32,
    max_retries: u8,
    request_id: std.atomic.Value(u64),

    // =============================================================================
    // Core API
    // =============================================================================

    /// Main RPC method - handles all Ethereum JSON-RPC calls
    pub fn request(self: *Client, req: JsonRpcRequest) ClientError!JsonRpcResponse {
        const response = self.transport.request(req) catch |err| {
            return switch (err) {
                TransportError.NetworkError => ClientError.NetworkError,
                TransportError.Timeout => ClientError.Timeout,
                TransportError.InvalidResponse => ClientError.InvalidResponse,
                TransportError.InvalidRequest => ClientError.InvalidRequest,
                else => ClientError.TransportError,
            };
        };

        return response;
    }

    // =============================================================================
    // Configuration
    // =============================================================================

    /// Initialize client with transport and configuration
    pub fn init(allocator: Allocator, config: ClientConfig) ClientError!Client {
        const transport = Transport.init(allocator, config.transport) catch |err| {
            return switch (err) {
                TransportError.ConnectionFailed => ClientError.NetworkError,
                TransportError.OutOfMemory => ClientError.OutOfMemory,
                else => ClientError.TransportError,
            };
        };

        return Client{
            .allocator = allocator,
            .transport = transport,
            .account = config.account,
            .chain_id = config.chain_id,
            .request_timeout = config.request_timeout,
            .max_retries = config.max_retries,
            .request_id = std.atomic.Value(u64).init(1),
        };
    }

    /// Clean up client resources
    pub fn deinit(self: *Client) void {
        self.transport.deinit();
    }

    /// Set account for transaction signing
    pub fn setAccount(self: *Client, account: []const u8) void {
        self.account = account;
    }

    /// Get current account
    pub fn getAccount(self: Client) ?[]const u8 {
        return self.account;
    }

    /// Set chain ID for transaction signing
    pub fn setChainId(self: *Client, chain_id: u64) void {
        self.chain_id = chain_id;
    }

    /// Get current chain ID
    pub fn getChainId(self: Client) ?u64 {
        return self.chain_id;
    }

    // =============================================================================
    // Utilities
    // =============================================================================

    /// Generate unique request ID
    fn generateRequestId(self: *Client) u64 {
        return self.request_id.fetchAdd(1, .monotonic);
    }

    /// Create JSON-RPC request with auto-generated ID
    pub fn createRequest(self: *Client, method: []const u8, params: JsonValue) JsonRpcRequest {
        return JsonRpcRequest{
            .method = method,
            .params = params,
            .id = self.generateRequestId(),
        };
    }

    /// Helper for direct method calls without helper functions
    pub fn call(self: *Client, method: []const u8, params: JsonValue) ClientError!JsonRpcResponse {
        const req = self.createRequest(method, params);
        return self.request(req);
    }

    /// Test connection to the Ethereum node
    pub fn testConnection(self: *Client) ClientError!void {
        const req = self.createRequest("eth_chainId", JsonValue{ .null = {} });
        _ = try self.request(req);
    }

    /// Get the transport type
    pub fn getTransportType(self: Client) []const u8 {
        return self.transport.getType();
    }

    /// Check if the client is connected
    pub fn isConnected(self: Client) bool {
        return self.transport.isConnected();
    }
};

// =============================================================================
// Convenience Functions
// =============================================================================

/// Create a client with HTTP transport
pub fn createHttpClient(allocator: Allocator, url: []const u8) ClientError!Client {
    const transport_config = TransportConfig.http_config(url);
    const client_config = ClientConfig.init(transport_config);
    return Client.init(allocator, client_config);
}

/// Create a client with HTTP transport and chain ID
pub fn createHttpClientWithChainId(allocator: Allocator, url: []const u8, chain_id: u64) ClientError!Client {
    const transport_config = TransportConfig.http_config(url);
    const client_config = ClientConfig.init(transport_config).withChainId(chain_id);
    return Client.init(allocator, client_config);
}

// =============================================================================
// Tests
// =============================================================================

const testing = std.testing;

test "ClientConfig creation" {
    const transport_config = TransportConfig.http_config("https://test.com");
    const config = ClientConfig.init(transport_config);

    try testing.expect(config.chain_id == null);
    try testing.expect(config.request_timeout == 30000);
    try testing.expect(config.max_retries == 3);
}

test "ClientConfig with chain ID" {
    const transport_config = TransportConfig.http_config("https://test.com");
    const config = ClientConfig.init(transport_config).withChainId(1);

    try testing.expect(config.chain_id.? == 1);
}

test "ClientConfig with timeout" {
    const transport_config = TransportConfig.http_config("https://test.com");
    const config = ClientConfig.init(transport_config).withTimeout(10000);

    try testing.expect(config.request_timeout == 10000);
}

test "Client initialization" {
    const allocator = testing.allocator;
    const transport_config = TransportConfig.http_config("https://test.com");
    const client_config = ClientConfig.init(transport_config);

    var client = try Client.init(allocator, client_config);
    defer client.deinit();

    try testing.expect(client.chain_id == null);
    try testing.expectEqualStrings("http", client.getTransportType());
    try testing.expect(client.isConnected());
}

test "Client request ID generation" {
    const allocator = testing.allocator;
    const transport_config = TransportConfig.http_config("https://test.com");
    const client_config = ClientConfig.init(transport_config);

    var client = try Client.init(allocator, client_config);
    defer client.deinit();

    const id1 = client.generateRequestId();
    const id2 = client.generateRequestId();
    try testing.expect(id2 > id1);
}

test "Client createRequest" {
    const allocator = testing.allocator;
    const transport_config = TransportConfig.http_config("https://test.com");
    const client_config = ClientConfig.init(transport_config);

    var client = try Client.init(allocator, client_config);
    defer client.deinit();

    const req = client.createRequest("eth_chainId", JsonValue{ .null = {} });
    try testing.expectEqualStrings("eth_chainId", req.method);
    try testing.expect(req.id > 0);
}

test "Client account management" {
    const allocator = testing.allocator;
    const transport_config = TransportConfig.http_config("https://test.com");
    const client_config = ClientConfig.init(transport_config);

    var client = try Client.init(allocator, client_config);
    defer client.deinit();

    try testing.expect(client.getAccount() == null);

    client.setAccount("test_account");
    try testing.expectEqualStrings("test_account", client.getAccount().?);
}

test "Client chain ID management" {
    const allocator = testing.allocator;
    const transport_config = TransportConfig.http_config("https://test.com");
    const client_config = ClientConfig.init(transport_config);

    var client = try Client.init(allocator, client_config);
    defer client.deinit();

    try testing.expect(client.getChainId() == null);

    client.setChainId(1);
    try testing.expect(client.getChainId().? == 1);
}

test "createHttpClient convenience function" {
    const allocator = testing.allocator;

    var client = try createHttpClient(allocator, "https://test.com");
    defer client.deinit();

    try testing.expectEqualStrings("http", client.getTransportType());
}

test "createHttpClientWithChainId convenience function" {
    const allocator = testing.allocator;

    var client = try createHttpClientWithChainId(allocator, "https://test.com", 1);
    defer client.deinit();

    try testing.expect(client.getChainId().? == 1);
}
