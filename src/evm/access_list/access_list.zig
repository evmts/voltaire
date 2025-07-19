const std = @import("std");
const primitives = @import("primitives");
const AccessListStorageKey = @import("access_list_storage_key.zig");
const AccessListStorageKeyContext = @import("access_list_storage_key_context.zig");
const Context = @import("context.zig");

/// EIP-2929 & EIP-2930: Access list management for gas cost calculation
///
/// Tracks which addresses and storage slots have been accessed during transaction
/// execution. First access (cold) costs more gas than subsequent accesses (warm).
///
/// Gas costs:
/// - Cold address access: 2600 gas
/// - Warm address access: 100 gas
/// - Cold storage slot access: 2100 gas
/// - Warm storage slot access: 100 gas

// Error types for AccessList operations
pub const Error = std.mem.Allocator.Error;
pub const AccessAddressError = Error;
pub const AccessStorageSlotError = Error;
pub const PreWarmAddressesError = Error;
pub const PreWarmStorageSlotsError = Error;
pub const InitTransactionError = Error;
pub const GetCallCostError = Error;

pub const AccessList = @This();

// Gas costs defined by EIP-2929
pub const COLD_ACCOUNT_ACCESS_COST: u64 = 2600;
pub const WARM_ACCOUNT_ACCESS_COST: u64 = 100;
pub const COLD_SLOAD_COST: u64 = 2100;
pub const WARM_SLOAD_COST: u64 = 100;

// Additional costs for CALL operations
pub const COLD_CALL_EXTRA_COST: u64 = COLD_ACCOUNT_ACCESS_COST - WARM_ACCOUNT_ACCESS_COST;

allocator: std.mem.Allocator,
/// Warm addresses - addresses that have been accessed
addresses: std.AutoHashMap(primitives.Address.Address, void),
/// Warm storage slots - storage slots that have been accessed
storage_slots: std.HashMap(AccessListStorageKey, void, AccessListStorageKeyContext, 80),
/// Transaction and block context for pre-warming addresses
context: Context,

