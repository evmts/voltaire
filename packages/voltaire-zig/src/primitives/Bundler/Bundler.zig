//! Bundler - ERC-4337 Bundler address type
//!
//! Bundlers aggregate user operations and submit them to the EntryPoint contract.
//! They monitor the mempool, simulate operations, and bundle them into transactions.
//!
//! This is essentially an Address alias with semantic meaning specific to ERC-4337
//! account abstraction bundler nodes.
//!
//! ## Usage
//! ```zig
//! const Bundler = @import("primitives").Bundler;
//!
//! // From hex string
//! const bundler = try Bundler.fromHex("0x1234...");
//!
//! // From Address
//! const bundler2 = Bundler.fromAddress(address);
//!
//! // Convert to hex
//! const hex = Bundler.toHex(bundler);
//! ```
//!
//! @see https://eips.ethereum.org/EIPS/eip-4337

const std = @import("std");
const Address = @import("../Address/address.zig");

/// Bundler address size (same as Address: 20 bytes)
pub const SIZE = 20;

/// Bundler type - semantically an ERC-4337 bundler address
pub const Bundler = Address.Address;

/// Zero bundler address
pub const ZERO: Bundler = Address.ZERO_ADDRESS;

// ============================================================================
// Constructors
// ============================================================================

/// Create Bundler from raw bytes
pub fn fromBytes(bytes: []const u8) !Bundler {
    return Address.fromBytes(bytes);
}

test "fromBytes - valid 20 bytes" {
    const bytes = [_]u8{0xab} ** SIZE;
    const bundler = try fromBytes(&bytes);
    try std.testing.expectEqual(@as(u8, 0xab), bundler.bytes[0]);
}

test "fromBytes - invalid length" {
    const bytes = [_]u8{0xab} ** 19;
    try std.testing.expectError(error.InvalidAddressLength, fromBytes(&bytes));
}

/// Create Bundler from hex string (with or without 0x prefix)
pub fn fromHex(hex: []const u8) !Bundler {
    return Address.fromHex(hex);
}

test "fromHex - with 0x prefix" {
    const bundler = try fromHex("0xa0cf798816d4b9b9866b5330eea46a18382f251e");
    const hex = Address.toHex(bundler);
    try std.testing.expectEqualStrings("0xa0cf798816d4b9b9866b5330eea46a18382f251e", &hex);
}

test "fromHex - invalid format" {
    try std.testing.expectError(error.InvalidHexFormat, fromHex("0xaabb"));
}

/// Create Bundler from Address
pub fn fromAddress(addr: Address.Address) Bundler {
    return addr;
}

test "fromAddress - converts address" {
    const addr = try Address.fromHex("0xa0cf798816d4b9b9866b5330eea46a18382f251e");
    const bundler = fromAddress(addr);
    try std.testing.expect(Address.equals(bundler, addr));
}

/// Create Bundler from u256
pub fn fromU256(value: u256) Bundler {
    return Address.fromU256(value);
}

test "fromU256 - converts number" {
    const bundler = fromU256(0x1234);
    try std.testing.expect(!Address.isZero(bundler));
}

/// Generic constructor
pub fn from(value: anytype) !Bundler {
    const T = @TypeOf(value);

    if (T == Bundler or T == Address.Address) {
        return value;
    }

    if (T == []const u8 or T == []u8) {
        // Try as hex first
        if (value.len >= 40) {
            return fromHex(value);
        }
        // Try as bytes
        if (value.len == SIZE) {
            return fromBytes(value);
        }
        return error.InvalidBundlerInput;
    }

    if (T == u256) {
        return fromU256(value);
    }

    @compileError("Unsupported type for Bundler.from: " ++ @typeName(T));
}

test "from - hex string" {
    const bundler = try from("0xa0cf798816d4b9b9866b5330eea46a18382f251e");
    try std.testing.expect(!Address.isZero(bundler));
}

test "from - address passthrough" {
    const addr = try Address.fromHex("0xa0cf798816d4b9b9866b5330eea46a18382f251e");
    const bundler = try from(addr);
    try std.testing.expect(Address.equals(bundler, addr));
}

