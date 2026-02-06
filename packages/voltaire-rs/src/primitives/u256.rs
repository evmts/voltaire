//! 256-bit unsigned integer type.
//!
//! A big-endian 256-bit unsigned integer for Ethereum values.

use core::fmt;
use core::ops::{BitAnd, BitOr, BitXor, Deref, Not, Shl, Shr};
use core::str::FromStr;

use crate::error::{Error, Result};

/// 256-bit unsigned integer.
///
/// Stored as 32 bytes in big-endian format, matching Ethereum's convention.
///
/// # Examples
///
/// ```rust
/// use voltaire::U256;
///
/// let value = U256::from(1000u64);
/// let from_hex: U256 = "0x3e8".parse()?; // 1000 in hex
///
/// assert_eq!(value, from_hex);
/// # Ok::<(), voltaire::Error>(())
/// ```
#[derive(Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Default)]
#[repr(transparent)]
pub struct U256([u8; 32]);

impl U256 {
    /// Zero constant.
    pub const ZERO: Self = Self([0u8; 32]);

    /// One constant.
    pub const ONE: Self = {
        let mut bytes = [0u8; 32];
        bytes[31] = 1;
        Self(bytes)
    };

    /// Maximum value (2^256 - 1).
    pub const MAX: Self = Self([0xff; 32]);

    /// Byte length.
    pub const LEN: usize = 32;

    /// Create from raw bytes (big-endian).
    #[inline]
    pub const fn new(bytes: [u8; 32]) -> Self {
        Self(bytes)
    }

    /// Create from byte slice.
    #[inline]
    pub fn from_slice(slice: &[u8]) -> Result<Self> {
        if slice.len() > 32 {
            return Err(Error::invalid_length(32, slice.len()));
        }

        let mut bytes = [0u8; 32];
        // Right-align (big-endian)
        let offset = 32 - slice.len();
        bytes[offset..].copy_from_slice(slice);
        Ok(Self(bytes))
    }

    /// Parse from hex string.
    ///
    /// Accepts with or without `0x` prefix. Leading zeros are optional.
    pub fn from_hex(s: &str) -> Result<Self> {
        let s = s.strip_prefix("0x").unwrap_or(s);

        if s.is_empty() {
            return Ok(Self::ZERO);
        }

        if s.len() > 64 {
            return Err(Error::invalid_length(64, s.len()));
        }

        // Pad to 64 characters
        let padded = format!("{:0>64}", s);
        let bytes = hex::decode(&padded)
            .map_err(|e| Error::invalid_hex(e.to_string()))?;

        Self::from_slice(&bytes)
    }

    /// Get the raw bytes (big-endian).
    #[inline]
    pub const fn as_bytes(&self) -> &[u8; 32] {
        &self.0
    }

    /// Convert to bytes (big-endian).
    #[inline]
    pub const fn to_bytes(self) -> [u8; 32] {
        self.0
    }

    /// Convert to little-endian bytes.
    pub fn to_le_bytes(self) -> [u8; 32] {
        let mut bytes = self.0;
        bytes.reverse();
        bytes
    }

    /// Create from little-endian bytes.
    pub fn from_le_bytes(bytes: [u8; 32]) -> Self {
        let mut be_bytes = bytes;
        be_bytes.reverse();
        Self(be_bytes)
    }

    /// Check if value is zero.
    #[inline]
    pub fn is_zero(&self) -> bool {
        self.0 == [0u8; 32]
    }

    /// Convert to hex string with 0x prefix.
    ///
    /// Returns the full 64-character hex representation.
    pub fn to_hex(&self) -> String {
        format!("0x{}", hex::encode(self.0))
    }

    /// Convert to minimal hex string (no leading zeros).
    pub fn to_hex_minimal(&self) -> String {
        // Find first non-zero byte
        let first_nonzero = self.0.iter().position(|&b| b != 0);

        match first_nonzero {
            None => "0x0".to_string(),
            Some(i) => {
                let hex = hex::encode(&self.0[i..]);
                // Remove leading zero if present (for odd-length values)
                let hex = hex.trim_start_matches('0');
                if hex.is_empty() {
                    "0x0".to_string()
                } else {
                    format!("0x{}", hex)
                }
            }
        }
    }

