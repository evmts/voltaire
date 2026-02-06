//! RLP (Recursive Length Prefix) encoding and decoding.
//!
//! RLP is Ethereum's primary serialization format for encoding arbitrary nested
//! arrays of binary data. It is used for transactions, blocks, and state storage.
//!
//! # Encoding Rules
//!
//! ## Strings (bytes)
//! - Single byte [0x00, 0x7f]: Encoded as itself
//! - String 0-55 bytes: 0x80 + length prefix, then data
//! - String >55 bytes: 0xb7 + length-of-length, then length, then data
//!
//! ## Lists
//! - List 0-55 bytes total: 0xc0 + length prefix, then items
//! - List >55 bytes total: 0xf7 + length-of-length, then length, then items
//!
//! # Examples
//!
//! ```rust
//! use voltaire::rlp::{encode_bytes, decode_bytes, encode_uint};
//!
//! // Encode "dog"
//! let encoded = encode_bytes(b"dog");
//! assert_eq!(encoded, vec![0x83, b'd', b'o', b'g']);
//!
//! // Decode
//! let (decoded, _) = decode_bytes(&encoded).unwrap();
//! assert_eq!(decoded, b"dog");
//!
//! // Encode integer
//! let encoded = encode_uint(1024u64);
//! assert_eq!(encoded, vec![0x82, 0x04, 0x00]);
//! ```

use core::fmt;

/// Maximum recursion depth to prevent stack overflow attacks.
pub const MAX_RLP_DEPTH: u32 = 32;

/// RLP-specific errors.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum RlpError {
    /// Input is too short (truncated).
    InputTooShort,
    /// Input has extra bytes after the encoded data.
    InputTooLong,
    /// Leading zeros in length encoding.
    LeadingZeros,
    /// Non-canonical size encoding (e.g., using long form for short data).
    NonCanonicalSize,
    /// Invalid length field.
    InvalidLength,
    /// Unexpected input format.
    UnexpectedInput,
    /// Extra data after decoding (in non-stream mode).
    InvalidRemainder,
    /// Recursion depth exceeded.
    RecursionDepthExceeded,
}

impl fmt::Display for RlpError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::InputTooShort => write!(f, "input too short"),
            Self::InputTooLong => write!(f, "input too long"),
            Self::LeadingZeros => write!(f, "leading zeros in length"),
            Self::NonCanonicalSize => write!(f, "non-canonical size encoding"),
            Self::InvalidLength => write!(f, "invalid length field"),
            Self::UnexpectedInput => write!(f, "unexpected input"),
            Self::InvalidRemainder => write!(f, "extra data after RLP item"),
            Self::RecursionDepthExceeded => write!(f, "recursion depth exceeded"),
        }
    }
}

impl std::error::Error for RlpError {}

/// Result type for RLP operations.
pub type RlpResult<T> = Result<T, RlpError>;

/// Decoded RLP item.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum RlpItem {
    /// Byte string.
    Bytes(Vec<u8>),
    /// List of items.
    List(Vec<RlpItem>),
}

impl RlpItem {
    /// Check if this is a bytes item.
    pub fn is_bytes(&self) -> bool {
        matches!(self, RlpItem::Bytes(_))
    }

    /// Check if this is a list item.
    pub fn is_list(&self) -> bool {
        matches!(self, RlpItem::List(_))
    }

    /// Get bytes if this is a bytes item.
    pub fn as_bytes(&self) -> Option<&[u8]> {
        match self {
            RlpItem::Bytes(b) => Some(b),
            RlpItem::List(_) => None,
        }
    }

    /// Get list if this is a list item.
    pub fn as_list(&self) -> Option<&[RlpItem]> {
        match self {
            RlpItem::Bytes(_) => None,
            RlpItem::List(l) => Some(l),
        }
    }
}

// ============================================================================
// Encoding
// ============================================================================

/// Encode bytes as RLP.
///
/// # Examples
///
/// ```rust
/// use voltaire::rlp::encode_bytes;
///
/// // Single byte < 0x80 encodes as itself
/// assert_eq!(encode_bytes(&[0x7f]), vec![0x7f]);
///
/// // Short string (0-55 bytes)
/// assert_eq!(encode_bytes(b"dog"), vec![0x83, b'd', b'o', b'g']);
///
/// // Empty string
/// assert_eq!(encode_bytes(&[]), vec![0x80]);
/// ```
pub fn encode_bytes(bytes: &[u8]) -> Vec<u8> {
    // Single byte < 0x80 encodes as itself
    if bytes.len() == 1 && bytes[0] < 0x80 {
        return vec![bytes[0]];
    }

    // Short string (0-55 bytes)
    if bytes.len() < 56 {
        let mut result = Vec::with_capacity(1 + bytes.len());
        result.push(0x80 + bytes.len() as u8);
        result.extend_from_slice(bytes);
        return result;
    }

    // Long string (>55 bytes)
    let len_bytes = encode_length_bytes(bytes.len());
    let mut result = Vec::with_capacity(1 + len_bytes.len() + bytes.len());
    result.push(0xb7 + len_bytes.len() as u8);
    result.extend_from_slice(&len_bytes);
    result.extend_from_slice(bytes);
    result
}

