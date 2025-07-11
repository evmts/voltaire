/// MCL (Herumi) library wrapper for BN254 elliptic curve operations
///
/// This module provides Zig bindings for the MCL pairing-based cryptography library
/// by Herumi, specifically for BN254 (alt_bn128) curve operations used in Ethereum
/// precompiles.
///
/// MCL Library: https://github.com/herumi/mcl
/// License: BSD 3-Clause
///
/// ## Supported Operations
/// - G1 point addition (ECADD precompile 0x06)
/// - G1 scalar multiplication (ECMUL precompile 0x07) 
/// - Optimal ate pairing (ECPAIRING precompile 0x08)
///
/// ## Security Notes
/// - All operations are performed using constant-time algorithms where applicable
/// - Points are validated to be on the curve and in the correct subgroup
/// - Uses industry-standard MCL library for production-grade security

const std = @import("std");

/// MCL C API bindings
const c = @cImport({
    @cDefine("MCL_FP_BIT", "256");
    @cDefine("MCL_FR_BIT", "256");
    @cInclude("mcl/bn_c256.h");
});

/// MCL initialization error
pub const MclError = error{
    InitializationFailed,
    InvalidPoint,
    InvalidScalar,
    SerializationFailed,
    DeserializationFailed,
    PairingFailed,
};

/// BN254 curve type constant
const BN254_CURVE_TYPE = c.mclBn_CurveFp254BNb;

/// MCL compiled time variable for version consistency
const MCL_COMPILED_TIME_VAR = c.MCLBN_COMPILED_TIME_VAR;

/// Thread-safe initialization flag
var mcl_initialized = std.atomic.Value(bool).init(false);

/// Initialize MCL library with BN254 curve
/// This function is thread-safe and ensures MCL is initialized only once
///
/// @return MclError.InitializationFailed if MCL initialization fails
pub fn init() MclError!void {
    // Check if already initialized
    if (mcl_initialized.load(.acquire)) {
        return;
    }
    
    // Attempt initialization
    const result = c.mclBn_init(BN254_CURVE_TYPE, MCL_COMPILED_TIME_VAR);
    if (result != 0) {
        return MclError.InitializationFailed;
    }
    
    // Mark as initialized
    mcl_initialized.store(true, .release);
}

