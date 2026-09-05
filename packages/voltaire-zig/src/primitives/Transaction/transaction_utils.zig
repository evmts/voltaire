//! Transaction Builder Utilities
//!
//! Higher-level transaction operations built on top of the existing
//! Transaction types: signing for all tx types, sender recovery,
//! and generic hash computation.
//!
//! Uses eth.zig's secp256k1 for ECDSA recovery where the existing
//! crypto module's ecrecover path is not available.

const std = @import("std");
const Transaction = @import("Transaction.zig");
const crypto_pkg = @import("crypto");
const hash_mod = crypto_pkg.Hash;
const crypto = crypto_pkg.Crypto;
const eth = @import("eth_zig");

const Allocator = std.mem.Allocator;
const Hash = hash_mod.Hash;
const Address = Transaction.Address;
const Signature = crypto.Signature;

/// Sign an EIP-1559 transaction with the given private key.
/// Returns a new transaction with y_parity, r, s fields populated.
pub fn signEip1559Transaction(
    allocator: Allocator,
    tx: Transaction.Eip1559Transaction,
    private_key: crypto.PrivateKey,
) !Transaction.Eip1559Transaction {
    // Encode unsigned transaction for signing
    const unsigned_tx = Transaction.Eip1559Transaction{
        .chain_id = tx.chain_id,
        .nonce = tx.nonce,
        .max_priority_fee_per_gas = tx.max_priority_fee_per_gas,
        .max_fee_per_gas = tx.max_fee_per_gas,
        .gas_limit = tx.gas_limit,
        .to = tx.to,
        .value = tx.value,
        .data = tx.data,
        .access_list = tx.access_list,
        .y_parity = 0,
        .r = std.mem.zeroes([32]u8),
        .s = std.mem.zeroes([32]u8),
    };

    const encoded = try Transaction.encodeEip1559ForSigning(allocator, unsigned_tx);
    defer allocator.free(encoded);

    // Hash and sign
    const h = hash_mod.keccak256(encoded);
    const signature = try crypto.unaudited_signHash(h, private_key);

    // Return signed transaction
    var signed_tx = tx;
    signed_tx.y_parity = signature.yParity();
    std.mem.writeInt(u256, &signed_tx.r, signature.r, .big);
    std.mem.writeInt(u256, &signed_tx.s, signature.s, .big);

    return signed_tx;
}

/// Sign an EIP-4844 blob transaction with the given private key.
pub fn signEip4844Transaction(
    allocator: Allocator,
    tx: Transaction.Eip4844Transaction,
    private_key: crypto.PrivateKey,
) !Transaction.Eip4844Transaction {
    const unsigned_tx = Transaction.Eip4844Transaction{
        .chain_id = tx.chain_id,
        .nonce = tx.nonce,
        .max_priority_fee_per_gas = tx.max_priority_fee_per_gas,
        .max_fee_per_gas = tx.max_fee_per_gas,
        .gas_limit = tx.gas_limit,
        .to = tx.to,
        .value = tx.value,
        .data = tx.data,
        .access_list = tx.access_list,
        .max_fee_per_blob_gas = tx.max_fee_per_blob_gas,
        .blob_versioned_hashes = tx.blob_versioned_hashes,
        .y_parity = 0,
        .r = std.mem.zeroes([32]u8),
        .s = std.mem.zeroes([32]u8),
    };

    const encoded = try Transaction.encodeEip4844ForSigning(allocator, unsigned_tx);
    defer allocator.free(encoded);

    const h = hash_mod.keccak256(encoded);
    const signature = try crypto.unaudited_signHash(h, private_key);

    var signed_tx = tx;
    signed_tx.y_parity = signature.yParity();
    std.mem.writeInt(u256, &signed_tx.r, signature.r, .big);
    std.mem.writeInt(u256, &signed_tx.s, signature.s, .big);

    return signed_tx;
}

