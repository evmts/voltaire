const std = @import("std");
const Evm = @import("evm");
const primitives = @import("primitives");
const MemoryDatabase = Evm.MemoryDatabase;
const DatabaseInterface = Evm.DatabaseInterface;
const Address = primitives.Address;
const Bytes32 = primitives.Bytes32;
const testing = std.testing;

const DevtoolEvm = @This();

allocator: std.mem.Allocator,
database: MemoryDatabase,
evm: Evm.Evm,
bytecode: []u8,

pub fn init(allocator: std.mem.Allocator) !DevtoolEvm {
    var database = MemoryDatabase.init(allocator);
    errdefer database.deinit();
    
    const db_interface = database.to_database_interface();
    var evm = try Evm.Evm.init(allocator, db_interface);
    errdefer evm.deinit();
    
    return DevtoolEvm{
        .allocator = allocator,
        .database = database,
        .evm = evm,
        .bytecode = &[_]u8{},
    };
}

pub fn deinit(self: *DevtoolEvm) void {
    if (self.bytecode.len > 0) {
        self.allocator.free(self.bytecode);
    }
    self.evm.deinit();
    self.database.deinit();
}

pub fn setBytecode(self: *DevtoolEvm, bytecode: []const u8) !void {
    // Free existing bytecode if any
    if (self.bytecode.len > 0) {
        self.allocator.free(self.bytecode);
    }
    
    // Allocate and copy new bytecode
    self.bytecode = try self.allocator.alloc(u8, bytecode.len);
    @memcpy(self.bytecode, bytecode);
}

test "DevtoolEvm.init creates EVM instance" {
    const allocator = testing.allocator;
    
    var devtool_evm = try DevtoolEvm.init(allocator);
    defer devtool_evm.deinit();
    
    try testing.expect(devtool_evm.allocator.ptr == allocator.ptr);
    try testing.expectEqual(@as(usize, 0), devtool_evm.bytecode.len);
    try testing.expectEqual(@as(u16, 0), devtool_evm.evm.depth);
    try testing.expectEqual(false, devtool_evm.evm.read_only);
}

test "DevtoolEvm.setBytecode stores bytecode" {
    const allocator = testing.allocator;
    
    var devtool_evm = try DevtoolEvm.init(allocator);
    defer devtool_evm.deinit();
    
    // Test with simple bytecode
    const test_bytecode = &[_]u8{ 0x60, 0x01, 0x60, 0x02, 0x01 }; // PUSH1 1 PUSH1 2 ADD
    try devtool_evm.setBytecode(test_bytecode);
    
    try testing.expectEqual(test_bytecode.len, devtool_evm.bytecode.len);
    try testing.expectEqualSlices(u8, test_bytecode, devtool_evm.bytecode);
    
    // Test replacing bytecode
    const new_bytecode = &[_]u8{ 0x60, 0x10, 0x60, 0x20, 0x01, 0x00 }; // PUSH1 16 PUSH1 32 ADD STOP
    try devtool_evm.setBytecode(new_bytecode);
    
    try testing.expectEqual(new_bytecode.len, devtool_evm.bytecode.len);
    try testing.expectEqualSlices(u8, new_bytecode, devtool_evm.bytecode);
}

test "DevtoolEvm.setBytecode handles empty bytecode" {
    const allocator = testing.allocator;
    
    var devtool_evm = try DevtoolEvm.init(allocator);
    defer devtool_evm.deinit();
    
    // Test with empty bytecode
    const empty_bytecode = &[_]u8{};
    try devtool_evm.setBytecode(empty_bytecode);
    
    try testing.expectEqual(@as(usize, 0), devtool_evm.bytecode.len);
}