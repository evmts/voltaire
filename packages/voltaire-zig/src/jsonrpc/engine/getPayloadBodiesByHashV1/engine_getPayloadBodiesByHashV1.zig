const std = @import("std");
const types = @import("../../types.zig");

/// Given block hashes returns bodies of the corresponding execution payloads
///
/// Example:
/// Array of block hashes: ...
/// Result: ...
///
/// Implements the `engine_getPayloadBodiesByHashV1` JSON-RPC method.
pub const EngineGetPayloadBodiesByHashV1 = @This();

/// The JSON-RPC method name
pub const method = "engine_getPayloadBodiesByHashV1";

/// Parameters for `engine_getPayloadBodiesByHashV1`
pub const Params = struct {
    array_of_block_hashes: types.Quantity,

    pub fn jsonStringify(self: Params, jws: *std.json.Stringify) !void {
        try jws.beginArray();
        try jws.write(self.array_of_block_hashes);
        try jws.endArray();
    }

    pub fn jsonParseFromValue(allocator: std.mem.Allocator, source: std.json.Value, options: std.json.ParseOptions) !Params {
        if (source != .array) return error.UnexpectedToken;
        if (source.array.items.len != 1) return error.InvalidParamCount;

        return Params{
            .array_of_block_hashes = try std.json.innerParseFromValue(types.Quantity, allocator, source.array.items[0], options),
        };
    }
};

/// Result for `engine_getPayloadBodiesByHashV1`
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
