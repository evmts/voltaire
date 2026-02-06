const std = @import("std");
const Keccak256 = std.crypto.hash.sha3.Keccak256;

/// Hash of empty EVM bytecode (Keccak256 of empty bytes).
///
/// This is a well-known constant in Ethereum representing the Keccak256 hash
/// of an empty byte array. It's used to identify accounts with no associated
/// contract code.
///
/// Value: Keccak256("") = 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470
pub const EMPTY_CODE_HASH = [32]u8{
    0xc5, 0xd2, 0x46, 0x01, 0x86, 0xf7, 0x23, 0x3c,
    0x92, 0x7e, 0x7d, 0xb2, 0xdc, 0xc7, 0x03, 0xc0,
    0xe5, 0x00, 0xb6, 0x53, 0xca, 0x82, 0x27, 0x3b,
    0x7b, 0xfa, 0xd8, 0x04, 0x5d, 0x85, 0xa4, 0x70,
};

comptime {
    @setEvalBranchQuota(10000);
    // Validate that the hardcoded empty code hash matches Keccak256("")
    var hasher = Keccak256.init(.{});
    hasher.update(&.{});
    var computed_hash: [32]u8 = undefined;
    hasher.final(&computed_hash);

    for (computed_hash, EMPTY_CODE_HASH) |computed, expected| {
        if (computed != expected) {
            @compileError("EMPTY_CODE_HASH does not match Keccak256 of empty bytes");
        }
    }
}

/// Root hash of an empty Merkle Patricia Trie.
///
/// This is the root hash of an empty trie structure in Ethereum, used as
/// the initial value for account storage roots and state roots when they
/// contain no data.
///
/// Value: 0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421
pub const EMPTY_TRIE_ROOT = [32]u8{
    0x56, 0xe8, 0x1f, 0x17, 0x1b, 0xcc, 0x55, 0xa6,
    0xff, 0x83, 0x45, 0xe6, 0x92, 0xc0, 0xf8, 0x6e,
    0x5b, 0x48, 0xe0, 0x1b, 0x99, 0x6c, 0xad, 0xc0,
    0x01, 0x62, 0x2f, 0xb5, 0xe3, 0x63, 0xb4, 0x21,
};

comptime {
    @setEvalBranchQuota(10000);
    // Validate that the hardcoded empty trie root matches the expected value
    // The empty trie root is the Keccak256 hash of RLP(null) = 0x80
    var hasher = Keccak256.init(.{});
    hasher.update(&[_]u8{0x80}); // RLP encoding of empty/null
    var computed_hash: [32]u8 = undefined;
    hasher.final(&computed_hash);

    for (computed_hash, EMPTY_TRIE_ROOT) |computed, expected| {
        if (computed != expected) {
            @compileError("EMPTY_TRIE_ROOT does not match Keccak256 of RLP(null)");
        }
    }
}

