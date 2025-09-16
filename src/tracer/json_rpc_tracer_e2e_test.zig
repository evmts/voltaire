/// End-to-end test for JsonRpcTracer producing actual JSON-RPC traces
const std = @import("std");
const testing = std.testing;
const evm = @import("../root.zig");
const primitives = @import("primitives");
const JsonRpcTracer = @import("json_rpc_tracer.zig").JsonRpcTracer;
const Frame = @import("../frame/frame.zig").Frame;
const DefaultConfig = @import("../frame/frame.zig").DefaultConfig;
const Memory = @import("../memory/memory.zig").Memory;
const Stack = @import("../stack/stack.zig").Stack;
const Dispatch = @import("../preprocessor/dispatch.zig").Dispatch;

test "JsonRpcTracer E2E - Simple bytecode execution with trace output" {
    const allocator = testing.allocator;
    
    // Create output buffer to capture JSON trace
    var output_buffer = std.ArrayList(u8).init(allocator);
    defer output_buffer.deinit();
    
    const writer = output_buffer.writer().any();
    
    // Initialize JsonRpcTracer with output writer
    var tracer = try JsonRpcTracer.initWithWriter(allocator, writer);
    defer tracer.deinit();
    
    // Simple bytecode: PUSH1 0x02, PUSH1 0x03, ADD, STOP
    // This pushes 2 and 3 onto the stack, adds them, and stops
    const bytecode = [_]u8{
        0x60, 0x02,  // PUSH1 0x02
        0x60, 0x03,  // PUSH1 0x03
        0x01,        // ADD
        0x00,        // STOP
    };
    
    // Create a minimal EVM setup
    var main_evm = try evm.Evm.init(allocator, .{});
    defer main_evm.deinit(allocator);
    
    // Set up blockchain context
    main_evm.set_chain_id(1);
    main_evm.gas_price = 1000000000; // 1 gwei
    main_evm.set_block_info(.{
        .number = 1000,
        .timestamp = 1234567890,
        .gas_limit = 30_000_000,
        .difficulty = 0,
        .base_fee = 1000000000,
        .coinbase = primitives.ZERO_ADDRESS,
        .blob_base_fee = 0,
    });
    
    // Create dispatch schedule from bytecode
    var dispatch = try Dispatch(DefaultConfig).init(allocator, &bytecode);
    defer dispatch.deinit(allocator);
    
    // Initialize frame with our tracer
    var frame = try Frame(DefaultConfig, @TypeOf(&tracer)).init(
        allocator,
        .{
            .evm_ptr = &main_evm,
            .dispatch = dispatch,
            .contract_address = primitives.ZERO_ADDRESS,
            .caller = primitives.ZERO_ADDRESS,
            .value = 0,
            .calldata_slice = &.{},
            .gas_limit = 100000,
            .depth = 1,
            .tracer = &tracer,
        }
    );
    defer frame.deinit(allocator);
    
    // Execute the bytecode
    const result = frame.interpret();
    
    // Check execution succeeded
    try testing.expect(result == .stop);
    
    // Flush any remaining trace events
    if (tracer.trace_writer) |tw| {
        _ = tw.underlying.context.writerWrite(tw.underlying.context.ptr, "") catch {};
    }
    
    // Parse and verify the JSON trace output
    const trace_output = output_buffer.items;
    
    // Print the trace for debugging
    std.debug.print("\n=== JSON-RPC Trace Output ===\n", .{});
    std.debug.print("{s}\n", .{trace_output});
    std.debug.print("=== End Trace ===\n\n", .{});
    
    // Verify trace contains expected events
    try testing.expect(trace_output.len > 0);
    
    // Check for execution_start event
    try testing.expect(std.mem.indexOf(u8, trace_output, "\"type\":\"execution_start\"") != null);
    
    // Check for step events with our opcodes
    try testing.expect(std.mem.indexOf(u8, trace_output, "\"opName\":\"PUSH1\"") != null);
    try testing.expect(std.mem.indexOf(u8, trace_output, "\"opName\":\"ADD\"") != null);
    try testing.expect(std.mem.indexOf(u8, trace_output, "\"opName\":\"STOP\"") != null);
    
    // Check for execution_end event
    try testing.expect(std.mem.indexOf(u8, trace_output, "\"type\":\"execution_end\"") != null);
    
    // Verify stack operations captured
    try testing.expect(std.mem.indexOf(u8, trace_output, "\"stack\":[") != null);
    
    // Verify gas tracking
    try testing.expect(std.mem.indexOf(u8, trace_output, "\"gas\":") != null);
    try testing.expect(std.mem.indexOf(u8, trace_output, "\"gasUsed\":") != null);
}

