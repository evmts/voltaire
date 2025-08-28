const std = @import("std");
const FrameConfig = @import("frame_config.zig").FrameConfig;
const log = @import("log.zig");
const primitives = @import("primitives");
const Address = primitives.Address;
const GasConstants = primitives.GasConstants;
const logs = @import("logs.zig");
const Log = logs.Log;

/// Log opcode handlers for the EVM stack frame.
/// These handle event emission (LOG0-LOG4).
pub fn Handlers(comptime FrameType: type) type {
    return struct {
        pub const Error = FrameType.Error;
        pub const Success = FrameType.Success;
        pub const Dispatch = FrameType.Dispatch;
        pub const WordType = FrameType.WordType;

        /// Generate a log handler for LOG0-LOG4
        pub fn generateLogHandler(comptime topic_count: u8) *const Dispatch.OpcodeHandler {
            if (topic_count > 4) @compileError("Only LOG0 to LOG4 is supported");
            return struct {
                pub fn logHandler(self: FrameType, dispatch: Dispatch) Error!Success {
                    // Check if we're in static context
                    if (self.host.get_is_static()) {
                        return Error.WriteProtection;
                    }

                    // Pop topics in reverse order
                    var topics: [4]WordType = undefined;
                    var i: u8 = topic_count;
                    while (i > 0) : (i -= 1) {
                        topics[i - 1] = try self.stack.pop();
                    }
                    
                    const length = try self.stack.pop();
                    const offset = try self.stack.pop();
                    
                    // Check bounds
                    if (offset > std.math.maxInt(usize) or length > std.math.maxInt(usize)) {
                        return Error.OutOfBounds;
                    }
                    
                    const offset_usize = @as(usize, @intCast(offset));
                    const length_usize = @as(usize, @intCast(length));
                    
                    // Note: Gas calculation is handled by the planner/interpreter layer
                    // The handler just performs the operation
                    
                    // Ensure memory capacity
                    if (length_usize > 0) {
                        const memory_end = offset_usize + length_usize;
                        self.memory.ensure_capacity(memory_end) catch return Error.OutOfBounds;
                    }
                    
                    // Get data from memory
                    const data = if (length_usize > 0) 
                        self.memory.get_slice(offset_usize, length_usize) catch return Error.OutOfBounds
                    else 
                        &[_]u8{};
                    
                    // Create log entry
                    const allocator = self.allocator;
                    const data_copy = if (data.len > 0)
                        allocator.dupe(u8, data) catch return Error.AllocationError
                    else
                        &[_]u8{};
                    
                    const topics_array = if (topic_count > 0) blk: {
                        const arr = allocator.alloc(WordType, topic_count) catch {
                            if (data.len > 0) allocator.free(data_copy);
                            return Error.AllocationError;
                        };
                        for (0..topic_count) |j| {
                            arr[j] = topics[j];
                        }
                        break :blk arr;
                    } else allocator.alloc(WordType, 0) catch {
                        if (data.len > 0) allocator.free(data_copy);
                        return Error.AllocationError;
                    };
                    
                    const log_entry = Log{
                        .address = self.contract_address,
                        .topics = topics_array,
                        .data = data_copy,
                    };
                    
                    // Add log to logs list via host
                    self.host.emit_log(log_entry) catch |err| {
                        allocator.free(data_copy);
                        allocator.free(topics_array);
                        switch (err) {
                            else => return Error.AllocationError,
                        }
                    };
                    
                    const next = dispatch.getNext();
                    return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
                }
            }.logHandler;
        }

        /// LOG0 opcode (0xA0) - Emit log with no topics
        pub const log0 = generateLogHandler(0);

        /// LOG1 opcode (0xA1) - Emit log with one topic
        pub const log1 = generateLogHandler(1);

        /// LOG2 opcode (0xA2) - Emit log with two topics
        pub const log2 = generateLogHandler(2);

        /// LOG3 opcode (0xA3) - Emit log with three topics
        pub const log3 = generateLogHandler(3);

        /// LOG4 opcode (0xA4) - Emit log with four topics
        pub const log4 = generateLogHandler(4);
    };
}

// ====== TESTS ======

const testing = std.testing;
const StackFrame = @import("stack_frame.zig").StackFrame;
const dispatch_mod = @import("stack_frame_dispatch.zig");
const NoOpTracer = @import("tracer.zig").NoOpTracer;
const bytecode_mod = @import("bytecode.zig");
const host_mod = @import("host.zig");

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

