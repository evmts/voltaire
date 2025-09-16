/// Example demonstrating how to use the JsonRpcTracer
const std = @import("std");
const JsonRpcTracer = @import("json_rpc_tracer.zig").JsonRpcTracer;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();
    
    // Create a buffer to capture trace output
    var output_buffer = std.ArrayList(u8).init(allocator);
    defer output_buffer.deinit();
    
    // Create writer for output
    const writer = output_buffer.writer().any();
    
    // Initialize JsonRpcTracer with output writer
    var tracer = try JsonRpcTracer.initWithWriter(allocator, writer);
    defer tracer.deinit();
    
    // The tracer is now ready to use with the EVM
    // It will:
    // 1. Run DefaultTracer underneath for validation
    // 2. Stream JSON-RPC compatible trace events to the writer
    // 3. Capture all execution steps, calls, storage changes, etc.
    
    std.debug.print("JsonRpcTracer initialized successfully!\n", .{});
    std.debug.print("Configuration:\n", .{});
    std.debug.print("  - Validation enabled: {}\n", .{tracer.config.enable_validation});
    std.debug.print("  - Streaming enabled: {}\n", .{tracer.config.enable_streaming});
    std.debug.print("  - Include MinimalEvm: {}\n", .{tracer.config.include_minimal_evm});
    
    // Example: The tracer can be passed to the Frame in place of DefaultTracer
    // frame.tracer = &tracer;
    // 
    // Then during execution, the tracer will automatically capture:
    // - Execution start/end events
    // - Each instruction step with gas, stack, memory
    // - Call operations (CALL, DELEGATECALL, etc.)
    // - Storage modifications (SSTORE)
    // - Log events
    // - Revert reasons
    
    // The output is written in JSON Lines format, one event per line
    // Compatible with Ethereum JSON-RPC debug_traceTransaction format
}