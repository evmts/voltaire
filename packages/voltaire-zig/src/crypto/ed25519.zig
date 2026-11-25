//! Ed25519 Digital Signature Algorithm
//!
//! High-speed, high-security signatures using the Edwards-curve Digital Signature Algorithm.
//! Re-exports and wraps Zig's standard library Ed25519 implementation.
//!
//! ## Overview
//! Ed25519 is a modern signature scheme designed by Daniel J. Bernstein providing:
//! - 128-bit security level
//! - Fast signing and verification
//! - Small keys and signatures (32 bytes each)
//! - Deterministic signatures (no random nonce required)
//!
//! ## Key Sizes
//! - Private key: 32 bytes (seed) or 64 bytes (expanded)
//! - Public key: 32 bytes
//! - Signature: 64 bytes
//!
//! ## Features
//! - Deterministic signing (no nonce required)
//! - Fast batch verification
//! - Constant-time operations (timing attack resistant)
//! - Collision-resistant hash (SHA-512)
//! - Cofactor clearing for security
//!
//! ## Usage
//! ```zig
//! const ed25519 = @import("ed25519");
//!
//! // Generate keypair from seed
//! const seed: [32]u8 = random_bytes();
//! const keypair = try ed25519.keypairFromSeed(&seed);
//!
//! // Sign message
//! const message = "Hello, Ed25519!";
//! const sig = try ed25519.sign(allocator, message, &keypair.secret_key.bytes);
//! defer allocator.free(sig);
//!
//! // Verify signature
//! const valid = try ed25519.verify(sig, message, &keypair.public_key.bytes);
//! ```
//!
//! ## Security Notes
//! - Uses Zig's audited std.crypto implementation
//! - Deterministic signatures (RFC 8032)
//! - Constant-time operations
//! - Cofactor cleared for security
//!
//! ## Use Cases
//! - Not used in Ethereum mainnet (uses secp256k1)
//! - Commonly used in other blockchains (Solana, Polkadot)
//! - General-purpose digital signatures
//!
//! ## References
//! - [RFC 8032](https://www.rfc-editor.org/rfc/rfc8032) - Ed25519 specification
//! - [Ed25519 Paper](https://ed25519.cr.yp.to/ed25519-20110926.pdf) - Original paper

const std = @import("std");
const crypto = std.crypto;

/// Ed25519 digital signature algorithm
/// Re-exports Zig's standard library Ed25519 implementation
pub const Ed25519 = crypto.sign.Ed25519;

/// Ed25519 key sizes
pub const PRIVATE_KEY_SIZE = Ed25519.SecretKey.encoded_length;
pub const PUBLIC_KEY_SIZE = Ed25519.PublicKey.encoded_length;
pub const SIGNATURE_SIZE = Ed25519.Signature.encoded_length;
pub const SEED_SIZE = Ed25519.KeyPair.seed_length;

/// Twisted Edwards form of Curve25519
pub const Curve = Ed25519.Curve;

/// Reasons an Ed25519 public key is rejected.
pub const PublicKeyError = error{
    InvalidPublicKeyLength,
    /// y >= p (RFC 8032 section 5.1.3 requires a canonical y).
    NonCanonical,
    /// No point on the curve has this y.
    InvalidEncoding,
    /// The identity or another of the 8 small-order (torsion) points.
    WeakPublicKey,
    /// On the curve but outside the prime-order subgroup (mixed order).
    UnexpectedSubgroup,
};

