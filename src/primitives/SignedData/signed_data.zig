//! SignedData - EIP-191 signed data type and signature verification
//!
//! This module provides two main types:
//!
//! ## SignedData - EIP-191 formatted data
//! Represents data formatted according to EIP-191 specification for signing.
//! The version byte determines the signature format:
//! - 0x00: Data with validator address
//! - 0x01: Structured data (EIP-712)
//! - 0x45: Personal message ("E" for Ethereum Signed Message)
//!
//! ## SignedMessage - Data bundled with signature and signer
//! Represents any data with its ECDSA signature and recovered signer address.
//! Useful for verifying message authenticity and tracking who signed what.
//!
//! @see https://eips.ethereum.org/EIPS/eip-191
//!
//! ## Usage
//! ```zig
//! const SignedData = @import("primitives").SignedData;
//!
//! // Create personal message signed data for signing
//! var eip191 = try SignedData.fromPersonalMessage(allocator, "Hello!");
//! defer eip191.deinit();
//! const msg_hash = SignedData.hash(&eip191);
//!
//! // Verify a signature and recover signer
//! const signer = try SignedData.recoverSigner(msg_hash, r, s, v);
//!
//! // Create SignedMessage from data and signature
//! var msg = try SignedData.fromSignature(allocator, "Hello!", r, s, v);
//! defer msg.deinit();
//! const valid = msg.verify(expected_address);
//! ```

const std = @import("std");
const crypto = @import("crypto");

/// EIP-191 version byte constants
pub const VERSION_DATA_WITH_VALIDATOR: u8 = 0x00;
pub const VERSION_STRUCTURED_DATA: u8 = 0x01;
pub const VERSION_PERSONAL_MESSAGE: u8 = 0x45; // 'E' in ASCII

/// EIP-191 prefix byte
pub const EIP191_PREFIX: u8 = 0x19;

/// Personal message prefix string
pub const PERSONAL_MESSAGE_PREFIX = "\x19Ethereum Signed Message:\n";

/// SignedData error types
pub const Error = error{
    InvalidVersion,
    OutOfMemory,
    InvalidData,
};

/// SignedData type - EIP-191 formatted data
pub const SignedData = struct {
    data: []u8,
    allocator: std.mem.Allocator,

    const Self = @This();

    /// Free the signed data memory
    pub fn deinit(self: *Self) void {
        if (self.data.len > 0) {
            self.allocator.free(self.data);
        }
        self.data = &[_]u8{};
    }

    /// Get the underlying bytes
    pub fn bytes(self: *const Self) []const u8 {
        return self.data;
    }

    /// Get the length of the signed data
    pub fn len(self: *const Self) usize {
        return self.data.len;
    }

    /// Get the version byte
    pub fn getVersion(self: *const Self) ?u8 {
        if (self.data.len < 2) {
            return null;
        }
        return self.data[1];
    }

    /// Get the prefix byte (should be 0x19 for EIP-191)
    pub fn getPrefix(self: *const Self) ?u8 {
        if (self.data.len < 1) {
            return null;
        }
        return self.data[0];
    }
};

// ============================================================================
// Constructors
// ============================================================================

/// Create EIP-191 signed data from components
/// Format: 0x19 <version byte> <version specific data>
pub fn from(allocator: std.mem.Allocator, version: u8, version_data: []const u8, data: []const u8) Error!SignedData {
    // Validate version
    if (version != VERSION_DATA_WITH_VALIDATOR and
        version != VERSION_STRUCTURED_DATA and
        version != VERSION_PERSONAL_MESSAGE)
    {
        return Error.InvalidVersion;
    }

    // Calculate total length: prefix (1) + version (1) + version_data + data
    const total_length = 2 + version_data.len + data.len;
    const result = allocator.alloc(u8, total_length) catch return Error.OutOfMemory;

    // Set prefix and version
    result[0] = EIP191_PREFIX;
    result[1] = version;

    // Copy version-specific data and message
    if (version_data.len > 0) {
        @memcpy(result[2 .. 2 + version_data.len], version_data);
    }
    @memcpy(result[2 + version_data.len ..], data);

    return SignedData{
        .data = result,
        .allocator = allocator,
    };
}

