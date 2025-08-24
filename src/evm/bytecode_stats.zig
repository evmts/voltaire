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
    
    /// Analyze bytecode and return statistics
    pub fn analyze(allocator: std.mem.Allocator, bytecode: []const u8) !BytecodeStats {
        var opcode_counts = [_]u32{0} ** 256;
        var push_values = std.ArrayList(PushValue).init(allocator);
        errdefer push_values.deinit();
        var potential_fusions = std.ArrayList(Fusion).init(allocator);
        errdefer potential_fusions.deinit();
        var jumpdests = std.ArrayList(usize).init(allocator);
        errdefer jumpdests.deinit();
        var jumps = std.ArrayList(Jump).init(allocator);
        errdefer jumps.deinit();
        var backwards_jumps: usize = 0;
        
        var pc: usize = 0;
        while (pc < bytecode.len) {
            const opcode_byte = bytecode[pc];
            opcode_counts[opcode_byte] += 1;
            
            const opcode = std.meta.intToEnum(Opcode, opcode_byte) catch {
                // Invalid opcode
                pc += 1;
                continue;
            };
            
            // Track JUMPDEST locations
            if (opcode == .JUMPDEST) {
                try jumpdests.append(pc);
            }
            
            // Check for PUSH opcodes
            if (@intFromEnum(opcode) >= @intFromEnum(Opcode.PUSH1) and 
                @intFromEnum(opcode) <= @intFromEnum(Opcode.PUSH32)) {
                const push_size = @intFromEnum(opcode) - @intFromEnum(Opcode.PUSH1) + 1;
                
                if (pc + push_size < bytecode.len) {
                    // Extract push value
                    var value: u256 = 0;
                    for (1..push_size + 1) |i| {
                        if (pc + i < bytecode.len) {
                            value = (value << 8) | bytecode[pc + i];
                        }
                    }
                    try push_values.append(.{ .pc = pc, .value = value });
                    
                    // Check for potential fusion with next opcode
                    const next_pc = pc + 1 + push_size;
                    if (next_pc < bytecode.len) {
                        const next_opcode = std.meta.intToEnum(Opcode, bytecode[next_pc]) catch {
                            pc += 1 + push_size;
                            continue;
                        };
                        
                        // Common fusion patterns
                        switch (next_opcode) {
                            .ADD, .MUL, .SUB, .DIV, .JUMP, .JUMPI, .GT, .LT, .EQ => {
                                try potential_fusions.append(.{ .pc = pc, .second_opcode = next_opcode });
                            },
                            else => {},
                        }
                    }
                }
                
                pc += 1 + push_size;
            } else if (opcode == .JUMP or opcode == .JUMPI) {
                // For static analysis, we can only track JUMP after PUSH
                if (pc > 0) {
                    // Check if previous instruction was a PUSH
                    var push_pc = pc - 1;
                    var found_push = false;
                    var jump_target: u256 = 0;
                    
                    // Scan backwards for PUSH instruction
                    while (push_pc > 0 and pc - push_pc < 33) : (push_pc -= 1) {
                        const prev_opcode = std.meta.intToEnum(Opcode, bytecode[push_pc]) catch continue;
                        if (@intFromEnum(prev_opcode) >= @intFromEnum(Opcode.PUSH1) and 
                            @intFromEnum(prev_opcode) <= @intFromEnum(Opcode.PUSH32)) {
                            const push_size = @intFromEnum(prev_opcode) - @intFromEnum(Opcode.PUSH1) + 1;
                            if (push_pc + 1 + push_size == pc) {
                                // This PUSH feeds into our JUMP
                                jump_target = 0;
                                for (1..push_size + 1) |i| {
                                    if (push_pc + i < bytecode.len) {
                                        jump_target = (jump_target << 8) | bytecode[push_pc + i];
                                    }
                                }
                                found_push = true;
                                break;
                            }
                        }
                    }
                    
                    if (found_push) {
                        try jumps.append(.{ .pc = pc, .target = jump_target });
                        if (jump_target < pc) {
                            backwards_jumps += 1;
                        }
                    }
                }
                pc += 1;
            } else {
                pc += 1;
            }
        }
        
        return BytecodeStats{
            .opcode_counts = opcode_counts,
            .push_values = try push_values.toOwnedSlice(),
            .potential_fusions = try potential_fusions.toOwnedSlice(),
            .jumpdests = try jumpdests.toOwnedSlice(),
            .jumps = try jumps.toOwnedSlice(),
            .backwards_jumps = backwards_jumps,
            .is_create_code = false, // TODO: Detect create code patterns
        };
    }
    
    /// Deallocate statistics data
    pub fn deinit(self: *BytecodeStats, allocator: std.mem.Allocator) void {
        allocator.free(self.push_values);
        allocator.free(self.potential_fusions);
        allocator.free(self.jumpdests);
        allocator.free(self.jumps);
    }
    
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
                try writer.print("  PC {} {s} target 0x{x}\n", .{ jump.pc, direction, jump.target });
            }
            try writer.writeAll("\n");
        }
        try writer.print("Contract type: {s}\n", .{if (self.is_create_code) "Create/Deploy code" else "Runtime code"});
        try writer.writeAll("======================\n");
        
        return list.toOwnedSlice();
    }
};