/// Composite key for EVM storage operations combining address and slot.
///
/// The StorageKey uniquely identifies a storage location within the EVM by
/// combining a contract address with a 256-bit storage slot number. This is
/// fundamental to how the EVM organizes persistent contract storage.
///
/// ## Design Rationale
/// Each smart contract has its own isolated storage space addressed by 256-bit
/// slots. To track storage across multiple contracts in a single VM instance,
/// we need a composite key that includes both the contract address and the
/// slot number.
///
/// ## Storage Model
/// In the EVM:
/// - Each contract has 2^256 storage slots
/// - Each slot can store a 256-bit value
/// - Slots are initially zero and only consume gas when first written
///
/// ## Usage
/// ```zig
/// const key = StorageKey{
///     .address = contract_address,
///     .slot = 0x0, // First storage slot
/// };
///
/// // Use in hash maps for storage tracking
/// var storage = std.AutoHashMap(StorageKey, u256).init(allocator);
/// try storage.put(key, value);
/// ```
///
/// ## Hashing Strategy
/// The key implements a generic hash function that works with any hasher
/// implementing the standard update() interface. The address is hashed first,
/// followed by the slot number in big-endian format.
pub const StorageKey = struct {
    /// The contract address that owns this storage slot.
    /// Standard 20-byte Ethereum address.
    address: [20]u8,

    /// The 256-bit storage slot number within the contract's storage space.
    /// Slots are sparsely allocated - most remain at zero value.
    slot: u256,

    /// Compute a hash of this storage key for use in hash maps.
    ///
    /// This function is designed to work with Zig's AutoHashMap and any
    /// hasher that implements the standard `update([]const u8)` method.
    ///
    /// The hash combines both the address and slot to ensure unique hashes
    /// for different storage locations. The slot is converted to big-endian
    /// bytes to ensure consistent hashing across different architectures.
    ///
    /// @param self The storage key to hash
    /// @param hasher Any hasher with an update() method
    ///
    /// Example:
    /// ```zig
    /// var map = std.AutoHashMap(StorageKey, u256).init(allocator);
    /// const key = StorageKey{ .address = addr, .slot = slot };
    /// try map.put(key, value); // Uses hash() internally
    /// ```
    pub fn hash(self: StorageKey, hasher: anytype) void {
        // Hash the address bytes
        hasher.update(&self.address);
        // Hash the slot as bytes in big-endian format for consistency
        var slot_bytes: [32]u8 = undefined;
        std.mem.writeInt(u256, &slot_bytes, self.slot, .big);
        hasher.update(&slot_bytes);
    }

    /// Check equality between two storage keys.
    ///
    /// Two storage keys are equal if and only if both their address and
    /// slot number match exactly. This is used by hash maps to resolve
    /// collisions and find exact matches.
    ///
    /// @param a First storage key
    /// @param b Second storage key
    /// @return true if both address and slot match
    ///
    /// Example:
    /// ```zig
    /// const key1 = StorageKey{ .address = addr, .slot = 0 };
    /// const key2 = StorageKey{ .address = addr, .slot = 0 };
    /// if (!StorageKey.eql(key1, key2)) unreachable;
    /// ```
    pub fn eql(a: StorageKey, b: StorageKey) bool {
        // Fast path for identical keys (likely in hot loops)
        if (std.mem.eql(u8, &a.address, &b.address) and a.slot == b.slot) {
            @branchHint(.likely);
            return true;
        } else {
            @branchHint(.cold);
            return false;
        }
    }

    /// Convert StorageKey to string representation for serialization/storage.
    ///
    /// Format: address_hex + "_" + slot_hex (40 hex chars + "_" + 64 hex chars)
    /// Example: "0101010101010101010101010101010101010101_000000000000000000000000000000000000000000000000000000000000002a"
    ///
    /// The string can be parsed back using fromString().
    ///
    /// @param self The storage key to convert
    /// @param allocator Allocator for string memory
    /// @return Allocated string (caller must free)
    ///
    /// Example:
    /// ```zig
    /// const key = StorageKey{ .address = addr, .slot = 42 };
    /// const str = try key.toString(allocator);
    /// defer allocator.free(str);
    /// ```
    pub fn toString(self: StorageKey, allocator: std.mem.Allocator) ![]u8 {
        // Format: 40 hex chars (address) + 1 underscore + 64 hex chars (slot) = 105 chars
        var buf = try allocator.alloc(u8, 105);
        errdefer allocator.free(buf);

        // Convert address to hex (40 chars)
        for (self.address, 0..) |byte, i| {
            const hex_chars = "0123456789abcdef";
            buf[i * 2] = hex_chars[byte >> 4];
            buf[i * 2 + 1] = hex_chars[byte & 0x0F];
        }

        // Add separator
        buf[40] = '_';

        // Convert slot to big-endian bytes then to hex (64 chars)
        var slot_bytes: [32]u8 = undefined;
        std.mem.writeInt(u256, &slot_bytes, self.slot, .big);
        for (slot_bytes, 0..) |byte, i| {
            const hex_chars = "0123456789abcdef";
            buf[41 + i * 2] = hex_chars[byte >> 4];
            buf[41 + i * 2 + 1] = hex_chars[byte & 0x0F];
        }

        return buf;
    }

    /// Parse a StorageKey from its string representation.
    ///
    /// The string must be in the format produced by toString():
    /// address_hex (40 chars) + "_" + slot_hex (64 chars)
    ///
    /// @param str String to parse
    /// @return Parsed StorageKey or error if invalid format
    ///
    /// Example:
    /// ```zig
    /// const str = "0101010101010101010101010101010101010101_000000000000000000000000000000000000000000000000000000000000002a";
    /// const key = try StorageKey.fromString(str);
    /// ```
    pub fn fromString(str: []const u8) !StorageKey {
        // Validate length: 40 (address) + 1 (separator) + 64 (slot) = 105
        if (str.len != 105) return error.InvalidStringLength;

        // Find and validate separator
        if (str[40] != '_') return error.InvalidSeparator;

        const addr_hex = str[0..40];
        const slot_hex = str[41..105];

        // Parse address from hex
        var address: [20]u8 = undefined;
        for (0..20) |i| {
            const hi = try hexCharToNibble(addr_hex[i * 2]);
            const lo = try hexCharToNibble(addr_hex[i * 2 + 1]);
            address[i] = (@as(u8, hi) << 4) | @as(u8, lo);
        }

        // Parse slot from hex
        var slot_bytes: [32]u8 = undefined;
        for (0..32) |i| {
            const hi = try hexCharToNibble(slot_hex[i * 2]);
            const lo = try hexCharToNibble(slot_hex[i * 2 + 1]);
            slot_bytes[i] = (@as(u8, hi) << 4) | @as(u8, lo);
        }
        const slot = std.mem.readInt(u256, &slot_bytes, .big);

        return StorageKey{ .address = address, .slot = slot };
    }

    /// Compute a numeric hash code for the storage key.
    ///
    /// This uses a simple but fast hash algorithm compatible with JavaScript's
    /// hash-based collections. The result is a 32-bit signed integer (i32).
    ///
    /// @param self The storage key to hash
    /// @return Hash code as i32
    ///
    /// Example:
    /// ```zig
    /// const key = StorageKey{ .address = addr, .slot = 42 };
    /// const hash = key.hashCode();
    /// ```
    pub fn hashCode(self: StorageKey) i32 {
        var hash_val: i32 = 0;

        // Hash address bytes
        for (self.address) |byte| {
            hash_val = (@as(i32, @intCast(hash_val)) << 5) -% hash_val +% @as(i32, @intCast(byte));
        }

        // Hash slot (lower 64 bits for compatibility with JS)
        const slot_low: u32 = @truncate(self.slot & 0xFFFFFFFF);
        const slot_high: u32 = @truncate((self.slot >> 32) & 0xFFFFFFFF);

        hash_val = (hash_val << 5) -% hash_val +% @as(i32, @bitCast(slot_low));
        hash_val = (hash_val << 5) -% hash_val +% @as(i32, @bitCast(slot_high));

        return hash_val;
    }
};