    /// Convert to u64 if value fits.
    pub fn to_u64(&self) -> Option<u64> {
        // Check if any byte before the last 8 is non-zero
        if self.0[..24].iter().any(|&b| b != 0) {
            return None;
        }

        let mut bytes = [0u8; 8];
        bytes.copy_from_slice(&self.0[24..]);
        Some(u64::from_be_bytes(bytes))
    }

    /// Convert to u128 if value fits.
    pub fn to_u128(&self) -> Option<u128> {
        if self.0[..16].iter().any(|&b| b != 0) {
            return None;
        }

        let mut bytes = [0u8; 16];
        bytes.copy_from_slice(&self.0[16..]);
        Some(u128::from_be_bytes(bytes))
    }

    /// Checked addition.
    pub fn checked_add(self, rhs: Self) -> Option<Self> {
        let mut result = [0u8; 32];
        let mut carry = 0u16;

        for i in (0..32).rev() {
            let sum = self.0[i] as u16 + rhs.0[i] as u16 + carry;
            result[i] = sum as u8;
            carry = sum >> 8;
        }

        if carry != 0 {
            None // Overflow
        } else {
            Some(Self(result))
        }
    }

    /// Checked subtraction.
    pub fn checked_sub(self, rhs: Self) -> Option<Self> {
        if self < rhs {
            return None;
        }

        let mut result = [0u8; 32];
        let mut borrow = 0i16;

        for i in (0..32).rev() {
            let diff = self.0[i] as i16 - rhs.0[i] as i16 - borrow;
            if diff < 0 {
                result[i] = (diff + 256) as u8;
                borrow = 1;
            } else {
                result[i] = diff as u8;
                borrow = 0;
            }
        }

        Some(Self(result))
    }

    /// Checked multiplication. Returns None on overflow.
    pub fn checked_mul(self, rhs: Self) -> Option<Self> {
        // Use schoolbook multiplication with u16 limbs
        // Convert to 16 u16 limbs (little-endian for easier carry propagation)
        let a = self.to_u16_limbs_le();
        let b = rhs.to_u16_limbs_le();

        // Result needs 32 limbs to detect overflow
        let mut result = [0u32; 32];

        for i in 0..16 {
            if a[i] == 0 {
                continue;
            }
            for j in 0..16 {
                if b[j] == 0 {
                    continue;
                }
                let pos = i + j;
                result[pos] += (a[i] as u32) * (b[j] as u32);
            }
        }

        // Propagate carries
        let mut carry = 0u32;
        for i in 0..32 {
            result[i] += carry;
            carry = result[i] >> 16;
            result[i] &= 0xFFFF;
        }

        // Check for overflow (any non-zero in upper 16 limbs)
        if carry != 0 || result[16..].iter().any(|&x| x != 0) {
            return None;
        }

        // Convert back to bytes
        Some(Self::from_u16_limbs_le(&result[..16]))
    }

    /// Checked division. Returns None if rhs is zero.
    pub fn checked_div(self, rhs: Self) -> Option<Self> {
        if rhs.is_zero() {
            return None;
        }
        Some(self.div_rem(rhs).0)
    }

    /// Checked remainder. Returns None if rhs is zero.
    pub fn checked_rem(self, rhs: Self) -> Option<Self> {
        if rhs.is_zero() {
            return None;
        }
        Some(self.div_rem(rhs).1)
    }

    /// Division with remainder. Panics if rhs is zero.
    fn div_rem(self, rhs: Self) -> (Self, Self) {
        if rhs.is_zero() {
            panic!("division by zero");
        }

        if self < rhs {
            return (Self::ZERO, self);
        }

        if self == rhs {
            return (Self::ONE, Self::ZERO);
        }

        // Binary long division
        // We iterate from MSB to LSB of dividend
        let mut quotient = Self::ZERO;
        let mut remainder = Self::ZERO;

        for i in 0..256 {
            // Shift remainder left by 1
            remainder = remainder.shl(1);

            // Bring down next bit from dividend (MSB first)
            // For big-endian: bit 255 (MSB) is at byte 0, bit 7
            // bit 0 (LSB) is at byte 31, bit 0
            let byte_idx = i / 8;      // 0..31
            let bit_pos = 7 - (i % 8); // 7,6,5,4,3,2,1,0 for each byte
            if (self.0[byte_idx] >> bit_pos) & 1 == 1 {
                remainder.0[31] |= 1;
            }

            // If remainder >= divisor, subtract and set quotient bit
            if remainder >= rhs {
                remainder = remainder.checked_sub(rhs).unwrap();
                quotient.0[byte_idx] |= 1 << bit_pos;
            }
        }

        (quotient, remainder)
    }

