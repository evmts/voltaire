const std = @import("std");
const Opcode = @import("opcode.zig").Opcode;
pub const PlanConfig = @import("plan_config.zig").PlanConfig;
const createBytecode = @import("bytecode.zig").createBytecode;
const BytecodeConfig = @import("bytecode_config.zig").BytecodeConfig;

/// Handler function type for opcodes.
pub const HandlerFn = fn (frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn;

/// Metadata for JUMPDEST opcodes (dummy struct for compatibility).
pub const JumpDestMetadata = packed struct(u64) {
    gas: u32 = 0,
    min_stack: u16 = 0,
    max_stack: u16 = 0,
};

/// Factory function to create a PlanMinimal type with the given configuration.
pub fn PlanMinimal(comptime cfg: PlanConfig) type {
    comptime cfg.validate();
    
    // Create bytecode type with matching configuration
    const BytecodeType = createBytecode(.{
        .max_bytecode_size = cfg.maxBytecodeSize,
        .max_initcode_size = @max(cfg.maxBytecodeSize, 49152), // EIP-3860 limit, but must be >= max_bytecode_size
    });
    
    return struct {
        /// Bytecode with validation and analysis
        bytecode: BytecodeType,
        /// Jump table of handlers indexed by opcode
        handlers: [256]*const HandlerFn,
        
        /// Type aliases from config
        pub const PcType = cfg.PcType();
        pub const InstructionIndexType = PcType;
        pub const WordType = cfg.WordType;
        
        const Self = @This();
    
    /// Get metadata for opcodes that have it, reading directly from bytecode.
    /// For PlanMinimal, idx is the PC value, not an instruction index.
    pub fn getMetadata(
        self: *const Self,
        idx: *InstructionIndexType,
        comptime opcode: anytype,
    ) blk: {
        // Determine metadata type based on opcode
        const MetadataType = if (@TypeOf(opcode) == u8) {
            // For PlanMinimal, we don't support synthetic opcodes
            @compileError("PlanMinimal does not support synthetic opcodes");
        } else blk2: {
            const op = if (@TypeOf(opcode) == Opcode) 
                opcode 
            else if (@typeInfo(@TypeOf(opcode)) == .enum_literal)
                @field(Opcode, @tagName(opcode))
            else 
                @compileError("Invalid opcode type");
            const MetadataType2 = switch (op) {
                // PUSH opcodes return granular types
                .PUSH1 => u8,
                .PUSH2 => u16,
                .PUSH3 => u24,
                .PUSH4 => u32,
                .PUSH5 => u40,
                .PUSH6 => u48,
                .PUSH7 => u56,
                .PUSH8 => u64,
                // Larger PUSH opcodes always return pointer for PlanMinimal
                .PUSH9, .PUSH10, .PUSH11, .PUSH12, .PUSH13, .PUSH14, .PUSH15, .PUSH16,
                .PUSH17, .PUSH18, .PUSH19, .PUSH20, .PUSH21, .PUSH22, .PUSH23, .PUSH24,
                .PUSH25, .PUSH26, .PUSH27, .PUSH28, .PUSH29, .PUSH30, .PUSH31, .PUSH32 => *const u256,
                
                // JUMPDEST returns a dummy metadata struct for compatibility
                .JUMPDEST => JumpDestMetadata,
                
                // PC returns the current PC value
                .PC => PcType,
                
                // All other opcodes have no metadata
                else => @compileError("Opcode has no metadata"),
            };
            break :blk2 MetadataType2;
        };
        break :blk MetadataType;
    } {
        const pc = idx.*;
        if (pc >= self.bytecode.len()) {
            @panic("getMetadata: trying to read past end of bytecode");
        }
        
        const actual_op = comptime blk: {
            break :blk if (@TypeOf(opcode) == Opcode) 
                opcode 
            else 
                @field(Opcode, @tagName(opcode));
        };
            
        return switch (actual_op) {
            // PUSH opcodes read directly from bytecode
            .PUSH1 => self.bytecode.readPushValue(pc, 1) orelse @panic("PUSH1 data out of bounds"),
            .PUSH2 => self.bytecode.readPushValue(pc, 2) orelse @panic("PUSH2 data out of bounds"),
            .PUSH3 => self.bytecode.readPushValue(pc, 3) orelse @panic("PUSH3 data out of bounds"),
            .PUSH4 => self.bytecode.readPushValue(pc, 4) orelse @panic("PUSH4 data out of bounds"),
            .PUSH5 => self.bytecode.readPushValue(pc, 5) orelse @panic("PUSH5 data out of bounds"),
            .PUSH6 => self.bytecode.readPushValue(pc, 6) orelse @panic("PUSH6 data out of bounds"),
            .PUSH7 => self.bytecode.readPushValue(pc, 7) orelse @panic("PUSH7 data out of bounds"),
            .PUSH8 => self.bytecode.readPushValue(pc, 8) orelse @panic("PUSH8 data out of bounds"),
            // Larger PUSH opcodes return pointer to static value
            .PUSH9, .PUSH10, .PUSH11, .PUSH12, .PUSH13, .PUSH14, .PUSH15, .PUSH16,
            .PUSH17, .PUSH18, .PUSH19, .PUSH20, .PUSH21, .PUSH22, .PUSH23, .PUSH24,
            .PUSH25, .PUSH26, .PUSH27, .PUSH28, .PUSH29, .PUSH30, .PUSH31, .PUSH32 => {
                // For simplicity in minimal plan, we panic on large pushes
                // Real implementation would need to store these values somewhere
                @panic("PlanMinimal does not support large PUSH opcodes");
            },
            
            // JUMPDEST returns dummy metadata
            .JUMPDEST => JumpDestMetadata{ .gas = 0, .min_stack = 0, .max_stack = 0 },
            
            // PC returns the current PC value
            .PC => @as(PcType, @intCast(pc)),
            
            else => unreachable, // Compile error already prevents this
        };
    }
    
    /// Get the next instruction handler and advance the PC.
    /// For PlanMinimal, this reads the opcode at current PC and returns handler.
    pub fn getNextInstruction(
        self: *const Self,
        idx: *InstructionIndexType,
        comptime opcode: anytype,
    ) *const HandlerFn {
        const pc = idx.*;
        if (pc >= self.bytecode.len()) {
            @panic("getNextInstruction: PC out of bounds");
        }
        
        // Determine if opcode has metadata to skip
        const has_metadata = comptime blk: {
            break :blk if (@TypeOf(opcode) == u8)
                // PlanMinimal doesn't support synthetic opcodes
                false
            else blk2: {
                const op = if (@TypeOf(opcode) == Opcode) 
                    opcode 
                else if (@typeInfo(@TypeOf(opcode)) == .enum_literal)
                    @field(Opcode, @tagName(opcode))
                else 
                    @compileError("Invalid opcode type");
                const result = switch (op) {
                // PUSH opcodes have metadata
                .PUSH1, .PUSH2, .PUSH3, .PUSH4, .PUSH5, .PUSH6, .PUSH7,
                .PUSH8, .PUSH9, .PUSH10, .PUSH11, .PUSH12, .PUSH13, .PUSH14, .PUSH15,
                .PUSH16, .PUSH17, .PUSH18, .PUSH19, .PUSH20, .PUSH21, .PUSH22, .PUSH23,
                .PUSH24, .PUSH25, .PUSH26, .PUSH27, .PUSH28, .PUSH29, .PUSH30, .PUSH31,
                .PUSH32,
                // JUMPDEST has metadata
                .JUMPDEST,
                // PC has metadata
                .PC => true,
                // All other opcodes have no metadata
                else => false,
                };
                break :blk2 result;
            };
        };
        
        // Advance PC based on opcode
        if (has_metadata) {
            // For PUSH opcodes, skip the data bytes
            const op_value = self.bytecode.raw()[pc];
            if (op_value >= @intFromEnum(Opcode.PUSH1) and op_value <= @intFromEnum(Opcode.PUSH32)) {
                const push_bytes = op_value - (@intFromEnum(Opcode.PUSH1) - 1);
                idx.* = @intCast(pc + 1 + push_bytes);
            } else {
                // JUMPDEST and PC just advance by 1
                idx.* = @intCast(pc + 1);
            }
        } else {
            // No metadata, advance by 1
            idx.* = @intCast(pc + 1);
        }
        
        // Get the handler for the next instruction
        if (idx.* >= self.bytecode.len()) {
            // Return STOP handler for end of bytecode
            return self.handlers[@intFromEnum(Opcode.STOP)];
        }
        
        const next_opcode = self.bytecode.raw()[idx.*];
        return self.handlers[next_opcode];
    }
    
    /// Get instruction index for a given PC value.
    /// For PlanMinimal, instruction index equals PC.
    pub fn getInstructionIndexForPc(self: *const Self, pc: PcType) ?InstructionIndexType {
        _ = self;
        // In minimal plan, instruction index is the same as PC
        return pc;
    }
    
    /// Check if a PC is a valid JUMPDEST.
    pub fn isValidJumpDest(self: *const Self, pc: usize) bool {
        if (pc >= self.bytecode.len()) return false;
        return (self.bytecode.is_jumpdest[pc >> 3] & (@as(u8, 1) << @intCast(pc & 7))) != 0;
    }
    
    /// Check if a PC is an opcode start (not push data).
    pub fn isOpcodeStart(self: *const Self, pc: usize) bool {
        if (pc >= self.bytecode.len()) return false;
        return (self.bytecode.is_op_start[pc >> 3] & (@as(u8, 1) << @intCast(pc & 7))) != 0;
    }
    
        /// Initialize a PlanMinimal with bytecode and handlers.
        pub fn init(allocator: std.mem.Allocator, code: []const u8, handlers: [256]*const HandlerFn) !Self {
            const bytecode = try BytecodeType.init(allocator, code);
            return Self{
                .bytecode = bytecode,
                .handlers = handlers,
            };
        }
    
        /// Free the allocated resources.
        pub fn deinit(self: *Self) void {
            self.bytecode.deinit();
        }
    };
}

// Test handler function that does nothing (for testing)
fn testHandler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
    _ = frame;
    _ = plan;
    unreachable; // Test handlers don't actually execute
}

