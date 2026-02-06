// Demonstrate bloom filter persistence pattern
const std = @import("std");
const primitives = @import("primitives");
const BloomFilter = primitives.bloom_filter.BloomFilter;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("Bloom Filter Serialization Pattern\n\n", .{});

    // Create and populate a filter
    var original = try BloomFilter.init(allocator, 2048, 3);
    defer original.deinit(allocator);

    const items = [_][]const u8{ "Transfer", "Approval", "Swap", "Mint", "Burn" };
    std.debug.print("Creating filter with items: ", .{});
    for (items, 0..) |item, i| {
        std.debug.print("{s}{s}", .{ item, if (i < items.len - 1) ", " else "\n" });
        original.add(item);
    }

    // Show metadata
    std.debug.print("\nFilter metadata:\n", .{});
    std.debug.print("  Bits (m): {d}\n", .{original.m});
    std.debug.print("  Hash functions (k): {d}\n", .{original.k});
    std.debug.print("  Byte length: {d}\n", .{original.bits.len});

    // In Zig, we can save the raw bytes directly
    // Demonstrate saving to a buffer (simulating file I/O)
    std.debug.print("\nSaving filter to buffer...\n", .{});

    // Allocate buffer for serialization (metadata + bits)
    const metadata_size = @sizeOf(usize) * 2; // m and k
    const total_size = metadata_size + original.bits.len;
    const buffer = try allocator.alloc(u8, total_size);
    defer allocator.free(buffer);

    // Write metadata
    std.mem.writeInt(usize, buffer[0..@sizeOf(usize)], original.m, .little);
    std.mem.writeInt(usize, buffer[@sizeOf(usize) .. 2 * @sizeOf(usize)], original.k, .little);

    // Write bits
    @memcpy(buffer[metadata_size..], original.bits);

    std.debug.print("  Serialized {d} bytes ({d} metadata + {d} bits)\n", .{ total_size, metadata_size, original.bits.len });

    // Restore from buffer
    std.debug.print("\nRestoring filter from buffer...\n", .{});

    // Read metadata
    const saved_m = std.mem.readInt(usize, buffer[0..@sizeOf(usize)], .little);
    const saved_k = std.mem.readInt(usize, buffer[@sizeOf(usize) .. 2 * @sizeOf(usize)], .little);

    // Create new filter
    var restored = try BloomFilter.init(allocator, saved_m, saved_k);
    defer restored.deinit(allocator);

    // Copy bits
    @memcpy(restored.bits, buffer[metadata_size..]);

    // Verify restoration
    std.debug.print("\nVerifying restored filter:\n", .{});
    for (items) |item| {
        const contains = restored.contains(item);
        std.debug.print("  Contains \"{s}\": {s}\n", .{ item, if (contains) "✓" else "✗" });
    }

    std.debug.print("\nRestored metadata:\n", .{});
    std.debug.print("  Bits (m): {d}\n", .{restored.m});
    std.debug.print("  Hash functions (k): {d}\n", .{restored.k});
    std.debug.print("  Byte length: {d}\n", .{restored.bits.len});

    // Verify byte-level equality
    std.debug.print("\nByte-level comparison:\n", .{});
    const bytes_equal = std.mem.eql(u8, original.bits, restored.bits);
    std.debug.print("  All bytes match: {s}\n", .{if (bytes_equal) "✓" else "✗"});

    // Example: Multiple filters (simulating block storage)
    std.debug.print("\nExample: Storing multiple block filters\n", .{});

    const num_blocks = 3;
    var block_filters = std.ArrayList(BloomFilter).init(allocator);
    defer {
        for (block_filters.items) |*f| {
            f.deinit(allocator);
        }
        block_filters.deinit();
    }

    var block_num: usize = 1000;
    while (block_num < 1000 + num_blocks) : (block_num += 1) {
        var block_filter = try BloomFilter.init(allocator, 2048, 3);

        // Simulate adding block-specific data
        var buf: [32]u8 = undefined;
        const block_id = try std.fmt.bufPrint(&buf, "block-{d}", .{block_num});
        block_filter.add(block_id);

        try block_filters.append(block_filter);
    }

    std.debug.print("Created {d} block filters\n", .{block_filters.items.len});

    // Query a specific block
    std.debug.print("\nQuerying block 1001:\n", .{});
    const target_filter = &block_filters.items[1]; // block 1001

    var query_buf: [32]u8 = undefined;
    const query = try std.fmt.bufPrint(&query_buf, "block-{d}", .{1001});
    const found = target_filter.contains(query);
    std.debug.print("  Contains \"block-1001\": {s}\n", .{if (found) "✓" else "✗"});

    std.debug.print("\nSerialization demonstrates:\n", .{});
    std.debug.print("  - Metadata preservation (m, k)\n", .{});
    std.debug.print("  - Exact bit-level restoration\n", .{});
    std.debug.print("  - Efficient storage ({d} bytes per filter)\n", .{total_size});
}
