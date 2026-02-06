//! BuilderBid - MEV Block Builder Bid
//!
//! Represents a block builder bid in Proposer-Builder Separation (PBS).
//! Block builders compete to provide the most valuable block to validators
//! through MEV-Boost relays.
//!
//! ## Examples
//!
//! ```zig
//! const primitives = @import("primitives");
//! const BuilderBid = primitives.BuilderBid;
//!
//! // Create builder bid
//! const bid = BuilderBid.from(.{
//!     .slot = 1000000,
//!     .parent_hash = parent_hash,
//!     .block_hash = block_hash,
//!     .builder_pubkey = pubkey,
//!     // ... other fields
//! });
//! ```

const std = @import("std");
const Address = @import("../Address/address.zig");
const Hash = @import("../Hash/Hash.zig");
const Slot = @import("../Slot/Slot.zig");

/// BLS public key size (48 bytes)
pub const BLS_PUBKEY_SIZE: usize = 48;

/// BLS signature size (96 bytes)
pub const BLS_SIGNATURE_SIZE: usize = 96;

/// BuilderBid type - represents a block builder bid
pub const BuilderBid = struct {
    /// Beacon chain slot number for this bid
    /// Each slot is 12 seconds
    slot: Slot.Slot,

    /// Parent block hash
    /// The block being built on top of
    parent_hash: Hash.Hash,

    /// Proposed block hash
    /// Hash of the block being bid on
    block_hash: Hash.Hash,

    /// Builder's BLS public key (48 bytes)
    /// Identity of the block builder
    builder_pubkey: [BLS_PUBKEY_SIZE]u8,

    /// Proposer's BLS public key (48 bytes)
    /// Identity of the validator proposing this slot
    proposer_pubkey: [BLS_PUBKEY_SIZE]u8,

    /// Fee recipient address
    /// Where block rewards and tips are sent
    proposer_fee_recipient: Address.Address,

    /// Block gas limit
    /// Maximum gas allowed in the proposed block
    gas_limit: u256,

    /// Gas used in block
    /// Actual gas consumed by transactions
    gas_used: u256,

    /// Bid value to proposer (in wei)
    /// Amount builder pays validator for block inclusion
    value: u256,

    /// Builder's BLS signature (96 bytes)
    /// Cryptographic proof of bid authenticity
    signature: [BLS_SIGNATURE_SIZE]u8,
};

/// Empty BLS public key
pub const EMPTY_PUBKEY: [BLS_PUBKEY_SIZE]u8 = [_]u8{0} ** BLS_PUBKEY_SIZE;

/// Empty BLS signature
pub const EMPTY_SIGNATURE: [BLS_SIGNATURE_SIZE]u8 = [_]u8{0} ** BLS_SIGNATURE_SIZE;

// ============================================================================
// Constructors
// ============================================================================

/// Create BuilderBid from struct
pub fn from(data: BuilderBid) BuilderBid {
    return data;
}

/// Create BuilderBid from individual fields
pub fn fromFields(
    slot: Slot.Slot,
    parent_hash: Hash.Hash,
    block_hash: Hash.Hash,
    builder_pubkey: [BLS_PUBKEY_SIZE]u8,
    proposer_pubkey: [BLS_PUBKEY_SIZE]u8,
    proposer_fee_recipient: Address.Address,
    gas_limit: u256,
    gas_used: u256,
    value: u256,
    signature: [BLS_SIGNATURE_SIZE]u8,
) BuilderBid {
    return .{
        .slot = slot,
        .parent_hash = parent_hash,
        .block_hash = block_hash,
        .builder_pubkey = builder_pubkey,
        .proposer_pubkey = proposer_pubkey,
        .proposer_fee_recipient = proposer_fee_recipient,
        .gas_limit = gas_limit,
        .gas_used = gas_used,
        .value = value,
        .signature = signature,
    };
}

// ============================================================================
// Accessors
// ============================================================================