/// Validate an Ed25519 public key.
///
/// A key is valid only when it is 32 bytes, its y is canonical (`y < p`), it
/// decodes to a point on the curve, it is not one of the 8 small-order points
/// (identity included), and it lies in the prime-order subgroup
/// (`L * A = identity`), which also rejects mixed-order points `A + T`.
///
/// Every key produced by RFC 8032 key generation (`A = s * B`) passes. A
/// small-order key makes signatures verify for attacker-chosen messages.
///
/// Public keys are public: no constant-time requirement.
/// True when `bytes` encodes `x = 0` with the sign bit set (`y = ±1`, RFC 8032 §5.1.3).
/// Zig 0.17's `Edwards25519.fromBytes` rejects these with `error.InvalidEncoding`;
/// checking them explicitly preserves our `error.NonCanonical` contract.
fn isNegativeZeroEncoding(bytes: [PUBLIC_KEY_SIZE]u8) bool {
    if ((bytes[31] & 0x80) == 0) return false;
    var unsigned = bytes;
    unsigned[31] &= 0x7f;
    const plus_one = [_]u8{1} ++ @as([31]u8, @splat(0));
    const minus_one = [_]u8{0xec} ++ @as([30]u8, @splat(0xff)) ++ [_]u8{0x7f};
    return std.mem.eql(u8, &unsigned, &plus_one) or std.mem.eql(u8, &unsigned, &minus_one);
}

pub fn validatePublicKey(public_key: []const u8) PublicKeyError!void {
    if (public_key.len != PUBLIC_KEY_SIZE) return error.InvalidPublicKeyLength;
    const bytes = public_key[0..PUBLIC_KEY_SIZE].*;
    try Curve.rejectNonCanonical(bytes);
    if (isNegativeZeroEncoding(bytes)) return error.NonCanonical;
    const point = try Curve.fromBytes(bytes);
    // Reject non-canonical negative-zero encodings (x == 0 with sign bit 1)
    if (!std.mem.eql(u8, &point.toBytes(), &bytes)) return error.NonCanonical;
    try point.rejectLowOrder();

    // Prime-order subgroup membership: L * A must be exactly the identity.
    // Computed as (L - 1) * A + A and compared exactly. std's
    // rejectUnexpectedSubgroup is not used: it tests the result with
    // rejectIdentity, which only looks at x = 0 and so also accepts (0, -1),
    // letting A + (0, -1) through.
    const q = (point.mulPublic(subgroup_order_minus_one) catch return error.UnexpectedSubgroup).add(point);
    if (!(q.x.isZero() and q.y.equivalent(q.z))) return error.UnexpectedSubgroup;
}

/// L - 1, little-endian, where L is the order of the prime-order subgroup.
const subgroup_order_minus_one: [32]u8 = blk: {
    var out: [32]u8 = undefined;
    std.mem.writeInt(u256, &out, Curve.scalar.field_order - 1, .little);
    break :blk out;
};

/// Boolean form of `validatePublicKey`.
pub fn isValidPublicKey(public_key: []const u8) bool {
    validatePublicKey(public_key) catch return false;
    return true;
}

/// Generate keypair from seed
pub fn keypairFromSeed(seed: []const u8) !Ed25519.KeyPair {
    if (seed.len != SEED_SIZE) return error.InvalidSeedLength;
    return try Ed25519.KeyPair.generateDeterministic(seed[0..SEED_SIZE].*);
}

/// Sign a message
pub fn sign(
    allocator: std.mem.Allocator,
    message: []const u8,
    secret_key: []const u8,
) ![]u8 {
    if (secret_key.len != PRIVATE_KEY_SIZE) return error.InvalidSecretKeyLength;

    // Always rederive the keypair from the seed half and check the stored public
    // half in constant time. std's KeyPair.fromSecretKey only checks this under
    // runtime_safety, so ReleaseFast/ReleaseSmall would sign with a mismatched
    // public key, which leaks the private scalar across two signatures.
    var seed: [SEED_SIZE]u8 = secret_key[0..SEED_SIZE].*;
    defer std.crypto.secureZero(u8, &seed);
    var key_pair = try Ed25519.KeyPair.generateDeterministic(seed);
    defer std.crypto.secureZero(u8, &key_pair.secret_key.bytes);
    if (!std.crypto.timing_safe.eql([PUBLIC_KEY_SIZE]u8, key_pair.public_key.bytes, secret_key[SEED_SIZE..PRIVATE_KEY_SIZE].*)) {
        return error.KeyMismatch;
    }
    const sig = try key_pair.sign(message, null);

    const result = try allocator.alloc(u8, SIGNATURE_SIZE);
    @memcpy(result, &sig.toBytes());

    return result;
}