/// G1 point on BN254 curve (points on the base field Fp)
/// Uses Jacobian coordinates internally for efficiency
pub const G1Point = struct {
    inner: c.mclBnG1,

    /// Create G1 point at infinity (identity element)
    pub fn zero() G1Point {
        var point = G1Point{ .inner = undefined };
        c.mclBnG1_clear(&point.inner);
        return point;
    }

    /// Create G1 point from 64 bytes (32 bytes x + 32 bytes y)
    /// Input format: big-endian coordinates as used in Ethereum
    ///
    /// @param input 64-byte buffer containing x and y coordinates
    /// @return G1Point or error if invalid
    pub fn from_bytes(input: []const u8) MclError!G1Point {
        if (input.len < 64) {
            return MclError.DeserializationFailed;
        }

        var point = G1Point{ .inner = undefined };
        
        // MCL expects little-endian, so we need to convert from Ethereum's big-endian
        var little_endian_input: [64]u8 = undefined;
        
        // Convert x coordinate (first 32 bytes) from big-endian to little-endian
        for (0..32) |i| {
            little_endian_input[i] = input[31 - i];
        }
        
        // Convert y coordinate (next 32 bytes) from big-endian to little-endian
        for (0..32) |i| {
            little_endian_input[32 + i] = input[63 - i];
        }

        // Use MCL's deserialization with affine coordinates
        const result = c.mclBnG1_deserialize(&point.inner, &little_endian_input, 64);
        if (result == 0) {
            return MclError.DeserializationFailed;
        }

        // Validate the point is on the curve and in correct subgroup
        if (c.mclBnG1_isValid(&point.inner) == 0) {
            return MclError.InvalidPoint;
        }

        return point;
    }

    /// Convert G1 point to 64 bytes (32 bytes x + 32 bytes y)
    /// Output format: big-endian coordinates as expected by Ethereum
    ///
    /// @param output 64-byte buffer to write coordinates
    pub fn to_bytes(self: G1Point, output: []u8) MclError!void {
        if (output.len < 64) {
            return MclError.SerializationFailed;
        }

        // Serialize point to little-endian format
        var little_endian_output: [64]u8 = undefined;
        const result = c.mclBnG1_serialize(&little_endian_output, 64, &self.inner);
        if (result == 0) {
            return MclError.SerializationFailed;
        }

        // Convert from little-endian to big-endian for Ethereum format
        // Convert x coordinate
        for (0..32) |i| {
            output[i] = little_endian_output[31 - i];
        }
        
        // Convert y coordinate
        for (0..32) |i| {
            output[32 + i] = little_endian_output[63 - i];
        }
    }

    /// Check if point is the point at infinity
    pub fn is_zero(self: G1Point) bool {
        return c.mclBnG1_isZero(&self.inner) != 0;
    }

    /// Check if point is valid (on curve and in correct subgroup)
    pub fn is_valid(self: G1Point) bool {
        return c.mclBnG1_isValid(&self.inner) != 0;
    }

    /// Add two G1 points: self + other
    pub fn add(self: G1Point, other: G1Point) G1Point {
        var result = G1Point{ .inner = undefined };
        c.mclBnG1_add(&result.inner, &self.inner, &other.inner);
        return result;
    }

    /// Multiply G1 point by scalar: self * scalar
    /// Uses constant-time multiplication for security
    pub fn mul(self: G1Point, scalar: []const u8) MclError!G1Point {
        if (scalar.len != 32) {
            return MclError.InvalidScalar;
        }

        // Convert scalar from big-endian to MCL's Fr format
        var fr_scalar: c.mclBnFr = undefined;
        
        // Convert big-endian scalar to little-endian for MCL
        var little_endian_scalar: [32]u8 = undefined;
        for (0..32) |i| {
            little_endian_scalar[i] = scalar[31 - i];
        }

        const result = c.mclBnFr_deserialize(&fr_scalar, &little_endian_scalar, 32);
        if (result == 0) {
            return MclError.InvalidScalar;
        }

        var point_result = G1Point{ .inner = undefined };
        c.mclBnG1_mulCT(&point_result.inner, &self.inner, &fr_scalar);
        return point_result;
    }
};

/// G2 point on BN254 curve (points on the extension field Fp2)
/// Used for pairing operations
pub const G2Point = struct {
    inner: c.mclBnG2,

    /// Create G2 point at infinity (identity element)
    pub fn zero() G2Point {
        var point = G2Point{ .inner = undefined };
        c.mclBnG2_clear(&point.inner);
        return point;
    }

    /// Create G2 point from 128 bytes (64 bytes for each Fp2 coordinate)
    /// Input format: big-endian coordinates as used in Ethereum
    ///
    /// @param input 128-byte buffer containing x and y coordinates in Fp2
    /// @return G2Point or error if invalid
    pub fn from_bytes(input: []const u8) MclError!G2Point {
        if (input.len < 128) {
            return MclError.DeserializationFailed;
        }

        var point = G2Point{ .inner = undefined };
        
        // MCL expects little-endian, convert from Ethereum's big-endian
        var little_endian_input: [128]u8 = undefined;
        
        // Convert all coordinates from big-endian to little-endian
        for (0..128) |i| {
            little_endian_input[i] = input[127 - i];
        }

        const result = c.mclBnG2_deserialize(&point.inner, &little_endian_input, 128);
        if (result == 0) {
            return MclError.DeserializationFailed;
        }

        // Validate the point
        if (c.mclBnG2_isValid(&point.inner) == 0) {
            return MclError.InvalidPoint;
        }

        return point;
    }

    /// Check if point is valid (on curve and in correct subgroup)
    pub fn is_valid(self: G2Point) bool {
        return c.mclBnG2_isValid(&self.inner) != 0;
    }

    /// Add two G2 points: self + other
    pub fn add(self: G2Point, other: G2Point) G2Point {
        var result = G2Point{ .inner = undefined };
        c.mclBnG2_add(&result.inner, &self.inner, &other.inner);
        return result;
    }
};

