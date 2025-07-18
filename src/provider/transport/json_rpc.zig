const std = @import("std");
const Allocator = std.mem.Allocator;

// Simple, working JSON-RPC implementation for provider transport

pub const JsonRpcRequest = struct {
    method: []const u8,
    params: []const u8, // JSON string
    id: u64,

    pub fn to_json(self: JsonRpcRequest, allocator: Allocator) ![]u8 {
        return std.fmt.allocPrint(allocator,
            \\{{"jsonrpc":"2.0","method":"{s}","params":{s},"id":{d}}}
        , .{ self.method, self.params, self.id });
    }
};

pub const JsonRpcResponse = struct {
    result: ?[]const u8, // JSON string
    error_info: ?JsonRpcError,
    id: u64,

    pub fn from_json(allocator: Allocator, json_str: []const u8) !JsonRpcResponse {
        const parsed = try std.json.parseFromSlice(std.json.Value, allocator, json_str, .{});
        defer parsed.deinit();

        const root = parsed.value.object;

        const id = if (root.get("id")) |id_val|
            switch (id_val) {
                .integer => |i| @as(u64, @intCast(i)),
                .float => |f| @as(u64, @intFromFloat(f)),
                else => 0,
            }
        else
            0;

        if (root.get("error")) |error_val| {
            const error_obj = error_val.object;
            const code = if (error_obj.get("code")) |code_val|
                switch (code_val) {
                    .integer => |i| @as(i32, @intCast(i)),
                    .float => |f| @as(i32, @intFromFloat(f)),
                    else => -1,
                }
            else
                -1;

            const message = if (error_obj.get("message")) |msg_val|
                switch (msg_val) {
                    .string => |s| try allocator.dupe(u8, s),
                    else => try allocator.dupe(u8, "Unknown error"),
                }
            else
                try allocator.dupe(u8, "Unknown error");

            return JsonRpcResponse{
                .result = null,
                .error_info = JsonRpcError{
                    .code = code,
                    .message = message,
                },
                .id = id,
            };
        }

        if (root.get("result")) |result_val| {
            // Serialize the result back to JSON string
            var result_str = std.ArrayList(u8).init(allocator);
            defer result_str.deinit();

            try std.json.stringify(result_val, .{}, result_str.writer());

            return JsonRpcResponse{
                .result = try allocator.dupe(u8, result_str.items),
                .error_info = null,
                .id = id,
            };
        }

        return JsonRpcResponse{
            .result = null,
            .error_info = null,
            .id = id,
        };
    }

    pub fn deinit(self: JsonRpcResponse, allocator: Allocator) void {
        if (self.result) |result| {
            allocator.free(result);
        }
        if (self.error_info) |error_info| {
            allocator.free(error_info.message);
        }
    }
};

pub const JsonRpcError = struct {
    code: i32,
    message: []const u8,
};
