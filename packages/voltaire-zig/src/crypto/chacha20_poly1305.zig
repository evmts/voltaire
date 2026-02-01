//! ChaCha20-Poly1305 Authenticated Encryption
//!
//! Provides ChaCha20-Poly1305 authenticated encryption with associated data (AEAD)
//! as specified in RFC 8439. Wraps Zig's standard library implementation with
//! allocation-friendly interfaces.
//!
//! ## Overview
//! ChaCha20-Poly1305 combines the ChaCha20 stream cipher with the Poly1305 authenticator,
//! providing both confidentiality and authenticity in a single operation.
//!
//! ## Parameters
//! - **Key size**: 256 bits (32 bytes)
//! - **Nonce size**: 96 bits (12 bytes)
//! - **Tag size**: 128 bits (16 bytes)
//!
//! ## Features
//! - Authenticated encryption with associated data (AEAD)
//! - Constant-time operations
//! - No hardware dependencies (pure software)
//! - Fast on platforms without AES hardware acceleration
//!
//! ## Usage
//! ```zig
//! const chacha = @import("chacha20_poly1305");
//!
//! // Encrypt
//! const key: [32]u8 = ...;  // 256-bit key
//! const nonce: [12]u8 = ...; // 96-bit nonce (must be unique)
//! const ciphertext = try chacha.encrypt(
//!     allocator,
//!     plaintext,
//!     &key,
//!     &nonce,
//!     associated_data
//! );
//! defer allocator.free(ciphertext);
//!
//! // Decrypt
//! const plaintext = try chacha.decrypt(
//!     allocator,
//!     ciphertext,
//!     &key,
//!     &nonce,
//!     associated_data
//! );
//! defer allocator.free(plaintext);
//! ```
//!
//! ## Security Notes
//! - Never reuse nonces with the same key
//! - Uses Zig's audited std.crypto implementation
//! - Constant-time guarantee from underlying primitives
//! - Authentication tag prevents tampering
//!
//! ## References
//! - [RFC 8439](https://tools.ietf.org/html/rfc8439) - ChaCha20 and Poly1305 for IETF Protocols

const std = @import("std");
const crypto = std.crypto;

/// ChaCha20-Poly1305 AEAD cipher
/// Re-exports Zig's standard library implementation
pub const ChaCha20Poly1305 = crypto.aead.chacha_poly.ChaCha20Poly1305;

/// Key size in bytes (256 bits)
pub const KEY_SIZE = 32;

/// Nonce size in bytes (96 bits)
pub const NONCE_SIZE = 12;

/// Authentication tag size in bytes (128 bits)
pub const TAG_SIZE = 16;

/// Encrypt data with ChaCha20-Poly1305
///
/// Returns ciphertext with authentication tag appended (ciphertext.len = plaintext.len + 16)
pub fn encrypt(
    allocator: std.mem.Allocator,
    plaintext: []const u8,
    key: []const u8,
    nonce: []const u8,
    additional_data: []const u8,
) ![]u8 {
    if (key.len != KEY_SIZE) return error.InvalidKeyLength;
    if (nonce.len != NONCE_SIZE) return error.InvalidNonceLength;

    const ciphertext_len = plaintext.len + TAG_SIZE;
    const result = try allocator.alloc(u8, ciphertext_len);

    const ciphertext = result[0..plaintext.len];
    var tag: [TAG_SIZE]u8 = undefined;

    ChaCha20Poly1305.encrypt(ciphertext, &tag, plaintext, additional_data, nonce[0..NONCE_SIZE].*, key[0..KEY_SIZE].*);

    @memcpy(result[plaintext.len..], &tag);

    return result;
}

