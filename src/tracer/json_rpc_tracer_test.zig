const std = @import("std");
const testing = std.testing;
const JsonRpcTracer = @import("json_rpc_tracer.zig").JsonRpcTracer;
const TraceEvent = @import("json_rpc_tracer.zig").TraceEvent;
const TraceEventWriter = @import("json_rpc_tracer.zig").TraceEventWriter;
const primitives = @import("primitives");

test "JsonRpcTracer initialization" {
    var tracer = JsonRpcTracer.init(testing.allocator);
    defer tracer.deinit();
    
    // Test that the tracer initializes properly
    try testing.expect(tracer.current_depth == 0);
    try testing.expect(tracer.execution_stack.items.len == 0);
}

test "JsonRpcTracer with writer" {
    var output = std.ArrayList(u8).init(testing.allocator);
    defer output.deinit();
    
    const writer = output.writer().any();
    
    var tracer = try JsonRpcTracer.initWithWriter(testing.allocator, writer);
    defer tracer.deinit();
    
    // Test that trace writer is created
    try testing.expect(tracer.trace_writer != null);
}

test "TraceEventWriter JSON serialization" {
    var output = std.ArrayList(u8).init(testing.allocator);
    defer output.deinit();
    
    const writer = output.writer().any();
    
    var trace_writer = try TraceEventWriter.init(testing.allocator, writer, .{});
    defer trace_writer.deinit();
    
    // Create a test event
    const event = TraceEvent{
        .timestamp = 12345,
        .event_type = .execution_start,
        .data = .{
            .execution_start = .{
                .from = primitives.ZERO_ADDRESS,
                .to = primitives.ZERO_ADDRESS,
                .value = 0,
                .input = &.{},
                .gas = 1000000,
            },
        },
    };
    
    try trace_writer.writeEvent(event);
    
    // Verify JSON output contains expected fields
    const json = output.items;
    try testing.expect(std.mem.indexOf(u8, json, "\"timestamp\":12345") != null);
    try testing.expect(std.mem.indexOf(u8, json, "\"type\":\"execution_start\"") != null);
    try testing.expect(std.mem.indexOf(u8, json, "\"gas\":\"0xf4240\"") != null);
}

test "TraceEvent step serialization" {
    var output = std.ArrayList(u8).init(testing.allocator);
    defer output.deinit();
    
    const writer = output.writer().any();
    
    var trace_writer = try TraceEventWriter.init(testing.allocator, writer, .{
        .filter = .{
            .include_stack = true,
            .max_stack_items = 2,
        },
    });
    defer trace_writer.deinit();
    
    // Create a step event
    const stack = [_]u256{ 0x123, 0x456, 0x789 };
    const event = TraceEvent{
        .timestamp = 67890,
        .event_type = .step,
        .data = .{
            .step = .{
                .pc = 10,
                .op = 0x01, // ADD
                .op_name = "ADD",
                .gas = 999000,
                .gas_cost = 3,
                .stack = &stack,
                .memory = &.{},
                .memory_size = 32,
                .depth = 1,
                .return_data = &.{},
                .error_msg = null,
            },
        },
    };
    
    try trace_writer.writeEvent(event);
    
    const json = output.items;
    
    // Verify step fields
    try testing.expect(std.mem.indexOf(u8, json, "\"pc\":10") != null);
    try testing.expect(std.mem.indexOf(u8, json, "\"op\":1") != null);
    try testing.expect(std.mem.indexOf(u8, json, "\"opName\":\"ADD\"") != null);
    
    // Verify stack (should only include first 2 items due to max_stack_items)
    try testing.expect(std.mem.indexOf(u8, json, "\"stack\":[") != null);
    try testing.expect(std.mem.indexOf(u8, json, "\"0x0000000000000000000000000000000000000000000000000000000000000123\"") != null);
    try testing.expect(std.mem.indexOf(u8, json, "\"0x0000000000000000000000000000000000000000000000000000000000000456\"") != null);
}

test "JsonRpcTracer delegates to DefaultTracer" {
    var output = std.ArrayList(u8).init(testing.allocator);
    defer output.deinit();
    
    const writer = output.writer().any();
    
    var tracer = try JsonRpcTracer.initWithWriter(testing.allocator, writer);
    defer tracer.deinit();
    
    // Test that validation is enabled by default
    try testing.expect(tracer.config.enable_validation == true);
    try testing.expect(tracer.config.enable_streaming == true);
    
    // Test delegation methods don't crash
    tracer.onFrameStart(100, 1000000, 0);
    tracer.onFrameComplete(999000, 32);
    tracer.onArenaInit(1024, 1048576, 200);
}