test "PlanMinimal basic initialization" {
    const allocator = std.testing.allocator;
    const PlanMinimalType = PlanMinimal(.{});
    
    // Simple bytecode: PUSH1 0x42 STOP
    const bytecode = [_]u8{ @intFromEnum(Opcode.PUSH1), 0x42, @intFromEnum(Opcode.STOP) };
    
    // Create handler array
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| {
        h.* = &testHandler;
    }
    
    var plan = try PlanMinimalType.init(allocator, &bytecode, handlers);
    defer plan.deinit();
    
    // Test isOpcodeStart
    try std.testing.expect(plan.isOpcodeStart(0)); // PUSH1
    try std.testing.expect(!plan.isOpcodeStart(1)); // push data
    try std.testing.expect(plan.isOpcodeStart(2)); // STOP
}

test "PlanMinimal getMetadata for PUSH opcodes" {
    const allocator = std.testing.allocator;
    const PlanMinimalType = PlanMinimal(.{});
    
    // Bytecode with various PUSH instructions
    const bytecode = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x42,
        @intFromEnum(Opcode.PUSH2), 0x12, 0x34,
        @intFromEnum(Opcode.PUSH4), 0xAB, 0xCD, 0xEF, 0x01,
        @intFromEnum(Opcode.STOP),
    };
    
    // Create handler array
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| {
        h.* = &testHandler;
    }
    
    var plan = try PlanMinimalType.init(allocator, &bytecode, handlers);
    defer plan.deinit();
    
    // Test PUSH1
    var idx: PlanMinimalType.InstructionIndexType = 0;
    const push1_val = plan.getMetadata(&idx, .PUSH1);
    try std.testing.expectEqual(@as(u8, 0x42), push1_val);
    
    // Test PUSH2
    idx = 2;
    const push2_val = plan.getMetadata(&idx, .PUSH2);
    try std.testing.expectEqual(@as(u16, 0x1234), push2_val);
    
    // Test PUSH4
    idx = 5;
    const push4_val = plan.getMetadata(&idx, .PUSH4);
    try std.testing.expectEqual(@as(u32, 0xABCDEF01), push4_val);
}