test "BytecodeStats formatStats basic functionality" {
    const allocator = std.testing.allocator;
    
    // Create mock statistics data
    var opcode_counts = [_]u32{0} ** 256;
    opcode_counts[@intFromEnum(Opcode.PUSH1)] = 3;
    opcode_counts[@intFromEnum(Opcode.ADD)] = 2;
    opcode_counts[@intFromEnum(Opcode.STOP)] = 1;
    
    const push_values = [_]BytecodeStats.PushValue{
        .{ .pc = 0, .value = 0x42 },
        .{ .pc = 5, .value = 0x1337 },
    };
    
    const fusions = [_]BytecodeStats.Fusion{
        .{ .pc = 0, .second_opcode = Opcode.ADD },
        .{ .pc = 5, .second_opcode = Opcode.JUMP },
    };
    
    const jumpdests = [_]usize{ 10, 20, 30 };
    
    const jumps = [_]BytecodeStats.Jump{
        .{ .pc = 2, .target = 10 },
        .{ .pc = 7, .target = 20 },
    };
    
    const stats = BytecodeStats{
        .opcode_counts = opcode_counts,
        .push_values = &push_values,
        .potential_fusions = &fusions,
        .jumpdests = &jumpdests,
        .jumps = &jumps,
        .backwards_jumps = 0,
        .is_create_code = false,
    };
    
    const output = try stats.formatStats(allocator);
    defer allocator.free(output);
    
    // Verify key sections are present
    try std.testing.expect(std.mem.indexOf(u8, output, "=== Bytecode Statistics ===") != null);
    try std.testing.expect(std.mem.indexOf(u8, output, "Opcode counts:") != null);
    try std.testing.expect(std.mem.indexOf(u8, output, "PUSH1: 3") != null);
    try std.testing.expect(std.mem.indexOf(u8, output, "ADD: 2") != null);
    try std.testing.expect(std.mem.indexOf(u8, output, "STOP: 1") != null);
    try std.testing.expect(std.mem.indexOf(u8, output, "Total opcodes: 6") != null);
    
    // Verify push values section
    try std.testing.expect(std.mem.indexOf(u8, output, "Push values (2 total):") != null);
    try std.testing.expect(std.mem.indexOf(u8, output, "PC 0: 0x42") != null);
    try std.testing.expect(std.mem.indexOf(u8, output, "PC 5: 0x1337") != null);
    
    // Verify fusion section
    try std.testing.expect(std.mem.indexOf(u8, output, "Potential fusions (2 total):") != null);
    try std.testing.expect(std.mem.indexOf(u8, output, "PC 0: PUSH + ADD") != null);
    try std.testing.expect(std.mem.indexOf(u8, output, "PC 5: PUSH + JUMP") != null);
    
    // Verify jumpdests section
    try std.testing.expect(std.mem.indexOf(u8, output, "Jump destinations (3 total):") != null);
    try std.testing.expect(std.mem.indexOf(u8, output, "PC 10") != null);
    try std.testing.expect(std.mem.indexOf(u8, output, "PC 20") != null);
    try std.testing.expect(std.mem.indexOf(u8, output, "PC 30") != null);
    
    // Verify jumps section
    try std.testing.expect(std.mem.indexOf(u8, output, "Jumps (2 total, 0 backwards):") != null);
    try std.testing.expect(std.mem.indexOf(u8, output, "PC 2 ↓ target 0xa") != null);
    try std.testing.expect(std.mem.indexOf(u8, output, "PC 7 ↓ target 0x14") != null);
    
    // Verify contract type
    try std.testing.expect(std.mem.indexOf(u8, output, "Contract type: Runtime code") != null);
}

