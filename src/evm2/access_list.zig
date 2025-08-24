const std = @import("std");
const primitives = @import("primitives");
const Address = primitives.Address.Address;

/// Simplified Access List for EIP-2929 gas cost tracking
/// This provides basic warm/cold access tracking for addresses and storage slots
/// to ensure proper gas accounting for EVM2 operations.
///
/// Gas costs:
/// - Cold address access: 2600 gas
/// - Warm address access: 100 gas  
/// - Cold storage slot access: 2100 gas
/// - Warm storage slot access: 100 gas
pub const AccessList = struct {
    allocator: std.mem.Allocator,
    /// Warm addresses - addresses that have been accessed
    addresses: std.AutoHashMap(Address, void),
    /// Warm storage slots - storage slots that have been accessed  
    storage_slots: std.HashMap(StorageKey, void, StorageKeyContext, 80),

    // Gas costs defined by EIP-2929
    pub const COLD_ACCOUNT_ACCESS_COST: u64 = 2600;
    pub const WARM_ACCOUNT_ACCESS_COST: u64 = 100;
    pub const COLD_SLOAD_COST: u64 = 2100;
    pub const WARM_SLOAD_COST: u64 = 100;

    const StorageKey = struct {
        address: Address,
        slot: u256,
    };

    const StorageKeyContext = struct {
        pub fn hash(self: @This(), key: StorageKey) u64 {
            _ = self;
            var hasher = std.hash.Wyhash.init(0);
            hasher.update(&key.address);
            hasher.update(std.mem.asBytes(&key.slot));
            return hasher.final();
        }

        pub fn eql(self: @This(), a: StorageKey, b: StorageKey) bool {
            _ = self;
            return std.mem.eql(u8, &a.address, &b.address) and a.slot == b.slot;
        }
    };

    pub fn init(allocator: std.mem.Allocator) AccessList {
        return AccessList{
            .allocator = allocator,
            .addresses = std.AutoHashMap(Address, void).init(allocator),
            .storage_slots = std.HashMap(StorageKey, void, StorageKeyContext, 80).init(allocator),
        };
    }

    pub fn deinit(self: *AccessList) void {
        self.addresses.deinit();
        self.storage_slots.deinit();
    }

    /// Clear all access lists for a new transaction
    pub fn clear(self: *AccessList) void {
        self.addresses.clearRetainingCapacity();
        self.storage_slots.clearRetainingCapacity();
    }

    /// Mark an address as accessed and return the gas cost
    /// Returns COLD_ACCOUNT_ACCESS_COST if first access, WARM_ACCOUNT_ACCESS_COST if already accessed
    pub fn access_address(self: *AccessList, address: Address) !u64 {
        const result = try self.addresses.getOrPut(address);
        if (result.found_existing) {
            return WARM_ACCOUNT_ACCESS_COST;
        }
        return COLD_ACCOUNT_ACCESS_COST;
    }

    /// Mark a storage slot as accessed and return the gas cost
    /// Returns COLD_SLOAD_COST if first access, WARM_SLOAD_COST if already accessed
    pub fn access_storage_slot(self: *AccessList, address: Address, slot: u256) !u64 {
        const key = StorageKey{ .address = address, .slot = slot };
        const result = try self.storage_slots.getOrPut(key);
        if (result.found_existing) {
            return WARM_SLOAD_COST;
        }
        return COLD_SLOAD_COST;
    }

    /// Check if an address is warm (has been accessed)
    pub fn is_address_warm(self: *AccessList, address: Address) bool {
        return self.addresses.contains(address);
    }

    /// Check if a storage slot is warm (has been accessed)
    pub fn is_storage_slot_warm(self: *AccessList, address: Address, slot: u256) bool {
        const key = StorageKey{ .address = address, .slot = slot };
        return self.storage_slots.contains(key);
    }

    /// Pre-warm addresses for transaction initialization
    /// This is used to warm the tx.origin, coinbase, and transaction target
    pub fn pre_warm_addresses(self: *AccessList, addresses: []const Address) !void {
        for (addresses) |address| {
            _ = try self.addresses.getOrPut(address);
        }
    }
};

// =============================================================================
// Tests
// =============================================================================

const testing = std.testing;

test "AccessList - address access tracking" {
    var access_list = AccessList.init(testing.allocator);
    defer access_list.deinit();

    const test_address = [_]u8{1} ** 20;

    // First access should be cold
    const cost1 = try access_list.access_address(test_address);
    try testing.expectEqual(AccessList.COLD_ACCOUNT_ACCESS_COST, cost1);

    // Second access should be warm
    const cost2 = try access_list.access_address(test_address);
    try testing.expectEqual(AccessList.WARM_ACCOUNT_ACCESS_COST, cost2);

    // Check warmth
    try testing.expect(access_list.is_address_warm(test_address));

    const cold_address = [_]u8{2} ** 20;
    try testing.expect(!access_list.is_address_warm(cold_address));
}

test "AccessList - storage slot access tracking" {
    var access_list = AccessList.init(testing.allocator);
    defer access_list.deinit();

    const test_address = [_]u8{1} ** 20;
    const slot1: u256 = 42;
    const slot2: u256 = 100;

    // First access to slot1 should be cold
    const cost1 = try access_list.access_storage_slot(test_address, slot1);
    try testing.expectEqual(AccessList.COLD_SLOAD_COST, cost1);

    // Second access to slot1 should be warm
    const cost2 = try access_list.access_storage_slot(test_address, slot1);
    try testing.expectEqual(AccessList.WARM_SLOAD_COST, cost2);

    // First access to slot2 should be cold
    const cost3 = try access_list.access_storage_slot(test_address, slot2);
    try testing.expectEqual(AccessList.COLD_SLOAD_COST, cost3);

    // Check warmth
    try testing.expect(access_list.is_storage_slot_warm(test_address, slot1));
    try testing.expect(access_list.is_storage_slot_warm(test_address, slot2));
    try testing.expect(!access_list.is_storage_slot_warm(test_address, 999));
}

test "AccessList - pre-warming addresses" {
    var access_list = AccessList.init(testing.allocator);
    defer access_list.deinit();

    const addresses = [_]Address{
        primitives.Address.ZERO_ADDRESS,
        [_]u8{1} ** 20,
        [_]u8{2} ** 20,
    };

    try access_list.pre_warm_addresses(&addresses);

    // All should be warm
    for (addresses) |address| {
        try testing.expect(access_list.is_address_warm(address));
        try testing.expectEqual(AccessList.WARM_ACCOUNT_ACCESS_COST, try access_list.access_address(address));
    }
}

test "AccessList - clear functionality" {
    var access_list = AccessList.init(testing.allocator);
    defer access_list.deinit();

    const test_address = [_]u8{1} ** 20;
    const slot: u256 = 42;

    // Access address and storage slot
    _ = try access_list.access_address(test_address);
    _ = try access_list.access_storage_slot(test_address, slot);

    try testing.expect(access_list.is_address_warm(test_address));
    try testing.expect(access_list.is_storage_slot_warm(test_address, slot));

    // Clear access list
    access_list.clear();

    try testing.expect(!access_list.is_address_warm(test_address));
    try testing.expect(!access_list.is_storage_slot_warm(test_address, slot));
}