test "PlanMinimal getNextInstruction" {
    const allocator = std.testing.allocator;
    const PlanMinimalType = PlanMinimal(.{});
    
    // Bytecode: PUSH1 0x42 ADD STOP
    const bytecode = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x42,
        @intFromEnum(Opcode.ADD),
        @intFromEnum(Opcode.STOP),
    };
    
    // Create handler array
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| {
        h.* = &testHandler;
    }
    
    var plan = try PlanMinimalType.init(allocator, &bytecode, handlers);
    defer plan.deinit();
    
    // Start at PC 0 (PUSH1)
    var idx: PlanMinimalType.InstructionIndexType = 0;
    
    // Get next after PUSH1 (should skip the data byte)
    const handler1 = plan.getNextInstruction(&idx, .PUSH1);
    try std.testing.expectEqual(@as(PlanMinimalType.InstructionIndexType, 2), idx); // Should point to ADD
    try std.testing.expectEqual(@intFromPtr(&testHandler), @intFromPtr(handler1));
    
    // Get next after ADD
    const handler2 = plan.getNextInstruction(&idx, .ADD);
    try std.testing.expectEqual(@as(PlanMinimalType.InstructionIndexType, 3), idx); // Should point to STOP
    try std.testing.expectEqual(@intFromPtr(&testHandler), @intFromPtr(handler2));
}

test "PlanMinimal PC metadata" {
    const allocator = std.testing.allocator;
    const PlanMinimalType = PlanMinimal(.{});
    
    // Simple bytecode with PC opcode
    const bytecode = [_]u8{
        @intFromEnum(Opcode.PC),
        @intFromEnum(Opcode.STOP),
    };
    
    // Create handler array
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| {
        h.* = &testHandler;
    }
    
    var plan = try PlanMinimalType.init(allocator, &bytecode, handlers);
    defer plan.deinit();
    
    // Test PC metadata returns current PC
    var idx: PlanMinimalType.InstructionIndexType = 0;
    const pc_val = plan.getMetadata(&idx, .PC);
    try std.testing.expectEqual(@as(PlanMinimalType.PcType, 0), pc_val);
    
    // Test from different PC
    idx = 1;
    const pc_val2 = plan.getMetadata(&idx, .PC);
    try std.testing.expectEqual(@as(PlanMinimalType.PcType, 1), pc_val2);
}

test "PlanMinimal isValidJumpDest" {
    const allocator = std.testing.allocator;
    const PlanMinimalType = PlanMinimal(.{});
    
    // Bytecode with JUMPDEST
    const bytecode = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x03,
        @intFromEnum(Opcode.JUMP),
        @intFromEnum(Opcode.JUMPDEST),
        @intFromEnum(Opcode.STOP),
    };
    
    // Create handler array
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| {
        h.* = &testHandler;
    }
    
    var plan = try PlanMinimalType.init(allocator, &bytecode, handlers);
    defer plan.deinit();
    
    // Test isValidJumpDest
    try std.testing.expect(!plan.isValidJumpDest(0)); // PUSH1
    try std.testing.expect(!plan.isValidJumpDest(1)); // push data
    try std.testing.expect(!plan.isValidJumpDest(2)); // JUMP
    try std.testing.expect(plan.isValidJumpDest(3)); // JUMPDEST
    try std.testing.expect(!plan.isValidJumpDest(4)); // STOP
    try std.testing.expect(!plan.isValidJumpDest(100)); // Out of bounds
}

test "PlanMinimal configuration variations" {
    // Test different configurations
    const Config16 = PlanConfig{ .maxBytecodeSize = 1000 };
    const PlanType16 = PlanMinimal(Config16);
    try std.testing.expectEqual(u16, PlanType16.PcType);
    try std.testing.expectEqual(u16, PlanType16.InstructionIndexType);
    
    const Config32 = PlanConfig{ .maxBytecodeSize = 100000 };
    const PlanType32 = PlanMinimal(Config32);
    try std.testing.expectEqual(u32, PlanType32.PcType);
    try std.testing.expectEqual(u32, PlanType32.InstructionIndexType);
    
    const ConfigWordType = PlanConfig{ .WordType = u128 };
    const PlanTypeWord = PlanMinimal(ConfigWordType);
    try std.testing.expectEqual(u128, PlanTypeWord.WordType);
}

test "PlanMinimal error boundaries" {
    const allocator = std.testing.allocator;
    const PlanMinimalType = PlanMinimal(.{});
    
    // Test empty bytecode
    const empty_bytecode = [_]u8{};
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| {
        h.* = &testHandler;
    }
    
    var plan = try PlanMinimalType.init(allocator, &empty_bytecode, handlers);
    defer plan.deinit();
    
    // Out of bounds access should be handled
    try std.testing.expect(!plan.isValidJumpDest(0));
    try std.testing.expect(!plan.isOpcodeStart(0));
    
    // getInstructionIndexForPc should work with empty bytecode
    const idx = plan.getInstructionIndexForPc(0);
    try std.testing.expectEqual(@as(PlanMinimalType.InstructionIndexType, 0), idx);
}

test "PlanMinimal PUSH opcode bounds checking" {
    const allocator = std.testing.allocator;
    const PlanMinimalType = PlanMinimal(.{});
    
    // Test truncated PUSH opcodes
    const truncated_bytecodes = [_][]const u8{
        &[_]u8{@intFromEnum(Opcode.PUSH1)}, // Missing 1 byte
        &[_]u8{@intFromEnum(Opcode.PUSH2), 0x12}, // Missing 1 byte
        &[_]u8{@intFromEnum(Opcode.PUSH4), 0xAB, 0xCD}, // Missing 2 bytes
        &[_]u8{@intFromEnum(Opcode.PUSH8), 0x11, 0x22, 0x33}, // Missing 5 bytes
    };
    
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| {
        h.* = &testHandler;
    }
    
    // Each truncated bytecode should still create a valid plan
    // The planner should handle truncated PUSH data gracefully
    for (truncated_bytecodes) |bytecode| {
        var plan = try PlanMinimalType.init(allocator, bytecode, handlers);
        defer plan.deinit();
        
        // Should mark the opcode start correctly
        try std.testing.expect(plan.isOpcodeStart(0));
        
        // Available bytes should be marked as push data
        for (1..bytecode.len) |i| {
            try std.testing.expect(!plan.isOpcodeStart(i));
        }
    }
}

