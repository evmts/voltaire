const std = @import("std");
const types = @import("../../types.zig");

/// Returns the receipts of a block by number or hash.
///
/// Example:
/// Block: "latest"
/// Result: ...
///
/// Implements the `eth_getBlockReceipts` JSON-RPC method.
pub const EthGetBlockReceipts = @This();

/// The JSON-RPC method name
pub const method = "eth_getBlockReceipts";

/// Parameters for `eth_getBlockReceipts`
pub const Params = struct {
    /// Block number, tag, or block hash
    block: types.BlockSpec,

    pub fn jsonStringify(self: Params, jws: *std.json.Stringify) !void {
        try jws.beginArray();
        try jws.write(self.block);
        try jws.endArray();
    }

    pub fn jsonParseFromValue(allocator: std.mem.Allocator, source: std.json.Value, options: std.json.ParseOptions) !Params {
        if (source != .array) return error.UnexpectedToken;
        if (source.array.items.len != 1) return error.InvalidParamCount;

        return Params{
            .block = try std.json.innerParseFromValue(types.BlockSpec, allocator, source.array.items[0], options),
        };
    }
};

/// Result for `eth_getBlockReceipts`
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