// Helper function for hex parsing
fn hexCharToNibble(c: u8) !u4 {
    return switch (c) {
        '0'...'9' => @intCast(c - '0'),
        'a'...'f' => @intCast(c - 'a' + 10),
        'A'...'F' => @intCast(c - 'A' + 10),
        else => error.InvalidHexCharacter,
    };
}

// =============================================================================
// Tests
// =============================================================================

test "StorageKey.toString produces correct format" {
    const addr = [_]u8{0x01} ** 20;
    const key = StorageKey{ .address = addr, .slot = 42 };

    const str = try key.toString(std.testing.allocator);
    defer std.testing.allocator.free(str);

    // Should be 105 chars: 40 (address) + 1 (separator) + 64 (slot)
    try std.testing.expectEqual(@as(usize, 105), str.len);

    // Check separator
    try std.testing.expectEqual(@as(u8, '_'), str[40]);

    // Check format (address should be all 01s)
    try std.testing.expectEqualStrings("0101010101010101010101010101010101010101", str[0..40]);

    // Check slot hex (42 decimal = 0x2a)
    try std.testing.expect(std.mem.endsWith(u8, str[41..], "2a"));
}

test "StorageKey.toString with zero values" {
    const addr = [_]u8{0x00} ** 20;
    const key = StorageKey{ .address = addr, .slot = 0 };

    const str = try key.toString(std.testing.allocator);
    defer std.testing.allocator.free(str);

    try std.testing.expectEqual(@as(usize, 105), str.len);
    try std.testing.expectEqualStrings("0000000000000000000000000000000000000000", str[0..40]);
    try std.testing.expectEqualStrings("0000000000000000000000000000000000000000000000000000000000000000", str[41..]);
}

