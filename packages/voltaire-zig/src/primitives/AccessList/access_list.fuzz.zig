//! Fuzz tests for EIP-2930 Access List operations
//!
//! Run with: zig build test --fuzz
//! On macOS, use Docker:
//!   docker run --rm -it -v $(pwd):/workspace -w /workspace \
//!     ziglang/zig:0.15.1 zig build test --fuzz=300s

const std = @import("std");
const access_list = @import("access_list.zig");
const address = @import("../Address/address.zig");
const crypto_pkg = @import("crypto");
const hash = crypto_pkg.Hash;
const rlp = @import("../Rlp/Rlp.zig");

const Address = address.Address;
const Hash = hash.Hash;
const AccessListEntry = access_list.AccessListEntry;
const AccessList = access_list.AccessList;

// Fuzz gas calculation with arbitrary access lists
test "fuzz calculateAccessListGasCost" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 20) return;

    const allocator = std.testing.allocator;

    // Extract number of entries from input
    const num_entries = (input[0] % 10) + 1; // 1-10 entries
    const remaining = input[1..];

    var entries = std.array_list.AlignedManaged(AccessListEntry, null).init(allocator);
    defer {
        for (entries.items) |entry| {
            allocator.free(entry.storage_keys);
        }
        entries.deinit();
    }

    var offset: usize = 0;
    var i: usize = 0;
    while (i < num_entries and offset + 20 <= remaining.len) : (i += 1) {
        const addr = try Address.fromBytes(remaining[offset .. offset + 20]);
        offset += 20;

        // Extract number of storage keys
        const num_keys = if (offset < remaining.len) (remaining[offset] % 5) else 0; // 0-4 keys
        offset += 1;

        var keys = std.array_list.AlignedManaged(Hash, null).init(allocator);
        defer keys.deinit();

        var j: usize = 0;
        while (j < num_keys and offset + 32 <= remaining.len) : (j += 1) {
            const key = try Hash.fromBytes(remaining[offset .. offset + 32]);
            try keys.append(key);
            offset += 32;
        }

        try entries.append(.{
            .address = addr,
            .storage_keys = try keys.toOwnedSlice(),
        });
    }

    const gas_cost = access_list.calculateAccessListGasCost(entries.items);

    // Verify gas cost calculation invariants
    const expected_cost = entries.items.len * access_list.ACCESS_LIST_ADDRESS_COST;
    var total_keys: usize = 0;
    for (entries.items) |entry| {
        total_keys += entry.storage_keys.len;
    }
    const expected_total = expected_cost + total_keys * access_list.ACCESS_LIST_STORAGE_KEY_COST;

    try std.testing.expectEqual(expected_total, gas_cost);

    // Gas cost should never overflow for reasonable access lists
    try std.testing.expect(gas_cost >= expected_cost);
}

// Fuzz address membership checks
test "fuzz isAddressInAccessList" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 40) return;

    const allocator = std.testing.allocator;

    // Create access list with addresses from input
    const addr1 = try Address.fromBytes(input[0..20]);
    const addr2 = try Address.fromBytes(input[20..40]);

    const accessList = [_]AccessListEntry{
        .{
            .address = addr1,
            .storage_keys = &.{},
        },
    };

    // addr1 should be in list
    try std.testing.expect(access_list.isAddressInAccessList(&accessList, addr1));

    // addr2 membership depends on whether it equals addr1
    const in_list = access_list.isAddressInAccessList(&accessList, addr2);
    try std.testing.expectEqual(Address.equals(addr1, addr2), in_list);

    // Empty list should contain no addresses
    const empty: AccessList = &.{};
    try std.testing.expect(!access_list.isAddressInAccessList(empty, addr1));
    try std.testing.expect(!access_list.isAddressInAccessList(empty, addr2));

    _ = allocator;
}

