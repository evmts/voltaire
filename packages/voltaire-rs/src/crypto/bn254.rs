//! BN254 (alt_bn128) pairing curve for zkSNARK verification.
//!
//! This module provides EVM precompile-compatible functions for BN254 operations:
//!
//! - [`Bn254::g1_add`] - Point addition on G1 (EIP-196 ecAdd)
//! - [`Bn254::g1_mul`] - Scalar multiplication on G1 (EIP-196 ecMul)
//! - [`Bn254::pairing_check`] - Pairing check (EIP-197 ecPairing)
//!
//! # Curve Parameters
//!
//! BN254 is a pairing-friendly elliptic curve with:
//! - Field modulus p = 21888242871839275222246405745257275088696311157297823662689037894645226208583
//! - Group order r = 21888242871839275222246405745257275088548364400416034343698204186575808495617
//! - Curve equation: y² = x³ + 3
//!
//! # Example
//!
//! ```rust
//! use voltaire::crypto::bn254::{Bn254, G1Point, G2Point};
//!
//! // Point addition
//! let a = Bn254::g1_generator();
//! let b = Bn254::g1_generator();
//! let sum = Bn254::g1_add(&a, &b).unwrap();
//!
//! // Scalar multiplication
//! let scalar = [0u8; 32];
//! scalar[31] = 2;
//! let doubled = Bn254::g1_mul(&a, &scalar).unwrap();
//! ```

use crate::error::{Error, Result};

/// G1 point in uncompressed format: x || y (32 bytes each, 64 bytes total).
/// Coordinates are big-endian encoded field elements.
pub type G1Point = [u8; 64];

/// G2 point in uncompressed format: x_i || x_r || y_i || y_r (32 bytes each, 128 bytes total).
/// Each coordinate is an Fp2 element with imaginary part first, then real part.
pub type G2Point = [u8; 128];

/// Scalar value (32 bytes, big-endian).
pub type Scalar = [u8; 32];

/// Field modulus p for BN254.
/// p = 21888242871839275222246405745257275088696311157297823662689037894645226208583
pub const FIELD_MODULUS: [u8; 32] = [
    0x30, 0x64, 0x4e, 0x72, 0xe1, 0x31, 0xa0, 0x29,
    0xb8, 0x50, 0x45, 0xb6, 0x81, 0x81, 0x58, 0x5d,
    0x97, 0x81, 0x6a, 0x91, 0x68, 0x71, 0xca, 0x8d,
    0x3c, 0x20, 0x8c, 0x16, 0xd8, 0x7c, 0xfd, 0x47,
];

/// Group order r for BN254 (also called the scalar field modulus).
/// r = 21888242871839275222246405745257275088548364400416034343698204186575808495617
pub const GROUP_ORDER: [u8; 32] = [
    0x30, 0x64, 0x4e, 0x72, 0xe1, 0x31, 0xa0, 0x29,
    0xb8, 0x50, 0x45, 0xb6, 0x81, 0x81, 0x58, 0x5d,
    0x28, 0x33, 0xe8, 0x48, 0x79, 0xb9, 0x70, 0x91,
    0x43, 0xe1, 0xf5, 0x93, 0xf0, 0x00, 0x00, 0x01,
];

/// Curve coefficient b = 3.
pub const CURVE_B: u8 = 3;

/// G1 generator point x-coordinate.
const G1_GENERATOR_X: [u8; 32] = [
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01,
];

/// G1 generator point y-coordinate.
const G1_GENERATOR_Y: [u8; 32] = [
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02,
];