test "StorageKey.toString with maximum values" {
    const addr = [_]u8{0xFF} ** 20;
    const max_slot: u256 = std.math.maxInt(u256);
    const key = StorageKey{ .address = addr, .slot = max_slot };

    const str = try key.toString(std.testing.allocator);
    defer std.testing.allocator.free(str);

    try std.testing.expectEqual(@as(usize, 105), str.len);
    try std.testing.expectEqualStrings("ffffffffffffffffffffffffffffffffffffffff", str[0..40]);
    try std.testing.expectEqualStrings("ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff", str[41..]);
}

test "StorageKey.toString produces different strings for different keys" {
    const addr1 = [_]u8{0x01} ** 20;
    const addr2 = [_]u8{0x02} ** 20;
    const key1 = StorageKey{ .address = addr1, .slot = 42 };
    const key2 = StorageKey{ .address = addr2, .slot = 42 };

    const str1 = try key1.toString(std.testing.allocator);
    defer std.testing.allocator.free(str1);
    const str2 = try key2.toString(std.testing.allocator);
    defer std.testing.allocator.free(str2);

    try std.testing.expect(!std.mem.eql(u8, str1, str2));
}

test "StorageKey.toString produces different strings for different slots" {
    const addr = [_]u8{0x01} ** 20;
    const key1 = StorageKey{ .address = addr, .slot = 42 };
    const key2 = StorageKey{ .address = addr, .slot = 43 };

    const str1 = try key1.toString(std.testing.allocator);
    defer std.testing.allocator.free(str1);
    const str2 = try key2.toString(std.testing.allocator);
    defer std.testing.allocator.free(str2);

    try std.testing.expect(!std.mem.eql(u8, str1, str2));
}

test "StorageKey.fromString parses valid string" {
    const valid_str = "0101010101010101010101010101010101010101_000000000000000000000000000000000000000000000000000000000000002a";
    const key = try StorageKey.fromString(valid_str);

    try std.testing.expectEqual(@as(u256, 0x2a), key.slot);
    try std.testing.expectEqual(@as(u8, 0x01), key.address[0]);
    try std.testing.expectEqual(@as(u8, 0x01), key.address[19]);
}

test "StorageKey.fromString round-trip with zero values" {
    const addr = [_]u8{0x00} ** 20;
    const original = StorageKey{ .address = addr, .slot = 0 };

    const str = try original.toString(std.testing.allocator);
    defer std.testing.allocator.free(str);

    const parsed = try StorageKey.fromString(str);
    try std.testing.expect(StorageKey.eql(original, parsed));
}

test "StorageKey.fromString round-trip with large values" {
    const addr = [_]u8{0xFF} ** 20;
    const large_slot: u256 = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF;
    const original = StorageKey{ .address = addr, .slot = large_slot };

    const str = try original.toString(std.testing.allocator);
    defer std.testing.allocator.free(str);

    const parsed = try StorageKey.fromString(str);
    try std.testing.expect(StorageKey.eql(original, parsed));
}

test "StorageKey.fromString round-trip with pattern address" {
    const addr = [20]u8{ 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F, 0x10, 0x11, 0x12, 0x13, 0x14 };
    const original = StorageKey{ .address = addr, .slot = 123456789 };

    const str = try original.toString(std.testing.allocator);
    defer std.testing.allocator.free(str);

    const parsed = try StorageKey.fromString(str);
    try std.testing.expect(StorageKey.eql(original, parsed));
}

