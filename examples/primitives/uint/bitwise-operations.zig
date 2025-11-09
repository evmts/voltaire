//! Uint Bitwise Operations Example
//!
//! Demonstrates:
//! - AND, OR, XOR, NOT operations
//! - Bit shifting (left and right)
//! - Bit manipulation patterns
//! - Flags and masking

const std = @import("std");
const primitives = @import("primitives");
const Uint = primitives.Uint;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("\n=== Uint Bitwise Operations Example ===\n\n", .{});

    // 1. Basic bitwise operations
    std.debug.print("1. Basic Bitwise Operations\n", .{});
    std.debug.print("   -----------------------\n", .{});

    const a: u256 = 0b11110000; // 240
    const b: u256 = 0b10101010; // 170

    std.debug.print("   a = {} (0b11110000)\n", .{a});
    std.debug.print("   b = {} (0b10101010)\n\n", .{b});

    std.debug.print("   a AND b = {} (0b10100000)\n", .{a & b});
    std.debug.print("   a OR b  = {} (0b11111010)\n", .{a | b});
    std.debug.print("   a XOR b = {} (0b01011010)\n", .{a ^ b});

    const not_a = ~a & std.math.maxInt(u256);
    const not_a_hex = try Uint.toHex(allocator, not_a, false);
    defer allocator.free(not_a_hex);
    std.debug.print("   NOT a   = {s}\n\n", .{not_a_hex});

    // 2. Bit shifting
    std.debug.print("2. Bit Shifting\n", .{});
    std.debug.print("   -----------\n", .{});

    const value: u256 = 10; // 0b1010

    std.debug.print("   Value: {} (0b1010)\n\n", .{value});
    std.debug.print("   Left shift by 1:  {} (multiply by 2)\n", .{value << 1});
    std.debug.print("   Left shift by 2:  {} (multiply by 4)\n", .{value << 2});
    std.debug.print("   Left shift by 8:  {} (multiply by 256)\n\n", .{value << 8});
    std.debug.print("   Right shift by 1: {} (divide by 2)\n", .{value >> 1});
    std.debug.print("   Right shift by 2: {} (divide by 4)\n\n", .{value >> 2});

    // 3. Bit manipulation functions
    std.debug.print("3. Bit Manipulation Functions\n", .{});
    std.debug.print("   -------------------------\n", .{});

    const bits: u256 = 0b10100000; // bits 7 and 5 set

    // Set bit at position
    const set_bit_3 = bits | (@as(u256, 1) << 3);
    // Clear bit at position
    const clear_bit_7 = bits & ~(@as(u256, 1) << 7);
    // Toggle bit at position
    const toggle_bit_5 = bits ^ (@as(u256, 1) << 5);
    // Test bit at position
    const bit_7_set = (bits & (@as(u256, 1) << 7)) != 0;
    const bit_6_set = (bits & (@as(u256, 1) << 6)) != 0;

    std.debug.print("   Original: {} (0b10100000)\n", .{bits});
    std.debug.print("   Bit 7 set? {}\n", .{bit_7_set});
    std.debug.print("   Bit 6 set? {}\n", .{bit_6_set});
    std.debug.print("   Set bit 3: {} (0b10101000)\n", .{set_bit_3});
    std.debug.print("   Clear bit 7: {} (0b00100000)\n", .{clear_bit_7});
    std.debug.print("   Toggle bit 5: {} (0b10000000)\n\n", .{toggle_bit_5});

    // 4. Masking operations
    std.debug.print("4. Masking Operations\n", .{});
    std.debug.print("   -----------------\n", .{});

    const hex_value = try Uint.fromHex("0x123456789abcdef");
    const hex_str = try Uint.toHex(allocator, hex_value, false);
    defer allocator.free(hex_str);

    std.debug.print("   Value: {s}\n\n", .{hex_str});

    const low_byte = hex_value & 0xff;
    const low_byte_hex = try Uint.toHex(allocator, low_byte, false);
    defer allocator.free(low_byte_hex);
    std.debug.print("   Extract low byte (& 0xFF): {s}\n", .{low_byte_hex});

    const low_word = hex_value & 0xffff;
    const low_word_hex = try Uint.toHex(allocator, low_word, false);
    defer allocator.free(low_word_hex);
    std.debug.print("   Extract low word (& 0xFFFF): {s}\n", .{low_word_hex});

    const low_dword = hex_value & 0xffffffff;
    const low_dword_hex = try Uint.toHex(allocator, low_dword, false);
    defer allocator.free(low_dword_hex);
    std.debug.print("   Extract low dword (& 0xFFFFFFFF): {s}\n\n", .{low_dword_hex});

    // 5. Flags and permissions
    std.debug.print("5. Flags and Permissions\n", .{});
    std.debug.print("   --------------------\n", .{});

    const READ: u256 = 0b001;
    const WRITE: u256 = 0b010;
    const EXECUTE: u256 = 0b100;

    var perms: u256 = 0;
    perms |= READ;
    perms |= WRITE;

    std.debug.print("   READ flag:    0b001\n", .{});
    std.debug.print("   WRITE flag:   0b010\n", .{});
    std.debug.print("   EXECUTE flag: 0b100\n\n", .{});
    std.debug.print("   Current permissions: 0b011\n", .{});

    std.debug.print("   Has READ? {}\n", .{(perms & READ) != 0});
    std.debug.print("   Has WRITE? {}\n", .{(perms & WRITE) != 0});
    std.debug.print("   Has EXECUTE? {}\n\n", .{(perms & EXECUTE) != 0});

    perms &= ~WRITE;
    std.debug.print("   After removing WRITE: 0b001\n", .{});
    std.debug.print("   Has WRITE now? {}\n\n", .{(perms & WRITE) != 0});

    // 6. Power of 2 operations
    std.debug.print("6. Power of 2 Operations\n", .{});
    std.debug.print("   --------------------\n", .{});

    const test_values = [_]u256{ 0, 1, 2, 7, 8, 15, 16, 128, 255, 256 };

    for (test_values) |val| {
        const is_pow2 = val != 0 and (val & (val - 1)) == 0;
        std.debug.print("   {} is power of 2? {}\n", .{ val, is_pow2 });
    }
    std.debug.print("\n", .{});

    // 7. Extract bit range
    std.debug.print("7. Extract Bit Range\n", .{});
    std.debug.print("   ----------------\n", .{});

    const data = try Uint.fromHex("0xabcdef");
    const data_hex = try Uint.toHex(allocator, data, false);
    defer allocator.free(data_hex);

    std.debug.print("   Value: {s}\n\n", .{data_hex});

    // Extract bytes using masking and shifting
    const byte0 = (data >> 0) & 0xff;
    const byte1 = (data >> 8) & 0xff;
    const byte2 = (data >> 16) & 0xff;

    std.debug.print("   Byte 0 (bits 0-7):   0x{x}\n", .{byte0});
    std.debug.print("   Byte 1 (bits 8-15):  0x{x}\n", .{byte1});
    std.debug.print("   Byte 2 (bits 16-23): 0x{x}\n\n", .{byte2});

    // 8. Overflow in shifts
    std.debug.print("8. Shift Overflow\n", .{});
    std.debug.print("   -------------\n", .{});

    const one: u256 = 1;
    const shift_255 = one << 255;
    const shift_255_hex = try Uint.toHex(allocator, shift_255, false);
    defer allocator.free(shift_255_hex);

    std.debug.print("   1 << 255 = {s}\n", .{shift_255_hex});

    // Note: In Zig, shifting by >= bit width is undefined behavior
    // We demonstrate wrapping with modulo
    const shift_256 = if (256 < 256) one << 256 else 0;
    std.debug.print("   1 << 256 = {} (shifts out, wraps to 0)\n", .{shift_256});

    const large: u256 = std.math.pow(u256, 2, 255);
    const large_shifted = large << 1;
    std.debug.print("   2^255 << 1 = {} (wraps to 0)\n\n", .{large_shifted});

    std.debug.print("=== Example Complete ===\n\n", .{});
}