// ============================================================================
// Converters
// ============================================================================

/// Convert to hex string with 0x prefix (returns stack buffer)
pub fn toHex(bundler: Bundler) [42]u8 {
    return Address.toHex(bundler);
}

test "toHex - returns hex string" {
    const bundler = try fromHex("0xa0cf798816d4b9b9866b5330eea46a18382f251e");
    const hex = toHex(bundler);
    try std.testing.expect(std.mem.startsWith(u8, &hex, "0x"));
    try std.testing.expectEqual(@as(usize, 42), hex.len);
}

/// Convert to checksummed hex string
pub fn toChecksummed(bundler: Bundler) [42]u8 {
    return Address.toChecksummed(bundler);
}

test "toChecksummed - returns checksummed string" {
    const bundler = try fromHex("0xa0cf798816d4b9b9866b5330eea46a18382f251e");
    const checksum = toChecksummed(bundler);
    try std.testing.expectEqualStrings("0xA0Cf798816D4b9b9866b5330EEa46a18382f251e", &checksum);
}

/// Convert to raw bytes
pub fn toBytes(bundler: Bundler) [20]u8 {
    return bundler.bytes;
}

test "toBytes - returns bytes" {
    const bundler = try fromHex("0xa0cf798816d4b9b9866b5330eea46a18382f251e");
    const bytes = toBytes(bundler);
    try std.testing.expectEqual(@as(usize, 20), bytes.len);
    try std.testing.expectEqual(@as(u8, 0xa0), bytes[0]);
}

/// Convert to Address (identity function for type compatibility)
pub fn toAddress(bundler: Bundler) Address.Address {
    return bundler;
}

test "toAddress - returns same address" {
    const bundler = try fromHex("0xa0cf798816d4b9b9866b5330eea46a18382f251e");
    const addr = toAddress(bundler);
    try std.testing.expect(Address.equals(bundler, addr));
}

/// Convert to u256
pub fn toU256(bundler: Bundler) u256 {
    return Address.toU256(bundler);
}

test "toU256 - roundtrip" {
    const original = try fromHex("0xa0cf798816d4b9b9866b5330eea46a18382f251e");
    const value = toU256(original);
    const recovered = fromU256(value);
    try std.testing.expect(equals(&original, &recovered));
}

/// Alias for toHex
pub fn toString(bundler: Bundler) [42]u8 {
    return toHex(bundler);
}

test "toString - same as toHex" {
    const bundler = try fromHex("0xa0cf798816d4b9b9866b5330eea46a18382f251e");
    const str = toString(bundler);
    const hex = toHex(bundler);
    try std.testing.expectEqualSlices(u8, &hex, &str);
}

// ============================================================================
// Validation
// ============================================================================

/// Compare two bundlers for equality
pub fn equals(a: *const Bundler, b: *const Bundler) bool {
    return Address.equals(a.*, b.*);
}

test "equals - same bundler" {
    const bundler = try fromHex("0xa0cf798816d4b9b9866b5330eea46a18382f251e");
    try std.testing.expect(equals(&bundler, &bundler));
}

test "equals - identical bundlers" {
    const a = try fromHex("0xa0cf798816d4b9b9866b5330eea46a18382f251e");
    const b = try fromHex("0xa0cf798816d4b9b9866b5330eea46a18382f251e");
    try std.testing.expect(equals(&a, &b));
}

test "equals - different bundlers" {
    const a = try fromHex("0xa0cf798816d4b9b9866b5330eea46a18382f251e");
    const b = try fromHex("0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266");
    try std.testing.expect(!equals(&a, &b));
}

/// Check if bundler is zero address
pub fn isZero(bundler: *const Bundler) bool {
    return Address.isZero(bundler.*);
}

test "isZero - zero bundler" {
    const bundler = ZERO;
    try std.testing.expect(isZero(&bundler));
}

test "isZero - non-zero bundler" {
    const bundler = try fromHex("0xa0cf798816d4b9b9866b5330eea46a18382f251e");
    try std.testing.expect(!isZero(&bundler));
}