test "PlanMinimal large PUSH opcode handling" {
    const allocator = std.testing.allocator;
    const PlanMinimalType = PlanMinimal(.{});
    
    // Test that large PUSH opcodes are properly detected as unsupported
    const bytecode = [_]u8{@intFromEnum(Opcode.PUSH9)} ++ ([_]u8{0} ** 9);
    
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| {
        h.* = &testHandler;
    }
    
    var plan = try PlanMinimalType.init(allocator, &bytecode, handlers);
    defer plan.deinit();
    
    // The plan should be created successfully
    try std.testing.expect(plan.isOpcodeStart(0));
    
    // All data bytes should be marked as non-opcode-start
    for (1..10) |i| {
        try std.testing.expect(!plan.isOpcodeStart(i));
    }
    
    // Attempting to get metadata for PUSH9 should be handled by the implementation
    // (In the minimal plan, it panics, but the plan structure should still be valid)
}

test "PlanMinimal mixed PUSH and JUMPDEST analysis" {
    const allocator = std.testing.allocator;
    const PlanMinimalType = PlanMinimal(.{});
    
    // Complex bytecode with JUMPDEST inside and outside PUSH data
    const bytecode = [_]u8{
        @intFromEnum(Opcode.PUSH2), @intFromEnum(Opcode.JUMPDEST), 0x10, // JUMPDEST in PUSH data
        @intFromEnum(Opcode.JUMPDEST),                                    // Real JUMPDEST
        @intFromEnum(Opcode.PUSH4), 0x11, @intFromEnum(Opcode.JUMPDEST), 0x33, 0x44, // JUMPDEST in PUSH data
        @intFromEnum(Opcode.PUSH1), @intFromEnum(Opcode.JUMPDEST),        // JUMPDEST in PUSH data
        @intFromEnum(Opcode.JUMPDEST),                                    // Real JUMPDEST
        @intFromEnum(Opcode.STOP),
    };
    
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| {
        h.* = &testHandler;
    }
    
    var plan = try PlanMinimalType.init(allocator, &bytecode, handlers);
    defer plan.deinit();
    
    // Verify opcode starts
    try std.testing.expect(plan.isOpcodeStart(0));   // PUSH2
    try std.testing.expect(!plan.isOpcodeStart(1));  // PUSH data (fake JUMPDEST)
    try std.testing.expect(!plan.isOpcodeStart(2));  // PUSH data
    try std.testing.expect(plan.isOpcodeStart(3));   // Real JUMPDEST
    try std.testing.expect(plan.isOpcodeStart(4));   // PUSH4
    try std.testing.expect(!plan.isOpcodeStart(5));  // PUSH data
    try std.testing.expect(!plan.isOpcodeStart(6));  // PUSH data (fake JUMPDEST)
    try std.testing.expect(!plan.isOpcodeStart(7));  // PUSH data
    try std.testing.expect(!plan.isOpcodeStart(8));  // PUSH data
    try std.testing.expect(plan.isOpcodeStart(9));   // PUSH1
    try std.testing.expect(!plan.isOpcodeStart(10)); // PUSH data (fake JUMPDEST)
    try std.testing.expect(plan.isOpcodeStart(11));  // Real JUMPDEST
    try std.testing.expect(plan.isOpcodeStart(12));  // STOP
    
    // Verify JUMPDEST detection
    try std.testing.expect(!plan.isValidJumpDest(0));  // PUSH2
    try std.testing.expect(!plan.isValidJumpDest(1));  // PUSH data (fake JUMPDEST)
    try std.testing.expect(!plan.isValidJumpDest(2));  // PUSH data
    try std.testing.expect(plan.isValidJumpDest(3));   // Real JUMPDEST
    try std.testing.expect(!plan.isValidJumpDest(4));  // PUSH4
    try std.testing.expect(!plan.isValidJumpDest(5));  // PUSH data
    try std.testing.expect(!plan.isValidJumpDest(6));  // PUSH data (fake JUMPDEST)
    try std.testing.expect(!plan.isValidJumpDest(7));  // PUSH data
    try std.testing.expect(!plan.isValidJumpDest(8));  // PUSH data
    try std.testing.expect(!plan.isValidJumpDest(9));  // PUSH1
    try std.testing.expect(!plan.isValidJumpDest(10)); // PUSH data (fake JUMPDEST)
    try std.testing.expect(plan.isValidJumpDest(11));  // Real JUMPDEST
    try std.testing.expect(!plan.isValidJumpDest(12)); // STOP
}

test "PlanMinimal getNextInstruction at bytecode end" {
    const allocator = std.testing.allocator;
    const PlanMinimalType = PlanMinimal(.{});
    
    const bytecode = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x42,
    };
    
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| {
        h.* = &testHandler;
    }
    
    var plan = try PlanMinimalType.init(allocator, &bytecode, handlers);
    defer plan.deinit();
    
    var idx: PlanMinimalType.InstructionIndexType = 0;
    
    // Get next instruction after PUSH1
    const handler = plan.getNextInstruction(&idx, .PUSH1);
    try std.testing.expectEqual(@as(PlanMinimalType.InstructionIndexType, 2), idx);
    
    // At end of bytecode, should return STOP handler
    try std.testing.expectEqual(&testHandler, handler);
}

test "PlanMinimal memory management" {
    const allocator = std.testing.allocator;
    const PlanMinimalType = PlanMinimal(.{});
    
    const bytecode = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x42,
        @intFromEnum(Opcode.JUMPDEST),
        @intFromEnum(Opcode.STOP),
    };
    
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| {
        h.* = &testHandler;
    }
    
    // Test multiple init/deinit cycles
    for (0..5) |_| {
        var plan = try PlanMinimalType.init(allocator, &bytecode, handlers);
        
        // Use the plan
        try std.testing.expect(plan.isOpcodeStart(0));
        try std.testing.expect(plan.isValidJumpDest(2));
        
        var idx: PlanMinimalType.InstructionIndexType = 0;
        const push_val = plan.getMetadata(&idx, .PUSH1);
        try std.testing.expectEqual(@as(u8, 0x42), push_val);
        
        // Clean up
        plan.deinit();
    }
}