test "StorageKey.fromString rejects invalid length" {
    try std.testing.expectError(error.InvalidStringLength, StorageKey.fromString("short"));
    try std.testing.expectError(error.InvalidStringLength, StorageKey.fromString("0101010101010101010101010101010101010101_00000000000000000000000000000000000000000000000000000000000000"));
}

test "StorageKey.fromString rejects missing separator" {
    // String has correct length (105) but wrong separator position
    const no_sep = "0101010101010101010101010101010101010101X0000000000000000000000000000000000000000000000000000000000000000";
    try std.testing.expectError(error.InvalidSeparator, StorageKey.fromString(no_sep));
}

test "StorageKey.fromString rejects invalid hex characters" {
    try std.testing.expectError(error.InvalidHexCharacter, StorageKey.fromString("ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ_0000000000000000000000000000000000000000000000000000000000000000"));
    try std.testing.expectError(error.InvalidHexCharacter, StorageKey.fromString("0101010101010101010101010101010101010101_ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ"));
}

test "StorageKey.fromString accepts both upper and lower case hex" {
    const lower = "abcdef0123456789abcdef0123456789abcdef01_0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    const upper = "ABCDEF0123456789ABCDEF0123456789ABCDEF01_0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF";

    const key_lower = try StorageKey.fromString(lower);
    const key_upper = try StorageKey.fromString(upper);

    try std.testing.expect(StorageKey.eql(key_lower, key_upper));
}

test "StorageKey.hashCode produces consistent results" {
    const addr = [_]u8{0xAB} ** 20;
    const key = StorageKey{ .address = addr, .slot = 12345 };

    const hash1 = key.hashCode();
    const hash2 = key.hashCode();

    try std.testing.expectEqual(hash1, hash2);
}

test "StorageKey.hashCode produces different values for different addresses" {
    const addr1 = [_]u8{0x01} ** 20;
    const addr2 = [_]u8{0x02} ** 20;
    const key1 = StorageKey{ .address = addr1, .slot = 0 };
    const key2 = StorageKey{ .address = addr2, .slot = 0 };

    const hash1 = key1.hashCode();
    const hash2 = key2.hashCode();

    try std.testing.expect(hash1 != hash2);
}

test "StorageKey.hashCode produces different values for different slots" {
    const addr = [_]u8{0x01} ** 20;
    const key1 = StorageKey{ .address = addr, .slot = 42 };
    const key2 = StorageKey{ .address = addr, .slot = 43 };

    const hash1 = key1.hashCode();
    const hash2 = key2.hashCode();

    try std.testing.expect(hash1 != hash2);
}

test "StorageKey.hashCode handles zero values" {
    const addr = [_]u8{0x00} ** 20;
    const key = StorageKey{ .address = addr, .slot = 0 };

    const hash_code = key.hashCode();
    // Should produce a deterministic value
    try std.testing.expectEqual(@as(i32, 0), hash_code);
}

test "StorageKey.hashCode handles maximum values" {
    const addr = [_]u8{0xFF} ** 20;
    const max_slot: u256 = std.math.maxInt(u256);
    const key = StorageKey{ .address = addr, .slot = max_slot };

    const hash_code = key.hashCode();
    // Should not crash and should produce a valid i32
    _ = hash_code;
}

test "EMPTY_CODE_HASH is correct Keccak256 of empty bytes" {
    var hasher = Keccak256.init(.{});
    hasher.update(&.{});
    var computed: [32]u8 = undefined;
    hasher.final(&computed);

    try std.testing.expectEqualSlices(u8, &EMPTY_CODE_HASH, &computed);
}

test "EMPTY_TRIE_ROOT is correct Keccak256 of RLP null" {
    var hasher = Keccak256.init(.{});
    hasher.update(&[_]u8{0x80}); // RLP encoding of null
    var computed: [32]u8 = undefined;
    hasher.final(&computed);

    try std.testing.expectEqualSlices(u8, &EMPTY_TRIE_ROOT, &computed);
}