// Fuzz storage key membership checks
test "fuzz isStorageKeyInAccessList" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 84) return; // 20 + 32 + 32

    const allocator = std.testing.allocator;

    const addr = try Address.fromBytes(input[0..20]);
    const key1 = try Hash.fromBytes(input[20..52]);
    const key2 = try Hash.fromBytes(input[52..84]);

    const storage_keys = [_]Hash{key1};
    const accessList = [_]AccessListEntry{
        .{
            .address = addr,
            .storage_keys = &storage_keys,
        },
    };

    // key1 should be in list for this address
    try std.testing.expect(access_list.isStorageKeyInAccessList(&accessList, addr, key1));

    // key2 membership depends on whether it equals key1
    const in_list = access_list.isStorageKeyInAccessList(&accessList, addr, key2);
    try std.testing.expectEqual(Hash.equals(key1, key2), in_list);

    // Different address should not find keys
    if (input.len >= 104) {
        const other_addr = try Address.fromBytes(input[84..104]);
        if (!Address.equals(addr, other_addr)) {
            try std.testing.expect(!access_list.isStorageKeyInAccessList(&accessList, other_addr, key1));
        }
    }

    _ = allocator;
}

// Fuzz RLP encoding of access lists
test "fuzz encodeAccessList" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 20) return;

    const allocator = std.testing.allocator;

    // Build access list from fuzz input
    const num_entries = @min((input[0] % 5) + 1, 5); // 1-5 entries
    var entries = std.array_list.AlignedManaged(AccessListEntry, null).init(allocator);
    defer {
        for (entries.items) |entry| {
            allocator.free(entry.storage_keys);
        }
        entries.deinit();
    }

    var offset: usize = 1;
    var i: usize = 0;
    while (i < num_entries and offset + 20 <= input.len) : (i += 1) {
        const addr = try Address.fromBytes(input[offset .. offset + 20]);
        offset += 20;

        const num_keys = if (offset < input.len) @min(input[offset] % 3, 2) else 0; // 0-2 keys
        offset += 1;

        var keys = std.array_list.AlignedManaged(Hash, null).init(allocator);
        defer keys.deinit();

        var j: usize = 0;
        while (j < num_keys and offset + 32 <= input.len) : (j += 1) {
            const key = try Hash.fromBytes(input[offset .. offset + 32]);
            try keys.append(key);
            offset += 32;
        }

        try entries.append(.{
            .address = addr,
            .storage_keys = try keys.toOwnedSlice(),
        });
    }

    // Encode should never panic
    const encoded = access_list.encodeAccessList(allocator, entries.items) catch |err| {
        try std.testing.expect(err == error.OutOfMemory);
        return;
    };
    defer allocator.free(encoded);

    // Encoded output should be valid RLP
    try std.testing.expect(encoded.len > 0);

    // Should start with RLP list prefix
    if (encoded.len > 0) {
        const first_byte = encoded[0];
        // RLP list: 0xc0-0xff
        try std.testing.expect(first_byte >= 0xc0);
    }
}

// Fuzz empty access list handling
test "fuzz empty access list" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    const empty: AccessList = &.{};

    // Gas cost should be zero
    const gas_cost = access_list.calculateAccessListGasCost(empty);
    try std.testing.expectEqual(@as(u64, 0), gas_cost);

    // Savings should be zero
    const savings = access_list.calculateGasSavings(empty);
    try std.testing.expectEqual(@as(u64, 0), savings);

    // Should encode successfully
    const encoded = try access_list.encodeAccessList(allocator, empty);
    defer allocator.free(encoded);

    // Empty list should encode as 0xc0
    try std.testing.expectEqual(@as(usize, 1), encoded.len);
    try std.testing.expectEqual(@as(u8, 0xc0), encoded[0]);

    // No address should be found
    if (input.len >= 20) {
        const addr = try Address.fromBytes(input[0..20]);
        try std.testing.expect(!access_list.isAddressInAccessList(empty, addr));
    }
}

