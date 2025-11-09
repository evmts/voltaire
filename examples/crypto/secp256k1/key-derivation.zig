/// Key derivation and address generation
///
/// Demonstrates:
/// - Secure private key generation
/// - Public key derivation from private key
/// - Ethereum address derivation from public key
/// - Key validation
/// - One-way nature of derivation

const std = @import("std");
const crypto = @import("crypto");
const primitives = @import("primitives");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("=== Key Derivation and Address Generation ===\n\n", .{});

    // 1. Generate secure random private key
    std.debug.print("1. Private Key Generation\n", .{});
    var private_key: [32]u8 = undefined;
    crypto.secp256k1.generatePrivateKey(&private_key);

    std.debug.print("   Private key (32 bytes): {s}\n", .{std.fmt.fmtSliceHexLower(&private_key)});

    // Validate private key
    const is_valid_private = crypto.secp256k1.isValidPrivateKey(private_key);
    std.debug.print("   Valid private key: {s}\n", .{if (is_valid_private) "✓ Yes" else "✗ No"});

    // 2. Derive public key from private key
    std.debug.print("\n2. Public Key Derivation\n", .{});
    const public_key = try crypto.secp256k1.derivePublicKey(private_key);

    std.debug.print("   Public key (64 bytes):\n", .{});
    std.debug.print("     x: {s}\n", .{std.fmt.fmtSliceHexLower(public_key[0..32])});
    std.debug.print("     y: {s}\n", .{std.fmt.fmtSliceHexLower(public_key[32..64])});

    // Validate public key
    const is_valid_public = crypto.secp256k1.isValidPublicKey(public_key);
    std.debug.print("   Point on curve: {s}\n", .{if (is_valid_public) "✓ Yes" else "✗ No"});

    // 3. Derive Ethereum address from public key
    std.debug.print("\n3. Address Derivation\n", .{});

    // Hash public key with Keccak256
    const public_key_hash = try primitives.Hash.keccak256(allocator, &public_key);
    defer allocator.free(public_key_hash);
    std.debug.print("   Keccak256(publicKey): {s}\n", .{std.fmt.fmtSliceHexLower(public_key_hash)});

    // Take last 20 bytes as address
    const address_bytes = public_key_hash[12..32];
    var address_hex = try allocator.alloc(u8, 42);
    defer allocator.free(address_hex);
    address_hex[0] = '0';
    address_hex[1] = 'x';
    _ = std.fmt.bufPrint(address_hex[2..], "{s}", .{std.fmt.fmtSliceHexLower(address_bytes)}) catch unreachable;

    std.debug.print("   Ethereum address: {s}\n", .{address_hex});

    // 4. Demonstrate deterministic derivation
    std.debug.print("\n4. Deterministic Derivation\n", .{});
    const public_key_2 = try crypto.secp256k1.derivePublicKey(private_key);
    const keys_match = std.mem.eql(u8, &public_key, &public_key_2);
    std.debug.print("   Same private key → same public key: {s}\n", .{if (keys_match) "✓ Yes" else "✗ No"});

    // 5. Test edge cases
    std.debug.print("\n5. Edge Cases\n", .{});

    // Minimum valid private key (1)
    var min_key: [32]u8 = [_]u8{0} ** 32;
    min_key[31] = 1;
    const min_key_valid = crypto.secp256k1.isValidPrivateKey(min_key);
    std.debug.print("   Private key = 1: {s}\n", .{if (min_key_valid) "✓ Valid" else "✗ Invalid"});

    // Zero private key (invalid)
    const zero_key: [32]u8 = [_]u8{0} ** 32;
    const zero_key_valid = crypto.secp256k1.isValidPrivateKey(zero_key);
    std.debug.print("   Private key = 0: {s}\n", .{if (!zero_key_valid) "✗ Invalid (expected)" else "✓ Valid"});

    // 6. Security demonstration
    std.debug.print("\n6. One-Way Function Property\n", .{});
    std.debug.print("   Private key → Public key: ✓ Easy (elliptic curve multiplication)\n", .{});
    std.debug.print("   Public key → Private key: ✗ Infeasible (discrete log problem)\n", .{});

    // Multiple key generation
    std.debug.print("\n7. Multiple Account Generation\n", .{});
    var i: usize = 0;
    while (i < 3) : (i += 1) {
        var pk: [32]u8 = undefined;
        crypto.secp256k1.generatePrivateKey(&pk);
        const pub_key = try crypto.secp256k1.derivePublicKey(pk);
        const hash = try primitives.Hash.keccak256(allocator, &pub_key);
        defer allocator.free(hash);
        const addr_bytes = hash[12..32];

        var addr = try allocator.alloc(u8, 42);
        defer allocator.free(addr);
        addr[0] = '0';
        addr[1] = 'x';
        _ = std.fmt.bufPrint(addr[2..], "{s}", .{std.fmt.fmtSliceHexLower(addr_bytes)}) catch unreachable;

        std.debug.print("   Account {d}: {s}\n", .{ i + 1, addr });
    }

    // 8. Generator point (private key = 1)
    std.debug.print("\n8. Generator Point G (private key = 1)\n", .{});
    var private_key_one: [32]u8 = [_]u8{0} ** 32;
    private_key_one[31] = 1;
    const generator_point = try crypto.secp256k1.derivePublicKey(private_key_one);

    std.debug.print("   Gx: {s}\n", .{std.fmt.fmtSliceHexLower(generator_point[0..32])});
    std.debug.print("   Gy: {s}\n", .{std.fmt.fmtSliceHexLower(generator_point[32..64])});
    std.debug.print("   (Generator point coordinates)\n", .{});
}
