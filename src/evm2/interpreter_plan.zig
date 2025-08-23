/// InterpreterPlan: Runtime data structure for the EVM interpreter.
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

/// Configuration for the interpreter plan.
pub const InterpreterPlanConfig = struct {
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

/// Factory function to create an InterpreterPlan type with the given configuration.
pub fn createInterpreterPlan(comptime cfg: InterpreterPlanConfig) type {
    comptime cfg.validate();
    const PcType = cfg.PcType();
    const InstructionIndexType = PcType; // Can only have as many instructions as PCs
    
    const InterpreterPlan = struct {
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
    
    return InterpreterPlan;
}
