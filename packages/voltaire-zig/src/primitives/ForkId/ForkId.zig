//! ForkId - EIP-2124 Fork Identifier
//!
//! Used in DevP2P for fork detection and network validation.
//! Consists of a 4-byte CRC32 hash and a u64 next block number.
//!
//! ## Usage
//! ```zig
//! const ForkId = @import("primitives").ForkId;
//!
//! // Create from hash and next block
//! const fork_id = ForkId.from(0xfc64ec04, 1920000);
//!
//! // Encode to bytes for transmission
//! const bytes = fork_id.toBytes();
//!
//! // Check compatibility
//! const compatible = ForkId.matches(local, remote);
//! ```

const std = @import("std");
const primitives = @import("primitives");
const Rlp = primitives.Rlp;

/// Strip leading zeros from a byte slice (for minimal RLP encoding)
fn stripLeadingZeros(bytes: []const u8) []const u8 {
    for (bytes, 0..) |b, i| {
        if (b != 0) return bytes[i..];
    }
    return bytes[bytes.len..]; // Empty slice if all zeros
}

/// Convert variable-length bytes to u64 (big-endian)
fn bytesToU64(bytes: []const u8) u64 {
    if (bytes.len == 0) return 0;
    if (bytes.len > 8) return 0; // Invalid, return 0
    var result: u64 = 0;
    for (bytes) |b| {
        result = (result << 8) | b;
    }
    return result;
}

/// ForkId - EIP-2124 fork identifier
pub const ForkId = struct {
    /// CRC32 checksum of all fork hashes up to this point (4 bytes)
    hash: [4]u8,
    /// Block number of next upcoming fork (0 if no known forks)
    next: u64,

    /// Create ForkId from hash (as u32) and next block number
    pub fn from(hash: u32, next: u64) ForkId {
        var hash_bytes: [4]u8 = undefined;
        std.mem.writeInt(u32, &hash_bytes, hash, .big);
        return .{
            .hash = hash_bytes,
            .next = next,
        };
    }

    /// Create ForkId from hash bytes and next block number
    pub fn fromBytes(hash: [4]u8, next: u64) ForkId {
        return .{
            .hash = hash,
            .next = next,
        };
    }

    /// Create ForkId from hex string hash and next block number
    pub fn fromHex(hex: []const u8, next: u64) !ForkId {
        var slice = hex;
        if (slice.len >= 2 and slice[0] == '0' and (slice[1] == 'x' or slice[1] == 'X')) {
            slice = slice[2..];
        }
        if (slice.len != 8) return error.InvalidHashLength;

        var hash: [4]u8 = undefined;
        _ = std.fmt.hexToBytes(&hash, slice) catch return error.InvalidHexString;
        return .{
            .hash = hash,
            .next = next,
        };
    }

    /// Encode ForkId to 12 bytes (4 byte hash + 8 byte next big-endian)
    pub fn toBytes(self: ForkId) [12]u8 {
        var result: [12]u8 = undefined;
        @memcpy(result[0..4], &self.hash);
        std.mem.writeInt(u64, result[4..12], self.next, .big);
        return result;
    }

    /// Decode ForkId from 12 bytes
    pub fn fromEncodedBytes(bytes: [12]u8) ForkId {
        return .{
            .hash = bytes[0..4].*,
            .next = std.mem.readInt(u64, bytes[4..12], .big),
        };
    }

    /// Get hash as u32 (big-endian)
    pub fn hashAsU32(self: ForkId) u32 {
        return std.mem.readInt(u32, &self.hash, .big);
    }

    /// Convert hash to hex string (with 0x prefix)
    pub fn toHex(self: ForkId) [10]u8 {
        const hex_chars = "0123456789abcdef";
        var result: [10]u8 = undefined;
        result[0] = '0';
        result[1] = 'x';
        for (self.hash, 0..) |byte, i| {
            result[2 + i * 2] = hex_chars[byte >> 4];
            result[2 + i * 2 + 1] = hex_chars[byte & 0x0f];
        }
        return result;
    }

    /// RLP encode ForkId per EIP-2124: RLP([hash, next])
    /// hash: 4 bytes (fixed), next: variable length big-endian u64
    pub fn rlpEncode(self: ForkId, allocator: std.mem.Allocator) ![]u8 {
        // next as minimal bytes (strip leading zeros per RLP spec)
        var next_bytes: [8]u8 = undefined;
        std.mem.writeInt(u64, &next_bytes, self.next, .big);
        const next_slice = stripLeadingZeros(&next_bytes);

        // Build list: [hash, next]
        var list = std.ArrayList([]const u8){};
        defer list.deinit(allocator);

        try list.append(allocator, &self.hash);
        try list.append(allocator, next_slice);

        return try Rlp.encode(allocator, list.items);
    }

    /// RLP decode ForkId per EIP-2124
    pub fn rlpDecode(allocator: std.mem.Allocator, data: []const u8) !ForkId {
        const decoded = try Rlp.decode(allocator, data, false);
        defer decoded.data.deinit(allocator);

        // Must be a list with 2 elements
        switch (decoded.data) {
            .List => |items| {
                if (items.len != 2) {
                    return error.InvalidForkIdEncoding;
                }

                // First element: hash (must be 4 bytes)
                const hash_bytes = switch (items[0]) {
                    .String => |str| str,
                    .List => return error.InvalidForkIdEncoding,
                };
                if (hash_bytes.len != 4) {
                    return error.InvalidHashLength;
                }
                var hash: [4]u8 = undefined;
                @memcpy(&hash, hash_bytes);

                // Second element: next block (variable length)
                const next_bytes = switch (items[1]) {
                    .String => |str| str,
                    .List => return error.InvalidForkIdEncoding,
                };
                const next = bytesToU64(next_bytes);

                return .{
                    .hash = hash,
                    .next = next,
                };
            },
            .String => return error.InvalidForkIdEncoding,
        }
    }

    /// Check if two ForkIds are equal
    pub fn equals(self: ForkId, other: ForkId) bool {
        return std.mem.eql(u8, &self.hash, &other.hash) and self.next == other.next;
    }

    /// Check if two ForkIds are compatible (EIP-2124 fork validation)
    ///
    /// Compatible if:
    /// 1. Hashes match and next blocks match (identical)
    /// 2. Hashes match and remote next is 0 (remote knows of no future forks)
    /// 3. Hashes match and local next is 0 (local knows of no future forks)
    /// 4. Hashes differ but remote next is >= local next (remote is ahead but compatible)
    pub fn matches(local: ForkId, remote: ForkId) bool {
        const hashes_match = std.mem.eql(u8, &local.hash, &remote.hash);

        // Case 1: Hashes match
        if (hashes_match) {
            // Identical fork IDs
            if (local.next == remote.next) return true;
            // Remote knows of no future forks
            if (remote.next == 0) return true;
            // Local knows of no future forks
            if (local.next == 0) return true;
            // Both know of future forks but they differ - incompatible
            return false;
        }

        // Case 2: Hashes differ
        // Remote is on a future fork that we know about
        if (remote.next >= local.next and local.next != 0) {
            return true;
        }

        // Incompatible forks
        return false;
    }
};

