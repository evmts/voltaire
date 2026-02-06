//! BLS12-381 Cryptography Module
//!
//! Comprehensive BLS12-381 elliptic curve operations for Ethereum consensus layer.
//! Uses the blst library (supranational/blst) for production-grade cryptographic operations.
//!
//! ## Overview
//! BLS12-381 is a pairing-friendly curve used in:
//! - Ethereum 2.0 Beacon Chain validator signatures
//! - Signature aggregation schemes
//! - Zero-knowledge proofs (zk-SNARKs)
//! - Threshold cryptography
//!
//! ## Signature Schemes
//! Two variants supported:
//! - **minimal-pubkey-size**: Public keys in G1 (48 bytes), signatures in G2 (96 bytes)
//! - **minimal-signature-size**: Public keys in G2 (96 bytes), signatures in G1 (48 bytes)
//!
//! This module defaults to minimal-pubkey-size (Ethereum 2.0 standard).
//!
//! ## Usage
//! ```zig
//! const bls = @import("bls12_381.zig");
//!
//! // Key generation
//! const sk = try bls.SecretKey.generate();
//! const pk = sk.toPublicKey();
//!
//! // Signing
//! const sig = try bls.sign(&sk, message, dst);
//!
//! // Verification
//! const valid = try bls.verify(&sig, &pk, message, dst);
//!
//! // Aggregation
//! const agg_sig = try bls.aggregateSignatures(&[_]*const bls.Signature{&sig1, &sig2});
//! const valid_agg = try bls.verifyAggregate(&agg_sig, &[_]*const bls.PublicKey{&pk1, &pk2}, message, dst);
//! ```
//!
//! ## Security Notes
//! - Always use hash_or_encode=true for production (hash-to-curve)
//! - Use domain separation tags (DST) to prevent cross-protocol attacks
//! - Validate all points before use
//! - Protect secret keys in memory
//!
//! ## References
//! - [BLS12-381 Spec](https://hackmd.io/@benjaminion/bls12-381)
//! - [EIP-2333](https://eips.ethereum.org/EIPS/eip-2333) - Key derivation
//! - [EIP-2537](https://eips.ethereum.org/EIPS/eip-2537) - BLS precompiles
//! - [IETF BLS Signatures](https://datatracker.ietf.org/doc/draft-irtf-cfrg-bls-signature/)

const std = @import("std");
const testing = std.testing;
const builtin = @import("builtin");

// Import blst bindings from c_kzg module
const c_kzg = if (builtin.target.cpu.arch != .wasm32) @import("c_kzg") else struct {
    pub const blst = struct {};
};
const blst = c_kzg.blst;

/// BLS12-381 error types
pub const Error = error{
    /// Invalid secret key (zero or >= curve order)
    InvalidSecretKey,
    /// Invalid public key (not on curve or not in G1)
    InvalidPublicKey,
    /// Invalid signature (not on curve or not in G2)
    InvalidSignature,
    /// Point not on curve
    PointNotOnCurve,
    /// Point not in correct subgroup
    PointNotInGroup,
    /// Aggregation type mismatch
    AggregationTypeMismatch,
    /// Verification failed
    VerificationFailed,
    /// Public key is infinity point
    PublicKeyIsInfinity,
    /// Bad scalar value
    BadScalar,
    /// Invalid input length
    InvalidInputLength,
    /// Empty input
    EmptyInput,
    /// Operation not supported on WASM
    NotSupported,
};

/// Domain Separation Tags (DST) for Ethereum
pub const DST = struct {
    /// Ethereum 2.0 BLS signature DST
    pub const ETH2_SIGNATURE: []const u8 = "BLS_SIG_BLS12381G2_XMD:SHA-256_SSWU_RO_POP_";
    /// Ethereum 2.0 proof of possession DST
    pub const ETH2_POP: []const u8 = "BLS_POP_BLS12381G2_XMD:SHA-256_SSWU_RO_POP_";
};

/// BLS12-381 constants
pub const Constants = struct {
    /// Size of secret key in bytes
    pub const SECRET_KEY_SIZE: usize = 32;
    /// Size of compressed public key (G1) in bytes
    pub const PUBLIC_KEY_COMPRESSED_SIZE: usize = 48;
    /// Size of uncompressed public key (G1) in bytes
    pub const PUBLIC_KEY_UNCOMPRESSED_SIZE: usize = 96;
    /// Size of compressed signature (G2) in bytes
    pub const SIGNATURE_COMPRESSED_SIZE: usize = 96;
    /// Size of uncompressed signature (G2) in bytes
    pub const SIGNATURE_UNCOMPRESSED_SIZE: usize = 192;
    /// Base field modulus p (381 bits)
    pub const FP_MODULUS = 0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaab;
    /// Scalar field modulus r (curve order, 255 bits)
    pub const FR_MODULUS = 0x73eda753299d7d483339d80809a1d80553bda402fffe5bfeffffffff00000001;
};

