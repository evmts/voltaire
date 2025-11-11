const std = @import("std");
const types = @import("../../types.zig");

/// Returns an array of all logs matching the filter with the given ID (created using `eth_newFilter`).
///
/// Example:
/// Filter identifier: "0x01"
/// Result: ...
///
/// Implements the `eth_getFilterLogs` JSON-RPC method.
pub const EthGetFilterLogs = @This();

/// The JSON-RPC method name
pub const method = "eth_getFilterLogs";

/// Parameters for `eth_getFilterLogs`
pub const Params = struct {
    /// hex encoded unsigned integer
    filter identifier: types.Quantity,

    pub fn jsonStringify(self: Params, jws: *std.json.Stringify) !void {
        try jws.beginArray();
        try jws.write(self.filter identifier);
        try jws.endArray();
    }

    pub fn jsonParseFromValue(allocator: std.mem.Allocator, source: std.json.Value, options: std.json.ParseOptions) !Params {
        if (source != .array) return error.UnexpectedToken;
        if (source.array.items.len != 1) return error.InvalidParamCount;

        return Params{
            .filter identifier = try std.json.innerParseFromValue(types.Quantity, allocator, source.array.items[0], options),
        };
    }
};

/// Result for `eth_getFilterLogs`
pub const Result = struct {
    /// Filter results
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
