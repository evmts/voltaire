// Demonstrate efficient batch operations with bloom filters
const std = @import("std");
const primitives = @import("primitives");
const BloomFilter = primitives.bloom_filter.BloomFilter;

fn batchAdd(filter: *BloomFilter, items: []const []const u8) void {
    for (items) |item| {
        filter.add(item);
    }
}

fn batchContains(filter: *const BloomFilter, items: []const []const u8, results: []bool) void {
    for (items, 0..) |item, i| {
        results[i] = filter.contains(item);
    }
}

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("Bloom Filter Batch Operations\n\n", .{});

    // Example 1: Building event index
    std.debug.print("Example 1: Building event index for block\n\n", .{});

    var filter = try BloomFilter.init(allocator, 2048, 3);
    defer filter.deinit(allocator);

    const events = [_][]const u8{
        "Transfer(address,address,uint256)",
        "Approval(address,address,uint256)",
        "Swap(address,uint256,uint256,uint256,uint256,address)",
        "Mint(address,uint256,uint256)",
        "Burn(address,uint256,uint256,address)",
    };

    std.debug.print("Adding {d} event signatures...\n", .{events.len});
    batchAdd(&filter, &events);

    std.debug.print("\nChecking which events might be present:\n", .{});
    const queries = [_][]const u8{
        "Transfer(address,address,uint256)",
        "Approval(address,address,uint256)",
        "Sync(uint112,uint112)", // Not added
        "Mint(address,uint256,uint256)",
    };

    var results: [queries.len]bool = undefined;
    batchContains(&filter, &queries, &results);

    for (queries, 0..) |query, i| {
        const status = if (results[i]) "✓ might exist" else "✗ definitely not present";
        std.debug.print("  {s}: {s}\n", .{ query, status });
    }

    // Example 2: Multi-address watchlist
    std.debug.print("\nExample 2: Multi-address watchlist\n\n", .{});

    var watchlist_filter = try BloomFilter.init(allocator, 2048, 3);
    defer watchlist_filter.deinit(allocator);

    const addresses = [_][]const u8{
        "address1",  "address2",  "address3",  "address4",  "address5",
        "address6",  "address7",  "address8",  "address9",  "address10",
    };

    std.debug.print("Adding {d} addresses to watchlist...\n", .{addresses.len});
    batchAdd(&watchlist_filter, &addresses);

    std.debug.print("\nChecking if addresses are watched:\n", .{});
    const test_addresses = [_][]const u8{ "address1", "address5", "address99", "address10" };
    var watch_results: [test_addresses.len]bool = undefined;
    batchContains(&watchlist_filter, &test_addresses, &watch_results);

    for (test_addresses, 0..) |addr, i| {
        const status = if (watch_results[i]) "watched ✓" else "not watched ✗";
        std.debug.print("  {s}: {s}\n", .{ addr, status });
    }

    // Example 3: Deduplication check
    std.debug.print("\nExample 3: Deduplication with bloom filter\n\n", .{});

    var seen_filter = try BloomFilter.init(allocator, 2048, 3);
    defer seen_filter.deinit(allocator);

    const items = [_][]const u8{ "tx1", "tx2", "tx1", "tx3", "tx2", "tx4", "tx1" };
    var unique_count: usize = 0;

    std.debug.print("Processing items with deduplication:\n", .{});
    for (items) |item| {
        if (!seen_filter.contains(item)) {
            std.debug.print("  {s}: first occurrence (or false positive)\n", .{item});
            seen_filter.add(item);
            unique_count += 1;
        } else {
            std.debug.print("  {s}: duplicate (skipped)\n", .{item});
        }
    }

    std.debug.print("\nUnique items found: {d}\n", .{unique_count});
    std.debug.print("Note: bloom filter may have false positives, verify duplicates if needed\n", .{});

    // Example 4: Measure filter density
    std.debug.print("\nExample 4: Filter density after batch operations\n\n", .{});

    var batch_filter = try BloomFilter.init(allocator, 2048, 3);
    defer batch_filter.deinit(allocator);

    // Add many items
    const num_items = 100;
    var buf: [32]u8 = undefined;
    var i: usize = 0;
    while (i < num_items) : (i += 1) {
        const item = try std.fmt.bufPrint(&buf, "item-{d}", .{i});
        batch_filter.add(item);
    }

    // Count set bits
    var set_bits: usize = 0;
    for (batch_filter.bits) |byte| {
        var b = byte;
        var bit: u3 = 0;
        while (bit < 8) : (bit += 1) {
            if (b & (@as(u8, 1) << bit) != 0) {
                set_bits += 1;
            }
        }
    }

    const total_bits = batch_filter.m;
    const density = @as(f64, @floatFromInt(set_bits)) / @as(f64, @floatFromInt(total_bits)) * 100.0;

    std.debug.print("Added {d} items\n", .{num_items});
    std.debug.print("Filter density: {d:.2}% ({d}/{d} bits set)\n", .{ density, set_bits, total_bits });
}
