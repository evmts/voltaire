const std = @import("std");
const Operation = @import("../opcodes/operation.zig");
const ExecutionError = @import("execution_error.zig");
const Frame = @import("../frame/frame.zig");
const Stack = @import("../stack/stack.zig");

// Optimized POP operation - inline for better performance
pub inline fn op_pop_optimized(pc: usize, interpreter: *Operation.Interpreter, state: *Operation.State) ExecutionError.Error!Operation.ExecutionResult {
    _ = pc;
    _ = interpreter;
    const frame = @as(*Frame, @ptrCast(@alignCast(state)));
    _ = frame.stack.pop_unsafe();
    return Operation.ExecutionResult{};
}

// Optimized PUSH0 - direct append without intermediate variables
pub inline fn op_push0_optimized(pc: usize, interpreter: *Operation.Interpreter, state: *Operation.State) ExecutionError.Error!Operation.ExecutionResult {
    _ = pc;
    _ = interpreter;
    const frame = @as(*Frame, @ptrCast(@alignCast(state)));
    frame.stack.append_unsafe(0);
    return Operation.ExecutionResult{};
}

// Optimized PUSH1 using direct byte access
pub inline fn op_push1_optimized(pc: usize, interpreter: *Operation.Interpreter, state: *Operation.State) ExecutionError.Error!Operation.ExecutionResult {
    _ = interpreter;
    const frame = @as(*Frame, @ptrCast(@alignCast(state)));
    
    // Direct access to bytecode
    const value = @as(u256, frame.contract.code[pc + 1]);
    frame.stack.append_unsafe(value);
    
    return Operation.ExecutionResult{ .pc_offset = 2 };
}

// Optimized PUSH2-PUSH8 using u64 for better performance
pub inline fn op_push2_8_optimized(comptime n: usize) fn (usize, *Operation.Interpreter, *Operation.State) ExecutionError.Error!Operation.ExecutionResult {
    return struct {
        pub fn push(pc: usize, interpreter: *Operation.Interpreter, state: *Operation.State) ExecutionError.Error!Operation.ExecutionResult {
            _ = interpreter;
            const frame = @as(*Frame, @ptrCast(@alignCast(state)));
            
            // Use u64 for smaller values for better performance
            var value: u64 = 0;
            const code = frame.contract.code;
            
            // Unroll loop for better performance
            inline for (0..n) |i| {
                value = (value << 8) | code[pc + 1 + i];
            }
            
            frame.stack.append_unsafe(@as(u256, value));
            return Operation.ExecutionResult{ .pc_offset = n + 1 };
        }
    }.push;
}

// Optimized PUSH9-PUSH32 using u256 directly
pub inline fn op_push9_32_optimized(comptime n: usize) fn (usize, *Operation.Interpreter, *Operation.State) ExecutionError.Error!Operation.ExecutionResult {
    return struct {
        pub fn push(pc: usize, interpreter: *Operation.Interpreter, state: *Operation.State) ExecutionError.Error!Operation.ExecutionResult {
            _ = interpreter;
            const frame = @as(*Frame, @ptrCast(@alignCast(state)));
            
            var value: u256 = 0;
            const code = frame.contract.code;
            
            // Unroll in chunks of 8 for better performance
            const chunks = n / 8;
            const remainder = n % 8;
            
            inline for (0..chunks) |chunk| {
                var chunk_value: u64 = 0;
                inline for (0..8) |i| {
                    chunk_value = (chunk_value << 8) | code[pc + 1 + chunk * 8 + i];
                }
                value = (value << 64) | chunk_value;
            }
            
            inline for (0..remainder) |i| {
                value = (value << 8) | code[pc + 1 + chunks * 8 + i];
            }
            
            frame.stack.append_unsafe(value);
            return Operation.ExecutionResult{ .pc_offset = n + 1 };
        }
    }.push;
}

// Optimized DUP operations - use direct indexing
pub inline fn op_dup_optimized(comptime n: usize) fn (usize, *Operation.Interpreter, *Operation.State) ExecutionError.Error!Operation.ExecutionResult {
    return struct {
        pub fn dup(pc: usize, interpreter: *Operation.Interpreter, state: *Operation.State) ExecutionError.Error!Operation.ExecutionResult {
            _ = pc;
            _ = interpreter;
            const frame = @as(*Frame, @ptrCast(@alignCast(state)));
            
            // Direct access to stack data
            const value = frame.stack.data[frame.stack.size - n];
            frame.stack.data[frame.stack.size] = value;
            frame.stack.size += 1;
            
            return Operation.ExecutionResult{};
        }
    }.dup;
}

