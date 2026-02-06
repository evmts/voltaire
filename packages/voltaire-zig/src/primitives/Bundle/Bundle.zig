//! Bundle - Flashbots transaction bundle for MEV strategies
//!
//! Represents a transaction bundle for MEV (Maximal Extractable Value) strategies.
//! Bundles are atomic collections of transactions submitted to block builders via
//! MEV relays like Flashbots. All transactions in a bundle execute sequentially
//! in the same block or the bundle is discarded.
//!
//! ## Usage
//! ```zig
//! const Bundle = @import("primitives").Bundle;
//!
//! // Create bundle
//! var bundle = Bundle.init(allocator);
//! defer bundle.deinit();
//!
//! // Add transactions
//! try bundle.addTransaction(&tx_bytes);
//!
//! // Set block number
//! bundle.block_number = 12345678;
//!
//! // Get bundle hash
//! const hash = bundle.toHash();
//! ```
//!
//! @see https://docs.flashbots.net/flashbots-auction/overview

const std = @import("std");
const BundleHash = @import("../BundleHash/BundleHash.zig");
const Hash = @import("../Hash/Hash.zig");
const crypto = @import("crypto");

/// Bundle struct representing a Flashbots transaction bundle
pub const Bundle = struct {
    /// Ordered array of signed transaction bytes
    /// All transactions execute sequentially in this order
    transactions: std.ArrayList([]const u8),

    /// Target block number for bundle inclusion (optional)
    /// If specified, bundle is only valid for this block
    block_number: ?u64 = null,

    /// Minimum block timestamp for bundle inclusion (optional)
    /// Bundle will not be included before this timestamp
    min_timestamp: ?u256 = null,

    /// Maximum block timestamp for bundle inclusion (optional)
    /// Bundle will not be included after this timestamp
    max_timestamp: ?u256 = null,

    /// Transaction hashes allowed to revert (optional)
    /// If any other transaction reverts, entire bundle is discarded
    /// If a hash in this array reverts, bundle continues execution
    reverting_tx_hashes: std.ArrayList([32]u8),

    /// Allocator used for this bundle
    allocator: std.mem.Allocator,

    /// Whether we own the transaction data (for cleanup)
    owns_tx_data: bool = false,

    const Self = @This();

    /// Initialize a new empty bundle
    pub fn init(allocator: std.mem.Allocator) Self {
        return .{
            .transactions = std.ArrayList([]const u8){},
            .reverting_tx_hashes = std.ArrayList([32]u8){},
            .allocator = allocator,
        };
    }

    /// Deinitialize and free resources
    pub fn deinit(self: *Self) void {
        if (self.owns_tx_data) {
            for (self.transactions.items) |tx| {
                self.allocator.free(tx);
            }
        }
        self.transactions.deinit(self.allocator);
        self.reverting_tx_hashes.deinit(self.allocator);
    }
};

// ============================================================================
// Constructors
// ============================================================================

/// Create a new empty bundle
pub fn init(allocator: std.mem.Allocator) Bundle {
    return Bundle.init(allocator);
}

test "init - creates empty bundle" {
    var bundle = init(std.testing.allocator);
    defer bundle.deinit();
    try std.testing.expectEqual(@as(usize, 0), size(&bundle));
    try std.testing.expect(bundle.block_number == null);
}

/// Create bundle from a slice of transaction bytes
pub fn from(allocator: std.mem.Allocator, txs: []const []const u8) !Bundle {
    var bundle = init(allocator);
    errdefer bundle.deinit();

    for (txs) |tx| {
        try bundle.transactions.append(bundle.allocator, tx);
    }

    return bundle;
}

test "from - creates bundle with transactions" {
    const tx1 = &[_]u8{ 0x01, 0x02, 0x03 };
    const tx2 = &[_]u8{ 0x04, 0x05, 0x06 };
    const txs = [_][]const u8{ tx1, tx2 };

    var bundle = try from(std.testing.allocator, &txs);
    defer bundle.deinit();

    try std.testing.expectEqual(@as(usize, 2), size(&bundle));
}

