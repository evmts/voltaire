// Demonstrate merging multiple bloom filters for range queries
const std = @import("std");
const primitives = @import("primitives");
const BloomFilter = primitives.bloom_filter.BloomFilter;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("Merging Bloom Filters\n\n", .{});

    // Create filters for simulated "blocks"
    var block1_filter = try BloomFilter.init(allocator, 2048, 3);
    defer block1_filter.deinit(allocator);
    block1_filter.add("address1");
    block1_filter.add("Transfer");
    block1_filter.add("topic1");

    var block2_filter = try BloomFilter.init(allocator, 2048, 3);
    defer block2_filter.deinit(allocator);
    block2_filter.add("address2");
    block2_filter.add("Approval");
    block2_filter.add("topic2");

    var block3_filter = try BloomFilter.init(allocator, 2048, 3);
    defer block3_filter.deinit(allocator);
    block3_filter.add("address3");
    block3_filter.add("Swap");
    block3_filter.add("topic3");

    std.debug.print("Created 3 block filters with different items\n", .{});
    std.debug.print("  Block 1: address1, Transfer, topic1\n", .{});
    std.debug.print("  Block 2: address2, Approval, topic2\n", .{});
    std.debug.print("  Block 3: address3, Swap, topic3\n", .{});

    // Create merged filter manually by OR-ing bits
    var merged = try BloomFilter.init(allocator, 2048, 3);
    defer merged.deinit(allocator);

    std.debug.print("\nMerging all blocks (bitwise OR):\n", .{});
    for (block1_filter.bits, 0..) |byte, i| {
        merged.bits[i] = byte | block2_filter.bits[i] | block3_filter.bits[i];
    }

    std.debug.print("Merged filter contains items from all blocks:\n", .{});
    std.debug.print("  Contains address1: {}\n", .{merged.contains("address1")});
    std.debug.print("  Contains address2: {}\n", .{merged.contains("address2")});
    std.debug.print("  Contains address3: {}\n", .{merged.contains("address3")});
    std.debug.print("  Contains Transfer: {}\n", .{merged.contains("Transfer")});
    std.debug.print("  Contains Approval: {}\n", .{merged.contains("Approval")});
    std.debug.print("  Contains Swap: {}\n", .{merged.contains("Swap")});

    // Check for non-member (quick rejection)
    std.debug.print("\nQuick rejection of non-members:\n", .{});
    const non_member = "Burn";
    if (!merged.contains(non_member)) {
        std.debug.print("  \"Burn\" definitely not in any block - skip detailed scan\n", .{});
    } else {
        std.debug.print("  \"Burn\" might be in range - need to check individual blocks\n", .{});
    }

    // Demonstrate use case: block range query
    std.debug.print("\nUse case - Block range query:\n", .{});
    std.debug.print("Given: blocks 1000-1002, want to find Transfer events\n", .{});
    const transfer = "Transfer";

    // Quick check with merged filter
    if (merged.contains(transfer)) {
        std.debug.print("1. Merged filter says Transfer might exist in range\n", .{});
        std.debug.print("2. Check individual blocks:\n", .{});

        if (block1_filter.contains(transfer)) std.debug.print("   - Block 1000 might contain Transfer\n", .{});
        if (block2_filter.contains(transfer)) std.debug.print("   - Block 1001 might contain Transfer\n", .{});
        if (block3_filter.contains(transfer)) std.debug.print("   - Block 1002 might contain Transfer\n", .{});

        std.debug.print("3. Fetch logs only from candidate blocks\n", .{});
    } else {
        std.debug.print("Transfer definitely not in range - skip all blocks\n", .{});
    }
}
