const std = @import("std");
const types = @import("../../types.zig");

/// Executes a new message call immediately without creating a transaction on the block chain.
///
/// Example:
/// Transaction: ...
/// Block: "latest"
/// Result: "0x"
///
/// Implements the `eth_call` JSON-RPC method.
pub const EthCall = @This();

/// The JSON-RPC method name
pub const method = "eth_call";

/// Parameters for `eth_call`
pub const Params = struct {
    /// Transaction object generic to all types
    transaction: types.Quantity,
    /// Block number, tag, or block hash
    block: types.BlockSpec,

    pub fn jsonStringify(self: Params, jws: *std.json.Stringify) !void {
        try jws.beginArray();
        try jws.write(self.transaction);
        try jws.write(self.block);
        try jws.endArray();
    }

    pub fn jsonParseFromValue(allocator: std.mem.Allocator, source: std.json.Value, options: std.json.ParseOptions) !Params {
        if (source != .array) return error.UnexpectedToken;
        if (source.array.items.len != 2) return error.InvalidParamCount;

        return Params{
            .transaction = try std.json.innerParseFromValue(types.Quantity, allocator, source.array.items[0], options),
            .block = try std.json.innerParseFromValue(types.BlockSpec, allocator, source.array.items[1], options),
        };
    }
};

/// Result for `eth_call`
pub const Result = struct {
    /// hex encoded bytes
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
