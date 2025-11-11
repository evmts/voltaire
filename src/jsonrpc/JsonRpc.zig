const std = @import("std");

const engineMethods = @import("engine/methods.zig");
const ethMethods = @import("eth/methods.zig");
const debugMethods = @import("debug/methods.zig");

// Export primitive types separately
pub const types = @import("types.zig");

/// Root JSON-RPC method union combining all namespaces
pub const JsonRpcMethod = union(enum) {
    engine: engineMethods.EngineMethod,
    eth: ethMethods.EthMethod,
    debug: debugMethods.DebugMethod,

    /// Get the full method name string
    pub fn methodName(self: JsonRpcMethod) []const u8 {
        return switch (self) {
            .engine => |m| m.methodName(),
            .eth => |m| m.methodName(),
            .debug => |m| m.methodName(),
        };
    }
};
