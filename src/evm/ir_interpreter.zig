const std = @import("std");
const IR = @import("ir.zig");
const frame_mod = @import("frame.zig");

pub fn interpret(comptime config: frame_mod.FrameConfig, program: *const IR.Program, frame: *frame_mod.Frame(config)) !void {
    var i: usize = 0;
    const instrs = program.instructions;
    while (true) {
        if (i >= instrs.len) return error.InvalidOpcode;
        const ins = instrs[i];
        switch (ins.op) {
            .push => {
                // Convert imm32 bytes to WordType (big-endian)
                var acc: u256 = 0;
                for (ins.operand.imm32) |b| acc = (acc << 8) | b;
                try frame.stack.push(@as(@TypeOf(frame.stack.peek_unsafe()), @truncate(acc)));
                i += 1;
            },
            .mstore => {
                try frame.mstore();
                i += 1;
            },
            .mstore8 => {
                try frame.mstore8();
                i += 1;
            },
            .mload => {
                try frame.mload();
                i += 1;
            },
            .jumpdest => {
                i += 1;
            },
            .jump => {
                i = ins.operand.ir_idx;
            },
            .jumpi => {
                const cond = try frame.stack.pop();
                if (cond != 0) {
                    i = ins.operand.ir_idx;
                } else {
                    i += 1;
                }
            },
            .@"return" => return frame.@"return"(),
            .revert => return frame.revert(),
            .stop => return frame.stop(),
            
            // Storage operations
            .sstore => {
                try frame.sstore();
                i += 1;
            },
            .sload => {
                try frame.sload();
                i += 1;
            },
            
            // Arithmetic operations
            .add => {
                try frame.add();
                i += 1;
            },
            .mul => {
                try frame.mul();
                i += 1;
            },
            .sub => {
                try frame.sub();
                i += 1;
            },
            .div => {
                try frame.div();
                i += 1;
            },
            .lt => {
                try frame.lt();
                i += 1;
            },
            
            // Other operations - for now, treat as STOP
            .other => {
                // TODO: Implement generic opcode execution
                return frame.stop();
            },
        }
    }
}
