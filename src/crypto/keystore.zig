//! Keystore - Web3 Secret Storage Definition (v3)
//!
//! Implements the Web3 Secret Storage Definition (v3) for encrypted private key storage.
//! Supports both scrypt and PBKDF2 key derivation functions.
//!
//! ## Overview
//! The Web3 Secret Storage format provides a standardized way to encrypt private keys
//! using password-based encryption. The format includes:
//! - AES-128-CTR for symmetric encryption
//! - Keccak256 for MAC computation
//! - Either scrypt or PBKDF2-HMAC-SHA256 for key derivation
//!
//! ## Features
//! - Encrypt private keys with password protection
//! - Decrypt keystores to recover private keys
//! - Support for custom KDF parameters
//! - Constant-time MAC verification
//!
//! ## Usage
//! ```zig
//! const keystore = @import("keystore");
//!
//! // Encrypt a private key
//! var encrypted = keystore.encrypt(allocator, private_key, "password", .{}) catch |err| {
//!     // handle error
//! };
//! defer encrypted.deinit(allocator);
//!
//! // Decrypt a keystore
//! const decrypted = try keystore.decrypt(allocator, encrypted, "password");
//! ```
//!
//! ## Security Notes
//! - Uses constant-time comparison for MAC verification to prevent timing attacks
//! - Default scrypt parameters (N=262144, r=8, p=1) provide strong security
//! - Salt and IV should be randomly generated for each encryption
//!
//! ## References
//! - [Web3 Secret Storage Definition](https://github.com/ethereum/wiki/wiki/Web3-Secret-Storage-Definition)

const std = @import("std");
const crypto = std.crypto;
const mem = std.mem;
const Allocator = mem.Allocator;

// Import crypto primitives
const Keccak256 = crypto.hash.sha3.Keccak256;
const Aes128 = crypto.core.aes.Aes128;
const AesEncryptCtx = crypto.core.aes.AesEncryptCtx;
const ctr = crypto.core.modes.ctr;
const scrypt = crypto.pwhash.scrypt;
const pbkdf2 = crypto.pwhash.pbkdf2;
const HmacSha256 = crypto.auth.hmac.sha2.HmacSha256;

/// Key derivation function type
pub const Kdf = enum {
    scrypt,
    pbkdf2,
};

/// Scrypt KDF parameters
pub const ScryptParams = struct {
    /// Derived key length (always 32)
    dklen: u8 = 32,
    /// CPU/memory cost (N = 2^ln)
    n: u32 = 262144,
    /// Parallelization
    p: u8 = 1,
    /// Block size
    r: u8 = 8,
    /// Salt (32 bytes)
    salt: [32]u8,
};

/// PBKDF2 KDF parameters
pub const Pbkdf2Params = struct {
    /// Iteration count
    c: u32 = 262144,
    /// Derived key length (always 32)
    dklen: u8 = 32,
    /// PRF (always hmac-sha256)
    prf: []const u8 = "hmac-sha256",
    /// Salt (32 bytes)
    salt: [32]u8,
};

/// Cipher parameters
pub const CipherParams = struct {
    /// Initialization vector (16 bytes)
    iv: [16]u8,
};

/// KDF parameters union type
pub const KdfParamsUnion = union {
    scrypt: ScryptParams,
    pbkdf2: Pbkdf2Params,
};

/// Crypto section of keystore
pub const CryptoSection = struct {
    /// Cipher type (always aes-128-ctr)
    cipher: []const u8 = "aes-128-ctr",
    /// Encrypted private key (32 bytes)
    ciphertext: [32]u8,
    /// Cipher parameters (IV)
    cipherparams: CipherParams,
    /// Key derivation function
    kdf: Kdf,
    /// KDF parameters (union based on kdf type)
    kdfparams: KdfParamsUnion,
    /// MAC for verification (32 bytes)
    mac: [32]u8,
};

/// Web3 Secret Storage v3 keystore
pub const KeystoreV3 = struct {
    /// Version (always 3)
    version: u8 = 3,
    /// Unique identifier (UUID)
    id: [36]u8,
    /// Optional address
    address: ?[40]u8 = null,
    /// Crypto section
    crypto_section: CryptoSection,

    pub fn deinit(self: *KeystoreV3, allocator: Allocator) void {
        _ = allocator;
        // Clear sensitive data
        @memset(&self.crypto_section.ciphertext, 0);
        @memset(&self.crypto_section.mac, 0);
        switch (self.crypto_section.kdf) {
            .scrypt => @memset(&self.crypto_section.kdfparams.scrypt.salt, 0),
            .pbkdf2 => @memset(&self.crypto_section.kdfparams.pbkdf2.salt, 0),
        }
        @memset(&self.crypto_section.cipherparams.iv, 0);
    }
};

/// Encryption options
pub const EncryptOptions = struct {
    /// KDF to use (default: scrypt)
    kdf: Kdf = .scrypt,
    /// Custom UUID (null = auto-generated)
    uuid: ?[36]u8 = null,
    /// Custom IV (null = random)
    iv: ?[16]u8 = null,
    /// Custom salt (null = random)
    salt: ?[32]u8 = null,
    /// Scrypt N parameter (default: 262144)
    scrypt_n: u32 = 262144,
    /// Scrypt r parameter (default: 8)
    scrypt_r: u8 = 8,
    /// Scrypt p parameter (default: 1)
    scrypt_p: u8 = 1,
    /// PBKDF2 iterations (default: 262144)
    pbkdf2_c: u32 = 262144,
};

