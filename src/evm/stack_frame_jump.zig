const std = @import("std");
const FrameConfig = @import("frame_config.zig").FrameConfig;
const log = @import("log.zig");

/// Jump operation handlers for the EVM stack frame.
/// These handle control flow operations including JUMP, JUMPI, JUMPDEST, and PC.
pub fn Handlers(comptime FrameType: type) type {
    return struct {
        pub const Error = FrameType.Error;
        pub const Success = FrameType.Success;
        pub const Dispatch = FrameType.Dispatch;
        pub const WordType = FrameType.WordType;

        /// JUMP opcode (0x56) - Unconditional jump.
        /// Pops destination from stack and transfers control to that location.
        /// The destination must be a valid JUMPDEST.
        pub fn jump(self: FrameType, dispatch: Dispatch) Error!Success {
            _ = dispatch; // JUMP changes control flow, doesn't continue to next
            const dest = try self.stack.pop();
            
            // TODO: Implement proper jump logic with schedule lookup
            // The planner should have pre-validated the jump destination
            // and created the appropriate dispatch schedule.
            // For now, just return stop as a placeholder.
            _ = dest;
            
            // In a full implementation, this would:
            // 1. Look up the destination in the plan's jump table
            // 2. Return a Jump success with the new instruction pointer
            // 3. The interpreter would then continue from that location
            return Success.Stop;
        }

        /// JUMPI opcode (0x57) - Conditional jump.
        /// Pops destination and condition from stack.
        /// Jumps to destination if condition is non-zero, otherwise continues to next instruction.
        pub fn jumpi(self: FrameType, dispatch: Dispatch) Error!Success {
            const dest = try self.stack.pop();
            const condition = try self.stack.pop();

            if (condition != 0) {
                // Take the jump
                // TODO: Implement conditional jump logic with schedule lookup
                _ = dest;
                
                // In a full implementation, this would:
                // 1. Look up the destination in the plan's jump table
                // 2. Return a Jump success with the new instruction pointer
                return Success.Stop;
            } else {
                // Continue to next instruction
                const next = dispatch.getNext();
                return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
            }
        }

        /// JUMPDEST opcode (0x5b) - Mark valid jump destination.
        /// This opcode marks a valid destination for JUMP and JUMPI operations.
        /// It also serves as a gas consumption point for the entire basic block.
        pub fn jumpdest(self: FrameType, dispatch: Dispatch) Error!Success {
            // JUMPDEST consumes gas for the entire basic block (static + dynamic)
            const metadata = dispatch.getJumpDestMetadata();
            const gas_cost = metadata.gas;
            
            // Check and consume gas for the entire basic block
            if (self.gas_remaining < gas_cost) {
                return Error.OutOfGas;
            }
            self.gas_remaining -= gas_cost;
            
            // Continue to next operation
            const next = dispatch.skipMetadata();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        /// PC opcode (0x58) - Get program counter.
        /// Pushes the current program counter onto the stack.
        /// The actual PC value is provided by the planner through metadata.
        pub fn pc(self: FrameType, dispatch: Dispatch) Error!Success {
            // Get PC value from metadata
            const metadata = dispatch.getPcMetadata();
            try self.stack.push(metadata.value);
            
            const next = dispatch.skipMetadata();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
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

test "JUMP opcode - basic jump" {
    var frame = try createTestFrame(testing.allocator);
    defer frame.deinit(testing.allocator);

    // Push jump destination
    try frame.stack.push(100); // Jump to PC 100
    
    const dispatch = createMockDispatch();
    const result = TestFrame.JumpHandlers.jump(frame, dispatch);
    
    // Currently returns Stop as placeholder
    try testing.expectEqual(TestFrame.Success.Stop, try result);
    
    // Stack should be empty after jump
    try testing.expectEqual(@as(usize, 0), frame.stack.len());
}

test "JUMPI opcode - conditional jump taken" {
    var frame = try createTestFrame(testing.allocator);
    defer frame.deinit(testing.allocator);

    // Push destination and non-zero condition
    try frame.stack.push(200);  // destination
    try frame.stack.push(1);    // condition (non-zero = jump)
    
    const dispatch = createMockDispatch();
    const result = TestFrame.JumpHandlers.jumpi(frame, dispatch);
    
    // Should take the jump (returns Stop as placeholder)
    try testing.expectEqual(TestFrame.Success.Stop, try result);
    
    // Stack should be empty
    try testing.expectEqual(@as(usize, 0), frame.stack.len());
}

test "JUMPI opcode - conditional jump not taken" {
    var frame = try createTestFrame(testing.allocator);
    defer frame.deinit(testing.allocator);

    // Push destination and zero condition
    try frame.stack.push(200);  // destination
    try frame.stack.push(0);    // condition (zero = no jump)
    
    const dispatch = createMockDispatch();
    _ = try TestFrame.JumpHandlers.jumpi(frame, dispatch);
    
    // Should continue to next instruction
    // Stack should be empty
    try testing.expectEqual(@as(usize, 0), frame.stack.len());
}

test "JUMPDEST opcode - gas consumption" {
    var frame = try createTestFrame(testing.allocator);
    defer frame.deinit(testing.allocator);

    // Set initial gas
    frame.gas_remaining = 10_000;
    const initial_gas = frame.gas_remaining;
    
    // Create dispatch with jump dest metadata
    var schedule: [2]dispatch_mod.ScheduleElement(TestFrame) = undefined;
    const mock_handler = struct {
        fn handler(f: TestFrame, d: TestFrame.Dispatch) TestFrame.Error!TestFrame.Success {
            _ = f;
            _ = d;
            return TestFrame.Success.stop;
        }
    }.handler;
    
    schedule[0] = .{ .opcode_handler = &mock_handler };
    schedule[1] = .{ .opcode_handler = &mock_handler };
    
    // Set jump dest metadata with gas cost for the basic block
    schedule[0].metadata = .{ .jump_dest = .{ .gas = 500 } };
    
    const dispatch = TestFrame.Dispatch{
        .schedule = &schedule,
        .bytecode_length = 0,
    };
    
    _ = try TestFrame.JumpHandlers.jumpdest(frame, dispatch);
    
    // Gas should be consumed
    try testing.expectEqual(@as(i64, initial_gas - 500), frame.gas_remaining);
}

test "JUMPDEST opcode - out of gas" {
    var frame = try createTestFrame(testing.allocator);
    defer frame.deinit(testing.allocator);

    // Set very low gas
    frame.gas_remaining = 100;
    
    // Create dispatch with high gas cost
    var schedule: [2]dispatch_mod.ScheduleElement(TestFrame) = undefined;
    const mock_handler = struct {
        fn handler(f: TestFrame, d: TestFrame.Dispatch) TestFrame.Error!TestFrame.Success {
            _ = f;
            _ = d;
            return TestFrame.Success.stop;
        }
    }.handler;
    
    schedule[0] = .{ .opcode_handler = &mock_handler };
    schedule[1] = .{ .opcode_handler = &mock_handler };
    
    // Set jump dest metadata with high gas cost
    schedule[0].metadata = .{ .jump_dest = .{ .gas = 1000 } };
    
    const dispatch = TestFrame.Dispatch{
        .schedule = &schedule,
        .bytecode_length = 0,
    };
    
    const result = TestFrame.JumpHandlers.jumpdest(frame, dispatch);
    
    try testing.expectError(TestFrame.Error.OutOfGas, result);
}

test "PC opcode - push program counter" {
    var frame = try createTestFrame(testing.allocator);
    defer frame.deinit(testing.allocator);

    // Create dispatch with PC metadata
    var schedule: [2]dispatch_mod.ScheduleElement(TestFrame) = undefined;
    const mock_handler = struct {
        fn handler(f: TestFrame, d: TestFrame.Dispatch) TestFrame.Error!TestFrame.Success {
            _ = f;
            _ = d;
            return TestFrame.Success.stop;
        }
    }.handler;
    
    schedule[0] = .{ .opcode_handler = &mock_handler };
    schedule[1] = .{ .opcode_handler = &mock_handler };
    
    // Set PC metadata
    schedule[0].metadata = .{ .pc = .{ .value = 42 } };
    
    const dispatch = TestFrame.Dispatch{
        .schedule = &schedule,
        .bytecode_length = 0,
    };
    
    _ = try TestFrame.JumpHandlers.pc(frame, dispatch);
    
    // PC value should be on stack
    try testing.expectEqual(@as(u256, 42), try frame.stack.pop());
}

test "JUMPI opcode - various conditions" {
    var frame = try createTestFrame(testing.allocator);
    defer frame.deinit(testing.allocator);

    // Test with different condition values
    const test_cases = [_]struct { condition: u256, should_jump: bool }{
        .{ .condition = 0, .should_jump = false },
        .{ .condition = 1, .should_jump = true },
        .{ .condition = 0xFF, .should_jump = true },
        .{ .condition = std.math.maxInt(u256), .should_jump = true },
        .{ .condition = 0x8000000000000000, .should_jump = true },
    };
    
    for (test_cases) |tc| {
        // Clear stack
        while (frame.stack.len() > 0) {
            _ = try frame.stack.pop();
        }
        
        // Push destination and condition
        try frame.stack.push(300);         // destination
        try frame.stack.push(tc.condition); // condition
        
        const dispatch = createMockDispatch();
        const result = TestFrame.JumpHandlers.jumpi(frame, dispatch);
        
        if (tc.should_jump) {
            // Should jump (returns Stop)
            try testing.expectEqual(TestFrame.Success.Stop, try result);
        } else {
            // Should continue (mock returns stop)
            try testing.expectEqual(TestFrame.Success.stop, try result);
        }
        
        // Stack should be empty
        try testing.expectEqual(@as(usize, 0), frame.stack.len());
    }
}

test "Jump operations - stack underflow" {
    var frame = try createTestFrame(testing.allocator);
    defer frame.deinit(testing.allocator);

    // Test JUMP with empty stack
    const dispatch = createMockDispatch();
    var result = TestFrame.JumpHandlers.jump(frame, dispatch);
    try testing.expectError(TestFrame.Error.StackUnderflow, result);
    
    // Test JUMPI with only one element
    try frame.stack.push(100);
    result = TestFrame.JumpHandlers.jumpi(frame, dispatch);
    try testing.expectError(TestFrame.Error.StackUnderflow, result);
    
    // Clear stack
    _ = try frame.stack.pop();
    
    // Test JUMPI with empty stack
    result = TestFrame.JumpHandlers.jumpi(frame, dispatch);
    try testing.expectError(TestFrame.Error.StackUnderflow, result);
}

test "PC opcode - different values" {
    var frame = try createTestFrame(testing.allocator);
    defer frame.deinit(testing.allocator);

    // Test various PC values
    const pc_values = [_]u256{ 0, 1, 100, 1000, 65535, std.math.maxInt(u32) };
    
    for (pc_values) |pc_val| {
        // Clear stack
        while (frame.stack.len() > 0) {
            _ = try frame.stack.pop();
        }
        
        // Create dispatch with PC metadata
        var schedule: [2]dispatch_mod.ScheduleElement(TestFrame) = undefined;
        const mock_handler = struct {
            fn handler(f: TestFrame, d: TestFrame.Dispatch) TestFrame.Error!TestFrame.Success {
                _ = f;
                _ = d;
                return TestFrame.Success.stop;
            }
        }.handler;
        
        schedule[0] = .{ .opcode_handler = &mock_handler };
        schedule[1] = .{ .opcode_handler = &mock_handler };
        
        schedule[0].metadata = .{ .pc = .{ .value = pc_val } };
        
        const dispatch = TestFrame.Dispatch{
            .schedule = &schedule,
            .bytecode_length = 0,
        };
        
        _ = try TestFrame.JumpHandlers.pc(frame, dispatch);
        
        try testing.expectEqual(pc_val, try frame.stack.pop());
    }
}

test "JUMPDEST opcode - zero gas cost" {
    var frame = try createTestFrame(testing.allocator);
    defer frame.deinit(testing.allocator);

    // Set initial gas
    frame.gas_remaining = 1_000;
    const initial_gas = frame.gas_remaining;
    
    // Create dispatch with zero gas cost (empty basic block)
    var schedule: [2]dispatch_mod.ScheduleElement(TestFrame) = undefined;
    const mock_handler = struct {
        fn handler(f: TestFrame, d: TestFrame.Dispatch) TestFrame.Error!TestFrame.Success {
            _ = f;
            _ = d;
            return TestFrame.Success.stop;
        }
    }.handler;
    
    schedule[0] = .{ .opcode_handler = &mock_handler };
    schedule[1] = .{ .opcode_handler = &mock_handler };
    
    schedule[0].metadata = .{ .jump_dest = .{ .gas = 0 } };
    
    const dispatch = TestFrame.Dispatch{
        .schedule = &schedule,
        .bytecode_length = 0,
    };
    
    _ = try TestFrame.JumpHandlers.jumpdest(frame, dispatch);
    
    // No gas should be consumed
    try testing.expectEqual(initial_gas, frame.gas_remaining);
}

test "Jump operations - integration test" {
    var frame = try createTestFrame(testing.allocator);
    defer frame.deinit(testing.allocator);

    // Simulate a common pattern: PC, conditional jump based on comparison
    
    // First, get current PC
    var schedule: [2]dispatch_mod.ScheduleElement(TestFrame) = undefined;
    const mock_handler = struct {
        fn handler(f: TestFrame, d: TestFrame.Dispatch) TestFrame.Error!TestFrame.Success {
            _ = f;
            _ = d;
            return TestFrame.Success.stop;
        }
    }.handler;
    
    schedule[0] = .{ .opcode_handler = &mock_handler };
    schedule[1] = .{ .opcode_handler = &mock_handler };
    
    schedule[0].metadata = .{ .pc = .{ .value = 50 } };
    
    const dispatch = TestFrame.Dispatch{
        .schedule = &schedule,
        .bytecode_length = 0,
    };
    
    _ = try TestFrame.JumpHandlers.pc(frame, dispatch);
    
    // Stack: [50]
    
    // Push comparison value and destination
    try frame.stack.push(50);   // Compare with current PC
    try frame.stack.push(100);  // Jump destination
    
    // Stack: [50, 50, 100]
    
    // Simulate EQ comparison (would normally be done by comparison handler)
    const b = try frame.stack.pop();
    const a = try frame.stack.pop();
    try frame.stack.push(if (a == b) @as(u256, 1) else 0);
    
    // Stack: [50, 1]
    
    // Now JUMPI with condition = 1 (should jump)
    const dispatch2 = createMockDispatch();
    const result = TestFrame.JumpHandlers.jumpi(frame, dispatch2);
    
    try testing.expectEqual(TestFrame.Success.Stop, try result);
    try testing.expectEqual(@as(usize, 0), frame.stack.len());
}