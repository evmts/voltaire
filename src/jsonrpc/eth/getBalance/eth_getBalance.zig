const std = @import("std");
const types = @import("../../types.zig");

/// Returns the balance of the account of given address.
///
/// Example:
/// Address: "0xfe3b557e8fb62b89f4916b721be55ceb828dbd73"
/// Block: "latest"
/// Result: "0x1cfe56f3795885980000"
///
/// Implements the `eth_getBalance` JSON-RPC method.
pub const EthGetBalance = @This();

/// The JSON-RPC method name
pub const method = "eth_getBalance";

/// Parameters for `eth_getBalance`
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

/// Result for `eth_getBalance`
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
