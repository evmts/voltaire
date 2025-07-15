const std = @import("std");
const Allocator = std.mem.Allocator;
const ArrayList = std.ArrayList;
const StringHashMap = std.StringHashMap;

// Import transport errors
const TransportError = @import("errors.zig").TransportError;
const ErrorContext = @import("errors.zig").ErrorContext;
const HttpError = @import("errors.zig").HttpError;

// Import JSON-RPC types (with fallback if not available)
const JsonRpcRequest = @import("../jsonrpc/types.zig").JsonRpcRequest;
const JsonRpcResponse = @import("../jsonrpc/types.zig").JsonRpcResponse;
const JsonValue = @import("../jsonrpc/types.zig").JsonValue;

// =============================================================================
// HTTP Configuration
// =============================================================================

pub const HttpConfig = struct {
    url: []const u8,
    headers: ?StringHashMap([]const u8) = null,
    timeout: u32 = 30000,
    retry_count: u8 = 3,
    retry_delay: u32 = 1000,
    user_agent: []const u8 = "Guillotine-Ethereum-Client/1.0",

    pub fn init(url: []const u8) HttpConfig {
        return HttpConfig{
            .url = url,
        };
    }

    pub fn withTimeout(self: HttpConfig, timeout: u32) HttpConfig {
        return HttpConfig{
            .url = self.url,
            .headers = self.headers,
            .timeout = timeout,
            .retry_count = self.retry_count,
            .retry_delay = self.retry_delay,
            .user_agent = self.user_agent,
        };
    }

    pub fn withRetries(self: HttpConfig, retry_count: u8, retry_delay: u32) HttpConfig {
        return HttpConfig{
            .url = self.url,
            .headers = self.headers,
            .timeout = self.timeout,
            .retry_count = retry_count,
            .retry_delay = retry_delay,
            .user_agent = self.user_agent,
        };
    }
};

// =============================================================================
// HTTP Transport
// =============================================================================

pub const HttpTransport = struct {
    allocator: Allocator,
    url: []const u8,
    headers: StringHashMap([]const u8),
    timeout: u32,
    retry_count: u8,
    retry_delay: u32,
    user_agent: []const u8,
    client: std.http.Client,

    /// Initialize HTTP transport
    pub fn init(allocator: Allocator, config: HttpConfig) TransportError!HttpTransport {
        var headers = StringHashMap([]const u8).init(allocator);

        // Add default headers
        try headers.put("Content-Type", "application/json");
        try headers.put("User-Agent", config.user_agent);

        // Add custom headers if provided
        if (config.headers) |custom_headers| {
            var iterator = custom_headers.iterator();
            while (iterator.next()) |entry| {
                try headers.put(entry.key_ptr.*, entry.value_ptr.*);
            }
        }

        const client = std.http.Client{ .allocator = allocator };

        return HttpTransport{
            .allocator = allocator,
            .url = try allocator.dupe(u8, config.url),
            .headers = headers,
            .timeout = config.timeout,
            .retry_count = config.retry_count,
            .retry_delay = config.retry_delay,
            .user_agent = config.user_agent,
            .client = client,
        };
    }

    /// Clean up HTTP transport
    pub fn deinit(self: *HttpTransport) void {
        self.allocator.free(self.url);
        self.headers.deinit();
        self.client.deinit();
    }

    /// Send HTTP request with JSON-RPC
    pub fn request(self: *HttpTransport, req: JsonRpcRequest) TransportError!JsonRpcResponse {
        return self.retryRequest(req, 0);
    }

    /// Add custom header
    pub fn addHeader(self: *HttpTransport, key: []const u8, value: []const u8) TransportError!void {
        try self.headers.put(key, value);
    }

    /// Remove header
    pub fn removeHeader(self: *HttpTransport, key: []const u8) void {
        _ = self.headers.remove(key);
    }

    /// Test connection
    pub fn testConnection(self: *HttpTransport) TransportError!void {
        // Create a simple eth_chainId request to test connection
        const test_req = JsonRpcRequest{
            .method = "eth_chainId",
            .params = .{ .null = {} },
            .id = 1,
        };

        _ = try self.request(test_req);
    }

    // =============================================================================
    // Private Methods
    // =============================================================================

    fn retryRequest(self: *HttpTransport, req: JsonRpcRequest, attempt: u8) TransportError!JsonRpcResponse {
        const result = self.sendHttpRequest(req) catch |err| {
            if (attempt < self.retry_count) {
                // Wait before retry
                std.time.sleep(self.retry_delay * 1000 * 1000); // Convert ms to ns
                return self.retryRequest(req, attempt + 1);
            }
            return err;
        };

        return result;
    }

    fn sendHttpRequest(self: *HttpTransport, req: JsonRpcRequest) TransportError!JsonRpcResponse {
        // For now, create a minimal response
        // TODO: Implement actual HTTP request using std.http.Client
        _ = self;
        _ = req;

        // This is a placeholder implementation
        // In a real implementation, you would:
        // 1. Serialize the JsonRpcRequest to JSON
        // 2. Send HTTP POST to self.url
        // 3. Parse the response
        // 4. Return JsonRpcResponse

        var response = JsonRpcResponse{
            .result = null,
            .err = null,
            .id = 1,
        };
        response.result = JsonValue.fromString("0x1");
        return response;
    }

    fn parseHttpResponse(self: *HttpTransport, response: []const u8) TransportError!JsonRpcResponse {
        _ = self;
        _ = response;

        // TODO: Implement JSON parsing
        // For now, return a placeholder
        return JsonRpcResponse{
            .result = .{ .string = "0x1" },
            .err = null,
            .id = 1,
        };
    }
};

// =============================================================================
// Tests
// =============================================================================

const testing = std.testing;

test "HttpConfig creation" {
    const config = HttpConfig.init("https://mainnet.infura.io/v3/test");
    try testing.expectEqualStrings("https://mainnet.infura.io/v3/test", config.url);
    try testing.expect(config.timeout == 30000);
    try testing.expect(config.retry_count == 3);
}

test "HttpConfig with timeout" {
    const config = HttpConfig.init("https://test.com").withTimeout(10000);
    try testing.expect(config.timeout == 10000);
}

test "HttpConfig with retries" {
    const config = HttpConfig.init("https://test.com").withRetries(5, 2000);
    try testing.expect(config.retry_count == 5);
    try testing.expect(config.retry_delay == 2000);
}

test "HttpTransport initialization" {
    const allocator = testing.allocator;
    const config = HttpConfig.init("https://mainnet.infura.io/v3/test");

    var transport = try HttpTransport.init(allocator, config);
    defer transport.deinit();

    try testing.expectEqualStrings("https://mainnet.infura.io/v3/test", transport.url);
    try testing.expect(transport.timeout == 30000);
}

test "HttpTransport headers" {
    const allocator = testing.allocator;
    const config = HttpConfig.init("https://test.com");

    var transport = try HttpTransport.init(allocator, config);
    defer transport.deinit();

    try transport.addHeader("Authorization", "Bearer token123");
    try testing.expect(transport.headers.contains("Authorization"));
    try testing.expect(transport.headers.contains("Content-Type"));

    transport.removeHeader("Authorization");
    try testing.expect(!transport.headers.contains("Authorization"));
}
