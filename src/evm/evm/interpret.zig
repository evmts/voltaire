const std = @import("std");
const builtin = @import("builtin");
const ExecutionError = @import("../execution/execution_error.zig");
const Contract = @import("../frame/contract.zig");
const Frame = @import("../frame/frame.zig");
const Operation = @import("../opcodes/operation.zig");
const RunResult = @import("run_result.zig").RunResult;
const Log = @import("../log.zig");
const Vm = @import("../evm.zig");
const primitives = @import("primitives");
const opcode = @import("../opcodes/opcode.zig");

// Pre-computed operation info including stack validation data
const PcToOpEntry = struct {
    operation: *const Operation.Operation,
    opcode_byte: u8,
    // Pre-computed validation info to avoid re-fetching from operation
    min_stack: u32,
    max_stack: u32,
    constant_gas: u64,
    undefined: bool,
};

/// Pre-build a direct PC-to-operation mapping for a contract's bytecode.
/// This eliminates the double indirection of bytecode[pc] -> opcode -> operation.
/// 
/// Returns null if allocation fails. The caller owns the returned memory.
fn buildPcToOperationTable(allocator: std.mem.Allocator, contract: *const Contract, jump_table: *const @import("../jump_table/jump_table.zig")) ?[]*const Operation.Operation {
    const table = allocator.alloc(*const Operation.Operation, contract.code_size) catch return null;
    
    // Build the direct mapping
    for (0..contract.code_size) |pc| {
        const opcode_byte = contract.code[@intCast(pc)];
        table[pc] = jump_table.table[opcode_byte];
    }
    
    return table;
}

/// Pre-build a comprehensive PC-to-operation mapping with pre-computed validation data.
/// This eliminates multiple field accesses during execution.
fn buildPcToOpEntryTable(allocator: std.mem.Allocator, contract: *const Contract, jump_table: *const @import("../jump_table/jump_table.zig")) ?[]PcToOpEntry {
    const table = allocator.alloc(PcToOpEntry, contract.code_size) catch return null;
    
    // Build the comprehensive mapping with pre-computed data
    for (0..contract.code_size) |pc| {
        const opcode_byte = contract.code[@intCast(pc)];
        const operation = jump_table.table[opcode_byte];
        table[pc] = PcToOpEntry{
            .operation = operation,
            .opcode_byte = opcode_byte,
            .min_stack = operation.min_stack,
            .max_stack = operation.max_stack,
            .constant_gas = operation.constant_gas,
            .undefined = operation.undefined,
        };
    }
    
    return table;
}

