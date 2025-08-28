const std = @import("std");
const FrameConfig = @import("frame_config.zig").FrameConfig;
const log = @import("../log.zig");

/// Arithmetic opcode handlers for the EVM stack frame.
/// These are generic structs that return static handlers for a given FrameType.
pub fn Handlers(comptime FrameType: type) type {
    return struct {
        pub const Error = FrameType.Error;
        pub const Success = FrameType.Success;
        pub const Schedule = FrameType.Schedule;
        pub const WordType = FrameType.WordType;

        /// ADD opcode (0x01) - Addition with overflow wrapping.
        pub fn add(self: FrameType, schedule: Schedule) Error!Success {
            // Static gas consumption handled at upper layer
            const top_minus_1 = try self.stack.pop();
            const top = try self.stack.peek();
            try self.stack.set_top(top +% top_minus_1);
            const next = schedule.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        /// MUL opcode (0x02) - Multiplication with overflow wrapping.
        pub fn mul(self: FrameType, schedule: Schedule) Error!Success {
            const top_minus_1 = try self.stack.pop();
            const top = try self.stack.peek();
            try self.stack.set_top(top *% top_minus_1);
            const next = schedule.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        /// SUB opcode (0x03) - Subtraction with underflow wrapping.
        pub fn sub(self: FrameType, schedule: Schedule) Error!Success {
            const top_minus_1 = try self.stack.pop();
            const top = try self.stack.peek();
            try self.stack.set_top(top -% top_minus_1);
            const next = schedule.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        /// DIV opcode (0x04) - Integer division. Division by zero returns 0.
        pub fn div(self: FrameType, schedule: Schedule) Error!Success {
            const denominator = try self.stack.pop();
            const numerator = try self.stack.peek();
            const result = if (denominator == 0) 0 else numerator / denominator;
            try self.stack.set_top(result);
            const next = schedule.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        /// SDIV opcode (0x05) - Signed integer division.
        pub fn sdiv(self: FrameType, schedule: Schedule) Error!Success {
            const denominator = try self.stack.pop();
            const numerator = try self.stack.peek();
            var result: WordType = undefined;
            if (denominator == 0) {
                result = 0;
            } else {
                const numerator_signed = @as(std.meta.Int(.signed, @bitSizeOf(WordType)), @bitCast(numerator));
                const denominator_signed = @as(std.meta.Int(.signed, @bitSizeOf(WordType)), @bitCast(denominator));
                const min_signed = std.math.minInt(std.meta.Int(.signed, @bitSizeOf(WordType)));
                if (numerator_signed == min_signed and denominator_signed == -1) {
                    // MIN / -1 overflow case
                    result = numerator;
                } else {
                    const result_signed = @divTrunc(numerator_signed, denominator_signed);
                    result = @as(WordType, @bitCast(result_signed));
                }
            }
            try self.stack.set_top(result);
            const next = schedule.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        /// MOD opcode (0x06) - Modulo operation. Modulo by zero returns 0.
        pub fn mod(self: FrameType, schedule: Schedule) Error!Success {
            const denominator = try self.stack.pop();
            const numerator = try self.stack.peek();
            const result = if (denominator == 0) 0 else numerator % denominator;
            try self.stack.set_top(result);
            const next = schedule.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        /// SMOD opcode (0x07) - Signed modulo operation.
        pub fn smod(self: FrameType, schedule: Schedule) Error!Success {
            const denominator = try self.stack.pop();
            const numerator = try self.stack.peek();
            var result: WordType = undefined;
            if (denominator == 0) {
                result = 0;
            } else {
                const numerator_signed = @as(std.meta.Int(.signed, @bitSizeOf(WordType)), @bitCast(numerator));
                const denominator_signed = @as(std.meta.Int(.signed, @bitSizeOf(WordType)), @bitCast(denominator));
                const result_signed = @rem(numerator_signed, denominator_signed);
                result = @as(WordType, @bitCast(result_signed));
            }
            try self.stack.set_top(result);
            const next = schedule.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        /// ADDMOD opcode (0x08) - (a + b) % N. All intermediate calculations are performed with arbitrary precision.
        pub fn addmod(self: FrameType, schedule: Schedule) Error!Success {
            const modulus = try self.stack.pop();
            const addend2 = try self.stack.pop();
            const addend1 = try self.stack.peek();
            var result: WordType = 0;
            if (modulus == 0) {
                result = 0;
            } else {
                const a = addend1 % modulus;
                const b = addend2 % modulus;
                const sum = @addWithOverflow(a, b);
                var r = sum[0];
                // If overflow occurred or r >= modulus, subtract once
                if (sum[1] == 1 or r >= modulus) {
                    r -%= modulus;
                }
                result = r;
            }
            try self.stack.set_top(result);
            const next = schedule.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        /// MULMOD opcode (0x09) - (a * b) % N. All intermediate calculations are performed with arbitrary precision.
        pub fn mulmod(self: FrameType, schedule: Schedule) Error!Success {
            const modulus = try self.stack.pop();
            const factor2 = try self.stack.pop();
            const factor1 = try self.stack.peek();
            var result: WordType = undefined;
            if (modulus == 0) {
                result = 0;
            } else {
                const factor1_mod = factor1 % modulus;
                const factor2_mod = factor2 % modulus;
                const product = factor1_mod *% factor2_mod;
                result = product % modulus;
            }
            try self.stack.set_top(result);
            const next = schedule.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        /// EXP opcode (0x0a) - Exponential operation.
        pub fn exp(self: FrameType, schedule: Schedule) Error!Success {
            const exponent = try self.stack.pop();
            const base = try self.stack.peek();
            var result: WordType = 1;
            var b = base;
            var e = exponent;
            while (e > 0) : (e >>= 1) {
                if (e & 1 == 1) {
                    result *%= b;
                }
                b *%= b;
            }
            try self.stack.set_top(result);
            const next = schedule.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        /// SIGNEXTEND opcode (0x0b) - Sign extend operation.
        pub fn signextend(self: FrameType, schedule: Schedule) Error!Success {
            const ext = try self.stack.pop();
            const value = try self.stack.peek();
            var result: WordType = undefined;
            if (ext >= 31) {
                result = value;
            } else {
                const ext_usize = @as(usize, @intCast(ext));
                const bit_index = ext_usize * 8 + 7;
                const mask = (@as(WordType, 1) << @intCast(bit_index)) - 1;
                const sign_bit = (value >> @intCast(bit_index)) & 1;
                if (sign_bit == 1) {
                    result = value | ~mask;
                } else {
                    result = value & mask;
                }
            }
            try self.stack.set_top(result);
            const next = schedule.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }
    };
}