    /// Saturating addition. Clamps to MAX on overflow.
    pub fn saturating_add(self, rhs: Self) -> Self {
        self.checked_add(rhs).unwrap_or(Self::MAX)
    }

    /// Saturating subtraction. Clamps to ZERO on underflow.
    pub fn saturating_sub(self, rhs: Self) -> Self {
        self.checked_sub(rhs).unwrap_or(Self::ZERO)
    }

    /// Saturating multiplication. Clamps to MAX on overflow.
    pub fn saturating_mul(self, rhs: Self) -> Self {
        self.checked_mul(rhs).unwrap_or(Self::MAX)
    }

    /// Wrapping addition. Wraps around on overflow.
    pub fn wrapping_add(self, rhs: Self) -> Self {
        let mut result = [0u8; 32];
        let mut carry = 0u16;

        for i in (0..32).rev() {
            let sum = self.0[i] as u16 + rhs.0[i] as u16 + carry;
            result[i] = sum as u8;
            carry = sum >> 8;
        }
        // Discard carry (wrapping behavior)
        Self(result)
    }

    /// Wrapping subtraction. Wraps around on underflow.
    pub fn wrapping_sub(self, rhs: Self) -> Self {
        let mut result = [0u8; 32];
        let mut borrow = 0i16;

        for i in (0..32).rev() {
            let diff = self.0[i] as i16 - rhs.0[i] as i16 - borrow;
            if diff < 0 {
                result[i] = (diff + 256) as u8;
                borrow = 1;
            } else {
                result[i] = diff as u8;
                borrow = 0;
            }
        }
        // Discard borrow (wrapping behavior)
        Self(result)
    }

    /// Wrapping multiplication. Wraps around on overflow (keeps lower 256 bits).
    pub fn wrapping_mul(self, rhs: Self) -> Self {
        let a = self.to_u16_limbs_le();
        let b = rhs.to_u16_limbs_le();

        // Only need 16 limbs for wrapping (discard overflow)
        let mut result = [0u32; 16];

        for i in 0..16 {
            if a[i] == 0 {
                continue;
            }
            for j in 0..16 {
                if b[j] == 0 {
                    continue;
                }
                let pos = i + j;
                if pos < 16 {
                    result[pos] += (a[i] as u32) * (b[j] as u32);
                }
            }
        }

        // Propagate carries (wrapping within 256 bits)
        let mut carry = 0u32;
        for limb in result.iter_mut() {
            *limb += carry;
            carry = *limb >> 16;
            *limb &= 0xFFFF;
        }

        Self::from_u16_limbs_le(&result)
    }

    /// Count leading zeros.
    pub fn leading_zeros(&self) -> u32 {
        let mut count = 0u32;
        for &byte in self.0.iter() {
            if byte == 0 {
                count += 8;
            } else {
                count += byte.leading_zeros();
                break;
            }
        }
        count
    }

    /// Count trailing zeros.
    pub fn trailing_zeros(&self) -> u32 {
        let mut count = 0u32;
        for &byte in self.0.iter().rev() {
            if byte == 0 {
                count += 8;
            } else {
                count += byte.trailing_zeros();
                break;
            }
        }
        count
    }

    /// Count ones (population count).
    pub fn count_ones(&self) -> u32 {
        self.0.iter().map(|&b| b.count_ones()).sum()
    }

    /// Bitwise AND.
    pub fn bit_and(self, rhs: Self) -> Self {
        let mut result = [0u8; 32];
        for i in 0..32 {
            result[i] = self.0[i] & rhs.0[i];
        }
        Self(result)
    }

