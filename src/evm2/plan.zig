/// Plan: Runtime data structure for the EVM interpreter.
/// Contains the instruction stream (handler pointers + metadata) and constants.
const std = @import("std");
const opcode_data = @import("opcode_data.zig");
const Opcode = opcode_data.Opcode;

/// Synthetic opcodes for fused operations.
/// These values are chosen to avoid conflicts with standard EVM opcodes.
/// The compile-time check below ensures no conflicts exist.
pub const SyntheticOpcode = enum(u8) {
    PUSH_ADD_INLINE = 0xB0,
    PUSH_ADD_POINTER = 0xB1,
    PUSH_MUL_INLINE = 0xB2,
    PUSH_MUL_POINTER = 0xB3,
    PUSH_DIV_INLINE = 0xB4,
    PUSH_DIV_POINTER = 0xB5,
    PUSH_JUMP_INLINE = 0xB6,
    PUSH_JUMP_POINTER = 0xB7,
    PUSH_JUMPI_INLINE = 0xB8,
    PUSH_JUMPI_POINTER = 0xB9,
};


// Compile-time check to ensure synthetic opcodes don't overlap with normal opcodes
comptime {
    @setEvalBranchQuota(10000);
    for (@typeInfo(SyntheticOpcode).@"enum".fields) |syn_field| {
        // Try to convert the synthetic opcode value to a regular Opcode
        if (std.meta.intToEnum(Opcode, syn_field.value) catch null) |conflicting_opcode| {
            @compileError(std.fmt.comptimePrint(
                "Synthetic opcode {s} (0x{X}) conflicts with normal opcode {s}",
                .{ syn_field.name, syn_field.value, @tagName(conflicting_opcode) }
            ));
        } 
    }
}

/// Metadata for JUMPDEST instructions.
/// On 64-bit systems this fits in usize, on 32-bit it requires pointer.
pub const JumpDestMetadata = packed struct {
    gas: u32,
    min_stack: i16,
    max_stack: i16,
};

/// Handler function type for instruction execution.
/// Takes frame, plan, and instruction index. Uses tail call recursion.
pub const HandlerFn = fn (frame: *anyopaque, plan: *const anyopaque, idx: *anyopaque) anyerror!noreturn;

/// Instruction stream element for 32-bit platforms.
pub const InstructionElement32 = packed union {
    handler: *const HandlerFn,
    jumpdest_pointer: *const JumpDestMetadata,
    inline_value: u32,
    pointer_index: u32,
};

/// Instruction stream element for 64-bit platforms.
pub const InstructionElement64 = packed union {
    handler: *const HandlerFn,
    jumpdest_metadata: JumpDestMetadata,
    inline_value: u64,
    pointer_index: u64,
};

/// Platform-specific instruction element selection.
pub const InstructionElement = if (@sizeOf(usize) == 8)
    InstructionElement64
else if (@sizeOf(usize) == 4)
    InstructionElement32
else
    @compileError("Unsupported platform: usize must be 32 or 64 bits");

// Compile-time verification
comptime {
    if (@sizeOf(InstructionElement) != @sizeOf(usize)) {
        @compileError("InstructionElement must be exactly usize-sized");
    }
}

/// Configuration for the plan.
pub const PlanConfig = struct {
    /// Word type for the EVM (typically u256).
    WordType: type = u256,
    /// Maximum bytecode size (determines PcType).
    maxBytecodeSize: u32 = 24_576,
    
    /// Validate configuration at compile time.
    fn validate(self: @This()) void {
        if (@bitSizeOf(self.WordType) > 512) @compileError("WordType cannot exceed u512");
        if (self.maxBytecodeSize > 65535) @compileError("maxBytecodeSize must be <= 65535");
        if (self.maxBytecodeSize == 0) @compileError("maxBytecodeSize must be greater than 0");
    }
    
    /// Derived PC type based on max bytecode size.
    fn PcType(self: @This()) type {
        return if (self.maxBytecodeSize <= std.math.maxInt(u16)) u16 else u32;
    }
};

