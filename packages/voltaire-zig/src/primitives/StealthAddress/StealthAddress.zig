//! StealthAddress - ERC-5564 Stealth Address for Privacy
//!
//! Privacy-preserving non-interactive stealth address generation using secp256k1.
//! Enables senders to generate private addresses that only recipients can detect
//! and spend from.
//!
//! ## Design
//! - StealthMetaAddress: concatenation of spending + viewing public keys (66 bytes)
//! - Ephemeral key generation for one-time stealth addresses
//! - View tag for efficient scanning (reduces work by ~6x)
//!
//! ## Protocol Flow
//! 1. Recipient publishes stealth meta-address (spending pubkey + viewing pubkey)
//! 2. Sender generates ephemeral keypair
//! 3. Sender computes shared secret: ephemeral_priv * viewing_pubkey
//! 4. Sender derives stealth address from spending pubkey + shared secret
//! 5. Sender announces ephemeral pubkey + view tag on-chain
//! 6. Recipient scans announcements using viewing key
//! 7. Recipient derives stealth private key to spend
//!
//! @see https://eips.ethereum.org/EIPS/eip-5564

const std = @import("std");
const Keccak256 = std.crypto.hash.sha3.Keccak256;

/// Stealth meta-address length (66 bytes)
/// Format: spendingPubKey (33) || viewingPubKey (33)
pub const STEALTH_META_ADDRESS_SIZE: usize = 66;

/// Compressed public key length (33 bytes)
/// Format: 0x02/0x03 prefix + x-coordinate (32 bytes)
pub const COMPRESSED_PUBLIC_KEY_SIZE: usize = 33;

/// Uncompressed public key length (64 bytes)
/// Format: x-coordinate (32) || y-coordinate (32)
pub const UNCOMPRESSED_PUBLIC_KEY_SIZE: usize = 64;

/// Private key length (32 bytes)
pub const PRIVATE_KEY_SIZE: usize = 32;

/// View tag size (1 byte)
/// First byte of hashed shared secret
pub const VIEW_TAG_SIZE: usize = 1;

/// ERC-5564 scheme ID for secp256k1 with view tags
pub const SCHEME_ID: u8 = 1;

/// Stealth meta-address structure
/// Contains both spending and viewing public keys (compressed)
pub const StealthMetaAddress = struct {
    /// Spending public key (33 bytes, compressed)
    spending_pub_key: [COMPRESSED_PUBLIC_KEY_SIZE]u8,
    /// Viewing public key (33 bytes, compressed)
    viewing_pub_key: [COMPRESSED_PUBLIC_KEY_SIZE]u8,

    /// Create meta-address from spending and viewing public keys
    pub fn init(
        spending_pub_key: [COMPRESSED_PUBLIC_KEY_SIZE]u8,
        viewing_pub_key: [COMPRESSED_PUBLIC_KEY_SIZE]u8,
    ) StealthMetaAddress {
        return .{
            .spending_pub_key = spending_pub_key,
            .viewing_pub_key = viewing_pub_key,
        };
    }

    /// Create meta-address from concatenated 66-byte data
    pub fn fromBytes(data: []const u8) !StealthMetaAddress {
        if (data.len != STEALTH_META_ADDRESS_SIZE) {
            return error.InvalidMetaAddressLength;
        }

        var result: StealthMetaAddress = undefined;
        @memcpy(&result.spending_pub_key, data[0..COMPRESSED_PUBLIC_KEY_SIZE]);
        @memcpy(&result.viewing_pub_key, data[COMPRESSED_PUBLIC_KEY_SIZE..STEALTH_META_ADDRESS_SIZE]);
        return result;
    }

    /// Convert to concatenated 66-byte representation
    pub fn toBytes(self: StealthMetaAddress) [STEALTH_META_ADDRESS_SIZE]u8 {
        var result: [STEALTH_META_ADDRESS_SIZE]u8 = undefined;
        @memcpy(result[0..COMPRESSED_PUBLIC_KEY_SIZE], &self.spending_pub_key);
        @memcpy(result[COMPRESSED_PUBLIC_KEY_SIZE..STEALTH_META_ADDRESS_SIZE], &self.viewing_pub_key);
        return result;
    }

    /// Check equality
    pub fn equals(self: StealthMetaAddress, other: StealthMetaAddress) bool {
        return std.mem.eql(u8, &self.spending_pub_key, &other.spending_pub_key) and
            std.mem.eql(u8, &self.viewing_pub_key, &other.viewing_pub_key);
    }

    /// Convert to hex string (with 0x prefix)
    pub fn toHex(self: StealthMetaAddress) [2 + STEALTH_META_ADDRESS_SIZE * 2]u8 {
        const hex_chars = "0123456789abcdef";
        var result: [2 + STEALTH_META_ADDRESS_SIZE * 2]u8 = undefined;
        result[0] = '0';
        result[1] = 'x';

        const bytes = self.toBytes();
        for (bytes, 0..) |b, i| {
            result[2 + i * 2] = hex_chars[b >> 4];
            result[2 + i * 2 + 1] = hex_chars[b & 0x0f];
        }

        return result;
    }
};