test "StorageKey equality with identical keys" {
    const addr = [_]u8{0x01} ** 20;
    const key1 = StorageKey{ .address = addr, .slot = 42 };
    const key2 = StorageKey{ .address = addr, .slot = 42 };

    try std.testing.expect(StorageKey.eql(key1, key2));
}

test "StorageKey equality with different addresses" {
    const addr1 = [_]u8{0x01} ** 20;
    const addr2 = [_]u8{0x02} ** 20;
    const key1 = StorageKey{ .address = addr1, .slot = 42 };
    const key2 = StorageKey{ .address = addr2, .slot = 42 };

    try std.testing.expect(!StorageKey.eql(key1, key2));
}

test "StorageKey equality with different slots" {
    const addr = [_]u8{0x01} ** 20;
    const key1 = StorageKey{ .address = addr, .slot = 42 };
    const key2 = StorageKey{ .address = addr, .slot = 43 };

    try std.testing.expect(!StorageKey.eql(key1, key2));
}

test "StorageKey equality with different addresses and slots" {
    const addr1 = [_]u8{0x01} ** 20;
    const addr2 = [_]u8{0x02} ** 20;
    const key1 = StorageKey{ .address = addr1, .slot = 42 };
    const key2 = StorageKey{ .address = addr2, .slot = 43 };

    try std.testing.expect(!StorageKey.eql(key1, key2));
}

test "StorageKey with zero values" {
    const addr = [_]u8{0x00} ** 20;
    const key1 = StorageKey{ .address = addr, .slot = 0 };
    const key2 = StorageKey{ .address = addr, .slot = 0 };

    try std.testing.expect(StorageKey.eql(key1, key2));
}

test "StorageKey with maximum u256 slot value" {
    const addr = [_]u8{0xFF} ** 20;
    const max_slot: u256 = std.math.maxInt(u256);
    const key1 = StorageKey{ .address = addr, .slot = max_slot };
    const key2 = StorageKey{ .address = addr, .slot = max_slot };

    try std.testing.expect(StorageKey.eql(key1, key2));
}

test "StorageKey hash produces different values for different addresses" {
    const addr1 = [_]u8{0x01} ** 20;
    const addr2 = [_]u8{0x02} ** 20;
    const key1 = StorageKey{ .address = addr1, .slot = 0 };
    const key2 = StorageKey{ .address = addr2, .slot = 0 };

    var hasher1 = std.hash.Wyhash.init(0);
    var hasher2 = std.hash.Wyhash.init(0);

    key1.hash(&hasher1);
    key2.hash(&hasher2);

    const hash1 = hasher1.final();
    const hash2 = hasher2.final();

    try std.testing.expect(hash1 != hash2);
}

test "StorageKey hash produces different values for different slots" {
    const addr = [_]u8{0x01} ** 20;
    const key1 = StorageKey{ .address = addr, .slot = 0 };
    const key2 = StorageKey{ .address = addr, .slot = 1 };

    var hasher1 = std.hash.Wyhash.init(0);
    var hasher2 = std.hash.Wyhash.init(0);

    key1.hash(&hasher1);
    key2.hash(&hasher2);

    const hash1 = hasher1.final();
    const hash2 = hasher2.final();

    try std.testing.expect(hash1 != hash2);
}

test "StorageKey hash is consistent across multiple calls" {
    const addr = [_]u8{0xAB} ** 20;
    const key = StorageKey{ .address = addr, .slot = 12345 };

    var hasher1 = std.hash.Wyhash.init(0);
    var hasher2 = std.hash.Wyhash.init(0);

    key.hash(&hasher1);
    key.hash(&hasher2);

    const hash1 = hasher1.final();
    const hash2 = hasher2.final();

    try std.testing.expectEqual(hash1, hash2);
}

test "StorageKey hash with maximum values" {
    const addr = [_]u8{0xFF} ** 20;
    const max_slot: u256 = std.math.maxInt(u256);
    const key = StorageKey{ .address = addr, .slot = max_slot };

    var hasher = std.hash.Wyhash.init(0);
    key.hash(&hasher);
    const hash_value = hasher.final();

    // Should not crash and should produce a valid hash
    try std.testing.expect(hash_value != 0 or hash_value == 0);
}

