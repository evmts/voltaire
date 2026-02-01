const std = @import("std");
const types = @import("../../types.zig");

/// Returns information about a transaction by block hash and transaction index position.
///
/// Example:
/// Block hash: "0xbf137c3a7a1ebdfac21252765e5d7f40d115c2757e4a4abee929be88c624fdb7"
/// Transaction index: "0x2"
/// Result: ...
///
/// Implements the `eth_getTransactionByBlockHashAndIndex` JSON-RPC method.
pub const EthGetTransactionByBlockHashAndIndex = @This();

/// The JSON-RPC method name
pub const method = "eth_getTransactionByBlockHashAndIndex";

/// Parameters for `eth_getTransactionByBlockHashAndIndex`
pub const Params = struct {
    /// 32 byte hex value
    block_hash: types.Hash,
    /// hex encoded unsigned integer
    transaction_index: types.Quantity,

    pub fn jsonStringify(self: Params, jws: *std.json.Stringify) !void {
        try jws.beginArray();
        try jws.write(self.block_hash);
        try jws.write(self.transaction_index);
        try jws.endArray();
    }

    pub fn jsonParseFromValue(allocator: std.mem.Allocator, source: std.json.Value, options: std.json.ParseOptions) !Params {
        if (source != .array) return error.UnexpectedToken;
        if (source.array.items.len != 2) return error.InvalidParamCount;

        return Params{
            .block_hash = try std.json.innerParseFromValue(types.Hash, allocator, source.array.items[0], options),
            .transaction_index = try std.json.innerParseFromValue(types.Quantity, allocator, source.array.items[1], options),
        };
    }
};

/// Result for `eth_getTransactionByBlockHashAndIndex`
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
