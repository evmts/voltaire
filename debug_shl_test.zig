const std = @import("std");
const evm = @import("evm");
const primitives = @import("primitives");
const revm = @import("revm");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();
    
    // Manually create the bytecode for SHL test
    const bytecode = [_]u8{
        0x60, 0x03, // PUSH1 0x03 - value to shift
        0x60, 0x02, // PUSH1 0x02 - shift amount  
        0x1b,       // SHL: 3 << 2 = 12 (0x0C)
        0x60, 0x00, // PUSH1 0x00 - offset for MSTORE
        0x52,       // MSTORE
        0x60, 0x00, // PUSH1 0x00 - offset for RETURN
        0x60, 0x20, // PUSH1 0x20 - size for RETURN (32 bytes)
        0xf3        // RETURN
    };
    
    std.debug.print("Bytecode: ", .{});
    for (bytecode) |b| {
        std.debug.print("{x:0>2} ", .{b});
    }
    std.debug.print("\n", .{});
    
    // Test with Guillotine
    var database = evm.Database.init(allocator);
    defer database.deinit();
    
    const caller_address = primitives.Address{ .bytes = [_]u8{0x10} ++ [_]u8{0} ** 18 ++ [_]u8{0x01} };
    const contract_address = primitives.Address{ .bytes = [_]u8{0x20} ++ [_]u8{0} ** 18 ++ [_]u8{0x02} };
    
    // Set the bytecode on the contract account
    const code_hash = try database.set_code(&bytecode);
    
    try database.set_account(contract_address.bytes, .{
        .balance = 0,
        .nonce = 0,
        .code_hash = code_hash,
        .storage_root = [_]u8{0} ** 32,
    });
    
    try database.set_account(caller_address.bytes, .{
        .balance = std.math.maxInt(u256),
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
        caller_address,
        .CANCUN
    );
    defer guillotine_evm.deinit();
    
    const call_params = evm.CallParams{
        .call = .{
            .caller = caller_address,
            .to = contract_address,
            .value = 0,
            .input = &.{},
            .gas = 1_000_000,
        },
    };
    
    var guillotine_result = guillotine_evm.call(call_params);
    defer guillotine_result.deinit(allocator);
    
    std.debug.print("Guillotine success: {}\n", .{guillotine_result.success});
    std.debug.print("Guillotine output length: {}\n", .{guillotine_result.output.len});
    if (guillotine_result.output.len > 0) {
        std.debug.print("Guillotine output: ");
        for (guillotine_result.output) |b| {
            std.debug.print("{x:0>2} ", .{b});
        }
        std.debug.print("\n");
        // Print as big-endian u256
        if (guillotine_result.output.len == 32) {
            const value = std.mem.readInt(u256, @ptrCast(guillotine_result.output[0..32]), .big);
            std.debug.print("Guillotine result as u256: {}\n", .{value});
        }
    }
    
    // Test with REVM
    var revm_vm = try revm.Revm.init(allocator, .{
        .gas_limit = 1_000_000,
        .chain_id = 1,
    });
    defer revm_vm.deinit();
    
    try revm_vm.setBalance(caller_address, std.math.maxInt(u256));
    try revm_vm.setCode(contract_address, &bytecode);
    
    var revm_result = revm_vm.execute(caller_address, contract_address, 0, &.{}, 1_000_000) catch |err| {
        std.debug.print("REVM failed with error: {}\n", .{err});
        return;
    };
    defer revm_result.deinit();
    
    std.debug.print("REVM success: {}\n", .{revm_result.success});
    std.debug.print("REVM output length: {}\n", .{revm_result.output.len});
    if (revm_result.output.len > 0) {
        std.debug.print("REVM output: ");
        for (revm_result.output) |b| {
            std.debug.print("{x:0>2} ", .{b});
        }
        std.debug.print("\n");
        // Print as big-endian u256
        if (revm_result.output.len == 32) {
            const value = std.mem.readInt(u256, @ptrCast(revm_result.output[0..32]), .big);
            std.debug.print("REVM result as u256: {}\n", .{value});
        }
    }
}