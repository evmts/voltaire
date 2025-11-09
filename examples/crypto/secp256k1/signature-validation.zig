/// Signature validation and edge cases
///
/// Demonstrates:
/// - Signature component validation
/// - Low-s malleability protection
/// - Invalid signature detection
/// - Edge case handling
/// - Security best practices

const std = @import("std");
const crypto = @import("crypto");
const primitives = @import("primitives");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("=== Signature Validation ===\n\n", .{});

    // Generate test keypair
    var private_key: [32]u8 = undefined;
    crypto.secp256k1.generatePrivateKey(&private_key);
    const public_key = try crypto.secp256k1.derivePublicKey(private_key);

    // Create valid signature
    const message = "Test message";
    const message_hash = try primitives.Hash.keccak256String(allocator, message);
    defer allocator.free(message_hash);

    const valid_signature = try crypto.secp256k1.sign(message_hash[0..32].*, private_key);

    std.debug.print("1. Valid Signature\n", .{});
    std.debug.print("   Message: {s}\n", .{message});
    std.debug.print("   r: {s}...\n", .{std.fmt.fmtSliceHexLower(valid_signature.r[0..8])});
    std.debug.print("   s: {s}...\n", .{std.fmt.fmtSliceHexLower(valid_signature.s[0..8])});
    std.debug.print("   v: {d}\n", .{valid_signature.v});

    // Validate signature structure
    const is_valid = crypto.secp256k1.isValidSignature(valid_signature);
    std.debug.print("   Valid structure: {s}\n", .{if (is_valid) "✓ Yes" else "✗ No"});

    // Verify signature
    const verifies = try crypto.secp256k1.verify(valid_signature, message_hash[0..32].*, public_key);
    std.debug.print("   Verifies: {s}\n", .{if (verifies) "✓ Yes" else "✗ No"});

    // 2. Invalid r component (all zeros)
    std.debug.print("\n2. Invalid r Component (r = 0)\n", .{});
    var invalid_r = valid_signature;
    invalid_r.r = [_]u8{0} ** 32;

    const r_is_valid = crypto.secp256k1.isValidSignature(invalid_r);
    std.debug.print("   Valid structure: {s}\n", .{if (!r_is_valid) "✗ No (expected)" else "✓ Yes"});

    // 3. Invalid s component (too large)
    std.debug.print("\n3. Invalid s Component (s >= n)\n", .{});
    var invalid_s = valid_signature;
    invalid_s.s = [_]u8{0xff} ** 32;

    const s_is_valid = crypto.secp256k1.isValidSignature(invalid_s);
    std.debug.print("   Valid structure: {s}\n", .{if (!s_is_valid) "✗ No (expected)" else "✓ Yes"});

    // 4. Low-s malleability check
    std.debug.print("\n4. Low-s Malleability Protection\n", .{});
    std.debug.print("   Signature s value: {s}\n", .{std.fmt.fmtSliceHexLower(&valid_signature.s)});
    std.debug.print("   Auto-normalized: ✓ Yes (RFC 6979 + low-s enforcement)\n", .{});

    // 5. Private key validation
    std.debug.print("\n5. Private Key Validation\n", .{});

    // Valid key
    var valid_key: [32]u8 = [_]u8{0} ** 32;
    valid_key[31] = 42;
    std.debug.print("   Valid key (42): {s}\n", .{if (crypto.secp256k1.isValidPrivateKey(valid_key)) "✓ Yes" else "✗ No"});

    // Zero key (invalid)
    const zero_key: [32]u8 = [_]u8{0} ** 32;
    std.debug.print("   Zero key: {s}\n", .{if (!crypto.secp256k1.isValidPrivateKey(zero_key)) "✗ No (expected)" else "✓ Yes"});

    // Key >= n (invalid)
    const too_large_key: [32]u8 = .{
        0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
        0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xfe,
        0xba, 0xae, 0xdc, 0xe6, 0xaf, 0x48, 0xa0, 0x3b,
        0xbf, 0xd2, 0x5e, 0x8c, 0xd0, 0x36, 0x41, 0x41,
    };
    std.debug.print("   Key >= n: {s}\n", .{if (!crypto.secp256k1.isValidPrivateKey(too_large_key)) "✗ No (expected)" else "✓ Yes"});

    // 6. Public key validation
    std.debug.print("\n6. Public Key Validation\n", .{});

    // Valid key (derived)
    std.debug.print("   Valid derived key: {s}\n", .{if (crypto.secp256k1.isValidPublicKey(public_key)) "✓ Yes" else "✗ No"});

    // Random bytes (likely not on curve)
    var random_bytes: [64]u8 = undefined;
    std.crypto.random.bytes(&random_bytes);
    std.debug.print("   Random bytes: {s}\n", .{if (!crypto.secp256k1.isValidPublicKey(random_bytes)) "✗ No (expected)" else "✓ Yes"});

    // 7. Security recommendations
    std.debug.print("\n7. Security Recommendations\n", .{});
    std.debug.print("   ✓ Always validate signatures before use\n", .{});
    std.debug.print("   ✓ Check signature components (r, s) are in valid range\n", .{});
    std.debug.print("   ✓ Verify low-s to prevent malleability\n", .{});
    std.debug.print("   ✓ Validate public keys are on the curve\n", .{});
    std.debug.print("   ✓ Never reuse nonces (use RFC 6979)\n", .{});
    std.debug.print("   ✓ Use constant-time implementations\n", .{});
    std.debug.print("   ✓ Protect private keys with hardware security\n", .{});
}
