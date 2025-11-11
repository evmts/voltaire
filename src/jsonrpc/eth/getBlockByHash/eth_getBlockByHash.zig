const std = @import("std");
const types = @import("../../types.zig");

/// Returns information about a block by hash.
///
/// Example:
/// Block hash: "0xd5f1812548be429cbdc6376b29611fc49e06f1359758c4ceaaa3b393e2239f9c"
/// Hydrated transactions: false
/// Result: ...
///
/// Implements the `eth_getBlockByHash` JSON-RPC method.
pub const EthGetBlockByHash = @This();

/// The JSON-RPC method name
pub const method = "eth_getBlockByHash";

/// Parameters for `eth_getBlockByHash`
pub const Params = struct {
    /// 32 byte hex value
    block hash: types.Hash,
    /// hydrated
    hydrated transactions: types.Quantity,

    pub fn jsonStringify(self: Params, jws: *std.json.Stringify) !void {
        try jws.beginArray();
        try jws.write(self.block hash);
        try jws.write(self.hydrated transactions);
        try jws.endArray();
    }

    pub fn jsonParseFromValue(allocator: std.mem.Allocator, source: std.json.Value, options: std.json.ParseOptions) !Params {
        if (source != .array) return error.UnexpectedToken;
        if (source.array.items.len != 2) return error.InvalidParamCount;

        return Params{
            .block hash = try std.json.innerParseFromValue(types.Hash, allocator, source.array.items[0], options),
            .hydrated transactions = try std.json.innerParseFromValue(types.Quantity, allocator, source.array.items[1], options),
        };
    }
};

/// Result for `eth_getBlockByHash`
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
