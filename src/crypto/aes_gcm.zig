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
