const std = @import("std");
const types = @import("../../types.zig");

/// Obtains execution payload from payload build process
///
/// Example:
/// Payload id: "0x0000000038fa5dd"
/// Result: ...
///
/// Implements the `engine_getPayloadV4` JSON-RPC method.
pub const EngineGetPayloadV4 = @This();

/// The JSON-RPC method name
pub const method = "engine_getPayloadV4";

/// Parameters for `engine_getPayloadV4`
pub const Params = struct {
    /// 8 hex encoded bytes
    payload id: types.Quantity,

    pub fn jsonStringify(self: Params, jws: *std.json.Stringify) !void {
        try jws.beginArray();
        try jws.write(self.payload id);
        try jws.endArray();
    }

    pub fn jsonParseFromValue(allocator: std.mem.Allocator, source: std.json.Value, options: std.json.ParseOptions) !Params {
        if (source != .array) return error.UnexpectedToken;
        if (source.array.items.len != 1) return error.InvalidParamCount;

        return Params{
            .payload id = try std.json.innerParseFromValue(types.Quantity, allocator, source.array.items[0], options),
        };
    }
};

/// Result for `engine_getPayloadV4`
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
