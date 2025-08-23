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
pub fn createPlanMinimal(comptime cfg: PlanConfig) type {
    comptime cfg.validate();
    
    const PlanMinimal = struct {
        /// Raw bytecode reference
        bytecode: []const u8,
        /// Bitmap marking which bytes are push data (not opcodes)
        is_push_data: []u8,
        /// Bitmap marking which bytes are opcode starts
        is_op_start: []u8,
        /// Bitmap marking which bytes are JUMPDEST opcodes
        is_jumpdest: []u8,
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
        if (pc >= self.bytecode.len) {
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
            .PUSH1 => blk: {
                if (pc + 1 >= self.bytecode.len) @panic("PUSH1 data out of bounds");
                break :blk self.bytecode[pc + 1];
            },
            .PUSH2 => blk: {
                if (pc + 2 >= self.bytecode.len) @panic("PUSH2 data out of bounds");
                var value: u16 = 0;
                value = (@as(u16, self.bytecode[pc + 1]) << 8) | self.bytecode[pc + 2];
                break :blk value;
            },
            .PUSH3 => blk: {
                if (pc + 3 >= self.bytecode.len) @panic("PUSH3 data out of bounds");
                var value: u24 = 0;
                value = (@as(u24, self.bytecode[pc + 1]) << 16) | 
                        (@as(u24, self.bytecode[pc + 2]) << 8) | 
                        self.bytecode[pc + 3];
                break :blk value;
            },
            .PUSH4 => blk: {
                if (pc + 4 >= self.bytecode.len) @panic("PUSH4 data out of bounds");
                var value: u32 = 0;
                var i: u8 = 0;
                while (i < 4) : (i += 1) {
                    value = (value << 8) | self.bytecode[pc + 1 + i];
                }
                break :blk value;
            },
            .PUSH5 => blk: {
                if (pc + 5 >= self.bytecode.len) @panic("PUSH5 data out of bounds");
                var value: u40 = 0;
                var i: u8 = 0;
                while (i < 5) : (i += 1) {
                    value = (value << 8) | self.bytecode[pc + 1 + i];
                }
                break :blk value;
            },
            .PUSH6 => blk: {
                if (pc + 6 >= self.bytecode.len) @panic("PUSH6 data out of bounds");
                var value: u48 = 0;
                var i: u8 = 0;
                while (i < 6) : (i += 1) {
                    value = (value << 8) | self.bytecode[pc + 1 + i];
                }
                break :blk value;
            },
            .PUSH7 => blk: {
                if (pc + 7 >= self.bytecode.len) @panic("PUSH7 data out of bounds");
                var value: u56 = 0;
                var i: u8 = 0;
                while (i < 7) : (i += 1) {
                    value = (value << 8) | self.bytecode[pc + 1 + i];
                }
                break :blk value;
            },
            .PUSH8 => blk: {
                if (pc + 8 >= self.bytecode.len) @panic("PUSH8 data out of bounds");
                var value: u64 = 0;
                var i: u8 = 0;
                while (i < 8) : (i += 1) {
                    value = (value << 8) | self.bytecode[pc + 1 + i];
                }
                break :blk value;
            },
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
        if (pc >= self.bytecode.len) {
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
            const op_value = self.bytecode[pc];
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
        if (idx.* >= self.bytecode.len) {
            // Return STOP handler for end of bytecode
            return self.handlers[@intFromEnum(Opcode.STOP)];
        }
        
        const next_opcode = self.bytecode[idx.*];
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
        if (pc >= self.bytecode.len) return false;
        return (self.is_jumpdest[pc >> 3] & (@as(u8, 1) << @intCast(pc & 7))) != 0;
    }
    
    /// Check if a PC is an opcode start (not push data).
    pub fn isOpcodeStart(self: *const Self, pc: usize) bool {
        if (pc >= self.bytecode.len) return false;
        return (self.is_op_start[pc >> 3] & (@as(u8, 1) << @intCast(pc & 7))) != 0;
    }
    
        /// Free the allocated bitmaps.
        pub fn deinit(self: *Self, allocator: std.mem.Allocator) void {
            if (self.is_push_data.len > 0) allocator.free(self.is_push_data);
            if (self.is_op_start.len > 0) allocator.free(self.is_op_start);
            if (self.is_jumpdest.len > 0) allocator.free(self.is_jumpdest);
            self.is_push_data = &.{};
            self.is_op_start = &.{};
            self.is_jumpdest = &.{};
        }
    };
    
    return PlanMinimal;
}

// Test handler function that does nothing (for testing)
fn testHandler(frame: *anyopaque, plan: *const anyopaque) anyerror!noreturn {
    _ = frame;
    _ = plan;
    unreachable; // Test handlers don't actually execute
}

test "PlanMinimal basic initialization" {
    const allocator = std.testing.allocator;
    const PlanMinimal = createPlanMinimal(.{});
    
    // Simple bytecode: PUSH1 0x42 STOP
    const bytecode = [_]u8{ @intFromEnum(Opcode.PUSH1), 0x42, @intFromEnum(Opcode.STOP) };
    
    // Create handler array
    var handlers: [256]*const HandlerFn = undefined;
    for (&handlers) |*h| {
        h.* = &testHandler;
    }
    
    // Allocate bitmaps
    const bitmap_size = (bytecode.len + 7) / 8;
    const is_push_data = try allocator.alloc(u8, bitmap_size);
    defer allocator.free(is_push_data);
    const is_op_start = try allocator.alloc(u8, bitmap_size);
    defer allocator.free(is_op_start);
    const is_jumpdest = try allocator.alloc(u8, bitmap_size);
    defer allocator.free(is_jumpdest);
    
    // Initialize bitmaps (simplified for test)
    @memset(is_push_data, 0);
    @memset(is_op_start, 0);
    @memset(is_jumpdest, 0);
    
    // Mark opcode starts
    is_op_start[0] = 0b101; // Bits 0 and 2 are opcode starts (PUSH1 and STOP)
    is_push_data[0] = 0b010; // Bit 1 is push data (0x42)
    
    var plan = PlanMinimal{
        .bytecode = &bytecode,
        .is_push_data = is_push_data,
        .is_op_start = is_op_start,
        .is_jumpdest = is_jumpdest,
        .handlers = handlers,
    };
    defer plan.deinit(allocator);
    
    // Test isOpcodeStart
    try std.testing.expect(plan.isOpcodeStart(0)); // PUSH1
    try std.testing.expect(!plan.isOpcodeStart(1)); // push data
    try std.testing.expect(plan.isOpcodeStart(2)); // STOP
}

test "PlanMinimal getMetadata for PUSH opcodes" {
    const allocator = std.testing.allocator;
    const PlanMinimal = createPlanMinimal(.{});
    
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
    
    // Allocate bitmaps
    const bitmap_size = (bytecode.len + 7) / 8;
    const is_push_data = try allocator.alloc(u8, bitmap_size);
    defer allocator.free(is_push_data);
    const is_op_start = try allocator.alloc(u8, bitmap_size);
    defer allocator.free(is_op_start);
    const is_jumpdest = try allocator.alloc(u8, bitmap_size);
    defer allocator.free(is_jumpdest);
    
    @memset(is_push_data, 0);
    @memset(is_op_start, 0);
    @memset(is_jumpdest, 0);
    
    var plan = PlanMinimal{
        .bytecode = &bytecode,
        .is_push_data = is_push_data,
        .is_op_start = is_op_start,
        .is_jumpdest = is_jumpdest,
        .handlers = handlers,
    };
    defer plan.deinit(allocator);
    
    // Test PUSH1
    var idx: PlanMinimal.InstructionIndexType = 0;
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
    const PlanMinimal = createPlanMinimal(.{});
    
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
    
    // Allocate bitmaps
    const bitmap_size = (bytecode.len + 7) / 8;
    const is_push_data = try allocator.alloc(u8, bitmap_size);
    defer allocator.free(is_push_data);
    const is_op_start = try allocator.alloc(u8, bitmap_size);
    defer allocator.free(is_op_start);
    const is_jumpdest = try allocator.alloc(u8, bitmap_size);
    defer allocator.free(is_jumpdest);
    
    @memset(is_push_data, 0);
    @memset(is_op_start, 0);
    @memset(is_jumpdest, 0);
    
    var plan = PlanMinimal{
        .bytecode = &bytecode,
        .is_push_data = is_push_data,
        .is_op_start = is_op_start,
        .is_jumpdest = is_jumpdest,
        .handlers = handlers,
    };
    defer plan.deinit(allocator);
    
    // Start at PC 0 (PUSH1)
    var idx: PlanMinimal.InstructionIndexType = 0;
    
    // Get next after PUSH1 (should skip the data byte)
    const handler1 = plan.getNextInstruction(&idx, .PUSH1);
    try std.testing.expectEqual(@as(PlanMinimal.InstructionIndexType, 2), idx); // Should point to ADD
    try std.testing.expectEqual(@intFromPtr(&testHandler), @intFromPtr(handler1));
    
    // Get next after ADD
    const handler2 = plan.getNextInstruction(&idx, .ADD);
    try std.testing.expectEqual(@as(PlanMinimal.InstructionIndexType, 3), idx); // Should point to STOP
    try std.testing.expectEqual(@intFromPtr(&testHandler), @intFromPtr(handler2));
}

test "PlanMinimal PC metadata" {
    const allocator = std.testing.allocator;
    const PlanMinimal = createPlanMinimal(.{});
    
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
    
    // Allocate bitmaps
    const bitmap_size = (bytecode.len + 7) / 8;
    const is_push_data = try allocator.alloc(u8, bitmap_size);
    defer allocator.free(is_push_data);
    const is_op_start = try allocator.alloc(u8, bitmap_size);
    defer allocator.free(is_op_start);
    const is_jumpdest = try allocator.alloc(u8, bitmap_size);
    defer allocator.free(is_jumpdest);
    
    @memset(is_push_data, 0);
    @memset(is_op_start, 0);
    @memset(is_jumpdest, 0);
    
    var plan = PlanMinimal{
        .bytecode = &bytecode,
        .is_push_data = is_push_data,
        .is_op_start = is_op_start,
        .is_jumpdest = is_jumpdest,
        .handlers = handlers,
    };
    defer plan.deinit(allocator);
    
    // Test PC metadata returns current PC
    var idx: PlanMinimal.InstructionIndexType = 0;
    const pc_val = plan.getMetadata(&idx, .PC);
    try std.testing.expectEqual(@as(PlanMinimal.PcType, 0), pc_val);
    
    // Test from different PC
    idx = 1;
    const pc_val2 = plan.getMetadata(&idx, .PC);
    try std.testing.expectEqual(@as(PlanMinimal.PcType, 1), pc_val2);
}

test "PlanMinimal isValidJumpDest" {
    const allocator = std.testing.allocator;
    const PlanMinimal = createPlanMinimal(.{});
    
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
    
    // Allocate bitmaps
    const bitmap_size = (bytecode.len + 7) / 8;
    const is_push_data = try allocator.alloc(u8, bitmap_size);
    defer allocator.free(is_push_data);
    const is_op_start = try allocator.alloc(u8, bitmap_size);
    defer allocator.free(is_op_start);
    const is_jumpdest = try allocator.alloc(u8, bitmap_size);
    defer allocator.free(is_jumpdest);
    
    @memset(is_push_data, 0);
    @memset(is_op_start, 0);
    @memset(is_jumpdest, 0);
    
    // Mark JUMPDEST at position 3
    is_jumpdest[0] = 0b1000; // Bit 3 set
    
    var plan = PlanMinimal{
        .bytecode = &bytecode,
        .is_push_data = is_push_data,
        .is_op_start = is_op_start,
        .is_jumpdest = is_jumpdest,
        .handlers = handlers,
    };
    defer plan.deinit(allocator);
    
    // Test isValidJumpDest
    try std.testing.expect(!plan.isValidJumpDest(0)); // PUSH1
    try std.testing.expect(!plan.isValidJumpDest(1)); // push data
    try std.testing.expect(!plan.isValidJumpDest(2)); // JUMP
    try std.testing.expect(plan.isValidJumpDest(3)); // JUMPDEST
    try std.testing.expect(!plan.isValidJumpDest(4)); // STOP
    try std.testing.expect(!plan.isValidJumpDest(100)); // Out of bounds
}