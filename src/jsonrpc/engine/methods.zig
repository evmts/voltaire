const std = @import("std");

// Import all engine method modules
const engine_exchangeCapabilities = @import("exchangeCapabilities/engine_exchangeCapabilities.zig");
const engine_exchangeTransitionConfigurationV1 = @import("exchangeTransitionConfigurationV1/engine_exchangeTransitionConfigurationV1.zig");
const engine_forkchoiceUpdatedV1 = @import("forkchoiceUpdatedV1/engine_forkchoiceUpdatedV1.zig");
const engine_forkchoiceUpdatedV2 = @import("forkchoiceUpdatedV2/engine_forkchoiceUpdatedV2.zig");
const engine_forkchoiceUpdatedV3 = @import("forkchoiceUpdatedV3/engine_forkchoiceUpdatedV3.zig");
const engine_getBlobsV1 = @import("getBlobsV1/engine_getBlobsV1.zig");
const engine_getBlobsV2 = @import("getBlobsV2/engine_getBlobsV2.zig");
const engine_getPayloadBodiesByHashV1 = @import("getPayloadBodiesByHashV1/engine_getPayloadBodiesByHashV1.zig");
const engine_getPayloadBodiesByRangeV1 = @import("getPayloadBodiesByRangeV1/engine_getPayloadBodiesByRangeV1.zig");
const engine_getPayloadV1 = @import("getPayloadV1/engine_getPayloadV1.zig");
const engine_getPayloadV2 = @import("getPayloadV2/engine_getPayloadV2.zig");
const engine_getPayloadV3 = @import("getPayloadV3/engine_getPayloadV3.zig");
const engine_getPayloadV4 = @import("getPayloadV4/engine_getPayloadV4.zig");
const engine_getPayloadV5 = @import("getPayloadV5/engine_getPayloadV5.zig");
const engine_getPayloadV6 = @import("getPayloadV6/engine_getPayloadV6.zig");
const engine_newPayloadV1 = @import("newPayloadV1/engine_newPayloadV1.zig");
const engine_newPayloadV2 = @import("newPayloadV2/engine_newPayloadV2.zig");
const engine_newPayloadV3 = @import("newPayloadV3/engine_newPayloadV3.zig");
const engine_newPayloadV4 = @import("newPayloadV4/engine_newPayloadV4.zig");
const engine_newPayloadV5 = @import("newPayloadV5/engine_newPayloadV5.zig");

