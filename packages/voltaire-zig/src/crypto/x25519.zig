//! X25519 Elliptic Curve Diffie-Hellman Key Exchange
//!
//! High-performance, secure key exchange using Curve25519.
//! Re-exports and wraps Zig's standard library X25519 implementation.
//!
//! ## Overview
//! X25519 is a modern elliptic curve Diffie-Hellman (ECDH) key exchange
//! designed by Daniel J. Bernstein. It provides 128-bit security with
//! excellent performance and resistance to timing attacks.
//!
//! ## Key Features
//! - Constant-time operations (timing attack resistant)
//! - 32-byte secret and public keys
//! - 32-byte shared secrets
//! - Low-order public keys and all-zero shared secrets rejected (RFC 7748 section 6.1)
//!
//! ## Usage
//! ```zig
//! const x25519 = @import("x25519");
//!
//! // Generate keypair from secret
//! const seed: [32]u8 = random_bytes();
//! const keypair = try x25519.keypairFromSeed(&seed);
//!
//! // Perform key exchange
//! const shared = try x25519.scalarmult(
//!     allocator,
//!     &keypair.secret_key,
//!     &other_public_key
//! );
//! defer allocator.free(shared);
//! ```
//!
//! ## Security Notes
//! - Uses Zig's audited std.crypto implementation
//! - Constant-time scalar multiplication
//! - Automatic key clamping
//!
//! ## References
//! - [RFC 7748](https://www.rfc-editor.org/rfc/rfc7748) - X25519 specification

const std = @import("std");
const crypto = std.crypto;
const constant_time = @import("constant_time.zig");

/// X25519 Elliptic Curve Diffie-Hellman key exchange
/// Re-exports Zig's standard library X25519 implementation
pub const X25519 = crypto.dh.X25519;

/// X25519 key sizes
pub const SECRET_KEY_SIZE = X25519.secret_length;
pub const PUBLIC_KEY_SIZE = X25519.public_length;
pub const SHARED_SECRET_SIZE = X25519.shared_length;

/// Montgomery-form Curve25519, used for the low-order check
pub const Curve25519 = crypto.ecc.Curve25519;

/// Reasons an X25519 public key is rejected.
pub const PublicKeyError = error{
    InvalidPublicKeyLength,
    /// Low-order point: the shared secret would be all zeros for every secret key.
    WeakPublicKey,
};

/// The known low-order public keys (https://cr.yp.to/ecdh.html#validate, the
/// set libsodium blocklists), little-endian. X25519 ignores bit 255, so each
/// entry is also weak with that bit set: 14 encodings in total.
///
/// `isWeakPublicKey` canonicalizes per RFC 7748 (masking bit 255 and reducing
/// mod p in constant time) and compares against the 5 canonical residues in
/// constant time.
pub const LOW_ORDER_POINTS = [7][PUBLIC_KEY_SIZE]u8{
    // u = 0 (order 2)
    [_]u8{0} ** 32,
    // u = 1 (order 4)
    [_]u8{1} ++ [_]u8{0} ** 31,
    // order 8
    .{ 0xe0, 0xeb, 0x7a, 0x7c, 0x3b, 0x41, 0xb8, 0xae, 0x16, 0x56, 0xe3, 0xfa, 0xf1, 0x9f, 0xc4, 0x6a, 0xda, 0x09, 0x8d, 0xeb, 0x9c, 0x32, 0xb1, 0xfd, 0x86, 0x62, 0x05, 0x16, 0x5f, 0x49, 0xb8, 0x00 },
    // order 8
    .{ 0x5f, 0x9c, 0x95, 0xbc, 0xa3, 0x50, 0x8c, 0x24, 0xb1, 0xd0, 0xb1, 0x55, 0x9c, 0x83, 0xef, 0x5b, 0x04, 0x44, 0x5c, 0xc4, 0x58, 0x1c, 0x8e, 0x86, 0xd8, 0x22, 0x4e, 0xdd, 0xd0, 0x9f, 0x11, 0x57 },
    // u = p - 1 (order 4, on the twist)
    [_]u8{0xec} ++ [_]u8{0xff} ** 30 ++ [_]u8{0x7f},
    // u = p (non-canonical encoding of 0)
    [_]u8{0xed} ++ [_]u8{0xff} ** 30 ++ [_]u8{0x7f},
    // u = p + 1 (non-canonical encoding of 1)
    [_]u8{0xee} ++ [_]u8{0xff} ** 30 ++ [_]u8{0x7f},
};

/// Field prime p = 2^255 - 19 for Curve25519
const FIELD_PRIME: u256 = (@as(u256, 1) << 255) - 19;