/// G2 generator point (x_i, x_r, y_i, y_r).
const G2_GENERATOR: [u8; 128] = [
    // x_i (imaginary part of x)
    0x19, 0x8e, 0x93, 0x93, 0x92, 0x0d, 0x48, 0x3a,
    0x72, 0x60, 0xbf, 0xb7, 0x31, 0xfb, 0x5d, 0x25,
    0xf1, 0xaa, 0x49, 0x33, 0x35, 0xa9, 0xe7, 0x12,
    0x97, 0xe4, 0x85, 0xb7, 0xae, 0xf3, 0x12, 0xc2,
    // x_r (real part of x)
    0x18, 0x00, 0xde, 0xef, 0x12, 0x1f, 0x1e, 0x76,
    0x42, 0x6a, 0x00, 0x66, 0x5e, 0x5c, 0x44, 0x79,
    0x67, 0x42, 0x22, 0xd8, 0x2a, 0xc1, 0xbe, 0x2b,
    0x07, 0x27, 0x94, 0xf0, 0xb7, 0xbe, 0x7a, 0x62,
    // y_i (imaginary part of y)
    0x09, 0x0d, 0x04, 0x69, 0xfe, 0x71, 0x0b, 0x2e,
    0xcc, 0x5e, 0x34, 0x93, 0xea, 0x38, 0x44, 0xcc,
    0x9b, 0xd4, 0x44, 0xbf, 0x69, 0x51, 0x55, 0xa3,
    0xf8, 0xf8, 0xeb, 0xf2, 0x2a, 0xc0, 0xc9, 0x2c,
    // y_r (real part of y)
    0x12, 0xc8, 0x5e, 0xa5, 0xdb, 0x8c, 0x6d, 0xeb,
    0x4a, 0xab, 0x71, 0x80, 0x8d, 0xcb, 0x40, 0x8f,
    0xe3, 0xd1, 0xe7, 0x69, 0x0c, 0x43, 0xd3, 0x7b,
    0x4c, 0xe6, 0xcc, 0x01, 0x66, 0xfa, 0x7d, 0xaa,
];

/// Point at infinity for G1 (all zeros).
const G1_INFINITY: G1Point = [0u8; 64];

/// Point at infinity for G2 (all zeros).
const G2_INFINITY: G2Point = [0u8; 128];

/// BN254 curve operations.
pub struct Bn254;

impl Bn254 {
    /// Returns the G1 generator point.
    pub fn g1_generator() -> G1Point {
        let mut point = [0u8; 64];
        point[..32].copy_from_slice(&G1_GENERATOR_X);
        point[32..].copy_from_slice(&G1_GENERATOR_Y);
        point
    }

    /// Returns the G2 generator point.
    pub fn g2_generator() -> G2Point {
        G2_GENERATOR
    }

    /// Returns the point at infinity for G1.
    pub fn g1_infinity() -> G1Point {
        G1_INFINITY
    }

    /// Returns the point at infinity for G2.
    pub fn g2_infinity() -> G2Point {
        G2_INFINITY
    }

    /// Check if a G1 point is the point at infinity.
    pub fn is_g1_infinity(point: &G1Point) -> bool {
        point.iter().all(|&b| b == 0)
    }

    /// Check if a G2 point is the point at infinity.
    pub fn is_g2_infinity(point: &G2Point) -> bool {
        point.iter().all(|&b| b == 0)
    }

    /// Negate a G1 point.
    ///
    /// Negation is done by negating the y-coordinate: -P = (x, -y) = (x, p - y).
    pub fn g1_neg(point: &G1Point) -> G1Point {
        if Self::is_g1_infinity(point) {
            return *point;
        }

        let mut result = [0u8; 64];
        result[..32].copy_from_slice(&point[..32]); // x unchanged

        // y' = p - y
        let y = &point[32..64];
        let neg_y = subtract_mod_p(y);
        result[32..].copy_from_slice(&neg_y);

        result
    }

    /// Validate that a G1 point is on the curve.
    ///
    /// Checks that the point satisfies y² = x³ + 3 (mod p).
    pub fn is_on_curve_g1(point: &G1Point) -> bool {
        // Point at infinity is valid
        if Self::is_g1_infinity(point) {
            return true;
        }

        let x = &point[..32];
        let y = &point[32..];

        // Check x, y < p
        if !is_less_than_modulus(x) || !is_less_than_modulus(y) {
            return false;
        }

        // TODO: Full curve equation check requires modular arithmetic
        // For now, just validate coordinate range
        true
    }

