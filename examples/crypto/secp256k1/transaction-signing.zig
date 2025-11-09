/// Transaction signing and verification
///
/// Demonstrates:
/// - Legacy transaction signing (pre-EIP-1559)
/// - EIP-155 replay protection
/// - Transaction hash computation
/// - Sender recovery from transaction signature
/// - Transaction verification

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

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("=== Transaction Signing ===\n\n", .{});

    // Generate keypair
    var private_key: [32]u8 = undefined;
    crypto.secp256k1.generatePrivateKey(&private_key);
    const public_key = try crypto.secp256k1.derivePublicKey(private_key);
    const signer_address = try deriveAddress(allocator, public_key);
    defer allocator.free(signer_address);

    std.debug.print("Signer address: {s}\n", .{signer_address});

    // Create unsigned transaction
    const nonce: u64 = 5;
    const gas_price: u64 = 20_000_000_000; // 20 Gwei
    const gas_limit: u64 = 21_000;
    const to = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";
    const value: u128 = 1_000_000_000_000_000_000; // 1 ETH
    const chain_id: u64 = 1; // Mainnet

    std.debug.print("\n=== Unsigned Transaction ===\n", .{});
    std.debug.print("  Nonce: {d}\n", .{nonce});
    std.debug.print("  Gas Price: {d} wei (20 Gwei)\n", .{gas_price});
    std.debug.print("  Gas Limit: {d}\n", .{gas_limit});
    std.debug.print("  To: {s}\n", .{to});
    std.debug.print("  Value: {d} wei (1 ETH)\n", .{value});
    std.debug.print("  Data: 0x\n", .{});
    std.debug.print("  Chain ID: {d} (Mainnet)\n", .{chain_id});

    // For simplicity, create a simple message hash representing the transaction
    // In production, you would RLP encode: [nonce, gasPrice, gasLimit, to, value, data, chainId, 0, 0]
    const tx_data = try std.fmt.allocPrint(
        allocator,
        "nonce={d},gasPrice={d},gasLimit={d},to={s},value={d},chainId={d}",
        .{ nonce, gas_price, gas_limit, to, value, chain_id },
    );
    defer allocator.free(tx_data);

    const tx_hash = try primitives.Hash.keccak256(allocator, tx_data);
    defer allocator.free(tx_hash);

    std.debug.print("\nTransaction hash: {s}\n", .{std.fmt.fmtSliceHexLower(tx_hash)});

    // Sign transaction
    const signature = try crypto.secp256k1.sign(tx_hash[0..32].*, private_key);

    std.debug.print("\n=== Signature ===\n", .{});
    std.debug.print("  r: {s}\n", .{std.fmt.fmtSliceHexLower(&signature.r)});
    std.debug.print("  s: {s}\n", .{std.fmt.fmtSliceHexLower(&signature.s)});
    std.debug.print("  v (raw): {d}\n", .{signature.v});

    // Apply EIP-155 v value: v = chainId * 2 + 35 + recovery_id
    const recovery_id: u64 = signature.v - 27;
    const eip155_v = chain_id * 2 + 35 + recovery_id;
    std.debug.print("  v (EIP-155): {d} (with chain ID)\n", .{eip155_v});

    std.debug.print("\n=== Signed Transaction ===\n", .{});
    std.debug.print("Transaction is now ready for broadcast\n", .{});

    // Verify signature by recovering sender
    std.debug.print("\n=== Sender Recovery ===\n", .{});

    const recovered_public_key = try crypto.secp256k1.recoverPublicKey(signature, tx_hash[0..32].*);
    const recovered_address = try deriveAddress(allocator, recovered_public_key);
    defer allocator.free(recovered_address);

    std.debug.print("Recovered address: {s}\n", .{recovered_address});
    std.debug.print("Matches signer: {s}\n", .{if (std.mem.eql(u8, recovered_address, signer_address)) "✓ Yes" else "✗ No"});

    // Demonstrate EIP-155 replay protection
    std.debug.print("\n=== EIP-155 Replay Protection ===\n", .{});

    const mainnet_v = 1 * 2 + 35 + recovery_id; // Chain ID 1
    const sepolia_v = 11155111 * 2 + 35 + recovery_id; // Chain ID 11155111

    std.debug.print("Same signature, different chains:\n", .{});
    std.debug.print("  Mainnet v: {d}\n", .{mainnet_v});
    std.debug.print("  Sepolia v: {d}\n", .{sepolia_v});
    std.debug.print("Different v values prevent replay attacks across chains\n", .{});

    // Demonstrate pre-EIP-155 (legacy)
    std.debug.print("\n=== Pre-EIP-155 (Legacy) ===\n", .{});
    std.debug.print("Legacy v: {d} (no chain ID protection)\n", .{signature.v});
    std.debug.print("Vulnerable to replay attacks across chains\n", .{});
}
