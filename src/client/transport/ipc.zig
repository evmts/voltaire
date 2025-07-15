const std = @import("std");
const Allocator = std.mem.Allocator;
const ArrayList = std.ArrayList;
const StringHashMap = std.StringHashMap;
const net = std.net;

// Import transport errors
const TransportError = @import("errors.zig").TransportError;
const ErrorContext = @import("errors.zig").ErrorContext;

// Import JSON-RPC types
const JsonRpcRequest = @import("../jsonrpc/types.zig").JsonRpcRequest;
const JsonRpcResponse = @import("../jsonrpc/types.zig").JsonRpcResponse;
const JsonValue = @import("../jsonrpc/types.zig").JsonValue;
const JsonRpcBatchRequest = @import("../jsonrpc/types.zig").JsonRpcBatchRequest;
const JsonRpcBatchResponse = @import("../jsonrpc/types.zig").JsonRpcBatchResponse;

// =============================================================================
// IPC Configuration
// =============================================================================

pub const IpcConfig = struct {
    path: []const u8,
    timeout: u32 = 30000,
    retry_count: u8 = 3,
    retry_delay: u32 = 1000,
    buffer_size: usize = 4096,

    pub fn init(path: []const u8) IpcConfig {
        return IpcConfig{
            .path = path,
        };
    }

    pub fn withTimeout(self: IpcConfig, timeout: u32) IpcConfig {
        return IpcConfig{
            .path = self.path,
            .timeout = timeout,
            .retry_count = self.retry_count,
            .retry_delay = self.retry_delay,
            .buffer_size = self.buffer_size,
        };
    }

    pub fn withRetries(self: IpcConfig, retry_count: u8, retry_delay: u32) IpcConfig {
        return IpcConfig{
            .path = self.path,
            .timeout = self.timeout,
            .retry_count = retry_count,
            .retry_delay = retry_delay,
            .buffer_size = self.buffer_size,
        };
    }
};

// =============================================================================
// IPC Transport
// =============================================================================

