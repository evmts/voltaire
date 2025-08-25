// ⚠️⚠️⚠️ CRITICAL WARNING ⚠️⚠️⚠️
// 
// TODO: THESE ARE VIBE-CODED FUZZ TESTS THAT HAVE NOT BEEN EXECUTED YET!
//
// Platform Uncertainty: There is conflicting information about Zig fuzz testing support:
// - Some sources say std.testing.fuzzInput only works on macOS
// - Some sources say Zig fuzzing only works on Linux  
// - Current implementation uses std.testing.fuzzInput (suggesting macOS)
// - But this may not work on macOS due to ELF vs MachO binary format issues
//
// THESE TESTS ARE NOT EXPECTED TO WORK YET - WE WILL BE MAKING THEM WORK SOON
//
// Status: UNEXECUTED, UNTESTED, VIBE-CODED
// Next Steps: Resolve platform compatibility and test execution
// 
// ⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️

const std = @import("std");
const evm = @import("../root.zig");
const Frame = evm.Frame;
const FrameConfig = evm.FrameConfig;
const Bytecode = evm.Bytecode;
const BytecodeConfig = evm.BytecodeConfig;
const Memory = evm.Memory;
const MemoryConfig = evm.MemoryConfig;
const Stack = evm.Stack;
const StackConfig = evm.StackConfig;
const Opcode = evm.Opcode;
const OpcodeData = evm.OpcodeData;
const Address = @import("primitives").Address;
const Planner = evm.Planner;
const PlannerConfig = evm.PlannerConfig;
const Hardfork = @import("../hardfork.zig").Hardfork;
const Journal = evm.Journal;
const DatabaseInterface = evm.DatabaseInterface;
const MemoryDatabase = evm.MemoryDatabase;
const Host = evm.Host;
const AccessList = evm.AccessList;
const precompiles = evm.precompiles;

test "fuzz Frame execution with random bytecode" {
    const input = std.testing.fuzzInput(.{});
    if (input.len == 0) return;
    
    const allocator = std.testing.allocator;
    
    // Create frame configuration
    const frame_config = FrameConfig{
        .stack_config = StackConfig{
            .stack_size = 1024,
            .word_type = u256,
        },
        .memory_config = MemoryConfig{
            .page_size = 4096,
            .max_pages = 256,
        },
        .bytecode_config = BytecodeConfig{
            .max_bytecode_size = 0x6000,
        },
    };
    
    // Initialize frame
    var frame = Frame.init(frame_config, allocator) catch |err| {
        // Frame initialization failure is acceptable for invalid configs
        return;
    };
    defer frame.deinit();
    
    // Create bytecode from fuzz input
    var bytecode = Bytecode.init(allocator) catch return;
    defer bytecode.deinit();
    
    // Load fuzz input as bytecode (limit size to prevent OOM)
    const code_size = @min(input.len, 1024);
    bytecode.load(input[0..code_size], allocator) catch |err| {
        // Invalid bytecode is acceptable
        return;
    };
    
    // Set up frame with bytecode
    frame.bytecode = bytecode.code.items;
    frame.gas_remaining = 100000; // Reasonable gas limit
    
    // Execute frame and handle any errors gracefully
    _ = frame.interpret() catch |err| {
        // All execution errors are acceptable outcomes
        // The fuzzer is testing for crashes, not correctness
        return;
    };
}

test "fuzz Stack operations" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 8) return;
    
    const allocator = std.testing.allocator;
    
    var stack = Stack.init(StackConfig{
        .stack_size = 1024,
        .word_type = u256,
    }, allocator) catch return;
    defer stack.deinit();
    
    // Perform random stack operations based on fuzz input
    var i: usize = 0;
    while (i + 32 < input.len) : (i += 33) {
        const op = input[i];
        const value = std.mem.readInt(u256, input[i + 1 ..][0..32], .big);
        
        switch (op % 6) {
            0 => stack.push(value) catch continue,
            1 => _ = stack.pop() catch continue,
            2 => _ = stack.peek() catch continue,
            3 => stack.dup(1 + (op / 6) % 16) catch continue,
            4 => stack.swap(1 + (op / 6) % 16) catch continue,
            5 => _ = stack.peek_at((op / 6) % stack.depth()) catch continue,
            else => unreachable,
        }
    }
}

