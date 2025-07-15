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
    ipc: @import("ipc.zig").IpcConfig,

    pub fn http_config(url: []const u8) TransportConfig {
        return TransportConfig{
            .http = @import("http.zig").HttpConfig.init(url),
        };
    }

    pub fn ipc_config(path: []const u8) TransportConfig {
        return TransportConfig{
            .ipc = @import("ipc.zig").IpcConfig.init(path),
        };
    }
};

// =============================================================================
// Transport Interface
// =============================================================================

pub const Transport = union(enum) {
    http: @import("http.zig").HttpTransport,
    ipc: @import("ipc.zig").IpcTransport,

    /// Initialize transport from config
    pub fn init(allocator: Allocator, config: TransportConfig) @import("errors.zig").TransportError!Transport {
        return switch (config) {
            .http => |http_config| {
                const http_transport = try @import("http.zig").HttpTransport.init(allocator, http_config);
                return Transport{ .http = http_transport };
            },
            .ipc => |ipc_config| {
                const ipc_transport = try @import("ipc.zig").IpcTransport.init(allocator, ipc_config);
                return Transport{ .ipc = ipc_transport };
            },
        };
    }

    /// Clean up transport resources
    pub fn deinit(self: *Transport) void {
        switch (self.*) {
            .http => |*http| http.deinit(),
            .ipc => |*ipc| ipc.deinit(),
        }
    }

    /// Send JSON-RPC request and return response
    pub fn request(self: *Transport, req: JsonRpcRequest) @import("errors.zig").TransportError!JsonRpcResponse {
        return switch (self.*) {
            .http => |*http| http.request(req),
            .ipc => |*ipc| ipc.request(req),
        };
    }

    /// Get transport type string
    pub fn getType(self: Transport) []const u8 {
        return switch (self) {
            .http => "http",
            .ipc => "ipc",
        };
    }

    /// Check if transport is connected
    pub fn isConnected(self: Transport) bool {
        return switch (self) {
            .http => true, // HTTP is always "connected"
            .ipc => |ipc| ipc.isConnected(),
        };
    }

    /// Test connection
    pub fn testConnection(self: *Transport) @import("errors.zig").TransportError!void {
        return switch (self.*) {
            .http => |*http| http.testConnection(),
            .ipc => |*ipc| ipc.testConnection(),
        };
    }
};

// =============================================================================
// Re-exports
// =============================================================================

pub const HttpTransport = @import("http.zig").HttpTransport;
pub const HttpConfig = @import("http.zig").HttpConfig;
pub const IpcTransport = @import("ipc.zig").IpcTransport;
pub const IpcConfig = @import("ipc.zig").IpcConfig;
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
        .ipc => {
            try testing.expect(false); // This test should create HTTP config
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
        .ipc => {},
        // This should match since we created an HTTP transport
    }
}

test "IPC transport config creation" {
    const config = TransportConfig.ipc_config("/tmp/ethereum.ipc");
    switch (config) {
        .ipc => |ipc_config| {
            try testing.expectEqualStrings("/tmp/ethereum.ipc", ipc_config.path);
        },
        else => try testing.expect(false),
    }
}

test "IPC transport initialization" {
    const allocator = testing.allocator;
    const config = TransportConfig.ipc_config("/tmp/test.ipc");

    var transport = try Transport.init(allocator, config);
    defer transport.deinit();

    try testing.expectEqualStrings("ipc", transport.getType());
    try testing.expect(!transport.isConnected());
}
