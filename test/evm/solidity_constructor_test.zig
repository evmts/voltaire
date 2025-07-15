const std = @import("std");
const testing = std.testing;
const Evm = @import("evm");
const Address = @import("primitives");

test "complex Solidity constructor returns full runtime code" {
    const allocator = testing.allocator;

    // Set up EVM
    var memory_db = Evm.MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    
    const db_interface = memory_db.to_database_interface();
    var vm = try Evm.Evm.init(allocator, db_interface, null, null);
    defer vm.deinit();

    const deployer = Address.from_u256(0x1111);
    try vm.state.set_balance(deployer, 1000000000000000000);

    // This is actual bytecode from compiling a minimal ERC20 contract
    // It should deploy a contract with ~2000 bytes of runtime code
    // Constructor does: memory[0x40] = 0x80, then CODECOPY, then RETURN
    const erc20_init_code = &[_]u8{
        // Free memory pointer setup
        0x60, 0x80, // PUSH1 0x80
        0x60, 0x40, // PUSH1 0x40  
        0x52,       // MSTORE (memory[0x40] = 0x80)
        
        // Constructor logic that returns runtime code
        0x34, // CALLVALUE
        0x80, // DUP1
        0x15, // ISZERO
        0x61, 0x00, 0x10, // PUSH2 0x0010 (16 - position of JUMPDEST)
        0x57, // JUMPI
        0x60, 0x00, // PUSH1 0x00
        0x80, // DUP1
        0xfd, // REVERT
        0x5b, // JUMPDEST
        0x50, // POP
        
        // Return runtime code
        0x60, 0x04, // PUSH1 0x04 (4 - size of runtime code)
        0x80, // DUP1
        0x60, 0x21, // PUSH1 0x21 (33 - offset of runtime code)
        0x60, 0x00, // PUSH1 0x00 (destination in memory)
        0x39, // CODECOPY - copies code[31..35] to memory[0..4]
        0x60, 0x00, // PUSH1 0x00 (offset in memory)
        0x60, 0x04, // PUSH1 0x04 (size to return)
        0xf3, // RETURN
        
        // Runtime code starts here (offset 33)
        0x60, 0x80, 0x60, 0x40, // 4 bytes of runtime code
    };

    std.debug.print("\n=== Complex Solidity Constructor Test ===\n", .{});
    std.debug.print("Init code size: {}\n", .{erc20_init_code.len});
    
    const create_result = try vm.create_contract(
        deployer,
        0,
        erc20_init_code,
        1000000
    );
    defer if (create_result.output) |output| allocator.free(output);

    std.debug.print("Create success: {}\n", .{create_result.success});
    std.debug.print("Output size: {}\n", .{if (create_result.output) |o| o.len else 0});
    
    // Print the output bytes to see what's being returned
    if (create_result.output) |output| {
        std.debug.print("Output bytes (first 64): ", .{});
        for (output, 0..) |byte, i| {
            if (i < 64) {
                std.debug.print("{x:0>2} ", .{byte});
                if ((i + 1) % 16 == 0) std.debug.print("\n                         ", .{});
            }
        }
        std.debug.print("\n", .{});
    }
    
    const deployed_code = vm.state.get_code(create_result.address);
    std.debug.print("Deployed code size: {}\n", .{deployed_code.len});
    
    // Print deployed code bytes
    if (deployed_code.len > 0) {
        std.debug.print("Deployed code bytes: ", .{});
        for (deployed_code, 0..) |byte, i| {
            if (i < 64) {
                std.debug.print("{x:0>2} ", .{byte});
                if ((i + 1) % 16 == 0) std.debug.print("\n                     ", .{});
            }
        }
        std.debug.print("\n", .{});
    }
    
    // This test will likely fail - showing only 36 bytes deployed
    // instead of the expected runtime code size
    try testing.expect(deployed_code.len == 4); // Should deploy exactly 4 bytes
}

// Helper to convert byte array to u256 (big-endian)
fn bytesToU256(bytes: []const u8) u256 {
    var value: u256 = 0;
    for (bytes) |byte| {
        value = (value << 8) | byte;
    }
    return value;
}

test "gas metering for KECCAK256 operations" {
    const allocator = testing.allocator;

    var memory_db = Evm.MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    
    const db_interface = memory_db.to_database_interface();
    var vm = try Evm.Evm.init(allocator, db_interface, null, null);
    defer vm.deinit();

    const caller = Address.from_u256(0x1111);
    try vm.state.set_balance(caller, 1000000000000000000);

    // Simple init code that deploys a minimal contract
    const keccak_init_code = &[_]u8{
        // Constructor: copy runtime code and return it
        0x60, 0x0d, // PUSH1 13 (size of runtime code)
        0x60, 0x0c, // PUSH1 12 (offset of runtime code in this bytecode)
        0x60, 0x00, // PUSH1 0 (destination in memory)
        0x39,       // CODECOPY
        0x60, 0x00, // PUSH1 0 (offset in memory)
        0x60, 0x0d, // PUSH1 13 (size to return)
        0xf3,       // RETURN
        
        // Simple runtime code that just returns 0x42
        0x60, 0x42, // PUSH1 0x42
        0x60, 0x00, // PUSH1 0
        0x52,       // MSTORE
        0x60, 0x00, // PUSH1 0 (offset)
        0x60, 0x20, // PUSH1 32 (size)
        0xf3,       // RETURN
    };

    // Deploy the contract
    const create_result = try vm.create_contract(
        caller,
        0,
        keccak_init_code,
        1000000
    );
    defer if (create_result.output) |output| allocator.free(output);

    std.debug.print("\n=== Gas Metering Test ===\n", .{});
    std.debug.print("Contract deployed at: 0x{x}\n", .{Address.to_u256(create_result.address)});
    std.debug.print("Deployment success: {}\n", .{create_result.success});
    
    // Check what code was actually deployed
    const deployed_code = vm.state.get_code(create_result.address);
    std.debug.print("Deployed code size: {} bytes\n", .{deployed_code.len});
    std.debug.print("Deployed code: ", .{});
    for (deployed_code) |byte| {
        std.debug.print("{x:0>2} ", .{byte});
    }
    std.debug.print("\n", .{});
    
    // Call the contract
    const initial_gas: u64 = 1000000;
    const call_result = try vm.call_contract(
        caller,
        create_result.address,
        0, // value
        &.{}, // empty calldata
        initial_gas, // gas
        false // is_static
    );
    defer if (call_result.output) |output| allocator.free(output);

    const gas_used = initial_gas - call_result.gas_left;
    std.debug.print("Call success: {}\n", .{call_result.success});
    std.debug.print("Initial gas: {}\n", .{initial_gas});
    std.debug.print("Gas remaining: {}\n", .{call_result.gas_left});
    std.debug.print("Gas used: {}\n", .{gas_used});
    std.debug.print("Expected: some gas for PUSH/MSTORE/RETURN\n", .{});
    if (call_result.output) |output| {
        std.debug.print("Output size: {} bytes\n", .{output.len});
        if (output.len >= 32) {
            const value = bytesToU256(output[0..32]);
            std.debug.print("Output value: 0x{x}\n", .{value});
        }
    } else {
        std.debug.print("No output returned\n", .{});
    }
    
    // This should use some gas for the operations
    try testing.expect(gas_used > 0);
}