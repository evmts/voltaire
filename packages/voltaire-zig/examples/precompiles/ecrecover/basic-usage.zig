const std = @import("std");
const precompiles = @import("precompiles");
const crypto = @import("crypto");
const primitives = @import("primitives");
const Secp256k1 = crypto.Secp256k1;
const Keccak256 = crypto.Keccak256;
const Hardfork = primitives.Hardfork;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("=== ECRECOVER Basic Usage ===\n\n", .{});

    // Generate a keypair and sign a message
    var private_key: [32]u8 = undefined;
    crypto.getRandomValues(&private_key);
    const public_key = try Secp256k1.derivePublicKey(&private_key);

    // Derive expected address from public key
    const pub_key_hash = Keccak256.hash(&public_key);
    const expected_address = pub_key_hash[12..32]; // Last 20 bytes

    std.debug.print("Expected address: 0x{s}\n", .{std.fmt.fmtSliceHexLower(expected_address)});

    // Sign a message hash
    const message = "Hello, ECRECOVER!";
    const message_hash = Keccak256.hash(message);
    std.debug.print("Message hash: 0x{s}\n", .{std.fmt.fmtSliceHexLower(&message_hash)});

    const signature = try Secp256k1.sign(&message_hash, &private_key);
    std.debug.print("Signature v: {}\n", .{signature.v});

    // Prepare ECRECOVER input (128 bytes)
    // Format: hash(32) || v(32, padded) || r(32) || s(32)
    var input: [128]u8 = [_]u8{0} ** 128;
    @memcpy(input[0..32], &message_hash);
    input[63] = signature.v; // v in last byte of second 32-byte word
    @memcpy(input[64..96], &signature.r);
    @memcpy(input[96..128], &signature.s);

    std.debug.print("\n=== Executing ECRECOVER ===\n", .{});
    std.debug.print("Input length: {} bytes\n", .{input.len});

    // Execute precompile (address 0x01)
    const result = try precompiles.ecrecover.execute(allocator, &input, 10000);
    defer result.deinit(allocator);

    std.debug.print("\nResult: Success\n", .{});
    std.debug.print("Gas used: {} (always 3000)\n", .{result.gas_used});

    // Extract address from output (last 20 bytes)
    const recovered_address = result.output[12..32];
    std.debug.print("Recovered address: 0x{s}\n", .{std.fmt.fmtSliceHexLower(recovered_address)});

    // Verify addresses match
    const match = std.mem.eql(u8, recovered_address, expected_address);
    std.debug.print("Addresses match: {s}\n", .{if (match) "✓ Yes" else "✗ No"});

    // Example 2: Invalid signature (returns zero address)
    std.debug.print("\n=== Invalid Signature Test ===\n", .{});
    var invalid_input: [128]u8 = [_]u8{0} ** 128;
    @memcpy(invalid_input[0..32], &message_hash);
    invalid_input[63] = 27; // Valid v
    // r and s are all zeros (invalid)

    const invalid_result = try precompiles.ecrecover.execute(allocator, &invalid_input, 10000);
    defer invalid_result.deinit(allocator);

    const is_zero = blk: {
        for (invalid_result.output) |byte| {
            if (byte != 0) break :blk false;
        }
        break :blk true;
    };
    std.debug.print("Invalid signature returns zero address: {s}\n", .{if (is_zero) "✓ Yes" else "✗ No"});
    std.debug.print("Gas still consumed: {}\n", .{invalid_result.gas_used});

    // Example 3: Out of gas
    std.debug.print("\n=== Out of Gas Test ===\n", .{});
    const oog_result = precompiles.ecrecover.execute(allocator, &input, 2000);
    const is_oog = if (oog_result) |_| false else |err| err == error.OutOfGas;
    std.debug.print("Out of gas fails: {s}\n", .{if (is_oog) "✓ Yes" else "✗ No"});
}