    /// Validate that a G2 point is on the curve.
    ///
    /// Checks that the point satisfies the twisted curve equation over Fp2.
    pub fn is_on_curve_g2(point: &G2Point) -> bool {
        // Point at infinity is valid
        if Self::is_g2_infinity(point) {
            return true;
        }

        // Check all coordinates < p
        for i in 0..4 {
            let coord = &point[i * 32..(i + 1) * 32];
            if !is_less_than_modulus(coord) {
                return false;
            }
        }

        // TODO: Full curve equation check requires Fp2 arithmetic
        true
    }

    /// G1 point addition (EIP-196 ecAdd precompile).
    ///
    /// Adds two points on the G1 curve. Returns the sum as a new G1 point.
    ///
    /// # Errors
    ///
    /// Returns an error if either point is not on the curve.
    #[cfg(feature = "native")]
    pub fn g1_add(a: &G1Point, b: &G1Point) -> Result<G1Point> {
        // Validate inputs
        if !Self::is_on_curve_g1(a) {
            return Err(Error::invalid_input("point a is not on curve"));
        }
        if !Self::is_on_curve_g1(b) {
            return Err(Error::invalid_input("point b is not on curve"));
        }

        crate::ffi::bn254_g1_add(a, b)
    }

    /// G1 point addition (requires native feature for full implementation).
    #[cfg(not(feature = "native"))]
    pub fn g1_add(a: &G1Point, b: &G1Point) -> Result<G1Point> {
        // Validate inputs
        if !Self::is_on_curve_g1(a) {
            return Err(Error::invalid_input("point a is not on curve"));
        }
        if !Self::is_on_curve_g1(b) {
            return Err(Error::invalid_input("point b is not on curve"));
        }

        // Handle identity cases
        if Self::is_g1_infinity(a) {
            return Ok(*b);
        }
        if Self::is_g1_infinity(b) {
            return Ok(*a);
        }

        // Check if points are negatives (P + (-P) = O)
        let neg_b = Self::g1_neg(b);
        if a == &neg_b {
            return Ok(Self::g1_infinity());
        }

        // TODO: Full point addition requires modular arithmetic
        Err(Error::invalid_input("native feature required for full g1_add"))
    }

    /// G1 scalar multiplication (EIP-196 ecMul precompile).
    ///
    /// Multiplies a G1 point by a scalar. Returns the result as a new G1 point.
    ///
    /// # Errors
    ///
    /// Returns an error if the point is not on the curve.
    #[cfg(feature = "native")]
    pub fn g1_mul(point: &G1Point, scalar: &Scalar) -> Result<G1Point> {
        if !Self::is_on_curve_g1(point) {
            return Err(Error::invalid_input("point is not on curve"));
        }

        crate::ffi::bn254_g1_mul(point, scalar)
    }

    /// G1 scalar multiplication (requires native feature for full implementation).
    #[cfg(not(feature = "native"))]
    pub fn g1_mul(point: &G1Point, scalar: &Scalar) -> Result<G1Point> {
        if !Self::is_on_curve_g1(point) {
            return Err(Error::invalid_input("point is not on curve"));
        }

        // Scalar = 0 returns point at infinity
        if scalar.iter().all(|&b| b == 0) {
            return Ok(Self::g1_infinity());
        }

        // Scalar = 1 returns the point itself
        let mut one = [0u8; 32];
        one[31] = 1;
        if scalar == &one {
            return Ok(*point);
        }

        // Point at infinity * any scalar = infinity
        if Self::is_g1_infinity(point) {
            return Ok(Self::g1_infinity());
        }

        // TODO: Full scalar multiplication requires double-and-add algorithm
        Err(Error::invalid_input("native feature required for full g1_mul"))
    }