/// The 5 distinct canonical u-coordinates (mod p) of all low-order Curve25519
/// and quadratic-twist points (orders 1, 2, 4, 8). Opposite points share a u-coordinate.
const CANONICAL_LOW_ORDER_POINTS = [5][PUBLIC_KEY_SIZE]u8{
    LOW_ORDER_POINTS[0], // u = 0
    LOW_ORDER_POINTS[1], // u = 1
    LOW_ORDER_POINTS[2], // order 8 A
    LOW_ORDER_POINTS[3], // order 8 B
    LOW_ORDER_POINTS[4], // u = p - 1
};

/// Canonicalize a 32-byte little-endian X25519 u-coordinate per RFC 7748 section 5:
/// clear bit 255 and reduce modulo p = 2^255 - 19 in constant time.
fn canonicalizeUCoordinate(public_key: [PUBLIC_KEY_SIZE]u8) [PUBLIC_KEY_SIZE]u8 {
    var masked = public_key;
    masked[PUBLIC_KEY_SIZE - 1] &= 0x7f;

    const u = std.mem.readInt(u256, &masked, .little);
    const ge_p = constant_time.constantTimeGteU256(u, FIELD_PRIME);
    const reduced = constant_time.constantTimeSubU256(ge_p, u, FIELD_PRIME);

    var out: [PUBLIC_KEY_SIZE]u8 = undefined;
    std.mem.writeInt(u256, &out, reduced, .little);
    return out;
}

/// Check whether a public key is a low-order point in constant time.
///
/// The key is decoded as RFC 7748 section 5 prescribes (bit 255 masked,
/// reduced mod p in constant time) and compared in constant time against all
/// 5 canonical low-order Curve25519 and quadratic-twist u-coordinates (covering
/// all 14 weak byte encodings, including non-canonical `p`, `p + 1`, and MSB-set
/// aliases). Returns false for any length other than 32.
pub fn isWeakPublicKey(public_key: []const u8) bool {
    if (public_key.len != PUBLIC_KEY_SIZE) return false;
    const canonical = canonicalizeUCoordinate(public_key[0..PUBLIC_KEY_SIZE].*);
    var weak: u8 = 0;
    for (CANONICAL_LOW_ORDER_POINTS) |low_order| {
        weak |= @intFromBool(constant_time.eql(&canonical, &low_order));
    }
    return weak != 0;
}

/// Validate a public key: 32 bytes and not a low-order point.
///
/// Non-canonical encodings (u >= p) that do not alias a low-order point stay
/// valid: RFC 7748 section 5 requires implementations to accept and reduce them.
pub fn validatePublicKey(public_key: []const u8) PublicKeyError!void {
    if (public_key.len != PUBLIC_KEY_SIZE) return error.InvalidPublicKeyLength;
    if (isWeakPublicKey(public_key)) return error.WeakPublicKey;
}

/// Boolean form of `validatePublicKey`.
pub fn isValidPublicKey(public_key: []const u8) bool {
    validatePublicKey(public_key) catch return false;
    return true;
}

/// Generate public key from secret key
pub fn publicKeyFromSecret(
    allocator: std.mem.Allocator,
    secret_key: []const u8,
) ![]u8 {
    if (secret_key.len != SECRET_KEY_SIZE) return error.InvalidSecretKeyLength;

    const public_key = try X25519.recoverPublicKey(secret_key[0..SECRET_KEY_SIZE].*);

    const result = try allocator.alloc(u8, PUBLIC_KEY_SIZE);
    @memcpy(result, &public_key);

    return result;
}

/// Perform X25519 key exchange
///
/// Returns `error.WeakPublicKey` when the peer public key is a low-order point
/// or the shared secret is all zeros (RFC 7748 section 6.1).
pub fn scalarmult(
    allocator: std.mem.Allocator,
    secret_key: []const u8,
    public_key: []const u8,
) ![]u8 {
    if (secret_key.len != SECRET_KEY_SIZE) return error.InvalidSecretKeyLength;
    if (public_key.len != PUBLIC_KEY_SIZE) return error.InvalidPublicKeyLength;

    if (isWeakPublicKey(public_key)) return error.WeakPublicKey;

    var shared_secret = X25519.scalarmult(
        secret_key[0..SECRET_KEY_SIZE].*,
        public_key[0..PUBLIC_KEY_SIZE].*,
    ) catch return error.WeakPublicKey;
    defer crypto.secureZero(u8, &shared_secret);

    // RFC 7748 section 6.1: abort on an all-zero shared secret. Checked in
    // constant time and independently of the low-order check above.
    if (constant_time.isZero(&shared_secret)) return error.WeakPublicKey;

    const result = try allocator.alloc(u8, SHARED_SECRET_SIZE);
    @memcpy(result, &shared_secret);

    return result;
}

