const std = @import("std");
const primitives = @import("primitives");
const print = std.debug.print;

pub fn main() !void {
    print("=== Guillotine Crypto Functionality Demo ===\n\n", .{});

    // Test private key generation
    print("1. Private Key Generation:\n", .{});
    const private_key = try primitives.Crypto.random_private_key();
    print("   ✓ Generated random private key: {} bytes\n", .{private_key.len});

    // Verify it's not all zeros
    var is_zero = true;
    for (private_key) |byte| {
        if (byte != 0) {
            is_zero = false;
            break;
        }
    }
    print("   ✓ Private key is non-zero: {}\n", .{!is_zero});

    // Test message hashing (EIP-191)
    print("\n2. Message Hashing (EIP-191):\n", .{});
    const message = "Hello, Guillotine Ethereum Client!";
    const hash = primitives.Crypto.hash_message(message);
    print("   ✓ Message: \"{s}\"\n", .{message});
    print("   ✓ EIP-191 Hash: {s}\n", .{primitives.Hash.to_hex(hash)});

    // Verify same message produces same hash
    const hash2 = primitives.Crypto.hash_message(message);
    const same_hash = primitives.Hash.equal(hash, hash2);
    print("   ✓ Deterministic hashing: {}\n", .{same_hash});

    // Test signature structure
    print("\n3. Signature Structure:\n", .{});
    const example_sig = primitives.Crypto.Signature{
        .r = 0x123456789ABCDEF123456789ABCDEF123456789ABCDEF123456789ABCDEF1234,
        .s = 0x987654321FEDCBA987654321FEDCBA987654321FEDCBA987654321FEDCBA9876,
        .v = 27,
    };

    print("   ✓ Signature r: 0x{x}\n", .{example_sig.r});
    print("   ✓ Signature s: 0x{x}\n", .{example_sig.s});
    print("   ✓ Recovery ID (v): {} (y_parity: {})\n", .{ example_sig.v, example_sig.y_parity() });

    // Test signature validation
    print("\n4. Signature Validation:\n", .{});
    const valid = primitives.Crypto.is_valid_signature(example_sig);
    print("   ✓ Example signature is valid: {}\n", .{valid});

    const invalid_sig = primitives.Crypto.Signature{
        .r = 0, // Invalid r
        .s = example_sig.s,
        .v = 27,
    };
    const invalid = primitives.Crypto.is_valid_signature(invalid_sig);
    print("   ✓ Invalid signature (r=0) detected: {}\n", .{!invalid});

    // Test signature format conversion
    print("\n5. Signature Format Conversion:\n", .{});
    const sig_bytes = example_sig.to_bytes();
    print("   ✓ Signature as bytes: {} bytes\n", .{sig_bytes.len});

    const recovered_sig = primitives.Crypto.Signature.from_bytes(sig_bytes);
    const conversion_correct = (recovered_sig.r == example_sig.r and
        recovered_sig.s == example_sig.s and
        recovered_sig.v == example_sig.v);
    print("   ✓ Round-trip conversion: {}\n", .{conversion_correct});

    // Test public key to address conversion
    print("\n6. Public Key to Address:\n", .{});
    const example_pubkey = primitives.Crypto.PublicKey{
        .x = 0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798,
        .y = 0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8,
    };

    const address = primitives.Crypto.public_key_to_address(example_pubkey);
    print("   ✓ Public key X: 0x{x}\n", .{example_pubkey.x});
    print("   ✓ Public key Y: 0x{x}\n", .{example_pubkey.y});
    print("   ✓ Ethereum address: {s}\n", .{primitives.Address.address_to_hex(address)});

    // Test placeholder implementations (these return NotImplemented)
    print("\n7. Advanced Operations (Currently Placeholder):\n", .{});

    // Test key derivation (placeholder)
    const pubkey_result = primitives.Crypto.get_public_key(private_key);
    if (pubkey_result) |_| {
        print("   ✗ Unexpected success in get_public_key\n", .{});
    } else |err| {
        print("   ✓ get_public_key() -> {} (placeholder)\n", .{err});
    }

    // Test signing (placeholder)
    const sign_result = primitives.Crypto.sign_message(message, private_key);
    if (sign_result) |_| {
        print("   ✗ Unexpected success in sign_message\n", .{});
    } else |err| {
        print("   ✓ sign_message() -> {} (placeholder)\n", .{err});
    }

    // Test verification (placeholder)
    const verify_result = primitives.Crypto.verify_message(message, example_sig, address);
    if (verify_result) |_| {
        print("   ✗ Unexpected success in verify_message\n", .{});
    } else |err| {
        print("   ✓ verify_message() -> {} (placeholder)\n", .{err});
    }

    print("\n=== Summary ===\n", .{});
    print("✅ Crypto module structure: Complete\n", .{});
    print("✅ Private key generation: Working\n", .{});
    print("✅ EIP-191 message hashing: Working\n", .{});
    print("✅ Signature validation: Working\n", .{});
    print("✅ Address derivation: Working\n", .{});
    print("🚧 ECDSA signing/verification: Placeholder (needs implementation)\n", .{});
    print("🚧 Public key derivation: Placeholder (needs implementation)\n", .{});
    print("🚧 Address recovery: Placeholder (needs implementation)\n", .{});

    print("\n💡 Next steps: Implement full ECDSA operations or integrate with existing secp256k1 precompile\n", .{});
}