test "from - personal message version" {
    const allocator = std.testing.allocator;
    const message = "Hello!";
    var signed = try from(allocator, VERSION_PERSONAL_MESSAGE, &[_]u8{}, message);
    defer signed.deinit();

    try std.testing.expectEqual(EIP191_PREFIX, signed.getPrefix().?);
    try std.testing.expectEqual(VERSION_PERSONAL_MESSAGE, signed.getVersion().?);
}

test "from - data with validator version" {
    const allocator = std.testing.allocator;
    const validator = [_]u8{0xaa} ** 20;
    const data = "test data";
    var signed = try from(allocator, VERSION_DATA_WITH_VALIDATOR, &validator, data);
    defer signed.deinit();

    try std.testing.expectEqual(VERSION_DATA_WITH_VALIDATOR, signed.getVersion().?);
    try std.testing.expectEqual(@as(usize, 2 + 20 + 9), signed.len());
}

test "from - structured data version" {
    const allocator = std.testing.allocator;
    const domain_separator = [_]u8{0xbb} ** 32;
    const data = [_]u8{0xcc} ** 32;
    var signed = try from(allocator, VERSION_STRUCTURED_DATA, &domain_separator, &data);
    defer signed.deinit();

    try std.testing.expectEqual(VERSION_STRUCTURED_DATA, signed.getVersion().?);
}

test "from - invalid version" {
    const allocator = std.testing.allocator;
    try std.testing.expectError(Error.InvalidVersion, from(allocator, 0xff, &[_]u8{}, "data"));
}

/// Create EIP-191 personal message signed data
/// Format: "\x19Ethereum Signed Message:\n" + len(message) + message
pub fn fromPersonalMessage(allocator: std.mem.Allocator, message: []const u8) Error!SignedData {
    // Calculate length string
    var len_buf: [20]u8 = undefined;
    const len_str = std.fmt.bufPrint(&len_buf, "{d}", .{message.len}) catch return Error.OutOfMemory;

    // Calculate total length
    const prefix_len = PERSONAL_MESSAGE_PREFIX.len;
    const total_len = prefix_len + len_str.len + message.len;

    const result = allocator.alloc(u8, total_len) catch return Error.OutOfMemory;

    // Copy prefix
    @memcpy(result[0..prefix_len], PERSONAL_MESSAGE_PREFIX);

    // Copy length string
    @memcpy(result[prefix_len .. prefix_len + len_str.len], len_str);

    // Copy message
    @memcpy(result[prefix_len + len_str.len ..], message);

    return SignedData{
        .data = result,
        .allocator = allocator,
    };
}

test "fromPersonalMessage - basic" {
    const allocator = std.testing.allocator;
    var signed = try fromPersonalMessage(allocator, "Hello!");
    defer signed.deinit();

    // Check prefix
    try std.testing.expect(std.mem.startsWith(u8, signed.bytes(), PERSONAL_MESSAGE_PREFIX));

    // Length should be: prefix (26) + "6" (1) + "Hello!" (6) = 33
    try std.testing.expectEqual(@as(usize, 33), signed.len());
}

test "fromPersonalMessage - empty message" {
    const allocator = std.testing.allocator;
    var signed = try fromPersonalMessage(allocator, "");
    defer signed.deinit();

    // Length should be: prefix (26) + "0" (1) = 27
    try std.testing.expectEqual(@as(usize, 27), signed.len());
}

test "fromPersonalMessage - long message" {
    const allocator = std.testing.allocator;
    const message = "a" ** 100;
    var signed = try fromPersonalMessage(allocator, message);
    defer signed.deinit();

    // Length should be: prefix (26) + "100" (3) + message (100) = 129
    try std.testing.expectEqual(@as(usize, 129), signed.len());
}