/// Encode an unsigned integer as RLP.
///
/// Integers are encoded as big-endian bytes with no leading zeros.
/// Zero is encoded as the empty string (0x80).
///
/// # Examples
///
/// ```rust
/// use voltaire::rlp::encode_uint;
///
/// // Zero encodes as empty string
/// assert_eq!(encode_uint(0u64), vec![0x80]);
///
/// // Small integer (< 0x80)
/// assert_eq!(encode_uint(15u64), vec![0x0f]);
///
/// // Multi-byte integer
/// assert_eq!(encode_uint(1024u64), vec![0x82, 0x04, 0x00]);
/// ```
pub fn encode_uint<T: Into<u128>>(value: T) -> Vec<u8> {
    let value: u128 = value.into();

    if value == 0 {
        return vec![0x80]; // Empty string
    }

    // Convert to big-endian bytes, stripping leading zeros
    let bytes = value.to_be_bytes();
    let first_nonzero = bytes.iter().position(|&b| b != 0).unwrap_or(bytes.len());
    let minimal = &bytes[first_nonzero..];

    encode_bytes(minimal)
}

/// Encode a list of RLP items.
///
/// # Examples
///
/// ```rust
/// use voltaire::rlp::{encode_list, RlpItem};
///
/// // Empty list
/// assert_eq!(encode_list(&[]), vec![0xc0]);
///
/// // List of strings
/// let items = vec![
///     RlpItem::Bytes(b"cat".to_vec()),
///     RlpItem::Bytes(b"dog".to_vec()),
/// ];
/// let encoded = encode_list(&items);
/// ```
pub fn encode_list(items: &[RlpItem]) -> Vec<u8> {
    // Encode each item
    let mut payload = Vec::new();
    for item in items {
        payload.extend(encode_item(item));
    }

    // Short list (0-55 bytes)
    if payload.len() < 56 {
        let mut result = Vec::with_capacity(1 + payload.len());
        result.push(0xc0 + payload.len() as u8);
        result.extend(payload);
        return result;
    }

    // Long list (>55 bytes)
    let len_bytes = encode_length_bytes(payload.len());
    let mut result = Vec::with_capacity(1 + len_bytes.len() + payload.len());
    result.push(0xf7 + len_bytes.len() as u8);
    result.extend_from_slice(&len_bytes);
    result.extend(payload);
    result
}

/// Encode an RLP item.
pub fn encode_item(item: &RlpItem) -> Vec<u8> {
    match item {
        RlpItem::Bytes(b) => encode_bytes(b),
        RlpItem::List(items) => encode_list(items),
    }
}

/// Encode a length as big-endian bytes (no leading zeros).
fn encode_length_bytes(length: usize) -> Vec<u8> {
    if length == 0 {
        return vec![];
    }

    let bytes = length.to_be_bytes();
    let first_nonzero = bytes.iter().position(|&b| b != 0).unwrap_or(bytes.len());
    bytes[first_nonzero..].to_vec()
}

// ============================================================================
// Decoding
// ============================================================================

/// Decode RLP bytes to raw bytes.
///
/// Returns the decoded bytes and remaining input.
///
/// # Examples
///
/// ```rust
/// use voltaire::rlp::decode_bytes;
///
/// let data = vec![0x83, b'd', b'o', b'g'];
/// let (bytes, remainder) = decode_bytes(&data).unwrap();
/// assert_eq!(bytes, b"dog");
/// assert!(remainder.is_empty());
/// ```
pub fn decode_bytes(input: &[u8]) -> RlpResult<(Vec<u8>, &[u8])> {
    let (item, remainder) = decode_item_internal(input, 0)?;
    match item {
        RlpItem::Bytes(b) => Ok((b, remainder)),
        RlpItem::List(_) => Err(RlpError::UnexpectedInput),
    }
}

/// Decode RLP to an unsigned integer.
///
/// Returns the decoded integer and remaining input.
///
/// # Examples
///
/// ```rust
/// use voltaire::rlp::decode_uint;
///
/// let data = vec![0x82, 0x04, 0x00];
/// let (value, _): (u64, _) = decode_uint(&data).unwrap();
/// assert_eq!(value, 1024);
/// ```
pub fn decode_uint<T>(input: &[u8]) -> RlpResult<(T, &[u8])>
where
    T: TryFrom<u128>,
{
    let (bytes, remainder) = decode_bytes(input)?;

    // Check for leading zeros (non-canonical)
    if bytes.len() > 1 && bytes[0] == 0 {
        return Err(RlpError::LeadingZeros);
    }

    // Convert to integer
    let mut value: u128 = 0;
    for &byte in &bytes {
        value = value.checked_shl(8).ok_or(RlpError::InvalidLength)?;
        value |= byte as u128;
    }

    T::try_from(value)
        .map_err(|_| RlpError::InvalidLength)
        .map(|v| (v, remainder))
}

