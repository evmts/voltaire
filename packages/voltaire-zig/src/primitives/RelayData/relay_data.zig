//! RelayData - MEV Relay Connection Information
//!
//! Represents MEV relay connection information for Proposer-Builder Separation (PBS).
//! Relays act as trusted intermediaries between block builders and validators.
//!
//! ## Examples
//!
//! ```zig
//! const primitives = @import("primitives");
//! const RelayData = primitives.RelayData;
//!
//! // Create relay data
//! const relay = RelayData.from(.{
//!     .relay_url = "https://relay.flashbots.net",
//!     .relay_pubkey = pubkey,
//!     .slot = 1000000,
//!     // ... other fields
//! });
//! ```

const std = @import("std");
const Address = @import("../Address/address.zig");
const Hash = @import("../Hash/Hash.zig");
const Slot = @import("../Slot/Slot.zig");

/// BLS public key size (48 bytes)
pub const BLS_PUBKEY_SIZE: usize = 48;

/// Well-known MEV relay endpoints
pub const RELAY_FLASHBOTS = "https://relay.flashbots.net";
pub const RELAY_BLOXROUTE_MAX_PROFIT = "https://bloxroute.max-profit.bloxroute.com";
pub const RELAY_BLOXROUTE_REGULATED = "https://bloxroute.regulated.bloxroute.com";
pub const RELAY_EDEN = "https://relay.edennetwork.io";
pub const RELAY_MANIFOLD = "https://mainnet-relay.securerpc.com";
pub const RELAY_ULTRASOUND = "https://relay.ultrasound.money";
pub const RELAY_AGNOSTIC = "https://agnostic-relay.net";

/// RelayData type - represents MEV relay connection info
pub const RelayData = struct {
    /// MEV relay endpoint URL
    relay_url: []const u8,

    /// Relay's BLS public key (48 bytes)
    relay_pubkey: [BLS_PUBKEY_SIZE]u8,

    /// Builder's BLS public key (48 bytes, optional)
    builder_pubkey: ?[BLS_PUBKEY_SIZE]u8 = null,

    /// Current consensus layer slot
    slot: Slot.Slot,

    /// Parent block hash (32 bytes)
    parent_hash: Hash.Hash,

    /// Validator fee recipient address
    proposer_fee_recipient: Address.Address,
};

/// Empty BLS public key
pub const EMPTY_PUBKEY: [BLS_PUBKEY_SIZE]u8 = [_]u8{0} ** BLS_PUBKEY_SIZE;

// ============================================================================
// Constructors
// ============================================================================

/// Create RelayData from struct
pub fn from(data: RelayData) RelayData {
    return data;
}

/// Create RelayData from individual fields
pub fn fromFields(
    relay_url: []const u8,
    relay_pubkey: [BLS_PUBKEY_SIZE]u8,
    slot: Slot.Slot,
    parent_hash: Hash.Hash,
    proposer_fee_recipient: Address.Address,
) RelayData {
    return .{
        .relay_url = relay_url,
        .relay_pubkey = relay_pubkey,
        .slot = slot,
        .parent_hash = parent_hash,
        .proposer_fee_recipient = proposer_fee_recipient,
    };
}

/// Create RelayData with builder pubkey
pub fn fromFieldsWithBuilder(
    relay_url: []const u8,
    relay_pubkey: [BLS_PUBKEY_SIZE]u8,
    builder_pubkey: [BLS_PUBKEY_SIZE]u8,
    slot: Slot.Slot,
    parent_hash: Hash.Hash,
    proposer_fee_recipient: Address.Address,
) RelayData {
    return .{
        .relay_url = relay_url,
        .relay_pubkey = relay_pubkey,
        .builder_pubkey = builder_pubkey,
        .slot = slot,
        .parent_hash = parent_hash,
        .proposer_fee_recipient = proposer_fee_recipient,
    };
}

// ============================================================================
// Accessors
// ============================================================================

/// Get relay URL
pub fn getRelayUrl(relay: RelayData) []const u8 {
    return relay.relay_url;
}

/// Get relay public key
pub fn getRelayPubkey(relay: RelayData) [BLS_PUBKEY_SIZE]u8 {
    return relay.relay_pubkey;
}

/// Get builder public key (if set)
pub fn getBuilderPubkey(relay: RelayData) ?[BLS_PUBKEY_SIZE]u8 {
    return relay.builder_pubkey;
}

/// Get slot number
pub fn getSlot(relay: RelayData) Slot.Slot {
    return relay.slot;
}

/// Get parent hash
pub fn getParentHash(relay: RelayData) Hash.Hash {
    return relay.parent_hash;
}

/// Get proposer fee recipient
pub fn getProposerFeeRecipient(relay: RelayData) Address.Address {
    return relay.proposer_fee_recipient;
}

// ============================================================================
// Endpoint Construction
// ============================================================================

/// Get full endpoint for status check
pub fn getStatusEndpoint(relay: RelayData, buffer: []u8) ![]const u8 {
    return try std.fmt.bufPrint(buffer, "{s}/eth/v1/relay/status", .{relay.relay_url});
}

