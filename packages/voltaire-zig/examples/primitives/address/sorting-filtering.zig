const std = @import("std");
const primitives = @import("primitives");
const Address = primitives.address.Address;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const a = gpa.allocator();

    std.debug.print("\n=== Address Sorting and Filtering ===\n\n", .{});

    // 1. Sorting addresses
    std.debug.print("1. Sorting Addresses\n\n", .{});

    var unsorted = [_]Address{
        try Address.fromHex("0xffffffffffffffffffffffffffffffffffffffff"),
        try Address.fromHex("0x0000000000000000000000000000000000000001"),
        try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e"),
        try Address.fromHex("0x0000000000000000000000000000000000000000"),
        try Address.fromHex("0xa0Cf798816D4b9b9866b5330EEa46a18382f251e"),
    };

    std.debug.print("Unsorted:\n", .{});
    for (unsorted) |addr| {
        const hex = Address.toChecksummed(addr);
        std.debug.print("  {s}\n", .{&hex});
    }
    std.debug.print("\n", .{});

    // Sort ascending
    std.mem.sort(Address, &unsorted, {}, struct {
        fn lessThan(_: void, lhs: Address, rhs: Address) bool {
            return Address.compare(lhs, rhs) < 0;
        }
    }.lessThan);

    std.debug.print("Sorted (ascending):\n", .{});
    for (unsorted) |addr| {
        const hex = Address.toChecksummed(addr);
        std.debug.print("  {s}\n", .{&hex});
    }
    std.debug.print("\n", .{});

    // 2. Filtering zero addresses
    std.debug.print("2. Filtering Zero Addresses\n\n", .{});

    const addresses = [_]Address{
        Address.zero(),
        try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e"),
        Address.fromU256(0),
        try Address.fromHex("0xa0Cf798816D4b9b9866b5330EEa46a18382f251e"),
        try Address.fromHex("0x0000000000000000000000000000000000000000"),
    };

    std.debug.print("All addresses:\n", .{});
    for (addresses) |addr| {
        const hex = Address.toChecksummed(addr);
        const is_zero = if (Address.isZero(addr)) " (zero)" else "";
        std.debug.print("  {s}{s}\n", .{ &hex, is_zero });
    }
    std.debug.print("\n", .{});

    var non_zero_list = std.ArrayList(Address).init(a);
    defer non_zero_list.deinit();

    for (addresses) |addr| {
        if (!Address.isZero(addr)) {
            try non_zero_list.append(addr);
        }
    }

    std.debug.print("Non-zero addresses ({}):\n", .{non_zero_list.items.len});
    for (non_zero_list.items) |addr| {
        const hex = Address.toChecksummed(addr);
        std.debug.print("  {s}\n", .{&hex});
    }
    std.debug.print("\n", .{});

    // 3. Range filtering
    std.debug.print("3. Range Filtering\n\n", .{});

    const all_addresses = [_]Address{
        Address.fromU256(10),
        Address.fromU256(50),
        Address.fromU256(100),
        Address.fromU256(200),
        Address.fromU256(500),
    };

    const min = Address.fromU256(50);
    const max = Address.fromU256(200);

    const min_hex = Address.toHex(min);
    const max_hex = Address.toHex(max);
    std.debug.print("Range: {s} to {s}\n\n", .{ &min_hex, &max_hex });

    var in_range = std.ArrayList(Address).init(a);
    defer in_range.deinit();

    for (all_addresses) |addr| {
        if (!Address.lessThan(addr, min) and !Address.greaterThan(addr, max)) {
            try in_range.append(addr);
        }
    }

    std.debug.print("Addresses in range:\n", .{});
    for (in_range.items) |addr| {
        const hex = Address.toHex(addr);
        std.debug.print("  {s}\n", .{&hex});
    }
    std.debug.print("\n", .{});

    // 4. Deduplication
    std.debug.print("4. Deduplication\n\n", .{});

    const with_duplicates = [_]Address{
        try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e"),
        try Address.fromHex("0xa0Cf798816D4b9b9866b5330EEa46a18382f251e"),
        try Address.fromHex("0x742d35cc6634c0532925a3b844bc9e7595f51e3e"), // Duplicate (different case)
        try Address.fromHex("0xa0Cf798816D4b9b9866b5330EEa46a18382f251e"), // Duplicate (exact)
        try Address.fromHex("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"),
    };

    std.debug.print("Original ({} addresses):\n", .{with_duplicates.len});
    for (with_duplicates) |addr| {
        const hex = Address.toChecksummed(addr);
        std.debug.print("  {s}\n", .{&hex});
    }
    std.debug.print("\n", .{});

    var unique = std.ArrayList(Address).init(a);
    defer unique.deinit();

    for (with_duplicates) |addr| {
        var found = false;
        for (unique.items) |existing| {
            if (Address.equals(addr, existing)) {
                found = true;
                break;
            }
        }
        if (!found) {
            try unique.append(addr);
        }
    }

    std.debug.print("Deduplicated ({} addresses):\n", .{unique.items.len});
    for (unique.items) |addr| {
        const hex = Address.toChecksummed(addr);
        std.debug.print("  {s}\n", .{&hex});
    }
    std.debug.print("\n", .{});

    // 5. Finding specific addresses
    std.debug.print("5. Finding Specific Addresses\n\n", .{});

    const address_list = [_]Address{
        try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e"),
        try Address.fromHex("0xa0Cf798816D4b9b9866b5330EEa46a18382f251e"),
        try Address.fromHex("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"),
    };

    const target = try Address.fromHex("0xa0Cf798816D4b9b9866b5330EEa46a18382f251e");

    // Find index
    var index: ?usize = null;
    for (address_list, 0..) |addr, i| {
        if (Address.equals(addr, target)) {
            index = i;
            break;
        }
    }

    const target_hex = Address.toChecksummed(target);
    std.debug.print("Target: {s}\n", .{&target_hex});
    if (index) |idx| {
        std.debug.print("Found at index: {}\n", .{idx});
    } else {
        std.debug.print("Not found\n", .{});
    }
    std.debug.print("\n", .{});

    // 6. Grouping by prefix
    std.debug.print("6. Grouping by Prefix\n\n", .{});

    const mixed_addresses = [_]Address{
        try Address.fromHex("0x0000000000000000000000000000000000000001"),
        try Address.fromHex("0x0000000000000000000000000000000000000002"),
        try Address.fromHex("0x1111111111111111111111111111111111111111"),
        try Address.fromHex("0x1111111111111111111111111111111111111112"),
        try Address.fromHex("0xffffffffffffffffffffffffffffffffffffffff"),
    };

    var groups = std.AutoHashMap(u8, std.ArrayList(Address)).init(a);
    defer {
        var it = groups.iterator();
        while (it.next()) |entry| {
            entry.value_ptr.deinit();
        }
        groups.deinit();
    }

    for (mixed_addresses) |addr| {
        const first_byte = addr[0];
        const result = try groups.getOrPut(first_byte);
        if (!result.found_existing) {
            result.value_ptr.* = std.ArrayList(Address).init(a);
        }
        try result.value_ptr.append(addr);
    }

    std.debug.print("Grouped by first byte:\n", .{});
    var it = groups.iterator();
    while (it.next()) |entry| {
        std.debug.print("  0x{x:0>2}: {} addresses\n", .{ entry.key_ptr.*, entry.value_ptr.items.len });
        for (entry.value_ptr.items) |addr| {
            const hex = Address.toChecksummed(addr);
            std.debug.print("    {s}\n", .{&hex});
        }
    }
    std.debug.print("\n", .{});

    // 7. Top N addresses
    std.debug.print("7. Top N Addresses (Largest Values)\n\n", .{});

    var many_addresses = [_]Address{
        Address.fromU256(100),
        Address.fromU256(500),
        Address.fromU256(50),
        Address.fromU256(1000),
        Address.fromU256(200),
        Address.fromU256(750),
    };

    // Sort descending
    std.mem.sort(Address, &many_addresses, {}, struct {
        fn lessThan(_: void, lhs: Address, rhs: Address) bool {
            return Address.compare(lhs, rhs) > 0; // Reversed for descending
        }
    }.lessThan);

    const top_n = 3;
    std.debug.print("Top {} addresses:\n", .{top_n});
    for (many_addresses[0..top_n], 0..) |addr, i| {
        const hex = Address.toHex(addr);
        const value = Address.toU256(addr);
        std.debug.print("  {}. {s} ({})\n", .{ i + 1, &hex, value });
    }
    std.debug.print("\n", .{});

    // 8. Performance note
    std.debug.print("8. Performance Note\n\n", .{});
    std.debug.print("For optimal performance when working with collections:\n", .{});
    std.debug.print("- Use HashMap with hex string as key for lookups\n", .{});
    std.debug.print("- Use Address.compare() for sorting\n", .{});
    std.debug.print("- Use Address.equals() for exact matching\n", .{});
    std.debug.print("- Addresses are [20]u8 - lightweight and stack-allocated\n", .{});
}