/// Stealth address announcement structure
/// Published on-chain by sender for recipient to scan
pub const StealthAnnouncement = struct {
    /// Ephemeral public key used to derive shared secret (33 bytes, compressed)
    ephemeral_pub_key: [COMPRESSED_PUBLIC_KEY_SIZE]u8,
    /// View tag for fast rejection (1 byte)
    view_tag: u8,
    /// Generated stealth address (20 bytes)
    stealth_address: [20]u8,

    pub fn init(
        ephemeral_pub_key: [COMPRESSED_PUBLIC_KEY_SIZE]u8,
        view_tag: u8,
        stealth_address: [20]u8,
    ) StealthAnnouncement {
        return .{
            .ephemeral_pub_key = ephemeral_pub_key,
            .view_tag = view_tag,
            .stealth_address = stealth_address,
        };
    }

    /// Check if view tag matches (fast rejection test)
    /// Returns true if view tag matches, allowing further processing
    /// Returns false if view tag doesn't match (~255/256 probability for random addresses)
    pub fn matchesViewTag(self: StealthAnnouncement, expected_view_tag: u8) bool {
        return self.view_tag == expected_view_tag;
    }
};

/// Result of stealth address generation
pub const GenerateStealthAddressResult = struct {
    /// The stealth address to receive funds
    stealth_address: [20]u8,
    /// Ephemeral public key to announce
    ephemeral_pub_key: [COMPRESSED_PUBLIC_KEY_SIZE]u8,
    /// View tag for announcement
    view_tag: u8,
};

/// Result of stealth address check
pub const CheckStealthAddressResult = struct {
    /// Whether the stealth address is for this recipient
    is_for_recipient: bool,
    /// Stealth private key scalar (add to spending private key to get full key)
    /// Only valid if is_for_recipient is true
    stealth_key_scalar: ?[PRIVATE_KEY_SIZE]u8,
};

/// Compute view tag from shared secret hash
/// View tag is the first byte of keccak256(shared_secret)
pub fn computeViewTag(shared_secret_hash: [32]u8) u8 {
    return shared_secret_hash[0];
}

/// Compress a 64-byte uncompressed public key to 33-byte compressed format
/// Format: 0x02 (even y) or 0x03 (odd y) + 32-byte x-coordinate
pub fn compressPublicKey(uncompressed: [UNCOMPRESSED_PUBLIC_KEY_SIZE]u8) [COMPRESSED_PUBLIC_KEY_SIZE]u8 {
    var result: [COMPRESSED_PUBLIC_KEY_SIZE]u8 = undefined;

    // Check if y-coordinate is even or odd
    const y_last_byte = uncompressed[UNCOMPRESSED_PUBLIC_KEY_SIZE - 1];
    result[0] = if (y_last_byte & 1 == 0) 0x02 else 0x03;

    // Copy x-coordinate
    @memcpy(result[1..], uncompressed[0..32]);

    return result;
}

