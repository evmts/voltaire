/// Optimized Keccak-256 hash function implementation for EVM
/// 
/// Provides high-performance Keccak-256 hashing for the KECCAK256 opcode:
/// - Platform-optimized implementations
/// - SIMD acceleration where available
/// - Fallback to standard library implementation
/// - EVM-compliant output format
/// 
/// Keccak-256 is used extensively in Ethereum for state tree hashes,
/// transaction hashes, and smart contract operations.
const std = @import("std");
const builtin = @import("builtin");
// TODO it should be it's own rust package
const c = if (builtin.target.cpu.arch != .wasm32) @cImport({
    @cInclude("../revm_wrapper/revm_wrapper.h");
}) else struct {
    // Empty struct for WASM builds
};

pub const KeccakError = error{
    InvalidInput,
    ExecutionError,
    StateError,
    MemoryError,
    Unknown,
};

/// Assembly-optimized KECCAK256 hash function
/// 
/// This function uses the high-performance keccak-asm Rust crate which provides
/// assembly-optimized implementations for different CPU architectures.
pub fn keccak256(data: []const u8, out_hash: *[32]u8) !void {
    // Use standard library implementation for WASM
    if (comptime (builtin.target.cpu.arch == .wasm32)) {
        std.crypto.hash.sha3.Keccak256.hash(data, out_hash, .{});
        return;
    }
    
    var error_ptr: ?*c.RevmError = null;
    
    const result = c.keccak256_asm(
        data.ptr,
        data.len,
        out_hash.ptr,
        &error_ptr,
    );
    
    if (result != 1) {
        defer if (error_ptr) |err| c.revm_free_error(err);
        
        if (error_ptr) |err| {
            const code = err.code;
            return switch (code) {
                1 => KeccakError.InvalidInput,
                2 => KeccakError.ExecutionError,
                3 => KeccakError.StateError,
                4 => KeccakError.MemoryError,
                else => KeccakError.Unknown,
            };
        } else {
            return KeccakError.Unknown;
        }
    }
}

/// Batch hash multiple inputs using assembly optimization
/// 
/// This function is more efficient than calling keccak256 multiple times
/// due to reduced FFI overhead.
pub fn keccak256_batch(inputs: [][]const u8, outputs: [][32]u8) !void {
    if (inputs.len != outputs.len) {
        return KeccakError.InvalidInput;
    }
    
    if (inputs.len == 0) {
        return; // Nothing to do
    }
    
    // Use standard library implementation for WASM
    if (comptime (builtin.target.cpu.arch == .wasm32)) {
        for (inputs, outputs) |input, *output| {
            std.crypto.hash.sha3.Keccak256.hash(input, output, .{});
        }
        return;
    }
    
    // Create arrays of pointers and lengths for C interface
    // Use page allocator for WASM, c_allocator for other targets
    const allocator = if (comptime (builtin.target.cpu.arch == .wasm32))
        std.heap.page_allocator
    else
        std.heap.c_allocator;
    const input_ptrs = try allocator.alloc([*c]const u8, inputs.len);
    defer allocator.free(input_ptrs);
    
    const input_lens = try allocator.alloc(usize, inputs.len);
    defer allocator.free(input_lens);
    
    for (inputs, 0..) |input, i| {
        input_ptrs[i] = input.ptr;
        input_lens[i] = input.len;
    }
    
    var error_ptr: ?*c.RevmError = null;
    
    const result = c.keccak256_asm_batch(
        input_ptrs.ptr,
        input_lens.ptr,
        inputs.len,
        @as([*c]u8, @ptrCast(outputs.ptr)),
        &error_ptr,
    );
    
    if (result != 1) {
        defer if (error_ptr) |err| c.revm_free_error(err);
        
        if (error_ptr) |err| {
            const code = err.code;
            return switch (code) {
                1 => KeccakError.InvalidInput,
                2 => KeccakError.ExecutionError,
                3 => KeccakError.StateError,
                4 => KeccakError.MemoryError,
                else => KeccakError.Unknown,
            };
        } else {
            return KeccakError.Unknown;
        }
    }
}

/// Convert bytes to u256 (big-endian)
pub fn bytes_to_u256(bytes: [32]u8) u256 {
    var result: u256 = 0;
    for (bytes) |byte| {
        result = (result << 8) | @as(u256, byte);
    }
    return result;
}

/// Convert u256 to bytes (big-endian)
pub fn u256_to_bytes(value: u256) [32]u8 {
    var bytes: [32]u8 = undefined;
    var temp = value;
    var i: usize = 32;
    while (i > 0) {
        i -= 1;
        bytes[i] = @truncate(temp);
        temp >>= 8;
    }
    return bytes;
}