/// Get full endpoint for builder bid submission
pub fn getSubmitBlockEndpoint(relay: RelayData, buffer: []u8) ![]const u8 {
    return try std.fmt.bufPrint(buffer, "{s}/eth/v1/builder/submit_block", .{relay.relay_url});
}

/// Get full endpoint for getting payload header
pub fn getPayloadEndpoint(relay: RelayData, buffer: []u8) ![]const u8 {
    return try std.fmt.bufPrint(buffer, "{s}/eth/v1/relay/payload", .{relay.relay_url});
}

// ============================================================================
// Predicates
// ============================================================================

/// Check if relay is Flashbots
pub fn isFlashbots(relay: RelayData) bool {
    return std.mem.eql(u8, relay.relay_url, RELAY_FLASHBOTS);
}

/// Check if relay is a Bloxroute relay
pub fn isBloxroute(relay: RelayData) bool {
    return std.mem.indexOf(u8, relay.relay_url, "bloxroute") != null;
}

/// Check if builder pubkey is set
pub fn hasBuilderPubkey(relay: RelayData) bool {
    return relay.builder_pubkey != null;
}

// ============================================================================
// Comparison
// ============================================================================

/// Check if two RelayData are equal (by URL and slot)
pub fn equals(a: RelayData, b: RelayData) bool {
    return std.mem.eql(u8, a.relay_url, b.relay_url) and
        a.slot == b.slot;
}

// ============================================================================
// Tests
// ============================================================================

test "RelayData.from creates relay data" {
    const relay_pubkey: [BLS_PUBKEY_SIZE]u8 = [_]u8{0xaa} ** BLS_PUBKEY_SIZE;
    const parent_hash: Hash.Hash = [_]u8{0xbb} ** 32;
    const fee_recipient = Address.Address{ .bytes = [_]u8{0xcc} ** 20 };

    const relay = from(.{
        .relay_url = RELAY_FLASHBOTS,
        .relay_pubkey = relay_pubkey,
        .slot = 1000000,
        .parent_hash = parent_hash,
        .proposer_fee_recipient = fee_recipient,
    });

    try std.testing.expectEqualStrings(RELAY_FLASHBOTS, relay.relay_url);
    try std.testing.expectEqual(@as(Slot.Slot, 1000000), relay.slot);
}

test "RelayData.fromFields creates relay data" {
    const relay_pubkey: [BLS_PUBKEY_SIZE]u8 = [_]u8{0xdd} ** BLS_PUBKEY_SIZE;
    const parent_hash: Hash.Hash = [_]u8{0xee} ** 32;
    const fee_recipient = Address.Address{ .bytes = [_]u8{0xff} ** 20 };

    const relay = fromFields(
        RELAY_ULTRASOUND,
        relay_pubkey,
        1000000,
        parent_hash,
        fee_recipient,
    );

    try std.testing.expectEqualStrings(RELAY_ULTRASOUND, relay.relay_url);
    try std.testing.expect(relay.builder_pubkey == null);
}

test "RelayData.fromFieldsWithBuilder creates relay data with builder" {
    const relay_pubkey: [BLS_PUBKEY_SIZE]u8 = [_]u8{0x11} ** BLS_PUBKEY_SIZE;
    const builder_pubkey: [BLS_PUBKEY_SIZE]u8 = [_]u8{0x22} ** BLS_PUBKEY_SIZE;
    const parent_hash: Hash.Hash = [_]u8{0x33} ** 32;
    const fee_recipient = Address.Address{ .bytes = [_]u8{0x44} ** 20 };

    const relay = fromFieldsWithBuilder(
        RELAY_FLASHBOTS,
        relay_pubkey,
        builder_pubkey,
        1000000,
        parent_hash,
        fee_recipient,
    );

    try std.testing.expect(relay.builder_pubkey != null);
    try std.testing.expectEqualSlices(u8, &builder_pubkey, &relay.builder_pubkey.?);
}

test "RelayData accessors work correctly" {
    const relay_pubkey: [BLS_PUBKEY_SIZE]u8 = [_]u8{0x55} ** BLS_PUBKEY_SIZE;
    const parent_hash: Hash.Hash = [_]u8{0x66} ** 32;
    const fee_recipient = Address.Address{ .bytes = [_]u8{0x77} ** 20 };

    const relay = from(.{
        .relay_url = RELAY_EDEN,
        .relay_pubkey = relay_pubkey,
        .slot = 1000000,
        .parent_hash = parent_hash,
        .proposer_fee_recipient = fee_recipient,
    });

    try std.testing.expectEqualStrings(RELAY_EDEN, getRelayUrl(relay));
    try std.testing.expectEqualSlices(u8, &relay_pubkey, &getRelayPubkey(relay));
    try std.testing.expectEqual(@as(Slot.Slot, 1000000), getSlot(relay));
    try std.testing.expectEqualSlices(u8, &parent_hash, &getParentHash(relay));
    try std.testing.expect(getBuilderPubkey(relay) == null);
}