/// Execute contract bytecode and return the result.
///
/// This is the main execution entry point. The contract must be properly initialized
/// with bytecode, gas limit, and input data. The VM executes opcodes sequentially
/// until completion, error, or gas exhaustion.
///
/// Time complexity: O(n) where n is the number of opcodes executed.
/// Memory: May allocate for return data if contract returns output.
///
/// Example:
/// ```zig
/// var contract = Contract.init_at_address(caller, addr, 0, 100000, code, input, false);
/// defer contract.deinit(vm.allocator, null);
/// try vm.state.set_code(addr, code);
/// const result = try vm.interpret(&contract, input, false);
/// defer if (result.output) |output| vm.allocator.free(output);
/// ```
pub fn interpret(self: *Vm, contract: *Contract, input: []const u8, is_static: bool) ExecutionError.Error!RunResult {
    @branchHint(.likely);
    Log.debug("VM.interpret: Starting execution, depth={}, gas={}, static={}, code_size={}, input_size={}", .{ self.depth, contract.gas, is_static, contract.code_size, input.len });

    self.depth += 1;
    defer self.depth -= 1;

    const prev_read_only = self.read_only;
    defer self.read_only = prev_read_only;

    self.read_only = self.read_only or is_static;

    const initial_gas = contract.gas;
    var pc: usize = 0;

    // Pre-build comprehensive PC-to-operation table with validation data if possible
    const pc_to_op_entry_table = if (contract.code_size > 0) 
        buildPcToOpEntryTable(self.allocator, contract, &self.table) 
    else null;
    defer if (pc_to_op_entry_table) |table| self.allocator.free(table);

    var builder = Frame.builder(self.allocator); // We should consider making all items mandatory and removing frame builder
    var frame = builder
        .withVm(self)
        .withContract(contract)
        .withGas(contract.gas)
        .withCaller(contract.caller)
        .withInput(input)
        .isStatic(self.read_only)
        .withDepth(@as(u32, @intCast(self.depth)))
        .build() catch |err| switch (err) {
        error.OutOfMemory => return ExecutionError.Error.OutOfMemory,
        error.MissingVm => unreachable, // We pass a VM. TODO zig better here.
        error.MissingContract => unreachable, // We pass a contract. TODO zig better here.
    };
    defer frame.deinit();

    const interpreter: Operation.Interpreter = self;
    const state: Operation.State = &frame;

    // Main execution loop - the heart of the EVM
    while (pc < contract.code_size) {
        @branchHint(.likely);
        
        // Use pre-computed entry table if available for maximum performance
        const pc_index: usize = @intCast(pc);
        const entry = if (pc_to_op_entry_table) |table| 
            table[pc_index]
        else blk: {
            // Fallback: build entry on the fly
            const opcode_byte = contract.code[pc_index];
            const operation = self.table.table[opcode_byte];
            break :blk PcToOpEntry{
                .operation = operation,
                .opcode_byte = opcode_byte,
                .min_stack = operation.min_stack,
                .max_stack = operation.max_stack,
                .constant_gas = operation.constant_gas,
                .undefined = operation.undefined,
            };
        };
        
        const operation = entry.operation;
        const opcode_byte = entry.opcode_byte;
        
        frame.pc = pc;
        
        // INLINE: self.table.execute(...)
        // Execute the operation directly
        const exec_result = blk: {
            Log.debug("Executing opcode 0x{x:0>2} at pc={}, gas={}, stack_size={}", .{ opcode_byte, pc, frame.gas_remaining, frame.stack.size });
            
            // Check if opcode is undefined (cold path) - use pre-computed flag
            if (entry.undefined) {
                @branchHint(.cold);
                Log.debug("Invalid opcode 0x{x:0>2}", .{opcode_byte});
                frame.gas_remaining = 0;
                break :blk ExecutionError.Error.InvalidOpcode;
            }
            
            // Validate stack requirements using pre-computed values
            if (comptime builtin.mode == .ReleaseFast) {
                // Fast path for release builds - use pre-computed min/max
                const stack_height_changes = @import("../opcodes/stack_height_changes.zig");
                stack_height_changes.validate_stack_requirements_fast(
                    @intCast(frame.stack.size),
                    opcode_byte,
                    entry.min_stack,
                    entry.max_stack,
                ) catch |err| break :blk err;
            } else {
                // Full validation for debug builds
                const stack_validation = @import("../stack/stack_validation.zig");
                stack_validation.validate_stack_requirements(&frame.stack, operation) catch |err| break :blk err;
            }
            
            // Consume gas (likely path) - use pre-computed constant_gas
            if (entry.constant_gas > 0) {
                @branchHint(.likely);
                Log.debug("Consuming {} gas for opcode 0x{x:0>2}", .{ entry.constant_gas, opcode_byte });
                frame.consume_gas(entry.constant_gas) catch |err| break :blk err;
            }
            
            // Execute the operation
            const res = operation.execute(pc, interpreter, state) catch |err| break :blk err;
            Log.debug("Opcode 0x{x:0>2} completed, gas_remaining={}", .{ opcode_byte, frame.gas_remaining });
            break :blk res;
        };
        
        // Handle execution result
        if (exec_result) |result| {
            // Success case - update program counter
            if (frame.pc != pc) {
                Log.debug("PC changed by opcode - old_pc={}, frame.pc={}, jumping to frame.pc", .{ pc, frame.pc });
                pc = frame.pc;
            } else {
                Log.debug("PC unchanged by opcode - pc={}, frame.pc={}, advancing by {} bytes", .{ pc, frame.pc, result.bytes_consumed });
                pc += result.bytes_consumed;
            }
        } else |err| {
            // Error case - handle various error conditions
            contract.gas = frame.gas_remaining;
            // Don't store frame's return data in EVM - it will be freed when frame deinits
            self.return_data = &[_]u8{};

            var output: ?[]const u8 = null;
            // Use frame.output for RETURN/REVERT data
            const return_data = frame.output;
            Log.debug("VM.interpret_with_context: Error occurred: {}, output_size={}", .{ err, return_data.len });
            if (return_data.len > 0) {
                output = self.allocator.dupe(u8, return_data) catch {
                    // We are out of memory, which is a critical failure. The safest way to
                    // handle this is to treat it as an OutOfGas error, which consumes
                    // all gas and stops execution.
                    return RunResult.init(initial_gas, 0, .OutOfGas, ExecutionError.Error.OutOfMemory, null);
                };
                Log.debug("VM.interpret_with_context: Duplicated output, size={}", .{output.?.len});
            }

            return switch (err) {
                ExecutionError.Error.InvalidOpcode => {
                    @branchHint(.cold);
                    // INVALID opcode consumes all remaining gas
                    frame.gas_remaining = 0;
                    contract.gas = 0;
                    return RunResult.init(initial_gas, 0, .Invalid, err, output);
                },
                ExecutionError.Error.STOP => {
                    Log.debug("VM.interpret_with_context: STOP opcode, output_size={}, creating RunResult", .{if (output) |o| o.len else 0});
                    const result = RunResult.init(initial_gas, frame.gas_remaining, .Success, null, output);
                    Log.debug("VM.interpret_with_context: RunResult created, output={any}", .{result.output});
                    return result;
                },
                ExecutionError.Error.REVERT => {
                    return RunResult.init(initial_gas, frame.gas_remaining, .Revert, err, output);
                },
                ExecutionError.Error.OutOfGas => {
                    return RunResult.init(initial_gas, frame.gas_remaining, .OutOfGas, err, output);
                },
                ExecutionError.Error.InvalidJump,
                ExecutionError.Error.StackUnderflow,
                ExecutionError.Error.StackOverflow,
                ExecutionError.Error.StaticStateChange,
                ExecutionError.Error.WriteProtection,
                ExecutionError.Error.DepthLimit,
                ExecutionError.Error.MaxCodeSizeExceeded,
                ExecutionError.Error.OutOfMemory,
                => {
                    @branchHint(.cold);
                    return RunResult.init(initial_gas, frame.gas_remaining, .Invalid, err, output);
                },
                else => return err, // Unexpected error
            };
        }
    }

    contract.gas = frame.gas_remaining;
    // Don't store frame's return data in EVM - it will be freed when frame deinits
    self.return_data = &[_]u8{};

    // Use frame.output for normal completion (no RETURN/REVERT was called)
    const output_data = frame.output;
    Log.debug("VM.interpret_with_context: Normal completion, output_size={}", .{output_data.len});
    const output: ?[]const u8 = if (output_data.len > 0) try self.allocator.dupe(u8, output_data) else null;

    Log.debug("VM.interpret_with_context: Execution completed, gas_used={}, output_size={}, output_ptr={any}", .{
        initial_gas - frame.gas_remaining,
        if (output) |o| o.len else 0,
        output,
    });

    return RunResult.init(
        initial_gas,
        frame.gas_remaining,
        .Success,
        null,
        output,
    );
}