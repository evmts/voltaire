const std = @import("std");

/// Precompile result
pub const PrecompileResult = struct {
    output: []u8,
    gas_used: u64,

    pub fn deinit(self: PrecompileResult, allocator: std.mem.Allocator) void {
        allocator.free(self.output);
    }
};

/// Precompile error types
pub const PrecompileError = error{
    InvalidInput,
    InvalidSignature,
    InvalidPoint,
    InvalidPairing,
    OutOfGas,
    NotImplemented,
} || std.mem.Allocator.Error;
