const std = @import("std");
const types = @import("../../types.zig");

/// Returns an array of all logs matching the specified filter.
///
/// Example:
/// Filter: ...
/// Result: ...
///
/// Implements the `eth_getLogs` JSON-RPC method.
pub const EthGetLogs = @This();

/// The JSON-RPC method name
pub const method = "eth_getLogs";

/// Parameters for `eth_getLogs`
pub const Params = struct {
    /// filter
    filter: types.Quantity,

    pub fn jsonStringify(self: Params, jws: *std.json.Stringify) !void {
        try jws.beginArray();
        try jws.write(self.filter);
        try jws.endArray();
    }

    pub fn jsonParseFromValue(allocator: std.mem.Allocator, source: std.json.Value, options: std.json.ParseOptions) !Params {
        if (source != .array) return error.UnexpectedToken;
        if (source.array.items.len != 1) return error.InvalidParamCount;

        return Params{
            .filter = try std.json.innerParseFromValue(types.Quantity, allocator, source.array.items[0], options),
        };
    }
};

/// Result for `eth_getLogs`
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