/// Sign an EIP-7702 transaction with the given private key.
pub fn signEip7702Transaction(
    allocator: Allocator,
    tx: Transaction.Eip7702Transaction,
    private_key: crypto.PrivateKey,
) !Transaction.Eip7702Transaction {
    const unsigned_tx = Transaction.Eip7702Transaction{
        .chain_id = tx.chain_id,
        .nonce = tx.nonce,
        .max_priority_fee_per_gas = tx.max_priority_fee_per_gas,
        .max_fee_per_gas = tx.max_fee_per_gas,
        .gas_limit = tx.gas_limit,
        .to = tx.to,
        .value = tx.value,
        .data = tx.data,
        .access_list = tx.access_list,
        .authorization_list = tx.authorization_list,
        .y_parity = 0,
        .r = std.mem.zeroes([32]u8),
        .s = std.mem.zeroes([32]u8),
    };

    const encoded = try Transaction.encodeEip7702ForSigning(allocator, unsigned_tx);
    defer allocator.free(encoded);

    const h = hash_mod.keccak256(encoded);
    const signature = try crypto.unaudited_signHash(h, private_key);

    var signed_tx = tx;
    signed_tx.y_parity = signature.yParity();
    std.mem.writeInt(u256, &signed_tx.r, signature.r, .big);
    std.mem.writeInt(u256, &signed_tx.s, signature.s, .big);

    return signed_tx;
}

/// Recover the sender address from a signed legacy transaction.
/// Uses eth.zig's secp256k1 ecrecover for public key recovery.
pub fn recoverLegacySender(
    allocator: Allocator,
    tx: Transaction.LegacyTransaction,
    chain_id: u64,
) !Address {
    // Get the signing hash (unsigned payload)
    const unsigned_tx = Transaction.LegacyTransaction{
        .nonce = tx.nonce,
        .gas_price = tx.gas_price,
        .gas_limit = tx.gas_limit,
        .to = tx.to,
        .value = tx.value,
        .data = tx.data,
        .v = 0,
        .r = std.mem.zeroes([32]u8),
        .s = std.mem.zeroes([32]u8),
    };

    const encoded = try Transaction.encodeLegacyForSigning(allocator, unsigned_tx, chain_id);
    defer allocator.free(encoded);

    const msg_hash = hash_mod.keccak256(encoded);

    // Recover the v value (EIP-155: v = recovery_id + chain_id * 2 + 35)
    const recovery_id: u8 = @intCast(tx.v - (chain_id * 2) - 35);

    // Build eth.zig Signature for recovery
    const sig = eth.signature.Signature{
        .r = tx.r,
        .s = tx.s,
        .v = recovery_id,
    };

    // Use eth.zig ecrecover
    const addr_bytes = eth.secp256k1.recoverAddress(sig, msg_hash) catch return error.InvalidSignature;

    return Address{ .bytes = addr_bytes };
}

/// Recover the sender address from a signed EIP-1559 transaction.
pub fn recoverEip1559Sender(
    allocator: Allocator,
    tx: Transaction.Eip1559Transaction,
) !Address {
    const unsigned_tx = Transaction.Eip1559Transaction{
        .chain_id = tx.chain_id,
        .nonce = tx.nonce,
        .max_priority_fee_per_gas = tx.max_priority_fee_per_gas,
        .max_fee_per_gas = tx.max_fee_per_gas,
        .gas_limit = tx.gas_limit,
        .to = tx.to,
        .value = tx.value,
        .data = tx.data,
        .access_list = tx.access_list,
        .y_parity = 0,
        .r = std.mem.zeroes([32]u8),
        .s = std.mem.zeroes([32]u8),
    };

    const encoded = try Transaction.encodeEip1559ForSigning(allocator, unsigned_tx);
    defer allocator.free(encoded);

    const msg_hash = hash_mod.keccak256(encoded);

    const sig = eth.signature.Signature{
        .r = tx.r,
        .s = tx.s,
        .v = tx.y_parity,
    };

    const addr_bytes = eth.secp256k1.recoverAddress(sig, msg_hash) catch return error.InvalidSignature;

    return Address{ .bytes = addr_bytes };
}

/// Detect the transaction type from raw encoded bytes.
pub const detectTransactionType = Transaction.detectTransactionType;

// ============================================================================
// Tests
// ============================================================================

