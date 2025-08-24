//! Missing test coverage for Frame operations
//! These tests restore previously commented-out SELFDESTRUCT tests 
//! and add missing database error and gas overflow tests.

const std = @import("std");
const Frame = @import("frame.zig").Frame;
const FrameConfig = @import("frame_config.zig").FrameConfig;
const MemoryDatabase = @import("memory_database.zig").MemoryDatabase;

// Mock Host implementation for testing
const MockHost = struct {
    allocator: std.mem.Allocator,
    should_call_succeed: bool = false,
    call_return_data: []const u8 = &.{},

    pub fn init(allocator: std.mem.Allocator) MockHost {
        return MockHost{
            .allocator = allocator,
        };
    }

    pub fn deinit(self: *MockHost) void {
        _ = self;
    }

    pub fn mark_for_destruction(self: *MockHost, contract_address: [20]u8, recipient: [20]u8) !void {
        _ = self;
        _ = contract_address;
        _ = recipient;
        // Mock implementation - just succeed
    }

    pub fn to_host(self: *MockHost) @import("host.zig").Host {
        return @import("host.zig").Host{
            .ptr = self,
            .vtable = &.{
                .mark_for_destruction = @ptrCast(&mark_for_destruction),
                .get_is_static = @ptrCast(&get_is_static),
            },
        };
    }

    fn get_is_static(ptr: *anyopaque) bool {
        _ = ptr;
        return false;
    }
};

// ============================================================================
// SELFDESTRUCT TESTS - Missing test coverage restored
// ============================================================================

test "Frame op_selfdestruct basic functionality" {
    const allocator = std.testing.allocator;
    
    var memory_db = MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = memory_db.to_database_interface();
    
    var mock_host = MockHost.init(allocator);
    defer mock_host.deinit();
    const host = mock_host.to_host();
    
    const F = Frame(.{ .has_database = true });
    const bytecode = [_]u8{ 0xFF, 0x00 }; // SELFDESTRUCT STOP
    var frame = try F.init(allocator, &bytecode, 1000000, db_interface, host);
    defer frame.deinit(allocator);
    
    // Set contract address for the frame
    frame.contract_address = [_]u8{0x12} ++ [_]u8{0} ** 19;
    
    // Push recipient address onto stack
    const recipient_addr: u256 = 0x1234567890123456789012345678901234567890;
    try frame.stack.push(recipient_addr);
    
    // Execute SELFDESTRUCT - should return STOP error
    try std.testing.expectError(error.STOP, frame.op_selfdestruct());
}

test "Frame op_selfdestruct stack underflow" {
    const allocator = std.testing.allocator;
    
    var memory_db = MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = memory_db.to_database_interface();
    
    var mock_host = MockHost.init(allocator);
    defer mock_host.deinit();
    const host = mock_host.to_host();
    
    const F = Frame(.{ .has_database = true });
    const bytecode = [_]u8{ 0xFF, 0x00 }; // SELFDESTRUCT STOP
    var frame = try F.init(allocator, &bytecode, 1000000, db_interface, host);
    defer frame.deinit(allocator);
    
    // Don't push anything onto stack - should cause underflow
    try std.testing.expectError(error.StackUnderflow, frame.op_selfdestruct());
}

test "Frame op_selfdestruct static context fails" {
    const allocator = std.testing.allocator;
    
    var memory_db = MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = memory_db.to_database_interface();
    
    var mock_host = MockHost.init(allocator);
    defer mock_host.deinit();
    const host = mock_host.to_host();
    
    const F = Frame(.{ .has_database = true });
    const bytecode = [_]u8{ 0xFF, 0x00 }; // SELFDESTRUCT STOP
    var frame = try F.init(allocator, &bytecode, 1000000, db_interface, host);
    defer frame.deinit(allocator);
    
    // Set static context
    frame.is_static = true;
    
    // Push recipient address onto stack
    const recipient_addr: u256 = 0x1234567890123456789012345678901234567890;
    try frame.stack.push(recipient_addr);
    
    // Execute SELFDESTRUCT - should fail in static context
    try std.testing.expectError(error.WriteProtection, frame.op_selfdestruct());
}

// ============================================================================
// DATABASE OPERATION ERROR TESTS - Missing test coverage 
// ============================================================================

test "Frame database operation error conditions" {
    const allocator = std.testing.allocator;
    
    // Test with database operations when no database is available
    const F = Frame(.{ .has_database = false });
    const bytecode = [_]u8{ 0x54, 0x55, 0x5C, 0x5D, 0x00 }; // SLOAD SSTORE TLOAD TSTORE STOP
    var frame = try F.init(allocator, &bytecode, 1000000, {}, null);
    defer frame.deinit(allocator);
    
    // Test SLOAD without database - should fail
    try frame.stack.push(0x1234); // slot
    try std.testing.expectError(error.InvalidOpcode, frame.sload());
    
    // Test SSTORE without database - should fail
    try frame.stack.push(0x1234); // slot
    try frame.stack.push(0x5678); // value
    try std.testing.expectError(error.InvalidOpcode, frame.sstore());
    
    // Test TLOAD without database - should fail
    try frame.stack.push(0x1234); // slot
    try std.testing.expectError(error.InvalidOpcode, frame.tload());
    
    // Test TSTORE without database - should fail  
    try frame.stack.push(0x1234); // slot
    try frame.stack.push(0x5678); // value
    try std.testing.expectError(error.InvalidOpcode, frame.tstore());
}

// ============================================================================
// GAS OVERFLOW SCENARIO TESTS - Missing test coverage
// ============================================================================

test "Frame gas overflow scenarios" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});
    
    const bytecode = [_]u8{ 0x3C, 0x00 }; // MCOPY STOP
    var frame = try F.init(allocator, &bytecode, 100, {}, null);
    defer frame.deinit(allocator);
    
    // Test MCOPY with very large length that would cause gas overflow
    try frame.stack.push(0); // dest
    try frame.stack.push(0); // src  
    try frame.stack.push(std.math.maxInt(u256)); // length - extremely large
    
    // Should fail due to gas overflow or out of bounds
    const result = frame.mcopy();
    try std.testing.expect(result == error.OutOfBounds or result == error.OutOfGas);
}

test "Frame gas remaining edge cases" {
    const allocator = std.testing.allocator;
    const F = Frame(.{});
    
    const bytecode = [_]u8{ 0x5A, 0x00 }; // GAS STOP  
    var frame = try F.init(allocator, &bytecode, 0, {}, null); // Zero gas
    defer frame.deinit(allocator);
    
    // Test GAS opcode with zero gas remaining
    try frame.gas();
    const gas_value = try frame.stack.pop();
    try std.testing.expectEqual(@as(u256, 0), gas_value);
    
    // Test checkGas with zero gas
    try std.testing.expectError(error.OutOfGas, frame.checkGas());
}