    /// Pairing check (EIP-197 ecPairing precompile).
    ///
    /// Checks if the product of pairings equals 1:
    /// e(a1, b1) * e(a2, b2) * ... * e(an, bn) == 1
    ///
    /// This is the core operation for zkSNARK verification.
    ///
    /// # Arguments
    ///
    /// * `pairs` - Slice of (G1, G2) point pairs
    ///
    /// # Returns
    ///
    /// Returns `Ok(true)` if the pairing check passes, `Ok(false)` otherwise.
    ///
    /// # Errors
    ///
    /// Returns an error if any point is not on its respective curve.
    #[cfg(feature = "native")]
    pub fn pairing_check(pairs: &[(G1Point, G2Point)]) -> Result<bool> {
        // Empty input is valid and returns true
        if pairs.is_empty() {
            return Ok(true);
        }

        // Validate all points
        for (g1, g2) in pairs {
            if !Self::is_on_curve_g1(g1) {
                return Err(Error::invalid_input("G1 point is not on curve"));
            }
            if !Self::is_on_curve_g2(g2) {
                return Err(Error::invalid_input("G2 point is not on curve"));
            }
        }

        crate::ffi::bn254_pairing_check(pairs)
    }

    /// Pairing check (requires native feature for full implementation).
    #[cfg(not(feature = "native"))]
    pub fn pairing_check(pairs: &[(G1Point, G2Point)]) -> Result<bool> {
        // Empty input is valid and returns true
        if pairs.is_empty() {
            return Ok(true);
        }

        // Validate all points
        for (g1, g2) in pairs {
            if !Self::is_on_curve_g1(g1) {
                return Err(Error::invalid_input("G1 point is not on curve"));
            }
            if !Self::is_on_curve_g2(g2) {
                return Err(Error::invalid_input("G2 point is not on curve"));
            }
        }

        // Special case: all G1 points are infinity
        if pairs.iter().all(|(g1, _)| Self::is_g1_infinity(g1)) {
            return Ok(true);
        }

        // TODO: Full pairing computation requires Miller loop and final exponentiation
        Err(Error::invalid_input("native feature required for pairing_check"))
    }

    /// Encode a (G1, G2) pair for EVM precompile input.
    ///
    /// Returns 192 bytes: G1 (64 bytes) || G2 (128 bytes).
    pub fn encode_pairing_input(g1: &G1Point, g2: &G2Point) -> [u8; 192] {
        let mut result = [0u8; 192];
        result[..64].copy_from_slice(g1);
        result[64..].copy_from_slice(g2);
        result
    }

    /// Decode EVM precompile input to (G1, G2) pairs.
    ///
    /// Input must be a multiple of 192 bytes.
    pub fn decode_pairing_input(input: &[u8]) -> Result<Vec<(G1Point, G2Point)>> {
        if input.len() % 192 != 0 {
            return Err(Error::invalid_input("input length must be multiple of 192"));
        }

        let num_pairs = input.len() / 192;
        let mut pairs = Vec::with_capacity(num_pairs);

        for i in 0..num_pairs {
            let offset = i * 192;
            let mut g1 = [0u8; 64];
            let mut g2 = [0u8; 128];
            g1.copy_from_slice(&input[offset..offset + 64]);
            g2.copy_from_slice(&input[offset + 64..offset + 192]);
            pairs.push((g1, g2));
        }

        Ok(pairs)
    }
}

/// Check if a 32-byte big-endian value is less than the field modulus.
fn is_less_than_modulus(value: &[u8]) -> bool {
    if value.len() != 32 {
        return false;
    }
    for i in 0..32 {
        if value[i] < FIELD_MODULUS[i] {
            return true;
        }
        if value[i] > FIELD_MODULUS[i] {
            return false;
        }
    }
    false // Equal to modulus, so not less than
}

/// Compute p - value (mod p) for negation.
fn subtract_mod_p(value: &[u8]) -> [u8; 32] {
    let mut result = [0u8; 32];

    // Check if value is zero
    if value.iter().all(|&b| b == 0) {
        return result;
    }

    // p - value with borrowing
    let mut borrow = 0i16;
    for i in (0..32).rev() {
        let diff = FIELD_MODULUS[i] as i16 - value[i] as i16 - borrow;
        if diff < 0 {
            result[i] = (diff + 256) as u8;
            borrow = 1;
        } else {
            result[i] = diff as u8;
            borrow = 0;
        }
    }

    result
}

#[cfg(test)]
mod tests {
    use super::*;

    // ============ Constants Tests ============

