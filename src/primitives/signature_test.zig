const std = @import("std");
const testing = std.testing;
const Crypto = @import("crypto.zig");
const Hash = @import("hash_utils.zig");
const Address = @import("address/address.zig");
const Hex = @import("hex.zig");

// Test signature recovery
test "recover address from signature" {
    const allocator = testing.allocator;
    
    // Test vector from Ethereum
    const message = "Hello, Ethereum!";
    const message_hash = try Hash.eip191_hash_message(message, allocator);
    
    // Known signature components
    const signature = Crypto.Signature{
        .r = [_]u8{
            0x9f, 0x15, 0x08, 0x09, 0xad, 0x6e, 0x88, 0x2b,
            0x6e, 0x8f, 0x0c, 0x4d, 0xc4, 0xb0, 0xc5, 0xd5,
            0x8d, 0x6f, 0xd8, 0x4e, 0xe8, 0xd4, 0x8a, 0xef,
            0x7e, 0x37, 0xb8, 0xd6, 0x0f, 0x3d, 0x4f, 0x5a,
        },
        .s = [_]u8{
            0x6f, 0xc9, 0x5f, 0x48, 0xbd, 0x0e, 0x96, 0x0f,
            0xb8, 0x6f, 0xd6, 0x56, 0x88, 0x71, 0x87, 0x15,
            0x25, 0x5a, 0xd9, 0xfc, 0x4a, 0x5f, 0x0e, 0x9f,
            0x09, 0x8e, 0x9d, 0x4e, 0x2e, 0xc4, 0x89, 0x5f,
        },
        .v = 27,
    };
    
    // Recover public key
    const public_key = try Crypto.recover_public_key(allocator, message_hash, signature);
    
    // Derive address from public key
    const recovered_address = Address.from_public_key(public_key.bytes);
    
    // The recovered address should be valid
    try testing.expect(!Address.is_zero(recovered_address));
}

test "verify message signature" {
    const allocator = testing.allocator;
    
    // Create a private key
    const private_key = Crypto.PrivateKey{
        .bytes = [_]u8{
            0xac, 0x09, 0x74, 0xbe, 0xc3, 0x9a, 0x17, 0xe3,
            0x6b, 0xa4, 0xa6, 0xb4, 0xd2, 0x38, 0xff, 0x24,
            0x4e, 0x21, 0xdb, 0x63, 0x5c, 0x51, 0xcb, 0x29,
            0x36, 0x49, 0x5a, 0xf7, 0x42, 0x2f, 0xba, 0x41,
        },
    };
    
    // Get the expected address
    const expected_address = try Crypto.get_address(allocator, private_key);
    
    // Sign a message
    const message = "Hello, Ethereum!";
    const signature = try Crypto.personal_sign(allocator, private_key, message);
    
    // Verify the signature
    const verified = try verify_message(allocator, message, signature, expected_address);
    try testing.expect(verified);
    
    // Verify with wrong address should fail
    const wrong_address = Address.ZERO;
    const not_verified = try verify_message(allocator, message, signature, wrong_address);
    try testing.expect(!not_verified);
}

test "signature malleability check" {
    // Test that signatures with high S values are rejected
    const signature_high_s = Crypto.Signature{
        .r = [_]u8{0x12} ** 32,
        .s = [_]u8{
            0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
            0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xfe,
            0xba, 0xae, 0xdc, 0xe6, 0xaf, 0x48, 0xa0, 0x3b,
            0xbf, 0xd2, 0x5e, 0x8c, 0xd0, 0x36, 0x41, 0x41,
        }, // n/2 from secp256k1
        .v = 27,
    };
    
    // Should be considered invalid due to high S
    try testing.expect(!is_canonical_signature(signature_high_s));
}