    /// Bitwise OR.
    pub fn bit_or(self, rhs: Self) -> Self {
        let mut result = [0u8; 32];
        for i in 0..32 {
            result[i] = self.0[i] | rhs.0[i];
        }
        Self(result)
    }

    /// Bitwise XOR.
    pub fn bit_xor(self, rhs: Self) -> Self {
        let mut result = [0u8; 32];
        for i in 0..32 {
            result[i] = self.0[i] ^ rhs.0[i];
        }
        Self(result)
    }

    /// Bitwise NOT.
    pub fn bit_not(self) -> Self {
        let mut result = [0u8; 32];
        for i in 0..32 {
            result[i] = !self.0[i];
        }
        Self(result)
    }

    /// Left shift by `bits` positions.
    pub fn shl(self, bits: u32) -> Self {
        if bits == 0 {
            return self;
        }
        if bits >= 256 {
            return Self::ZERO;
        }

        let byte_shift = (bits / 8) as usize;
        let bit_shift = (bits % 8) as usize;

        let mut result = [0u8; 32];

        if bit_shift == 0 {
            // Whole byte shift only
            for i in 0..(32 - byte_shift) {
                result[i] = self.0[i + byte_shift];
            }
        } else {
            for i in 0..32 {
                let src_idx = i + byte_shift;
                if src_idx < 32 {
                    result[i] |= self.0[src_idx] << bit_shift;
                }
                if src_idx + 1 < 32 {
                    result[i] |= self.0[src_idx + 1] >> (8 - bit_shift);
                }
            }
        }

        Self(result)
    }

    /// Right shift by `bits` positions.
    pub fn shr(self, bits: u32) -> Self {
        if bits == 0 {
            return self;
        }
        if bits >= 256 {
            return Self::ZERO;
        }

        let byte_shift = (bits / 8) as usize;
        let bit_shift = (bits % 8) as usize;

        let mut result = [0u8; 32];

        if bit_shift == 0 {
            // Whole byte shift only
            for i in byte_shift..32 {
                result[i] = self.0[i - byte_shift];
            }
        } else {
            for i in 0..32 {
                if i >= byte_shift {
                    result[i] |= self.0[i - byte_shift] >> bit_shift;
                }
                if i > byte_shift {
                    result[i] |= self.0[i - byte_shift - 1] << (8 - bit_shift);
                }
            }
        }

        Self(result)
    }

    /// Convert to 16 u16 limbs in little-endian order (for internal arithmetic).
    fn to_u16_limbs_le(&self) -> [u16; 16] {
        let mut limbs = [0u16; 16];
        for i in 0..16 {
            let byte_idx = 30 - i * 2;
            limbs[i] = u16::from_be_bytes([self.0[byte_idx], self.0[byte_idx + 1]]);
        }
        limbs
    }

    /// Convert from u16 limbs in little-endian order.
    fn from_u16_limbs_le(limbs: &[u32]) -> Self {
        let mut bytes = [0u8; 32];
        for i in 0..16 {
            let byte_idx = 30 - i * 2;
            let limb_bytes = (limbs[i] as u16).to_be_bytes();
            bytes[byte_idx] = limb_bytes[0];
            bytes[byte_idx + 1] = limb_bytes[1];
        }
        Self(bytes)
    }
}

impl Deref for U256 {
    type Target = [u8; 32];

    #[inline]
    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl From<u64> for U256 {
    fn from(value: u64) -> Self {
        let mut bytes = [0u8; 32];
        bytes[24..].copy_from_slice(&value.to_be_bytes());
        Self(bytes)
    }
}

impl From<u128> for U256 {
    fn from(value: u128) -> Self {
        let mut bytes = [0u8; 32];
        bytes[16..].copy_from_slice(&value.to_be_bytes());
        Self(bytes)
    }
}

impl From<[u8; 32]> for U256 {
    #[inline]
    fn from(bytes: [u8; 32]) -> Self {
        Self(bytes)
    }
}

impl From<U256> for [u8; 32] {
    #[inline]
    fn from(value: U256) -> Self {
        value.0
    }
}

impl TryFrom<&[u8]> for U256 {
    type Error = Error;

