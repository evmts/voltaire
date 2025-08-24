const std = @import("std");
const evm2 = @import("src/evm2/evm.zig");
const MemoryDatabase = @import("src/evm2/memory_database.zig").MemoryDatabase;
const DatabaseInterface = @import("src/evm2/database_interface.zig").DatabaseInterface;
const BlockInfo = @import("src/evm2/block_info.zig").BlockInfo;
const hardfork = @import("src/evm/hardforks/hardfork.zig");

test "EVM2 - precompile integration test" {
    const testing = std.testing;
    
    // Create default EVM with precompiles enabled
    const DefaultEvm = evm2.DefaultEvm;
    
    var memory_db = MemoryDatabase.init(testing.allocator);
    defer memory_db.deinit();
    const db_interface = DatabaseInterface.init(&memory_db);
    
    const ZERO_ADDRESS = [_]u8{0} ** 20;
    
    const block_info = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 1000000000,
        .prev_randao = [_]u8{0} ** 32,
    };
    
    const context = DefaultEvm.TransactionContext{
        .gas_limit = 1000000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };
    
    var evm = try DefaultEvm.init(testing.allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN);
    defer evm.deinit();
    
    // Test IDENTITY precompile (0x04)
    const identity_address = [_]u8{0} ** 19 ++ [_]u8{4};
    const test_data = "Hello World";
    
    const call_params = DefaultEvm.CallParams{
        .call = .{
            .caller = ZERO_ADDRESS,
            .to = identity_address,
            .value = 0,
            .input = test_data,
            .gas = 100000,
        },
    };
    
    const result = try evm.call(call_params);
    defer if (result.output.len > 0) testing.allocator.free(result.output);
    
    try testing.expect(result.success);
    try testing.expectEqual(test_data.len, result.output.len);
    try testing.expectEqualStrings(test_data, result.output);
    
    std.debug.print("✅ EVM2 Precompile Integration Test Passed!\n", .{});
    std.debug.print("   IDENTITY precompile returned: '{s}'\n", .{result.output});
    std.debug.print("   Gas consumed: {}\n", .{100000 - result.gas_left});
}

test "EVM2 - precompiles disabled test" {
    const testing = std.testing;
    
    // Create EVM with precompiles disabled
    const NoPrecompileEvm = evm2.Evm(.{ .enable_precompiles = false });
    
    var memory_db = MemoryDatabase.init(testing.allocator);
    defer memory_db.deinit();
    const db_interface = DatabaseInterface.init(&memory_db);
    
    const ZERO_ADDRESS = [_]u8{0} ** 20;
    
    const block_info = BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = ZERO_ADDRESS,
        .base_fee = 1000000000,
        .prev_randao = [_]u8{0} ** 32,
    };
    
    const context = NoPrecompileEvm.TransactionContext{
        .gas_limit = 1000000,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };
    
    var evm = try NoPrecompileEvm.init(testing.allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN);
    defer evm.deinit();
    
    // Try to call IDENTITY precompile - should be treated as regular call
    const identity_address = [_]u8{0} ** 19 ++ [_]u8{4};
    const test_data = "Hello World";
    
    const call_params = NoPrecompileEvm.CallParams{
        .call = .{
            .caller = ZERO_ADDRESS,
            .to = identity_address,
            .value = 0,
            .input = test_data,
            .gas = 100000,
        },
    };
    
    const result = try evm.call(call_params);
    
    // Should succeed but not execute as precompile
    try testing.expect(result.success);
    try testing.expectEqual(@as(usize, 0), result.output.len);
    try testing.expectEqual(@as(u64, 100000), result.gas_left); // No gas consumed
    
    std.debug.print("✅ EVM2 Precompiles Disabled Test Passed!\n", .{});
    std.debug.print("   Call succeeded but no precompile executed\n", .{});
}