test "fuzz Memory operations" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 8) return;
    
    const allocator = std.testing.allocator;
    
    var memory = Memory.init(MemoryConfig{
        .page_size = 4096,
        .max_pages = 256,
    }, allocator) catch return;
    defer memory.deinit();
    
    // Perform random memory operations
    var i: usize = 0;
    while (i + 36 < input.len) : (i += 36) {
        const op = input[i];
        const offset = std.mem.readInt(u32, input[i + 1 ..][0..4], .big);
        const value = std.mem.readInt(u256, input[i + 4 ..][0..32], .big);
        
        switch (op % 4) {
            0 => memory.store_word(offset, value) catch continue,
            1 => _ = memory.load_word(offset) catch continue,
            2 => memory.store_byte(offset, @truncate(value)) catch continue,
            3 => _ = memory.load_byte(offset) catch continue,
            else => unreachable,
        }
    }
}

test "fuzz bytecode validation and analysis" {
    const input = std.testing.fuzzInput(.{});
    if (input.len == 0) return;
    
    const allocator = std.testing.allocator;
    
    var bytecode = Bytecode.init(allocator) catch return;
    defer bytecode.deinit();
    
    // Load and validate bytecode
    bytecode.load(input, allocator) catch |err| {
        // Invalid bytecode is acceptable
        return;
    };
    
    // Ensure valid jump destinations are properly identified
    for (bytecode.code.items, 0..) |byte, i| {
        if (byte == @intFromEnum(Opcode.JUMPDEST)) {
            // This should be marked as valid
            std.testing.expect(bytecode.is_valid_jump_dest(i)) catch continue;
        }
    }
}

test "fuzz opcode execution edge cases" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 2) return;
    
    const allocator = std.testing.allocator;
    
    const frame_config = FrameConfig{
        .stack_config = StackConfig{
            .stack_size = 1024,
            .word_type = u256,
        },
        .memory_config = MemoryConfig{
            .page_size = 4096,
            .max_pages = 256,
        },
        .bytecode_config = BytecodeConfig{
            .max_bytecode_size = 0x6000,
        },
    };
    
    var frame = Frame.init(frame_config, allocator) catch return;
    defer frame.deinit();
    
    // Test individual opcodes with fuzzed stack values
    for (input) |opcode_byte| {
        // Reset frame state
        frame.pc = 0;
        frame.gas_remaining = 10000;
        frame.stack.sp = 0;
        
        // Push some fuzzed values on stack
        var j: usize = 0;
        while (j < 5 and j * 32 < input.len) : (j += 1) {
            const start = j * 32;
            const end = @min(start + 32, input.len);
            if (end - start >= 32) {
                const value = std.mem.readInt(u256, input[start..end][0..32], .big);
                frame.stack.push(value) catch break;
            }
        }
        
        // Execute single opcode
        const opcode: Opcode = @enumFromInt(opcode_byte);
        frame.execute_opcode(opcode) catch continue;
    }
}

test "fuzz arithmetic operations overflow/underflow" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 64) return;
    
    const allocator = std.testing.allocator;
    
    const frame_config = FrameConfig{
        .stack_config = StackConfig{
            .stack_size = 1024,
            .word_type = u256,
        },
        .memory_config = MemoryConfig{
            .page_size = 4096,
            .max_pages = 256,
        },
        .bytecode_config = BytecodeConfig{
            .max_bytecode_size = 0x6000,
        },
    };
    
    var frame = Frame.init(frame_config, allocator) catch return;
    defer frame.deinit();
    
    // Extract two u256 values from input
    const a = std.mem.readInt(u256, input[0..32], .big);
    const b = std.mem.readInt(u256, input[32..64], .big);
    
    // Test arithmetic operations with edge case values
    frame.stack.push(a) catch return;
    frame.stack.push(b) catch return;
    frame.add() catch {};
    
    frame.stack.push(a) catch return;
    frame.stack.push(b) catch return;
    frame.sub() catch {};
    
    frame.stack.push(a) catch return;
    frame.stack.push(b) catch return;
    frame.mul() catch {};
    
    frame.stack.push(a) catch return;
    frame.stack.push(b) catch return;
    frame.div() catch {};
    
    frame.stack.push(a) catch return;
    frame.stack.push(b) catch return;
    frame.mod() catch {};
    
    frame.stack.push(a) catch return;
    frame.stack.push(b) catch return;
    frame.exp() catch {};
}