/// Error types
pub const KeystoreError = error{
    InvalidVersion,
    UnsupportedKdf,
    InvalidMac,
    InvalidParams,
    OutOfMemory,
    WeakParameters,
    OutputTooLong,
    ThreadQuotaExceeded,
    SpawnFailed,
};

/// Encrypt a private key to Web3 Secret Storage v3 keystore
///
/// Takes a 32-byte private key and password, returns an encrypted keystore.
/// The keystore can be serialized to JSON for storage.
pub fn encrypt(
    allocator: Allocator,
    private_key: [32]u8,
    password: []const u8,
    options: EncryptOptions,
) KeystoreError!KeystoreV3 {
    // Generate or use provided random values
    var salt: [32]u8 = undefined;
    var iv: [16]u8 = undefined;
    var uuid: [36]u8 = undefined;

    if (options.salt) |s| {
        salt = s;
    } else {
        crypto.random.bytes(&salt);
    }

    if (options.iv) |i| {
        iv = i;
    } else {
        crypto.random.bytes(&iv);
    }

    if (options.uuid) |u| {
        uuid = u;
    } else {
        generateUuid(&uuid);
    }

    // Derive key from password using selected KDF
    var derived_key: [32]u8 = undefined;
    defer @memset(&derived_key, 0);

    switch (options.kdf) {
        .scrypt => {
            const ln = computeLogN(options.scrypt_n) orelse return KeystoreError.InvalidParams;
            const params = scrypt.Params{
                .ln = ln,
                .r = @intCast(options.scrypt_r),
                .p = @intCast(options.scrypt_p),
            };
            scrypt.kdf(allocator, &derived_key, password, &salt, params) catch |err| {
                return switch (err) {
                    error.OutOfMemory => KeystoreError.OutOfMemory,
                    error.WeakParameters => KeystoreError.WeakParameters,
                    error.OutputTooLong => KeystoreError.OutputTooLong,
                    error.ThreadQuotaExceeded => KeystoreError.ThreadQuotaExceeded,
                    else => KeystoreError.InvalidParams,
                };
            };
        },
        .pbkdf2 => {
            pbkdf2(&derived_key, password, &salt, options.pbkdf2_c, HmacSha256) catch |err| {
                return switch (err) {
                    error.WeakParameters => KeystoreError.WeakParameters,
                    error.OutputTooLong => KeystoreError.OutputTooLong,
                };
            };
        },
    }

    // Split derived key: first 16 bytes for encryption, next 16 for MAC
    const encryption_key: [16]u8 = derived_key[0..16].*;
    const mac_key: [16]u8 = derived_key[16..32].*;
    defer {
        // Clear sensitive keys
        var enc_clear: [16]u8 = encryption_key;
        var mac_clear: [16]u8 = mac_key;
        @memset(&enc_clear, 0);
        @memset(&mac_clear, 0);
    }

    // Encrypt private key with AES-128-CTR
    var ciphertext: [32]u8 = undefined;
    aes128CtrEncrypt(&ciphertext, &private_key, &encryption_key, &iv);

    // Compute MAC = keccak256(macKey || ciphertext)
    var mac_input: [48]u8 = undefined;
    @memcpy(mac_input[0..16], &mac_key);
    @memcpy(mac_input[16..48], &ciphertext);
    var mac: [32]u8 = undefined;
    Keccak256.hash(&mac_input, &mac, .{});

    // Build keystore
    return KeystoreV3{
        .version = 3,
        .id = uuid,
        .address = null,
        .crypto_section = CryptoSection{
            .cipher = "aes-128-ctr",
            .ciphertext = ciphertext,
            .cipherparams = CipherParams{ .iv = iv },
            .kdf = options.kdf,
            .kdfparams = switch (options.kdf) {
                .scrypt => .{ .scrypt = ScryptParams{
                    .dklen = 32,
                    .n = options.scrypt_n,
                    .r = options.scrypt_r,
                    .p = options.scrypt_p,
                    .salt = salt,
                } },
                .pbkdf2 => .{ .pbkdf2 = Pbkdf2Params{
                    .c = options.pbkdf2_c,
                    .dklen = 32,
                    .prf = "hmac-sha256",
                    .salt = salt,
                } },
            },
            .mac = mac,
        },
    };
}

