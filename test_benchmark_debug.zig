const std = @import("std");
const print = std.debug.print;
const evm = @import("src/evm/root.zig");
const primitives = @import("src/primitives/root.zig");
const Address = primitives.Address.Address;

pub fn main() !void {
    print("=== DEBUG: Minimal benchmark test ===\n", .{});
    
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    const allocator = gpa.allocator();

    // Set up EVM infrastructure
    var memory_db = evm.MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = evm.DatabaseInterface.init(&memory_db);

    const block_info = evm.BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = primitives.ZERO_ADDRESS,
        .base_fee = 1000000000,
        .prev_randao = [_]u8{0} ** 32,
    };

    const context = evm.TransactionContext{
        .gas_limit = 21000000,
        .coinbase = primitives.ZERO_ADDRESS,
        .chain_id = 1,
    };

    print("1. Creating EVM instance...\n", .{});
    var evm_instance = try evm.DefaultEvm.init(allocator, db_interface, block_info, context, 0, primitives.ZERO_ADDRESS, .CANCUN);
    defer {
        print("5. Deinitializing EVM...\n", .{});
        evm_instance.deinit();
        print("6. EVM deinitialized\n", .{});
    }

    // Deploy simple contract
    const simple_code = [_]u8{0x00}; // STOP
    const deploy_address: Address = [_]u8{0} ** 19 ++ [_]u8{1};
    const code_hash = try memory_db.set_code(&simple_code);
    try memory_db.set_account(deploy_address, evm.Account{
        .nonce = 0,
        .balance = 0,
        .code_hash = code_hash,
        .storage_root = [_]u8{0} ** 32,
    });

    print("2. Calling contract...\n", .{});
    const call_params = evm.DefaultEvm.CallParams{
        .call = .{
            .caller = primitives.ZERO_ADDRESS,
            .to = deploy_address,
            .value = 0,
            .input = &.{},
            .gas = 100000,
        },
    };

    const result = try evm_instance.call(call_params);
    print("3. Call completed. Output len: {}\n", .{result.output.len});
    
    // Free the result output
    defer {
        print("4. Freeing result output...\n", .{});
        if (result.output.len > 0) allocator.free(result.output);
    }
    
    print("7. About to deinit GPA...\n", .{});
    const leak = gpa.deinit();
    print("8. GPA deinit result: {}\n", .{leak});
    
    print("9. Exiting normally\n", .{});
}