//! AES-GCM Authenticated Encryption
//!
//! Provides AES-GCM (Galois/Counter Mode) authenticated encryption with associated data (AEAD).
//! Wraps Zig's standard library implementation with allocation-friendly interfaces.
//!
//! ## Overview
//! AES-GCM combines AES encryption in counter mode with GMAC authentication,
//! providing both confidentiality and authenticity in a single operation.
//!
//! ## Supported Variants
//! - **AES-128-GCM**: 128-bit keys, 96-bit nonces, 128-bit tags
//! - **AES-256-GCM**: 256-bit keys, 96-bit nonces, 128-bit tags
//!
//! ## Features
//! - Authenticated encryption with associated data (AEAD)
//! - Constant-time operations
//! - Hardware acceleration (AES-NI) when available
//!
//! ## CRITICAL SECURITY WARNING: Nonce Reuse
//!
//! **NEVER reuse a nonce with the same key.** Nonce reuse completely breaks
//! AES-GCM security, allowing attackers to:
//!
//! 1. **Recover XOR of plaintexts**: ct1 ⊕ ct2 = pt1 ⊕ pt2
//! 2. **Recover the authentication key (H)**: Enables forgery attacks
//! 3. **Forge arbitrary valid ciphertexts**: Complete authentication bypass
//!
//! Generate nonces using a cryptographically secure random number generator
//! (e.g., std.crypto.random). With 96-bit random nonces, the birthday collision
//! probability is negligible for up to 2^32 encryptions per key (NIST limit).
//!
//! The nonce does not need to be secret - it can be stored with the ciphertext.
//! Only uniqueness matters.
//!
//! ## Usage
//! ```zig
//! const aes_gcm = @import("aes_gcm");
//!
//! // Encrypt - ALWAYS use a fresh random nonce
//! const key: [16]u8 = ...;  // 128-bit key
//! var nonce: [12]u8 = undefined;
//! std.crypto.random.bytes(&nonce); // Cryptographically secure random nonce
//!
//! const ciphertext = try aes_gcm.encrypt128(
//!     allocator,
//!     plaintext,
//!     &key,
//!     &nonce,
//!     associated_data
//! );
//! defer allocator.free(ciphertext);
//!
//! // Store nonce with ciphertext (nonce is not secret)
//!
//! // Decrypt
//! const plaintext = try aes_gcm.decrypt128(
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
//! - **NEVER reuse nonces** with the same key - this is catastrophic
//! - Uses Zig's audited std.crypto implementation
//! - Constant-time guarantee from underlying primitives
//! - Authentication tag prevents tampering
//! - Rotate keys after 2^32 encryptions (NIST recommendation)
//!
//! ## References
//! - [NIST SP 800-38D](https://csrc.nist.gov/publications/detail/sp/800-38d/final) - GCM specification

const std = @import("std");
const crypto = std.crypto;

/// AES-GCM (Galois/Counter Mode) authenticated encryption
/// Re-exports Zig's standard library AES-GCM implementation
pub const Aes128Gcm = crypto.aead.aes_gcm.Aes128Gcm;
pub const Aes256Gcm = crypto.aead.aes_gcm.Aes256Gcm;

/// Key sizes
pub const AES128_KEY_SIZE = 16;
pub const AES256_KEY_SIZE = 32;
pub const NONCE_SIZE = 12;
pub const TAG_SIZE = 16;

/// Encrypt data with AES-128-GCM
pub fn encrypt128(
    allocator: std.mem.Allocator,
    plaintext: []const u8,
    key: []const u8,
    nonce: []const u8,
    additional_data: []const u8,
) ![]u8 {
    if (key.len != AES128_KEY_SIZE) return error.InvalidKeyLength;
    if (nonce.len != NONCE_SIZE) return error.InvalidNonceLength;

    const ciphertext_len = plaintext.len + TAG_SIZE;
    const result = try allocator.alloc(u8, ciphertext_len);

    const ciphertext = result[0..plaintext.len];
    var tag: [TAG_SIZE]u8 = undefined;

    Aes128Gcm.encrypt(ciphertext, &tag, plaintext, additional_data, nonce[0..NONCE_SIZE].*, key[0..AES128_KEY_SIZE].*);

    @memcpy(result[plaintext.len..], &tag);

    return result;
}