/// Decrypt Web3 Secret Storage v3 keystore to private key
///
/// Takes an encrypted keystore and password, returns the decrypted private key.
/// Returns error.InvalidMac if the password is wrong or data is corrupted.
pub fn decrypt(
    allocator: Allocator,
    keystore: KeystoreV3,
    password: []const u8,
) KeystoreError![32]u8 {
    // Validate version
    if (keystore.version != 3) {
        return KeystoreError.InvalidVersion;
    }

    const crypto_section = keystore.crypto_section;

    // Get salt from KDF params
    const salt: [32]u8 = switch (crypto_section.kdf) {
        .scrypt => crypto_section.kdfparams.scrypt.salt,
        .pbkdf2 => crypto_section.kdfparams.pbkdf2.salt,
    };

    // Derive key from password
    var derived_key: [32]u8 = undefined;
    defer @memset(&derived_key, 0);

    switch (crypto_section.kdf) {
        .scrypt => {
            const params_scrypt = crypto_section.kdfparams.scrypt;
            const ln = computeLogN(params_scrypt.n) orelse return KeystoreError.InvalidParams;
            const params = scrypt.Params{
                .ln = ln,
                .r = @intCast(params_scrypt.r),
                .p = @intCast(params_scrypt.p),
            };
            scrypt.kdf(allocator, &derived_key, password, &salt, params) catch |err| {
                return switch (err) {
                    error.OutOfMemory => KeystoreError.OutOfMemory,
                    error.WeakParameters => KeystoreError.WeakParameters,
                    error.OutputTooLong => KeystoreError.OutputTooLong,
                    error.ThreadQuotaExceeded => KeystoreError.ThreadQuotaExceeded,
                    else => KeystoreError.InvalidParams,
                };
            };
        },
        .pbkdf2 => {
            const params_pbkdf2 = crypto_section.kdfparams.pbkdf2;
            pbkdf2(&derived_key, password, &salt, params_pbkdf2.c, HmacSha256) catch |err| {
                return switch (err) {
                    error.WeakParameters => KeystoreError.WeakParameters,
                    error.OutputTooLong => KeystoreError.OutputTooLong,
                };
            };
        },
    }

    // Split derived key
    const encryption_key: [16]u8 = derived_key[0..16].*;
    const mac_key: [16]u8 = derived_key[16..32].*;

    // Verify MAC
    var mac_input: [48]u8 = undefined;
    @memcpy(mac_input[0..16], &mac_key);
    @memcpy(mac_input[16..48], &crypto_section.ciphertext);
    var computed_mac: [32]u8 = undefined;
    Keccak256.hash(&mac_input, &computed_mac, .{});

    if (!constantTimeEqual(&computed_mac, &crypto_section.mac)) {
        return KeystoreError.InvalidMac;
    }

    // Decrypt private key with AES-128-CTR
    var private_key: [32]u8 = undefined;
    aes128CtrEncrypt(&private_key, &crypto_section.ciphertext, &encryption_key, &crypto_section.cipherparams.iv);

    return private_key;
}

/// AES-128-CTR encryption/decryption
/// CTR mode uses the same operation for both encryption and decryption
fn aes128CtrEncrypt(dst: *[32]u8, src: *const [32]u8, key: *const [16]u8, iv: *const [16]u8) void {
    const ctx = Aes128.initEnc(key.*);
    ctr(AesEncryptCtx(Aes128), ctx, dst, src, iv.*, .big);
}

/// Constant-time comparison to prevent timing attacks
fn constantTimeEqual(a: *const [32]u8, b: *const [32]u8) bool {
    var result: u8 = 0;
    for (a, b) |x, y| {
        result |= x ^ y;
    }
    return result == 0;
}

/// Compute log2(n) for scrypt N parameter
fn computeLogN(n: u32) ?u6 {
    if (n == 0 or (n & (n - 1)) != 0) return null; // Must be power of 2
    var result: u6 = 0;
    var val = n;
    while (val > 1) : (val >>= 1) {
        result += 1;
    }
    return result;
}

/// Generate a UUID v4
fn generateUuid(out: *[36]u8) void {
    var random_bytes: [16]u8 = undefined;
    crypto.random.bytes(&random_bytes);

    // Set version (4) and variant bits
    random_bytes[6] = (random_bytes[6] & 0x0f) | 0x40;
    random_bytes[8] = (random_bytes[8] & 0x3f) | 0x80;

    // Format as UUID string: 8-4-4-4-12
    const hex_chars = "0123456789abcdef";
    var i: usize = 0;
    var out_idx: usize = 0;

    while (i < 16) : (i += 1) {
        if (i == 4 or i == 6 or i == 8 or i == 10) {
            out[out_idx] = '-';
            out_idx += 1;
        }
        out[out_idx] = hex_chars[random_bytes[i] >> 4];
        out_idx += 1;
        out[out_idx] = hex_chars[random_bytes[i] & 0x0f];
        out_idx += 1;
    }
}

/// Convert bytes to hex string (without 0x prefix)
pub fn bytesToHex(comptime len: usize, bytes: *const [len]u8) [len * 2]u8 {
    return std.fmt.bytesToHex(bytes, .lower);
}

/// Convert hex string to bytes
pub fn hexToBytes(comptime len: usize, hex: *const [len * 2]u8) ![len]u8 {
    var result: [len]u8 = undefined;
    _ = std.fmt.hexToBytes(&result, hex) catch return error.InvalidHexString;
    return result;
}

// ============================================================================
// JSON Serialization (Web3 Secret Storage Definition format)
// ============================================================================

/// Web3 Secret Storage JSON structure for std.json parsing
pub const KeystoreJson = struct {
    version: u8,
    id: []const u8,
    address: ?[]const u8 = null,
    crypto: CryptoJson,

    pub const CryptoJson = struct {
        cipher: []const u8,
        ciphertext: []const u8,
        cipherparams: CipherParamsJson,
        kdf: []const u8,
        kdfparams: std.json.Value,
        mac: []const u8,

        pub const CipherParamsJson = struct {
            iv: []const u8,
        };
    };
};

