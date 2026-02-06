//! Comprehensive ABI Encoding/Decoding Workflow Example
//!
//! This example demonstrates a complete workflow for working with Ethereum ABI encoding
//! and decoding, including function calls, return values, events, and errors.
//!
//! Key Concepts:
//! - Function selector computation
//! - Encoding function calls with parameters
//! - Decoding function return values
//! - Event log encoding and decoding
//! - Error encoding and decoding
//! - Packed encoding for signatures

const std = @import("std");
const primitives = @import("primitives");
const crypto_pkg = @import("crypto");

const abi = primitives.AbiEncoding;
const Address = primitives.Address.Address;
const hash_mod = crypto_pkg.Hash;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("\n" ++ "=" ** 80 ++ "\n", .{});
    std.debug.print("  Comprehensive ABI Encoding/Decoding Workflow\n", .{});
    std.debug.print("=" ** 80 ++ "\n\n", .{});

    // Example 1: ERC20 Transfer Function Call
    std.debug.print("1. ERC20 Transfer Function Call\n", .{});
    std.debug.print("-" ** 80 ++ "\n", .{});

    // Function: transfer(address to, uint256 amount)
    const transfer_signature = "transfer(address,uint256)";
    const transfer_selector = abi.computeSelector(transfer_signature);

    std.debug.print("  Function: {s}\n", .{transfer_signature});
    std.debug.print("  Selector: 0x{X}\n", .{transfer_selector});
    std.debug.print("\n", .{});

    // Encode the transfer call
    const recipient = try Address.fromHex("0x70997970C51812dc3A010C7d01b50e0d17dc79C8");
    const amount: u256 = 1_000_000_000_000_000_000_000; // 1000 tokens (18 decimals)

    const transfer_params = [_]abi.AbiValue{
        abi.addressValue(recipient),
        abi.uint256_value(amount),
    };

    const transfer_calldata = try abi.encodeFunctionData(allocator, transfer_selector, &transfer_params);
    defer allocator.free(transfer_calldata);

    std.debug.print("  Parameters:\n", .{});
    std.debug.print("    to: 0x{X}\n", .{recipient.bytes});
    std.debug.print("    amount: {} (1000 tokens)\n", .{amount});
    std.debug.print("\n", .{});
    std.debug.print("  Encoded Calldata ({} bytes):\n", .{transfer_calldata.len});
    std.debug.print("    0x{X}\n", .{transfer_calldata[0..@min(68, transfer_calldata.len)]});
    std.debug.print("    (first 68 bytes: selector + 2 parameters)\n", .{});
    std.debug.print("\n", .{});

    // Example 2: Decoding Transfer Function Call
    std.debug.print("2. Decoding Transfer Function Call\n", .{});
    std.debug.print("-" ** 80 ++ "\n", .{});

    const param_types = [_]abi.AbiType{ .address, .uint256 };
    const decoded = try abi.decodeFunctionData(allocator, transfer_calldata, &param_types);

    defer {
        for (decoded.parameters) |param| {
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
        allocator.free(decoded.parameters);
    }

    std.debug.print("  Decoded Selector: 0x{X}\n", .{decoded.selector});
    std.debug.print("  Decoded Parameters:\n", .{});
    std.debug.print("    to: 0x{X}\n", .{decoded.parameters[0].address.bytes});
    std.debug.print("    amount: {}\n", .{decoded.parameters[1].uint256});
    std.debug.print("\n", .{});

    // Example 3: ERC20 BalanceOf Function Call
    std.debug.print("3. ERC20 BalanceOf Function Call\n", .{});
    std.debug.print("-" ** 80 ++ "\n", .{});

    const balanceof_signature = "balanceOf(address)";
    const balanceof_selector = abi.computeSelector(balanceof_signature);

    const account = try Address.fromHex("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
    const balanceof_params = [_]abi.AbiValue{abi.addressValue(account)};

    const balanceof_calldata = try abi.encodeFunctionData(allocator, balanceof_selector, &balanceof_params);
    defer allocator.free(balanceof_calldata);

    std.debug.print("  Function: {s}\n", .{balanceof_signature});
    std.debug.print("  Selector: 0x{X}\n", .{balanceof_selector});
    std.debug.print("  Parameter: 0x{X}\n", .{account.bytes});
    std.debug.print("  Encoded Calldata: 0x{X}\n", .{balanceof_calldata});
    std.debug.print("\n", .{});

    // Example 4: Decoding Function Return Value
    std.debug.print("4. Decoding Function Return Value\n", .{});
    std.debug.print("-" ** 80 ++ "\n", .{});

    // Simulate balanceOf return value: uint256 balance
    const balance_value: u256 = 5_000_000_000_000_000_000_000; // 5000 tokens
    const return_params = [_]abi.AbiValue{abi.uint256_value(balance_value)};
    const return_data = try abi.encodeAbiParameters(allocator, &return_params);
    defer allocator.free(return_data);

    std.debug.print("  Encoded Return Data: 0x{X}\n", .{return_data});
    std.debug.print("\n", .{});

    // Decode the return value
    const return_types = [_]abi.AbiType{.uint256};
    const decoded_return = try abi.decodeAbiParameters(allocator, return_data, &return_types);

    defer {
        for (decoded_return) |param| {
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
        allocator.free(decoded_return);
    }

    std.debug.print("  Decoded Balance: {} (5000 tokens)\n", .{decoded_return[0].uint256});
    std.debug.print("\n", .{});

    // Example 5: Event Log Encoding - Transfer Event
    std.debug.print("5. Event Log Encoding - Transfer Event\n", .{});
    std.debug.print("-" ** 80 ++ "\n", .{});

    // Event: Transfer(address indexed from, address indexed to, uint256 value)
    const transfer_event_signature = "Transfer(address,address,uint256)";
    const transfer_event_selector = abi.computeSelector(transfer_event_signature);

    std.debug.print("  Event: {s}\n", .{transfer_event_signature});
    std.debug.print("  Topic0 (Event Selector): 0x{X}\n", .{transfer_event_selector});
    std.debug.print("\n", .{});

    // Indexed parameters become topics
    const from_address = try Address.fromHex("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
    const to_address = try Address.fromHex("0x70997970C51812dc3A010C7d01b50e0d17dc79C8");

    // Topic1: keccak256(from_address padded to 32 bytes)
    var from_padded = [_]u8{0} ** 32;
    @memcpy(from_padded[12..32], &from_address.bytes);
    const topic1 = hash_mod.keccak256(&from_padded);

    // Topic2: keccak256(to_address padded to 32 bytes)
    var to_padded = [_]u8{0} ** 32;
    @memcpy(to_padded[12..32], &to_address.bytes);
    const topic2 = hash_mod.keccak256(&to_padded);

    std.debug.print("  Topics:\n", .{});
    std.debug.print("    Topic0: 0x{X}\n", .{transfer_event_selector});
    std.debug.print("    Topic1 (from): 0x{X}\n", .{topic1});
    std.debug.print("    Topic2 (to): 0x{X}\n", .{topic2});
    std.debug.print("\n", .{});

    // Non-indexed parameters go in data
    const event_value: u256 = 1_000_000_000_000_000_000; // 1 token
    const event_data_params = [_]abi.AbiValue{abi.uint256_value(event_value)};
    const event_data = try abi.encodeAbiParameters(allocator, &event_data_params);
    defer allocator.free(event_data);

    std.debug.print("  Data (non-indexed): 0x{X}\n", .{event_data});
    std.debug.print("  Value: {} (1 token)\n", .{event_value});
    std.debug.print("\n", .{});

    // Example 6: Decoding Event Log Data
    std.debug.print("6. Decoding Event Log Data\n", .{});
    std.debug.print("-" ** 80 ++ "\n", .{});

    const event_data_types = [_]abi.AbiType{.uint256};
    const decoded_event_data = try abi.decodeAbiParameters(allocator, event_data, &event_data_types);

    defer {
        for (decoded_event_data) |param| {
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
        allocator.free(decoded_event_data);
    }

    std.debug.print("  Decoded Event Data:\n", .{});
    std.debug.print("    Value: {}\n", .{decoded_event_data[0].uint256});
    std.debug.print("\n", .{});

    // Example 7: Error Encoding - Custom Error
    std.debug.print("7. Error Encoding - Custom Error\n", .{});
    std.debug.print("-" ** 80 ++ "\n", .{});

    // Error: InsufficientBalance(uint256 available, uint256 required)
    const error_signature = "InsufficientBalance(uint256,uint256)";
    const error_selector = abi.computeSelector(error_signature);

    const available: u256 = 100_000_000_000_000_000; // 0.1 tokens
    const required: u256 = 1_000_000_000_000_000_000; // 1 token

    const error_params = [_]abi.AbiValue{
        abi.uint256_value(available),
        abi.uint256_value(required),
    };

    const error_data = try abi.encodeFunctionData(allocator, error_selector, &error_params);
    defer allocator.free(error_data);

    std.debug.print("  Error: {s}\n", .{error_signature});
    std.debug.print("  Error Selector: 0x{X}\n", .{error_selector});
    std.debug.print("  Parameters:\n", .{});
    std.debug.print("    available: {}\n", .{available});
    std.debug.print("    required: {}\n", .{required});
    std.debug.print("  Encoded Error: 0x{X}\n", .{error_data[0..@min(68, error_data.len)]});
    std.debug.print("\n", .{});

    // Example 8: Decoding Error Data
    std.debug.print("8. Decoding Error Data\n", .{});
    std.debug.print("-" ** 80 ++ "\n", .{});

    const error_param_types = [_]abi.AbiType{ .uint256, .uint256 };
    const decoded_error = try abi.decodeFunctionData(allocator, error_data, &error_param_types);

    defer {
        for (decoded_error.parameters) |param| {
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
        allocator.free(decoded_error.parameters);
    }

    std.debug.print("  Decoded Error Selector: 0x{X}\n", .{decoded_error.selector});
    std.debug.print("  Decoded Parameters:\n", .{});
    std.debug.print("    available: {}\n", .{decoded_error.parameters[0].uint256});
    std.debug.print("    required: {}\n", .{decoded_error.parameters[1].uint256});
    std.debug.print("\n", .{});

    // Example 9: Packed Encoding for Signatures
    std.debug.print("9. Packed Encoding for Signatures\n", .{});
    std.debug.print("-" ** 80 ++ "\n", .{});

    std.debug.print("  Packed encoding is used for signature generation (e.g., EIP-712)\n", .{});
    std.debug.print("  Unlike standard ABI encoding, packed encoding has no padding.\n", .{});
    std.debug.print("\n", .{});

    // Standard encoding vs packed encoding
    const msg_sender = try Address.fromHex("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
    const token_id: u256 = 42;
    const price: u256 = 1_000_000_000_000_000_000; // 1 ETH

    // Standard ABI encoding
    const standard_params = [_]abi.AbiValue{
        abi.addressValue(msg_sender),
        abi.uint256_value(token_id),
        abi.uint256_value(price),
    };
    const standard_encoded = try abi.encodeAbiParameters(allocator, &standard_params);
    defer allocator.free(standard_encoded);

    // Packed encoding
    const packed_params = [_]abi.AbiValue{
        abi.addressValue(msg_sender),
        abi.uint256_value(token_id),
        abi.uint256_value(price),
    };
    const packed_encoded = try abi.encodePacked(allocator, &packed_params);
    defer allocator.free(packed_encoded);

    std.debug.print("  Standard ABI Encoding:\n", .{});
    std.debug.print("    Length: {} bytes\n", .{standard_encoded.len});
    std.debug.print("    Data: 0x{X}\n", .{standard_encoded[0..@min(96, standard_encoded.len)]});
    std.debug.print("\n", .{});

    std.debug.print("  Packed Encoding:\n", .{});
    std.debug.print("    Length: {} bytes\n", .{packed_encoded.len});
    std.debug.print("    Data: 0x{X}\n", .{packed_encoded});
    std.debug.print("\n", .{});

    std.debug.print("  Packed encoding is more compact ({} vs {} bytes)\n", .{ packed_encoded.len, standard_encoded.len });
    std.debug.print("\n", .{});

    // Example 10: Complex Function with Multiple Types
    std.debug.print("10. Complex Function with Multiple Types\n", .{});
    std.debug.print("-" ** 80 ++ "\n", .{});

    // Function: swap(address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut, address to)
    const swap_signature = "swap(address,address,uint256,uint256,address)";
    const swap_selector = abi.computeSelector(swap_signature);

    const token_in = try Address.fromHex("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"); // USDC
    const token_out = try Address.fromHex("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"); // WETH
    const amount_in: u256 = 1000_000_000; // 1000 USDC (6 decimals)
    const min_amount_out: u256 = 500_000_000_000_000_000; // 0.5 WETH minimum
    const swap_to = try Address.fromHex("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");

    const swap_params = [_]abi.AbiValue{
        abi.addressValue(token_in),
        abi.addressValue(token_out),
        abi.uint256_value(amount_in),
        abi.uint256_value(min_amount_out),
        abi.addressValue(swap_to),
    };

    const swap_calldata = try abi.encodeFunctionData(allocator, swap_selector, &swap_params);
    defer allocator.free(swap_calldata);

    std.debug.print("  Function: {s}\n", .{swap_signature});
    std.debug.print("  Selector: 0x{X}\n", .{swap_selector});
    std.debug.print("  Parameters:\n", .{});
    std.debug.print("    tokenIn: 0x{X}\n", .{token_in.bytes});
    std.debug.print("    tokenOut: 0x{X}\n", .{token_out.bytes});
    std.debug.print("    amountIn: {} (1000 USDC)\n", .{amount_in});
    std.debug.print("    minAmountOut: {} (0.5 WETH)\n", .{min_amount_out});
    std.debug.print("    to: 0x{X}\n", .{swap_to.bytes});
    std.debug.print("  Encoded Calldata Length: {} bytes\n", .{swap_calldata.len});
    std.debug.print("\n", .{});

    std.debug.print("=" ** 80 ++ "\n", .{});
    std.debug.print("  Example Complete!\n", .{});
    std.debug.print("=" ** 80 ++ "\n\n", .{});

    std.debug.print("Key Takeaways:\n", .{});
    std.debug.print("- Function selectors are first 4 bytes of keccak256(function_signature)\n", .{});
    std.debug.print("- Calldata = selector + ABI encoded parameters\n", .{});
    std.debug.print("- Return values are ABI encoded without selector\n", .{});
    std.debug.print("- Event indexed parameters become topics, non-indexed go in data\n", .{});
    std.debug.print("- Errors are encoded like functions (selector + parameters)\n", .{});
    std.debug.print("- Packed encoding removes padding for signature generation\n", .{});
    std.debug.print("- Always decode with matching types in correct order\n", .{});
    std.debug.print("- ABI encoding is deterministic and reversible\n\n", .{});
}