/// Secret key for BLS12-381 (32-byte scalar)
pub const SecretKey = struct {
    data: blst.blst_scalar,

    /// Generate a new random secret key
    pub fn generate() Error!SecretKey {
        if (builtin.target.cpu.arch == .wasm32) return Error.NotSupported;

        var ikm: [32]u8 = undefined;
        std.crypto.random.bytes(&ikm);

        var sk: blst.blst_scalar = undefined;
        blst.blst_keygen(&sk, &ikm, ikm.len, null, 0);

        // Clear IKM from memory
        @memset(&ikm, 0);

        if (!blst.blst_sk_check(&sk)) {
            return Error.InvalidSecretKey;
        }

        return SecretKey{ .data = sk };
    }

    /// Create secret key from 32 bytes (big-endian)
    pub fn fromBytes(bytes: *const [32]u8) Error!SecretKey {
        if (builtin.target.cpu.arch == .wasm32) return Error.NotSupported;

        var sk: blst.blst_scalar = undefined;
        blst.blst_scalar_from_bendian(&sk, bytes);

        if (!blst.blst_sk_check(&sk)) {
            return Error.InvalidSecretKey;
        }

        return SecretKey{ .data = sk };
    }

    /// Serialize secret key to 32 bytes (big-endian)
    pub fn toBytes(self: *const SecretKey) [32]u8 {
        var out: [32]u8 = undefined;
        blst.blst_bendian_from_scalar(&out, &self.data);
        return out;
    }

    /// Derive public key from secret key (minimal-pubkey-size: PK in G1)
    pub fn toPublicKey(self: *const SecretKey) PublicKey {
        if (builtin.target.cpu.arch == .wasm32) @panic("WASM not supported");

        var pk: blst.blst_p1 = undefined;
        blst.blst_sk_to_pk_in_g1(&pk, &self.data);

        return PublicKey{ .point = pk };
    }

    /// Clear secret key from memory
    pub fn clear(self: *SecretKey) void {
        @memset(std.mem.asBytes(&self.data), 0);
    }
};

/// Public key for BLS12-381 (G1 point, minimal-pubkey-size scheme)
pub const PublicKey = struct {
    point: blst.blst_p1,

    /// Deserialize compressed public key (48 bytes)
    pub fn fromCompressed(bytes: *const [48]u8) Error!PublicKey {
        if (builtin.target.cpu.arch == .wasm32) return Error.NotSupported;

        var affine: blst.blst_p1_affine = undefined;
        const ret = blst.blst_p1_uncompress(&affine, bytes);

        if (ret != blst.BLST_SUCCESS) {
            return switch (ret) {
                blst.BLST_BAD_ENCODING => Error.InvalidPublicKey,
                blst.BLST_POINT_NOT_ON_CURVE => Error.PointNotOnCurve,
                blst.BLST_POINT_NOT_IN_GROUP => Error.PointNotInGroup,
                else => Error.InvalidPublicKey,
            };
        }

        // Validate point is in G1 subgroup
        if (!blst.blst_p1_affine_in_g1(&affine)) {
            return Error.PointNotInGroup;
        }

        var point: blst.blst_p1 = undefined;
        blst.blst_p1_from_affine(&point, &affine);

        return PublicKey{ .point = point };
    }

    /// Deserialize uncompressed public key (96 bytes)
    pub fn fromUncompressed(bytes: *const [96]u8) Error!PublicKey {
        if (builtin.target.cpu.arch == .wasm32) return Error.NotSupported;

        var affine: blst.blst_p1_affine = undefined;
        const ret = blst.blst_p1_deserialize(&affine, bytes);

        if (ret != blst.BLST_SUCCESS) {
            return switch (ret) {
                blst.BLST_BAD_ENCODING => Error.InvalidPublicKey,
                blst.BLST_POINT_NOT_ON_CURVE => Error.PointNotOnCurve,
                blst.BLST_POINT_NOT_IN_GROUP => Error.PointNotInGroup,
                else => Error.InvalidPublicKey,
            };
        }

        if (!blst.blst_p1_affine_in_g1(&affine)) {
            return Error.PointNotInGroup;
        }

        var point: blst.blst_p1 = undefined;
        blst.blst_p1_from_affine(&point, &affine);

        return PublicKey{ .point = point };
    }

    /// Serialize to compressed form (48 bytes)
    pub fn toCompressed(self: *const PublicKey) [48]u8 {
        var out: [48]u8 = undefined;
        blst.blst_p1_compress(&out, &self.point);
        return out;
    }

    /// Serialize to uncompressed form (96 bytes)
    pub fn toUncompressed(self: *const PublicKey) [96]u8 {
        var out: [96]u8 = undefined;
        blst.blst_p1_serialize(&out, &self.point);
        return out;
    }

    /// Check if public key is the identity/infinity point
    pub fn isInfinity(self: *const PublicKey) bool {
        return blst.blst_p1_is_inf(&self.point);
    }

    /// Check if two public keys are equal
    pub fn isEqual(self: *const PublicKey, other: *const PublicKey) bool {
        return blst.blst_p1_is_equal(&self.point, &other.point);
    }

    /// Validate that public key is on curve and in correct subgroup
    pub fn validate(self: *const PublicKey) Error!void {
        if (!blst.blst_p1_on_curve(&self.point)) {
            return Error.PointNotOnCurve;
        }
        if (!blst.blst_p1_in_g1(&self.point)) {
            return Error.PointNotInGroup;
        }
        if (blst.blst_p1_is_inf(&self.point)) {
            return Error.PublicKeyIsInfinity;
        }
    }
};