/// Factory function to create a Plan type with the given configuration.
pub fn createPlan(comptime cfg: PlanConfig) type {
    comptime cfg.validate();
    const PcType = cfg.PcType();
    const InstructionIndexType = PcType; // Can only have as many instructions as PCs
    
    const Plan = struct {
        const Self = @This();
        
        /// Expose types for external use.
        pub const PcTypeT = PcType;
        pub const InstructionIndexT = InstructionIndexType;
        pub const WordType = cfg.WordType;
        
        /// The instruction stream - mostly handler pointers with inline metadata.
        instructionStream: []InstructionElement,
        /// Constants array for values too large to fit inline.
        u256_constants: []WordType,
        
        /// Get metadata for opcodes that have it, properly typed based on the opcode.
        /// Returns the metadata at idx+1 and advances idx by 2.
        pub fn getMetadata(
            self: *const Self,
            idx: *InstructionIndexType,
            comptime opcode: anytype,
        ) blk: {
            // Determine if this is a synthetic opcode or regular opcode
            const is_synthetic = if (@TypeOf(opcode) == u8) blk2: {
                const val = opcode;
                // Check against known synthetic opcode values at compile time
                break :blk2 switch (val) {
                    @intFromEnum(SyntheticOpcode.PUSH_ADD_INLINE), @intFromEnum(SyntheticOpcode.PUSH_ADD_POINTER),
                    @intFromEnum(SyntheticOpcode.PUSH_MUL_INLINE), @intFromEnum(SyntheticOpcode.PUSH_MUL_POINTER),
                    @intFromEnum(SyntheticOpcode.PUSH_DIV_INLINE), @intFromEnum(SyntheticOpcode.PUSH_DIV_POINTER),
                    @intFromEnum(SyntheticOpcode.PUSH_JUMP_INLINE), @intFromEnum(SyntheticOpcode.PUSH_JUMP_POINTER),
                    @intFromEnum(SyntheticOpcode.PUSH_JUMPI_INLINE), @intFromEnum(SyntheticOpcode.PUSH_JUMPI_POINTER) => true,
                    else => false,
                };
            } else false;
            
            const MetadataType = if (is_synthetic) blk2: {
                // Handle synthetic opcodes
                const val = @as(u8, opcode);
                const fusion_type = switch (val) {
                    // Fusion opcodes follow same pattern as their PUSH equivalent
                    @intFromEnum(SyntheticOpcode.PUSH_ADD_INLINE), @intFromEnum(SyntheticOpcode.PUSH_MUL_INLINE), @intFromEnum(SyntheticOpcode.PUSH_DIV_INLINE), 
                    @intFromEnum(SyntheticOpcode.PUSH_JUMP_INLINE), @intFromEnum(SyntheticOpcode.PUSH_JUMPI_INLINE) => usize, // For simplicity, return usize for inline fusions
                    @intFromEnum(SyntheticOpcode.PUSH_ADD_POINTER), @intFromEnum(SyntheticOpcode.PUSH_MUL_POINTER), @intFromEnum(SyntheticOpcode.PUSH_DIV_POINTER),
                    @intFromEnum(SyntheticOpcode.PUSH_JUMP_POINTER), @intFromEnum(SyntheticOpcode.PUSH_JUMPI_POINTER) => *const WordType,
                    else => @compileError("Unknown synthetic opcode"),
                };
                break :blk2 fusion_type;
            } else blk2: {
                // Handle regular opcodes
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
                // Larger PUSH opcodes return pointer to u256 or inline based on platform
                .PUSH9, .PUSH10, .PUSH11, .PUSH12, .PUSH13, .PUSH14, .PUSH15, .PUSH16 => if (@sizeOf(usize) >= 16) u128 else *const WordType,
                .PUSH17, .PUSH18, .PUSH19, .PUSH20, .PUSH21, .PUSH22, .PUSH23, .PUSH24,
                .PUSH25, .PUSH26, .PUSH27, .PUSH28, .PUSH29, .PUSH30, .PUSH31, .PUSH32 => *const WordType,
                
                // JUMPDEST returns metadata struct or pointer
                .JUMPDEST => if (@sizeOf(usize) >= @sizeOf(JumpDestMetadata))
                    JumpDestMetadata
                else
                    *const JumpDestMetadata,
                
                // PC returns the original PC value
                .PC => PcType,
                
                // All other opcodes have no metadata
                else => @compileError("Opcode has no metadata"),
                };
                break :blk2 MetadataType2;
            };
            break :blk MetadataType;
        } {
            const current_idx = idx.*;
            const metadata_elem = self.instructionStream[current_idx + 1];
            idx.* += 2;
            
            // Handle regular opcodes
            if (@TypeOf(opcode) == Opcode or @typeInfo(@TypeOf(opcode)) == .enum_literal) {
                const actual_op = if (@TypeOf(opcode) == Opcode) 
                    opcode 
                else 
                    @field(Opcode, @tagName(opcode));
                return switch (actual_op) {
                    // PUSH opcodes return the inline value with correct type
                    .PUSH1 => @as(u8, @truncate(metadata_elem.inline_value)),
                    .PUSH2 => @as(u16, @truncate(metadata_elem.inline_value)),
                    .PUSH3 => @as(u24, @truncate(metadata_elem.inline_value)),
                    .PUSH4 => @as(u32, @truncate(metadata_elem.inline_value)),
                    .PUSH5 => @as(u40, @truncate(metadata_elem.inline_value)),
                    .PUSH6 => @as(u48, @truncate(metadata_elem.inline_value)),
                    .PUSH7 => @as(u56, @truncate(metadata_elem.inline_value)),
                    .PUSH8 => @as(u64, @truncate(metadata_elem.inline_value)),
                    
                    // Larger PUSH opcodes
                    .PUSH9, .PUSH10, .PUSH11, .PUSH12, .PUSH13, .PUSH14, .PUSH15, .PUSH16 => {
                        if (@sizeOf(usize) >= 16) {
                            return @as(u128, @truncate(metadata_elem.inline_value));
                        } else {
                            const idx_val = metadata_elem.pointer_index;
                            return &self.u256_constants[idx_val];
                        }
                    },
                    .PUSH17, .PUSH18, .PUSH19, .PUSH20, .PUSH21, .PUSH22, .PUSH23, .PUSH24,
                    .PUSH25, .PUSH26, .PUSH27, .PUSH28, .PUSH29, .PUSH30, .PUSH31, .PUSH32 => {
                        const idx_val = metadata_elem.pointer_index;
                        return &self.u256_constants[idx_val];
                    },
                    
                    // JUMPDEST returns the metadata directly or via pointer
                    .JUMPDEST => if (@sizeOf(usize) >= @sizeOf(JumpDestMetadata))
                        metadata_elem.jumpdest_metadata
                    else
                        metadata_elem.jumpdest_pointer,
                    
                    // PC returns the PC value
                    .PC => @as(PcType, @truncate(metadata_elem.inline_value)),
                    
                    else => unreachable, // Compile error already prevents this
                };
            } else if (@TypeOf(opcode) == u8) {
                // Handle fusion opcodes (u8)
                return switch (opcode) {
                    @intFromEnum(SyntheticOpcode.PUSH_ADD_INLINE), @intFromEnum(SyntheticOpcode.PUSH_MUL_INLINE), @intFromEnum(SyntheticOpcode.PUSH_DIV_INLINE), 
                    @intFromEnum(SyntheticOpcode.PUSH_JUMP_INLINE), @intFromEnum(SyntheticOpcode.PUSH_JUMPI_INLINE) => metadata_elem.inline_value,
                    @intFromEnum(SyntheticOpcode.PUSH_ADD_POINTER), @intFromEnum(SyntheticOpcode.PUSH_MUL_POINTER), @intFromEnum(SyntheticOpcode.PUSH_DIV_POINTER),
                    @intFromEnum(SyntheticOpcode.PUSH_JUMP_POINTER), @intFromEnum(SyntheticOpcode.PUSH_JUMPI_POINTER) => blk: {
                        const idx_val = metadata_elem.pointer_index;
                        break :blk &self.u256_constants[idx_val];
                    },
                    else => unreachable,
                };
            } else {
                @compileError("Unexpected opcode type");
            }
        }
        
        /// Get the next instruction handler and advance the instruction pointer.
        /// Advances by 1 or 2 based on whether the opcode has metadata.
        pub fn getNextInstruction(
            self: *const Self,
            idx: *InstructionIndexType,
            comptime opcode: anytype,
        ) *const HandlerFn {
            const current_idx = idx.*;
            const handler = self.instructionStream[current_idx].handler;
            
            // Check if it's a synthetic opcode
            const is_synthetic = if (@TypeOf(opcode) == u8) blk2: {
                const val = opcode;
                // Check against known synthetic opcode values at compile time
                break :blk2 switch (val) {
                    @intFromEnum(SyntheticOpcode.PUSH_ADD_INLINE), @intFromEnum(SyntheticOpcode.PUSH_ADD_POINTER),
                    @intFromEnum(SyntheticOpcode.PUSH_MUL_INLINE), @intFromEnum(SyntheticOpcode.PUSH_MUL_POINTER),
                    @intFromEnum(SyntheticOpcode.PUSH_DIV_INLINE), @intFromEnum(SyntheticOpcode.PUSH_DIV_POINTER),
                    @intFromEnum(SyntheticOpcode.PUSH_JUMP_INLINE), @intFromEnum(SyntheticOpcode.PUSH_JUMP_POINTER),
                    @intFromEnum(SyntheticOpcode.PUSH_JUMPI_INLINE), @intFromEnum(SyntheticOpcode.PUSH_JUMPI_POINTER) => true,
                    else => false,
                };
            } else false;
            
            const has_metadata = if (is_synthetic) blk2: {
                // All synthetic opcodes have metadata
                break :blk2 true;
            } else blk2: {
                const op = if (@TypeOf(opcode) == Opcode) 
                    opcode 
                else if (@typeInfo(@TypeOf(opcode)) == .enum_literal)
                    @field(Opcode, @tagName(opcode))
                else 
                    @compileError("Invalid opcode type");
                const result = switch (op) {
                // PUSH opcodes have metadata (except PUSH0)
                .PUSH1, .PUSH2, .PUSH3, .PUSH4, .PUSH5, .PUSH6, .PUSH7,
                .PUSH8, .PUSH9, .PUSH10, .PUSH11, .PUSH12, .PUSH13, .PUSH14, .PUSH15,
                .PUSH16, .PUSH17, .PUSH18, .PUSH19, .PUSH20, .PUSH21, .PUSH22, .PUSH23,
                .PUSH24, .PUSH25, .PUSH26, .PUSH27, .PUSH28, .PUSH29, .PUSH30, .PUSH31,
                .PUSH32,
                // JUMPDEST has metadata
                .JUMPDEST,
                // PC has metadata (the original PC value)
                .PC => true,
                // All other opcodes including PUSH0 have no metadata
                else => false,
                };
                break :blk2 result;
            };
            
            if (has_metadata) {
                idx.* += 2;
            } else {
                idx.* += 1;
            }
            
            return handler;
        }
        
        /// Free Plan-owned slices.
        pub fn deinit(self: *Self, allocator: std.mem.Allocator) void {
            if (self.instructionStream.len > 0) allocator.free(self.instructionStream);
            if (self.u256_constants.len > 0) allocator.free(self.u256_constants);
            self.instructionStream = &.{};
            self.u256_constants = &.{};
        }
    };
    
    return Plan;
}

