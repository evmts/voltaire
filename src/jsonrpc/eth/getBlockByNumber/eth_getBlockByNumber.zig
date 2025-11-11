const std = @import("std");
const types = @import("../../types.zig");

/// Returns information about a block by number.
///
/// Example:
/// block: "0x68b3"
/// Hydrated transactions: false
/// Result: ...
///
/// Implements the `eth_getBlockByNumber` JSON-RPC method.
pub const EthGetBlockByNumber = @This();

/// The JSON-RPC method name
pub const method = "eth_getBlockByNumber";

/// Parameters for `eth_getBlockByNumber`
pub const Params = struct {
    /// Block number or tag
    block: types.Quantity,
    /// hydrated
    hydrated transactions: types.Quantity,

    pub fn jsonStringify(self: Params, jws: *std.json.Stringify) !void {
        try jws.beginArray();
        try jws.write(self.block);
        try jws.write(self.hydrated transactions);
        try jws.endArray();
    }

    pub fn jsonParseFromValue(allocator: std.mem.Allocator, source: std.json.Value, options: std.json.ParseOptions) !Params {
        if (source != .array) return error.UnexpectedToken;
        if (source.array.items.len != 2) return error.InvalidParamCount;

        return Params{
            .block = try std.json.innerParseFromValue(types.Quantity, allocator, source.array.items[0], options),
            .hydrated transactions = try std.json.innerParseFromValue(types.Quantity, allocator, source.array.items[1], options),
        };
    }
};

/// Result for `eth_getBlockByNumber`
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