/// Signature for BLS12-381 (G2 point, minimal-pubkey-size scheme)
pub const Signature = struct {
    point: blst.blst_p2,

    /// Deserialize compressed signature (96 bytes)
    pub fn fromCompressed(bytes: *const [96]u8) Error!Signature {
        if (builtin.target.cpu.arch == .wasm32) return Error.NotSupported;

        var affine: blst.blst_p2_affine = undefined;
        const ret = blst.blst_p2_uncompress(&affine, bytes);

        if (ret != blst.BLST_SUCCESS) {
            return switch (ret) {
                blst.BLST_BAD_ENCODING => Error.InvalidSignature,
                blst.BLST_POINT_NOT_ON_CURVE => Error.PointNotOnCurve,
                blst.BLST_POINT_NOT_IN_GROUP => Error.PointNotInGroup,
                else => Error.InvalidSignature,
            };
        }

        if (!blst.blst_p2_affine_in_g2(&affine)) {
            return Error.PointNotInGroup;
        }

        var point: blst.blst_p2 = undefined;
        blst.blst_p2_from_affine(&point, &affine);

        return Signature{ .point = point };
    }

    /// Deserialize uncompressed signature (192 bytes)
    pub fn fromUncompressed(bytes: *const [192]u8) Error!Signature {
        if (builtin.target.cpu.arch == .wasm32) return Error.NotSupported;

        var affine: blst.blst_p2_affine = undefined;
        const ret = blst.blst_p2_deserialize(&affine, bytes);

        if (ret != blst.BLST_SUCCESS) {
            return switch (ret) {
                blst.BLST_BAD_ENCODING => Error.InvalidSignature,
                blst.BLST_POINT_NOT_ON_CURVE => Error.PointNotOnCurve,
                blst.BLST_POINT_NOT_IN_GROUP => Error.PointNotInGroup,
                else => Error.InvalidSignature,
            };
        }

        if (!blst.blst_p2_affine_in_g2(&affine)) {
            return Error.PointNotInGroup;
        }

        var point: blst.blst_p2 = undefined;
        blst.blst_p2_from_affine(&point, &affine);

        return Signature{ .point = point };
    }

    /// Serialize to compressed form (96 bytes)
    pub fn toCompressed(self: *const Signature) [96]u8 {
        var out: [96]u8 = undefined;
        blst.blst_p2_compress(&out, &self.point);
        return out;
    }

    /// Serialize to uncompressed form (192 bytes)
    pub fn toUncompressed(self: *const Signature) [192]u8 {
        var out: [192]u8 = undefined;
        blst.blst_p2_serialize(&out, &self.point);
        return out;
    }

    /// Check if signature is the identity/infinity point
    pub fn isInfinity(self: *const Signature) bool {
        return blst.blst_p2_is_inf(&self.point);
    }

    /// Check if two signatures are equal
    pub fn isEqual(self: *const Signature, other: *const Signature) bool {
        return blst.blst_p2_is_equal(&self.point, &other.point);
    }

    /// Validate that signature is on curve and in correct subgroup
    pub fn validate(self: *const Signature) Error!void {
        if (!blst.blst_p2_on_curve(&self.point)) {
            return Error.PointNotOnCurve;
        }
        if (!blst.blst_p2_in_g2(&self.point)) {
            return Error.PointNotInGroup;
        }
    }
};

/// Sign a message using secret key (minimal-pubkey-size: signature in G2)
/// Uses hash-to-curve to map message to G2 point, then multiplies by secret key.
pub fn sign(sk: *const SecretKey, message: []const u8, dst: []const u8) Error!Signature {
    if (builtin.target.cpu.arch == .wasm32) return Error.NotSupported;

    // Hash message to G2 point
    var hash_point: blst.blst_p2 = undefined;
    blst.blst_hash_to_g2(&hash_point, message.ptr, message.len, dst.ptr, dst.len, null, 0);

    // Multiply hash point by secret key to get signature
    var sig_point: blst.blst_p2 = undefined;
    blst.blst_sign_pk_in_g1(&sig_point, &hash_point, &sk.data);

    return Signature{ .point = sig_point };
}

/// Verify a signature against a public key and message
pub fn verify(sig: *const Signature, pk: *const PublicKey, message: []const u8, dst: []const u8) Error!bool {
    if (builtin.target.cpu.arch == .wasm32) return Error.NotSupported;

    // Validate public key
    try pk.validate();

    // Get affine representations
    var pk_affine: blst.blst_p1_affine = undefined;
    blst.blst_p1_to_affine(&pk_affine, &pk.point);

    var sig_affine: blst.blst_p2_affine = undefined;
    blst.blst_p2_to_affine(&sig_affine, &sig.point);

    // Verify using core_verify
    const ret = blst.blst_core_verify_pk_in_g1(
        &pk_affine,
        &sig_affine,
        true, // hash_or_encode = true for hash-to-curve
        message.ptr,
        message.len,
        dst.ptr,
        dst.len,
        null,
        0,
    );

    return ret == blst.BLST_SUCCESS;
}

/// Aggregate multiple signatures into one
pub fn aggregateSignatures(signatures: []const *const Signature) Error!Signature {
    if (builtin.target.cpu.arch == .wasm32) return Error.NotSupported;
    if (signatures.len == 0) return Error.EmptyInput;

    var agg = signatures[0].point;

    for (signatures[1..]) |sig| {
        blst.blst_p2_add_or_double(&agg, &agg, &sig.point);
    }

    return Signature{ .point = agg };
}

