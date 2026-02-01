const std = @import("std");
const types = @import("../../types.zig");

/// Exchanges transition configuration
///
/// Example:
/// Consensus client configuration: ...
/// Result: ...
///
/// Implements the `engine_exchangeTransitionConfigurationV1` JSON-RPC method.
pub const EngineExchangeTransitionConfigurationV1 = @This();

/// The JSON-RPC method name
pub const method = "engine_exchangeTransitionConfigurationV1";

/// Parameters for `engine_exchangeTransitionConfigurationV1`
pub const Params = struct {
    /// Transition configuration object
    consensus_client_configuration: types.Quantity,

    pub fn jsonStringify(self: Params, jws: *std.json.Stringify) !void {
        try jws.beginArray();
        try jws.write(self.consensus_client_configuration);
        try jws.endArray();
    }

    pub fn jsonParseFromValue(allocator: std.mem.Allocator, source: std.json.Value, options: std.json.ParseOptions) !Params {
        if (source != .array) return error.UnexpectedToken;
        if (source.array.items.len != 1) return error.InvalidParamCount;

        return Params{
            .consensus_client_configuration = try std.json.innerParseFromValue(types.Quantity, allocator, source.array.items[0], options),
        };
    }
};

/// Result for `engine_exchangeTransitionConfigurationV1`
pub const Result = struct {
    /// Transition configuration object
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