/// Verify a signature
///
/// Returns `error.NonCanonical` for a public key with y >= p and
/// `error.WeakPublicKey` for a small-order public key.
pub fn verify(
    signature: []const u8,
    message: []const u8,
    public_key: []const u8,
) !bool {
    if (signature.len != SIGNATURE_SIZE) return error.InvalidSignatureLength;
    if (public_key.len != PUBLIC_KEY_SIZE) return error.InvalidPublicKeyLength;

    const sig = Ed25519.Signature.fromBytes(signature[0..SIGNATURE_SIZE].*);
    const pub_key = try Ed25519.PublicKey.fromBytes(public_key[0..PUBLIC_KEY_SIZE].*);

    // Reject the identity, negative-zero, and the other small-order points: under
    // such a key a signature verifies for messages the "signer" never saw. An
    // off-curve key falls through to sig.verify, which reports it as an invalid signature.
    if (isNegativeZeroEncoding(pub_key.bytes)) return error.NonCanonical;
    if (Curve.fromBytes(pub_key.bytes)) |point| {
        if (!std.mem.eql(u8, &point.toBytes(), &pub_key.bytes)) return error.NonCanonical;
        try point.rejectLowOrder();
    } else |_| {}

    sig.verify(message, pub_key) catch return false;
    return true;
}

/// Get public key from secret key
pub fn publicKeyFromSecret(
    allocator: std.mem.Allocator,
    secret_key: []const u8,
) ![]u8 {
    if (secret_key.len != PRIVATE_KEY_SIZE) return error.InvalidSecretKeyLength;

    // Same hardening as `sign`: rederive from the seed half, wipe the copies,
    // and check the stored public half in constant time in every build mode.
    // std's KeyPair.fromSecretKey only checks it under runtime_safety and
    // leaves an unwiped secret-key copy on the stack.
    var seed: [SEED_SIZE]u8 = secret_key[0..SEED_SIZE].*;
    defer std.crypto.secureZero(u8, &seed);
    var key_pair = try Ed25519.KeyPair.generateDeterministic(seed);
    defer std.crypto.secureZero(u8, &key_pair.secret_key.bytes);
    if (!std.crypto.timing_safe.eql([PUBLIC_KEY_SIZE]u8, key_pair.public_key.bytes, secret_key[SEED_SIZE..PRIVATE_KEY_SIZE].*)) {
        return error.KeyMismatch;
    }

    const result = try allocator.alloc(u8, PUBLIC_KEY_SIZE);
    @memcpy(result, &key_pair.public_key.toBytes());

    return result;
}

test "publicKeyFromSecret rejects a mismatched public half" {
    const allocator = std.testing.allocator;

    const key_pair = try keypairFromSeed(&(@as([SEED_SIZE]u8, @splat(7))));
    var secret = key_pair.secret_key.toBytes();

    const public_key = try publicKeyFromSecret(allocator, &secret);
    defer allocator.free(public_key);
    try std.testing.expectEqualSlices(u8, &key_pair.public_key.toBytes(), public_key);

    // Flip one bit of the stored public key: must fail in every build mode.
    secret[PRIVATE_KEY_SIZE - 1] ^= 0x01;
    try std.testing.expectError(error.KeyMismatch, publicKeyFromSecret(allocator, &secret));

    // Public half from a different seed.
    const other = try keypairFromSeed(&(@as([SEED_SIZE]u8, @splat(8))));
    @memcpy(secret[SEED_SIZE..], &other.public_key.toBytes());
    try std.testing.expectError(error.KeyMismatch, publicKeyFromSecret(allocator, &secret));

    try std.testing.expectError(error.InvalidSecretKeyLength, publicKeyFromSecret(allocator, secret[0..SEED_SIZE]));
}