/// Aggregate multiple public keys into one
pub fn aggregatePublicKeys(public_keys: []const *const PublicKey) Error!PublicKey {
    if (builtin.target.cpu.arch == .wasm32) return Error.NotSupported;
    if (public_keys.len == 0) return Error.EmptyInput;

    var agg = public_keys[0].point;

    for (public_keys[1..]) |pk| {
        blst.blst_p1_add_or_double(&agg, &agg, &pk.point);
    }

    return PublicKey{ .point = agg };
}

/// Verify an aggregated signature against multiple public keys (same message)
/// All signers signed the same message.
pub fn verifyAggregate(
    agg_sig: *const Signature,
    public_keys: []const *const PublicKey,
    message: []const u8,
    dst: []const u8,
) Error!bool {
    if (builtin.target.cpu.arch == .wasm32) return Error.NotSupported;
    if (public_keys.len == 0) return Error.EmptyInput;

    // Aggregate public keys
    const agg_pk = try aggregatePublicKeys(public_keys);

    // Verify against aggregated public key
    return verify(agg_sig, &agg_pk, message, dst);
}

/// Batch verify multiple signatures on different messages
/// Returns true only if ALL signatures are valid.
pub fn batchVerify(
    signatures: []const *const Signature,
    public_keys: []const *const PublicKey,
    messages: []const []const u8,
    dst: []const u8,
) Error!bool {
    if (builtin.target.cpu.arch == .wasm32) return Error.NotSupported;
    if (signatures.len == 0) return Error.EmptyInput;
    if (signatures.len != public_keys.len or signatures.len != messages.len) {
        return Error.InvalidInputLength;
    }

    // For batch verification, we use the pairing check:
    // prod(e(sig_i, G2_gen)) == prod(e(H(msg_i), pk_i))
    // Which is equivalent to checking:
    // e(agg_sig, G2_gen) * prod(e(-H(msg_i), pk_i)) == 1

    // Get pairing context size
    const ctx_size = blst.blst_pairing_sizeof();
    var ctx_bytes: [8192]u8 = undefined; // Enough for typical pairing context
    if (ctx_size > ctx_bytes.len) {
        // Fallback to individual verification if context too large
        for (signatures, public_keys, messages) |sig, pk, msg| {
            const valid = try verify(sig, pk, msg, dst);
            if (!valid) return false;
        }
        return true;
    }

    const ctx: *blst.blst_pairing = @ptrCast(@alignCast(&ctx_bytes));

    // Initialize pairing context
    blst.blst_pairing_init(ctx, true, dst.ptr, dst.len);

    // Add each (signature, public key, message) triple
    for (signatures, public_keys, messages) |sig, pk, msg| {
        var pk_affine: blst.blst_p1_affine = undefined;
        blst.blst_p1_to_affine(&pk_affine, &pk.point);

        var sig_affine: blst.blst_p2_affine = undefined;
        blst.blst_p2_to_affine(&sig_affine, &sig.point);

        const ret = blst.blst_pairing_aggregate_pk_in_g1(
            ctx,
            &pk_affine,
            &sig_affine,
            msg.ptr,
            msg.len,
            null,
            0,
        );

        if (ret != blst.BLST_SUCCESS) {
            return false;
        }
    }

    // Commit and verify
    blst.blst_pairing_commit(ctx);
    return blst.blst_pairing_finalverify(ctx, null);
}

// ============================================================================
// G1 Point Operations (for advanced users)
// ============================================================================

/// G1 point (minimal-pubkey-size: used for public keys)
pub const G1Point = struct {
    point: blst.blst_p1,

    /// Generator point G1
    pub fn generator() G1Point {
        return G1Point{ .point = blst.blst_p1_generator().* };
    }

    /// Identity/infinity point
    pub fn infinity() G1Point {
        var p: blst.blst_p1 = undefined;
        @memset(std.mem.asBytes(&p), 0);
        return G1Point{ .point = p };
    }

    /// Add two G1 points
    pub fn add(self: *const G1Point, other: *const G1Point) G1Point {
        var result: blst.blst_p1 = undefined;
        blst.blst_p1_add_or_double(&result, &self.point, &other.point);
        return G1Point{ .point = result };
    }

    /// Double a G1 point
    pub fn double(self: *const G1Point) G1Point {
        var result: blst.blst_p1 = undefined;
        blst.blst_p1_double(&result, &self.point);
        return G1Point{ .point = result };
    }

    /// Negate a G1 point
    pub fn negate(self: *const G1Point) G1Point {
        var result = self.point;
        blst.blst_p1_cneg(&result, true);
        return G1Point{ .point = result };
    }

    /// Scalar multiplication
    pub fn mul(self: *const G1Point, scalar: *const [32]u8) G1Point {
        var result: blst.blst_p1 = undefined;
        blst.blst_p1_mult(&result, &self.point, scalar, 256);
        return G1Point{ .point = result };
    }

    /// Check if point is on curve
    pub fn isOnCurve(self: *const G1Point) bool {
        return blst.blst_p1_on_curve(&self.point);
    }

    /// Check if point is in G1 subgroup
    pub fn isInGroup(self: *const G1Point) bool {
        return blst.blst_p1_in_g1(&self.point);
    }

    /// Check if point is infinity
    pub fn isInfinity(self: *const G1Point) bool {
        return blst.blst_p1_is_inf(&self.point);
    }

    /// Serialize to compressed form (48 bytes)
    pub fn toCompressed(self: *const G1Point) [48]u8 {
        var out: [48]u8 = undefined;
        blst.blst_p1_compress(&out, &self.point);
        return out;
    }

    /// Deserialize from compressed form (48 bytes)
    pub fn fromCompressed(bytes: *const [48]u8) Error!G1Point {
        if (builtin.target.cpu.arch == .wasm32) return Error.NotSupported;

        var affine: blst.blst_p1_affine = undefined;
        const ret = blst.blst_p1_uncompress(&affine, bytes);

        if (ret != blst.BLST_SUCCESS) {
            return Error.InvalidPublicKey;
        }

        var point: blst.blst_p1 = undefined;
        blst.blst_p1_from_affine(&point, &affine);

        return G1Point{ .point = point };
    }
};