/// Generate keypair from seed (secret key)
pub fn keypairFromSeed(seed: []const u8) !struct { secret_key: [SECRET_KEY_SIZE]u8, public_key: [PUBLIC_KEY_SIZE]u8 } {
    if (seed.len != SECRET_KEY_SIZE) return error.InvalidSeedLength;

    const secret_key = seed[0..SECRET_KEY_SIZE].*;
    const public_key = try X25519.recoverPublicKey(secret_key);

    return .{
        .secret_key = secret_key,
        .public_key = public_key,
    };
}

test "x25519 basic" {
    const allocator = std.testing.allocator;

    // Test key generation
    const secret = [_]u8{1} ** SECRET_KEY_SIZE;
    const public_key = try publicKeyFromSecret(allocator, &secret);
    defer allocator.free(public_key);

    try std.testing.expect(public_key.len == PUBLIC_KEY_SIZE);
}

test "x25519 key exchange" {
    const allocator = std.testing.allocator;

    // Generate two keypairs
    const secret1 = [_]u8{1} ** SECRET_KEY_SIZE;
    const secret2 = [_]u8{2} ** SECRET_KEY_SIZE;

    const public1 = try publicKeyFromSecret(allocator, &secret1);
    defer allocator.free(public1);
    const public2 = try publicKeyFromSecret(allocator, &secret2);
    defer allocator.free(public2);

    // Perform key exchange from both sides
    const shared1 = try scalarmult(allocator, &secret1, public2);
    defer allocator.free(shared1);
    const shared2 = try scalarmult(allocator, &secret2, public1);
    defer allocator.free(shared2);

    // Both should produce the same shared secret
    try std.testing.expectEqualSlices(u8, shared1, shared2);
}

test "x25519 keypair from seed" {
    const seed = [_]u8{3} ** SECRET_KEY_SIZE;
    const keypair = try keypairFromSeed(&seed);

    try std.testing.expectEqualSlices(u8, &keypair.secret_key, &seed);
    try std.testing.expect(keypair.public_key.len == PUBLIC_KEY_SIZE);
}

// ============================================================================
// Weak public keys (issue #86)
// ============================================================================

fn withHighBit(key: [32]u8) [32]u8 {
    var out = key;
    out[31] |= 0x80;
    return out;
}

const test_secret_keys = [_][32]u8{
    [_]u8{1} ** 32,
    [_]u8{0xff} ** 32,
    // RFC 7748 section 6.1, Alice
    .{ 0x77, 0x07, 0x6d, 0x0a, 0x73, 0x18, 0xa5, 0x7d, 0x3c, 0x16, 0xc1, 0x72, 0x51, 0xb2, 0x66, 0x45, 0xdf, 0x4c, 0x2f, 0x87, 0xeb, 0xc0, 0x99, 0x2a, 0xb1, 0x77, 0xfb, 0xa5, 0x1d, 0xb9, 0x2c, 0x2a },
};

test "x25519 isWeakPublicKey flags all 14 low-order encodings" {
    for (LOW_ORDER_POINTS) |point| {
        for ([_][32]u8{ point, withHighBit(point) }) |key| {
            try std.testing.expect(isWeakPublicKey(&key));
            try std.testing.expect(!isValidPublicKey(&key));
            try std.testing.expectError(error.WeakPublicKey, validatePublicKey(&key));
        }
    }
}

test "x25519 low-order table has 7 distinct entries" {
    for (LOW_ORDER_POINTS, 0..) |a, i| {
        for (LOW_ORDER_POINTS[i + 1 ..]) |b| {
            try std.testing.expect(!std.mem.eql(u8, &a, &b));
        }
    }
}

test "x25519 scalarmult rejects every low-order point for every secret key" {
    const allocator = std.testing.allocator;
    for (LOW_ORDER_POINTS) |point| {
        for ([_][32]u8{ point, withHighBit(point) }) |key| {
            for (test_secret_keys) |secret| {
                try std.testing.expectError(error.WeakPublicKey, scalarmult(allocator, &secret, &key));
            }
        }
    }
}

test "x25519 low-order table entries reach infinity after three doublings" {
    // Independent of isWeakPublicKey and of std's ladder: x-only doubling on
    // v^2 = u^3 + 486662 u^2 + u in projective (X : Z) coordinates,
    //   X' = (X^2 - Z^2)^2,  Z' = 4 X Z (X^2 + 486662 X Z + Z^2).
    // Z = 0 is the point at infinity, so [8]P = infinity for every entry.
    const Fe = Curve25519.Fe;
    for (LOW_ORDER_POINTS) |point| {
        var x = Fe.fromBytes(point);
        var z = Fe.one;
        for (0..3) |_| {
            const xx = x.sq();
            const zz = z.sq();
            const xz = x.mul(z);
            const next_x = xx.sub(zz).sq();
            const next_z = xz.mul32(4).mul(xx.add(xz.mul32(486662)).add(zz));
            x = next_x;
            z = next_z;
        }
        try std.testing.expect(z.isZero());
    }

    // Control: the base point u = 9 does not
    var x = Fe.fromBytes([_]u8{9} ++ [_]u8{0} ** 31);
    var z = Fe.one;
    for (0..3) |_| {
        const xx = x.sq();
        const zz = z.sq();
        const xz = x.mul(z);
        const next_x = xx.sub(zz).sq();
        const next_z = xz.mul32(4).mul(xx.add(xz.mul32(486662)).add(zz));
        x = next_x;
        z = next_z;
    }
    try std.testing.expect(!z.isZero());
}