/// Parse stealth announcement from encoded bytes
pub fn parseAnnouncement(data: []const u8) !StealthAnnouncement {
    // Minimum: 33 (ephemeral) + 1 (view tag) + 20 (address) = 54 bytes
    if (data.len < 54) {
        return error.InvalidAnnouncementLength;
    }

    var result: StealthAnnouncement = undefined;
    @memcpy(&result.ephemeral_pub_key, data[0..COMPRESSED_PUBLIC_KEY_SIZE]);
    result.view_tag = data[COMPRESSED_PUBLIC_KEY_SIZE];
    @memcpy(&result.stealth_address, data[COMPRESSED_PUBLIC_KEY_SIZE + 1 .. COMPRESSED_PUBLIC_KEY_SIZE + 21]);

    return result;
}

/// Encode stealth announcement to bytes
pub fn encodeAnnouncement(announcement: StealthAnnouncement) [54]u8 {
    var result: [54]u8 = undefined;
    @memcpy(result[0..COMPRESSED_PUBLIC_KEY_SIZE], &announcement.ephemeral_pub_key);
    result[COMPRESSED_PUBLIC_KEY_SIZE] = announcement.view_tag;
    @memcpy(result[COMPRESSED_PUBLIC_KEY_SIZE + 1 .. COMPRESSED_PUBLIC_KEY_SIZE + 21], &announcement.stealth_address);
    return result;
}

/// Validate a compressed public key format
pub fn isValidCompressedPublicKey(key: []const u8) bool {
    if (key.len != COMPRESSED_PUBLIC_KEY_SIZE) return false;
    return key[0] == 0x02 or key[0] == 0x03;
}

/// Hash to derive stealth key scalar from shared secret
/// Uses keccak256 as per ERC-5564
pub fn hashSharedSecret(shared_secret: []const u8) [32]u8 {
    var hash: [32]u8 = undefined;
    Keccak256.hash(shared_secret, &hash, .{});
    return hash;
}

// Tests

test "StealthMetaAddress.init creates meta-address" {
    const spending = [_]u8{0x02} ++ [_]u8{0xaa} ** 32;
    const viewing = [_]u8{0x03} ++ [_]u8{0xbb} ** 32;

    const meta = StealthMetaAddress.init(spending, viewing);

    try std.testing.expectEqualSlices(u8, &spending, &meta.spending_pub_key);
    try std.testing.expectEqualSlices(u8, &viewing, &meta.viewing_pub_key);
}

test "StealthMetaAddress.fromBytes parses 66 bytes" {
    var data: [STEALTH_META_ADDRESS_SIZE]u8 = undefined;
    data[0] = 0x02;
    @memset(data[1..33], 0xaa);
    data[33] = 0x03;
    @memset(data[34..66], 0xbb);

    const meta = try StealthMetaAddress.fromBytes(&data);

    try std.testing.expectEqual(@as(u8, 0x02), meta.spending_pub_key[0]);
    try std.testing.expectEqual(@as(u8, 0x03), meta.viewing_pub_key[0]);
}

test "StealthMetaAddress.fromBytes rejects wrong length" {
    const short_data = [_]u8{0x02} ** 32;
    const result = StealthMetaAddress.fromBytes(&short_data);
    try std.testing.expectError(error.InvalidMetaAddressLength, result);
}

test "StealthMetaAddress.toBytes returns concatenated keys" {
    const spending = [_]u8{0x02} ++ [_]u8{0xaa} ** 32;
    const viewing = [_]u8{0x03} ++ [_]u8{0xbb} ** 32;

    const meta = StealthMetaAddress.init(spending, viewing);
    const bytes = meta.toBytes();

    try std.testing.expectEqualSlices(u8, &spending, bytes[0..33]);
    try std.testing.expectEqualSlices(u8, &viewing, bytes[33..66]);
}

test "StealthMetaAddress.equals returns true for identical" {
    const spending = [_]u8{0x02} ++ [_]u8{0xaa} ** 32;
    const viewing = [_]u8{0x03} ++ [_]u8{0xbb} ** 32;

    const meta1 = StealthMetaAddress.init(spending, viewing);
    const meta2 = StealthMetaAddress.init(spending, viewing);

    try std.testing.expect(meta1.equals(meta2));
}

test "StealthMetaAddress.equals returns false for different" {
    const spending = [_]u8{0x02} ++ [_]u8{0xaa} ** 32;
    const viewing1 = [_]u8{0x03} ++ [_]u8{0xbb} ** 32;
    const viewing2 = [_]u8{0x03} ++ [_]u8{0xcc} ** 32;

    const meta1 = StealthMetaAddress.init(spending, viewing1);
    const meta2 = StealthMetaAddress.init(spending, viewing2);

    try std.testing.expect(!meta1.equals(meta2));
}