/// Serialize keystore to JSON string (Web3 Secret Storage format)
/// Caller owns returned memory and must free with allocator.free()
pub fn toJson(allocator: Allocator, keystore: KeystoreV3) ![]u8 {
    var output = std.ArrayList(u8){};
    errdefer output.deinit(allocator);

    const writer = output.writer(allocator);

    try writer.writeAll("{");
    try writer.writeAll("\"version\":");
    try writer.print("{d}", .{keystore.version});
    try writer.writeAll(",\"id\":\"");
    try writer.writeAll(&keystore.id);
    try writer.writeAll("\"");

    if (keystore.address) |addr| {
        try writer.writeAll(",\"address\":\"");
        try writer.writeAll(&addr);
        try writer.writeAll("\"");
    }

    try writer.writeAll(",\"crypto\":{");
    try writer.writeAll("\"cipher\":\"aes-128-ctr\"");
    try writer.writeAll(",\"ciphertext\":\"");
    const ciphertext_hex = bytesToHex(32, &keystore.crypto_section.ciphertext);
    try writer.writeAll(&ciphertext_hex);
    try writer.writeAll("\"");
    try writer.writeAll(",\"cipherparams\":{\"iv\":\"");
    const iv_hex = bytesToHex(16, &keystore.crypto_section.cipherparams.iv);
    try writer.writeAll(&iv_hex);
    try writer.writeAll("\"}");
    try writer.writeAll(",\"kdf\":\"");
    try writer.writeAll(if (keystore.crypto_section.kdf == .scrypt) "scrypt" else "pbkdf2");
    try writer.writeAll("\"");
    try writer.writeAll(",\"kdfparams\":{");

    switch (keystore.crypto_section.kdf) {
        .scrypt => {
            const p = keystore.crypto_section.kdfparams.scrypt;
            try writer.print("\"dklen\":{d},\"n\":{d},\"p\":{d},\"r\":{d},\"salt\":\"", .{
                p.dklen, p.n, p.p, p.r,
            });
            const salt_hex = bytesToHex(32, &p.salt);
            try writer.writeAll(&salt_hex);
            try writer.writeAll("\"");
        },
        .pbkdf2 => {
            const p = keystore.crypto_section.kdfparams.pbkdf2;
            try writer.print("\"c\":{d},\"dklen\":{d},\"prf\":\"hmac-sha256\",\"salt\":\"", .{
                p.c, p.dklen,
            });
            const salt_hex = bytesToHex(32, &p.salt);
            try writer.writeAll(&salt_hex);
            try writer.writeAll("\"");
        },
    }

    try writer.writeAll("}");
    try writer.writeAll(",\"mac\":\"");
    const mac_hex = bytesToHex(32, &keystore.crypto_section.mac);
    try writer.writeAll(&mac_hex);
    try writer.writeAll("\"");
    try writer.writeAll("}}");

    return output.toOwnedSlice(allocator);
}

/// Parse JSON string to keystore
/// Returns error if JSON is invalid or missing required fields
pub fn fromJson(allocator: Allocator, json_str: []const u8) !KeystoreV3 {
    const parsed = std.json.parseFromSlice(KeystoreJson, allocator, json_str, .{
        .ignore_unknown_fields = true,
    }) catch return error.InvalidJson;
    defer parsed.deinit();

    const json = parsed.value;

    // Validate version
    if (json.version != 3) {
        return KeystoreError.InvalidVersion;
    }

    // Parse UUID (must be 36 chars)
    if (json.id.len != 36) {
        return error.InvalidUuid;
    }
    var uuid: [36]u8 = undefined;
    @memcpy(&uuid, json.id);

    // Parse ciphertext (must be 64 hex chars = 32 bytes)
    if (json.crypto.ciphertext.len != 64) {
        return error.InvalidCiphertext;
    }
    const ciphertext = hexToBytes(32, json.crypto.ciphertext[0..64]) catch return error.InvalidCiphertext;

    // Parse IV (must be 32 hex chars = 16 bytes)
    if (json.crypto.cipherparams.iv.len != 32) {
        return error.InvalidIv;
    }
    const iv = hexToBytes(16, json.crypto.cipherparams.iv[0..32]) catch return error.InvalidIv;

    // Parse MAC (must be 64 hex chars = 32 bytes)
    if (json.crypto.mac.len != 64) {
        return error.InvalidMac;
    }
    const mac = hexToBytes(32, json.crypto.mac[0..64]) catch return error.InvalidMac;

    // Parse KDF type
    const kdf: Kdf = if (mem.eql(u8, json.crypto.kdf, "scrypt"))
        .scrypt
    else if (mem.eql(u8, json.crypto.kdf, "pbkdf2"))
        .pbkdf2
    else
        return KeystoreError.UnsupportedKdf;

    // Parse KDF params
    const kdfparams = switch (kdf) {
        .scrypt => blk: {
            const obj = json.crypto.kdfparams.object;
            const salt_str = obj.get("salt").?.string;
            if (salt_str.len != 64) return error.InvalidSalt;
            const salt = hexToBytes(32, salt_str[0..64]) catch return error.InvalidSalt;

            const n = @as(u32, @intCast(obj.get("n").?.integer));
            const r = @as(u8, @intCast(obj.get("r").?.integer));
            const p = @as(u8, @intCast(obj.get("p").?.integer));
            const dklen = @as(u8, @intCast(obj.get("dklen").?.integer));

            break :blk KdfParamsUnion{ .scrypt = ScryptParams{
                .dklen = dklen,
                .n = n,
                .r = r,
                .p = p,
                .salt = salt,
            } };
        },
        .pbkdf2 => blk: {
            const obj = json.crypto.kdfparams.object;
            const salt_str = obj.get("salt").?.string;
            if (salt_str.len != 64) return error.InvalidSalt;
            const salt = hexToBytes(32, salt_str[0..64]) catch return error.InvalidSalt;

            const c = @as(u32, @intCast(obj.get("c").?.integer));
            const dklen = @as(u8, @intCast(obj.get("dklen").?.integer));

            break :blk KdfParamsUnion{ .pbkdf2 = Pbkdf2Params{
                .c = c,
                .dklen = dklen,
                .prf = "hmac-sha256",
                .salt = salt,
            } };
        },
    };

    // Parse optional address
    var address: ?[40]u8 = null;
    if (json.address) |addr| {
        if (addr.len == 40) {
            address = undefined;
            @memcpy(&address.?, addr);
        } else if (addr.len == 42 and addr[0] == '0' and addr[1] == 'x') {
            address = undefined;
            @memcpy(&address.?, addr[2..42]);
        }
    }

    return KeystoreV3{
        .version = 3,
        .id = uuid,
        .address = address,
        .crypto_section = CryptoSection{
            .cipher = "aes-128-ctr",
            .ciphertext = ciphertext,
            .cipherparams = CipherParams{ .iv = iv },
            .kdf = kdf,
            .kdfparams = kdfparams,
            .mac = mac,
        },
    };
}