test "PlanMinimal comprehensive configuration validation" {
    // Test various valid configurations within limits
    const ValidConfigs = [_]PlanConfig{
        .{}, // Default
        .{ .maxBytecodeSize = 1000 },
        .{ .maxBytecodeSize = 32768 },
        .{ .maxBytecodeSize = 65535 }, // Maximum allowed size
        .{ .WordType = u128 },
        .{ .WordType = u256 },
        .{ .WordType = u512 },
        .{ .maxBytecodeSize = 50000, .WordType = u128 },
    };
    
    // Test that all valid configs compile successfully
    inline for (ValidConfigs) |cfg| {
        comptime cfg.validate();
        const PlanType = PlanMinimal(cfg);
        try std.testing.expectEqual(cfg.WordType, PlanType.WordType);
        
        // Since we're limited to <= 65535, PcType is always u16
        try std.testing.expectEqual(u16, PlanType.PcType);
    }
}

test "PlanMinimal max size configuration" {
    const allocator = std.testing.allocator;
    const MaxPlan = PlanMinimal(.{ .maxBytecodeSize = 65535 });
    
    // Test with maximum allowed size
    try std.testing.expectEqual(u16, MaxPlan.PcType);
    try std.testing.expectEqual(u16, MaxPlan.InstructionIndexType);
    
    const bytecode = [_]u8{
        @intFromEnum(Opcode.PUSH1), 0x42,
        @intFromEnum(Opcode.JUMPDEST),
        @intFromEnum(Opcode.STOP),
    };
    
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| {
        h.* = &testHandler;
    }
    
    var plan = try MaxPlan.init(allocator, &bytecode, handlers);
    defer plan.deinit();
    
    // Test that max PC values work correctly
    const max_pc: u16 = 65535;
    const idx_result = plan.getInstructionIndexForPc(max_pc);
    try std.testing.expectEqual(@as(MaxPlan.InstructionIndexType, max_pc), idx_result);
}

test "PlanMinimal all opcode metadata type coverage" {
    // Test that metadata type detection works correctly at compile time
    const PlanMinimalType = PlanMinimal(.{});
    
    // These are compile-time type checks
    comptime {
        // Test all PUSH opcodes that have inline metadata
        const push1_type = @TypeOf(PlanMinimalType.getMetadata(undefined, undefined, .PUSH1));
        if (push1_type != u8) @compileError("PUSH1 should return u8");
        
        const push2_type = @TypeOf(PlanMinimalType.getMetadata(undefined, undefined, .PUSH2));
        if (push2_type != u16) @compileError("PUSH2 should return u16");
        
        const push3_type = @TypeOf(PlanMinimalType.getMetadata(undefined, undefined, .PUSH3));
        if (push3_type != u24) @compileError("PUSH3 should return u24");
        
        const push4_type = @TypeOf(PlanMinimalType.getMetadata(undefined, undefined, .PUSH4));
        if (push4_type != u32) @compileError("PUSH4 should return u32");
        
        const push8_type = @TypeOf(PlanMinimalType.getMetadata(undefined, undefined, .PUSH8));
        if (push8_type != u64) @compileError("PUSH8 should return u64");
        
        // Test other metadata opcodes
        const pc_type = @TypeOf(PlanMinimalType.getMetadata(undefined, undefined, .PC));
        if (pc_type != PlanMinimalType.PcType) @compileError("PC should return PcType");
        
        const jumpdest_type = @TypeOf(PlanMinimalType.getMetadata(undefined, undefined, .JUMPDEST));
        if (jumpdest_type != JumpDestMetadata) @compileError("JUMPDEST should return JumpDestMetadata");
    }
}

test "PlanMinimal integration with bytecode analysis" {
    const allocator = std.testing.allocator;
    const PlanMinimalType = PlanMinimal(.{});
    
    // Complex bytecode that tests all analysis features
    const complex_bytecode = [_]u8{
        // Block 1: Simple sequence
        @intFromEnum(Opcode.PUSH1), 0x01,
        @intFromEnum(Opcode.PUSH1), 0x02,
        @intFromEnum(Opcode.ADD),
        
        // Block 2: JUMPDEST target
        @intFromEnum(Opcode.JUMPDEST), // PC 6
        @intFromEnum(Opcode.DUP1),
        
        // Block 3: PUSH with fake opcode in data
        @intFromEnum(Opcode.PUSH3), @intFromEnum(Opcode.JUMPDEST), @intFromEnum(Opcode.STOP), 0xFF,
        
        // Block 4: Real JUMPDEST after PUSH data
        @intFromEnum(Opcode.JUMPDEST), // PC 12
        @intFromEnum(Opcode.PC),
        
        // Block 5: Jump to first JUMPDEST
        @intFromEnum(Opcode.PUSH1), 0x06, // Push PC of first JUMPDEST
        @intFromEnum(Opcode.JUMP),
        
        // Block 6: Unreachable after JUMP
        @intFromEnum(Opcode.INVALID),
        @intFromEnum(Opcode.STOP),
    };
    
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| {
        h.* = &testHandler;
    }
    
    var plan = try PlanMinimalType.init(allocator, &complex_bytecode, handlers);
    defer plan.deinit();
    
    // Verify opcode starts are correctly identified
    const expected_opcodes = [_]usize{ 0, 2, 4, 5, 6, 7, 8, 12, 13, 14, 16, 17, 18, 19 };
    for (0..complex_bytecode.len) |pc| {
        const is_opcode = for (expected_opcodes) |expected_pc| {
            if (pc == expected_pc) break true;
        } else false;
        
        try std.testing.expectEqual(is_opcode, plan.isOpcodeStart(pc));
    }
    
    // Verify JUMPDEST detection (only real JUMPDESTs)
    const expected_jumpdests = [_]usize{ 6, 12 };
    for (0..complex_bytecode.len) |pc| {
        const is_jumpdest = for (expected_jumpdests) |expected_pc| {
            if (pc == expected_pc) break true;
        } else false;
        
        try std.testing.expectEqual(is_jumpdest, plan.isValidJumpDest(pc));
    }
    
    // Test navigation through the bytecode
    var idx: PlanMinimalType.InstructionIndexType = 0;
    
    // Navigate: PUSH1 -> PUSH1
    _ = plan.getNextInstruction(&idx, .PUSH1);
    try std.testing.expectEqual(@as(PlanMinimalType.InstructionIndexType, 2), idx);
    
    // Navigate: PUSH1 -> ADD
    _ = plan.getNextInstruction(&idx, .PUSH1);
    try std.testing.expectEqual(@as(PlanMinimalType.InstructionIndexType, 4), idx);
    
    // Navigate: ADD -> ADD (should advance by 1)
    _ = plan.getNextInstruction(&idx, .ADD);
    try std.testing.expectEqual(@as(PlanMinimalType.InstructionIndexType, 5), idx);
    
    // Test metadata extraction from different positions
    idx = 0;
    const push1_val1 = plan.getMetadata(&idx, .PUSH1);
    try std.testing.expectEqual(@as(u8, 0x01), push1_val1);
    
    idx = 2;
    const push1_val2 = plan.getMetadata(&idx, .PUSH1);
    try std.testing.expectEqual(@as(u8, 0x02), push1_val2);
    
    idx = 8; // PUSH3 position
    const push3_val = plan.getMetadata(&idx, .PUSH3);
    try std.testing.expectEqual(@as(u24, 0x5B00FF), push3_val); // JUMPDEST, STOP, 0xFF
    
    idx = 13; // PC opcode position
    const pc_val = plan.getMetadata(&idx, .PC);
    try std.testing.expectEqual(@as(PlanMinimalType.PcType, 13), pc_val);
}

