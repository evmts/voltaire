/// Basic secp256k1 signing and verification
///
/// Demonstrates:
/// - Signing a message hash with a private key
/// - Deriving public key from private key
/// - Verifying signature with public key
/// - RFC 6979 deterministic signatures
const std = @import("std");
const crypto = @import("crypto");
const primitives = @import("primitives");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    // Generate random private key
    var private_key: [32]u8 = undefined;
    crypto.secp256k1.generatePrivateKey(&private_key);

    // Create message hash
    const message = "Hello, Ethereum!";
    const message_hash = try primitives.Hash.keccak256String(allocator, message);
    defer allocator.free(message_hash);

    std.debug.print("=== Basic Secp256k1 Signing ===\n\n", .{});
    std.debug.print("Message: {s}\n", .{message});
    std.debug.print("Message hash: {s}\n", .{std.fmt.fmtSliceHexLower(message_hash)});

    // Sign the message hash
    const signature = try crypto.secp256k1.sign(message_hash[0..32].*, private_key);

    std.debug.print("\nSignature components:\n", .{});
    std.debug.print("  r: {s}\n", .{std.fmt.fmtSliceHexLower(&signature.r)});
    std.debug.print("  s: {s}\n", .{std.fmt.fmtSliceHexLower(&signature.s)});
    std.debug.print("  v: {d}\n", .{signature.v});

    // Derive public key from private key
    const public_key = try crypto.secp256k1.derivePublicKey(private_key);

    std.debug.print("\nPublic key (64 bytes):\n", .{});
    std.debug.print("  x: {s}\n", .{std.fmt.fmtSliceHexLower(public_key[0..32])});
    std.debug.print("  y: {s}\n", .{std.fmt.fmtSliceHexLower(public_key[32..64])});

    // Verify signature
    const is_valid = try crypto.secp256k1.verify(signature, message_hash[0..32].*, public_key);
    std.debug.print("\nSignature verification: {s}\n", .{if (is_valid) "✓ Valid" else "✗ Invalid"});

    // Test with wrong public key
    var wrong_key: [64]u8 = undefined;
    std.crypto.random.bytes(&wrong_key);
    const invalid_verification = crypto.secp256k1.verify(signature, message_hash[0..32].*, wrong_key) catch false;
    std.debug.print("Wrong key verification: {s}\n", .{if (!invalid_verification) "✗ Invalid (expected)" else "✓ Valid"});

    // Demonstrate deterministic signatures (RFC 6979)
    std.debug.print("\n=== Deterministic Signatures ===\n\n", .{});
    const sig1 = try crypto.secp256k1.sign(message_hash[0..32].*, private_key);
    const sig2 = try crypto.secp256k1.sign(message_hash[0..32].*, private_key);

    const is_deterministic = std.mem.eql(u8, &sig1.r, &sig2.r) and
        std.mem.eql(u8, &sig1.s, &sig2.s) and
        sig1.v == sig2.v;

    std.debug.print("Same message + key produces identical signature: {s}\n", .{if (is_deterministic) "✓ Yes" else "✗ No"});
}
