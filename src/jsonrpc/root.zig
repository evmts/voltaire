/// JSON-RPC Module - Ethereum JSON-RPC Type System
///
/// Type-safe Ethereum JSON-RPC method definitions generated from the official OpenRPC specification.
/// Provides complete type coverage for eth, debug, and engine namespaces (65 methods total).
///
/// Generated from: https://github.com/ethereum/execution-apis

const std = @import("std");

// Re-export the root JSON-RPC union and all namespace methods
pub const JsonRpc = @import("JsonRpc.zig");

// Export namespace-specific methods for modular access
pub const eth = @import("eth/methods.zig");
pub const debug = @import("debug/methods.zig");
pub const engine = @import("engine/methods.zig");

// Export shared types
pub const types = @import("types.zig");

// Convenience re-exports from JsonRpc
pub const JsonRpcMethod = JsonRpc.JsonRpcMethod;

test {
    std.testing.refAllDecls(@This());
}