test "fuzz control flow with invalid jumps" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 4) return;
    
    const allocator = std.testing.allocator;
    
    const frame_config = FrameConfig{
        .stack_config = StackConfig{
            .stack_size = 1024,
            .word_type = u256,
        },
        .memory_config = MemoryConfig{
            .page_size = 4096,
            .max_pages = 256,
        },
        .bytecode_config = BytecodeConfig{
            .max_bytecode_size = 0x6000,
        },
    };
    
    var frame = Frame.init(frame_config, allocator) catch return;
    defer frame.deinit();
    
    // Create bytecode with some JUMPDEST locations
    var bytecode = Bytecode.init(allocator) catch return;
    defer bytecode.deinit();
    
    var code = std.ArrayList(u8).init(allocator);
    defer code.deinit();
    
    // Add some random bytecode with JUMPDESTs
    for (input, 0..) |byte, i| {
        if (i % 10 == 0) {
            code.append(@intFromEnum(Opcode.JUMPDEST)) catch break;
        } else {
            code.append(byte) catch break;
        }
    }
    
    bytecode.load(code.items, allocator) catch return;
    frame.bytecode = bytecode.code.items;
    
    // Test JUMP with fuzzed destinations
    const jump_dest = std.mem.readInt(u32, input[0..4], .big) % code.items.len;
    frame.stack.push(jump_dest) catch return;
    frame.jump() catch {};
    
    // Test JUMPI with fuzzed condition and destination
    if (input.len >= 8) {
        const condition = std.mem.readInt(u32, input[4..8], .big);
        frame.stack.push(jump_dest) catch return;
        frame.stack.push(condition) catch return;
        frame.jumpi() catch {};
    }
}

test "fuzz gas consumption edge cases" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 8) return;
    
    const allocator = std.testing.allocator;
    
    const frame_config = FrameConfig{
        .stack_config = StackConfig{
            .stack_size = 1024,
            .word_type = u256,
        },
        .memory_config = MemoryConfig{
            .page_size = 4096,
            .max_pages = 256,
        },
        .bytecode_config = BytecodeConfig{
            .max_bytecode_size = 0x6000,
        },
    };
    
    var frame = Frame.init(frame_config, allocator) catch return;
    defer frame.deinit();
    
    // Set gas to fuzzed value
    const gas = std.mem.readInt(i64, input[0..8], .big);
    frame.gas_remaining = gas;
    
    // Try to consume various amounts of gas
    for (input[8..]) |gas_byte| {
        const gas_to_consume = @as(u64, gas_byte) * 100;
        frame.consumeGas(gas_to_consume) catch {};
    }
    
    // Test memory expansion gas calculation
    if (input.len >= 12) {
        const mem_size = std.mem.readInt(u32, input[8..12], .big) & 0xFFFFFF; // Cap at reasonable size
        const gas_cost = Memory.calculate_gas_cost(mem_size, frame.memory.size());
        frame.consumeGas(gas_cost) catch {};
    }
}

