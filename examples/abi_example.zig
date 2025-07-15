const std = @import("std");
const primitives = @import("primitives");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("=== Ethereum ABI Encoding/Decoding Demo ===\n\n", .{});

    // 1. Basic ABI type encoding
    std.debug.print("1. Basic ABI Type Encoding:\n", .{});

    // Create some test values
    const values = [_]primitives.Abi.AbiValue{
        primitives.Abi.uint256_value(42),
        primitives.Abi.bool_value(true),
        primitives.Abi.address_value([_]u8{0x12} ** 20),
        primitives.Abi.string_value("Hello, ABI!"),
    };

    const encoded = try primitives.Abi.encode_abi_parameters(allocator, &values);
    defer allocator.free(encoded);

    std.debug.print("   Encoded {} parameters into {} bytes\n", .{ values.len, encoded.len });
    std.debug.print("   First 32 bytes: ", .{});
    for (encoded[0..@min(32, encoded.len)]) |byte| {
        std.debug.print("{:02x}", .{byte});
    }
    std.debug.print("\n\n", .{});

    // 2. Function selector computation
    std.debug.print("2. Function Selector Computation:\n", .{});

    const transfer_signature = "transfer(address,uint256)";
    const transfer_selector = primitives.Abi.compute_selector(transfer_signature);

    std.debug.print("   Function: {s}\n", .{transfer_signature});
    std.debug.print("   Selector: 0x", .{});
    for (transfer_selector) |byte| {
        std.debug.print("{:02x}", .{byte});
    }
    std.debug.print("\n\n", .{});

    // 3. Function data encoding
    std.debug.print("3. Function Data Encoding:\n", .{});

    const recipient = [_]u8{ 0x74, 0x2d, 0x35, 0xcc, 0x66, 0x34, 0xc0, 0x53, 0x29, 0x25, 0xa3, 0xb8, 0x44, 0xbc, 0x9e, 0x75, 0x95, 0xf8, 0xfa, 0x82 };
    const amount = 1000000000000000000; // 1 ETH in wei

    const transfer_params = [_]primitives.Abi.AbiValue{
        primitives.Abi.address_value(recipient),
        primitives.Abi.uint256_value(amount),
    };

    const function_data = try primitives.Abi.encode_function_data(allocator, transfer_selector, &transfer_params);
    defer allocator.free(function_data);

    std.debug.print("   Transfer to: 0x", .{});
    for (recipient) |byte| {
        std.debug.print("{:02x}", .{byte});
    }
    std.debug.print("\n", .{});
    std.debug.print("   Amount: {} wei\n", .{amount});
    std.debug.print("   Encoded call data: {} bytes\n", .{function_data.len});
    std.debug.print("   First 36 bytes: ", .{});
    for (function_data[0..@min(36, function_data.len)]) |byte| {
        std.debug.print("{:02x}", .{byte});
    }
    std.debug.print("\n\n", .{});

    // 4. Packed encoding
    std.debug.print("4. Packed Encoding:\n", .{});

    const packed_values = [_]primitives.Abi.AbiValue{
        primitives.Abi.AbiValue{ .uint8 = 0x12 },
        primitives.Abi.AbiValue{ .uint16 = 0x3456 },
        primitives.Abi.AbiValue{ .uint32 = 0x789abcde },
        primitives.Abi.string_value("test"),
    };

    const packed_data = try primitives.Abi.encode_packed(allocator, &packed_values);
    defer allocator.free(packed_data);

    std.debug.print("   Packed encoding of [uint8(0x12), uint16(0x3456), uint32(0x789abcde), \"test\"]\n", .{});
    std.debug.print("   Result: {} bytes: ", .{packed_data.len});
    for (packed_data) |byte| {
        std.debug.print("{:02x}", .{byte});
    }
    std.debug.print("\n\n", .{});

    // 5. Gas estimation
    std.debug.print("5. Gas Estimation:\n", .{});

    const gas_estimate = primitives.Abi.estimate_gas_for_data(function_data);
    std.debug.print("   Estimated gas for transfer call: {} gas\n", .{gas_estimate});

    const simple_data = &[_]u8{ 0x00, 0x01, 0x02, 0x00, 0x03 };
    const simple_gas = primitives.Abi.estimate_gas_for_data(simple_data);
    std.debug.print("   Estimated gas for simple data: {} gas\n\n", .{simple_gas});

    // 6. Common selectors
    std.debug.print("6. Common Function Selectors:\n", .{});

    const common_selectors = [_]struct { name: []const u8, selector: [4]u8 }{
        .{ .name = "transfer", .selector = primitives.Abi.CommonSelectors.ERC20_TRANSFER },
        .{ .name = "balanceOf", .selector = primitives.Abi.CommonSelectors.ERC20_BALANCE_OF },
        .{ .name = "approve", .selector = primitives.Abi.CommonSelectors.ERC20_APPROVE },
        .{ .name = "totalSupply", .selector = primitives.Abi.CommonSelectors.ERC20_TOTAL_SUPPLY },
    };

    for (common_selectors) |item| {
        std.debug.print("   {s}: 0x", .{item.name});
        for (item.selector) |byte| {
            std.debug.print("{:02x}", .{byte});
        }
        std.debug.print("\n", .{});
    }
    std.debug.print("\n", .{});

    // 7. ABI type properties
    std.debug.print("7. ABI Type Properties:\n", .{});

    const type_examples = [_]primitives.Abi.AbiType{
        .uint256,
        .address,
        .bool,
        .bytes,
        .string,
        .uint256_array,
    };

    for (type_examples) |abi_type| {
        const is_dynamic = abi_type.is_dynamic();
        const size = abi_type.size();

        std.debug.print("   {}: dynamic={}, size=", .{ abi_type, is_dynamic });
        if (size) |s| {
            std.debug.print("{} bytes\n", .{s});
        } else {
            std.debug.print("variable\n", .{});
        }
    }

    std.debug.print("\n=== ABI Demo Complete ===\n", .{});
}