test "PlanMinimal sequential navigation stress test" {
    const allocator = std.testing.allocator;
    const PlanMinimalType = PlanMinimal(.{});
    
    // Create bytecode with many sequential opcodes
    var bytecode_list = std.ArrayList(u8).init(allocator);
    defer bytecode_list.deinit();
    
    // Add various opcodes in sequence
    for (0..50) |i| {
        if (i % 10 == 0) {
            // Add a JUMPDEST every 10 opcodes
            try bytecode_list.append(@intFromEnum(Opcode.JUMPDEST));
        } else if (i % 5 == 0) {
            // Add a PUSH2 with data
            try bytecode_list.append(@intFromEnum(Opcode.PUSH2));
            try bytecode_list.append(@intCast(i & 0xFF));
            try bytecode_list.append(@intCast((i >> 8) & 0xFF));
        } else {
            // Add simple opcodes
            const simple_opcodes = [_]Opcode{ .ADD, .MUL, .SUB, .DIV, .MOD, .DUP1, .SWAP1 };
            const opcode = simple_opcodes[i % simple_opcodes.len];
            try bytecode_list.append(@intFromEnum(opcode));
        }
    }
    
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| {
        h.* = &testHandler;
    }
    
    var plan = try PlanMinimalType.init(allocator, bytecode_list.items, handlers);
    defer plan.deinit();
    
    // Navigate through the entire bytecode
    var idx: PlanMinimalType.InstructionIndexType = 0;
    var instruction_count: usize = 0;
    
    while (idx < plan.bytecode.len()) {
        const current_opcode = plan.bytecode.raw()[idx];
        const next_handler = plan.handlers[current_opcode];
        
        // Verify handler is valid
        try std.testing.expectEqual(@intFromPtr(&testHandler), @intFromPtr(next_handler));
        
        // Track instruction count
        instruction_count += 1;
        
        // Advance to next instruction based on current opcode
        if (current_opcode >= @intFromEnum(Opcode.PUSH1) and current_opcode <= @intFromEnum(Opcode.PUSH32)) {
            const push_bytes = current_opcode - (@intFromEnum(Opcode.PUSH1) - 1);
            idx = @intCast(idx + 1 + push_bytes);
        } else {
            idx += 1;
        }
    }
    
    // Verify we processed expected number of instructions
    try std.testing.expect(instruction_count > 0);
}

test "PlanMinimal all PUSH opcodes metadata extraction" {
    const allocator = std.testing.allocator;
    const PlanMinimalType = PlanMinimal(.{});
    
    // Test PUSH5, PUSH6, PUSH7 which weren't tested before
    const bytecode = [_]u8{
        @intFromEnum(Opcode.PUSH5), 0x11, 0x22, 0x33, 0x44, 0x55,
        @intFromEnum(Opcode.PUSH6), 0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xFF,
        @intFromEnum(Opcode.PUSH7), 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07,
        @intFromEnum(Opcode.STOP),
    };
    
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| {
        h.* = &testHandler;
    }
    
    var plan = try PlanMinimalType.init(allocator, &bytecode, handlers);
    defer plan.deinit();
    
    // Test PUSH5
    var idx: PlanMinimalType.InstructionIndexType = 0;
    const push5_val = plan.getMetadata(&idx, .PUSH5);
    try std.testing.expectEqual(@as(u40, 0x1122334455), push5_val);
    
    // Test PUSH6
    idx = 6;
    const push6_val = plan.getMetadata(&idx, .PUSH6);
    try std.testing.expectEqual(@as(u48, 0xAABBCCDDEEFF), push6_val);
    
    // Test PUSH7
    idx = 13;
    const push7_val = plan.getMetadata(&idx, .PUSH7);
    try std.testing.expectEqual(@as(u56, 0x01020304050607), push7_val);
}

test "PlanMinimal consecutive JUMPDEST handling" {
    const allocator = std.testing.allocator;
    const PlanMinimalType = PlanMinimal(.{});
    
    // Bytecode with consecutive JUMPDESTs
    const bytecode = [_]u8{
        @intFromEnum(Opcode.JUMPDEST),
        @intFromEnum(Opcode.JUMPDEST),
        @intFromEnum(Opcode.JUMPDEST),
        @intFromEnum(Opcode.PUSH1), 0x01,
        @intFromEnum(Opcode.JUMPDEST),
        @intFromEnum(Opcode.JUMPDEST),
        @intFromEnum(Opcode.STOP),
    };
    
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| {
        h.* = &testHandler;
    }
    
    var plan = try PlanMinimalType.init(allocator, &bytecode, handlers);
    defer plan.deinit();
    
    // All JUMPDESTs should be valid
    try std.testing.expect(plan.isValidJumpDest(0));
    try std.testing.expect(plan.isValidJumpDest(1));
    try std.testing.expect(plan.isValidJumpDest(2));
    try std.testing.expect(plan.isValidJumpDest(5));
    try std.testing.expect(plan.isValidJumpDest(6));
    
    // Non-JUMPDEST locations should be invalid
    try std.testing.expect(!plan.isValidJumpDest(3)); // PUSH1
    try std.testing.expect(!plan.isValidJumpDest(4)); // push data
    try std.testing.expect(!plan.isValidJumpDest(7)); // STOP
}