// Mock host for testing
const MockHost = struct {
    allocator: std.mem.Allocator,
    is_static: bool = false,
    logs: std.ArrayList(Log),

    pub fn init(allocator: std.mem.Allocator) MockHost {
        return .{
            .allocator = allocator,
            .is_static = false,
            .logs = std.ArrayList(Log).init(allocator),
        };
    }

    pub fn deinit(self: *MockHost) void {
        for (self.logs.items) |log_entry| {
            self.allocator.free(log_entry.data);
            self.allocator.free(log_entry.topics);
        }
        self.logs.deinit();
    }

    pub fn get_is_static(self: *const MockHost) bool {
        return self.is_static;
    }

    pub fn emit_log(self: *MockHost, log_entry: Log) !void {
        try self.logs.append(log_entry);
    }

    pub fn to_host(self: *MockHost) host_mod.Host {
        return .{
            .ptr = self,
            .vtable = &.{
                .get_is_static = @ptrCast(&get_is_static),
                .emit_log = @ptrCast(&emit_log),
                // Add other required vtable entries...
            },
        };
    }
};

fn createTestFrame(allocator: std.mem.Allocator, host: ?host_mod.Host) !TestFrame {
    const bytecode = TestBytecode.initEmpty();
    return try TestFrame.init(allocator, bytecode, 1_000_000, null, host);
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

test "LOG0 opcode - empty data" {
    var mock_host = MockHost.init(testing.allocator);
    defer mock_host.deinit();
    
    const host = mock_host.to_host();
    const test_address = Address.fromBytes([_]u8{0x12} ++ [_]u8{0} ** 19) catch unreachable;
    var frame = try createTestFrame(testing.allocator, host);
    defer frame.deinit(testing.allocator);
    frame.contract_address = test_address;

    // LOG0 with empty data
    try frame.stack.push(0); // offset
    try frame.stack.push(0); // length

    const dispatch = createMockDispatch();
    _ = try TestFrame.LogHandlers.log0(frame, dispatch);
    
    try testing.expectEqual(@as(usize, 1), mock_host.logs.items.len);
    const log_entry = mock_host.logs.items[0];
    try testing.expect(log_entry.address.eql(test_address));
    try testing.expectEqual(@as(usize, 0), log_entry.topics.len);
    try testing.expectEqual(@as(usize, 0), log_entry.data.len);
}

test "LOG0 opcode - with data" {
    var mock_host = MockHost.init(testing.allocator);
    defer mock_host.deinit();
    
    const host = mock_host.to_host();
    const test_address = Address.fromBytes([_]u8{0x34} ++ [_]u8{0} ** 19) catch unreachable;
    var frame = try createTestFrame(testing.allocator, host);
    defer frame.deinit(testing.allocator);
    frame.contract_address = test_address;

    // Write test data to memory
    const test_data = [_]u8{ 0xAA, 0xBB, 0xCC, 0xDD };
    try frame.memory.set_data(0, &test_data);

    // LOG0 with data
    try frame.stack.push(0); // offset
    try frame.stack.push(4); // length

    const dispatch = createMockDispatch();
    _ = try TestFrame.LogHandlers.log0(frame, dispatch);
    
    try testing.expectEqual(@as(usize, 1), mock_host.logs.items.len);
    const log_entry = mock_host.logs.items[0];
    try testing.expect(log_entry.address.eql(test_address));
    try testing.expectEqual(@as(usize, 0), log_entry.topics.len);
    try testing.expectEqualSlices(u8, &test_data, log_entry.data);
}

test "LOG1 opcode - with topic" {
    var mock_host = MockHost.init(testing.allocator);
    defer mock_host.deinit();
    
    const host = mock_host.to_host();
    var frame = try createTestFrame(testing.allocator, host);
    defer frame.deinit(testing.allocator);

    // Write test data to memory
    const test_data = [_]u8{ 0x11, 0x22 };
    try frame.memory.set_data(0, &test_data);

    // LOG1 with one topic
    try frame.stack.push(0);     // offset
    try frame.stack.push(2);     // length
    try frame.stack.push(0x1234); // topic1

    const dispatch = createMockDispatch();
    _ = try TestFrame.LogHandlers.log1(frame, dispatch);
    
    try testing.expectEqual(@as(usize, 1), mock_host.logs.items.len);
    const log_entry = mock_host.logs.items[0];
    try testing.expectEqual(@as(usize, 1), log_entry.topics.len);
    try testing.expectEqual(@as(u256, 0x1234), log_entry.topics[0]);
    try testing.expectEqualSlices(u8, &test_data, log_entry.data);
}

test "LOG2 opcode - with two topics" {
    var mock_host = MockHost.init(testing.allocator);
    defer mock_host.deinit();
    
    const host = mock_host.to_host();
    var frame = try createTestFrame(testing.allocator, host);
    defer frame.deinit(testing.allocator);

    // LOG2 with two topics
    try frame.stack.push(0);      // offset
    try frame.stack.push(0);      // length (empty data)
    try frame.stack.push(0xAAAA); // topic1
    try frame.stack.push(0xBBBB); // topic2

    const dispatch = createMockDispatch();
    _ = try TestFrame.LogHandlers.log2(frame, dispatch);
    
    try testing.expectEqual(@as(usize, 1), mock_host.logs.items.len);
    const log_entry = mock_host.logs.items[0];
    try testing.expectEqual(@as(usize, 2), log_entry.topics.len);
    try testing.expectEqual(@as(u256, 0xAAAA), log_entry.topics[0]);
    try testing.expectEqual(@as(u256, 0xBBBB), log_entry.topics[1]);
}

test "LOG3 opcode - with three topics" {
    var mock_host = MockHost.init(testing.allocator);
    defer mock_host.deinit();
    
    const host = mock_host.to_host();
    var frame = try createTestFrame(testing.allocator, host);
    defer frame.deinit(testing.allocator);

    // LOG3 with three topics
    try frame.stack.push(0);      // offset
    try frame.stack.push(0);      // length
    try frame.stack.push(0x1111); // topic1
    try frame.stack.push(0x2222); // topic2
    try frame.stack.push(0x3333); // topic3

    const dispatch = createMockDispatch();
    _ = try TestFrame.LogHandlers.log3(frame, dispatch);
    
    try testing.expectEqual(@as(usize, 1), mock_host.logs.items.len);
    const log_entry = mock_host.logs.items[0];
    try testing.expectEqual(@as(usize, 3), log_entry.topics.len);
    try testing.expectEqual(@as(u256, 0x1111), log_entry.topics[0]);
    try testing.expectEqual(@as(u256, 0x2222), log_entry.topics[1]);
    try testing.expectEqual(@as(u256, 0x3333), log_entry.topics[2]);
}

test "LOG4 opcode - with four topics" {
    var mock_host = MockHost.init(testing.allocator);
    defer mock_host.deinit();
    
    const host = mock_host.to_host();
    var frame = try createTestFrame(testing.allocator, host);
    defer frame.deinit(testing.allocator);

    // LOG4 with four topics
    try frame.stack.push(0);      // offset
    try frame.stack.push(0);      // length
    try frame.stack.push(0xAAAA); // topic1
    try frame.stack.push(0xBBBB); // topic2
    try frame.stack.push(0xCCCC); // topic3
    try frame.stack.push(0xDDDD); // topic4

    const dispatch = createMockDispatch();
    _ = try TestFrame.LogHandlers.log4(frame, dispatch);
    
    try testing.expectEqual(@as(usize, 1), mock_host.logs.items.len);
    const log_entry = mock_host.logs.items[0];
    try testing.expectEqual(@as(usize, 4), log_entry.topics.len);
    try testing.expectEqual(@as(u256, 0xAAAA), log_entry.topics[0]);
    try testing.expectEqual(@as(u256, 0xBBBB), log_entry.topics[1]);
    try testing.expectEqual(@as(u256, 0xCCCC), log_entry.topics[2]);
    try testing.expectEqual(@as(u256, 0xDDDD), log_entry.topics[3]);
}

test "LOG opcodes - static context error" {
    var mock_host = MockHost.init(testing.allocator);
    defer mock_host.deinit();
    mock_host.is_static = true;
    
    const host = mock_host.to_host();
    var frame = try createTestFrame(testing.allocator, host);
    defer frame.deinit(testing.allocator);

    // Try LOG0 in static context
    try frame.stack.push(0); // offset
    try frame.stack.push(0); // length

    const dispatch = createMockDispatch();
    const result = TestFrame.LogHandlers.log0(frame, dispatch);
    
    try testing.expectError(TestFrame.Error.WriteProtection, result);
    try testing.expectEqual(@as(usize, 0), mock_host.logs.items.len);
}

test "LOG opcodes - out of bounds" {
    var mock_host = MockHost.init(testing.allocator);
    defer mock_host.deinit();
    
    const host = mock_host.to_host();
    var frame = try createTestFrame(testing.allocator, host);
    defer frame.deinit(testing.allocator);

    // Try LOG0 with out of bounds offset
    const huge_offset = std.math.maxInt(u256);
    try frame.stack.push(huge_offset); // offset
    try frame.stack.push(10);          // length

    const dispatch = createMockDispatch();
    const result = TestFrame.LogHandlers.log0(frame, dispatch);
    
    try testing.expectError(TestFrame.Error.OutOfBounds, result);
}

test "LOG opcodes - large data" {
    var mock_host = MockHost.init(testing.allocator);
    defer mock_host.deinit();
    
    const host = mock_host.to_host();
    var frame = try createTestFrame(testing.allocator, host);
    defer frame.deinit(testing.allocator);

    // Create large data in memory
    var large_data: [256]u8 = undefined;
    for (&large_data, 0..) |*byte, i| {
        byte.* = @intCast(i & 0xFF);
    }
    try frame.memory.set_data(0, &large_data);

    // LOG1 with large data
    try frame.stack.push(0);           // offset
    try frame.stack.push(256);         // length
    try frame.stack.push(0x12345678);  // topic

    const dispatch = createMockDispatch();
    _ = try TestFrame.LogHandlers.log1(frame, dispatch);
    
    try testing.expectEqual(@as(usize, 1), mock_host.logs.items.len);
    const log_entry = mock_host.logs.items[0];
    try testing.expectEqualSlices(u8, &large_data, log_entry.data);
}