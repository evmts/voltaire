const std = @import("std");
const types = @import("../../types.zig");

/// Runs execution payload validation
///
/// Example:
/// Execution payload: ...
/// Expected blob versioned hashes: ...
/// Root of the parent beacon block: "0x169630f535b4a41330164c6e5c92b1224c0c407f582d407d0ac3d206cd32fd52"
/// Execution requests: ...
/// Result: ...
///
/// Implements the `engine_newPayloadV4` JSON-RPC method.
pub const EngineNewPayloadV4 = @This();

/// The JSON-RPC method name
pub const method = "engine_newPayloadV4";

/// Parameters for `engine_newPayloadV4`
pub const Params = struct {
    /// Execution payload object V3
    execution_payload: types.Quantity,
    expected_blob_versioned_hashes: types.Quantity,
    /// 32 byte hex value
    root_of_the_parent_beacon_block: types.Hash,
    execution_requests: types.Quantity,

    pub fn jsonStringify(self: Params, jws: *std.json.Stringify) !void {
        try jws.beginArray();
        try jws.write(self.execution_payload);
        try jws.write(self.expected_blob_versioned_hashes);
        try jws.write(self.root_of_the_parent_beacon_block);
        try jws.write(self.execution_requests);
        try jws.endArray();
    }

    pub fn jsonParseFromValue(allocator: std.mem.Allocator, source: std.json.Value, options: std.json.ParseOptions) !Params {
        if (source != .array) return error.UnexpectedToken;
        if (source.array.items.len != 4) return error.InvalidParamCount;

        return Params{
            .execution_payload = try std.json.innerParseFromValue(types.Quantity, allocator, source.array.items[0], options),
            .expected_blob_versioned_hashes = try std.json.innerParseFromValue(types.Quantity, allocator, source.array.items[1], options),
            .root_of_the_parent_beacon_block = try std.json.innerParseFromValue(types.Hash, allocator, source.array.items[2], options),
            .execution_requests = try std.json.innerParseFromValue(types.Quantity, allocator, source.array.items[3], options),
        };
    }
};

/// Result for `engine_newPayloadV4`
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