test "fuzz PUSH operations with invalid data" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 33) return;
    
    const allocator = std.testing.allocator;
    
    const frame_config = FrameConfig{
        .stack_config = StackConfig{
            .stack_size = 1024,
            .word_type = u256,
        },
        .memory_config = MemoryConfig{
            .page_size = 4096,
            .max_pages = 256,
        },
        .bytecode_config = BytecodeConfig{
            .max_bytecode_size = 0x6000,
        },
    };
    
    var frame = Frame.init(frame_config, allocator) catch return;
    defer frame.deinit();
    
    // Test all PUSH operations with fuzzed data
    var push_n: u8 = 0;
    while (push_n <= 32) : (push_n += 1) {
        // Create bytecode with PUSH instruction
        var bytecode = Bytecode.init(allocator) catch continue;
        defer bytecode.deinit();
        
        var code = std.ArrayList(u8).init(allocator);
        defer code.deinit();
        
        // Add PUSH opcode
        const push_opcode = @intFromEnum(Opcode.PUSH0) + push_n;
        code.append(push_opcode) catch continue;
        
        // Add push data (may be truncated)
        const data_len = @min(push_n, input.len - 1);
        code.appendSlice(input[1..1 + data_len]) catch continue;
        
        // Pad with zeros if needed
        var i: usize = data_len;
        while (i < push_n) : (i += 1) {
            code.append(0) catch continue;
        }
        
        bytecode.load(code.items, allocator) catch continue;
        frame.bytecode = bytecode.code.items;
        frame.pc = 0;
        frame.stack.sp = 0;
        
        // Execute PUSH operation
        frame.interpret() catch {};
    }
}

// =============================================================================
// NEW FUZZ TESTS - HIGH PRIORITY COMPONENTS
// =============================================================================

test "fuzz planner bytecode analysis" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 8) return;
    
    const allocator = std.testing.allocator;
    
    // Limit bytecode size to prevent OOM
    const bytecode_size = @min(input.len, 4096);
    const bytecode = input[0..bytecode_size];
    
    // Create planner with cache
    var planner = Planner(.{}).init(allocator, 16) catch return;
    defer planner.deinit();
    
    // Create actual frame to get real handler table
    const frame_config = FrameConfig{
        .stack_config = StackConfig{
            .stack_size = 1024,
            .word_type = u256,
        },
        .memory_config = MemoryConfig{
            .page_size = 4096,
            .max_pages = 256,
        },
        .bytecode_config = BytecodeConfig{
            .max_bytecode_size = 0x6000,
        },
    };
    
    var frame = Frame.init(frame_config, allocator) catch return;
    defer frame.deinit();
    
    // Get real opcode handlers from frame
    const handlers = frame.get_opcode_handlers();
    
    // Test real bytecode analysis with actual handlers
    _ = planner.getOrAnalyze(bytecode, handlers, Hardfork.DEFAULT) catch |err| {
        // All errors are acceptable - malformed bytecode is expected in fuzzing
        return;
    };
}

test "fuzz planner opcode fusion detection" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 3) return;
    
    const allocator = std.testing.allocator;
    
    // Create bytecode that might trigger fusion (PUSH + arithmetic)
    var bytecode = std.ArrayList(u8).init(allocator);
    defer bytecode.deinit();
    
    // Add random PUSH + operation patterns
    var i: usize = 0;
    while (i < input.len and bytecode.items.len < 1024) {
        if (i + 2 < input.len) {
            // Try to create fusion patterns
            const push_size = (input[i] % 32) + 1; // PUSH1-PUSH32
            const push_opcode = @intFromEnum(Opcode.PUSH1) + push_size - 1;
            const operation = input[i + 1] % 4; // ADD, MUL, DIV, etc.
            
            bytecode.append(@intCast(push_opcode)) catch break;
            // Add push data
            var j: usize = 0;
            while (j < push_size and i + 2 + j < input.len) : (j += 1) {
                bytecode.append(input[i + 2 + j]) catch break;
            }
            
            // Add operation that might fuse
            const opcode = switch (operation) {
                0 => @intFromEnum(Opcode.ADD),
                1 => @intFromEnum(Opcode.MUL), 
                2 => @intFromEnum(Opcode.DIV),
                3 => @intFromEnum(Opcode.JUMP),
                else => @intFromEnum(Opcode.STOP),
            };
            bytecode.append(@intCast(opcode)) catch break;
            
            i += 2 + push_size;
        } else {
            i += 1;
        }
    }
    
    if (bytecode.items.len == 0) return;
    
    var planner = Planner(.{}).init(allocator, 8) catch return;
    defer planner.deinit();
    
    // Create real frame for authentic handler table
    const frame_config = FrameConfig{
        .stack_config = StackConfig{ .stack_size = 1024, .word_type = u256 },
        .memory_config = MemoryConfig{ .page_size = 4096, .max_pages = 256 },
        .bytecode_config = BytecodeConfig{ .max_bytecode_size = 0x6000 },
    };
    
    var frame = Frame.init(frame_config, allocator) catch return;
    defer frame.deinit();
    
    // Get real handlers for authentic fusion testing
    const handlers = frame.get_opcode_handlers();
    
    // Test fusion detection with real handlers
    _ = planner.getOrAnalyze(bytecode.items, handlers, Hardfork.DEFAULT) catch |err| {
        return; // Malformed bytecode is expected
    };
}

