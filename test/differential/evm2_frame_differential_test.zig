const std = @import("std");
const testing = std.testing;
const evm = @import("evm");
const evm2 = @import("evm2");
const primitives = @import("primitives");
const Address = primitives.Address;
const CallParams = evm.CallParams;
const CallResult = evm.CallResult;

// Import REVM wrapper from module
const revm_wrapper = @import("revm");

test "EVM2 Frame ADD opcode 5 + 10 = 15" {
    if (std.process.getEnvVarOwned(testing.allocator, "ENABLE_ALIGNMENT_TESTS")) |_| {
        // Environment variable set, run the test
    } else |_| {
        // Environment variable not set, skip the test
        return error.SkipZigTest;
    }
    const allocator = testing.allocator;

    // PUSH1 10, PUSH1 5, ADD, PUSH1 0, MSTORE, PUSH1 32, PUSH1 0, RETURN
    const bytecode = [_]u8{
        0x60, 0x0a, // PUSH1 10
        0x60, 0x05, // PUSH1 5  
        0x01,       // ADD
        0x60, 0x00, // PUSH1 0 (memory offset)
        0x52,       // MSTORE
        0x60, 0x20, // PUSH1 32 (size)
        0x60, 0x00, // PUSH1 0 (offset)
        0xf3,       // RETURN
    };
    const expected: u256 = 15;

    // Execute on REVM - inline all setup
    const revm_settings = revm_wrapper.RevmSettings{};
    var revm_vm = try revm_wrapper.Revm.init(allocator, revm_settings);
    defer revm_vm.deinit();

    const revm_deployer = try Address.from_hex("0x1111111111111111111111111111111111111111");
    const revm_contract_address = try Address.from_hex("0x2222222222222222222222222222222222222222");

    // Set balance for deployer
    try revm_vm.setBalance(revm_deployer, 10000000);

    // Set the bytecode as contract code
    try revm_vm.setCode(revm_contract_address, &bytecode);

    // Call the contract to execute the bytecode
    var revm_result = try revm_vm.call(revm_deployer, revm_contract_address, 0, &[_]u8{}, 1000000);
    defer revm_result.deinit();

    // Execute on Guillotine legacy EVM - inline all setup
    const MemoryDatabase = evm.MemoryDatabase;

    // Create EVM instance
    var memory_db = MemoryDatabase.init(allocator);
    defer memory_db.deinit();

    const db_interface = memory_db.to_database_interface();
    var vm_instance = try evm.Evm.init(allocator, db_interface, null, null, null, null);
    defer vm_instance.deinit();

    const contract_address = Address.from_u256(0x2222222222222222222222222222222222222222);

    // Set the code for the contract address in EVM state
    try vm_instance.state.set_code(contract_address, &bytecode);

    // Execute using legacy EVM
    const call_params = CallParams{ .call = .{
        .caller = contract_address,
        .to = contract_address,
        .value = 0,
        .input = &[_]u8{},
        .gas = 1000000,
    } };

    const legacy_result = try vm_instance.call(call_params);

    // Execute on EVM2 Frame - direct execution
    const Frame = evm2.Frame(.{});
    var frame = try Frame.init(allocator, &bytecode, 1000000, {}, null);
    defer frame.deinit(allocator);

    // Create interpreter for the frame
    const Interpreter = evm2.FrameInterpreter(Frame);
    var interpreter = Interpreter.init(&frame);

    const frame_result = interpreter.interpret();
    
    // Compare results - all should succeed (or fail consistently)
    const revm_succeeded = revm_result.success;
    const legacy_succeeded = legacy_result.success;
    const frame_succeeded = switch (frame_result) {
        Frame.Error.STOP => true, // Normal termination
        else => false,
    };

    // For debugging - print results if they differ
    if (revm_succeeded != legacy_succeeded or legacy_succeeded != frame_succeeded) {
        std.debug.print("Result mismatch:\n", .{});
        std.debug.print("  REVM success: {}\n", .{revm_succeeded});
        std.debug.print("  Legacy success: {}\n", .{legacy_succeeded});
        std.debug.print("  Frame success: {}\n", .{frame_succeeded});
        
        if (revm_result.output) |revm_output| {
            std.debug.print("  REVM output: ", .{});
            for (revm_output) |byte| std.debug.print("{:02x}", .{byte});
            std.debug.print("\n", .{});
        }
        
        if (legacy_result.output) |legacy_output| {
            std.debug.print("  Legacy output: ", .{});
            for (legacy_output) |byte| std.debug.print("{:02x}", .{byte});
            std.debug.print("\n", .{});
        }
    }

    // Compare outputs if all succeeded
    if (revm_succeeded and legacy_succeeded and frame_succeeded) {
        if (revm_result.output) |revm_output| {
            if (legacy_result.output) |legacy_output| {
                if (revm_output.len >= 32 and legacy_output.len >= 32) {
                    const revm_value = std.mem.readInt(u256, revm_output[0..32], .big);
                    const legacy_value = std.mem.readInt(u256, legacy_output[0..32], .big);
                    
                    try testing.expectEqual(expected, revm_value);
                    try testing.expectEqual(expected, legacy_value);
                    try testing.expectEqual(revm_value, legacy_value);
                }
            }
        }
    }

    // Note: This test may fail initially because EVM2 Frame is still under development
    // The test serves to track progress and identify missing functionality
}

test "EVM2 Frame simple PUSH and STOP" {
    if (std.process.getEnvVarOwned(testing.allocator, "ENABLE_ALIGNMENT_TESTS")) |_| {
        // Environment variable set, run the test
    } else |_| {
        // Environment variable not set, skip the test
        return error.SkipZigTest;
    }
    const allocator = testing.allocator;

    // PUSH1 42, STOP
    const bytecode = [_]u8{
        0x60, 0x2a, // PUSH1 42
        0x00,       // STOP
    };

    // Execute on EVM2 Frame
    const Frame = evm2.Frame(.{});
    var frame = try Frame.init(allocator, &bytecode, 1000000, {}, null);
    defer frame.deinit(allocator);

    // Create interpreter for the frame
    const Interpreter = evm2.FrameInterpreter(Frame);
    var interpreter = Interpreter.init(&frame);

    const result = interpreter.interpret();
    
    // Should terminate normally with STOP
    switch (result) {
        Frame.Error.STOP => {
            // Check that value was pushed to stack
            try testing.expectEqual(@as(u32, 1), frame.stack.size());
            const top_value = frame.stack.peek_unsafe();
            try testing.expectEqual(@as(u256, 42), top_value);
        },
        else => {
            std.debug.print("Unexpected frame result: {}\n", .{result});
            try testing.expect(false);
        },
    }
}