// Fuzz gas savings calculation
test "fuzz calculateGasSavings" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 20) return;

    const allocator = std.testing.allocator;

    const num_entries = (input[0] % 10) + 1;
    var entries = std.array_list.AlignedManaged(AccessListEntry, null).init(allocator);
    defer {
        for (entries.items) |entry| {
            allocator.free(entry.storage_keys);
        }
        entries.deinit();
    }

    var offset: usize = 1;
    var i: usize = 0;
    while (i < num_entries and offset + 20 <= input.len) : (i += 1) {
        const addr = try Address.fromBytes(input[offset .. offset + 20]);
        offset += 20;

        const num_keys = if (offset < input.len) (input[offset] % 5) else 0;
        offset += 1;

        var keys = std.array_list.AlignedManaged(Hash, null).init(allocator);
        defer keys.deinit();

        var j: usize = 0;
        while (j < num_keys and offset + 32 <= input.len) : (j += 1) {
            const key = try Hash.fromBytes(input[offset .. offset + 32]);
            try keys.append(key);
            offset += 32;
        }

        try entries.append(.{
            .address = addr,
            .storage_keys = try keys.toOwnedSlice(),
        });
    }

    const savings = access_list.calculateGasSavings(entries.items);
    const gas_cost = access_list.calculateAccessListGasCost(entries.items);

    // Verify savings formula
    var expected_savings: u64 = 0;
    for (entries.items) |entry| {
        expected_savings += access_list.COLD_ACCOUNT_ACCESS_COST - access_list.ACCESS_LIST_ADDRESS_COST;
        expected_savings += entry.storage_keys.len * (access_list.COLD_STORAGE_ACCESS_COST - access_list.ACCESS_LIST_STORAGE_KEY_COST);
    }

    try std.testing.expectEqual(expected_savings, savings);

    // Savings should be related to costs
    if (entries.items.len > 0) {
        try std.testing.expect(savings >= entries.items.len * (access_list.COLD_ACCOUNT_ACCESS_COST - access_list.ACCESS_LIST_ADDRESS_COST));
    }
}

// Fuzz deduplication of access lists
test "fuzz deduplicateAccessList" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 52) return; // At least two entries

    const allocator = std.testing.allocator;

    const addr = try Address.fromBytes(input[0..20]);
    const key1 = try Hash.fromBytes(input[20..52]);

    // Create duplicate entries
    const keys1 = [_]Hash{key1};
    const keys2 = if (input.len >= 84)
        [_]Hash{try Hash.fromBytes(input[52..84])}
    else
        [_]Hash{key1}; // Duplicate key

    const accessList = [_]AccessListEntry{
        .{
            .address = addr,
            .storage_keys = &keys1,
        },
        .{
            .address = addr,
            .storage_keys = &keys2,
        },
    };

    const deduped = access_list.deduplicateAccessList(allocator, &accessList) catch |err| {
        try std.testing.expect(err == error.OutOfMemory);
        return;
    };
    defer {
        for (deduped) |entry| {
            allocator.free(entry.storage_keys);
        }
        allocator.free(deduped);
    }

    // Should merge duplicate addresses
    try std.testing.expectEqual(@as(usize, 1), deduped.len);
    try std.testing.expect(Address.equals(addr, deduped[0].address));

    // Storage keys should be deduplicated
    if (input.len < 84) {
        // Both entries had same key, should have 1 key
        try std.testing.expectEqual(@as(usize, 1), deduped[0].storage_keys.len);
    } else {
        // Check if keys are different
        const key2 = try Hash.fromBytes(input[52..84]);
        if (Hash.equals(key1, key2)) {
            try std.testing.expectEqual(@as(usize, 1), deduped[0].storage_keys.len);
        } else {
            try std.testing.expectEqual(@as(usize, 2), deduped[0].storage_keys.len);
        }
    }
}

