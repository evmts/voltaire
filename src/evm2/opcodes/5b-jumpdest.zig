const std = @import("std");
const opcode_data = @import("../opcode_data.zig");
const Opcode = opcode_data.Opcode;

pub const Op5B = struct {
    /// Performs static analysis starting from JUMPDEST
    /// Returns total static gas cost and validates stack requirements
    pub fn analyzeBasicBlock(bytecode: []const u8, start_pc: usize) !struct { gas_cost: i64, max_stack_height: u16 } {
        const opcode_info = opcode_data.OPCODE_INFO;
        var pc = start_pc;
        var total_gas: i64 = 0;
        var stack_height: i32 = 0;
        var max_stack_height: u16 = 0;
        
        // If starting at JUMPDEST, consume its gas and skip it
        if (pc < bytecode.len) {
            const opcode_byte = bytecode[pc];
            const opcode: Opcode = @enumFromInt(opcode_byte);
            if (opcode == Opcode.JUMPDEST) {
                total_gas -= 1; // JUMPDEST costs 1 gas
                pc += 1;
            }
        }
        
        while (pc < bytecode.len) {
            const opcode_byte = bytecode[pc];
            const info = opcode_info[opcode_byte];
            
            // Check if opcode is undefined
            if (@as(std.builtin.BranchHint, .cold) == .cold and opcode_data.isUndefined(opcode_byte)) {
                return error.InvalidOpcode;
            }
            
            // Update gas cost
            total_gas -= @intCast(info.gas_cost);
            
            // Update stack height
            const min_required = opcode_data.getMinStackRequired(opcode_byte);
            if (@as(std.builtin.BranchHint, .cold) == .cold and stack_height < min_required) {
                return error.StackUnderflow;
            }
            
            // Apply stack changes
            stack_height -= info.stack_inputs;
            stack_height += info.stack_outputs;
            
            // Check stack overflow
            if (@as(std.builtin.BranchHint, .cold) == .cold and stack_height > 1024) {
                return error.StackOverflow;
            }
            
            // Track max stack height
            if (stack_height > max_stack_height) {
                max_stack_height = @intCast(stack_height);
            }
            
            // Handle special cases
            switch (opcode_byte) {
                // STOP, RETURN, REVERT, INVALID, SELFDESTRUCT - block terminators
                @intFromEnum(Opcode.STOP), @intFromEnum(Opcode.RETURN), @intFromEnum(Opcode.REVERT), @intFromEnum(Opcode.INVALID), @intFromEnum(Opcode.SELFDESTRUCT) => break,
                
                // JUMP - unconditional jump, end of basic block
                @intFromEnum(Opcode.JUMP) => {
                    pc += 1;
                    break;
                },
                
                // JUMPI - conditional jump, end of basic block
                @intFromEnum(Opcode.JUMPI) => {
                    pc += 1;
                    break;
                },
                
                // PUSH operations - skip immediate data
                @intFromEnum(Opcode.PUSH1)...@intFromEnum(Opcode.PUSH32) => {
                    const push_size = opcode_byte - (@intFromEnum(Opcode.PUSH1) - 1);
                    pc += push_size;
                },
                
                else => {},
            }
            
            pc += 1;
        }
        
        return .{
            .gas_cost = total_gas,
            .max_stack_height = max_stack_height,
        };
    }
    
    test "analyzeBasicBlock simple arithmetic" {
        // JUMPDEST, PUSH1 5, PUSH1 10, ADD, POP, STOP
        const bytecode = [_]u8{ @intFromEnum(Opcode.JUMPDEST), @intFromEnum(Opcode.PUSH1), 0x05, @intFromEnum(Opcode.PUSH1), 0x0a, @intFromEnum(Opcode.ADD), @intFromEnum(Opcode.POP), @intFromEnum(Opcode.STOP) };
        
        const result = try analyzeBasicBlock(&bytecode, 0);
        
        // Gas costs: JUMPDEST(1) + PUSH1(3) + PUSH1(3) + ADD(3) + POP(2) + STOP(0) = 12
        try std.testing.expectEqual(@as(i64, -12), result.gas_cost);
        try std.testing.expectEqual(@as(u16, 2), result.max_stack_height);
    }
    
    test "analyzeBasicBlock stack underflow" {
        // JUMPDEST, ADD (requires 2 items but stack is empty)
        const bytecode = [_]u8{ @intFromEnum(Opcode.JUMPDEST), @intFromEnum(Opcode.ADD) };
        
        try std.testing.expectError(error.StackUnderflow, analyzeBasicBlock(&bytecode, 0));
    }
    
    test "analyzeBasicBlock ends at jump" {
        // JUMPDEST, PUSH1 4, JUMP, PUSH1 99 (should not be analyzed)
        const bytecode = [_]u8{ @intFromEnum(Opcode.JUMPDEST), @intFromEnum(Opcode.PUSH1), 0x04, @intFromEnum(Opcode.JUMP), @intFromEnum(Opcode.PUSH1), 0x63 };
        
        const result = try analyzeBasicBlock(&bytecode, 0);
        
        // Gas costs: JUMPDEST(1) + PUSH1(3) + JUMP(8) = 12
        try std.testing.expectEqual(@as(i64, -12), result.gas_cost);
        try std.testing.expectEqual(@as(u16, 1), result.max_stack_height);
    }
    
    test "analyzeBasicBlock invalid opcode" {
        // JUMPDEST, 0x0c (invalid opcode)
        const bytecode = [_]u8{ @intFromEnum(Opcode.JUMPDEST), 0x0c };
        
        try std.testing.expectError(error.InvalidOpcode, analyzeBasicBlock(&bytecode, 0));
    }
};