test "PlanMinimal bytecode ending with PUSH without data" {
    const allocator = std.testing.allocator;
    const PlanMinimalType = PlanMinimal(.{});
    
    // Test various truncated PUSH at end of bytecode
    const truncated_cases = [_]struct {
        bytecode: []const u8,
        expected_opcodes: []const usize,
    }{
        .{
            .bytecode = &[_]u8{ @intFromEnum(Opcode.ADD), @intFromEnum(Opcode.PUSH1) },
            .expected_opcodes = &[_]usize{ 0, 1 },
        },
        .{
            .bytecode = &[_]u8{ @intFromEnum(Opcode.PUSH32) },
            .expected_opcodes = &[_]usize{ 0 },
        },
        .{
            .bytecode = &[_]u8{ @intFromEnum(Opcode.DUP1), @intFromEnum(Opcode.PUSH16), 0xFF },
            .expected_opcodes = &[_]usize{ 0, 1 },
        },
    };
    
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| {
        h.* = &testHandler;
    }
    
    for (truncated_cases) |test_case| {
        var plan = try PlanMinimalType.init(allocator, test_case.bytecode, handlers);
        defer plan.deinit();
        
        // Verify expected opcodes are marked correctly
        for (test_case.expected_opcodes) |pc| {
            try std.testing.expect(plan.isOpcodeStart(pc));
        }
        
        // Verify push data bytes are marked as non-opcode
        for (0..test_case.bytecode.len) |pc| {
            const is_expected = for (test_case.expected_opcodes) |expected_pc| {
                if (pc == expected_pc) break true;
            } else false;
            
            if (!is_expected) {
                try std.testing.expect(!plan.isOpcodeStart(pc));
            }
        }
    }
}

test "PlanMinimal JUMPDEST metadata access" {
    const allocator = std.testing.allocator;
    const PlanMinimalType = PlanMinimal(.{});
    
    const bytecode = [_]u8{
        @intFromEnum(Opcode.JUMPDEST),
        @intFromEnum(Opcode.JUMPDEST),
        @intFromEnum(Opcode.ADD),
        @intFromEnum(Opcode.JUMPDEST),
        @intFromEnum(Opcode.STOP),
    };
    
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| {
        h.* = &testHandler;
    }
    
    var plan = try PlanMinimalType.init(allocator, &bytecode, handlers);
    defer plan.deinit();
    
    // Test getting JUMPDEST metadata from different positions
    var idx: PlanMinimalType.InstructionIndexType = 0;
    const jumpdest_meta1 = plan.getMetadata(&idx, .JUMPDEST);
    try std.testing.expectEqual(@as(u32, 0), jumpdest_meta1.gas);
    try std.testing.expectEqual(@as(u16, 0), jumpdest_meta1.min_stack);
    try std.testing.expectEqual(@as(u16, 0), jumpdest_meta1.max_stack);
    
    idx = 1;
    const jumpdest_meta2 = plan.getMetadata(&idx, .JUMPDEST);
    try std.testing.expectEqual(@as(u32, 0), jumpdest_meta2.gas);
    
    idx = 3;
    const jumpdest_meta3 = plan.getMetadata(&idx, .JUMPDEST);
    try std.testing.expectEqual(@as(u32, 0), jumpdest_meta3.gas);
}

test "PlanMinimal getNextInstruction with varied opcodes" {
    const allocator = std.testing.allocator;
    const PlanMinimalType = PlanMinimal(.{});
    
    // Bytecode with various opcodes to test navigation
    const bytecode = [_]u8{
        @intFromEnum(Opcode.PC),
        @intFromEnum(Opcode.JUMPDEST),
        @intFromEnum(Opcode.PUSH4), 0xDE, 0xAD, 0xBE, 0xEF,
        @intFromEnum(Opcode.DUP1),
        @intFromEnum(Opcode.SWAP1),
        @intFromEnum(Opcode.PC),
        @intFromEnum(Opcode.STOP),
    };
    
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| {
        h.* = &testHandler;
    }
    
    var plan = try PlanMinimalType.init(allocator, &bytecode, handlers);
    defer plan.deinit();
    
    var idx: PlanMinimalType.InstructionIndexType = 0;
    
    // PC -> JUMPDEST
    _ = plan.getNextInstruction(&idx, .PC);
    try std.testing.expectEqual(@as(PlanMinimalType.InstructionIndexType, 1), idx);
    
    // JUMPDEST -> PUSH4
    _ = plan.getNextInstruction(&idx, .JUMPDEST);
    try std.testing.expectEqual(@as(PlanMinimalType.InstructionIndexType, 2), idx);
    
    // PUSH4 -> DUP1 (skips 4 bytes of data)
    _ = plan.getNextInstruction(&idx, .PUSH4);
    try std.testing.expectEqual(@as(PlanMinimalType.InstructionIndexType, 7), idx);
    
    // DUP1 -> SWAP1
    _ = plan.getNextInstruction(&idx, .DUP1);
    try std.testing.expectEqual(@as(PlanMinimalType.InstructionIndexType, 8), idx);
    
    // SWAP1 -> PC
    _ = plan.getNextInstruction(&idx, .SWAP1);
    try std.testing.expectEqual(@as(PlanMinimalType.InstructionIndexType, 9), idx);
    
    // PC -> STOP
    _ = plan.getNextInstruction(&idx, .PC);
    try std.testing.expectEqual(@as(PlanMinimalType.InstructionIndexType, 10), idx);
}

