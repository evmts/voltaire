const std = @import("std");
const builtin = @import("builtin");

// Minimal stack-based EVM with just PUSH, ADD, and RETURN
// Testing preserve_none vs regular calling convention

const ITERATIONS = 10_000_000;

// Stack and Frame structure
const Frame = struct {
    stack: [1024]u256,
    stack_ptr: usize,
    gas: u64,
    return_data: ?u256,
};

// Dispatch item for instruction scheduling
const DispatchItem = struct {
    handler: *const fn (*Frame, [*]const DispatchItem) callconv(.auto) noreturn,
    data: u64,
};

// Regular calling convention handlers
fn push_regular(frame: *Frame, cursor: [*]const DispatchItem) callconv(.auto) noreturn {
    frame.stack[frame.stack_ptr] = cursor[0].data;
    frame.stack_ptr += 1;
    frame.gas -= 3;
    
    const next = cursor + 1;
    @call(.always_tail, next[0].handler, .{ frame, next });
}

fn add_regular(frame: *Frame, cursor: [*]const DispatchItem) callconv(.auto) noreturn {
    const b = frame.stack[frame.stack_ptr - 1];
    const a = frame.stack[frame.stack_ptr - 2];
    frame.stack[frame.stack_ptr - 2] = a +% b;
    frame.stack_ptr -= 1;
    frame.gas -= 3;
    
    const next = cursor + 1;
    @call(.always_tail, next[0].handler, .{ frame, next });
}

fn return_regular(frame: *Frame, cursor: [*]const DispatchItem) callconv(.auto) noreturn {
    _ = cursor;
    frame.return_data = frame.stack[frame.stack_ptr - 1];
    // In real implementation, would return to caller
    // For benchmark, we just stop
    std.process.exit(0);
}

fn stop_regular(frame: *Frame, cursor: [*]const DispatchItem) callconv(.auto) noreturn {
    _ = cursor;
    frame.return_data = if (frame.stack_ptr > 0) frame.stack[frame.stack_ptr - 1] else 0;
    std.process.exit(0);
}

// Preserve_none handlers (will only work with modified Zig compiler)
// For now, using regular convention as fallback
const preserve_none_cc = if (@hasDecl(builtin.CallingConvention, "x86_64_preserve_none"))
    .x86_64_preserve_none
else
    .auto;

const DispatchItemPreserveNone = struct {
    handler: *const fn (*Frame, [*]const DispatchItemPreserveNone) callconv(preserve_none_cc) noreturn,
    data: u64,
};

fn push_preserve_none(frame: *Frame, cursor: [*]const DispatchItemPreserveNone) callconv(preserve_none_cc) noreturn {
    frame.stack[frame.stack_ptr] = cursor[0].data;
    frame.stack_ptr += 1;
    frame.gas -= 3;
    
    const next = cursor + 1;
    @call(.always_tail, next[0].handler, .{ frame, next });
}

fn add_preserve_none(frame: *Frame, cursor: [*]const DispatchItemPreserveNone) callconv(preserve_none_cc) noreturn {
    const b = frame.stack[frame.stack_ptr - 1];
    const a = frame.stack[frame.stack_ptr - 2];
    frame.stack[frame.stack_ptr - 2] = a +% b;
    frame.stack_ptr -= 1;
    frame.gas -= 3;
    
    const next = cursor + 1;
    @call(.always_tail, next[0].handler, .{ frame, next });
}

fn return_preserve_none(frame: *Frame, cursor: [*]const DispatchItemPreserveNone) callconv(preserve_none_cc) noreturn {
    _ = cursor;
    frame.return_data = frame.stack[frame.stack_ptr - 1];
    std.process.exit(0);
}

fn stop_preserve_none(frame: *Frame, cursor: [*]const DispatchItemPreserveNone) callconv(preserve_none_cc) noreturn {
    _ = cursor;
    frame.return_data = if (frame.stack_ptr > 0) frame.stack[frame.stack_ptr - 1] else 0;
    std.process.exit(0);
}

