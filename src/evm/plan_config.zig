const std = @import("std");

/// Comptime Configuration for the plan.
pub const PlanConfig = struct {
    /// Word type for the EVM (typically u256).
    WordType: type = u256,
    /// Maximum bytecode size (determines PcType).
    maxBytecodeSize: u32 = 24_576,
    /// Validate configuration at compile time.
    pub fn validate(comptime self: @This()) void {
        if (@bitSizeOf(self.WordType) > 512) @compileError("WordType cannot exceed u512");
        if (self.maxBytecodeSize > 65535) @compileError("maxBytecodeSize must be <= 65535");
        if (self.maxBytecodeSize == 0) @compileError("maxBytecodeSize must be greater than 0");
    }
    /// Derived PC type based on max bytecode size.
    pub fn PcType(comptime self: @This()) type {
        return if (self.maxBytecodeSize <= std.math.maxInt(u16)) u16 else u32;
    }
};