test "x25519 validatePublicKey accepts honest keys" {
    const allocator = std.testing.allocator;

    // Base point u = 9
    const base = [_]u8{9} ++ [_]u8{0} ** 31;
    try std.testing.expect(!isWeakPublicKey(&base));
    try validatePublicKey(&base);
    try std.testing.expect(isValidPublicKey(&base));

    // u = 2 and the neighbour of p - 1
    try validatePublicKey(&([_]u8{2} ++ [_]u8{0} ** 31));
    try validatePublicKey(&([_]u8{0xeb} ++ [_]u8{0xff} ** 30 ++ [_]u8{0x7f}));

    var i: u8 = 1;
    while (i <= 32) : (i += 1) {
        const secret = [_]u8{i} ** 32;
        const public_key = try publicKeyFromSecret(allocator, &secret);
        defer allocator.free(public_key);
        try std.testing.expect(!isWeakPublicKey(public_key));
        try validatePublicKey(public_key);
    }
}

test "x25519 non-canonical u = p + 2 is accepted and reduced (RFC 7748 section 5)" {
    const allocator = std.testing.allocator;
    const non_canonical = [_]u8{0xef} ++ [_]u8{0xff} ** 30 ++ [_]u8{0x7f};
    const canonical = [_]u8{2} ++ [_]u8{0} ** 31;
    try validatePublicKey(&non_canonical);
    for (test_secret_keys) |secret| {
        const a = try scalarmult(allocator, &secret, &non_canonical);
        defer allocator.free(a);
        const b = try scalarmult(allocator, &secret, &canonical);
        defer allocator.free(b);
        try std.testing.expectEqualSlices(u8, b, a);
    }
}

test "x25519 bit 255 of a valid key is ignored (RFC 7748 section 5)" {
    const allocator = std.testing.allocator;
    const public_key = try publicKeyFromSecret(allocator, &([_]u8{7} ** 32));
    defer allocator.free(public_key);
    const masked = withHighBit(public_key[0..32].*);
    for (test_secret_keys) |secret| {
        const a = try scalarmult(allocator, &secret, &masked);
        defer allocator.free(a);
        const b = try scalarmult(allocator, &secret, public_key);
        defer allocator.free(b);
        try std.testing.expectEqualSlices(u8, b, a);
    }
}

test "x25519 public key length handling" {
    const buffer = [_]u8{0} ** 64;
    for ([_]usize{ 0, 1, 31, 33, 64 }) |len| {
        try std.testing.expect(!isWeakPublicKey(buffer[0..len]));
        try std.testing.expectError(error.InvalidPublicKeyLength, validatePublicKey(buffer[0..len]));
        try std.testing.expect(!isValidPublicKey(buffer[0..len]));
    }
}

test "x25519 RFC 7748 section 6.1 vector" {
    const allocator = std.testing.allocator;
    const bob_public = [_]u8{ 0xde, 0x9e, 0xdb, 0x7d, 0x7b, 0x7d, 0xc1, 0xb4, 0xd3, 0x5b, 0x61, 0xc2, 0xec, 0xe4, 0x35, 0x37, 0x3f, 0x83, 0x43, 0xc8, 0x5b, 0x78, 0x67, 0x4d, 0xad, 0xfc, 0x7e, 0x14, 0x6f, 0x88, 0x2b, 0x4f };
    const expected = [_]u8{ 0x4a, 0x5d, 0x9d, 0x5b, 0xa4, 0xce, 0x2d, 0xe1, 0x72, 0x8e, 0x3b, 0xf4, 0x80, 0x35, 0x0f, 0x25, 0xe0, 0x7e, 0x21, 0xc9, 0x47, 0xd1, 0x9e, 0x33, 0x76, 0xf0, 0x9b, 0x3c, 0x1e, 0x16, 0x17, 0x42 };
    const shared = try scalarmult(allocator, &test_secret_keys[2], &bob_public);
    defer allocator.free(shared);
    try std.testing.expectEqualSlices(u8, &expected, shared);
}