test "from - empty transactions" {
    const txs = [_][]const u8{};
    var bundle = try from(std.testing.allocator, &txs);
    defer bundle.deinit();
    try std.testing.expectEqual(@as(usize, 0), size(&bundle));
}

// ============================================================================
// Mutation
// ============================================================================

/// Add a transaction to the bundle
pub fn addTransaction(bundle: *Bundle, tx: []const u8) !void {
    try bundle.transactions.append(bundle.allocator, tx);
}

test "addTransaction - adds to bundle" {
    var bundle = init(std.testing.allocator);
    defer bundle.deinit();

    const tx = &[_]u8{ 0xde, 0xad, 0xbe, 0xef };
    try addTransaction(&bundle, tx);

    try std.testing.expectEqual(@as(usize, 1), size(&bundle));
}

test "addTransaction - preserves order" {
    var bundle = init(std.testing.allocator);
    defer bundle.deinit();

    const tx1 = &[_]u8{0x01};
    const tx2 = &[_]u8{0x02};
    const tx3 = &[_]u8{0x03};

    try addTransaction(&bundle, tx1);
    try addTransaction(&bundle, tx2);
    try addTransaction(&bundle, tx3);

    try std.testing.expectEqual(@as(u8, 0x01), bundle.transactions.items[0][0]);
    try std.testing.expectEqual(@as(u8, 0x02), bundle.transactions.items[1][0]);
    try std.testing.expectEqual(@as(u8, 0x03), bundle.transactions.items[2][0]);
}

/// Add a reverting transaction hash to the allow list
pub fn addRevertingTxHash(bundle: *Bundle, hash: [32]u8) !void {
    try bundle.reverting_tx_hashes.append(bundle.allocator, hash);
}

test "addRevertingTxHash - adds to list" {
    var bundle = init(std.testing.allocator);
    defer bundle.deinit();

    const hash = [_]u8{0xaa} ** 32;
    try addRevertingTxHash(&bundle, hash);

    try std.testing.expectEqual(@as(usize, 1), bundle.reverting_tx_hashes.items.len);
}

// ============================================================================
// Accessors
// ============================================================================

/// Get the number of transactions in the bundle
pub fn size(bundle: *const Bundle) usize {
    return bundle.transactions.items.len;
}

test "size - empty bundle" {
    var bundle = init(std.testing.allocator);
    defer bundle.deinit();
    try std.testing.expectEqual(@as(usize, 0), size(&bundle));
}

test "size - with transactions" {
    var bundle = init(std.testing.allocator);
    defer bundle.deinit();

    try addTransaction(&bundle, &[_]u8{0x01});
    try addTransaction(&bundle, &[_]u8{0x02});

    try std.testing.expectEqual(@as(usize, 2), size(&bundle));
}

/// Get transaction at index
pub fn getTransaction(bundle: *const Bundle, index: usize) ?[]const u8 {
    if (index >= bundle.transactions.items.len) return null;
    return bundle.transactions.items[index];
}

test "getTransaction - valid index" {
    var bundle = init(std.testing.allocator);
    defer bundle.deinit();

    const tx = &[_]u8{ 0xde, 0xad };
    try addTransaction(&bundle, tx);

    const result = getTransaction(&bundle, 0);
    try std.testing.expect(result != null);
    try std.testing.expectEqualSlices(u8, tx, result.?);
}

test "getTransaction - invalid index" {
    var bundle = init(std.testing.allocator);
    defer bundle.deinit();

    const result = getTransaction(&bundle, 0);
    try std.testing.expect(result == null);
}

/// Check if bundle is empty
pub fn isEmpty(bundle: *const Bundle) bool {
    return bundle.transactions.items.len == 0;
}

test "isEmpty - empty bundle" {
    var bundle = init(std.testing.allocator);
    defer bundle.deinit();
    try std.testing.expect(isEmpty(&bundle));
}

test "isEmpty - non-empty bundle" {
    var bundle = init(std.testing.allocator);
    defer bundle.deinit();
    try addTransaction(&bundle, &[_]u8{0x01});
    try std.testing.expect(!isEmpty(&bundle));
}