// ============================================================================
// G2 Point Operations (for advanced users)
// ============================================================================

/// G2 point (minimal-pubkey-size: used for signatures)
pub const G2Point = struct {
    point: blst.blst_p2,

    /// Generator point G2
    pub fn generator() G2Point {
        return G2Point{ .point = blst.blst_p2_generator().* };
    }

    /// Identity/infinity point
    pub fn infinity() G2Point {
        var p: blst.blst_p2 = undefined;
        @memset(std.mem.asBytes(&p), 0);
        return G2Point{ .point = p };
    }

    /// Add two G2 points
    pub fn add(self: *const G2Point, other: *const G2Point) G2Point {
        var result: blst.blst_p2 = undefined;
        blst.blst_p2_add_or_double(&result, &self.point, &other.point);
        return G2Point{ .point = result };
    }

    /// Double a G2 point
    pub fn double(self: *const G2Point) G2Point {
        var result: blst.blst_p2 = undefined;
        blst.blst_p2_double(&result, &self.point);
        return G2Point{ .point = result };
    }

    /// Negate a G2 point
    pub fn negate(self: *const G2Point) G2Point {
        var result = self.point;
        blst.blst_p2_cneg(&result, true);
        return G2Point{ .point = result };
    }

    /// Scalar multiplication
    pub fn mul(self: *const G2Point, scalar: *const [32]u8) G2Point {
        var result: blst.blst_p2 = undefined;
        blst.blst_p2_mult(&result, &self.point, scalar, 256);
        return G2Point{ .point = result };
    }

    /// Check if point is on curve
    pub fn isOnCurve(self: *const G2Point) bool {
        return blst.blst_p2_on_curve(&self.point);
    }

    /// Check if point is in G2 subgroup
    pub fn isInGroup(self: *const G2Point) bool {
        return blst.blst_p2_in_g2(&self.point);
    }

    /// Check if point is infinity
    pub fn isInfinity(self: *const G2Point) bool {
        return blst.blst_p2_is_inf(&self.point);
    }

    /// Serialize to compressed form (96 bytes)
    pub fn toCompressed(self: *const G2Point) [96]u8 {
        var out: [96]u8 = undefined;
        blst.blst_p2_compress(&out, &self.point);
        return out;
    }

    /// Deserialize from compressed form (96 bytes)
    pub fn fromCompressed(bytes: *const [96]u8) Error!G2Point {
        if (builtin.target.cpu.arch == .wasm32) return Error.NotSupported;

        var affine: blst.blst_p2_affine = undefined;
        const ret = blst.blst_p2_uncompress(&affine, bytes);

        if (ret != blst.BLST_SUCCESS) {
            return Error.InvalidSignature;
        }

        var point: blst.blst_p2 = undefined;
        blst.blst_p2_from_affine(&point, &affine);

        return G2Point{ .point = point };
    }

    /// Hash message to G2 point (hash-to-curve)
    pub fn hashToG2(message: []const u8, dst: []const u8) G2Point {
        var point: blst.blst_p2 = undefined;
        blst.blst_hash_to_g2(&point, message.ptr, message.len, dst.ptr, dst.len, null, 0);
        return G2Point{ .point = point };
    }
};

// ============================================================================
// Pairing Operations
// ============================================================================

/// Pairing result (Fp12 element)
pub const PairingResult = struct {
    data: blst.blst_fp12,

    /// Check if pairing result is one (identity in GT)
    pub fn isOne(self: *const PairingResult) bool {
        return blst.blst_fp12_is_one(&self.data);
    }

    /// Check if two pairing results are equal
    pub fn isEqual(self: *const PairingResult, other: *const PairingResult) bool {
        return blst.blst_fp12_is_equal(&self.data, &other.data);
    }

    /// Multiply two pairing results
    pub fn mul(self: *const PairingResult, other: *const PairingResult) PairingResult {
        var result: blst.blst_fp12 = undefined;
        blst.blst_fp12_mul(&result, &self.data, &other.data);
        return PairingResult{ .data = result };
    }
};