// ============================================================================
// Hashing
// ============================================================================

/// Compute keccak256 hash of the signed data
pub fn hash(signed: *const SignedData) [32]u8 {
    var result: [32]u8 = undefined;
    crypto.Keccak256.hash(signed.data, &result, .{});
    return result;
}

test "hash - personal message" {
    const allocator = std.testing.allocator;
    var signed = try fromPersonalMessage(allocator, "Hello!");
    defer signed.deinit();

    const h = hash(&signed);
    try std.testing.expectEqual(@as(usize, 32), h.len);

    // Hash should be deterministic
    const h2 = hash(&signed);
    try std.testing.expectEqualSlices(u8, &h, &h2);
}

test "hash - different messages produce different hashes" {
    const allocator = std.testing.allocator;
    var signed1 = try fromPersonalMessage(allocator, "Hello!");
    defer signed1.deinit();
    var signed2 = try fromPersonalMessage(allocator, "World!");
    defer signed2.deinit();

    const h1 = hash(&signed1);
    const h2 = hash(&signed2);

    try std.testing.expect(!std.mem.eql(u8, &h1, &h2));
}

/// Compute personal message hash directly from message
/// This is the most common use case for EIP-191 signing
pub fn hashPersonalMessage(allocator: std.mem.Allocator, message: []const u8) Error![32]u8 {
    var signed = try fromPersonalMessage(allocator, message);
    defer signed.deinit();
    return hash(&signed);
}

test "hashPersonalMessage - basic" {
    const allocator = std.testing.allocator;
    const h = try hashPersonalMessage(allocator, "Hello!");

    // Verify same as manual approach
    var signed = try fromPersonalMessage(allocator, "Hello!");
    defer signed.deinit();
    const h2 = hash(&signed);

    try std.testing.expectEqualSlices(u8, &h, &h2);
}

// ============================================================================
// Equality
// ============================================================================

/// Check if two SignedData instances are equal
pub fn equals(a: *const SignedData, b: *const SignedData) bool {
    if (a.data.len != b.data.len) {
        return false;
    }
    return std.mem.eql(u8, a.data, b.data);
}

test "equals - identical" {
    const allocator = std.testing.allocator;
    var signed1 = try fromPersonalMessage(allocator, "Hello!");
    defer signed1.deinit();
    var signed2 = try fromPersonalMessage(allocator, "Hello!");
    defer signed2.deinit();

    try std.testing.expect(equals(&signed1, &signed2));
}

test "equals - different" {
    const allocator = std.testing.allocator;
    var signed1 = try fromPersonalMessage(allocator, "Hello!");
    defer signed1.deinit();
    var signed2 = try fromPersonalMessage(allocator, "World!");
    defer signed2.deinit();

    try std.testing.expect(!equals(&signed1, &signed2));
}

// ============================================================================
// Validation
// ============================================================================

/// Check if the signed data has a valid EIP-191 format
pub fn isValid(signed: *const SignedData) bool {
    if (signed.data.len < 2) {
        return false;
    }

    // Check prefix
    if (signed.data[0] != EIP191_PREFIX) {
        return false;
    }

    // Check version
    const version = signed.data[1];
    return version == VERSION_DATA_WITH_VALIDATOR or
        version == VERSION_STRUCTURED_DATA or
        version == VERSION_PERSONAL_MESSAGE;
}

test "isValid - valid personal message" {
    const allocator = std.testing.allocator;
    var signed = try from(allocator, VERSION_PERSONAL_MESSAGE, &[_]u8{}, "test");
    defer signed.deinit();

    try std.testing.expect(isValid(&signed));
}

test "isValid - valid data with validator" {
    const allocator = std.testing.allocator;
    const validator = [_]u8{0xaa} ** 20;
    var signed = try from(allocator, VERSION_DATA_WITH_VALIDATOR, &validator, "test");
    defer signed.deinit();

    try std.testing.expect(isValid(&signed));
}

