const std = @import("std");
const testing = std.testing;
const Evm = @import("evm");
const Address = @import("Address");

test "debug revert contract" {
    const allocator = testing.allocator;
    
    var memory_db = Evm.MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    
    const db_interface = memory_db.to_database_interface();
    var vm = try Evm.Evm.init(allocator, db_interface, null, null);
    defer vm.deinit();
    
    const deployer = Address.from_u256(0x1111);
    try vm.state.set_balance(deployer, 1000000);
    
    // Simple contract that just reverts
    const init_code = &[_]u8{
        // Constructor
        0x60, 0x05, // PUSH1 5 (size)
        0x60, 0x0c, // PUSH1 12 (offset)
        0x60, 0x00, // PUSH1 0
        0x39,       // CODECOPY
        0x60, 0x05, // PUSH1 5
        0x60, 0x00, // PUSH1 0
        0xf3,       // RETURN
        
        // Runtime: always revert
        0x60, 0x00, // PUSH1 0 (size)
        0x60, 0x00, // PUSH1 0 (offset)
        0xfd,       // REVERT
    };
    
    std.debug.print("\n=== Debug Revert Contract ===\n", .{});
    
    // Deploy the contract
    const create_result = try vm.create_contract(
        deployer,
        0,
        init_code,
        1000000
    );
    defer if (create_result.output) |output| allocator.free(output);
    
    std.debug.print("Deploy success: {}\n", .{create_result.success});
    std.debug.print("Contract address: {any}\n", .{create_result.address});
    
    // Check deployed code
    const code = vm.state.get_code(create_result.address);
    std.debug.print("Deployed code size: {} bytes\n", .{code.len});
    std.debug.print("Deployed code: ", .{});
    for (code) |byte| {
        std.debug.print("{x:0>2} ", .{byte});
    }
    std.debug.print("\n", .{});
    
    // Call the contract
    std.debug.print("\nCalling the contract...\n", .{});
    const call_result = try vm.call_contract(
        deployer,
        create_result.address,
        0,
        &.{},
        100000,
        false
    );
    defer if (call_result.output) |output| allocator.free(output);
    
    std.debug.print("Call success: {}\n", .{call_result.success});
    std.debug.print("Gas left: {}\n", .{call_result.gas_left});
    
    try testing.expect(!call_result.success);
}