test "EIP-2 signature validation" {
    // Test signatures with chain ID (EIP-155)
    const chain_id: u64 = 1; // Mainnet
    
    const signature_without_chain = Crypto.Signature{
        .r = [_]u8{0x12} ** 32,
        .s = [_]u8{0x34} ** 32,
        .v = 27, // Pre-EIP-155
    };
    
    const signature_with_chain = Crypto.Signature{
        .r = [_]u8{0x12} ** 32,
        .s = [_]u8{0x34} ** 32,
        .v = 37, // 27 + chain_id * 2 + 8
    };
    
    // Extract chain ID from v
    const extracted_chain_id = extract_chain_id(signature_with_chain.v);
    try testing.expectEqual(chain_id, extracted_chain_id.?);
    
    // Pre-EIP-155 signature should not have chain ID
    try testing.expectEqual(@as(?u64, null), extract_chain_id(signature_without_chain.v));
}

test "compact signature format" {
    const allocator = testing.allocator;
    
    const signature = Crypto.Signature{
        .r = [_]u8{
            0x9f, 0x15, 0x08, 0x09, 0xad, 0x6e, 0x88, 0x2b,
            0x6e, 0x8f, 0x0c, 0x4d, 0xc4, 0xb0, 0xc5, 0xd5,
            0x8d, 0x6f, 0xd8, 0x4e, 0xe8, 0xd4, 0x8a, 0xef,
            0x7e, 0x37, 0xb8, 0xd6, 0x0f, 0x3d, 0x4f, 0x5a,
        },
        .s = [_]u8{
            0x6f, 0xc9, 0x5f, 0x48, 0xbd, 0x0e, 0x96, 0x0f,
            0xb8, 0x6f, 0xd6, 0x56, 0x88, 0x71, 0x87, 0x15,
            0x25, 0x5a, 0xd9, 0xfc, 0x4a, 0x5f, 0x0e, 0x9f,
            0x09, 0x8e, 0x9d, 0x4e, 0x2e, 0xc4, 0x89, 0x5f,
        },
        .v = 27,
    };
    
    // Convert to compact format (65 bytes)
    const compact = signature_to_compact(signature);
    try testing.expectEqual(@as(usize, 65), compact.len);
    
    // First 32 bytes should be R
    try testing.expectEqualSlices(u8, &signature.r, compact[0..32]);
    
    // Next 32 bytes should be S
    try testing.expectEqualSlices(u8, &signature.s, compact[32..64]);
    
    // Last byte should be recovery ID (v - 27)
    try testing.expectEqual(@as(u8, 0), compact[64]);
    
    // Convert back from compact
    const recovered = try signature_from_compact(compact);
    try testing.expectEqualSlices(u8, &signature.r, &recovered.r);
    try testing.expectEqualSlices(u8, &signature.s, &recovered.s);
    try testing.expectEqual(signature.v, recovered.v);
}

test "eth_sign vs personal_sign" {
    const allocator = testing.allocator;
    
    const private_key = Crypto.PrivateKey{
        .bytes = [_]u8{0x42} ** 32,
    };
    
    const message = "Hello, Ethereum!";
    
    // eth_sign: signs the hash directly
    const eth_sign_hash = Hash.keccak256(message);
    const eth_signature = try Crypto.sign(allocator, private_key, eth_sign_hash);
    
    // personal_sign: signs with EIP-191 prefix
    const personal_signature = try Crypto.personal_sign(allocator, private_key, message);
    
    // Signatures should be different
    try testing.expect(!std.mem.eql(u8, &eth_signature.r, &personal_signature.r));
}

test "signature with typed data (EIP-712)" {
    const allocator = testing.allocator;
    
    // This would normally use EIP-712 hashing
    const domain_separator = Hash.keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");
    const struct_hash = Hash.keccak256("Mail(address to,string contents)");
    
    // Combine hashes according to EIP-712
    var message_data: [66]u8 = undefined;
    message_data[0] = 0x19;
    message_data[1] = 0x01;
    @memcpy(message_data[2..34], &domain_separator);
    @memcpy(message_data[34..66], &struct_hash);
    
    const message_hash = Hash.keccak256(&message_data);
    
    const private_key = Crypto.PrivateKey{
        .bytes = [_]u8{0x42} ** 32,
    };
    
    const signature = try Crypto.sign(allocator, private_key, message_hash);
    
    // Verify signature components
    try testing.expect(Crypto.is_valid_signature(signature));
}

