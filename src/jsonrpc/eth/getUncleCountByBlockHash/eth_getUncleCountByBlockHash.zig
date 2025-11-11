const std = @import("std");
const types = @import("../../types.zig");

/// Returns the number of uncles in a block from a block matching the given block hash.
///
/// Example:
/// Block hash: "0xb3b20624f8f0f86eb50dd04688409e5cea4bd02d700bf6e79e9384d47d6a5a35"
/// Result: "0x1"
///
/// Implements the `eth_getUncleCountByBlockHash` JSON-RPC method.
pub const EthGetUncleCountByBlockHash = @This();

/// The JSON-RPC method name
pub const method = "eth_getUncleCountByBlockHash";

/// Parameters for `eth_getUncleCountByBlockHash`
pub const Params = struct {
    /// 32 byte hex value
    block hash: types.Hash,

    pub fn jsonStringify(self: Params, jws: *std.json.Stringify) !void {
        try jws.beginArray();
        try jws.write(self.block hash);
        try jws.endArray();
    }

    pub fn jsonParseFromValue(allocator: std.mem.Allocator, source: std.json.Value, options: std.json.ParseOptions) !Params {
        if (source != .array) return error.UnexpectedToken;
        if (source.array.items.len != 1) return error.InvalidParamCount;

        return Params{
            .block hash = try std.json.innerParseFromValue(types.Hash, allocator, source.array.items[0], options),
        };
    }
};

/// Result for `eth_getUncleCountByBlockHash`
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
