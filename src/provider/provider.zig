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
// Provider Configuration
// =============================================================================

pub const ProviderConfig = struct {
    transport: TransportConfig,
    account: ?[]const u8 = null, // Simplified for now
    chain_id: ?u64 = null,
    request_timeout: u32 = 30000, // 30 seconds
    max_retries: u8 = 3,

    pub fn init(transport: TransportConfig) ProviderConfig {
        return ProviderConfig{
            .transport = transport,
        };
    }

    pub fn withChainId(self: ProviderConfig, chain_id: u64) ProviderConfig {
        return ProviderConfig{
            .transport = self.transport,
            .account = self.account,
            .chain_id = chain_id,
            .request_timeout = self.request_timeout,
            .max_retries = self.max_retries,
        };
    }

    pub fn withAccount(self: ProviderConfig, account: []const u8) ProviderConfig {
        return ProviderConfig{
            .transport = self.transport,
            .account = account,
            .chain_id = self.chain_id,
            .request_timeout = self.request_timeout,
            .max_retries = self.max_retries,
        };
    }

    pub fn withTimeout(self: ProviderConfig, timeout: u32) ProviderConfig {
        return ProviderConfig{
            .transport = self.transport,
            .account = self.account,
            .chain_id = self.chain_id,
            .request_timeout = timeout,
            .max_retries = self.max_retries,
        };
    }
};

// =============================================================================
// Provider Error Types
// =============================================================================

