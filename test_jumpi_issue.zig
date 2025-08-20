const std = @import("std");
const evm_module = @import("evm");
const primitives = @import("primitives");

pub fn main() !void {
    const allocator = std.heap.page_allocator;
    
    // Simplified ERC20 constructor bytecode that fails
    // This is the exact sequence from the error
    const bytecode = [_]u8{
        0x60, 0x80, // 0-1: PUSH1 0x80
        0x60, 0x40, // 2-3: PUSH1 0x40
        0x52,       // 4: MSTORE
        0x34,       // 5: CALLVALUE
        0x80,       // 6: DUP1
        0x15,       // 7: ISZERO
        0x61, 0x00, 0x0f, // 8-10: PUSH2 0x000f (push 15)
        0x57,       // 11: JUMPI
        0x5f, 0x5f, // 12-13: PUSH0 PUSH0
        0xfd,       // 14: REVERT
        0x5b,       // 15: JUMPDEST (target of jump)
        0x50,       // 16: POP
        0x00,       // 17: STOP
    };
    
    std.debug.print("\n=== Testing JUMPI issue ===\n", .{});
    std.debug.print("Bytecode length: {}\n", .{bytecode.len});
    std.debug.print("Expected jump destination: 15 (0x0f)\n", .{});
    std.debug.print("Bytecode at position 15: 0x{x:0>2} (should be 0x5b JUMPDEST)\n\n", .{bytecode[15]});
    
    // Set up VM
    var memory_db = evm_module.MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = memory_db.to_database_interface();
    
    var vm = try evm_module.Evm.init(allocator, db_interface, null, null, null, 0, false, null);
    defer vm.deinit();
    
    const caller = primitives.Address.from_u256(0x1000000000000000000000000000000000000001);
    try vm.state.set_balance(caller, std.math.maxInt(u256));
    
    // Deploy the contract (which will execute the constructor)
    std.debug.print("Deploying contract with constructor bytecode\n", .{});
    const create_result = try vm.create_contract(caller, 0, &bytecode, 10_000_000);
    
    if (create_result.success) {
        std.debug.print("✓ SUCCESS: Contract deployed at address: {x}\n", .{primitives.Address.to_u256(create_result.address)});
        const deployed_code = vm.state.get_code(create_result.address);
        std.debug.print("  Deployed code length: {}\n", .{deployed_code.len});
        if (deployed_code.len > 0) {
            std.debug.print("  First bytes of deployed code: ", .{});
            for (deployed_code[0..@min(20, deployed_code.len)]) |b| {
                std.debug.print("{x:0>2} ", .{b});
            }
            std.debug.print("\n", .{});
        }
    } else {
        std.debug.print("✗ FAILED: Contract deployment failed\n", .{});
        std.debug.print("  Status: {}\n", .{create_result.status});
        std.debug.print("  Gas left: {}\n", .{create_result.gas_left});
    }
}