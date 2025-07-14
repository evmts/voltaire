const std = @import("std");
const testing = std.testing;

test {
    std.testing.log_level = .debug;
}
const Evm = @import("evm");
const Address = @import("Address");

// Enable debug logging for tests
pub const std_options = struct {
    pub const log_level = .debug;
    pub const log_scope_levels = &[_]std.log.ScopeLevel{};
};

test "constructor should return runtime code" {
    const allocator = testing.allocator;
    
    // Test if logging is working
    std.log.info("[TEST] Starting constructor test", .{});
    std.log.debug("[TEST] Debug logging test", .{});

    // Set up EVM
    var memory_db = Evm.MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    
    const db_interface = memory_db.to_database_interface();
    var vm = try Evm.Evm.init(allocator, db_interface, null, null);
    defer vm.deinit();

    // Set up deployer account
    const deployer = Address.from_u256(0x1111);
    try vm.state.set_balance(deployer, 1000000000000000000); // 1 ETH

    // Minimal constructor bytecode that returns runtime code
    // This is the simplest possible Solidity-style constructor:
    // 1. PUSH the runtime code to memory
    // 2. RETURN it
    // Let me trace through this bytecode:
    // Stack starts empty []
    const init_code = &[_]u8{
        // Constructor code (returns runtime code)
        0x60, 0x0a, // PUSH1 10 (size of runtime code) - Stack: [10]
        0x60, 0x0c, // PUSH1 12 (offset of runtime code in this bytecode) - Stack: [10, 12]
        0x60, 0x00, // PUSH1 0 (destination in memory) - Stack: [10, 12, 0]
        0x39,       // CODECOPY (copy code to memory) - pops 3, Stack: []
        0x60, 0x00, // PUSH1 0 (offset in memory) - Stack: [0]
        0x60, 0x0a, // PUSH1 10 (size to return) - Stack: [0, 10]
        0xf3,       // RETURN - pops 2, returns memory[0..10]
        
        // Runtime code (10 bytes) - just returns 42
        0x60, 0x2a, // PUSH1 42
        0x60, 0x00, // PUSH1 0
        0x52,       // MSTORE
        0x60, 0x20, // PUSH1 32
        0x60, 0x00, // PUSH1 0
        0xf3,       // RETURN
    };

    std.debug.print("\n=== Constructor Bug Test ===\n", .{});
    std.debug.print("Init code size: {}\n", .{init_code.len});
    std.debug.print("Expected runtime code size: 10\n", .{});
    
    // Deploy contract using CREATE
    std.debug.print("\n[TRACE] About to call vm.create_contract\n", .{});
    const create_result = try vm.create_contract(
        deployer,
        0, // value
        init_code,
        1000000 // gas
    );
    std.debug.print("[TRACE] create_contract returned, success={}, output_size={}\n", .{
        create_result.success, if (create_result.output) |o| o.len else 0
    });
    defer if (create_result.output) |output| allocator.free(output);

    std.debug.print("Create success: {}\n", .{create_result.success});
    std.debug.print("Create output size: {}\n", .{if (create_result.output) |o| o.len else 0});
    std.debug.print("Gas left: {}\n", .{create_result.gas_left});
    
    // Check deployment
    try testing.expect(create_result.success);
    
    // Get deployed code
    const deployed_code = vm.state.get_code(create_result.address);
    std.debug.print("Deployed code size: {}\n", .{deployed_code.len});
    
    // Print deployed code bytes
    if (deployed_code.len > 0) {
        std.debug.print("Deployed code: ", .{});
        for (deployed_code) |byte| {
            std.debug.print("{x:0>2} ", .{byte});
        }
        std.debug.print("\n", .{});
    }
    
    // This should pass but currently fails
    try testing.expectEqual(@as(usize, 10), deployed_code.len);
    
    // Verify the deployed code matches expected runtime code
    const expected_runtime = init_code[12..22];
    try testing.expectEqualSlices(u8, expected_runtime, deployed_code);
}

test "manual constructor execution to debug" {
    const allocator = testing.allocator;

    // Set up EVM
    var memory_db = Evm.MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    
    const db_interface = memory_db.to_database_interface();
    var vm = try Evm.Evm.init(allocator, db_interface, null, null);
    defer vm.deinit();

    // Set up deployer account
    const deployer = Address.from_u256(0x1111);
    try vm.state.set_balance(deployer, 1000000000000000000);

    // Same init code as above
    const init_code = &[_]u8{
        0x60, 0x0a, // PUSH1 10 (size of runtime code)
        0x60, 0x0c, // PUSH1 12 (offset of runtime code) 
        0x60, 0x00, // PUSH1 0 (destination in memory)
        0x39,       // CODECOPY (copy code to memory)
        0x60, 0x00, // PUSH1 0 (offset in memory)
        0x60, 0x0a, // PUSH1 10 (size to return)
        0xf3,       // RETURN
        // Runtime code (starts at byte 12)
        0x60, 0x2a, 0x60, 0x00, 0x52, 0x60, 0x20, 0x60, 0x00, 0xf3,
    };

    std.debug.print("\n=== Manual Constructor Execution ===\n", .{});
    std.debug.print("Init code breakdown:\n", .{});
    std.debug.print("  Bytes 0-11: Constructor logic\n", .{});
    std.debug.print("  Bytes 12-21: Runtime code to be deployed\n", .{});
    
    // Create a contract for deployment
    var contract = Evm.Contract.init_deployment(
        deployer,
        0, // value
        1000000, // gas
        init_code,
        null // CREATE, not CREATE2
    );
    defer contract.deinit(allocator, null);

    // Execute the constructor
    const result = try vm.interpret(&contract, &.{});
    defer if (result.output) |output| allocator.free(output);

    std.debug.print("Execution status: {}\n", .{result.status});
    std.debug.print("Gas used: {}\n", .{result.gas_used});
    std.debug.print("Output size: {}\n", .{if (result.output) |o| o.len else 0});
    
    // Print output bytes
    if (result.output) |output| {
        std.debug.print("Output bytes: ", .{});
        for (output) |byte| {
            std.debug.print("{x:0>2} ", .{byte});
        }
        std.debug.print("\n", .{});
    }
    
    // Verify constructor executed successfully
    try testing.expectEqual(Evm.RunResult.Status.Success, result.status);
    try testing.expect(result.output != null);
    try testing.expectEqual(@as(usize, 10), result.output.?.len);
}

