const std = @import("std");

pub const BytecodeConfig = struct {
    const Self = @This();
    
    /// The maximum amount of bytes allowed in contract code
    max_bytecode_size: u32 = 24576,
    
    /// PcType: chosen PC integer type from max_bytecode_size
    pub fn PcType(comptime self: Self) type {
        return if (self.max_bytecode_size <= std.math.maxInt(u8))
            u8
        else if (self.max_bytecode_size <= std.math.maxInt(u12))
            u12
        else if (self.max_bytecode_size <= std.math.maxInt(u16))
            u16
        else if (self.max_bytecode_size <= std.math.maxInt(u32))
            u32
        else
            @compileError("Bytecode size too large! It must have under u32 bytes");
    }
    
    /// Validate the configuration at compile time
    pub fn validate(comptime self: Self) void {
        _ = self.PcType(); // Ensure PcType is valid
        if (self.max_bytecode_size == 0) {
            @compileError("max_bytecode_size must be greater than 0");
        }
    }
};