/// Get slot number
pub fn getSlot(bid: BuilderBid) Slot.Slot {
    return bid.slot;
}

/// Get parent hash
pub fn getParentHash(bid: BuilderBid) Hash.Hash {
    return bid.parent_hash;
}

/// Get block hash
pub fn getBlockHash(bid: BuilderBid) Hash.Hash {
    return bid.block_hash;
}

/// Get builder public key
pub fn getBuilderPubkey(bid: BuilderBid) [BLS_PUBKEY_SIZE]u8 {
    return bid.builder_pubkey;
}

/// Get proposer public key
pub fn getProposerPubkey(bid: BuilderBid) [BLS_PUBKEY_SIZE]u8 {
    return bid.proposer_pubkey;
}

/// Get fee recipient address
pub fn getProposerFeeRecipient(bid: BuilderBid) Address.Address {
    return bid.proposer_fee_recipient;
}

/// Get bid value in wei
pub fn getValue(bid: BuilderBid) u256 {
    return bid.value;
}

/// Get gas limit
pub fn getGasLimit(bid: BuilderBid) u256 {
    return bid.gas_limit;
}

/// Get gas used
pub fn getGasUsed(bid: BuilderBid) u256 {
    return bid.gas_used;
}

/// Get signature
pub fn getSignature(bid: BuilderBid) [BLS_SIGNATURE_SIZE]u8 {
    return bid.signature;
}

// ============================================================================
// Comparison
// ============================================================================

/// Check if two BuilderBids are equal (by slot and block hash)
pub fn equals(a: BuilderBid, b: BuilderBid) bool {
    return a.slot == b.slot and
        std.mem.eql(u8, &a.block_hash, &b.block_hash) and
        std.mem.eql(u8, &a.builder_pubkey, &b.builder_pubkey);
}

/// Compare bids by value (for sorting)
/// Returns negative if a < b, zero if equal, positive if a > b
pub fn compareByValue(a: BuilderBid, b: BuilderBid) i128 {
    if (a.value < b.value) return -1;
    if (a.value > b.value) return 1;
    return 0;
}

// ============================================================================
// Validation
// ============================================================================

/// Check if bid has non-zero value
pub fn hasValue(bid: BuilderBid) bool {
    return bid.value > 0;
}

/// Check if bid signature is non-zero
pub fn hasSignature(bid: BuilderBid) bool {
    for (bid.signature) |byte| {
        if (byte != 0) return true;
    }
    return false;
}

// ============================================================================
// SSZ Encoding (Beacon Chain Compatibility)
// ============================================================================

/// SSZ serialized size of BuilderBid (fixed-size container)
/// slot(8) + parent_hash(32) + block_hash(32) + builder_pubkey(48) +
/// proposer_pubkey(48) + proposer_fee_recipient(20) + gas_limit(32) +
/// gas_used(32) + value(32) + signature(96) = 380 bytes
pub const SSZ_SIZE: usize = 8 + 32 + 32 + 48 + 48 + 20 + 32 + 32 + 32 + 96;

/// SSZ encode BuilderBid to fixed-size byte array
/// Per consensus-specs: fields encoded in little-endian, concatenated in declaration order
pub fn sszEncode(bid: BuilderBid) [SSZ_SIZE]u8 {
    var result: [SSZ_SIZE]u8 = undefined;
    var offset: usize = 0;

    // slot: u64 (8 bytes, little-endian)
    std.mem.writeInt(u64, result[offset..][0..8], bid.slot, .little);
    offset += 8;

    // parent_hash: [32]u8
    @memcpy(result[offset..][0..32], &bid.parent_hash);
    offset += 32;

    // block_hash: [32]u8
    @memcpy(result[offset..][0..32], &bid.block_hash);
    offset += 32;

    // builder_pubkey: [48]u8
    @memcpy(result[offset..][0..48], &bid.builder_pubkey);
    offset += 48;

    // proposer_pubkey: [48]u8
    @memcpy(result[offset..][0..48], &bid.proposer_pubkey);
    offset += 48;

    // proposer_fee_recipient: Address (20 bytes)
    @memcpy(result[offset..][0..20], &bid.proposer_fee_recipient.bytes);
    offset += 20;

    // gas_limit: u256 (32 bytes, little-endian)
    std.mem.writeInt(u256, result[offset..][0..32], bid.gas_limit, .little);
    offset += 32;

    // gas_used: u256 (32 bytes, little-endian)
    std.mem.writeInt(u256, result[offset..][0..32], bid.gas_used, .little);
    offset += 32;

    // value: u256 (32 bytes, little-endian)
    std.mem.writeInt(u256, result[offset..][0..32], bid.value, .little);
    offset += 32;

    // signature: [96]u8
    @memcpy(result[offset..][0..96], &bid.signature);

    return result;
}

