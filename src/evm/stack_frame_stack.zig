const std = @import("std");
const FrameConfig = @import("frame_config.zig").FrameConfig;
const log = @import("log.zig");

/// Stack manipulation opcode handlers for the EVM stack frame.
/// These are generic structs that return static handlers for a given FrameType.
pub fn Handlers(comptime FrameType: type) type {
    return struct {
        pub const Error = FrameType.Error;
        pub const Success = FrameType.Success;
        pub const Dispatch = FrameType.Dispatch;
        pub const WordType = FrameType.WordType;

        /// POP opcode (0x50) - Remove item from stack.
        /// Uses unsafe variant as stack bounds are pre-validated by the planner.
        pub fn pop(self: FrameType, dispatch: Dispatch) Error!Success {
            _ = self.stack.pop_unsafe();
            const next = dispatch.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        /// PUSH0 opcode (0x5f) - Push 0 onto stack.
        /// Uses unsafe variant as stack bounds are pre-validated by the planner.
        pub fn push0(self: FrameType, dispatch: Dispatch) Error!Success {
            self.stack.push_unsafe(0);
            const next = dispatch.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        /// Generate a push handler for PUSH1-PUSH32
        pub fn generatePushHandler(comptime push_n: u8) *const Dispatch.OpcodeHandler {
            if (push_n > 32) @compileError("Only PUSH1 to PUSH32 is supported");
            if (push_n == 0) @compileError("PUSH0 is handled as its own opcode");
            return struct {
                pub fn pushHandler(self: FrameType, schedule: Dispatch) Error!Success {
                    if (push_n <= 8) {
                        const meta = schedule.getInlineMetadata();
                        self.stack.push_unsafe(meta.value);
                    } else {
                        const meta = schedule.getPointerMetadata();
                        self.stack.push_unsafe(meta.value.*);
                    }
                    const next = schedule.skipMetadata();
                    return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
                }
            }.pushHandler;
        }

        /// Generate a dup handler for DUP1-DUP16
        pub fn generateDupHandler(comptime dup_n: u8) *const Dispatch.OpcodeHandler {
            if (dup_n == 0 or dup_n > 16) @compileError("Only DUP1 to DUP16 is supported");
            return struct {
                pub fn dupHandler(self: FrameType, schedule: Dispatch) Error!Success {
                    const value = self.stack.peek_n_unsafe(dup_n);
                    self.stack.push_unsafe(value);
                    const next = schedule.getNext();
                    return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
                }
            }.dupHandler;
        }

        /// Generate a swap handler for SWAP1-SWAP16
        pub fn generateSwapHandler(comptime swap_n: u8) *const Dispatch.OpcodeHandler {
            if (swap_n == 0 or swap_n > 16) @compileError("Only SWAP1 to SWAP16 is supported");
            return struct {
                pub fn swapHandler(self: FrameType, schedule: Dispatch) Error!Success {
                    self.stack.swap_n_unsafe(swap_n);
                    const next = schedule.getNext();
                    return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
                }
            }.swapHandler;
        }
    };
}

// ====== TESTS ======

const testing = std.testing;
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
    const bytecode = TestBytecode.initEmpty();
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

test "POP opcode - basic pop" {
    var frame = try createTestFrame(testing.allocator);
    defer frame.deinit(testing.allocator);

    // Push value then pop it
    try frame.stack.push(42);
    
    const dispatch = createMockDispatch();
    _ = try TestFrame.StackHandlers.pop(frame, dispatch);
    
    try testing.expectEqual(@as(usize, 0), frame.stack.len());
}

test "POP opcode - stack underflow" {
    var frame = try createTestFrame(testing.allocator);
    defer frame.deinit(testing.allocator);

    // Try to pop from empty stack
    const dispatch = createMockDispatch();
    const result = TestFrame.StackHandlers.pop(frame, dispatch);
    
    try testing.expectError(TestFrame.Error.StackUnderflow, result);
}

test "PUSH0 opcode - push zero" {
    var frame = try createTestFrame(testing.allocator);
    defer frame.deinit(testing.allocator);

    const dispatch = createMockDispatch();
    _ = try TestFrame.StackHandlers.push0(frame, dispatch);
    
    try testing.expectEqual(@as(u256, 0), try frame.stack.pop());
    try testing.expectEqual(@as(usize, 0), frame.stack.len());
}

test "DUP1 opcode - duplicate top" {
    var frame = try createTestFrame(testing.allocator);
    defer frame.deinit(testing.allocator);

    try frame.stack.push(42);
    
    const DupHandler = TestFrame.StackHandlers.generateDupHandler(1);
    const dispatch = createMockDispatch();
    _ = try DupHandler(frame, dispatch);
    
    try testing.expectEqual(@as(usize, 2), frame.stack.len());
    try testing.expectEqual(@as(u256, 42), try frame.stack.pop());
    try testing.expectEqual(@as(u256, 42), try frame.stack.pop());
}

test "DUP16 opcode - duplicate 16th item" {
    var frame = try createTestFrame(testing.allocator);
    defer frame.deinit(testing.allocator);

    // Push 16 different values
    for (1..17) |i| {
        try frame.stack.push(@as(u256, i));
    }
    
    const DupHandler = TestFrame.StackHandlers.generateDupHandler(16);
    const dispatch = createMockDispatch();
    _ = try DupHandler(frame, dispatch);
    
    try testing.expectEqual(@as(usize, 17), frame.stack.len());
    try testing.expectEqual(@as(u256, 1), try frame.stack.pop()); // Duplicated value from bottom
}

test "SWAP1 opcode - swap top two" {
    var frame = try createTestFrame(testing.allocator);
    defer frame.deinit(testing.allocator);

    try frame.stack.push(1);
    try frame.stack.push(2);
    
    const SwapHandler = TestFrame.StackHandlers.generateSwapHandler(1);
    const dispatch = createMockDispatch();
    _ = try SwapHandler(frame, dispatch);
    
    try testing.expectEqual(@as(u256, 1), try frame.stack.pop());
    try testing.expectEqual(@as(u256, 2), try frame.stack.pop());
}

test "SWAP16 opcode - swap with 16th item" {
    var frame = try createTestFrame(testing.allocator);
    defer frame.deinit(testing.allocator);

    // Push 17 values: 1 to 17
    for (1..18) |i| {
        try frame.stack.push(@as(u256, i));
    }
    
    const SwapHandler = TestFrame.StackHandlers.generateSwapHandler(16);
    const dispatch = createMockDispatch();
    _ = try SwapHandler(frame, dispatch);
    
    // Top should now be 1, and 17th position should be 17
    try testing.expectEqual(@as(u256, 1), try frame.stack.pop());
    
    // Pop 15 more to get to what was the 17th position
    for (0..15) |_| {
        _ = try frame.stack.pop();
    }
    try testing.expectEqual(@as(u256, 17), try frame.stack.pop());
}

test "PUSH handler - inline metadata" {
    var frame = try createTestFrame(testing.allocator);
    defer frame.deinit(testing.allocator);

    // Test PUSH1 with inline value
    const PushHandler = TestFrame.StackHandlers.generatePushHandler(1);
    
    // Create dispatch with inline metadata
    const mock_handler = struct {
        fn handler(frame_inner: TestFrame, dispatch_inner: TestFrame.Dispatch) TestFrame.Error!TestFrame.Success {
            _ = frame_inner;
            _ = dispatch_inner;
            return TestFrame.Success.stop;
        }
    }.handler;
    
    var schedule: [2]dispatch_mod.ScheduleElement(TestFrame) = undefined;
    schedule[0] = .{ .opcode_handler = &mock_handler };
    schedule[1] = .{ .opcode_handler = &mock_handler };
    
    var dispatch = TestFrame.Dispatch{
        .schedule = &schedule,
        .bytecode_length = 0,
    };
    
    // Set inline metadata
    dispatch.schedule[0].metadata = .{ .inline_value = 42 };
    
    _ = try PushHandler(frame, dispatch);
    
    try testing.expectEqual(@as(u256, 42), try frame.stack.pop());
}

test "PUSH handler - pointer metadata" {
    var frame = try createTestFrame(testing.allocator);
    defer frame.deinit(testing.allocator);

    // Test PUSH32 with pointer value
    const PushHandler = TestFrame.StackHandlers.generatePushHandler(32);
    
    const value: u256 = std.math.maxInt(u256);
    
    // Create dispatch with pointer metadata
    const mock_handler = struct {
        fn handler(frame_inner: TestFrame, dispatch_inner: TestFrame.Dispatch) TestFrame.Error!TestFrame.Success {
            _ = frame_inner;
            _ = dispatch_inner;
            return TestFrame.Success.stop;
        }
    }.handler;
    
    var schedule: [2]dispatch_mod.ScheduleElement(TestFrame) = undefined;
    schedule[0] = .{ .opcode_handler = &mock_handler };
    schedule[1] = .{ .opcode_handler = &mock_handler };
    
    var dispatch = TestFrame.Dispatch{
        .schedule = &schedule,
        .bytecode_length = 0,
    };
    
    // Set pointer metadata
    dispatch.schedule[0].metadata = .{ .pointer_value = &value };
    
    _ = try PushHandler(frame, dispatch);
    
    try testing.expectEqual(std.math.maxInt(u256), try frame.stack.pop());
}