const std = @import("std");
const primitives = @import("primitives");
const abi = primitives.abi_encoding;
const address = primitives.address;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("\n=== Ethereum ABI Encoding and Decoding Examples ===\n\n", .{});

    // Example 1: Computing function selectors
    try exampleComputeSelector();

    // Example 2: Encoding function calls
    try exampleEncodeFunctionData(allocator);

    // Example 3: Decoding function call data
    try exampleDecodeFunctionData(allocator);

    // Example 4: Encoding parameters
    try exampleEncodeParameters(allocator);

    // Example 5: Decoding parameters
    try exampleDecodeParameters(allocator);

    // Example 6: Packed encoding
    try examplePackedEncoding(allocator);

    std.debug.print("\n=== All examples completed successfully ===\n", .{});
}

fn exampleComputeSelector() !void {
    std.debug.print("--- Example 1: Computing Function Selectors ---\n", .{});

    // Compute selector for ERC20 transfer function
    const transfer_signature = "transfer(address,uint256)";
    const transfer_selector = abi.computeSelector(transfer_signature);

    std.debug.print("Function: {s}\n", .{transfer_signature});
    std.debug.print("Selector: 0x", .{});
    for (transfer_selector) |byte| {
        std.debug.print("{x:0>2}", .{byte});
    }
    std.debug.print("\n", .{});

    // Compute selector for balanceOf function
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

    // Encode an ERC20 transfer call: transfer(recipient, amount)
    const transfer_selector = abi.computeSelector("transfer(address,uint256)");

    // Recipient address
    const recipient: address.Address = [_]u8{
        0xd8, 0xdA, 0x6B, 0xF2, 0x69, 0x64, 0xaF, 0x9D,
        0x7e, 0xEd, 0x9e, 0x03, 0xE5, 0x34, 0x15, 0xD3,
        0x7a, 0xa9, 0x60, 0x45,
    };

    // Amount: 1000 tokens (with 18 decimals = 1000 * 10^18)
    const amount: u256 = 1000_000_000_000_000_000_000;

    const params = [_]abi.AbiValue{
        abi.addressValue(recipient),
        abi.uint256_value(amount),
    };

    const encoded = try abi.encodeFunctionData(allocator, transfer_selector, &params);
    defer allocator.free(encoded);

    std.debug.print("Function: transfer(address,uint256)\n", .{});
    std.debug.print("Recipient: 0x", .{});
    for (recipient) |byte| {
        std.debug.print("{x:0>2}", .{byte});
    }
    std.debug.print("\n", .{});
    std.debug.print("Amount: {d}\n", .{amount});
    std.debug.print("Encoded calldata ({d} bytes): 0x", .{encoded.len});
    for (encoded) |byte| {
        std.debug.print("{x:0>2}", .{byte});
    }
    std.debug.print("\n\n", .{});
}

fn exampleDecodeFunctionData(allocator: std.mem.Allocator) !void {
    std.debug.print("--- Example 3: Decoding Function Call Data ---\n", .{});

    // Simulate encoded transfer function call
    const transfer_selector = abi.computeSelector("transfer(address,uint256)");

    const recipient: address.Address = [_]u8{0xaa} ** 20;
    const amount: u256 = 42_000;

    const params = [_]abi.AbiValue{
        abi.addressValue(recipient),
        abi.uint256_value(amount),
    };

    const encoded = try abi.encodeFunctionData(allocator, transfer_selector, &params);
    defer allocator.free(encoded);

    // Decode the function call
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
    for (decoded_result.parameters[0].address) |byte| {
        std.debug.print("{x:0>2}", .{byte});
    }
    std.debug.print("\n", .{});
    std.debug.print("  [1] uint256: {d}\n", .{decoded_result.parameters[1].uint256});
    std.debug.print("\n", .{});
}

