const ExecutionError = @import("../execution/execution_error.zig");
const Contract = @import("../frame/contract.zig");
const RunResult = @import("run_result.zig").RunResult;
const Vm = @import("../evm.zig");
const interpret_with_blocks = @import("interpret_with_blocks.zig").interpret_with_blocks;

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
/// const result = try vm.interpret(&contract, input);
/// defer if (result.output) |output| vm.allocator.free(output);
/// ```
pub fn interpret(self: *Vm, contract: *Contract, input: []const u8) ExecutionError.Error!RunResult {
    // Use block-based execution when enabled, otherwise fall back to normal execution
    if (self.block_execution_config.enabled) {
        return try interpret_with_blocks(self, contract, input, false);
    }
    return try self.interpret_with_context(contract, input, false);
}