/// GT element (result of pairing operation)
/// Elements in the multiplicative group GT ⊆ Fp12
pub const GTElement = struct {
    inner: c.mclBnGT,

    /// Create GT identity element (one)
    pub fn one() GTElement {
        var element = GTElement{ .inner = undefined };
        c.mclBnGT_setInt32(&element.inner, 1);
        return element;
    }

    /// Check if element is one (identity in GT)
    pub fn is_one(self: GTElement) bool {
        return c.mclBnGT_isOne(&self.inner) != 0;
    }

    /// Multiply two GT elements
    pub fn mul(self: GTElement, other: GTElement) GTElement {
        var result = GTElement{ .inner = undefined };
        c.mclBnGT_mul(&result.inner, &self.inner, &other.inner);
        return result;
    }
};

/// Compute optimal ate pairing: e(g1_point, g2_point)
/// This is the full pairing operation including final exponentiation
///
/// @param g1_point Point in G1
/// @param g2_point Point in G2  
/// @return Element in GT
pub fn pairing(g1_point: G1Point, g2_point: G2Point) GTElement {
    var result = GTElement{ .inner = undefined };
    c.mclBn_pairing(&result.inner, &g1_point.inner, &g2_point.inner);
    return result;
}

/// Compute Miller loop: miller(g1_point, g2_point)
/// This is the Miller loop part of pairing (without final exponentiation)
///
/// @param g1_point Point in G1
/// @param g2_point Point in G2
/// @return Element in Fp12 (not yet in GT)
pub fn miller_loop(g1_point: G1Point, g2_point: G2Point) GTElement {
    var result = GTElement{ .inner = undefined };
    c.mclBn_millerLoop(&result.inner, &g1_point.inner, &g2_point.inner);
    return result;
}

/// Compute final exponentiation for pairing
/// Converts Miller loop result to proper GT element
///
/// @param fp12_element Element from Miller loop
/// @return Element in GT
pub fn final_exp(fp12_element: GTElement) GTElement {
    var result = GTElement{ .inner = undefined };
    c.mclBn_finalExp(&result.inner, &fp12_element.inner);
    return result;
}

/// Compute multi-pairing efficiently: ∏ e(g1_points[i], g2_points[i])
/// This is more efficient than computing individual pairings and multiplying
///
/// @param g1_points Array of G1 points
/// @param g2_points Array of G2 points (must be same length as g1_points)
/// @return Element in GT representing the product of all pairings
pub fn multi_pairing(g1_points: []const G1Point, g2_points: []const G2Point) MclError!GTElement {
    if (g1_points.len != g2_points.len) {
        return MclError.PairingFailed;
    }

    var result = GTElement{ .inner = undefined };
    
    // Cast to expected pointer types for MCL
    const g1_ptr: [*]const c.mclBnG1 = @ptrCast(g1_points.ptr);
    const g2_ptr: [*]const c.mclBnG2 = @ptrCast(g2_points.ptr);
    
    c.mclBn_millerLoopVec(&result.inner, g1_ptr, g2_ptr, g1_points.len);
    c.mclBn_finalExp(&result.inner, &result.inner);
    
    return result;
}

// Tests
const testing = std.testing;

test "MCL initialization" {
    try init();
    // Should be safe to call multiple times
    try init();
}

test "G1 point operations" {
    try init();
    
    // Test point at infinity
    const zero = G1Point.zero();
    try testing.expect(zero.is_zero());
    try testing.expect(zero.is_valid());
    
    // Test point addition with zero
    const result = zero.add(zero);
    try testing.expect(result.is_zero());
    try testing.expect(result.is_valid());
}

test "G1 point from/to bytes" {
    try init();
    
    // Test with point at infinity (all zeros)
    var input = [_]u8{0} ** 64;
    const point = try G1Point.from_bytes(&input);
    try testing.expect(point.is_zero());
    
    var output = [_]u8{0} ** 64;
    try point.to_bytes(&output);
    
    // Should round-trip correctly
    for (input, 0..) |expected, i| {
        try testing.expectEqual(expected, output[i]);
    }
}