test "BytecodeStats formatStats empty statistics" {
    const allocator = std.testing.allocator;
    
    const opcode_counts = [_]u32{0} ** 256;
    const stats = BytecodeStats{
        .opcode_counts = opcode_counts,
        .push_values = &.{},
        .potential_fusions = &.{},
        .jumpdests = &.{},
        .jumps = &.{},
        .backwards_jumps = 0,
        .is_create_code = false,
    };
    
    const output = try stats.formatStats(allocator);
    defer allocator.free(output);
    
    // Should still have basic structure
    try std.testing.expect(std.mem.indexOf(u8, output, "=== Bytecode Statistics ===") != null);
    try std.testing.expect(std.mem.indexOf(u8, output, "Total opcodes: 0") != null);
    try std.testing.expect(std.mem.indexOf(u8, output, "Contract type: Runtime code") != null);
    
    // Should not have sections for empty data
    try std.testing.expect(std.mem.indexOf(u8, output, "Push values") == null);
    try std.testing.expect(std.mem.indexOf(u8, output, "Potential fusions") == null);
    try std.testing.expect(std.mem.indexOf(u8, output, "Jump destinations") == null);
    try std.testing.expect(std.mem.indexOf(u8, output, "Jumps") == null);
}

test "BytecodeStats formatStats create code detection" {
    const allocator = std.testing.allocator;
    
    var opcode_counts = [_]u32{0} ** 256;
    opcode_counts[@intFromEnum(Opcode.CODECOPY)] = 1;
    
    const stats = BytecodeStats{
        .opcode_counts = opcode_counts,
        .push_values = &.{},
        .potential_fusions = &.{},
        .jumpdests = &.{},
        .jumps = &.{},
        .backwards_jumps = 0,
        .is_create_code = true,
    };
    
    const output = try stats.formatStats(allocator);
    defer allocator.free(output);
    
    try std.testing.expect(std.mem.indexOf(u8, output, "Contract type: Create/Deploy code") != null);
    try std.testing.expect(std.mem.indexOf(u8, output, "CODECOPY: 1") != null);
}

test "BytecodeStats formatStats backwards jumps" {
    const allocator = std.testing.allocator;
    
    const opcode_counts = [_]u32{0} ** 256;
    const jumps = [_]BytecodeStats.Jump{
        .{ .pc = 10, .target = 5 },  // Backwards jump
        .{ .pc = 15, .target = 20 }, // Forward jump
        .{ .pc = 25, .target = 8 },  // Backwards jump
    };
    
    const stats = BytecodeStats{
        .opcode_counts = opcode_counts,
        .push_values = &.{},
        .potential_fusions = &.{},
        .jumpdests = &.{},
        .jumps = &jumps,
        .backwards_jumps = 2,
        .is_create_code = false,
    };
    
    const output = try stats.formatStats(allocator);
    defer allocator.free(output);
    
    // Verify backwards jump detection
    try std.testing.expect(std.mem.indexOf(u8, output, "Jumps (3 total, 2 backwards):") != null);
    try std.testing.expect(std.mem.indexOf(u8, output, "PC 10 ↑ target 0x5") != null);  // Backwards (↑)
    try std.testing.expect(std.mem.indexOf(u8, output, "PC 15 ↓ target 0x14") != null); // Forward (↓)
    try std.testing.expect(std.mem.indexOf(u8, output, "PC 25 ↑ target 0x8") != null);  // Backwards (↑)
}

