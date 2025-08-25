const std = @import("std");

pub const IROp = enum(u8) {
    // Core ops (MVP)
    push,       // operand: u256 immediate (represented as [32]u8 encoded in big-endian)
    mstore,     // operand: none (stack: [offset, value])
    mstore8,    // operand: none (stack: [offset, value])
    mload,      // operand: none (stack: [offset])
    jump,       // operand: ir_idx
    jumpi,      // operand: ir_idx
    jumpdest,   // operand: none
    @"return",  // operand: none (stack: [offset, size])
    revert,     // operand: none (stack: [offset, size])
    stop,       // operand: none (terminal)
};

pub const Operand = union(enum) {
    none: void,
    u8: u8,
    u16: u16,
    u32: u32,
    u64: u64,
    ir_idx: usize,
    // 32-byte immediate for PUSH: big-endian
    imm32: [32]u8,
};

pub const IRInstruction = struct {
    op: IROp,
    operand: Operand = .{ .none = {} },
    static_gas: u32 = 0,
    stack_delta: i8 = 0,
};

pub const Program = struct {
    instructions: []IRInstruction,

    pub fn deinit(self: *Program, allocator: std.mem.Allocator) void {
        allocator.free(self.instructions);
        self.instructions = &.{};
    }
};
