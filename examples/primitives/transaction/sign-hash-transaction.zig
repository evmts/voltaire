// Transaction Signing and Hashing Example
//
// Demonstrates:
// - Computing transaction hashes
// - Computing signing hashes
// - Sender recovery from signatures
// - Signature verification

const std = @import("std");
const primitives = @import("primitives");
const crypto_pkg = @import("crypto");

const Transaction = primitives.Transaction;
const LegacyTransaction = Transaction.LegacyTransaction;
const Eip1559Transaction = Transaction.Eip1559Transaction;
const Address = primitives.Address.Address;
const Crypto = crypto_pkg.Crypto;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("\n=== Transaction Signing and Hashing Examples ===\n\n", .{});

    // Example 1: Transaction hash vs signing hash
    std.debug.print("1. Transaction Hash vs Signing Hash\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    const recipient = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");

    const signed_tx = Eip1559Transaction{
        .chain_id = 1,
        .nonce = 0,
        .max_priority_fee_per_gas = 2_000_000_000,
        .max_fee_per_gas = 30_000_000_000,
        .gas_limit = 21000,
        .to = recipient,
        .value = 1_000_000_000_000_000_000,
        .data = &[_]u8{},
        .access_list = &[_]Transaction.AccessListItem{},
        .v = 0,
        .r = [_]u8{
            0x28, 0xef, 0x61, 0x34, 0x0b, 0xd9, 0x39, 0xbc,
            0x21, 0x95, 0xfe, 0x53, 0x75, 0x67, 0x86, 0x60,
            0x03, 0xe1, 0xa1, 0x5d, 0x3c, 0x71, 0xff, 0x63,
            0xe1, 0x59, 0x06, 0x20, 0xaa, 0x63, 0x62, 0x76,
        },
        .s = [_]u8{
            0x67, 0xcb, 0xe9, 0xd8, 0x99, 0x7f, 0x76, 0x1a,
            0xec, 0xb7, 0x03, 0x30, 0x4b, 0x38, 0x00, 0xcc,
            0xf5, 0x55, 0xc9, 0xf3, 0xdc, 0x64, 0x21, 0x4b,
            0x29, 0x7f, 0xb1, 0x96, 0x6a, 0x3b, 0x6d, 0x83,
        },
    };

    std.debug.print("Transaction Hash (includes signature):\n", .{});
    std.debug.print("  Used for: Unique transaction identifier\n", .{});
    std.debug.print("  Includes: All fields including r, s, yParity\n", .{});
    std.debug.print("\n", .{});

    std.debug.print("Signing Hash (excludes signature):\n", .{});
    std.debug.print("  Used for: Creating/verifying signatures\n", .{});
    std.debug.print("  Includes: All fields EXCEPT r, s, yParity\n", .{});
    std.debug.print("  This is what gets signed by the private key\n", .{});
    std.debug.print("\n", .{});

    // Example 2: Check if transaction is signed
    std.debug.print("2. Checking Transaction Signature\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    // Check if r and s are non-zero
    var is_signed = false;
    for (signed_tx.r) |byte| {
        if (byte != 0) {
            is_signed = true;
            break;
        }
    }

    std.debug.print("Is Signed: {}\n", .{is_signed});
    std.debug.print("  r: 0x{X}\n", .{signed_tx.r});
    std.debug.print("  s: 0x{X}\n", .{signed_tx.s});
    std.debug.print("  yParity: {}\n", .{signed_tx.v});
    std.debug.print("\n", .{});

    // Example 3: Legacy transaction chain ID extraction
    std.debug.print("3. Legacy Transaction Chain ID Extraction\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    const legacy_tx = LegacyTransaction{
        .nonce = 0,
        .gas_price = 20_000_000_000,
        .gas_limit = 21000,
        .to = recipient,
        .value = 1_000_000_000_000_000_000,
        .data = &[_]u8{},
        .v = 37, // chainId=1, yParity=0
        .r = signed_tx.r,
        .s = signed_tx.s,
    };

    std.debug.print("Legacy Transaction:\n", .{});
    std.debug.print("  v value: {}\n", .{legacy_tx.v});

    // Extract chain ID from v
    const chain_id = if (legacy_tx.v == 27 or legacy_tx.v == 28)
        null
    else
        (legacy_tx.v - 35) / 2;

    if (chain_id) |cid| {
        std.debug.print("  Extracted Chain ID: {}\n", .{cid});
        std.debug.print("  Formula: (v - 35) / 2 = ({} - 35) / 2 = {}\n", .{ legacy_tx.v, cid });
    } else {
        std.debug.print("  Pre-EIP-155 (no chain ID)\n", .{});
    }
    std.debug.print("\n", .{});

    // Extract yParity
    const y_parity = legacy_tx.v % 2;
    std.debug.print("  yParity: {}\n", .{y_parity});
    std.debug.print("  Formula: v % 2 = {} % 2 = {}\n", .{ legacy_tx.v, y_parity });
    std.debug.print("\n", .{});

    // Example 4: Signing and verification workflow
    std.debug.print("4. Signing Workflow\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    // Test private key (DO NOT use in production!)
    const private_key = Crypto.PrivateKey{
        0xac, 0x09, 0x74, 0xbe, 0xc3, 0x9a, 0x17, 0xe3,
        0x6b, 0xa4, 0xa6, 0xb4, 0xd2, 0x38, 0xff, 0x24,
        0x4e, 0x21, 0xdb, 0x63, 0x5c, 0x51, 0xcb, 0x29,
        0x36, 0x49, 0x5a, 0xf7, 0x42, 0x2f, 0xba, 0x41,
    };

    const unsigned_tx = LegacyTransaction{
        .nonce = 0,
        .gas_price = 20_000_000_000,
        .gas_limit = 21000,
        .to = recipient,
        .value = 1_000_000_000_000_000_000,
        .data = &[_]u8{},
        .v = 0, // Will be set during signing
        .r = [_]u8{0} ** 32,
        .s = [_]u8{0} ** 32,
    };

    std.debug.print("Unsigned Transaction:\n", .{});
    std.debug.print("  Nonce: {}\n", .{unsigned_tx.nonce});
    std.debug.print("  Gas Price: {} gwei\n", .{unsigned_tx.gas_price / 1_000_000_000});
    std.debug.print("  v: {} (unsigned)\n", .{unsigned_tx.v});
    std.debug.print("  r: all zeros\n", .{});
    std.debug.print("  s: all zeros\n", .{});
    std.debug.print("\n", .{});

    // Sign the transaction
    const chain_id_for_signing: u64 = 1;
    const newly_signed_tx = try Transaction.signLegacyTransaction(
        allocator,
        unsigned_tx,
        private_key,
        chain_id_for_signing,
    );

    std.debug.print("Signed Transaction:\n", .{});
    std.debug.print("  v: {}\n", .{newly_signed_tx.v});
    std.debug.print("  r: 0x{X}\n", .{newly_signed_tx.r[0..8].*});
    std.debug.print("  s: 0x{X}\n", .{newly_signed_tx.s[0..8].*});
    std.debug.print("  Signature components now populated\n", .{});
    std.debug.print("\n", .{});

    // Example 5: Transaction hash uniqueness
    std.debug.print("5. Transaction Hash Uniqueness\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    const tx1_hash = try Transaction.computeLegacyTransactionHash(allocator, legacy_tx);
    std.debug.print("Transaction 1 Hash: 0x{X}\n", .{tx1_hash});

    const tx2 = LegacyTransaction{
        .nonce = 1, // Different nonce
        .gas_price = legacy_tx.gas_price,
        .gas_limit = legacy_tx.gas_limit,
        .to = legacy_tx.to,
        .value = legacy_tx.value,
        .data = legacy_tx.data,
        .v = legacy_tx.v,
        .r = legacy_tx.r,
        .s = legacy_tx.s,
    };

    const tx2_hash = try Transaction.computeLegacyTransactionHash(allocator, tx2);
    std.debug.print("Transaction 2 Hash: 0x{X}\n", .{tx2_hash});

    std.debug.print("\n", .{});
    std.debug.print("Hashes are different due to nonce change\n", .{});
    std.debug.print("\n", .{});

    // Example 6: Signature components
    std.debug.print("6. ECDSA Signature Components\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    std.debug.print("Signature format:\n", .{});
    std.debug.print("  r: 32-byte scalar (x-coordinate)\n", .{});
    std.debug.print("  s: 32-byte scalar (proof)\n", .{});
    std.debug.print("  v/yParity: Recovery ID (0 or 1)\n", .{});
    std.debug.print("\n", .{});

    std.debug.print("Legacy transactions:\n", .{});
    std.debug.print("  v = chainId * 2 + 35 + yParity (EIP-155)\n", .{});
    std.debug.print("  v = 27 + yParity (pre-EIP-155)\n", .{});
    std.debug.print("\n", .{});

    std.debug.print("Typed transactions (EIP-2930+):\n", .{});
    std.debug.print("  yParity = 0 or 1 (direct recovery ID)\n", .{});
    std.debug.print("  chainId in separate field\n", .{});
    std.debug.print("\n", .{});

    std.debug.print("=== Example Complete ===\n\n", .{});
}