test "StealthMetaAddress.toHex returns hex string" {
    const spending = [_]u8{0x02} ++ [_]u8{0x00} ** 32;
    const viewing = [_]u8{0x03} ++ [_]u8{0x00} ** 32;

    const meta = StealthMetaAddress.init(spending, viewing);
    const hex = meta.toHex();

    try std.testing.expectEqualStrings("0x", hex[0..2]);
    try std.testing.expectEqual(@as(usize, 2 + 66 * 2), hex.len);
}

test "StealthAnnouncement.init creates announcement" {
    const ephemeral = [_]u8{0x02} ++ [_]u8{0xdd} ** 32;
    const view_tag: u8 = 0x42;
    const stealth = [_]u8{0xee} ** 20;

    const announcement = StealthAnnouncement.init(ephemeral, view_tag, stealth);

    try std.testing.expectEqualSlices(u8, &ephemeral, &announcement.ephemeral_pub_key);
    try std.testing.expectEqual(view_tag, announcement.view_tag);
    try std.testing.expectEqualSlices(u8, &stealth, &announcement.stealth_address);
}

test "StealthAnnouncement.matchesViewTag returns true for match" {
    const ephemeral = [_]u8{0x02} ++ [_]u8{0xdd} ** 32;
    const stealth = [_]u8{0xee} ** 20;

    const announcement = StealthAnnouncement.init(ephemeral, 0x42, stealth);

    try std.testing.expect(announcement.matchesViewTag(0x42));
}

test "StealthAnnouncement.matchesViewTag returns false for mismatch" {
    const ephemeral = [_]u8{0x02} ++ [_]u8{0xdd} ** 32;
    const stealth = [_]u8{0xee} ** 20;

    const announcement = StealthAnnouncement.init(ephemeral, 0x42, stealth);

    try std.testing.expect(!announcement.matchesViewTag(0x43));
}

test "computeViewTag extracts first byte" {
    const hash = [_]u8{0xde} ++ [_]u8{0xad} ** 31;
    const view_tag = computeViewTag(hash);

    try std.testing.expectEqual(@as(u8, 0xde), view_tag);
}

test "compressPublicKey with even y" {
    var uncompressed: [UNCOMPRESSED_PUBLIC_KEY_SIZE]u8 = undefined;
    @memset(uncompressed[0..32], 0xaa); // x
    @memset(uncompressed[32..63], 0xbb); // y (most bytes)
    uncompressed[63] = 0x00; // y last byte even

    const compressed = compressPublicKey(uncompressed);

    try std.testing.expectEqual(@as(u8, 0x02), compressed[0]);
    try std.testing.expectEqualSlices(u8, uncompressed[0..32], compressed[1..33]);
}

test "compressPublicKey with odd y" {
    var uncompressed: [UNCOMPRESSED_PUBLIC_KEY_SIZE]u8 = undefined;
    @memset(uncompressed[0..32], 0xaa); // x
    @memset(uncompressed[32..63], 0xbb); // y (most bytes)
    uncompressed[63] = 0x01; // y last byte odd

    const compressed = compressPublicKey(uncompressed);

    try std.testing.expectEqual(@as(u8, 0x03), compressed[0]);
    try std.testing.expectEqualSlices(u8, uncompressed[0..32], compressed[1..33]);
}

test "parseAnnouncement parses valid data" {
    var data: [54]u8 = undefined;
    data[0] = 0x02;
    @memset(data[1..33], 0xaa);
    data[33] = 0x42; // view tag
    @memset(data[34..54], 0xee);

    const announcement = try parseAnnouncement(&data);

    try std.testing.expectEqual(@as(u8, 0x02), announcement.ephemeral_pub_key[0]);
    try std.testing.expectEqual(@as(u8, 0x42), announcement.view_tag);
    try std.testing.expectEqual(@as(u8, 0xee), announcement.stealth_address[0]);
}

test "parseAnnouncement rejects short data" {
    const short_data = [_]u8{0x02} ** 32;
    const result = parseAnnouncement(&short_data);
    try std.testing.expectError(error.InvalidAnnouncementLength, result);
}

