const std = @import("std");
const types = @import("../../types.zig");

/// Creates a filter in the node, allowing for later polling. Registers client interest in new blocks, and returns an identifier.
///
/// Example:
/// Result: "0x01"
///
/// Implements the `eth_newBlockFilter` JSON-RPC method.
pub const EthNewBlockFilter = @This();

/// The JSON-RPC method name
pub const method = "eth_newBlockFilter";

/// Parameters for `eth_newBlockFilter`
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

/// Result for `eth_newBlockFilter`
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
