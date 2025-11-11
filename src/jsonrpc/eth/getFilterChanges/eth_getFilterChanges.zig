const std = @import("std");
const types = @import("../../types.zig");

/// Polling method for the filter with the given ID (created using `eth_newFilter`). Returns an array of logs, block hashes, or transaction hashes since last poll, depending on the installed filter.
///
/// Example:
/// Filter identifier: "0x01"
/// Result: ...
///
/// Implements the `eth_getFilterChanges` JSON-RPC method.
pub const EthGetFilterChanges = @This();

/// The JSON-RPC method name
pub const method = "eth_getFilterChanges";

/// Parameters for `eth_getFilterChanges`
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

/// Result for `eth_getFilterChanges`
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