fn exampleEncodeParameters(allocator: std.mem.Allocator) !void {
    std.debug.print("--- Example 4: Encoding Parameters ---\n", .{});

    // Encode various types of parameters
    const test_address: address.Address = [_]u8{
        0x14, 0xdC, 0x79, 0x96, 0x4d, 0xa2, 0xC0, 0x8b,
        0x23, 0x69, 0x8B, 0x3D, 0x3c, 0xc7, 0xCa, 0x32,
        0x19, 0x3d, 0x99, 0x55,
    };

    // Static types example (uint256, bool, address)
    const static_params = [_]abi.AbiValue{
        abi.uint256_value(12345),
        abi.boolValue(true),
        abi.addressValue(test_address),
    };

    const encoded_static = try abi.encodeAbiParameters(allocator, &static_params);
    defer allocator.free(encoded_static);

    std.debug.print("Static types (uint256, bool, address):\n", .{});
    std.debug.print("Values: 12345, true, 0x14dC79964da2C08b23698B3D3cc7Ca32193d9955\n", .{});
    std.debug.print("Encoded ({d} bytes): 0x", .{encoded_static.len});
    for (encoded_static) |byte| {
        std.debug.print("{x:0>2}", .{byte});
    }
    std.debug.print("\n\n", .{});

    // Dynamic types example (string)
    const dynamic_params = [_]abi.AbiValue{
        abi.stringValue("Hello, Ethereum!"),
    };

    const encoded_dynamic = try abi.encodeAbiParameters(allocator, &dynamic_params);
    defer allocator.free(encoded_dynamic);

    std.debug.print("Dynamic type (string):\n", .{});
    std.debug.print("Value: \"Hello, Ethereum!\"\n", .{});
    std.debug.print("Encoded ({d} bytes): 0x", .{encoded_dynamic.len});
    for (encoded_dynamic) |byte| {
        std.debug.print("{x:0>2}", .{byte});
    }
    std.debug.print("\n\n", .{});

    // Mixed types example (string, uint256, bool)
    const mixed_params = [_]abi.AbiValue{
        abi.stringValue("wagmi"),
        abi.uint256_value(420),
        abi.boolValue(true),
    };

    const encoded_mixed = try abi.encodeAbiParameters(allocator, &mixed_params);
    defer allocator.free(encoded_mixed);

    std.debug.print("Mixed types (string, uint256, bool):\n", .{});
    std.debug.print("Values: \"wagmi\", 420, true\n", .{});
    std.debug.print("Encoded ({d} bytes): 0x", .{encoded_mixed.len});
    for (encoded_mixed) |byte| {
        std.debug.print("{x:0>2}", .{byte});
    }
    std.debug.print("\n\n", .{});
}

fn exampleDecodeParameters(allocator: std.mem.Allocator) !void {
    std.debug.print("--- Example 5: Decoding Parameters ---\n", .{});

    // Encode some parameters first
    const test_address: address.Address = [_]u8{0xbb} ** 20;
    const params = [_]abi.AbiValue{
        abi.uint256_value(99999),
        abi.boolValue(false),
        abi.addressValue(test_address),
        abi.stringValue("Decoding test"),
    };

    const encoded = try abi.encodeAbiParameters(allocator, &params);
    defer allocator.free(encoded);

    // Decode the parameters
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
    for (decoded[2].address) |byte| {
        std.debug.print("{x:0>2}", .{byte});
    }
    std.debug.print("\n", .{});
    std.debug.print("  [3] string: \"{s}\"\n", .{decoded[3].string});
    std.debug.print("\n", .{});
}

fn examplePackedEncoding(allocator: std.mem.Allocator) !void {
    std.debug.print("--- Example 6: Packed Encoding ---\n", .{});

    // Packed encoding (no padding, minimal representation)
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
    std.debug.print("Note: No padding, minimal representation\n", .{});

    // Compare with standard ABI encoding
    const standard = try abi.encodeAbiParameters(allocator, &values);
    defer allocator.free(standard);

    std.debug.print("Standard ABI encoding ({d} bytes): 0x", .{standard.len});
    for (standard) |byte| {
        std.debug.print("{x:0>2}", .{byte});
    }
    std.debug.print("\n", .{});
    std.debug.print("Note: 32-byte alignment, includes offsets for dynamic types\n", .{});
    std.debug.print("Packed is {d} bytes smaller\n", .{standard.len - packed_data.len});
    std.debug.print("\n", .{});
}