// Test handler function that does nothing (for testing)
fn testHandler(frame: *anyopaque, plan: *const anyopaque, idx: *anyopaque) anyerror!noreturn {
    _ = frame;
    _ = plan;
    _ = idx;
    unreachable; // Test handlers don't actually execute
}

test "SyntheticOpcode values are unique and non-conflicting" {
    // Test that all synthetic opcodes have unique values
    const opcodes = [_]u8{
        @intFromEnum(SyntheticOpcode.PUSH_ADD_INLINE),
        @intFromEnum(SyntheticOpcode.PUSH_ADD_POINTER),
        @intFromEnum(SyntheticOpcode.PUSH_MUL_INLINE),
        @intFromEnum(SyntheticOpcode.PUSH_MUL_POINTER),
        @intFromEnum(SyntheticOpcode.PUSH_DIV_INLINE),
        @intFromEnum(SyntheticOpcode.PUSH_DIV_POINTER),
        @intFromEnum(SyntheticOpcode.PUSH_JUMP_INLINE),
        @intFromEnum(SyntheticOpcode.PUSH_JUMP_POINTER),
        @intFromEnum(SyntheticOpcode.PUSH_JUMPI_INLINE),
        @intFromEnum(SyntheticOpcode.PUSH_JUMPI_POINTER),
    };
    
    // Check for duplicates
    for (opcodes, 0..) |op1, i| {
        for (opcodes[i+1..]) |op2| {
            try std.testing.expect(op1 != op2);
        }
    }
    
    // Verify expected values
    try std.testing.expectEqual(@as(u8, 0xB0), @intFromEnum(SyntheticOpcode.PUSH_ADD_INLINE));
    try std.testing.expectEqual(@as(u8, 0xB1), @intFromEnum(SyntheticOpcode.PUSH_ADD_POINTER));
    try std.testing.expectEqual(@as(u8, 0xB2), @intFromEnum(SyntheticOpcode.PUSH_MUL_INLINE));
    try std.testing.expectEqual(@as(u8, 0xB3), @intFromEnum(SyntheticOpcode.PUSH_MUL_POINTER));
    try std.testing.expectEqual(@as(u8, 0xB4), @intFromEnum(SyntheticOpcode.PUSH_DIV_INLINE));
    try std.testing.expectEqual(@as(u8, 0xB5), @intFromEnum(SyntheticOpcode.PUSH_DIV_POINTER));
    try std.testing.expectEqual(@as(u8, 0xB6), @intFromEnum(SyntheticOpcode.PUSH_JUMP_INLINE));
    try std.testing.expectEqual(@as(u8, 0xB7), @intFromEnum(SyntheticOpcode.PUSH_JUMP_POINTER));
    try std.testing.expectEqual(@as(u8, 0xB8), @intFromEnum(SyntheticOpcode.PUSH_JUMPI_INLINE));
    try std.testing.expectEqual(@as(u8, 0xB9), @intFromEnum(SyntheticOpcode.PUSH_JUMPI_POINTER));
}

