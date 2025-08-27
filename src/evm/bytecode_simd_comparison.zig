const std = @import("std");
const Bytecode = @import("bytecode4.zig").Bytecode;
const BytecodeConfig = @import("bytecode_config.zig").BytecodeConfig;
const Opcode = @import("opcode.zig").Opcode;
const builtin = @import("builtin");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();
    
    std.debug.print("\n🚀 Bytecode SIMD vs Scalar Comparison\n", .{});
    std.debug.print("=====================================\n", .{});
    std.debug.print("Architecture: {s}\n", .{@tagName(builtin.cpu.arch)});
    std.debug.print("Testing both scalar (vector_length=1) and SIMD (vector_length=16) paths\n", .{});
    std.debug.print("Note: SIMD path requires bytecode.len >= vector_length for activation\n\n", .{});
    
    // Test cases
    const test_sizes = [_]usize{ 100, 1000, 5000, 10000 };
    
    for (test_sizes) |size| {
        std.debug.print("Testing bytecode size: {} bytes\n", .{size});
        
        // Generate test bytecode with mixed opcodes and PUSH instructions
        var code = try allocator.alloc(u8, size);
        defer allocator.free(code);
        
        var i: usize = 0;
        while (i < size) {
            if (i % 10 == 0 and i + 2 < size) {
                // Add PUSH1 instruction
                code[i] = @intFromEnum(Opcode.PUSH1);
                code[i + 1] = @truncate(i);
                i += 2;
            } else if (i % 15 == 0) {
                // Add JUMPDEST
                code[i] = @intFromEnum(Opcode.JUMPDEST);
                i += 1;
            } else {
                // Add regular opcode
                code[i] = @intFromEnum(Opcode.ADD);
                i += 1;
            }
        }
        
        // Benchmark scalar version (vector_length = 1 forces scalar path)
        const scalar_time = blk: {
            const scalar_config = BytecodeConfig{
                .vector_length = 1, // Force scalar
            };
            
            const iterations = 100;
            var total_time: i128 = 0;
            
            for (0..iterations) |_| {
                const start = std.time.nanoTimestamp();
                var bytecode = try Bytecode(scalar_config).init(allocator, code);
                defer bytecode.deinit();
                const end = std.time.nanoTimestamp();
                total_time += end - start;
            }
            
            const avg_time = @as(f64, @floatFromInt(total_time)) / @as(f64, iterations) / 1_000_000.0;
            std.debug.print("  Scalar (vector_length=1):  {d:.3}ms avg\n", .{avg_time});
            break :blk avg_time;
        };
        
        // Benchmark SIMD version (vector_length = 16 forces SIMD path if size permits)
        const simd_time = blk: {
            const simd_config = BytecodeConfig{
                .vector_length = 16, // Enable SIMD path
            };
            
            const iterations = 100;
            var total_time: i128 = 0;
            
            for (0..iterations) |_| {
                const start = std.time.nanoTimestamp();
                var bytecode = try Bytecode(simd_config).init(allocator, code);
                defer bytecode.deinit();
                const end = std.time.nanoTimestamp();
                total_time += end - start;
            }
            
            const avg_time = @as(f64, @floatFromInt(total_time)) / @as(f64, iterations) / 1_000_000.0;
            std.debug.print("  SIMD (vector_length=16):   {d:.3}ms avg\n", .{avg_time});
            break :blk avg_time;
        };
        
        // Calculate speedup
        const speedup = scalar_time / simd_time;
        std.debug.print("  Speedup: {d:.2}x\n", .{speedup});
        
        std.debug.print("\n", .{});
    }
    
    std.debug.print("✅ Benchmark completed!\n", .{});
}

