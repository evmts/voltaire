const std = @import("std");
const testing = std.testing;
const Address = @import("address/address.zig");
const Hash = @import("hash_utils.zig");
const Rlp = @import("Rlp");

// EIP-2930 Access List
pub const AccessListEntry = struct {
    address: Address.Address,
    storage_keys: []const Hash.Hash,
};

pub const AccessList = []const AccessListEntry;

// Access list gas costs
pub const ACCESS_LIST_ADDRESS_COST = 2400;
pub const ACCESS_LIST_STORAGE_KEY_COST = 1900;
pub const COLD_ACCOUNT_ACCESS_COST = 2600;
pub const COLD_STORAGE_ACCESS_COST = 2100;
pub const WARM_STORAGE_ACCESS_COST = 100;

// Calculate total gas cost for access list
pub fn calculate_access_list_gas_cost(access_list: AccessList) u64 {
    var total_cost: u64 = 0;
    
    for (access_list) |entry| {
        // Cost per address
        total_cost += ACCESS_LIST_ADDRESS_COST;
        
        // Cost per storage key
        total_cost += ACCESS_LIST_STORAGE_KEY_COST * entry.storage_keys.len;
    }
    
    return total_cost;
}

// Check if address is in access list
pub fn is_address_in_access_list(access_list: AccessList, address: Address.Address) bool {
    for (access_list) |entry| {
        if (Address.equal(entry.address, address)) {
            return true;
        }
    }
    return false;
}

// Check if storage key is in access list
pub fn is_storage_key_in_access_list(
    access_list: AccessList,
    address: Address.Address,
    storage_key: Hash.Hash,
) bool {
    for (access_list) |entry| {
        if (Address.equal(entry.address, address)) {
            for (entry.storage_keys) |key| {
                if (Hash.equal(key, storage_key)) {
                    return true;
                }
            }
        }
    }
    return false;
}

// RLP encode access list
pub fn encode_access_list(allocator: std.mem.Allocator, access_list: AccessList) ![]u8 {
    var list = std.ArrayList(u8).init(allocator);
    defer list.deinit();
    
    // Encode each entry
    for (access_list) |entry| {
        var entry_list = std.ArrayList(u8).init(allocator);
        defer entry_list.deinit();
        
        // Encode address
        try Rlp.encode_bytes(allocator, &entry.address, &entry_list);
        
        // Encode storage keys as list
        var keys_list = std.ArrayList(u8).init(allocator);
        defer keys_list.deinit();
        
        for (entry.storage_keys) |key| {
            try Rlp.encode_bytes(allocator, &key, &keys_list);
        }
        
        // Wrap keys in RLP list
        if (keys_list.items.len <= 55) {
            try entry_list.append(@as(u8, @intCast(0xc0 + keys_list.items.len)));
        } else {
            const len_bytes = Rlp.encode_length(keys_list.items.len);
            try entry_list.append(@as(u8, @intCast(0xf7 + len_bytes.len)));
            try entry_list.appendSlice(len_bytes);
        }
        try entry_list.appendSlice(keys_list.items);
        
        // Add entry to main list
        if (entry_list.items.len <= 55) {
            try list.append(@as(u8, @intCast(0xc0 + entry_list.items.len)));
        } else {
            const len_bytes = Rlp.encode_length(entry_list.items.len);
            try list.append(@as(u8, @intCast(0xf7 + len_bytes.len)));
            try list.appendSlice(len_bytes);
        }
        try list.appendSlice(entry_list.items);
    }
    
    // Wrap entire access list
    var result = std.ArrayList(u8).init(allocator);
    if (list.items.len <= 55) {
        try result.append(@as(u8, @intCast(0xc0 + list.items.len)));
    } else {
        const len_bytes = Rlp.encode_length(list.items.len);
        try result.append(@as(u8, @intCast(0xf7 + len_bytes.len)));
        try result.appendSlice(len_bytes);
    }
    try result.appendSlice(list.items);
    
    return result.toOwnedSlice();
}

