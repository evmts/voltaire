//! Withdrawal - Ethereum withdrawal (post-merge)
//!
//! Post-merge (Shanghai/Capella upgrade) withdrawal from beacon chain
//! validators to execution layer accounts (EIP-4895).
//!
//! ## EIP-4895 Overview
//! - Introduces a system-level operation to push validator withdrawals from
//!   beacon chain to EVM
//! - Withdrawals are included in blocks as a new field in the execution payload
//! - Each withdrawal has: index, validator_index, address, amount (in Gwei)
//!
//! ## Usage
//! ```zig
//! const Withdrawal = @import("primitives").Withdrawal;
//!
//! // Create withdrawal
//! const withdrawal = Withdrawal.from(
//!     1000000,   // index
//!     123456,    // validator index
//!     address,   // 20-byte address
//!     32000000000, // amount in Gwei
//! );
//!
//! // RLP encode
//! const encoded = try withdrawal.rlpEncode(allocator);
//!
//! // Get withdrawal hash
//! const h = try withdrawal.hash(allocator);
//!
//! // Get amount in wei
//! const wei = withdrawal.getAmountWei();
//! ```
//!
//! @see https://eips.ethereum.org/EIPS/eip-4895

const std = @import("std");
const primitives = @import("primitives");
const Address = primitives.Address;
const Rlp = primitives.Rlp;
const crypto = @import("crypto");
const Keccak256 = crypto.Keccak256;

/// Conversion factor from Gwei to Wei (1e9)
pub const GWEI_TO_WEI: u64 = 1_000_000_000;

/// Withdrawal type - represents Ethereum withdrawal (post-merge)
pub const Withdrawal = struct {
    /// Withdrawal index (monotonically increasing)
    index: u64,
    /// Validator index on beacon chain
    validator_index: u64,
    /// Address receiving withdrawal (20 bytes)
    address: Address,
    /// Amount in Gwei
    amount: u64,

    /// Create Withdrawal from components
    pub fn from(index: u64, validator_index: u64, address: Address, amount: u64) Withdrawal {
        return .{
            .index = index,
            .validator_index = validator_index,
            .address = address,
            .amount = amount,
        };
    }

    /// Create Withdrawal from address bytes
    pub fn fromAddressBytes(index: u64, validator_index: u64, addr_bytes: [20]u8, amount: u64) Withdrawal {
        return .{
            .index = index,
            .validator_index = validator_index,
            .address = Address{ .bytes = addr_bytes },
            .amount = amount,
        };
    }

    /// Create Withdrawal from hex address
    pub fn fromHexAddress(index: u64, validator_index: u64, addr_hex: []const u8, amount: u64) !Withdrawal {
        const addr = try Address.fromHex(addr_hex);
        return .{
            .index = index,
            .validator_index = validator_index,
            .address = addr,
            .amount = amount,
        };
    }

    /// Check if two Withdrawals are equal
    pub fn equals(self: Withdrawal, other: Withdrawal) bool {
        return self.index == other.index and
            self.validator_index == other.validator_index and
            self.amount == other.amount and
            std.mem.eql(u8, &self.address.bytes, &other.address.bytes);
    }

    /// RLP encode the withdrawal
    /// Returns: encoded bytes (caller owns memory)
    pub fn rlpEncode(self: Withdrawal, allocator: std.mem.Allocator) ![]u8 {
        // Convert index to bytes (strip leading zeros)
        var index_bytes: [8]u8 = undefined;
        std.mem.writeInt(u64, &index_bytes, self.index, .big);
        const index_slice = stripLeadingZeros(&index_bytes);

        // Convert validator_index to bytes
        var validator_bytes: [8]u8 = undefined;
        std.mem.writeInt(u64, &validator_bytes, self.validator_index, .big);
        const validator_slice = stripLeadingZeros(&validator_bytes);

        // Convert amount to bytes
        var amount_bytes: [8]u8 = undefined;
        std.mem.writeInt(u64, &amount_bytes, self.amount, .big);
        const amount_slice = stripLeadingZeros(&amount_bytes);

        // Build list of items
        var list = std.ArrayList([]const u8){};
        defer list.deinit(allocator);

        try list.append(allocator, index_slice);
        try list.append(allocator, validator_slice);
        try list.append(allocator, &self.address.bytes);
        try list.append(allocator, amount_slice);

        return try Rlp.encode(allocator, list.items);
    }

    /// RLP decode withdrawal
    pub fn rlpDecode(allocator: std.mem.Allocator, data: []const u8) !Withdrawal {
        var decoded = try Rlp.decode(allocator, data);
        defer decoded.deinit(allocator);

        if (decoded.items.len != 4) {
            return error.InvalidWithdrawalEncoding;
        }

        // Decode index
        const index = bytesToU64(decoded.items[0].bytes);

        // Decode validator_index
        const validator_index = bytesToU64(decoded.items[1].bytes);

        // Decode address
        if (decoded.items[2].bytes.len != 20) {
            return error.InvalidAddressLength;
        }
        var address: Address = undefined;
        @memcpy(&address.bytes, decoded.items[2].bytes);

        // Decode amount
        const amount = bytesToU64(decoded.items[3].bytes);

        return .{
            .index = index,
            .validator_index = validator_index,
            .address = address,
            .amount = amount,
        };
    }

    /// Get address as hex string
    pub fn addressToHex(self: Withdrawal) [42]u8 {
        return self.address.toHex();
    }

    /// Get amount in Wei (amount * 1e9)
    /// Since amount is stored in Gwei, multiply by GWEI_TO_WEI to get Wei
    pub fn getAmountWei(self: Withdrawal) u128 {
        return @as(u128, self.amount) * GWEI_TO_WEI;
    }

    /// Compute the Keccak256 hash of the RLP-encoded withdrawal
    /// This is used for computing withdrawal roots in block headers
    pub fn hash(self: Withdrawal, allocator: std.mem.Allocator) ![32]u8 {
        const encoded = try self.rlpEncode(allocator);
        defer allocator.free(encoded);

        var result: [32]u8 = undefined;
        Keccak256.hash(encoded, &result, .{});
        return result;
    }
};