// ============================================================================
// Tests
// ============================================================================

test "encrypt and decrypt with scrypt" {
    const allocator = std.testing.allocator;

    const private_key = [_]u8{
        0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef,
        0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef,
        0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef,
        0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef,
    };
    const password = "test-password";

    // Use low scrypt parameters for fast tests
    var keystore = try encrypt(allocator, private_key, password, .{
        .scrypt_n = 1024,
        .scrypt_r = 1,
        .scrypt_p = 1,
    });
    defer keystore.deinit(allocator);

    const decrypted = try decrypt(allocator, keystore, password);
    try std.testing.expectEqualSlices(u8, &private_key, &decrypted);
}

test "encrypt and decrypt with pbkdf2" {
    const allocator = std.testing.allocator;

    const private_key = [_]u8{
        0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef,
        0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef,
        0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef,
        0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef,
    };
    const password = "test-password";

    // Use low iteration count for fast tests
    var keystore = try encrypt(allocator, private_key, password, .{
        .kdf = .pbkdf2,
        .pbkdf2_c = 1000,
    });
    defer keystore.deinit(allocator);

    const decrypted = try decrypt(allocator, keystore, password);
    try std.testing.expectEqualSlices(u8, &private_key, &decrypted);
}

test "wrong password returns InvalidMac" {
    const allocator = std.testing.allocator;

    const private_key = [_]u8{0xab} ** 32;

    var keystore = try encrypt(allocator, private_key, "correct-password", .{
        .scrypt_n = 1024,
        .scrypt_r = 1,
        .scrypt_p = 1,
    });
    defer keystore.deinit(allocator);

    const result = decrypt(allocator, keystore, "wrong-password");
    try std.testing.expectError(KeystoreError.InvalidMac, result);
}

test "deterministic with fixed salt and IV" {
    const allocator = std.testing.allocator;

    const private_key = [_]u8{0x01} ** 32;
    const password = "password";
    const salt = [_]u8{0x01} ** 32;
    const iv = [_]u8{0x02} ** 16;
    const uuid = "12345678-1234-1234-1234-123456789abc".*;

    var keystore1 = try encrypt(allocator, private_key, password, .{
        .salt = salt,
        .iv = iv,
        .uuid = uuid,
        .scrypt_n = 1024,
        .scrypt_r = 1,
        .scrypt_p = 1,
    });
    defer keystore1.deinit(allocator);

    var keystore2 = try encrypt(allocator, private_key, password, .{
        .salt = salt,
        .iv = iv,
        .uuid = uuid,
        .scrypt_n = 1024,
        .scrypt_r = 1,
        .scrypt_p = 1,
    });
    defer keystore2.deinit(allocator);

    try std.testing.expectEqualSlices(u8, &keystore1.crypto_section.ciphertext, &keystore2.crypto_section.ciphertext);
    try std.testing.expectEqualSlices(u8, &keystore1.crypto_section.mac, &keystore2.crypto_section.mac);
}

test "different salts produce different ciphertexts" {
    const allocator = std.testing.allocator;

    const private_key = [_]u8{0x01} ** 32;
    const password = "password";
    const salt1 = [_]u8{0x01} ** 32;
    const salt2 = [_]u8{0x02} ** 32;

    var keystore1 = try encrypt(allocator, private_key, password, .{
        .salt = salt1,
        .scrypt_n = 1024,
        .scrypt_r = 1,
        .scrypt_p = 1,
    });
    defer keystore1.deinit(allocator);

    var keystore2 = try encrypt(allocator, private_key, password, .{
        .salt = salt2,
        .scrypt_n = 1024,
        .scrypt_r = 1,
        .scrypt_p = 1,
    });
    defer keystore2.deinit(allocator);

    const equal = std.mem.eql(u8, &keystore1.crypto_section.ciphertext, &keystore2.crypto_section.ciphertext);
    try std.testing.expect(!equal);
}

test "different IVs produce different ciphertexts" {
    const allocator = std.testing.allocator;

    const private_key = [_]u8{0x01} ** 32;
    const password = "password";
    const salt = [_]u8{0x01} ** 32;
    const iv1 = [_]u8{0x01} ** 16;
    const iv2 = [_]u8{0x02} ** 16;

    var keystore1 = try encrypt(allocator, private_key, password, .{
        .salt = salt,
        .iv = iv1,
        .scrypt_n = 1024,
        .scrypt_r = 1,
        .scrypt_p = 1,
    });
    defer keystore1.deinit(allocator);

    var keystore2 = try encrypt(allocator, private_key, password, .{
        .salt = salt,
        .iv = iv2,
        .scrypt_n = 1024,
        .scrypt_r = 1,
        .scrypt_p = 1,
    });
    defer keystore2.deinit(allocator);

    const equal = std.mem.eql(u8, &keystore1.crypto_section.ciphertext, &keystore2.crypto_section.ciphertext);
    try std.testing.expect(!equal);

    // Both should still decrypt correctly
    const decrypted1 = try decrypt(allocator, keystore1, password);
    const decrypted2 = try decrypt(allocator, keystore2, password);
    try std.testing.expectEqualSlices(u8, &private_key, &decrypted1);
    try std.testing.expectEqualSlices(u8, &private_key, &decrypted2);
}