// Optimized SWAP operations - minimize memory access
pub inline fn op_swap_optimized(comptime n: usize) fn (usize, *Operation.Interpreter, *Operation.State) ExecutionError.Error!Operation.ExecutionResult {
    return struct {
        pub fn swap(pc: usize, interpreter: *Operation.Interpreter, state: *Operation.State) ExecutionError.Error!Operation.ExecutionResult {
            _ = pc;
            _ = interpreter;
            const frame = @as(*Frame, @ptrCast(@alignCast(state)));
            
            // Use pointers to avoid extra indexing
            const data = &frame.stack.data;
            const top_idx = frame.stack.size - 1;
            const swap_idx = frame.stack.size - n - 1;
            
            const temp = data[top_idx];
            data[top_idx] = data[swap_idx];
            data[swap_idx] = temp;
            
            return Operation.ExecutionResult{};
        }
    }.swap;
}

// Generate all optimized PUSH operations
pub const op_push2_optimized = op_push2_8_optimized(2);
pub const op_push3_optimized = op_push2_8_optimized(3);
pub const op_push4_optimized = op_push2_8_optimized(4);
pub const op_push5_optimized = op_push2_8_optimized(5);
pub const op_push6_optimized = op_push2_8_optimized(6);
pub const op_push7_optimized = op_push2_8_optimized(7);
pub const op_push8_optimized = op_push2_8_optimized(8);

pub const op_push9_optimized = op_push9_32_optimized(9);
pub const op_push10_optimized = op_push9_32_optimized(10);
pub const op_push11_optimized = op_push9_32_optimized(11);
pub const op_push12_optimized = op_push9_32_optimized(12);
pub const op_push13_optimized = op_push9_32_optimized(13);
pub const op_push14_optimized = op_push9_32_optimized(14);
pub const op_push15_optimized = op_push9_32_optimized(15);
pub const op_push16_optimized = op_push9_32_optimized(16);
pub const op_push17_optimized = op_push9_32_optimized(17);
pub const op_push18_optimized = op_push9_32_optimized(18);
pub const op_push19_optimized = op_push9_32_optimized(19);
pub const op_push20_optimized = op_push9_32_optimized(20);
pub const op_push21_optimized = op_push9_32_optimized(21);
pub const op_push22_optimized = op_push9_32_optimized(22);
pub const op_push23_optimized = op_push9_32_optimized(23);
pub const op_push24_optimized = op_push9_32_optimized(24);
pub const op_push25_optimized = op_push9_32_optimized(25);
pub const op_push26_optimized = op_push9_32_optimized(26);
pub const op_push27_optimized = op_push9_32_optimized(27);
pub const op_push28_optimized = op_push9_32_optimized(28);
pub const op_push29_optimized = op_push9_32_optimized(29);
pub const op_push30_optimized = op_push9_32_optimized(30);
pub const op_push31_optimized = op_push9_32_optimized(31);
pub const op_push32_optimized = op_push9_32_optimized(32);

// Generate all optimized DUP operations
pub const op_dup1_optimized = op_dup_optimized(1);
pub const op_dup2_optimized = op_dup_optimized(2);
pub const op_dup3_optimized = op_dup_optimized(3);
pub const op_dup4_optimized = op_dup_optimized(4);
pub const op_dup5_optimized = op_dup_optimized(5);
pub const op_dup6_optimized = op_dup_optimized(6);
pub const op_dup7_optimized = op_dup_optimized(7);
pub const op_dup8_optimized = op_dup_optimized(8);
pub const op_dup9_optimized = op_dup_optimized(9);
pub const op_dup10_optimized = op_dup_optimized(10);
pub const op_dup11_optimized = op_dup_optimized(11);
pub const op_dup12_optimized = op_dup_optimized(12);
pub const op_dup13_optimized = op_dup_optimized(13);
pub const op_dup14_optimized = op_dup_optimized(14);
pub const op_dup15_optimized = op_dup_optimized(15);
pub const op_dup16_optimized = op_dup_optimized(16);

// Generate all optimized SWAP operations
pub const op_swap1_optimized = op_swap_optimized(1);
pub const op_swap2_optimized = op_swap_optimized(2);
pub const op_swap3_optimized = op_swap_optimized(3);
pub const op_swap4_optimized = op_swap_optimized(4);
pub const op_swap5_optimized = op_swap_optimized(5);
pub const op_swap6_optimized = op_swap_optimized(6);
pub const op_swap7_optimized = op_swap_optimized(7);
pub const op_swap8_optimized = op_swap_optimized(8);
pub const op_swap9_optimized = op_swap_optimized(9);
pub const op_swap10_optimized = op_swap_optimized(10);
pub const op_swap11_optimized = op_swap_optimized(11);
pub const op_swap12_optimized = op_swap_optimized(12);
pub const op_swap13_optimized = op_swap_optimized(13);
pub const op_swap14_optimized = op_swap_optimized(14);
pub const op_swap15_optimized = op_swap_optimized(15);
pub const op_swap16_optimized = op_swap_optimized(16);