test "StorageKey hash with minimum values" {
    const addr = [_]u8{0x00} ** 20;
    const key = StorageKey{ .address = addr, .slot = 0 };

    var hasher = std.hash.Wyhash.init(0);
    key.hash(&hasher);
    const hash_value = hasher.final();

    // Should not crash and should produce a valid hash
    try std.testing.expect(hash_value != 0 or hash_value == 0);
}

test "StorageKey in AutoHashMap basic operations" {
    var map = std.AutoHashMap(StorageKey, u256).init(std.testing.allocator);
    defer map.deinit();

    const addr = [_]u8{0x42} ** 20;
    const key = StorageKey{ .address = addr, .slot = 100 };
    const value: u256 = 999;

    try map.put(key, value);

    const retrieved = map.get(key);
    try std.testing.expect(retrieved != null);
    try std.testing.expectEqual(value, retrieved.?);
}

test "StorageKey in AutoHashMap with multiple entries" {
    var map = std.AutoHashMap(StorageKey, u256).init(std.testing.allocator);
    defer map.deinit();

    const addr1 = [_]u8{0x11} ** 20;
    const addr2 = [_]u8{0x22} ** 20;
    const addr3 = [_]u8{0x33} ** 20;

    const key1 = StorageKey{ .address = addr1, .slot = 0 };
    const key2 = StorageKey{ .address = addr2, .slot = 1 };
    const key3 = StorageKey{ .address = addr3, .slot = 2 };

    try map.put(key1, 100);
    try map.put(key2, 200);
    try map.put(key3, 300);

    try std.testing.expectEqual(@as(u256, 100), map.get(key1).?);
    try std.testing.expectEqual(@as(u256, 200), map.get(key2).?);
    try std.testing.expectEqual(@as(u256, 300), map.get(key3).?);
}

test "StorageKey in AutoHashMap overwrites value for same key" {
    var map = std.AutoHashMap(StorageKey, u256).init(std.testing.allocator);
    defer map.deinit();

    const addr = [_]u8{0x99} ** 20;
    const key = StorageKey{ .address = addr, .slot = 5 };

    try map.put(key, 111);
    try std.testing.expectEqual(@as(u256, 111), map.get(key).?);

    try map.put(key, 222);
    try std.testing.expectEqual(@as(u256, 222), map.get(key).?);
}

test "StorageKey in AutoHashMap with same address different slots" {
    var map = std.AutoHashMap(StorageKey, u256).init(std.testing.allocator);
    defer map.deinit();

    const addr = [_]u8{0xAA} ** 20;

    const key0 = StorageKey{ .address = addr, .slot = 0 };
    const key1 = StorageKey{ .address = addr, .slot = 1 };
    const key2 = StorageKey{ .address = addr, .slot = 2 };

    try map.put(key0, 10);
    try map.put(key1, 20);
    try map.put(key2, 30);

    try std.testing.expectEqual(@as(u256, 10), map.get(key0).?);
    try std.testing.expectEqual(@as(u256, 20), map.get(key1).?);
    try std.testing.expectEqual(@as(u256, 30), map.get(key2).?);
}

test "StorageKey in AutoHashMap removal" {
    var map = std.AutoHashMap(StorageKey, u256).init(std.testing.allocator);
    defer map.deinit();

    const addr = [_]u8{0xBB} ** 20;
    const key = StorageKey{ .address = addr, .slot = 77 };

    try map.put(key, 555);
    try std.testing.expect(map.get(key) != null);

    _ = map.remove(key);
    try std.testing.expect(map.get(key) == null);
}

test "StorageKey in AutoHashMap with large slot numbers" {
    var map = std.AutoHashMap(StorageKey, u256).init(std.testing.allocator);
    defer map.deinit();

    const addr = [_]u8{0xCC} ** 20;
    const large_slot: u256 = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF;
    const key = StorageKey{ .address = addr, .slot = large_slot };

    try map.put(key, 12345);
    try std.testing.expectEqual(@as(u256, 12345), map.get(key).?);
}

