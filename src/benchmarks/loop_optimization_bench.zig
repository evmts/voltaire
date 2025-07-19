const std = @import("std");
const testing = std.testing;

// Timer utility for micro-benchmarks
const Timer = std.time.Timer;

// Benchmark loop counter patterns
const BenchmarkConfig = struct {
    iterations: usize = 10000,
    sizes: []const usize = &[_]usize{ 16, 32, 64, 256, 1024, 4096 },
};

const config = BenchmarkConfig{};

// Standard counting up from 0 pattern
fn standard_loop_pattern(data: []u256, size: usize) void {
    for (0..size) |i| {
        data[i] = i;
    }
}

// Optimized counting from negative to zero pattern
fn optimized_loop_pattern(data: []u256, size: usize) void {
    var i: isize = -@as(isize, @intCast(size));
    while (i < 0) : (i += 1) {
        const idx = @as(usize, @intCast(i + @as(isize, @intCast(size))));
        data[idx] = idx;
    }
}

// Standard 32-byte hash operations
fn standard_hash_xor(a: [32]u8, b: [32]u8) [32]u8 {
    var result: [32]u8 = undefined;
    for (0..32) |i| {
        result[i] = a[i] ^ b[i];
    }
    return result;
}

// Optimized 32-byte hash operations
fn optimized_hash_xor(a: [32]u8, b: [32]u8) [32]u8 {
    var result: [32]u8 = undefined;
    var i: isize = -32;
    while (i < 0) : (i += 1) {
        const idx = @as(usize, @intCast(i + 32));
        result[idx] = a[idx] ^ b[idx];
    }
    return result;
}

// Standard byte shifting pattern (like PUSH operations)
fn standard_byte_shift(bytes: []const u8, count: usize) u256 {
    var value: u256 = 0;
    for (0..count) |i| {
        if (i < bytes.len) {
            value = (value << 8) | bytes[i];
        } else {
            value = value << 8;
        }
    }
    return value;
}

// Optimized byte shifting pattern
fn optimized_byte_shift(bytes: []const u8, count: usize) u256 {
    var value: u256 = 0;
    var i: isize = -@as(isize, @intCast(count));
    while (i < 0) : (i += 1) {
        const idx = @as(usize, @intCast(i + @as(isize, @intCast(count))));
        if (idx < bytes.len) {
            value = (value << 8) | bytes[idx];
        } else {
            value = value << 8;
        }
    }
    return value;
}

test "benchmark loop counter patterns" {
    std.testing.log_level = .debug;
    
    const allocator = testing.allocator;
    
    std.log.info("=== Loop Counter Optimization Benchmarks ===\n", .{});
    
    for (config.sizes) |size| {
        const data = try allocator.alloc(u256, size);
        defer allocator.free(data);
        
        // Warmup
        for (0..100) |_| {
            standard_loop_pattern(data, size);
        }
        
        // Benchmark standard loop
        var timer = try Timer.start();
        const start_standard = timer.read();
        for (0..config.iterations) |_| {
            standard_loop_pattern(data, size);
        }
        const end_standard = timer.read();
        const standard_time = end_standard - start_standard;
        
        // Reset data
        @memset(data, 0);
        
        // Warmup optimized
        for (0..100) |_| {
            optimized_loop_pattern(data, size);
        }
        
        // Benchmark optimized loop
        timer.reset();
        const start_optimized = timer.read();
        for (0..config.iterations) |_| {
            optimized_loop_pattern(data, size);
        }
        const end_optimized = timer.read();
        const optimized_time = end_optimized - start_optimized;
        
        const improvement = if (standard_time > optimized_time) 
            @as(f64, @floatFromInt(standard_time - optimized_time)) * 100.0 / @as(f64, @floatFromInt(standard_time))
        else 
            -@as(f64, @floatFromInt(optimized_time - standard_time)) * 100.0 / @as(f64, @floatFromInt(standard_time));
            
        std.log.info("Size {}: Standard={}ns, Optimized={}ns, Change={d:.2}%", .{ 
            size, standard_time, optimized_time, improvement 
        });
    }
}

