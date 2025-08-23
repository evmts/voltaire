const std = @import("std");

pub const MemoryConfig = struct {
    const Self = @This();
    
    // The initial capacity for memory allocation
    initial_capacity: usize = 4096,
    // The maximum memory limit
    memory_limit: u64 = 0xFFFFFF,
    
    pub fn validate(comptime self: Self) void {
        if (self.memory_limit > std.math.maxInt(u32)) @compileError("memory_limit cannot exceed u32 max");
        if (self.initial_capacity > self.memory_limit) @compileError("initial_capacity cannot exceed memory_limit");
    }
};