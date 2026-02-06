const std = @import("std");
const types = @import("../../types.zig");

/// Given a range of block numbers returns bodies of the corresponding execution payloads
///
/// Example:
/// Starting block number: "0x20"
/// Number of blocks to return: "0x2"
/// Result: ...
///
/// Implements the `engine_getPayloadBodiesByRangeV1` JSON-RPC method.
pub const EngineGetPayloadBodiesByRangeV1 = @This();

/// The JSON-RPC method name
pub const method = "engine_getPayloadBodiesByRangeV1";

/// Parameters for `engine_getPayloadBodiesByRangeV1`
pub const Params = struct {
    /// hex encoded 64 bit unsigned integer
    starting_block_number: types.Quantity,
    /// hex encoded 64 bit unsigned integer
    number_of_blocks_to_return: types.Quantity,

    pub fn jsonStringify(self: Params, jws: *std.json.Stringify) !void {
        try jws.beginArray();
        try jws.write(self.starting_block_number);
        try jws.write(self.number_of_blocks_to_return);
        try jws.endArray();
    }

    pub fn jsonParseFromValue(allocator: std.mem.Allocator, source: std.json.Value, options: std.json.ParseOptions) !Params {
        if (source != .array) return error.UnexpectedToken;
        if (source.array.items.len != 2) return error.InvalidParamCount;

        return Params{
            .starting_block_number = try std.json.innerParseFromValue(types.Quantity, allocator, source.array.items[0], options),
            .number_of_blocks_to_return = try std.json.innerParseFromValue(types.Quantity, allocator, source.array.items[1], options),
        };
    }
};

/// Result for `engine_getPayloadBodiesByRangeV1`
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
