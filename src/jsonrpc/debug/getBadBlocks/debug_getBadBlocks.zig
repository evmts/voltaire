const std = @import("std");
const types = @import("../../types.zig");

/// Returns an array of recent bad blocks that the client has seen on the network.
///
/// Example:
/// Result: ...
///
/// Implements the `debug_getBadBlocks` JSON-RPC method.
pub const DebugGetBadBlocks = @This();

/// The JSON-RPC method name
pub const method = "debug_getBadBlocks";

/// Parameters for `debug_getBadBlocks`
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

/// Result for `debug_getBadBlocks`
pub const Result = struct {
    /// Bad block array
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