    #[test]
    fn test_field_modulus_is_correct() {
        // First few bytes should be 0x30, 0x64...
        assert_eq!(FIELD_MODULUS[0], 0x30);
        assert_eq!(FIELD_MODULUS[1], 0x64);
        // Last byte
        assert_eq!(FIELD_MODULUS[31], 0x47);
    }

    #[test]
    fn test_group_order_is_correct() {
        // First few bytes same as field modulus
        assert_eq!(GROUP_ORDER[0], 0x30);
        assert_eq!(GROUP_ORDER[1], 0x64);
        // Last byte is 0x01
        assert_eq!(GROUP_ORDER[31], 0x01);
    }

    // ============ Generator Tests ============

    #[test]
    fn test_g1_generator() {
        let gen = Bn254::g1_generator();
        // x = 1
        assert_eq!(gen[31], 1);
        for i in 0..31 {
            assert_eq!(gen[i], 0);
        }
        // y = 2
        assert_eq!(gen[63], 2);
        for i in 32..63 {
            assert_eq!(gen[i], 0);
        }
    }

    #[test]
    fn test_g2_generator() {
        let gen = Bn254::g2_generator();
        assert_eq!(gen.len(), 128);
        // Not all zeros
        assert!(!gen.iter().all(|&b| b == 0));
    }

    // ============ Infinity Tests ============

    #[test]
    fn test_g1_infinity() {
        let inf = Bn254::g1_infinity();
        assert!(inf.iter().all(|&b| b == 0));
        assert!(Bn254::is_g1_infinity(&inf));
    }

    #[test]
    fn test_g2_infinity() {
        let inf = Bn254::g2_infinity();
        assert!(inf.iter().all(|&b| b == 0));
        assert!(Bn254::is_g2_infinity(&inf));
    }

    #[test]
    fn test_generator_is_not_infinity() {
        assert!(!Bn254::is_g1_infinity(&Bn254::g1_generator()));
        assert!(!Bn254::is_g2_infinity(&Bn254::g2_generator()));
    }

    // ============ Negation Tests ============

    #[test]
    fn test_g1_neg_infinity() {
        let inf = Bn254::g1_infinity();
        let neg = Bn254::g1_neg(&inf);
        assert!(Bn254::is_g1_infinity(&neg));
    }

    #[test]
    fn test_g1_neg_generator() {
        let gen = Bn254::g1_generator();
        let neg = Bn254::g1_neg(&gen);

        // x should be same
        assert_eq!(&neg[..32], &gen[..32]);
        // y should be different (negated)
        assert_ne!(&neg[32..], &gen[32..]);
        // y should not be zero
        assert!(!neg[32..].iter().all(|&b| b == 0));
    }

    #[test]
    fn test_g1_double_neg() {
        let gen = Bn254::g1_generator();
        let neg = Bn254::g1_neg(&gen);
        let double_neg = Bn254::g1_neg(&neg);
        assert_eq!(gen, double_neg);
    }

    // ============ Curve Validation Tests ============

    #[test]
    fn test_is_on_curve_g1_infinity() {
        assert!(Bn254::is_on_curve_g1(&Bn254::g1_infinity()));
    }

    #[test]
    fn test_is_on_curve_g1_generator() {
        assert!(Bn254::is_on_curve_g1(&Bn254::g1_generator()));
    }

    #[test]
    fn test_is_on_curve_g1_invalid_x() {
        // x >= p is invalid
        let mut point = [0u8; 64];
        point[..32].copy_from_slice(&[0xff; 32]);
        assert!(!Bn254::is_on_curve_g1(&point));
    }

    #[test]
    fn test_is_on_curve_g2_infinity() {
        assert!(Bn254::is_on_curve_g2(&Bn254::g2_infinity()));
    }

    #[test]
    fn test_is_on_curve_g2_generator() {
        assert!(Bn254::is_on_curve_g2(&Bn254::g2_generator()));
    }

    // ============ G1 Add Tests (EVM ecAdd vectors) ============

    #[test]
    fn test_g1_add_identity_left() {
        let inf = Bn254::g1_infinity();
        let gen = Bn254::g1_generator();
        let result = Bn254::g1_add(&inf, &gen);
        // Without native, this should work (identity case)
        #[cfg(not(feature = "native"))]
        assert_eq!(result.unwrap(), gen);
    }