/// Decrypt data with AES-128-GCM
pub fn decrypt128(
    allocator: std.mem.Allocator,
    ciphertext_with_tag: []const u8,
    key: []const u8,
    nonce: []const u8,
    additional_data: []const u8,
) ![]u8 {
    if (key.len != AES128_KEY_SIZE) return error.InvalidKeyLength;
    if (nonce.len != NONCE_SIZE) return error.InvalidNonceLength;
    if (ciphertext_with_tag.len < TAG_SIZE) return error.InvalidCiphertextLength;

    const ciphertext_len = ciphertext_with_tag.len - TAG_SIZE;
    const ciphertext = ciphertext_with_tag[0..ciphertext_len];
    const tag = ciphertext_with_tag[ciphertext_len..][0..TAG_SIZE];

    const result = try allocator.alloc(u8, ciphertext_len);

    Aes128Gcm.decrypt(result, ciphertext, tag.*, additional_data, nonce[0..NONCE_SIZE].*, key[0..AES128_KEY_SIZE].*) catch {
        allocator.free(result);
        return error.AuthenticationFailed;
    };

    return result;
}

/// Encrypt data with AES-256-GCM
pub fn encrypt256(
    allocator: std.mem.Allocator,
    plaintext: []const u8,
    key: []const u8,
    nonce: []const u8,
    additional_data: []const u8,
) ![]u8 {
    if (key.len != AES256_KEY_SIZE) return error.InvalidKeyLength;
    if (nonce.len != NONCE_SIZE) return error.InvalidNonceLength;

    const ciphertext_len = plaintext.len + TAG_SIZE;
    const result = try allocator.alloc(u8, ciphertext_len);

    const ciphertext = result[0..plaintext.len];
    var tag: [TAG_SIZE]u8 = undefined;

    Aes256Gcm.encrypt(ciphertext, &tag, plaintext, additional_data, nonce[0..NONCE_SIZE].*, key[0..AES256_KEY_SIZE].*);

    @memcpy(result[plaintext.len..], &tag);

    return result;
}

/// Decrypt data with AES-256-GCM
pub fn decrypt256(
    allocator: std.mem.Allocator,
    ciphertext_with_tag: []const u8,
    key: []const u8,
    nonce: []const u8,
    additional_data: []const u8,
) ![]u8 {
    if (key.len != AES256_KEY_SIZE) return error.InvalidKeyLength;
    if (nonce.len != NONCE_SIZE) return error.InvalidNonceLength;
    if (ciphertext_with_tag.len < TAG_SIZE) return error.InvalidCiphertextLength;

    const ciphertext_len = ciphertext_with_tag.len - TAG_SIZE;
    const ciphertext = ciphertext_with_tag[0..ciphertext_len];
    const tag = ciphertext_with_tag[ciphertext_len..][0..TAG_SIZE];

    const result = try allocator.alloc(u8, ciphertext_len);

    Aes256Gcm.decrypt(result, ciphertext, tag.*, additional_data, nonce[0..NONCE_SIZE].*, key[0..AES256_KEY_SIZE].*) catch {
        allocator.free(result);
        return error.AuthenticationFailed;
    };

    return result;
}

test "aes128-gcm basic" {
    const allocator = std.testing.allocator;

    const key = [_]u8{1} ** AES128_KEY_SIZE;
    const nonce = [_]u8{2} ** NONCE_SIZE;
    const plaintext = "Hello, AES-GCM!";
    const additional_data = "metadata";

    // Encrypt
    const ciphertext = try encrypt128(allocator, plaintext, &key, &nonce, additional_data);
    defer allocator.free(ciphertext);

    try std.testing.expect(ciphertext.len == plaintext.len + TAG_SIZE);

    // Decrypt
    const decrypted = try decrypt128(allocator, ciphertext, &key, &nonce, additional_data);
    defer allocator.free(decrypted);

    try std.testing.expectEqualSlices(u8, plaintext, decrypted);
}

