const std = @import("std");
const ExecutionError = @import("execution/execution_error.zig");
const ExecutionFunc = @import("execution_func.zig").ExecutionFunc;

pub const JumpType = enum {
    jump, // Unconditional jump (JUMP)
    jumpi, // Conditional jump (JUMPI)
    other, // Non-jump/default
};

pub const JumpTarget = struct {
    jump_type: JumpType,
};

/// Analysis-time argument carried alongside each instruction in the stream.
/// This drives optimized execution without per-opcode decoding.
pub const AnalysisArg = union(enum) {
    none,
    word: u256,
    // Unconditional jump variants
    jump, // resolved: pop 1; jump to next_instruction (pre-wired)
    jump_unresolved, // unresolved: pop 1; compute target at runtime
    // Fused immediate jump variants (PUSH removed)
    jump_pc: u256, // known target PC; will be resolved to .jump in resolve phase
    // Conditional jump variants
    conditional_jump: *const Instruction, // resolved true branch target
    conditional_jump_unresolved, // unresolved: compute target at runtime when condition true
    conditional_jump_invalid, // analysis-validated invalid JUMPDEST; interpreter errors if condition true
    block_info: BlockInfo,
    dynamic_gas: DynamicGas,
    keccak: struct {
        word_count: u64,
        gas_cost: u64,
        size: ?u64 = null,
    },
};

/// Block information for BEGINBLOCK instructions.
/// Contains pre-calculated validation data for an entire basic block.
pub const BlockInfo = struct {
    /// Total static gas cost for all instructions in the block
    gas_cost: u32 = 0,
    /// Minimum stack height required to execute entire block
    stack_req: u16 = 0,
    /// Maximum stack growth during block execution
    stack_max_growth: u16 = 0,
};

/// Function signature for dynamic gas calculation.
/// Takes a frame and returns the additional gas cost to charge.
/// This is used for opcodes with runtime-dependent gas costs.
pub const DynamicGasFunc = *const fn (frame: *anyopaque) ExecutionError.Error!u64;

/// Information for opcodes that have dynamic gas costs
pub const DynamicGas = struct {
    /// Static gas cost to charge first
    static_cost: u32,
    /// Function to calculate additional dynamic gas
    gas_fn: ?DynamicGasFunc,
};

pub const Instruction = struct {
    opcode_fn: ExecutionFunc,
    arg: AnalysisArg,
    next_instruction: *const Instruction = undefined,

    pub const STOP: Instruction = .{ .opcode_fn = StopHandler, .arg = .none };
};

fn StopHandler(context: *anyopaque) ExecutionError.Error!void {
    _ = context;
    return ExecutionError.Error.STOP;
}

pub fn NoopHandler(context: *anyopaque) ExecutionError.Error!void {
    _ = context;
    return;
}
