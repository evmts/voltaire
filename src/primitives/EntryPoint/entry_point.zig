//! EntryPoint - ERC-4337 Entry Point Contract Addresses
//!
//! The EntryPoint contract is the singleton contract that executes bundles of
//! UserOperations. Bundlers collect UserOperations, validate them, and submit
//! them to the EntryPoint for execution.
//!
//! This module provides:
//! - Standard EntryPoint contract addresses (v0.6 and v0.7)
//! - Address utilities for EntryPoint operations
//! - Version detection helpers
//!
//! @see https://eips.ethereum.org/EIPS/eip-4337

const std = @import("std");
const Address = @import("../Address/address.zig");
const Hex = @import("../Hex/Hex.zig");

/// EntryPoint type is an Address
pub const EntryPoint = Address;

// ============================================================================
// Constants - Standard EntryPoint Addresses
// ============================================================================

/// EntryPoint v0.6.0 address (deployed on all major networks)
/// 0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789
pub const ENTRYPOINT_V06: EntryPoint = Address.addressFromHex("0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789".*);

/// EntryPoint v0.7.0 address (deployed on all major networks)
/// 0x0000000071727De22E5E9d8BAf0edAc6f37da032
pub const ENTRYPOINT_V07: EntryPoint = Address.addressFromHex("0x0000000071727De22E5E9d8BAf0edAc6f37da032".*);

/// Default EntryPoint (v0.6)
pub const DEFAULT: EntryPoint = ENTRYPOINT_V06;

// ============================================================================
// Constructors
// ============================================================================

/// Create EntryPoint from hex string
pub fn fromHex(hex: []const u8) !EntryPoint {
    return Address.fromHex(hex);
}

/// Create EntryPoint from bytes
pub fn fromBytes(bytes: []const u8) !EntryPoint {
    return Address.fromBytes(bytes);
}

/// Create EntryPoint from Address
pub fn from(addr: Address) EntryPoint {
    return addr;
}

// ============================================================================
// Converters
// ============================================================================

/// Convert EntryPoint to hex string with 0x prefix
pub fn toHex(entry_point: EntryPoint) [42]u8 {
    return Address.toHex(entry_point);
}

/// Convert EntryPoint to checksummed hex string
pub fn toChecksummed(entry_point: EntryPoint) [42]u8 {
    return Address.toChecksummed(entry_point);
}

/// Convert EntryPoint to bytes
pub fn toBytes(entry_point: EntryPoint) [20]u8 {
    return entry_point.bytes;
}

// ============================================================================
// Validation
// ============================================================================

/// Check if two EntryPoints are equal
pub fn equals(a: EntryPoint, b: EntryPoint) bool {
    return Address.equals(a, b);
}

/// Check if EntryPoint is the v0.6 address
pub fn isV06(entry_point: EntryPoint) bool {
    return equals(entry_point, ENTRYPOINT_V06);
}

/// Check if EntryPoint is the v0.7 address
pub fn isV07(entry_point: EntryPoint) bool {
    return equals(entry_point, ENTRYPOINT_V07);
}

/// Check if EntryPoint is a known official address
pub fn isKnown(entry_point: EntryPoint) bool {
    return isV06(entry_point) or isV07(entry_point);
}

/// Check if EntryPoint is the zero address
pub fn isZero(entry_point: EntryPoint) bool {
    return Address.isZero(entry_point);
}

// ============================================================================
// Version Detection
// ============================================================================

/// EntryPoint version enum
pub const Version = enum {
    v06,
    v07,
    unknown,
};

/// Get the version of an EntryPoint address
pub fn getVersion(entry_point: EntryPoint) Version {
    if (isV06(entry_point)) return .v06;
    if (isV07(entry_point)) return .v07;
    return .unknown;
}

/// Get the EntryPoint address for a specific version
pub fn forVersion(version: Version) ?EntryPoint {
    return switch (version) {
        .v06 => ENTRYPOINT_V06,
        .v07 => ENTRYPOINT_V07,
        .unknown => null,
    };
}

// ============================================================================
// Tests
// ============================================================================

test "ENTRYPOINT_V06 - correct address" {
    const hex = toHex(ENTRYPOINT_V06);
    try std.testing.expectEqualStrings("0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789", &hex);
}

test "ENTRYPOINT_V07 - correct address" {
    const hex = toHex(ENTRYPOINT_V07);
    try std.testing.expectEqualStrings("0x0000000071727de22e5e9d8baf0edac6f37da032", &hex);
}

test "fromHex - valid EntryPoint v0.6" {
    const entry_point = try fromHex("0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789");
    try std.testing.expect(equals(entry_point, ENTRYPOINT_V06));
}