/// SSZ decode BuilderBid from byte slice
pub fn sszDecode(data: []const u8) !BuilderBid {
    if (data.len != SSZ_SIZE) return error.InvalidLength;

    var offset: usize = 0;

    // slot: u64
    const slot = std.mem.readInt(u64, data[offset..][0..8], .little);
    offset += 8;

    // parent_hash: [32]u8
    var parent_hash: Hash.Hash = undefined;
    @memcpy(&parent_hash, data[offset..][0..32]);
    offset += 32;

    // block_hash: [32]u8
    var block_hash: Hash.Hash = undefined;
    @memcpy(&block_hash, data[offset..][0..32]);
    offset += 32;

    // builder_pubkey: [48]u8
    var builder_pubkey: [BLS_PUBKEY_SIZE]u8 = undefined;
    @memcpy(&builder_pubkey, data[offset..][0..48]);
    offset += 48;

    // proposer_pubkey: [48]u8
    var proposer_pubkey: [BLS_PUBKEY_SIZE]u8 = undefined;
    @memcpy(&proposer_pubkey, data[offset..][0..48]);
    offset += 48;

    // proposer_fee_recipient: Address (20 bytes)
    var fee_recipient_bytes: [20]u8 = undefined;
    @memcpy(&fee_recipient_bytes, data[offset..][0..20]);
    offset += 20;

    // gas_limit: u256
    const gas_limit = std.mem.readInt(u256, data[offset..][0..32], .little);
    offset += 32;

    // gas_used: u256
    const gas_used = std.mem.readInt(u256, data[offset..][0..32], .little);
    offset += 32;

    // value: u256
    const value = std.mem.readInt(u256, data[offset..][0..32], .little);
    offset += 32;

    // signature: [96]u8
    var signature: [BLS_SIGNATURE_SIZE]u8 = undefined;
    @memcpy(&signature, data[offset..][0..96]);

    return .{
        .slot = slot,
        .parent_hash = parent_hash,
        .block_hash = block_hash,
        .builder_pubkey = builder_pubkey,
        .proposer_pubkey = proposer_pubkey,
        .proposer_fee_recipient = Address.Address{ .bytes = fee_recipient_bytes },
        .gas_limit = gas_limit,
        .gas_used = gas_used,
        .value = value,
        .signature = signature,
    };
}

/// Get signing root for BLS signature verification
/// Returns hash of SSZ-encoded bid (excluding signature field)
pub fn signingRoot(bid: BuilderBid) [32]u8 {
    // Encode all fields except signature
    const signing_size = SSZ_SIZE - BLS_SIGNATURE_SIZE;
    var data: [signing_size]u8 = undefined;
    var offset: usize = 0;

    std.mem.writeInt(u64, data[offset..][0..8], bid.slot, .little);
    offset += 8;
    @memcpy(data[offset..][0..32], &bid.parent_hash);
    offset += 32;
    @memcpy(data[offset..][0..32], &bid.block_hash);
    offset += 32;
    @memcpy(data[offset..][0..48], &bid.builder_pubkey);
    offset += 48;
    @memcpy(data[offset..][0..48], &bid.proposer_pubkey);
    offset += 48;
    @memcpy(data[offset..][0..20], &bid.proposer_fee_recipient.bytes);
    offset += 20;
    std.mem.writeInt(u256, data[offset..][0..32], bid.gas_limit, .little);
    offset += 32;
    std.mem.writeInt(u256, data[offset..][0..32], bid.gas_used, .little);
    offset += 32;
    std.mem.writeInt(u256, data[offset..][0..32], bid.value, .little);

    // Hash with SHA256 (beacon chain uses SHA256 for SSZ roots)
    var hash: [32]u8 = undefined;
    std.crypto.hash.sha2.Sha256.hash(&data, &hash, .{});
    return hash;
}