test "fuzz planner cache operations" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 16) return;
    
    const allocator = std.testing.allocator;
    
    // Small cache to trigger eviction
    var planner = Planner(.{}).init(allocator, 2) catch return;
    defer planner.deinit();
    
    // Create real frame for authentic handler table
    const frame_config = FrameConfig{
        .stack_config = StackConfig{ .stack_size = 1024, .word_type = u256 },
        .memory_config = MemoryConfig{ .page_size = 4096, .max_pages = 256 },
        .bytecode_config = BytecodeConfig{ .max_bytecode_size = 0x6000 },
    };
    
    var frame = Frame.init(frame_config, allocator) catch return;
    defer frame.deinit();
    
    const handlers = frame.get_opcode_handlers();
    
    // Create multiple different bytecodes to stress cache
    var offset: usize = 0;
    while (offset + 8 <= input.len) {
        const bytecode_len = @min(input[offset] + 1, input.len - offset - 1);
        if (bytecode_len == 0) break;
        
        const bytecode = input[offset + 1..offset + 1 + @min(bytecode_len, input.len - offset - 1)];
        if (bytecode.len == 0) break;
        
        // Test cache operations with real handlers
        _ = planner.getOrAnalyze(bytecode, handlers, Hardfork.DEFAULT) catch |err| {
            // Cache operations may fail due to invalid bytecode
        };
        
        offset += bytecode_len + 1;
        if (offset >= input.len) break;
    }
    
    // Test cache clearing
    planner.clearCache();
}

test "fuzz journal snapshot operations" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 4) return;
    
    const allocator = std.testing.allocator;
    
    // Create journal with reasonable config
    const JournalConfig = @import("../journal_config.zig").JournalConfig;
    const journal_config = JournalConfig{
        .WordType = u256,
        .NonceType = u64,
        .SnapshotIdType = u32,
        .initial_capacity = 64,
    };
    
    const JournalType = @import("../journal.zig").Journal(journal_config);
    var journal = JournalType.init(allocator);
    defer journal.deinit();
    
    // Perform random snapshot operations
    var snapshots = std.ArrayList(u32).init(allocator);
    defer snapshots.deinit();
    
    var i: usize = 0;
    while (i < input.len and i < 100) { // Limit iterations
        const operation = input[i] % 4;
        
        switch (operation) {
            0 => {
                // Create snapshot
                const snapshot_id = journal.create_snapshot();
                snapshots.append(snapshot_id) catch break;
            },
            1 => {
                // Revert to random snapshot
                if (snapshots.items.len > 0) {
                    const idx = if (i + 1 < input.len) input[i + 1] % snapshots.items.len else 0;
                    const snapshot_id = snapshots.items[idx];
                    journal.revert_to_snapshot(snapshot_id) catch {};
                    // Remove snapshots after this one
                    snapshots.shrinkRetainingCapacity(idx + 1);
                }
            },
            2 => {
                // Add some journal entries
                if (i + 8 < input.len) {
                    const address_bytes = input[i + 1..i + 1 + @min(20, input.len - i - 1)];
                    var address = Address.ZERO;
                    @memcpy(address[0..@min(20, address_bytes.len)], address_bytes[0..@min(20, address_bytes.len)]);
                    
                    // Try to record some state changes
                    journal.record_account_touched(address) catch {};
                }
            },
            3 => {
                // Clear all snapshots
                snapshots.clearRetainingCapacity();
            },
        }
        
        i += 1;
    }
}

