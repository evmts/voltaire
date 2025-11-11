const std = @import("std");
const types = @import("../../types.zig");

/// Signs and submits a transaction.
///
/// Example:
/// Transaction: ...
/// Result: "0xe670ec64341771606e55d6b4ca35a1a6b75ee3d5145a99d05921026d1527331"
///
/// Implements the `eth_sendTransaction` JSON-RPC method.
pub const EthSendTransaction = @This();

/// The JSON-RPC method name
pub const method = "eth_sendTransaction";

/// Parameters for `eth_sendTransaction`
pub const Params = struct {
    /// Transaction object generic to all types
    transaction: types.Quantity,

    pub fn jsonStringify(self: Params, jws: *std.json.Stringify) !void {
        try jws.beginArray();
        try jws.write(self.transaction);
        try jws.endArray();
    }

    pub fn jsonParseFromValue(allocator: std.mem.Allocator, source: std.json.Value, options: std.json.ParseOptions) !Params {
        if (source != .array) return error.UnexpectedToken;
        if (source.array.items.len != 1) return error.InvalidParamCount;

        return Params{
            .transaction = try std.json.innerParseFromValue(types.Quantity, allocator, source.array.items[0], options),
        };
    }
};

/// Result for `eth_sendTransaction`
pub const Result = struct {
    /// 32 byte hex value
    value: types.Hash,

    pub fn jsonStringify(self: Result, jws: *std.json.Stringify) !void {
        try jws.write(self.value);
    }

    pub fn jsonParseFromValue(allocator: std.mem.Allocator, source: std.json.Value, options: std.json.ParseOptions) !Result {
        return Result{
            .value = try std.json.innerParseFromValue(types.Hash, allocator, source, options),
        };
    }
};