/// Decrypt data with ChaCha20-Poly1305
///
/// Input must contain ciphertext with authentication tag appended
/// Returns plaintext if authentication succeeds, error otherwise
pub fn decrypt(
    allocator: std.mem.Allocator,
    ciphertext_with_tag: []const u8,
    key: []const u8,
    nonce: []const u8,
    additional_data: []const u8,
) ![]u8 {
    if (key.len != KEY_SIZE) return error.InvalidKeyLength;
    if (nonce.len != NONCE_SIZE) return error.InvalidNonceLength;
    if (ciphertext_with_tag.len < TAG_SIZE) return error.InvalidCiphertextLength;

    const ciphertext_len = ciphertext_with_tag.len - TAG_SIZE;
    const ciphertext = ciphertext_with_tag[0..ciphertext_len];
    const tag = ciphertext_with_tag[ciphertext_len..][0..TAG_SIZE];

    const result = try allocator.alloc(u8, ciphertext_len);

    ChaCha20Poly1305.decrypt(result, ciphertext, tag.*, additional_data, nonce[0..NONCE_SIZE].*, key[0..KEY_SIZE].*) catch {
        allocator.free(result);
        return error.AuthenticationFailed;
    };

    return result;
}

/// In-place encryption (no allocation)
///
/// Encrypts plaintext in place and writes tag to output
pub fn encryptInPlace(
    plaintext: []u8,
    tag: *[TAG_SIZE]u8,
    key: *const [KEY_SIZE]u8,
    nonce: *const [NONCE_SIZE]u8,
    additional_data: []const u8,
) void {
    ChaCha20Poly1305.encrypt(plaintext, tag, plaintext, additional_data, nonce.*, key.*);
}

/// In-place decryption (no allocation)
///
/// Decrypts ciphertext in place and verifies tag
pub fn decryptInPlace(
    ciphertext: []u8,
    tag: *const [TAG_SIZE]u8,
    key: *const [KEY_SIZE]u8,
    nonce: *const [NONCE_SIZE]u8,
    additional_data: []const u8,
) !void {
    ChaCha20Poly1305.decrypt(ciphertext, ciphertext, tag.*, additional_data, nonce.*, key.*) catch {
        return error.AuthenticationFailed;
    };
}

// =============================================================================
// Tests
// =============================================================================

test "chacha20-poly1305 basic encrypt/decrypt" {
    const allocator = std.testing.allocator;

    const key = [_]u8{1} ** KEY_SIZE;
    const nonce = [_]u8{2} ** NONCE_SIZE;
    const plaintext = "Hello, ChaCha20-Poly1305!";
    const additional_data = "metadata";

    // Encrypt
    const ciphertext = try encrypt(allocator, plaintext, &key, &nonce, additional_data);
    defer allocator.free(ciphertext);

    try std.testing.expect(ciphertext.len == plaintext.len + TAG_SIZE);

    // Decrypt
    const decrypted = try decrypt(allocator, ciphertext, &key, &nonce, additional_data);
    defer allocator.free(decrypted);

    try std.testing.expectEqualSlices(u8, plaintext, decrypted);
}

test "chacha20-poly1305 empty plaintext" {
    const allocator = std.testing.allocator;

    const key = [_]u8{1} ** KEY_SIZE;
    const nonce = [_]u8{2} ** NONCE_SIZE;
    const plaintext = "";
    const additional_data = "";

    const ciphertext = try encrypt(allocator, plaintext, &key, &nonce, additional_data);
    defer allocator.free(ciphertext);

    try std.testing.expect(ciphertext.len == TAG_SIZE);

    const decrypted = try decrypt(allocator, ciphertext, &key, &nonce, additional_data);
    defer allocator.free(decrypted);

    try std.testing.expectEqualSlices(u8, plaintext, decrypted);
}

test "chacha20-poly1305 wrong key fails" {
    const allocator = std.testing.allocator;

    const key = [_]u8{1} ** KEY_SIZE;
    const wrong_key = [_]u8{2} ** KEY_SIZE;
    const nonce = [_]u8{3} ** NONCE_SIZE;
    const plaintext = "test";
    const additional_data = "";

    const ciphertext = try encrypt(allocator, plaintext, &key, &nonce, additional_data);
    defer allocator.free(ciphertext);

    const result = decrypt(allocator, ciphertext, &wrong_key, &nonce, additional_data);
    try std.testing.expectError(error.AuthenticationFailed, result);
}

