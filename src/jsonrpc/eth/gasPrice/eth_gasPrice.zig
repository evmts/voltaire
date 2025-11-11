const std = @import("std");
const types = @import("../../types.zig");

/// Returns the current price per gas in wei.
///
/// Example:
/// Result: "0x3e8"
///
/// Implements the `eth_gasPrice` JSON-RPC method.
pub const EthGasPrice = @This();

/// The JSON-RPC method name
pub const method = "eth_gasPrice";

/// Parameters for `eth_gasPrice`
pub const Params = struct {
    pub fn jsonStringify(self: Params, jws: *std.json.Stringify) !void {
        _ = self;
        try jws.write(.{});
    }

    pub fn jsonParseFromValue(allocator: std.mem.Allocator, source: std.json.Value, options: std.json.ParseOptions) !Params {
        _ = allocator;
        _ = source;
        _ = options;
        return Params{};
    }
};

/// Result for `eth_gasPrice`
pub const Result = struct {
    /// Gas price
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
