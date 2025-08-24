const std = @import("std");
const evm = @import("root.zig");
const testing = std.testing;
const primitives = @import("primitives");

test "EVM basic initialization" {
    const allocator = testing.allocator;
    
    var memory_db = evm.MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    
    const db_interface = memory_db.to_database_interface();
    
    const DefaultEvmType = evm.DefaultEvm;
    var vm = try DefaultEvmType.init(allocator, db_interface);
    defer vm.deinit();
    
    // Test that VM initialized correctly
    try testing.expect(vm.allocator == allocator);
}