test "BytecodeStats formatStats large values" {
    const allocator = std.testing.allocator;
    
    var opcode_counts = [_]u32{0} ** 256;
    opcode_counts[@intFromEnum(Opcode.PUSH32)] = 999999;
    
    const push_values = [_]BytecodeStats.PushValue{
        .{ .pc = 0, .value = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF }, // Max u256
    };
    
    const jumps = [_]BytecodeStats.Jump{
        .{ .pc = 100000, .target = 0xDEADBEEFCAFEBABE },
    };
    
    const stats = BytecodeStats{
        .opcode_counts = opcode_counts,
        .push_values = &push_values,
        .potential_fusions = &.{},
        .jumpdests = &.{},
        .jumps = &jumps,
        .backwards_jumps = 0,
        .is_create_code = false,
    };
    
    const output = try stats.formatStats(allocator);
    defer allocator.free(output);
    
    // Verify large numbers are formatted correctly
    try std.testing.expect(std.mem.indexOf(u8, output, "PUSH32: 999999") != null);
    try std.testing.expect(std.mem.indexOf(u8, output, "Total opcodes: 999999") != null);
    try std.testing.expect(std.mem.indexOf(u8, output, "PC 0: 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff") != null);
    try std.testing.expect(std.mem.indexOf(u8, output, "PC 100000 ↓ target 0xdeadbeefcafebabe") != null);
}

test "BytecodeStats formatStats all fusion types" {
    const allocator = std.testing.allocator;
    
    const opcode_counts = [_]u32{0} ** 256;
    const fusions = [_]BytecodeStats.Fusion{
        .{ .pc = 0, .second_opcode = Opcode.ADD },
        .{ .pc = 3, .second_opcode = Opcode.SUB },
        .{ .pc = 6, .second_opcode = Opcode.MUL },
        .{ .pc = 9, .second_opcode = Opcode.DIV },
        .{ .pc = 12, .second_opcode = Opcode.JUMP },
        .{ .pc = 15, .second_opcode = Opcode.JUMPI },
    };
    
    const stats = BytecodeStats{
        .opcode_counts = opcode_counts,
        .push_values = &.{},
        .potential_fusions = &fusions,
        .jumpdests = &.{},
        .jumps = &.{},
        .backwards_jumps = 0,
        .is_create_code = false,
    };
    
    const output = try stats.formatStats(allocator);
    defer allocator.free(output);
    
    // Verify all fusion types are present
    try std.testing.expect(std.mem.indexOf(u8, output, "Potential fusions (6 total):") != null);
    try std.testing.expect(std.mem.indexOf(u8, output, "PC 0: PUSH + ADD") != null);
    try std.testing.expect(std.mem.indexOf(u8, output, "PC 3: PUSH + SUB") != null);
    try std.testing.expect(std.mem.indexOf(u8, output, "PC 6: PUSH + MUL") != null);
    try std.testing.expect(std.mem.indexOf(u8, output, "PC 9: PUSH + DIV") != null);
    try std.testing.expect(std.mem.indexOf(u8, output, "PC 12: PUSH + JUMP") != null);
    try std.testing.expect(std.mem.indexOf(u8, output, "PC 15: PUSH + JUMPI") != null);
}

test "BytecodeStats formatStats invalid opcode handling" {
    const allocator = std.testing.allocator;
    
    var opcode_counts = [_]u32{0} ** 256;
    opcode_counts[0xFE] = 1; // Invalid opcode
    opcode_counts[0xFF] = 2; // Invalid opcode
    
    const stats = BytecodeStats{
        .opcode_counts = opcode_counts,
        .push_values = &.{},
        .potential_fusions = &.{},
        .jumpdests = &.{},
        .jumps = &.{},
        .backwards_jumps = 0,
        .is_create_code = false,
    };
    
    const output = try stats.formatStats(allocator);
    defer allocator.free(output);
    
    // Verify invalid opcodes are shown with hex notation
    try std.testing.expect(std.mem.indexOf(u8, output, "UNKNOWN(0xfe): 1") != null);
    try std.testing.expect(std.mem.indexOf(u8, output, "UNKNOWN(0xff): 2") != null);
    try std.testing.expect(std.mem.indexOf(u8, output, "Total opcodes: 3") != null);
}