test "chacha20-poly1305 wrong nonce fails" {
    const allocator = std.testing.allocator;

    const key = [_]u8{1} ** KEY_SIZE;
    const nonce = [_]u8{2} ** NONCE_SIZE;
    const wrong_nonce = [_]u8{3} ** NONCE_SIZE;
    const plaintext = "test";
    const additional_data = "";

    const ciphertext = try encrypt(allocator, plaintext, &key, &nonce, additional_data);
    defer allocator.free(ciphertext);

    const result = decrypt(allocator, ciphertext, &key, &wrong_nonce, additional_data);
    try std.testing.expectError(error.AuthenticationFailed, result);
}

test "chacha20-poly1305 modified ciphertext fails" {
    const allocator = std.testing.allocator;

    const key = [_]u8{1} ** KEY_SIZE;
    const nonce = [_]u8{2} ** NONCE_SIZE;
    const plaintext = "test message";
    const additional_data = "";

    const ciphertext = try encrypt(allocator, plaintext, &key, &nonce, additional_data);
    defer allocator.free(ciphertext);

    var modified = try allocator.alloc(u8, ciphertext.len);
    defer allocator.free(modified);
    @memcpy(modified, ciphertext);
    modified[0] ^= 1;

    const result = decrypt(allocator, modified, &key, &nonce, additional_data);
    try std.testing.expectError(error.AuthenticationFailed, result);
}

test "chacha20-poly1305 modified tag fails" {
    const allocator = std.testing.allocator;

    const key = [_]u8{1} ** KEY_SIZE;
    const nonce = [_]u8{2} ** NONCE_SIZE;
    const plaintext = "test message";
    const additional_data = "";

    const ciphertext = try encrypt(allocator, plaintext, &key, &nonce, additional_data);
    defer allocator.free(ciphertext);

    var modified = try allocator.alloc(u8, ciphertext.len);
    defer allocator.free(modified);
    @memcpy(modified, ciphertext);
    modified[ciphertext.len - 1] ^= 1;

    const result = decrypt(allocator, modified, &key, &nonce, additional_data);
    try std.testing.expectError(error.AuthenticationFailed, result);
}

test "chacha20-poly1305 wrong aad fails" {
    const allocator = std.testing.allocator;

    const key = [_]u8{1} ** KEY_SIZE;
    const nonce = [_]u8{2} ** NONCE_SIZE;
    const plaintext = "test";
    const aad1 = "metadata1";
    const aad2 = "metadata2";

    const ciphertext = try encrypt(allocator, plaintext, &key, &nonce, aad1);
    defer allocator.free(ciphertext);

    const result = decrypt(allocator, ciphertext, &key, &nonce, aad2);
    try std.testing.expectError(error.AuthenticationFailed, result);
}

test "chacha20-poly1305 large plaintext" {
    const allocator = std.testing.allocator;

    const key = [_]u8{1} ** KEY_SIZE;
    const nonce = [_]u8{2} ** NONCE_SIZE;
    const additional_data = "";

    const plaintext = try allocator.alloc(u8, 100000);
    defer allocator.free(plaintext);
    @memset(plaintext, 0xAB);

    const ciphertext = try encrypt(allocator, plaintext, &key, &nonce, additional_data);
    defer allocator.free(ciphertext);

    try std.testing.expect(ciphertext.len == plaintext.len + TAG_SIZE);

    const decrypted = try decrypt(allocator, ciphertext, &key, &nonce, additional_data);
    defer allocator.free(decrypted);

    try std.testing.expectEqualSlices(u8, plaintext, decrypted);
}

test "chacha20-poly1305 invalid key length" {
    const allocator = std.testing.allocator;

    const wrong_key = [_]u8{1} ** 16;
    const nonce = [_]u8{2} ** NONCE_SIZE;
    const plaintext = "test";
    const additional_data = "";

    const result = encrypt(allocator, plaintext, &wrong_key, &nonce, additional_data);
    try std.testing.expectError(error.InvalidKeyLength, result);
}

