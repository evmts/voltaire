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
};
