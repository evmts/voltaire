const std = @import("std");
const opcode = @import("opcode_data.zig");
const Opcode = opcode.Opcode;
const IR = @import("ir.zig");

pub const BuildError = error{InvalidJump, BytecodeTooLarge} || std.mem.Allocator.Error;

pub fn build(allocator: std.mem.Allocator, bytecode: []const u8) BuildError!IR.Program {
    var out = try allocator.alloc(IR.IRInstruction, bytecode.len + 1);
    var count: usize = 0;

    var i: usize = 0;
    while (i < bytecode.len) : (i += 1) {
        const op = bytecode[i];
        switch (op) {
            // PUSH0..PUSH32
            0x5f => { // PUSH0
                out[count] = .{ .op = .push, .operand = .{ .imm32 = [_]u8{0} ** 32 }, .stack_delta = 1 };
                count += 1;
            },
            0x60...0x7f => {
                const n: usize = op - 0x5f; // 1..32
                var imm: [32]u8 = [_]u8{0} ** 32;
                var j: usize = 0;
                while (j < n and (i + 1 + j) < bytecode.len) : (j += 1) {
                    // right-align: last n bytes are the immediate
                    imm[32 - n + j] = bytecode[i + 1 + j];
                }
                out[count] = .{ .op = .push, .operand = .{ .imm32 = imm }, .stack_delta = 1 };
                count += 1;
                i += n; // skip immediate
            },
            // Memory ops
            @intFromEnum(Opcode.MSTORE) => {
                out[count] = .{ .op = .mstore, .operand = .{ .none = {} }, .stack_delta = -2 };
                count += 1;
            },
            @intFromEnum(Opcode.MSTORE8) => {
                out[count] = .{ .op = .mstore8, .operand = .{ .none = {} }, .stack_delta = -2 };
                count += 1;
            },
            @intFromEnum(Opcode.MLOAD) => {
                out[count] = .{ .op = .mload, .operand = .{ .none = {} }, .stack_delta = -1 };
                count += 1;
            },
            // Control flow (minimal)
            @intFromEnum(Opcode.JUMPDEST) => {
                out[count] = .{ .op = .jumpdest, .operand = .{ .none = {} } };
                count += 1;
            },
            @intFromEnum(Opcode.RETURN) => {
                out[count] = .{ .op = IR.IROp.@"return", .operand = .{ .none = {} }, .stack_delta = -2 };
                count += 1;
            },
            @intFromEnum(Opcode.REVERT) => {
                out[count] = .{ .op = .revert, .operand = .{ .none = {} }, .stack_delta = -2 };
                count += 1;
            },
            @intFromEnum(Opcode.STOP) => {
                out[count] = .{ .op = .stop, .operand = .{ .none = {} } };
                count += 1;
            },
            else => {
                // For MVP, treat unknown as STOP to be safe in initcode path
                out[count] = .{ .op = .stop, .operand = .{ .none = {} } };
                count += 1;
                break;
            },
        }
    }

    // Sentinel STOP
    out[count] = .{ .op = .stop, .operand = .{ .none = {} } };
    count += 1;

    return IR.Program{ .instructions = out[0..count] };
}
