const std = @import("std");
const testing = std.testing;
const address = @import("address.zig");
const hash = @import("hash.zig");
const rlp = @import("rlp.zig");
const Address = address.Address;
const Hash = hash.Hash;
const Allocator = std.mem.Allocator;

// EIP-2930 Access List
pub const AccessListEntry = struct {
    address: Address,
    storageKeys: []const Hash,
};

pub const AccessList = []const AccessListEntry;

// Access list gas costs
pub const ACCESS_LIST_ADDRESS_COST = 2400;
pub const ACCESS_LIST_STORAGE_KEY_COST = 1900;
pub const COLD_ACCOUNT_ACCESS_COST = 2600;
pub const COLD_STORAGE_ACCESS_COST = 2100;
pub const WARM_STORAGE_ACCESS_COST = 100;

// Access list error types
pub const AccessListError = error{
    OutOfMemory,
};

// Calculate total gas cost for access list
pub fn calculateAccessListGasCost(accessList: AccessList) u64 {
    var totalCost: u64 = 0;
    
    for (accessList) |entry| {
        // Cost per address
        totalCost += ACCESS_LIST_ADDRESS_COST;
        
        // Cost per storage key
        totalCost += ACCESS_LIST_STORAGE_KEY_COST * entry.storageKeys.len;
    }
    
    return totalCost;
}

// Check if address is in access list
pub fn isAddressInAccessList(accessList: AccessList, addr: Address) bool {
    for (accessList) |entry| {
        if (entry.address.eql(addr)) {
            return true;
        }
    }
    return false;
}

// Check if storage key is in access list
pub fn isStorageKeyInAccessList(
    accessList: AccessList,
    addr: Address,
    storageKey: Hash,
) bool {
    for (accessList) |entry| {
        if (entry.address.eql(addr)) {
            for (entry.storageKeys) |key| {
                if (key.eql(storageKey)) {
                    return true;
                }
            }
        }
    }
    return false;
}

// RLP encode access list
pub fn encodeAccessList(allocator: Allocator, accessList: AccessList) ![]u8 {
    // First, encode each entry as a list of [address, [storageKeys...]]
    var entries = std.ArrayList([]const u8).init(allocator);
    defer {
        for (entries.items) |item| {
            allocator.free(item);
        }
        entries.deinit();
    }
    
    for (accessList) |entry| {
        // Encode the address
        const encodedAddress = try rlp.encodeBytes(allocator, &entry.address.bytes);
        defer allocator.free(encodedAddress);
        
        // Encode storage keys
        var encodedKeys = std.ArrayList([]const u8).init(allocator);
        defer {
            for (encodedKeys.items) |item| {
                allocator.free(item);
            }
            encodedKeys.deinit();
        }
        
        for (entry.storageKeys) |key| {
            const encodedKey = try rlp.encodeBytes(allocator, &key.bytes);
            try encodedKeys.append(encodedKey);
        }
        
        // Encode the list of storage keys
        const keysListEncoded = try rlp.encode(allocator, encodedKeys.items);
        defer allocator.free(keysListEncoded);
        
        // Create entry as [address, storageKeysList]
        var entryItems = [_][]const u8{ encodedAddress, keysListEncoded };
        const entryEncoded = try rlp.encode(allocator, &entryItems);
        try entries.append(entryEncoded);
    }
    
    // Encode the entire access list
    return try rlp.encode(allocator, entries.items);
}

// Calculate gas savings from access list
pub fn calculateGasSavings(accessList: AccessList) u64 {
    var savings: u64 = 0;
    
    for (accessList) |entry| {
        // Save on cold account access
        savings += COLD_ACCOUNT_ACCESS_COST - ACCESS_LIST_ADDRESS_COST;
        
        // Save on cold storage access
        for (entry.storageKeys) |_| {
            savings += COLD_STORAGE_ACCESS_COST - ACCESS_LIST_STORAGE_KEY_COST;
        }
    }
    
    return savings;
}