// ============================================================================
// Tests
// ============================================================================

test "ForkId: from creates fork ID from hash and next" {
    const fork_id = ForkId.from(0xfc64ec04, 1920000);
    try std.testing.expectEqual(@as(u32, 0xfc64ec04), fork_id.hashAsU32());
    try std.testing.expectEqual(@as(u64, 1920000), fork_id.next);
}

test "ForkId: fromBytes creates from byte array" {
    const hash = [_]u8{ 0xfc, 0x64, 0xec, 0x04 };
    const fork_id = ForkId.fromBytes(hash, 1920000);
    try std.testing.expectEqualSlices(u8, &hash, &fork_id.hash);
    try std.testing.expectEqual(@as(u64, 1920000), fork_id.next);
}

test "ForkId: fromHex creates from hex string" {
    const fork_id = try ForkId.fromHex("0xfc64ec04", 1920000);
    try std.testing.expectEqual(@as(u32, 0xfc64ec04), fork_id.hashAsU32());
    try std.testing.expectEqual(@as(u64, 1920000), fork_id.next);
}

test "ForkId: fromHex without prefix" {
    const fork_id = try ForkId.fromHex("fc64ec04", 1920000);
    try std.testing.expectEqual(@as(u32, 0xfc64ec04), fork_id.hashAsU32());
}

test "ForkId: fromHex invalid length" {
    try std.testing.expectError(error.InvalidHashLength, ForkId.fromHex("0x1234", 0));
}

test "ForkId: toBytes encodes to 12 bytes" {
    const fork_id = ForkId.from(0xfc64ec04, 1920000);
    const bytes = fork_id.toBytes();
    try std.testing.expectEqual(@as(usize, 12), bytes.len);
}

