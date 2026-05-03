const std = @import("std");

pub const ErrorCode = struct {
    pub const PARSE_ERROR: i32 = -32700;
    pub const INVALID_REQUEST: i32 = -32600;
    pub const METHOD_NOT_FOUND: i32 = -32601;
    pub const INVALID_PARAMS: i32 = -32602;
    pub const INTERNAL_ERROR: i32 = -32603;
};

pub const Id = union(enum) {
    integer: i64,
    string: []const u8,
    null_value,

    pub fn jsonStringify(self: Id, jws: anytype) !void {
        switch (self) {
            .integer => |value| try jws.write(value),
            .string => |value| try jws.write(value),
            .null_value => try jws.write(null),
        }
    }

    pub fn dupe(self: Id, allocator: std.mem.Allocator) !Id {
        return switch (self) {
            .integer => |value| .{ .integer = value },
            .string => |value| .{ .string = try allocator.dupe(u8, value) },
            .null_value => .null_value,
        };
    }

    pub fn deinit(self: Id, allocator: std.mem.Allocator) void {
        switch (self) {
            .string => |value| allocator.free(value),
            else => {},
        }
    }
};

pub const RequestEnvelope = struct {
    jsonrpc: []const u8,
    id: ?Id,
    method: []const u8,
    params: ?std.json.Value,
    invalid: bool = false,

    pub fn deinit(self: *RequestEnvelope, allocator: std.mem.Allocator) void {
        allocator.free(self.jsonrpc);
        allocator.free(self.method);
        if (self.id) |id| {
            id.deinit(allocator);
        }
    }
};

pub const ErrorObject = struct {
    code: i32,
    message: []const u8,
    data: ?std.json.Value = null,
    owns_message: bool = false,

    pub fn deinit(self: *ErrorObject, allocator: std.mem.Allocator) void {
        if (self.owns_message) {
            allocator.free(self.message);
            self.owns_message = false;
        }
    }

    pub fn jsonStringify(self: ErrorObject, jws: anytype) !void {
        try jws.beginObject();
        try jws.objectField("code");
        try jws.write(self.code);
        try jws.objectField("message");
        try jws.write(self.message);
        if (self.data) |data| {
            try jws.objectField("data");
            try jws.write(data);
        }
        try jws.endObject();
    }
};

pub const ResponseEnvelope = struct {
    jsonrpc: []const u8 = "2.0",
    id: ?Id,
    result: ?std.json.Value = null,
    error_value: ?ErrorObject = null,
    /// When set, deinit() recursively frees `result` strings/arrays/objects
    /// using this allocator. makeSuccess captures the allocator that built
    /// the value so the caller cannot forget to clean it up. makeError
    /// leaves it null because errors don't own a result.
    owns_result: bool = false,

    pub fn makeSuccess(id: ?Id, result: std.json.Value) ResponseEnvelope {
        return .{
            .id = id,
            .result = result,
            .error_value = null,
            .owns_result = true,
        };
    }

    pub fn makeError(id: ?Id, code: i32, message: []const u8) ResponseEnvelope {
        return .{
            .id = id,
            .result = null,
            .error_value = .{ .code = code, .message = message },
            .owns_result = false,
        };
    }

    pub fn deinit(self: *ResponseEnvelope, allocator: std.mem.Allocator) void {
        if (self.error_value) |*err| {
            err.deinit(allocator);
        }
        if (self.owns_result) {
            if (self.result) |*value| {
                deinitJsonValue(allocator, value);
            }
        }
    }

    pub fn jsonStringify(self: ResponseEnvelope, jws: anytype) !void {
        try jws.beginObject();
        try jws.objectField("jsonrpc");
        try jws.write(self.jsonrpc);
        try jws.objectField("id");
        if (self.id) |id| {
            try id.jsonStringify(jws);
        } else {
            try jws.write(null);
        }
        if (self.error_value) |err| {
            try jws.objectField("error");
            try err.jsonStringify(jws);
        } else if (self.result) |result| {
            try jws.objectField("result");
            try jws.write(result);
        } else {
            try jws.objectField("result");
            try jws.write(null);
        }
        try jws.endObject();
    }
};