test "aes256-gcm basic" {
    const allocator = std.testing.allocator;

    const key = [_]u8{1} ** AES256_KEY_SIZE;
    const nonce = [_]u8{2} ** NONCE_SIZE;
    const plaintext = "Hello, AES-256-GCM!";
    const additional_data = "";

    // Encrypt
    const ciphertext = try encrypt256(allocator, plaintext, &key, &nonce, additional_data);
    defer allocator.free(ciphertext);

    try std.testing.expect(ciphertext.len == plaintext.len + TAG_SIZE);

    // Decrypt
    const decrypted = try decrypt256(allocator, ciphertext, &key, &nonce, additional_data);
    defer allocator.free(decrypted);

    try std.testing.expectEqualSlices(u8, plaintext, decrypted);
}

test "aes-gcm wrong key fails" {
    const allocator = std.testing.allocator;

    const key = [_]u8{1} ** AES128_KEY_SIZE;
    const wrong_key = [_]u8{2} ** AES128_KEY_SIZE;
    const nonce = [_]u8{3} ** NONCE_SIZE;
    const plaintext = "test";
    const additional_data = "";

    const ciphertext = try encrypt128(allocator, plaintext, &key, &nonce, additional_data);
    defer allocator.free(ciphertext);

    const result = decrypt128(allocator, ciphertext, &wrong_key, &nonce, additional_data);
    try std.testing.expectError(error.AuthenticationFailed, result);
}

test "aes128-gcm empty plaintext" {
    const allocator = std.testing.allocator;

    const key = [_]u8{1} ** AES128_KEY_SIZE;
    const nonce = [_]u8{2} ** NONCE_SIZE;
    const plaintext = "";
    const additional_data = "";

    const ciphertext = try encrypt128(allocator, plaintext, &key, &nonce, additional_data);
    defer allocator.free(ciphertext);

    try std.testing.expect(ciphertext.len == TAG_SIZE);

    const decrypted = try decrypt128(allocator, ciphertext, &key, &nonce, additional_data);
    defer allocator.free(decrypted);

    try std.testing.expectEqualSlices(u8, plaintext, decrypted);
}

test "aes256-gcm empty plaintext" {
    const allocator = std.testing.allocator;

    const key = [_]u8{1} ** AES256_KEY_SIZE;
    const nonce = [_]u8{2} ** NONCE_SIZE;
    const plaintext = "";
    const additional_data = "";

    const ciphertext = try encrypt256(allocator, plaintext, &key, &nonce, additional_data);
    defer allocator.free(ciphertext);

    try std.testing.expect(ciphertext.len == TAG_SIZE);

    const decrypted = try decrypt256(allocator, ciphertext, &key, &nonce, additional_data);
    defer allocator.free(decrypted);

    try std.testing.expectEqualSlices(u8, plaintext, decrypted);
}

test "aes128-gcm wrong nonce fails" {
    const allocator = std.testing.allocator;

    const key = [_]u8{1} ** AES128_KEY_SIZE;
    const nonce = [_]u8{2} ** NONCE_SIZE;
    const wrong_nonce = [_]u8{3} ** NONCE_SIZE;
    const plaintext = "test";
    const additional_data = "";

    const ciphertext = try encrypt128(allocator, plaintext, &key, &nonce, additional_data);
    defer allocator.free(ciphertext);

    const result = decrypt128(allocator, ciphertext, &key, &wrong_nonce, additional_data);
    try std.testing.expectError(error.AuthenticationFailed, result);
}

test "aes256-gcm wrong nonce fails" {
    const allocator = std.testing.allocator;

    const key = [_]u8{1} ** AES256_KEY_SIZE;
    const nonce = [_]u8{2} ** NONCE_SIZE;
    const wrong_nonce = [_]u8{3} ** NONCE_SIZE;
    const plaintext = "test";
    const additional_data = "";

    const ciphertext = try encrypt256(allocator, plaintext, &key, &nonce, additional_data);
    defer allocator.free(ciphertext);

    const result = decrypt256(allocator, ciphertext, &key, &wrong_nonce, additional_data);
    try std.testing.expectError(error.AuthenticationFailed, result);
}