test "ed25519 basic" {
    const allocator = std.testing.allocator;

    // Test key generation
    const seed = @as([SEED_SIZE]u8, @splat(1));
    const key_pair = try keypairFromSeed(&seed);

    // Test signing
    const message = "test message";
    const signature = try sign(allocator, message, &key_pair.secret_key.toBytes());
    defer allocator.free(signature);

    try std.testing.expect(signature.len == SIGNATURE_SIZE);

    // Test verification
    const valid = try verify(signature, message, &key_pair.public_key.toBytes());
    try std.testing.expect(valid);

    // Test with wrong message
    const invalid = try verify(signature, "wrong message", &key_pair.public_key.toBytes());
    try std.testing.expect(!invalid);
}

test "ed25519 sign rejects a secret key whose public half does not match" {
    const allocator = std.testing.allocator;
    const key_pair = try keypairFromSeed(&(@as([SEED_SIZE]u8, @splat(7))));
    var secret = key_pair.secret_key.toBytes();
    secret[SEED_SIZE] ^= 0x01;
    try std.testing.expectError(error.KeyMismatch, sign(allocator, "msg", &secret));

    const other = try keypairFromSeed(&(@as([SEED_SIZE]u8, @splat(8))));
    @memcpy(secret[SEED_SIZE..], &other.public_key.toBytes());
    try std.testing.expectError(error.KeyMismatch, sign(allocator, "msg", &secret));
}

test "ed25519 public key derivation" {
    const allocator = std.testing.allocator;

    const seed = @as([SEED_SIZE]u8, @splat(2));
    const key_pair = try keypairFromSeed(&seed);

    const pub_key = try publicKeyFromSecret(allocator, &key_pair.secret_key.toBytes());
    defer allocator.free(pub_key);

    try std.testing.expectEqualSlices(u8, pub_key, &key_pair.public_key.toBytes());
}

// ============================================================================
// Public key validation (issue #86)
// ============================================================================

fn hexKey(comptime hex: *const [64]u8) [32]u8 {
    var out: [32]u8 = undefined;
    _ = std.fmt.hexToBytes(&out, hex) catch unreachable;
    return out;
}

const TorsionPoint = struct { order: u8, bytes: [32]u8 };

/// The 8 points of the torsion subgroup E[8], canonical encodings.
const torsion_points = [8]TorsionPoint{
    // identity (0, 1)
    .{ .order = 1, .bytes = hexKey("0100000000000000000000000000000000000000000000000000000000000000") },
    // (0, -1)
    .{ .order = 2, .bytes = hexKey("ecffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff7f") },
    // (sqrt(-1), 0)
    .{ .order = 4, .bytes = hexKey("0000000000000000000000000000000000000000000000000000000000000000") },
    // (-sqrt(-1), 0)
    .{ .order = 4, .bytes = hexKey("0000000000000000000000000000000000000000000000000000000000000080") },
    .{ .order = 8, .bytes = hexKey("26e8958fc2b227b045c3f489f2ef98f0d5dfac05d3c63339b13802886d53fc05") },
    .{ .order = 8, .bytes = hexKey("26e8958fc2b227b045c3f489f2ef98f0d5dfac05d3c63339b13802886d53fc85") },
    .{ .order = 8, .bytes = hexKey("c7176a703d4dd84fba3c0b760d10670f2a2053fa2c39ccc64ec7fd7792ac037a") },
    .{ .order = 8, .bytes = hexKey("c7176a703d4dd84fba3c0b760d10670f2a2053fa2c39ccc64ec7fd7792ac03fa") },
};

/// RFC 8032 section 7.1 public keys (TEST 1, 2, 3, SHA(abc)).
const rfc8032_public_keys = [4][32]u8{
    hexKey("d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a"),
    hexKey("3d4017c3e843895a92b70aa74d1b7ebc9c982ccf2ec4968cc0cd55f12af4660c"),
    hexKey("fc51cd8e6218a1a38da47ed00230f0580816ed13ba3303ac5deb911548908025"),
    hexKey("ec172b93ad5e563bf4932c70e1245034c35467ef2efd4d64ebf819683467e2bf"),
};

