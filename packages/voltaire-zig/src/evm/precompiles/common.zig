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
    /// KZG trusted setup is not loaded: a node configuration error, not a bad
    /// proof. Kept distinct from InvalidInput so callers do not report it as
    /// an exceptional halt caused by the transaction.
    TrustedSetupNotLoaded,
    // Keccak errors (from keccak_asm)
    ExecutionError,
    StateError,
    MemoryError,
    InvalidOutputSize,
    Unknown,
} || std.mem.Allocator.Error;