test "aes128-gcm modified ciphertext fails" {
    const allocator = std.testing.allocator;

    const key = [_]u8{1} ** AES128_KEY_SIZE;
    const nonce = [_]u8{2} ** NONCE_SIZE;
    const plaintext = "test message";
    const additional_data = "";

    const ciphertext = try encrypt128(allocator, plaintext, &key, &nonce, additional_data);
    defer allocator.free(ciphertext);

    var modified = try allocator.alloc(u8, ciphertext.len);
    defer allocator.free(modified);
    @memcpy(modified, ciphertext);
    modified[0] ^= 1;

    const result = decrypt128(allocator, modified, &key, &nonce, additional_data);
    try std.testing.expectError(error.AuthenticationFailed, result);
}

test "aes256-gcm modified tag fails" {
    const allocator = std.testing.allocator;

    const key = [_]u8{1} ** AES256_KEY_SIZE;
    const nonce = [_]u8{2} ** NONCE_SIZE;
    const plaintext = "test message";
    const additional_data = "";

    const ciphertext = try encrypt256(allocator, plaintext, &key, &nonce, additional_data);
    defer allocator.free(ciphertext);

    var modified = try allocator.alloc(u8, ciphertext.len);
    defer allocator.free(modified);
    @memcpy(modified, ciphertext);
    modified[ciphertext.len - 1] ^= 1;

    const result = decrypt256(allocator, modified, &key, &nonce, additional_data);
    try std.testing.expectError(error.AuthenticationFailed, result);
}

test "aes128-gcm wrong aad fails" {
    const allocator = std.testing.allocator;

    const key = [_]u8{1} ** AES128_KEY_SIZE;
    const nonce = [_]u8{2} ** NONCE_SIZE;
    const plaintext = "test";
    const aad1 = "metadata1";
    const aad2 = "metadata2";

    const ciphertext = try encrypt128(allocator, plaintext, &key, &nonce, aad1);
    defer allocator.free(ciphertext);

    const result = decrypt128(allocator, ciphertext, &key, &nonce, aad2);
    try std.testing.expectError(error.AuthenticationFailed, result);
}

test "aes256-gcm large plaintext" {
    const allocator = std.testing.allocator;

    const key = [_]u8{1} ** AES256_KEY_SIZE;
    const nonce = [_]u8{2} ** NONCE_SIZE;
    const additional_data = "";

    const plaintext = try allocator.alloc(u8, 10000);
    defer allocator.free(plaintext);
    @memset(plaintext, 0xAB);

    const ciphertext = try encrypt256(allocator, plaintext, &key, &nonce, additional_data);
    defer allocator.free(ciphertext);

    try std.testing.expect(ciphertext.len == plaintext.len + TAG_SIZE);

    const decrypted = try decrypt256(allocator, ciphertext, &key, &nonce, additional_data);
    defer allocator.free(decrypted);

    try std.testing.expectEqualSlices(u8, plaintext, decrypted);
}

test "aes128-gcm invalid key length" {
    const allocator = std.testing.allocator;

    const wrong_key = [_]u8{1} ** 15;
    const nonce = [_]u8{2} ** NONCE_SIZE;
    const plaintext = "test";
    const additional_data = "";

    const result = encrypt128(allocator, plaintext, &wrong_key, &nonce, additional_data);
    try std.testing.expectError(error.InvalidKeyLength, result);
}

test "aes256-gcm invalid key length" {
    const allocator = std.testing.allocator;

    const wrong_key = [_]u8{1} ** 31;
    const nonce = [_]u8{2} ** NONCE_SIZE;
    const plaintext = "test";
    const additional_data = "";

    const result = encrypt256(allocator, plaintext, &wrong_key, &nonce, additional_data);
    try std.testing.expectError(error.InvalidKeyLength, result);
}

