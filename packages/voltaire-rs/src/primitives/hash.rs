//! 32-byte hash type.
//!
//! Used for Keccak256 hashes, storage keys, and other 32-byte values.

use core::fmt;
use core::str::FromStr;
use core::ops::Deref;

use crate::error::{Error, Result};

/// 32-byte hash value.
///
/// This type is used for Keccak256 outputs, storage keys, transaction hashes,
/// and other 32-byte cryptographic values.
///
/// # Examples
///
/// ```rust
/// use voltaire::{Hash, keccak256};
///
/// let hash = keccak256(b"hello");
/// println!("Hash: {}", hash);
///
/// // Parse from hex
/// let hash: Hash = "0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8".parse()?;
/// # Ok::<(), voltaire::Error>(())
/// ```
#[derive(Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Default)]
#[repr(transparent)]
pub struct Hash(pub(crate) [u8; 32]);

impl Hash {
    /// Zero hash constant.
    pub const ZERO: Self = Self([0u8; 32]);

    /// Hash byte length.
    pub const LEN: usize = 32;

    /// Create hash from raw bytes.
    #[inline]
    pub const fn new(bytes: [u8; 32]) -> Self {
        Self(bytes)
    }

    /// Create hash from byte slice.
    #[inline]
    pub fn from_slice(slice: &[u8]) -> Result<Self> {
        if slice.len() != 32 {
            return Err(Error::invalid_length(32, slice.len()));
        }
        let mut bytes = [0u8; 32];
        bytes.copy_from_slice(slice);
        Ok(Self(bytes))
    }

    /// Parse hash from hex string.
    pub fn from_hex(s: &str) -> Result<Self> {
        let s = s.strip_prefix("0x").unwrap_or(s);

        if s.len() != 64 {
            return Err(Error::invalid_length(64, s.len()));
        }

        let bytes = hex::decode(s)
            .map_err(|e| Error::invalid_hex(e.to_string()))?;

        Self::from_slice(&bytes)
    }

    /// Get the raw bytes.
    #[inline]
    pub const fn as_bytes(&self) -> &[u8; 32] {
        &self.0
    }

    /// Get mutable reference to raw bytes.
    #[inline]
    pub fn as_bytes_mut(&mut self) -> &mut [u8; 32] {
        &mut self.0
    }

    /// Convert to fixed-size byte array.
    #[inline]
    pub const fn to_bytes(self) -> [u8; 32] {
        self.0
    }

    /// Check if this is the zero hash.
    #[inline]
    pub fn is_zero(&self) -> bool {
        self.0 == [0u8; 32]
    }

    /// Convert to hex string with 0x prefix.
    pub fn to_hex(&self) -> String {
        format!("0x{}", hex::encode(self.0))
    }

    /// Constant-time equality comparison.
    #[inline]
    pub fn ct_eq(&self, other: &Self) -> bool {
        let mut result = 0u8;
        for (a, b) in self.0.iter().zip(other.0.iter()) {
            result |= a ^ b;
        }
        result == 0
    }
}

impl Deref for Hash {
    type Target = [u8; 32];

    #[inline]
    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl AsRef<[u8]> for Hash {
    #[inline]
    fn as_ref(&self) -> &[u8] {
        &self.0
    }
}

impl AsRef<[u8; 32]> for Hash {
    #[inline]
    fn as_ref(&self) -> &[u8; 32] {
        &self.0
    }
}

impl From<[u8; 32]> for Hash {
    #[inline]
    fn from(bytes: [u8; 32]) -> Self {
        Self(bytes)
    }
}

impl From<Hash> for [u8; 32] {
    #[inline]
    fn from(hash: Hash) -> Self {
        hash.0
    }
}

impl TryFrom<&[u8]> for Hash {
    type Error = Error;

    fn try_from(slice: &[u8]) -> Result<Self> {
        Self::from_slice(slice)
    }
}

impl FromStr for Hash {
    type Err = Error;

    fn from_str(s: &str) -> Result<Self> {
        Self::from_hex(s)
    }
}

impl fmt::Debug for Hash {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "Hash({})", self.to_hex())
    }
}

impl fmt::Display for Hash {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.to_hex())
    }
}

impl fmt::LowerHex for Hash {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "0x{}", hex::encode(self.0))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hash_zero() {
        assert!(Hash::ZERO.is_zero());
    }

    #[test]
    fn test_hash_from_slice() {
        let bytes = [1u8; 32];
        let hash = Hash::from_slice(&bytes).unwrap();
        assert_eq!(hash.as_bytes(), &bytes);
    }

    #[test]
    fn test_hash_from_hex() {
        let hex = "0x0000000000000000000000000000000000000000000000000000000000000001";
        let hash = Hash::from_hex(hex).unwrap();
        assert_eq!(hash.0[31], 1);
    }

    #[test]
    fn test_hash_ct_eq() {
        let a = Hash::new([1u8; 32]);
        let b = Hash::new([1u8; 32]);
        let c = Hash::new([2u8; 32]);

        assert!(a.ct_eq(&b));
        assert!(!a.ct_eq(&c));
    }

    #[test]
    fn test_hash_display() {
        let hash = Hash::new([0u8; 32]);
        let s = hash.to_string();
        assert!(s.starts_with("0x"));
        assert_eq!(s.len(), 66);
    }
}