test "JsonRpcTracer E2E - Complex execution with CALL" {
    const allocator = testing.allocator;
    
    // Create output buffer
    var output_buffer = std.ArrayList(u8).init(allocator);
    defer output_buffer.deinit();
    
    const writer = output_buffer.writer().any();
    
    // Initialize tracer
    var tracer = try JsonRpcTracer.initWithWriter(allocator, writer);
    defer tracer.deinit();
    
    // More complex bytecode with memory operations
    // PUSH1 0x40, PUSH1 0x80, MSTORE, PUSH1 0x40, MLOAD, STOP
    const bytecode = [_]u8{
        0x60, 0x40,  // PUSH1 0x40 (value to store)
        0x60, 0x80,  // PUSH1 0x80 (memory offset)
        0x52,        // MSTORE
        0x60, 0x80,  // PUSH1 0x80 (memory offset)
        0x51,        // MLOAD
        0x00,        // STOP
    };
    
    // Set up EVM
    var main_evm = try evm.Evm.init(allocator, .{});
    defer main_evm.deinit(allocator);
    
    main_evm.set_chain_id(1);
    main_evm.gas_price = 1000000000;
    main_evm.set_block_info(.{
        .number = 2000,
        .timestamp = 1234567890,
        .gas_limit = 30_000_000,
        .difficulty = 0,
        .base_fee = 1000000000,
        .coinbase = primitives.ZERO_ADDRESS,
        .blob_base_fee = 0,
    });
    
    // Create dispatch
    var dispatch = try Dispatch(DefaultConfig).init(allocator, &bytecode);
    defer dispatch.deinit(allocator);
    
    // Initialize frame
    var frame = try Frame(DefaultConfig, @TypeOf(&tracer)).init(
        allocator,
        .{
            .evm_ptr = &main_evm,
            .dispatch = dispatch,
            .contract_address = primitives.ZERO_ADDRESS,
            .caller = primitives.ZERO_ADDRESS,
            .value = 0,
            .calldata_slice = &.{},
            .gas_limit = 100000,
            .depth = 1,
            .tracer = &tracer,
        }
    );
    defer frame.deinit(allocator);
    
    // Execute
    const result = frame.interpret();
    try testing.expect(result == .stop);
    
    // Get trace output
    const trace_output = output_buffer.items;
    
    // Print trace
    std.debug.print("\n=== Complex Trace Output ===\n", .{});
    std.debug.print("{s}\n", .{trace_output});
    std.debug.print("=== End Trace ===\n\n", .{});
    
    // Verify memory operations are traced
    try testing.expect(std.mem.indexOf(u8, trace_output, "\"opName\":\"MSTORE\"") != null);
    try testing.expect(std.mem.indexOf(u8, trace_output, "\"opName\":\"MLOAD\"") != null);
    
    // Verify memory size is tracked
    try testing.expect(std.mem.indexOf(u8, trace_output, "\"memSize\":") != null);
}

test "JsonRpcTracer E2E - Verify JSON format validity" {
    const allocator = testing.allocator;
    
    var output_buffer = std.ArrayList(u8).init(allocator);
    defer output_buffer.deinit();
    
    const writer = output_buffer.writer().any();
    
    var tracer = try JsonRpcTracer.initWithWriter(allocator, writer);
    defer tracer.deinit();
    
    // Simple bytecode
    const bytecode = [_]u8{
        0x60, 0x01,  // PUSH1 0x01
        0x00,        // STOP
    };
    
    var main_evm = try evm.Evm.init(allocator, .{});
    defer main_evm.deinit(allocator);
    
    main_evm.set_chain_id(1);
    main_evm.set_block_info(.{
        .number = 1,
        .timestamp = 1000000000,
        .gas_limit = 30_000_000,
        .difficulty = 0,
        .base_fee = 1000000000,
        .coinbase = primitives.ZERO_ADDRESS,
        .blob_base_fee = 0,
    });
    
    var dispatch = try Dispatch(DefaultConfig).init(allocator, &bytecode);
    defer dispatch.deinit(allocator);
    
    var frame = try Frame(DefaultConfig, @TypeOf(&tracer)).init(
        allocator,
        .{
            .evm_ptr = &main_evm,
            .dispatch = dispatch,
            .contract_address = primitives.ZERO_ADDRESS,
            .caller = primitives.ZERO_ADDRESS,
            .value = 0,
            .calldata_slice = &.{},
            .gas_limit = 100000,
            .depth = 1,
            .tracer = &tracer,
        }
    );
    defer frame.deinit(allocator);
    
    _ = frame.interpret();
    
    const trace_output = output_buffer.items;
    
    // Split by newlines to get individual JSON events
    var lines = std.mem.tokenize(u8, trace_output, "\n");
    var event_count: usize = 0;
    
    while (lines.next()) |line| {
        if (line.len == 0) continue;
        event_count += 1;
        
        // Each line should be valid JSON
        // Check basic JSON structure
        try testing.expect(std.mem.startsWith(u8, line, "{"));
        try testing.expect(std.mem.endsWith(u8, line, "}"));
        
        // Check required fields
        try testing.expect(std.mem.indexOf(u8, line, "\"timestamp\":") != null);
        try testing.expect(std.mem.indexOf(u8, line, "\"type\":") != null);
        try testing.expect(std.mem.indexOf(u8, line, "\"data\":") != null);
    }
    
    // Should have at least execution_start, steps, and execution_end
    try testing.expect(event_count >= 3);
    
    std.debug.print("\nTotal events traced: {}\n", .{event_count});
}