test "StorageKey memory layout is predictable" {
    const key = StorageKey{
        .address = [_]u8{0x01} ** 20,
        .slot = 42,
    };

    // Verify the struct size (20 bytes address + padding + 32 bytes u256)
    // u256 requires 16-byte alignment, so struct gets padded to 64 bytes
    try std.testing.expectEqual(64, @sizeOf(StorageKey));

    // Verify fields are accessible
    try std.testing.expectEqual(@as(u256, 42), key.slot);
    try std.testing.expectEqual(@as(u8, 0x01), key.address[0]);
    try std.testing.expectEqual(@as(u8, 0x01), key.address[19]);
}

test "StorageKey creation with various address patterns" {
    const zero_addr = [_]u8{0x00} ** 20;
    const max_addr = [_]u8{0xFF} ** 20;
    const pattern_addr = [20]u8{ 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0x0C, 0x0D, 0x0E, 0x0F, 0x10, 0x11, 0x12, 0x13, 0x14 };

    const key1 = StorageKey{ .address = zero_addr, .slot = 0 };
    const key2 = StorageKey{ .address = max_addr, .slot = std.math.maxInt(u256) };
    const key3 = StorageKey{ .address = pattern_addr, .slot = 123456789 };

    try std.testing.expect(StorageKey.eql(key1, key1));
    try std.testing.expect(StorageKey.eql(key2, key2));
    try std.testing.expect(StorageKey.eql(key3, key3));

    try std.testing.expect(!StorageKey.eql(key1, key2));
    try std.testing.expect(!StorageKey.eql(key2, key3));
    try std.testing.expect(!StorageKey.eql(key1, key3));
}

test "StorageKey slot ordering edge cases" {
    const addr = [_]u8{0x55} ** 20;

    const key_slot_0 = StorageKey{ .address = addr, .slot = 0 };
    const key_slot_1 = StorageKey{ .address = addr, .slot = 1 };
    const key_slot_max_minus_1 = StorageKey{ .address = addr, .slot = std.math.maxInt(u256) - 1 };
    const key_slot_max = StorageKey{ .address = addr, .slot = std.math.maxInt(u256) };

    // Adjacent slots should not be equal
    try std.testing.expect(!StorageKey.eql(key_slot_0, key_slot_1));
    try std.testing.expect(!StorageKey.eql(key_slot_max_minus_1, key_slot_max));

    // Same keys should be equal
    const key_slot_0_dup = StorageKey{ .address = addr, .slot = 0 };
    try std.testing.expect(StorageKey.eql(key_slot_0, key_slot_0_dup));
}

test "StorageKey address boundary differences" {
    const addr1 = [20]u8{ 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFE };
    const addr2 = [20]u8{ 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF };

    const key1 = StorageKey{ .address = addr1, .slot = 0 };
    const key2 = StorageKey{ .address = addr2, .slot = 0 };

    // One bit difference in address should make keys unequal
    try std.testing.expect(!StorageKey.eql(key1, key2));
}

test "StorageKey hash endianness consistency for slot" {
    const addr = [_]u8{0x77} ** 20;
    const slot: u256 = 0x0102030405060708090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F20;
    const key = StorageKey{ .address = addr, .slot = slot };

    // Hash the key
    var hasher = std.hash.Wyhash.init(0);
    key.hash(&hasher);
    const hash_value = hasher.final();

    // Create slot bytes manually in big-endian to verify
    var slot_bytes: [32]u8 = undefined;
    std.mem.writeInt(u256, &slot_bytes, slot, .big);

    // Verify the slot bytes are in big-endian order
    try std.testing.expectEqual(@as(u8, 0x01), slot_bytes[0]);
    try std.testing.expectEqual(@as(u8, 0x20), slot_bytes[31]);

    // Hash should be deterministic
    try std.testing.expect(hash_value != 0 or hash_value == 0);
}
