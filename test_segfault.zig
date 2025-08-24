const std = @import("std");
const evm = @import("src/evm/root.zig");
const primitives = @import("src/primitives/root.zig");

pub fn main() !void {
    std.debug.print("=== Testing Use-After-Free Theory ===\n", .{});
    
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    // Set up minimal EVM
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

    std.debug.print("1. Creating EVM instance...\n", .{});
    var evm_instance = try evm.DefaultEvm.init(allocator, db_interface, block_info, context, 0, primitives.ZERO_ADDRESS, .CANCUN);
    
    // Deploy a simple contract that just returns data
    const simple_code = [_]u8{0x60, 0x00, 0x60, 0x00, 0xF3}; // PUSH1 0 PUSH1 0 RETURN
    const deploy_address = primitives.Address.from_hex("0x0000000000000000000000000000000000000001") catch unreachable;
    const code_hash = try memory_db.set_code(&simple_code);
    try memory_db.set_account(deploy_address, evm.Account{
        .nonce = 0,
        .balance = 0,
        .code_hash = code_hash,
        .storage_root = [_]u8{0} ** 32,
    });

    std.debug.print("2. Calling contract...\n", .{});
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
    std.debug.print("3. Call succeeded: {}, output len: {}\n", .{result.success, result.output.len});
    
    // Save the output pointer for later
    const output_ptr = result.output.ptr;
    std.debug.print("4. Output pointer: {*}\n", .{output_ptr});
    
    // Now deinit the EVM
    std.debug.print("5. Deinitializing EVM...\n", .{});
    evm_instance.deinit();
    std.debug.print("6. EVM deinitialized\n", .{});
    
    // Try to access the result output - this should crash if our theory is correct
    std.debug.print("7. Attempting to access result output after EVM deinit...\n", .{});
    if (result.output.len > 0) {
        std.debug.print("8. First byte of output: {}\n", .{result.output[0]});
    }
    
    std.debug.print("9. Test completed without crash - theory incorrect\n", .{});
}