pub fn init(allocator: std.mem.Allocator, context: Context) AccessList {
    return .{
        .allocator = allocator,
        .addresses = std.AutoHashMap(primitives.Address.Address, void).init(allocator),
        .storage_slots = std.HashMap(AccessListStorageKey, void, AccessListStorageKeyContext, 80).init(allocator),
        .context = context,
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
pub fn access_address(self: *AccessList, address: primitives.Address.Address) std.mem.Allocator.Error!u64 {
    const result = try self.addresses.getOrPut(address);
    if (result.found_existing) {
        @branchHint(.likely);
        return WARM_ACCOUNT_ACCESS_COST;
    }
    return COLD_ACCOUNT_ACCESS_COST;
}

/// Mark a storage slot as accessed and return the gas cost
/// Returns COLD_SLOAD_COST if first access, WARM_SLOAD_COST if already accessed
pub fn access_storage_slot(self: *AccessList, address: primitives.Address.Address, slot: u256) std.mem.Allocator.Error!u64 {
    const key = AccessListStorageKey{ .address = address, .slot = slot };
    const result = try self.storage_slots.getOrPut(key);
    if (result.found_existing) {
        @branchHint(.likely);
        return WARM_SLOAD_COST;
    }
    return COLD_SLOAD_COST;
}

/// Check if an address is warm (has been accessed)
pub fn is_address_warm(self: *const AccessList, address: primitives.Address.Address) bool {
    return self.addresses.contains(address);
}

/// Check if a storage slot is warm (has been accessed)
pub fn is_storage_slot_warm(self: *const AccessList, address: primitives.Address.Address, slot: u256) bool {
    const key = AccessListStorageKey{ .address = address, .slot = slot };
    return self.storage_slots.contains(key);
}

/// Pre-warm addresses from EIP-2930 access list
pub fn pre_warm_addresses(self: *AccessList, addresses: []const primitives.Address.Address) std.mem.Allocator.Error!void {
    for (addresses) |address| {
        try self.addresses.put(address, {});
    }
}

/// Pre-warm storage slots from EIP-2930 access list
pub fn pre_warm_storage_slots(self: *AccessList, address: primitives.Address.Address, slots: []const u256) std.mem.Allocator.Error!void {
    for (slots) |slot| {
        const key = AccessListStorageKey{ .address = address, .slot = slot };
        try self.storage_slots.put(key, {});
    }
}

/// Initialize transaction access list with pre-warmed addresses
/// According to EIP-2929, tx.origin and block.coinbase are always pre-warmed
pub fn init_transaction(self: *AccessList, to: ?primitives.Address.Address) std.mem.Allocator.Error!void {
    // Clear previous transaction data
    self.clear();

    try self.addresses.put(self.context.tx_origin, {});
    try self.addresses.put(self.context.block_coinbase, {});

    if (to) |to_address| {
        try self.addresses.put(to_address, {});
    }
}

/// Get the extra gas cost for accessing an address (for CALL operations)
/// Returns 0 if warm, COLD_CALL_EXTRA_COST if cold
pub fn get_call_cost(self: *AccessList, address: primitives.Address.Address) std.mem.Allocator.Error!u64 {
    const result = try self.addresses.getOrPut(address);
    if (result.found_existing) {
        @branchHint(.likely);
        return 0;
    }
    return COLD_CALL_EXTRA_COST;
}

// Tests
const testing = std.testing;

test "AccessList basic operations" {
    const context = Context.init();
    var access_list = AccessList.init(testing.allocator, context);
    defer access_list.deinit();

    const test_address = [_]u8{1} ** 20;

    // First access should be cold
    const cost1 = try access_list.access_address(test_address);
    try testing.expectEqual(COLD_ACCOUNT_ACCESS_COST, cost1);

    // Second access should be warm
    const cost2 = try access_list.access_address(test_address);
    try testing.expectEqual(WARM_ACCOUNT_ACCESS_COST, cost2);

    // Check warmth
    try testing.expect(access_list.is_address_warm(test_address));

    const cold_address = [_]u8{2} ** 20;
    try testing.expect(!access_list.is_address_warm(cold_address));
}

test "AccessList storage slots" {
    const context = Context.init();
    var access_list = AccessList.init(testing.allocator, context);
    defer access_list.deinit();

    const test_address = [_]u8{1} ** 20;
    const slot1: u256 = 42;
    const slot2: u256 = 100;

    // First access to slot1 should be cold
    const cost1 = try access_list.access_storage_slot(test_address, slot1);
    try testing.expectEqual(COLD_SLOAD_COST, cost1);

    // Second access to slot1 should be warm
    const cost2 = try access_list.access_storage_slot(test_address, slot1);
    try testing.expectEqual(WARM_SLOAD_COST, cost2);

    // First access to slot2 should be cold
    const cost3 = try access_list.access_storage_slot(test_address, slot2);
    try testing.expectEqual(COLD_SLOAD_COST, cost3);

    // Check warmth
    try testing.expect(access_list.is_storage_slot_warm(test_address, slot1));
    try testing.expect(access_list.is_storage_slot_warm(test_address, slot2));
    try testing.expect(!access_list.is_storage_slot_warm(test_address, 999));
}

test "AccessList transaction initialization" {
    const tx_origin = [_]u8{1} ** 20;
    const coinbase = [_]u8{2} ** 20;
    const to_address = [_]u8{3} ** 20;

    const context = Context.init_with_values(
        tx_origin,
        0, // gas_price
        0, // block_number
        0, // block_timestamp
        coinbase,
        0, // block_difficulty
        0, // block_gas_limit
        1, // chain_id
        0, // block_base_fee
        &[_]u256{}, // blob_hashes
        0, // blob_base_fee
    );
    var access_list = AccessList.init(testing.allocator, context);
    defer access_list.deinit();

    try access_list.init_transaction(to_address);

    // All should be pre-warmed
    try testing.expect(access_list.is_address_warm(tx_origin));
    try testing.expect(access_list.is_address_warm(coinbase));
    try testing.expect(access_list.is_address_warm(to_address));

    // Accessing them should return warm cost
    try testing.expectEqual(WARM_ACCOUNT_ACCESS_COST, try access_list.access_address(tx_origin));
    try testing.expectEqual(WARM_ACCOUNT_ACCESS_COST, try access_list.access_address(coinbase));
    try testing.expectEqual(WARM_ACCOUNT_ACCESS_COST, try access_list.access_address(to_address));
}

test "AccessList pre-warming from EIP-2930" {
    const context = Context.init();
    var access_list = AccessList.init(testing.allocator, context);
    defer access_list.deinit();

    const addresses = [_]primitives.Address.Address{
        primitives.Address.ZERO_ADDRESS,
        [_]u8{1} ** 20,
        [_]u8{2} ** 20,
    };

    try access_list.pre_warm_addresses(&addresses);

    // All should be warm
    for (addresses) |address| {
        try testing.expect(access_list.is_address_warm(address));
        try testing.expectEqual(WARM_ACCOUNT_ACCESS_COST, try access_list.access_address(address));
    }

    // Test storage slot pre-warming
    const contract_address = [_]u8{4} ** 20;
    const slots = [_]u256{ 1, 2, 3, 100 };

    try access_list.pre_warm_storage_slots(contract_address, &slots);

    for (slots) |slot| {
        try testing.expect(access_list.is_storage_slot_warm(contract_address, slot));
        try testing.expectEqual(WARM_SLOAD_COST, try access_list.access_storage_slot(contract_address, slot));
    }
}

test "AccessList call costs" {
    const context = Context.init();
    var access_list = AccessList.init(testing.allocator, context);
    defer access_list.deinit();

    const cold_address = [_]u8{1} ** 20;
    const warm_address = [_]u8{2} ** 20;

    // Pre-warm one address
    try access_list.pre_warm_addresses(&[_]primitives.Address.Address{warm_address});

    // Cold address should have extra cost
    try testing.expectEqual(COLD_CALL_EXTRA_COST, try access_list.get_call_cost(cold_address));

    // Warm address should have no extra cost
    try testing.expectEqual(@as(u64, 0), try access_list.get_call_cost(warm_address));

    // After getting cost, cold address should now be warm
    try testing.expect(access_list.is_address_warm(cold_address));
}

test "access_list_benchmarks" {
    const Timer = std.time.Timer;
    var timer = try Timer.start();
    const testing_allocator = std.testing.allocator;
    
    const context = Context.init();
    var access_list = AccessList.init(testing_allocator, context);
    defer access_list.deinit();
    
    const iterations = 100000;
    
    // Benchmark 1: Address access performance under high load
    timer.reset();
    var i: usize = 0;
    while (i < iterations) : (i += 1) {
        const address = std.mem.toBytes(@as(u160, @intCast(i % 10000)));
        _ = try access_list.access_address(address);
    }
    const address_access_ns = timer.read();
    
    // Benchmark 2: Storage slot access performance
    access_list.clear();
    timer.reset();
    i = 0;
    while (i < iterations) : (i += 1) {
        const address = std.mem.toBytes(@as(u160, @intCast(i % 1000)));
        const slot: u256 = @intCast(i % 5000);
        _ = try access_list.access_storage_slot(address, slot);
    }
    const storage_access_ns = timer.read();
    
    // Benchmark 3: Large access list insertion performance
    access_list.clear();
    const large_addresses = try testing_allocator.alloc(primitives.Address.Address, 10000);
    defer testing_allocator.free(large_addresses);
    
    for (large_addresses, 0..) |*address, idx| {
        address.* = std.mem.toBytes(@as(u160, @intCast(idx)));
    }
    
    timer.reset();
    try access_list.pre_warm_addresses(large_addresses);
    const large_prewarm_ns = timer.read();
    
    // Benchmark 4: Hash collision handling efficiency
    access_list.clear();
    timer.reset();
    // Create addresses that might cause hash collisions
    i = 0;
    while (i < 1000) : (i += 1) {
        var collision_address: [20]u8 = undefined;
        // Create addresses with similar patterns
        collision_address[0] = @intCast(i % 256);
        collision_address[1] = @intCast((i >> 8) % 256);
        std.mem.set(u8, collision_address[2..], 0xAA);
        _ = try access_list.access_address(collision_address);
    }
    const collision_handling_ns = timer.read();
    
    // Benchmark 5: Memory usage scaling test
    access_list.clear();
    var scaling_lists = std.ArrayList(AccessList).init(testing_allocator);
    defer {
        for (scaling_lists.items) |*list| {
            list.deinit();
        }
        scaling_lists.deinit();
    }
    
    timer.reset();
    i = 0;
    while (i < 100) : (i += 1) {
        var list = AccessList.init(testing_allocator, context);
        
        // Fill each list with different sized data
        const fill_size = (i + 1) * 10;
        var j: usize = 0;
        while (j < fill_size) : (j += 1) {
            const address = std.mem.toBytes(@as(u160, @intCast(j)));
            _ = try list.access_address(address);
            _ = try list.access_storage_slot(address, @intCast(j));
        }
        
        try scaling_lists.append(list);
    }
    const scaling_ns = timer.read();
    
    // Benchmark 6: Random vs sequential access patterns
    access_list.clear();
    var rng = std.Random.DefaultPrng.init(12345);
    const random = rng.random();
    
    // Sequential access pattern
    timer.reset();
    i = 0;
    while (i < 10000) : (i += 1) {
        const address = std.mem.toBytes(@as(u160, @intCast(i)));
        _ = try access_list.access_address(address);
    }
    const sequential_ns = timer.read();
    
    access_list.clear();
    
    // Random access pattern
    timer.reset();
    i = 0;
    while (i < 10000) : (i += 1) {
        const random_val = random.int(u160);
        const address = std.mem.toBytes(random_val);
        _ = try access_list.access_address(address);
    }
    const random_access_ns = timer.read();
    
    // Print benchmark results for analysis
    std.log.debug("Access List Benchmarks:", .{});
    std.log.debug("  Address access ({} ops): {} ns", .{ iterations, address_access_ns });
    std.log.debug("  Storage access ({} ops): {} ns", .{ iterations, storage_access_ns });
    std.log.debug("  Large pre-warm (10k addresses): {} ns", .{large_prewarm_ns});
    std.log.debug("  Hash collision handling (1k ops): {} ns", .{collision_handling_ns});
    std.log.debug("  Memory scaling (100 lists): {} ns", .{scaling_ns});
    std.log.debug("  Sequential access (10k ops): {} ns", .{sequential_ns});
    std.log.debug("  Random access (10k ops): {} ns", .{random_access_ns});
    
    // Performance analysis hints
    if (sequential_ns < random_access_ns) {
        std.log.debug("✓ Sequential access shows expected performance benefit");
    }
    
    const avg_address_access_ns = address_access_ns / iterations;
    const avg_storage_access_ns = storage_access_ns / iterations;
    std.log.debug("  Average address access: {} ns/op", .{avg_address_access_ns});
    std.log.debug("  Average storage access: {} ns/op", .{avg_storage_access_ns});
}
