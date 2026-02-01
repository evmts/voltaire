//! Ethereum address type.
//!
//! A 20-byte Ethereum address with support for:
//! - EIP-55 mixed-case checksum encoding
//! - Parsing from hex strings (with or without 0x prefix)
//! - Derivation from public keys and private keys
//! - CREATE and CREATE2 address computation
//! - ABI encoding/decoding
//! - Sorting and comparison

#[cfg(not(feature = "std"))]
use alloc::{format, string::String, vec, vec::Vec, collections::BTreeSet};

#[cfg(feature = "std")]
use std::collections::HashSet;

use core::cmp::Ordering;
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

    /// Derive address from secp256k1 private key.
    ///
    /// Derives the public key from the private key, then computes the address.
    ///
    /// # Examples
    ///
    /// ```rust,ignore
    /// use voltaire::Address;
    ///
    /// let private_key = [0x01u8; 32]; // Example key
    /// let addr = Address::from_private_key(&private_key)?;
    /// ```
    pub fn from_private_key(private_key: &[u8; 32]) -> Result<Self> {
        use crate::crypto::Secp256k1;

        let pubkey = Secp256k1::pubkey_from_private(private_key)?;
        Self::from_public_key(&pubkey)
    }

    /// Compute CREATE address from sender and nonce.
    ///
    /// This is a pure Rust implementation that doesn't require the native feature.
    /// address = keccak256(rlp([sender, nonce]))[12:]
    ///
    /// # Examples
    ///
    /// ```rust
    /// use voltaire::Address;
    ///
    /// let sender: Address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045".parse().unwrap();
    /// let contract_addr = Address::calculate_create_address(&sender, 0);
    /// ```
    pub fn calculate_create_address(sender: &Address, nonce: u64) -> Self {
        use crate::crypto::keccak256;

        // RLP encode [sender, nonce]
        // Sender is 20 bytes, so it's encoded as 0x94 + sender (21 bytes)
        // Nonce encoding depends on value
        let nonce_bytes = rlp_encode_nonce(nonce);
        let nonce_len = nonce_bytes.len();

        // Total payload = 21 (sender) + nonce_len
        let payload_len = 21 + nonce_len;

        // List header
        let mut input = Vec::with_capacity(1 + payload_len);
        if payload_len < 56 {
            input.push(0xc0 + payload_len as u8);
        } else {
            // payload_len as bytes
            let len_bytes = encode_length_bytes(payload_len);
            input.push(0xf7 + len_bytes.len() as u8);
            input.extend_from_slice(&len_bytes);
        }

        // Sender: 0x94 prefix for 20-byte string
        input.push(0x94);
        input.extend_from_slice(&sender.0);

        // Nonce
        input.extend_from_slice(&nonce_bytes);

        let hash = keccak256(&input);
        let mut bytes = [0u8; 20];
        bytes.copy_from_slice(&hash.0[12..32]);
        Self(bytes)
    }

    /// Compute CREATE2 address from sender, salt, and init code.
    ///
    /// address = keccak256(0xff ++ sender ++ salt ++ keccak256(init_code))[12:]
    ///
    /// # Examples
    ///
    /// ```rust
    /// use voltaire::Address;
    ///
    /// let sender = Address::ZERO;
    /// let salt = [0u8; 32];
    /// let init_code = vec![0x60, 0x00]; // PUSH1 0x00
    /// let addr = Address::calculate_create2_address(&sender, &salt, &init_code);
    /// ```
    pub fn calculate_create2_address(
        sender: &Address,
        salt: &[u8; 32],
        init_code: &[u8],
    ) -> Self {
        use crate::crypto::keccak256;

        let init_code_hash = keccak256(init_code);
        Self::create2_address(sender, salt, &init_code_hash.0)
    }

    /// Extract address from 32-byte ABI encoding.
    ///
    /// ABI-encoded addresses are left-padded with 12 zero bytes.
    /// Returns error if first 12 bytes are not zero.
    ///
    /// # Examples
    ///
    /// ```rust
    /// use voltaire::Address;
    ///
    /// let mut abi_encoded = [0u8; 32];
    /// abi_encoded[12..].copy_from_slice(&[0xab; 20]);
    /// let addr = Address::from_abi_encoded(&abi_encoded).unwrap();
    /// assert_eq!(addr.as_bytes(), &[0xab; 20]);
    /// ```
    pub fn from_abi_encoded(data: &[u8; 32]) -> Result<Self> {
        // First 12 bytes must be zero
        for (i, &byte) in data[..12].iter().enumerate() {
            if byte != 0 {
                return Err(Error::invalid_input(format!(
                    "ABI-encoded address has non-zero byte at position {}: 0x{:02x}",
                    i, byte
                )));
            }
        }

        let mut bytes = [0u8; 20];
        bytes.copy_from_slice(&data[12..]);
        Ok(Self(bytes))
    }

    /// Encode address as 32-byte ABI format.
    ///
    /// Left-pads with 12 zero bytes.
    ///
    /// # Examples
    ///
    /// ```rust
    /// use voltaire::Address;
    ///
    /// let addr = Address::new([0xab; 20]);
    /// let encoded = addr.to_abi_encoded();
    /// assert_eq!(&encoded[..12], &[0u8; 12]);
    /// assert_eq!(&encoded[12..], &[0xab; 20]);
    /// ```
    #[inline]
    pub fn to_abi_encoded(&self) -> [u8; 32] {
        let mut result = [0u8; 32];
        result[12..].copy_from_slice(&self.0);
        result
    }

    /// Lexicographic comparison with another address.
    ///
    /// Returns ordering based on byte-by-byte comparison.
    #[inline]
    pub fn compare(&self, other: &Self) -> Ordering {
        self.0.cmp(&other.0)
    }

    /// Check if this address is lexicographically less than another.
    #[inline]
    pub fn less_than(&self, other: &Self) -> bool {
        self.0 < other.0
    }

    /// Check if this address is lexicographically greater than another.
    #[inline]
    pub fn greater_than(&self, other: &Self) -> bool {
        self.0 > other.0
    }

    /// Convert to truncated hex display format.
    ///
    /// Shows first `start` and last `end` hex characters with "..." in between.
    ///
    /// # Examples
    ///
    /// ```rust
    /// use voltaire::Address;
    ///
    /// let addr: Address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045".parse().unwrap();
    /// assert_eq!(addr.to_short_hex(4, 4), "0xd8dA...6045");
    /// assert_eq!(addr.to_short_hex(6, 4), "0xd8dA6B...6045");
    /// ```
    pub fn to_short_hex(&self, start: usize, end: usize) -> String {
        let checksum = self.to_checksum();
        let hex_part = &checksum[2..]; // Remove "0x"

        if start + end >= hex_part.len() {
            return checksum;
        }

        format!(
            "0x{}...{}",
            &hex_part[..start],
            &hex_part[hex_part.len() - end..]
        )
    }
}

