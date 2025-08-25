const std = @import("std");

/// Comptime Configuration for the plan.
pub const PlanConfig = struct {
    /// Word type for the EVM (typically u256).
    WordType: type = u256,
    /// Maximum bytecode size (determines PcType).
    /// May exceed 65535 to allow `PcType` to widen to u32.
    maxBytecodeSize: u32 = 24_576,
    /// Validate configuration at compile time.
    pub fn validate(comptime self: @This()) void {
        if (@bitSizeOf(self.WordType) > 512) @compileError("WordType cannot exceed u512");
        // Allow up to u32::max so PcType can widen to u32 when needed.
        if (self.maxBytecodeSize > std.math.maxInt(u32)) @compileError("maxBytecodeSize must be <= u32::max");
        if (self.maxBytecodeSize == 0) @compileError("maxBytecodeSize must be greater than 0");
    }
    /// Derived PC type based on max bytecode size.
    pub fn PcType(comptime self: @This()) type {
        return if (self.maxBytecodeSize <= std.math.maxInt(u16)) u16 else u32;
    }
};