// Test basic access list
test "access list gas calculation" {
    const allocator = testing.allocator;
    
    const storage_keys = [_]Hash.Hash{
        Hash.from_hex_comptime("0x0000000000000000000000000000000000000000000000000000000000000001"),
        Hash.from_hex_comptime("0x0000000000000000000000000000000000000000000000000000000000000002"),
    };
    
    const access_list = [_]AccessListEntry{
        .{
            .address = Address.from_hex_comptime("0x1111111111111111111111111111111111111111"),
            .storage_keys = &storage_keys,
        },
        .{
            .address = Address.from_hex_comptime("0x2222222222222222222222222222222222222222"),
            .storage_keys = &.{},
        },
    };
    
    const gas_cost = calculate_access_list_gas_cost(&access_list);
    
    // Expected: 2 addresses * 2400 + 2 storage keys * 1900 = 8600
    try testing.expectEqual(@as(u64, 8600), gas_cost);
}

test "access list membership checks" {
    const storage_keys = [_]Hash.Hash{
        Hash.from_hex_comptime("0x0000000000000000000000000000000000000000000000000000000000000001"),
        Hash.from_hex_comptime("0x0000000000000000000000000000000000000000000000000000000000000002"),
    };
    
    const access_list = [_]AccessListEntry{
        .{
            .address = Address.from_hex_comptime("0x1111111111111111111111111111111111111111"),
            .storage_keys = &storage_keys,
        },
    };
    
    // Test address membership
    const addr1 = Address.from_hex_comptime("0x1111111111111111111111111111111111111111");
    const addr2 = Address.from_hex_comptime("0x2222222222222222222222222222222222222222");
    
    try testing.expect(is_address_in_access_list(&access_list, addr1));
    try testing.expect(!is_address_in_access_list(&access_list, addr2));
    
    // Test storage key membership
    const key1 = Hash.from_hex_comptime("0x0000000000000000000000000000000000000000000000000000000000000001");
    const key3 = Hash.from_hex_comptime("0x0000000000000000000000000000000000000000000000000000000000000003");
    
    try testing.expect(is_storage_key_in_access_list(&access_list, addr1, key1));
    try testing.expect(!is_storage_key_in_access_list(&access_list, addr1, key3));
    try testing.expect(!is_storage_key_in_access_list(&access_list, addr2, key1));
}

test "empty access list" {
    const access_list: AccessList = &.{};
    
    const gas_cost = calculate_access_list_gas_cost(access_list);
    try testing.expectEqual(@as(u64, 0), gas_cost);
    
    const addr = Address.from_hex_comptime("0x1111111111111111111111111111111111111111");
    try testing.expect(!is_address_in_access_list(access_list, addr));
}

test "access list RLP encoding" {
    const allocator = testing.allocator;
    
    const storage_keys = [_]Hash.Hash{
        Hash.from_hex_comptime("0x0000000000000000000000000000000000000000000000000000000000000001"),
    };
    
    const access_list = [_]AccessListEntry{
        .{
            .address = Address.from_hex_comptime("0x1111111111111111111111111111111111111111"),
            .storage_keys = &storage_keys,
        },
    };
    
    const encoded = try encode_access_list(allocator, &access_list);
    defer allocator.free(encoded);
    
    // Should produce valid RLP
    try testing.expect(encoded.len > 0);
    try testing.expect(encoded[0] >= 0xc0); // RLP list prefix
}

// Test gas savings calculation
pub fn calculate_gas_savings(access_list: AccessList) u64 {
    var savings: u64 = 0;
    
    for (access_list) |entry| {
        // Save on cold account access
        savings += COLD_ACCOUNT_ACCESS_COST - ACCESS_LIST_ADDRESS_COST;
        
        // Save on cold storage access
        for (entry.storage_keys) |_| {
            savings += COLD_STORAGE_ACCESS_COST - ACCESS_LIST_STORAGE_KEY_COST;
        }
    }
    
    return savings;
}

test "access list gas savings" {
    const storage_keys = [_]Hash.Hash{
        Hash.from_hex_comptime("0x0000000000000000000000000000000000000000000000000000000000000001"),
        Hash.from_hex_comptime("0x0000000000000000000000000000000000000000000000000000000000000002"),
    };
    
    const access_list = [_]AccessListEntry{
        .{
            .address = Address.from_hex_comptime("0x1111111111111111111111111111111111111111"),
            .storage_keys = &storage_keys,
        },
    };
    
    const savings = calculate_gas_savings(&access_list);
    
    // Expected savings:
    // Account: 2600 - 2400 = 200
    // Storage keys: 2 * (2100 - 1900) = 400
    // Total: 600
    try testing.expectEqual(@as(u64, 600), savings);
}

