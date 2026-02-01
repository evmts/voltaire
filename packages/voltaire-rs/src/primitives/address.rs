//! Ethereum address type.
//!
//! A 20-byte Ethereum address with support for:
//! - EIP-55 mixed-case checksum encoding
//! - Parsing from hex strings (with or without 0x prefix)
//! - Derivation from public keys
//! - CREATE and CREATE2 address computation

use core::fmt;
use core::str::FromStr;
use core::ops::Deref;

use crate::error::{Error, Result};

/// 20-byte Ethereum address.
///
/// This type wraps a fixed-size byte array and provides convenient methods
/// for address manipulation, display, and comparison.
///
/// # Examples
///
/// ```rust
/// use voltaire::Address;
///
/// // Parse from hex string
/// let addr: Address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045".parse()?;
///
/// // Check if zero address
/// assert!(!addr.is_zero());
///
/// // Display with checksum
/// println!("{}", addr); // 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
/// # Ok::<(), voltaire::Error>(())
/// ```
#[derive(Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Default)]
#[repr(transparent)]
pub struct Address([u8; 20]);

impl Address {
    /// Zero address constant.
    pub const ZERO: Self = Self([0u8; 20]);

    /// Address byte length.
    pub const LEN: usize = 20;

    /// Create address from raw bytes.
    #[inline]
    pub const fn new(bytes: [u8; 20]) -> Self {
        Self(bytes)
    }

    /// Create address from byte slice.
    ///
    /// Returns error if slice is not exactly 20 bytes.
    #[inline]
    pub fn from_slice(slice: &[u8]) -> Result<Self> {
        if slice.len() != 20 {
            return Err(Error::invalid_length(20, slice.len()));
        }
        let mut bytes = [0u8; 20];
        bytes.copy_from_slice(slice);
        Ok(Self(bytes))
    }

    /// Parse address from hex string.
    ///
    /// Accepts with or without `0x` prefix. Case-insensitive.
    pub fn from_hex(s: &str) -> Result<Self> {
        let s = s.strip_prefix("0x").unwrap_or(s);

        if s.len() != 40 {
            return Err(Error::invalid_length(40, s.len()));
        }

        let bytes = hex::decode(s)
            .map_err(|e| Error::invalid_hex(e.to_string()))?;

        Self::from_slice(&bytes)
    }

    /// Get the raw bytes.
    #[inline]
    pub const fn as_bytes(&self) -> &[u8; 20] {
        &self.0
    }

    /// Get mutable reference to raw bytes.
    #[inline]
    pub fn as_bytes_mut(&mut self) -> &mut [u8; 20] {
        &mut self.0
    }

    /// Convert to fixed-size byte array.
    #[inline]
    pub const fn to_bytes(self) -> [u8; 20] {
        self.0
    }

    /// Check if this is the zero address.
    #[inline]
    pub fn is_zero(&self) -> bool {
        self.0 == [0u8; 20]
    }

    /// Convert to lowercase hex string with 0x prefix.
    pub fn to_hex(&self) -> String {
        format!("0x{}", hex::encode(self.0))
    }

    /// Convert to EIP-55 checksummed hex string.
    ///
    /// The checksum is computed by hashing the lowercase hex representation
    /// and using the hash to determine case for each character.
    #[cfg(feature = "native")]
    pub fn to_checksum(&self) -> String {
        // Use FFI for checksum computation
        crate::ffi::address_to_checksum(self)
    }

    /// Convert to EIP-55 checksummed hex string (pure Rust).
    #[cfg(not(feature = "native"))]
    pub fn to_checksum(&self) -> String {
        // Pure Rust implementation
        use crate::crypto::keccak256;

        let hex_addr = hex::encode(self.0);
        let hash = keccak256(hex_addr.as_bytes());

        let mut result = String::with_capacity(42);
        result.push_str("0x");

        for (i, c) in hex_addr.chars().enumerate() {
            let hash_nibble = if i % 2 == 0 {
                hash.0[i / 2] >> 4
            } else {
                hash.0[i / 2] & 0x0f
            };

            if hash_nibble >= 8 {
                result.push(c.to_ascii_uppercase());
            } else {
                result.push(c);
            }
        }

        result
    }

    /// Validate EIP-55 checksum.
    pub fn is_valid_checksum(s: &str) -> bool {
        let s = s.strip_prefix("0x").unwrap_or(s);

        if s.len() != 40 {
            return false;
        }

        // Parse the address
        let addr = match Self::from_hex(s) {
            Ok(a) => a,
            Err(_) => return false,
        };

        // Compare with computed checksum
        let checksum = addr.to_checksum();
        let checksum = checksum.strip_prefix("0x").unwrap_or(&checksum);

        s == checksum
    }