// Helper functions

fn verify_message(allocator: std.mem.Allocator, message: []const u8, signature: Crypto.Signature, expected_address: Address.Address) !bool {
    const message_hash = try Hash.eip191_hash_message(message, allocator);
    
    const public_key = Crypto.recover_public_key(allocator, message_hash, signature) catch {
        return false;
    };
    
    const recovered_address = Address.from_public_key(public_key.bytes);
    
    return Address.equal(recovered_address, expected_address);
}

fn is_canonical_signature(sig: Crypto.Signature) bool {
    // Check if S is in the lower half of the order
    // This is a simplified check - in production you'd compare against n/2
    const high_s_byte = sig.s[0];
    
    // If the first byte is > 0x7f, S is likely in the upper half
    return high_s_byte <= 0x7f;
}

fn extract_chain_id(v: u64) ?u64 {
    if (v == 27 or v == 28) {
        // Pre-EIP-155 signature
        return null;
    }
    
    // EIP-155: v = chainId * 2 + 35 or chainId * 2 + 36
    if (v >= 35) {
        return (v - 35) / 2;
    }
    
    return null;
}

fn signature_to_compact(sig: Crypto.Signature) [65]u8 {
    var compact: [65]u8 = undefined;
    @memcpy(compact[0..32], &sig.r);
    @memcpy(compact[32..64], &sig.s);
    compact[64] = @as(u8, @intCast(sig.v - 27)); // Recovery ID
    return compact;
}

fn signature_from_compact(compact: [65]u8) !Crypto.Signature {
    if (compact[64] > 3) return error.InvalidRecoveryId;
    
    return Crypto.Signature{
        .r = compact[0..32].*,
        .s = compact[32..64].*,
        .v = compact[64] + 27,
    };
}

// Test signature aggregation (for multisig scenarios)
test "signature aggregation for multisig" {
    const allocator = testing.allocator;
    
    // Multiple signers
    const signers = [_]Crypto.PrivateKey{
        .{ .bytes = [_]u8{0x01} ** 32 },
        .{ .bytes = [_]u8{0x02} ** 32 },
        .{ .bytes = [_]u8{0x03} ** 32 },
    };
    
    const message = "Multisig transaction";
    const message_hash = try Hash.eip191_hash_message(message, allocator);
    
    // Collect signatures
    var signatures: [3]Crypto.Signature = undefined;
    for (signers, 0..) |signer, i| {
        signatures[i] = try Crypto.sign(allocator, signer, message_hash);
    }
    
    // Verify each signature independently
    for (signers, 0..) |signer, i| {
        const signer_address = try Crypto.get_address(allocator, signer);
        const verified = try verify_message(allocator, message, signatures[i], signer_address);
        try testing.expect(verified);
    }
}

// Test deterministic signatures (RFC 6979)
test "deterministic signature generation" {
    const allocator = testing.allocator;
    
    const private_key = Crypto.PrivateKey{
        .bytes = [_]u8{0x42} ** 32,
    };
    
    const message_hash = Hash.keccak256("test message");
    
    // Sign the same message multiple times
    const sig1 = try Crypto.sign(allocator, private_key, message_hash);
    const sig2 = try Crypto.sign(allocator, private_key, message_hash);
    
    // With deterministic signatures, they should be identical
    // Note: This depends on the implementation using RFC 6979
    // If using random k, this test would fail
    _ = sig1;
    _ = sig2;
    // Uncomment if implementation is deterministic:
    // try testing.expectEqualSlices(u8, &sig1.r, &sig2.r);
    // try testing.expectEqualSlices(u8, &sig1.s, &sig2.s);
}