const std = @import("std");
const primitives = @import("primitives");
const abi = primitives.AbiEncoding;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("\n=== Ethereum ABI Encoding and Decoding Examples ===\n\n", .{});

    try exampleComputeSelector();
    try exampleEncodeFunctionData(allocator);
    try exampleDecodeFunctionData(allocator);
    try exampleEncodeParameters(allocator);
    try exampleDecodeParameters(allocator);
    try examplePackedEncoding(allocator);

    std.debug.print("\n=== All examples completed successfully ===\n", .{});
}

fn exampleComputeSelector() !void {
    std.debug.print("--- Example 1: Computing Function Selectors ---\n", .{});

    const transfer_signature = "transfer(address,uint256)";
    const transfer_selector = abi.computeSelector(transfer_signature);

    std.debug.print("Function: {s}\n", .{transfer_signature});
    std.debug.print("Selector: 0x", .{});
    for (transfer_selector) |byte| {
        std.debug.print("{x:0>2}", .{byte});
    }
    std.debug.print("\n", .{});

    const balance_signature = "balanceOf(address)";
    const balance_selector = abi.computeSelector(balance_signature);

    std.debug.print("Function: {s}\n", .{balance_signature});
    std.debug.print("Selector: 0x", .{});
    for (balance_selector) |byte| {
        std.debug.print("{x:0>2}", .{byte});
    }
    std.debug.print("\n\n", .{});
}

fn exampleEncodeFunctionData(allocator: std.mem.Allocator) !void {
    std.debug.print("--- Example 2: Encoding Function Calls ---\n", .{});

    const transfer_selector = abi.computeSelector("transfer(address,uint256)");

    const recipient_bytes = [_]u8{
        0xd8, 0xdA, 0x6B, 0xF2, 0x69, 0x64, 0xaF, 0x9D,
        0x7e, 0xEd, 0x9e, 0x03, 0xE5, 0x34, 0x15, 0xD3,
        0x7a, 0xa9, 0x60, 0x45,
    };

    const amount: u256 = 1000_000_000_000_000_000_000;

    const params = [_]abi.AbiValue{
        abi.addressValue(primitives.Address{ .bytes = recipient_bytes }),
        abi.uint256_value(amount),
    };

    const encoded = try abi.encodeFunctionData(allocator, transfer_selector, &params);
    defer allocator.free(encoded);

    std.debug.print("Function: transfer(address,uint256)\n", .{});
    std.debug.print("Recipient: 0x", .{});
    for (recipient_bytes) |byte| {
        std.debug.print("{x:0>2}", .{byte});
    }
    std.debug.print("\n", .{});
    std.debug.print("Amount: {d}\n", .{amount});
    std.debug.print("Encoded calldata ({d} bytes): 0x", .{encoded.len});
    for (encoded[0..@min(16, encoded.len)]) |byte| {
        std.debug.print("{x:0>2}", .{byte});
    }
    std.debug.print("... (truncated)\n\n", .{});
}

fn exampleDecodeFunctionData(allocator: std.mem.Allocator) !void {
    std.debug.print("--- Example 3: Decoding Function Call Data ---\n", .{});

    const transfer_selector = abi.computeSelector("transfer(address,uint256)");

    const recipient_bytes = [_]u8{0xaa} ** 20;
    const amount: u256 = 42_000;

    const params = [_]abi.AbiValue{
        abi.addressValue(primitives.Address{ .bytes = recipient_bytes }),
        abi.uint256_value(amount),
    };

    const encoded = try abi.encodeFunctionData(allocator, transfer_selector, &params);
    defer allocator.free(encoded);

    const types = [_]abi.AbiType{ .address, .uint256 };
    const decoded_result = try abi.decodeFunctionData(allocator, encoded, &types);

    defer {
        for (decoded_result.parameters) |param| {
            switch (param) {
                .string, .bytes => |slice| allocator.free(slice),
                .@"uint256[]" => |arr| allocator.free(arr),
                .@"bytes32[]" => |arr| allocator.free(arr),
                .@"address[]" => |arr| allocator.free(arr),
                .@"string[]" => |arr| {
                    for (arr) |str| allocator.free(str);
                    allocator.free(arr);
                },
                else => {},
            }
        }
        allocator.free(decoded_result.parameters);
    }

    std.debug.print("Decoded selector: 0x", .{});
    for (decoded_result.selector) |byte| {
        std.debug.print("{x:0>2}", .{byte});
    }
    std.debug.print("\n", .{});

    std.debug.print("Decoded parameters ({d}):\n", .{decoded_result.parameters.len});
    std.debug.print("  [0] address: 0x", .{});
    for (decoded_result.parameters[0].address.bytes) |byte| {
        std.debug.print("{x:0>2}", .{byte});
    }
    std.debug.print("\n", .{});
    std.debug.print("  [1] uint256: {d}\n", .{decoded_result.parameters[1].uint256});
    std.debug.print("\n", .{});
}