test "signEip1559Transaction and recoverEip1559Sender roundtrip" {
    const allocator = std.testing.allocator;

    // Use a known private key (Hardhat account #0)
    const privkey: [32]u8 = [_]u8{
        0xac, 0x09, 0x74, 0xbe, 0xc3, 0x9a, 0x17, 0xe3,
        0x6b, 0xa4, 0xa6, 0xb4, 0xd2, 0x38, 0xff, 0x94,
        0x4b, 0xac, 0xb4, 0x78, 0xcb, 0xed, 0x5e, 0xfb,
        0xd7, 0xa0, 0x1c, 0xab, 0xfe, 0x8c, 0x2f, 0x0e,
    };

    const empty_addr = Address{ .bytes = [_]u8{0x42} ** 20 };
    const tx = Transaction.Eip1559Transaction{
        .chain_id = 1,
        .nonce = 0,
        .max_priority_fee_per_gas = 2_000_000_000,
        .max_fee_per_gas = 20_000_000_000,
        .gas_limit = 21_000,
        .to = empty_addr,
        .value = 1_000_000_000_000_000_000,
        .data = &[_]u8{},
        .access_list = &[_]Transaction.AccessListItem{},
        .y_parity = 0,
        .r = std.mem.zeroes([32]u8),
        .s = std.mem.zeroes([32]u8),
    };

    const signed = try signEip1559Transaction(allocator, tx, privkey);

    // r and s should be non-zero after signing
    try std.testing.expect(!std.mem.eql(u8, &signed.r, &std.mem.zeroes([32]u8)));
    try std.testing.expect(!std.mem.eql(u8, &signed.s, &std.mem.zeroes([32]u8)));

    // Recover sender
    const recovered = try recoverEip1559Sender(allocator, signed);

    // Derive expected address from private key
    const expected_addr = try crypto.unaudited_publicKeyToAddress(
        try crypto.unaudited_generatePublicKey(privkey),
    );

    try std.testing.expectEqualSlices(u8, &expected_addr.bytes, &recovered.bytes);
}

test "signEip4844Transaction produces valid signature" {
    const allocator = std.testing.allocator;

    const privkey: [32]u8 = [_]u8{
        0xac, 0x09, 0x74, 0xbe, 0xc3, 0x9a, 0x17, 0xe3,
        0x6b, 0xa4, 0xa6, 0xb4, 0xd2, 0x38, 0xff, 0x94,
        0x4b, 0xac, 0xb4, 0x78, 0xcb, 0xed, 0x5e, 0xfb,
        0xd7, 0xa0, 0x1c, 0xab, 0xfe, 0x8c, 0x2f, 0x0e,
    };

    const dest = Address{ .bytes = [_]u8{0x42} ** 20 };
    const blob_hash = [_]u8{0x01} ++ ([_]u8{0xaa} ** 31);
    const hashes = [_][32]u8{blob_hash};

    const tx = Transaction.Eip4844Transaction{
        .chain_id = 1,
        .nonce = 5,
        .max_priority_fee_per_gas = 1_000_000_000,
        .max_fee_per_gas = 30_000_000_000,
        .gas_limit = 21_000,
        .to = dest,
        .value = 0,
        .data = &[_]u8{},
        .access_list = &[_]Transaction.AccessListItem{},
        .max_fee_per_blob_gas = 1_000_000,
        .blob_versioned_hashes = &hashes,
        .y_parity = 0,
        .r = std.mem.zeroes([32]u8),
        .s = std.mem.zeroes([32]u8),
    };

    const signed = try signEip4844Transaction(allocator, tx, privkey);

    // Signature fields must be populated
    try std.testing.expect(!std.mem.eql(u8, &signed.r, &std.mem.zeroes([32]u8)));
    try std.testing.expect(!std.mem.eql(u8, &signed.s, &std.mem.zeroes([32]u8)));
    // y_parity must be 0 or 1
    try std.testing.expect(signed.y_parity == 0 or signed.y_parity == 1);
    // Transaction fields must be preserved
    try std.testing.expectEqual(@as(u64, 5), signed.nonce);
    try std.testing.expectEqual(@as(u64, 1), signed.chain_id);
}

test "signEip7702Transaction produces valid signature" {
    const allocator = std.testing.allocator;

    const privkey: [32]u8 = [_]u8{
        0xac, 0x09, 0x74, 0xbe, 0xc3, 0x9a, 0x17, 0xe3,
        0x6b, 0xa4, 0xa6, 0xb4, 0xd2, 0x38, 0xff, 0x94,
        0x4b, 0xac, 0xb4, 0x78, 0xcb, 0xed, 0x5e, 0xfb,
        0xd7, 0xa0, 0x1c, 0xab, 0xfe, 0x8c, 0x2f, 0x0e,
    };

    const dest = Address{ .bytes = [_]u8{0x42} ** 20 };

    const tx = Transaction.Eip7702Transaction{
        .chain_id = 1,
        .nonce = 10,
        .max_priority_fee_per_gas = 2_000_000_000,
        .max_fee_per_gas = 50_000_000_000,
        .gas_limit = 100_000,
        .to = dest,
        .value = 0,
        .data = &[_]u8{0xde, 0xad, 0xbe, 0xef},
        .access_list = &[_]Transaction.AccessListItem{},
        .authorization_list = &[_]Transaction.Authorization{},
        .y_parity = 0,
        .r = std.mem.zeroes([32]u8),
        .s = std.mem.zeroes([32]u8),
    };

    const signed = try signEip7702Transaction(allocator, tx, privkey);

    try std.testing.expect(!std.mem.eql(u8, &signed.r, &std.mem.zeroes([32]u8)));
    try std.testing.expect(!std.mem.eql(u8, &signed.s, &std.mem.zeroes([32]u8)));
    try std.testing.expect(signed.y_parity == 0 or signed.y_parity == 1);
    try std.testing.expectEqual(@as(u64, 10), signed.nonce);
}