// Test complex access list scenarios
test "complex access list" {
    const allocator = testing.allocator;
    
    // Multiple addresses with varying storage keys
    const keys1 = [_]Hash.Hash{
        Hash.from_hex_comptime("0x0000000000000000000000000000000000000000000000000000000000000001"),
        Hash.from_hex_comptime("0x0000000000000000000000000000000000000000000000000000000000000002"),
        Hash.from_hex_comptime("0x0000000000000000000000000000000000000000000000000000000000000003"),
    };
    
    const keys2 = [_]Hash.Hash{
        Hash.from_hex_comptime("0x0000000000000000000000000000000000000000000000000000000000000004"),
    };
    
    const access_list = [_]AccessListEntry{
        .{
            .address = Address.from_hex_comptime("0x1111111111111111111111111111111111111111"),
            .storage_keys = &keys1,
        },
        .{
            .address = Address.from_hex_comptime("0x2222222222222222222222222222222222222222"),
            .storage_keys = &keys2,
        },
        .{
            .address = Address.from_hex_comptime("0x3333333333333333333333333333333333333333"),
            .storage_keys = &.{}, // No storage keys
        },
    };
    
    const gas_cost = calculate_access_list_gas_cost(&access_list);
    
    // Expected:
    // 3 addresses * 2400 = 7200
    // 4 storage keys * 1900 = 7600
    // Total: 14800
    try testing.expectEqual(@as(u64, 14800), gas_cost);
    
    // Test encoding
    const encoded = try encode_access_list(allocator, &access_list);
    defer allocator.free(encoded);
    
    try testing.expect(encoded.len > 0);
}

// Deduplicate access list entries
pub fn deduplicate_access_list(
    allocator: std.mem.Allocator,
    access_list: AccessList,
) ![]AccessListEntry {
    var result = std.ArrayList(AccessListEntry).init(allocator);
    defer result.deinit();
    
    for (access_list) |entry| {
        // Check if address already exists
        var found = false;
        for (result.items) |*existing| {
            if (Address.equal(existing.address, entry.address)) {
                // Merge storage keys
                var keys = std.ArrayList(Hash.Hash).init(allocator);
                defer keys.deinit();
                
                // Add existing keys
                try keys.appendSlice(existing.storage_keys);
                
                // Add new keys if not duplicate
                for (entry.storage_keys) |new_key| {
                    var is_duplicate = false;
                    for (existing.storage_keys) |existing_key| {
                        if (Hash.equal(new_key, existing_key)) {
                            is_duplicate = true;
                            break;
                        }
                    }
                    if (!is_duplicate) {
                        try keys.append(new_key);
                    }
                }
                
                existing.storage_keys = try keys.toOwnedSlice();
                found = true;
                break;
            }
        }
        
        if (!found) {
            try result.append(.{
                .address = entry.address,
                .storage_keys = try allocator.dupe(Hash.Hash, entry.storage_keys),
            });
        }
    }
    
    return result.toOwnedSlice();
}

test "deduplicate access list" {
    const allocator = testing.allocator;
    
    const keys1 = [_]Hash.Hash{
        Hash.from_hex_comptime("0x0000000000000000000000000000000000000000000000000000000000000001"),
        Hash.from_hex_comptime("0x0000000000000000000000000000000000000000000000000000000000000002"),
    };
    
    const keys2 = [_]Hash.Hash{
        Hash.from_hex_comptime("0x0000000000000000000000000000000000000000000000000000000000000002"), // Duplicate
        Hash.from_hex_comptime("0x0000000000000000000000000000000000000000000000000000000000000003"),
    };
    
    const access_list = [_]AccessListEntry{
        .{
            .address = Address.from_hex_comptime("0x1111111111111111111111111111111111111111"),
            .storage_keys = &keys1,
        },
        .{
            .address = Address.from_hex_comptime("0x1111111111111111111111111111111111111111"), // Same address
            .storage_keys = &keys2,
        },
    };
    
    const deduped = try deduplicate_access_list(allocator, &access_list);
    defer {
        for (deduped) |entry| {
            allocator.free(entry.storage_keys);
        }
        allocator.free(deduped);
    }
    
    // Should have one entry with three unique keys
    try testing.expectEqual(@as(usize, 1), deduped.len);
    try testing.expectEqual(@as(usize, 3), deduped[0].storage_keys.len);
}