test "JumpDestMetadata size and alignment" {
    // Test that JumpDestMetadata is properly packed
    try std.testing.expectEqual(@as(usize, 8), @sizeOf(JumpDestMetadata));
    // On some platforms, packed structs might have larger alignment than expected
    // Just verify it's a power of 2 and reasonable
    const align_val = @alignOf(JumpDestMetadata);
    try std.testing.expect(align_val >= 1 and align_val <= 8);
    // Check if it's a power of 2
    try std.testing.expect((align_val & (align_val - 1)) == 0);
    
    // Test field offsets
    try std.testing.expectEqual(@as(usize, 0), @offsetOf(JumpDestMetadata, "gas"));
    try std.testing.expectEqual(@as(usize, 4), @offsetOf(JumpDestMetadata, "min_stack"));
    try std.testing.expectEqual(@as(usize, 6), @offsetOf(JumpDestMetadata, "max_stack"));
}

test "InstructionElement size equals usize" {
    try std.testing.expectEqual(@sizeOf(usize), @sizeOf(InstructionElement));
    
    if (@sizeOf(usize) == 8) {
        try std.testing.expectEqual(@sizeOf(InstructionElement64), @sizeOf(InstructionElement));
    } else if (@sizeOf(usize) == 4) {
        try std.testing.expectEqual(@sizeOf(InstructionElement32), @sizeOf(InstructionElement));
    }
}

