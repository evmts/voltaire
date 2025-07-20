const std = @import("std");
const zbench = @import("zbench");
const evm = @import("evm");
const primitives = @import("primitives");

/// Benchmark comparing normal execution vs block-based gas accounting
pub fn benchmarkBlockGasAccounting(allocator: std.mem.Allocator) !void {
    const sample_size = 100;
    const iterations = 1000;

    // Create test bytecode with linear operations
    const linear_code = &[_]u8{
        0x60, 0x01, // PUSH1 1
        0x60, 0x02, // PUSH1 2
        0x01,       // ADD
        0x60, 0x03, // PUSH1 3
        0x01,       // ADD
        0x60, 0x04, // PUSH1 4
        0x01,       // ADD
        0x60, 0x05, // PUSH1 5
        0x01,       // ADD
        0x60, 0x06, // PUSH1 6
        0x01,       // ADD
        0x60, 0x07, // PUSH1 7
        0x01,       // ADD
        0x60, 0x08, // PUSH1 8
        0x01,       // ADD
        0x60, 0x09, // PUSH1 9
        0x01,       // ADD
        0x60, 0x0A, // PUSH1 10
        0x01,       // ADD
        0x00,       // STOP
    };

    // Create test bytecode with jumps
    const jump_code = &[_]u8{
        0x60, 0x0A, // PUSH1 10 (jump destination)
        0x56,       // JUMP
        0xFE,       // INVALID
        0xFE,       // INVALID
        0xFE,       // INVALID
        0xFE,       // INVALID
        0xFE,       // INVALID
        0xFE,       // INVALID
        0x5B,       // JUMPDEST
        0x60, 0x01, // PUSH1 1
        0x60, 0x02, // PUSH1 2
        0x01,       // ADD
        0x00,       // STOP
    };

    // Benchmark configurations
    const configs = [_]struct {
        name: []const u8,
        code: []const u8,
    }{
        .{ .name = "Linear Code - Normal", .code = linear_code },
        .{ .name = "Linear Code - Block", .code = linear_code },
        .{ .name = "Jump Code - Normal", .code = jump_code },
        .{ .name = "Jump Code - Block", .code = jump_code },
    };

    std.debug.print("\n=== Block Gas Accounting Benchmark ===\n", .{});
    std.debug.print("Sample size: {}, Iterations per sample: {}\n\n", .{ sample_size, iterations });

    for (configs, 0..) |config, i| {
        const is_block_mode = std.mem.indexOf(u8, config.name, "Block") != null;

        var b = zbench.Benchmark.init(allocator, .{
            .name = config.name,
            .sample_size = sample_size,
        });
        defer b.deinit();

        try b.run(struct {
            pub fn run() !void {
                var memory_db = evm.MemoryDatabase.init(allocator);
                defer memory_db.deinit();

                const db_interface = memory_db.toDatabaseInterface();
                var vm = try evm.Evm.init(allocator, db_interface);
                defer vm.deinit();

                // Enable block execution for block mode benchmarks
                if (is_block_mode) {
                    try vm.enableBlockExecution(.{
                        .enabled = true,
                        .min_block_size = 2,
                        .cache_blocks = true,
                        .max_cache_entries = 100,
                    });
                }

                // Execute multiple times
                for (0..iterations) |_| {
                    var contract = try evm.Contract.init(allocator, config.code, .{ 
                        .address = primitives.Address.ZERO 
                    });
                    defer contract.deinit(allocator, null);

                    _ = try vm.interpret(&contract, &.{});
                }
            }
        }.run);
    }

    std.debug.print("\n=== Performance Comparison ===\n", .{});
    std.debug.print("Expected improvement: 20-40%% for linear code\n", .{});
    std.debug.print("Expected improvement: 10-20%% for code with jumps\n", .{});
}

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    try benchmarkBlockGasAccounting(allocator);
}