/// Recursively free strings/arrays/objects inside a json.Value so a
/// ResponseEnvelope.result that the handler allocator built can be cleaned
/// up by the dispatcher without each handler having to deinit explicitly.
fn deinitJsonValue(allocator: std.mem.Allocator, value: *std.json.Value) void {
    switch (value.*) {
        .string => |s| allocator.free(s),
        .number_string => |s| allocator.free(s),
        .array => |*arr| {
            for (arr.items) |*item| {
                deinitJsonValue(allocator, item);
            }
            arr.deinit();
        },
        .object => |*obj| {
            var it = obj.iterator();
            while (it.next()) |entry| {
                allocator.free(entry.key_ptr.*);
                deinitJsonValue(allocator, entry.value_ptr);
            }
            obj.deinit();
        },
        else => {},
    }
}

pub const RequestBatch = struct {
    kind: Kind,
    parsed: std.json.Parsed(std.json.Value),

    pub const Kind = union(enum) {
        single: RequestEnvelope,
        batch: []RequestEnvelope,
    };

    pub fn deinit(self: *RequestBatch, allocator: std.mem.Allocator) void {
        switch (self.kind) {
            .single => |*request| request.deinit(allocator),
            .batch => |batch| {
                for (batch) |*request| {
                    var mutable = request.*;
                    mutable.deinit(allocator);
                }
                allocator.free(batch);
            },
        }
        self.parsed.deinit();
    }
};

pub fn parseSingleOrBatch(allocator: std.mem.Allocator, body: []const u8) !RequestBatch {
    var parsed = try std.json.parseFromSlice(std.json.Value, allocator, body, .{
        .allocate = .alloc_always,
    });
    errdefer parsed.deinit();

    const kind = try parseValue(allocator, parsed.value);
    return .{ .kind = kind, .parsed = parsed };
}

fn parseValue(allocator: std.mem.Allocator, value: std.json.Value) !RequestBatch.Kind {
    return switch (value) {
        .object => RequestBatch.Kind{ .single = try parseRequest(allocator, value) },
        .array => |array| blk: {
            if (array.items.len == 0) return error.InvalidRequest;
            const requests = try allocator.alloc(RequestEnvelope, array.items.len);
            errdefer allocator.free(requests);
            var initialized: usize = 0;
            errdefer {
                var i: usize = 0;
                while (i < initialized) : (i += 1) {
                    requests[i].deinit(allocator);
                }
            }
            for (array.items, 0..) |item, i| {
                requests[i] = parseRequest(allocator, item) catch |err| switch (err) {
                    error.InvalidRequest => try makeInvalidRequestEnvelope(allocator),
                    else => return err,
                };
                initialized = i + 1;
            }
            break :blk RequestBatch.Kind{ .batch = requests };
        },
        else => error.InvalidRequest,
    };
}

fn makeInvalidRequestEnvelope(allocator: std.mem.Allocator) !RequestEnvelope {
    const jsonrpc_owned = try allocator.dupe(u8, "2.0");
    errdefer allocator.free(jsonrpc_owned);

    const method_owned = try allocator.dupe(u8, "");
    errdefer allocator.free(method_owned);

    return .{
        .jsonrpc = jsonrpc_owned,
        .id = null,
        .method = method_owned,
        .params = null,
        .invalid = true,
    };
}

fn parseRequest(allocator: std.mem.Allocator, value: std.json.Value) !RequestEnvelope {
    if (value != .object) return error.InvalidRequest;
    const obj = value.object;

    const jsonrpc_value = obj.get("jsonrpc") orelse return error.InvalidRequest;
    if (jsonrpc_value != .string) return error.InvalidRequest;
    if (!std.mem.eql(u8, jsonrpc_value.string, "2.0")) return error.InvalidRequest;

    const method_value = obj.get("method") orelse return error.InvalidRequest;
    if (method_value != .string) return error.InvalidRequest;

    const id_value = obj.get("id");

    const jsonrpc_owned = try allocator.dupe(u8, jsonrpc_value.string);
    errdefer allocator.free(jsonrpc_owned);

    const method_owned = try allocator.dupe(u8, method_value.string);
    errdefer allocator.free(method_owned);

    var id_owned: ?Id = null;
    errdefer {
        if (id_owned) |id| {
            id.deinit(allocator);
        }
    }

    if (id_value) |raw| {
        id_owned = switch (raw) {
            .integer => |n| .{ .integer = n },
            .string => |s| .{ .string = try allocator.dupe(u8, s) },
            .null => .null_value,
            else => return error.InvalidRequest,
        };
    }

    const params_value = obj.get("params");
    if (params_value) |raw| {
        switch (raw) {
            .array, .object, .null => {},
            else => return error.InvalidRequest,
        }
    }

    return .{
        .jsonrpc = jsonrpc_owned,
        .id = id_owned,
        .method = method_owned,
        .params = params_value,
    };
}

