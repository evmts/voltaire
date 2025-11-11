const std = @import("std");
const types = @import("../../types.zig");

/// Returns the information about a transaction requested by transaction hash.
///
/// Example:
/// Transaction hash: "0xa52be92809541220ee0aaaede6047d9a6c5d0cd96a517c854d944ee70a0ebb44"
/// Result: ...
///
/// Implements the `eth_getTransactionByHash` JSON-RPC method.
pub const EthGetTransactionByHash = @This();

/// The JSON-RPC method name
pub const method = "eth_getTransactionByHash";

/// Parameters for `eth_getTransactionByHash`
pub const Params = struct {
    /// 32 byte hex value
    transaction hash: types.Hash,

    pub fn jsonStringify(self: Params, jws: *std.json.Stringify) !void {
        try jws.beginArray();
        try jws.write(self.transaction hash);
        try jws.endArray();
    }

    pub fn jsonParseFromValue(allocator: std.mem.Allocator, source: std.json.Value, options: std.json.ParseOptions) !Params {
        if (source != .array) return error.UnexpectedToken;
        if (source.array.items.len != 1) return error.InvalidParamCount;

        return Params{
            .transaction hash = try std.json.innerParseFromValue(types.Hash, allocator, source.array.items[0], options),
        };
    }
};

/// Result for `eth_getTransactionByHash`
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