    fn try_from(slice: &[u8]) -> Result<Self> {
        Self::from_slice(slice)
    }
}

impl FromStr for U256 {
    type Err = Error;

    fn from_str(s: &str) -> Result<Self> {
        Self::from_hex(s)
    }
}

impl BitAnd for U256 {
    type Output = Self;

    fn bitand(self, rhs: Self) -> Self::Output {
        self.bit_and(rhs)
    }
}

impl BitOr for U256 {
    type Output = Self;

    fn bitor(self, rhs: Self) -> Self::Output {
        self.bit_or(rhs)
    }
}

impl BitXor for U256 {
    type Output = Self;

    fn bitxor(self, rhs: Self) -> Self::Output {
        self.bit_xor(rhs)
    }
}

impl Not for U256 {
    type Output = Self;

    fn not(self) -> Self::Output {
        self.bit_not()
    }
}

impl Shl<u32> for U256 {
    type Output = Self;

    fn shl(self, rhs: u32) -> Self::Output {
        U256::shl(self, rhs)
    }
}

impl Shr<u32> for U256 {
    type Output = Self;

    fn shr(self, rhs: u32) -> Self::Output {
        U256::shr(self, rhs)
    }
}

impl fmt::Debug for U256 {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "U256({})", self.to_hex_minimal())
    }
}

impl fmt::Display for U256 {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.to_hex_minimal())
    }
}