// ============================================================================
// Tests
// ============================================================================

test "BuilderBid.from creates builder bid" {
    const parent_hash: Hash.Hash = [_]u8{0xaa} ** 32;
    const block_hash: Hash.Hash = [_]u8{0xbb} ** 32;
    const builder_pubkey: [BLS_PUBKEY_SIZE]u8 = [_]u8{0xcc} ** BLS_PUBKEY_SIZE;
    const proposer_pubkey: [BLS_PUBKEY_SIZE]u8 = [_]u8{0xdd} ** BLS_PUBKEY_SIZE;
    const fee_recipient = Address.Address{ .bytes = [_]u8{0xee} ** 20 };
    const signature: [BLS_SIGNATURE_SIZE]u8 = [_]u8{0xff} ** BLS_SIGNATURE_SIZE;

    const bid = from(.{
        .slot = 1000000,
        .parent_hash = parent_hash,
        .block_hash = block_hash,
        .builder_pubkey = builder_pubkey,
        .proposer_pubkey = proposer_pubkey,
        .proposer_fee_recipient = fee_recipient,
        .gas_limit = 30000000,
        .gas_used = 15000000,
        .value = 100000000000000000, // 0.1 ETH
        .signature = signature,
    });

    try std.testing.expectEqual(@as(Slot.Slot, 1000000), bid.slot);
    try std.testing.expectEqual(@as(u256, 100000000000000000), bid.value);
}

test "BuilderBid accessors work correctly" {
    const parent_hash: Hash.Hash = [_]u8{0x11} ** 32;
    const block_hash: Hash.Hash = [_]u8{0x22} ** 32;
    const builder_pubkey: [BLS_PUBKEY_SIZE]u8 = [_]u8{0x33} ** BLS_PUBKEY_SIZE;
    const proposer_pubkey: [BLS_PUBKEY_SIZE]u8 = [_]u8{0x44} ** BLS_PUBKEY_SIZE;
    const fee_recipient = Address.Address{ .bytes = [_]u8{0x55} ** 20 };
    const signature: [BLS_SIGNATURE_SIZE]u8 = [_]u8{0x66} ** BLS_SIGNATURE_SIZE;

    const bid = from(.{
        .slot = 1000000,
        .parent_hash = parent_hash,
        .block_hash = block_hash,
        .builder_pubkey = builder_pubkey,
        .proposer_pubkey = proposer_pubkey,
        .proposer_fee_recipient = fee_recipient,
        .gas_limit = 30000000,
        .gas_used = 15000000,
        .value = 100000000000000000,
        .signature = signature,
    });

    try std.testing.expectEqual(@as(Slot.Slot, 1000000), getSlot(bid));
    try std.testing.expectEqualSlices(u8, &parent_hash, &getParentHash(bid));
    try std.testing.expectEqualSlices(u8, &block_hash, &getBlockHash(bid));
    try std.testing.expectEqual(@as(u256, 100000000000000000), getValue(bid));
    try std.testing.expectEqual(@as(u256, 30000000), getGasLimit(bid));
    try std.testing.expectEqual(@as(u256, 15000000), getGasUsed(bid));
}

