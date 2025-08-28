const std = @import("std");
const FrameConfig = @import("frame_config.zig").FrameConfig;
const log = @import("../log.zig");

/// Comparison opcode handlers for the EVM stack frame.
/// These are generic structs that return static handlers for a given FrameType.
pub fn Handlers(comptime FrameType: type) type {
    return struct {
        pub const Error = FrameType.Error;
        pub const Success = FrameType.Success;
        pub const Schedule = FrameType.Schedule;
        pub const WordType = FrameType.WordType;

        /// LT opcode (0x10) - Less than comparison.
        pub fn lt(self: *FrameType) Error!void {
            const top_minus_1 = try self.stack.pop();
            const top = try self.stack.peek();
            const result: WordType = if (top < top_minus_1) 1 else 0;
            try self.stack.set_top(result);
        }

        /// GT opcode (0x11) - Greater than comparison.
        pub fn gt(self: *FrameType) Error!void {
            const top_minus_1 = try self.stack.pop();
            const top = try self.stack.peek();
            const result: WordType = if (top > top_minus_1) 1 else 0;
            try self.stack.set_top(result);
        }

        /// SLT opcode (0x12) - Signed less than comparison.
        pub fn slt(self: *FrameType) Error!void {
            const top_minus_1 = try self.stack.pop();
            const top = try self.stack.peek();
            const a_signed = @as(std.meta.Int(.signed, @bitSizeOf(WordType)), @bitCast(top));
            const b_signed = @as(std.meta.Int(.signed, @bitSizeOf(WordType)), @bitCast(top_minus_1));
            const result: WordType = if (a_signed < b_signed) 1 else 0;
            try self.stack.set_top(result);
        }

        /// SGT opcode (0x13) - Signed greater than comparison.
        pub fn sgt(self: *FrameType) Error!void {
            const top_minus_1 = try self.stack.pop();
            const top = try self.stack.peek();
            const a_signed = @as(std.meta.Int(.signed, @bitSizeOf(WordType)), @bitCast(top));
            const b_signed = @as(std.meta.Int(.signed, @bitSizeOf(WordType)), @bitCast(top_minus_1));
            const result: WordType = if (a_signed > b_signed) 1 else 0;
            try self.stack.set_top(result);
        }

        /// EQ opcode (0x14) - Equality comparison.
        pub fn eq(self: *FrameType) Error!void {
            const top_minus_1 = try self.stack.pop();
            const top = try self.stack.peek();
            const result: WordType = if (top == top_minus_1) 1 else 0;
            try self.stack.set_top(result);
        }

        /// ISZERO opcode (0x15) - Check if value is zero.
        pub fn iszero(self: *FrameType) Error!void {
            const value = try self.stack.peek();
            const result: WordType = if (value == 0) 1 else 0;
            try self.stack.set_top(result);
        }
    };
}