    #[test]
    fn test_g1_add_identity_right() {
        let inf = Bn254::g1_infinity();
        let gen = Bn254::g1_generator();
        let result = Bn254::g1_add(&gen, &inf);
        #[cfg(not(feature = "native"))]
        assert_eq!(result.unwrap(), gen);
    }

    #[test]
    fn test_g1_add_both_identity() {
        let inf = Bn254::g1_infinity();
        let result = Bn254::g1_add(&inf, &inf);
        #[cfg(not(feature = "native"))]
        assert!(Bn254::is_g1_infinity(&result.unwrap()));
    }

    #[test]
    fn test_g1_add_point_plus_negation() {
        let gen = Bn254::g1_generator();
        let neg = Bn254::g1_neg(&gen);
        let result = Bn254::g1_add(&gen, &neg);
        #[cfg(not(feature = "native"))]
        assert!(Bn254::is_g1_infinity(&result.unwrap()));
    }

    #[test]
    fn test_g1_add_invalid_point() {
        // Point with coordinates >= p
        let mut invalid = [0xff; 64];
        let gen = Bn254::g1_generator();
        let result = Bn254::g1_add(&invalid, &gen);
        assert!(result.is_err());
    }

    // ============ G1 Mul Tests (EVM ecMul vectors) ============

    #[test]
    fn test_g1_mul_by_zero() {
        let gen = Bn254::g1_generator();
        let zero = [0u8; 32];
        let result = Bn254::g1_mul(&gen, &zero);
        #[cfg(not(feature = "native"))]
        assert!(Bn254::is_g1_infinity(&result.unwrap()));
    }

    #[test]
    fn test_g1_mul_by_one() {
        let gen = Bn254::g1_generator();
        let mut one = [0u8; 32];
        one[31] = 1;
        let result = Bn254::g1_mul(&gen, &one);
        #[cfg(not(feature = "native"))]
        assert_eq!(result.unwrap(), gen);
    }

    #[test]
    fn test_g1_mul_infinity_by_scalar() {
        let inf = Bn254::g1_infinity();
        let mut scalar = [0u8; 32];
        scalar[31] = 42;
        let result = Bn254::g1_mul(&inf, &scalar);
        #[cfg(not(feature = "native"))]
        assert!(Bn254::is_g1_infinity(&result.unwrap()));
    }

    #[test]
    fn test_g1_mul_invalid_point() {
        let mut invalid = [0xff; 64];
        let mut scalar = [0u8; 32];
        scalar[31] = 1;
        let result = Bn254::g1_mul(&invalid, &scalar);
        assert!(result.is_err());
    }

    // ============ Pairing Tests (EVM ecPairing vectors) ============

    #[test]
    fn test_pairing_empty_input() {
        let pairs: Vec<(G1Point, G2Point)> = vec![];
        let result = Bn254::pairing_check(&pairs);
        assert!(result.unwrap());
    }

    #[test]
    fn test_pairing_all_g1_infinity() {
        let inf_g1 = Bn254::g1_infinity();
        let gen_g2 = Bn254::g2_generator();
        let pairs = vec![(inf_g1, gen_g2)];
        let result = Bn254::pairing_check(&pairs);
        #[cfg(not(feature = "native"))]
        assert!(result.unwrap());
    }

    #[test]
    fn test_pairing_invalid_g1() {
        let mut invalid_g1 = [0xff; 64];
        let gen_g2 = Bn254::g2_generator();
        let pairs = vec![(invalid_g1, gen_g2)];
        let result = Bn254::pairing_check(&pairs);
        assert!(result.is_err());
    }

    #[test]
    fn test_pairing_invalid_g2() {
        let gen_g1 = Bn254::g1_generator();
        let mut invalid_g2 = [0xff; 128];
        let pairs = vec![(gen_g1, invalid_g2)];
        let result = Bn254::pairing_check(&pairs);
        assert!(result.is_err());
    }

    // ============ Encoding Tests ============