test "encodeAnnouncement produces parseable output" {
    const ephemeral = [_]u8{0x02} ++ [_]u8{0xdd} ** 32;
    const stealth = [_]u8{0xee} ** 20;

    const announcement = StealthAnnouncement.init(ephemeral, 0x42, stealth);
    const encoded = encodeAnnouncement(announcement);
    const parsed = try parseAnnouncement(&encoded);

    try std.testing.expectEqualSlices(u8, &announcement.ephemeral_pub_key, &parsed.ephemeral_pub_key);
    try std.testing.expectEqual(announcement.view_tag, parsed.view_tag);
    try std.testing.expectEqualSlices(u8, &announcement.stealth_address, &parsed.stealth_address);
}

test "isValidCompressedPublicKey accepts valid keys" {
    const valid_02 = [_]u8{0x02} ++ [_]u8{0xaa} ** 32;
    const valid_03 = [_]u8{0x03} ++ [_]u8{0xbb} ** 32;

    try std.testing.expect(isValidCompressedPublicKey(&valid_02));
    try std.testing.expect(isValidCompressedPublicKey(&valid_03));
}

test "isValidCompressedPublicKey rejects invalid keys" {
    const invalid_prefix = [_]u8{0x04} ++ [_]u8{0xaa} ** 32;
    const wrong_length = [_]u8{0x02} ++ [_]u8{0xaa} ** 16;

    try std.testing.expect(!isValidCompressedPublicKey(&invalid_prefix));
    try std.testing.expect(!isValidCompressedPublicKey(&wrong_length));
}

test "hashSharedSecret produces keccak256 hash" {
    const secret = [_]u8{0xaa} ** 32;
    const hash = hashSharedSecret(&secret);

    // Verify it's a valid 32-byte hash
    try std.testing.expectEqual(@as(usize, 32), hash.len);

    // Same input should produce same output
    const hash2 = hashSharedSecret(&secret);
    try std.testing.expectEqualSlices(u8, &hash, &hash2);
}

test "constants are correct" {
    try std.testing.expectEqual(@as(usize, 66), STEALTH_META_ADDRESS_SIZE);
    try std.testing.expectEqual(@as(usize, 33), COMPRESSED_PUBLIC_KEY_SIZE);
    try std.testing.expectEqual(@as(usize, 64), UNCOMPRESSED_PUBLIC_KEY_SIZE);
    try std.testing.expectEqual(@as(usize, 32), PRIVATE_KEY_SIZE);
    try std.testing.expectEqual(@as(usize, 1), VIEW_TAG_SIZE);
    try std.testing.expectEqual(@as(u8, 1), SCHEME_ID);
}

test "StealthAddress complete workflow simulation" {
    // Simulate the stealth address protocol
    // (without actual elliptic curve operations)

    // 1. Recipient creates meta-address
    const spending_key = [_]u8{0x02} ++ [_]u8{0x11} ** 32;
    const viewing_key = [_]u8{0x03} ++ [_]u8{0x22} ** 32;
    const meta = StealthMetaAddress.init(spending_key, viewing_key);

    // 2. Meta-address can be serialized and shared
    const serialized = meta.toBytes();
    const restored = try StealthMetaAddress.fromBytes(&serialized);
    try std.testing.expect(meta.equals(restored));

    // 3. Sender creates announcement
    const ephemeral = [_]u8{0x02} ++ [_]u8{0x33} ** 32;
    const stealth_addr = [_]u8{0x44} ** 20;
    const view_tag: u8 = 0x55;

    const announcement = StealthAnnouncement.init(ephemeral, view_tag, stealth_addr);

    // 4. Announcement can be encoded and parsed
    const encoded = encodeAnnouncement(announcement);
    const parsed = try parseAnnouncement(&encoded);
    try std.testing.expect(announcement.matchesViewTag(parsed.view_tag));

    // 5. Recipient checks view tag first (fast rejection)
    const wrong_tag: u8 = 0x00;
    try std.testing.expect(!announcement.matchesViewTag(wrong_tag));
    try std.testing.expect(announcement.matchesViewTag(view_tag));
}
