//! P256 (secp256r1/prime256v1) Elliptic Curve Operations
//!
//! NIST P-256 elliptic curve implementation for ECDSA signatures.
//! Uses Zig's standard library P256 implementation.
//!
//! ## Overview
//! P-256 (also known as secp256r1 or prime256v1) is a NIST-standardized
//! elliptic curve widely used in TLS, government applications, and WebAuthn.
//!
//! ## Curve Parameters
//! - Prime field: 256-bit prime (NIST P-256)
//! - Security level: 128 bits
//! - Curve equation: y² = x³ - 3x + b (short Weierstrass form)
//! - Cofactor: 1
//!
//! ## Key Features
//! - NIST-standardized curve
//! - Hardware acceleration support (Intel, ARM)
//! - Constant-time operations
//! - Low-s malleability protection enforced
//!
//! ## Usage
//! ```zig
//! const p256 = @import("p256");
//!
//! // Sign message hash
//! const hash: [32]u8 = sha256("message");
//! const private_key: [32]u8 = ...;
//! const sig = try p256.sign(allocator, &hash, &private_key);
//! defer allocator.free(sig);
//!
//! // Verify signature (r || s format)
//! const r = sig[0..32];
//! const s = sig[32..64];
//! const public_key: [64]u8 = ...; // Uncompressed x || y
//! const valid = try p256.verify(&hash, r, s, &public_key);
//! ```
//!
//! ## Security Notes
//! - Uses Zig's audited std.crypto implementation
//! - Enforces low-s to prevent signature malleability
//! - Constant-time scalar multiplication
//! - Hardware acceleration when available
//!
//! ## P256 vs secp256k1
//! - **P256**: NIST-standardized, government approved, TLS/WebAuthn
//! - **secp256k1**: Bitcoin/Ethereum, Koblitz curve, faster
//!
//! ## Use Cases
//! - Not used in Ethereum mainnet (uses secp256k1)
//! - RIP-7212 precompile candidate
//! - WebAuthn integration
//! - General ECDSA applications
//!
//! ## References
//! - [FIPS 186-4](https://csrc.nist.gov/publications/detail/fips/186/4/final) - NIST P-256 specification
//! - [SEC 2](https://www.secg.org/sec2-v2.pdf) - secp256r1 curve parameters

const std = @import("std");
const constant_time = @import("constant_time.zig");

/// P256 (secp256r1/prime256v1) elliptic curve operations
/// Uses Zig's standard library P256 implementation via ECDSA
pub const P256 = std.crypto.ecc.P256;
pub const EcdsaP256Sha256 = std.crypto.sign.ecdsa.EcdsaP256Sha256;

/// P256 curve parameters
pub const P256_P: u256 = 0xffffffff00000001000000000000000000000000ffffffffffffffffffffffff;
pub const P256_N: u256 = 0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551;
pub const P256_B: u256 = 0x5ac635d8aa3a93e7b3ebbd55769886bc651d06b0cc53b0f63bce3c3e27d2604b;
pub const P256_GX: u256 = 0x6b17d1f2e12c4247f8bce6e563a440f277037d812deb33a0f4a13945d898c296;
pub const P256_GY: u256 = 0x4fe342e2fe1a7f9b8ee7eb4a7c0f9e162bce33576b315ececbb6406837bf51f5;

/// Reasons a P256 public key is rejected.
pub const PublicKeyError = error{
    /// Not 64 (raw x || y), 65 (SEC1 uncompressed) or 33 (SEC1 compressed) bytes.
    InvalidPublicKeyLength,
    /// SEC1 prefix is not 0x04 (65 bytes) or 0x02/0x03 (33 bytes).
    InvalidPublicKeyPrefix,
    /// A coordinate is not a canonical field element (>= p).
    NonCanonical,
    /// The point at infinity, encoded as (0, 0).
    IdentityElement,
    /// The point does not satisfy y^2 = x^3 - 3x + b (mod p).
    NotOnCurve,
};

