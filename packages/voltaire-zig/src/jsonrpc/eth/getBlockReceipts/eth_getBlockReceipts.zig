const std = @import("std");
const types = @import("../../types.zig");

pub const method = "eth_getBlockReceipts";

pub const Params = struct {
    block: types.BlockSpec,

    pub fn jsonStringify(self: Params, jws: *std.json.Stringify) !void {
        try jws.beginArray();
        try jws.write(self.block);
        try jws.endArray();
    }

    pub fn jsonParseFromValue(allocator: std.mem.Allocator, source: std.json.Value, options: std.json.ParseOptions) !Params {
        if (source != .array) return error.UnexpectedToken;
        if (source.array.items.len != 1) return error.UnexpectedToken;

        return .{
            .block = try std.json.innerParseFromValue(types.BlockSpec, allocator, source.array.items[0], options),
        };
    }
};

pub const Result = struct {
    value: ?[]const types.ReceiptResponse,

    pub fn jsonStringify(self: Result, jws: *std.json.Stringify) !void {
        if (self.value) |receipts| {
            try jws.write(receipts);
        } else {
            try jws.write(null);
        }
    }
};