/// Convert bytes to u64 (big-endian, variable length)
fn bytesToU64(bytes: []const u8) u64 {
    if (bytes.len == 0) return 0;
    if (bytes.len > 8) return 0; // Invalid

    var result: u64 = 0;
    for (bytes) |b| {
        result = (result << 8) | b;
    }
    return result;
}

/// Strip leading zeros from bytes, keeping at least empty slice for 0
fn stripLeadingZeros(bytes: []const u8) []const u8 {
    var i: usize = 0;
    while (i < bytes.len and bytes[i] == 0) {
        i += 1;
    }
    if (i == bytes.len) return &[_]u8{};
    return bytes[i..];
}

// ============================================================================
// Tests
// ============================================================================

test "Withdrawal: from creates withdrawal" {
    const addr = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
    const withdrawal = Withdrawal.from(1000000, 123456, addr, 32000000000);

    try std.testing.expectEqual(@as(u64, 1000000), withdrawal.index);
    try std.testing.expectEqual(@as(u64, 123456), withdrawal.validator_index);
    try std.testing.expectEqual(@as(u64, 32000000000), withdrawal.amount);
}

test "Withdrawal: fromAddressBytes creates from bytes" {
    const addr_bytes = [_]u8{0x74} ++ [_]u8{0} ** 19;
    const withdrawal = Withdrawal.fromAddressBytes(1, 2, addr_bytes, 100);

    try std.testing.expectEqual(@as(u64, 1), withdrawal.index);
    try std.testing.expectEqual(@as(u64, 2), withdrawal.validator_index);
    try std.testing.expectEqual(@as(u64, 100), withdrawal.amount);
    try std.testing.expectEqual(@as(u8, 0x74), withdrawal.address.bytes[0]);
}

