const std = @import("std");
const primitives = @import("primitives");

/// Tree-Shakeable API Example (Zig)
///
/// Demonstrates:
/// - Using Address module's functional API
/// - Selective imports via module system
/// - Data-first functional patterns
/// - Comparison with Zig's natural idioms

pub fn main() !void {
    const stdout = std.io.getStdOut().writer();
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    try stdout.writeAll("=== Tree-Shakeable Address API (Zig) ===\n\n");

    // 1. Functional API basics
    try stdout.writeAll("1. Functional API Basics\n\n");

    // Create addresses using functional constructors
    const addr1 = try primitives.Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");
    const addr2 = try primitives.Address.fromHex("0x0000000000000000000000000000000000000045");
    const addr3 = primitives.Address.fromNumber(42);

    var hex_buf1: [42]u8 = undefined;
    var hex_buf2: [42]u8 = undefined;
    var hex_buf3: [42]u8 = undefined;

    const hex1 = try primitives.Address.toHex(&addr1, &hex_buf1);
    const hex2 = try primitives.Address.toHex(&addr2, &hex_buf2);
    const hex3 = try primitives.Address.toHex(&addr3, &hex_buf3);

    try stdout.print("Address 1: {s}\n", .{hex1});
    try stdout.print("Address 2: {s}\n", .{hex2});
    try stdout.print("Address 3: {s}\n", .{hex3});
    try stdout.writeAll("\n");

    // 2. Data-first function style
    try stdout.writeAll("2. Data-First Function Style\n\n");

    // Functions take data as parameter
    try stdout.print("Is addr2 zero? {}\n", .{primitives.Address.isZero(&addr2)});
    try stdout.print("Are addr1 and addr2 equal? {}\n", .{primitives.Address.equals(&addr1, &addr2)});
    try stdout.print("Compare addr2 to addr3: {}\n", .{primitives.Address.compare(&addr2, &addr3)});
    try stdout.writeAll("\n");

    // 3. Build-time optimization
    try stdout.writeAll("3. Build-Time Optimization\n\n");

    try stdout.writeAll("✓ Functions used in this example:\n");
    try stdout.writeAll("  - fromHex, fromNumber (parsing)\n");
    try stdout.writeAll("  - toHex (conversion)\n");
    try stdout.writeAll("  - equals, compare, isZero (comparison)\n");
    try stdout.writeAll("\n");

    try stdout.writeAll("Build system benefits:\n");
    try stdout.writeAll("✓ Dead code elimination at compile time\n");
    try stdout.writeAll("✓ Only referenced code included\n");
    try stdout.writeAll("✓ No runtime overhead\n");
    try stdout.writeAll("✓ Monomorphization optimizes generics\n");
    try stdout.writeAll("\n");

    // 4. Comparison operators
    try stdout.writeAll("4. Comparison Operators\n\n");

    const addr_a = primitives.Address.fromNumber(100);
    const addr_b = primitives.Address.fromNumber(200);

    var hex_buf_a: [42]u8 = undefined;
    var hex_buf_b: [42]u8 = undefined;

    try stdout.print("Address A: {s}\n", .{try primitives.Address.toHex(&addr_a, &hex_buf_a)});
    try stdout.print("Address B: {s}\n", .{try primitives.Address.toHex(&addr_b, &hex_buf_b)});
    try stdout.writeAll("\n");

    const cmp = primitives.Address.compare(&addr_a, &addr_b);
    try stdout.print("equals(A, B): {}\n", .{primitives.Address.equals(&addr_a, &addr_b)});
    try stdout.print("compare(A, B): {} ({s})\n", .{ cmp, if (cmp == .less) "A < B" else "invalid" });
    try stdout.print("lessThan(A, B): {}\n", .{primitives.Address.lessThan(&addr_a, &addr_b)});
    try stdout.print("greaterThan(A, B): {}\n", .{primitives.Address.greaterThan(&addr_a, &addr_b)});
    try stdout.writeAll("\n");

    try stdout.print("equals(A, A): {}\n", .{primitives.Address.equals(&addr_a, &addr_a)});
    try stdout.print("compare(A, A): {} (equal)\n", .{primitives.Address.compare(&addr_a, &addr_a)});
    try stdout.writeAll("\n");

    // 5. Filtering with functional patterns
    try stdout.writeAll("5. Filtering with Functional Patterns\n\n");

    const addresses = [_]primitives.Address{
        primitives.Address.fromNumber(100),
        primitives.Address.fromNumber(50),
        primitives.Address.fromNumber(75),
        primitives.Address.fromNumber(0),
        primitives.Address.fromNumber(200),
    };

    // Filter non-zero addresses
    var non_zero = std.ArrayList(primitives.Address){};
    defer non_zero.deinit(allocator);

    for (addresses) |addr| {
        if (!primitives.Address.isZero(&addr)) {
            try non_zero.append(allocator, addr);
        }
    }

    try stdout.print("Non-zero addresses: {}/{}\n", .{ non_zero.items.len, addresses.len });

    // Find addresses less than threshold
    const threshold = primitives.Address.fromNumber(80);
    var below_threshold = std.ArrayList(primitives.Address){};
    defer below_threshold.deinit(allocator);

    for (addresses) |addr| {
        if (primitives.Address.lessThan(&addr, &threshold)) {
            try below_threshold.append(allocator, addr);
        }
    }

    try stdout.print("Below threshold (80): {}\n", .{below_threshold.items.len});
    for (below_threshold.items) |addr| {
        var hex_buf: [42]u8 = undefined;
        try stdout.print("  {s}\n", .{try primitives.Address.toHex(&addr, &hex_buf)});
    }
    try stdout.writeAll("\n");

    // Find addresses greater than threshold
    var above_threshold = std.ArrayList(primitives.Address){};
    defer above_threshold.deinit(allocator);

    for (addresses) |addr| {
        if (primitives.Address.greaterThan(&addr, &threshold)) {
            try above_threshold.append(allocator, addr);
        }
    }

    try stdout.print("Above threshold (80): {}\n", .{above_threshold.items.len});
    for (above_threshold.items) |addr| {
        var hex_buf: [42]u8 = undefined;
        try stdout.print("  {s}\n", .{try primitives.Address.toHex(&addr, &hex_buf)});
    }
    try stdout.writeAll("\n");

    // 6. Sorting with functional API
    try stdout.writeAll("6. Sorting with Functional API\n\n");

    var unsorted = [_]primitives.Address{
        primitives.Address.fromNumber(300),
        primitives.Address.fromNumber(100),
        primitives.Address.fromNumber(200),
        primitives.Address.fromNumber(50),
    };

    try stdout.writeAll("Before sorting:\n");
    for (unsorted) |addr| {
        var hex_buf: [42]u8 = undefined;
        try stdout.print("  {s}\n", .{try primitives.Address.toHex(&addr, &hex_buf)});
    }

    // Sort using standard library with Address.lessThan
    std.mem.sort(primitives.Address, &unsorted, {}, struct {
        fn lessThan(_: void, a: primitives.Address, b: primitives.Address) bool {
            return primitives.Address.lessThan(&a, &b);
        }
    }.lessThan);

    try stdout.writeAll("\nAfter sorting (ascending):\n");
    for (unsorted) |addr| {
        var hex_buf: [42]u8 = undefined;
        try stdout.print("  {s}\n", .{try primitives.Address.toHex(&addr, &hex_buf)});
    }
    try stdout.writeAll("\n");

    // 7. Chaining functional operations
    try stdout.writeAll("7. Chaining Functional Operations\n\n");

    const raw_addresses = [_][]const u8{
        "0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e",
        "0x0000000000000000000000000000000000000000",
        "0x0000000000000000000000000000000000000045",
    };

    try stdout.writeAll("Processing raw inputs:\n");
    var processed = std.ArrayList(primitives.Address){};
    defer processed.deinit(allocator);

    // Validate, convert, filter zeros
    for (raw_addresses) |str| {
        if (primitives.Address.isValid(str)) {
            const addr = primitives.Address.fromHex(str) catch continue;
            if (!primitives.Address.isZero(&addr)) {
                try processed.append(allocator, addr);
            }
        }
    }

    // Sort
    std.mem.sort(primitives.Address, processed.items, {}, struct {
        fn lessThan(_: void, a: primitives.Address, b: primitives.Address) bool {
            return primitives.Address.lessThan(&a, &b);
        }
    }.lessThan);

    try stdout.print("Valid: {} → {}\n", .{ raw_addresses.len, processed.items.len });
    for (processed.items) |addr| {
        var hex_buf: [42]u8 = undefined;
        try stdout.print("  {s}\n", .{try primitives.Address.toHex(&addr, &hex_buf)});
    }
    try stdout.writeAll("\n");

    // 8. Performance considerations
    try stdout.writeAll("8. Performance Considerations\n\n");

    try stdout.writeAll("Zig functional API benefits:\n");
    try stdout.writeAll("✓ Compile-time dead code elimination\n");
    try stdout.writeAll("✓ Zero runtime overhead\n");
    try stdout.writeAll("✓ Inline optimizations\n");
    try stdout.writeAll("✓ No vtable/dynamic dispatch\n");
    try stdout.writeAll("✓ Comptime evaluation when possible\n");
    try stdout.writeAll("\n");

    // 9. When to use functional patterns
    try stdout.writeAll("9. When to Use Functional Patterns\n\n");

    try stdout.writeAll("Use functional style when:\n");
    try stdout.writeAll("✓ Building composable utilities\n");
    try stdout.writeAll("✓ Working with standard library algorithms\n");
    try stdout.writeAll("✓ Size optimization is critical\n");
    try stdout.writeAll("✓ Clear data flow is important\n");
    try stdout.writeAll("\n");

    try stdout.writeAll("Zig natural idioms:\n");
    try stdout.writeAll("✓ Functions over methods\n");
    try stdout.writeAll("✓ Explicit allocations\n");
    try stdout.writeAll("✓ Error unions over exceptions\n");
    try stdout.writeAll("✓ Comptime over runtime\n");
}
