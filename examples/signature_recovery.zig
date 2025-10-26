//! Signature Recovery Workflow Example
//!
//! This example demonstrates a complete workflow for ECDSA signature operations,
//! including key generation, signing, signature recovery, and verification.
//!
//! Key Concepts:
//! - Private and public key generation
//! - Address derivation from public keys
//! - Message hashing (EIP-191 prefix)
//! - ECDSA signature creation
//! - Public key and address recovery from signatures
//! - Signature validation and verification
//! - Raw hash signing vs. message signing

const std = @import("std");
const primitives = @import("primitives");
const crypto_pkg = @import("crypto");

const Address = primitives.Address.Address;
const Crypto = crypto_pkg.Crypto;
const hash_mod = crypto_pkg.Hash;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("\n" ++ "=" ** 80 ++ "\n", .{});
    std.debug.print("  Signature Recovery Workflow\n", .{});
    std.debug.print("=" ** 80 ++ "\n\n", .{});

    std.debug.print("  WARNING: This uses UNAUDITED cryptographic implementations.\n", .{});
    std.debug.print("  DO NOT use in production without proper security audit!\n\n", .{});

    // Example 1: Generate a Private Key
    std.debug.print("1. Generating a Private Key\n", .{});
    std.debug.print("-" ** 80 ++ "\n", .{});

    // In production, use secure random generation
    // For this example, we'll use a deterministic key
    const private_key: Crypto.PrivateKey = [_]u8{
        0xac, 0x09, 0x74, 0xbe, 0xc3, 0x9a, 0x17, 0xe3,
        0x6b, 0xa4, 0xa6, 0xb4, 0xd2, 0x38, 0xff, 0x24,
        0x4e, 0x21, 0xdb, 0x63, 0x5c, 0x51, 0xcb, 0x29,
        0x36, 0x49, 0x5a, 0xf7, 0x42, 0x2f, 0xba, 0x41,
    };

    std.debug.print("  Private Key (32 bytes):\n", .{});
    std.debug.print("    0x{X}\n", .{private_key});
    std.debug.print("\n", .{});
    std.debug.print("  Private keys must be kept secret!\n", .{});
    std.debug.print("  Anyone with the private key can sign transactions and control funds.\n", .{});
    std.debug.print("\n", .{});

    // Example 2: Derive Public Key from Private Key
    std.debug.print("2. Deriving Public Key from Private Key\n", .{});
    std.debug.print("-" ** 80 ++ "\n", .{});

    const public_key = try Crypto.unaudited_getPublicKey(private_key);

    std.debug.print("  Public Key (64 bytes uncompressed):\n", .{});
    std.debug.print("    X: 0x{x:0>64}\n", .{public_key.x});
    std.debug.print("    Y: 0x{x:0>64}\n", .{public_key.y});
    std.debug.print("  Is Valid: {}\n", .{public_key.isValid()});
    std.debug.print("\n", .{});

    std.debug.print("  Public keys are derived via elliptic curve point multiplication:\n", .{});
    std.debug.print("    PublicKey = PrivateKey * G (generator point on secp256k1)\n", .{});
    std.debug.print("\n", .{});

    // Example 3: Derive Ethereum Address from Public Key
    std.debug.print("3. Deriving Ethereum Address from Public Key\n", .{});
    std.debug.print("-" ** 80 ++ "\n", .{});

    const address = public_key.toAddress();

    std.debug.print("  Address (20 bytes):\n", .{});
    std.debug.print("    0x{X}\n", .{address.bytes});
    std.debug.print("\n", .{});

    std.debug.print("  Address derivation:\n", .{});
    std.debug.print("    1. Concatenate public key X and Y coordinates (64 bytes)\n", .{});
    std.debug.print("    2. Compute keccak256 hash (32 bytes)\n", .{});
    std.debug.print("    3. Take last 20 bytes of hash\n", .{});
    std.debug.print("\n", .{});

    // Example 4: Signing a Message (EIP-191)
    std.debug.print("4. Signing a Message with EIP-191 Prefix\n", .{});
    std.debug.print("-" ** 80 ++ "\n", .{});

    const message = "Hello, Ethereum! This is a signed message.";
    std.debug.print("  Original Message:\n", .{});
    std.debug.print("    \"{s}\"\n", .{message});
    std.debug.print("\n", .{});

    // EIP-191 adds a prefix to prevent signing arbitrary transactions
    std.debug.print("  EIP-191 Prefix:\n", .{});
    std.debug.print("    \"\\x19Ethereum Signed Message:\\n<length>\"\n", .{});
    std.debug.print("\n", .{});

    const message_hash = Crypto.hashMessage(message);
    std.debug.print("  Message Hash (with prefix):\n", .{});
    std.debug.print("    0x{X}\n", .{message_hash});
    std.debug.print("\n", .{});

    // Sign the message
    const signature = try Crypto.unaudited_signMessage(message, private_key);

    std.debug.print("  Signature Components:\n", .{});
    std.debug.print("    r: 0x{x:0>64}\n", .{signature.r});
    std.debug.print("    s: 0x{x:0>64}\n", .{signature.s});
    std.debug.print("    v: {}\n", .{signature.v});
    std.debug.print("\n", .{});

    std.debug.print("  Signature Format:\n", .{});
    std.debug.print("    - r: Random point on elliptic curve (32 bytes)\n", .{});
    std.debug.print("    - s: Signature proof (32 bytes)\n", .{});
    std.debug.print("    - v: Recovery ID (1 byte, typically 27 or 28)\n", .{});
    std.debug.print("\n", .{});

    // Validate signature
    std.debug.print("  Signature Valid: {}\n", .{signature.isValid()});
    std.debug.print("\n", .{});

    // Example 5: Recover Public Key from Signature
    std.debug.print("5. Recovering Public Key from Signature\n", .{});
    std.debug.print("-" ** 80 ++ "\n", .{});

    const recovered_pubkey = try Crypto.unaudited_recoverPublicKey(message_hash, signature);

    std.debug.print("  Recovered Public Key:\n", .{});
    std.debug.print("    X: 0x{x:0>64}\n", .{recovered_pubkey.x});
    std.debug.print("    Y: 0x{x:0>64}\n", .{recovered_pubkey.y});
    std.debug.print("\n", .{});

    const pubkeys_match = recovered_pubkey.x == public_key.x and recovered_pubkey.y == public_key.y;
    std.debug.print("  Recovered Public Key Matches Original: {}\n", .{pubkeys_match});
    std.debug.print("\n", .{});

    // Example 6: Recover Address from Signature
    std.debug.print("6. Recovering Address from Signature\n", .{});
    std.debug.print("-" ** 80 ++ "\n", .{});

    const recovered_address = try Crypto.unaudited_recoverMessageAddress(message, signature);

    std.debug.print("  Original Address:  0x{X}\n", .{address.bytes});
    std.debug.print("  Recovered Address: 0x{X}\n", .{recovered_address.bytes});
    std.debug.print("\n", .{});

    const recovered_addresses_match = std.mem.eql(u8, &address.bytes, &recovered_address.bytes);
    std.debug.print("  Recovered Address Matches Original: {}\n", .{recovered_addresses_match});
    std.debug.print("\n", .{});

    std.debug.print("  This is how Ethereum verifies message signatures:\n", .{});
    std.debug.print("    1. Recover address from (message_hash, signature)\n", .{});
    std.debug.print("    2. Compare recovered address with claimed signer\n", .{});
    std.debug.print("\n", .{});

    // Example 7: Verify Signature
    std.debug.print("7. Verifying Signature\n", .{});
    std.debug.print("-" ** 80 ++ "\n", .{});

    const is_valid = try Crypto.unaudited_verifyMessage(message, signature, address);
    std.debug.print("  Signature Valid for Address: {}\n", .{is_valid});
    std.debug.print("\n", .{});

    // Try with wrong message
    const wrong_message = "This is a different message";
    const wrong_message_valid = try Crypto.unaudited_verifyMessage(wrong_message, signature, address);
    std.debug.print("  Signature Valid for Wrong Message: {}\n", .{wrong_message_valid});
    std.debug.print("\n", .{});

    // Try with wrong address
    const wrong_address = try Address.fromHex("0x0000000000000000000000000000000000000000");
    const wrong_address_valid = try Crypto.unaudited_verifyMessage(message, signature, wrong_address);
    std.debug.print("  Signature Valid for Wrong Address: {}\n", .{wrong_address_valid});
    std.debug.print("\n", .{});

    // Example 8: Signing a Raw Hash
    std.debug.print("8. Signing a Raw Hash\n", .{});
    std.debug.print("-" ** 80 ++ "\n", .{});

    std.debug.print("  Sometimes you need to sign a hash directly without EIP-191 prefix.\n", .{});
    std.debug.print("  This is common for transaction signatures.\n", .{});
    std.debug.print("\n", .{});

    const raw_data = "Some important data to hash";
    const raw_hash = hash_mod.keccak256(raw_data);

    std.debug.print("  Raw Data: \"{s}\"\n", .{raw_data});
    std.debug.print("  Raw Hash: 0x{X}\n", .{raw_hash});
    std.debug.print("\n", .{});

    const raw_signature = try Crypto.unaudited_signHash(raw_hash, private_key);

    std.debug.print("  Raw Signature:\n", .{});
    std.debug.print("    r: 0x{x:0>64}\n", .{raw_signature.r});
    std.debug.print("    s: 0x{x:0>64}\n", .{raw_signature.s});
    std.debug.print("    v: {}\n", .{raw_signature.v});
    std.debug.print("\n", .{});

    // Example 9: Recover Address from Raw Hash Signature
    std.debug.print("9. Recovering Address from Raw Hash Signature\n", .{});
    std.debug.print("-" ** 80 ++ "\n", .{});

    const raw_recovered_address = try Crypto.unaudited_recoverAddress(raw_hash, raw_signature);

    std.debug.print("  Original Address:  0x{X}\n", .{address.bytes});
    std.debug.print("  Recovered Address: 0x{X}\n", .{raw_recovered_address.bytes});
    std.debug.print("\n", .{});

    const raw_addresses_match = std.mem.eql(u8, &address.bytes, &raw_recovered_address.bytes);
    std.debug.print("  Addresses Match: {}\n", .{raw_addresses_match});
    std.debug.print("\n", .{});

    // Example 10: Signature Serialization
    std.debug.print("10. Signature Serialization\n", .{});
    std.debug.print("-" ** 80 ++ "\n", .{});

    std.debug.print("  Signatures are often serialized as 65-byte hex strings:\n", .{});
    std.debug.print("    r (32 bytes) || s (32 bytes) || v (1 byte)\n", .{});
    std.debug.print("\n", .{});

    const sig_bytes = signature.toBytes();
    std.debug.print("  Signature Bytes (65 bytes):\n", .{});
    std.debug.print("    0x{X}\n", .{sig_bytes});
    std.debug.print("\n", .{});

    const sig_hex = signature.toHex();
    std.debug.print("  Signature Hex String:\n", .{});
    std.debug.print("    {s}\n", .{sig_hex});
    std.debug.print("\n", .{});

    // Deserialize and verify
    const deserialized_sig = Crypto.Signature.fromBytes(sig_bytes);
    const sigs_match = deserialized_sig.r == signature.r and
        deserialized_sig.s == signature.s and
        deserialized_sig.v == signature.v;

    std.debug.print("  Deserialized Signature Matches: {}\n", .{sigs_match});
    std.debug.print("\n", .{});

    // Example 11: Invalid Signature Detection
    std.debug.print("11. Invalid Signature Detection\n", .{});
    std.debug.print("-" ** 80 ++ "\n", .{});

    std.debug.print("  Ethereum enforces strict signature validation:\n", .{});
    std.debug.print("\n", .{});

    // Invalid: r = 0
    const invalid_sig_r0 = Crypto.Signature{ .r = 0, .s = 0x1234, .v = 27 };
    std.debug.print("  Signature with r=0: Valid = {}\n", .{invalid_sig_r0.isValid()});

    // Invalid: s = 0
    const invalid_sig_s0 = Crypto.Signature{ .r = 0x1234, .s = 0, .v = 27 };
    std.debug.print("  Signature with s=0: Valid = {}\n", .{invalid_sig_s0.isValid()});

    // Invalid: high s value (malleability check - EIP-2)
    const secp256k1_n: u256 = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141;
    const half_n = secp256k1_n >> 1;
    const high_s = half_n + 1;
    const invalid_sig_high_s = Crypto.Signature{ .r = 0x1234, .s = high_s, .v = 27 };
    std.debug.print("  Signature with high s: Valid = {} (EIP-2 prevents malleability)\n", .{invalid_sig_high_s.isValid()});

    // Valid format
    const valid_sig_format = Crypto.Signature{
        .r = 0x4e45e16932b8af514961a1d3a1a25fdf3f4f7732e9d624c6c61548ab5fb8cd41,
        .s = 0x181522ec8eca07de4860a4acdd12909d831cc56cbbac4622082221a8768d1d09,
        .v = 27,
    };
    std.debug.print("  Valid format signature: Valid = {}\n", .{valid_sig_format.isValid()});
    std.debug.print("\n", .{});

    // Example 12: Multiple Signers
    std.debug.print("12. Multiple Signers - Different Keys, Same Message\n", .{});
    std.debug.print("-" ** 80 ++ "\n", .{});

    const signer1_key: Crypto.PrivateKey = [_]u8{0x11} ** 32;
    const signer2_key: Crypto.PrivateKey = [_]u8{0x22} ** 32;

    const shared_message = "Multisig transaction: Transfer 100 ETH";

    const sig1 = try Crypto.unaudited_signMessage(shared_message, signer1_key);
    const sig2 = try Crypto.unaudited_signMessage(shared_message, signer2_key);

    const addr1 = try Crypto.unaudited_recoverMessageAddress(shared_message, sig1);
    const addr2 = try Crypto.unaudited_recoverMessageAddress(shared_message, sig2);

    std.debug.print("  Shared Message: \"{s}\"\n", .{shared_message});
    std.debug.print("\n", .{});
    std.debug.print("  Signer 1:\n", .{});
    std.debug.print("    Address: 0x{X}\n", .{addr1.bytes});
    std.debug.print("    Signature: 0x{X}\n", .{sig1.toBytes()[0..16]});
    std.debug.print("    Valid: {}\n", .{try Crypto.unaudited_verifyMessage(shared_message, sig1, addr1)});
    std.debug.print("\n", .{});
    std.debug.print("  Signer 2:\n", .{});
    std.debug.print("    Address: 0x{X}\n", .{addr2.bytes});
    std.debug.print("    Signature: 0x{X}\n", .{sig2.toBytes()[0..16]});
    std.debug.print("    Valid: {}\n", .{try Crypto.unaudited_verifyMessage(shared_message, sig2, addr2)});
    std.debug.print("\n", .{});

    std.debug.print("  Different private keys produce different signatures\n", .{});
    std.debug.print("  for the same message.\n", .{});
    std.debug.print("\n", .{});

    std.debug.print("=" ** 80 ++ "\n", .{});
    std.debug.print("  Example Complete!\n", .{});
    std.debug.print("=" ** 80 ++ "\n\n", .{});

    std.debug.print("Key Takeaways:\n", .{});
    std.debug.print("- Private keys are 32 bytes and must be kept secret\n", .{});
    std.debug.print("- Public keys are derived via elliptic curve multiplication\n", .{});
    std.debug.print("- Addresses are last 20 bytes of keccak256(public_key)\n", .{});
    std.debug.print("- EIP-191 adds prefix to prevent transaction signature reuse\n", .{});
    std.debug.print("- Signatures contain r, s, v components (65 bytes total)\n", .{});
    std.debug.print("- Address can be recovered from (hash, signature) pair\n", .{});
    std.debug.print("- EIP-2 enforces low-s values to prevent signature malleability\n", .{});
    std.debug.print("- Message signatures use EIP-191, transaction signatures use raw hashes\n", .{});
    std.debug.print("- Signature verification = recover address and compare\n", .{});
    std.debug.print("- Always validate signature components before processing\n\n", .{});

    std.debug.print("  Remember: These implementations are UNAUDITED!\n", .{});
    std.debug.print("  Use only for education and testing.\n", .{});
}