test "BuilderBid.equals compares bids" {
    const parent_hash: Hash.Hash = [_]u8{0x77} ** 32;
    const block_hash: Hash.Hash = [_]u8{0x88} ** 32;
    const builder_pubkey: [BLS_PUBKEY_SIZE]u8 = [_]u8{0x99} ** BLS_PUBKEY_SIZE;
    const proposer_pubkey: [BLS_PUBKEY_SIZE]u8 = [_]u8{0xaa} ** BLS_PUBKEY_SIZE;
    const fee_recipient = Address.Address{ .bytes = [_]u8{0xbb} ** 20 };
    const signature: [BLS_SIGNATURE_SIZE]u8 = [_]u8{0xcc} ** BLS_SIGNATURE_SIZE;

    const bid1 = from(.{
        .slot = 1000000,
        .parent_hash = parent_hash,
        .block_hash = block_hash,
        .builder_pubkey = builder_pubkey,
        .proposer_pubkey = proposer_pubkey,
        .proposer_fee_recipient = fee_recipient,
        .gas_limit = 30000000,
        .gas_used = 15000000,
        .value = 100000000000000000,
        .signature = signature,
    });

    const bid2 = from(.{
        .slot = 1000000,
        .parent_hash = parent_hash,
        .block_hash = block_hash,
        .builder_pubkey = builder_pubkey,
        .proposer_pubkey = proposer_pubkey,
        .proposer_fee_recipient = fee_recipient,
        .gas_limit = 30000000,
        .gas_used = 15000000,
        .value = 200000000000000000, // Different value doesn't affect equality
        .signature = signature,
    });

    const other_block_hash: Hash.Hash = [_]u8{0xdd} ** 32;
    const bid3 = from(.{
        .slot = 1000001,
        .parent_hash = parent_hash,
        .block_hash = other_block_hash,
        .builder_pubkey = builder_pubkey,
        .proposer_pubkey = proposer_pubkey,
        .proposer_fee_recipient = fee_recipient,
        .gas_limit = 30000000,
        .gas_used = 15000000,
        .value = 100000000000000000,
        .signature = signature,
    });

    try std.testing.expect(equals(bid1, bid2));
    try std.testing.expect(!equals(bid1, bid3));
}

test "BuilderBid.compareByValue" {
    const parent_hash: Hash.Hash = [_]u8{0xee} ** 32;
    const block_hash: Hash.Hash = [_]u8{0xff} ** 32;
    const builder_pubkey: [BLS_PUBKEY_SIZE]u8 = EMPTY_PUBKEY;
    const proposer_pubkey: [BLS_PUBKEY_SIZE]u8 = EMPTY_PUBKEY;
    const fee_recipient = Address.Address{ .bytes = [_]u8{0x00} ** 20 };
    const signature: [BLS_SIGNATURE_SIZE]u8 = EMPTY_SIGNATURE;

    const low_bid = from(.{
        .slot = 1000000,
        .parent_hash = parent_hash,
        .block_hash = block_hash,
        .builder_pubkey = builder_pubkey,
        .proposer_pubkey = proposer_pubkey,
        .proposer_fee_recipient = fee_recipient,
        .gas_limit = 30000000,
        .gas_used = 15000000,
        .value = 100000000000000000, // 0.1 ETH
        .signature = signature,
    });

    const high_bid = from(.{
        .slot = 1000000,
        .parent_hash = parent_hash,
        .block_hash = block_hash,
        .builder_pubkey = builder_pubkey,
        .proposer_pubkey = proposer_pubkey,
        .proposer_fee_recipient = fee_recipient,
        .gas_limit = 30000000,
        .gas_used = 15000000,
        .value = 500000000000000000, // 0.5 ETH
        .signature = signature,
    });

    try std.testing.expect(compareByValue(low_bid, high_bid) < 0);
    try std.testing.expect(compareByValue(high_bid, low_bid) > 0);
    try std.testing.expect(compareByValue(low_bid, low_bid) == 0);
}

