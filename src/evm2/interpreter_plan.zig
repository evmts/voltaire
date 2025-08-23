/// InterpreterPlan: Runtime data structure for the EVM interpreter.
/// Contains the instruction stream (handler pointers + metadata) and constants.
const std = @import("std");
const opcode_data = @import("opcode_data.zig");
const Opcode = opcode_data.Opcode;

/// Synthetic opcodes for fused operations.
pub const PUSH_ADD_INLINE: u8 = 0xF5;
pub const PUSH_ADD_POINTER: u8 = 0xF6;
pub const PUSH_MUL_INLINE: u8 = 0xF7;
pub const PUSH_MUL_POINTER: u8 = 0xF8;
pub const PUSH_DIV_INLINE: u8 = 0xF9;
pub const PUSH_DIV_POINTER: u8 = 0xFA;
pub const PUSH_JUMP_INLINE: u8 = 0xFB;
pub const PUSH_JUMP_POINTER: u8 = 0xFC;
pub const PUSH_JUMPI_INLINE: u8 = 0xFD;
pub const PUSH_JUMPI_POINTER: u8 = 0xFE;

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
    pc_value: u32,
};

/// Instruction stream element for 64-bit platforms.
pub const InstructionElement64 = packed union {
    handler: *const HandlerFn,
    jumpdest_metadata: JumpDestMetadata,
    inline_value: u64,
    pointer_index: u64,
    pc_value: u64,
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
    
    /// Derived PC type based on max bytecode size.
    fn PcType(self: @This()) type {
        return if (self.maxBytecodeSize <= std.math.maxInt(u16)) u16 else u32;
    }
};

/// Factory function to create an InterpreterPlan type with the given configuration.
pub fn createInterpreterPlan(comptime cfg: InterpreterPlanConfig) type {
    const PcType = cfg.PcType();
    const InstructionIndexType = PcType; // Can only have as many instructions as PCs
    
    return struct {
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
            const op = if (@TypeOf(opcode) == Opcode) 
                opcode 
            else if (@typeInfo(@TypeOf(opcode)) == .enum_literal)
                @field(Opcode, @tagName(opcode))
            else 
                @as(Opcode, @enumFromInt(opcode));
            const MetadataType = switch (op) {
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
                else => blk2: {
                    // Check if it's a fusion opcode (passed as u8)
                    if (@TypeOf(opcode) == u8) {
                        const fusion_type = switch (opcode) {
                            // Fusion opcodes follow same pattern as their PUSH equivalent
                            PUSH_ADD_INLINE, PUSH_MUL_INLINE, PUSH_DIV_INLINE, 
                            PUSH_JUMP_INLINE, PUSH_JUMPI_INLINE => usize, // For simplicity, return usize for inline fusions
                            PUSH_ADD_POINTER, PUSH_MUL_POINTER, PUSH_DIV_POINTER,
                            PUSH_JUMP_POINTER, PUSH_JUMPI_POINTER => *const WordType,
                            else => @compileError("Fusion opcode has no metadata"),
                        };
                        break :blk2 fusion_type;
                    }
                    @compileError("Opcode has no metadata");
                },
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
                    .PC => @as(PcType, @truncate(metadata_elem.pc_value)),
                    
                    else => unreachable, // Compile error already prevents this
                };
            } else if (@TypeOf(opcode) == u8) {
                // Handle fusion opcodes (u8)
                return switch (opcode) {
                    PUSH_ADD_INLINE, PUSH_MUL_INLINE, PUSH_DIV_INLINE, 
                    PUSH_JUMP_INLINE, PUSH_JUMPI_INLINE => metadata_elem.inline_value,
                    PUSH_ADD_POINTER, PUSH_MUL_POINTER, PUSH_DIV_POINTER,
                    PUSH_JUMP_POINTER, PUSH_JUMPI_POINTER => blk: {
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
            
            const op = if (@TypeOf(opcode) == Opcode) 
                opcode 
            else if (@typeInfo(@TypeOf(opcode)) == .enum_literal)
                @field(Opcode, @tagName(opcode))
            else 
                @as(Opcode, @enumFromInt(opcode));
            const has_metadata = switch (op) {
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
            
            // Also check for fusion opcodes if it's a u8
            const fusion_has_metadata = if (@TypeOf(opcode) == u8) switch (opcode) {
                PUSH_ADD_INLINE, PUSH_ADD_POINTER,
                PUSH_MUL_INLINE, PUSH_MUL_POINTER,
                PUSH_DIV_INLINE, PUSH_DIV_POINTER,
                PUSH_JUMP_INLINE, PUSH_JUMP_POINTER,
                PUSH_JUMPI_INLINE, PUSH_JUMPI_POINTER => true,
                else => false,
            } else false;
            
            if (has_metadata or fusion_has_metadata) {
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
}