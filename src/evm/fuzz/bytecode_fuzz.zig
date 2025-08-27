//! Bytecode Analysis Fuzz Testing
//!
//! Fuzz tests for bytecode analysis components including:
//! - Jump destination analysis
//! - Opcode fusion detection
//! - Bytecode validation
//! - Edge cases in PUSH instruction handling

const std = @import("std");
const evm = @import("evm");
const Bytecode5 = evm.Bytecode5;
const Opcode = evm.Opcode;
const primitives = @import("primitives");
const U256 = primitives.U256.U256;

test "fuzz bytecode5 analysis with random bytecode" {
    const input = std.testing.fuzzInput(.{});
    if (input.len == 0) return;
    
    const allocator = std.testing.allocator;
    
    // Limit bytecode size to prevent OOM
    const max_bytecode_size = 64 * 1024; // 64KB max
    const bytecode = input[0..@min(input.len, max_bytecode_size)];
    
    // Create bytecode analyzer
    var analyzer = Bytecode5.init(allocator);
    defer analyzer.deinit();
    
    // Analyze bytecode - all errors are acceptable outcomes
    _ = analyzer.analyzeBytecode(bytecode) catch {
        // Expected errors from malformed bytecode
        return;
    };
}

test "fuzz bytecode5 jump destination analysis" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 10) return; // Need some minimum bytecode
    
    const allocator = std.testing.allocator;
    
    // Create bytecode with forced JUMPDEST opcodes
    var bytecode = std.ArrayList(u8).init(allocator);
    defer bytecode.deinit();
    
    // Add some JUMPDEST instructions at random positions
    var i: usize = 0;
    while (i < input.len and i < 1024) : (i += 1) {
        if (input[i] % 4 == 0) {
            try bytecode.append(@intFromEnum(Opcode.JUMPDEST));
        } else {
            try bytecode.append(input[i]);
        }
    }
    
    // Analyze bytecode
    var analyzer = Bytecode5.init(allocator);
    defer analyzer.deinit();
    
    const result = analyzer.analyzeBytecode(bytecode.items) catch {
        // All errors acceptable
        return;
    };
    defer result.deinit();
    
    // Verify jump destinations are valid
    var iter = result.valid_jump_destinations.iterator();
    while (iter.next()) |entry| {
        const pc = entry.key_ptr.*;
        if (pc >= bytecode.items.len) {
            // This shouldn't happen - would indicate a bug
            std.debug.panic("Invalid jump destination PC: {}", .{pc});
        }
    }
}

test "fuzz bytecode5 PUSH instruction handling" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 33) return; // Need space for PUSH32
    
    const allocator = std.testing.allocator;
    
    // Create bytecode with various PUSH instructions
    var bytecode = std.ArrayList(u8).init(allocator);
    defer bytecode.deinit();
    
    var i: usize = 0;
    while (i < input.len - 33 and bytecode.items.len < 1024) {
        const push_size = (input[i] % 32) + 1; // PUSH1 to PUSH32
        const opcode = @intFromEnum(Opcode.PUSH1) + push_size - 1;
        
        try bytecode.append(@intCast(opcode));
        
        // Add push data (may be truncated)
        const data_available = input.len - i - 1;
        const data_to_add = @min(push_size, data_available);
        try bytecode.appendSlice(input[i + 1..i + 1 + data_to_add]);
        
        i += 1 + data_to_add;
    }
    
    // Analyze bytecode
    var analyzer = Bytecode5.init(allocator);
    defer analyzer.deinit();
    
    _ = analyzer.analyzeBytecode(bytecode.items) catch {
        // Expected for truncated PUSH instructions
        return;
    };
}

test "fuzz bytecode5 fusion pattern detection" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 10) return;
    
    const allocator = std.testing.allocator;
    
    // Create bytecode that might contain fusion patterns
    var bytecode = std.ArrayList(u8).init(allocator);
    defer bytecode.deinit();
    
    var i: usize = 0;
    while (i < input.len and bytecode.items.len < 1024) : (i += 1) {
        const choice = input[i] % 10;
        
        switch (choice) {
            // PUSH-ADD pattern
            0 => {
                try bytecode.append(@intFromEnum(Opcode.PUSH1));
                try bytecode.append(if (i + 1 < input.len) input[i + 1] else 1);
                try bytecode.append(@intFromEnum(Opcode.ADD));
                i += 1;
            },
            // ISZERO-JUMPI pattern
            1 => {
                try bytecode.append(@intFromEnum(Opcode.ISZERO));
                try bytecode.append(@intFromEnum(Opcode.JUMPI));
            },
            // Multi-PUSH pattern
            2 => {
                try bytecode.append(@intFromEnum(Opcode.PUSH1));
                try bytecode.append(if (i + 1 < input.len) input[i + 1] else 1);
                try bytecode.append(@intFromEnum(Opcode.PUSH1));
                try bytecode.append(if (i + 2 < input.len) input[i + 2] else 2);
                i += 2;
            },
            // DUP2-MSTORE-PUSH pattern
            3 => {
                try bytecode.append(@intFromEnum(Opcode.DUP2));
                try bytecode.append(@intFromEnum(Opcode.MSTORE));
                try bytecode.append(@intFromEnum(Opcode.PUSH1));
                try bytecode.append(32);
            },
            // Random opcode
            else => {
                try bytecode.append(input[i]);
            },
        }
    }
    
    // Analyze bytecode
    var analyzer = Bytecode5.init(allocator);
    defer analyzer.deinit();
    
    const result = analyzer.analyzeBytecode(bytecode.items) catch {
        // All errors acceptable
        return;
    };
    defer result.deinit();
    
    // Check that fusion detection didn't cause crashes
    if (result.advanced_fusions.count() > 0) {
        var iter = result.advanced_fusions.iterator();
        while (iter.next()) |entry| {
            const pc = entry.key_ptr.*;
            const fusion = entry.value_ptr.*;
            
            // Verify fusion PC is within bounds
            if (pc + fusion.original_length > bytecode.items.len) {
                std.debug.panic("Fusion extends beyond bytecode bounds", .{});
            }
        }
    }
}

test "fuzz bytecode5 malformed bytecode handling" {
    const input = std.testing.fuzzInput(.{});
    
    const allocator = std.testing.allocator;
    
    // Test with completely random bytecode
    var analyzer = Bytecode5.init(allocator);
    defer analyzer.deinit();
    
    _ = analyzer.analyzeBytecode(input) catch {
        // All errors are acceptable
        return;
    };
}

test "fuzz bytecode5 empty and edge case handling" {
    const input = std.testing.fuzzInput(.{});
    
    const allocator = std.testing.allocator;
    var analyzer = Bytecode5.init(allocator);
    defer analyzer.deinit();
    
    // Test empty bytecode
    _ = analyzer.analyzeBytecode(&[_]u8{}) catch {
        return;
    };
    
    // Test single byte
    if (input.len > 0) {
        _ = analyzer.analyzeBytecode(input[0..1]) catch {
            return;
        };
    }
    
    // Test bytecode ending with incomplete PUSH
    if (input.len > 2) {
        var bytecode = [_]u8{ @intFromEnum(Opcode.PUSH32), input[0] };
        _ = analyzer.analyzeBytecode(&bytecode) catch {
            // Expected error for truncated PUSH32
            return;
        };
    }
}