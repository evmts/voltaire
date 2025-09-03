const std = @import("std"); 
const evm = @import("evm");
const primitives = @import("primitives");

test "simple chainid test" {
    const allocator = std.testing.allocator;
    
    var database = evm.Database.init(allocator);
    defer database.deinit();
    
    const contract_address = primitives.Address{ .bytes = [_]u8{0x20} ++ [_]u8{0} ** 18 ++ [_]u8{0x02} };
    
    // Simple CHAINID bytecode: 0x46 (CHAINID) + return it
    const bytecode = [_]u8{ 0x46, 0x60, 0x00, 0x52, 0x60, 0x20, 0x60, 0x00, 0xF3 }; // CHAINID, PUSH1 0x00, MSTORE, PUSH1 0x20, PUSH1 0x00, RETURN
    
    const code_hash = try database.set_code(&bytecode);
    try database.set_account(contract_address.bytes, .{
        .balance = 0,
        .nonce = 0,
        .code_hash = code_hash,
        .storage_root = [_]u8{0} ** 32,
    });
    
    const block_info = evm.BlockInfo{
        .chain_id = 1,
        .number = 20_000_000,
        .timestamp = 1_800_000_000,
        .difficulty = 0,
        .gas_limit = 1_000_000_000,
        .coinbase = primitives.ZERO_ADDRESS,
        .base_fee = 7,
        .prev_randao = [_]u8{0} ** 32,
        .blob_base_fee = 1000000000,
        .blob_versioned_hashes = &.{},
    };

    const tx_context = evm.TransactionContext{
        .gas_limit = 1_000_000,
        .coinbase = primitives.ZERO_ADDRESS,
        .chain_id = 1,
    };
    
    var guillotine_evm = try evm.Evm(.{}).init(
        allocator,
        &database,
        block_info,
        tx_context,
        0,
        primitives.ZERO_ADDRESS,
        .CANCUN
    );
    defer guillotine_evm.deinit();
    
    const call_params = evm.CallParams{
        .call = .{
            .caller = primitives.ZERO_ADDRESS,
            .to = contract_address,
            .value = 0,
            .input = &.{}, 
            .gas = 1_000_000,
        },
    };
    
    var result = guillotine_evm.call(call_params);
    defer result.deinit(allocator);
    
    std.debug.print("Success: {}
", .{result.success});
    std.debug.print("Output length: {}
", .{result.output.len});
    if (result.output.len >= 32) {
        const value = std.mem.readInt(u256, result.output[0..32], .big);
        std.debug.print("Chain ID returned: {}
", .{value});
    }
}
