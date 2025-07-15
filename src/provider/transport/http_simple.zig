const std = @import("std");
const http = std.http;
const Allocator = std.mem.Allocator;
const TransportError = @import("errors.zig").TransportError;
const json_rpc = @import("json_rpc.zig");

pub const HttpTransport = struct {
    allocator: Allocator,
    client: http.Client,
    url: []const u8,
    user_agent: []const u8,
    request_timeout: u32,
    max_retries: u8,
    retry_delay: u32,
    request_id: std.atomic.Value(u64),

    pub fn init(allocator: Allocator, url: []const u8) !HttpTransport {
        return HttpTransport{
            .allocator = allocator,
            .client = http.Client{ .allocator = allocator },
            .url = try allocator.dupe(u8, url),
            .user_agent = "Guillotine-Provider/1.0",
            .request_timeout = 30000,
            .max_retries = 3,
            .retry_delay = 1000,
            .request_id = std.atomic.Value(u64).init(1),
        };
    }

    pub fn deinit(self: *HttpTransport) void {
        self.client.deinit();
        self.allocator.free(self.url);
    }

    pub fn request(self: *HttpTransport, method: []const u8, params: []const u8) TransportError!json_rpc.JsonRpcResponse {
        const req = json_rpc.JsonRpcRequest{
            .method = method,
            .params = params,
            .id = self.generateRequestId(),
        };

        const json_payload = req.toJson(self.allocator) catch |err| switch (err) {
            error.OutOfMemory => return TransportError.OutOfMemory,
        };
        defer self.allocator.free(json_payload);

        var response_buffer = std.ArrayList(u8).init(self.allocator);
        defer response_buffer.deinit();

        const response = self.client.fetch(.{
            .method = .POST,
            .location = .{ .url = self.url },
            .headers = .{
                .content_type = .{ .override = "application/json" },
                .user_agent = .{ .override = self.user_agent },
            },
            .payload = json_payload,
            .response_storage = .{ .dynamic = &response_buffer },
        }) catch |err| {
            return switch (err) {
                error.ConnectionRefused => TransportError.ConnectionFailed,
                error.ConnectionTimedOut => TransportError.Timeout,
                else => TransportError.NetworkError,
            };
        };

        if (response.status.class() != .success) {
            return TransportError.NetworkError;
        }

        return json_rpc.JsonRpcResponse.fromJson(self.allocator, response_buffer.items) catch |err| switch (err) {
            error.OutOfMemory => TransportError.OutOfMemory,
            else => TransportError.InvalidResponse,
        };
    }

    fn generateRequestId(self: *HttpTransport) u64 {
        return self.request_id.fetchAdd(1, .monotonic);
    }

    pub fn isConnected(self: HttpTransport) bool {
        _ = self;
        return true; // HTTP is stateless
    }

    pub fn getType(self: HttpTransport) []const u8 {
        _ = self;
        return "http";
    }
};