test "aes128-gcm invalid nonce length" {
    const allocator = std.testing.allocator;

    const key = [_]u8{1} ** AES128_KEY_SIZE;
    const wrong_nonce = [_]u8{2} ** 11;
    const plaintext = "test";
    const additional_data = "";

    const result = encrypt128(allocator, plaintext, &key, &wrong_nonce, additional_data);
    try std.testing.expectError(error.InvalidNonceLength, result);
}

test "aes256-gcm invalid nonce length" {
    const allocator = std.testing.allocator;

    const key = [_]u8{1} ** AES256_KEY_SIZE;
    const wrong_nonce = [_]u8{2} ** 13;
    const plaintext = "test";
    const additional_data = "";

    const result = encrypt256(allocator, plaintext, &key, &wrong_nonce, additional_data);
    try std.testing.expectError(error.InvalidNonceLength, result);
}

test "aes128-gcm ciphertext too short" {
    const allocator = std.testing.allocator;

    const key = [_]u8{1} ** AES128_KEY_SIZE;
    const nonce = [_]u8{2} ** NONCE_SIZE;
    const too_short = [_]u8{0} ** 15;
    const additional_data = "";

    const result = decrypt128(allocator, &too_short, &key, &nonce, additional_data);
    try std.testing.expectError(error.InvalidCiphertextLength, result);
}

test "aes256-gcm ciphertext too short" {
    const allocator = std.testing.allocator;

    const key = [_]u8{1} ** AES256_KEY_SIZE;
    const nonce = [_]u8{2} ** NONCE_SIZE;
    const too_short = [_]u8{0} ** 10;
    const additional_data = "";

    const result = decrypt256(allocator, &too_short, &key, &nonce, additional_data);
    try std.testing.expectError(error.InvalidCiphertextLength, result);
}

test "aes128-gcm all-zero key" {
    const allocator = std.testing.allocator;

    const key = [_]u8{0} ** AES128_KEY_SIZE;
    const nonce = [_]u8{0} ** NONCE_SIZE;
    const plaintext = "test";
    const additional_data = "";

    const ciphertext = try encrypt128(allocator, plaintext, &key, &nonce, additional_data);
    defer allocator.free(ciphertext);

    const decrypted = try decrypt128(allocator, ciphertext, &key, &nonce, additional_data);
    defer allocator.free(decrypted);

    try std.testing.expectEqualSlices(u8, plaintext, decrypted);
}

test "aes256-gcm all-ones key" {
    const allocator = std.testing.allocator;

    const key = [_]u8{0xFF} ** AES256_KEY_SIZE;
    const nonce = [_]u8{0xFF} ** NONCE_SIZE;
    const plaintext = "test";
    const additional_data = "";

    const ciphertext = try encrypt256(allocator, plaintext, &key, &nonce, additional_data);
    defer allocator.free(ciphertext);

    const decrypted = try decrypt256(allocator, ciphertext, &key, &nonce, additional_data);
    defer allocator.free(decrypted);

    try std.testing.expectEqualSlices(u8, plaintext, decrypted);
}

test "aes128-gcm deterministic encryption" {
    const allocator = std.testing.allocator;

    const key = [_]u8{1} ** AES128_KEY_SIZE;
    const nonce = [_]u8{2} ** NONCE_SIZE;
    const plaintext = "test";
    const additional_data = "";

    const ciphertext1 = try encrypt128(allocator, plaintext, &key, &nonce, additional_data);
    defer allocator.free(ciphertext1);

    const ciphertext2 = try encrypt128(allocator, plaintext, &key, &nonce, additional_data);
    defer allocator.free(ciphertext2);

    try std.testing.expectEqualSlices(u8, ciphertext1, ciphertext2);
}

test "aes256-gcm different nonces produce different ciphertext" {
    const allocator = std.testing.allocator;

    const key = [_]u8{1} ** AES256_KEY_SIZE;
    const nonce1 = [_]u8{2} ** NONCE_SIZE;
    const nonce2 = [_]u8{3} ** NONCE_SIZE;
    const plaintext = "test";
    const additional_data = "";

    const ciphertext1 = try encrypt256(allocator, plaintext, &key, &nonce1, additional_data);
    defer allocator.free(ciphertext1);

    const ciphertext2 = try encrypt256(allocator, plaintext, &key, &nonce2, additional_data);
    defer allocator.free(ciphertext2);

    const equal = std.mem.eql(u8, ciphertext1, ciphertext2);
    try std.testing.expect(!equal);
}

