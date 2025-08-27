const std = @import("std");
const Bytecode4 = @import("bytecode4.zig").Bytecode;
const Bytecode5 = @import("bytecode5.zig").Bytecode;
const BytecodeConfig = @import("bytecode_config.zig").BytecodeConfig;
const Opcode = @import("opcode.zig").Opcode;

fn generateMixedCode(allocator: std.mem.Allocator, size: usize) ![]u8 {
    var code = try allocator.alloc(u8, size);
    var i: usize = 0;
    
    while (i < size) {
        if (i % 10 == 0 and i + 2 < size) {
            // PUSH1
            code[i] = @intFromEnum(Opcode.PUSH1);
            code[i + 1] = @truncate(i);
            i += 2;
        } else if (i % 15 == 0) {
            // JUMPDEST
            code[i] = @intFromEnum(Opcode.JUMPDEST);
            i += 1;
        } else {
            // Regular opcodes
            const opcodes = [_]u8{
                @intFromEnum(Opcode.ADD),
                @intFromEnum(Opcode.SUB),
                @intFromEnum(Opcode.MUL),
            };
            code[i] = opcodes[i % opcodes.len];
            i += 1;
        }
    }
    
    return code;
}

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();
    
    std.debug.print("\n📊 Bytecode4 vs Bytecode5 Direct Comparison\n", .{});
    std.debug.print("============================================\n\n", .{});
    
    const sizes = [_]usize{ 100, 1000, 5000, 10000 };
    const iterations = 1000;
    
    for (sizes) |size| {
        const code = try generateMixedCode(allocator, size);
        defer allocator.free(code);
        
        // Warmup
        for (0..10) |_| {
            var b4 = try Bytecode4(BytecodeConfig{}).init(allocator, code);
            b4.deinit();
            var b5 = try Bytecode5(BytecodeConfig{}).init(allocator, code);
            b5.deinit();
        }
        
        // Benchmark bytecode4
        const v4_start = std.time.nanoTimestamp();
        for (0..iterations) |_| {
            var bytecode = try Bytecode4(BytecodeConfig{}).init(allocator, code);
            bytecode.deinit();
        }
        const v4_end = std.time.nanoTimestamp();
        const v4_time = @as(f64, @floatFromInt(v4_end - v4_start)) / @as(f64, iterations);
        
        // Benchmark bytecode5  
        const v5_start = std.time.nanoTimestamp();
        for (0..iterations) |_| {
            var bytecode = try Bytecode5(BytecodeConfig{}).init(allocator, code);
            bytecode.deinit();
        }
        const v5_end = std.time.nanoTimestamp();
        const v5_time = @as(f64, @floatFromInt(v5_end - v5_start)) / @as(f64, iterations);
        
        const speedup = v4_time / v5_time;
        const improvement = (v4_time - v5_time) / v4_time * 100.0;
        
        std.debug.print("Size {:>5}: v4={d:>8.0}ns, v5={d:>8.0}ns, speedup={d:>4.2}x", .{
            size, v4_time, v5_time, speedup
        });
        
        if (speedup > 1.0) {
            std.debug.print(" (🚀 {d:.1}% faster)\n", .{improvement});
        } else {
            std.debug.print(" (🐢 {d:.1}% slower)\n", .{-improvement});
        }
    }
    
    std.debug.print("\n✅ Comparison completed!\n", .{});
}