test "benchmark hash operations" {
    std.testing.log_level = .debug;
    
    std.log.info("\n=== Hash Operations Benchmark ===\n", .{});
    
    const a = [_]u8{0xAA} ** 32;
    const b = [_]u8{0x55} ** 32;
    
    // Warmup
    for (0..1000) |_| {
        _ = standard_hash_xor(a, b);
    }
    
    // Benchmark standard hash operations
    var timer = try Timer.start();
    const start_standard = timer.read();
    for (0..config.iterations * 10) |_| {
        _ = standard_hash_xor(a, b);
    }
    const end_standard = timer.read();
    const standard_time = end_standard - start_standard;
    
    // Warmup optimized
    for (0..1000) |_| {
        _ = optimized_hash_xor(a, b);
    }
    
    // Benchmark optimized hash operations
    timer.reset();
    const start_optimized = timer.read();
    for (0..config.iterations * 10) |_| {
        _ = optimized_hash_xor(a, b);
    }
    const end_optimized = timer.read();
    const optimized_time = end_optimized - start_optimized;
    
    const improvement = if (standard_time > optimized_time)
        @as(f64, @floatFromInt(standard_time - optimized_time)) * 100.0 / @as(f64, @floatFromInt(standard_time))
    else 
        -@as(f64, @floatFromInt(optimized_time - standard_time)) * 100.0 / @as(f64, @floatFromInt(standard_time));
        
    std.log.info("Hash XOR: Standard={}ns, Optimized={}ns, Change={d:.2}%", .{ 
        standard_time, optimized_time, improvement 
    });
}

test "benchmark byte shifting (PUSH-like operations)" {
    std.testing.log_level = .debug;
    
    std.log.info("\n=== Byte Shifting Benchmark ===\n", .{});
    
    const test_bytes = [_]u8{ 0x01, 0x23, 0x45, 0x67, 0x89, 0xAB, 0xCD, 0xEF } ** 4;
    const sizes = [_]usize{ 1, 4, 8, 16, 32 };
    
    for (sizes) |size| {
        // Warmup
        for (0..1000) |_| {
            _ = standard_byte_shift(&test_bytes, size);
        }
        
        // Benchmark standard byte shifting
        var timer = try Timer.start();
        const start_standard = timer.read();
        for (0..config.iterations * 5) |_| {
            _ = standard_byte_shift(&test_bytes, size);
        }
        const end_standard = timer.read();
        const standard_time = end_standard - start_standard;
        
        // Warmup optimized
        for (0..1000) |_| {
            _ = optimized_byte_shift(&test_bytes, size);
        }
        
        // Benchmark optimized byte shifting
        timer.reset();
        const start_optimized = timer.read();
        for (0..config.iterations * 5) |_| {
            _ = optimized_byte_shift(&test_bytes, size);
        }
        const end_optimized = timer.read();
        const optimized_time = end_optimized - start_optimized;
        
        const improvement = if (standard_time > optimized_time)
            @as(f64, @floatFromInt(standard_time - optimized_time)) * 100.0 / @as(f64, @floatFromInt(standard_time))
        else 
            -@as(f64, @floatFromInt(optimized_time - standard_time)) * 100.0 / @as(f64, @floatFromInt(standard_time));
            
        std.log.info("Byte shift ({}): Standard={}ns, Optimized={}ns, Change={d:.2}%", .{ 
            size, standard_time, optimized_time, improvement 
        });
    }
}

test "verify correctness of optimized patterns" {
    const allocator = testing.allocator;
    
    // Test array pattern correctness
    const size = 64;
    const data1 = try allocator.alloc(u256, size);
    const data2 = try allocator.alloc(u256, size);
    defer allocator.free(data1);
    defer allocator.free(data2);
    
    standard_loop_pattern(data1, size);
    optimized_loop_pattern(data2, size);
    
    for (0..size) |i| {
        try testing.expectEqual(data1[i], data2[i]);
    }
    
    // Test hash operation correctness
    const a = [_]u8{0xAA} ** 32;
    const b = [_]u8{0x55} ** 32;
    
    const result1 = standard_hash_xor(a, b);
    const result2 = optimized_hash_xor(a, b);
    
    try testing.expectEqualSlices(u8, &result1, &result2);
    
    // Test byte shifting correctness
    const test_bytes = [_]u8{ 0x01, 0x23, 0x45, 0x67 };
    
    const value1 = standard_byte_shift(&test_bytes, 4);
    const value2 = optimized_byte_shift(&test_bytes, 4);
    
    try testing.expectEqual(value1, value2);
    
    std.log.info("All correctness tests passed!", .{});
}

test "architecture-specific performance notes" {
    std.testing.log_level = .debug;
    
    const builtin = @import("builtin");
    std.log.info("\n=== Architecture Information ===", .{});
    std.log.info("CPU Architecture: {s}", .{@tagName(builtin.cpu.arch)});
    std.log.info("Optimization Mode: {s}", .{@tagName(builtin.mode)});
    
    // Note: Results may vary by architecture
    // x86-64: May show benefits due to efficient zero-flag checks
    // ARM64: May show benefits due to conditional execution
    // WASM: Benefits depend on JS engine optimizations
}