test "Withdrawal: fromHexAddress creates from hex" {
    const withdrawal = try Withdrawal.fromHexAddress(
        1000000,
        123456,
        "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
        32000000000,
    );

    try std.testing.expectEqual(@as(u64, 1000000), withdrawal.index);
    try std.testing.expectEqual(@as(u64, 123456), withdrawal.validator_index);
    try std.testing.expectEqual(@as(u64, 32000000000), withdrawal.amount);
}

test "Withdrawal: equals returns true for equal withdrawals" {
    const addr = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
    const a = Withdrawal.from(1000000, 123456, addr, 32000000000);
    const b = Withdrawal.from(1000000, 123456, addr, 32000000000);

    try std.testing.expect(a.equals(b));
}

test "Withdrawal: equals returns false for different indices" {
    const addr = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
    const a = Withdrawal.from(1000000, 123456, addr, 32000000000);
    const b = Withdrawal.from(1000001, 123456, addr, 32000000000);

    try std.testing.expect(!a.equals(b));
}

test "Withdrawal: equals returns false for different validator indices" {
    const addr = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
    const a = Withdrawal.from(1000000, 123456, addr, 32000000000);
    const b = Withdrawal.from(1000000, 123457, addr, 32000000000);

    try std.testing.expect(!a.equals(b));
}

test "Withdrawal: equals returns false for different addresses" {
    const addr_a = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
    const addr_b = try Address.fromHex("0x0000000000000000000000000000000000000000");
    const a = Withdrawal.from(1000000, 123456, addr_a, 32000000000);
    const b = Withdrawal.from(1000000, 123456, addr_b, 32000000000);

    try std.testing.expect(!a.equals(b));
}

test "Withdrawal: equals returns false for different amounts" {
    const addr = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
    const a = Withdrawal.from(1000000, 123456, addr, 32000000000);
    const b = Withdrawal.from(1000000, 123456, addr, 32000000001);

    try std.testing.expect(!a.equals(b));
}

test "Withdrawal: addressToHex returns correct hex" {
    const withdrawal = try Withdrawal.fromHexAddress(
        1,
        1,
        "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
        100,
    );

    const hex = withdrawal.addressToHex();
    try std.testing.expectEqualStrings("0x742d35cc6634c0532925a3b844bc9e7595f251e3", &hex);
}

test "Withdrawal: rlpEncode and rlpDecode roundtrip" {
    const allocator = std.testing.allocator;
    const addr = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
    const withdrawal = Withdrawal.from(1000000, 123456, addr, 32000000000);

    const encoded = try withdrawal.rlpEncode(allocator);
    defer allocator.free(encoded);

    const decoded = try Withdrawal.rlpDecode(allocator, encoded);
    try std.testing.expect(withdrawal.equals(decoded));
}

test "Withdrawal: rlpEncode handles zero values" {
    const allocator = std.testing.allocator;
    const addr = Address.ZERO;
    const withdrawal = Withdrawal.from(0, 0, addr, 0);

    const encoded = try withdrawal.rlpEncode(allocator);
    defer allocator.free(encoded);

    const decoded = try Withdrawal.rlpDecode(allocator, encoded);
    try std.testing.expect(withdrawal.equals(decoded));
}

test "Withdrawal: rlpEncode handles large values" {
    const allocator = std.testing.allocator;
    const addr = try Address.fromHex("0xffffffffffffffffffffffffffffffffffffffff");
    const withdrawal = Withdrawal.from(
        std.math.maxInt(u64),
        std.math.maxInt(u64),
        addr,
        std.math.maxInt(u64),
    );

    const encoded = try withdrawal.rlpEncode(allocator);
    defer allocator.free(encoded);

    const decoded = try Withdrawal.rlpDecode(allocator, encoded);
    try std.testing.expect(withdrawal.equals(decoded));
}

test "stripLeadingZeros: strips zeros" {
    const bytes = [_]u8{ 0, 0, 0, 1, 2, 3 };
    const result = stripLeadingZeros(&bytes);
    try std.testing.expectEqualSlices(u8, &[_]u8{ 1, 2, 3 }, result);
}