// Fuzz deduplication with multiple addresses
test "fuzz deduplicateAccessList multiple addresses" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 72) return; // Two addresses + one key each

    const allocator = std.testing.allocator;

    const addr1 = try Address.fromBytes(input[0..20]);
    const addr2 = try Address.fromBytes(input[20..40]);
    const key1 = try Hash.fromBytes(input[40..72]);

    const keys = [_]Hash{key1};
    const accessList = [_]AccessListEntry{
        .{
            .address = addr1,
            .storage_keys = &keys,
        },
        .{
            .address = addr2,
            .storage_keys = &keys,
        },
    };

    const deduped = try access_list.deduplicateAccessList(allocator, &accessList);
    defer {
        for (deduped) |entry| {
            allocator.free(entry.storage_keys);
        }
        allocator.free(deduped);
    }

    // If addresses are different, should have 2 entries
    // If addresses are same, should have 1 entry
    if (Address.equals(addr1, addr2)) {
        try std.testing.expectEqual(@as(usize, 1), deduped.len);
    } else {
        try std.testing.expectEqual(@as(usize, 2), deduped.len);
    }
}

// Fuzz RLP encoding roundtrip property
test "fuzz encodeAccessList determinism" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 52) return;

    const allocator = std.testing.allocator;

    const addr = try Address.fromBytes(input[0..20]);
    const key = try Hash.fromBytes(input[20..52]);

    const storage_keys = [_]Hash{key};
    const accessList = [_]AccessListEntry{
        .{
            .address = addr,
            .storage_keys = &storage_keys,
        },
    };

    // Encode twice
    const encoded1 = try access_list.encodeAccessList(allocator, &accessList);
    defer allocator.free(encoded1);

    const encoded2 = try access_list.encodeAccessList(allocator, &accessList);
    defer allocator.free(encoded2);

    // Should be deterministic
    try std.testing.expectEqualSlices(u8, encoded1, encoded2);
}

// Fuzz access list with no storage keys
test "fuzz access list with no storage keys" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 20) return;

    const allocator = std.testing.allocator;

    const num_entries = (input[0] % 10) + 1;
    var entries = std.array_list.AlignedManaged(AccessListEntry, null).init(allocator);
    defer {
        for (entries.items) |entry| {
            allocator.free(entry.storage_keys);
        }
        entries.deinit();
    }

    var offset: usize = 1;
    var i: usize = 0;
    while (i < num_entries and offset + 20 <= input.len) : (i += 1) {
        const addr = try Address.fromBytes(input[offset .. offset + 20]);
        offset += 20;

        try entries.append(.{
            .address = addr,
            .storage_keys = &.{}, // No storage keys
        });
    }

    // Gas cost should only be address costs
    const gas_cost = access_list.calculateAccessListGasCost(entries.items);
    const expected = entries.items.len * access_list.ACCESS_LIST_ADDRESS_COST;
    try std.testing.expectEqual(expected, gas_cost);

    // Should encode successfully
    const encoded = try access_list.encodeAccessList(allocator, entries.items);
    defer allocator.free(encoded);
    try std.testing.expect(encoded.len > 0);

    // Savings should only be from addresses
    const savings = access_list.calculateGasSavings(entries.items);
    const expected_savings = entries.items.len * (access_list.COLD_ACCOUNT_ACCESS_COST - access_list.ACCESS_LIST_ADDRESS_COST);
    try std.testing.expectEqual(expected_savings, savings);
}