test "empty password" {
    const allocator = std.testing.allocator;

    const private_key = [_]u8{0xab} ** 32;
    const password = "";

    var keystore = try encrypt(allocator, private_key, password, .{
        .scrypt_n = 1024,
        .scrypt_r = 1,
        .scrypt_p = 1,
    });
    defer keystore.deinit(allocator);

    const decrypted = try decrypt(allocator, keystore, password);
    try std.testing.expectEqualSlices(u8, &private_key, &decrypted);
}

test "special characters in password" {
    const allocator = std.testing.allocator;

    const private_key = [_]u8{0xab} ** 32;
    const password = "paesewoerd!@#$%^&*()[]{}|<>?/~`";

    var keystore = try encrypt(allocator, private_key, password, .{
        .scrypt_n = 1024,
        .scrypt_r = 1,
        .scrypt_p = 1,
    });
    defer keystore.deinit(allocator);

    const decrypted = try decrypt(allocator, keystore, password);
    try std.testing.expectEqualSlices(u8, &private_key, &decrypted);
}

test "unicode password" {
    const allocator = std.testing.allocator;

    const private_key = [_]u8{0xab} ** 32;
    const password = "\xc3\xa4\xc3\xb6\xc3\xbc"; // UTF-8 encoded aou with umlauts

    var keystore = try encrypt(allocator, private_key, password, .{
        .scrypt_n = 1024,
        .scrypt_r = 1,
        .scrypt_p = 1,
    });
    defer keystore.deinit(allocator);

    const decrypted = try decrypt(allocator, keystore, password);
    try std.testing.expectEqualSlices(u8, &private_key, &decrypted);
}

test "version must be 3" {
    const allocator = std.testing.allocator;

    const private_key = [_]u8{0xab} ** 32;

    var keystore = try encrypt(allocator, private_key, "password", .{
        .scrypt_n = 1024,
        .scrypt_r = 1,
        .scrypt_p = 1,
    });
    defer keystore.deinit(allocator);

    // Modify version
    keystore.version = 2;

    const result = decrypt(allocator, keystore, "password");
    try std.testing.expectError(KeystoreError.InvalidVersion, result);
}

test "corrupted ciphertext fails MAC verification" {
    const allocator = std.testing.allocator;

    const private_key = [_]u8{0xab} ** 32;

    var keystore = try encrypt(allocator, private_key, "password", .{
        .scrypt_n = 1024,
        .scrypt_r = 1,
        .scrypt_p = 1,
    });
    defer keystore.deinit(allocator);

    // Corrupt ciphertext
    keystore.crypto_section.ciphertext[0] ^= 0xff;

    const result = decrypt(allocator, keystore, "password");
    try std.testing.expectError(KeystoreError.InvalidMac, result);
}

test "corrupted MAC fails verification" {
    const allocator = std.testing.allocator;

    const private_key = [_]u8{0xab} ** 32;

    var keystore = try encrypt(allocator, private_key, "password", .{
        .scrypt_n = 1024,
        .scrypt_r = 1,
        .scrypt_p = 1,
    });
    defer keystore.deinit(allocator);

    // Corrupt MAC
    keystore.crypto_section.mac[31] ^= 0xff;

    const result = decrypt(allocator, keystore, "password");
    try std.testing.expectError(KeystoreError.InvalidMac, result);
}

test "AES-128-CTR is symmetric" {
    var plaintext = [_]u8{ 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08 } ++ [_]u8{0} ** 24;
    const key = [_]u8{0x01} ** 16;
    const iv = [_]u8{0x02} ** 16;

    var ciphertext: [32]u8 = undefined;
    aes128CtrEncrypt(&ciphertext, &plaintext, &key, &iv);

    // Encrypting again with same key/IV should give back original
    var decrypted: [32]u8 = undefined;
    aes128CtrEncrypt(&decrypted, &ciphertext, &key, &iv);

    try std.testing.expectEqualSlices(u8, &plaintext, &decrypted);
}

test "constant time comparison" {
    const a = [_]u8{0x01} ** 32;
    const b = [_]u8{0x01} ** 32;
    const c = [_]u8{0x02} ** 32;

    try std.testing.expect(constantTimeEqual(&a, &b));
    try std.testing.expect(!constantTimeEqual(&a, &c));

    // Test first byte differs
    var d = a;
    d[0] = 0xff;
    try std.testing.expect(!constantTimeEqual(&a, &d));

    // Test last byte differs
    var e = a;
    e[31] = 0xff;
    try std.testing.expect(!constantTimeEqual(&a, &e));
}

test "computeLogN" {
    try std.testing.expectEqual(@as(?u6, 0), computeLogN(1));
    try std.testing.expectEqual(@as(?u6, 1), computeLogN(2));
    try std.testing.expectEqual(@as(?u6, 10), computeLogN(1024));
    try std.testing.expectEqual(@as(?u6, 14), computeLogN(16384));
    try std.testing.expectEqual(@as(?u6, 18), computeLogN(262144));

    // Non-powers of 2 should return null
    try std.testing.expectEqual(@as(?u6, null), computeLogN(0));
    try std.testing.expectEqual(@as(?u6, null), computeLogN(3));
    try std.testing.expectEqual(@as(?u6, null), computeLogN(1023));
}

test "generateUuid format" {
    var uuid: [36]u8 = undefined;
    generateUuid(&uuid);

    // Check format: 8-4-4-4-12
    try std.testing.expectEqual(@as(u8, '-'), uuid[8]);
    try std.testing.expectEqual(@as(u8, '-'), uuid[13]);
    try std.testing.expectEqual(@as(u8, '-'), uuid[18]);
    try std.testing.expectEqual(@as(u8, '-'), uuid[23]);

    // Check version (4) at position 14
    try std.testing.expect(uuid[14] == '4');

    // Check variant at position 19 (should be 8, 9, a, or b)
    const variant = uuid[19];
    try std.testing.expect(variant == '8' or variant == '9' or variant == 'a' or variant == 'b');
}