test "chacha20-poly1305 invalid nonce length" {
    const allocator = std.testing.allocator;

    const key = [_]u8{1} ** KEY_SIZE;
    const wrong_nonce = [_]u8{2} ** 8;
    const plaintext = "test";
    const additional_data = "";

    const result = encrypt(allocator, plaintext, &key, &wrong_nonce, additional_data);
    try std.testing.expectError(error.InvalidNonceLength, result);
}

test "chacha20-poly1305 ciphertext too short" {
    const allocator = std.testing.allocator;

    const key = [_]u8{1} ** KEY_SIZE;
    const nonce = [_]u8{2} ** NONCE_SIZE;
    const too_short = [_]u8{0} ** 15;
    const additional_data = "";

    const result = decrypt(allocator, &too_short, &key, &nonce, additional_data);
    try std.testing.expectError(error.InvalidCiphertextLength, result);
}

test "chacha20-poly1305 deterministic encryption" {
    const allocator = std.testing.allocator;

    const key = [_]u8{1} ** KEY_SIZE;
    const nonce = [_]u8{2} ** NONCE_SIZE;
    const plaintext = "test";
    const additional_data = "";

    const ciphertext1 = try encrypt(allocator, plaintext, &key, &nonce, additional_data);
    defer allocator.free(ciphertext1);

    const ciphertext2 = try encrypt(allocator, plaintext, &key, &nonce, additional_data);
    defer allocator.free(ciphertext2);

    try std.testing.expectEqualSlices(u8, ciphertext1, ciphertext2);
}

test "chacha20-poly1305 different nonces produce different ciphertext" {
    const allocator = std.testing.allocator;

    const key = [_]u8{1} ** KEY_SIZE;
    const nonce1 = [_]u8{2} ** NONCE_SIZE;
    const nonce2 = [_]u8{3} ** NONCE_SIZE;
    const plaintext = "test";
    const additional_data = "";

    const ciphertext1 = try encrypt(allocator, plaintext, &key, &nonce1, additional_data);
    defer allocator.free(ciphertext1);

    const ciphertext2 = try encrypt(allocator, plaintext, &key, &nonce2, additional_data);
    defer allocator.free(ciphertext2);

    const equal = std.mem.eql(u8, ciphertext1, ciphertext2);
    try std.testing.expect(!equal);
}

test "chacha20-poly1305 all-zero key" {
    const allocator = std.testing.allocator;

    const key = [_]u8{0} ** KEY_SIZE;
    const nonce = [_]u8{0} ** NONCE_SIZE;
    const plaintext = "test";
    const additional_data = "";

    const ciphertext = try encrypt(allocator, plaintext, &key, &nonce, additional_data);
    defer allocator.free(ciphertext);

    const decrypted = try decrypt(allocator, ciphertext, &key, &nonce, additional_data);
    defer allocator.free(decrypted);

    try std.testing.expectEqualSlices(u8, plaintext, decrypted);
}

test "chacha20-poly1305 all-ones key" {
    const allocator = std.testing.allocator;

    const key = [_]u8{0xFF} ** KEY_SIZE;
    const nonce = [_]u8{0xFF} ** NONCE_SIZE;
    const plaintext = "test";
    const additional_data = "";

    const ciphertext = try encrypt(allocator, plaintext, &key, &nonce, additional_data);
    defer allocator.free(ciphertext);

    const decrypted = try decrypt(allocator, ciphertext, &key, &nonce, additional_data);
    defer allocator.free(decrypted);

    try std.testing.expectEqualSlices(u8, plaintext, decrypted);
}

test "chacha20-poly1305 in-place encryption" {
    var key = [_]u8{1} ** KEY_SIZE;
    var nonce = [_]u8{2} ** NONCE_SIZE;
    var data = [_]u8{ 'H', 'e', 'l', 'l', 'o' };
    var tag: [TAG_SIZE]u8 = undefined;

    encryptInPlace(&data, &tag, &key, &nonce, "");

    // Decrypt in place
    try decryptInPlace(&data, &tag, &key, &nonce, "");

    try std.testing.expectEqualSlices(u8, "Hello", &data);
}