test "stripLeadingZeros: all zeros" {
    const bytes = [_]u8{ 0, 0, 0, 0 };
    const result = stripLeadingZeros(&bytes);
    try std.testing.expectEqual(@as(usize, 0), result.len);
}

test "stripLeadingZeros: no zeros" {
    const bytes = [_]u8{ 1, 2, 3, 4 };
    const result = stripLeadingZeros(&bytes);
    try std.testing.expectEqualSlices(u8, &bytes, result);
}

test "bytesToU64: converts correctly" {
    try std.testing.expectEqual(@as(u64, 0), bytesToU64(&[_]u8{}));
    try std.testing.expectEqual(@as(u64, 1), bytesToU64(&[_]u8{1}));
    try std.testing.expectEqual(@as(u64, 256), bytesToU64(&[_]u8{ 1, 0 }));
    try std.testing.expectEqual(@as(u64, 0x0F4240), bytesToU64(&[_]u8{ 0x0F, 0x42, 0x40 })); // 1000000
}

// ============================================================================
// getAmountWei Tests
// ============================================================================

test "Withdrawal: getAmountWei returns amount in wei" {
    const addr = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");

    // 1 Gwei = 1e9 Wei
    const withdrawal1 = Withdrawal.from(0, 0, addr, 1);
    try std.testing.expectEqual(@as(u128, 1_000_000_000), withdrawal1.getAmountWei());

    // 32 ETH in Gwei = 32_000_000_000 Gwei = 32e18 Wei
    const withdrawal2 = Withdrawal.from(0, 0, addr, 32_000_000_000);
    try std.testing.expectEqual(@as(u128, 32_000_000_000_000_000_000), withdrawal2.getAmountWei());
}

test "Withdrawal: getAmountWei handles zero" {
    const addr = Address.ZERO;
    const withdrawal = Withdrawal.from(0, 0, addr, 0);
    try std.testing.expectEqual(@as(u128, 0), withdrawal.getAmountWei());
}

test "Withdrawal: getAmountWei handles max u64 amount" {
    const addr = Address.ZERO;
    const withdrawal = Withdrawal.from(0, 0, addr, std.math.maxInt(u64));
    // max u64 * 1e9 should fit in u128
    const expected: u128 = @as(u128, std.math.maxInt(u64)) * GWEI_TO_WEI;
    try std.testing.expectEqual(expected, withdrawal.getAmountWei());
}

// ============================================================================
// Hash Tests
// ============================================================================

test "Withdrawal: hash returns consistent value" {
    const allocator = std.testing.allocator;
    const addr = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
    const withdrawal = Withdrawal.from(1000000, 123456, addr, 32_000_000_000);

    const hash1 = try withdrawal.hash(allocator);
    const hash2 = try withdrawal.hash(allocator);

    try std.testing.expectEqualSlices(u8, &hash1, &hash2);
}

test "Withdrawal: hash differs for different withdrawals" {
    const allocator = std.testing.allocator;
    const addr = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");

    const withdrawal1 = Withdrawal.from(1, 123456, addr, 32_000_000_000);
    const withdrawal2 = Withdrawal.from(2, 123456, addr, 32_000_000_000);

    const hash1 = try withdrawal1.hash(allocator);
    const hash2 = try withdrawal2.hash(allocator);

    try std.testing.expect(!std.mem.eql(u8, &hash1, &hash2));
}

test "Withdrawal: hash is keccak256 of RLP encoding" {
    const allocator = std.testing.allocator;
    const addr = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
    const withdrawal = Withdrawal.from(1000000, 123456, addr, 32_000_000_000);

    // Get hash via method
    const method_hash = try withdrawal.hash(allocator);

    // Compute hash manually
    const encoded = try withdrawal.rlpEncode(allocator);
    defer allocator.free(encoded);
    var manual_hash: [32]u8 = undefined;
    Keccak256.hash(encoded, &manual_hash, .{});

    try std.testing.expectEqualSlices(u8, &manual_hash, &method_hash);
}

// ============================================================================
// EIP-4895 Test Vectors
// ============================================================================