fn isIdentity(p: Curve) bool {
    return std.mem.eql(u8, &p.toBytes(), &Curve.identityElement.toBytes());
}

test "ed25519 validatePublicKey rejects all 8 small-order points" {
    for (torsion_points) |torsion| {
        try std.testing.expectError(error.WeakPublicKey, validatePublicKey(&torsion.bytes));
        try std.testing.expect(!isValidPublicKey(&torsion.bytes));
    }
}

test "ed25519 torsion vectors have the documented exact order" {
    // Independent confirmation of the vectors by repeated addition
    for (torsion_points, 0..) |torsion, i| {
        const point = try Curve.fromBytes(torsion.bytes);
        var acc = Curve.identityElement;
        var order: u8 = 0;
        var k: u8 = 1;
        while (k <= 8) : (k += 1) {
            acc = acc.add(point);
            if (isIdentity(acc)) {
                order = k;
                break;
            }
        }
        try std.testing.expectEqual(torsion.order, order);
        for (torsion_points[i + 1 ..]) |other| {
            try std.testing.expect(!std.mem.eql(u8, &torsion.bytes, &other.bytes));
        }
    }
}

test "ed25519 validatePublicKey rejects non-canonical aliases of torsion points" {
    // x = 0 with the sign bit set: non-canonical negative-zero encoding (RFC 8032 §5.1.3)
    try std.testing.expectError(error.NonCanonical, validatePublicKey(&hexKey("0100000000000000000000000000000000000000000000000000000000000080")));
    try std.testing.expectError(error.NonCanonical, validatePublicKey(&hexKey("ecffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")));
    // y = p and y = p + 1, with and without the sign bit
    try std.testing.expectError(error.NonCanonical, validatePublicKey(&hexKey("edffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff7f")));
    try std.testing.expectError(error.NonCanonical, validatePublicKey(&hexKey("edffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")));
    try std.testing.expectError(error.NonCanonical, validatePublicKey(&hexKey("eeffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff7f")));
    try std.testing.expectError(error.NonCanonical, validatePublicKey(&hexKey("eeffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")));
}

test "ed25519 validatePublicKey rejects every y in [p, 2^255 - 1]" {
    // p = 2^255 - 19: the 19 non-canonical values are 0xed..0xff in byte 0
    var low: u16 = 0xed;
    while (low <= 0xff) : (low += 1) {
        var key = @as([32]u8, @splat(0xff));
        key[0] = @intCast(low);
        key[31] = 0x7f;
        try std.testing.expectError(error.NonCanonical, validatePublicKey(&key));
        key[31] = 0xff;
        try std.testing.expectError(error.NonCanonical, validatePublicKey(&key));
    }
    // The largest canonical y, p - 1, is (0, -1): canonical but small-order
    var max = @as([32]u8, @splat(0xff));
    max[0] = 0xec;
    max[31] = 0x7f;
    try std.testing.expectError(error.WeakPublicKey, validatePublicKey(&max));
}

test "ed25519 validatePublicKey rejects points not on the curve" {
    var found: usize = 0;
    var y: u8 = 2;
    while (found < 8) : (y += 1) {
        var key = @as([32]u8, @splat(0));
        key[0] = y;
        if (Curve.fromBytes(key)) |_| continue else |_| {}
        found += 1;
        try std.testing.expectError(error.InvalidEncoding, validatePublicKey(&key));
        key[31] = 0x80;
        try std.testing.expectError(error.InvalidEncoding, validatePublicKey(&key));
    }
}