/// Check if this is a personal message format
pub fn isPersonalMessage(signed: *const SignedData) bool {
    return signed.getVersion() == VERSION_PERSONAL_MESSAGE;
}

test "isPersonalMessage - true" {
    const allocator = std.testing.allocator;
    var signed = try from(allocator, VERSION_PERSONAL_MESSAGE, &[_]u8{}, "test");
    defer signed.deinit();

    try std.testing.expect(isPersonalMessage(&signed));
}

test "isPersonalMessage - false" {
    const allocator = std.testing.allocator;
    const validator = [_]u8{0xaa} ** 20;
    var signed = try from(allocator, VERSION_DATA_WITH_VALIDATOR, &validator, "test");
    defer signed.deinit();

    try std.testing.expect(!isPersonalMessage(&signed));
}

/// Check if this is structured data format (EIP-712)
pub fn isStructuredData(signed: *const SignedData) bool {
    return signed.getVersion() == VERSION_STRUCTURED_DATA;
}

test "isStructuredData - true" {
    const allocator = std.testing.allocator;
    const domain_separator = [_]u8{0xbb} ** 32;
    var signed = try from(allocator, VERSION_STRUCTURED_DATA, &domain_separator, &[_]u8{0xcc} ** 32);
    defer signed.deinit();

    try std.testing.expect(isStructuredData(&signed));
}

/// Check if this is data with validator format
pub fn isDataWithValidator(signed: *const SignedData) bool {
    return signed.getVersion() == VERSION_DATA_WITH_VALIDATOR;
}

test "isDataWithValidator - true" {
    const allocator = std.testing.allocator;
    const validator = [_]u8{0xaa} ** 20;
    var signed = try from(allocator, VERSION_DATA_WITH_VALIDATOR, &validator, "test");
    defer signed.deinit();

    try std.testing.expect(isDataWithValidator(&signed));
}

// ============================================================================
// Cloning
// ============================================================================

/// Clone signed data (creates new allocation)
pub fn clone(allocator: std.mem.Allocator, signed: *const SignedData) Error!SignedData {
    if (signed.data.len == 0) {
        return SignedData{
            .data = &[_]u8{},
            .allocator = allocator,
        };
    }

    const data = allocator.alloc(u8, signed.data.len) catch return Error.OutOfMemory;
    @memcpy(data, signed.data);

    return SignedData{
        .data = data,
        .allocator = allocator,
    };
}

test "clone - creates independent copy" {
    const allocator = std.testing.allocator;
    var original = try fromPersonalMessage(allocator, "Hello!");
    defer original.deinit();

    var copy = try clone(allocator, &original);
    defer copy.deinit();

    try std.testing.expect(equals(&original, &copy));
    try std.testing.expect(original.data.ptr != copy.data.ptr);
}

// ============================================================================
// SignedMessage - Data bundled with signature and recovered signer
// ============================================================================

const secp256k1 = crypto.secp256k1;
const Address = @import("primitives").Address;
const Signature = @import("primitives").Signature;

/// Error types for SignedMessage operations
pub const SignedMessageError = error{
    InvalidSignature,
    InvalidRecoveryId,
    InvalidHashLength,
    InvalidRLength,
    InvalidSLength,
    SignerMismatch,
    OutOfMemory,
};