    /// Derive address from uncompressed public key (64 bytes).
    ///
    /// Computes Keccak256 hash of the public key and takes the last 20 bytes.
    pub fn from_public_key(pubkey: &[u8; 64]) -> Result<Self> {
        use crate::crypto::keccak256;

        let hash = keccak256(pubkey);
        let mut bytes = [0u8; 20];
        bytes.copy_from_slice(&hash.0[12..32]);
        Ok(Self(bytes))
    }

    /// Compute CREATE address from sender and nonce.
    ///
    /// address = keccak256(rlp([sender, nonce]))[12:]
    #[cfg(feature = "native")]
    pub fn create_address(sender: &Address, nonce: u64) -> Result<Self> {
        crate::ffi::calculate_create_address(sender, nonce)
    }

    /// Compute CREATE2 address from sender, salt, and init code hash.
    ///
    /// address = keccak256(0xff ++ sender ++ salt ++ keccak256(init_code))[12:]
    pub fn create2_address(
        sender: &Address,
        salt: &[u8; 32],
        init_code_hash: &[u8; 32],
    ) -> Self {
        use crate::crypto::keccak256;

        let mut input = [0u8; 85];
        input[0] = 0xff;
        input[1..21].copy_from_slice(&sender.0);
        input[21..53].copy_from_slice(salt);
        input[53..85].copy_from_slice(init_code_hash);

        let hash = keccak256(&input);
        let mut bytes = [0u8; 20];
        bytes.copy_from_slice(&hash.0[12..32]);
        Self(bytes)
    }

    /// Constant-time equality comparison.
    ///
    /// Use this when comparing addresses in security-sensitive contexts.
    #[inline]
    pub fn ct_eq(&self, other: &Self) -> bool {
        let mut result = 0u8;
        for (a, b) in self.0.iter().zip(other.0.iter()) {
            result |= a ^ b;
        }
        result == 0
    }
}

impl Deref for Address {
    type Target = [u8; 20];

    #[inline]
    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl AsRef<[u8]> for Address {
    #[inline]
    fn as_ref(&self) -> &[u8] {
        &self.0
    }
}

impl AsRef<[u8; 20]> for Address {
    #[inline]
    fn as_ref(&self) -> &[u8; 20] {
        &self.0
    }
}

impl From<[u8; 20]> for Address {
    #[inline]
    fn from(bytes: [u8; 20]) -> Self {
        Self(bytes)
    }
}

impl From<Address> for [u8; 20] {
    #[inline]
    fn from(addr: Address) -> Self {
        addr.0
    }
}

impl TryFrom<&[u8]> for Address {
    type Error = Error;

    fn try_from(slice: &[u8]) -> Result<Self> {
        Self::from_slice(slice)
    }
}

impl FromStr for Address {
    type Err = Error;

    fn from_str(s: &str) -> Result<Self> {
        Self::from_hex(s)
    }
}

impl fmt::Debug for Address {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "Address({})", self.to_checksum())
    }
}

impl fmt::Display for Address {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.to_checksum())
    }
}

impl fmt::LowerHex for Address {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "0x{}", hex::encode(self.0))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_address_parse() {
        let addr: Address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
            .parse()
            .unwrap();
        assert!(!addr.is_zero());
    }

    #[test]
    fn test_address_zero() {
        assert!(Address::ZERO.is_zero());
        assert_eq!(Address::ZERO.to_hex(), "0x0000000000000000000000000000000000000000");
    }

    #[test]
    fn test_address_from_slice() {
        let bytes = [1u8; 20];
        let addr = Address::from_slice(&bytes).unwrap();
        assert_eq!(addr.as_bytes(), &bytes);
    }

    #[test]
    fn test_address_from_slice_invalid_length() {
        let bytes = [1u8; 19];
        assert!(Address::from_slice(&bytes).is_err());
    }

    #[test]
    fn test_address_checksum() {
        let addr: Address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
            .parse()
            .unwrap();
        assert_eq!(
            addr.to_checksum(),
            "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
        );
    }

    #[test]
    fn test_address_ct_eq() {
        let a = Address::new([1u8; 20]);
        let b = Address::new([1u8; 20]);
        let c = Address::new([2u8; 20]);

        assert!(a.ct_eq(&b));
        assert!(!a.ct_eq(&c));
    }

    #[test]
    fn test_address_create2() {
        let sender = Address::ZERO;
        let salt = [0u8; 32];
        let init_code_hash = [0u8; 32];

        let addr = Address::create2_address(&sender, &salt, &init_code_hash);
        assert!(!addr.is_zero());
    }
}