test "fromHex - valid EntryPoint v0.7" {
    const entry_point = try fromHex("0x0000000071727De22E5E9d8BAf0edAc6f37da032");
    try std.testing.expect(equals(entry_point, ENTRYPOINT_V07));
}

test "fromHex - invalid hex" {
    const result = fromHex("0xinvalid");
    try std.testing.expectError(error.InvalidHexString, result);
}

test "fromHex - wrong length" {
    const result = fromHex("0x1234");
    try std.testing.expectError(error.InvalidHexFormat, result);
}

test "fromBytes - valid bytes" {
    const bytes = [_]u8{0x5f, 0xf1, 0x37, 0xd4, 0xb0, 0xfd, 0xcd, 0x49, 0xdc, 0xa3, 0x0c, 0x7c, 0xf5, 0x7e, 0x57, 0x8a, 0x02, 0x6d, 0x27, 0x89};
    const entry_point = try fromBytes(&bytes);
    try std.testing.expect(equals(entry_point, ENTRYPOINT_V06));
}

test "fromBytes - invalid length" {
    const bytes = [_]u8{ 0x01, 0x02, 0x03 };
    const result = fromBytes(&bytes);
    try std.testing.expectError(error.InvalidAddressLength, result);
}

test "toHex - produces correct output" {
    const hex = toHex(ENTRYPOINT_V06);
    try std.testing.expectEqual(@as(usize, 42), hex.len);
    try std.testing.expect(hex[0] == '0' and hex[1] == 'x');
}

test "toChecksummed - produces checksummed output" {
    const checksummed = toChecksummed(ENTRYPOINT_V06);
    try std.testing.expectEqualStrings("0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789", &checksummed);
}

test "toBytes - returns correct bytes" {
    const bytes = toBytes(ENTRYPOINT_V06);
    try std.testing.expectEqual(@as(usize, 20), bytes.len);
    try std.testing.expectEqual(@as(u8, 0x5f), bytes[0]);
}

test "equals - same addresses" {
    try std.testing.expect(equals(ENTRYPOINT_V06, ENTRYPOINT_V06));
    try std.testing.expect(equals(ENTRYPOINT_V07, ENTRYPOINT_V07));
}

test "equals - different addresses" {
    try std.testing.expect(!equals(ENTRYPOINT_V06, ENTRYPOINT_V07));
}

test "isV06 - correct identification" {
    try std.testing.expect(isV06(ENTRYPOINT_V06));
    try std.testing.expect(!isV06(ENTRYPOINT_V07));
}

test "isV07 - correct identification" {
    try std.testing.expect(isV07(ENTRYPOINT_V07));
    try std.testing.expect(!isV07(ENTRYPOINT_V06));
}

test "isKnown - known addresses" {
    try std.testing.expect(isKnown(ENTRYPOINT_V06));
    try std.testing.expect(isKnown(ENTRYPOINT_V07));
}

test "isKnown - unknown address" {
    const unknown = try fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
    try std.testing.expect(!isKnown(unknown));
}

test "isZero - zero address" {
    try std.testing.expect(isZero(Address.ZERO_ADDRESS));
}

test "isZero - non-zero address" {
    try std.testing.expect(!isZero(ENTRYPOINT_V06));
    try std.testing.expect(!isZero(ENTRYPOINT_V07));
}

test "getVersion - v0.6" {
    try std.testing.expectEqual(Version.v06, getVersion(ENTRYPOINT_V06));
}

test "getVersion - v0.7" {
    try std.testing.expectEqual(Version.v07, getVersion(ENTRYPOINT_V07));
}

test "getVersion - unknown" {
    const unknown = try fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
    try std.testing.expectEqual(Version.unknown, getVersion(unknown));
}

test "forVersion - v0.6" {
    const entry_point = forVersion(.v06);
    try std.testing.expect(entry_point != null);
    try std.testing.expect(equals(entry_point.?, ENTRYPOINT_V06));
}

test "forVersion - v0.7" {
    const entry_point = forVersion(.v07);
    try std.testing.expect(entry_point != null);
    try std.testing.expect(equals(entry_point.?, ENTRYPOINT_V07));
}

test "forVersion - unknown" {
    const entry_point = forVersion(.unknown);
    try std.testing.expect(entry_point == null);
}

test "DEFAULT - is v0.6" {
    try std.testing.expect(equals(DEFAULT, ENTRYPOINT_V06));
}

test "integration - create and identify EntryPoint" {
    // Create from hex
    const entry_point = try fromHex("0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789");

    // Verify it's v0.6
    try std.testing.expect(isV06(entry_point));
    try std.testing.expect(isKnown(entry_point));
    try std.testing.expectEqual(Version.v06, getVersion(entry_point));

    // Convert back to hex
    const hex = toHex(entry_point);
    try std.testing.expectEqualStrings("0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789", &hex);
}