/// Tagged union of all engine namespace methods
/// Maps method names to their corresponding parameter and result types
pub const EngineMethod = union(enum) {
    engine_exchangeCapabilities: struct {
        params: engine_exchangeCapabilities.Params,
        result: engine_exchangeCapabilities.Result,
    },
    engine_exchangeTransitionConfigurationV1: struct {
        params: engine_exchangeTransitionConfigurationV1.Params,
        result: engine_exchangeTransitionConfigurationV1.Result,
    },
    engine_forkchoiceUpdatedV1: struct {
        params: engine_forkchoiceUpdatedV1.Params,
        result: engine_forkchoiceUpdatedV1.Result,
    },
    engine_forkchoiceUpdatedV2: struct {
        params: engine_forkchoiceUpdatedV2.Params,
        result: engine_forkchoiceUpdatedV2.Result,
    },
    engine_forkchoiceUpdatedV3: struct {
        params: engine_forkchoiceUpdatedV3.Params,
        result: engine_forkchoiceUpdatedV3.Result,
    },
    engine_getBlobsV1: struct {
        params: engine_getBlobsV1.Params,
        result: engine_getBlobsV1.Result,
    },
    engine_getBlobsV2: struct {
        params: engine_getBlobsV2.Params,
        result: engine_getBlobsV2.Result,
    },
    engine_getPayloadBodiesByHashV1: struct {
        params: engine_getPayloadBodiesByHashV1.Params,
        result: engine_getPayloadBodiesByHashV1.Result,
    },
    engine_getPayloadBodiesByRangeV1: struct {
        params: engine_getPayloadBodiesByRangeV1.Params,
        result: engine_getPayloadBodiesByRangeV1.Result,
    },
    engine_getPayloadV1: struct {
        params: engine_getPayloadV1.Params,
        result: engine_getPayloadV1.Result,
    },
    engine_getPayloadV2: struct {
        params: engine_getPayloadV2.Params,
        result: engine_getPayloadV2.Result,
    },
    engine_getPayloadV3: struct {
        params: engine_getPayloadV3.Params,
        result: engine_getPayloadV3.Result,
    },
    engine_getPayloadV4: struct {
        params: engine_getPayloadV4.Params,
        result: engine_getPayloadV4.Result,
    },
    engine_getPayloadV5: struct {
        params: engine_getPayloadV5.Params,
        result: engine_getPayloadV5.Result,
    },
    engine_getPayloadV6: struct {
        params: engine_getPayloadV6.Params,
        result: engine_getPayloadV6.Result,
    },
    engine_newPayloadV1: struct {
        params: engine_newPayloadV1.Params,
        result: engine_newPayloadV1.Result,
    },
    engine_newPayloadV2: struct {
        params: engine_newPayloadV2.Params,
        result: engine_newPayloadV2.Result,
    },
    engine_newPayloadV3: struct {
        params: engine_newPayloadV3.Params,
        result: engine_newPayloadV3.Result,
    },
    engine_newPayloadV4: struct {
        params: engine_newPayloadV4.Params,
        result: engine_newPayloadV4.Result,
    },
    engine_newPayloadV5: struct {
        params: engine_newPayloadV5.Params,
        result: engine_newPayloadV5.Result,
    },

    /// Get the method name string from the union tag
    pub fn methodName(self: EngineMethod) []const u8 {
        return switch (self) {
            .engine_exchangeCapabilities => engine_exchangeCapabilities.method,
            .engine_exchangeTransitionConfigurationV1 => engine_exchangeTransitionConfigurationV1.method,
            .engine_forkchoiceUpdatedV1 => engine_forkchoiceUpdatedV1.method,
            .engine_forkchoiceUpdatedV2 => engine_forkchoiceUpdatedV2.method,
            .engine_forkchoiceUpdatedV3 => engine_forkchoiceUpdatedV3.method,
            .engine_getBlobsV1 => engine_getBlobsV1.method,
            .engine_getBlobsV2 => engine_getBlobsV2.method,
            .engine_getPayloadBodiesByHashV1 => engine_getPayloadBodiesByHashV1.method,
            .engine_getPayloadBodiesByRangeV1 => engine_getPayloadBodiesByRangeV1.method,
            .engine_getPayloadV1 => engine_getPayloadV1.method,
            .engine_getPayloadV2 => engine_getPayloadV2.method,
            .engine_getPayloadV3 => engine_getPayloadV3.method,
            .engine_getPayloadV4 => engine_getPayloadV4.method,
            .engine_getPayloadV5 => engine_getPayloadV5.method,
            .engine_getPayloadV6 => engine_getPayloadV6.method,
            .engine_newPayloadV1 => engine_newPayloadV1.method,
            .engine_newPayloadV2 => engine_newPayloadV2.method,
            .engine_newPayloadV3 => engine_newPayloadV3.method,
            .engine_newPayloadV4 => engine_newPayloadV4.method,
            .engine_newPayloadV5 => engine_newPayloadV5.method,
        };
    }

    /// Parse method name string to enum tag
    pub fn fromMethodName(method_name: []const u8) !std.meta.Tag(EngineMethod) {
        const map = std.StaticStringMap(std.meta.Tag(EngineMethod)).initComptime(.{
            .{ "engine_exchangeCapabilities", .engine_exchangeCapabilities },
            .{ "engine_exchangeTransitionConfigurationV1", .engine_exchangeTransitionConfigurationV1 },
            .{ "engine_forkchoiceUpdatedV1", .engine_forkchoiceUpdatedV1 },
            .{ "engine_forkchoiceUpdatedV2", .engine_forkchoiceUpdatedV2 },
            .{ "engine_forkchoiceUpdatedV3", .engine_forkchoiceUpdatedV3 },
            .{ "engine_getBlobsV1", .engine_getBlobsV1 },
            .{ "engine_getBlobsV2", .engine_getBlobsV2 },
            .{ "engine_getPayloadBodiesByHashV1", .engine_getPayloadBodiesByHashV1 },
            .{ "engine_getPayloadBodiesByRangeV1", .engine_getPayloadBodiesByRangeV1 },
            .{ "engine_getPayloadV1", .engine_getPayloadV1 },
            .{ "engine_getPayloadV2", .engine_getPayloadV2 },
            .{ "engine_getPayloadV3", .engine_getPayloadV3 },
            .{ "engine_getPayloadV4", .engine_getPayloadV4 },
            .{ "engine_getPayloadV5", .engine_getPayloadV5 },
            .{ "engine_getPayloadV6", .engine_getPayloadV6 },
            .{ "engine_newPayloadV1", .engine_newPayloadV1 },
            .{ "engine_newPayloadV2", .engine_newPayloadV2 },
            .{ "engine_newPayloadV3", .engine_newPayloadV3 },
            .{ "engine_newPayloadV4", .engine_newPayloadV4 },
            .{ "engine_newPayloadV5", .engine_newPayloadV5 },
        });

        return map.get(method_name) orelse error.UnknownMethod;
    }
};
