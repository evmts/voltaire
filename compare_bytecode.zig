const std = @import("std");
const evm = @import("src/evm/root.zig");

const Opcode = evm.Opcode;
const BytecodeConfig = evm.BytecodeConfig;
const Bytecode4 = evm.Bytecode4;
const Bytecode5 = evm.Bytecode5;

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
        } else if (i % 20 == 0 and i + 3 < size) {
            // PUSH2
            code[i] = @intFromEnum(Opcode.PUSH2);
            code[i + 1] = 0x01;
            code[i + 2] = 0x00;
            i += 3;
        } else {
            // Regular opcodes
            const opcodes = [_]u8{
                @intFromEnum(Opcode.ADD),
                @intFromEnum(Opcode.SUB),
                @intFromEnum(Opcode.MUL),
                @intFromEnum(Opcode.DIV),
                @intFromEnum(Opcode.DUP1),
                @intFromEnum(Opcode.SWAP1),
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
    
    std.debug.print("\n📊 Bytecode4 vs Bytecode5 Comparison\n", .{});
    std.debug.print("=====================================\n", .{});
    std.debug.print("Comparing multi-pass (v4) vs single-pass (v5) implementation\n\n", .{});
    
    const sizes = [_]usize{ 100, 1000, 5000, 10000, 50000 };
    const iterations = 100;
    
    for (sizes) |size| {
        const code = try generateMixedCode(allocator, size);
        defer allocator.free(code);
        
        // Benchmark bytecode4 (multi-pass)
        const v4_time = blk: {
            var total_time: i128 = 0;
            
            for (0..iterations) |_| {
                const start = std.time.nanoTimestamp();
                var bytecode = try Bytecode4(BytecodeConfig{}).init(allocator, code);
                defer bytecode.deinit();
                const end = std.time.nanoTimestamp();
                total_time += end - start;
            }
            
            const avg_time = @as(f64, @floatFromInt(total_time)) / @as(f64, iterations);
            break :blk avg_time;
        };
        
        // Benchmark bytecode5 (single-pass)
        const v5_time = blk: {
            var total_time: i128 = 0;
            
            for (0..iterations) |_| {
                const start = std.time.nanoTimestamp();
                var bytecode = try Bytecode5(BytecodeConfig{}).init(allocator, code);
                defer bytecode.deinit();
                const end = std.time.nanoTimestamp();
                total_time += end - start;
            }
            
            const avg_time = @as(f64, @floatFromInt(total_time)) / @as(f64, iterations);
            break :blk avg_time;
        };
        
        const speedup = v4_time / v5_time;
        const improvement = (v4_time - v5_time) / v4_time * 100.0;
        
        std.debug.print("Size {:>6}: v4={d:>8.0}ns, v5={d:>8.0}ns, speedup={d:>4.2}x", .{
            size, v4_time, v5_time, speedup
        });
        
        if (speedup > 1.0) {
            std.debug.print(" (🚀 {d:.1}% faster)\n", .{improvement});
        } else {
            std.debug.print(" (🐢 {d:.1}% slower)\n", .{-improvement});
        }
    }
    
    std.debug.print("\n✅ Benchmark completed!\n", .{});
}