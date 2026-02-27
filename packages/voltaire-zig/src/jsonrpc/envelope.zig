const std = @import("std");
// SENTINEL_TEST

/// JSON-RPC 2.0 request id - can be integer, string, or null
pub const Id = union(enum) {
    integer: i64,
    string: []const u8,
    null_value: void,

    pub fn jsonStringify(self: Id, jws: anytype) !void {
        switch (self) {
            .integer => |val| try jws.print("{d}", .{val}),
            .string => |val| try jws.print("\"{s}\"", .{val}),
            .null_value => try jws.print("null", .{}),
        }
    }

    pub fn jsonParseFromValue(_: std.mem.Allocator, source: std.json.Value, _: std.json.ParseOptions) !Id {
        return switch (source) {
            .null => .{ .null_value = {} },
            .integer => |i| .{ .integer = i },
            .float => |f| .{ .integer = @intFromFloat(f) },
            .string => |s| .{ .string = s },
            else => error.UnexpectedToken,
        };
    }

    pub fn eql(self: Id, other: Id) bool {
        if (std.meta.activeTag(self) != std.meta.activeTag(other)) return false;
        return switch (self) {
            .integer => |a| a == other.integer,
            .string => |a| std.mem.eql(u8, a, other.string),
            .null_value => true,
        };
    }

    pub fn dupe(self: Id, allocator: std.mem.Allocator) !Id {
        return switch (self) {
            .integer => |i| .{ .integer = i },
            .string => |s| .{ .string = try allocator.dupe(u8, s) },
            .null_value => .{ .null_value = {} },
        };
    }
};

/// JSON-RPC 2.0 request object
pub const Request = struct {
    jsonrpc: []const u8,
    method: []const u8,
    params: ?std.json.Value,
    id: ?Id,

    pub fn jsonParseFromValue(allocator: std.mem.Allocator, value: std.json.Value, _: std.json.ParseOptions) !Request {
        if (value != .object) return error.UnexpectedToken;

        const obj = value.object;

        // Required: jsonrpc field must be "2.0"
        const jsonrpc_val = obj.get("jsonrpc") orelse return error.MissingField;
        if (jsonrpc_val != .string) return error.UnexpectedToken;
        const jsonrpc = jsonrpc_val.string;
        if (!std.mem.eql(u8, jsonrpc, "2.0")) return error.InvalidVersion;

        // Required: method field
        const method_val = obj.get("method") orelse return error.MissingField;
        if (method_val != .string) return error.UnexpectedToken;
        const method = method_val.string;

        // Optional: params field
        const params = obj.get("params");

        // Optional: id field (can be absent for notifications)
        const id_val = obj.get("id");

        return Request{
            .jsonrpc = try allocator.dupe(u8, jsonrpc),
            .method = try allocator.dupe(u8, method),
            .params = if (params) |p| try cloneJsonValue(allocator, p) else null,
            .id = if (id_val) |i| try Id.jsonParseFromValue(allocator, i, .{}) else null,
        };
    }

    pub fn deinit(self: *Request, allocator: std.mem.Allocator) void {
        allocator.free(self.jsonrpc);
        allocator.free(self.method);
        if (self.params) |*p| freeJsonValue(allocator, p);
        if (self.id) |*id| {
            if (id.* == .string) {
                allocator.free(id.string);
            }
        }
    }
};

/// JSON-RPC 2.0 batch or single request
pub const BatchOrSingle = union(enum) {
    single: Request,
    batch: []Request,

    pub fn parseBatchOrSingle(allocator: std.mem.Allocator, json_bytes: []const u8) !BatchOrSingle {
        const parsed = try std.json.parseFromSlice(std.json.Value, allocator, json_bytes, .{});
        defer parsed.deinit();

        const value = parsed.value;

        if (value == .array) {
            const arr = value.array;
            if (arr.items.len == 0) return error.EmptyBatch;

            const requests = try allocator.alloc(Request, arr.items.len);
            errdefer allocator.free(requests);

            for (arr.items, 0..) |item, i| {
                requests[i] = try Request.jsonParseFromValue(allocator, item, .{});
            }

            return .{ .batch = requests };
        } else if (value == .object) {
            return .{ .single = try Request.jsonParseFromValue(allocator, value, .{}) };
        } else {
            return error.UnexpectedToken;
        }
    }

    pub fn deinit(self: *BatchOrSingle, allocator: std.mem.Allocator) void {
        switch (self.*) {
            .single => |*req| req.deinit(allocator),
            .batch => |*batch| {
                for (batch.*) |*req| {
                    req.deinit(allocator);
                }
                allocator.free(batch.*);
            },
        }
    }
};

