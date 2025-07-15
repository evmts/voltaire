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
        // 1. Serialize the JsonRpcRequest to JSON
        const json_string = try self.serializeRequest(req);
        defer self.allocator.free(json_string);

        // 2. Send HTTP POST request
        var response_buffer = std.ArrayList(u8).init(self.allocator);
        defer response_buffer.deinit();

        const response = self.client.fetch(.{
            .method = .POST,
            .url = self.url,
            .headers = .{
                .content_type = .{ .override = "application/json" },
                .user_agent = .{ .override = self.user_agent },
            },
            .payload = json_string,
            .response_storage = .{ .dynamic = &response_buffer },
        }) catch |err| {
            return switch (err) {
                error.ConnectionRefused => TransportError.ConnectionError,
                error.NameResolutionFailed => TransportError.NetworkError,
                error.ConnectionTimedOut => TransportError.Timeout,
                else => TransportError.NetworkError,
            };
        };

        // 4. Check status code
        if (response.status.class() != .success) {
            return TransportError.HttpError;
        }

        // 5. Parse the response
        return self.parseHttpResponse(response_buffer.items);
    }

    /// Serialize JsonRpcRequest to JSON string
    fn serializeRequest(self: *HttpTransport, req: JsonRpcRequest) ![]u8 {
        var json_obj = std.json.ObjectMap.init(self.allocator);
        defer json_obj.deinit();

        // Add method
        try json_obj.put("method", .{ .string = req.method });

        // Add params
        const params_json = try self.serializeJsonValue(req.params);
        try json_obj.put("params", params_json);

        // Add id
        try json_obj.put("id", .{ .integer = @as(i64, @intCast(req.id)) });

        // Add jsonrpc version
        try json_obj.put("jsonrpc", .{ .string = "2.0" });

        // Serialize to string
        var json_string = std.ArrayList(u8).init(self.allocator);
        try std.json.stringify(json_obj, .{}, json_string.writer());

        return json_string.toOwnedSlice();
    }

    /// Convert JsonValue to std.json.Value
    fn serializeJsonValue(self: *HttpTransport, value: JsonValue) !std.json.Value {
        return switch (value) {
            .null => .null,
            .boolean => |b| .{ .bool = b },
            .string => |s| .{ .string = s },
            .number => |n| .{ .float = n },
            .integer => |i| .{ .integer = i },
            .array => |arr| blk: {
                var json_array = std.json.Array.init(self.allocator);
                for (arr) |item| {
                    const json_item = try self.serializeJsonValue(item);
                    try json_array.append(json_item);
                }
                break :blk .{ .array = json_array };
            },
            .object => |obj| blk: {
                var json_obj = std.json.ObjectMap.init(self.allocator);
                var iterator = obj.iterator();
                while (iterator.next()) |entry| {
                    const json_value = try self.serializeJsonValue(entry.value_ptr.*);
                    try json_obj.put(entry.key_ptr.*, json_value);
                }
                break :blk .{ .object = json_obj };
            },
        };
    }

    fn parseHttpResponse(self: *HttpTransport, response: []const u8) TransportError!JsonRpcResponse {
        const parsed = std.json.parseFromSlice(std.json.Value, self.allocator, response, .{}) catch {
            return TransportError.InvalidResponse;
        };
        defer parsed.deinit();

        const root = parsed.value;
        const obj = root.object;

        // Parse ID
        const id = if (obj.get("id")) |id_val| switch (id_val) {
            .integer => |i| @as(u64, @intCast(i)),
            .float => |f| @as(u64, @intCast(f)),
            else => 0,
        } else 0;

        // Parse error
        const error_value = if (obj.get("error")) |error_val| blk: {
            const error_obj = error_val.object;
            const code = if (error_obj.get("code")) |code_val| switch (code_val) {
                .integer => |i| @as(i32, @intCast(i)),
                .float => |f| @as(i32, @intCast(f)),
                else => 0,
            } else 0;

            const message = if (error_obj.get("message")) |msg_val| switch (msg_val) {
                .string => |s| s,
                else => "Unknown error",
            } else "Unknown error";

            var error_map = std.StringHashMap(JsonValue).init(self.allocator);
            try error_map.put("code", JsonValue{ .integer = code });
            try error_map.put("message", JsonValue{ .string = message });
            break :blk JsonValue{ .object = error_map };
        } else null;

        // Parse result
        const result_value = if (obj.get("result")) |result_val| try self.parseJsonValue(result_val) else null;

        return JsonRpcResponse{
            .result = result_value,
            .err = error_value,
            .id = id,
        };
    }

    /// Convert std.json.Value to JsonValue
    fn parseJsonValue(self: *HttpTransport, value: std.json.Value) !JsonValue {
        return switch (value) {
            .null => JsonValue{ .null = {} },
            .bool => |b| JsonValue{ .boolean = b },
            .string => |s| JsonValue{ .string = s },
            .float => |f| JsonValue{ .number = f },
            .integer => |i| JsonValue{ .integer = i },
            .array => |arr| blk: {
                var json_array = std.ArrayList(JsonValue).init(self.allocator);
                for (arr.items) |item| {
                    const json_item = try self.parseJsonValue(item);
                    try json_array.append(json_item);
                }
                break :blk JsonValue{ .array = json_array.items };
            },
            .object => |obj| blk: {
                var json_obj = std.StringHashMap(JsonValue).init(self.allocator);
                var iterator = obj.iterator();
                while (iterator.next()) |entry| {
                    const json_value = try self.parseJsonValue(entry.value_ptr.*);
                    try json_obj.put(entry.key_ptr.*, json_value);
                }
                break :blk JsonValue{ .object = json_obj };
            },
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
