const std = @import("std");
const types = @import("../../types.zig");

/// Returns the number of most recent block.
///
/// Example:
/// Result: "0x2377"
///
/// Implements the `eth_blockNumber` JSON-RPC method.
pub const EthBlockNumber = @This();

/// The JSON-RPC method name
pub const method = "eth_blockNumber";

/// Parameters for `eth_blockNumber`
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

/// Result for `eth_blockNumber`
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
