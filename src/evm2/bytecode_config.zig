const std = @import("std");
const builtin = @import("builtin");

/// Configure Bytecode validation
pub const BytecodeConfig = struct {
    // https://ziglang.org/documentation/master/#toc-This
    const Self = @This();
    /// The maximum amount of bytes allowed in contract code
    max_bytecode_size: u32 = 24576,
    // @see https://ziglang.org/documentation/master/std/#std.simd.suggestVectorLengthForCpu
    /// How big of a vector length to use for simd operations. 0 if simd should not be used
    vector_length: comptime_int = std.simd.suggestVectorLengthForCpu(u8, builtin.cpu) orelse 0,
    /// PcType: chosen PC integer type from max_bytecode_size
    pub fn PcType(comptime self: Self) type {
        // https://ziglang.org/documentation/master/std/#std.math.maxInt
        // std.math.maxInt returns the maximum value for the given integer type
        return if (self.max_bytecode_size <= std.math.maxInt(u8))
            u8
        else if (self.max_bytecode_size <= std.math.maxInt(u12))
            u12
        else if (self.max_bytecode_size <= std.math.maxInt(u16))
            u16
        else if (self.max_bytecode_size <= std.math.maxInt(u32))
            u32
        else
            // https://ziglang.org/documentation/master/#compileError
            @compileError("Bytecode size too large! It must have under u32 bytes");
    }
    /// Validate the configuration at compile time
    pub fn validate(comptime self: Self) void {
        _ = self.PcType(); // Ensure PcType is valid
        if (self.max_bytecode_size == 0) {
            @compileError("max_bytecode_size must be greater than 0");
        }
        if (self.max_bytecode_size > std.math.maxInt(u16)) {
            @compileError("max_bytecode_size too large. Currently only u16 is tested and officially supported");
        }
    }
};