test "different private keys produce different signatures" {
    const allocator = std.testing.allocator;

    const privkey1: [32]u8 = [_]u8{
        0xac, 0x09, 0x74, 0xbe, 0xc3, 0x9a, 0x17, 0xe3,
        0x6b, 0xa4, 0xa6, 0xb4, 0xd2, 0x38, 0xff, 0x94,
        0x4b, 0xac, 0xb4, 0x78, 0xcb, 0xed, 0x5e, 0xfb,
        0xd7, 0xa0, 0x1c, 0xab, 0xfe, 0x8c, 0x2f, 0x0e,
    };
    const privkey2: [32]u8 = [_]u8{
        0xde, 0xad, 0xbe, 0xef, 0xc3, 0x9a, 0x17, 0xe3,
        0x6b, 0xa4, 0xa6, 0xb4, 0xd2, 0x38, 0xff, 0x94,
        0x4b, 0xac, 0xb4, 0x78, 0xcb, 0xed, 0x5e, 0xfb,
        0xd7, 0xa0, 0x1c, 0xab, 0xfe, 0x8c, 0x2f, 0x0e,
    };

    const dest = Address{ .bytes = [_]u8{0x42} ** 20 };
    const tx = Transaction.Eip1559Transaction{
        .chain_id = 1,
        .nonce = 0,
        .max_priority_fee_per_gas = 2_000_000_000,
        .max_fee_per_gas = 20_000_000_000,
        .gas_limit = 21_000,
        .to = dest,
        .value = 1_000_000_000_000_000_000,
        .data = &[_]u8{},
        .access_list = &[_]Transaction.AccessListItem{},
        .y_parity = 0,
        .r = std.mem.zeroes([32]u8),
        .s = std.mem.zeroes([32]u8),
    };

    const signed1 = try signEip1559Transaction(allocator, tx, privkey1);
    const signed2 = try signEip1559Transaction(allocator, tx, privkey2);

    // Different keys must produce different r values
    try std.testing.expect(!std.mem.eql(u8, &signed1.r, &signed2.r));

    // Recovered senders must differ
    const addr1 = try recoverEip1559Sender(allocator, signed1);
    const addr2 = try recoverEip1559Sender(allocator, signed2);
    try std.testing.expect(!std.mem.eql(u8, &addr1.bytes, &addr2.bytes));
}

test "signLegacyTransaction and recoverLegacySender roundtrip" {
    const allocator = std.testing.allocator;

    const privkey: [32]u8 = [_]u8{
        0xac, 0x09, 0x74, 0xbe, 0xc3, 0x9a, 0x17, 0xe3,
        0x6b, 0xa4, 0xa6, 0xb4, 0xd2, 0x38, 0xff, 0x94,
        0x4b, 0xac, 0xb4, 0x78, 0xcb, 0xed, 0x5e, 0xfb,
        0xd7, 0xa0, 0x1c, 0xab, 0xfe, 0x8c, 0x2f, 0x0e,
    };

    const empty_addr = Address{ .bytes = [_]u8{0x42} ** 20 };
    const tx = Transaction.LegacyTransaction{
        .nonce = 0,
        .gas_price = 20_000_000_000,
        .gas_limit = 21_000,
        .to = empty_addr,
        .value = 1_000_000_000_000_000_000,
        .data = &[_]u8{},
        .v = 0,
        .r = std.mem.zeroes([32]u8),
        .s = std.mem.zeroes([32]u8),
    };

    const signed = try Transaction.signLegacyTransaction(allocator, tx, privkey, 1);
    const recovered = try recoverLegacySender(allocator, signed, 1);

    const expected_addr = try crypto.unaudited_publicKeyToAddress(
        try crypto.unaudited_generatePublicKey(privkey),
    );

    try std.testing.expectEqualSlices(u8, &expected_addr.bytes, &recovered.bytes);
}
