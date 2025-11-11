const std = @import("std");
const types = @import("../../types.zig");

/// Returns the client coinbase address.
///
/// Example:
/// Result: "0xfe3b557e8fb62b89f4916b721be55ceb828dbd73"
///
/// Implements the `eth_coinbase` JSON-RPC method.
pub const EthCoinbase = @This();

/// The JSON-RPC method name
pub const method = "eth_coinbase";

/// Parameters for `eth_coinbase`
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

/// Result for `eth_coinbase`
pub const Result = struct {
    /// hex encoded address
    value: types.Address,

    pub fn jsonStringify(self: Result, jws: *std.json.Stringify) !void {
        try jws.write(self.value);
    }

    pub fn jsonParseFromValue(allocator: std.mem.Allocator, source: std.json.Value, options: std.json.ParseOptions) !Result {
        return Result{
            .value = try std.json.innerParseFromValue(types.Address, allocator, source, options),
        };
    }
};