/// JSON-RPC 2.0 error codes
pub const ErrorCode = struct {
    pub const PARSE_ERROR: i32 = -32700;
    pub const INVALID_REQUEST: i32 = -32600;
    pub const METHOD_NOT_FOUND: i32 = -32601;
    pub const INVALID_PARAMS: i32 = -32602;
    pub const INTERNAL_ERROR: i32 = -32603;
    pub const SERVER_ERROR: i32 = -32000;
};

/// JSON-RPC 2.0 error object
pub const ErrorObject = struct {
    code: i32,
    message: []const u8,
    data: ?std.json.Value = null,

    pub fn deinit(self: *ErrorObject, allocator: std.mem.Allocator) void {
        allocator.free(self.message);
        if (self.data) |*d| freeJsonValue(allocator, d);
    }
};

/// JSON-RPC 2.0 response object
pub const Response = struct {
    jsonrpc: []const u8 = "2.0",
    id: ?Id,
    result: ?std.json.Value,
    err: ?ErrorObject,

    pub fn deinit(self: *Response, allocator: std.mem.Allocator) void {
        if (self.id) |*id| {
            if (id.* == .string) {
                allocator.free(id.string);
            }
        }
        if (self.result) |*r| freeJsonValue(allocator, r);
        if (self.err) |*e| e.deinit(allocator);
    }
};

/// Serialize a JSON-RPC response to JSON bytes
pub fn serializeResponse(allocator: std.mem.Allocator, response: Response) ![]u8 {
    var buf = std.ArrayList(u8).empty;
    errdefer buf.deinit(allocator);

    const writer = buf.writer(allocator);

    try writer.writeAll("{\"jsonrpc\":\"2.0\"");

    // Serialize id
    try writer.writeAll(",\"id\":");
    if (response.id) |id| {
        switch (id) {
            .integer => |val| try writer.print("{d}", .{val}),
            .string => |val| try writer.print("\"{s}\"", .{val}),
            .null_value => try writer.writeAll("null"),
        }
    } else {
        try writer.writeAll("null");
    }

    // Serialize result or error
    if (response.err) |err| {
        try writer.writeAll(",\"error\":{");
        try writer.print("\"code\":{d},\"message\":\"", .{err.code});

        // Escape the message
        for (err.message) |c| {
            switch (c) {
                '"' => try writer.writeAll("\\\""),
                '\\' => try writer.writeAll("\\\\"),
                '\n' => try writer.writeAll("\\n"),
                '\r' => try writer.writeAll("\\r"),
                '\t' => try writer.writeAll("\\t"),
                else => try writer.writeByte(c),
            }
        }

        try writer.writeAll("\"");

        if (err.data) |data| {
            try writer.writeAll(",\"data\":");
            try stringifyJsonValue(data, writer, allocator);
        }

        try writer.writeAll("}");
    } else if (response.result) |result| {
        try writer.writeAll(",\"result\":");
        try stringifyJsonValue(result, writer, allocator);
    }

    try writer.writeByte('}');

    return buf.toOwnedSlice(allocator);
}

fn stringifyJsonValue(value: std.json.Value, writer: anytype, allocator: std.mem.Allocator) !void {
    switch (value) {
        .null => try writer.writeAll("null"),
        .bool => |b| try writer.writeAll(if (b) "true" else "false"),
        .integer => |i| try writer.print("{d}", .{i}),
        .float => |f| try writer.print("{d}", .{f}),
        .number_string => |s| try writer.print("{s}", .{s}),
        .string => |s| {
            try writer.writeByte('"');
            // Escape string
            for (s) |c| {
                switch (c) {
                    '"' => try writer.writeAll("\\\""),
                    '\\' => try writer.writeAll("\\\\"),
                    '\n' => try writer.writeAll("\\n"),
                    '\r' => try writer.writeAll("\\r"),
                    '\t' => try writer.writeAll("\\t"),
                    else => try writer.writeByte(c),
                }
            }
            try writer.writeByte('"');
        },
        .array => |arr| {
            try writer.writeByte('[');
            for (arr.items, 0..) |item, i| {
                if (i > 0) try writer.writeByte(',');
                try stringifyJsonValue(item, writer, allocator);
            }
            try writer.writeByte(']');
        },
        .object => |obj| {
            try writer.writeByte('{');
            var it = obj.iterator();
            var first = true;
            while (it.next()) |entry| {
                if (!first) try writer.writeByte(',');
                first = false;
                try writer.writeByte('"');
                _ = try writer.write(entry.key_ptr.*);
                try writer.writeAll("\":");
                try stringifyJsonValue(entry.value_ptr.*, writer, allocator);
            }
            try writer.writeByte('}');
        },
    }
}

