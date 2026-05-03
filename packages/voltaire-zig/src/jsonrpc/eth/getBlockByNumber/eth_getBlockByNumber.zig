const std = @import("std");
const types = @import("../../types.zig");

pub const method = "eth_getBlockByNumber";

pub const Params = struct {
    block: types.BlockSpec,
    hydrated_transactions: bool,

    pub fn jsonStringify(self: Params, jws: *std.json.Stringify) !void {
        try jws.beginArray();
        try jws.write(self.block);
        try jws.write(self.hydrated_transactions);
        try jws.endArray();
    }

    pub fn jsonParseFromValue(_: std.mem.Allocator, source: std.json.Value, _: std.json.ParseOptions) !Params {
        if (source != .array) return error.UnexpectedToken;
        if (source.array.items.len != 2) return error.UnexpectedToken;

        const hydrated = switch (source.array.items[1]) {
            .bool => |b| b,
            .string => |s| std.mem.eql(u8, s, "true"),
            else => false,
        };

        return .{
            .block = .{ .value = source.array.items[0] },
            .hydrated_transactions = hydrated,
        };
    }
};

pub const Result = struct {
    block: ?types.BlockResponse,

    pub fn jsonStringify(self: Result, jws: *std.json.Stringify) !void {
        if (self.block) |block| {
            try jws.write(block);
        } else {
            try jws.write(null);
        }
    }
};