/// Decode RLP to a list of items.
///
/// Returns the decoded items and remaining input.
pub fn decode_list(input: &[u8]) -> RlpResult<(Vec<RlpItem>, &[u8])> {
    let (item, remainder) = decode_item_internal(input, 0)?;
    match item {
        RlpItem::List(items) => Ok((items, remainder)),
        RlpItem::Bytes(_) => Err(RlpError::UnexpectedInput),
    }
}

/// Decode a single RLP item.
///
/// Set `stream` to true to allow remaining data, false to require exact match.
pub fn decode_item(input: &[u8], stream: bool) -> RlpResult<(RlpItem, &[u8])> {
    if input.is_empty() {
        return Ok((RlpItem::Bytes(vec![]), &[]));
    }

    let (item, remainder) = decode_item_internal(input, 0)?;

    if !stream && !remainder.is_empty() {
        return Err(RlpError::InvalidRemainder);
    }

    Ok((item, remainder))
}

fn decode_item_internal(input: &[u8], depth: u32) -> RlpResult<(RlpItem, &[u8])> {
    if input.is_empty() {
        return Err(RlpError::InputTooShort);
    }

    if depth >= MAX_RLP_DEPTH {
        return Err(RlpError::RecursionDepthExceeded);
    }

    let prefix = input[0];

    // Single byte (0x00 - 0x7f)
    if prefix <= 0x7f {
        return Ok((RlpItem::Bytes(vec![prefix]), &input[1..]));
    }

    // String 0-55 bytes (0x80 - 0xb7)
    if prefix <= 0xb7 {
        let length = (prefix - 0x80) as usize;

        if input.len() < 1 + length {
            return Err(RlpError::InputTooShort);
        }

        // Empty string
        if prefix == 0x80 {
            return Ok((RlpItem::Bytes(vec![]), &input[1..]));
        }

        // Enforce canonical: single byte < 0x80 should be encoded as itself
        if length == 1 && input[1] < 0x80 {
            return Err(RlpError::NonCanonicalSize);
        }

        let data = input[1..1 + length].to_vec();
        return Ok((RlpItem::Bytes(data), &input[1 + length..]));
    }

    // String > 55 bytes (0xb8 - 0xbf)
    if prefix <= 0xbf {
        let length_of_length = (prefix - 0xb7) as usize;

        if input.len() < 1 + length_of_length {
            return Err(RlpError::InputTooShort);
        }

        // Check for leading zeros
        if input[1] == 0 {
            return Err(RlpError::LeadingZeros);
        }

        let mut total_length: usize = 0;
        for &byte in &input[1..1 + length_of_length] {
            total_length = total_length.checked_shl(8).ok_or(RlpError::InvalidLength)?;
            total_length |= byte as usize;
        }

        // Enforce canonical: < 56 bytes should use short form
        if total_length < 56 {
            return Err(RlpError::NonCanonicalSize);
        }

        if input.len() < 1 + length_of_length + total_length {
            return Err(RlpError::InputTooShort);
        }

        let data = input[1 + length_of_length..1 + length_of_length + total_length].to_vec();
        return Ok((
            RlpItem::Bytes(data),
            &input[1 + length_of_length + total_length..],
        ));
    }

    // List 0-55 bytes (0xc0 - 0xf7)
    if prefix <= 0xf7 {
        let length = (prefix - 0xc0) as usize;

        if input.len() < 1 + length {
            return Err(RlpError::InputTooShort);
        }

        if length == 0 {
            return Ok((RlpItem::List(vec![]), &input[1..]));
        }

        let mut items = Vec::new();
        let mut remaining = &input[1..1 + length];
        while !remaining.is_empty() {
            let (item, rest) = decode_item_internal(remaining, depth + 1)?;
            items.push(item);
            remaining = rest;
        }

        return Ok((RlpItem::List(items), &input[1 + length..]));
    }

    // List > 55 bytes (0xf8 - 0xff)
    let length_of_length = (prefix - 0xf7) as usize;

    if input.len() < 1 + length_of_length {
        return Err(RlpError::InputTooShort);
    }

    // Check for leading zeros
    if input[1] == 0 {
        return Err(RlpError::LeadingZeros);
    }

    let mut total_length: usize = 0;
    for &byte in &input[1..1 + length_of_length] {
        total_length = total_length.checked_shl(8).ok_or(RlpError::InvalidLength)?;
        total_length |= byte as usize;
    }

    // Enforce canonical: < 56 bytes should use short form
    if total_length < 56 {
        return Err(RlpError::NonCanonicalSize);
    }

    if input.len() < 1 + length_of_length + total_length {
        return Err(RlpError::InputTooShort);
    }

    let mut items = Vec::new();
    let mut remaining = &input[1 + length_of_length..1 + length_of_length + total_length];
    while !remaining.is_empty() {
        let (item, rest) = decode_item_internal(remaining, depth + 1)?;
        items.push(item);
        remaining = rest;
    }

    Ok((
        RlpItem::List(items),
        &input[1 + length_of_length + total_length..],
    ))
}