impl fmt::LowerHex for U256 {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.to_hex())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_u256_zero() {
        assert!(U256::ZERO.is_zero());
        assert!(!U256::ONE.is_zero());
    }

    #[test]
    fn test_u256_from_u64() {
        let value = U256::from(1000u64);
        assert_eq!(value.to_u64(), Some(1000));
    }

    #[test]
    fn test_u256_from_hex() {
        let value: U256 = "0x3e8".parse().unwrap();
        assert_eq!(value.to_u64(), Some(1000));
    }

    #[test]
    fn test_u256_hex_roundtrip() {
        let value = U256::from(0xdeadbeef_u64);
        let hex = value.to_hex();
        let parsed: U256 = hex.parse().unwrap();
        assert_eq!(value, parsed);
    }

    #[test]
    fn test_u256_checked_add() {
        let a = U256::from(100u64);
        let b = U256::from(200u64);
        let sum = a.checked_add(b).unwrap();
        assert_eq!(sum.to_u64(), Some(300));
    }

    #[test]
    fn test_u256_checked_add_overflow() {
        let max = U256::MAX;
        let one = U256::ONE;
        assert!(max.checked_add(one).is_none());
    }

    #[test]
    fn test_u256_checked_sub() {
        let a = U256::from(300u64);
        let b = U256::from(100u64);
        let diff = a.checked_sub(b).unwrap();
        assert_eq!(diff.to_u64(), Some(200));
    }

    #[test]
    fn test_u256_checked_sub_underflow() {
        let a = U256::from(100u64);
        let b = U256::from(200u64);
        assert!(a.checked_sub(b).is_none());
    }

    #[test]
    fn test_u256_minimal_hex() {
        assert_eq!(U256::ZERO.to_hex_minimal(), "0x0");
        assert_eq!(U256::ONE.to_hex_minimal(), "0x1");
        assert_eq!(U256::from(0xffu64).to_hex_minimal(), "0xff");
    }

    // Checked multiplication tests
    #[test]
    fn test_checked_mul_basic() {
        let a = U256::from(100u64);
        let b = U256::from(200u64);
        let result = a.checked_mul(b).unwrap();
        assert_eq!(result.to_u64(), Some(20000));
    }

    #[test]
    fn test_checked_mul_by_zero() {
        let a = U256::from(12345u64);
        let result = a.checked_mul(U256::ZERO).unwrap();
        assert!(result.is_zero());
    }

    #[test]
    fn test_checked_mul_by_one() {
        let a = U256::from(12345u64);
        let result = a.checked_mul(U256::ONE).unwrap();
        assert_eq!(result.to_u64(), Some(12345));
    }

    #[test]
    fn test_checked_mul_overflow() {
        let max = U256::MAX;
        let two = U256::from(2u64);
        assert!(max.checked_mul(two).is_none());
    }

    #[test]
    fn test_checked_mul_large() {
        // 2^128 * 2 = 2^129 (should fit)
        let a: U256 = "0x100000000000000000000000000000000".parse().unwrap();
        let two = U256::from(2u64);
        let result = a.checked_mul(two).unwrap();
        let expected: U256 = "0x200000000000000000000000000000000".parse().unwrap();
        assert_eq!(result, expected);
    }

    #[test]
    fn test_checked_mul_overflow_at_boundary() {
        // 2^128 * 2^128 = 2^256 (overflow)
        let a: U256 = "0x100000000000000000000000000000000".parse().unwrap();
        assert!(a.checked_mul(a).is_none());
    }

    // Checked division tests
    #[test]
    fn test_checked_div_basic() {
        let a = U256::from(100u64);
        let b = U256::from(10u64);
        let result = a.checked_div(b).unwrap();
        assert_eq!(result.to_u64(), Some(10));
    }

    #[test]
    fn test_checked_div_by_zero() {
        let a = U256::from(100u64);
        assert!(a.checked_div(U256::ZERO).is_none());
    }

    #[test]
    fn test_checked_div_by_one() {
        let a = U256::from(12345u64);
        let result = a.checked_div(U256::ONE).unwrap();
        assert_eq!(result.to_u64(), Some(12345));
    }

    #[test]
    fn test_checked_div_smaller_dividend() {
        let a = U256::from(5u64);
        let b = U256::from(10u64);
        let result = a.checked_div(b).unwrap();
        assert!(result.is_zero());
    }

    #[test]
    fn test_checked_div_equal() {
        let a = U256::from(12345u64);
        let result = a.checked_div(a).unwrap();
        assert_eq!(result, U256::ONE);
    }

    // Checked remainder tests
    #[test]
    fn test_checked_rem_basic() {
        let a = U256::from(17u64);
        let b = U256::from(5u64);
        let result = a.checked_rem(b).unwrap();
        assert_eq!(result.to_u64(), Some(2));
    }

    #[test]
    fn test_checked_rem_by_zero() {
        let a = U256::from(100u64);
        assert!(a.checked_rem(U256::ZERO).is_none());
    }

    #[test]
    fn test_checked_rem_no_remainder() {
        let a = U256::from(100u64);
        let b = U256::from(10u64);
        let result = a.checked_rem(b).unwrap();
        assert!(result.is_zero());
    }

    // Saturating arithmetic tests
    #[test]
    fn test_saturating_add_normal() {
        let a = U256::from(100u64);
        let b = U256::from(200u64);
        let result = a.saturating_add(b);
        assert_eq!(result.to_u64(), Some(300));
    }

    #[test]
    fn test_saturating_add_overflow() {
        let max = U256::MAX;
        let result = max.saturating_add(U256::ONE);
        assert_eq!(result, U256::MAX);
    }

    #[test]
    fn test_saturating_sub_normal() {
        let a = U256::from(300u64);
        let b = U256::from(100u64);
        let result = a.saturating_sub(b);
        assert_eq!(result.to_u64(), Some(200));
    }

    #[test]
    fn test_saturating_sub_underflow() {
        let a = U256::from(100u64);
        let b = U256::from(200u64);
        let result = a.saturating_sub(b);
        assert_eq!(result, U256::ZERO);
    }

    #[test]
    fn test_saturating_mul_normal() {
        let a = U256::from(100u64);
        let b = U256::from(200u64);
        let result = a.saturating_mul(b);
        assert_eq!(result.to_u64(), Some(20000));
    }

    #[test]
    fn test_saturating_mul_overflow() {
        let max = U256::MAX;
        let result = max.saturating_mul(U256::from(2u64));
        assert_eq!(result, U256::MAX);
    }

    // Wrapping arithmetic tests
    #[test]
    fn test_wrapping_add_normal() {
        let a = U256::from(100u64);
        let b = U256::from(200u64);
        let result = a.wrapping_add(b);
        assert_eq!(result.to_u64(), Some(300));
    }

    #[test]
    fn test_wrapping_add_overflow() {
        let max = U256::MAX;
        let result = max.wrapping_add(U256::ONE);
        assert_eq!(result, U256::ZERO);
    }

    #[test]
    fn test_wrapping_add_overflow_two() {
        let max = U256::MAX;
        let result = max.wrapping_add(U256::from(2u64));
        assert_eq!(result, U256::ONE);
    }

    #[test]
    fn test_wrapping_sub_normal() {
        let a = U256::from(300u64);
        let b = U256::from(100u64);
        let result = a.wrapping_sub(b);
        assert_eq!(result.to_u64(), Some(200));
    }

    #[test]
    fn test_wrapping_sub_underflow() {
        let result = U256::ZERO.wrapping_sub(U256::ONE);
        assert_eq!(result, U256::MAX);
    }

    #[test]
    fn test_wrapping_mul_normal() {
        let a = U256::from(100u64);
        let b = U256::from(200u64);
        let result = a.wrapping_mul(b);
        assert_eq!(result.to_u64(), Some(20000));
    }

    #[test]
    fn test_wrapping_mul_overflow() {
        // MAX * 2 should wrap
        let max = U256::MAX;
        let two = U256::from(2u64);
        let result = max.wrapping_mul(two);
        // MAX * 2 = 2^257 - 2, which wraps to 2^256 - 2 = MAX - 1
        let expected = U256::MAX.wrapping_sub(U256::ONE);
        assert_eq!(result, expected);
    }

    // Bit counting tests
    #[test]
    fn test_leading_zeros_zero() {
        assert_eq!(U256::ZERO.leading_zeros(), 256);
    }

    #[test]
    fn test_leading_zeros_one() {
        assert_eq!(U256::ONE.leading_zeros(), 255);
    }

    #[test]
    fn test_leading_zeros_max() {
        assert_eq!(U256::MAX.leading_zeros(), 0);
    }

    #[test]
    fn test_leading_zeros_power_of_two() {
        let val = U256::from(0x8000_0000_0000_0000u64); // 2^63
        assert_eq!(val.leading_zeros(), 256 - 64);
    }

    #[test]
    fn test_trailing_zeros_zero() {
        assert_eq!(U256::ZERO.trailing_zeros(), 256);
    }

    #[test]
    fn test_trailing_zeros_one() {
        assert_eq!(U256::ONE.trailing_zeros(), 0);
    }

    #[test]
    fn test_trailing_zeros_power_of_two() {
        let val = U256::from(0x100u64); // 2^8
        assert_eq!(val.trailing_zeros(), 8);
    }

    #[test]
    fn test_count_ones_zero() {
        assert_eq!(U256::ZERO.count_ones(), 0);
    }

    #[test]
    fn test_count_ones_one() {
        assert_eq!(U256::ONE.count_ones(), 1);
    }

    #[test]
    fn test_count_ones_max() {
        assert_eq!(U256::MAX.count_ones(), 256);
    }

    #[test]
    fn test_count_ones_mixed() {
        let val = U256::from(0b10101010u64);
        assert_eq!(val.count_ones(), 4);
    }

    // Bitwise operation tests
    #[test]
    fn test_bit_and() {
        let a = U256::from(0b1100u64);
        let b = U256::from(0b1010u64);
        let result = a.bit_and(b);
        assert_eq!(result.to_u64(), Some(0b1000));
    }

    #[test]
    fn test_bit_and_trait() {
        let a = U256::from(0b1100u64);
        let b = U256::from(0b1010u64);
        let result = a & b;
        assert_eq!(result.to_u64(), Some(0b1000));
    }

    #[test]
    fn test_bit_or() {
        let a = U256::from(0b1100u64);
        let b = U256::from(0b1010u64);
        let result = a.bit_or(b);
        assert_eq!(result.to_u64(), Some(0b1110));
    }

    #[test]
    fn test_bit_or_trait() {
        let a = U256::from(0b1100u64);
        let b = U256::from(0b1010u64);
        let result = a | b;
        assert_eq!(result.to_u64(), Some(0b1110));
    }

    #[test]
    fn test_bit_xor() {
        let a = U256::from(0b1100u64);
        let b = U256::from(0b1010u64);
        let result = a.bit_xor(b);
        assert_eq!(result.to_u64(), Some(0b0110));
    }

    #[test]
    fn test_bit_xor_trait() {
        let a = U256::from(0b1100u64);
        let b = U256::from(0b1010u64);
        let result = a ^ b;
        assert_eq!(result.to_u64(), Some(0b0110));
    }

    #[test]
    fn test_bit_not() {
        let zero = U256::ZERO;
        let result = zero.bit_not();
        assert_eq!(result, U256::MAX);
    }

    #[test]
    fn test_bit_not_trait() {
        let zero = U256::ZERO;
        let result = !zero;
        assert_eq!(result, U256::MAX);
    }

    #[test]
    fn test_bit_not_max() {
        let max = U256::MAX;
        let result = max.bit_not();
        assert_eq!(result, U256::ZERO);
    }

    // Shift operation tests
    #[test]
    fn test_shl_zero_bits() {
        let val = U256::from(0xFFu64);
        let result = val.shl(0);
        assert_eq!(result, val);
    }

    #[test]
    fn test_shl_one_bit() {
        let val = U256::from(1u64);
        let result = val.shl(1);
        assert_eq!(result.to_u64(), Some(2));
    }

    #[test]
    fn test_shl_eight_bits() {
        let val = U256::from(1u64);
        let result = val.shl(8);
        assert_eq!(result.to_u64(), Some(256));
    }

    #[test]
    fn test_shl_overflow() {
        let val = U256::from(1u64);
        let result = val.shl(256);
        assert_eq!(result, U256::ZERO);
    }

    #[test]
    fn test_shl_large_shift() {
        let val = U256::from(1u64);
        let result = val.shl(300);
        assert_eq!(result, U256::ZERO);
    }

    #[test]
    fn test_shl_trait() {
        let val = U256::from(1u64);
        let result = val << 4;
        assert_eq!(result.to_u64(), Some(16));
    }

    #[test]
    fn test_shr_zero_bits() {
        let val = U256::from(0xFFu64);
        let result = val.shr(0);
        assert_eq!(result, val);
    }

    #[test]
    fn test_shr_one_bit() {
        let val = U256::from(4u64);
        let result = val.shr(1);
        assert_eq!(result.to_u64(), Some(2));
    }

    #[test]
    fn test_shr_eight_bits() {
        let val = U256::from(256u64);
        let result = val.shr(8);
        assert_eq!(result.to_u64(), Some(1));
    }

    #[test]
    fn test_shr_underflow() {
        let val = U256::from(1u64);
        let result = val.shr(256);
        assert_eq!(result, U256::ZERO);
    }

    #[test]
    fn test_shr_large_shift() {
        let val = U256::MAX;
        let result = val.shr(300);
        assert_eq!(result, U256::ZERO);
    }

    #[test]
    fn test_shr_trait() {
        let val = U256::from(16u64);
        let result = val >> 4;
        assert_eq!(result.to_u64(), Some(1));
    }

    #[test]
    fn test_shift_roundtrip() {
        let val = U256::from(0xDEADBEEFu64);
        let shifted = val.shl(100);
        let unshifted = shifted.shr(100);
        assert_eq!(unshifted, val);
    }

    #[test]
    fn test_shl_crosses_byte_boundary() {
        let val = U256::from(0xFFu64);
        let result = val.shl(4);
        assert_eq!(result.to_u64(), Some(0xFF0));
    }

    #[test]
    fn test_shr_crosses_byte_boundary() {
        let val = U256::from(0xFF0u64);
        let result = val.shr(4);
        assert_eq!(result.to_u64(), Some(0xFF));
    }

    // Large number division test
    #[test]
    fn test_div_large_numbers() {
        let a: U256 = "0x10000000000000000".parse().unwrap(); // 2^64
        let b: U256 = "0x100000000".parse().unwrap(); // 2^32
        let result = a.checked_div(b).unwrap();
        let expected: U256 = "0x100000000".parse().unwrap(); // 2^32
        assert_eq!(result, expected);
    }

    #[test]
    fn test_rem_large_numbers() {
        let a = U256::from(1000000007u64);
        let b = U256::from(1000000u64);
        let result = a.checked_rem(b).unwrap();
        assert_eq!(result.to_u64(), Some(7));
    }
}
