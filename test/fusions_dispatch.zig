const std = @import("std");
const testing = std.testing;
const log = @import("log");
const bytecode_mod = @import("evm").bytecode;
const dispatch_mod = @import("evm").dispatch;
const frame_mod = @import("evm").frame;
const frame_config_mod = @import("evm").frame_config;
const MemoryDatabase = @import("evm").memory_database.MemoryDatabase;
const Address = @import("primitives").Address.Address;
const NoOpTracer = @import("evm").tracer.NoOpTracer;
const Evm = @import("evm").evm.Evm;

// Test configuration for frame
const test_config = frame_config_mod.FrameConfig{
    .stack_size = 1024,
    .WordType = u256,
    .max_bytecode_size = 1024,
    .block_gas_limit = 30_000_000,
    .DatabaseType = MemoryDatabase,
    .TracerType = NoOpTracer,
    .memory_initial_capacity = 4096,
    .memory_limit = 0xFFFFFF,
};

const TestFrame = frame_mod.Frame(test_config);
const TestBytecode = bytecode_mod.Bytecode(.{ .max_bytecode_size = test_config.max_bytecode_size });
const TestDispatch = dispatch_mod.Dispatch(TestFrame);

test "fusion dispatch: verify jump resolution for ten-thousand-hashes" {
    std.testing.log_level = .debug;
    const allocator = testing.allocator;
    
    const ten_thousand_hashes_bytecode = @embedFile("../bench/official/cases/ten-thousand-hashes/bytecode.txt");
    
    std.log.info("Testing ten-thousand-hashes dispatch with fusion", .{});
    
    // Parse the bytecode with fusion enabled
    const bytecode_analysis = try TestBytecode.initFromHex(
        allocator,
        std.mem.trim(u8, ten_thousand_hashes_bytecode, " \n\r"),
        .{ .enable_fusion = true }
    );
    defer bytecode_analysis.deinit(allocator);
    
    // Check for fusions in the analyzed bytecode
    var push_jump_count: usize = 0;
    var push_jumpi_count: usize = 0;
    
    for (bytecode_analysis.code) |byte| {
        switch (byte) {
            .push_jump_fusion => |data| {
                push_jump_count += 1;
                std.log.info("Found PUSH_JUMP fusion with value 0x{x}", .{data.value});
            },
            .push_jumpi_fusion => |data| {
                push_jumpi_count += 1;
                std.log.info("Found PUSH_JUMPI fusion with value 0x{x}", .{data.value});
            },
            else => {},
        }
    }
    
    std.log.info("Bytecode analysis found {} PUSH_JUMP and {} PUSH_JUMPI fusions", .{ push_jump_count, push_jumpi_count });
    try testing.expect(push_jump_count > 0 or push_jumpi_count > 0);
    
    // Create dispatch with fusion enabled
    std.log.info("Creating dispatch...", .{});
    const dispatch_result = try TestDispatch.init(allocator, bytecode_analysis, .{});
    defer dispatch_result.deinit(allocator);
    
    std.log.info("Dispatch created with {} items", .{ dispatch_result.schedule.len });
    
    // Check if known_jumps were populated
    if (dispatch_result.known_jumps) |known_jumps| {
        std.log.info("Dispatch has {} known jumps to resolve", .{known_jumps.len});
        
        // Log the known jumps before resolution
        for (known_jumps, 0..) |jump, i| {
            std.log.info("Known jump[{}]: schedule_idx={}, pc=0x{x}, is_jumpi={}", .{
                i, jump.schedule_index, jump.pc, jump.is_jumpi
            });
        }
    } else {
        std.log.err("No known jumps array in dispatch result!", .{});
        try testing.expect(false);
    }
    
    // Create jump table AND resolve jumps
    std.log.info("Creating jump table and resolving jumps...", .{});
    const jump_table = try TestDispatch.createJumpTableAndResolve(
        allocator, 
        dispatch_result.schedule,
        bytecode_analysis,
        dispatch_result.known_jumps
    );
    defer allocator.free(jump_table.entries);
    
    std.log.info("Jump table created with {} entries", .{ jump_table.entries.len });
    
    // Log jump table entries
    for (jump_table.entries, 0..) |entry, i| {
        std.log.info("Jump table[{}]: pc=0x{x}, cursor=0x{x}", .{
            i, entry.pc, @intFromPtr(entry.dispatch.cursor)
        });
    }
    
    // Now verify that jump destinations were resolved (non-zero)
    var unresolved_count: usize = 0;
    var resolved_count: usize = 0;
    
    if (dispatch_result.known_jumps) |known_jumps| {
        for (known_jumps, 0..) |jump, i| {
            // Check the metadata at the schedule index
            const metadata_index = jump.schedule_index;
            if (metadata_index >= dispatch_result.schedule.len) {
                std.log.err("Invalid metadata index {} (schedule len {})", .{ metadata_index, dispatch_result.schedule.len });
                continue;
            }
            
            // Get the metadata item (it's the item after the handler)
            const metadata_item = dispatch_result.schedule[metadata_index];
            
            // Check if it's a jump metadata type
            if (jump.is_jumpi) {
                // For JUMPI, check push_jumpi metadata
                const destination = metadata_item.push_jumpi.destination;
                if (destination == 0) {
                    std.log.warn("Jump[{}] UNRESOLVED: PUSH_JUMPI at schedule index {}, PC=0x{x}", .{ 
                        i, metadata_index, jump.pc 
                    });
                    unresolved_count += 1;
                } else {
                    std.log.info("Jump[{}] RESOLVED: PUSH_JUMPI at schedule index {}, PC=0x{x} -> cursor=0x{x}", .{ 
                        i, metadata_index, jump.pc, destination 
                    });
                    resolved_count += 1;
                }
            } else {
                // For JUMP, check push_jump metadata
                const destination = metadata_item.push_jump.destination;
                if (destination == 0) {
                    std.log.warn("Jump[{}] UNRESOLVED: PUSH_JUMP at schedule index {}, PC=0x{x}", .{ 
                        i, metadata_index, jump.pc 
                    });
                    unresolved_count += 1;
                } else {
                    std.log.info("Jump[{}] RESOLVED: PUSH_JUMP at schedule index {}, PC=0x{x} -> cursor=0x{x}", .{ 
                        i, metadata_index, jump.pc, destination 
                    });
                    resolved_count += 1;
                }
            }
        }
    }
    
    std.log.info("Jump resolution summary: {} resolved, {} unresolved", .{ resolved_count, unresolved_count });
    
    // All jumps should be resolved
    try testing.expectEqual(@as(usize, 0), unresolved_count);
    try testing.expect(resolved_count > 0);
}

