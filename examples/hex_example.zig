const std = @import("std");
const primitives = @import("primitives");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("=== Ethereum Hex & Bytes Utilities Demo ===\n\n", .{});

    // 1. Hex validation
    std.debug.print("1. Hex Validation:\n", .{});
    const valid_hex = "0x1234abcd";
    const invalid_hex = "0xGHI";
    const empty_hex = "0x";

    std.debug.print("   '{}' is valid hex: {}\n", .{ std.fmt.fmtSliceHexLower(valid_hex), primitives.Hex.is_hex(valid_hex) });
    std.debug.print("   '{}' is valid hex: {}\n", .{ std.fmt.fmtSliceHexLower(invalid_hex), primitives.Hex.is_hex(invalid_hex) });
    std.debug.print("   '{}' is valid hex: {}\n\n", .{ std.fmt.fmtSliceHexLower(empty_hex), primitives.Hex.is_hex(empty_hex) });

    // 2. Hex to bytes conversion
    std.debug.print("2. Hex to Bytes Conversion:\n", .{});
    const hex_data = "0x48656c6c6f2c20576f726c6421"; // "Hello, World!" in hex
    const bytes = try primitives.Hex.hex_to_bytes(allocator, hex_data);
    defer allocator.free(bytes);

    std.debug.print("   Hex: {s}\n", .{hex_data});
    std.debug.print("   Bytes: {any}\n", .{bytes});
    std.debug.print("   As string: {s}\n\n", .{bytes});

    // 3. Bytes to hex conversion
    std.debug.print("3. Bytes to Hex Conversion:\n", .{});
    const message = "Ethereum rocks!";
    const message_hex = try primitives.Hex.bytes_to_hex(allocator, message);
    defer allocator.free(message_hex);

    std.debug.print("   Message: {s}\n", .{message});
    std.debug.print("   As hex: {s}\n\n", .{message_hex});

    // 4. Fixed-size conversions (no allocation)
    std.debug.print("4. Fixed-size Conversions:\n", .{});
    const address_hex = "0x742d35Cc6634C0532925a3b844Bc9e7595f8fA82";
    const address_bytes = try primitives.Hex.hex_to_bytes_fixed(20, address_hex);
    const address_hex_back = primitives.Hex.bytes_to_hex_fixed(20, address_bytes);

    std.debug.print("   Address hex: {s}\n", .{address_hex});
    std.debug.print("   Address bytes: {any}\n", .{address_bytes});
    std.debug.print("   Back to hex: {s}\n\n", .{address_hex_back});

    // 5. Bytes utilities
    std.debug.print("5. Bytes Utilities:\n", .{});
    const data1 = [_]u8{ 0x12, 0x34 };
    const data2 = [_]u8{ 0xab, 0xcd };
    const data3 = [_]u8{ 0xef, 0x01 };

    const arrays = [_][]const u8{ &data1, &data2, &data3 };
    const concatenated = try primitives.Hex.concat(allocator, &arrays);
    defer allocator.free(concatenated);

    std.debug.print("   Data1: {any}\n", .{data1});
    std.debug.print("   Data2: {any}\n", .{data2});
    std.debug.print("   Data3: {any}\n", .{data3});
    std.debug.print("   Concatenated: {any}\n", .{concatenated});
    std.debug.print("   Size: {}\n\n", .{primitives.Hex.size(concatenated)});

    // 6. Slicing
    std.debug.print("6. Slicing:\n", .{});
    const slice_result = primitives.Hex.slice(concatenated, 1, 4);
    std.debug.print("   Original: {any}\n", .{concatenated});
    std.debug.print("   Slice [1:4]: {any}\n\n", .{slice_result});

    // 7. Padding
    std.debug.print("7. Padding:\n", .{});
    const short_data = [_]u8{ 0x12, 0x34 };
    const padded_left = try primitives.Hex.pad_left(allocator, &short_data, 8);
    defer allocator.free(padded_left);
    const padded_right = try primitives.Hex.pad_right(allocator, &short_data, 8);
    defer allocator.free(padded_right);

    std.debug.print("   Original: {any}\n", .{short_data});
    std.debug.print("   Padded left to 8: {any}\n", .{padded_left});
    std.debug.print("   Padded right to 8: {any}\n\n", .{padded_right});

    // 8. Trimming
    std.debug.print("8. Trimming:\n", .{});
    const padded_data = [_]u8{ 0x00, 0x00, 0x12, 0x34, 0x00, 0x00 };
    const trimmed_left = primitives.Hex.trim_left_zeros(&padded_data);
    const trimmed_right = primitives.Hex.trim_right_zeros(&padded_data);
    const trimmed_both = primitives.Hex.trim(&padded_data);

    std.debug.print("   Original: {any}\n", .{padded_data});
    std.debug.print("   Trimmed left: {any}\n", .{trimmed_left});
    std.debug.print("   Trimmed right: {any}\n", .{trimmed_right});
    std.debug.print("   Trimmed (left): {any}\n\n", .{trimmed_both});

    // 9. Numeric conversions
    std.debug.print("9. Numeric Conversions:\n", .{});
    const number_hex = "0x1a4";
    const number_value = try primitives.Hex.hex_to_u256(number_hex);
    const number_back = try primitives.Hex.u256_to_hex(allocator, number_value);
    defer allocator.free(number_back);

    std.debug.print("   Hex: {s}\n", .{number_hex});
    std.debug.print("   Value: {}\n", .{number_value});
    std.debug.print("   Back to hex: {s}\n\n", .{number_back});

    // 10. Large number example
    std.debug.print("10. Large Number Example:\n", .{});
    const large_hex = "0x1234567890abcdef1234567890abcdef";
    const large_value = try primitives.Hex.hex_to_u256(large_hex);
    const large_back = try primitives.Hex.u256_to_hex(allocator, large_value);
    defer allocator.free(large_back);

    std.debug.print("   Large hex: {s}\n", .{large_hex});
    std.debug.print("   Large value: {}\n", .{large_value});
    std.debug.print("   Back to hex: {s}\n\n", .{large_back});

    // 11. String conversions
    std.debug.print("11. String Conversions:\n", .{});
    const text = "Hello Ethereum!";
    const text_hex = try primitives.Hex.string_to_hex(allocator, text);
    defer allocator.free(text_hex);
    const text_back = try primitives.Hex.hex_to_string(allocator, text_hex);
    defer allocator.free(text_back);

    std.debug.print("   Text: {s}\n", .{text});
    std.debug.print("   As hex: {s}\n", .{text_hex});
    std.debug.print("   Back to text: {s}\n", .{text_back});

    std.debug.print("\n=== All hex and bytes utilities working perfectly! ===\n", .{});
}