test "BuilderBid.hasValue" {
    const parent_hash: Hash.Hash = [_]u8{0x11} ** 32;
    const block_hash: Hash.Hash = [_]u8{0x22} ** 32;
    const builder_pubkey: [BLS_PUBKEY_SIZE]u8 = EMPTY_PUBKEY;
    const proposer_pubkey: [BLS_PUBKEY_SIZE]u8 = EMPTY_PUBKEY;
    const fee_recipient = Address.Address{ .bytes = [_]u8{0x00} ** 20 };
    const signature: [BLS_SIGNATURE_SIZE]u8 = EMPTY_SIGNATURE;

    const bid_with_value = from(.{
        .slot = 1000000,
        .parent_hash = parent_hash,
        .block_hash = block_hash,
        .builder_pubkey = builder_pubkey,
        .proposer_pubkey = proposer_pubkey,
        .proposer_fee_recipient = fee_recipient,
        .gas_limit = 30000000,
        .gas_used = 15000000,
        .value = 1,
        .signature = signature,
    });

    const bid_no_value = from(.{
        .slot = 1000000,
        .parent_hash = parent_hash,
        .block_hash = block_hash,
        .builder_pubkey = builder_pubkey,
        .proposer_pubkey = proposer_pubkey,
        .proposer_fee_recipient = fee_recipient,
        .gas_limit = 30000000,
        .gas_used = 15000000,
        .value = 0,
        .signature = signature,
    });

    try std.testing.expect(hasValue(bid_with_value));
    try std.testing.expect(!hasValue(bid_no_value));
}

test "BuilderBid.hasSignature" {
    const parent_hash: Hash.Hash = [_]u8{0x33} ** 32;
    const block_hash: Hash.Hash = [_]u8{0x44} ** 32;
    const builder_pubkey: [BLS_PUBKEY_SIZE]u8 = EMPTY_PUBKEY;
    const proposer_pubkey: [BLS_PUBKEY_SIZE]u8 = EMPTY_PUBKEY;
    const fee_recipient = Address.Address{ .bytes = [_]u8{0x00} ** 20 };

    const signed_bid = from(.{
        .slot = 1000000,
        .parent_hash = parent_hash,
        .block_hash = block_hash,
        .builder_pubkey = builder_pubkey,
        .proposer_pubkey = proposer_pubkey,
        .proposer_fee_recipient = fee_recipient,
        .gas_limit = 30000000,
        .gas_used = 15000000,
        .value = 100000000000000000,
        .signature = [_]u8{0xff} ** BLS_SIGNATURE_SIZE,
    });

    const unsigned_bid = from(.{
        .slot = 1000000,
        .parent_hash = parent_hash,
        .block_hash = block_hash,
        .builder_pubkey = builder_pubkey,
        .proposer_pubkey = proposer_pubkey,
        .proposer_fee_recipient = fee_recipient,
        .gas_limit = 30000000,
        .gas_used = 15000000,
        .value = 100000000000000000,
        .signature = EMPTY_SIGNATURE,
    });

    try std.testing.expect(hasSignature(signed_bid));
    try std.testing.expect(!hasSignature(unsigned_bid));
}

test "BuilderBid.SSZ_SIZE is correct" {
    // slot(8) + parent_hash(32) + block_hash(32) + builder_pubkey(48) +
    // proposer_pubkey(48) + proposer_fee_recipient(20) + gas_limit(32) +
    // gas_used(32) + value(32) + signature(96) = 380
    try std.testing.expectEqual(@as(usize, 380), SSZ_SIZE);
}

test "BuilderBid.sszEncode produces correct size" {
    const bid = from(.{
        .slot = 1000000,
        .parent_hash = [_]u8{0xaa} ** 32,
        .block_hash = [_]u8{0xbb} ** 32,
        .builder_pubkey = [_]u8{0xcc} ** BLS_PUBKEY_SIZE,
        .proposer_pubkey = [_]u8{0xdd} ** BLS_PUBKEY_SIZE,
        .proposer_fee_recipient = Address.Address{ .bytes = [_]u8{0xee} ** 20 },
        .gas_limit = 30000000,
        .gas_used = 15000000,
        .value = 100000000000000000,
        .signature = [_]u8{0xff} ** BLS_SIGNATURE_SIZE,
    });

    const encoded = sszEncode(bid);
    try std.testing.expectEqual(@as(usize, SSZ_SIZE), encoded.len);
}

