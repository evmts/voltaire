const std = @import("std");
const types = @import("../../types.zig");

pub const method = "eth_getTransactionReceipt";

pub const Params = struct {
    transaction_hash: types.Hash,

    pub fn jsonStringify(self: Params, jws: *std.json.Stringify) !void {
        try jws.beginArray();
        try jws.write(self.transaction_hash);
        try jws.endArray();
    }

    pub fn jsonParseFromValue(allocator: std.mem.Allocator, source: std.json.Value, options: std.json.ParseOptions) !Params {
        if (source != .array) return error.UnexpectedToken;
        if (source.array.items.len != 1) return error.UnexpectedToken;

        return .{
            .transaction_hash = try std.json.innerParseFromValue(types.Hash, allocator, source.array.items[0], options),
        };
    }
};

pub const Result = struct {
    value: ?types.ReceiptResponse,

    pub fn jsonStringify(self: Result, jws: *std.json.Stringify) !void {
        if (self.value) |receipt| {
            try jws.write(receipt);
        } else {
            try jws.write(null);
        }
    }
};