test "fusion dispatch: simple PUSH+JUMPI resolution" {
    std.testing.log_level = .debug;
    const allocator = testing.allocator;
    
    // Simple bytecode with PUSH+JUMPI that should be fused
    // PC: 0: PUSH1 1 (condition)
    // PC: 2: PUSH1 7 (jump dest)  
    // PC: 4: JUMPI
    // PC: 5: INVALID
    // PC: 6: INVALID
    // PC: 7: JUMPDEST
    // PC: 8: STOP
    const bytecode_hex = "60016007576EFEFE5B00";
    
    std.log.info("Testing simple PUSH+JUMPI dispatch resolution", .{});
    
    // Parse the bytecode with fusion enabled
    const bytecode_analysis = try TestBytecode.initFromHex(
        allocator,
        bytecode_hex,
        .{ .enable_fusion = true }
    );
    defer bytecode_analysis.deinit(allocator);
    
    // Create dispatch
    const dispatch_result = try TestDispatch.init(allocator, bytecode_analysis, .{});
    defer dispatch_result.deinit(allocator);
    
    std.log.info("Dispatch created with {} items", .{ dispatch_result.schedule.len });
    
    // Check known jumps
    if (dispatch_result.known_jumps) |known_jumps| {
        std.log.info("Found {} known jumps", .{known_jumps.len});
        for (known_jumps, 0..) |jump, i| {
            std.log.info("Jump[{}]: schedule_idx={}, pc=0x{x}, is_jumpi={}", .{
                i, jump.schedule_index, jump.pc, jump.is_jumpi
            });
        }
    }
    
    // Create jump table and resolve
    const jump_table = try TestDispatch.createJumpTableAndResolve(
        allocator,
        dispatch_result.schedule,
        bytecode_analysis,
        dispatch_result.known_jumps
    );
    defer allocator.free(jump_table.entries);
    
    std.log.info("Jump table has {} entries", .{jump_table.entries.len});
    
    // Verify resolution
    if (dispatch_result.known_jumps) |known_jumps| {
        for (known_jumps) |jump| {
            const metadata_index = jump.schedule_index;
            const metadata_item = dispatch_result.schedule[metadata_index];
            
            if (jump.is_jumpi) {
                const destination = metadata_item.push_jumpi.destination;
                std.log.info("PUSH_JUMPI destination: 0x{x}", .{destination});
                try testing.expect(destination != 0);
            }
        }
    }
}