/// Compute pairing e(P, Q) where P is G1, Q is G2
pub fn pairing(p: *const G1Point, q: *const G2Point) PairingResult {
    var p_affine: blst.blst_p1_affine = undefined;
    blst.blst_p1_to_affine(&p_affine, &p.point);

    var q_affine: blst.blst_p2_affine = undefined;
    blst.blst_p2_to_affine(&q_affine, &q.point);

    var result: blst.blst_fp12 = undefined;
    blst.blst_miller_loop(&result, &q_affine, &p_affine);

    var final_result: blst.blst_fp12 = undefined;
    blst.blst_final_exp(&final_result, &result);

    return PairingResult{ .data = final_result };
}

/// Pairing check: verify that e(P1, Q1) * e(P2, Q2) * ... == 1
/// This is more efficient than computing individual pairings.
pub fn pairingCheck(
    g1_points: []const *const G1Point,
    g2_points: []const *const G2Point,
) Error!bool {
    if (builtin.target.cpu.arch == .wasm32) return Error.NotSupported;
    if (g1_points.len != g2_points.len) return Error.InvalidInputLength;
    if (g1_points.len == 0) return true; // Empty pairing is 1

    var acc: blst.blst_fp12 = undefined;

    for (g1_points, g2_points, 0..) |p1, p2, i| {
        var p1_affine: blst.blst_p1_affine = undefined;
        blst.blst_p1_to_affine(&p1_affine, &p1.point);

        var p2_affine: blst.blst_p2_affine = undefined;
        blst.blst_p2_to_affine(&p2_affine, &p2.point);

        var loop_result: blst.blst_fp12 = undefined;
        blst.blst_miller_loop(&loop_result, &p2_affine, &p1_affine);

        if (i == 0) {
            acc = loop_result;
        } else {
            var temp: blst.blst_fp12 = undefined;
            blst.blst_fp12_mul(&temp, &acc, &loop_result);
            acc = temp;
        }
    }

    var final_result: blst.blst_fp12 = undefined;
    blst.blst_final_exp(&final_result, &acc);

    return blst.blst_fp12_is_one(&final_result);
}

// ============================================================================
// Tests
// ============================================================================

test "secret key generation" {
    if (builtin.target.cpu.arch == .wasm32) return error.SkipZigTest;

    const sk = try SecretKey.generate();
    const bytes = sk.toBytes();

    // Should not be all zeros
    var all_zero = true;
    for (bytes) |b| {
        if (b != 0) {
            all_zero = false;
            break;
        }
    }
    try testing.expect(!all_zero);
}

test "secret key from bytes roundtrip" {
    if (builtin.target.cpu.arch == .wasm32) return error.SkipZigTest;

    const sk = try SecretKey.generate();
    const bytes = sk.toBytes();
    const sk2 = try SecretKey.fromBytes(&bytes);
    const bytes2 = sk2.toBytes();

    try testing.expectEqualSlices(u8, &bytes, &bytes2);
}

test "public key derivation" {
    if (builtin.target.cpu.arch == .wasm32) return error.SkipZigTest;

    const sk = try SecretKey.generate();
    const pk = sk.toPublicKey();

    // Public key should not be infinity
    try testing.expect(!pk.isInfinity());

    // Should validate
    try pk.validate();
}

test "public key serialization roundtrip" {
    if (builtin.target.cpu.arch == .wasm32) return error.SkipZigTest;

    const sk = try SecretKey.generate();
    const pk = sk.toPublicKey();

    // Compressed roundtrip
    const compressed = pk.toCompressed();
    const pk_compressed = try PublicKey.fromCompressed(&compressed);
    try testing.expect(pk.isEqual(&pk_compressed));

    // Uncompressed roundtrip
    const uncompressed = pk.toUncompressed();
    const pk_uncompressed = try PublicKey.fromUncompressed(&uncompressed);
    try testing.expect(pk.isEqual(&pk_uncompressed));
}

test "sign and verify" {
    if (builtin.target.cpu.arch == .wasm32) return error.SkipZigTest;

    const sk = try SecretKey.generate();
    const pk = sk.toPublicKey();

    const message = "Hello, BLS12-381!";
    const dst = DST.ETH2_SIGNATURE;

    const sig = try sign(&sk, message, dst);
    const valid = try verify(&sig, &pk, message, dst);

    try testing.expect(valid);
}

test "verify wrong message fails" {
    if (builtin.target.cpu.arch == .wasm32) return error.SkipZigTest;

    const sk = try SecretKey.generate();
    const pk = sk.toPublicKey();

    const message = "Hello, BLS12-381!";
    const wrong_message = "Wrong message";
    const dst = DST.ETH2_SIGNATURE;

    const sig = try sign(&sk, message, dst);
    const valid = try verify(&sig, &pk, wrong_message, dst);

    try testing.expect(!valid);
}

test "verify wrong public key fails" {
    if (builtin.target.cpu.arch == .wasm32) return error.SkipZigTest;

    const sk1 = try SecretKey.generate();
    const sk2 = try SecretKey.generate();
    const pk2 = sk2.toPublicKey();

    const message = "Hello, BLS12-381!";
    const dst = DST.ETH2_SIGNATURE;

    const sig = try sign(&sk1, message, dst);
    const valid = try verify(&sig, &pk2, message, dst);

    try testing.expect(!valid);
}

