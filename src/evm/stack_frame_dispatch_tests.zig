const std = @import("std");
const testing = std.testing;
const Dispatch = @import("stack_frame_dispatch.zig").Dispatch;
const Opcode = @import("opcode_data.zig").Opcode;
const bytecode_mod = @import("bytecode.zig");

// Mock frame type for testing
const TestFrame = struct {
    pub const WordType = u256;
    pub const PcType = u32;
    pub const BytecodeConfig = bytecode_mod.BytecodeConfig{ 
        .max_bytecode_size = 1024,
        .max_initcode_size = 49152,
        .vector_length = 16,
    };
    
    pub const Error = error{
        TestError,
    };
    
    pub const Success = enum {
        Stop,
        Return,
    };
};

const TestDispatch = Dispatch(TestFrame);

// Mock opcode handlers for testing
fn mockStop(frame: TestFrame, dispatch: TestDispatch) TestFrame.Error!TestFrame.Success {
    _ = frame;
    _ = dispatch;
    return TestFrame.Success.Stop;
}

fn mockAdd(frame: TestFrame, dispatch: TestDispatch) TestFrame.Error!TestFrame.Success {
    _ = frame;
    _ = dispatch;
    return TestFrame.Success.Stop;
}

fn mockPush1(frame: TestFrame, dispatch: TestDispatch) TestFrame.Error!TestFrame.Success {
    _ = frame;
    _ = dispatch;
    return TestFrame.Success.Stop;
}

fn mockJumpdest(frame: TestFrame, dispatch: TestDispatch) TestFrame.Error!TestFrame.Success {
    _ = frame;
    _ = dispatch;
    return TestFrame.Success.Stop;
}

fn mockPc(frame: TestFrame, dispatch: TestDispatch) TestFrame.Error!TestFrame.Success {
    _ = frame;
    _ = dispatch;
    return TestFrame.Success.Stop;
}

fn mockInvalid(frame: TestFrame, dispatch: TestDispatch) TestFrame.Error!TestFrame.Success {
    _ = frame;
    _ = dispatch;
    return TestFrame.Error.TestError;
}

// Create test opcode handler array
fn createTestHandlers() [256]*const TestDispatch.OpcodeHandler {
    var handlers: [256]*const TestDispatch.OpcodeHandler = undefined;
    
    // Initialize all to invalid
    for (&handlers) |*handler| {
        handler.* = &mockInvalid;
    }
    
    // Set specific handlers
    handlers[@intFromEnum(Opcode.STOP)] = &mockStop;
    handlers[@intFromEnum(Opcode.ADD)] = &mockAdd;
    handlers[@intFromEnum(Opcode.PUSH1)] = &mockPush1;
    handlers[@intFromEnum(Opcode.JUMPDEST)] = &mockJumpdest;
    handlers[@intFromEnum(Opcode.PC)] = &mockPc;
    
    return handlers;
}

test "Dispatch - basic initialization with empty bytecode" {
    const allocator = testing.allocator;
    const handlers = createTestHandlers();
    
    // Create empty bytecode
    const Bytecode = bytecode_mod.Bytecode(TestFrame.BytecodeConfig);
    const bytecode = try Bytecode.init(allocator, &[_]u8{});
    defer bytecode.deinit(allocator);
    
    // Create dispatch
    const dispatch_items = try TestDispatch.init(allocator, &bytecode, &handlers);
    defer allocator.free(dispatch_items);
    
    // Should have at least 2 STOP handlers
    try testing.expect(dispatch_items.len >= 2);
    
    // Last two items should be STOP handlers
    try testing.expect(dispatch_items[dispatch_items.len - 1].opcode_handler == &mockStop);
    try testing.expect(dispatch_items[dispatch_items.len - 2].opcode_handler == &mockStop);
}

test "Dispatch - simple bytecode with ADD" {
    const allocator = testing.allocator;
    const handlers = createTestHandlers();
    
    // Create bytecode with ADD instruction
    const Bytecode = bytecode_mod.Bytecode(TestFrame.BytecodeConfig);
    const bytecode = try Bytecode.init(allocator, &[_]u8{@intFromEnum(Opcode.ADD)});
    defer bytecode.deinit(allocator);
    
    // Create dispatch
    const dispatch_items = try TestDispatch.init(allocator, &bytecode, &handlers);
    defer allocator.free(dispatch_items);
    
    // Should have ADD handler + 2 STOP handlers
    try testing.expect(dispatch_items.len == 3);
    try testing.expect(dispatch_items[0].opcode_handler == &mockAdd);
}

