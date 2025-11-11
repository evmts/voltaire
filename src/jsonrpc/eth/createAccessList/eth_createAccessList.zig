const std = @import("std");
const types = @import("../../types.zig");

/// Generates an access list for a transaction.
///
/// Example:
/// Transaction: ...
/// Block: "latest"
/// Result: ...
///
/// Implements the `eth_createAccessList` JSON-RPC method.
pub const EthCreateAccessList = @This();

/// The JSON-RPC method name
pub const method = "eth_createAccessList";

/// Parameters for `eth_createAccessList`
pub const Params = struct {
    /// Transaction object generic to all types
    transaction: types.Quantity,
    /// Block number or tag
    block: types.Quantity,

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
            .block = try std.json.innerParseFromValue(types.Quantity, allocator, source.array.items[1], options),
        };
    }
};

/// Result for `eth_createAccessList`
pub const Result = struct {
    /// Access list result
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
