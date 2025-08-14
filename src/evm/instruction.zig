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
    /// Compact reference to PUSH-immediate bytes within original `code`.
    /// Using a packed reference avoids a 16-byte slice and shrinks AnalysisArg
    /// to fit within 16 bytes on 64-bit targets.
    word: WordRef,
    // Unconditional jump variants
    jump, // resolved: pop 1; jump to next_instruction (pre-wired)
    jump_unresolved, // unresolved: pop 1; compute target at runtime
    // Fused immediate jump variants are resolved during analysis; no PC stored at runtime
    // Conditional jump variants
    conditional_jump: *const Instruction, // resolved true branch target
    conditional_jump_unresolved, // unresolved: compute target at runtime when condition true
    conditional_jump_invalid, // analysis-validated invalid JUMPDEST; interpreter errors if condition true
    /// PC immediate value (program counter) for the PC opcode
    pc: u32,
    block_info: BlockInfo,
    dynamic_gas: DynamicGas,
};

/// Compact reference to bytes in analyzed contract `code`.
/// - `start_pc` is the byte offset within `code`
/// - `len` is the number of immediate bytes (0..32)
pub const WordRef = struct {
    start_pc: u16,
    len: u8,
    _pad: u8 = 0,
};

/// Convert the `.word` reference (big-endian) into a u256 value using `code`.
pub fn word_as_256(self: AnalysisArg, code: []const u8) u256 {
    switch (self) {
        .word => |wr| {
            var v: u256 = 0;
            var i: usize = 0;
            const start: usize = wr.start_pc;
            const end: usize = @min(start + wr.len, code.len);
            while (i < (end - start)) : (i += 1) v = (v << 8) | code[start + i];
            return v;
        },
        else => return 0,
    }
}

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
    /// Function to calculate additional dynamic gas
    gas_fn: ?DynamicGasFunc,
};

pub const Instruction = struct {
    arg: AnalysisArg,
    opcode_fn: ExecutionFunc,
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
