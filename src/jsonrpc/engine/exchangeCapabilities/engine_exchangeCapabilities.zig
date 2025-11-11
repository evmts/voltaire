const std = @import("std");
const types = @import("../../types.zig");

/// Exchanges list of supported Engine API methods
///
/// Example:
/// Consensus client methods: ...
/// Result: ...
///
/// Implements the `engine_exchangeCapabilities` JSON-RPC method.
pub const EngineExchangeCapabilities = @This();

/// The JSON-RPC method name
pub const method = "engine_exchangeCapabilities";

/// Parameters for `engine_exchangeCapabilities`
pub const Params = struct {
    consensus client methods: types.Quantity,

    pub fn jsonStringify(self: Params, jws: *std.json.Stringify) !void {
        try jws.beginArray();
        try jws.write(self.consensus client methods);
        try jws.endArray();
    }

    pub fn jsonParseFromValue(allocator: std.mem.Allocator, source: std.json.Value, options: std.json.ParseOptions) !Params {
        if (source != .array) return error.UnexpectedToken;
        if (source.array.items.len != 1) return error.InvalidParamCount;

        return Params{
            .consensus client methods = try std.json.innerParseFromValue(types.Quantity, allocator, source.array.items[0], options),
        };
    }
};

/// Result for `engine_exchangeCapabilities`
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