// SECURITY DOCUMENTATION TEST: Nonce reuse vulnerability
//
// This test documents the CATASTROPHIC security failure that occurs
// when nonces are reused with the same key in AES-GCM.
//
// When nonces are reused, an attacker can:
// 1. XOR ciphertexts to get XOR of plaintexts: ct1 ⊕ ct2 = pt1 ⊕ pt2
// 2. Recover the authentication key H
// 3. Forge arbitrary valid ciphertexts
//
// NEVER reuse nonces. Always generate fresh random nonces for each encryption.
test "SECURITY: nonce reuse allows XOR of plaintexts to be recovered" {
    const allocator = std.testing.allocator;

    const key = [_]u8{1} ** AES128_KEY_SIZE;
    const reused_nonce = [_]u8{42} ** NONCE_SIZE; // BAD: reused nonce

    const plaintext1 = "Secret message A";
    const plaintext2 = "Secret message B";
    const additional_data = "";

    const ciphertext1 = try encrypt128(allocator, plaintext1, &key, &reused_nonce, additional_data);
    defer allocator.free(ciphertext1);

    const ciphertext2 = try encrypt128(allocator, plaintext2, &key, &reused_nonce, additional_data);
    defer allocator.free(ciphertext2);

    // XOR the ciphertext bodies (excluding the 16-byte auth tag)
    const ct1_body = ciphertext1[0 .. ciphertext1.len - TAG_SIZE];
    const ct2_body = ciphertext2[0 .. ciphertext2.len - TAG_SIZE];

    var xor_result: [plaintext1.len]u8 = undefined;
    for (0..plaintext1.len) |i| {
        xor_result[i] = ct1_body[i] ^ ct2_body[i];
    }

    // XOR of plaintexts
    var pt_xor: [plaintext1.len]u8 = undefined;
    for (0..plaintext1.len) |i| {
        pt_xor[i] = plaintext1[i] ^ plaintext2[i];
    }

    // With nonce reuse, XOR of ciphertexts equals XOR of plaintexts
    // This is a COMPLETE SECURITY FAILURE - attackers can recover plaintext
    try std.testing.expectEqualSlices(u8, &pt_xor, &xor_result);
}

test "aes128-gcm NIST vector: all zeros" {
    const allocator = std.testing.allocator;

    const key = [_]u8{0} ** AES128_KEY_SIZE;
    const nonce = [_]u8{0} ** NONCE_SIZE;
    const plaintext = "";
    const additional_data = "";

    const ciphertext = try encrypt128(allocator, plaintext, &key, &nonce, additional_data);
    defer allocator.free(ciphertext);

    const expected_tag = [_]u8{ 0x58, 0xe2, 0xfc, 0xce, 0xfa, 0x7e, 0x30, 0x61, 0x36, 0x7f, 0x1d, 0x57, 0xa4, 0xe7, 0x45, 0x5a };
    try std.testing.expectEqualSlices(u8, &expected_tag, ciphertext);
}

test "aes256-gcm NIST vector: all zeros" {
    const allocator = std.testing.allocator;

    const key = [_]u8{0} ** AES256_KEY_SIZE;
    const nonce = [_]u8{0} ** NONCE_SIZE;
    const plaintext = "";
    const additional_data = "";

    const ciphertext = try encrypt256(allocator, plaintext, &key, &nonce, additional_data);
    defer allocator.free(ciphertext);

    const expected_tag = [_]u8{ 0x53, 0x0f, 0x8a, 0xfb, 0xc7, 0x45, 0x36, 0xb9, 0xa9, 0x63, 0xb4, 0xf1, 0xc4, 0xcb, 0x73, 0x8b };
    try std.testing.expectEqualSlices(u8, &expected_tag, ciphertext);
}
