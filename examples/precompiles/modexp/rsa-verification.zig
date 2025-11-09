const std = @import("std");
const precompiles = @import("precompiles");
const primitives = @import("primitives");
const crypto = @import("crypto");
const Hardfork = primitives.Hardfork;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("=== ModExp RSA Signature Verification ===\n\n", .{});

    // Example 1: Simplified RSA simulation (smaller for demo)
    std.debug.print("=== Example 1: Simplified RSA Verification ===\n", .{});

    // Use smaller sizes for demonstration (real RSA uses 256+ bytes)
    const rsa_size = 32; // 256 bits instead of 2048 for demo

    // Simulate signature
    var signature: [rsa_size]u8 = undefined;
    crypto.getRandomValues(&signature);
    signature[0] = 0x00; // Ensure it's less than modulus

    // Common RSA public exponent: 65537 (0x010001)
    const exponent = [_]u8{ 0x01, 0x00, 0x01 };

    // Simulate RSA modulus (public key)
    var modulus: [rsa_size]u8 = undefined;
    crypto.getRandomValues(&modulus);
    modulus[0] |= 0x80; // Ensure high bit is set

    std.debug.print("RSA parameters:\n", .{});
    std.debug.print("  Signature size: {} bytes\n", .{signature.len});
    std.debug.print("  Exponent: 65537 (common RSA public exponent)\n", .{});
    std.debug.print("  Modulus size: {} bytes\n", .{modulus.len});

    // Create input: baseLen(32) || expLen(32) || modLen(32) || base || exp || mod
    const total_len = 96 + signature.len + exponent.len + modulus.len;
    var rsa_input = try allocator.alloc(u8, total_len);
    defer allocator.free(rsa_input);
    @memset(rsa_input, 0);

    // Set lengths
    rsa_input[31] = @intCast(signature.len);
    rsa_input[63] = @intCast(exponent.len);
    rsa_input[95] = @intCast(modulus.len);

    // Set values
    @memcpy(rsa_input[96 .. 96 + signature.len], &signature);
    @memcpy(rsa_input[96 + signature.len .. 96 + signature.len + exponent.len], &exponent);
    @memcpy(rsa_input[96 + signature.len + exponent.len .. 96 + signature.len + exponent.len + modulus.len], &modulus);

    std.debug.print("  Total input size: {} bytes\n", .{rsa_input.len});

    const rsa_result = try precompiles.modexp.execute(allocator, rsa_input, 1000000, Hardfork.CANCUN);
    defer rsa_result.deinit(allocator);

    std.debug.print("\nVerification result:\n", .{});
    std.debug.print("  Output size: {} bytes\n", .{rsa_result.output.len});
    std.debug.print("  Gas used: {}\n", .{rsa_result.gas_used});
    std.debug.print("  Output (first 16 bytes): 0x{s}\n", .{std.fmt.fmtSliceHexLower(rsa_result.output[0..@min(16, rsa_result.output.len)])});
    std.debug.print("\nNote: In real RSA, output would be compared to expected message hash\n", .{});

    // Example 2: Fermat primality test
    std.debug.print("\n=== Example 2: Fermat Primality Test ===\n", .{});
    // Fermat test: if p is prime and a < p, then a^(p-1) ≡ 1 (mod p)

    // Testing if 97 is prime: compute 2^96 mod 97
    var fermat_input: [99]u8 = [_]u8{0} ** 99;
    fermat_input[31] = 1; // base_len = 1
    fermat_input[63] = 1; // exp_len = 1
    fermat_input[95] = 1; // mod_len = 1
    fermat_input[96] = 2; // base = 2
    fermat_input[97] = 96; // exp = 96 (97 - 1)
    fermat_input[98] = 97; // mod = 97

    std.debug.print("Testing if 97 is prime using Fermat test:\n", .{});
    std.debug.print("  Computing: 2^96 mod 97 (should equal 1 if prime)\n", .{});

    const fermat_result = try precompiles.modexp.execute(allocator, &fermat_input, 100000, Hardfork.CANCUN);
    defer fermat_result.deinit(allocator);

    const fermat_output = fermat_result.output[0];
    std.debug.print("  Result: {}\n", .{fermat_output});
    std.debug.print("  Is prime (Fermat test): {s}\n", .{if (fermat_output == 1) "✓ Yes" else "✗ No"});
    std.debug.print("  Gas used: {}\n", .{fermat_result.gas_used});

    // Example 3: Modular inverse using Fermat's Little Theorem
    std.debug.print("\n=== Example 3: Modular Inverse (Fermat) ===\n", .{});
    // For prime p: a^(-1) ≡ a^(p-2) (mod p)
    // Computing inverse of 3 mod 7: 3^5 mod 7

    var inv_input: [99]u8 = [_]u8{0} ** 99;
    inv_input[31] = 1; // base_len = 1
    inv_input[63] = 1; // exp_len = 1
    inv_input[95] = 1; // mod_len = 1
    inv_input[96] = 3; // base = 3
    inv_input[97] = 5; // exp = 5 (7 - 2)
    inv_input[98] = 7; // mod = 7

    std.debug.print("Computing modular inverse of 3 mod 7:\n", .{});
    std.debug.print("  Computing: 3^5 mod 7\n", .{});

    const inv_result = try precompiles.modexp.execute(allocator, &inv_input, 100000, Hardfork.CANCUN);
    defer inv_result.deinit(allocator);

    const inverse = inv_result.output[0];
    std.debug.print("  Inverse: {}\n", .{inverse});

    // Verify: 3 * inverse ≡ 1 (mod 7)
    const verify = (3 * @as(u32, inverse)) % 7;
    std.debug.print("  Verification (3 * inverse mod 7): {}\n", .{verify});
    std.debug.print("  Correct: {s}\n", .{if (verify == 1) "✓ Yes" else "✗ No"});
    std.debug.print("  Gas used: {}\n", .{inv_result.gas_used});

    // Example 4: Square and multiply efficiency
    std.debug.print("\n=== Example 4: Large Exponent Efficiency ===\n", .{});
    // Computing 2^1000 mod 1009 (1009 is prime)

    // For larger exponents, we need multi-byte representation
    var large_exp_input: [100]u8 = [_]u8{0} ** 100;
    large_exp_input[31] = 1; // base_len = 1
    large_exp_input[63] = 2; // exp_len = 2
    large_exp_input[95] = 2; // mod_len = 2
    large_exp_input[96] = 2; // base = 2
    large_exp_input[97] = 0x03; // exp = 1000 (0x03E8) - high byte
    large_exp_input[98] = 0xE8; // exp = 1000 - low byte
    large_exp_input[99] = 0x03; // mod = 1009 (0x03F1) - high byte
    // Note: incomplete for demo, would need proper multi-byte setup

    std.debug.print("Large exponent calculations use square-and-multiply algorithm\n", .{});
    std.debug.print("Efficient even for very large exponents (e.g., RSA with 2048-bit exp)\n", .{});

    // Example 5: EIP-2565 gas reduction
    std.debug.print("\n=== Example 5: EIP-2565 Gas Reduction Benefits ===\n", .{});
    std.debug.print("EIP-2565 (Berlin fork) reduced ModExp gas costs by ~83%%\n", .{});
    std.debug.print("\nEstimated costs for RSA-2048 verification:\n", .{});
    std.debug.print("  Pre-Berlin (Byzantium): ~300,000 gas\n", .{});
    std.debug.print("  Post-Berlin (Berlin+): ~50,000 gas\n", .{});
    std.debug.print("  Reduction: 83%%\n", .{});
    std.debug.print("\nThis makes on-chain RSA verification practical for many use cases\n", .{});

    std.debug.print("\n=== Summary ===\n", .{});
    std.debug.print("RSA-2048 verification: ~50,000 gas (post-EIP-2565)\n", .{});
    std.debug.print("RSA-4096 verification: ~200,000 gas (post-EIP-2565)\n", .{});
    std.debug.print("Use cases:\n", .{});
    std.debug.print("  - Verify RSA signatures on-chain\n", .{});
    std.debug.print("  - Primality testing (Fermat, Miller-Rabin)\n", .{});
    std.debug.print("  - Modular inverses for cryptography\n", .{});
    std.debug.print("  - Zero-knowledge proof systems\n", .{});
    std.debug.print("  - Diffie-Hellman key exchange verification\n", .{});
}