/// RLP encode a nonce value.
fn rlp_encode_nonce(nonce: u64) -> Vec<u8> {
    if nonce == 0 {
        // 0 is encoded as 0x80 (empty string)
        vec![0x80]
    } else if nonce < 128 {
        // Single byte for values < 128
        vec![nonce as u8]
    } else {
        // Multi-byte encoding
        let bytes = nonce.to_be_bytes();
        let start = bytes.iter().position(|&b| b != 0).unwrap_or(8);
        let significant = &bytes[start..];
        let len = significant.len();

        let mut result = Vec::with_capacity(1 + len);
        result.push(0x80 + len as u8);
        result.extend_from_slice(significant);
        result
    }
}

/// Encode a length as minimal bytes.
fn encode_length_bytes(len: usize) -> Vec<u8> {
    if len == 0 {
        vec![0]
    } else {
        let bytes = len.to_be_bytes();
        let start = bytes.iter().position(|&b| b != 0).unwrap_or(bytes.len());
        bytes[start..].to_vec()
    }
}

/// Sort addresses in place (lexicographic order).
///
/// # Examples
///
/// ```rust
/// use voltaire::primitives::{Address, sort_addresses};
///
/// let mut addresses = vec![
///     Address::new([0x02; 20]),
///     Address::new([0x01; 20]),
///     Address::new([0x03; 20]),
/// ];
/// sort_addresses(&mut addresses);
/// assert_eq!(addresses[0], Address::new([0x01; 20]));
/// assert_eq!(addresses[1], Address::new([0x02; 20]));
/// assert_eq!(addresses[2], Address::new([0x03; 20]));
/// ```
pub fn sort_addresses(addresses: &mut [Address]) {
    addresses.sort();
}

