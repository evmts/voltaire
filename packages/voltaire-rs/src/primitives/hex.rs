//! Hexadecimal encoding/decoding utilities.
//!
//! Provides functions for converting between bytes and hex strings.

use crate::error::{Error, Result};

#[cfg(not(feature = "std"))]
use alloc::{string::String, vec::Vec};

/// Hex encoding/decoding utilities.
pub struct Hex;

impl Hex {
    /// Decode hex string to bytes.
    ///
    /// Accepts with or without `0x` prefix.
    pub fn decode(s: &str) -> Result<Vec<u8>> {
        let s = s.strip_prefix("0x").unwrap_or(s);

        // Handle odd-length hex by prepending zero
        let s = if s.len() % 2 == 1 {
            format!("0{}", s)
        } else {
            s.to_string()
        };

        hex::decode(&s).map_err(|e| Error::invalid_hex(e.to_string()))
    }

    /// Decode hex string to fixed-size array.
    pub fn decode_fixed<const N: usize>(s: &str) -> Result<[u8; N]> {
        let bytes = Self::decode(s)?;
        if bytes.len() != N {
            return Err(Error::invalid_length(N, bytes.len()));
        }

        let mut arr = [0u8; N];
        arr.copy_from_slice(&bytes);
        Ok(arr)
    }

    /// Encode bytes to hex string with 0x prefix.
    pub fn encode(bytes: &[u8]) -> String {
        format!("0x{}", hex::encode(bytes))
    }

    /// Encode bytes to hex string without prefix.
    pub fn encode_raw(bytes: &[u8]) -> String {
        hex::encode(bytes)
    }

    /// Check if string is valid hex.
    pub fn is_valid(s: &str) -> bool {
        let s = s.strip_prefix("0x").unwrap_or(s);
        s.chars().all(|c| c.is_ascii_hexdigit())
    }

    /// Get the byte length that a hex string would decode to.
    pub fn decoded_len(s: &str) -> usize {
        let s = s.strip_prefix("0x").unwrap_or(s);
        (s.len() + 1) / 2
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hex_decode() {
        assert_eq!(Hex::decode("0xdeadbeef").unwrap(), vec![0xde, 0xad, 0xbe, 0xef]);
        assert_eq!(Hex::decode("deadbeef").unwrap(), vec![0xde, 0xad, 0xbe, 0xef]);
    }

    #[test]
    fn test_hex_decode_odd_length() {
        // Odd-length hex should be padded
        assert_eq!(Hex::decode("0xf").unwrap(), vec![0x0f]);
        assert_eq!(Hex::decode("0xabc").unwrap(), vec![0x0a, 0xbc]);
    }

    #[test]
    fn test_hex_encode() {
        assert_eq!(Hex::encode(&[0xde, 0xad, 0xbe, 0xef]), "0xdeadbeef");
    }

    #[test]
    fn test_hex_decode_fixed() {
        let bytes: [u8; 4] = Hex::decode_fixed("0xdeadbeef").unwrap();
        assert_eq!(bytes, [0xde, 0xad, 0xbe, 0xef]);
    }

    #[test]
    fn test_hex_is_valid() {
        assert!(Hex::is_valid("0xdeadbeef"));
        assert!(Hex::is_valid("DEADBEEF"));
        assert!(!Hex::is_valid("0xghij"));
    }

    #[test]
    fn test_hex_decoded_len() {
        assert_eq!(Hex::decoded_len("0xdeadbeef"), 4);
        assert_eq!(Hex::decoded_len("0x"), 0);
        assert_eq!(Hex::decoded_len("0xf"), 1);
    }
}
