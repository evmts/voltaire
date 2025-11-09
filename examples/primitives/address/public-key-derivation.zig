const std = @import("std");
const primitives = @import("primitives");
const Address = primitives.address.Address;
const Bytes = primitives.bytes.Bytes;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const a = gpa.allocator();

    std.debug.print("\n=== Public Key to Address Derivation ===\n\n", .{});

    // 1. Deriving address from public key coordinates
    std.debug.print("1. Address from Public Key Coordinates\n\n", .{});

    // secp256k1 public key coordinates (256 bits each)
    const public_key_x: u256 = 0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75;
    const public_key_y: u256 = 0x3547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5;

    std.debug.print("Public key coordinates:\n", .{});
    std.debug.print("  x: 0x{x}\n", .{public_key_x});
    std.debug.print("  y: 0x{x}\n", .{public_key_y});
    std.debug.print("\n", .{});

    // Derive address from public key
    const addr_from_pubkey = Address.fromPublicKey(public_key_x, public_key_y);
    const pubkey_hex = Address.toChecksummed(addr_from_pubkey);
    std.debug.print("Derived address: {s}\n\n", .{&pubkey_hex});

    // Explanation of the process
    std.debug.print("Derivation process:\n", .{});
    std.debug.print("1. Concatenate x and y coordinates (64 bytes total)\n", .{});
    std.debug.print("2. Hash with keccak256 → 32 bytes\n", .{});
    std.debug.print("3. Take last 20 bytes → Ethereum address\n", .{});
    std.debug.print("\n", .{});

    // 2. Deriving address from private key
    std.debug.print("2. Address from Private Key\n\n", .{});

    // Private key (32 bytes) - DO NOT use this in production!
    const private_key_hex = "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    const private_key = try Bytes.fromHex(a, private_key_hex);
    defer a.free(private_key);

    std.debug.print("Private key: {s}\n", .{private_key_hex});

    // Derive address from private key
    const addr_from_privkey = try Address.fromPrivateKey(private_key);
    const privkey_hex = Address.toChecksummed(addr_from_privkey);
    std.debug.print("Derived address: {s}\n\n", .{&privkey_hex});

    std.debug.print("Derivation process:\n", .{});
    std.debug.print("1. Multiply private key by secp256k1 generator point → public key (x, y)\n", .{});
    std.debug.print("2. Concatenate x and y (64 bytes)\n", .{});
    std.debug.print("3. Hash with keccak256 → 32 bytes\n", .{});
    std.debug.print("4. Take last 20 bytes → Ethereum address\n", .{});
    std.debug.print("\n", .{});

    // 3. Multiple addresses from different keys
    std.debug.print("3. Multiple Addresses from Different Keys\n\n", .{});

    const TestKey = struct {
        name: []const u8,
        private_key: []const u8,
        expected_addr: []const u8,
    };

    // Example known test keys (from hardhat/foundry)
    const test_keys = [_]TestKey{
        .{
            .name = "Test Account 1",
            .private_key = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
            .expected_addr = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        },
        .{
            .name = "Test Account 2",
            .private_key = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
            .expected_addr = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        },
    };

    for (test_keys) |test_key| {
        std.debug.print("{s}:\n", .{test_key.name});

        const pk = try Bytes.fromHex(a, test_key.private_key);
        defer a.free(pk);

        const derived = try Address.fromPrivateKey(pk);
        const expected = try Address.fromHex(test_key.expected_addr);

        const derived_hex = Address.toChecksummed(derived);
        const expected_hex = Address.toChecksummed(expected);

        std.debug.print("  Private key: {s}\n", .{test_key.private_key});
        std.debug.print("  Derived:     {s}\n", .{&derived_hex});
        std.debug.print("  Expected:    {s}\n", .{&expected_hex});
        std.debug.print("  Match: {s}\n\n", .{if (Address.equals(derived, expected)) "✓" else "✗"});
    }

    // 4. Verifying address ownership
    std.debug.print("4. Verifying Address Ownership\n\n", .{});

    const my_address = try Address.fromHex("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
    const my_private_key = try Bytes.fromHex(a, "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");
    defer a.free(my_private_key);

    const wrong_private_key = try Bytes.fromHex(a, "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef");
    defer a.free(wrong_private_key);

    const derived_correct = try Address.fromPrivateKey(my_private_key);
    const derived_wrong = try Address.fromPrivateKey(wrong_private_key);

    const my_hex = Address.toChecksummed(my_address);
    std.debug.print("Address: {s}\n", .{&my_hex});
    std.debug.print("Can sign with correct key: {}\n", .{Address.equals(my_address, derived_correct)});
    std.debug.print("Can sign with wrong key: {}\n\n", .{Address.equals(my_address, derived_wrong)});

    // 5. Understanding the security model
    std.debug.print("5. Security Model\n\n", .{});

    std.debug.print("Key relationships:\n", .{});
    std.debug.print("├─ Private key (32 bytes) - SECRET, never share\n", .{});
    std.debug.print("│  └─ Used to derive public key via secp256k1\n", .{});
    std.debug.print("│\n", .{});
    std.debug.print("├─ Public key (64 bytes: x, y coordinates) - Safe to share\n", .{});
    std.debug.print("│  └─ Used to derive address via keccak256\n", .{});
    std.debug.print("│\n", .{});
    std.debug.print("└─ Address (20 bytes) - Public identifier\n", .{});
    std.debug.print("\n", .{});

    std.debug.print("Security properties:\n", .{});
    std.debug.print("✓ Cannot derive private key from public key (ECDLP hard problem)\n", .{});
    std.debug.print("✓ Cannot derive public key from address (one-way hash)\n", .{});
    std.debug.print("✓ Can verify signatures using public key\n", .{});
    std.debug.print("✓ Can create signatures using private key\n", .{});
    std.debug.print("\n", .{});

    // 6. Common patterns
    std.debug.print("6. Common Patterns\n\n", .{});

    std.debug.print("Pattern 1: Generate wallet from seed/mnemonic\n", .{});
    std.debug.print("  1. Derive private key from mnemonic (BIP-32/BIP-44)\n", .{});
    std.debug.print("  2. Derive address from private key\n", .{});
    std.debug.print("  3. Store only mnemonic, derive keys as needed\n", .{});
    std.debug.print("\n", .{});

    std.debug.print("Pattern 2: Import wallet from private key\n", .{});
    std.debug.print("  1. User provides private key\n", .{});
    std.debug.print("  2. Derive address for display\n", .{});
    std.debug.print("  3. Verify it matches expected address\n", .{});
    std.debug.print("\n", .{});

    std.debug.print("Pattern 3: Watch-only wallet (no private key)\n", .{});
    std.debug.print("  1. User provides address only\n", .{});
    std.debug.print("  2. Can view balances/transactions\n", .{});
    std.debug.print("  3. Cannot sign transactions\n", .{});
}