test "Dispatch - PUSH1 with inline metadata" {
    const allocator = testing.allocator;
    const handlers = createTestHandlers();
    
    // Create bytecode with PUSH1 42
    const Bytecode = bytecode_mod.Bytecode(TestFrame.BytecodeConfig);
    const bytecode = try Bytecode.init(allocator, &[_]u8{ @intFromEnum(Opcode.PUSH1), 42 });
    defer bytecode.deinit(allocator);
    
    // Create dispatch
    const dispatch_items = try TestDispatch.init(allocator, &bytecode, &handlers);
    defer allocator.free(dispatch_items);
    
    // Should have PUSH1 handler + metadata + 2 STOP handlers
    try testing.expect(dispatch_items.len == 4);
    try testing.expect(dispatch_items[0].opcode_handler == &mockPush1);
    try testing.expect(dispatch_items[1].push_inline.value == 42);
}

test "Dispatch - PC opcode with metadata" {
    const allocator = testing.allocator;
    const handlers = createTestHandlers();
    
    // Create bytecode with PC instruction
    const Bytecode = bytecode_mod.Bytecode(TestFrame.BytecodeConfig);
    const bytecode = try Bytecode.init(allocator, &[_]u8{@intFromEnum(Opcode.PC)});
    defer bytecode.deinit(allocator);
    
    // Create dispatch
    const dispatch_items = try TestDispatch.init(allocator, &bytecode, &handlers);
    defer allocator.free(dispatch_items);
    
    // Should have PC handler + metadata + 2 STOP handlers
    try testing.expect(dispatch_items.len == 4);
    try testing.expect(dispatch_items[0].opcode_handler == &mockPc);
    try testing.expect(dispatch_items[1].pc.value == 0);
}

test "Dispatch - getNext advances by 1" {
    const dispatch = TestDispatch{ .schedule = undefined };
    const next = dispatch.getNext();
    
    // Verify pointer arithmetic
    const diff = @intFromPtr(next.schedule) - @intFromPtr(dispatch.schedule);
    try testing.expect(diff == @sizeOf(TestDispatch.Item));
}

test "Dispatch - skipMetadata advances by 2" {
    const dispatch = TestDispatch{ .schedule = undefined };
    const next = dispatch.skipMetadata();
    
    // Verify pointer arithmetic
    const diff = @intFromPtr(next.schedule) - @intFromPtr(dispatch.schedule);
    try testing.expect(diff == 2 * @sizeOf(TestDispatch.Item));
}

test "Dispatch - getInlineMetadata accesses correct position" {
    var items = [_]TestDispatch.Item{
        .{ .opcode_handler = &mockPush1 },
        .{ .push_inline = .{ .value = 123 } },
        .{ .opcode_handler = &mockStop },
    };
    
    const dispatch = TestDispatch{ .schedule = &items };
    const metadata = dispatch.getInlineMetadata();
    
    try testing.expect(metadata.value == 123);
}

test "Dispatch - getPointerMetadata accesses correct position" {
    const test_value: u256 = 456;
    var items = [_]TestDispatch.Item{
        .{ .opcode_handler = &mockPush1 },
        .{ .push_pointer = .{ .value = @constCast(&test_value) } },
        .{ .opcode_handler = &mockStop },
    };
    
    const dispatch = TestDispatch{ .schedule = &items };
    const metadata = dispatch.getPointerMetadata();
    
    try testing.expect(metadata.value.* == 456);
}

test "Dispatch - getPcMetadata accesses correct position" {
    var items = [_]TestDispatch.Item{
        .{ .opcode_handler = &mockPc },
        .{ .pc = .{ .value = 789 } },
        .{ .opcode_handler = &mockStop },
    };
    
    const dispatch = TestDispatch{ .schedule = &items };
    const metadata = dispatch.getPcMetadata();
    
    try testing.expect(metadata.value == 789);
}

test "Dispatch - getJumpDestMetadata accesses correct position" {
    var items = [_]TestDispatch.Item{
        .{ .opcode_handler = &mockJumpdest },
        .{ .jump_dest = .{ .gas = 100, .min_stack = -5, .max_stack = 10 } },
        .{ .opcode_handler = &mockStop },
    };
    
    const dispatch = TestDispatch{ .schedule = &items };
    const metadata = dispatch.getJumpDestMetadata();
    
    try testing.expect(metadata.gas == 100);
    try testing.expect(metadata.min_stack == -5);
    try testing.expect(metadata.max_stack == 10);
}

test "Dispatch - getOpData for PC returns correct metadata and next" {
    var items = [_]TestDispatch.Item{
        .{ .pc = .{ .value = 42 } },
        .{ .opcode_handler = &mockAdd },
        .{ .opcode_handler = &mockStop },
    };
    
    const dispatch = TestDispatch{ .schedule = &items };
    const op_data = dispatch.getOpData(.PC);
    
    try testing.expect(op_data.metadata.value == 42);
    try testing.expect(op_data.next.schedule == dispatch.schedule + 2);
}