test "PlanConfig validation" {
    // Valid configs should not cause compile errors
    const valid_cfg = PlanConfig{
        .WordType = u256,
        .maxBytecodeSize = 24_576,
    };
    comptime valid_cfg.validate();
    
    // Test PcType selection
    const small_cfg = PlanConfig{
        .maxBytecodeSize = 100,
    };
    try std.testing.expectEqual(u16, small_cfg.PcType());
    
    const large_cfg = PlanConfig{
        .maxBytecodeSize = 65_535,
    };
    try std.testing.expectEqual(u16, large_cfg.PcType());
}

test "Plan getMetadata for PUSH opcodes" {
    const allocator = std.testing.allocator;
    const Plan = createPlan(.{});
    
    // Create a plan with test data
    var stream = std.ArrayList(InstructionElement).init(allocator);
    defer stream.deinit();
    
    // PUSH1 with value 42
    try stream.append(.{ .handler = &testHandler });
    try stream.append(.{ .inline_value = 42 });
    
    // PUSH2 with value 0x1234
    try stream.append(.{ .handler = &testHandler });
    try stream.append(.{ .inline_value = 0x1234 });
    
    // PUSH8 with max value
    try stream.append(.{ .handler = &testHandler });
    try stream.append(.{ .inline_value = std.math.maxInt(u64) });
    
    var plan = Plan{
        .instructionStream = try stream.toOwnedSlice(),
        .u256_constants = &.{},
    };
    defer plan.deinit(allocator);
    
    // Test PUSH1
    var idx: Plan.InstructionIndexT = 0;
    const push1_val = plan.getMetadata(&idx, .PUSH1);
    try std.testing.expectEqual(@as(u8, 42), push1_val);
    try std.testing.expectEqual(@as(Plan.InstructionIndexT, 2), idx);
    
    // Test PUSH2
    const push2_val = plan.getMetadata(&idx, .PUSH2);
    try std.testing.expectEqual(@as(u16, 0x1234), push2_val);
    try std.testing.expectEqual(@as(Plan.InstructionIndexT, 4), idx);
    
    // Test PUSH8
    const push8_val = plan.getMetadata(&idx, .PUSH8);
    try std.testing.expectEqual(@as(u64, std.math.maxInt(u64)), push8_val);
    try std.testing.expectEqual(@as(Plan.InstructionIndexT, 6), idx);
}

