const std = @import("std");
const types = @import("../../types.zig");

/// Returns an array of all logs matching the specified filter.
///
/// Example:
/// Filter: {"fromBlock":"0x1","toBlock":"0x4","address":["0x7dcd17433742f4c0ca53122ab541d0ba67fc27df"]}
/// Result: [{"address":"0x7dcd17433742f4c0ca53122ab541d0ba67fc27df","topics":["0x..."],"data":"0x...","blockNumber":"0x2",...}]
///
/// Implements the `eth_getLogs` JSON-RPC method.
pub const EthGetLogs = @This();

/// The JSON-RPC method name
pub const method = "eth_getLogs";

/// Parameters for `eth_getLogs`
pub const Params = struct {
    /// The filter object for querying logs
    filter: types.Filter,

    pub fn jsonStringify(self: Params, jws: *std.json.Stringify) !void {
        try jws.beginArray();
        try jws.write(self.filter);
        try jws.endArray();
    }

    pub fn jsonParseFromValue(allocator: std.mem.Allocator, source: std.json.Value, options: std.json.ParseOptions) !Params {
        if (source != .array) return error.UnexpectedToken;
        if (source.array.items.len != 1) return error.InvalidParamCount;

        return Params{
            .filter = try std.json.innerParseFromValue(types.Filter, allocator, source.array.items[0], options),
        };
    }
};

/// Result for `eth_getLogs`
pub const Result = struct {
    /// Array of log entries matching the filter
    logs: []const types.LogEntry,

    pub fn jsonStringify(self: Result, jws: *std.json.Stringify) !void {
        try jws.write(self.logs);
    }

    pub fn jsonParseFromValue(allocator: std.mem.Allocator, source: std.json.Value, options: std.json.ParseOptions) !Result {
        return Result{
            .logs = try std.json.innerParseFromValue([]const types.LogEntry, allocator, source, options),
        };
    }
};
