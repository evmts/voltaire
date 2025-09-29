const std = @import("std");
const guillotine = @import("src/evm.zig");
const primitives = @import("lib/primitives/src/primitives.zig");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();
    
    // Create a simple contract that does a JUMPI
    // This mimics what the ecadd test does: check function selector and jump
    const bytecode = [_]u8{
        0x60, 0x00, // PUSH1 0x00
        0x35,       // CALLDATALOAD
        0x60, 0x08, // PUSH1 0x08 (jump destination)
        0x57,       // JUMPI
        0x00,       // STOP
        0x00,       // STOP
        0x5b,       // JUMPDEST (at position 8)
        0x60, 0x01, // PUSH1 0x01
        0x00,       // STOP
    };
    
    const block_params = guillotine.BlockContext{
        .number = 1,
        .timestamp = 1000,
        .gas_limit = 10000000,
        .coinbase = primitives.Address.zero(),
        .base_fee = 0,
        .chain_id = 1,
    };
    
    var evm = try guillotine.EVM.init(allocator, block_params, .{});
    defer evm.deinit();
    
    // Deploy the contract
    const contract_address = primitives.Address.from_u256(0x1234);
    try evm.db.setCode(contract_address, &bytecode);
    
    // Call with data that will cause the JUMPI to be taken
    var call_data = [_]u8{0} ** 32;
    call_data[31] = 1; // Non-zero value for JUMPI
    
    const params = guillotine.CallParams{
        .caller = primitives.Address.zero(),
        .to = contract_address,
        .value = 0,
        .input = &call_data,
        .gas = 100000,
        .call_type = .call,
    };
    
    std.debug.print("Calling contract with JUMPI...\n", .{});
    const result = evm.call(params);
    
    if (result.success) {
        std.debug.print("✓ Call succeeded, gas used: {d}\n", .{result.gas_used});
    } else {
        std.debug.print("✗ Call failed\n", .{});
    }
}