test "signature serialization roundtrip" {
    if (builtin.target.cpu.arch == .wasm32) return error.SkipZigTest;

    const sk = try SecretKey.generate();
    const message = "Test message";
    const dst = DST.ETH2_SIGNATURE;

    const sig = try sign(&sk, message, dst);

    // Compressed roundtrip
    const compressed = sig.toCompressed();
    const sig_compressed = try Signature.fromCompressed(&compressed);
    try testing.expect(sig.isEqual(&sig_compressed));

    // Uncompressed roundtrip
    const uncompressed = sig.toUncompressed();
    const sig_uncompressed = try Signature.fromUncompressed(&uncompressed);
    try testing.expect(sig.isEqual(&sig_uncompressed));
}

test "aggregate signatures - same message" {
    if (builtin.target.cpu.arch == .wasm32) return error.SkipZigTest;

    const message = "Same message for all signers";
    const dst = DST.ETH2_SIGNATURE;

    // Generate 3 key pairs
    const sk1 = try SecretKey.generate();
    const sk2 = try SecretKey.generate();
    const sk3 = try SecretKey.generate();

    const pk1 = sk1.toPublicKey();
    const pk2 = sk2.toPublicKey();
    const pk3 = sk3.toPublicKey();

    // Sign with each key
    const sig1 = try sign(&sk1, message, dst);
    const sig2 = try sign(&sk2, message, dst);
    const sig3 = try sign(&sk3, message, dst);

    // Aggregate signatures
    const sigs = [_]*const Signature{ &sig1, &sig2, &sig3 };
    const agg_sig = try aggregateSignatures(&sigs);

    // Verify aggregate
    const pks = [_]*const PublicKey{ &pk1, &pk2, &pk3 };
    const valid = try verifyAggregate(&agg_sig, &pks, message, dst);

    try testing.expect(valid);
}

test "aggregate public keys" {
    if (builtin.target.cpu.arch == .wasm32) return error.SkipZigTest;

    const sk1 = try SecretKey.generate();
    const sk2 = try SecretKey.generate();

    const pk1 = sk1.toPublicKey();
    const pk2 = sk2.toPublicKey();

    const pks = [_]*const PublicKey{ &pk1, &pk2 };
    const agg_pk = try aggregatePublicKeys(&pks);

    // Aggregated key should not be infinity (extremely unlikely)
    try testing.expect(!agg_pk.isInfinity());
    try agg_pk.validate();
}

test "G1 point operations" {
    if (builtin.target.cpu.arch == .wasm32) return error.SkipZigTest;

    const g1 = G1Point.generator();

    // Generator should be on curve and in group
    try testing.expect(g1.isOnCurve());
    try testing.expect(g1.isInGroup());
    try testing.expect(!g1.isInfinity());

    // Double
    const g1_doubled = g1.double();
    try testing.expect(g1_doubled.isOnCurve());

    // Add
    const g1_added = g1.add(&g1);
    try testing.expect(g1_added.isEqual(&g1_doubled));

    // Negate
    const g1_neg = g1.negate();
    const should_be_infinity = g1.add(&g1_neg);
    try testing.expect(should_be_infinity.isInfinity());
}

test "G2 point operations" {
    if (builtin.target.cpu.arch == .wasm32) return error.SkipZigTest;

    const g2 = G2Point.generator();

    // Generator should be on curve and in group
    try testing.expect(g2.isOnCurve());
    try testing.expect(g2.isInGroup());
    try testing.expect(!g2.isInfinity());

    // Double
    const g2_doubled = g2.double();
    try testing.expect(g2_doubled.isOnCurve());

    // Add
    const g2_added = g2.add(&g2);
    try testing.expect(g2_added.isEqual(&g2_doubled));

    // Negate
    const g2_neg = g2.negate();
    const should_be_infinity = g2.add(&g2_neg);
    try testing.expect(should_be_infinity.isInfinity());
}

test "hash to G2" {
    if (builtin.target.cpu.arch == .wasm32) return error.SkipZigTest;

    const message = "test message";
    const dst = DST.ETH2_SIGNATURE;

    const h = G2Point.hashToG2(message, dst);

    // Hash result should be on curve and in group
    try testing.expect(h.isOnCurve());
    try testing.expect(h.isInGroup());
    try testing.expect(!h.isInfinity());

    // Same message should produce same hash
    const h2 = G2Point.hashToG2(message, dst);
    try testing.expect(h.isEqual(&h2));

    // Different message should produce different hash
    const h3 = G2Point.hashToG2("different message", dst);
    try testing.expect(!h.isEqual(&h3));
}

test "pairing bilinearity" {
    if (builtin.target.cpu.arch == .wasm32) return error.SkipZigTest;

    const g1 = G1Point.generator();
    const g2 = G2Point.generator();

    // e(aG1, bG2) should equal e(G1, G2)^(a*b)
    // We test: e(2*G1, G2) == e(G1, 2*G2)

    var scalar_2: [32]u8 = [_]u8{0} ** 32;
    scalar_2[31] = 2;

    const g1_times_2 = g1.mul(&scalar_2);
    const g2_times_2 = g2.mul(&scalar_2);

    const pairing1 = pairing(&g1_times_2, &g2);
    const pairing2 = pairing(&g1, &g2_times_2);

    try testing.expect(pairing1.isEqual(&pairing2));
}

