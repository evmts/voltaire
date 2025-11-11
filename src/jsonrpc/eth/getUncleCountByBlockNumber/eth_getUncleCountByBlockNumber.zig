const std = @import("std");
const types = @import("../../types.zig");

/// Returns the number of transactions in a block matching the given block number.
///
/// Example:
/// Block: "0xe8"
/// Result: "0x1"
///
/// Implements the `eth_getUncleCountByBlockNumber` JSON-RPC method.
pub const EthGetUncleCountByBlockNumber = @This();

/// The JSON-RPC method name
pub const method = "eth_getUncleCountByBlockNumber";

/// Parameters for `eth_getUncleCountByBlockNumber`
pub const Params = struct {
    /// Block number or tag
    block: types.Quantity,

    pub fn jsonStringify(self: Params, jws: *std.json.Stringify) !void {
        try jws.beginArray();
        try jws.write(self.block);
        try jws.endArray();
    }

    pub fn jsonParseFromValue(allocator: std.mem.Allocator, source: std.json.Value, options: std.json.ParseOptions) !Params {
        if (source != .array) return error.UnexpectedToken;
        if (source.array.items.len != 1) return error.InvalidParamCount;

        return Params{
            .block = try std.json.innerParseFromValue(types.Quantity, allocator, source.array.items[0], options),
        };
    }
};

/// Result for `eth_getUncleCountByBlockNumber`
pub const Result = struct {
    value: types.Quantity,

    pub fn jsonStringify(self: Result, jws: *std.json.Stringify) !void {
        try jws.write(self.value);
    }

    pub fn jsonParseFromValue(allocator: std.mem.Allocator, source: std.json.Value, options: std.json.ParseOptions) !Result {
        return Result{
            .value = try std.json.innerParseFromValue(types.Quantity, allocator, source, options),
        };
    }
};