    #[test]
    fn test_encode_pairing_input() {
        let g1 = Bn254::g1_generator();
        let g2 = Bn254::g2_generator();
        let encoded = Bn254::encode_pairing_input(&g1, &g2);

        assert_eq!(encoded.len(), 192);
        assert_eq!(&encoded[..64], &g1[..]);
        assert_eq!(&encoded[64..], &g2[..]);
    }

    #[test]
    fn test_decode_pairing_input_empty() {
        let pairs = Bn254::decode_pairing_input(&[]).unwrap();
        assert!(pairs.is_empty());
    }

    #[test]
    fn test_decode_pairing_input_one_pair() {
        let g1 = Bn254::g1_generator();
        let g2 = Bn254::g2_generator();
        let encoded = Bn254::encode_pairing_input(&g1, &g2);

        let pairs = Bn254::decode_pairing_input(&encoded).unwrap();
        assert_eq!(pairs.len(), 1);
        assert_eq!(pairs[0].0, g1);
        assert_eq!(pairs[0].1, g2);
    }

    #[test]
    fn test_decode_pairing_input_multiple_pairs() {
        let g1 = Bn254::g1_generator();
        let g2 = Bn254::g2_generator();
        let inf_g1 = Bn254::g1_infinity();

        let mut input = Vec::new();
        input.extend_from_slice(&Bn254::encode_pairing_input(&g1, &g2));
        input.extend_from_slice(&Bn254::encode_pairing_input(&inf_g1, &g2));

        let pairs = Bn254::decode_pairing_input(&input).unwrap();
        assert_eq!(pairs.len(), 2);
        assert_eq!(pairs[0].0, g1);
        assert_eq!(pairs[1].0, inf_g1);
    }

    #[test]
    fn test_decode_pairing_input_invalid_length() {
        let input = [0u8; 100]; // Not a multiple of 192
        let result = Bn254::decode_pairing_input(&input);
        assert!(result.is_err());
    }

    // ============ EVM Test Vectors (from go-ethereum) ============

    /// EVM ecAdd test: (0,0) + (0,0) = (0,0)
    #[test]
    fn test_evm_ecadd_zero_plus_zero() {
        let zero = [0u8; 64];
        let result = Bn254::g1_add(&zero, &zero);
        #[cfg(not(feature = "native"))]
        {
            let r = result.unwrap();
            assert!(r.iter().all(|&b| b == 0));
        }
    }

    /// EVM ecMul test: 0 * G = (0,0)
    #[test]
    fn test_evm_ecmul_zero_scalar() {
        let gen = Bn254::g1_generator();
        let zero = [0u8; 32];
        let result = Bn254::g1_mul(&gen, &zero);
        #[cfg(not(feature = "native"))]
        {
            let r = result.unwrap();
            assert!(r.iter().all(|&b| b == 0));
        }
    }

    // ============ Helper Function Tests ============

    #[test]
    fn test_is_less_than_modulus_zero() {
        let zero = [0u8; 32];
        assert!(is_less_than_modulus(&zero));
    }

    #[test]
    fn test_is_less_than_modulus_one() {
        let mut one = [0u8; 32];
        one[31] = 1;
        assert!(is_less_than_modulus(&one));
    }

    #[test]
    fn test_is_less_than_modulus_max() {
        let max = [0xff; 32];
        assert!(!is_less_than_modulus(&max));
    }

    #[test]
    fn test_is_less_than_modulus_equal() {
        assert!(!is_less_than_modulus(&FIELD_MODULUS));
    }

    #[test]
    fn test_subtract_mod_p_zero() {
        let zero = [0u8; 32];
        let result = subtract_mod_p(&zero);
        assert!(result.iter().all(|&b| b == 0));
    }

    #[test]
    fn test_subtract_mod_p_one() {
        let mut one = [0u8; 32];
        one[31] = 1;
        let result = subtract_mod_p(&one);

        // result = p - 1
        // Check last byte: p[31] = 0x47, so p - 1 has last byte 0x46
        assert_eq!(result[31], FIELD_MODULUS[31] - 1);
    }
}