test "ForkId: toBytes encodes correctly" {
    const fork_id = ForkId.from(0x00000001, 0x0000000000000002);
    const bytes = fork_id.toBytes();

    // First 4 bytes: hash
    try std.testing.expectEqual(@as(u8, 0x00), bytes[0]);
    try std.testing.expectEqual(@as(u8, 0x00), bytes[1]);
    try std.testing.expectEqual(@as(u8, 0x00), bytes[2]);
    try std.testing.expectEqual(@as(u8, 0x01), bytes[3]);

    // Last 8 bytes: next (big-endian)
    try std.testing.expectEqual(@as(u8, 0x00), bytes[4]);
    try std.testing.expectEqual(@as(u8, 0x00), bytes[5]);
    try std.testing.expectEqual(@as(u8, 0x00), bytes[6]);
    try std.testing.expectEqual(@as(u8, 0x00), bytes[7]);
    try std.testing.expectEqual(@as(u8, 0x00), bytes[8]);
    try std.testing.expectEqual(@as(u8, 0x00), bytes[9]);
    try std.testing.expectEqual(@as(u8, 0x00), bytes[10]);
    try std.testing.expectEqual(@as(u8, 0x02), bytes[11]);
}

test "ForkId: toBytes handles zero next" {
    const fork_id = ForkId.from(0xfc64ec04, 0);
    const bytes = fork_id.toBytes();
    try std.testing.expectEqual(@as(usize, 12), bytes.len);

    // Last 8 bytes should be zero
    for (bytes[4..12]) |b| {
        try std.testing.expectEqual(@as(u8, 0), b);
    }
}

test "ForkId: fromEncodedBytes roundtrip" {
    const original = ForkId.from(0xfc64ec04, 1920000);
    const bytes = original.toBytes();
    const decoded = ForkId.fromEncodedBytes(bytes);
    try std.testing.expect(original.equals(decoded));
}

test "ForkId: equals same fork IDs" {
    const a = ForkId.from(0xfc64ec04, 1920000);
    const b = ForkId.from(0xfc64ec04, 1920000);
    try std.testing.expect(a.equals(b));
}

test "ForkId: equals different hash" {
    const a = ForkId.from(0xfc64ec04, 1920000);
    const b = ForkId.from(0x12345678, 1920000);
    try std.testing.expect(!a.equals(b));
}

test "ForkId: equals different next" {
    const a = ForkId.from(0xfc64ec04, 1920000);
    const b = ForkId.from(0xfc64ec04, 2000000);
    try std.testing.expect(!a.equals(b));
}

test "ForkId: matches identical fork IDs" {
    const local = ForkId.from(0xfc64ec04, 1920000);
    const remote = ForkId.from(0xfc64ec04, 1920000);
    try std.testing.expect(ForkId.matches(local, remote));
}

test "ForkId: matches when remote has no future forks" {
    const local = ForkId.from(0xfc64ec04, 1920000);
    const remote = ForkId.from(0xfc64ec04, 0);
    try std.testing.expect(ForkId.matches(local, remote));
}

test "ForkId: matches when local has no future forks" {
    const local = ForkId.from(0xfc64ec04, 0);
    const remote = ForkId.from(0xfc64ec04, 1920000);
    try std.testing.expect(ForkId.matches(local, remote));
}

test "ForkId: not match when hashes match but both have different future forks" {
    const local = ForkId.from(0xfc64ec04, 1920000);
    const remote = ForkId.from(0xfc64ec04, 2000000);
    try std.testing.expect(!ForkId.matches(local, remote));
}

test "ForkId: matches when remote is ahead on known fork" {
    const local = ForkId.from(0x12345678, 1920000);
    const remote = ForkId.from(0xabcdef00, 2000000);
    try std.testing.expect(ForkId.matches(local, remote));
}

test "ForkId: not match incompatible forks" {
    const local = ForkId.from(0x12345678, 2000000);
    const remote = ForkId.from(0xabcdef00, 1500000);
    try std.testing.expect(!ForkId.matches(local, remote));
}

test "ForkId: not match when local next is 0 and hashes differ" {
    const local = ForkId.from(0x12345678, 0);
    const remote = ForkId.from(0xabcdef00, 1500000);
    try std.testing.expect(!ForkId.matches(local, remote));
}