test "Dispatch - getOpData for regular opcode returns only next" {
    var items = [_]TestDispatch.Item{
        .{ .opcode_handler = &mockAdd },
        .{ .opcode_handler = &mockStop },
    };
    
    const dispatch = TestDispatch{ .schedule = &items };
    const op_data = dispatch.getOpData(.ADD);
    
    try testing.expect(op_data.next.schedule == dispatch.schedule + 1);
}

test "Dispatch - complex bytecode sequence" {
    const allocator = testing.allocator;
    const handlers = createTestHandlers();
    
    // Create bytecode: PUSH1 10, PUSH1 20, ADD, STOP
    const Bytecode = bytecode_mod.Bytecode(TestFrame.BytecodeConfig);
    const bytecode = try Bytecode.init(allocator, &[_]u8{
        @intFromEnum(Opcode.PUSH1), 10,
        @intFromEnum(Opcode.PUSH1), 20,
        @intFromEnum(Opcode.ADD),
        @intFromEnum(Opcode.STOP),
    });
    defer bytecode.deinit(allocator);
    
    // Create dispatch
    const dispatch_items = try TestDispatch.init(allocator, &bytecode, &handlers);
    defer allocator.free(dispatch_items);
    
    // Verify structure: PUSH1, metadata, PUSH1, metadata, ADD, STOP, STOP, STOP
    try testing.expect(dispatch_items.len == 8);
    
    // First PUSH1
    try testing.expect(dispatch_items[0].opcode_handler == &mockPush1);
    try testing.expect(dispatch_items[1].push_inline.value == 10);
    
    // Second PUSH1
    try testing.expect(dispatch_items[2].opcode_handler == &mockPush1);
    try testing.expect(dispatch_items[3].push_inline.value == 20);
    
    // ADD
    try testing.expect(dispatch_items[4].opcode_handler == &mockAdd);
    
    // Three STOPs (one from bytecode, two safety terminators)
    try testing.expect(dispatch_items[5].opcode_handler == &mockStop);
    try testing.expect(dispatch_items[6].opcode_handler == &mockStop);
    try testing.expect(dispatch_items[7].opcode_handler == &mockStop);
}

test "Dispatch - metadata size constraints" {
    // Ensure metadata structs fit in 64 bits
    try testing.expect(@sizeOf(TestDispatch.JumpDestMetadata) == 8);
    try testing.expect(@sizeOf(TestDispatch.PushInlineMetadata) == 8);
    try testing.expect(@sizeOf(TestDispatch.PushPointerMetadata) == 8);
    try testing.expect(@sizeOf(TestDispatch.PcMetadata) <= 8);
}

test "Dispatch - invalid bytecode handling" {
    const allocator = testing.allocator;
    const handlers = createTestHandlers();
    
    // Create bytecode with invalid opcode
    const Bytecode = bytecode_mod.Bytecode(TestFrame.BytecodeConfig);
    const bytecode = try Bytecode.init(allocator, &[_]u8{0xFE}); // Invalid opcode
    defer bytecode.deinit(allocator);
    
    // Create dispatch
    const dispatch_items = try TestDispatch.init(allocator, &bytecode, &handlers);
    defer allocator.free(dispatch_items);
    
    // Should have invalid handler + 2 STOP handlers
    try testing.expect(dispatch_items.len == 3);
    try testing.expect(dispatch_items[0].opcode_handler == &mockInvalid);
}

test "Dispatch - JUMPDEST with gas metadata" {
    const allocator = testing.allocator;
    const handlers = createTestHandlers();
    
    // Create bytecode with JUMPDEST
    const Bytecode = bytecode_mod.Bytecode(TestFrame.BytecodeConfig);
    const bytecode = try Bytecode.init(allocator, &[_]u8{@intFromEnum(Opcode.JUMPDEST)});
    defer bytecode.deinit(allocator);
    
    // Note: In real usage, the bytecode analyzer would set gas costs
    // For this test, we're checking the structure is created correctly
    
    // Create dispatch
    const dispatch_items = try TestDispatch.init(allocator, &bytecode, &handlers);
    defer allocator.free(dispatch_items);
    
    // Should have JUMPDEST handler + metadata + 2 STOP handlers
    try testing.expect(dispatch_items.len == 4);
    try testing.expect(dispatch_items[0].opcode_handler == &mockJumpdest);
    // Gas metadata would be set by bytecode analyzer
    try testing.expect(dispatch_items[1].jump_dest.gas == 0); // Default value
}