fn pointFromAffineBytes(xs: [32]u8, ys: [32]u8) PublicKeyError!P256 {
    const x = P256.Fe.fromBytes(xs, .big) catch return error.NonCanonical;
    const y = P256.Fe.fromBytes(ys, .big) catch return error.NonCanonical;
    // (0, 0) is the conventional encoding of the point at infinity
    if (x.isZero() and y.isZero()) return error.IdentityElement;
    // y^2 = x^3 - 3x + b, checked here and not through std's
    // fromAffineCoordinates: that function waves the off-curve points (0, 0)
    // and (0, 1) through as "the identity element".
    const x3AxB = x.sq().mul(x).sub(x).sub(x).sub(x).add(P256.B);
    if (!x3AxB.equivalent(y.sq())) return error.NotOnCurve;
    return P256{ .x = x, .y = y };
}

/// Decode a public key and run full public-key validation
/// (SEC 1 v2 section 3.2.2.1, NIST SP 800-56A section 5.6.2.3.3).
///
/// P-256 has cofactor 1, so an on-curve point other than infinity is always in
/// the prime-order group. Public keys are public: no constant-time requirement.
fn parsePublicKey(public_key: []const u8) PublicKeyError!P256 {
    switch (public_key.len) {
        64 => return pointFromAffineBytes(public_key[0..32].*, public_key[32..64].*),
        65 => {
            if (public_key[0] != 0x04) return error.InvalidPublicKeyPrefix;
            return pointFromAffineBytes(public_key[1..33].*, public_key[33..65].*);
        },
        33 => {
            if (public_key[0] != 0x02 and public_key[0] != 0x03) return error.InvalidPublicKeyPrefix;
            const point = P256.fromSec1(public_key) catch |err| switch (err) {
                error.NonCanonical => return error.NonCanonical,
                // x^3 - 3x + b has no square root: no point has this x
                error.NotSquare, error.InvalidEncoding => return error.NotOnCurve,
            };
            point.rejectIdentity() catch return error.IdentityElement;
            return point;
        },
        else => return error.InvalidPublicKeyLength,
    }
}

/// Validate a P256 public key.
///
/// Accepted encodings: 64 bytes raw `x || y`, 65 bytes SEC1 uncompressed
/// (`0x04 || x || y`), 33 bytes SEC1 compressed (`0x02 | 0x03 || x`).
///
/// Rejects the point at infinity `(0, 0)`, coordinates `>= p`, points off the
/// curve, and any other length or prefix (hybrid `0x06`/`0x07` included).
/// Accepting an off-curve point in ECDH enables invalid-curve attacks that
/// recover the private key.
pub fn validatePublicKey(public_key: []const u8) PublicKeyError!void {
    _ = try parsePublicKey(public_key);
}

/// Boolean form of `validatePublicKey`.
pub fn isValidPublicKey(public_key: []const u8) bool {
    validatePublicKey(public_key) catch return false;
    return true;
}

/// Sign a message hash with a private key
/// Returns signature as r || s (64 bytes)
/// Enforces low-s for malleability protection
pub fn sign(
    allocator: std.mem.Allocator,
    hash: []const u8,
    private_key: []const u8,
) ![]u8 {
    if (hash.len != 32) return error.InvalidHashLength;
    if (private_key.len != 32) return error.InvalidPrivateKeyLength;

    var secret_key = try EcdsaP256Sha256.SecretKey.fromBytes(private_key[0..32].*);
    defer std.crypto.secureZero(u8, &secret_key.bytes);
    var key_pair = try EcdsaP256Sha256.KeyPair.fromSecretKey(secret_key);
    defer std.crypto.secureZero(u8, &key_pair.secret_key.bytes);

    const sig = try key_pair.signPrehashed(hash[0..32].*, null);

    const result = try allocator.alloc(u8, 64);
    const sig_bytes = sig.toBytes();
    result[0..32].* = sig_bytes[0..32].*;

    // Enforce low-s in constant time for malleability protection:
    // if s > n/2, replace s with n - s without branching on s.
    const s_int = std.mem.readInt(u256, sig_bytes[32..64], .big);
    const use_negated_s = constant_time.constantTimeGtU256(s_int, P256_N / 2);
    const normalized_s = constant_time.constantTimeSelectU256(use_negated_s, P256_N - s_int, s_int);
    std.mem.writeInt(u256, result[32..64], normalized_s, .big);

    return result;
}