test "BuilderBid.sszEncode slot is little-endian" {
    const bid = from(.{
        .slot = 0x0102030405060708,
        .parent_hash = [_]u8{0x00} ** 32,
        .block_hash = [_]u8{0x00} ** 32,
        .builder_pubkey = EMPTY_PUBKEY,
        .proposer_pubkey = EMPTY_PUBKEY,
        .proposer_fee_recipient = Address.Address{ .bytes = [_]u8{0x00} ** 20 },
        .gas_limit = 0,
        .gas_used = 0,
        .value = 0,
        .signature = EMPTY_SIGNATURE,
    });

    const encoded = sszEncode(bid);
    // First 8 bytes are slot in little-endian
    try std.testing.expectEqual(@as(u8, 0x08), encoded[0]);
    try std.testing.expectEqual(@as(u8, 0x07), encoded[1]);
    try std.testing.expectEqual(@as(u8, 0x06), encoded[2]);
    try std.testing.expectEqual(@as(u8, 0x05), encoded[3]);
    try std.testing.expectEqual(@as(u8, 0x04), encoded[4]);
    try std.testing.expectEqual(@as(u8, 0x03), encoded[5]);
    try std.testing.expectEqual(@as(u8, 0x02), encoded[6]);
    try std.testing.expectEqual(@as(u8, 0x01), encoded[7]);
}

test "BuilderBid.sszDecode roundtrip" {
    const original = from(.{
        .slot = 1000000,
        .parent_hash = [_]u8{0xaa} ** 32,
        .block_hash = [_]u8{0xbb} ** 32,
        .builder_pubkey = [_]u8{0xcc} ** BLS_PUBKEY_SIZE,
        .proposer_pubkey = [_]u8{0xdd} ** BLS_PUBKEY_SIZE,
        .proposer_fee_recipient = Address.Address{ .bytes = [_]u8{0xee} ** 20 },
        .gas_limit = 30000000,
        .gas_used = 15000000,
        .value = 100000000000000000,
        .signature = [_]u8{0xff} ** BLS_SIGNATURE_SIZE,
    });

    const encoded = sszEncode(original);
    const decoded = try sszDecode(&encoded);

    try std.testing.expectEqual(original.slot, decoded.slot);
    try std.testing.expectEqualSlices(u8, &original.parent_hash, &decoded.parent_hash);
    try std.testing.expectEqualSlices(u8, &original.block_hash, &decoded.block_hash);
    try std.testing.expectEqualSlices(u8, &original.builder_pubkey, &decoded.builder_pubkey);
    try std.testing.expectEqualSlices(u8, &original.proposer_pubkey, &decoded.proposer_pubkey);
    try std.testing.expectEqualSlices(u8, &original.proposer_fee_recipient.bytes, &decoded.proposer_fee_recipient.bytes);
    try std.testing.expectEqual(original.gas_limit, decoded.gas_limit);
    try std.testing.expectEqual(original.gas_used, decoded.gas_used);
    try std.testing.expectEqual(original.value, decoded.value);
    try std.testing.expectEqualSlices(u8, &original.signature, &decoded.signature);
}

test "BuilderBid.sszDecode rejects invalid length" {
    const short_data = [_]u8{0x00} ** 100;
    try std.testing.expectError(error.InvalidLength, sszDecode(&short_data));

    const long_data = [_]u8{0x00} ** 400;
    try std.testing.expectError(error.InvalidLength, sszDecode(&long_data));
}

