const std = @import("std");
const ArrayList = std.ArrayListAligned;
const Opcode = @import("opcode.zig").Opcode;
const BytecodeConfig = @import("bytecode_config.zig").BytecodeConfig;

/// User owned struct used for introspection and debugging
pub const BytecodeStats = struct {
    pub const Fusion = struct {
        pc: usize,
        second_opcode: Opcode,
    };
    
    pub const Jump = struct {
        pc: usize,
        target: u256,
    };
    
    pub const PushValue = struct {
        pc: usize,
        value: u256,
    };
    
    opcode_counts: [256]u32,
    push_values: []const PushValue,
    potential_fusions: []const Fusion,
    jumpdests: []const usize,
    jumps: []const Jump,
    backwards_jumps: usize,
    is_create_code: bool,
    
    pub fn formatStats(self: BytecodeStats, allocator: std.mem.Allocator) ![]const u8 {
        // https://ziglang.org/documentation/master/std/#std.array_list.Aligned
        var list = ArrayList(u8, null).init(allocator);
        errdefer list.deinit();
        const writer = list.writer();
        
        try writer.writeAll("\n=== Bytecode Statistics ===\n");
        try writer.writeAll("Opcode counts:\n");
        var total_opcodes: u32 = 0;
        for (self.opcode_counts, 0..) |count, op| {
            if (count > 0) {
                // https://ziglang.org/documentation/master/std/#std.meta.intToEnum
                // Converts an integer to an enum value, returns error if invalid
                const opcode_enum = std.meta.intToEnum(Opcode, op) catch {
                    try writer.print("  UNKNOWN(0x{x:0>2}): {}\n", .{ op, count });
                    continue;
                };
                // https://ziglang.org/documentation/master/#tagName
                // @tagName returns the string representation of an enum value
                try writer.print("  {s}: {}\n", .{ @tagName(opcode_enum), count });
                total_opcodes += count;
            }
        }
        try writer.print("Total opcodes: {}\n\n", .{total_opcodes});
        if (self.push_values.len > 0) {
            try writer.print("Push values ({} total):\n", .{self.push_values.len});
            for (self.push_values) |pv| {
                try writer.print("  PC {}: 0x{x}\n", .{ pv.pc, pv.value });
            }
            try writer.writeAll("\n");
        }
        if (self.potential_fusions.len > 0) {
            try writer.print("Potential fusions ({} total):\n", .{self.potential_fusions.len});
            for (self.potential_fusions) |fusion| {
                try writer.print("  PC {}: PUSH + {s}\n", .{ fusion.pc, @tagName(fusion.second_opcode) });
            }
            try writer.writeAll("\n");
        }
        if (self.jumpdests.len > 0) {
            try writer.print("Jump destinations ({} total):\n", .{self.jumpdests.len});
            for (self.jumpdests) |dest| {
                try writer.print("  PC {}\n", .{dest});
            }
            try writer.writeAll("\n");
        }
        if (self.jumps.len > 0) {
            try writer.print("Jumps ({} total, {} backwards):\n", .{ self.jumps.len, self.backwards_jumps });
            for (self.jumps) |jump| {
                const direction = if (jump.target < jump.pc) "↑" else "↓";
                try writer.print("  PC {} {} target 0x{x}\n", .{ jump.pc, direction, jump.target });
            }
            try writer.writeAll("\n");
        }
        try writer.print("Contract type: {s}\n", .{if (self.is_create_code) "Create/Deploy code" else "Runtime code"});
        try writer.writeAll("======================\n");
        
        return list.toOwnedSlice();
    }
};

