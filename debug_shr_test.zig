const std = @import("std");
const evm = @import("evm");
const primitives = @import("primitives");
const revm = @import("revm");

test "debug SHR opcode test" {
    const allocator = std.testing.allocator;
    
    // Manual bytecode construction for SHR test: 8 >> 2 = 2
    const bytecode = [_]u8{
        0x60, 0x08,  // PUSH1 0x08 (value = 8)
        0x60, 0x02,  // PUSH1 0x02 (shift = 2) 
        0x1c,        // SHR (8 >> 2 = 2)
        0x60, 0x00,  // PUSH1 0x00 (offset for MSTORE)
        0x52,        // MSTORE (store result to memory[0])
        0x60, 0x20,  // PUSH1 0x20 (size = 32)
        0x60, 0x00,  // PUSH1 0x00 (offset = 0)
        0xf3         // RETURN (return 32 bytes from memory[0])
    };
    
    std.debug.print("Bytecode: ", .{});
    for (bytecode) |b| {
        std.debug.print("{x:02} ", .{b});
    }
    std.debug.print("\n", .{});
    
    // Test with REVM
    var revm_vm = try revm.Revm.init(allocator, .{
        .gas_limit = 1_000_000,
        .chain_id = 1,
    });
    defer revm_vm.deinit();
    
    const caller = primitives.Address{ .bytes = [_]u8{0x10} ++ [_]u8{0} ** 18 ++ [_]u8{0x01} };
    const contract = primitives.Address{ .bytes = [_]u8{0x20} ++ [_]u8{0} ** 18 ++ [_]u8{0x02} };
    
    try revm_vm.setBalance(caller, 1000000);
    try revm_vm.setCode(contract, &bytecode);
    
    var revm_result = revm_vm.execute(caller, contract, 0, &.{}, 1_000_000) catch |err| {
        std.debug.print("REVM failed with error: {}\n", .{err});
        return;
    };
    defer revm_result.deinit();
    
    std.debug.print("REVM result: success={}, output_len={}\n", .{ revm_result.success, revm_result.output.len });
    if (revm_result.output.len > 0) {
        std.debug.print("REVM output: ", .{});
        for (revm_result.output) |b| {
            std.debug.print("{x:02}", .{b});
        }
        std.debug.print("\n");
    }
    
    // Test with Guillotine
    var database = evm.Database.init(allocator);
    defer database.deinit();
    
    const code_hash = try database.set_code(&bytecode);
    try database.set_account(contract.bytes, .{
        .balance = 0,
        .nonce = 0,
        .code_hash = code_hash,
        .storage_root = [_]u8{0} ** 32,
    });
    
    try database.set_account(caller.bytes, .{
        .balance = 1000000,
        .nonce = 0,
        .code_hash = [_]u8{0} ** 32,
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
        caller,
        .CANCUN
    );
    defer guillotine_evm.deinit();
    
    const call_params = evm.CallParams{
        .call = .{
            .caller = caller,
            .to = contract,
            .value = 0,
            .input = &.{},
            .gas = 1_000_000,
        },
    };
    
    var guillotine_result = guillotine_evm.call(call_params);
    defer guillotine_result.deinit(allocator);
    
    std.debug.print("Guillotine result: success={}, output_len={}\n", .{ guillotine_result.success, guillotine_result.output.len });
    if (guillotine_result.output.len > 0) {
        std.debug.print("Guillotine output: ", .{});
        for (guillotine_result.output) |b| {
            std.debug.print("{x:02}", .{b});
        }
        std.debug.print("\n");
    }
    
    // Compare results
    std.debug.print("Results match: {}\n", .{std.mem.eql(u8, revm_result.output, guillotine_result.output)});
}