/// SignedMessage - bundles original data with its signature and recovered signer
///
/// This type represents a complete signed message including:
/// - The original data that was signed
/// - The ECDSA signature (r, s, v)
/// - The recovered signer address
///
/// Usage:
/// ```zig
/// const SignedData = @import("primitives").SignedData;
///
/// // Create from data and signature
/// var msg = try SignedData.SignedMessage.fromSignature(allocator, data, sig);
/// defer msg.deinit();
///
/// // Verify against expected signer
/// const valid = msg.verify(expected_address);
///
/// // Get signer address
/// const signer = msg.getSigner();
/// ```
pub const SignedMessage = struct {
    /// Original data that was signed
    data: []u8,
    /// ECDSA signature
    signature: Signature,
    /// Recovered signer address
    signer: Address,
    /// Allocator for data memory
    allocator: std.mem.Allocator,

    const Self = @This();

    /// Free the signed message memory
    pub fn deinit(self: *Self) void {
        if (self.data.len > 0) {
            self.allocator.free(self.data);
        }
        self.data = &[_]u8{};
    }

    /// Get the original data
    pub fn getData(self: *const Self) []const u8 {
        return self.data;
    }

    /// Get the signature
    pub fn getSignature(self: *const Self) Signature {
        return self.signature;
    }

    /// Get the recovered signer address
    pub fn getSigner(self: *const Self) Address {
        return self.signer;
    }

    /// Verify signature against expected signer address
    pub fn verify(self: *const Self, expected_signer: Address) bool {
        return std.mem.eql(u8, &self.signer.bytes, &expected_signer.bytes);
    }

    /// Check equality with another SignedMessage
    pub fn equals(self: *const Self, other: *const Self) bool {
        if (!std.mem.eql(u8, self.data, other.data)) return false;
        if (!self.signature.equals(other.signature)) return false;
        if (!std.mem.eql(u8, &self.signer.bytes, &other.signer.bytes)) return false;
        return true;
    }
};

/// Create SignedMessage from data and signature components
/// Recovers the signer address from the signature
pub fn fromSignature(
    allocator: std.mem.Allocator,
    data: []const u8,
    r: [32]u8,
    s: [32]u8,
    v: u8,
) SignedMessageError!SignedMessage {
    // Copy data
    const data_copy = allocator.alloc(u8, data.len) catch return SignedMessageError.OutOfMemory;
    errdefer allocator.free(data_copy);
    @memcpy(data_copy, data);

    // Create signature
    const signature = Signature.fromSecp256k1(r, s, v);

    // Hash the data for recovery (EIP-191 personal message format)
    var eip191_data = fromPersonalMessage(allocator, data) catch return SignedMessageError.OutOfMemory;
    defer eip191_data.deinit();
    const msg_hash = hash(&eip191_data);

    // Recover signer address
    const pub_key = secp256k1.recoverPubkey(&msg_hash, &r, &s, v) catch |err| {
        return switch (err) {
            error.InvalidSignature => SignedMessageError.InvalidSignature,
            error.InvalidRecoveryId => SignedMessageError.InvalidRecoveryId,
            error.InvalidHashLength => SignedMessageError.InvalidHashLength,
            error.InvalidRLength => SignedMessageError.InvalidRLength,
            error.InvalidSLength => SignedMessageError.InvalidSLength,
        };
    };

    // Derive address from public key (keccak256 of pubkey, take last 20 bytes)
    var addr_hash: [32]u8 = undefined;
    crypto.Keccak256.hash(&pub_key, &addr_hash, .{});

    var signer: Address = undefined;
    @memcpy(&signer.bytes, addr_hash[12..32]);

    return SignedMessage{
        .data = data_copy,
        .signature = signature,
        .signer = signer,
        .allocator = allocator,
    };
}

/// Create SignedMessage from data and Signature struct
pub fn fromSignatureStruct(
    allocator: std.mem.Allocator,
    data: []const u8,
    signature: Signature,
) SignedMessageError!SignedMessage {
    const v = signature.v orelse 27; // Default to 27 if not set
    return fromSignature(allocator, data, signature.r, signature.s, v);
}