// Helper functions

fn cloneJsonValue(allocator: std.mem.Allocator, value: std.json.Value) !std.json.Value {
    return switch (value) {
        .null => .null,
        .bool => |b| .{ .bool = b },
        .integer => |i| .{ .integer = i },
        .float => |f| .{ .float = f },
        .number_string => |s| .{ .number_string = try allocator.dupe(u8, s) },
        .string => |s| .{ .string = try allocator.dupe(u8, s) },
        .array => |arr| blk: {
            const new_arr = try allocator.alloc(std.json.Value, arr.items.len);
            errdefer allocator.free(new_arr);
            for (arr.items, 0..) |item, i| {
                new_arr[i] = try cloneJsonValue(allocator, item);
            }
            break :blk .{ .array = .{ .items = new_arr, .capacity = arr.items.len, .allocator = allocator } };
        },
        .object => |obj| blk: {
            var new_obj = std.json.ObjectMap.init(allocator);
            errdefer {
                var it = new_obj.iterator();
                while (it.next()) |entry| {
                    allocator.free(entry.key_ptr.*);
                    var v = entry.value_ptr.*;
                    freeJsonValue(allocator, &v);
                }
                new_obj.deinit();
            }
            var it = obj.iterator();
            while (it.next()) |entry| {
                const key = try allocator.dupe(u8, entry.key_ptr.*);
                const val = try cloneJsonValue(allocator, entry.value_ptr.*);
                try new_obj.put(key, val);
            }
            break :blk .{ .object = new_obj };
        },
    };
}

fn freeJsonValue(allocator: std.mem.Allocator, value: *std.json.Value) void {
    switch (value.*) {
        .number_string => |s| allocator.free(s),
        .string => |s| allocator.free(s),
        .array => |*arr| {
            for (arr.items) |*item| {
                freeJsonValue(allocator, item);
            }
            arr.deinit();
        },
        .object => |*obj| {
            var it = obj.iterator();
            while (it.next()) |entry| {
                allocator.free(entry.key_ptr.*);
                var v = entry.value_ptr.*;
                freeJsonValue(allocator, &v);
            }
            obj.deinit();
        },
        else => {},
    }
}

// Tests

test "Id parses integer/string/null" {
    const allocator = std.testing.allocator;

    // Test integer id via json Value
    {
        const parsed = try std.json.parseFromSlice(std.json.Value, allocator, "42", .{});
        defer parsed.deinit();
        const id = try Id.jsonParseFromValue(allocator, parsed.value, .{});
        try std.testing.expectEqual(@as(i64, 42), id.integer);
    }

    // Test string id via json Value
    {
        const parsed = try std.json.parseFromSlice(std.json.Value, allocator, "\"my-id\"", .{});
        defer parsed.deinit();
        const id = try Id.jsonParseFromValue(allocator, parsed.value, .{});
        try std.testing.expectEqualStrings("my-id", id.string);
    }

    // Test null id via json Value
    {
        const parsed = try std.json.parseFromSlice(std.json.Value, allocator, "null", .{});
        defer parsed.deinit();
        const id = try Id.jsonParseFromValue(allocator, parsed.value, .{});
        try std.testing.expect(id == .null_value);
    }
}

test "Id stringifies integer/string/null" {
    const allocator = std.testing.allocator;

    // Test integer id
    {
        const id = Id{ .integer = 42 };
        var buf = std.ArrayList(u8).empty;
        defer buf.deinit(allocator);
        var out: std.io.Writer.Allocating = .init(allocator);
        defer out.deinit();
        var jws: std.json.Stringify = .{ .writer = &out.writer };
        try id.jsonStringify(&jws);
        try std.testing.expectEqualStrings("42", out.written());
    }

    // Test string id
    {
        const id = Id{ .string = "my-id" };
        var out: std.io.Writer.Allocating = .init(allocator);
        defer out.deinit();
        var jws: std.json.Stringify = .{ .writer = &out.writer };
        try id.jsonStringify(&jws);
        try std.testing.expectEqualStrings("\"my-id\"", out.written());
    }

    // Test null id
    {
        const id = Id{ .null_value = {} };
        var out: std.io.Writer.Allocating = .init(allocator);
        defer out.deinit();
        var jws: std.json.Stringify = .{ .writer = &out.writer };
        try id.jsonStringify(&jws);
        try std.testing.expectEqualStrings("null", out.written());
    }
}

