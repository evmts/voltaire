const std = @import("std");
const types = @import("../../types.zig");

/// Returns an object with data about the sync status or false.
///
/// Example:
/// Result: ...
///
/// Implements the `eth_syncing` JSON-RPC method.
pub const EthSyncing = @This();

/// The JSON-RPC method name
pub const method = "eth_syncing";

/// Parameters for `eth_syncing`
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

/// Result for `eth_syncing`
pub const Result = struct {
    /// Syncing status
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
