const std = @import("std");
const ExecutionError = @import("../execution/execution_error.zig");
const Contract = @import("../frame/contract.zig");
const Frame = @import("../frame/frame.zig");
const Operation = @import("../opcodes/operation.zig");
const RunResult = @import("run_result.zig").RunResult;
const Log = @import("../log.zig");
const Vm = @import("../evm.zig");
const primitives = @import("primitives");
const BlockExecutor = @import("../execution/block_executor.zig").BlockExecutor;
const interpret_with_context = @import("interpret_with_context.zig").interpret_with_context;

/// Core bytecode execution with block-based gas accounting optimization.
/// Falls back to normal execution if block execution is disabled.
pub fn interpret_with_blocks(self: *Vm, contract: *Contract, input: []const u8, is_static: bool) ExecutionError.Error!RunResult {
    // Check if block execution is enabled
    if (!self.block_execution_config.enabled) {
        return interpret_with_context(self, contract, input, is_static);
    }

    Log.debug("VM.interpret_with_blocks: Starting block-based execution, depth={}, gas={}, static={}, code_size={}, input_size={}", .{ self.depth, contract.gas, is_static, contract.code_size, input.len });

    self.depth += 1;
    defer self.depth -= 1;

    const prev_read_only = self.read_only;
    defer self.read_only = prev_read_only;

    self.read_only = self.read_only or is_static;

    const initial_gas = contract.gas;
    
    // Use frame pool instead of builder pattern
    const frame = self.getPooledFrame(contract.gas, contract, .{}, input) catch |err| switch (err) {
        error.OutOfMemory => return ExecutionError.Error.OutOfMemory,
        error.DepthLimit => return ExecutionError.Error.DepthLimit,
        else => return ExecutionError.Error.OutOfMemory,
    };
    
    // Configure frame for static context and depth
    frame.is_static = self.read_only;
    frame.depth = @as(u32, @intCast(self.depth));

    // Create block executor
    var executor = BlockExecutor.init(self, frame, self.block_execution_config, self.block_cache);
    
    // Execute using block-based approach
    executor.execute() catch |err| {
        contract.gas = frame.gas_remaining;
        self.return_data = @constCast(frame.return_data.get());

        var output: ?[]const u8 = null;
        const return_data = frame.output;
        Log.debug("VM.interpret_with_blocks: Error occurred: {}, output_size={}", .{ err, return_data.len });
        if (return_data.len > 0) {
            output = self.allocator.dupe(u8, return_data) catch {
                return RunResult.init(initial_gas, 0, .OutOfGas, ExecutionError.Error.OutOfMemory, null);
            };
            Log.debug("VM.interpret_with_blocks: Duplicated output, size={}", .{output.?.len});
        }

        return switch (err) {
            ExecutionError.Error.InvalidOpcode => {
                frame.gas_remaining = 0;
                contract.gas = 0;
                return RunResult.init(initial_gas, 0, .Invalid, err, output);
            },
            ExecutionError.Error.STOP => {
                Log.debug("VM.interpret_with_blocks: STOP opcode, output_size={}, creating RunResult", .{if (output) |o| o.len else 0});
                const result = RunResult.init(initial_gas, frame.gas_remaining, .Success, null, output);
                Log.debug("VM.interpret_with_blocks: RunResult created, output={any}", .{result.output});
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
                return RunResult.init(initial_gas, frame.gas_remaining, .Invalid, err, output);
            },
            else => return err,
        };
    };

    contract.gas = frame.gas_remaining;
    self.return_data = @constCast(frame.return_data.get());

    const output_data = frame.output;
    Log.debug("VM.interpret_with_blocks: Normal completion, output_size={}", .{output_data.len});
    const output: ?[]const u8 = if (output_data.len > 0) try self.allocator.dupe(u8, output_data) else null;

    Log.debug("VM.interpret_with_blocks: Execution completed, gas_used={}, output_size={}, output_ptr={any}", .{
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