// Deduplicate access list entries
pub fn deduplicateAccessList(
    allocator: Allocator,
    accessList: AccessList,
) ![]AccessListEntry {
    var result = std.ArrayList(AccessListEntry).init(allocator);
    defer result.deinit();
    
    for (accessList) |entry| {
        // Check if address already exists
        var found = false;
        for (result.items) |*existing| {
            if (existing.address.eql(entry.address)) {
                // Merge storage keys
                var keys = std.ArrayList(Hash).init(allocator);
                defer keys.deinit();
                
                // Add existing keys
                try keys.appendSlice(existing.storageKeys);
                
                // Add new keys if not duplicate
                for (entry.storageKeys) |newKey| {
                    var isDuplicate = false;
                    for (existing.storageKeys) |existingKey| {
                        if (newKey.eql(existingKey)) {
                            isDuplicate = true;
                            break;
                        }
                    }
                    if (!isDuplicate) {
                        try keys.append(newKey);
                    }
                }
                
                existing.storageKeys = try keys.toOwnedSlice();
                found = true;
                break;
            }
        }
        
        if (!found) {
            try result.append(.{
                .address = entry.address,
                .storageKeys = try allocator.dupe(Hash, entry.storageKeys),
            });
        }
    }
    
    return result.toOwnedSlice();
}

// Tests

test "access list gas calculation" {
    _ = testing.allocator;
    
    const storageKeys = [_]Hash{
        try Hash.fromHex("0x0000000000000000000000000000000000000000000000000000000000000001"),
        try Hash.fromHex("0x0000000000000000000000000000000000000000000000000000000000000002"),
    };
    
    const accessList = [_]AccessListEntry{
        .{
            .address = try Address.fromHex("0x1111111111111111111111111111111111111111"),
            .storageKeys = &storageKeys,
        },
        .{
            .address = try Address.fromHex("0x2222222222222222222222222222222222222222"),
            .storageKeys = &.{},
        },
    };
    
    const gasCost = calculateAccessListGasCost(&accessList);
    
    // Expected: 2 addresses * 2400 + 2 storage keys * 1900 = 8600
    try testing.expectEqual(@as(u64, 8600), gasCost);
}

test "access list membership checks" {
    const storageKeys = [_]Hash{
        try Hash.fromHex("0x0000000000000000000000000000000000000000000000000000000000000001"),
        try Hash.fromHex("0x0000000000000000000000000000000000000000000000000000000000000002"),
    };
    
    const accessList = [_]AccessListEntry{
        .{
            .address = try Address.fromHex("0x1111111111111111111111111111111111111111"),
            .storageKeys = &storageKeys,
        },
    };
    
    // Test address membership
    const addr1 = try Address.fromHex("0x1111111111111111111111111111111111111111");
    const addr2 = try Address.fromHex("0x2222222222222222222222222222222222222222");
    
    try testing.expect(isAddressInAccessList(&accessList, addr1));
    try testing.expect(!isAddressInAccessList(&accessList, addr2));
    
    // Test storage key membership
    const key1 = try Hash.fromHex("0x0000000000000000000000000000000000000000000000000000000000000001");
    const key3 = try Hash.fromHex("0x0000000000000000000000000000000000000000000000000000000000000003");
    
    try testing.expect(isStorageKeyInAccessList(&accessList, addr1, key1));
    try testing.expect(!isStorageKeyInAccessList(&accessList, addr1, key3));
    try testing.expect(!isStorageKeyInAccessList(&accessList, addr2, key1));
}

test "empty access list" {
    const accessList: AccessList = &.{};
    
    const gasCost = calculateAccessListGasCost(accessList);
    try testing.expectEqual(@as(u64, 0), gasCost);
    
    const addr = try Address.fromHex("0x1111111111111111111111111111111111111111");
    try testing.expect(!isAddressInAccessList(accessList, addr));
}