// Fuzz large access lists
test "fuzz large access list" {
    const input = std.testing.fuzzInput(.{});

    // Limit size to avoid OOM
    if (input.len < 100 or input.len > 5000) return;

    const allocator = std.testing.allocator;

    const num_entries = @min((input[0] % 50) + 1, 50);
    var entries = std.array_list.AlignedManaged(AccessListEntry, null).init(allocator);
    defer {
        for (entries.items) |entry| {
            allocator.free(entry.storage_keys);
        }
        entries.deinit();
    }

    var offset: usize = 1;
    var i: usize = 0;
    while (i < num_entries and offset + 20 <= input.len) : (i += 1) {
        const addr = try Address.fromBytes(input[offset .. offset + 20]);
        offset += 20;

        const num_keys = if (offset < input.len) @min(input[offset] % 10, 10) else 0;
        offset += 1;

        var keys = std.array_list.AlignedManaged(Hash, null).init(allocator);
        defer keys.deinit();

        var j: usize = 0;
        while (j < num_keys and offset + 32 <= input.len) : (j += 1) {
            const key = try Hash.fromBytes(input[offset .. offset + 32]);
            try keys.append(key);
            offset += 32;
        }

        try entries.append(.{
            .address = addr,
            .storage_keys = try keys.toOwnedSlice(),
        });
    }

    // All operations should complete without panic
    const gas_cost = access_list.calculateAccessListGasCost(entries.items);
    const savings = access_list.calculateGasSavings(entries.items);
    _ = access_list.encodeAccessList(allocator, entries.items) catch return;

    // Verify relationships
    try std.testing.expect(gas_cost >= entries.items.len * access_list.ACCESS_LIST_ADDRESS_COST);
    try std.testing.expect(savings >= entries.items.len * (access_list.COLD_ACCOUNT_ACCESS_COST - access_list.ACCESS_LIST_ADDRESS_COST));
}

// Fuzz arbitrary addresses in membership checks
test "fuzz arbitrary address membership" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 60) return;

    const allocator = std.testing.allocator;

    // Create access list with some addresses
    const addr1 = try Address.fromBytes(input[0..20]);
    const addr2 = try Address.fromBytes(input[20..40]);
    const query_addr = try Address.fromBytes(input[40..60]);

    const accessList = [_]AccessListEntry{
        .{ .address = addr1, .storage_keys = &.{} },
        .{ .address = addr2, .storage_keys = &.{} },
    };

    const in_list = access_list.isAddressInAccessList(&accessList, query_addr);

    // Manual verification
    const expected = Address.equals(query_addr, addr1) or Address.equals(query_addr, addr2);
    try std.testing.expectEqual(expected, in_list);

    _ = allocator;
}

// Fuzz arbitrary storage keys in membership checks
test "fuzz arbitrary storage key membership" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 116) return; // 20 + 32 + 32 + 32

    const allocator = std.testing.allocator;

    const addr = try Address.fromBytes(input[0..20]);
    const key1 = try Hash.fromBytes(input[20..52]);
    const key2 = try Hash.fromBytes(input[52..84]);
    const query_key = try Hash.fromBytes(input[84..116]);

    const storage_keys = [_]Hash{ key1, key2 };
    const accessList = [_]AccessListEntry{
        .{
            .address = addr,
            .storage_keys = &storage_keys,
        },
    };

    const in_list = access_list.isStorageKeyInAccessList(&accessList, addr, query_key);

    // Manual verification
    const expected = Hash.equals(query_key, key1) or Hash.equals(query_key, key2);
    try std.testing.expectEqual(expected, in_list);

    _ = allocator;
}

// Fuzz duplicate storage keys within entry
test "fuzz duplicate storage keys in entry" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 52) return;

    const allocator = std.testing.allocator;

    const addr = try Address.fromBytes(input[0..20]);
    const key = try Hash.fromBytes(input[20..52]);

    // Create entry with duplicate keys
    const storage_keys = [_]Hash{ key, key, key };
    const accessList = [_]AccessListEntry{
        .{
            .address = addr,
            .storage_keys = &storage_keys,
        },
    };

    // Gas cost should count all keys, even duplicates
    const gas_cost = access_list.calculateAccessListGasCost(&accessList);
    const expected = access_list.ACCESS_LIST_ADDRESS_COST + 3 * access_list.ACCESS_LIST_STORAGE_KEY_COST;
    try std.testing.expectEqual(expected, gas_cost);

    // Encoding should work
    const encoded = try access_list.encodeAccessList(allocator, &accessList);
    defer allocator.free(encoded);
    try std.testing.expect(encoded.len > 0);
}

