const std = @import("std");
const types = @import("../../types.zig");

/// Executes a sequence of message calls building on each other's state without creating transactions on the block chain, optionally overriding block and state data
///
/// Implements the `eth_simulateV1` JSON-RPC method.
pub const EthSimulateV1 = @This();

/// The JSON-RPC method name
pub const method = "eth_simulateV1";

/// Parameters for `eth_simulateV1`
pub const Params = struct {
    /// Arguments for eth_simulate
    payload: types.Quantity,
    /// Block number, tag, or block hash
    block_tag: types.BlockSpec,

    pub fn jsonStringify(self: Params, jws: *std.json.Stringify) !void {
        try jws.beginArray();
        try jws.write(self.payload);
        try jws.write(self.block_tag);
        try jws.endArray();
    }

    pub fn jsonParseFromValue(allocator: std.mem.Allocator, source: std.json.Value, options: std.json.ParseOptions) !Params {
        if (source != .array) return error.UnexpectedToken;
        if (source.array.items.len != 2) return error.InvalidParamCount;

        return Params{
            .payload = try std.json.innerParseFromValue(types.Quantity, allocator, source.array.items[0], options),
            .block_tag = try std.json.innerParseFromValue(types.BlockSpec, allocator, source.array.items[1], options),
        };
    }
};

/// Result for `eth_simulateV1`
pub const Result = struct {
    /// Full results of eth_simulate
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