/// Remove duplicate addresses while preserving order.
///
/// Returns a new vector with duplicates removed.
/// The first occurrence of each address is kept.
///
/// # Examples
///
/// ```rust
/// use voltaire::primitives::{Address, deduplicate_addresses};
///
/// let addresses = vec![
///     Address::new([0x01; 20]),
///     Address::new([0x02; 20]),
///     Address::new([0x01; 20]), // duplicate
///     Address::new([0x03; 20]),
/// ];
/// let unique = deduplicate_addresses(addresses);
/// assert_eq!(unique.len(), 3);
/// ```
#[cfg(feature = "std")]
pub fn deduplicate_addresses(addresses: Vec<Address>) -> Vec<Address> {
    let mut seen = HashSet::new();
    addresses
        .into_iter()
        .filter(|addr| seen.insert(*addr))
        .collect()
}

/// Remove duplicate addresses while preserving order (no_std version).
#[cfg(not(feature = "std"))]
pub fn deduplicate_addresses(addresses: Vec<Address>) -> Vec<Address> {
    let mut seen = BTreeSet::new();
    addresses
        .into_iter()
        .filter(|addr| seen.insert(*addr))
        .collect()
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

    // ============ calculate_create_address Tests ============

    #[test]
    fn test_calculate_create_address_nonce_0() {
        // Known test vector: sender = 0x0000...0000, nonce = 0
        // Expected address computed via RLP([sender, 0]) then keccak
        let sender = Address::ZERO;
        let addr = Address::calculate_create_address(&sender, 0);
        // Just verify it's deterministic and not zero
        assert!(!addr.is_zero());

        // Same inputs should give same output
        let addr2 = Address::calculate_create_address(&sender, 0);
        assert_eq!(addr, addr2);
    }

    #[test]
    fn test_calculate_create_address_nonce_1() {
        let sender = Address::ZERO;
        let addr0 = Address::calculate_create_address(&sender, 0);
        let addr1 = Address::calculate_create_address(&sender, 1);
        // Different nonces should give different addresses
        assert_ne!(addr0, addr1);
    }

    #[test]
    fn test_calculate_create_address_high_nonce() {
        let sender: Address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
            .parse()
            .unwrap();
        // Test with large nonce that requires multi-byte encoding
        let addr = Address::calculate_create_address(&sender, 0x1234567890);
        assert!(!addr.is_zero());
    }

    #[test]
    fn test_calculate_create_address_known_vector() {
        // Test vector from Ethereum Yellow Paper / common test cases
        // Sender: 0x6ac7ea33f8831ea9dcc53393aaa88b25a785dbf0
        // Nonce: 1
        // Expected: 0x343c43a37d37dff08ae8c4a11544c718abb4fcf8
        let sender: Address = "0x6ac7ea33f8831ea9dcc53393aaa88b25a785dbf0"
            .parse()
            .unwrap();
        let addr = Address::calculate_create_address(&sender, 1);
        let expected: Address = "0x343c43a37d37dff08ae8c4a11544c718abb4fcf8"
            .parse()
            .unwrap();
        assert_eq!(addr, expected);
    }

    // ============ calculate_create2_address Tests ============

    #[test]
    fn test_calculate_create2_address_basic() {
        let sender = Address::ZERO;
        let salt = [0u8; 32];
        let init_code = vec![0x60, 0x00]; // PUSH1 0x00
        let addr = Address::calculate_create2_address(&sender, &salt, &init_code);
        assert!(!addr.is_zero());
    }

    #[test]
    fn test_calculate_create2_address_deterministic() {
        let sender: Address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
            .parse()
            .unwrap();
        let salt = [0xab; 32];
        let init_code = vec![0x60, 0x80, 0x60, 0x40]; // Some bytecode

        let addr1 = Address::calculate_create2_address(&sender, &salt, &init_code);
        let addr2 = Address::calculate_create2_address(&sender, &salt, &init_code);
        assert_eq!(addr1, addr2);
    }

    #[test]
    fn test_calculate_create2_different_salt() {
        let sender = Address::ZERO;
        let salt1 = [0x00; 32];
        let salt2 = [0x01; 32];
        let init_code = vec![0x00];

        let addr1 = Address::calculate_create2_address(&sender, &salt1, &init_code);
        let addr2 = Address::calculate_create2_address(&sender, &salt2, &init_code);
        assert_ne!(addr1, addr2);
    }

    // ============ ABI Encoding Tests ============

    #[test]
    fn test_to_abi_encoded() {
        let addr = Address::new([0xab; 20]);
        let encoded = addr.to_abi_encoded();

        // First 12 bytes should be zero
        assert_eq!(&encoded[..12], &[0u8; 12]);
        // Last 20 bytes should be the address
        assert_eq!(&encoded[12..], &[0xab; 20]);
    }

    #[test]
    fn test_from_abi_encoded_valid() {
        let mut abi_encoded = [0u8; 32];
        abi_encoded[12..].copy_from_slice(&[0xcd; 20]);

        let addr = Address::from_abi_encoded(&abi_encoded).unwrap();
        assert_eq!(addr.as_bytes(), &[0xcd; 20]);
    }

    #[test]
    fn test_from_abi_encoded_invalid_padding() {
        let mut abi_encoded = [0u8; 32];
        abi_encoded[0] = 0x01; // Non-zero in padding area
        abi_encoded[12..].copy_from_slice(&[0xab; 20]);

        let result = Address::from_abi_encoded(&abi_encoded);
        assert!(result.is_err());
    }

    #[test]
    fn test_abi_roundtrip() {
        let original = Address::new([0x42; 20]);
        let encoded = original.to_abi_encoded();
        let decoded = Address::from_abi_encoded(&encoded).unwrap();
        assert_eq!(original, decoded);
    }

    // ============ Comparison Tests ============

    #[test]
    fn test_compare_equal() {
        let a = Address::new([0x42; 20]);
        let b = Address::new([0x42; 20]);
        assert_eq!(a.compare(&b), Ordering::Equal);
    }

    #[test]
    fn test_compare_less() {
        let a = Address::new([0x01; 20]);
        let b = Address::new([0x02; 20]);
        assert_eq!(a.compare(&b), Ordering::Less);
    }

    #[test]
    fn test_compare_greater() {
        let a = Address::new([0xff; 20]);
        let b = Address::new([0x00; 20]);
        assert_eq!(a.compare(&b), Ordering::Greater);
    }

    #[test]
    fn test_less_than() {
        let a = Address::new([0x01; 20]);
        let b = Address::new([0x02; 20]);
        assert!(a.less_than(&b));
        assert!(!b.less_than(&a));
        assert!(!a.less_than(&a));
    }

    #[test]
    fn test_greater_than() {
        let a = Address::new([0x02; 20]);
        let b = Address::new([0x01; 20]);
        assert!(a.greater_than(&b));
        assert!(!b.greater_than(&a));
        assert!(!a.greater_than(&a));
    }

    // ============ to_short_hex Tests ============

    #[test]
    fn test_to_short_hex_basic() {
        let addr: Address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
            .parse()
            .unwrap();
        let short = addr.to_short_hex(4, 4);
        assert_eq!(short, "0xd8dA...6045");
    }

    #[test]
    fn test_to_short_hex_longer() {
        let addr: Address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
            .parse()
            .unwrap();
        let short = addr.to_short_hex(6, 4);
        assert_eq!(short, "0xd8dA6B...6045");
    }

    #[test]
    fn test_to_short_hex_full_length() {
        let addr: Address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
            .parse()
            .unwrap();
        // When start + end >= 40, return full checksum
        let short = addr.to_short_hex(20, 20);
        assert_eq!(short, "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");
    }

    #[test]
    fn test_to_short_hex_zero_address() {
        let short = Address::ZERO.to_short_hex(4, 4);
        assert_eq!(short, "0x0000...0000");
    }

    // ============ sort_addresses Tests ============

    #[test]
    fn test_sort_addresses() {
        let mut addresses = vec![
            Address::new([0x03; 20]),
            Address::new([0x01; 20]),
            Address::new([0x02; 20]),
        ];
        sort_addresses(&mut addresses);

        assert_eq!(addresses[0], Address::new([0x01; 20]));
        assert_eq!(addresses[1], Address::new([0x02; 20]));
        assert_eq!(addresses[2], Address::new([0x03; 20]));
    }

    #[test]
    fn test_sort_addresses_already_sorted() {
        let mut addresses = vec![
            Address::new([0x01; 20]),
            Address::new([0x02; 20]),
            Address::new([0x03; 20]),
        ];
        sort_addresses(&mut addresses);

        assert_eq!(addresses[0], Address::new([0x01; 20]));
        assert_eq!(addresses[1], Address::new([0x02; 20]));
        assert_eq!(addresses[2], Address::new([0x03; 20]));
    }

    #[test]
    fn test_sort_addresses_empty() {
        let mut addresses: Vec<Address> = vec![];
        sort_addresses(&mut addresses);
        assert!(addresses.is_empty());
    }

    #[test]
    fn test_sort_addresses_single() {
        let mut addresses = vec![Address::new([0x42; 20])];
        sort_addresses(&mut addresses);
        assert_eq!(addresses.len(), 1);
        assert_eq!(addresses[0], Address::new([0x42; 20]));
    }

    // ============ deduplicate_addresses Tests ============

    #[test]
    fn test_deduplicate_addresses() {
        let addresses = vec![
            Address::new([0x01; 20]),
            Address::new([0x02; 20]),
            Address::new([0x01; 20]), // duplicate
            Address::new([0x03; 20]),
            Address::new([0x02; 20]), // duplicate
        ];
        let unique = deduplicate_addresses(addresses);

        assert_eq!(unique.len(), 3);
        assert_eq!(unique[0], Address::new([0x01; 20]));
        assert_eq!(unique[1], Address::new([0x02; 20]));
        assert_eq!(unique[2], Address::new([0x03; 20]));
    }

    #[test]
    fn test_deduplicate_addresses_no_duplicates() {
        let addresses = vec![
            Address::new([0x01; 20]),
            Address::new([0x02; 20]),
            Address::new([0x03; 20]),
        ];
        let unique = deduplicate_addresses(addresses);
        assert_eq!(unique.len(), 3);
    }

    #[test]
    fn test_deduplicate_addresses_all_same() {
        let addresses = vec![
            Address::new([0x42; 20]),
            Address::new([0x42; 20]),
            Address::new([0x42; 20]),
        ];
        let unique = deduplicate_addresses(addresses);
        assert_eq!(unique.len(), 1);
        assert_eq!(unique[0], Address::new([0x42; 20]));
    }

    #[test]
    fn test_deduplicate_addresses_empty() {
        let addresses: Vec<Address> = vec![];
        let unique = deduplicate_addresses(addresses);
        assert!(unique.is_empty());
    }

    // ============ RLP Encoding Helper Tests ============

    #[test]
    fn test_rlp_encode_nonce_zero() {
        let encoded = rlp_encode_nonce(0);
        assert_eq!(encoded, vec![0x80]);
    }

    #[test]
    fn test_rlp_encode_nonce_single_byte() {
        let encoded = rlp_encode_nonce(1);
        assert_eq!(encoded, vec![0x01]);

        let encoded = rlp_encode_nonce(127);
        assert_eq!(encoded, vec![0x7f]);
    }

    #[test]
    fn test_rlp_encode_nonce_two_bytes() {
        let encoded = rlp_encode_nonce(128);
        assert_eq!(encoded, vec![0x81, 0x80]);

        let encoded = rlp_encode_nonce(255);
        assert_eq!(encoded, vec![0x81, 0xff]);
    }

    #[test]
    fn test_rlp_encode_nonce_multi_byte() {
        let encoded = rlp_encode_nonce(0x1234);
        assert_eq!(encoded, vec![0x82, 0x12, 0x34]);

        let encoded = rlp_encode_nonce(0x123456);
        assert_eq!(encoded, vec![0x83, 0x12, 0x34, 0x56]);
    }
}