/// Verify an ECDSA signature
///
/// Accepts 64-byte raw `x || y`, 65-byte SEC1 uncompressed, or 33-byte SEC1 compressed
/// public keys. Returns a `PublicKeyError` when the public key has an invalid length or
/// prefix, is the point at infinity, has a coordinate >= p, or is not on the curve.
pub fn verify(
    hash: []const u8,
    r: []const u8,
    s: []const u8,
    public_key: []const u8,
) !bool {
    if (hash.len != 32) return error.InvalidHashLength;
    if (r.len != 32) return error.InvalidRLength;
    if (s.len != 32) return error.InvalidSLength;

    var sig_bytes: [64]u8 = undefined;
    @memcpy(sig_bytes[0..32], r);
    @memcpy(sig_bytes[32..64], s);
    const sig = EcdsaP256Sha256.Signature.fromBytes(sig_bytes);

    // Full validation: rejects infinity, coordinates >= p and off-curve points
    const point = try parsePublicKey(public_key);
    const pub_key = EcdsaP256Sha256.PublicKey{ .p = point };

    // Zig 0.15 rejects a zero reduced digest because its scalar multiplication
    // rejects infinity. In that case the ECDSA sum is simply (r / s) * Q.
    const digest = std.mem.readInt(u256, hash[0..32], .big);
    if (digest == 0 or digest == P256_N) {
        const verifier = sig.verifier(pub_key) catch return false;
        const factor = verifier.r.mul(verifier.s.invert());
        const res = point.mulPublic(factor.toBytes(.big), .big) catch return false;
        const x = res.affineCoordinates().x.toBytes(.big);
        return std.mem.readInt(u256, &x, .big) % P256_N == std.mem.readInt(u256, r[0..32], .big);
    }

    sig.verifyPrehashed(hash[0..32].*, pub_key) catch return false;
    return true;
}

/// Generate a public key from a private key
/// Returns uncompressed public key (64 bytes: x || y)
pub fn publicKeyFromPrivate(
    allocator: std.mem.Allocator,
    private_key: []const u8,
) ![]u8 {
    if (private_key.len != 32) return error.InvalidPrivateKeyLength;

    var secret_key = try EcdsaP256Sha256.SecretKey.fromBytes(private_key[0..32].*);
    defer std.crypto.secureZero(u8, &secret_key.bytes);
    var key_pair = try EcdsaP256Sha256.KeyPair.fromSecretKey(secret_key);
    defer std.crypto.secureZero(u8, &key_pair.secret_key.bytes);

    const pub_key = key_pair.public_key.toUncompressedSec1();

    const result = try allocator.alloc(u8, 64);
    @memcpy(result, pub_key[1..65]); // Skip 0x04 prefix

    return result;
}

/// Perform ECDH key exchange
/// Returns shared secret (32 bytes)
///
/// Accepts 64-byte raw `x || y`, 65-byte SEC1 uncompressed, or 33-byte SEC1 compressed
/// public keys. Returns a `PublicKeyError` when the public key has an invalid length or
/// prefix, is the point at infinity, has a coordinate >= p, or is not on the curve.
pub fn ecdh(
    allocator: std.mem.Allocator,
    private_key: []const u8,
    public_key: []const u8,
) ![]u8 {
    if (private_key.len != 32) return error.InvalidPrivateKeyLength;

    var secret = try P256.scalar.Scalar.fromBytes(private_key[0..32].*, .big);
    defer std.crypto.secureZero(u8, std.mem.asBytes(&secret));
    if (secret.isZero()) return error.InvalidPrivateKey;

    // Full validation before the private key touches the point: blocks
    // invalid-curve and point-at-infinity attacks.
    const pub_key = try parsePublicKey(public_key);

    var secret_bytes = secret.toBytes(.big);
    defer std.crypto.secureZero(u8, &secret_bytes);
    var shared = try pub_key.mul(secret_bytes, .big);
    defer std.crypto.secureZero(u8, std.mem.asBytes(&shared));
    try shared.rejectIdentity();
    var shared_bytes = shared.toUncompressedSec1();
    defer std.crypto.secureZero(u8, &shared_bytes);

    const result = try allocator.alloc(u8, 32);
    @memcpy(result, shared_bytes[1..33]); // x-coordinate only

    return result;
}

