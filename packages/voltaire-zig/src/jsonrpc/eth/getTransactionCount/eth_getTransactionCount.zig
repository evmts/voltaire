const std = @import("std");
const types = @import("../../types.zig");

/// Returns the nonce of an account in the state. NOTE: The name eth_getTransactionCount reflects the historical fact that an account's nonce and sent transaction count were the same. After the Pectra fork, with the inclusion of EIP-7702, this is no longer true.
///
/// Example:
/// Address: "0xc94770007dda54cF92009BFF0dE90c06F603a09f"
/// Block: "latest"
/// Result: "0x1"
///
/// Implements the `eth_getTransactionCount` JSON-RPC method.
pub const EthGetTransactionCount = @This();

/// The JSON-RPC method name
pub const method = "eth_getTransactionCount";

/// Parameters for `eth_getTransactionCount`
pub const Params = struct {
    /// hex encoded address
    address: types.Address,
    /// Block number, tag, or block hash
    block: types.BlockSpec,

    pub fn jsonStringify(self: Params, jws: *std.json.Stringify) !void {
        try jws.beginArray();
        try jws.write(self.address);
        try jws.write(self.block);
        try jws.endArray();
    }

    pub fn jsonParseFromValue(allocator: std.mem.Allocator, source: std.json.Value, options: std.json.ParseOptions) !Params {
        if (source != .array) return error.UnexpectedToken;
        if (source.array.items.len != 2) return error.InvalidParamCount;

        return Params{
            .address = try std.json.innerParseFromValue(types.Address, allocator, source.array.items[0], options),
            .block = try std.json.innerParseFromValue(types.BlockSpec, allocator, source.array.items[1], options),
        };
    }
};

/// Result for `eth_getTransactionCount`
pub const Result = struct {
    /// hex encoded unsigned integer
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
