const std = @import("std");
const types = @import("../../types.zig");

/// Runs execution payload validation
///
/// Example:
/// Execution payload: ...
/// Result: ...
///
/// Implements the `engine_newPayloadV2` JSON-RPC method.
pub const EngineNewPayloadV2 = @This();

/// The JSON-RPC method name
pub const method = "engine_newPayloadV2";

/// Parameters for `engine_newPayloadV2`
pub const Params = struct {
    execution payload: types.Quantity,

    pub fn jsonStringify(self: Params, jws: *std.json.Stringify) !void {
        try jws.beginArray();
        try jws.write(self.execution payload);
        try jws.endArray();
    }

    pub fn jsonParseFromValue(allocator: std.mem.Allocator, source: std.json.Value, options: std.json.ParseOptions) !Params {
        if (source != .array) return error.UnexpectedToken;
        if (source.array.items.len != 1) return error.InvalidParamCount;

        return Params{
            .execution payload = try std.json.innerParseFromValue(types.Quantity, allocator, source.array.items[0], options),
        };
    }
};

/// Result for `engine_newPayloadV2`
pub const Result = struct {
    /// Payload status object deprecating INVALID_BLOCK_HASH status
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
