/// Tracks contracts created during transaction execution
/// Used for EIP-6780 SELFDESTRUCT behavior in Cancun+
const std = @import("std");
const primitives = @import("primitives");
const Address = primitives.Address.Address;

pub const CreatedContracts = struct {
    created: std.AutoHashMap(Address, void),
    allocator: std.mem.Allocator,

    pub inline fn init(allocator: std.mem.Allocator) CreatedContracts {
        return CreatedContracts{
            .created = std.AutoHashMap(Address, void).init(allocator),
            .allocator = allocator,
        };
    }

    pub inline fn deinit(self: *CreatedContracts) void {
        self.created.deinit();
    }

    pub inline fn mark_created(self: *CreatedContracts, address: Address) !void {
        try self.created.put(address, {});
    }

    pub inline fn was_created_in_tx(self: *const CreatedContracts, address: Address) bool {
        return self.created.contains(address);
    }
    
    pub inline fn count(self: *const CreatedContracts) u32 {
        return @intCast(self.created.count());
    }
    
    pub inline fn clear(self: *CreatedContracts) void {
        self.created.clearAndFree();
    }
    
    pub inline fn remove(self: *CreatedContracts, address: Address) bool {
        return self.created.remove(address);
    }
};

test "created contracts initialization" {
    const allocator = std.testing.allocator;
    var created = CreatedContracts.init(allocator);
    defer created.deinit();
    
    try std.testing.expectEqual(@as(u32, 0), created.count());
}

test "created contracts mark and check" {
    const allocator = std.testing.allocator;
    var created = CreatedContracts.init(allocator);
    defer created.deinit();
    
    const addr1: Address = [_]u8{1} ++ [_]u8{0} ** 19;
    const addr2: Address = [_]u8{2} ++ [_]u8{0} ** 19;
    const addr3: Address = [_]u8{3} ++ [_]u8{0} ** 19;
    
    // Initially no contracts
    try std.testing.expect(!created.was_created_in_tx(addr1));
    try std.testing.expect(!created.was_created_in_tx(addr2));
    try std.testing.expectEqual(@as(u32, 0), created.count());
    
    // Mark one contract as created
    try created.mark_created(addr1);
    try std.testing.expect(created.was_created_in_tx(addr1));
    try std.testing.expect(!created.was_created_in_tx(addr2));
    try std.testing.expectEqual(@as(u32, 1), created.count());
    
    // Mark another contract
    try created.mark_created(addr2);
    try std.testing.expect(created.was_created_in_tx(addr1));
    try std.testing.expect(created.was_created_in_tx(addr2));
    try std.testing.expect(!created.was_created_in_tx(addr3));
    try std.testing.expectEqual(@as(u32, 2), created.count());
}

test "created contracts duplicate marking" {
    const allocator = std.testing.allocator;
    var created = CreatedContracts.init(allocator);
    defer created.deinit();
    
    const addr: Address = [_]u8{0xaa} ++ [_]u8{0} ** 19;
    
    // Mark same contract multiple times
    try created.mark_created(addr);
    try std.testing.expectEqual(@as(u32, 1), created.count());
    
    try created.mark_created(addr); // Should not increase count
    try std.testing.expectEqual(@as(u32, 1), created.count());
    try std.testing.expect(created.was_created_in_tx(addr));
}

test "created contracts removal" {
    const allocator = std.testing.allocator;
    var created = CreatedContracts.init(allocator);
    defer created.deinit();
    
    const addr1: Address = [_]u8{1} ++ [_]u8{0} ** 19;
    const addr2: Address = [_]u8{2} ++ [_]u8{0} ** 19;
    
    // Add contracts
    try created.mark_created(addr1);
    try created.mark_created(addr2);
    try std.testing.expectEqual(@as(u32, 2), created.count());
    
    // Remove existing contract
    try std.testing.expect(created.remove(addr1));
    try std.testing.expect(!created.was_created_in_tx(addr1));
    try std.testing.expect(created.was_created_in_tx(addr2));
    try std.testing.expectEqual(@as(u32, 1), created.count());
    
    // Try to remove non-existing contract
    try std.testing.expect(!created.remove(addr1)); // Should return false
    try std.testing.expectEqual(@as(u32, 1), created.count());
    
    // Remove last contract
    try std.testing.expect(created.remove(addr2));
    try std.testing.expectEqual(@as(u32, 0), created.count());
}