// ============================================================================
// Validation
// ============================================================================

/// Validate RLP encoded data without fully decoding.
pub fn validate(input: &[u8]) -> bool {
    decode_item(input, false).is_ok()
}

/// Check if RLP encoding is canonical.
///
/// Canonical encoding rules:
/// - Single byte < 0x80 must not be prefixed with 0x81
/// - Lengths must use minimum bytes (no leading zeros)
/// - Short strings/lists (<56 bytes) must use short form
pub fn is_canonical(input: &[u8]) -> bool {
    is_canonical_recursive(input, 0)
}

fn is_canonical_recursive(input: &[u8], depth: u32) -> bool {
    if input.is_empty() {
        return false;
    }

    if depth >= MAX_RLP_DEPTH {
        return false;
    }

    let prefix = input[0];

    // Single byte (0x00 - 0x7f)
    if prefix <= 0x7f {
        return true;
    }

    // String 0-55 bytes (0x80 - 0xb7)
    if prefix <= 0xb7 {
        let length = (prefix - 0x80) as usize;

        if input.len() < 1 + length {
            return false;
        }

        // Non-canonical: single byte < 0x80 should not be prefixed
        if length == 1 && input.len() > 1 && input[1] < 0x80 {
            return false;
        }

        return true;
    }

    // String > 55 bytes (0xb8 - 0xbf)
    if prefix <= 0xbf {
        let length_of_length = (prefix - 0xb7) as usize;

        if input.len() < 1 + length_of_length {
            return false;
        }

        // Non-canonical: leading zeros in length
        if input[1] == 0 {
            return false;
        }

        let mut total_length: usize = 0;
        for &byte in &input[1..1 + length_of_length] {
            total_length = match total_length.checked_shl(8) {
                Some(v) => v | byte as usize,
                None => return false,
            };
        }

        // Non-canonical: < 56 bytes should use short form
        if total_length < 56 {
            return false;
        }

        if input.len() < 1 + length_of_length + total_length {
            return false;
        }

        return true;
    }

    // List 0-55 bytes (0xc0 - 0xf7)
    if prefix <= 0xf7 {
        let length = (prefix - 0xc0) as usize;

        if input.len() < 1 + length {
            return false;
        }

        // Recursively validate list items
        let mut offset: usize = 1;
        while offset < 1 + length {
            let item_length = match get_item_length(&input[offset..]) {
                Some(l) => l,
                None => return false,
            };
            if item_length == 0 {
                return false;
            }
            if !is_canonical_recursive(&input[offset..offset + item_length], depth + 1) {
                return false;
            }
            offset += item_length;
        }

        return offset == 1 + length;
    }

    // List > 55 bytes (0xf8 - 0xff)
    let length_of_length = (prefix - 0xf7) as usize;

    if input.len() < 1 + length_of_length {
        return false;
    }

    // Non-canonical: leading zeros in length
    if input[1] == 0 {
        return false;
    }

    let mut total_length: usize = 0;
    for &byte in &input[1..1 + length_of_length] {
        total_length = match total_length.checked_shl(8) {
            Some(v) => v | byte as usize,
            None => return false,
        };
    }

    // Non-canonical: < 56 bytes should use short form
    if total_length < 56 {
        return false;
    }

    if input.len() < 1 + length_of_length + total_length {
        return false;
    }

    // Recursively validate list items
    let mut offset: usize = 1 + length_of_length;
    let end_offset = 1 + length_of_length + total_length;
    while offset < end_offset {
        let item_length = match get_item_length(&input[offset..]) {
            Some(l) => l,
            None => return false,
        };
        if item_length == 0 {
            return false;
        }
        if !is_canonical_recursive(&input[offset..offset + item_length], depth + 1) {
            return false;
        }
        offset += item_length;
    }

    offset == end_offset
}