test "p256 basic" {
    const allocator = std.testing.allocator;

    // Test key generation
    const private_key = @as([32]u8, @splat(1));
    const public_key = try publicKeyFromPrivate(allocator, &private_key);
    defer allocator.free(public_key);

    try std.testing.expect(public_key.len == 64);

    // Test signing and verification
    const hash = @as([32]u8, @splat(0xaa));
    const signature = try sign(allocator, &hash, &private_key);
    defer allocator.free(signature);

    try std.testing.expect(signature.len == 64);

    const valid = try verify(&hash, signature[0..32], signature[32..64], public_key);
    try std.testing.expect(valid);

    // Test with wrong hash
    const wrong_hash = @as([32]u8, @splat(0xbb));
    const invalid = try verify(&wrong_hash, signature[0..32], signature[32..64], public_key);
    try std.testing.expect(!invalid);
}

test "p256 ecdh" {
    const allocator = std.testing.allocator;

    const priv1 = @as([32]u8, @splat(1));
    const priv2 = @as([32]u8, @splat(2));

    const pub1 = try publicKeyFromPrivate(allocator, &priv1);
    defer allocator.free(pub1);
    const pub2 = try publicKeyFromPrivate(allocator, &priv2);
    defer allocator.free(pub2);

    const shared1 = try ecdh(allocator, &priv1, pub2);
    defer allocator.free(shared1);
    const shared2 = try ecdh(allocator, &priv2, pub1);
    defer allocator.free(shared2);

    try std.testing.expectEqualSlices(u8, shared1, shared2);
}

// ============================================================================
// Public key validation (issue #86)
// ============================================================================

fn toBytes32(value: u256) [32]u8 {
    var out: [32]u8 = undefined;
    std.mem.writeInt(u256, &out, value, .big);
    return out;
}

fn rawKey(x: u256, y: u256) [64]u8 {
    return toBytes32(x) ++ toBytes32(y);
}

/// Smallest x >= 1 on the curve, with its even-or-odd y as chosen by `odd`.
fn smallPoint(odd: bool) struct { x: u256, y: u256 } {
    var x: u256 = 1;
    while (true) : (x += 1) {
        const fe = P256.Fe.fromBytes(toBytes32(x), .big) catch unreachable;
        const y = P256.recoverY(fe, odd) catch continue;
        return .{ .x = x, .y = std.mem.readInt(u256, &y.toBytes(.big), .big) };
    }
}

test "p256 validatePublicKey accepts the generator in all encodings" {
    const raw = rawKey(P256_GX, P256_GY);
    try validatePublicKey(&raw);
    try std.testing.expect(isValidPublicKey(&raw));

    const uncompressed = [_]u8{0x04} ++ raw;
    try validatePublicKey(&uncompressed);

    const prefix: u8 = if (P256_GY & 1 == 1) 0x03 else 0x02;
    const compressed = [_]u8{prefix} ++ toBytes32(P256_GX);
    try validatePublicKey(&compressed);

    // -G, the public key of the largest private key n - 1
    try validatePublicKey(&rawKey(P256_GX, P256_P - P256_GY));
}