test "Request parses valid jsonrpc 2.0 object" {
    const allocator = std.testing.allocator;

    const json =
        \\{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}
    ;

    const parsed = try std.json.parseFromSlice(std.json.Value, allocator, json, .{});
    defer parsed.deinit();

    var req = try Request.jsonParseFromValue(allocator, parsed.value, .{});
    defer req.deinit(allocator);

    try std.testing.expectEqualStrings("2.0", req.jsonrpc);
    try std.testing.expectEqualStrings("eth_chainId", req.method);
    try std.testing.expect(req.params != null);
    try std.testing.expect(req.id != null);
    try std.testing.expectEqual(@as(i64, 1), req.id.?.integer);
}

test "parseBatchOrSingle parses object and array" {
    const allocator = std.testing.allocator;

    // Test single request
    {
        const json =
            \\{"jsonrpc":"2.0","method":"eth_chainId","id":1}
        ;

        var bos = try BatchOrSingle.parseBatchOrSingle(allocator, json);
        defer bos.deinit(allocator);

        try std.testing.expect(bos == .single);
        try std.testing.expectEqualStrings("eth_chainId", bos.single.method);
    }

    // Test batch request
    {
        const json =
            \\[
            \\  {"jsonrpc":"2.0","method":"eth_chainId","id":1},
            \\  {"jsonrpc":"2.0","method":"eth_blockNumber","id":2}
            \\]
        ;

        var bos = try BatchOrSingle.parseBatchOrSingle(allocator, json);
        defer bos.deinit(allocator);

        try std.testing.expect(bos == .batch);
        try std.testing.expectEqual(@as(usize, 2), bos.batch.len);
        try std.testing.expectEqualStrings("eth_chainId", bos.batch[0].method);
        try std.testing.expectEqualStrings("eth_blockNumber", bos.batch[1].method);
    }
}

test "parseBatchOrSingle empty batch returns error" {
    const allocator = std.testing.allocator;

    const json = "[]";

    const result = BatchOrSingle.parseBatchOrSingle(allocator, json);
    try std.testing.expectError(error.EmptyBatch, result);
}

test "serializeResponse emits success and error envelopes" {
    const allocator = std.testing.allocator;

    // Test success response
    {
        const response = Response{
            .id = .{ .integer = 1 },
            .result = .{ .string = "0x1" },
            .err = null,
        };

        const json = try serializeResponse(allocator, response);
        defer allocator.free(json);

        try std.testing.expect(std.mem.indexOf(u8, json, "\"jsonrpc\":\"2.0\"") != null);
        try std.testing.expect(std.mem.indexOf(u8, json, "\"id\":1") != null);
        try std.testing.expect(std.mem.indexOf(u8, json, "\"result\":\"0x1\"") != null);
    }

    // Test error response
    {
        const response = Response{
            .id = .{ .integer = 2 },
            .result = null,
            .err = .{
                .code = ErrorCode.METHOD_NOT_FOUND,
                .message = "Method not found",
            },
        };

        const json = try serializeResponse(allocator, response);
        defer allocator.free(json);

        try std.testing.expect(std.mem.indexOf(u8, json, "\"jsonrpc\":\"2.0\"") != null);
        try std.testing.expect(std.mem.indexOf(u8, json, "\"id\":2") != null);
        try std.testing.expect(std.mem.indexOf(u8, json, "\"error\":{") != null);
        try std.testing.expect(std.mem.indexOf(u8, json, "\"code\":-32601") != null);
        try std.testing.expect(std.mem.indexOf(u8, json, "\"message\":\"Method not found\"") != null);
    }

    // Test null id response
    {
        const response = Response{
            .id = null,
            .result = null,
            .err = .{
                .code = ErrorCode.PARSE_ERROR,
                .message = "Parse error",
            },
        };

        const json = try serializeResponse(allocator, response);
        defer allocator.free(json);

        try std.testing.expect(std.mem.indexOf(u8, json, "\"id\":null") != null);
    }

    // Test string id response
    {
        const response = Response{
            .id = .{ .string = "test-id" },
            .result = .{ .bool = true },
            .err = null,
        };

        const json = try serializeResponse(allocator, response);
        defer allocator.free(json);

        try std.testing.expect(std.mem.indexOf(u8, json, "\"id\":\"test-id\"") != null);
        try std.testing.expect(std.mem.indexOf(u8, json, "\"result\":true") != null);
    }
}