test "chacha20-poly1305 in-place wrong tag fails" {
    var key = [_]u8{1} ** KEY_SIZE;
    var nonce = [_]u8{2} ** NONCE_SIZE;
    var data = [_]u8{ 'H', 'e', 'l', 'l', 'o' };
    var tag: [TAG_SIZE]u8 = undefined;

    encryptInPlace(&data, &tag, &key, &nonce, "");

    // Modify tag
    tag[0] ^= 1;

    const result = decryptInPlace(&data, &tag, &key, &nonce, "");
    try std.testing.expectError(error.AuthenticationFailed, result);
}

// =============================================================================
// RFC 8439 Test Vectors
// =============================================================================

test "RFC 8439 Section 2.8.2 test vector" {
    const allocator = std.testing.allocator;

    // Key from RFC 8439
    const key = [_]u8{
        0x80, 0x81, 0x82, 0x83, 0x84, 0x85, 0x86, 0x87,
        0x88, 0x89, 0x8a, 0x8b, 0x8c, 0x8d, 0x8e, 0x8f,
        0x90, 0x91, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97,
        0x98, 0x99, 0x9a, 0x9b, 0x9c, 0x9d, 0x9e, 0x9f,
    };

    // Nonce from RFC 8439
    const nonce = [_]u8{
        0x07, 0x00, 0x00, 0x00, 0x40, 0x41, 0x42, 0x43,
        0x44, 0x45, 0x46, 0x47,
    };

    // AAD from RFC 8439
    const aad = [_]u8{
        0x50, 0x51, 0x52, 0x53, 0xc0, 0xc1, 0xc2, 0xc3,
        0xc4, 0xc5, 0xc6, 0xc7,
    };

    // Plaintext from RFC 8439
    const plaintext = "Ladies and Gentlemen of the class of '99: If I could offer you only one tip for the future, sunscreen would be it.";

    // Expected ciphertext + tag from RFC 8439 (130 bytes = 114 plaintext + 16 tag)
    const expected_ciphertext = [_]u8{
        0xd3, 0x1a, 0x8d, 0x34, 0x64, 0x8e, 0x60, 0xdb, 0x7b, 0x86, 0xaf, 0xbc, 0x53, 0xef, 0x7e, 0xc2,
        0xa4, 0xad, 0xed, 0x51, 0x29, 0x6e, 0x08, 0xfe, 0xa9, 0xe2, 0xb5, 0xa7, 0x36, 0xee, 0x62, 0xd6,
        0x3d, 0xbe, 0xa4, 0x5e, 0x8c, 0xa9, 0x67, 0x12, 0x82, 0xfa, 0xfb, 0x69, 0xda, 0x92, 0x72, 0x8b,
        0x1a, 0x71, 0xde, 0x0a, 0x9e, 0x06, 0x0b, 0x29, 0x05, 0xd6, 0xa5, 0xb6, 0x7e, 0xcd, 0x3b, 0x36,
        0x92, 0xdd, 0xbd, 0x7f, 0x2d, 0x77, 0x8b, 0x8c, 0x98, 0x03, 0xae, 0xe3, 0x28, 0x09, 0x1b, 0x58,
        0xfa, 0xb3, 0x24, 0xe4, 0xfa, 0xd6, 0x75, 0x94, 0x55, 0x85, 0x80, 0x8b, 0x48, 0x31, 0xd7, 0xbc,
        0x3f, 0xf4, 0xde, 0xf0, 0x8e, 0x4b, 0x7a, 0x9d, 0xe5, 0x76, 0xd2, 0x65, 0x86, 0xce, 0xc6, 0x4b,
        0x61, 0x16, 0x1a, 0xe1, 0x0b, 0x59, 0x4f, 0x09, 0xe2, 0x6a, 0x7e, 0x90, 0x2e, 0xcb, 0xd0, 0x60,
        0x06, 0x91,
    };

    // Encrypt
    const ciphertext = try encrypt(allocator, plaintext, &key, &nonce, &aad);
    defer allocator.free(ciphertext);

    try std.testing.expectEqualSlices(u8, &expected_ciphertext, ciphertext);

    // Verify decryption
    const decrypted = try decrypt(allocator, ciphertext, &key, &nonce, &aad);
    defer allocator.free(decrypted);

    try std.testing.expectEqualSlices(u8, plaintext, decrypted);
}