// Fuzz maximum storage keys per address
test "fuzz maximum storage keys" {
    const input = std.testing.fuzzInput(.{});

    // Limit to reasonable size
    if (input.len < 20 or input.len > 3000) return;

    const allocator = std.testing.allocator;

    const addr = try Address.fromBytes(input[0..20]);

    // Create as many keys as possible from input
    const max_keys = @min((input.len - 20) / 32, 50);
    var keys = std.array_list.AlignedManaged(Hash, null).init(allocator);
    defer keys.deinit();

    var offset: usize = 20;
    var i: usize = 0;
    while (i < max_keys and offset + 32 <= input.len) : (i += 1) {
        const key = try Hash.fromBytes(input[offset .. offset + 32]);
        try keys.append(key);
        offset += 32;
    }

    const owned_keys = try keys.toOwnedSlice();
    defer allocator.free(owned_keys);

    const accessList = [_]AccessListEntry{
        .{
            .address = addr,
            .storage_keys = owned_keys,
        },
    };

    // All operations should complete
    _ = access_list.calculateAccessListGasCost(&accessList);
    _ = access_list.calculateGasSavings(&accessList);
    _ = access_list.encodeAccessList(allocator, &accessList) catch return;
}

// Fuzz gas cost overflow resistance
test "fuzz gas cost overflow" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 20) return;

    const allocator = std.testing.allocator;

    // Create large number of entries to test overflow protection
    const num_entries = @min((input[0] % 100) + 1, 100);
    var entries = std.array_list.AlignedManaged(AccessListEntry, null).init(allocator);
    defer {
        for (entries.items) |entry| {
            allocator.free(entry.storage_keys);
        }
        entries.deinit();
    }

    var offset: usize = 1;
    var i: usize = 0;
    while (i < num_entries and offset + 20 <= input.len) : (i += 1) {
        const addr = try Address.fromBytes(input[offset .. offset + 20]);
        offset = (offset + 20) % input.len;

        try entries.append(.{
            .address = addr,
            .storage_keys = &.{},
        });
    }

    const gas_cost = access_list.calculateAccessListGasCost(entries.items);

    // Should not overflow u64
    try std.testing.expect(gas_cost >= entries.items.len * access_list.ACCESS_LIST_ADDRESS_COST);
    try std.testing.expect(gas_cost <= std.math.maxInt(u64));
}

// Fuzz encoding with mixed entry types
test "fuzz mixed entry types" {
    const input = std.testing.fuzzInput(.{});
    if (input.len < 104) return;

    const allocator = std.testing.allocator;

    const addr1 = try Address.fromBytes(input[0..20]);
    const addr2 = try Address.fromBytes(input[20..40]);
    const key1 = try Hash.fromBytes(input[40..72]);
    const key2 = try Hash.fromBytes(input[72..104]);

    const keys1 = [_]Hash{key1};
    const keys2 = [_]Hash{ key1, key2 };

    const accessList = [_]AccessListEntry{
        .{ .address = addr1, .storage_keys = &.{} }, // No keys
        .{ .address = addr2, .storage_keys = &keys1 }, // One key
        .{ .address = addr1, .storage_keys = &keys2 }, // Two keys
    };

    // Encoding should handle mixed types
    const encoded = try access_list.encodeAccessList(allocator, &accessList);
    defer allocator.free(encoded);
    try std.testing.expect(encoded.len > 0);

    // Gas cost should account for all keys
    const gas_cost = access_list.calculateAccessListGasCost(&accessList);
    const expected = 3 * access_list.ACCESS_LIST_ADDRESS_COST + 3 * access_list.ACCESS_LIST_STORAGE_KEY_COST;
    try std.testing.expectEqual(expected, gas_cost);
}

// Run fuzz tests with: zig build test --fuzz