pub const IpcTransport = struct {
    allocator: Allocator,
    path: []const u8,
    timeout: u32,
    retry_count: u8,
    retry_delay: u32,
    buffer_size: usize,
    stream: ?net.Stream = null,
    connected: bool = false,

    /// Initialize IPC transport
    pub fn init(allocator: Allocator, config: IpcConfig) TransportError!IpcTransport {
        return IpcTransport{
            .allocator = allocator,
            .path = config.path,
            .timeout = config.timeout,
            .retry_count = config.retry_count,
            .retry_delay = config.retry_delay,
            .buffer_size = config.buffer_size,
        };
    }

    /// Clean up IPC transport resources
    pub fn deinit(self: *IpcTransport) void {
        self.disconnect();
    }

    /// Connect to IPC endpoint
    pub fn connect(self: *IpcTransport) TransportError!void {
        if (self.connected) return;

        // Connect to Unix domain socket
        const address = net.Address.initUnix(self.path) catch {
            return TransportError.InvalidUrl;
        };

        self.stream = net.tcpConnectToAddress(address) catch |err| {
            return switch (err) {
                error.ConnectionRefused => TransportError.ConnectionError,
                error.FileNotFound => TransportError.ConnectionError,
                error.PermissionDenied => TransportError.ConnectionError,
                else => TransportError.NetworkError,
            };
        };

        self.connected = true;
    }

    /// Disconnect from IPC endpoint
    pub fn disconnect(self: *IpcTransport) void {
        if (self.stream) |stream| {
            stream.close();
            self.stream = null;
        }
        self.connected = false;
    }

    /// Send JSON-RPC request over IPC
    pub fn request(self: *IpcTransport, req: JsonRpcRequest) TransportError!JsonRpcResponse {
        if (!self.connected) {
            try self.connect();
        }

        return self.retryRequest(req, 0);
    }

    /// Send batch request over IPC
    pub fn requestBatch(self: *IpcTransport, batch: JsonRpcBatchRequest) TransportError!JsonRpcBatchResponse {
        if (!self.connected) {
            try self.connect();
        }

        const json_string = try self.serializeBatchRequest(batch);
        defer self.allocator.free(json_string);

        const stream = self.stream orelse return TransportError.ConnectionError;

        // Send request
        stream.writeAll(json_string) catch {
            self.disconnect();
            return TransportError.NetworkError;
        };

        // Read response
        var response_buffer = ArrayList(u8).init(self.allocator);
        defer response_buffer.deinit();

        var buffer: [4096]u8 = undefined;
        var total_read: usize = 0;

        while (true) {
            const bytes_read = stream.read(buffer[0..]) catch {
                self.disconnect();
                return TransportError.NetworkError;
            };

            if (bytes_read == 0) break;

            try response_buffer.appendSlice(buffer[0..bytes_read]);
            total_read += bytes_read;

            // Check if we have a complete JSON response
            if (self.isCompleteJsonResponse(response_buffer.items)) {
                break;
            }
        }

        return self.parseBatchResponse(response_buffer.items);
    }

    /// Test IPC connection
    pub fn testConnection(self: *IpcTransport) TransportError!void {
        // Create a simple eth_chainId request to test connection
        const test_req = JsonRpcRequest{
            .method = "eth_chainId",
            .params = .{ .null = {} },
            .id = 1,
        };

        _ = try self.request(test_req);
    }

    /// Check if transport is connected
    pub fn isConnected(self: IpcTransport) bool {
        return self.connected;
    }

    // =============================================================================
    // Private Methods
    // =============================================================================

    fn retryRequest(self: *IpcTransport, req: JsonRpcRequest, attempt: u8) TransportError!JsonRpcResponse {
        const result = self.sendIpcRequest(req) catch |err| {
            if (attempt < self.retry_count) {
                // Wait before retry
                std.time.sleep(self.retry_delay * 1000 * 1000); // Convert ms to ns
                return self.retryRequest(req, attempt + 1);
            }
            return err;
        };

        return result;
    }

    fn sendIpcRequest(self: *IpcTransport, req: JsonRpcRequest) TransportError!JsonRpcResponse {
        const json_string = try self.serializeRequest(req);
        defer self.allocator.free(json_string);

        const stream = self.stream orelse return TransportError.ConnectionError;

        // Send request
        stream.writeAll(json_string) catch {
            self.disconnect();
            return TransportError.NetworkError;
        };

        // Read response
        var response_buffer = ArrayList(u8).init(self.allocator);
        defer response_buffer.deinit();

        var buffer: [4096]u8 = undefined;

        while (true) {
            const bytes_read = stream.read(buffer[0..]) catch {
                self.disconnect();
                return TransportError.NetworkError;
            };

            if (bytes_read == 0) break;

            try response_buffer.appendSlice(buffer[0..bytes_read]);

            // Check if we have a complete JSON response
            if (self.isCompleteJsonResponse(response_buffer.items)) {
                break;
            }
        }

        return self.parseResponse(response_buffer.items);
    }

    fn serializeRequest(self: *IpcTransport, req: JsonRpcRequest) ![]u8 {
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

        // Add newline delimiter for IPC
        try json_string.append('\n');

        return json_string.toOwnedSlice();
    }

    fn serializeJsonValue(self: *IpcTransport, value: JsonValue) !std.json.Value {
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

    fn parseResponse(self: *IpcTransport, response: []const u8) TransportError!JsonRpcResponse {
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

    fn parseJsonValue(self: *IpcTransport, value: std.json.Value) !JsonValue {
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
                break :blk JsonValue{ .array = try json_array.toOwnedSlice() };
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

    fn serializeBatchRequest(self: *IpcTransport, batch: JsonRpcBatchRequest) ![]u8 {
        var json_array = std.json.Array.init(self.allocator);

        for (batch.requests) |req| {
            var json_obj = std.json.ObjectMap.init(self.allocator);

            // Add method
            try json_obj.put("method", .{ .string = req.method });

            // Add params
            const params_json = try self.serializeJsonValue(req.params);
            try json_obj.put("params", params_json);

            // Add id
            try json_obj.put("id", .{ .integer = @as(i64, @intCast(req.id)) });

            // Add jsonrpc version
            try json_obj.put("jsonrpc", .{ .string = "2.0" });

            try json_array.append(.{ .object = json_obj });
        }

        // Serialize to string
        var json_string = std.ArrayList(u8).init(self.allocator);
        try std.json.stringify(json_array, .{}, json_string.writer());

        // Add newline delimiter for IPC
        try json_string.append('\n');

        return json_string.toOwnedSlice();
    }

    fn parseBatchResponse(self: *IpcTransport, response: []const u8) TransportError!JsonRpcBatchResponse {
        const parsed = std.json.parseFromSlice(std.json.Value, self.allocator, response, .{}) catch {
            return TransportError.InvalidResponse;
        };
        defer parsed.deinit();

        const root = parsed.value;
        const array = root.array;

        var responses = std.ArrayList(JsonRpcResponse).init(self.allocator);

        for (array.items) |item| {
            const obj = item.object;

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

            const response_item = JsonRpcResponse{
                .result = result_value,
                .err = error_value,
                .id = id,
            };

            try responses.append(response_item);
        }

        return JsonRpcBatchResponse.init(self.allocator, try responses.toOwnedSlice());
    }

    fn isCompleteJsonResponse(self: *IpcTransport, data: []const u8) bool {
        _ = self;

        // Simple check for complete JSON by looking for balanced braces
        var brace_count: i32 = 0;
        var in_string = false;
        var escape_next = false;

        for (data) |char| {
            if (escape_next) {
                escape_next = false;
                continue;
            }

            if (char == '\\') {
                escape_next = true;
                continue;
            }

            if (char == '"') {
                in_string = !in_string;
                continue;
            }

            if (in_string) continue;

            if (char == '{' or char == '[') {
                brace_count += 1;
            } else if (char == '}' or char == ']') {
                brace_count -= 1;
            }
        }

        return brace_count == 0 and data.len > 0;
    }
};

// =============================================================================
// Tests
// =============================================================================

const testing = std.testing;

test "IpcConfig creation" {
    const config = IpcConfig.init("/tmp/ethereum.ipc");
    try testing.expectEqualStrings("/tmp/ethereum.ipc", config.path);
    try testing.expect(config.timeout == 30000);
    try testing.expect(config.retry_count == 3);
}

test "IpcConfig with timeout" {
    const config = IpcConfig.init("/tmp/test.ipc").withTimeout(10000);
    try testing.expect(config.timeout == 10000);
}

test "IpcConfig with retries" {
    const config = IpcConfig.init("/tmp/test.ipc").withRetries(5, 2000);
    try testing.expect(config.retry_count == 5);
    try testing.expect(config.retry_delay == 2000);
}

test "IpcTransport initialization" {
    const allocator = testing.allocator;
    const config = IpcConfig.init("/tmp/test.ipc");

    var transport = try IpcTransport.init(allocator, config);
    defer transport.deinit();

    try testing.expectEqualStrings("/tmp/test.ipc", transport.path);
    try testing.expect(transport.timeout == 30000);
    try testing.expect(!transport.isConnected());
}

test "JSON completeness checking" {
    const allocator = testing.allocator;
    const config = IpcConfig.init("/tmp/test.ipc");
    var transport = try IpcTransport.init(allocator, config);
    defer transport.deinit();

    try testing.expect(transport.isCompleteJsonResponse("{}"));
    try testing.expect(transport.isCompleteJsonResponse("[]"));
    try testing.expect(transport.isCompleteJsonResponse("{\"test\":\"value\"}"));
    try testing.expect(!transport.isCompleteJsonResponse("{"));
    try testing.expect(!transport.isCompleteJsonResponse("{\"test\":"));
}
