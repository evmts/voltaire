//! Uint Arithmetic Operations Example
//!
//! Demonstrates:
//! - Addition, subtraction, multiplication, division
//! - Modulo and exponentiation
//! - Overflow and underflow behavior
//! - Chaining operations

const std = @import("std");
const primitives = @import("primitives");
const Uint = primitives.Uint;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("\n=== Uint Arithmetic Operations Example ===\n\n", .{});

    // 1. Basic arithmetic
    std.debug.print("1. Basic Arithmetic\n", .{});
    std.debug.print("   ---------------\n", .{});

    const a: u256 = 100;
    const b: u256 = 50;

    std.debug.print("   a = {}, b = {}\n\n", .{ a, b });
    std.debug.print("   a + b = {}\n", .{a +% b});
    std.debug.print("   a - b = {}\n", .{a -% b});
    std.debug.print("   a * b = {}\n", .{a *% b});
    std.debug.print("   a / b = {}\n", .{a / b});
    std.debug.print("   a % b = {}\n\n", .{a % b});

    // 2. Division with remainder
    std.debug.print("2. Division with Remainder\n", .{});
    std.debug.print("   ----------------------\n", .{});

    const dividend: u256 = 17;
    const divisor: u256 = 5;
    const quotient = dividend / divisor;
    const remainder = dividend % divisor;

    std.debug.print("   {} / {} = {} remainder {}\n", .{ dividend, divisor, quotient, remainder });
    std.debug.print("   Verification: {} * {} + {} = {}\n\n", .{ quotient, divisor, remainder, quotient * divisor + remainder });

    // 3. Exponentiation
    std.debug.print("3. Exponentiation\n", .{});
    std.debug.print("   -------------\n", .{});

    const base: u256 = 2;
    const powers = [_]u8{ 0, 1, 8, 16, 32 };

    std.debug.print("   Powers of {}:\n", .{base});
    for (powers) |exp| {
        const result = std.math.pow(u256, base, exp);
        std.debug.print("   2^{} = {}\n", .{ exp, result });
    }
    std.debug.print("\n", .{});

    // 4. Overflow behavior
    std.debug.print("4. Overflow Behavior (Wrapping)\n", .{});
    std.debug.print("   ---------------------------\n", .{});

    const max: u256 = std.math.maxInt(u256);
    const max_str = try Uint.toString(allocator, max);
    defer allocator.free(max_str);

    std.debug.print("   MAX value: {s}...\n", .{max_str[0..50]});
    std.debug.print("   MAX + 1 = {} (wraps to 0)\n", .{max +% 1});
    std.debug.print("   MAX + 2 = {} (wraps to 1)\n", .{max +% 2});
    std.debug.print("   MAX + 100 = {} (wraps to 99)\n\n", .{max +% 100});

    // 5. Underflow behavior
    std.debug.print("5. Underflow Behavior (Wrapping)\n", .{});
    std.debug.print("   ----------------------------\n", .{});

    const zero: u256 = 0;
    const underflow1 = zero -% 1;
    const underflow1_str = try Uint.toString(allocator, underflow1);
    defer allocator.free(underflow1_str);

    std.debug.print("   ZERO - 1 = {s}... (wraps to MAX)\n", .{underflow1_str[0..50]});
    std.debug.print("   ZERO - 5 = {} (wraps to MAX - 4)\n\n", .{zero -% 5});

    // 6. Large number multiplication
    std.debug.print("6. Large Number Multiplication\n", .{});
    std.debug.print("   --------------------------\n", .{});

    const large: u256 = std.math.pow(u256, 2, 200);
    const large_product = large *% large;
    const product_str = try Uint.toString(allocator, large_product);
    defer allocator.free(product_str);

    std.debug.print("   Value: 2^200\n", .{});
    std.debug.print("   Value * Value (wraps): {s}...\n", .{product_str[0..@min(50, product_str.len)]});
    std.debug.print("   (Result is (2^400) mod 2^256)\n\n", .{});

    // 7. Chaining operations
    std.debug.print("7. Chaining Operations\n", .{});
    std.debug.print("   ------------------\n", .{});

    const x: u256 = 10;
    const y: u256 = 20;
    const z: u256 = 5;

    // Calculate: (x + y) * z - 25
    const result = (x +% y) *% z -% 25;

    std.debug.print("   x = {}, y = {}, z = {}\n", .{ x, y, z });
    std.debug.print("   (x + y) * z - 25:\n", .{});
    std.debug.print("   = ({} + {}) * {} - 25\n", .{ x, y, z });
    std.debug.print("   = {} * {} - 25\n", .{ x + y, z });
    std.debug.print("   = {} - 25\n", .{(x + y) * z});
    std.debug.print("   = {}\n\n", .{result});

    // 8. Detecting overflow
    std.debug.print("8. Detecting Overflow\n", .{});
    std.debug.print("   -----------------\n", .{});

    const test1: u256 = 100;
    const test2: u256 = 200;
    const sum1 = test1 +% test2;
    const overflow1 = sum1 < test1;

    const test3: u256 = std.math.maxInt(u256);
    const test4: u256 = 100;
    const sum2 = test3 +% test4;
    const overflow2 = sum2 < test3;

    std.debug.print("   {} + {}: overflow = {}\n", .{ test1, test2, overflow1 });
    std.debug.print("   MAX + {}: overflow = {}\n\n", .{ test4, overflow2 });

    // 9. Fixed-point arithmetic (18 decimals, like Solidity)
    std.debug.print("9. Fixed-Point Arithmetic (WAD)\n", .{});
    std.debug.print("   ---------------------------\n", .{});

    const WAD: u256 = std.math.pow(u256, 10, 18);

    // 2.5 * 1.5 = 3.75
    const val1: u256 = 25 * std.math.pow(u256, 10, 17); // 2.5 WAD
    const val2: u256 = 15 * std.math.pow(u256, 10, 17); // 1.5 WAD
    const product = (val1 *% val2) / WAD; // 3.75 WAD

    const product_float = @as(f64, @floatFromInt(product)) / @as(f64, @floatFromInt(WAD));
    std.debug.print("   2.5 * 1.5 = {d:.2}\n", .{product_float});

    // 10 / 4 = 2.5
    const val3: u256 = 10 * WAD; // 10 WAD
    const val4: u256 = 4 * WAD; // 4 WAD
    const division = (val3 * WAD) / val4; // 2.5 WAD

    const division_float = @as(f64, @floatFromInt(division)) / @as(f64, @floatFromInt(WAD));
    std.debug.print("   10 / 4 = {d:.2}\n\n", .{division_float});

    std.debug.print("=== Example Complete ===\n\n", .{});
}
