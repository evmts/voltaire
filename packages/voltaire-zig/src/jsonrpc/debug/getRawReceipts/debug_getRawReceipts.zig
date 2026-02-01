const std = @import("std");
const types = @import("../../types.zig");

/// Returns an array of EIP-2718 binary-encoded receipts.
///
/// Example:
/// Block: "0x32026E"
/// Result: ...
///
/// Implements the `debug_getRawReceipts` JSON-RPC method.
pub const DebugGetRawReceipts = @This();

/// The JSON-RPC method name
pub const method = "debug_getRawReceipts";

/// Parameters for `debug_getRawReceipts`
pub const Params = struct {
    /// Block number or tag
    block: types.Quantity,

    pub fn jsonStringify(self: Params, jws: *std.json.Stringify) !void {
        try jws.beginArray();
        try jws.write(self.block);
        try jws.endArray();
    }

    pub fn jsonParseFromValue(allocator: std.mem.Allocator, source: std.json.Value, options: std.json.ParseOptions) !Params {
        if (source != .array) return error.UnexpectedToken;
        if (source.array.items.len != 1) return error.InvalidParamCount;

        return Params{
            .block = try std.json.innerParseFromValue(types.Quantity, allocator, source.array.items[0], options),
        };
    }
};

/// Result for `debug_getRawReceipts`
pub const Result = struct {
    /// Receipt array
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
