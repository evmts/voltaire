const std = @import("std");
const DevtoolEvm = @import("src/devtool/evm.zig");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    // Create DevtoolEvm instance
    var devtool_evm = try DevtoolEvm.init(allocator);
    defer devtool_evm.deinit();

    std.debug.print("=== EVM Debugger Manual Test ===\n");
    
    // Test 1: Load bytecode (PUSH1 5, PUSH1 10, ADD)
    const test_bytecode = "0x6005600a01";
    std.debug.print("\n1. Loading bytecode: {s}\n", .{test_bytecode});
    try devtool_evm.loadBytecodeHex(test_bytecode);
    std.debug.print("   ✓ Bytecode loaded successfully\n");

    // Test 2: Get initial state
    std.debug.print("\n2. Initial EVM state:\n");
    const initial_state = try devtool_evm.serializeEvmState();
    defer allocator.free(initial_state);
    std.debug.print("   {s}\n", .{initial_state});

    // Test 3: Step through execution
    std.debug.print("\n3. Step-by-step execution:\n");
    
    var step_count: u32 = 0;
    while (step_count < 10) { // Safety limit
        step_count += 1;
        
        const step_result = devtool_evm.stepExecute() catch |err| {
            std.debug.print("   Error during step {}: {}\n", .{ step_count, err });
            break;
        };

        std.debug.print("   Step {}: {} (0x{x:0>2}) | PC: {} -> {} | Gas: {} -> {}\n", .{
            step_count,
            step_result.opcode_name,
            step_result.opcode,
            step_result.pc_before,
            step_result.pc_after,
            step_result.gas_before,
            step_result.gas_after,
        });

        if (step_result.completed) {
            std.debug.print("   ✓ Execution completed!\n");
            break;
        }

        if (step_result.error_occurred) {
            std.debug.print("   ✗ Execution error: {?}\n", .{step_result.execution_error});
            break;
        }
    }

    // Test 4: Final state
    std.debug.print("\n4. Final EVM state:\n");
    const final_state = try devtool_evm.serializeEvmState();
    defer allocator.free(final_state);
    std.debug.print("   {s}\n", .{final_state});
    
    // Test 5: Verify stack has result (should be 15 = 5 + 10)
    if (devtool_evm.current_frame) |frame| {
        if (frame.stack.size() > 0) {
            const stack_top = try frame.stack.peek(0);
            std.debug.print("\n5. Stack verification:\n");
            std.debug.print("   Stack size: {}\n", .{frame.stack.size()});
            std.debug.print("   Stack top (result): {}\n", .{stack_top});
            std.debug.print("   Expected result: 15 (5 + 10)\n");
            
            if (stack_top == 15) {
                std.debug.print("   ✓ Calculation correct!\n");
            } else {
                std.debug.print("   ✗ Calculation incorrect! Got {} instead of 15\n", .{stack_top});
            }
        }
    }

    std.debug.print("\n=== Test Complete ===\n");
}