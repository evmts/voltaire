const std = @import("std");
const types = @import("../../types.zig");

/// Returns the receipt of a transaction by transaction hash.
///
/// Example:
/// Transaction hash: "0x504ce587a65bdbdb6414a0c6c16d86a04dd79bfcc4f2950eec9634b30ce5370f"
/// Result: ...
///
/// Implements the `eth_getTransactionReceipt` JSON-RPC method.
pub const EthGetTransactionReceipt = @This();

/// The JSON-RPC method name
pub const method = "eth_getTransactionReceipt";

/// Parameters for `eth_getTransactionReceipt`
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

/// Result for `eth_getTransactionReceipt`
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
