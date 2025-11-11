const std = @import("std");
const types = @import("../../types.zig");

/// Updates the forkchoice state
///
/// Example:
/// Forkchoice state: ...
/// Payload attributes: ...
/// Result: ...
///
/// Implements the `engine_forkchoiceUpdatedV2` JSON-RPC method.
pub const EngineForkchoiceUpdatedV2 = @This();

/// The JSON-RPC method name
pub const method = "engine_forkchoiceUpdatedV2";

/// Parameters for `engine_forkchoiceUpdatedV2`
pub const Params = struct {
    /// Forkchoice state object V1
    forkchoice state: types.Quantity,
    /// Payload attributes object V2
    payload attributes: types.Quantity,

    pub fn jsonStringify(self: Params, jws: *std.json.Stringify) !void {
        try jws.beginArray();
        try jws.write(self.forkchoice state);
        try jws.write(self.payload attributes);
        try jws.endArray();
    }

    pub fn jsonParseFromValue(allocator: std.mem.Allocator, source: std.json.Value, options: std.json.ParseOptions) !Params {
        if (source != .array) return error.UnexpectedToken;
        if (source.array.items.len != 2) return error.InvalidParamCount;

        return Params{
            .forkchoice state = try std.json.innerParseFromValue(types.Quantity, allocator, source.array.items[0], options),
            .payload attributes = try std.json.innerParseFromValue(types.Quantity, allocator, source.array.items[1], options),
        };
    }
};

/// Result for `engine_forkchoiceUpdatedV2`
pub const Result = struct {
    /// Forkchoice updated response
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
