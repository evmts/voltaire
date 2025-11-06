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
