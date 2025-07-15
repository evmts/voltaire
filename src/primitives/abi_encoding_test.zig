const std = @import("std");
const testing = std.testing;
const abi = @import("abi_encoding.zig");

// Test ABI encoding of uint types
test "encode uint256" {
    const allocator = testing.allocator;
    
    // Test encoding 69420n (0x10f2c)
    const values = [_]abi.AbiValue{
        abi.uint256_value(69420),
    };
    
    const encoded = try abi.encode_abi_parameters(allocator, &values);
    defer allocator.free(encoded);
    
    try testing.expectEqual(@as(usize, 32), encoded.len);
    
    const expected = [_]u8{0} ** 28 ++ [_]u8{ 0x00, 0x00, 0x10, 0xf2, 0xc };
    try testing.expectEqualSlices(u8, &expected, encoded);
}

test "encode uint8" {
    const allocator = testing.allocator;
    
    // Test encoding 32
    const values = [_]abi.AbiValue{
        .{ .uint8 = 32 },
    };
    
    const encoded = try abi.encode_abi_parameters(allocator, &values);
    defer allocator.free(encoded);
    
    try testing.expectEqual(@as(usize, 32), encoded.len);
    
    const expected = [_]u8{0} ** 31 ++ [_]u8{0x20};
    try testing.expectEqualSlices(u8, &expected, encoded);
}

test "encode multiple uint types" {
    const allocator = testing.allocator;
    
    const values = [_]abi.AbiValue{
        .{ .uint8 = 255 },
        .{ .uint32 = 69420 },
        abi.uint256_value(0xdeadbeef),
    };
    
    const encoded = try abi.encode_abi_parameters(allocator, &values);
    defer allocator.free(encoded);
    
    try testing.expectEqual(@as(usize, 96), encoded.len); // 3 * 32 bytes
}

// Test ABI encoding of int types with two's complement
test "encode int32 positive" {
    const allocator = testing.allocator;
    
    const values = [_]abi.AbiValue{
        .{ .int32 = 2147483647 }, // Max int32
    };
    
    const encoded = try abi.encode_abi_parameters(allocator, &values);
    defer allocator.free(encoded);
    
    const expected = [_]u8{0} ** 28 ++ [_]u8{ 0x7f, 0xff, 0xff, 0xff };
    try testing.expectEqualSlices(u8, &expected, encoded);
}

test "encode int32 negative two's complement" {
    const allocator = testing.allocator;
    
    const values = [_]abi.AbiValue{
        .{ .int32 = -2147483648 }, // Min int32
    };
    
    const encoded = try abi.encode_abi_parameters(allocator, &values);
    defer allocator.free(encoded);
    
    // Two's complement representation
    const expected = [_]u8{0xff} ** 28 ++ [_]u8{ 0x80, 0x00, 0x00, 0x00 };
    try testing.expectEqualSlices(u8, &expected, encoded);
}

// Test ABI encoding of addresses
test "encode address" {
    const allocator = testing.allocator;
    
    const addr: abi.Address = [_]u8{
        0x14, 0xdC, 0x79, 0x96, 0x4d, 0xa2, 0xC0, 0x8b,
        0x23, 0x69, 0x8B, 0x3D, 0x3c, 0xc7, 0xCa, 0x32,
        0x19, 0x3d, 0x99, 0x55,
    };
    
    const values = [_]abi.AbiValue{
        abi.address_value(addr),
    };
    
    const encoded = try abi.encode_abi_parameters(allocator, &values);
    defer allocator.free(encoded);
    
    // Address should be right-padded with zeros
    const expected = [_]u8{0} ** 12 ++ addr;
    try testing.expectEqualSlices(u8, &expected, encoded);
}

// Test ABI encoding of bool
test "encode bool" {
    const allocator = testing.allocator;
    
    // Test true
    {
        const values = [_]abi.AbiValue{
            abi.bool_value(true),
        };
        
        const encoded = try abi.encode_abi_parameters(allocator, &values);
        defer allocator.free(encoded);
        
        const expected = [_]u8{0} ** 31 ++ [_]u8{0x01};
        try testing.expectEqualSlices(u8, &expected, encoded);
    }
    
    // Test false
    {
        const values = [_]abi.AbiValue{
            abi.bool_value(false),
        };
        
        const encoded = try abi.encode_abi_parameters(allocator, &values);
        defer allocator.free(encoded);
        
        const expected = [_]u8{0} ** 32;
        try testing.expectEqualSlices(u8, &expected, encoded);
    }
}

