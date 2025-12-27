//! ContractSignature - EIP-1271 contract signature verification
//!
//! Implements the EIP-1271 standard for verifying signatures from smart contract
//! accounts. Contract accounts cannot sign messages directly like EOAs, so they
//! implement `isValidSignature(bytes32,bytes)` which returns the magic value
//! 0x1626ba7e if the signature is valid.
//!
//! ## EIP-1271 Magic Value
//! The magic value 0x1626ba7e is bytes4(keccak256("isValidSignature(bytes32,bytes)"))
//!
//! ## Usage
//! ```zig
//! const ContractSignature = @import("primitives").ContractSignature;
//!
//! // Check if return data indicates valid signature
//! if (ContractSignature.isValidReturnData(return_data)) {
//!     // Signature is valid
//! }
//!
//! // Encode isValidSignature call data
//! const calldata = try ContractSignature.encodeIsValidSignatureCall(allocator, hash, sig);
//! ```
//!
//! @see https://eips.ethereum.org/EIPS/eip-1271

const std = @import("std");
const crypto = std.crypto;

/// EIP-1271 magic value returned by isValidSignature for valid signatures
/// bytes4(keccak256("isValidSignature(bytes32,bytes)"))
pub const MAGIC_VALUE: [4]u8 = [_]u8{ 0x16, 0x26, 0xba, 0x7e };

/// EIP-1271 magic value as hex string
pub const MAGIC_VALUE_HEX: *const [10:0]u8 = "0x1626ba7e";

/// Function selector for isValidSignature(bytes32,bytes)
pub const IS_VALID_SIGNATURE_SELECTOR: [4]u8 = [_]u8{ 0x16, 0x26, 0xba, 0x7e };

/// Function signature for isValidSignature
pub const IS_VALID_SIGNATURE_SIG: *const [27:0]u8 = "isValidSignature(bytes32,bytes)";

// ============================================================================
// Validation
// ============================================================================

/// Check if return data from isValidSignature indicates a valid signature.
/// The contract should return the magic value 0x1626ba7e for valid signatures.
pub fn isValidReturnData(return_data: []const u8) bool {
    if (return_data.len < 4) return false;

    // Magic value is left-padded in a 32-byte ABI-encoded return
    // or could be just 4 bytes
    if (return_data.len == 4) {
        return std.mem.eql(u8, return_data[0..4], &MAGIC_VALUE);
    }

    // For 32-byte ABI encoded return, magic value is in last 4 bytes of word
    // or first 4 bytes depending on implementation
    if (return_data.len >= 32) {
        // Check first 4 bytes (some implementations)
        if (std.mem.eql(u8, return_data[0..4], &MAGIC_VALUE)) return true;
        // Check last 4 bytes of first word (standard ABI encoding for bytes4)
        if (std.mem.eql(u8, return_data[28..32], &MAGIC_VALUE)) return true;
    }

    return false;
}

test "isValidReturnData - magic value raw" {
    const data = [_]u8{ 0x16, 0x26, 0xba, 0x7e };
    try std.testing.expect(isValidReturnData(&data));
}

test "isValidReturnData - magic value ABI encoded" {
    // bytes4 is right-aligned in ABI encoding
    var data: [32]u8 = [_]u8{0} ** 32;
    data[28] = 0x16;
    data[29] = 0x26;
    data[30] = 0xba;
    data[31] = 0x7e;
    try std.testing.expect(isValidReturnData(&data));
}

test "isValidReturnData - magic value left-aligned" {
    var data: [32]u8 = [_]u8{0} ** 32;
    data[0] = 0x16;
    data[1] = 0x26;
    data[2] = 0xba;
    data[3] = 0x7e;
    try std.testing.expect(isValidReturnData(&data));
}

test "isValidReturnData - invalid value" {
    const data = [_]u8{ 0xff, 0xff, 0xff, 0xff };
    try std.testing.expect(!isValidReturnData(&data));
}

test "isValidReturnData - too short" {
    const data = [_]u8{ 0x16, 0x26 };
    try std.testing.expect(!isValidReturnData(&data));
}

test "isValidReturnData - empty" {
    const data = [_]u8{};
    try std.testing.expect(!isValidReturnData(&data));
}

/// Check if the selector matches isValidSignature(bytes32,bytes)
pub fn isIsValidSignatureSelector(selector: [4]u8) bool {
    return std.mem.eql(u8, &selector, &IS_VALID_SIGNATURE_SELECTOR);
}

test "isIsValidSignatureSelector - valid" {
    try std.testing.expect(isIsValidSignatureSelector(IS_VALID_SIGNATURE_SELECTOR));
}

test "isIsValidSignatureSelector - invalid" {
    const other = [_]u8{ 0xa9, 0x05, 0x9c, 0xbb };
    try std.testing.expect(!isIsValidSignatureSelector(other));
}

// ============================================================================
// Call Data Encoding
// ============================================================================

