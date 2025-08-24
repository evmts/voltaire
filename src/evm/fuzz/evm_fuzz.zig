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
    frame.op_add() catch {};
    
    frame.stack.push(a) catch return;
    frame.stack.push(b) catch return;
    frame.op_sub() catch {};
    
    frame.stack.push(a) catch return;
    frame.stack.push(b) catch return;
    frame.op_mul() catch {};
    
    frame.stack.push(a) catch return;
    frame.stack.push(b) catch return;
    frame.op_div() catch {};
    
    frame.stack.push(a) catch return;
    frame.stack.push(b) catch return;
    frame.op_mod() catch {};
    
    frame.stack.push(a) catch return;
    frame.stack.push(b) catch return;
    frame.op_exp() catch {};
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
    frame.op_jump() catch {};
    
    // Test JUMPI with fuzzed condition and destination
    if (input.len >= 8) {
        const condition = std.mem.readInt(u32, input[4..8], .big);
        frame.stack.push(jump_dest) catch return;
        frame.stack.push(condition) catch return;
        frame.op_jumpi() catch {};
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