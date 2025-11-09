/// Public key recovery and address derivation
///
/// Demonstrates:
/// - Recovering public key from signature (ecRecover)
/// - Deriving Ethereum address from public key
/// - Verifying recovered address matches signer
/// - Critical role of recovery ID (v value)

const std = @import("std");
const crypto = @import("crypto");
const primitives = @import("primitives");

fn deriveAddress(allocator: std.mem.Allocator, public_key: [64]u8) ![]const u8 {
    // Hash public key with Keccak256
    const hash = try primitives.Hash.keccak256(allocator, &public_key);
    defer allocator.free(hash);

    // Take last 20 bytes as address
    const address_bytes = hash[12..32];

    // Format as hex string with 0x prefix
    var hex_addr = try allocator.alloc(u8, 42);
    hex_addr[0] = '0';
    hex_addr[1] = 'x';
    _ = std.fmt.bufPrint(hex_addr[2..], "{s}", .{std.fmt.fmtSliceHexLower(address_bytes)}) catch unreachable;

    return hex_addr;
}

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    // Generate keypair
    var private_key: [32]u8 = undefined;
    crypto.secp256k1.generatePrivateKey(&private_key);
    const public_key = try crypto.secp256k1.derivePublicKey(private_key);

    const signer_address = try deriveAddress(allocator, public_key);
    defer allocator.free(signer_address);

    std.debug.print("=== Public Key Recovery ===\n\n", .{});
    std.debug.print("Signer address: {s}\n", .{signer_address});

    // Sign a message
    const message = "Authenticate me!";
    const message_hash = try primitives.Hash.keccak256String(allocator, message);
    defer allocator.free(message_hash);

    const signature = try crypto.secp256k1.sign(message_hash[0..32].*, private_key);

    std.debug.print("\nMessage: {s}\n", .{message});
    std.debug.print("Signature v: {d}\n", .{signature.v});

    // Recover public key from signature
    const recovered_key = try crypto.secp256k1.recoverPublicKey(signature, message_hash[0..32].*);

    std.debug.print("\n=== Recovery ===\n", .{});
    std.debug.print("Public key recovered: ✓ Yes\n", .{});

    // Verify recovered key matches original
    const keys_match = std.mem.eql(u8, &recovered_key, &public_key);
    std.debug.print("Recovered key matches original: {s}\n", .{if (keys_match) "✓ Yes" else "✗ No"});

    // Derive address from recovered key
    const recovered_address = try deriveAddress(allocator, recovered_key);
    defer allocator.free(recovered_address);

    std.debug.print("Recovered address: {s}\n", .{recovered_address});
    std.debug.print("Addresses match: {s}\n", .{if (std.mem.eql(u8, recovered_address, signer_address)) "✓ Yes" else "✗ No"});

    // Demonstrate importance of v value
    std.debug.print("\n=== Recovery ID (v) Importance ===\n\n", .{});

    // Correct v value
    std.debug.print("Correct v ({d}):\n", .{signature.v});
    const correct_address = try deriveAddress(allocator, recovered_key);
    defer allocator.free(correct_address);
    std.debug.print("  Recovered address: {s}\n", .{correct_address});
    std.debug.print("  Matches signer: {s}\n", .{if (std.mem.eql(u8, correct_address, signer_address)) "✓ Yes" else "✗ No"});

    // Wrong v value (flip between 27 and 28)
    const wrong_v: u8 = if (signature.v == 27) 28 else 27;
    var wrong_sig = signature;
    wrong_sig.v = wrong_v;
    const recovered_wrong = try crypto.secp256k1.recoverPublicKey(wrong_sig, message_hash[0..32].*);
    const wrong_address = try deriveAddress(allocator, recovered_wrong);
    defer allocator.free(wrong_address);

    std.debug.print("\nWrong v ({d}):\n", .{wrong_v});
    std.debug.print("  Recovered address: {s}\n", .{wrong_address});
    std.debug.print("  Matches signer: {s}\n", .{if (std.mem.eql(u8, wrong_address, signer_address)) "✓ Yes (unexpected!)" else "✗ No (expected)"});

    std.debug.print("\nConclusion: Recovery ID (v) is critical for correct recovery!\n", .{});
}
