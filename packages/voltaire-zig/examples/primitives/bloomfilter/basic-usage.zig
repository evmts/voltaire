// Basic BloomFilter usage: create, add items, check membership
const std = @import("std");
const primitives = @import("primitives");
const BloomFilter = primitives.bloom_filter.BloomFilter;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    // Create a standard Ethereum bloom filter (2048 bits, 3 hash functions)
    var filter = try BloomFilter.init(allocator, 2048, 3);
    defer filter.deinit(allocator);

    std.debug.print("Created bloom filter:\n", .{});
    std.debug.print("  Bits: {d}\n", .{filter.m});
    std.debug.print("  Hash functions: {d}\n", .{filter.k});
    std.debug.print("  Size: {d} bytes\n", .{filter.bits.len});

    // Add some items
    const item1 = "Transfer";
    const item2 = "Approval";
    const item3 = "Swap";

    std.debug.print("\nAdding items to filter...\n", .{});
    filter.add(item1);
    filter.add(item2);
    filter.add(item3);

    // Check membership
    std.debug.print("\nChecking membership:\n", .{});
    std.debug.print("  Contains \"Transfer\": {}\n", .{filter.contains(item1)}); // true
    std.debug.print("  Contains \"Approval\": {}\n", .{filter.contains(item2)}); // true
    std.debug.print("  Contains \"Swap\": {}\n", .{filter.contains(item3)}); // true

    // Check non-member
    const non_member = "Burn";
    std.debug.print("  Contains \"Burn\": {}\n", .{filter.contains(non_member)}); // false (or true if false positive)

    // Demonstrate idempotent add
    std.debug.print("\nAdding \"Transfer\" again...\n", .{});
    filter.add(item1);
    std.debug.print("  Still contains \"Transfer\": {}\n", .{filter.contains(item1)}); // true

    std.debug.print("\nBloom filter demonstrates:\n", .{});
    std.debug.print("  - No false negatives: if contains() returns false, item definitely not added\n", .{});
    std.debug.print("  - Possible false positives: if contains() returns true, item might be added\n", .{});
    std.debug.print("  - Fixed size: {d} bytes regardless of items added\n", .{filter.bits.len});
}