test "access list RLP encoding" {
    const allocator = testing.allocator;
    
    const storageKeys = [_]Hash{
        try Hash.fromHex("0x0000000000000000000000000000000000000000000000000000000000000001"),
    };
    
    const accessList = [_]AccessListEntry{
        .{
            .address = try Address.fromHex("0x1111111111111111111111111111111111111111"),
            .storageKeys = &storageKeys,
        },
    };
    
    const encoded = try encodeAccessList(allocator, &accessList);
    defer allocator.free(encoded);
    
    // Should produce valid RLP
    try testing.expect(encoded.len > 0);
    try testing.expect(encoded[0] >= 0xc0); // RLP list prefix
}

test "access list gas savings" {
    const storageKeys = [_]Hash{
        try Hash.fromHex("0x0000000000000000000000000000000000000000000000000000000000000001"),
        try Hash.fromHex("0x0000000000000000000000000000000000000000000000000000000000000002"),
    };
    
    const accessList = [_]AccessListEntry{
        .{
            .address = try Address.fromHex("0x1111111111111111111111111111111111111111"),
            .storageKeys = &storageKeys,
        },
    };
    
    const savings = calculateGasSavings(&accessList);
    
    // Expected savings:
    // Account: 2600 - 2400 = 200
    // Storage keys: 2 * (2100 - 1900) = 400
    // Total: 600
    try testing.expectEqual(@as(u64, 600), savings);
}

test "complex access list" {
    const allocator = testing.allocator;
    
    // Multiple addresses with varying storage keys
    const keys1 = [_]Hash{
        try Hash.fromHex("0x0000000000000000000000000000000000000000000000000000000000000001"),
        try Hash.fromHex("0x0000000000000000000000000000000000000000000000000000000000000002"),
        try Hash.fromHex("0x0000000000000000000000000000000000000000000000000000000000000003"),
    };
    
    const keys2 = [_]Hash{
        try Hash.fromHex("0x0000000000000000000000000000000000000000000000000000000000000004"),
    };
    
    const accessList = [_]AccessListEntry{
        .{
            .address = try Address.fromHex("0x1111111111111111111111111111111111111111"),
            .storageKeys = &keys1,
        },
        .{
            .address = try Address.fromHex("0x2222222222222222222222222222222222222222"),
            .storageKeys = &keys2,
        },
        .{
            .address = try Address.fromHex("0x3333333333333333333333333333333333333333"),
            .storageKeys = &.{}, // No storage keys
        },
    };
    
    const gasCost = calculateAccessListGasCost(&accessList);
    
    // Expected:
    // 3 addresses * 2400 = 7200
    // 4 storage keys * 1900 = 7600
    // Total: 14800
    try testing.expectEqual(@as(u64, 14800), gasCost);
    
    // Test encoding
    const encoded = try encodeAccessList(allocator, &accessList);
    defer allocator.free(encoded);
    
    try testing.expect(encoded.len > 0);
}

test "deduplicate access list" {
    const allocator = testing.allocator;
    
    const keys1 = [_]Hash{
        try Hash.fromHex("0x0000000000000000000000000000000000000000000000000000000000000001"),
        try Hash.fromHex("0x0000000000000000000000000000000000000000000000000000000000000002"),
    };
    
    const keys2 = [_]Hash{
        try Hash.fromHex("0x0000000000000000000000000000000000000000000000000000000000000002"), // Duplicate
        try Hash.fromHex("0x0000000000000000000000000000000000000000000000000000000000000003"),
    };
    
    const accessList = [_]AccessListEntry{
        .{
            .address = try Address.fromHex("0x1111111111111111111111111111111111111111"),
            .storageKeys = &keys1,
        },
        .{
            .address = try Address.fromHex("0x1111111111111111111111111111111111111111"), // Same address
            .storageKeys = &keys2,
        },
    };
    
    const deduped = try deduplicateAccessList(allocator, &accessList);
    defer {
        for (deduped) |entry| {
            allocator.free(entry.storageKeys);
        }
        allocator.free(deduped);
    }
    
    // Should have one entry with three unique keys
    try testing.expectEqual(@as(usize, 1), deduped.len);
    try testing.expectEqual(@as(usize, 3), deduped[0].storageKeys.len);
}