test "p256 validatePublicKey accepts derived keys" {
    const allocator = std.testing.allocator;
    var i: u8 = 1;
    while (i <= 16) : (i += 1) {
        const private_key = @as([32]u8, @splat(i));
        const public_key = try publicKeyFromPrivate(allocator, &private_key);
        defer allocator.free(public_key);
        try validatePublicKey(public_key);
    }
}

test "p256 validatePublicKey rejects the point at infinity" {
    const zero = @as([64]u8, @splat(0));
    try std.testing.expectError(error.IdentityElement, validatePublicKey(&zero));
    try std.testing.expect(!isValidPublicKey(&zero));
    try std.testing.expectError(error.IdentityElement, validatePublicKey(&([_]u8{0x04} ++ zero)));
    // SEC1 infinity encoding: a single 0x00 byte
    try std.testing.expectError(error.InvalidPublicKeyLength, validatePublicKey(&[_]u8{0x00}));
    // (0, 0) aliases built from p are non-canonical, not infinity
    try std.testing.expectError(error.NonCanonical, validatePublicKey(&rawKey(P256_P, P256_P)));
    try std.testing.expectError(error.NonCanonical, validatePublicKey(&rawKey(0, P256_P)));
    try std.testing.expectError(error.NonCanonical, validatePublicKey(&rawKey(P256_P, 0)));
}

test "p256 validatePublicKey rejects coordinates >= p" {
    try std.testing.expectError(error.NonCanonical, validatePublicKey(&rawKey(P256_P, P256_GY)));
    try std.testing.expectError(error.NonCanonical, validatePublicKey(&rawKey(P256_GX, P256_P)));
    try std.testing.expectError(error.NonCanonical, validatePublicKey(&(@as([64]u8, @splat(0xff)))));

    // (x + p, y) reduces to a real curve point; lax parsers accept it
    const point = smallPoint(false);
    try validatePublicKey(&rawKey(point.x, point.y));
    try std.testing.expectError(error.NonCanonical, validatePublicKey(&rawKey(point.x + P256_P, point.y)));
    try std.testing.expectError(error.NonCanonical, validatePublicKey(&([_]u8{0x04} ++ rawKey(point.x + P256_P, point.y))));
    try std.testing.expectError(error.NonCanonical, validatePublicKey(&([_]u8{0x02} ++ toBytes32(point.x + P256_P))));
}

test "p256 validatePublicKey rejects points not on the curve" {
    try std.testing.expectError(error.NotOnCurve, validatePublicKey(&rawKey(P256_GX, P256_GY + 1)));
    try std.testing.expectError(error.NotOnCurve, validatePublicKey(&rawKey(P256_GX, P256_GY - 1)));
    try std.testing.expectError(error.NotOnCurve, validatePublicKey(&rawKey(P256_GX + 1, P256_GY)));
    try std.testing.expectError(error.NotOnCurve, validatePublicKey(&rawKey(P256_GY, P256_GX)));
    // (1, 1) lies on y^2 = x^3 - 3x + 3: an invalid-curve attack point
    try std.testing.expectError(error.NotOnCurve, validatePublicKey(&rawKey(1, 1)));
    try std.testing.expectError(error.NotOnCurve, validatePublicKey(&rawKey(1, 0)));
    // Zig 0.17's P256.fromSec1 rejects (0, 1) with InvalidEncoding; validatePublicKey rejects with NotOnCurve
    const zero_one = rawKey(0, 1);
    try std.testing.expectError(error.InvalidEncoding, P256.fromSec1(&([_]u8{0x04} ++ zero_one)));
    try std.testing.expectError(error.NotOnCurve, validatePublicKey(&zero_one));
    try std.testing.expectError(error.NotOnCurve, validatePublicKey(&([_]u8{0x04} ++ zero_one)));
    // secp256k1 generator
    try std.testing.expectError(error.NotOnCurve, validatePublicKey(&rawKey(
        0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798,
        0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8,
    )));

    // Compressed x with no square root
    var x: u256 = 1;
    while (true) : (x += 1) {
        const fe = try P256.Fe.fromBytes(toBytes32(x), .big);
        _ = P256.recoverY(fe, false) catch break;
    }
    try std.testing.expectError(error.NotOnCurve, validatePublicKey(&([_]u8{0x02} ++ toBytes32(x))));
    try std.testing.expectError(error.NotOnCurve, validatePublicKey(&([_]u8{0x03} ++ toBytes32(x))));
}