/// Get the total length of a single RLP item.
fn get_item_length(input: &[u8]) -> Option<usize> {
    if input.is_empty() {
        return None;
    }

    let prefix = input[0];

    // Single byte (0x00 - 0x7f)
    if prefix <= 0x7f {
        return Some(1);
    }

    // String 0-55 bytes (0x80 - 0xb7)
    if prefix <= 0xb7 {
        let length = (prefix - 0x80) as usize;
        if input.len() < 1 + length {
            return None;
        }
        return Some(1 + length);
    }

    // String > 55 bytes (0xb8 - 0xbf)
    if prefix <= 0xbf {
        let length_of_length = (prefix - 0xb7) as usize;
        if input.len() < 1 + length_of_length {
            return None;
        }

        let mut total_length: usize = 0;
        for &byte in &input[1..1 + length_of_length] {
            total_length = total_length.checked_shl(8)? | byte as usize;
        }

        if input.len() < 1 + length_of_length + total_length {
            return None;
        }
        return Some(1 + length_of_length + total_length);
    }

    // List 0-55 bytes (0xc0 - 0xf7)
    if prefix <= 0xf7 {
        let length = (prefix - 0xc0) as usize;
        if input.len() < 1 + length {
            return None;
        }
        return Some(1 + length);
    }

    // List > 55 bytes (0xf8 - 0xff)
    let length_of_length = (prefix - 0xf7) as usize;
    if input.len() < 1 + length_of_length {
        return None;
    }

    let mut total_length: usize = 0;
    for &byte in &input[1..1 + length_of_length] {
        total_length = total_length.checked_shl(8)? | byte as usize;
    }

    if input.len() < 1 + length_of_length + total_length {
        return None;
    }
    Some(1 + length_of_length + total_length)
}

// ============================================================================
// Traits
// ============================================================================

/// Trait for types that can be RLP encoded.
pub trait RlpEncodable {
    /// Encode this value as RLP.
    fn rlp_encode(&self) -> Vec<u8>;
}

/// Trait for types that can be RLP decoded.
pub trait RlpDecodable: Sized {
    /// Decode this value from RLP.
    fn rlp_decode(data: &[u8]) -> RlpResult<Self>;
}

// Implement for primitive types

impl RlpEncodable for [u8] {
    fn rlp_encode(&self) -> Vec<u8> {
        encode_bytes(self)
    }
}

impl RlpEncodable for Vec<u8> {
    fn rlp_encode(&self) -> Vec<u8> {
        encode_bytes(self)
    }
}

impl RlpDecodable for Vec<u8> {
    fn rlp_decode(data: &[u8]) -> RlpResult<Self> {
        decode_bytes(data).map(|(b, _)| b)
    }
}

impl RlpEncodable for u8 {
    fn rlp_encode(&self) -> Vec<u8> {
        encode_uint(*self as u64)
    }
}

impl RlpDecodable for u8 {
    fn rlp_decode(data: &[u8]) -> RlpResult<Self> {
        let (value, _): (u64, _) = decode_uint(data)?;
        u8::try_from(value).map_err(|_| RlpError::InvalidLength)
    }
}

impl RlpEncodable for u16 {
    fn rlp_encode(&self) -> Vec<u8> {
        encode_uint(*self as u64)
    }
}

impl RlpDecodable for u16 {
    fn rlp_decode(data: &[u8]) -> RlpResult<Self> {
        let (value, _): (u64, _) = decode_uint(data)?;
        u16::try_from(value).map_err(|_| RlpError::InvalidLength)
    }
}

impl RlpEncodable for u32 {
    fn rlp_encode(&self) -> Vec<u8> {
        encode_uint(*self as u64)
    }
}

impl RlpDecodable for u32 {
    fn rlp_decode(data: &[u8]) -> RlpResult<Self> {
        let (value, _): (u64, _) = decode_uint(data)?;
        u32::try_from(value).map_err(|_| RlpError::InvalidLength)
    }
}

impl RlpEncodable for u64 {
    fn rlp_encode(&self) -> Vec<u8> {
        encode_uint(*self)
    }
}

impl RlpDecodable for u64 {
    fn rlp_decode(data: &[u8]) -> RlpResult<Self> {
        decode_uint(data).map(|(v, _)| v)
    }
}

impl RlpEncodable for u128 {
    fn rlp_encode(&self) -> Vec<u8> {
        encode_uint(*self)
    }
}

impl RlpDecodable for u128 {
    fn rlp_decode(data: &[u8]) -> RlpResult<Self> {
        decode_uint(data).map(|(v, _)| v)
    }
}

// ============================================================================
// Implementations for Voltaire primitives
// ============================================================================

impl RlpEncodable for crate::Address {
    fn rlp_encode(&self) -> Vec<u8> {
        encode_bytes(self.as_bytes())
    }
}

impl RlpDecodable for crate::Address {
    fn rlp_decode(data: &[u8]) -> RlpResult<Self> {
        let (bytes, _) = decode_bytes(data)?;
        crate::Address::from_slice(&bytes).map_err(|_| RlpError::InvalidLength)
    }
}

impl RlpEncodable for crate::Hash {
    fn rlp_encode(&self) -> Vec<u8> {
        encode_bytes(self.as_bytes())
    }
}

impl RlpDecodable for crate::Hash {
    fn rlp_decode(data: &[u8]) -> RlpResult<Self> {
        let (bytes, _) = decode_bytes(data)?;
        crate::Hash::from_slice(&bytes).map_err(|_| RlpError::InvalidLength)
    }
}

impl RlpEncodable for crate::U256 {
    fn rlp_encode(&self) -> Vec<u8> {
        // Encode as minimal big-endian bytes (no leading zeros)
        let bytes = self.as_bytes();
        let first_nonzero = bytes.iter().position(|&b| b != 0);
        match first_nonzero {
            Some(i) => encode_bytes(&bytes[i..]),
            None => encode_bytes(&[]), // Zero
        }
    }
}

