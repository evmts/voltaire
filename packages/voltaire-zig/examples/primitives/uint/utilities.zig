//! Uint Utility Functions Example
//!
//! Demonstrates:
//! - Bit analysis: bitLength, leadingZeros, popCount
//! - Min/max operations
//! - Array operations
//! - Statistical functions

const std = @import("std");
const primitives = @import("primitives");
const Uint = primitives.Uint;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("\n=== Uint Utility Functions Example ===\n\n", .{});

    // 1. Bit analysis
    std.debug.print("1. Bit Analysis\n", .{});
    std.debug.print("   -----------\n", .{});

    const values = [_]u256{
        0, // ZERO
        1, // ONE
        255,
        256,
        std.math.pow(u256, 2, 100),
        std.math.maxInt(u256), // MAX
    };

    for (values) |val| {
        const hex = try Uint.toHex(allocator, val, false);
        defer allocator.free(hex);

        const bit_len = @bitSizeOf(u256) - @clz(val);
        const leading_zeros = if (val == 0) 256 else @clz(val);
        const pop_count = @popCount(val);

        std.debug.print("   Value: {s}\n", .{hex});
        std.debug.print("   - Bit length: {} bits\n", .{bit_len});
        std.debug.print("   - Leading zeros: {} bits\n", .{leading_zeros});
        std.debug.print("   - Population count: {} set bits\n\n", .{pop_count});
    }

    // 2. Power of 2 detection
    std.debug.print("2. Power of 2 Detection\n", .{});
    std.debug.print("   -------------------\n", .{});

    const test_values = [_]u256{ 1, 2, 3, 4, 7, 8, 15, 16, 127, 128, 256 };

    for (test_values) |val| {
        const is_pow2 = val != 0 and (val & (val - 1)) == 0;
        std.debug.print("   {} is power of 2? {}\n", .{ val, is_pow2 });
    }
    std.debug.print("\n", .{});

    // 3. Min/max operations
    std.debug.print("3. Min/Max Operations\n", .{});
    std.debug.print("   -----------------\n", .{});

    const a: u256 = 100;
    const b: u256 = 200;
    const c: u256 = 50;

    std.debug.print("   a = {}, b = {}, c = {}\n\n", .{ a, b, c });
    std.debug.print("   min(a, b) = {}\n", .{@min(a, b)});
    std.debug.print("   max(a, b) = {}\n", .{@max(a, b)});
    std.debug.print("   min(a, c) = {}\n", .{@min(a, c)});
    std.debug.print("   max(a, c) = {}\n\n", .{@max(a, c)});

    // 4. Finding min/max in array
    std.debug.print("4. Array Min/Max\n", .{});
    std.debug.print("   ------------\n", .{});

    const numbers = [_]u256{ 150, 42, 999, 7, 256 };

    std.debug.print("   Array: [", .{});
    for (numbers, 0..) |num, i| {
        if (i > 0) std.debug.print(", ", .{});
        std.debug.print("{}", .{num});
    }
    std.debug.print("]\n\n", .{});

    var min_val = numbers[0];
    var max_val = numbers[0];
    for (numbers[1..]) |num| {
        min_val = @min(min_val, num);
        max_val = @max(max_val, num);
    }

    std.debug.print("   Minimum: {}\n", .{min_val});
    std.debug.print("   Maximum: {}\n\n", .{max_val});

    // 5. Sorting
    std.debug.print("5. Sorting Array\n", .{});
    std.debug.print("   ------------\n", .{});

    var unsorted = [_]u256{ 42, 7, 256, 100, 1 };

    std.debug.print("   Unsorted: [", .{});
    for (unsorted, 0..) |num, i| {
        if (i > 0) std.debug.print(", ", .{});
        std.debug.print("{}", .{num});
    }
    std.debug.print("]\n", .{});

    std.mem.sort(u256, &unsorted, {}, comptime std.sort.asc(u256));

    std.debug.print("   Sorted:   [", .{});
    for (unsorted, 0..) |num, i| {
        if (i > 0) std.debug.print(", ", .{});
        std.debug.print("{}", .{num});
    }
    std.debug.print("]\n\n", .{});

    // 6. Clamping values
    std.debug.print("6. Clamping Values\n", .{});
    std.debug.print("   --------------\n", .{});

    const min_clamp: u256 = 0;
    const max_clamp: u256 = 100;

    const test_clamp = [_]u256{ 50, 150, 0, 200 };

    std.debug.print("   Range: [{}, {}]\n\n", .{ min_clamp, max_clamp });

    for (test_clamp) |val| {
        const clamped = @max(min_clamp, @min(val, max_clamp));
        std.debug.print("   clamp({}) = {}\n", .{ val, clamped });
    }
    std.debug.print("\n", .{});

    // 7. Hamming distance
    std.debug.print("7. Hamming Distance\n", .{});
    std.debug.print("   ---------------\n", .{});

    const val1: u256 = 0b1010;
    const val2: u256 = 0b1100;
    const val3: u256 = 0b0000;

    const hamming1 = @popCount(val1 ^ val2);
    const hamming2 = @popCount(val1 ^ val3);

    std.debug.print("   {} (0b1010)\n", .{val1});
    std.debug.print("   {} (0b1100)\n", .{val2});
    std.debug.print("   Hamming distance: {} bits\n\n", .{hamming1});

    std.debug.print("   {} (0b1010)\n", .{val1});
    std.debug.print("   {} (0b0000)\n", .{val3});
    std.debug.print("   Hamming distance: {} bits\n\n", .{hamming2});

    // 8. Bit width requirements
    std.debug.print("8. Bit Width Requirements\n", .{});
    std.debug.print("   ---------------------\n", .{});

    const width_tests = [_]u256{
        100,
        1000,
        100000,
        std.math.pow(u256, 2, 32),
        std.math.pow(u256, 2, 64),
        std.math.pow(u256, 2, 200),
    };

    for (width_tests) |val| {
        const bits = if (val == 0) 0 else @bitSizeOf(u256) - @clz(val);
        const type_name = if (bits == 0)
            "uint0"
        else if (bits <= 8)
            "uint8"
        else if (bits <= 16)
            "uint16"
        else if (bits <= 32)
            "uint32"
        else if (bits <= 64)
            "uint64"
        else if (bits <= 128)
            "uint128"
        else
            "uint256";

        const val_str = try Uint.toString(allocator, val);
        defer allocator.free(val_str);

        const display_len = @min(30, val_str.len);
        std.debug.print("   {s}... requires {s} ({} bits)\n", .{ val_str[0..display_len], type_name, bits });
    }
    std.debug.print("\n", .{});

    // 9. Finding median
    std.debug.print("9. Finding Median\n", .{});
    std.debug.print("   -------------\n", .{});

    var median_test = [_]u256{ 1, 5, 3, 9, 7 };

    std.debug.print("   Values: [", .{});
    for (median_test, 0..) |num, i| {
        if (i > 0) std.debug.print(", ", .{});
        std.debug.print("{}", .{num});
    }
    std.debug.print("]\n", .{});

    std.mem.sort(u256, &median_test, {}, comptime std.sort.asc(u256));
    const mid = median_test.len / 2;
    const median = if (median_test.len % 2 == 1) median_test[mid] else (median_test[mid - 1] + median_test[mid]) / 2;

    std.debug.print("   Median: {}\n\n", .{median});

    // 10. Bit density analysis
    std.debug.print("10. Bit Density Analysis\n", .{});
    std.debug.print("    -------------------\n", .{});

    const density_tests = [_]u256{ 0b1111, 0b1010, 0b10001, 0b11111111 };

    for (density_tests) |val| {
        const total_bits = if (val == 0) 0 else @bitSizeOf(u256) - @clz(val);
        const set_bits = @popCount(val);
        const density = if (total_bits == 0) 0.0 else @as(f64, @floatFromInt(set_bits)) / @as(f64, @floatFromInt(total_bits));
        const percentage = density * 100.0;

        std.debug.print("   0b{b}: {d:.1}% bits set ({}/{})\n", .{ val, percentage, set_bits, total_bits });
    }
    std.debug.print("\n", .{});

    // 11. Parity check
    std.debug.print("11. Parity Check\n", .{});
    std.debug.print("    -----------\n", .{});

    const parity_tests = [_]u256{ 0b1100, 0b111, 0b10101010 };

    for (parity_tests) |val| {
        const pop = @popCount(val);
        const even = pop % 2 == 0;
        const odd = pop % 2 == 1;

        std.debug.print("   0b{b}: {} bits set, even parity? {}, odd parity? {}\n", .{ val, pop, even, odd });
    }
    std.debug.print("\n", .{});

    std.debug.print("=== Example Complete ===\n\n", .{});
}