test "p256 validatePublicKey accepts both roots of a compressed x" {
    const even = smallPoint(false);
    const odd = smallPoint(true);
    try std.testing.expectEqual(even.x, odd.x);
    try std.testing.expectEqual(P256_P - even.y, odd.y);
    try validatePublicKey(&([_]u8{0x02} ++ toBytes32(even.x)));
    try validatePublicKey(&([_]u8{0x03} ++ toBytes32(even.x)));
    try validatePublicKey(&rawKey(even.x, even.y));
    try validatePublicKey(&rawKey(odd.x, odd.y));
}

test "p256 validatePublicKey rejects bad SEC1 prefixes and lengths" {
    const raw = rawKey(P256_GX, P256_GY);
    for ([_]u8{ 0x00, 0x01, 0x02, 0x03, 0x05, 0x06, 0x07, 0xff }) |prefix| {
        try std.testing.expectError(error.InvalidPublicKeyPrefix, validatePublicKey(&([_]u8{prefix} ++ raw)));
    }
    for ([_]u8{ 0x00, 0x01, 0x04, 0x05, 0x06, 0x07, 0xff }) |prefix| {
        try std.testing.expectError(error.InvalidPublicKeyPrefix, validatePublicKey(&([_]u8{prefix} ++ toBytes32(P256_GX))));
    }
    const buffer = @as([128]u8, @splat(1));
    for ([_]usize{ 0, 1, 31, 32, 34, 63, 66, 96, 128 }) |len| {
        try std.testing.expectError(error.InvalidPublicKeyLength, validatePublicKey(buffer[0..len]));
        try std.testing.expect(!isValidPublicKey(buffer[0..len]));
    }
}

test "p256 ecdh rejects invalid public keys" {
    const allocator = std.testing.allocator;
    const private_key = @as([32]u8, @splat(7));
    const point = smallPoint(false);

    try std.testing.expectError(error.IdentityElement, ecdh(allocator, &private_key, &(@as([64]u8, @splat(0)))));
    try std.testing.expectError(error.NotOnCurve, ecdh(allocator, &private_key, &rawKey(P256_GX, P256_GY + 1)));
    try std.testing.expectError(error.NotOnCurve, ecdh(allocator, &private_key, &rawKey(1, 1)));
    try std.testing.expectError(error.NotOnCurve, ecdh(allocator, &private_key, &rawKey(0, 1)));
    try std.testing.expectError(error.NonCanonical, ecdh(allocator, &private_key, &rawKey(P256_P, P256_GY)));
    try std.testing.expectError(error.NonCanonical, ecdh(allocator, &private_key, &rawKey(P256_GX, P256_P)));
    try std.testing.expectError(error.NonCanonical, ecdh(allocator, &private_key, &rawKey(point.x + P256_P, point.y)));
    // Rejects wrong lengths and bad SEC1 prefixes
    try std.testing.expectError(error.InvalidPublicKeyLength, ecdh(allocator, &private_key, &(@as([63]u8, @splat(1)))));
    try std.testing.expectError(error.InvalidPublicKeyPrefix, ecdh(allocator, &private_key, &([_]u8{0x05} ++ rawKey(P256_GX, P256_GY))));

    // Valid 64-byte raw, 65-byte SEC1 uncompressed, and 33-byte SEC1 compressed keys produce identical shared secrets
    const raw_g = rawKey(P256_GX, P256_GY);
    const sec1_uncompressed = [_]u8{0x04} ++ raw_g;
    const sec1_compressed = P256.basePoint.toCompressedSec1();
    const shared_raw = try ecdh(allocator, &private_key, &raw_g);
    defer allocator.free(shared_raw);
    const shared_uncomp = try ecdh(allocator, &private_key, &sec1_uncompressed);
    defer allocator.free(shared_uncomp);
    const shared_comp = try ecdh(allocator, &private_key, &sec1_compressed);
    defer allocator.free(shared_comp);
    try std.testing.expectEqualSlices(u8, shared_raw, shared_uncomp);
    try std.testing.expectEqualSlices(u8, shared_raw, shared_comp);
}