test "pairing check" {
    if (builtin.target.cpu.arch == .wasm32) return error.SkipZigTest;

    const g1 = G1Point.generator();
    const g2 = G2Point.generator();
    const g1_neg = g1.negate();

    // e(G1, G2) * e(-G1, G2) should equal 1
    const g1_points = [_]*const G1Point{ &g1, &g1_neg };
    const g2_points = [_]*const G2Point{ &g2, &g2 };

    const result = try pairingCheck(&g1_points, &g2_points);
    try testing.expect(result);
}

test "empty inputs" {
    if (builtin.target.cpu.arch == .wasm32) return error.SkipZigTest;

    // Empty signature aggregation should fail
    const empty_sigs: []const *const Signature = &.{};
    try testing.expectError(Error.EmptyInput, aggregateSignatures(empty_sigs));

    // Empty public key aggregation should fail
    const empty_pks: []const *const PublicKey = &.{};
    try testing.expectError(Error.EmptyInput, aggregatePublicKeys(empty_pks));

    // Empty pairing check should return true
    const empty_g1: []const *const G1Point = &.{};
    const empty_g2: []const *const G2Point = &.{};
    const result = try pairingCheck(empty_g1, empty_g2);
    try testing.expect(result);
}

test "BLS signature test vector - Ethereum style" {
    if (builtin.target.cpu.arch == .wasm32) return error.SkipZigTest;

    // Test vector: specific secret key
    // sk = 0x0000000000000000000000000000000000000000000000000000000000000001
    var sk_bytes: [32]u8 = [_]u8{0} ** 32;
    sk_bytes[31] = 1;

    const sk = try SecretKey.fromBytes(&sk_bytes);
    const pk = sk.toPublicKey();

    // Verify public key is not infinity
    try testing.expect(!pk.isInfinity());

    // Sign and verify a message
    const message = "test";
    const dst = DST.ETH2_SIGNATURE;

    const sig = try sign(&sk, message, dst);
    const valid = try verify(&sig, &pk, message, dst);

    try testing.expect(valid);
}

test "signature aggregation is commutative" {
    if (builtin.target.cpu.arch == .wasm32) return error.SkipZigTest;

    // BLS signature aggregation uses elliptic curve point addition,
    // which is commutative: sig1 + sig2 + sig3 == sig3 + sig1 + sig2
    const message = "Test message for commutativity";
    const dst = DST.ETH2_SIGNATURE;

    // Generate 3 key pairs and signatures
    const sk1 = try SecretKey.generate();
    const sk2 = try SecretKey.generate();
    const sk3 = try SecretKey.generate();

    const sig1 = try sign(&sk1, message, dst);
    const sig2 = try sign(&sk2, message, dst);
    const sig3 = try sign(&sk3, message, dst);

    // Aggregate in order: 1, 2, 3
    const order_123 = [_]*const Signature{ &sig1, &sig2, &sig3 };
    const agg_123 = try aggregateSignatures(&order_123);

    // Aggregate in order: 3, 1, 2
    const order_312 = [_]*const Signature{ &sig3, &sig1, &sig2 };
    const agg_312 = try aggregateSignatures(&order_312);

    // Aggregate in order: 2, 3, 1
    const order_231 = [_]*const Signature{ &sig2, &sig3, &sig1 };
    const agg_231 = try aggregateSignatures(&order_231);

    // All orderings should produce the same aggregated signature
    try testing.expect(agg_123.isEqual(&agg_312));
    try testing.expect(agg_123.isEqual(&agg_231));
    try testing.expect(agg_312.isEqual(&agg_231));

    // Verify all produce valid aggregated signatures
    const pk1 = sk1.toPublicKey();
    const pk2 = sk2.toPublicKey();
    const pk3 = sk3.toPublicKey();
    const pks = [_]*const PublicKey{ &pk1, &pk2, &pk3 };

    const valid = try verifyAggregate(&agg_123, &pks, message, dst);
    try testing.expect(valid);
}

test "public key aggregation is commutative" {
    if (builtin.target.cpu.arch == .wasm32) return error.SkipZigTest;

    // BLS public key aggregation uses elliptic curve point addition,
    // which is commutative: pk1 + pk2 + pk3 == pk3 + pk1 + pk2
    const sk1 = try SecretKey.generate();
    const sk2 = try SecretKey.generate();
    const sk3 = try SecretKey.generate();

    const pk1 = sk1.toPublicKey();
    const pk2 = sk2.toPublicKey();
    const pk3 = sk3.toPublicKey();

    // Aggregate in order: 1, 2, 3
    const order_123 = [_]*const PublicKey{ &pk1, &pk2, &pk3 };
    const agg_123 = try aggregatePublicKeys(&order_123);

    // Aggregate in order: 3, 1, 2
    const order_312 = [_]*const PublicKey{ &pk3, &pk1, &pk2 };
    const agg_312 = try aggregatePublicKeys(&order_312);

    // Aggregate in order: 2, 3, 1
    const order_231 = [_]*const PublicKey{ &pk2, &pk3, &pk1 };
    const agg_231 = try aggregatePublicKeys(&order_231);

    // All orderings should produce the same aggregated public key
    try testing.expect(agg_123.isEqual(&agg_312));
    try testing.expect(agg_123.isEqual(&agg_231));
    try testing.expect(agg_312.isEqual(&agg_231));
}