test "RFC 8439 encryption without AAD" {
    const allocator = std.testing.allocator;

    const key = [_]u8{
        0x80, 0x81, 0x82, 0x83, 0x84, 0x85, 0x86, 0x87,
        0x88, 0x89, 0x8a, 0x8b, 0x8c, 0x8d, 0x8e, 0x8f,
        0x90, 0x91, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97,
        0x98, 0x99, 0x9a, 0x9b, 0x9c, 0x9d, 0x9e, 0x9f,
    };

    const nonce = [_]u8{
        0x07, 0x00, 0x00, 0x00, 0x40, 0x41, 0x42, 0x43,
        0x44, 0x45, 0x46, 0x47,
    };

    const plaintext = "Ladies and Gentlemen of the class of '99: If I could offer you only one tip for the future, sunscreen would be it.";

    const ciphertext = try encrypt(allocator, plaintext, &key, &nonce, "");
    defer allocator.free(ciphertext);

    const decrypted = try decrypt(allocator, ciphertext, &key, &nonce, "");
    defer allocator.free(decrypted);

    try std.testing.expectEqualSlices(u8, plaintext, decrypted);
}

test "single byte plaintext" {
    const allocator = std.testing.allocator;

    const key = [_]u8{1} ** KEY_SIZE;
    const nonce = [_]u8{2} ** NONCE_SIZE;
    const plaintext = [_]u8{0x42};
    const additional_data = "";

    const ciphertext = try encrypt(allocator, &plaintext, &key, &nonce, additional_data);
    defer allocator.free(ciphertext);

    try std.testing.expect(ciphertext.len == 1 + TAG_SIZE);

    const decrypted = try decrypt(allocator, ciphertext, &key, &nonce, additional_data);
    defer allocator.free(decrypted);

    try std.testing.expectEqualSlices(u8, &plaintext, decrypted);
}

test "exact block size plaintext (64 bytes)" {
    const allocator = std.testing.allocator;

    const key = [_]u8{1} ** KEY_SIZE;
    const nonce = [_]u8{2} ** NONCE_SIZE;
    var plaintext: [64]u8 = undefined;
    for (&plaintext, 0..) |*b, i| {
        b.* = @truncate(i);
    }
    const additional_data = "";

    const ciphertext = try encrypt(allocator, &plaintext, &key, &nonce, additional_data);
    defer allocator.free(ciphertext);

    try std.testing.expect(ciphertext.len == 64 + TAG_SIZE);

    const decrypted = try decrypt(allocator, ciphertext, &key, &nonce, additional_data);
    defer allocator.free(decrypted);

    try std.testing.expectEqualSlices(u8, &plaintext, decrypted);
}

test "large AAD (1MB)" {
    const allocator = std.testing.allocator;

    const key = [_]u8{1} ** KEY_SIZE;
    const nonce = [_]u8{2} ** NONCE_SIZE;
    const plaintext = "test";

    const aad = try allocator.alloc(u8, 1024 * 1024);
    defer allocator.free(aad);
    for (aad, 0..) |*b, i| {
        b.* = @truncate(i);
    }

    const ciphertext = try encrypt(allocator, plaintext, &key, &nonce, aad);
    defer allocator.free(ciphertext);

    const decrypted = try decrypt(allocator, ciphertext, &key, &nonce, aad);
    defer allocator.free(decrypted);

    try std.testing.expectEqualSlices(u8, plaintext, decrypted);
}