test "p256 verify rejects invalid public keys and accepts SEC1 encodings" {
    const allocator = std.testing.allocator;
    const private_key = @as([32]u8, @splat(9));
    const hash = @as([32]u8, @splat(0xcd));
    const signature = try sign(allocator, &hash, &private_key);
    defer allocator.free(signature);
    const r = signature[0..32];
    const s = signature[32..64];

    try std.testing.expectError(error.IdentityElement, verify(&hash, r, s, &(@as([64]u8, @splat(0)))));
    try std.testing.expectError(error.NotOnCurve, verify(&hash, r, s, &rawKey(P256_GX, P256_GY + 1)));
    try std.testing.expectError(error.NotOnCurve, verify(&hash, r, s, &rawKey(0, 1)));
    try std.testing.expectError(error.NonCanonical, verify(&hash, r, s, &rawKey(P256_P, P256_GY)));
    try std.testing.expectError(error.InvalidPublicKeyLength, verify(&hash, r, s, &(@as([63]u8, @splat(1)))));
    try std.testing.expectError(error.InvalidPublicKeyPrefix, verify(&hash, r, s, &([_]u8{0x05} ++ rawKey(P256_GX, P256_GY))));

    // A valid but unrelated key verifies as false, the real key as true (raw, uncompressed SEC1, compressed SEC1)
    try std.testing.expect(!(try verify(&hash, r, s, &rawKey(P256_GX, P256_GY))));
    const public_key = try publicKeyFromPrivate(allocator, &private_key);
    defer allocator.free(public_key);
    try std.testing.expect(try verify(&hash, r, s, public_key));

    var sec1_uncompressed: [65]u8 = undefined;
    sec1_uncompressed[0] = 0x04;
    @memcpy(sec1_uncompressed[1..], public_key);
    try std.testing.expect(try verify(&hash, r, s, &sec1_uncompressed));

    const pt = try P256.fromSec1(&sec1_uncompressed);
    const sec1_compressed = pt.toCompressedSec1();
    try std.testing.expect(try verify(&hash, r, s, &sec1_compressed));

    // Zero digest signature verifies cleanly
    const zero_hash = @as([32]u8, @splat(0));
    const zero_sig = try sign(allocator, &zero_hash, &private_key);
    defer allocator.free(zero_sig);
    try std.testing.expect(try verify(&zero_hash, zero_sig[0..32], zero_sig[32..64], public_key));
}