test "parseSingleOrBatch single request" {
    const allocator = std.testing.allocator;
    const body = "{\"jsonrpc\":\"2.0\",\"id\":7,\"method\":\"eth_blockNumber\"}";
    var batch = try parseSingleOrBatch(allocator, body);
    defer batch.deinit(allocator);

    try std.testing.expect(batch.kind == .single);
    try std.testing.expectEqualStrings("2.0", batch.kind.single.jsonrpc);
    try std.testing.expectEqualStrings("eth_blockNumber", batch.kind.single.method);
    try std.testing.expect(batch.kind.single.id.? == .integer);
    try std.testing.expectEqual(@as(i64, 7), batch.kind.single.id.?.integer);
}

test "parseSingleOrBatch batch request" {
    const allocator = std.testing.allocator;
    const body = "[{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"a\"},{\"jsonrpc\":\"2.0\",\"id\":\"x\",\"method\":\"b\"}]";
    var batch = try parseSingleOrBatch(allocator, body);
    defer batch.deinit(allocator);

    try std.testing.expect(batch.kind == .batch);
    try std.testing.expectEqual(@as(usize, 2), batch.kind.batch.len);
    try std.testing.expectEqualStrings("a", batch.kind.batch[0].method);
    try std.testing.expectEqualStrings("b", batch.kind.batch[1].method);
}

test "parseSingleOrBatch marks malformed batch items invalid" {
    const allocator = std.testing.allocator;
    const body = "[{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"a\"},{\"jsonrpc\":\"2.0\",\"id\":2},42]";
    var batch = try parseSingleOrBatch(allocator, body);
    defer batch.deinit(allocator);

    try std.testing.expect(batch.kind == .batch);
    try std.testing.expectEqual(@as(usize, 3), batch.kind.batch.len);
    try std.testing.expect(!batch.kind.batch[0].invalid);
    try std.testing.expect(batch.kind.batch[1].invalid);
    try std.testing.expect(batch.kind.batch[2].invalid);
    try std.testing.expect(batch.kind.batch[1].id == null);
    try std.testing.expectEqualStrings("", batch.kind.batch[1].method);
}

test "parseSingleOrBatch rejects missing jsonrpc field" {
    const allocator = std.testing.allocator;
    const body = "{\"id\":1,\"method\":\"x\"}";
    try std.testing.expectError(error.InvalidRequest, parseSingleOrBatch(allocator, body));
}

test "ResponseEnvelope serializes success" {
    const allocator = std.testing.allocator;
    const response = ResponseEnvelope.makeSuccess(.{ .integer = 1 }, .{ .integer = 42 });

    var writer = std.Io.Writer.Allocating.init(allocator);
    defer writer.deinit();
    try std.json.Stringify.value(response, .{}, &writer.writer);
    const bytes = writer.written();
    try std.testing.expect(std.mem.indexOf(u8, bytes, "\"result\":42") != null);
    try std.testing.expect(std.mem.indexOf(u8, bytes, "\"id\":1") != null);
}

test "ResponseEnvelope serializes error" {
    const allocator = std.testing.allocator;
    const response = ResponseEnvelope.makeError(.{ .integer = 7 }, ErrorCode.METHOD_NOT_FOUND, "Method not found");

    var writer = std.Io.Writer.Allocating.init(allocator);
    defer writer.deinit();
    try std.json.Stringify.value(response, .{}, &writer.writer);
    const bytes = writer.written();
    try std.testing.expect(std.mem.indexOf(u8, bytes, "\"error\"") != null);
    try std.testing.expect(std.mem.indexOf(u8, bytes, "-32601") != null);
    try std.testing.expect(std.mem.indexOf(u8, bytes, "Method not found") != null);
}
