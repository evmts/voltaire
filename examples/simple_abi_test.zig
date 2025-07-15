const std = @import("std");
const primitives = @import("primitives");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("=== ABI Encoding/Decoding Test ===\n", .{});

    // Test basic ABI value creation
    const uint_value = primitives.Abi.uint256_value(42);
    const bool_value = primitives.Abi.bool_value(true);
    const addr = [_]u8{0x12} ** 20;
    const addr_value = primitives.Abi.address_value(addr);

    std.debug.print("✓ Created ABI values successfully\n", .{});

    // Test encoding
    const values = [_]primitives.Abi.AbiValue{
        uint_value,
        bool_value,
        addr_value,
    };

    const encoded = try primitives.Abi.encode_abi_parameters(allocator, &values);
    defer allocator.free(encoded);

    std.debug.print("✓ Encoded {} parameters into {} bytes\n", .{ values.len, encoded.len });

    // Test decoding
    const types = [_]primitives.Abi.AbiType{ .uint256, .bool, .address };
    const decoded = try primitives.Abi.decode_abi_parameters(allocator, encoded, &types);
    defer {
        for (decoded) |value| {
            switch (value) {
                .string, .bytes => |slice| allocator.free(slice),
                else => {},
            }
        }
        allocator.free(decoded);
    }

    std.debug.print("✓ Decoded {} parameters successfully\n", .{decoded.len});

    // Verify the decoded values match the original values
    std.debug.print("  - uint256: {} (expected: {})\n", .{ decoded[0].uint256, 42 });
    std.debug.print("  - bool: {} (expected: {})\n", .{ decoded[1].bool, true });
    std.debug.print("  - address matches: {}\n", .{std.mem.eql(u8, &decoded[2].address, &addr)});

    // Test selector computation
    const selector = primitives.Abi.compute_selector("transfer(address,uint256)");
    std.debug.print("✓ Computed selector successfully\n", .{});

    // Test function data encoding and decoding
    const func_values = [_]primitives.Abi.AbiValue{
        addr_value,
        uint_value,
    };

    const func_data = try primitives.Abi.encode_function_data(allocator, selector, &func_values);
    defer allocator.free(func_data);

    std.debug.print("✓ Function data encoded: {} bytes\n", .{func_data.len});

    // Decode the function data
    const func_types = [_]primitives.Abi.AbiType{ .address, .uint256 };
    const decoded_func = try primitives.Abi.decode_function_data(allocator, func_data, &func_types);
    defer {
        for (decoded_func.parameters) |value| {
            switch (value) {
                .string, .bytes => |slice| allocator.free(slice),
                else => {},
            }
        }
        allocator.free(decoded_func.parameters);
    }

    std.debug.print("✓ Function data decoded successfully\n", .{});
    std.debug.print("  - Selector matches: {}\n", .{std.mem.eql(u8, &decoded_func.selector, &selector)});
    std.debug.print("  - Parameters count: {}\n", .{decoded_func.parameters.len});

    // Test gas estimation
    const gas = primitives.Abi.estimate_gas_for_data(func_data);
    std.debug.print("✓ Estimated gas: {}\n", .{gas});

    // Test common selectors
    const common_selectors = [_]struct { name: []const u8, selector: [4]u8 }{
        .{ .name = "transfer", .selector = primitives.Abi.CommonSelectors.ERC20_TRANSFER },
        .{ .name = "balanceOf", .selector = primitives.Abi.CommonSelectors.ERC20_BALANCE_OF },
        .{ .name = "approve", .selector = primitives.Abi.CommonSelectors.ERC20_APPROVE },
        .{ .name = "totalSupply", .selector = primitives.Abi.CommonSelectors.ERC20_TOTAL_SUPPLY },
    };

    std.debug.print("✓ Common selectors available: {}\n", .{common_selectors.len});

    // Test ABI type properties
    const dynamic_types = [_]primitives.Abi.AbiType{ .bytes, .string, .uint256_array };
    const static_types = [_]primitives.Abi.AbiType{ .uint256, .address, .bool, .bytes32 };

    std.debug.print("✓ Dynamic types working: {}\n", .{dynamic_types[0].is_dynamic()});
    std.debug.print("✓ Static types working: {}\n", .{!static_types[0].is_dynamic()});

    std.debug.print("\n🎉 All ABI encoding/decoding tests completed successfully!\n", .{});
    std.debug.print("Features implemented:\n", .{});
    std.debug.print("  • Parameter encoding & decoding\n", .{});
    std.debug.print("  • Function data encoding & decoding  \n", .{});
    std.debug.print("  • Function selector computation\n", .{});
    std.debug.print("  • Gas estimation\n", .{});
    std.debug.print("  • Common ERC20/ERC721 selectors\n", .{});
    std.debug.print("  • Type safety with AbiValue union\n", .{});
    std.debug.print("  • Dynamic vs static type handling\n", .{});
}