// Test ABI decoding
test "decode uint256" {
    const allocator = testing.allocator;
    
    const data = [_]u8{0} ** 28 ++ [_]u8{ 0x00, 0x00, 0x10, 0xf2, 0xc };
    const types = [_]abi.AbiType{.uint256};
    
    const decoded = try abi.decode_abi_parameters(allocator, &data, &types);
    defer allocator.free(decoded);
    
    try testing.expectEqual(@as(usize, 1), decoded.len);
    try testing.expectEqual(@as(u256, 69420), decoded[0].uint256);
}

test "decode int32 negative" {
    const allocator = testing.allocator;
    
    // Two's complement representation of -2147483648
    const data = [_]u8{0xff} ** 28 ++ [_]u8{ 0x80, 0x00, 0x00, 0x00 };
    const types = [_]abi.AbiType{.int32};
    
    const decoded = try abi.decode_abi_parameters(allocator, &data, &types);
    defer allocator.free(decoded);
    
    try testing.expectEqual(@as(usize, 1), decoded.len);
    try testing.expectEqual(@as(i32, -2147483648), decoded[0].int32);
}

test "decode address" {
    const allocator = testing.allocator;
    
    const expected_addr: abi.Address = [_]u8{
        0x14, 0xdC, 0x79, 0x96, 0x4d, 0xa2, 0xC0, 0x8b,
        0x23, 0x69, 0x8B, 0x3D, 0x3c, 0xc7, 0xCa, 0x32,
        0x19, 0x3d, 0x99, 0x55,
    };
    
    const data = [_]u8{0} ** 12 ++ expected_addr;
    const types = [_]abi.AbiType{.address};
    
    const decoded = try abi.decode_abi_parameters(allocator, &data, &types);
    defer allocator.free(decoded);
    
    try testing.expectEqual(@as(usize, 1), decoded.len);
    try testing.expectEqualSlices(u8, &expected_addr, &decoded[0].address);
}

test "decode bool" {
    const allocator = testing.allocator;
    
    // Test true
    {
        const data = [_]u8{0} ** 31 ++ [_]u8{0x01};
        const types = [_]abi.AbiType{.bool};
        
        const decoded = try abi.decode_abi_parameters(allocator, &data, &types);
        defer allocator.free(decoded);
        
        try testing.expectEqual(@as(usize, 1), decoded.len);
        try testing.expectEqual(true, decoded[0].bool);
    }
    
    // Test false
    {
        const data = [_]u8{0} ** 32;
        const types = [_]abi.AbiType{.bool};
        
        const decoded = try abi.decode_abi_parameters(allocator, &data, &types);
        defer allocator.free(decoded);
        
        try testing.expectEqual(@as(usize, 1), decoded.len);
        try testing.expectEqual(false, decoded[0].bool);
    }
}

// Test function selector computation
test "compute selector" {
    // Test "transfer(address,uint256)" selector
    const transfer_sig = "transfer(address,uint256)";
    const selector = abi.compute_selector(transfer_sig);
    
    // This should match the known ERC20 transfer selector
    const expected_selector = [_]u8{ 0xa9, 0x05, 0x9c, 0xbb };
    try testing.expectEqualSlices(u8, &expected_selector, &selector);
}

test "encode function data" {
    const allocator = testing.allocator;
    
    const selector = abi.compute_selector("transfer(address,uint256)");
    
    const recipient: abi.Address = [_]u8{0x12} ** 20;
    const params = [_]abi.AbiValue{
        abi.address_value(recipient),
        abi.uint256_value(1000),
    };
    
    const encoded = try abi.encode_function_data(allocator, selector, &params);
    defer allocator.free(encoded);
    
    try testing.expectEqual(@as(usize, 68), encoded.len); // 4 + 64 bytes
    try testing.expectEqualSlices(u8, &selector, encoded[0..4]);
}

