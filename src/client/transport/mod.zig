const std = @import("std");
const Allocator = std.mem.Allocator;

// Import JSON-RPC types
const JsonRpcRequest = @import("../jsonrpc/types.zig").JsonRpcRequest;
const JsonRpcResponse = @import("../jsonrpc/types.zig").JsonRpcResponse;

// =============================================================================
// Transport Configuration
// =============================================================================

pub const TransportConfig = union(enum) {
    http: @import("http.zig").HttpConfig,
    // ipc: IpcConfig,  // TODO: Implement IPC config

    pub fn http_config(url: []const u8) TransportConfig {
        return TransportConfig{
            .http = @import("http.zig").HttpConfig.init(url),
        };
    }
};

// =============================================================================
// Transport Interface
// =============================================================================

pub const Transport = union(enum) {
    http: @import("http.zig").HttpTransport,
    // ipc: IpcTransport,  // TODO: Implement IPC transport

    /// Initialize transport from config
    pub fn init(allocator: Allocator, config: TransportConfig) @import("errors.zig").TransportError!Transport {
        return switch (config) {
            .http => |http_config| {
                const http_transport = try @import("http.zig").HttpTransport.init(allocator, http_config);
                return Transport{ .http = http_transport };
            },
            // TODO: Add IPC transport initialization
        };
    }

    /// Clean up transport resources
    pub fn deinit(self: *Transport) void {
        switch (self.*) {
            .http => |*http| http.deinit(),
            // TODO: Add IPC transport cleanup
        }
    }

    /// Send JSON-RPC request and return response
    pub fn request(self: *Transport, req: JsonRpcRequest) @import("errors.zig").TransportError!JsonRpcResponse {
        return switch (self.*) {
            .http => |*http| http.request(req),
            // TODO: Add IPC transport request
        };
    }

    /// Get transport type string
    pub fn getType(self: Transport) []const u8 {
        return switch (self) {
            .http => "http",
            // TODO: Add IPC transport type
        };
    }

    /// Check if transport is connected
    pub fn isConnected(self: Transport) bool {
        return switch (self) {
            .http => true, // HTTP is always "connected"
            // TODO: Add IPC transport connection check
        };
    }

    /// Test connection
    pub fn testConnection(self: *Transport) @import("errors.zig").TransportError!void {
        return switch (self.*) {
            .http => |*http| http.testConnection(),
            // TODO: Add IPC transport test
        };
    }
};

// =============================================================================
// Re-exports
// =============================================================================

pub const HttpTransport = @import("http.zig").HttpTransport;
pub const HttpConfig = @import("http.zig").HttpConfig;
pub const TransportError = @import("errors.zig").TransportError;
pub const ErrorContext = @import("errors.zig").ErrorContext;

// =============================================================================
// Tests
// =============================================================================

const testing = std.testing;

test "Transport config creation" {
    const config = TransportConfig.http_config("https://mainnet.infura.io/v3/test");
    switch (config) {
        .http => |http_config| {
            try testing.expectEqualStrings("https://mainnet.infura.io/v3/test", http_config.url);
        },
    }
}

test "Transport initialization" {
    const allocator = testing.allocator;
    const config = TransportConfig.http_config("https://test.com");

    var transport = try Transport.init(allocator, config);
    defer transport.deinit();

    try testing.expectEqualStrings("http", transport.getType());
    try testing.expect(transport.isConnected());
}

test "Transport type checking" {
    const allocator = testing.allocator;
    const config = TransportConfig.http_config("https://test.com");

    var transport = try Transport.init(allocator, config);
    defer transport.deinit();

    switch (transport) {
        .http => {},
        // This should match since we created an HTTP transport
    }
}
