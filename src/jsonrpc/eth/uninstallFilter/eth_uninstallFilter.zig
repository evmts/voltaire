const std = @import("std");
const types = @import("../../types.zig");

/// Uninstalls a filter with given id.
///
/// Example:
/// Filter identifier: "0x01"
/// Result: true
///
/// Implements the `eth_uninstallFilter` JSON-RPC method.
pub const EthUninstallFilter = @This();

/// The JSON-RPC method name
pub const method = "eth_uninstallFilter";

/// Parameters for `eth_uninstallFilter`
pub const Params = struct {
    /// hex encoded unsigned integer
    filter_identifier: types.Quantity,

    pub fn jsonStringify(self: Params, jws: *std.json.Stringify) !void {
        try jws.beginArray();
        try jws.write(self.filter_identifier);
        try jws.endArray();
    }

    pub fn jsonParseFromValue(allocator: std.mem.Allocator, source: std.json.Value, options: std.json.ParseOptions) !Params {
        if (source != .array) return error.UnexpectedToken;
        if (source.array.items.len != 1) return error.InvalidParamCount;

        return Params{
            .filter_identifier = try std.json.innerParseFromValue(types.Quantity, allocator, source.array.items[0], options),
        };
    }
};

/// Result for `eth_uninstallFilter`
pub const Result = struct {
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