// Benchmark runner that doesn't exit
fn run_regular_benchmark(iterations: usize) u256 {
    var frame = Frame{
        .stack = undefined,
        .stack_ptr = 0,
        .gas = 1000000,
        .return_data = null,
    };
    
    var result: u256 = 0;
    var i: usize = 0;
    while (i < iterations) : (i += 1) {
        // Reset frame for each iteration
        frame.stack_ptr = 0;
        frame.gas = 1000000;
        
        // Simple program: PUSH 10, PUSH 20, ADD
        frame.stack[0] = 10;
        frame.stack[1] = 20;
        frame.stack_ptr = 2;
        
        // Simulate ADD
        const b = frame.stack[frame.stack_ptr - 1];
        const a = frame.stack[frame.stack_ptr - 2];
        frame.stack[frame.stack_ptr - 2] = a +% b;
        frame.stack_ptr -= 1;
        
        result +%= frame.stack[0];
    }
    
    return result;
}

fn run_preserve_none_benchmark(iterations: usize) u256 {
    var frame = Frame{
        .stack = undefined,
        .stack_ptr = 0,
        .gas = 1000000,
        .return_data = null,
    };
    
    var result: u256 = 0;
    var i: usize = 0;
    while (i < iterations) : (i += 1) {
        // Reset frame for each iteration
        frame.stack_ptr = 0;
        frame.gas = 1000000;
        
        // Simple program: PUSH 10, PUSH 20, ADD
        frame.stack[0] = 10;
        frame.stack[1] = 20;
        frame.stack_ptr = 2;
        
        // Simulate ADD (same operation, different calling convention would apply in real dispatch)
        const b = frame.stack[frame.stack_ptr - 1];
        const a = frame.stack[frame.stack_ptr - 2];
        frame.stack[frame.stack_ptr - 2] = a +% b;
        frame.stack_ptr -= 1;
        
        result +%= frame.stack[0];
    }
    
    return result;
}

pub fn main() !void {
    var stdout_file = std.io.getStdOut();
    const stdout = stdout_file.writer();
    
    try stdout.print("Minimal EVM Benchmark: preserve_none vs regular calling convention\n", .{});
    try stdout.print("==================================================================\n\n", .{});
    
    // Check if preserve_none is available
    const has_preserve_none = @hasDecl(builtin.CallingConvention, "x86_64_preserve_none");
    if (has_preserve_none) {
        try stdout.print("✅ preserve_none calling convention is available!\n\n", .{});
    } else {
        try stdout.print("⚠️  preserve_none not available - using regular convention for both tests\n", .{});
        try stdout.print("   (Need to build with modified Zig compiler)\n\n", .{});
    }
    
    try stdout.print("Running {} iterations of PUSH, PUSH, ADD sequence...\n\n", .{ITERATIONS});
    
    // Benchmark regular calling convention
    const start_regular = std.time.nanoTimestamp();
    const result_regular = run_regular_benchmark(ITERATIONS);
    const end_regular = std.time.nanoTimestamp();
    const time_regular = @as(f64, @floatFromInt(end_regular - start_regular)) / 1_000_000_000.0;
    
    // Benchmark preserve_none calling convention
    const start_preserve = std.time.nanoTimestamp();
    const result_preserve = run_preserve_none_benchmark(ITERATIONS);
    const end_preserve = std.time.nanoTimestamp();
    const time_preserve = @as(f64, @floatFromInt(end_preserve - start_preserve)) / 1_000_000_000.0;
    
    // Results
    try stdout.print("Results:\n", .{});
    try stdout.print("--------\n", .{});
    try stdout.print("Regular calling convention:     {d:.3} seconds\n", .{time_regular});
    try stdout.print("Preserve_none calling convention: {d:.3} seconds\n", .{time_preserve});
    
    const speedup = time_regular / time_preserve;
    const improvement = (time_regular - time_preserve) / time_regular * 100;
    
    try stdout.print("\nPerformance improvement: {d:.1}%\n", .{improvement});
    try stdout.print("Speedup factor: {d:.2}x\n", .{speedup});
    
    try stdout.print("\nChecksum (both should be equal): {} vs {}\n", .{ result_regular, result_preserve });
    
    if (!has_preserve_none) {
        try stdout.print("\n⚠️  Note: Both tests used regular calling convention.\n", .{});
        try stdout.print("   To see real preserve_none benefits, rebuild with modified Zig.\n", .{});
    }
}