test "RelayData.getStatusEndpoint" {
    const relay_pubkey: [BLS_PUBKEY_SIZE]u8 = EMPTY_PUBKEY;
    const parent_hash: Hash.Hash = [_]u8{0} ** 32;
    const fee_recipient = Address.Address{ .bytes = [_]u8{0} ** 20 };

    const relay = from(.{
        .relay_url = "https://example.com",
        .relay_pubkey = relay_pubkey,
        .slot = 1000000,
        .parent_hash = parent_hash,
        .proposer_fee_recipient = fee_recipient,
    });

    var buffer: [256]u8 = undefined;
    const endpoint = try getStatusEndpoint(relay, &buffer);
    try std.testing.expectEqualStrings("https://example.com/eth/v1/relay/status", endpoint);
}

test "RelayData.isFlashbots" {
    const relay_pubkey: [BLS_PUBKEY_SIZE]u8 = EMPTY_PUBKEY;
    const parent_hash: Hash.Hash = [_]u8{0} ** 32;
    const fee_recipient = Address.Address{ .bytes = [_]u8{0} ** 20 };

    const flashbots_relay = from(.{
        .relay_url = RELAY_FLASHBOTS,
        .relay_pubkey = relay_pubkey,
        .slot = 1000000,
        .parent_hash = parent_hash,
        .proposer_fee_recipient = fee_recipient,
    });

    const other_relay = from(.{
        .relay_url = RELAY_ULTRASOUND,
        .relay_pubkey = relay_pubkey,
        .slot = 1000000,
        .parent_hash = parent_hash,
        .proposer_fee_recipient = fee_recipient,
    });

    try std.testing.expect(isFlashbots(flashbots_relay));
    try std.testing.expect(!isFlashbots(other_relay));
}

test "RelayData.isBloxroute" {
    const relay_pubkey: [BLS_PUBKEY_SIZE]u8 = EMPTY_PUBKEY;
    const parent_hash: Hash.Hash = [_]u8{0} ** 32;
    const fee_recipient = Address.Address{ .bytes = [_]u8{0} ** 20 };

    const bloxroute_relay = from(.{
        .relay_url = RELAY_BLOXROUTE_MAX_PROFIT,
        .relay_pubkey = relay_pubkey,
        .slot = 1000000,
        .parent_hash = parent_hash,
        .proposer_fee_recipient = fee_recipient,
    });

    const other_relay = from(.{
        .relay_url = RELAY_FLASHBOTS,
        .relay_pubkey = relay_pubkey,
        .slot = 1000000,
        .parent_hash = parent_hash,
        .proposer_fee_recipient = fee_recipient,
    });

    try std.testing.expect(isBloxroute(bloxroute_relay));
    try std.testing.expect(!isBloxroute(other_relay));
}

test "RelayData.equals compares relay data" {
    const relay_pubkey: [BLS_PUBKEY_SIZE]u8 = [_]u8{0x88} ** BLS_PUBKEY_SIZE;
    const parent_hash: Hash.Hash = [_]u8{0x99} ** 32;
    const fee_recipient = Address.Address{ .bytes = [_]u8{0xaa} ** 20 };

    const relay1 = from(.{
        .relay_url = RELAY_FLASHBOTS,
        .relay_pubkey = relay_pubkey,
        .slot = 1000000,
        .parent_hash = parent_hash,
        .proposer_fee_recipient = fee_recipient,
    });

    const relay2 = from(.{
        .relay_url = RELAY_FLASHBOTS,
        .relay_pubkey = relay_pubkey,
        .slot = 1000000,
        .parent_hash = parent_hash,
        .proposer_fee_recipient = fee_recipient,
    });

    const relay3 = from(.{
        .relay_url = RELAY_ULTRASOUND,
        .relay_pubkey = relay_pubkey,
        .slot = 1000000,
        .parent_hash = parent_hash,
        .proposer_fee_recipient = fee_recipient,
    });

    try std.testing.expect(equals(relay1, relay2));
    try std.testing.expect(!equals(relay1, relay3));
}

test "RelayData.hasBuilderPubkey" {
    const relay_pubkey: [BLS_PUBKEY_SIZE]u8 = EMPTY_PUBKEY;
    const builder_pubkey: [BLS_PUBKEY_SIZE]u8 = [_]u8{0xbb} ** BLS_PUBKEY_SIZE;
    const parent_hash: Hash.Hash = [_]u8{0} ** 32;
    const fee_recipient = Address.Address{ .bytes = [_]u8{0} ** 20 };

    const relay_with_builder = from(.{
        .relay_url = RELAY_FLASHBOTS,
        .relay_pubkey = relay_pubkey,
        .builder_pubkey = builder_pubkey,
        .slot = 1000000,
        .parent_hash = parent_hash,
        .proposer_fee_recipient = fee_recipient,
    });

    const relay_without_builder = from(.{
        .relay_url = RELAY_FLASHBOTS,
        .relay_pubkey = relay_pubkey,
        .slot = 1000000,
        .parent_hash = parent_hash,
        .proposer_fee_recipient = fee_recipient,
    });

    try std.testing.expect(hasBuilderPubkey(relay_with_builder));
    try std.testing.expect(!hasBuilderPubkey(relay_without_builder));
}