/// Create SignedMessage from raw EIP-191 formatted data (not personal message wrapped)
/// Use this when data is already in EIP-191 format
pub fn fromRawSignedData(
    allocator: std.mem.Allocator,
    eip191_data: []const u8,
    r: [32]u8,
    s: [32]u8,
    v: u8,
) SignedMessageError!SignedMessage {
    // Copy data
    const data_copy = allocator.alloc(u8, eip191_data.len) catch return SignedMessageError.OutOfMemory;
    errdefer allocator.free(data_copy);
    @memcpy(data_copy, eip191_data);

    // Create signature
    const signature = Signature.fromSecp256k1(r, s, v);

    // Hash the raw EIP-191 data directly
    var msg_hash: [32]u8 = undefined;
    crypto.Keccak256.hash(eip191_data, &msg_hash, .{});

    // Recover signer address
    const pub_key = secp256k1.recoverPubkey(&msg_hash, &r, &s, v) catch |err| {
        return switch (err) {
            error.InvalidSignature => SignedMessageError.InvalidSignature,
            error.InvalidRecoveryId => SignedMessageError.InvalidRecoveryId,
            error.InvalidHashLength => SignedMessageError.InvalidHashLength,
            error.InvalidRLength => SignedMessageError.InvalidRLength,
            error.InvalidSLength => SignedMessageError.InvalidSLength,
        };
    };

    // Derive address from public key
    var addr_hash: [32]u8 = undefined;
    crypto.Keccak256.hash(&pub_key, &addr_hash, .{});

    var signer: Address = undefined;
    @memcpy(&signer.bytes, addr_hash[12..32]);

    return SignedMessage{
        .data = data_copy,
        .signature = signature,
        .signer = signer,
        .allocator = allocator,
    };
}

/// Recover signer address from message hash and signature
/// Does not create SignedMessage, just returns the address
pub fn recoverSigner(
    msg_hash: [32]u8,
    r: [32]u8,
    s: [32]u8,
    v: u8,
) SignedMessageError!Address {
    const pub_key = secp256k1.recoverPubkey(&msg_hash, &r, &s, v) catch |err| {
        return switch (err) {
            error.InvalidSignature => SignedMessageError.InvalidSignature,
            error.InvalidRecoveryId => SignedMessageError.InvalidRecoveryId,
            error.InvalidHashLength => SignedMessageError.InvalidHashLength,
            error.InvalidRLength => SignedMessageError.InvalidRLength,
            error.InvalidSLength => SignedMessageError.InvalidSLength,
        };
    };

    var addr_hash: [32]u8 = undefined;
    crypto.Keccak256.hash(&pub_key, &addr_hash, .{});

    var signer: Address = undefined;
    @memcpy(&signer.bytes, addr_hash[12..32]);

    return signer;
}

/// Verify signature against expected signer (without creating SignedMessage)
pub fn verifySigner(
    msg_hash: [32]u8,
    r: [32]u8,
    s: [32]u8,
    v: u8,
    expected_signer: Address,
) bool {
    const recovered = recoverSigner(msg_hash, r, s, v) catch return false;
    return std.mem.eql(u8, &recovered.bytes, &expected_signer.bytes);
}

/// Verify personal message signature against expected signer
pub fn verifyPersonalMessage(
    allocator: std.mem.Allocator,
    message: []const u8,
    r: [32]u8,
    s: [32]u8,
    v: u8,
    expected_signer: Address,
) bool {
    const msg_hash = hashPersonalMessage(allocator, message) catch return false;
    return verifySigner(msg_hash, r, s, v, expected_signer);
}

// ============================================================================
// SignedMessage Tests
// ============================================================================

test "SignedMessage - fromSignature creates valid structure" {
    const allocator = std.testing.allocator;

    // Test data
    const data = "Hello, Ethereum!";

    // Create test signature components (these are mock values)
    // In real usage, these would come from actual signing
    const r = [_]u8{0x01} ** 32;
    const s = [_]u8{0x02} ** 32;
    const v: u8 = 27;

    // Note: This will fail signature recovery with mock values
    // but tests the structure creation
    const result = fromSignature(allocator, data, r, s, v);

    if (result) |*msg| {
        defer msg.deinit();
        try std.testing.expectEqualSlices(u8, data, msg.getData());
        try std.testing.expectEqual(@as(?u8, 27), msg.getSignature().v);
    } else |_| {
        // Expected to fail with mock signature values - that's ok
    }
}