impl RlpDecodable for crate::U256 {
    fn rlp_decode(data: &[u8]) -> RlpResult<Self> {
        let (bytes, _) = decode_bytes(data)?;

        // Check for leading zeros (non-canonical for integers)
        if bytes.len() > 1 && bytes[0] == 0 {
            return Err(RlpError::LeadingZeros);
        }

        if bytes.len() > 32 {
            return Err(RlpError::InvalidLength);
        }

        // Right-align bytes (big-endian)
        let mut result = [0u8; 32];
        let offset = 32 - bytes.len();
        result[offset..].copy_from_slice(&bytes);

        Ok(crate::U256::new(result))
    }
}

// ============================================================================
// RLP Decoder (streaming)
// ============================================================================

/// RLP streaming decoder.
///
/// Allows decoding multiple consecutive RLP items from a byte stream.
pub struct RlpDecoder<'a> {
    data: &'a [u8],
}

impl<'a> RlpDecoder<'a> {
    /// Create a new decoder from a byte slice.
    pub fn new(data: &'a [u8]) -> Self {
        Self { data }
    }

    /// Check if there is more data to decode.
    pub fn is_empty(&self) -> bool {
        self.data.is_empty()
    }

    /// Get remaining bytes.
    pub fn remainder(&self) -> &'a [u8] {
        self.data
    }

    /// Decode the next item.
    pub fn decode_item(&mut self) -> RlpResult<RlpItem> {
        let (item, remainder) = decode_item(self.data, true)?;
        self.data = remainder;
        Ok(item)
    }

    /// Decode the next item as bytes.
    pub fn decode_bytes(&mut self) -> RlpResult<Vec<u8>> {
        let (bytes, remainder) = decode_bytes(self.data)?;
        self.data = remainder;
        Ok(bytes)
    }

    /// Decode the next item as an unsigned integer.
    pub fn decode_uint<T>(&mut self) -> RlpResult<T>
    where
        T: TryFrom<u128>,
    {
        let (value, remainder) = decode_uint(self.data)?;
        self.data = remainder;
        Ok(value)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encode_single_byte() {
        // Single byte < 0x80 encodes as itself
        assert_eq!(encode_bytes(&[0x00]), vec![0x00]);
        assert_eq!(encode_bytes(&[0x7f]), vec![0x7f]);

        // Character 'a' = 0x61
        assert_eq!(encode_bytes(b"a"), vec![0x61]);
    }

    #[test]
    fn test_encode_short_string() {
        // "dog" = 0x83 + "dog"
        assert_eq!(encode_bytes(b"dog"), vec![0x83, b'd', b'o', b'g']);

        // Empty string = 0x80
        assert_eq!(encode_bytes(&[]), vec![0x80]);
    }

    #[test]
    fn test_encode_long_string() {
        // 70-byte string should use long form
        let long_str = b"zoo255zoo255zzzzzzzzzzzzssssssssssssssssssssssssssssssssssssssssssssss";
        let encoded = encode_bytes(long_str);

        assert_eq!(encoded.len(), 72);
        assert_eq!(encoded[0], 0xb8); // 0xb7 + 1 (length takes 1 byte)
        assert_eq!(encoded[1], 70); // Length = 70
    }

    #[test]
    fn test_encode_uint() {
        // Zero encodes as empty string
        assert_eq!(encode_uint(0u64), vec![0x80]);

        // Small integers
        assert_eq!(encode_uint(15u64), vec![0x0f]);
        assert_eq!(encode_uint(127u64), vec![0x7f]);

        // 128 needs prefix
        assert_eq!(encode_uint(128u64), vec![0x81, 0x80]);

        // Multi-byte integer
        assert_eq!(encode_uint(1024u64), vec![0x82, 0x04, 0x00]);
    }

    #[test]
    fn test_encode_empty_list() {
        assert_eq!(encode_list(&[]), vec![0xc0]);
    }

    #[test]
    fn test_encode_list_of_strings() {
        let items = vec![
            RlpItem::Bytes(b"dog".to_vec()),
            RlpItem::Bytes(b"god".to_vec()),
            RlpItem::Bytes(b"cat".to_vec()),
        ];
        let encoded = encode_list(&items);

        assert_eq!(encoded.len(), 13);
        assert_eq!(encoded[0], 0xcc); // 0xc0 + 12
    }

    #[test]
    fn test_decode_single_byte() {
        let (bytes, remainder) = decode_bytes(&[0x7f]).unwrap();
        assert_eq!(bytes, vec![0x7f]);
        assert!(remainder.is_empty());
    }

    #[test]
    fn test_decode_short_string() {
        let (bytes, remainder) = decode_bytes(&[0x83, b'd', b'o', b'g']).unwrap();
        assert_eq!(bytes, b"dog");
        assert!(remainder.is_empty());
    }

    #[test]
    fn test_decode_empty_string() {
        let (bytes, remainder) = decode_bytes(&[0x80]).unwrap();
        assert!(bytes.is_empty());
        assert!(remainder.is_empty());
    }

    #[test]
    fn test_decode_uint() {
        // Zero
        let (value, _): (u64, _) = decode_uint(&[0x80]).unwrap();
        assert_eq!(value, 0);

        // Small integer
        let (value, _): (u64, _) = decode_uint(&[0x0f]).unwrap();
        assert_eq!(value, 15);

        // Multi-byte
        let (value, _): (u64, _) = decode_uint(&[0x82, 0x04, 0x00]).unwrap();
        assert_eq!(value, 1024);
    }

    #[test]
    fn test_decode_list() {
        // [[1, 2], [3, 4]]
        let data = [0xc6, 0xc2, 0x01, 0x02, 0xc2, 0x03, 0x04];
        let (items, remainder) = decode_list(&data).unwrap();

        assert_eq!(items.len(), 2);
        assert!(remainder.is_empty());

        let inner1 = items[0].as_list().unwrap();
        assert_eq!(inner1.len(), 2);
        assert_eq!(inner1[0].as_bytes().unwrap(), &[1]);
        assert_eq!(inner1[1].as_bytes().unwrap(), &[2]);
    }

    #[test]
    fn test_decode_non_canonical_single_byte() {
        // Single byte < 0x80 with prefix is non-canonical
        let result = decode_bytes(&[0x81, 0x50]);
        assert_eq!(result, Err(RlpError::NonCanonicalSize));
    }

    #[test]
    fn test_decode_non_canonical_short_string() {
        // Short string using long form is non-canonical
        let result = decode_bytes(&[0xb8, 0x05, b'h', b'e', b'l', b'l', b'o']);
        assert_eq!(result, Err(RlpError::NonCanonicalSize));
    }

    #[test]
    fn test_decode_leading_zeros() {
        // Leading zeros in length
        let result = decode_bytes(&[0xb8, 0x00, 0x05, b'h', b'e', b'l', b'l', b'o']);
        assert_eq!(result, Err(RlpError::LeadingZeros));
    }

    #[test]
    fn test_decode_truncated() {
        // String header says 5 bytes but only 3 provided
        let result = decode_bytes(&[0x85, b'a', b'b', b'c']);
        assert_eq!(result, Err(RlpError::InputTooShort));
    }

    #[test]
    fn test_decode_extra_data_non_stream() {
        // Extra data should error in non-stream mode
        let result = decode_item(&[0x83, b'd', b'o', b'g', 0x01, 0x02], false);
        assert_eq!(result, Err(RlpError::InvalidRemainder));
    }

    #[test]
    fn test_decode_extra_data_stream() {
        // Extra data allowed in stream mode
        let (item, remainder) = decode_item(&[0x83, b'd', b'o', b'g', 0x01, 0x02], true).unwrap();
        assert_eq!(item.as_bytes().unwrap(), b"dog");
        assert_eq!(remainder, &[0x01, 0x02]);
    }

    #[test]
    fn test_validate() {
        // Valid
        assert!(validate(&[0x7f]));
        assert!(validate(&[0x83, b'd', b'o', b'g']));
        assert!(validate(&[0xc0]));

        // Invalid
        assert!(!validate(&[0x83, b'd', b'o'])); // Truncated
        assert!(!validate(&[0x81, 0x7f])); // Non-canonical
    }

    #[test]
    fn test_is_canonical() {
        // Canonical
        assert!(is_canonical(&[0x7f]));
        assert!(is_canonical(&[0x80]));
        assert!(is_canonical(&[0x83, b'd', b'o', b'g']));
        assert!(is_canonical(&[0xc0]));

        // Non-canonical
        assert!(!is_canonical(&[]));
        assert!(!is_canonical(&[0x81, 0x7f])); // Single byte with prefix
        assert!(!is_canonical(&[0xb8, 0x05, b'h', b'e', b'l', b'l', b'o'])); // Short with long form
    }

    #[test]
    fn test_recursion_depth() {
        // Build deeply nested list structure: [[[[...]]]]
        // We need to construct this at the RLP encoding level, not using RlpItem
        // Each nested list starts with 0xc1 (list of 1 byte) wrapping the inner content
        // Start with empty list 0xc0, then wrap it MAX_RLP_DEPTH + 5 times

        // Build from innermost: 0xc0 (empty list)
        // Then wrap: 0xc1 0xc0 (list containing empty list)
        // Then wrap: 0xc2 0xc1 0xc0 (list containing that)
        // etc.

        let mut encoded: Vec<u8> = vec![0xc0]; // Empty list

        for _ in 0..MAX_RLP_DEPTH + 5 {
            let payload_len = encoded.len();
            if payload_len < 56 {
                let mut new_encoded = vec![0xc0 + payload_len as u8];
                new_encoded.extend(&encoded);
                encoded = new_encoded;
            } else {
                // Handle long list form (shouldn't happen for this test)
                let len_bytes = encode_length_bytes(payload_len);
                let mut new_encoded = vec![0xf7 + len_bytes.len() as u8];
                new_encoded.extend(&len_bytes);
                new_encoded.extend(&encoded);
                encoded = new_encoded;
            }
        }

        let result = decode_item(&encoded, false);
        assert_eq!(result, Err(RlpError::RecursionDepthExceeded));
    }

    #[test]
    fn test_rlp_decoder_streaming() {
        let item1 = encode_bytes(b"first");
        let item2 = encode_uint(42u64);
        let item3 = encode_list(&[RlpItem::Bytes(b"a".to_vec()), RlpItem::Bytes(b"b".to_vec())]);

        let mut stream = Vec::new();
        stream.extend(&item1);
        stream.extend(&item2);
        stream.extend(&item3);

        let mut decoder = RlpDecoder::new(&stream);

        let first = decoder.decode_bytes().unwrap();
        assert_eq!(first, b"first");

        let second: u64 = decoder.decode_uint().unwrap();
        assert_eq!(second, 42);

        let third = decoder.decode_item().unwrap();
        assert!(third.is_list());

        assert!(decoder.is_empty());
    }

    #[test]
    fn test_address_rlp() {
        let addr = crate::Address::new([
            0xd8, 0xdA, 0x6B, 0xF2, 0x69, 0x64, 0xaF, 0x9D, 0x7e, 0xEd, 0x9e, 0x03, 0xE5, 0x34,
            0x15, 0xD3, 0x7a, 0xA9, 0x60, 0x45,
        ]);

        let encoded = addr.rlp_encode();
        assert_eq!(encoded.len(), 21); // 0x94 + 20 bytes
        assert_eq!(encoded[0], 0x94); // 0x80 + 20

        let decoded = crate::Address::rlp_decode(&encoded).unwrap();
        assert_eq!(addr, decoded);
    }

    #[test]
    fn test_hash_rlp() {
        let hash = crate::Hash::new([0x42; 32]);

        let encoded = hash.rlp_encode();
        assert_eq!(encoded.len(), 33); // 0xa0 + 32 bytes
        assert_eq!(encoded[0], 0xa0); // 0x80 + 32

        let decoded = crate::Hash::rlp_decode(&encoded).unwrap();
        assert_eq!(hash, decoded);
    }

    #[test]
    fn test_u256_rlp() {
        // Zero
        let zero = crate::U256::ZERO;
        let encoded = zero.rlp_encode();
        assert_eq!(encoded, vec![0x80]);
        let decoded = crate::U256::rlp_decode(&encoded).unwrap();
        assert_eq!(zero, decoded);

        // Small value
        let small = crate::U256::from(1000u64);
        let encoded = small.rlp_encode();
        let decoded = crate::U256::rlp_decode(&encoded).unwrap();
        assert_eq!(small, decoded);

        // Large value
        let large = crate::U256::MAX;
        let encoded = large.rlp_encode();
        assert_eq!(encoded.len(), 33); // 0xa0 + 32 bytes
        let decoded = crate::U256::rlp_decode(&encoded).unwrap();
        assert_eq!(large, decoded);
    }

    #[test]
    fn test_roundtrip_55_byte_boundary() {
        // Exactly 55 bytes - should use short form
        let str_55: Vec<u8> = vec![0x61; 55];
        let encoded = encode_bytes(&str_55);
        assert_eq!(encoded.len(), 56);
        assert_eq!(encoded[0], 0x80 + 55);

        let (decoded, _) = decode_bytes(&encoded).unwrap();
        assert_eq!(decoded, str_55);

        // Exactly 56 bytes - should use long form
        let str_56: Vec<u8> = vec![0x61; 56];
        let encoded = encode_bytes(&str_56);
        assert_eq!(encoded[0], 0xb8);
        assert_eq!(encoded[1], 56);

        let (decoded, _) = decode_bytes(&encoded).unwrap();
        assert_eq!(decoded, str_56);
    }

    #[test]
    fn test_large_integer_roundtrip() {
        let large: u64 = 0xFFFFFFFFFFFFFFFF;
        let encoded = encode_uint(large);

        let (decoded, _): (u64, _) = decode_uint(&encoded).unwrap();
        assert_eq!(large, decoded);
    }

    #[test]
    fn test_nested_list_encoding() {
        // [[[]]] - deeply nested empty lists
        let inner = RlpItem::List(vec![]);
        let middle = RlpItem::List(vec![inner]);
        let outer = encode_list(&[middle]);

        // Should be: 0xc2 0xc1 0xc0
        assert_eq!(outer, vec![0xc2, 0xc1, 0xc0]);

        let (decoded, _) = decode_list(&outer).unwrap();
        assert_eq!(decoded.len(), 1);
        assert!(decoded[0].is_list());
    }
}
