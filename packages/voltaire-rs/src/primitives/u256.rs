//! 256-bit unsigned integer type.
//!
//! A big-endian 256-bit unsigned integer for Ethereum values.

use core::fmt;
use core::str::FromStr;
use core::ops::Deref;

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
}