test "Plan getMetadata for large PUSH opcodes" {
    const allocator = std.testing.allocator;
    const Plan = createPlan(.{});
    
    // Create constants array
    var constants = try allocator.alloc(Plan.WordType, 2);
    defer allocator.free(constants);
    constants[0] = 0x123456789ABCDEF0123456789ABCDEF0;
    constants[1] = std.math.maxInt(u256);
    
    // Create instruction stream
    var stream = std.ArrayList(InstructionElement).init(allocator);
    defer stream.deinit();
    
    // PUSH32 pointing to constants[0]
    try stream.append(.{ .handler = &testHandler });
    try stream.append(.{ .pointer_index = 0 });
    
    // PUSH32 pointing to constants[1]
    try stream.append(.{ .handler = &testHandler });
    try stream.append(.{ .pointer_index = 1 });
    
    var plan = Plan{
        .instructionStream = try stream.toOwnedSlice(),
        .u256_constants = constants,
    };
    defer {
        allocator.free(plan.instructionStream);
        plan.instructionStream = &.{};
        plan.u256_constants = &.{};
    }
    
    // Test PUSH32
    var idx: Plan.InstructionIndexT = 0;
    const push32_ptr = plan.getMetadata(&idx, .PUSH32);
    try std.testing.expectEqual(@as(u256, 0x123456789ABCDEF0123456789ABCDEF0), push32_ptr.*);
    try std.testing.expectEqual(@as(Plan.InstructionIndexT, 2), idx);
    
    // Test another PUSH32
    const push32_ptr2 = plan.getMetadata(&idx, .PUSH32);
    try std.testing.expectEqual(std.math.maxInt(u256), push32_ptr2.*);
    try std.testing.expectEqual(@as(Plan.InstructionIndexT, 4), idx);
}