// ============================================================================
// Converters
// ============================================================================

/// Compute bundle hash from transaction hashes
/// Note: This is a simplified version - real implementation would hash actual tx hashes
pub fn toHash(bundle: *const Bundle) BundleHash.BundleHash {
    var hasher = crypto.Keccak256.init(.{});

    for (bundle.transactions.items) |tx| {
        // Hash each transaction to get tx hash, then include in bundle hash
        var tx_hash: [32]u8 = undefined;
        crypto.Keccak256.hash(tx, &tx_hash);
        hasher.update(&tx_hash);
    }

    var result: BundleHash.BundleHash = undefined;
    hasher.final(&result);
    return result;
}

test "toHash - empty bundle" {
    var bundle = init(std.testing.allocator);
    defer bundle.deinit();
    const hash = toHash(&bundle);
    try std.testing.expectEqual(BundleHash.SIZE, hash.len);
}

test "toHash - deterministic" {
    var bundle1 = init(std.testing.allocator);
    defer bundle1.deinit();
    try addTransaction(&bundle1, &[_]u8{ 0x01, 0x02 });

    var bundle2 = init(std.testing.allocator);
    defer bundle2.deinit();
    try addTransaction(&bundle2, &[_]u8{ 0x01, 0x02 });

    const hash1 = toHash(&bundle1);
    const hash2 = toHash(&bundle2);
    try std.testing.expect(BundleHash.equals(&hash1, &hash2));
}

test "toHash - different for different bundles" {
    var bundle1 = init(std.testing.allocator);
    defer bundle1.deinit();
    try addTransaction(&bundle1, &[_]u8{0x01});

    var bundle2 = init(std.testing.allocator);
    defer bundle2.deinit();
    try addTransaction(&bundle2, &[_]u8{0x02});

    const hash1 = toHash(&bundle1);
    const hash2 = toHash(&bundle2);
    try std.testing.expect(!BundleHash.equals(&hash1, &hash2));
}

/// Convert bundle to Flashbots params format (JSON-compatible struct)
pub const FlashbotsParams = struct {
    txs: []const []const u8,
    block_number: ?u64,
    min_timestamp: ?u256,
    max_timestamp: ?u256,
    reverting_tx_hashes: []const [32]u8,
};

pub fn toFlashbotsParams(bundle: *const Bundle) FlashbotsParams {
    return .{
        .txs = bundle.transactions.items,
        .block_number = bundle.block_number,
        .min_timestamp = bundle.min_timestamp,
        .max_timestamp = bundle.max_timestamp,
        .reverting_tx_hashes = bundle.reverting_tx_hashes.items,
    };
}

test "toFlashbotsParams - converts bundle" {
    var bundle = init(std.testing.allocator);
    defer bundle.deinit();

    const tx = &[_]u8{0x01};
    try addTransaction(&bundle, tx);
    bundle.block_number = 12345678;

    const params = toFlashbotsParams(&bundle);
    try std.testing.expectEqual(@as(usize, 1), params.txs.len);
    try std.testing.expectEqual(@as(?u64, 12345678), params.block_number);
}

// ============================================================================
// Validation
// ============================================================================

/// Validate bundle constraints
pub fn validate(bundle: *const Bundle) !void {
    // Bundle must have at least one transaction
    if (bundle.transactions.items.len == 0) {
        return error.EmptyBundle;
    }

    // If both timestamps set, min must be <= max
    if (bundle.min_timestamp != null and bundle.max_timestamp != null) {
        if (bundle.min_timestamp.? > bundle.max_timestamp.?) {
            return error.InvalidTimestampRange;
        }
    }
}

test "validate - valid bundle" {
    var bundle = init(std.testing.allocator);
    defer bundle.deinit();
    try addTransaction(&bundle, &[_]u8{0x01});

    try validate(&bundle);
}

test "validate - empty bundle fails" {
    var bundle = init(std.testing.allocator);
    defer bundle.deinit();

    try std.testing.expectError(error.EmptyBundle, validate(&bundle));
}