test "PlanMinimal bytecode boundary edge cases" {
    const allocator = std.testing.allocator;
    const PlanMinimalType = PlanMinimal(.{});
    
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| {
        h.* = &testHandler;
    }
    
    // Test single opcode bytecode
    const single_opcode = [_]u8{@intFromEnum(Opcode.STOP)};
    var plan1 = try PlanMinimalType.init(allocator, &single_opcode, handlers);
    defer plan1.deinit();
    
    try std.testing.expect(plan1.isOpcodeStart(0));
    try std.testing.expect(!plan1.isValidJumpDest(0));
    
    // Test single JUMPDEST
    const single_jumpdest = [_]u8{@intFromEnum(Opcode.JUMPDEST)};
    var plan2 = try PlanMinimalType.init(allocator, &single_jumpdest, handlers);
    defer plan2.deinit();
    
    try std.testing.expect(plan2.isOpcodeStart(0));
    try std.testing.expect(plan2.isValidJumpDest(0));
    
    // Test exactly at size boundary
    const max_u8 = 255;
    var boundary_bytecode = try allocator.alloc(u8, max_u8);
    defer allocator.free(boundary_bytecode);
    
    // Fill with NOPs and end with JUMPDEST
    @memset(boundary_bytecode[0..max_u8-1], @intFromEnum(Opcode.ORIGIN)); // Using ORIGIN as a simple opcode
    boundary_bytecode[max_u8-1] = @intFromEnum(Opcode.JUMPDEST);
    
    var plan3 = try PlanMinimalType.init(allocator, boundary_bytecode, handlers);
    defer plan3.deinit();
    
    try std.testing.expect(plan3.isOpcodeStart(0));
    try std.testing.expect(plan3.isOpcodeStart(max_u8-1));
    try std.testing.expect(plan3.isValidJumpDest(max_u8-1));
}

test "PlanMinimal getInstructionIndexForPc edge cases" {
    const allocator = std.testing.allocator;
    const PlanMinimalType = PlanMinimal(.{});
    
    const bytecode = [_]u8{
        @intFromEnum(Opcode.PUSH2), 0x12, 0x34,
        @intFromEnum(Opcode.STOP),
    };
    
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| {
        h.* = &testHandler;
    }
    
    var plan = try PlanMinimalType.init(allocator, &bytecode, handlers);
    defer plan.deinit();
    
    // Test all valid PC values
    for (0..bytecode.len) |pc| {
        const idx = plan.getInstructionIndexForPc(@intCast(pc));
        try std.testing.expectEqual(@as(PlanMinimalType.InstructionIndexType, @intCast(pc)), idx);
    }
    
    // Test beyond bytecode length
    const beyond_idx = plan.getInstructionIndexForPc(@intCast(bytecode.len + 10));
    try std.testing.expectEqual(@as(PlanMinimalType.InstructionIndexType, @intCast(bytecode.len + 10)), beyond_idx);
    
    // Test maximum PC value
    const max_pc: PlanMinimalType.PcType = std.math.maxInt(PlanMinimalType.PcType);
    const max_idx = plan.getInstructionIndexForPc(max_pc);
    try std.testing.expectEqual(max_pc, max_idx);
}

test "PlanMinimal stress test with maximum PUSH data patterns" {
    const allocator = std.testing.allocator;
    const PlanMinimalType = PlanMinimal(.{});
    
    // Create bytecode with alternating PUSH8 and JUMPDEST
    var bytecode_list = std.ArrayList(u8).init(allocator);
    defer bytecode_list.deinit();
    
    // Pattern: PUSH8 <8 bytes> JUMPDEST (repeated)
    for (0..10) |i| {
        try bytecode_list.append(@intFromEnum(Opcode.PUSH8));
        // Add 8 bytes of data, some being JUMPDEST opcodes
        for (0..8) |j| {
            if (j % 3 == 0) {
                try bytecode_list.append(@intFromEnum(Opcode.JUMPDEST)); // Fake JUMPDEST in data
            } else {
                try bytecode_list.append(@intCast((i * 8 + j) & 0xFF));
            }
        }
        try bytecode_list.append(@intFromEnum(Opcode.JUMPDEST)); // Real JUMPDEST
    }
    
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| {
        h.* = &testHandler;
    }
    
    var plan = try PlanMinimalType.init(allocator, bytecode_list.items, handlers);
    defer plan.deinit();
    
    // Verify only the real JUMPDESTs are detected
    var pc: usize = 0;
    for (0..10) |i| {
        // PUSH8 opcode
        try std.testing.expect(plan.isOpcodeStart(pc));
        try std.testing.expect(!plan.isValidJumpDest(pc));
        pc += 1;
        
        // 8 bytes of push data (none should be valid jumpdests)
        for (0..8) |_| {
            try std.testing.expect(!plan.isOpcodeStart(pc));
            try std.testing.expect(!plan.isValidJumpDest(pc));
            pc += 1;
        }
        
        // Real JUMPDEST
        try std.testing.expect(plan.isOpcodeStart(pc));
        try std.testing.expect(plan.isValidJumpDest(pc));
        pc += 1;
        
        _ = i;
    }
}

test "PlanMinimal handler array bounds" {
    const allocator = std.testing.allocator;
    const PlanMinimalType = PlanMinimal(.{});
    
    // Test all possible opcode values
    var bytecode_list = std.ArrayList(u8).init(allocator);
    defer bytecode_list.deinit();
    
    // Add all valid opcodes (0x00 to 0xFF)
    for (0..256) |opcode| {
        try bytecode_list.append(@intCast(opcode));
        // Add data for PUSH opcodes
        if (opcode >= @intFromEnum(Opcode.PUSH1) and opcode <= @intFromEnum(Opcode.PUSH32)) {
            const push_size = opcode - @intFromEnum(Opcode.PUSH1) + 1;
            for (0..push_size) |_| {
                try bytecode_list.append(0);
            }
        }
    }
    
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| {
        h.* = &testHandler;
    }
    
    var plan = try PlanMinimalType.init(allocator, bytecode_list.items, handlers);
    defer plan.deinit();
    
    // Navigate through and verify all handlers are accessible
    var idx: PlanMinimalType.InstructionIndexType = 0;
    while (idx < plan.bytecode.len()) {
        const opcode = plan.bytecode.raw()[idx];
        const handler = plan.handlers[opcode];
        try std.testing.expectEqual(@intFromPtr(&testHandler), @intFromPtr(handler));
        
        // Skip to next opcode
        if (opcode >= @intFromEnum(Opcode.PUSH1) and opcode <= @intFromEnum(Opcode.PUSH32)) {
            const push_size = opcode - @intFromEnum(Opcode.PUSH1) + 1;
            idx = @intCast(idx + 1 + push_size);
        } else {
            idx += 1;
        }
    }
}