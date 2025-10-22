//! ECDSA Signature Operations Example
//!
//! This example demonstrates how to use secp256k1 ECDSA cryptographic operations
//! including key generation, signing, signature verification, and address recovery.
//!
//! ⚠️ WARNING: These functions are UNAUDITED and NOT suitable for production use!
//! All crypto operations in this example use custom implementations that have not
//! been security audited. Use only for educational and testing purposes.

const std = @import("std");
const crypto_mod = @import("crypto");
const crypto = crypto_mod.Crypto;
const primitives = @import("primitives");

pub fn main() !void {
    std.debug.print("\n========================================\n", .{});
    std.debug.print("  ECDSA Signature Operations Example\n", .{});
    std.debug.print("========================================\n\n", .{});

    std.debug.print("⚠️  WARNING: UNAUDITED CRYPTO IMPLEMENTATION\n", .{});
    std.debug.print("These functions have NOT been security audited.\n", .{});
    std.debug.print("DO NOT use in production systems!\n\n", .{});

    // Example 1: Generate a private key
    std.debug.print("1. Generating Private Key\n", .{});
    std.debug.print("   -------------------------\n", .{});
    const private_key = try crypto.unaudited_randomPrivateKey();
    std.debug.print("   Private Key: 0x", .{});
    for (private_key) |byte| {
        std.debug.print("{x:0>2}", .{byte});
    }
    std.debug.print("\n\n", .{});

    // Example 2: Derive public key from private key
    std.debug.print("2. Deriving Public Key from Private Key\n", .{});
    std.debug.print("   -------------------------------------\n", .{});
    const public_key = try crypto.unaudited_getPublicKey(private_key);
    std.debug.print("   Public Key X: 0x{x:0>64}\n", .{public_key.x});
    std.debug.print("   Public Key Y: 0x{x:0>64}\n", .{public_key.y});
    std.debug.print("   Valid: {}\n\n", .{public_key.isValid()});

    // Example 3: Derive Ethereum address from public key
    std.debug.print("3. Deriving Ethereum Address\n", .{});
    std.debug.print("   --------------------------\n", .{});
    const address = public_key.to_address();
    std.debug.print("   Address: 0x", .{});
    for (address.bytes) |byte| {
        std.debug.print("{x:0>2}", .{byte});
    }
    std.debug.print("\n\n", .{});

    // Example 4: Sign a message
    std.debug.print("4. Signing a Message\n", .{});
    std.debug.print("   ------------------\n", .{});
    const message = "Hello, Ethereum!";
    std.debug.print("   Message: \"{s}\"\n", .{message});

    const signature = try crypto.unaudited_signMessage(message, private_key);
    std.debug.print("   Signature:\n", .{});
    std.debug.print("     r: 0x{x:0>64}\n", .{signature.r});
    std.debug.print("     s: 0x{x:0>64}\n", .{signature.s});
    std.debug.print("     v: {d}\n", .{signature.v});
    std.debug.print("   Valid: {}\n\n", .{signature.isValid()});

    // Example 5: Recover address from signature
    std.debug.print("5. Recovering Address from Signature\n", .{});
    std.debug.print("   -----------------------------------\n", .{});
    const recovered_address = try crypto.unaudited_recoverMessageAddress(message, signature);
    std.debug.print("   Recovered Address: 0x", .{});
    for (recovered_address.bytes) |byte| {
        std.debug.print("{x:0>2}", .{byte});
    }
    std.debug.print("\n", .{});

    // Verify the recovered address matches the original
    const addresses_match = std.mem.eql(u8, &address.bytes, &recovered_address.bytes);
    std.debug.print("   Matches Original: {}\n\n", .{addresses_match});

    // Example 6: Verify signature
    std.debug.print("6. Verifying Signature\n", .{});
    std.debug.print("   --------------------\n", .{});
    const is_valid = try crypto.unaudited_verifyMessage(message, signature, address);
    std.debug.print("   Signature Valid: {}\n", .{is_valid});

    // Test with wrong message
    const wrong_message = "Wrong message";
    const is_valid_wrong = try crypto.unaudited_verifyMessage(wrong_message, signature, address);
    std.debug.print("   Wrong Message Valid: {}\n\n", .{is_valid_wrong});

    // Example 7: Sign a raw hash
    std.debug.print("7. Signing a Raw Hash\n", .{});
    std.debug.print("   --------------------\n", .{});
    const data = "Some data to hash";
    const hash = crypto_mod.Hash.keccak256(data);
    std.debug.print("   Data: \"{s}\"\n", .{data});
    std.debug.print("   Hash: 0x", .{});
    for (hash) |byte| {
        std.debug.print("{x:0>2}", .{byte});
    }
    std.debug.print("\n", .{});

    const hash_signature = try crypto.unaudited_signHash(hash, private_key);
    std.debug.print("   Signature:\n", .{});
    std.debug.print("     r: 0x{x:0>64}\n", .{hash_signature.r});
    std.debug.print("     s: 0x{x:0>64}\n", .{hash_signature.s});
    std.debug.print("     v: {d}\n\n", .{hash_signature.v});

    // Example 8: Recover address from hash signature
    std.debug.print("8. Recovering Address from Hash Signature\n", .{});
    std.debug.print("   ----------------------------------------\n", .{});
    const hash_recovered_address = try crypto.unaudited_recoverAddress(hash, hash_signature);
    std.debug.print("   Recovered Address: 0x", .{});
    for (hash_recovered_address.bytes) |byte| {
        std.debug.print("{x:0>2}", .{byte});
    }
    std.debug.print("\n", .{});

    const hash_addresses_match = std.mem.eql(u8, &address.bytes, &hash_recovered_address.bytes);
    std.debug.print("   Matches Original: {}\n\n", .{hash_addresses_match});

    // Example 9: Demonstrate signature serialization
    std.debug.print("9. Signature Serialization\n", .{});
    std.debug.print("   ------------------------\n", .{});
    const signature_bytes = signature.to_bytes();
    std.debug.print("   Signature Bytes (65 bytes): 0x", .{});
    for (signature_bytes) |byte| {
        std.debug.print("{x:0>2}", .{byte});
    }
    std.debug.print("\n", .{});

    const signature_hex = signature.to_hex();
    std.debug.print("   Signature Hex: {s}\n", .{signature_hex});

    // Deserialize and verify it matches
    const deserialized = crypto.Signature.from_bytes(signature_bytes);
    const sigs_match = deserialized.r == signature.r and
        deserialized.s == signature.s and
        deserialized.v == signature.v;
    std.debug.print("   Deserialization Matches: {}\n\n", .{sigs_match});

    // Example 10: Demonstrate invalid signature detection
    std.debug.print("10. Invalid Signature Detection\n", .{});
    std.debug.print("    -----------------------------\n", .{});

    // Invalid signature with r = 0
    const invalid_sig1 = crypto.Signature{ .r = 0, .s = 0x1234, .v = 27 };
    std.debug.print("    Signature with r=0: Valid = {}\n", .{invalid_sig1.isValid()});

    // Invalid signature with s = 0
    const invalid_sig2 = crypto.Signature{ .r = 0x1234, .s = 0, .v = 27 };
    std.debug.print("    Signature with s=0: Valid = {}\n", .{invalid_sig2.isValid()});

    // Invalid signature with high s value (malleability check)
    const invalid_sig3 = crypto.Signature{
        .r = 0x1234,
        .s = crypto.SECP256K1_N - 1, // Near curve order (high s)
        .v = 27,
    };
    std.debug.print("    Signature with high s: Valid = {}\n", .{invalid_sig3.isValid()});

    // Valid signature format (may not recover an address but format is valid)
    const valid_format = crypto.Signature{
        .r = 0x4e45e16932b8af514961a1d3a1a25fdf3f4f7732e9d624c6c61548ab5fb8cd41,
        .s = 0x181522ec8eca07de4860a4acdd12909d831cc56cbbac4622082221a8768d1d09,
        .v = 27,
    };
    std.debug.print("    Valid format signature: Valid = {}\n\n", .{valid_format.isValid()});

    std.debug.print("========================================\n", .{});
    std.debug.print("  Example Complete!\n", .{});
    std.debug.print("========================================\n\n", .{});

    std.debug.print("Key Takeaways:\n", .{});
    std.debug.print("- Private keys are 32 bytes of random data\n", .{});
    std.debug.print("- Public keys are derived via elliptic curve point multiplication\n", .{});
    std.debug.print("- Addresses are the last 20 bytes of keccak256(public_key)\n", .{});
    std.debug.print("- Signatures contain r, s, and v components\n", .{});
    std.debug.print("- Ethereum enforces low-s values to prevent malleability\n", .{});
    std.debug.print("- Messages are prefixed with '\\x19Ethereum Signed Message:\\n' + length\n", .{});
    std.debug.print("- Signatures can be used to recover the signer's address\n\n", .{});

    std.debug.print("⚠️  Remember: These implementations are UNAUDITED!\n", .{});
    std.debug.print("   Never use in production without proper security audit.\n", .{});
}