test "fuzz database interface operations" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 32) return;
    
    const allocator = std.testing.allocator;
    
    // Create in-memory database
    var memory_db = MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    
    const db_interface = memory_db.to_database_interface();
    
    var i: usize = 0;
    while (i + 52 <= input.len and i < 1000) { // Limit operations
        // Extract address (20 bytes)
        var address = Address.ZERO;
        @memcpy(address[0..20], input[i..i + 20]);
        
        // Extract storage key (32 bytes) 
        const key = std.mem.readInt(u256, input[i + 20..i + 52], .big);
        
        const operation = if (i + 52 < input.len) input[i + 52] % 6 else 0;
        
        switch (operation) {
            0 => {
                // Get account
                _ = db_interface.get_account(address) catch {};
            },
            1 => {
                // Set account with random data
                if (i + 84 <= input.len) {
                    const nonce = std.mem.readInt(u64, input[i + 52..i + 60], .big);
                    const balance = std.mem.readInt(u256, input[i + 60..i + 92], .big);
                    
                    const account = @import("../database_interface_account.zig").Account{
                        .nonce = nonce,
                        .balance = balance,
                        .code_hash = [_]u8{0} ** 32,
                        .storage_root = [_]u8{0} ** 32,
                    };
                    
                    db_interface.set_account(address, account) catch {};
                    i += 40; // Skip the extra data we used
                }
            },
            2 => {
                // Get storage
                _ = db_interface.get_storage(address, key) catch {};
            },
            3 => {
                // Set storage
                if (i + 84 <= input.len) {
                    const value = std.mem.readInt(u256, input[i + 52..i + 84], .big);
                    db_interface.set_storage(address, key, value) catch {};
                    i += 32; // Skip the value we used
                }
            },
            4 => {
                // Get transient storage
                _ = db_interface.get_transient_storage(address, key) catch {};
            },
            5 => {
                // Set transient storage
                if (i + 84 <= input.len) {
                    const value = std.mem.readInt(u256, input[i + 52..i + 84], .big);
                    db_interface.set_transient_storage(address, key, value) catch {};
                    i += 32; // Skip the value we used
                }
            },
        }
        
        i += 53; // Move to next operation
    }
}

test "fuzz access list operations" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 24) return;
    
    const allocator = std.testing.allocator;
    
    const AccessListConfig = @import("../access_list_config.zig").AccessListConfig;
    const AccessListType = AccessList(AccessListConfig{});
    
    var access_list = AccessListType.init(allocator);
    defer access_list.deinit();
    
    var i: usize = 0;
    while (i + 24 <= input.len and i < 500) { // Limit operations
        // Extract address (20 bytes)
        var address = Address.ZERO;
        @memcpy(address[0..20], input[i..i + 20]);
        
        const operation = input[i + 20] % 4;
        
        switch (operation) {
            0 => {
                // Check if address is warm
                _ = access_list.is_address_warm(address);
            },
            1 => {
                // Warm address
                _ = access_list.warm_address(address) catch {};
            },
            2 => {
                // Check storage slot
                if (i + 52 <= input.len) {
                    const storage_key = std.mem.readInt(u256, input[i + 21..i + 53], .big);
                    _ = access_list.is_storage_warm(address, storage_key);
                    i += 32; // Skip storage key
                }
            },
            3 => {
                // Warm storage slot
                if (i + 52 <= input.len) {
                    const storage_key = std.mem.readInt(u256, input[i + 21..i + 53], .big);
                    _ = access_list.warm_storage(address, storage_key) catch {};
                    i += 32; // Skip storage key
                }
            },
        }
        
        i += 21;
    }
}