test "created contracts clear" {
    const allocator = std.testing.allocator;
    var created = CreatedContracts.init(allocator);
    defer created.deinit();
    
    // Add multiple contracts
    for (1..11) |i| {
        const addr: Address = [_]u8{@intCast(i)} ++ [_]u8{0} ** 19;
        try created.mark_created(addr);
    }
    try std.testing.expectEqual(@as(u32, 10), created.count());
    
    // Clear all
    created.clear();
    try std.testing.expectEqual(@as(u32, 0), created.count());
    
    // Verify all were removed
    for (1..11) |i| {
        const addr: Address = [_]u8{@intCast(i)} ++ [_]u8{0} ** 19;
        try std.testing.expect(!created.was_created_in_tx(addr));
    }
}

test "created contracts zero address" {
    const allocator = std.testing.allocator;
    var created = CreatedContracts.init(allocator);
    defer created.deinit();
    
    // Test with zero address
    try created.mark_created(primitives.ZERO_ADDRESS);
    try std.testing.expect(created.was_created_in_tx(primitives.ZERO_ADDRESS));
    try std.testing.expectEqual(@as(u32, 1), created.count());
    
    try std.testing.expect(created.remove(primitives.ZERO_ADDRESS));
    try std.testing.expect(!created.was_created_in_tx(primitives.ZERO_ADDRESS));
    try std.testing.expectEqual(@as(u32, 0), created.count());
}

test "created contracts edge case addresses" {
    const allocator = std.testing.allocator;
    var created = CreatedContracts.init(allocator);
    defer created.deinit();
    
    // Maximum address (all 0xFF)
    const max_addr: Address = [_]u8{0xff} ** 20;
    try created.mark_created(max_addr);
    try std.testing.expect(created.was_created_in_tx(max_addr));
    
    // Minimum non-zero address
    const min_addr: Address = [_]u8{0} ** 19 ++ [_]u8{1};
    try created.mark_created(min_addr);
    try std.testing.expect(created.was_created_in_tx(min_addr));
    
    try std.testing.expectEqual(@as(u32, 2), created.count());
    
    // Verify specific addresses
    try std.testing.expect(created.was_created_in_tx(max_addr));
    try std.testing.expect(created.was_created_in_tx(min_addr));
    try std.testing.expect(!created.was_created_in_tx(primitives.ZERO_ADDRESS));
}

test "created contracts large number of addresses" {
    const allocator = std.testing.allocator;
    var created = CreatedContracts.init(allocator);
    defer created.deinit();
    
    // Add 1000 unique addresses
    const count = 1000;
    for (0..count) |i| {
        var addr: Address = [_]u8{0} ** 20;
        const i_bytes = std.mem.toBytes(@as(u160, i));
        // Copy the lower 20 bytes to address
        @memcpy(addr[0..20], i_bytes[0..20]);
        try created.mark_created(addr);
    }
    
    try std.testing.expectEqual(@as(u32, count), created.count());
    
    // Verify all addresses are tracked
    for (0..count) |i| {
        var addr: Address = [_]u8{0} ** 20;
        const i_bytes = std.mem.toBytes(@as(u160, i));
        @memcpy(addr[0..20], i_bytes[0..20]);
        try std.testing.expect(created.was_created_in_tx(addr));
    }
    
    // Verify an address not added is not found
    var not_added: Address = [_]u8{0} ** 20;
    const count_bytes = std.mem.toBytes(@as(u160, count));
    @memcpy(not_added[0..20], count_bytes[0..20]);
    try std.testing.expect(!created.was_created_in_tx(not_added));
}
