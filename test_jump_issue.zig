const std = @import("std");
const evm = @import("evm");
const primitives = @import("primitives");

pub fn main() !void {
    const allocator = std.heap.page_allocator;
    
    // Simple bytecode that demonstrates the issue:
    // CALLVALUE, DUP1, ISZERO, PUSH2 0x000f, JUMPI, ... JUMPDEST at 0x0f
    const bytecode = [_]u8{
        0x34,       // 0: CALLVALUE
        0x80,       // 1: DUP1
        0x15,       // 2: ISZERO
        0x61, 0x00, 0x0a, // 3-5: PUSH2 0x000a (jump to position 10)
        0x57,       // 6: JUMPI
        0x60, 0x00, // 7-8: PUSH1 0x00
        0x00,       // 9: STOP
        0x5b,       // 10: JUMPDEST
        0x60, 0x42, // 11-12: PUSH1 0x42
        0x60, 0x00, // 13-14: PUSH1 0x00
        0x52,       // 15: MSTORE
        0x60, 0x20, // 16-17: PUSH1 0x20
        0x60, 0x00, // 18-19: PUSH1 0x00
        0xf3,       // 20: RETURN
    };
    
    std.debug.print("Testing simple JUMPI with bytecode length: {}\n", .{bytecode.len});
    
    // Set up VM
    var memory_db = evm.MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = memory_db.to_database_interface();
    
    var vm = try evm.Evm.init(allocator, db_interface, null, null, null, 0, false, null);
    defer vm.deinit();
    
    const caller = primitives.Address.from_u256(0x1000000000000000000000000000000000000001);
    try vm.state.set_balance(caller, std.math.maxInt(u256));
    
    // Deploy the contract (which will execute the constructor)
    std.debug.print("Deploying contract with constructor bytecode\n", .{});
    const create_result = try vm.create_contract(caller, 0, &bytecode, 10_000_000);
    
    if (create_result.success) {
        std.debug.print("SUCCESS: Contract deployed at address: {x}\n", .{primitives.Address.to_u256(create_result.address)});
        const deployed_code = vm.state.get_code(create_result.address);
        std.debug.print("Deployed code length: {}\n", .{deployed_code.len});
        if (deployed_code.len > 0) {
            std.debug.print("First bytes of deployed code: ", .{});
            for (deployed_code[0..@min(20, deployed_code.len)]) |b| {
                std.debug.print("{x:0>2} ", .{b});
            }
            std.debug.print("\n", .{});
        }
    } else {
        std.debug.print("FAILED: Contract deployment failed\n", .{});
        std.debug.print("Status: {}\n", .{create_result.status});
        std.debug.print("Gas left: {}\n", .{create_result.gas_left});
    }
}