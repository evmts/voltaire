const std = @import("std");
const types = @import("../../types.zig");

/// Returns the number of transactions in a block from a block matching the given block hash.
///
/// Example:
/// Block hash: "0xb903239f8543d04b5dc1ba6579132b143087c68db1b2168786408fcbce568238"
/// Result: "0x8"
///
/// Implements the `eth_getBlockTransactionCountByHash` JSON-RPC method.
pub const EthGetBlockTransactionCountByHash = @This();

/// The JSON-RPC method name
pub const method = "eth_getBlockTransactionCountByHash";

/// Parameters for `eth_getBlockTransactionCountByHash`
pub const Params = struct {
    /// 32 byte hex value
    block_hash: types.Hash,

    pub fn jsonStringify(self: Params, jws: *std.json.Stringify) !void {
        try jws.beginArray();
        try jws.write(self.block_hash);
        try jws.endArray();
    }

    pub fn jsonParseFromValue(allocator: std.mem.Allocator, source: std.json.Value, options: std.json.ParseOptions) !Params {
        if (source != .array) return error.UnexpectedToken;
        if (source.array.items.len != 1) return error.InvalidParamCount;

        return Params{
            .block_hash = try std.json.innerParseFromValue(types.Hash, allocator, source.array.items[0], options),
        };
    }
};

/// Result for `eth_getBlockTransactionCountByHash`
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
