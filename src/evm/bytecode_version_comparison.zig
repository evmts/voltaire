/// Benchmark comparing bytecode4 (multi-pass) vs bytecode5 (single-pass)

const std = @import("std");
const Bytecode4 = @import("bytecode4.zig").Bytecode;
const Bytecode5 = @import("bytecode5.zig").Bytecode;
const BytecodeConfig = @import("bytecode_config.zig").BytecodeConfig;
const Opcode = @import("opcode.zig").Opcode;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();
    
    std.debug.print("\n📊 Bytecode Version Comparison\n", .{});
    std.debug.print("==============================\n", .{});
    std.debug.print("Comparing bytecode4 (multi-pass) vs bytecode5 (single-pass)\n\n", .{});
    
    // Test cases with different bytecode patterns
    const test_cases = [_]struct {
        name: []const u8,
        generate: fn(allocator: std.mem.Allocator, size: usize) anyerror![]u8,
    }{
        .{ .name = "Mixed opcodes", .generate = generateMixedCode },
        .{ .name = "Many PUSHes", .generate = generatePushHeavyCode },
        .{ .name = "Many JUMPDESTs", .generate = generateJumpDestHeavyCode },
        .{ .name = "Fusion patterns", .generate = generateFusionPatterns },
    };
    
    const test_sizes = [_]usize{ 100, 1000, 5000, 10000, 50000 };
    
    for (test_cases) |test_case| {
        std.debug.print("\n{s}:\n", .{test_case.name});
        std.debug.print("-" ** 40 ++ "\n", .{});
        
        for (test_sizes) |size| {
            const code = try test_case.generate(allocator, size);
            defer allocator.free(code);
            
            // Benchmark bytecode4 (multi-pass)
            const v4_time = blk: {
                const iterations = 100;
                var total_time: i128 = 0;
                
                for (0..iterations) |_| {
                    const start = std.time.nanoTimestamp();
                    var bytecode = try Bytecode4(BytecodeConfig{}).init(allocator, code);
                    defer bytecode.deinit();
                    const end = std.time.nanoTimestamp();
                    total_time += end - start;
                }
                
                const avg_time = @as(f64, @floatFromInt(total_time)) / @as(f64, iterations) / 1_000_000.0;
                break :blk avg_time;
            };
            
            // Benchmark bytecode5 (single-pass)
            const v5_time = blk: {
                const iterations = 100;
                var total_time: i128 = 0;
                
                for (0..iterations) |_| {
                    const start = std.time.nanoTimestamp();
                    var bytecode = try Bytecode5(BytecodeConfig{}).init(allocator, code);
                    defer bytecode.deinit();
                    const end = std.time.nanoTimestamp();
                    total_time += end - start;
                }
                
                const avg_time = @as(f64, @floatFromInt(total_time)) / @as(f64, iterations) / 1_000_000.0;
                break :blk avg_time;
            };
            
            const speedup = v4_time / v5_time;
            std.debug.print("  {} bytes: v4={d:.3}ms, v5={d:.3}ms, speedup={d:.2}x\n", .{
                size, v4_time, v5_time, speedup
            });
        }
    }
    
    std.debug.print("\n✅ Benchmark completed!\n", .{});
}

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

fn generatePushHeavyCode(allocator: std.mem.Allocator, size: usize) ![]u8 {
    var code = try allocator.alloc(u8, size);
    var i: usize = 0;
    
    while (i < size) {
        if (i % 3 == 0 and i + 2 < size) {
            // PUSH1
            code[i] = @intFromEnum(Opcode.PUSH1);
            code[i + 1] = @truncate(i);
            i += 2;
        } else if (i % 7 == 0 and i + 5 < size) {
            // PUSH4
            code[i] = @intFromEnum(Opcode.PUSH4);
            code[i + 1] = 0x12;
            code[i + 2] = 0x34;
            code[i + 3] = 0x56;
            code[i + 4] = 0x78;
            i += 5;
        } else {
            code[i] = @intFromEnum(Opcode.ADD);
            i += 1;
        }
    }
    
    return code;
}

fn generateJumpDestHeavyCode(allocator: std.mem.Allocator, size: usize) ![]u8 {
    var code = try allocator.alloc(u8, size);
    var i: usize = 0;
    
    while (i < size) {
        if (i % 5 == 0) {
            // JUMPDEST
            code[i] = @intFromEnum(Opcode.JUMPDEST);
            i += 1;
        } else if (i % 10 == 2 and i + 2 < size) {
            // PUSH1 (potential fusion)
            code[i] = @intFromEnum(Opcode.PUSH1);
            code[i + 1] = 0x00;
            i += 2;
        } else {
            code[i] = @intFromEnum(Opcode.STOP);
            i += 1;
        }
    }
    
    return code;
}

fn generateFusionPatterns(allocator: std.mem.Allocator, size: usize) ![]u8 {
    var code = try allocator.alloc(u8, size);
    var i: usize = 0;
    
    while (i + 10 < size) {
        // JUMPDEST + PUSH1 + JUMP pattern
        code[i] = @intFromEnum(Opcode.JUMPDEST);
        code[i + 1] = @intFromEnum(Opcode.PUSH1);
        code[i + 2] = 0x08;
        code[i + 3] = @intFromEnum(Opcode.JUMP);
        code[i + 4] = @intFromEnum(Opcode.INVALID);
        i += 5;
        
        if (i + 5 < size) {
            // Another pattern
            code[i] = @intFromEnum(Opcode.JUMPDEST);
            code[i + 1] = @intFromEnum(Opcode.PUSH1);
            code[i + 2] = 0x00;
            code[i + 3] = @intFromEnum(Opcode.PUSH1);
            code[i + 4] = 0x10;
            i += 5;
        }
    }
    
    // Fill remainder
    while (i < size) : (i += 1) {
        code[i] = @intFromEnum(Opcode.STOP);
    }
    
    return code;
}