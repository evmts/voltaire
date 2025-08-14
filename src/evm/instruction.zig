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
    jump_pc: u16, // resolved unconditional jump target pc (to be mapped at runtime)
    jump_unresolved, // unresolved: pop 1; compute target at runtime
    // Fused immediate jump variants are resolved during analysis; no PC stored at runtime
    // Conditional jump variants
    conditional_jump: *const Instruction, // resolved true branch target (legacy pointer form)
    conditional_jump_pc: u16, // resolved true branch target pc (to be mapped at runtime)
    conditional_jump_unresolved, // unresolved: compute target at runtime when condition true
    conditional_jump_invalid, // analysis-validated invalid JUMPDEST; interpreter errors if condition true
    /// PC immediate value (program counter) for the PC opcode
    pc: u32,
    block_info: BlockInfo,
    dynamic_gas: DynamicGas,
    /// Execution function pointer for non-special opcodes
    exec: ExecutionFunc,
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
    /// Legacy execution function to run after charging dynamic gas
    exec_fn: ExecutionFunc,
};

pub const Instruction = struct {
    arg: AnalysisArg,
    /// Linked execution function that returns the next instruction to execute
    opcode_fn: LinkedExecutionFunc,

    pub const STOP: Instruction = .{ .opcode_fn = StopLinkedHandler, .arg = .none };
};

/// New function type that returns a pointer to the next instruction
pub const LinkedExecutionFunc = *const fn (context: *anyopaque, inst: *const Instruction) ExecutionError.Error!*const Instruction;

fn StopLinkedHandler(context: *anyopaque, inst: *const Instruction) ExecutionError.Error!*const Instruction {
    _ = context;
    _ = inst;
    return ExecutionError.Error.STOP;
}

pub fn NoopHandler(context: *anyopaque) ExecutionError.Error!void {
    _ = context;
    return;
}

/// Generic linked handler that simply advances to the next instruction
pub fn always_advance(_: *anyopaque, inst: *const Instruction) ExecutionError.Error!*const Instruction {
    const next_ptr: *const Instruction = @ptrFromInt(@intFromPtr(inst) + @sizeOf(Instruction));
    return next_ptr;
}

/// Linked dispatcher that calls the stored execution function (either exec or dynamic_gas.exec_fn) and advances
pub fn dispatch_execute(context: *anyopaque, inst: *const Instruction) ExecutionError.Error!*const Instruction {
    switch (inst.arg) {
        .exec => |f| try f(context),
        .dynamic_gas => |dg| try dg.exec_fn(context),
        else => {},
    }
    const next_ptr: *const Instruction = @ptrFromInt(@intFromPtr(inst) + @sizeOf(Instruction));
    return next_ptr;
}