test "BuilderBid.signingRoot produces consistent hash" {
    const bid = from(.{
        .slot = 1000000,
        .parent_hash = [_]u8{0xaa} ** 32,
        .block_hash = [_]u8{0xbb} ** 32,
        .builder_pubkey = [_]u8{0xcc} ** BLS_PUBKEY_SIZE,
        .proposer_pubkey = [_]u8{0xdd} ** BLS_PUBKEY_SIZE,
        .proposer_fee_recipient = Address.Address{ .bytes = [_]u8{0xee} ** 20 },
        .gas_limit = 30000000,
        .gas_used = 15000000,
        .value = 100000000000000000,
        .signature = [_]u8{0xff} ** BLS_SIGNATURE_SIZE,
    });

    const root1 = signingRoot(bid);
    const root2 = signingRoot(bid);

    try std.testing.expectEqualSlices(u8, &root1, &root2);
}

test "BuilderBid.signingRoot differs for different bids" {
    const bid1 = from(.{
        .slot = 1000000,
        .parent_hash = [_]u8{0xaa} ** 32,
        .block_hash = [_]u8{0xbb} ** 32,
        .builder_pubkey = [_]u8{0xcc} ** BLS_PUBKEY_SIZE,
        .proposer_pubkey = [_]u8{0xdd} ** BLS_PUBKEY_SIZE,
        .proposer_fee_recipient = Address.Address{ .bytes = [_]u8{0xee} ** 20 },
        .gas_limit = 30000000,
        .gas_used = 15000000,
        .value = 100000000000000000,
        .signature = EMPTY_SIGNATURE,
    });

    const bid2 = from(.{
        .slot = 1000001, // Different slot
        .parent_hash = [_]u8{0xaa} ** 32,
        .block_hash = [_]u8{0xbb} ** 32,
        .builder_pubkey = [_]u8{0xcc} ** BLS_PUBKEY_SIZE,
        .proposer_pubkey = [_]u8{0xdd} ** BLS_PUBKEY_SIZE,
        .proposer_fee_recipient = Address.Address{ .bytes = [_]u8{0xee} ** 20 },
        .gas_limit = 30000000,
        .gas_used = 15000000,
        .value = 100000000000000000,
        .signature = EMPTY_SIGNATURE,
    });

    const root1 = signingRoot(bid1);
    const root2 = signingRoot(bid2);

    try std.testing.expect(!std.mem.eql(u8, &root1, &root2));
}

test "BuilderBid.signingRoot ignores signature field" {
    const bid1 = from(.{
        .slot = 1000000,
        .parent_hash = [_]u8{0xaa} ** 32,
        .block_hash = [_]u8{0xbb} ** 32,
        .builder_pubkey = [_]u8{0xcc} ** BLS_PUBKEY_SIZE,
        .proposer_pubkey = [_]u8{0xdd} ** BLS_PUBKEY_SIZE,
        .proposer_fee_recipient = Address.Address{ .bytes = [_]u8{0xee} ** 20 },
        .gas_limit = 30000000,
        .gas_used = 15000000,
        .value = 100000000000000000,
        .signature = EMPTY_SIGNATURE,
    });

    const bid2 = from(.{
        .slot = 1000000,
        .parent_hash = [_]u8{0xaa} ** 32,
        .block_hash = [_]u8{0xbb} ** 32,
        .builder_pubkey = [_]u8{0xcc} ** BLS_PUBKEY_SIZE,
        .proposer_pubkey = [_]u8{0xdd} ** BLS_PUBKEY_SIZE,
        .proposer_fee_recipient = Address.Address{ .bytes = [_]u8{0xee} ** 20 },
        .gas_limit = 30000000,
        .gas_used = 15000000,
        .value = 100000000000000000,
        .signature = [_]u8{0xff} ** BLS_SIGNATURE_SIZE, // Different signature
    });

    const root1 = signingRoot(bid1);
    const root2 = signingRoot(bid2);

    // Signing root should be the same since signature is excluded
    try std.testing.expectEqualSlices(u8, &root1, &root2);
}
