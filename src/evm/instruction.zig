const std = @import("std");
const ExecutionError = @import("execution/execution_error.zig");
const ExecutionFunc = @import("execution_func.zig").ExecutionFunc;

// Execution-classification used by analysis helpers
pub const JumpType = enum { jump, jumpi, other };

// Packed instruction header: tag + id into per-variant payload arrays.
pub const Tag = enum(u8) {
    noop,
    word,
    jump_pc,
    jump_unresolved,
    conditional_jump_idx,
    conditional_jump_pc,
    conditional_jump_unresolved,
    conditional_jump_invalid,
    pc,
    block_info,
    dynamic_gas,
    exec,
};

// 32-bit packed header gives roomy id space while staying very compact
pub const Instruction = packed struct(u32) {
    tag: Tag,
    id: u24,
};

/// Comptime function that returns the struct type for a given tag
pub fn InstructionType(comptime tag: Tag) type {
    return switch (tag) {
        .noop => NoopInstruction,
        .jump_pc => JumpPcInstruction,
        .conditional_jump_unresolved => ConditionalJumpUnresolvedInstruction,
        .conditional_jump_invalid => ConditionalJumpInvalidInstruction,
        .exec => ExecInstruction,
        .conditional_jump_pc => ConditionalJumpPcInstruction,
        .word => WordInstruction,
        .pc => PcInstruction,
        .block_info => BlockInstruction,
        .dynamic_gas => DynamicGasInstruction,
        .jump_unresolved => unreachable, // Handled specially
        .conditional_jump_idx => unreachable, // Not used
    };
}

/// Returns the size category for a given tag
pub fn getInstructionSize(comptime tag: Tag) usize {
    return switch (tag) {
        .noop, .jump_pc, .conditional_jump_unresolved, .conditional_jump_invalid => 8,
        // 16-byte group
        // ExecInstruction (2 pointers)
        // ConditionalJumpPcInstruction (2 pointers)
        // PcInstruction (u16 + pointer, padded/aligned)
        // BlockInstruction (u32 + u16 + u16 + pointer)
        .exec, .conditional_jump_pc, .pc, .block_info => 16,
        // 24-byte group
        // DynamicGasInstruction (3 pointers)
        // WordInstruction (slice + pointer)
        .dynamic_gas, .word => 24,
        .jump_unresolved, .conditional_jump_idx => 0, // Special handling
    };
}

// Compact reference to bytes in analyzed contract `code`.
// - `start_pc` is the byte offset within `code`
// - `len` is the number of immediate bytes (0..32)
pub const WordRef = struct {
    start_pc: u16,
    len: u8,
    _pad: u8 = 0,
};

/// Block information for BEGINBLOCK instructions.
/// Contains pre-calculated validation data for an entire basic block.
pub const BlockInfo = struct {
    gas_cost: u32 = 0,
    stack_req: u16 = 0,
    stack_max_growth: u16 = 0,
};

/// Function signature for dynamic gas calculation.
pub const DynamicGasFunc = *const fn (frame: *anyopaque) ExecutionError.Error!u64;

/// Information for opcodes that have dynamic gas costs
pub const DynamicGas = struct {
    gas_fn: DynamicGasFunc,
    exec_fn: ExecutionFunc,
};

/// Execution instruction with pre-calculated next instruction pointer
pub const ExecInstruction = struct {
    exec_fn: ExecutionFunc,
    next_inst: *const Instruction,
};

/// Noop instruction with pre-calculated next instruction pointer
pub const NoopInstruction = struct {
    next_inst: *const Instruction,
};

/// Block instruction with validation data and pre-calculated next instruction
pub const BlockInstruction = struct {
    gas_cost: u32,
    stack_req: u16,
    stack_max_growth: u16,
    next_inst: *const Instruction,
};

/// Dynamic gas instruction with gas function, exec function, and pre-calculated next instruction
pub const DynamicGasInstruction = struct {
    gas_fn: DynamicGasFunc,
    exec_fn: ExecutionFunc,
    next_inst: *const Instruction,
};

/// Conditional jump to invalid destination with pre-calculated next instruction
pub const ConditionalJumpInvalidInstruction = struct {
    next_inst: *const Instruction,
};

/// PC instruction with pre-calculated PC value and next instruction
pub const PcInstruction = struct {
    pc_value: u16,
    next_inst: *const Instruction,
};

/// Conditional jump with known PC target and pre-calculated instruction pointers
pub const ConditionalJumpPcInstruction = struct {
    jump_target: *const Instruction, // where to jump if condition is true
    next_inst: *const Instruction, // where to go if condition is false (fall-through)
};

/// Word instruction with bytecode slice and next instruction
pub const WordInstruction = struct {
    word_bytes: []const u8, // Slice view into bytecode (1-32 bytes)
    next_inst: *const Instruction,
};

/// Jump PC instruction with pre-calculated jump target
pub const JumpPcInstruction = struct {
    jump_target: *const Instruction,
};

/// Conditional jump with unresolved target and pre-calculated fall-through
pub const ConditionalJumpUnresolvedInstruction = struct {
    next_inst: *const Instruction, // fall-through when condition is false
};

pub fn NoopHandler(context: *anyopaque) ExecutionError.Error!void {
    _ = context;
    return;
}