test "ed25519 validatePublicKey rejects mixed-order points" {
    const valid = try Curve.fromBytes(rfc8032_public_keys[0]);
    for (torsion_points) |torsion| {
        if (torsion.order == 1) continue;
        const mixed = valid.add(try Curve.fromBytes(torsion.bytes));
        const bytes = mixed.toBytes();
        // On the curve, canonical, not small-order: only the subgroup check rejects it
        try Curve.rejectNonCanonical(bytes);
        try mixed.rejectLowOrder();
        try std.testing.expectError(error.UnexpectedSubgroup, validatePublicKey(&bytes));
        try std.testing.expect(!isValidPublicKey(&bytes));
    }
}

test "ed25519 validatePublicKey catches the order-2 mix" {
    const valid = try Curve.fromBytes(rfc8032_public_keys[0]);
    const mixed = valid.add(try Curve.fromBytes(torsion_points[1].bytes));
    try std.testing.expectEqual(@as(u8, 2), torsion_points[1].order);
    // Zig 0.17 fixed std.crypto's subgroup check to reject A + (0, -1) as well.
    try std.testing.expectError(error.UnexpectedSubgroup, mixed.rejectUnexpectedSubgroup());
    try std.testing.expectError(error.UnexpectedSubgroup, validatePublicKey(&mixed.toBytes()));
}

test "ed25519 validatePublicKey accepts RFC 8032 keys, the base point and derived keys" {
    for (rfc8032_public_keys) |key| {
        try validatePublicKey(&key);
        try std.testing.expect(isValidPublicKey(&key));
    }
    try validatePublicKey(&Curve.basePoint.toBytes());

    var i: u8 = 0;
    while (i < 32) : (i += 1) {
        const key_pair = try keypairFromSeed(&(@as([SEED_SIZE]u8, @splat(i))));
        try validatePublicKey(&key_pair.public_key.toBytes());
    }
}

test "ed25519 validatePublicKey rejects wrong lengths" {
    const buffer = @as([64]u8, @splat(1));
    for ([_]usize{ 0, 1, 31, 33, 64 }) |len| {
        try std.testing.expectError(error.InvalidPublicKeyLength, validatePublicKey(buffer[0..len]));
        try std.testing.expect(!isValidPublicKey(buffer[0..len]));
    }
}

test "ed25519 RFC 8032 TEST 1 and TEST 2 signatures still verify" {
    var sig1: [64]u8 = undefined;
    _ = try std.fmt.hexToBytes(&sig1, "e5564300c360ac729086e2cc806e828a84877f1eb8e5d974d873e065224901555fb8821590a33bacc61e39701cf9b46bd25bf5f0595bbe24655141438e7a100b");
    try std.testing.expect(try verify(&sig1, "", &rfc8032_public_keys[0]));

    var sig2: [64]u8 = undefined;
    _ = try std.fmt.hexToBytes(&sig2, "92a009a9f0d4cab8720e820b5f642540a2b27b5416503f8fb3762223ebdb69da085ac1e43e15996e458f3613d0f11d8c387b2eaeb4302aeeb00d291612bb0c00");
    try std.testing.expect(try verify(&sig2, &[_]u8{0x72}, &rfc8032_public_keys[1]));
    try std.testing.expect(!(try verify(&sig2, &[_]u8{0x73}, &rfc8032_public_keys[1])));
}

test "ed25519 verify rejects small-order public keys" {
    // R = identity, S = 0: the universal forgery under a small-order key
    var forged = @as([64]u8, @splat(0));
    forged[0] = 1;
    for (torsion_points) |torsion| {
        try std.testing.expectError(error.WeakPublicKey, verify(&forged, "any message", &torsion.bytes));
    }
    // Non-canonical y and negative-zero encodings report NonCanonical
    try std.testing.expectError(error.NonCanonical, verify(&forged, "m", &hexKey("eeffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff7f")));
    try std.testing.expectError(error.NonCanonical, verify(&forged, "m", &hexKey("0100000000000000000000000000000000000000000000000000000000000080")));
    try std.testing.expectError(error.NonCanonical, verify(&forged, "m", &hexKey("ecffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")));
}