/// Encode isValidSignature(bytes32,bytes) call data.
/// Returns ABI-encoded calldata for calling the contract's isValidSignature method.
///
/// ABI encoding:
/// - 4 bytes: function selector (0x1626ba7e)
/// - 32 bytes: hash (bytes32)
/// - 32 bytes: offset to signature data (always 0x40 = 64)
/// - 32 bytes: signature length
/// - N bytes: signature data (padded to 32-byte boundary)
pub fn encodeIsValidSignatureCall(
    allocator: std.mem.Allocator,
    hash: [32]u8,
    signature: []const u8,
) ![]u8 {
    // Calculate padded signature length
    const sig_padded_len = ((signature.len + 31) / 32) * 32;
    const total_len = 4 + 32 + 32 + 32 + sig_padded_len;

    const result = try allocator.alloc(u8, total_len);
    errdefer allocator.free(result);

    var offset: usize = 0;

    // Function selector
    @memcpy(result[offset .. offset + 4], &IS_VALID_SIGNATURE_SELECTOR);
    offset += 4;

    // Hash (bytes32)
    @memcpy(result[offset .. offset + 32], &hash);
    offset += 32;

    // Offset to signature data (0x40 = 64 in big-endian)
    @memset(result[offset .. offset + 32], 0);
    result[offset + 31] = 0x40;
    offset += 32;

    // Signature length
    @memset(result[offset .. offset + 32], 0);
    const len_bytes = result[offset + 24 ..][0..8];
    std.mem.writeInt(u64, len_bytes, @intCast(signature.len), .big);
    offset += 32;

    // Signature data (padded)
    @memcpy(result[offset .. offset + signature.len], signature);
    if (sig_padded_len > signature.len) {
        @memset(result[offset + signature.len .. offset + sig_padded_len], 0);
    }

    return result;
}

test "encodeIsValidSignatureCall - basic" {
    const allocator = std.testing.allocator;

    const hash = [_]u8{0xab} ** 32;
    const signature = [_]u8{0xcd} ** 65;

    const calldata = try encodeIsValidSignatureCall(allocator, hash, &signature);
    defer allocator.free(calldata);

    // Check selector
    try std.testing.expectEqual(IS_VALID_SIGNATURE_SELECTOR, calldata[0..4].*);

    // Check hash
    try std.testing.expectEqual(hash, calldata[4..36].*);

    // Check offset (should be 64 = 0x40)
    try std.testing.expectEqual(@as(u8, 0x40), calldata[35 + 32]);

    // Check length (should be 65)
    try std.testing.expectEqual(@as(u8, 65), calldata[67 + 32]);
}

test "encodeIsValidSignatureCall - empty signature" {
    const allocator = std.testing.allocator;

    const hash = [_]u8{0x00} ** 32;
    const signature = [_]u8{};

    const calldata = try encodeIsValidSignatureCall(allocator, hash, &signature);
    defer allocator.free(calldata);

    // Should be: 4 (selector) + 32 (hash) + 32 (offset) + 32 (length) = 100 bytes
    try std.testing.expectEqual(@as(usize, 100), calldata.len);
}

/// Decode isValidSignature return data.
/// Returns true if the return data indicates a valid signature (magic value).
pub fn decodeIsValidSignatureReturn(return_data: []const u8) bool {
    return isValidReturnData(return_data);
}

// ============================================================================
// Utilities
// ============================================================================

/// Get the magic value as bytes
pub fn getMagicValue() [4]u8 {
    return MAGIC_VALUE;
}

test "getMagicValue" {
    const magic = getMagicValue();
    try std.testing.expectEqual(MAGIC_VALUE, magic);
}

/// Get the magic value as u32 (big-endian)
pub fn getMagicValueU32() u32 {
    return std.mem.readInt(u32, &MAGIC_VALUE, .big);
}

test "getMagicValueU32" {
    try std.testing.expectEqual(@as(u32, 0x1626ba7e), getMagicValueU32());
}

/// Convert magic value to hex string
pub fn magicValueToHex() [10]u8 {
    var result: [10]u8 = undefined;
    result[0] = '0';
    result[1] = 'x';
    const hex = std.fmt.bytesToHex(&MAGIC_VALUE, .lower);
    @memcpy(result[2..], &hex);
    return result;
}

test "magicValueToHex" {
    const hex = magicValueToHex();
    try std.testing.expectEqualStrings("0x1626ba7e", &hex);
}

/// Verify that the computed selector matches the constant.
/// This is a compile-time sanity check.
fn verifySelector() void {
    var hash: [32]u8 = undefined;
    crypto.hash.sha3.Keccak256.hash(IS_VALID_SIGNATURE_SIG, &hash, .{});
    std.debug.assert(std.mem.eql(u8, hash[0..4], &IS_VALID_SIGNATURE_SELECTOR));
}

test "selector matches signature" {
    var hash: [32]u8 = undefined;
    crypto.hash.sha3.Keccak256.hash("isValidSignature(bytes32,bytes)", &hash, .{});
    try std.testing.expectEqual(IS_VALID_SIGNATURE_SELECTOR, hash[0..4].*);
}
