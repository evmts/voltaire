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

    /// Concatenate multiple byte slices into a single Vec.
    pub fn concat(slices: &[&[u8]]) -> Vec<u8> {
        let total_len: usize = slices.iter().map(|s| s.len()).sum();
        let mut result = Vec::with_capacity(total_len);
        for slice in slices {
            result.extend_from_slice(slice);
        }
        result
    }

    /// Concatenate multiple hex strings into bytes.
    ///
    /// Each hex string can have an optional `0x` prefix.
    pub fn concat_hex(hexes: &[&str]) -> Result<Vec<u8>> {
        let mut result = Vec::new();
        for hex_str in hexes {
            let bytes = Self::decode(hex_str)?;
            result.extend_from_slice(&bytes);
        }
        Ok(result)
    }

    /// Slice bytes from start to end.
    ///
    /// If end is None, slices to the end of data.
    /// If end exceeds length, slices to the end of data.
    pub fn slice(data: &[u8], start: usize, end: Option<usize>) -> Vec<u8> {
        let len = data.len();
        let start = start.min(len);
        let end = end.map(|e| e.min(len)).unwrap_or(len);
        if start >= end {
            return Vec::new();
        }
        data[start..end].to_vec()
    }

    /// Left-pad data with zeros to reach target length.
    ///
    /// If data is already >= target_len, returns data unchanged.
    pub fn pad_left(data: &[u8], target_len: usize) -> Vec<u8> {
        if data.len() >= target_len {
            return data.to_vec();
        }
        let mut result = vec![0u8; target_len - data.len()];
        result.extend_from_slice(data);
        result
    }

    /// Right-pad data with zeros to reach target length.
    ///
    /// If data is already >= target_len, returns data unchanged.
    pub fn pad_right(data: &[u8], target_len: usize) -> Vec<u8> {
        if data.len() >= target_len {
            return data.to_vec();
        }
        let mut result = data.to_vec();
        result.resize(target_len, 0);
        result
    }

    /// Remove leading zeros from data.
    pub fn trim_left(data: &[u8]) -> Vec<u8> {
        let first_nonzero = data.iter().position(|&b| b != 0).unwrap_or(data.len());
        data[first_nonzero..].to_vec()
    }

    /// Remove trailing zeros from data.
    pub fn trim_right(data: &[u8]) -> Vec<u8> {
        let last_nonzero = data.iter().rposition(|&b| b != 0).map(|i| i + 1).unwrap_or(0);
        data[..last_nonzero].to_vec()
    }

    /// XOR two byte slices. They must be the same length.
    pub fn xor(a: &[u8], b: &[u8]) -> Result<Vec<u8>> {
        if a.len() != b.len() {
            return Err(Error::invalid_length(a.len(), b.len()));
        }
        Ok(a.iter().zip(b.iter()).map(|(x, y)| x ^ y).collect())
    }

    /// Generate random bytes.
    ///
    /// Requires the `getrandom` feature.
    #[cfg(feature = "getrandom")]
    pub fn random(len: usize) -> Vec<u8> {
        let mut buf = vec![0u8; len];
        getrandom::getrandom(&mut buf).expect("getrandom failed");
        buf
    }

    /// Convert UTF-8 string to bytes.
    pub fn from_utf8(s: &str) -> Vec<u8> {
        s.as_bytes().to_vec()
    }

    /// Convert bytes to UTF-8 string.
    pub fn to_utf8(data: &[u8]) -> Result<String> {
        String::from_utf8(data.to_vec())
            .map_err(|e| Error::invalid_hex(format!("invalid UTF-8: {}", e)))
    }

    /// Convert bool to bytes: true -> [1], false -> [0].
    pub fn from_bool(b: bool) -> Vec<u8> {
        vec![if b { 1 } else { 0 }]
    }

    /// Convert bytes to bool.
    ///
    /// - `[]` or `[0]` -> false
    /// - `[1]` -> true
    /// - Anything else -> error
    pub fn to_bool(data: &[u8]) -> Result<bool> {
        match data {
            [] | [0] => Ok(false),
            [1] => Ok(true),
            _ => Err(Error::invalid_hex(format!(
                "invalid bool bytes: expected [], [0], or [1], got {:?}",
                data
            ))),
        }
    }

    /// Check if all bytes are zero.
    pub fn is_zero(data: &[u8]) -> bool {
        data.iter().all(|&b| b == 0)
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

    #[test]
    fn test_concat() {
        let a: &[u8] = &[1, 2];
        let b: &[u8] = &[3, 4, 5];
        let c: &[u8] = &[6];
        assert_eq!(Hex::concat(&[a, b, c]), vec![1, 2, 3, 4, 5, 6]);
        assert_eq!(Hex::concat(&[]), Vec::<u8>::new());
        assert_eq!(Hex::concat(&[&[]]), Vec::<u8>::new());
    }

    #[test]
    fn test_concat_hex() {
        assert_eq!(
            Hex::concat_hex(&["0xdead", "0xbeef"]).unwrap(),
            vec![0xde, 0xad, 0xbe, 0xef]
        );
        assert_eq!(
            Hex::concat_hex(&["dead", "beef"]).unwrap(),
            vec![0xde, 0xad, 0xbe, 0xef]
        );
        assert_eq!(Hex::concat_hex(&[]).unwrap(), Vec::<u8>::new());
    }

    #[test]
    fn test_concat_hex_invalid() {
        assert!(Hex::concat_hex(&["0xgg"]).is_err());
    }

    #[test]
    fn test_slice() {
        let data = vec![1, 2, 3, 4, 5];
        assert_eq!(Hex::slice(&data, 1, Some(3)), vec![2, 3]);
        assert_eq!(Hex::slice(&data, 2, None), vec![3, 4, 5]);
        assert_eq!(Hex::slice(&data, 0, Some(10)), vec![1, 2, 3, 4, 5]);
        assert_eq!(Hex::slice(&data, 5, Some(10)), Vec::<u8>::new());
        assert_eq!(Hex::slice(&data, 3, Some(2)), Vec::<u8>::new());
    }

    #[test]
    fn test_pad_left() {
        assert_eq!(Hex::pad_left(&[1, 2], 4), vec![0, 0, 1, 2]);
        assert_eq!(Hex::pad_left(&[1, 2, 3, 4], 4), vec![1, 2, 3, 4]);
        assert_eq!(Hex::pad_left(&[1, 2, 3, 4, 5], 4), vec![1, 2, 3, 4, 5]);
        assert_eq!(Hex::pad_left(&[], 2), vec![0, 0]);
    }

    #[test]
    fn test_pad_right() {
        assert_eq!(Hex::pad_right(&[1, 2], 4), vec![1, 2, 0, 0]);
        assert_eq!(Hex::pad_right(&[1, 2, 3, 4], 4), vec![1, 2, 3, 4]);
        assert_eq!(Hex::pad_right(&[1, 2, 3, 4, 5], 4), vec![1, 2, 3, 4, 5]);
        assert_eq!(Hex::pad_right(&[], 2), vec![0, 0]);
    }

    #[test]
    fn test_trim_left() {
        assert_eq!(Hex::trim_left(&[0, 0, 1, 2]), vec![1, 2]);
        assert_eq!(Hex::trim_left(&[1, 2, 0]), vec![1, 2, 0]);
        assert_eq!(Hex::trim_left(&[0, 0, 0]), Vec::<u8>::new());
        assert_eq!(Hex::trim_left(&[]), Vec::<u8>::new());
    }

    #[test]
    fn test_trim_right() {
        assert_eq!(Hex::trim_right(&[1, 2, 0, 0]), vec![1, 2]);
        assert_eq!(Hex::trim_right(&[0, 1, 2]), vec![0, 1, 2]);
        assert_eq!(Hex::trim_right(&[0, 0, 0]), Vec::<u8>::new());
        assert_eq!(Hex::trim_right(&[]), Vec::<u8>::new());
    }

    #[test]
    fn test_xor() {
        assert_eq!(Hex::xor(&[0xff, 0x00], &[0x0f, 0xf0]).unwrap(), vec![0xf0, 0xf0]);
        assert_eq!(Hex::xor(&[0xaa], &[0x55]).unwrap(), vec![0xff]);
        assert_eq!(Hex::xor(&[], &[]).unwrap(), Vec::<u8>::new());
    }

    #[test]
    fn test_xor_length_mismatch() {
        assert!(Hex::xor(&[1, 2], &[1]).is_err());
    }

    #[cfg(feature = "getrandom")]
    #[test]
    fn test_random() {
        let r1 = Hex::random(32);
        let r2 = Hex::random(32);
        assert_eq!(r1.len(), 32);
        assert_eq!(r2.len(), 32);
        assert_ne!(r1, r2); // Highly unlikely to be equal
        assert_eq!(Hex::random(0).len(), 0);
    }

    #[test]
    fn test_from_utf8() {
        assert_eq!(Hex::from_utf8("hello"), vec![104, 101, 108, 108, 111]);
        assert_eq!(Hex::from_utf8(""), Vec::<u8>::new());
    }

    #[test]
    fn test_to_utf8() {
        assert_eq!(Hex::to_utf8(&[104, 101, 108, 108, 111]).unwrap(), "hello");
        assert_eq!(Hex::to_utf8(&[]).unwrap(), "");
    }

    #[test]
    fn test_to_utf8_invalid() {
        assert!(Hex::to_utf8(&[0xff, 0xfe]).is_err());
    }

    #[test]
    fn test_from_bool() {
        assert_eq!(Hex::from_bool(true), vec![1]);
        assert_eq!(Hex::from_bool(false), vec![0]);
    }

    #[test]
    fn test_to_bool() {
        assert!(!Hex::to_bool(&[]).unwrap());
        assert!(!Hex::to_bool(&[0]).unwrap());
        assert!(Hex::to_bool(&[1]).unwrap());
    }

    #[test]
    fn test_to_bool_invalid() {
        assert!(Hex::to_bool(&[2]).is_err());
        assert!(Hex::to_bool(&[0, 0]).is_err());
        assert!(Hex::to_bool(&[1, 0]).is_err());
    }

    #[test]
    fn test_is_zero() {
        assert!(Hex::is_zero(&[]));
        assert!(Hex::is_zero(&[0]));
        assert!(Hex::is_zero(&[0, 0, 0]));
        assert!(!Hex::is_zero(&[1]));
        assert!(!Hex::is_zero(&[0, 1, 0]));
    }
}