test "ForkId: mainnet genesis fork" {
    const genesis = ForkId.from(0xfc64ec04, 1150000);
    try std.testing.expectEqual(@as(u32, 0xfc64ec04), genesis.hashAsU32());
    try std.testing.expectEqual(@as(u64, 1150000), genesis.next);
}

test "ForkId: fork progression" {
    const frontier = ForkId.from(0xfc64ec04, 1150000);
    const homestead = ForkId.from(0x97c2c34c, 1920000);
    // Same network, different forks - should be compatible
    try std.testing.expect(ForkId.matches(frontier, homestead));
}

test "ForkId: different networks" {
    const mainnet = ForkId.from(0xfc64ec04, 1920000);
    const ropsten = ForkId.from(0x30c7ddbc, 10);
    try std.testing.expect(!ForkId.matches(mainnet, ropsten));
}

test "ForkId: toHex returns hex string with 0x prefix" {
    const fork_id = ForkId.from(0xfc64ec04, 1920000);
    const hex = fork_id.toHex();
    try std.testing.expectEqualStrings("0xfc64ec04", &hex);
}

test "ForkId: toHex handles zero hash" {
    const fork_id = ForkId.from(0x00000000, 0);
    const hex = fork_id.toHex();
    try std.testing.expectEqualStrings("0x00000000", &hex);
}

test "ForkId: rlpEncode and rlpDecode roundtrip" {
    const allocator = std.testing.allocator;
    const original = ForkId.from(0xfc64ec04, 1920000);

    const encoded = try original.rlpEncode(allocator);
    defer allocator.free(encoded);

    const decoded = try ForkId.rlpDecode(allocator, encoded);
    try std.testing.expect(original.equals(decoded));
}

test "ForkId: rlpEncode with zero next" {
    const allocator = std.testing.allocator;
    const fork_id = ForkId.from(0xfc64ec04, 0);

    const encoded = try fork_id.rlpEncode(allocator);
    defer allocator.free(encoded);

    const decoded = try ForkId.rlpDecode(allocator, encoded);
    try std.testing.expect(fork_id.equals(decoded));
    try std.testing.expectEqual(@as(u64, 0), decoded.next);
}

test "ForkId: rlpEncode with max u64 next" {
    const allocator = std.testing.allocator;
    const fork_id = ForkId.from(0xdeadbeef, std.math.maxInt(u64));

    const encoded = try fork_id.rlpEncode(allocator);
    defer allocator.free(encoded);

    const decoded = try ForkId.rlpDecode(allocator, encoded);
    try std.testing.expect(fork_id.equals(decoded));
}

test "ForkId: RLP encoding format per EIP-2124" {
    const allocator = std.testing.allocator;
    // Test with known mainnet frontier fork
    const fork_id = ForkId.from(0xfc64ec04, 1150000);

    const encoded = try fork_id.rlpEncode(allocator);
    defer allocator.free(encoded);

    // RLP list: [4-byte hash, variable next]
    // List prefix: 0xc0 + length (short list)
    // hash: 0x84 + fc64ec04 (4 bytes = 0x84 prefix)
    // next: 1150000 = 0x118c30 (3 bytes = 0x83 prefix)
    // Total: 1 (list) + 1 + 4 (hash) + 1 + 3 (next) = 10 bytes
    try std.testing.expectEqual(@as(usize, 10), encoded.len);

    // First byte is list prefix (0xc0 + 9 = 0xc9)
    try std.testing.expectEqual(@as(u8, 0xc9), encoded[0]);
}

test "ForkId: Ethereum mainnet fork IDs (EIP-2124 reference)" {
    // Mainnet fork IDs from EIP-2124 specification
    const allocator = std.testing.allocator;

    // Frontier: hash=0xfc64ec04, next=1150000 (Homestead)
    const frontier = ForkId.from(0xfc64ec04, 1150000);
    try std.testing.expectEqual(@as(u32, 0xfc64ec04), frontier.hashAsU32());

    // Homestead: hash=0x97c2c34c, next=1920000 (DAO fork)
    const homestead = ForkId.from(0x97c2c34c, 1920000);
    try std.testing.expectEqual(@as(u32, 0x97c2c34c), homestead.hashAsU32());

    // Verify roundtrip for mainnet forks
    const encoded = try frontier.rlpEncode(allocator);
    defer allocator.free(encoded);
    const decoded = try ForkId.rlpDecode(allocator, encoded);
    try std.testing.expect(frontier.equals(decoded));
}