test "Plan getMetadata for JUMPDEST" {
    const allocator = std.testing.allocator;
    const Plan = createPlan(.{});
    
    var stream = std.ArrayList(InstructionElement).init(allocator);
    defer stream.deinit();
    
    const metadata = JumpDestMetadata{
        .gas = 100,
        .min_stack = 2,
        .max_stack = 5,
    };
    
    // On 64-bit platforms, metadata fits inline
    if (@sizeOf(usize) >= @sizeOf(JumpDestMetadata)) {
        try stream.append(.{ .handler = &testHandler });
        try stream.append(.{ .jumpdest_metadata = metadata });
        
        var plan = Plan{
            .instructionStream = try stream.toOwnedSlice(),
            .u256_constants = &.{},
        };
        defer plan.deinit(allocator);
        
        var idx: Plan.InstructionIndexT = 0;
        const jumpdest_meta = plan.getMetadata(&idx, .JUMPDEST);
        try std.testing.expectEqual(metadata.gas, jumpdest_meta.gas);
        try std.testing.expectEqual(metadata.min_stack, jumpdest_meta.min_stack);
        try std.testing.expectEqual(metadata.max_stack, jumpdest_meta.max_stack);
        try std.testing.expectEqual(@as(Plan.InstructionIndexT, 2), idx);
    }
}

test "Plan getMetadata for PC opcode" {
    const allocator = std.testing.allocator;
    const Plan = createPlan(.{});
    
    var stream = std.ArrayList(InstructionElement).init(allocator);
    defer stream.deinit();
    
    // PC with value 1234
    try stream.append(.{ .handler = &testHandler });
    try stream.append(.{ .inline_value = 1234 });
    
    var plan = Plan{
        .instructionStream = try stream.toOwnedSlice(),
        .u256_constants = &.{},
    };
    defer plan.deinit(allocator);
    
    var idx: Plan.InstructionIndexT = 0;
    const pc_val = plan.getMetadata(&idx, .PC);
    try std.testing.expectEqual(@as(Plan.PcTypeT, 1234), pc_val);
    try std.testing.expectEqual(@as(Plan.InstructionIndexT, 2), idx);
}

test "Plan getMetadata for synthetic opcodes" {
    const allocator = std.testing.allocator;
    const Plan = createPlan(.{});
    
    // Create constants
    var constants = try allocator.alloc(Plan.WordType, 1);
    defer allocator.free(constants);
    constants[0] = 0xDEADBEEF;
    
    var stream = std.ArrayList(InstructionElement).init(allocator);
    defer stream.deinit();
    
    // PUSH_ADD_INLINE with inline value
    try stream.append(.{ .handler = &testHandler });
    try stream.append(.{ .inline_value = 999 });
    
    // PUSH_MUL_POINTER pointing to constant
    try stream.append(.{ .handler = &testHandler });
    try stream.append(.{ .pointer_index = 0 });
    
    var plan = Plan{
        .instructionStream = try stream.toOwnedSlice(),
        .u256_constants = constants,
    };
    defer {
        allocator.free(plan.instructionStream);
        plan.instructionStream = &.{};
        plan.u256_constants = &.{};
    }
    
    // Test PUSH_ADD_INLINE
    var idx: Plan.InstructionIndexT = 0;
    const inline_val = plan.getMetadata(&idx, @intFromEnum(SyntheticOpcode.PUSH_ADD_INLINE));
    try std.testing.expectEqual(@as(usize, 999), inline_val);
    try std.testing.expectEqual(@as(Plan.InstructionIndexT, 2), idx);
    
    // Test PUSH_MUL_POINTER
    const ptr_val = plan.getMetadata(&idx, @intFromEnum(SyntheticOpcode.PUSH_MUL_POINTER));
    try std.testing.expectEqual(@as(u256, 0xDEADBEEF), ptr_val.*);
    try std.testing.expectEqual(@as(Plan.InstructionIndexT, 4), idx);
}