/// Validate hex string is valid bundler format
pub fn isValidHex(hex: []const u8) bool {
    return Address.isValidAddress(hex);
}

test "isValidHex - valid" {
    try std.testing.expect(isValidHex("0xa0cf798816d4b9b9866b5330eea46a18382f251e"));
}

test "isValidHex - invalid" {
    try std.testing.expect(!isValidHex("0xinvalid"));
    try std.testing.expect(!isValidHex("0xaabb"));
}

/// Validate checksum
pub fn isValidChecksum(hex: []const u8) bool {
    return Address.isValidChecksumAddress(hex);
}

test "isValidChecksum - valid checksum" {
    try std.testing.expect(isValidChecksum("0xA0Cf798816D4b9b9866b5330EEa46a18382f251e"));
}

test "isValidChecksum - invalid checksum" {
    try std.testing.expect(!isValidChecksum("0xa0cf798816d4b9b9866b5330eea46a18382f251e"));
}

// ============================================================================
// Manipulation
// ============================================================================

/// Clone a bundler
pub fn clone(bundler: Bundler) Bundler {
    return Address.clone(bundler);
}

test "clone - creates copy" {
    const original = try fromHex("0xa0cf798816d4b9b9866b5330eea46a18382f251e");
    var copy = clone(original);
    try std.testing.expect(equals(&original, &copy));

    // Modify copy
    copy.bytes[0] = 0xff;
    try std.testing.expect(!equals(&original, &copy));
}

// ============================================================================
// Known Bundlers
// ============================================================================

/// Well-known bundler addresses for different networks
pub const WellKnown = struct {
    /// Flashbots bundler (mainnet)
    pub const FLASHBOTS_MAINNET = fromHex("0x870B5Cb8E3Bbb5C3bC6e5dB8Ae8c5A5DAf8BCC3d") catch unreachable;

    /// Pimlico bundler (mainnet)
    pub const PIMLICO_MAINNET = fromHex("0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789") catch unreachable;

    /// Stackup bundler (mainnet)
    pub const STACKUP_MAINNET = fromHex("0x4337001c5be3f8D8b4b1f4f64E3eB4B1e7B4F8A9") catch unreachable;
};

test "WellKnown - flashbots bundler is valid" {
    const bundler = WellKnown.FLASHBOTS_MAINNET;
    try std.testing.expect(!isZero(&bundler));
}

// ============================================================================
// Comparison
// ============================================================================

/// Compare two bundlers
/// Returns: -1 if a < b, 0 if equal, 1 if a > b
pub fn compare(a: Bundler, b: Bundler) i8 {
    return Address.compare(a, b);
}

test "compare - equal" {
    const a = try fromHex("0xa0cf798816d4b9b9866b5330eea46a18382f251e");
    const b = try fromHex("0xa0cf798816d4b9b9866b5330eea46a18382f251e");
    try std.testing.expectEqual(@as(i8, 0), compare(a, b));
}

test "compare - less than" {
    const a = try fromHex("0x0000000000000000000000000000000000000001");
    const b = try fromHex("0x0000000000000000000000000000000000000002");
    try std.testing.expectEqual(@as(i8, -1), compare(a, b));
}

test "compare - greater than" {
    const a = try fromHex("0x0000000000000000000000000000000000000002");
    const b = try fromHex("0x0000000000000000000000000000000000000001");
    try std.testing.expectEqual(@as(i8, 1), compare(a, b));
}

/// Less than comparison
pub fn lessThan(a: Bundler, b: Bundler) bool {
    return Address.lessThan(a, b);
}

test "lessThan - true" {
    const a = try fromHex("0x0000000000000000000000000000000000000001");
    const b = try fromHex("0x0000000000000000000000000000000000000002");
    try std.testing.expect(lessThan(a, b));
}

/// Greater than comparison
pub fn greaterThan(a: Bundler, b: Bundler) bool {
    return Address.greaterThan(a, b);
}

test "greaterThan - true" {
    const a = try fromHex("0x0000000000000000000000000000000000000002");
    const b = try fromHex("0x0000000000000000000000000000000000000001");
    try std.testing.expect(greaterThan(a, b));
}