test "EIP-4895: withdrawal RLP encoding format" {
    // EIP-4895 specifies withdrawals are RLP encoded as:
    // rlp([index, validator_index, address, amount])
    const allocator = std.testing.allocator;
    const addr = Address.ZERO;
    const withdrawal = Withdrawal.from(0, 0, addr, 0);

    const encoded = try withdrawal.rlpEncode(allocator);
    defer allocator.free(encoded);

    // Should be a list starting with 0xd6 (short list prefix)
    // List contains: 0x80 (0), 0x80 (0), 94 bytes addr, 0x80 (0)
    try std.testing.expect(encoded[0] >= 0xc0); // List prefix
}

test "EIP-4895: withdrawal with typical values" {
    // Test with values similar to what would appear on mainnet
    const allocator = std.testing.allocator;

    // Typical withdrawal: validator 12345 withdrawing 32 ETH
    const addr = try Address.fromHex("0xB9D7934878B5FB9610B3fE8A5e441e8fad7E293f");
    const withdrawal = Withdrawal.from(
        1, // First withdrawal
        12345, // Validator index
        addr,
        32_000_000_000, // 32 ETH in Gwei
    );

    const encoded = try withdrawal.rlpEncode(allocator);
    defer allocator.free(encoded);

    // Decode and verify roundtrip
    const decoded = try Withdrawal.rlpDecode(allocator, encoded);
    try std.testing.expect(withdrawal.equals(decoded));

    // Verify amount conversion
    try std.testing.expectEqual(@as(u128, 32_000_000_000_000_000_000), withdrawal.getAmountWei());
}

test "EIP-4895: withdrawal index monotonically increasing" {
    // EIP-4895 specifies withdrawal indices must be monotonically increasing
    const allocator = std.testing.allocator;
    const addr = Address.ZERO;

    var prev_index: u64 = 0;
    for (0..10) |i| {
        const withdrawal = Withdrawal.from(prev_index + 1, @intCast(i), addr, 1_000_000_000);
        try std.testing.expect(withdrawal.index > prev_index);
        prev_index = withdrawal.index;

        // Verify encoding/decoding preserves index
        const encoded = try withdrawal.rlpEncode(allocator);
        defer allocator.free(encoded);
        const decoded = try Withdrawal.rlpDecode(allocator, encoded);
        try std.testing.expectEqual(withdrawal.index, decoded.index);
    }
}

test "EIP-4895: partial withdrawal amount" {
    // Partial withdrawals are rewards above 32 ETH
    const allocator = std.testing.allocator;
    const addr = try Address.fromHex("0xB9D7934878B5FB9610B3fE8A5e441e8fad7E293f");

    // Partial withdrawal of 0.5 ETH in rewards
    const partial_withdrawal = Withdrawal.from(
        100,
        54321,
        addr,
        500_000_000, // 0.5 ETH in Gwei
    );

    try std.testing.expectEqual(@as(u128, 500_000_000_000_000_000), partial_withdrawal.getAmountWei());

    const encoded = try partial_withdrawal.rlpEncode(allocator);
    defer allocator.free(encoded);
    const decoded = try Withdrawal.rlpDecode(allocator, encoded);
    try std.testing.expect(partial_withdrawal.equals(decoded));
}

test "EIP-4895: full withdrawal amount" {
    // Full withdrawals are when validator exits (32 ETH + rewards)
    const allocator = std.testing.allocator;
    const addr = try Address.fromHex("0xB9D7934878B5FB9610B3fE8A5e441e8fad7E293f");

    // Full withdrawal of 32 ETH + 1 ETH rewards = 33 ETH
    const full_withdrawal = Withdrawal.from(
        200,
        12345,
        addr,
        33_000_000_000, // 33 ETH in Gwei
    );

    try std.testing.expectEqual(@as(u128, 33_000_000_000_000_000_000), full_withdrawal.getAmountWei());

    const encoded = try full_withdrawal.rlpEncode(allocator);
    defer allocator.free(encoded);
    const decoded = try Withdrawal.rlpDecode(allocator, encoded);
    try std.testing.expect(full_withdrawal.equals(decoded));
}