pub const ProviderError = error{
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
// Main Provider Implementation
// =============================================================================

pub const Provider = struct {
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
    pub fn request(self: *Provider, req: JsonRpcRequest) ProviderError!JsonRpcResponse {
        const response = self.transport.request(req) catch |err| {
            return switch (err) {
                TransportError.NetworkError => ProviderError.NetworkError,
                TransportError.Timeout => ProviderError.Timeout,
                TransportError.InvalidResponse => ProviderError.InvalidResponse,
                TransportError.InvalidRequest => ProviderError.InvalidRequest,
                else => ProviderError.TransportError,
            };
        };

        return response;
    }

    // =============================================================================
    // Configuration
    // =============================================================================

    /// Initialize provider with transport and configuration
    pub fn init(allocator: Allocator, config: ProviderConfig) ProviderError!Provider {
        const transport = Transport.init(allocator, config.transport) catch |err| {
            return switch (err) {
                TransportError.ConnectionFailed => ProviderError.NetworkError,
                TransportError.OutOfMemory => ProviderError.OutOfMemory,
                else => ProviderError.TransportError,
            };
        };

        return Provider{
            .allocator = allocator,
            .transport = transport,
            .account = config.account,
            .chain_id = config.chain_id,
            .request_timeout = config.request_timeout,
            .max_retries = config.max_retries,
            .request_id = std.atomic.Value(u64).init(1),
        };
    }

    /// Clean up provider resources
    pub fn deinit(self: *Provider) void {
        self.transport.deinit();
    }

    /// Set account for transaction signing
    pub fn setAccount(self: *Provider, account: []const u8) void {
        self.account = account;
    }

    /// Get current account
    pub fn getAccount(self: Provider) ?[]const u8 {
        return self.account;
    }

    /// Set chain ID for transaction signing
    pub fn setChainId(self: *Provider, chain_id: u64) void {
        self.chain_id = chain_id;
    }

    /// Get current chain ID
    pub fn getChainId(self: Provider) ?u64 {
        return self.chain_id;
    }

    // =============================================================================
    // Utilities
    // =============================================================================

    /// Generate unique request ID
    fn generateRequestId(self: *Provider) u64 {
        return self.request_id.fetchAdd(1, .monotonic);
    }

    /// Create JSON-RPC request with auto-generated ID
    pub fn createRequest(self: *Provider, method: []const u8, params: JsonValue) JsonRpcRequest {
        return JsonRpcRequest{
            .method = method,
            .params = params,
            .id = self.generateRequestId(),
        };
    }

    /// Helper for direct method calls without helper functions
    pub fn call(self: *Provider, method: []const u8, params: JsonValue) ProviderError!JsonRpcResponse {
        const req = self.createRequest(method, params);
        return self.request(req);
    }

    /// Test connection to the Ethereum node
    pub fn testConnection(self: *Provider) ProviderError!void {
        const req = self.createRequest("eth_chainId", JsonValue{ .null = {} });
        _ = try self.request(req);
    }

    /// Get the transport type
    pub fn getTransportType(self: Provider) []const u8 {
        return self.transport.getType();
    }

    /// Check if the provider is connected
    pub fn isConnected(self: Provider) bool {
        return self.transport.isConnected();
    }
};

// =============================================================================
// Convenience Functions
// =============================================================================

/// Create a provider with HTTP transport
pub fn createHttpProvider(allocator: Allocator, url: []const u8) ProviderError!Provider {
    const transport_config = TransportConfig.http_config(url);
    const provider_config = ProviderConfig.init(transport_config);
    return Provider.init(allocator, provider_config);
}

/// Create a provider with HTTP transport and chain ID
pub fn createHttpProviderWithChainId(allocator: Allocator, url: []const u8, chain_id: u64) ProviderError!Provider {
    const transport_config = TransportConfig.http_config(url);
    const provider_config = ProviderConfig.init(transport_config).withChainId(chain_id);
    return Provider.init(allocator, provider_config);
}

// =============================================================================
// Tests
// =============================================================================

const testing = std.testing;

test "ProviderConfig creation" {
    const transport_config = TransportConfig.http_config("https://test.com");
    const config = ProviderConfig.init(transport_config);

    try testing.expect(config.chain_id == null);
    try testing.expect(config.request_timeout == 30000);
    try testing.expect(config.max_retries == 3);
}

test "ProviderConfig with chain ID" {
    const transport_config = TransportConfig.http_config("https://test.com");
    const config = ProviderConfig.init(transport_config).withChainId(1);

    try testing.expect(config.chain_id.? == 1);
}

test "ProviderConfig with timeout" {
    const transport_config = TransportConfig.http_config("https://test.com");
    const config = ProviderConfig.init(transport_config).withTimeout(10000);

    try testing.expect(config.request_timeout == 10000);
}

test "Provider initialization" {
    const allocator = testing.allocator;
    const transport_config = TransportConfig.http_config("https://test.com");
    const provider_config = ProviderConfig.init(transport_config);

    var provider = try Provider.init(allocator, provider_config);
    defer provider.deinit();

    try testing.expect(provider.chain_id == null);
    try testing.expectEqualStrings("http", provider.getTransportType());
    try testing.expect(provider.isConnected());
}

test "Provider request ID generation" {
    const allocator = testing.allocator;
    const transport_config = TransportConfig.http_config("https://test.com");
    const provider_config = ProviderConfig.init(transport_config);

    var provider = try Provider.init(allocator, provider_config);
    defer provider.deinit();

    const id1 = provider.generateRequestId();
    const id2 = provider.generateRequestId();
    try testing.expect(id2 > id1);
}

test "Provider createRequest" {
    const allocator = testing.allocator;
    const transport_config = TransportConfig.http_config("https://test.com");
    const provider_config = ProviderConfig.init(transport_config);

    var provider = try Provider.init(allocator, provider_config);
    defer provider.deinit();

    const req = provider.createRequest("eth_chainId", JsonValue{ .null = {} });
    try testing.expectEqualStrings("eth_chainId", req.method);
    try testing.expect(req.id > 0);
}

test "Provider account management" {
    const allocator = testing.allocator;
    const transport_config = TransportConfig.http_config("https://test.com");
    const provider_config = ProviderConfig.init(transport_config);

    var provider = try Provider.init(allocator, provider_config);
    defer provider.deinit();

    try testing.expect(provider.getAccount() == null);

    provider.setAccount("test_account");
    try testing.expectEqualStrings("test_account", provider.getAccount().?);
}

test "Provider chain ID management" {
    const allocator = testing.allocator;
    const transport_config = TransportConfig.http_config("https://test.com");
    const provider_config = ProviderConfig.init(transport_config);

    var provider = try Provider.init(allocator, provider_config);
    defer provider.deinit();

    try testing.expect(provider.getChainId() == null);

    provider.setChainId(1);
    try testing.expect(provider.getChainId().? == 1);
}

test "createHttpProvider convenience function" {
    const allocator = testing.allocator;

    var provider = try createHttpProvider(allocator, "https://test.com");
    defer provider.deinit();

    try testing.expectEqualStrings("http", provider.getTransportType());
}

test "createHttpProviderWithChainId convenience function" {
    const allocator = testing.allocator;

    var provider = try createHttpProviderWithChainId(allocator, "https://test.com", 1);
    defer provider.deinit();

    try testing.expect(provider.getChainId().? == 1);
}