test "Wycheproof - P-256 ECDSA signature edge cases (scalars, R.x>=n, h=0, R=O, low-s)" {
    const testing = std.testing;
    const allocator = testing.allocator;
    const max_u256 = std.math.maxInt(u256);

    // Reference NIST / Wycheproof valid signature vector
    const h = toBytes32(0xa82b78501f418ef01de9d97e884bd8fe66aa6fd438d585d5cb7fa88db3f21a40);
    const r = toBytes32(0x471c3e758c4904285bba7e53118ed0f524adeb0757d25bd2f8e7b0d76dfa714c);
    const s = toBytes32(0x091c7ae3b0636fa73f8300d67e54865d204c5487c7fe83dd1d67b0c249c433be);
    const q = rawKey(
        0x60fed4ba255a9d31c961eb74c6356d68c049b8923b61fa6ce669622e60f29fb6,
        0x7903fe1008b8bc99a41ae9e95628bc64f2f1b20c2d7e9f5177a3c294d4462299,
    );
    try testing.expect(try verify(&h, &r, &s, &q));

    // Invalid boundary scalars: 0, n, n+1, maxInt(u256)
    for ([_]u256{ 0, P256_N, P256_N + 1, max_u256 }) |bad| {
        const bad_bytes = toBytes32(bad);
        try testing.expect(!(try verify(&h, &bad_bytes, &s, &q)));
        try testing.expect(!(try verify(&h, &r, &bad_bytes, &q)));
    }

    // Bit-flipped hash, r, and s fail verification
    var bad_h = h;
    bad_h[31] ^= 1;
    try testing.expect(!(try verify(&bad_h, &r, &s, &q)));
    var bad_r = r;
    bad_r[0] ^= 0x80;
    try testing.expect(!(try verify(&h, &bad_r, &s, &q)));
    var bad_s = s;
    bad_s[15] ^= 0x04;
    try testing.expect(!(try verify(&h, &r, &bad_s, &q)));

    // R.x >= n modular reduction: point Q with Q.x = n + 3 on P-256, h = 0, r = 3, s = 3 -> R = Q
    const q_ge_n = rawKey(P256_N + 3, 0x484f0c0fda434ef0a808458914f328715d7a545e198ac7eee31dffe861b5d23f);
    const zero_h = toBytes32(0);
    const n_h = toBytes32(P256_N);
    const three = toBytes32(3);
    try testing.expect(try verify(&zero_h, &three, &three, &q_ge_n));
    try testing.expect(try verify(&n_h, &three, &three, &q_ge_n));

    // Degenerate R = O: Q = G, h = n - 1, r = 1, s = 1 -> (-1)*G + 1*G = O
    const g_raw = rawKey(P256_GX, P256_GY);
    const h_nm1 = toBytes32(P256_N - 1);
    const one = toBytes32(1);
    try testing.expect(!(try verify(&h_nm1, &one, &one, &g_raw)));

    // Low-s enforcement across multiple signatures produced by sign()
    const priv = toBytes32(0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0);
    const pub_k = try publicKeyFromPrivate(allocator, &priv);
    defer allocator.free(pub_k);
    for (0..8) |i| {
        var msg_hash = @as([32]u8, @splat(@intCast(i + 1)));
        msg_hash[0] = @intCast(i * 29);
        const sig = try sign(allocator, &msg_hash, &priv);
        defer allocator.free(sig);
        const s_val = std.mem.readInt(u256, sig[32..64], .big);
        try testing.expect(s_val > 0 and s_val <= P256_N / 2);
        try testing.expect(try verify(&msg_hash, sig[0..32], sig[32..64], pub_k));
    }
}

test "Wycheproof - P-256 ECDH boundary private keys and known-answer vectors" {
    const testing = std.testing;
    const allocator = testing.allocator;
    const g_raw = rawKey(P256_GX, P256_GY);

    // Invalid private scalars: 0, n, n+1, maxInt(u256)
    for ([_]u256{ 0, P256_N, P256_N + 1, std.math.maxInt(u256) }) |bad_priv| {
        const priv_bytes = toBytes32(bad_priv);
        try testing.expectError(
            if (bad_priv == 0) error.InvalidPrivateKey else error.NonCanonical,
            ecdh(allocator, &priv_bytes, &g_raw),
        );
    }

    // Known-answer: 1 * G has x == G.x, and (n - 1) * G = -G also has x == G.x.
    const one_priv = toBytes32(1);
    const nm1_priv = toBytes32(P256_N - 1);
    const shared_1 = try ecdh(allocator, &one_priv, &g_raw);
    defer allocator.free(shared_1);
    const shared_nm1 = try ecdh(allocator, &nm1_priv, &g_raw);
    defer allocator.free(shared_nm1);
    const gx_bytes = toBytes32(P256_GX);
    try testing.expectEqualSlices(u8, &gx_bytes, shared_1);
    try testing.expectEqualSlices(u8, &gx_bytes, shared_nm1);
}