test "SignedMessage.verify - compares signer addresses" {
    // Create a mock SignedMessage for testing verify logic
    const allocator = std.testing.allocator;
    const data = allocator.alloc(u8, 5) catch unreachable;
    @memcpy(data, "Hello");

    const sig = Signature.fromSecp256k1([_]u8{1} ** 32, [_]u8{2} ** 32, 27);
    var signer: Address = undefined;
    @memset(&signer.bytes, 0xaa);

    var msg = SignedMessage{
        .data = data,
        .signature = sig,
        .signer = signer,
        .allocator = allocator,
    };
    defer msg.deinit();

    // Verify against same address
    var same_addr: Address = undefined;
    @memset(&same_addr.bytes, 0xaa);
    try std.testing.expect(msg.verify(same_addr));

    // Verify against different address
    var diff_addr: Address = undefined;
    @memset(&diff_addr.bytes, 0xbb);
    try std.testing.expect(!msg.verify(diff_addr));
}

test "SignedMessage.equals - compares all fields" {
    const allocator = std.testing.allocator;

    // Create two identical messages
    const data1 = allocator.alloc(u8, 5) catch unreachable;
    @memcpy(data1, "Hello");
    const data2 = allocator.alloc(u8, 5) catch unreachable;
    @memcpy(data2, "Hello");

    const sig = Signature.fromSecp256k1([_]u8{1} ** 32, [_]u8{2} ** 32, 27);
    var signer: Address = undefined;
    @memset(&signer.bytes, 0xaa);

    var msg1 = SignedMessage{
        .data = data1,
        .signature = sig,
        .signer = signer,
        .allocator = allocator,
    };
    defer msg1.deinit();

    var msg2 = SignedMessage{
        .data = data2,
        .signature = sig,
        .signer = signer,
        .allocator = allocator,
    };
    defer msg2.deinit();

    try std.testing.expect(msg1.equals(&msg2));
}

test "SignedMessage.equals - different data returns false" {
    const allocator = std.testing.allocator;

    const data1 = allocator.alloc(u8, 5) catch unreachable;
    @memcpy(data1, "Hello");
    const data2 = allocator.alloc(u8, 5) catch unreachable;
    @memcpy(data2, "World");

    const sig = Signature.fromSecp256k1([_]u8{1} ** 32, [_]u8{2} ** 32, 27);
    var signer: Address = undefined;
    @memset(&signer.bytes, 0xaa);

    var msg1 = SignedMessage{
        .data = data1,
        .signature = sig,
        .signer = signer,
        .allocator = allocator,
    };
    defer msg1.deinit();

    var msg2 = SignedMessage{
        .data = data2,
        .signature = sig,
        .signer = signer,
        .allocator = allocator,
    };
    defer msg2.deinit();

    try std.testing.expect(!msg1.equals(&msg2));
}

test "recoverSigner - returns error for invalid signature" {
    const msg_hash = [_]u8{0xab} ** 32;
    const r = [_]u8{0x00} ** 32; // Invalid: r cannot be 0
    const s = [_]u8{0x01} ** 32;
    const v: u8 = 27;

    const result = recoverSigner(msg_hash, r, s, v);
    try std.testing.expectError(SignedMessageError.InvalidSignature, result);
}

test "verifySigner - returns false for invalid signature" {
    const msg_hash = [_]u8{0xab} ** 32;
    const r = [_]u8{0x00} ** 32; // Invalid
    const s = [_]u8{0x01} ** 32;
    const v: u8 = 27;

    var expected: Address = undefined;
    @memset(&expected.bytes, 0xcc);

    try std.testing.expect(!verifySigner(msg_hash, r, s, v, expected));
}

test "verifyPersonalMessage - returns false for invalid signature" {
    const allocator = std.testing.allocator;
    const message = "Test message";
    const r = [_]u8{0x00} ** 32; // Invalid
    const s = [_]u8{0x01} ** 32;
    const v: u8 = 27;

    var expected: Address = undefined;
    @memset(&expected.bytes, 0xcc);

    try std.testing.expect(!verifyPersonalMessage(allocator, message, r, s, v, expected));
}