test "validate - invalid timestamp range" {
    var bundle = init(std.testing.allocator);
    defer bundle.deinit();
    try addTransaction(&bundle, &[_]u8{0x01});

    bundle.min_timestamp = 200;
    bundle.max_timestamp = 100;

    try std.testing.expectError(error.InvalidTimestampRange, validate(&bundle));
}

test "validate - valid timestamp range" {
    var bundle = init(std.testing.allocator);
    defer bundle.deinit();
    try addTransaction(&bundle, &[_]u8{0x01});

    bundle.min_timestamp = 100;
    bundle.max_timestamp = 200;

    try validate(&bundle);
}

// ============================================================================
// Equality
// ============================================================================

/// Check if two bundles are equal (same transactions in same order)
pub fn equals(a: *const Bundle, b: *const Bundle) bool {
    if (a.transactions.items.len != b.transactions.items.len) return false;
    if (a.block_number != b.block_number) return false;
    if (a.min_timestamp != b.min_timestamp) return false;
    if (a.max_timestamp != b.max_timestamp) return false;

    // Compare transactions
    for (a.transactions.items, 0..) |tx_a, i| {
        const tx_b = b.transactions.items[i];
        if (!std.mem.eql(u8, tx_a, tx_b)) return false;
    }

    // Compare reverting hashes
    if (a.reverting_tx_hashes.items.len != b.reverting_tx_hashes.items.len) return false;
    for (a.reverting_tx_hashes.items, 0..) |hash_a, i| {
        const hash_b = b.reverting_tx_hashes.items[i];
        if (!std.mem.eql(u8, &hash_a, &hash_b)) return false;
    }

    return true;
}

test "equals - same bundles" {
    var a = init(std.testing.allocator);
    defer a.deinit();
    try addTransaction(&a, &[_]u8{0x01});
    a.block_number = 123;

    var b = init(std.testing.allocator);
    defer b.deinit();
    try addTransaction(&b, &[_]u8{0x01});
    b.block_number = 123;

    try std.testing.expect(equals(&a, &b));
}

test "equals - different transactions" {
    var a = init(std.testing.allocator);
    defer a.deinit();
    try addTransaction(&a, &[_]u8{0x01});

    var b = init(std.testing.allocator);
    defer b.deinit();
    try addTransaction(&b, &[_]u8{0x02});

    try std.testing.expect(!equals(&a, &b));
}

test "equals - different block number" {
    var a = init(std.testing.allocator);
    defer a.deinit();
    try addTransaction(&a, &[_]u8{0x01});
    a.block_number = 123;

    var b = init(std.testing.allocator);
    defer b.deinit();
    try addTransaction(&b, &[_]u8{0x01});
    b.block_number = 456;

    try std.testing.expect(!equals(&a, &b));
}

// ============================================================================
// Clone
// ============================================================================

/// Create a deep copy of the bundle
pub fn clone(allocator: std.mem.Allocator, bundle: *const Bundle) !Bundle {
    var new_bundle = init(allocator);
    errdefer new_bundle.deinit();

    // Copy transactions
    for (bundle.transactions.items) |tx| {
        const tx_copy = try allocator.dupe(u8, tx);
        try new_bundle.transactions.append(allocator, tx_copy);
    }
    new_bundle.owns_tx_data = true;

    // Copy settings
    new_bundle.block_number = bundle.block_number;
    new_bundle.min_timestamp = bundle.min_timestamp;
    new_bundle.max_timestamp = bundle.max_timestamp;

    // Copy reverting hashes
    for (bundle.reverting_tx_hashes.items) |hash| {
        try new_bundle.reverting_tx_hashes.append(allocator, hash);
    }

    return new_bundle;
}

test "clone - creates independent copy" {
    var original = init(std.testing.allocator);
    defer original.deinit();
    try addTransaction(&original, &[_]u8{0x01});
    original.block_number = 123;

    var copy = try clone(std.testing.allocator, &original);
    defer copy.deinit();

    try std.testing.expect(equals(&original, &copy));
}