fn exampleEncodeParameters(allocator: std.mem.Allocator) !void {
    std.debug.print("--- Example 4: Encoding Parameters ---\n", .{});

    const test_address_bytes = [_]u8{
        0x14, 0xdC, 0x79, 0x96, 0x4d, 0xa2, 0xC0, 0x8b,
        0x23, 0x69, 0x8B, 0x3D, 0x3c, 0xc7, 0xCa, 0x32,
        0x19, 0x3d, 0x99, 0x55,
    };

    const static_params = [_]abi.AbiValue{
        abi.uint256_value(12345),
        abi.boolValue(true),
        abi.addressValue(primitives.Address{ .bytes = test_address_bytes }),
    };

    const encoded_static = try abi.encodeAbiParameters(allocator, &static_params);
    defer allocator.free(encoded_static);

    std.debug.print("Static types (uint256, bool, address):\n", .{});
    std.debug.print("Values: 12345, true, 0x14dC79964da2C08b23698B3D3cc7Ca32193d9955\n", .{});
    std.debug.print("Encoded ({d} bytes) - first 32: 0x", .{encoded_static.len});
    for (encoded_static[0..@min(32, encoded_static.len)]) |byte| {
        std.debug.print("{x:0>2}", .{byte});
    }
    std.debug.print("\n\n", .{});
}

fn exampleDecodeParameters(allocator: std.mem.Allocator) !void {
    std.debug.print("--- Example 5: Decoding Parameters ---\n", .{});

    const test_address_bytes = [_]u8{0xbb} ** 20;
    const params = [_]abi.AbiValue{
        abi.uint256_value(99999),
        abi.boolValue(false),
        abi.addressValue(primitives.Address{ .bytes = test_address_bytes }),
        abi.stringValue("Decoding test"),
    };

    const encoded = try abi.encodeAbiParameters(allocator, &params);
    defer allocator.free(encoded);

    const types = [_]abi.AbiType{ .uint256, .bool, .address, .string };
    const decoded = try abi.decodeAbiParameters(allocator, encoded, &types);

    defer {
        for (decoded) |param| {
            switch (param) {
                .string, .bytes => |slice| allocator.free(slice),
                .@"uint256[]" => |arr| allocator.free(arr),
                .@"bytes32[]" => |arr| allocator.free(arr),
                .@"address[]" => |arr| allocator.free(arr),
                .@"string[]" => |arr| {
                    for (arr) |str| allocator.free(str);
                    allocator.free(arr);
                },
                else => {},
            }
        }
        allocator.free(decoded);
    }

    std.debug.print("Decoded {d} parameters:\n", .{decoded.len});
    std.debug.print("  [0] uint256: {d}\n", .{decoded[0].uint256});
    std.debug.print("  [1] bool: {}\n", .{decoded[1].bool});
    std.debug.print("  [2] address: 0x", .{});
    for (decoded[2].address.bytes) |byte| {
        std.debug.print("{x:0>2}", .{byte});
    }
    std.debug.print("\n", .{});
    std.debug.print("  [3] string: \"{s}\"\n", .{decoded[3].string});
    std.debug.print("\n", .{});
}

fn examplePackedEncoding(allocator: std.mem.Allocator) !void {
    std.debug.print("--- Example 6: Packed Encoding ---\n", .{});

    const values = [_]abi.AbiValue{
        abi.AbiValue{ .uint8 = 0xFF },
        abi.AbiValue{ .uint16 = 0x1234 },
        abi.AbiValue{ .uint32 = 0xDEADBEEF },
        abi.stringValue("encoded"),
    };

    const packed_data = try abi.encodePacked(allocator, &values);
    defer allocator.free(packed_data);

    std.debug.print("Values: uint8(0xFF), uint16(0x1234), uint32(0xDEADBEEF), string(\"encoded\")\n", .{});
    std.debug.print("Packed encoding ({d} bytes): 0x", .{packed_data.len});
    for (packed_data) |byte| {
        std.debug.print("{x:0>2}", .{byte});
    }
    std.debug.print("\n", .{});
    std.debug.print("Note: No padding, minimal representation\n\n", .{});
}