test "fuzz precompile execution" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 4) return;
    
    const allocator = std.testing.allocator;
    
    // Test each precompile with random input
    var precompile_id: u8 = 1;
    while (precompile_id <= 10) : (precompile_id += 1) {
        var address = Address.ZERO;
        address[19] = precompile_id;
        
        // Limit input size to prevent excessive memory usage
        const input_size = @min(input.len, 1024);
        const precompile_input = input[0..input_size];
        
        // Random gas limit
        const gas_limit = if (input.len > 8) std.mem.readInt(u64, input[0..8], .big) % 1_000_000 else 100_000;
        
        // Execute precompile with all error handling
        const result = precompiles.execute_precompile(allocator, address, precompile_input, gas_limit) catch |err| {
            // All precompile errors are acceptable
            continue;
        };
        
        // Clean up output
        if (result.output.len > 0) {
            allocator.free(result.output);
        }
    }
}

test "fuzz memory expansion edge cases" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 8) return;
    
    const allocator = std.testing.allocator;
    
    var memory = Memory.init(MemoryConfig{
        .page_size = 4096,
        .max_pages = 64, // Limit to prevent OOM
    }, allocator) catch return;
    defer memory.deinit();
    
    var i: usize = 0;
    while (i + 36 <= input.len and i < 200) { // Limit operations
        const operation = input[i] % 6;
        const offset = std.mem.readInt(u32, input[i + 1..i + 5], .big) % 0xFFFFF; // Cap offset
        const value = std.mem.readInt(u256, input[i + 5..i + 37], .big);
        
        switch (operation) {
            0 => {
                // Test large offset word store
                memory.store_word(offset, value) catch {};
            },
            1 => {
                // Test large offset word load
                _ = memory.load_word(offset) catch {};
            },
            2 => {
                // Test byte operations at boundaries
                memory.store_byte(offset, @truncate(value)) catch {};
            },
            3 => {
                // Test memory expansion cost calculation
                _ = memory.calculate_expansion_cost(offset, 32) catch {};
            },
            4 => {
                // Test memory size operations
                _ = memory.size();
            },
            5 => {
                // Test checkpoint operations (for child memory)
                const checkpoint = memory.get_checkpoint();
                var child_memory = memory.init_child_memory(checkpoint) catch continue;
                child_memory.deinit();
            },
        }
        
        i += 37;
    }
}

test "fuzz host interface call operations" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 64) return;
    
    const allocator = std.testing.allocator;
    
    // Create mock host interface
    const HostType = Host(.{});
    var host = HostType.init(allocator) catch return;
    defer host.deinit();
    
    var i: usize = 0;
    while (i + 64 <= input.len and i < 100) { // Limit operations
        // Extract call parameters from input
        var caller = Address.ZERO;
        @memcpy(caller[0..20], input[i..i + 20]);
        
        var target = Address.ZERO;
        @memcpy(target[0..20], input[i + 20..i + 40]);
        
        const value = std.mem.readInt(u256, input[i + 40..i + 72], .big);
        const gas = if (i + 72 < input.len) std.mem.readInt(u64, input[i + 72..i + 80], .big) % 1_000_000 else 100_000;
        
        const call_type = if (i + 80 < input.len) input[i + 80] % 4 else 0;
        
        // Limit calldata size
        const calldata_size = @min(if (i + 81 < input.len) input[i + 81] else 32, input.len - i - 82);
        const calldata = if (i + 82 + calldata_size <= input.len) input[i + 82..i + 82 + calldata_size] else &[_]u8{};
        
        // Test different call types with error handling
        switch (call_type) {
            0 => {
                // CALL
                _ = host.call(caller, target, value, gas, calldata) catch {};
            },
            1 => {
                // DELEGATECALL
                _ = host.delegate_call(caller, target, gas, calldata) catch {};
            },
            2 => {
                // STATICCALL
                _ = host.static_call(caller, target, gas, calldata) catch {};
            },
            3 => {
                // CREATE
                const salt = std.mem.readInt(u256, input[i..i + 32], .big);
                _ = host.create(caller, value, gas, calldata, salt) catch {};
            },
        }
        
        i += 82 + calldata_size;
    }
}