test "Plan getNextInstruction without metadata" {
    const allocator = std.testing.allocator;
    const Plan = createPlan(.{});
    
    var stream = std.ArrayList(InstructionElement).init(allocator);
    defer stream.deinit();
    
    // ADD opcode (no metadata)
    try stream.append(.{ .handler = &testHandler });
    // Another opcode
    const handler2: *const HandlerFn = &testHandler;
    try stream.append(.{ .handler = handler2 });
    
    var plan = Plan{
        .instructionStream = try stream.toOwnedSlice(),
        .u256_constants = &.{},
    };
    defer plan.deinit(allocator);
    
    // Test opcode without metadata
    var idx: Plan.InstructionIndexT = 0;
    const handler = plan.getNextInstruction(&idx, .ADD);
    try std.testing.expectEqual(&testHandler, handler);
    try std.testing.expectEqual(@as(Plan.InstructionIndexT, 1), idx);
}

test "Plan getNextInstruction with metadata" {
    const allocator = std.testing.allocator;
    const Plan = createPlan(.{});
    
    var stream = std.ArrayList(InstructionElement).init(allocator);
    defer stream.deinit();
    
    // PUSH1 with metadata
    try stream.append(.{ .handler = &testHandler });
    try stream.append(.{ .inline_value = 42 });
    // Next instruction
    const handler2: *const HandlerFn = &testHandler;
    try stream.append(.{ .handler = handler2 });
    
    var plan = Plan{
        .instructionStream = try stream.toOwnedSlice(),
        .u256_constants = &.{},
    };
    defer plan.deinit(allocator);
    
    // Test opcode with metadata
    var idx: Plan.InstructionIndexT = 0;
    const handler = plan.getNextInstruction(&idx, .PUSH1);
    try std.testing.expectEqual(&testHandler, handler);
    try std.testing.expectEqual(@as(Plan.InstructionIndexT, 2), idx);
}

test "Plan deinit" {
    const allocator = std.testing.allocator;
    const Plan = createPlan(.{});
    
    var plan = Plan{
        .instructionStream = try allocator.alloc(InstructionElement, 10),
        .u256_constants = try allocator.alloc(Plan.WordType, 5),
    };
    
    // Fill with dummy data
    for (plan.instructionStream) |*elem| {
        elem.* = .{ .handler = &testHandler };
    }
    for (plan.u256_constants) |*val| {
        val.* = 0;
    }
    
    // Deinit should free both arrays
    plan.deinit(allocator);
    try std.testing.expectEqual(@as(usize, 0), plan.instructionStream.len);
    try std.testing.expectEqual(@as(usize, 0), plan.u256_constants.len);
}

test "Plan with different WordType" {
    const Plan128 = createPlan(.{ .WordType = u128 });
    try std.testing.expectEqual(u128, Plan128.WordType);
    
    const Plan512 = createPlan(.{ .WordType = u512 });
    try std.testing.expectEqual(u512, Plan512.WordType);
}

test "Plan PcType selection based on maxBytecodeSize" {
    const SmallPlan = createPlan(.{ .maxBytecodeSize = 1000 });
    try std.testing.expectEqual(u16, SmallPlan.PcTypeT);
    try std.testing.expectEqual(u16, SmallPlan.InstructionIndexT);
    
    const LargePlan = createPlan(.{ .maxBytecodeSize = 65535 });
    try std.testing.expectEqual(u16, LargePlan.PcTypeT);
    try std.testing.expectEqual(u16, LargePlan.InstructionIndexT);
}