test "bytesToHex" {
    const bytes = [_]u8{ 0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef };
    const hex = bytesToHex(8, &bytes);
    try std.testing.expectEqualSlices(u8, "0123456789abcdef", &hex);
}

test "hexToBytes" {
    const hex = "0123456789abcdef".*;
    const bytes = try hexToBytes(8, &hex);
    const expected = [_]u8{ 0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef };
    try std.testing.expectEqualSlices(u8, &expected, &bytes);
}

test "pbkdf2 round trip" {
    const allocator = std.testing.allocator;

    const private_key = [_]u8{ 0xde, 0xad, 0xbe, 0xef } ++ [_]u8{0} ** 28;
    const password = "secure-password-123";

    var keystore = try encrypt(allocator, private_key, password, .{
        .kdf = .pbkdf2,
        .pbkdf2_c = 1000,
    });
    defer keystore.deinit(allocator);

    try std.testing.expectEqual(Kdf.pbkdf2, keystore.crypto_section.kdf);
    try std.testing.expectEqual(@as(u32, 1000), keystore.crypto_section.kdfparams.pbkdf2.c);

    const decrypted = try decrypt(allocator, keystore, password);
    try std.testing.expectEqualSlices(u8, &private_key, &decrypted);
}

test "scrypt custom parameters" {
    const allocator = std.testing.allocator;

    const private_key = [_]u8{ 0xca, 0xfe } ** 16;
    const password = "password";

    var keystore = try encrypt(allocator, private_key, password, .{
        .kdf = .scrypt,
        .scrypt_n = 2048,
        .scrypt_r = 4,
        .scrypt_p = 2,
    });
    defer keystore.deinit(allocator);

    try std.testing.expectEqual(@as(u32, 2048), keystore.crypto_section.kdfparams.scrypt.n);
    try std.testing.expectEqual(@as(u8, 4), keystore.crypto_section.kdfparams.scrypt.r);
    try std.testing.expectEqual(@as(u8, 2), keystore.crypto_section.kdfparams.scrypt.p);

    const decrypted = try decrypt(allocator, keystore, password);
    try std.testing.expectEqualSlices(u8, &private_key, &decrypted);
}

test "all zero private key" {
    const allocator = std.testing.allocator;

    const private_key = [_]u8{0} ** 32;
    const password = "password";

    var keystore = try encrypt(allocator, private_key, password, .{
        .scrypt_n = 1024,
        .scrypt_r = 1,
        .scrypt_p = 1,
    });
    defer keystore.deinit(allocator);

    const decrypted = try decrypt(allocator, keystore, password);
    try std.testing.expectEqualSlices(u8, &private_key, &decrypted);
}

test "all 0xff private key" {
    const allocator = std.testing.allocator;

    const private_key = [_]u8{0xff} ** 32;
    const password = "password";

    var keystore = try encrypt(allocator, private_key, password, .{
        .scrypt_n = 1024,
        .scrypt_r = 1,
        .scrypt_p = 1,
    });
    defer keystore.deinit(allocator);

    const decrypted = try decrypt(allocator, keystore, password);
    try std.testing.expectEqualSlices(u8, &private_key, &decrypted);
}

// ============================================================================
// JSON Tests
// ============================================================================

test "toJson scrypt format" {
    const allocator = std.testing.allocator;

    const private_key = [_]u8{0x01} ** 32;
    const salt = [_]u8{0x02} ** 32;
    const iv = [_]u8{0x03} ** 16;
    const uuid = "12345678-1234-4234-8234-123456789abc".*;

    var keystore = try encrypt(allocator, private_key, "password", .{
        .salt = salt,
        .iv = iv,
        .uuid = uuid,
        .scrypt_n = 1024,
        .scrypt_r = 1,
        .scrypt_p = 1,
    });
    defer keystore.deinit(allocator);

    const json = try toJson(allocator, keystore);
    defer allocator.free(json);

    // Verify JSON contains expected fields
    try std.testing.expect(mem.indexOf(u8, json, "\"version\":3") != null);
    try std.testing.expect(mem.indexOf(u8, json, "\"id\":\"12345678-1234-4234-8234-123456789abc\"") != null);
    try std.testing.expect(mem.indexOf(u8, json, "\"cipher\":\"aes-128-ctr\"") != null);
    try std.testing.expect(mem.indexOf(u8, json, "\"kdf\":\"scrypt\"") != null);
    try std.testing.expect(mem.indexOf(u8, json, "\"n\":1024") != null);
    try std.testing.expect(mem.indexOf(u8, json, "\"r\":1") != null);
    try std.testing.expect(mem.indexOf(u8, json, "\"p\":1") != null);
    try std.testing.expect(mem.indexOf(u8, json, "\"dklen\":32") != null);
}

test "toJson pbkdf2 format" {
    const allocator = std.testing.allocator;

    const private_key = [_]u8{0x01} ** 32;
    const salt = [_]u8{0x02} ** 32;
    const iv = [_]u8{0x03} ** 16;
    const uuid = "12345678-1234-4234-8234-123456789abc".*;

    var keystore = try encrypt(allocator, private_key, "password", .{
        .kdf = .pbkdf2,
        .salt = salt,
        .iv = iv,
        .uuid = uuid,
        .pbkdf2_c = 10000,
    });
    defer keystore.deinit(allocator);

    const json = try toJson(allocator, keystore);
    defer allocator.free(json);

    // Verify JSON contains expected fields
    try std.testing.expect(mem.indexOf(u8, json, "\"version\":3") != null);
    try std.testing.expect(mem.indexOf(u8, json, "\"kdf\":\"pbkdf2\"") != null);
    try std.testing.expect(mem.indexOf(u8, json, "\"c\":10000") != null);
    try std.testing.expect(mem.indexOf(u8, json, "\"prf\":\"hmac-sha256\"") != null);
}