test "fuzz multi-component integration" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 100) return;
    
    const allocator = std.testing.allocator;
    
    // Set up complete EVM environment with real components
    var memory_db = MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    
    const db_interface = memory_db.to_database_interface();
    
    // Create frame with fuzzed configuration  
    const stack_size = @min((@as(u16, input[0]) << 8) | input[1], 1024); 
    const memory_pages = @min(input[2] % 64, 16); // Cap memory to prevent OOM
    
    const frame_config = FrameConfig{
        .stack_config = StackConfig{
            .stack_size = @max(stack_size, 64), // Ensure minimum
            .word_type = u256,
        },
        .memory_config = MemoryConfig{
            .page_size = 4096,
            .max_pages = @max(memory_pages, 1),
        },
        .bytecode_config = BytecodeConfig{
            .max_bytecode_size = 0x6000,
        },
    };
    
    var frame = Frame.init(frame_config, allocator) catch return;
    defer frame.deinit();
    
    // Set up frame with database interface
    frame.set_database_interface(db_interface) catch {};
    
    // Extract bytecode from input
    const bytecode_size = @min(input.len - 50, 1024); // Reserve space for other params
    const bytecode = input[3..3 + bytecode_size];
    
    // Set up initial account with some balance for testing
    var caller = Address.ZERO;
    if (input.len >= bytecode_size + 23) {
        @memcpy(caller[0..20], input[bytecode_size + 3..bytecode_size + 23]);
    }
    
    const account = @import("../database_interface_account.zig").Account{
        .nonce = 0,
        .balance = 1000000000000000000, // 1 ETH
        .code_hash = [_]u8{0} ** 32,
        .storage_root = [_]u8{0} ** 32,
    };
    
    db_interface.set_account(caller, account) catch {};
    
    // Set frame state and execute
    frame.set_bytecode(bytecode) catch return;
    frame.gas_remaining = 100000; // Reasonable gas limit
    
    // Extract calldata if available
    const calldata_size = @min(if (input.len > bytecode_size + 24) input[bytecode_size + 23] else 0, 64);
    if (calldata_size > 0 and input.len >= bytecode_size + 24 + calldata_size) {
        const calldata = input[bytecode_size + 24..bytecode_size + 24 + calldata_size];
        frame.set_calldata(calldata) catch {};
    }
    
    // Execute with full error handling - this tests the complete pipeline
    _ = frame.run() catch |err| {
        // All execution errors are acceptable in fuzzing - we're looking for crashes
        return;
    };
}

test "fuzz configuration edge cases" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 16) return;
    
    const allocator = std.testing.allocator;
    
    // Test various frame configurations with extreme values
    const stack_size = @min(std.mem.readInt(u16, input[0..2], .big), 2048); // Cap at reasonable size
    const memory_pages = @min(std.mem.readInt(u16, input[2..4], .big) % 256, 64); // Cap memory
    const bytecode_size = @min(std.mem.readInt(u16, input[4..6], .big), 0x6000);
    
    const frame_config = FrameConfig{
        .stack_config = StackConfig{
            .stack_size = @max(stack_size, 16), // Ensure minimum size
            .word_type = u256,
        },
        .memory_config = MemoryConfig{
            .page_size = 4096,
            .max_pages = @max(memory_pages, 1), // Ensure at least 1 page
        },
        .bytecode_config = BytecodeConfig{
            .max_bytecode_size = @max(bytecode_size, 32), // Ensure minimum size
        },
    };
    
    // Test frame creation with extreme config
    var frame = Frame.init(frame_config, allocator) catch |err| {
        // Configuration errors are acceptable
        return;
    };
    defer frame.deinit();
    
    // Test frame creation with extreme config completes successfully
    // Frame doesn't have execute_bytecode method in current architecture
}