// Test dynamic types (strings and bytes)
test "decode string" {
    const allocator = testing.allocator;
    
    // Encoded "hello" string
    // offset (32 bytes) + length (32 bytes) + data (32 bytes padded)
    const data = [_]u8{
        // Offset to string data (32)
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x20,
        // Length of string (5)
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x05,
        // String data "hello" padded to 32 bytes
        'h', 'e', 'l', 'l', 'o', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    };
    
    const types = [_]abi.AbiType{.string};
    
    const decoded = try abi.decode_abi_parameters(allocator, &data, &types);
    defer {
        allocator.free(decoded[0].string);
        allocator.free(decoded);
    }
    
    try testing.expectEqual(@as(usize, 1), decoded.len);
    try testing.expectEqualStrings("hello", decoded[0].string);
}

// Test packed encoding
test "encode packed" {
    const allocator = testing.allocator;
    
    const values = [_]abi.AbiValue{
        .{ .uint8 = 0x12 },
        .{ .uint16 = 0x3456 },
        abi.string_value("test"),
    };
    
    const packed_data = try abi.encode_packed(allocator, &values);
    defer allocator.free(packed_data);
    
    try testing.expectEqual(@as(usize, 7), packed_data.len); // 1 + 2 + 4 bytes
    try testing.expectEqual(@as(u8, 0x12), packed_data[0]);
    try testing.expectEqual(@as(u8, 0x34), packed_data[1]);
    try testing.expectEqual(@as(u8, 0x56), packed_data[2]);
    try testing.expectEqualStrings("test", packed_data[3..7]);
}

// Test gas estimation
test "gas estimation for data" {
    // Test with mix of zero and non-zero bytes
    const data = &[_]u8{ 0x00, 0x01, 0x02, 0x00, 0x03 };
    const gas = abi.estimate_gas_for_data(data);
    
    // Base cost: 21000
    // Zero bytes (2): 2 * 4 = 8
    // Non-zero bytes (3): 3 * 16 = 48
    // Total: 21000 + 8 + 48 = 21056
    try testing.expectEqual(@as(u64, 21056), gas);
}

// Test common selectors
test "common ERC20 selectors" {
    const transfer_selector = abi.CommonSelectors.ERC20_TRANSFER;
    const expected_transfer = [_]u8{ 0xa9, 0x05, 0x9c, 0xbb };
    try testing.expectEqualSlices(u8, &expected_transfer, &transfer_selector);
    
    const balance_selector = abi.CommonSelectors.ERC20_BALANCE_OF;
    const expected_balance = [_]u8{ 0x70, 0xa0, 0x82, 0x31 };
    try testing.expectEqualSlices(u8, &expected_balance, &balance_selector);
}

// Test function definition
test "function definition get selector" {
    const allocator = testing.allocator;
    
    const transfer_def = abi.CommonPatterns.erc20_transfer();
    const selector = try transfer_def.get_selector(allocator);
    
    const expected = [_]u8{ 0xa9, 0x05, 0x9c, 0xbb };
    try testing.expectEqualSlices(u8, &expected, &selector);
}

// Test edge cases
test "decode empty parameters" {
    const allocator = testing.allocator;
    
    const decoded = try abi.decode_abi_parameters(allocator, "", &[_]abi.AbiType{});
    defer allocator.free(decoded);
    
    try testing.expectEqual(@as(usize, 0), decoded.len);
}

test "decode with insufficient data" {
    const allocator = testing.allocator;
    
    const data = [_]u8{0x01, 0x02, 0x03}; // Only 3 bytes
    const types = [_]abi.AbiType{.uint256}; // Expects 32 bytes
    
    const result = abi.decode_abi_parameters(allocator, &data, &types);
    try testing.expectError(abi.AbiError.DataTooSmall, result);
}

// Test complex types
test "encode and decode multiple types" {
    const allocator = testing.allocator;
    
    const addr: abi.Address = [_]u8{0xaa} ** 20;
    const original_values = [_]abi.AbiValue{
        abi.uint256_value(42),
        abi.bool_value(true),
        abi.address_value(addr),
    };
    
    const encoded = try abi.encode_abi_parameters(allocator, &original_values);
    defer allocator.free(encoded);
    
    const types = [_]abi.AbiType{ .uint256, .bool, .address };
    const decoded = try abi.decode_abi_parameters(allocator, encoded, &types);
    defer allocator.free(decoded);
    
    try testing.expectEqual(@as(u256, 42), decoded[0].uint256);
    try testing.expectEqual(true, decoded[1].bool);
    try testing.expectEqualSlices(u8, &addr, &decoded[2].address);
}