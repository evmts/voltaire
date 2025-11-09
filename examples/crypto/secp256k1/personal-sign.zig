/// EIP-191 Personal Message Signing
///
/// Demonstrates:
/// - Personal message signing with EIP-191 prefix
/// - Preventing transaction signature reuse
/// - Recovering signer from personal_sign signature
/// - Wallet authentication pattern

const std = @import("std");
const crypto = @import("crypto");
const primitives = @import("primitives");

fn deriveAddress(allocator: std.mem.Allocator, public_key: [64]u8) ![]const u8 {
    const hash = try primitives.Hash.keccak256(allocator, &public_key);
    defer allocator.free(hash);

    const address_bytes = hash[12..32];
    var hex_addr = try allocator.alloc(u8, 42);
    hex_addr[0] = '0';
    hex_addr[1] = 'x';
    _ = std.fmt.bufPrint(hex_addr[2..], "{s}", .{std.fmt.fmtSliceHexLower(address_bytes)}) catch unreachable;
    return hex_addr;
}

fn personalSign(
    allocator: std.mem.Allocator,
    message: []const u8,
    private_key: [32]u8,
) !crypto.secp256k1.Signature {
    // Add EIP-191 prefix
    const prefix = try std.fmt.allocPrint(allocator, "\x19Ethereum Signed Message:\n{d}", .{message.len});
    defer allocator.free(prefix);

    // Concatenate prefix + message
    const prefixed = try std.mem.concat(allocator, u8, &[_][]const u8{ prefix, message });
    defer allocator.free(prefixed);

    // Hash the prefixed message
    const message_hash = try primitives.Hash.keccak256(allocator, prefixed);
    defer allocator.free(message_hash);

    // Sign
    return crypto.secp256k1.sign(message_hash[0..32].*, private_key);
}

fn personalVerify(
    allocator: std.mem.Allocator,
    message: []const u8,
    signature: crypto.secp256k1.Signature,
    expected_address: []const u8,
) !bool {
    // Reconstruct the EIP-191 hash
    const prefix = try std.fmt.allocPrint(allocator, "\x19Ethereum Signed Message:\n{d}", .{message.len});
    defer allocator.free(prefix);

    const prefixed = try std.mem.concat(allocator, u8, &[_][]const u8{ prefix, message });
    defer allocator.free(prefixed);

    const message_hash = try primitives.Hash.keccak256(allocator, prefixed);
    defer allocator.free(message_hash);

    // Recover signer's public key
    const public_key = try crypto.secp256k1.recoverPublicKey(signature, message_hash[0..32].*);
    const signer_address = try deriveAddress(allocator, public_key);
    defer allocator.free(signer_address);

    // Compare addresses (case-insensitive)
    return std.ascii.eqlIgnoreCase(signer_address, expected_address);
}

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("=== EIP-191 Personal Message Signing ===\n\n", .{});

    // Generate keypair
    var private_key: [32]u8 = undefined;
    crypto.secp256k1.generatePrivateKey(&private_key);
    const public_key = try crypto.secp256k1.derivePublicKey(private_key);
    const signer_address = try deriveAddress(allocator, public_key);
    defer allocator.free(signer_address);

    std.debug.print("Signer address: {s}\n", .{signer_address});

    // Sign a personal message
    const message = "I agree to the terms of service";
    std.debug.print("\nMessage: {s}\n", .{message});

    const signature = try personalSign(allocator, message, private_key);
    std.debug.print("\nSignature:\n", .{});
    std.debug.print("  r: {s}...\n", .{std.fmt.fmtSliceHexLower(signature.r[0..8])});
    std.debug.print("  s: {s}...\n", .{std.fmt.fmtSliceHexLower(signature.s[0..8])});
    std.debug.print("  v: {d}\n", .{signature.v});

    // Verify signature
    const is_valid = try personalVerify(allocator, message, signature, signer_address);
    std.debug.print("\nSignature verification: {s}\n", .{if (is_valid) "✓ Valid" else "✗ Invalid"});

    // Test with wrong address
    const wrong_address = "0x0000000000000000000000000000000000000000";
    const invalid_verification = try personalVerify(allocator, message, signature, wrong_address);
    std.debug.print("Wrong address verification: {s}\n", .{if (!invalid_verification) "✗ Invalid (expected)" else "✓ Valid"});

    // Demonstrate prefix importance
    std.debug.print("\n=== EIP-191 Prefix Importance ===\n\n", .{});

    // Without prefix (vulnerable)
    const unprefixed_hash = try primitives.Hash.keccak256String(allocator, message);
    defer allocator.free(unprefixed_hash);
    const unprefixed_sig = try crypto.secp256k1.sign(unprefixed_hash[0..32].*, private_key);

    // With prefix (safe)
    const prefixed_sig = try personalSign(allocator, message, private_key);

    const signatures_match = std.mem.eql(u8, &unprefixed_sig.r, &prefixed_sig.r) and
        std.mem.eql(u8, &unprefixed_sig.s, &prefixed_sig.s);

    std.debug.print("Signatures differ (prefix protection): {s}\n", .{if (!signatures_match) "✓ Yes" else "✗ No"});

    // Wallet authentication example
    std.debug.print("\n=== Wallet Authentication Example ===\n\n", .{});

    var prng = std.rand.DefaultPrng.init(@intCast(std.time.timestamp()));
    const nonce = prng.random().int(u32);
    const auth_message = try std.fmt.allocPrint(
        allocator,
        "Sign this message to authenticate.\nNonce: {d}",
        .{nonce},
    );
    defer allocator.free(auth_message);

    std.debug.print("Challenge: {s}\n", .{auth_message});

    const auth_signature = try personalSign(allocator, auth_message, private_key);
    const authenticated = try personalVerify(allocator, auth_message, auth_signature, signer_address);

    std.debug.print("Authentication: {s}\n", .{if (authenticated) "✓ Success" else "✗ Failed"});
    std.debug.print("Authenticated as: {s}\n", .{signer_address});
}
