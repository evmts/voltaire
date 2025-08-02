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
        
        // INLINE: contract.get_op(pc)
        // Fetch opcode with bounds checking
        const opcode_byte = if (pc < contract.code_size) contract.code[@intCast(pc)] else @intFromEnum(opcode.Enum.STOP);
        frame.pc = pc;

        // Log stack state before operation (debug builds)
        if (frame.stack.size > 0) {
            Log.debug("Stack before pc={}: size={}, top 5 values:", .{ pc, frame.stack.size });
            var i: usize = 0;
            while (i < @min(5, frame.stack.size)) : (i += 1) {
                Log.debug("  [{}] = {}", .{ frame.stack.size - 1 - i, frame.stack.data[frame.stack.size - 1 - i] });
            }
        }
        
        // INLINE: self.table.get_operation(opcode_byte)
        // Direct array access to get operation handler
        const operation = self.table.table[opcode_byte];
        
        // Trace execution if tracer is available
        if (self.tracer) |writer| {
            var tracer = @import("../tracer.zig").Tracer.init(writer);
            const stack_slice = frame.stack.data[0..frame.stack.size];
            const gas_cost = operation.constant_gas;
            tracer.trace(
                pc,
                opcode_byte,
                stack_slice,
                frame.gas_remaining,
                gas_cost,
                frame.memory.size(),
                @intCast(self.depth)
            ) catch |trace_err| {
                Log.debug("Failed to write trace: {}", .{trace_err});
            };
        }
        
        // INLINE: self.table.execute(...)
        // Execute the operation directly
        const exec_result = blk: {
            Log.debug("Executing opcode 0x{x:0>2} at pc={}, gas={}, stack_size={}", .{ opcode_byte, pc, frame.gas_remaining, frame.stack.size });
            
            // Check if opcode is undefined (cold path)
            if (operation.undefined) {
                @branchHint(.cold);
                Log.debug("Invalid opcode 0x{x:0>2}", .{opcode_byte});
                frame.gas_remaining = 0;
                break :blk ExecutionError.Error.InvalidOpcode;
            }
            
            // Validate stack requirements
            if (comptime builtin.mode == .ReleaseFast) {
                // Fast path for release builds
                const stack_height_changes = @import("../opcodes/stack_height_changes.zig");
                stack_height_changes.validate_stack_requirements_fast(
                    @intCast(frame.stack.size),
                    opcode_byte,
                    operation.min_stack,
                    operation.max_stack,
                ) catch |err| break :blk err;
            } else {
                // Full validation for debug builds
                const stack_validation = @import("../stack/stack_validation.zig");
                stack_validation.validate_stack_requirements(&frame.stack, operation) catch |err| break :blk err;
            }
            
            // Consume gas (likely path)
            if (operation.constant_gas > 0) {
                @branchHint(.likely);
                Log.debug("Consuming {} gas for opcode 0x{x:0>2}", .{ operation.constant_gas, opcode_byte });
                frame.consume_gas(operation.constant_gas) catch |err| break :blk err;
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
