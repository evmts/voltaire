const std = @import("std");
const FrameConfig = @import("frame_config.zig").FrameConfig;
const log = @import("log.zig");

/// Bitwise opcode handlers for the EVM stack frame.
/// These are generic structs that return static handlers for a given FrameType.
pub fn Handlers(comptime FrameType: type) type {
    return struct {
        pub const Error = FrameType.Error;
        pub const Success = FrameType.Success;
        pub const Dispatch = FrameType.Dispatch;
        pub const WordType = FrameType.WordType;

        /// AND opcode (0x16) - Bitwise AND operation.
        pub fn @"and"(self: FrameType, dispatch: Dispatch) Error!Success {
            const top_minus_1 = try self.stack.pop();
            const top = try self.stack.peek();
            try self.stack.set_top(top & top_minus_1);
            const next = dispatch.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        /// OR opcode (0x17) - Bitwise OR operation.
        pub fn @"or"(self: FrameType, dispatch: Dispatch) Error!Success {
            const top_minus_1 = try self.stack.pop();
            const top = try self.stack.peek();
            try self.stack.set_top(top | top_minus_1);
            const next = dispatch.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        /// XOR opcode (0x18) - Bitwise XOR operation.
        pub fn xor(self: FrameType, dispatch: Dispatch) Error!Success {
            const top_minus_1 = try self.stack.pop();
            const top = try self.stack.peek();
            try self.stack.set_top(top ^ top_minus_1);
            const next = dispatch.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        /// NOT opcode (0x19) - Bitwise NOT operation.
        pub fn not(self: FrameType, dispatch: Dispatch) Error!Success {
            const top = try self.stack.peek();
            try self.stack.set_top(~top);
            const next = dispatch.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        /// BYTE opcode (0x1a) - Extract byte from word.
        /// Takes byte index from stack top, value from second position.
        /// Returns the byte at that index or 0 if index >= 32.
        pub fn byte(self: FrameType, dispatch: Dispatch) Error!Success {
            const byte_index = try self.stack.pop();
            const value = try self.stack.peek();
            const result = if (byte_index >= 32) 0 else blk: {
                const index_usize = @as(usize, @intCast(byte_index));
                const shift_amount = (31 - index_usize) * 8;
                const ShiftType = std.math.Log2Int(WordType);
                break :blk (value >> @as(ShiftType, @intCast(shift_amount))) & 0xFF;
            };
            try self.stack.set_top(result);
            const next = dispatch.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        /// SHL opcode (0x1b) - Shift left operation.
        pub fn shl(self: FrameType, dispatch: Dispatch) Error!Success {
            const shift = try self.stack.pop();
            const value = try self.stack.peek();
            const ShiftType = std.math.Log2Int(WordType);
            const result = if (shift >= @bitSizeOf(WordType)) 0 else value << @as(ShiftType, @intCast(shift));
            try self.stack.set_top(result);
            const next = dispatch.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        /// SHR opcode (0x1c) - Logical shift right operation.
        pub fn shr(self: FrameType, dispatch: Dispatch) Error!Success {
            const shift = try self.stack.pop();
            const value = try self.stack.peek();
            const ShiftType = std.math.Log2Int(WordType);
            const result = if (shift >= @bitSizeOf(WordType)) 0 else value >> @as(ShiftType, @intCast(shift));
            try self.stack.set_top(result);
            const next = dispatch.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        /// SAR opcode (0x1d) - Arithmetic shift right operation.
        /// Preserves the sign bit during shift.
        pub fn sar(self: FrameType, dispatch: Dispatch) Error!Success {
            const shift = try self.stack.pop();
            const value = try self.stack.peek();
            const word_bits = @bitSizeOf(WordType);
            const result = if (shift >= word_bits) blk: {
                const sign_bit = value >> (word_bits - 1);
                break :blk if (sign_bit == 1) @as(WordType, std.math.maxInt(WordType)) else @as(WordType, 0);
            } else blk: {
                const ShiftType = std.math.Log2Int(WordType);
                const shift_amount = @as(ShiftType, @intCast(shift));
                const value_signed = @as(std.meta.Int(.signed, @bitSizeOf(WordType)), @bitCast(value));
                const result_signed = value_signed >> shift_amount;
                break :blk @as(WordType, @bitCast(result_signed));
            };
            try self.stack.set_top(result);
            const next = dispatch.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }
    };
}

// ====== TESTS ======

const testing = std.testing;
const FrameConfig = @import("frame_config.zig").FrameConfig;
const StackFrame = @import("stack_frame.zig").StackFrame;
const dispatch_mod = @import("stack_frame_dispatch.zig");
const NoOpTracer = @import("tracer.zig").NoOpTracer;
const bytecode_mod = @import("bytecode.zig");

// Test configuration
const test_config = FrameConfig{
    .stack_size = 1024,
    .WordType = u256,
    .max_bytecode_size = 1024,
    .block_gas_limit = 30_000_000,
    .has_database = false,
    .TracerType = NoOpTracer,
    .memory_initial_capacity = 4096,
    .memory_limit = 0xFFFFFF,
};

const TestFrame = StackFrame(test_config);
const TestBytecode = bytecode_mod.Bytecode(.{ .max_bytecode_size = test_config.max_bytecode_size });

fn createTestFrame(allocator: std.mem.Allocator) !TestFrame {
    var bytecode = TestBytecode.initEmpty();
    return try TestFrame.init(allocator, bytecode, 1_000_000, null, null);
}

// Mock dispatch that simulates successful execution flow
fn createMockDispatch() TestFrame.Dispatch {
    const mock_handler = struct {
        fn handler(frame: TestFrame, dispatch: TestFrame.Dispatch) TestFrame.Error!TestFrame.Success {
            _ = frame;
            _ = dispatch;
            return TestFrame.Success.stop;
        }
    }.handler;
    
    var schedule: [1]dispatch_mod.ScheduleElement(TestFrame) = undefined;
    schedule[0] = .{ .opcode_handler = &mock_handler };
    
    return TestFrame.Dispatch{
        .schedule = &schedule,
        .bytecode_length = 0,
    };
}

test "AND opcode - basic bitwise AND" {
    var frame = try createTestFrame(testing.allocator);
    defer frame.deinit(testing.allocator);

    // Test: 0xFF & 0xF0 = 0xF0
    try frame.stack.push(0xFF);
    try frame.stack.push(0xF0);
    
    const dispatch = createMockDispatch();
    _ = try TestFrame.BitwiseHandlers.@"and"(frame, dispatch);
    
    try testing.expectEqual(@as(u256, 0xF0), try frame.stack.pop());
    try testing.expectEqual(@as(usize, 0), frame.stack.len());
}

test "OR opcode - basic bitwise OR" {
    var frame = try createTestFrame(testing.allocator);
    defer frame.deinit(testing.allocator);

    // Test: 0xF0 | 0x0F = 0xFF
    try frame.stack.push(0xF0);
    try frame.stack.push(0x0F);
    
    const dispatch = createMockDispatch();
    _ = try TestFrame.BitwiseHandlers.@"or"(frame, dispatch);
    
    try testing.expectEqual(@as(u256, 0xFF), try frame.stack.pop());
}

test "XOR opcode - basic bitwise XOR" {
    var frame = try createTestFrame(testing.allocator);
    defer frame.deinit(testing.allocator);

    // Test: 0xFF ^ 0xAA = 0x55
    try frame.stack.push(0xFF);
    try frame.stack.push(0xAA);
    
    const dispatch = createMockDispatch();
    _ = try TestFrame.BitwiseHandlers.xor(frame, dispatch);
    
    try testing.expectEqual(@as(u256, 0x55), try frame.stack.pop());
}

test "NOT opcode - bitwise NOT" {
    var frame = try createTestFrame(testing.allocator);
    defer frame.deinit(testing.allocator);

    // Test: ~0 = MAX_U256
    try frame.stack.push(0);
    
    const dispatch = createMockDispatch();
    _ = try TestFrame.BitwiseHandlers.not(frame, dispatch);
    
    try testing.expectEqual(std.math.maxInt(u256), try frame.stack.pop());
}

test "NOT opcode - bitwise NOT of 1" {
    var frame = try createTestFrame(testing.allocator);
    defer frame.deinit(testing.allocator);

    // Test: ~1 = MAX_U256 - 1
    try frame.stack.push(1);
    
    const dispatch = createMockDispatch();
    _ = try TestFrame.BitwiseHandlers.not(frame, dispatch);
    
    try testing.expectEqual(std.math.maxInt(u256) - 1, try frame.stack.pop());
}

test "BYTE opcode - extract first byte" {
    var frame = try createTestFrame(testing.allocator);
    defer frame.deinit(testing.allocator);

    // Test: byte 0 of 0xFF00000000...0 = 0xFF
    try frame.stack.push(@as(u256, 0xFF) << 248);
    try frame.stack.push(0); // byte index
    
    const dispatch = createMockDispatch();
    _ = try TestFrame.BitwiseHandlers.byte(frame, dispatch);
    
    try testing.expectEqual(@as(u256, 0xFF), try frame.stack.pop());
}

test "BYTE opcode - extract last byte" {
    var frame = try createTestFrame(testing.allocator);
    defer frame.deinit(testing.allocator);

    // Test: byte 31 of 0x...00FF = 0xFF
    try frame.stack.push(0xFF);
    try frame.stack.push(31); // byte index
    
    const dispatch = createMockDispatch();
    _ = try TestFrame.BitwiseHandlers.byte(frame, dispatch);
    
    try testing.expectEqual(@as(u256, 0xFF), try frame.stack.pop());
}

test "BYTE opcode - out of bounds" {
    var frame = try createTestFrame(testing.allocator);
    defer frame.deinit(testing.allocator);

    // Test: byte 32 of any value = 0
    try frame.stack.push(0xFFFFFFFF);
    try frame.stack.push(32); // out of bounds
    
    const dispatch = createMockDispatch();
    _ = try TestFrame.BitwiseHandlers.byte(frame, dispatch);
    
    try testing.expectEqual(@as(u256, 0), try frame.stack.pop());
}

test "SHL opcode - basic shift left" {
    var frame = try createTestFrame(testing.allocator);
    defer frame.deinit(testing.allocator);

    // Test: 1 << 4 = 16
    try frame.stack.push(1);
    try frame.stack.push(4);
    
    const dispatch = createMockDispatch();
    _ = try TestFrame.BitwiseHandlers.shl(frame, dispatch);
    
    try testing.expectEqual(@as(u256, 16), try frame.stack.pop());
}

test "SHL opcode - shift overflow" {
    var frame = try createTestFrame(testing.allocator);
    defer frame.deinit(testing.allocator);

    // Test: 1 << 256 = 0 (shift >= bit size)
    try frame.stack.push(1);
    try frame.stack.push(256);
    
    const dispatch = createMockDispatch();
    _ = try TestFrame.BitwiseHandlers.shl(frame, dispatch);
    
    try testing.expectEqual(@as(u256, 0), try frame.stack.pop());
}

test "SHR opcode - basic shift right" {
    var frame = try createTestFrame(testing.allocator);
    defer frame.deinit(testing.allocator);

    // Test: 16 >> 4 = 1
    try frame.stack.push(16);
    try frame.stack.push(4);
    
    const dispatch = createMockDispatch();
    _ = try TestFrame.BitwiseHandlers.shr(frame, dispatch);
    
    try testing.expectEqual(@as(u256, 1), try frame.stack.pop());
}

test "SHR opcode - shift overflow" {
    var frame = try createTestFrame(testing.allocator);
    defer frame.deinit(testing.allocator);

    // Test: MAX >> 256 = 0 (shift >= bit size)
    try frame.stack.push(std.math.maxInt(u256));
    try frame.stack.push(256);
    
    const dispatch = createMockDispatch();
    _ = try TestFrame.BitwiseHandlers.shr(frame, dispatch);
    
    try testing.expectEqual(@as(u256, 0), try frame.stack.pop());
}

test "SAR opcode - positive number" {
    var frame = try createTestFrame(testing.allocator);
    defer frame.deinit(testing.allocator);

    // Test: 16 >> 2 = 4 (arithmetic shift preserves sign)
    try frame.stack.push(16);
    try frame.stack.push(2);
    
    const dispatch = createMockDispatch();
    _ = try TestFrame.BitwiseHandlers.sar(frame, dispatch);
    
    try testing.expectEqual(@as(u256, 4), try frame.stack.pop());
}

test "SAR opcode - negative number" {
    var frame = try createTestFrame(testing.allocator);
    defer frame.deinit(testing.allocator);

    // Test: -16 >> 2 = -4 (preserves sign bit)
    // -16 in two's complement for u256
    const neg_16 = std.math.maxInt(u256) - 15;
    try frame.stack.push(neg_16);
    try frame.stack.push(2);
    
    const dispatch = createMockDispatch();
    _ = try TestFrame.BitwiseHandlers.sar(frame, dispatch);
    
    // -4 in two's complement
    const neg_4 = std.math.maxInt(u256) - 3;
    try testing.expectEqual(neg_4, try frame.stack.pop());
}

test "SAR opcode - shift overflow negative" {
    var frame = try createTestFrame(testing.allocator);
    defer frame.deinit(testing.allocator);

    // Test: negative >> 256 = MAX (all 1s)
    const neg_1 = std.math.maxInt(u256);
    try frame.stack.push(neg_1);
    try frame.stack.push(256);
    
    const dispatch = createMockDispatch();
    _ = try TestFrame.BitwiseHandlers.sar(frame, dispatch);
    
    try testing.expectEqual(std.math.maxInt(u256), try frame.stack.pop());
}

test "SAR opcode - shift overflow positive" {
    var frame = try createTestFrame(testing.allocator);
    defer frame.deinit(testing.allocator);

    // Test: positive >> 256 = 0
    try frame.stack.push(42);
    try frame.stack.push(256);
    
    const dispatch = createMockDispatch();
    _ = try TestFrame.BitwiseHandlers.sar(frame, dispatch);
    
    try testing.expectEqual(@as(u256, 0), try frame.stack.pop());
}