test "fromJson scrypt round trip" {
    const allocator = std.testing.allocator;

    const private_key = [_]u8{0xab} ** 32;
    const password = "test-password";

    var original = try encrypt(allocator, private_key, password, .{
        .scrypt_n = 1024,
        .scrypt_r = 1,
        .scrypt_p = 1,
    });
    defer original.deinit(allocator);

    // Serialize to JSON
    const json = try toJson(allocator, original);
    defer allocator.free(json);

    // Parse back
    var parsed = try fromJson(allocator, json);
    defer parsed.deinit(allocator);

    // Verify can decrypt with same password
    const decrypted = try decrypt(allocator, parsed, password);
    try std.testing.expectEqualSlices(u8, &private_key, &decrypted);
}

test "fromJson pbkdf2 round trip" {
    const allocator = std.testing.allocator;

    const private_key = [_]u8{0xcd} ** 32;
    const password = "another-password";

    var original = try encrypt(allocator, private_key, password, .{
        .kdf = .pbkdf2,
        .pbkdf2_c = 1000,
    });
    defer original.deinit(allocator);

    // Serialize to JSON
    const json = try toJson(allocator, original);
    defer allocator.free(json);

    // Parse back
    var parsed = try fromJson(allocator, json);
    defer parsed.deinit(allocator);

    // Verify can decrypt with same password
    const decrypted = try decrypt(allocator, parsed, password);
    try std.testing.expectEqualSlices(u8, &private_key, &decrypted);
}

test "fromJson external keystore (scrypt)" {
    const allocator = std.testing.allocator;

    // A valid Web3 Secret Storage JSON (simulated external keystore)
    const json =
        \\{"version":3,"id":"12345678-1234-4234-8234-123456789abc","crypto":{"cipher":"aes-128-ctr","ciphertext":"0101010101010101010101010101010101010101010101010101010101010101","cipherparams":{"iv":"01010101010101010101010101010101"},"kdf":"scrypt","kdfparams":{"dklen":32,"n":1024,"p":1,"r":1,"salt":"0202020202020202020202020202020202020202020202020202020202020202"},"mac":"0303030303030303030303030303030303030303030303030303030303030303"}}
    ;

    var parsed = try fromJson(allocator, json);
    defer parsed.deinit(allocator);

    try std.testing.expectEqual(@as(u8, 3), parsed.version);
    try std.testing.expectEqualSlices(u8, "12345678-1234-4234-8234-123456789abc", &parsed.id);
    try std.testing.expectEqual(Kdf.scrypt, parsed.crypto_section.kdf);
    try std.testing.expectEqual(@as(u32, 1024), parsed.crypto_section.kdfparams.scrypt.n);
}

test "fromJson external keystore (pbkdf2)" {
    const allocator = std.testing.allocator;

    const json =
        \\{"version":3,"id":"abcdefab-abcd-4bcd-abcd-abcdefabcdef","crypto":{"cipher":"aes-128-ctr","ciphertext":"abababababababababababababababababababababababababababababababab","cipherparams":{"iv":"cdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcd"},"kdf":"pbkdf2","kdfparams":{"c":5000,"dklen":32,"prf":"hmac-sha256","salt":"efefefefefefefefefefefefefefefefefefefefefefefefefefefefefefefef"},"mac":"1212121212121212121212121212121212121212121212121212121212121212"}}
    ;

    var parsed = try fromJson(allocator, json);
    defer parsed.deinit(allocator);

    try std.testing.expectEqual(@as(u8, 3), parsed.version);
    try std.testing.expectEqual(Kdf.pbkdf2, parsed.crypto_section.kdf);
    try std.testing.expectEqual(@as(u32, 5000), parsed.crypto_section.kdfparams.pbkdf2.c);
}

test "fromJson invalid version" {
    const allocator = std.testing.allocator;

    const json =
        \\{"version":2,"id":"12345678-1234-4234-8234-123456789abc","crypto":{"cipher":"aes-128-ctr","ciphertext":"0101010101010101010101010101010101010101010101010101010101010101","cipherparams":{"iv":"01010101010101010101010101010101"},"kdf":"scrypt","kdfparams":{"dklen":32,"n":1024,"p":1,"r":1,"salt":"0202020202020202020202020202020202020202020202020202020202020202"},"mac":"0303030303030303030303030303030303030303030303030303030303030303"}}
    ;

    const result = fromJson(allocator, json);
    try std.testing.expectError(KeystoreError.InvalidVersion, result);
}

test "fromJson unsupported kdf" {
    const allocator = std.testing.allocator;

    const json =
        \\{"version":3,"id":"12345678-1234-4234-8234-123456789abc","crypto":{"cipher":"aes-128-ctr","ciphertext":"0101010101010101010101010101010101010101010101010101010101010101","cipherparams":{"iv":"01010101010101010101010101010101"},"kdf":"argon2id","kdfparams":{"dklen":32},"mac":"0303030303030303030303030303030303030303030303030303030303030303"}}
    ;

    const result = fromJson(allocator, json);
    try std.testing.expectError(KeystoreError.UnsupportedKdf, result);
}