/// KECCAK256 that returns u256 for direct EVM stack usage
pub fn keccak256_u256(data: []const u8) !u256 {
    var hash: [32]u8 = undefined;
    try keccak256(data, &hash);
    return bytes_to_u256(hash);
}

/// Performance benchmark comparing assembly vs standard implementation
pub fn benchmark_comparison(data: []const u8, iterations: u32) !struct {
    asm_time_ns: u64,
    std_time_ns: u64,
    speedup: f64,
} {
    var hash_out: [32]u8 = undefined;
    var timer = std.time.Timer.start() catch return error.TimerUnsupported;
    
    // Benchmark assembly implementation
    timer.reset();
    for (0..iterations) |_| {
        try keccak256(data, &hash_out);
    }
    const asm_time = timer.read();
    
    // Benchmark standard library implementation
    timer.reset();
    for (0..iterations) |_| {
        std.crypto.hash.sha3.Keccak256.hash(data, &hash_out, .{});
    }
    const std_time = timer.read();
    
    const speedup = @as(f64, @floatFromInt(std_time)) / @as(f64, @floatFromInt(asm_time));
    
    return .{
        .asm_time_ns = asm_time,
        .std_time_ns = std_time,
        .speedup = speedup,
    };
}

// Tests
test "keccak256 empty string" {
    const data: []const u8 = &.{};
    var hash: [32]u8 = undefined;
    try keccak256(data, &hash);
    
    // Expected hash for empty string
    const expected = [_]u8{ 
        0xc5, 0xd2, 0x46, 0x01, 0x86, 0xf7, 0x23, 0x3c, 
        0x92, 0x7e, 0x7d, 0xb2, 0xdc, 0xc7, 0x03, 0xc0, 
        0xe5, 0x00, 0xb6, 0x53, 0xca, 0x82, 0x27, 0x3b, 
        0x7b, 0xfa, 0xd8, 0x04, 0x5d, 0x85, 0xa4, 0x70 
    };
    
    try std.testing.expectEqualSlices(u8, &expected, &hash);
}

test "keccak256 Hello" {
    const data = "Hello";
    var hash: [32]u8 = undefined;
    try keccak256(data, &hash);
    
    // Expected hash for "Hello"
    const expected = [_]u8{
        0x06, 0xb3, 0xdf, 0xae, 0xc1, 0x48, 0xfb, 0x1b,
        0xb2, 0xb0, 0x66, 0xf1, 0x0e, 0xc2, 0x85, 0xe7,
        0xc9, 0xbf, 0x40, 0x2a, 0xb3, 0x2a, 0xa7, 0x8a,
        0x5d, 0x38, 0xe3, 0x45, 0x66, 0x81, 0x0c, 0xd2,
    };
    
    try std.testing.expectEqualSlices(u8, &expected, &hash);
}

test "keccak256_u256" {
    const data = "Hello";
    const result = try keccak256_u256(data);
    
    // Expected as u256
    const expected: u256 = 0x06b3dfaec148fb1bb2b066f10ec285e7c9bf402ab32aa78a5d38e34566810cd2;
    
    try std.testing.expectEqual(expected, result);
}

test "keccak256_batch" {
    var inputs = [_][]const u8{ "Hello", "World", "" };
    var outputs: [3][32]u8 = undefined;
    
    try keccak256_batch(inputs[0..], outputs[0..]);
    
    // Verify each hash individually
    var expected_hello: [32]u8 = undefined;
    try keccak256("Hello", &expected_hello);
    
    var expected_world: [32]u8 = undefined;
    try keccak256("World", &expected_world);
    
    var expected_empty: [32]u8 = undefined;
    try keccak256("", &expected_empty);
    
    try std.testing.expectEqualSlices(u8, &expected_hello, &outputs[0]);
    try std.testing.expectEqualSlices(u8, &expected_world, &outputs[1]);
    try std.testing.expectEqualSlices(u8, &expected_empty, &outputs[2]);
}

test "bytes_to_u256 conversion" {
    const bytes = [_]u8{0} ** 31 ++ [_]u8{0x42};
    const result = bytes_to_u256(bytes);
    try std.testing.expectEqual(@as(u256, 0x42), result);
}

test "u256_to_bytes conversion" {
    const value: u256 = 0x1234567890abcdef;
    const bytes = u256_to_bytes(value);
    const expected = [_]u8{0} ** 24 ++ [_]u8{ 0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef };
    try std.testing.expectEqualSlices(u8, &expected, &bytes);
}
