const std = @import("std");
const evm = @import("src/evm/root.zig");
const primitives = @import("src/primitives/root.zig");

test "LOG0 opcode works through interpreter" {
    const allocator = std.testing.allocator;
    
    // Create bytecode: PUSH1 0x10, PUSH1 0x00, LOG0, STOP
    // This logs 16 bytes from memory offset 0
    const bytecode = [_]u8{
        0x60, 0x10,  // PUSH1 16 (length)
        0x60, 0x00,  // PUSH1 0 (offset)
        0xa0,        // LOG0
        0x00,        // STOP
    };
    
    // Create database
    var memory_db = evm.MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = memory_db.to_database_interface();
    
    // Create EVM instance
    var vm = try evm.Evm(.{}).init(
        allocator, 
        db_interface,
        .{}, // Default block info
        .{   // Transaction context
            .gas_price = 1,
            .origin = primitives.ZERO_ADDRESS,
            .block_hash_cache = std.AutoHashMap(u64, primitives.B256).init(allocator),
        },
        1,   // gas_price
        primitives.ZERO_ADDRESS, // origin
        .LATEST, // hardfork
    );
    defer vm.deinit();
    
    // Execute call
    const params = evm.CallParams{
        .caller = primitives.ZERO_ADDRESS,
        .bytecode_address = primitives.ZERO_ADDRESS,
        .target_address = primitives.ZERO_ADDRESS,
        .value = 0,
        .data = &.{},
        .gas_limit = 100000,
        .is_static = false,
    };
    
    const result = try vm.call(params, &bytecode);
    
    // Verify we got logs
    try std.testing.expect(result.logs.len > 0);
    try std.testing.expectEqual(@as(usize, 1), result.logs.len);
    
    // Verify log contents
    const log = result.logs[0];
    try std.testing.expectEqual(primitives.ZERO_ADDRESS, log.address);
    try std.testing.expectEqual(@as(usize, 0), log.topics.len); // LOG0 has no topics
    try std.testing.expectEqual(@as(usize, 16), log.data.len);
    
    // Verify log data is zeros (uninitialized memory)
    for (log.data) |byte| {
        try std.testing.expectEqual(@as(u8, 0), byte);
    }
    
    // Clean up log allocations
    for (result.logs) |l| {
        allocator.free(l.topics);
        allocator.free(l.data);
    }
    allocator.free(result.logs);
}

test "LOG1 with topic works" {
    const allocator = std.testing.allocator;
    
    // Create bytecode: PUSH32 topic, PUSH1 0x20, PUSH1 0x00, LOG1, STOP
    // This logs 32 bytes from memory offset 0 with one topic
    var bytecode: [69]u8 = undefined;
    bytecode[0] = 0x7f; // PUSH32
    const topic_value: u256 = 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef;
    std.mem.writeInt(u256, bytecode[1..33], topic_value, .big);
    bytecode[33] = 0x60; // PUSH1
    bytecode[34] = 0x20; // 32 (length)
    bytecode[35] = 0x60; // PUSH1  
    bytecode[36] = 0x00; // 0 (offset)
    bytecode[37] = 0xa1; // LOG1
    bytecode[38] = 0x00; // STOP
    
    // Create database
    var memory_db = evm.MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = memory_db.to_database_interface();
    
    // Create EVM instance
    var vm = try evm.Evm(.{}).init(
        allocator, 
        db_interface,
        .{}, // Default block info
        .{   // Transaction context
            .gas_price = 1,
            .origin = primitives.ZERO_ADDRESS,
            .block_hash_cache = std.AutoHashMap(u64, primitives.B256).init(allocator),
        },
        1,   // gas_price
        primitives.ZERO_ADDRESS, // origin
        .LATEST, // hardfork
    );
    defer vm.deinit();
    
    // Execute call
    const params = evm.CallParams{
        .caller = primitives.ZERO_ADDRESS,
        .bytecode_address = primitives.ZERO_ADDRESS,
        .target_address = primitives.ZERO_ADDRESS,
        .value = 0,
        .data = &.{},
        .gas_limit = 100000,
        .is_static = false,
    };
    
    const result = try vm.call(params, &bytecode);
    
    // Verify we got logs
    try std.testing.expectEqual(@as(usize, 1), result.logs.len);
    
    // Verify log contents
    const log = result.logs[0];
    try std.testing.expectEqual(primitives.ZERO_ADDRESS, log.address);
    try std.testing.expectEqual(@as(usize, 1), log.topics.len); // LOG1 has 1 topic
    try std.testing.expectEqual(topic_value, log.topics[0]);
    try std.testing.expectEqual(@as(usize, 32), log.data.len);
    
    // Clean up log allocations
    for (result.logs) |l| {
        allocator.free(l.topics);
        allocator.free(l.data);
    }
    allocator.free(result.logs);
}