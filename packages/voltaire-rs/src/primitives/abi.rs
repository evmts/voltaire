//! ABI encoding and decoding for Ethereum.
//!
//! Implements the Ethereum Contract ABI specification for encoding function
//! calls, decoding return data, and computing function selectors.
//!
//! # Examples
//!
//! ```rust
//! use voltaire::abi::{AbiType, AbiValue, encode_parameters, decode_parameters, function_selector};
//!
//! // Compute function selector
//! let selector = function_selector("transfer(address,uint256)");
//! assert_eq!(selector, [0xa9, 0x05, 0x9c, 0xbb]);
//!
//! // Encode parameters
//! let types = &[AbiType::Uint256, AbiType::Bool];
//! let values = &[AbiValue::Uint256([0u8; 32]), AbiValue::Bool(true)];
//! let encoded = encode_parameters(types, values)?;
//!
//! // Decode parameters
//! let decoded = decode_parameters(types, &encoded)?;
//! # Ok::<(), voltaire::Error>(())
//! ```

use crate::crypto::keccak256;
use crate::error::{Error, Result};
use crate::primitives::{Address, Hash, U256};

/// Maximum ABI encoding size (10 MB).
pub const MAX_ABI_LENGTH: usize = 10 * 1024 * 1024;

/// Maximum recursion depth for nested types.
pub const MAX_RECURSION_DEPTH: usize = 64;

/// 4-byte function selector.
pub type Selector = [u8; 4];

/// ABI type specification.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum AbiType {
    /// Unsigned 8-bit integer.
    Uint8,
    /// Unsigned 16-bit integer.
    Uint16,
    /// Unsigned 32-bit integer.
    Uint32,
    /// Unsigned 64-bit integer.
    Uint64,
    /// Unsigned 128-bit integer.
    Uint128,
    /// Unsigned 256-bit integer.
    Uint256,
    /// Signed 8-bit integer.
    Int8,
    /// Signed 16-bit integer.
    Int16,
    /// Signed 32-bit integer.
    Int32,
    /// Signed 64-bit integer.
    Int64,
    /// Signed 128-bit integer.
    Int128,
    /// Signed 256-bit integer.
    Int256,
    /// 20-byte Ethereum address.
    Address,
    /// Boolean.
    Bool,
    /// Fixed 1-byte array.
    Bytes1,
    /// Fixed 2-byte array.
    Bytes2,
    /// Fixed 3-byte array.
    Bytes3,
    /// Fixed 4-byte array.
    Bytes4,
    /// Fixed 8-byte array.
    Bytes8,
    /// Fixed 16-byte array.
    Bytes16,
    /// Fixed 32-byte array.
    Bytes32,
    /// Dynamic byte array.
    Bytes,
    /// Dynamic UTF-8 string.
    String,
    /// Dynamic array of a type.
    Array(Box<AbiType>),
    /// Fixed-size array.
    FixedArray(Box<AbiType>, usize),
    /// Tuple of types.
    Tuple(Vec<AbiType>),
}

impl AbiType {
    /// Check if this type is dynamic (variable-length encoding).
    pub fn is_dynamic(&self) -> bool {
        match self {
            Self::Bytes | Self::String | Self::Array(_) => true,
            Self::FixedArray(inner, _) => inner.is_dynamic(),
            Self::Tuple(types) => types.iter().any(|t| t.is_dynamic()),
            _ => false,
        }
    }

    /// Get the canonical type string for signature computation.
    pub fn canonical_name(&self) -> String {
        match self {
            Self::Uint8 => "uint8".into(),
            Self::Uint16 => "uint16".into(),
            Self::Uint32 => "uint32".into(),
            Self::Uint64 => "uint64".into(),
            Self::Uint128 => "uint128".into(),
            Self::Uint256 => "uint256".into(),
            Self::Int8 => "int8".into(),
            Self::Int16 => "int16".into(),
            Self::Int32 => "int32".into(),
            Self::Int64 => "int64".into(),
            Self::Int128 => "int128".into(),
            Self::Int256 => "int256".into(),
            Self::Address => "address".into(),
            Self::Bool => "bool".into(),
            Self::Bytes1 => "bytes1".into(),
            Self::Bytes2 => "bytes2".into(),
            Self::Bytes3 => "bytes3".into(),
            Self::Bytes4 => "bytes4".into(),
            Self::Bytes8 => "bytes8".into(),
            Self::Bytes16 => "bytes16".into(),
            Self::Bytes32 => "bytes32".into(),
            Self::Bytes => "bytes".into(),
            Self::String => "string".into(),
            Self::Array(inner) => format!("{}[]", inner.canonical_name()),
            Self::FixedArray(inner, size) => format!("{}[{}]", inner.canonical_name(), size),
            Self::Tuple(types) => {
                let inner: Vec<_> = types.iter().map(|t| t.canonical_name()).collect();
                format!("({})", inner.join(","))
            }
        }
    }

    /// Parse type from canonical string.
    ///
    /// # Examples
    ///
    /// ```rust
    /// use voltaire::abi::AbiType;
    ///
    /// let t = AbiType::parse("uint256")?;
    /// assert_eq!(t, AbiType::Uint256);
    ///
    /// let t = AbiType::parse("address[]")?;
    /// assert_eq!(t, AbiType::Array(Box::new(AbiType::Address)));
    /// # Ok::<(), voltaire::Error>(())
    /// ```
    pub fn parse(s: &str) -> Result<Self> {
        let s = s.trim();

        // Handle arrays
        if s.ends_with(']') {
            let bracket_start = s
                .rfind('[')
                .ok_or_else(|| Error::invalid_input("invalid array type"))?;
            let inner = &s[..bracket_start];
            let size_str = &s[bracket_start + 1..s.len() - 1];

            let inner_type = Self::parse(inner)?;

            if size_str.is_empty() {
                return Ok(Self::Array(Box::new(inner_type)));
            } else {
                let size: usize = size_str
                    .parse()
                    .map_err(|_| Error::invalid_input("invalid array size"))?;
                return Ok(Self::FixedArray(Box::new(inner_type), size));
            }
        }

        // Handle tuples
        if s.starts_with('(') && s.ends_with(')') {
            let inner = &s[1..s.len() - 1];
            if inner.is_empty() {
                return Ok(Self::Tuple(vec![]));
            }

            let types = parse_tuple_types(inner)?;
            return Ok(Self::Tuple(types));
        }

        // Basic types
        match s {
            "uint8" => Ok(Self::Uint8),
            "uint16" => Ok(Self::Uint16),
            "uint32" => Ok(Self::Uint32),
            "uint64" => Ok(Self::Uint64),
            "uint128" => Ok(Self::Uint128),
            "uint256" | "uint" => Ok(Self::Uint256),
            "int8" => Ok(Self::Int8),
            "int16" => Ok(Self::Int16),
            "int32" => Ok(Self::Int32),
            "int64" => Ok(Self::Int64),
            "int128" => Ok(Self::Int128),
            "int256" | "int" => Ok(Self::Int256),
            "address" => Ok(Self::Address),
            "bool" => Ok(Self::Bool),
            "bytes1" => Ok(Self::Bytes1),
            "bytes2" => Ok(Self::Bytes2),
            "bytes3" => Ok(Self::Bytes3),
            "bytes4" => Ok(Self::Bytes4),
            "bytes8" => Ok(Self::Bytes8),
            "bytes16" => Ok(Self::Bytes16),
            "bytes32" => Ok(Self::Bytes32),
            "bytes" => Ok(Self::Bytes),
            "string" => Ok(Self::String),
            _ => Err(Error::UnsupportedType(s.to_string())),
        }
    }
}

/// Parse comma-separated tuple types, handling nested parens.
fn parse_tuple_types(s: &str) -> Result<Vec<AbiType>> {
    let mut types = Vec::new();
    let mut depth = 0;
    let mut start = 0;

    for (i, c) in s.char_indices() {
        match c {
            '(' => depth += 1,
            ')' => depth -= 1,
            ',' if depth == 0 => {
                let part = s[start..i].trim();
                if !part.is_empty() {
                    types.push(AbiType::parse(part)?);
                }
                start = i + 1;
            }
            _ => {}
        }
    }

    // Last part
    let part = s[start..].trim();
    if !part.is_empty() {
        types.push(AbiType::parse(part)?);
    }

    Ok(types)
}

/// ABI-encoded value.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum AbiValue {
    /// Unsigned 8-bit integer.
    Uint8(u8),
    /// Unsigned 16-bit integer.
    Uint16(u16),
    /// Unsigned 32-bit integer.
    Uint32(u32),
    /// Unsigned 64-bit integer.
    Uint64(u64),
    /// Unsigned 128-bit integer.
    Uint128(u128),
    /// Unsigned 256-bit integer (32-byte big-endian).
    Uint256([u8; 32]),
    /// Signed 8-bit integer.
    Int8(i8),
    /// Signed 16-bit integer.
    Int16(i16),
    /// Signed 32-bit integer.
    Int32(i32),
    /// Signed 64-bit integer.
    Int64(i64),
    /// Signed 128-bit integer.
    Int128(i128),
    /// Signed 256-bit integer (32-byte big-endian).
    Int256([u8; 32]),
    /// 20-byte Ethereum address.
    Address(Address),
    /// Boolean value.
    Bool(bool),
    /// Fixed 1-byte array.
    Bytes1([u8; 1]),
    /// Fixed 2-byte array.
    Bytes2([u8; 2]),
    /// Fixed 3-byte array.
    Bytes3([u8; 3]),
    /// Fixed 4-byte array.
    Bytes4([u8; 4]),
    /// Fixed 8-byte array.
    Bytes8([u8; 8]),
    /// Fixed 16-byte array.
    Bytes16([u8; 16]),
    /// Fixed 32-byte array.
    Bytes32([u8; 32]),
    /// Dynamic byte array.
    Bytes(Vec<u8>),
    /// UTF-8 string.
    String(String),
    /// Dynamic array.
    Array(Vec<AbiValue>),
    /// Fixed-size array.
    FixedArray(Vec<AbiValue>),
    /// Tuple of values.
    Tuple(Vec<AbiValue>),
}

impl AbiValue {
    /// Create Uint256 from U256.
    pub fn from_u256(value: U256) -> Self {
        Self::Uint256(value.to_bytes())
    }

    /// Create Uint256 from u64.
    pub fn from_u64(value: u64) -> Self {
        Self::from_u256(U256::from(value))
    }

    /// Get as U256 if this is a Uint256.
    pub fn as_u256(&self) -> Option<U256> {
        match self {
            Self::Uint256(bytes) => Some(U256::new(*bytes)),
            _ => None,
        }
    }

    /// Get as Address if this is an Address.
    pub fn as_address(&self) -> Option<&Address> {
        match self {
            Self::Address(addr) => Some(addr),
            _ => None,
        }
    }

    /// Get as bool if this is a Bool.
    pub fn as_bool(&self) -> Option<bool> {
        match self {
            Self::Bool(b) => Some(*b),
            _ => None,
        }
    }

    /// Get as string if this is a String.
    pub fn as_string(&self) -> Option<&str> {
        match self {
            Self::String(s) => Some(s),
            _ => None,
        }
    }

    /// Get as bytes if this is Bytes.
    pub fn as_bytes(&self) -> Option<&[u8]> {
        match self {
            Self::Bytes(b) => Some(b),
            _ => None,
        }
    }

    /// Get as array if this is an Array.
    pub fn as_array(&self) -> Option<&[AbiValue]> {
        match self {
            Self::Array(arr) | Self::FixedArray(arr) => Some(arr),
            _ => None,
        }
    }

    /// Get as tuple if this is a Tuple.
    pub fn as_tuple(&self) -> Option<&[AbiValue]> {
        match self {
            Self::Tuple(values) => Some(values),
            _ => None,
        }
    }
}

/// Compute 4-byte function selector from signature.
///
/// # Examples
///
/// ```rust
/// use voltaire::abi::function_selector;
///
/// let selector = function_selector("transfer(address,uint256)");
/// assert_eq!(selector, [0xa9, 0x05, 0x9c, 0xbb]);
///
/// let selector = function_selector("balanceOf(address)");
/// assert_eq!(selector, [0x70, 0xa0, 0x82, 0x31]);
/// ```
pub fn function_selector(signature: &str) -> Selector {
    let hash = keccak256(signature.as_bytes());
    let mut selector = [0u8; 4];
    selector.copy_from_slice(&hash.as_bytes()[..4]);
    selector
}

/// Compute 32-byte event topic from signature.
///
/// # Examples
///
/// ```rust
/// use voltaire::abi::event_topic;
///
/// let topic = event_topic("Transfer(address,address,uint256)");
/// assert_eq!(
///     topic.to_hex(),
///     "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
/// );
/// ```
pub fn event_topic(signature: &str) -> Hash {
    keccak256(signature.as_bytes())
}

/// Parse function signature and extract name and parameter types.
///
/// # Examples
///
/// ```rust
/// use voltaire::abi::{parse_signature, AbiType};
///
/// let (name, types) = parse_signature("transfer(address,uint256)")?;
/// assert_eq!(name, "transfer");
/// assert_eq!(types, vec![AbiType::Address, AbiType::Uint256]);
/// # Ok::<(), voltaire::Error>(())
/// ```
pub fn parse_signature(signature: &str) -> Result<(String, Vec<AbiType>)> {
    let paren_start = signature
        .find('(')
        .ok_or_else(|| Error::invalid_input("missing opening paren"))?;
    let paren_end = signature
        .rfind(')')
        .ok_or_else(|| Error::invalid_input("missing closing paren"))?;

    if paren_end <= paren_start {
        return Err(Error::invalid_input("invalid signature format"));
    }

    let name = signature[..paren_start].trim().to_string();
    let params_str = &signature[paren_start + 1..paren_end];

    let types = if params_str.trim().is_empty() {
        vec![]
    } else {
        parse_tuple_types(params_str)?
    };

    Ok((name, types))
}

/// Encode ABI parameters.
///
/// # Examples
///
/// ```rust
/// use voltaire::abi::{AbiType, AbiValue, encode_parameters};
/// use voltaire::Address;
///
/// let types = &[AbiType::Address, AbiType::Uint256];
/// let values = &[
///     AbiValue::Address("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045".parse()?),
///     AbiValue::from_u64(1000),
/// ];
/// let encoded = encode_parameters(types, values)?;
/// assert_eq!(encoded.len(), 64); // 2 * 32 bytes
/// # Ok::<(), voltaire::Error>(())
/// ```
pub fn encode_parameters(types: &[AbiType], values: &[AbiValue]) -> Result<Vec<u8>> {
    if types.len() != values.len() {
        return Err(Error::invalid_input("type/value count mismatch"));
    }

    encode_tuple(types, values, 0)
}

/// Encode function call data (selector + parameters).
///
/// # Examples
///
/// ```rust
/// use voltaire::abi::{AbiType, AbiValue, encode_function};
/// use voltaire::Address;
///
/// let types = &[AbiType::Address, AbiType::Uint256];
/// let values = &[
///     AbiValue::Address("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045".parse()?),
///     AbiValue::from_u64(1000),
/// ];
/// let calldata = encode_function("transfer(address,uint256)", types, values)?;
/// assert_eq!(&calldata[..4], &[0xa9, 0x05, 0x9c, 0xbb]);
/// # Ok::<(), voltaire::Error>(())
/// ```
pub fn encode_function(signature: &str, types: &[AbiType], values: &[AbiValue]) -> Result<Vec<u8>> {
    let selector = function_selector(signature);
    let params = encode_parameters(types, values)?;

    let mut result = Vec::with_capacity(4 + params.len());
    result.extend_from_slice(&selector);
    result.extend_from_slice(&params);

    Ok(result)
}

/// Decode ABI parameters.
///
/// # Examples
///
/// ```rust
/// use voltaire::abi::{AbiType, decode_parameters};
///
/// // 64 bytes: address (32) + uint256 (32)
/// let data = hex::decode("000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa960450000000000000000000000000000000000000000000000000000000000000001")?;
/// let types = &[AbiType::Address, AbiType::Uint256];
/// let values = decode_parameters(types, &data)?;
/// # Ok::<(), Box<dyn std::error::Error>>(())
/// ```
pub fn decode_parameters(types: &[AbiType], data: &[u8]) -> Result<Vec<AbiValue>> {
    decode_tuple(types, data, 0, 0)
}

/// Decode function return data (without selector).
pub fn decode_function_output(types: &[AbiType], data: &[u8]) -> Result<Vec<AbiValue>> {
    decode_parameters(types, data)
}

/// Decode function call data (with selector).
pub fn decode_function_input(
    types: &[AbiType],
    data: &[u8],
) -> Result<(Selector, Vec<AbiValue>)> {
    if data.len() < 4 {
        return Err(Error::invalid_length(4, data.len()));
    }

    let mut selector = [0u8; 4];
    selector.copy_from_slice(&data[..4]);

    let values = if data.len() > 4 {
        decode_parameters(types, &data[4..])?
    } else {
        vec![]
    };

    Ok((selector, values))
}

// ============================================================================
// Internal encoding helpers
// ============================================================================

fn encode_tuple(types: &[AbiType], values: &[AbiValue], depth: usize) -> Result<Vec<u8>> {
    if depth > MAX_RECURSION_DEPTH {
        return Err(Error::invalid_input("max recursion depth exceeded"));
    }

    // Calculate head size (32 bytes per element, static or offset)
    let head_size = types.len() * 32;

    let mut head = Vec::with_capacity(head_size);
    let mut tail = Vec::new();

    for (typ, val) in types.iter().zip(values.iter()) {
        if typ.is_dynamic() {
            // Write offset to tail
            let offset = head_size + tail.len();
            head.extend_from_slice(&encode_u256_word(offset as u128));

            // Encode value into tail
            let encoded = encode_value(typ, val, depth + 1)?;
            tail.extend_from_slice(&encoded);
        } else {
            // Encode directly into head
            let encoded = encode_value(typ, val, depth + 1)?;
            head.extend_from_slice(&encoded);
        }
    }

    head.extend_from_slice(&tail);

    if head.len() > MAX_ABI_LENGTH {
        return Err(Error::MaxLengthExceeded { max: MAX_ABI_LENGTH });
    }

    Ok(head)
}

fn encode_value(typ: &AbiType, val: &AbiValue, depth: usize) -> Result<Vec<u8>> {
    if depth > MAX_RECURSION_DEPTH {
        return Err(Error::invalid_input("max recursion depth exceeded"));
    }

    match (typ, val) {
        (AbiType::Uint8, AbiValue::Uint8(v)) => Ok(encode_u256_word(*v as u128).to_vec()),
        (AbiType::Uint16, AbiValue::Uint16(v)) => Ok(encode_u256_word(*v as u128).to_vec()),
        (AbiType::Uint32, AbiValue::Uint32(v)) => Ok(encode_u256_word(*v as u128).to_vec()),
        (AbiType::Uint64, AbiValue::Uint64(v)) => Ok(encode_u256_word(*v as u128).to_vec()),
        (AbiType::Uint128, AbiValue::Uint128(v)) => Ok(encode_u256_word(*v).to_vec()),
        (AbiType::Uint256, AbiValue::Uint256(bytes)) => Ok(bytes.to_vec()),

        (AbiType::Int8, AbiValue::Int8(v)) => Ok(encode_i256_word(*v as i128).to_vec()),
        (AbiType::Int16, AbiValue::Int16(v)) => Ok(encode_i256_word(*v as i128).to_vec()),
        (AbiType::Int32, AbiValue::Int32(v)) => Ok(encode_i256_word(*v as i128).to_vec()),
        (AbiType::Int64, AbiValue::Int64(v)) => Ok(encode_i256_word(*v as i128).to_vec()),
        (AbiType::Int128, AbiValue::Int128(v)) => Ok(encode_i256_word(*v).to_vec()),
        (AbiType::Int256, AbiValue::Int256(bytes)) => Ok(bytes.to_vec()),

        (AbiType::Address, AbiValue::Address(addr)) => {
            let mut word = [0u8; 32];
            word[12..].copy_from_slice(addr.as_bytes());
            Ok(word.to_vec())
        }

        (AbiType::Bool, AbiValue::Bool(b)) => {
            let mut word = [0u8; 32];
            word[31] = if *b { 1 } else { 0 };
            Ok(word.to_vec())
        }

        (AbiType::Bytes1, AbiValue::Bytes1(b)) => {
            let mut word = [0u8; 32];
            word[..1].copy_from_slice(b);
            Ok(word.to_vec())
        }
        (AbiType::Bytes2, AbiValue::Bytes2(b)) => {
            let mut word = [0u8; 32];
            word[..2].copy_from_slice(b);
            Ok(word.to_vec())
        }
        (AbiType::Bytes3, AbiValue::Bytes3(b)) => {
            let mut word = [0u8; 32];
            word[..3].copy_from_slice(b);
            Ok(word.to_vec())
        }
        (AbiType::Bytes4, AbiValue::Bytes4(b)) => {
            let mut word = [0u8; 32];
            word[..4].copy_from_slice(b);
            Ok(word.to_vec())
        }
        (AbiType::Bytes8, AbiValue::Bytes8(b)) => {
            let mut word = [0u8; 32];
            word[..8].copy_from_slice(b);
            Ok(word.to_vec())
        }
        (AbiType::Bytes16, AbiValue::Bytes16(b)) => {
            let mut word = [0u8; 32];
            word[..16].copy_from_slice(b);
            Ok(word.to_vec())
        }
        (AbiType::Bytes32, AbiValue::Bytes32(b)) => Ok(b.to_vec()),

        (AbiType::Bytes, AbiValue::Bytes(data)) => encode_dynamic_bytes(data),
        (AbiType::String, AbiValue::String(s)) => encode_dynamic_bytes(s.as_bytes()),

        (AbiType::Array(inner), AbiValue::Array(values)) => {
            encode_dynamic_array(inner, values, depth)
        }

        (AbiType::FixedArray(inner, size), AbiValue::FixedArray(values)) => {
            if values.len() != *size {
                return Err(Error::invalid_input("fixed array size mismatch"));
            }
            encode_fixed_array(inner, values, depth)
        }

        (AbiType::Tuple(types), AbiValue::Tuple(values)) => encode_tuple(types, values, depth),

        _ => Err(Error::invalid_input("type/value mismatch")),
    }
}

fn encode_u256_word(value: u128) -> [u8; 32] {
    let mut word = [0u8; 32];
    word[16..].copy_from_slice(&value.to_be_bytes());
    word
}

fn encode_i256_word(value: i128) -> [u8; 32] {
    let mut word = if value < 0 { [0xff; 32] } else { [0u8; 32] };
    word[16..].copy_from_slice(&value.to_be_bytes());
    word
}

fn encode_dynamic_bytes(data: &[u8]) -> Result<Vec<u8>> {
    let len = data.len();
    let padded_len = (len + 31) / 32 * 32;

    let mut result = Vec::with_capacity(32 + padded_len);
    result.extend_from_slice(&encode_u256_word(len as u128));

    result.extend_from_slice(data);
    result.resize(32 + padded_len, 0);

    Ok(result)
}

fn encode_dynamic_array(inner: &AbiType, values: &[AbiValue], depth: usize) -> Result<Vec<u8>> {
    let mut result = Vec::new();

    // Length prefix
    result.extend_from_slice(&encode_u256_word(values.len() as u128));

    // Encode elements as tuple
    let types: Vec<_> = (0..values.len()).map(|_| inner.clone()).collect();
    let encoded = encode_tuple(&types, values, depth + 1)?;
    result.extend_from_slice(&encoded);

    Ok(result)
}

fn encode_fixed_array(inner: &AbiType, values: &[AbiValue], depth: usize) -> Result<Vec<u8>> {
    // Fixed arrays: if inner is static, inline; if dynamic, use offsets
    let types: Vec<_> = (0..values.len()).map(|_| inner.clone()).collect();
    encode_tuple(&types, values, depth + 1)
}

// ============================================================================
// Internal decoding helpers
// ============================================================================

fn decode_tuple(types: &[AbiType], data: &[u8], base_offset: usize, depth: usize) -> Result<Vec<AbiValue>> {
    if depth > MAX_RECURSION_DEPTH {
        return Err(Error::invalid_input("max recursion depth exceeded"));
    }

    let mut values = Vec::with_capacity(types.len());
    let mut offset = 0;

    for typ in types {
        if offset + 32 > data.len() {
            return Err(Error::invalid_length(offset + 32, data.len()));
        }

        let value = decode_value(typ, data, offset, base_offset, depth + 1)?;
        values.push(value);

        // Advance by static size (32 bytes for dynamic types = offset pointer)
        offset += static_size(typ);
    }

    Ok(values)
}

fn decode_value(
    typ: &AbiType,
    data: &[u8],
    offset: usize,
    base_offset: usize,
    depth: usize,
) -> Result<AbiValue> {
    if depth > MAX_RECURSION_DEPTH {
        return Err(Error::invalid_input("max recursion depth exceeded"));
    }

    if offset + 32 > data.len() {
        return Err(Error::invalid_length(offset + 32, data.len()));
    }

    let word = &data[offset..offset + 32];

    match typ {
        AbiType::Uint8 => Ok(AbiValue::Uint8(word[31])),
        AbiType::Uint16 => Ok(AbiValue::Uint16(u16::from_be_bytes([word[30], word[31]]))),
        AbiType::Uint32 => Ok(AbiValue::Uint32(u32::from_be_bytes(
            word[28..32].try_into().unwrap(),
        ))),
        AbiType::Uint64 => Ok(AbiValue::Uint64(u64::from_be_bytes(
            word[24..32].try_into().unwrap(),
        ))),
        AbiType::Uint128 => Ok(AbiValue::Uint128(u128::from_be_bytes(
            word[16..32].try_into().unwrap(),
        ))),
        AbiType::Uint256 => {
            let mut bytes = [0u8; 32];
            bytes.copy_from_slice(word);
            Ok(AbiValue::Uint256(bytes))
        }

        AbiType::Int8 => Ok(AbiValue::Int8(word[31] as i8)),
        AbiType::Int16 => Ok(AbiValue::Int16(i16::from_be_bytes([word[30], word[31]]))),
        AbiType::Int32 => Ok(AbiValue::Int32(i32::from_be_bytes(
            word[28..32].try_into().unwrap(),
        ))),
        AbiType::Int64 => Ok(AbiValue::Int64(i64::from_be_bytes(
            word[24..32].try_into().unwrap(),
        ))),
        AbiType::Int128 => Ok(AbiValue::Int128(i128::from_be_bytes(
            word[16..32].try_into().unwrap(),
        ))),
        AbiType::Int256 => {
            let mut bytes = [0u8; 32];
            bytes.copy_from_slice(word);
            Ok(AbiValue::Int256(bytes))
        }

        AbiType::Address => {
            let addr = Address::from_slice(&word[12..32])?;
            Ok(AbiValue::Address(addr))
        }

        AbiType::Bool => Ok(AbiValue::Bool(word[31] != 0)),

        AbiType::Bytes1 => Ok(AbiValue::Bytes1([word[0]])),
        AbiType::Bytes2 => Ok(AbiValue::Bytes2(word[..2].try_into().unwrap())),
        AbiType::Bytes3 => Ok(AbiValue::Bytes3(word[..3].try_into().unwrap())),
        AbiType::Bytes4 => Ok(AbiValue::Bytes4(word[..4].try_into().unwrap())),
        AbiType::Bytes8 => Ok(AbiValue::Bytes8(word[..8].try_into().unwrap())),
        AbiType::Bytes16 => Ok(AbiValue::Bytes16(word[..16].try_into().unwrap())),
        AbiType::Bytes32 => Ok(AbiValue::Bytes32(word.try_into().unwrap())),

        AbiType::Bytes => {
            let data_offset = read_offset(word)?;
            decode_dynamic_bytes(data, base_offset + data_offset)
        }

        AbiType::String => {
            let data_offset = read_offset(word)?;
            let bytes = decode_dynamic_bytes_raw(data, base_offset + data_offset)?;
            let s = String::from_utf8(bytes).map_err(|_| Error::invalid_input("invalid utf8"))?;
            Ok(AbiValue::String(s))
        }

        AbiType::Array(inner) => {
            let data_offset = read_offset(word)?;
            decode_dynamic_array(inner, data, base_offset + data_offset, depth)
        }

        AbiType::FixedArray(inner, size) => {
            if inner.is_dynamic() {
                // Fixed array of dynamic types: read from offset
                let data_offset = read_offset(word)?;
                decode_fixed_array(inner, *size, data, base_offset + data_offset, depth)
            } else {
                // Fixed array of static types: inline
                decode_fixed_array_inline(inner, *size, data, offset, depth)
            }
        }

        AbiType::Tuple(types) => {
            if typ.is_dynamic() {
                let data_offset = read_offset(word)?;
                let values = decode_tuple(types, &data[base_offset + data_offset..], 0, depth + 1)?;
                Ok(AbiValue::Tuple(values))
            } else {
                let values = decode_tuple(types, &data[offset..], 0, depth + 1)?;
                Ok(AbiValue::Tuple(values))
            }
        }
    }
}

fn read_offset(word: &[u8]) -> Result<usize> {
    // Read as u64 from last 8 bytes (assumes offset fits in usize)
    let offset = u64::from_be_bytes(word[24..32].try_into().unwrap());
    Ok(offset as usize)
}

fn decode_dynamic_bytes(data: &[u8], offset: usize) -> Result<AbiValue> {
    let bytes = decode_dynamic_bytes_raw(data, offset)?;
    Ok(AbiValue::Bytes(bytes))
}

fn decode_dynamic_bytes_raw(data: &[u8], offset: usize) -> Result<Vec<u8>> {
    if offset + 32 > data.len() {
        return Err(Error::invalid_length(offset + 32, data.len()));
    }

    let len_word = &data[offset..offset + 32];
    let len = u64::from_be_bytes(len_word[24..32].try_into().unwrap()) as usize;

    if len > MAX_ABI_LENGTH {
        return Err(Error::MaxLengthExceeded { max: MAX_ABI_LENGTH });
    }

    let data_start = offset + 32;
    if data_start + len > data.len() {
        return Err(Error::invalid_length(data_start + len, data.len()));
    }

    Ok(data[data_start..data_start + len].to_vec())
}

fn decode_dynamic_array(
    inner: &AbiType,
    data: &[u8],
    offset: usize,
    depth: usize,
) -> Result<AbiValue> {
    if offset + 32 > data.len() {
        return Err(Error::invalid_length(offset + 32, data.len()));
    }

    let len_word = &data[offset..offset + 32];
    let len = u64::from_be_bytes(len_word[24..32].try_into().unwrap()) as usize;

    if len > MAX_ABI_LENGTH / 32 {
        return Err(Error::MaxLengthExceeded { max: MAX_ABI_LENGTH });
    }

    let types: Vec<_> = (0..len).map(|_| inner.clone()).collect();
    let values = decode_tuple(&types, &data[offset + 32..], 0, depth + 1)?;

    Ok(AbiValue::Array(values))
}

fn decode_fixed_array(
    inner: &AbiType,
    size: usize,
    data: &[u8],
    offset: usize,
    depth: usize,
) -> Result<AbiValue> {
    let types: Vec<_> = (0..size).map(|_| inner.clone()).collect();
    let values = decode_tuple(&types, &data[offset..], 0, depth + 1)?;
    Ok(AbiValue::FixedArray(values))
}

fn decode_fixed_array_inline(
    inner: &AbiType,
    size: usize,
    data: &[u8],
    offset: usize,
    depth: usize,
) -> Result<AbiValue> {
    let types: Vec<_> = (0..size).map(|_| inner.clone()).collect();
    let values = decode_tuple(&types, &data[offset..], 0, depth + 1)?;
    Ok(AbiValue::FixedArray(values))
}

fn static_size(typ: &AbiType) -> usize {
    match typ {
        AbiType::FixedArray(inner, size) if !inner.is_dynamic() => {
            static_size(inner) * size
        }
        AbiType::Tuple(types) if !typ.is_dynamic() => {
            types.iter().map(static_size).sum()
        }
        _ => 32, // All other types use 32 bytes (or offset pointer)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_function_selector() {
        assert_eq!(
            function_selector("transfer(address,uint256)"),
            [0xa9, 0x05, 0x9c, 0xbb]
        );
        assert_eq!(
            function_selector("balanceOf(address)"),
            [0x70, 0xa0, 0x82, 0x31]
        );
        assert_eq!(
            function_selector("approve(address,uint256)"),
            [0x09, 0x5e, 0xa7, 0xb3]
        );
    }

    #[test]
    fn test_event_topic() {
        let topic = event_topic("Transfer(address,address,uint256)");
        assert_eq!(
            topic.to_hex(),
            "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
        );
    }

    #[test]
    fn test_parse_signature() {
        let (name, types) = parse_signature("transfer(address,uint256)").unwrap();
        assert_eq!(name, "transfer");
        assert_eq!(types, vec![AbiType::Address, AbiType::Uint256]);

        let (name, types) = parse_signature("noParams()").unwrap();
        assert_eq!(name, "noParams");
        assert!(types.is_empty());
    }

    #[test]
    fn test_abi_type_parse() {
        assert_eq!(AbiType::parse("uint256").unwrap(), AbiType::Uint256);
        assert_eq!(AbiType::parse("address").unwrap(), AbiType::Address);
        assert_eq!(AbiType::parse("bool").unwrap(), AbiType::Bool);
        assert_eq!(AbiType::parse("bytes32").unwrap(), AbiType::Bytes32);
        assert_eq!(AbiType::parse("string").unwrap(), AbiType::String);
        assert_eq!(
            AbiType::parse("uint256[]").unwrap(),
            AbiType::Array(Box::new(AbiType::Uint256))
        );
        assert_eq!(
            AbiType::parse("address[5]").unwrap(),
            AbiType::FixedArray(Box::new(AbiType::Address), 5)
        );
    }

    #[test]
    fn test_encode_decode_uint256() {
        let types = &[AbiType::Uint256];
        let values = &[AbiValue::from_u64(12345)];

        let encoded = encode_parameters(types, values).unwrap();
        assert_eq!(encoded.len(), 32);

        let decoded = decode_parameters(types, &encoded).unwrap();
        assert_eq!(decoded.len(), 1);

        let u256_val = decoded[0].as_u256().unwrap();
        assert_eq!(u256_val.to_u64(), Some(12345));
    }

    #[test]
    fn test_encode_decode_address() {
        let addr: Address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
            .parse()
            .unwrap();
        let types = &[AbiType::Address];
        let values = &[AbiValue::Address(addr)];

        let encoded = encode_parameters(types, values).unwrap();
        assert_eq!(encoded.len(), 32);

        let decoded = decode_parameters(types, &encoded).unwrap();
        assert_eq!(decoded[0].as_address().unwrap(), &addr);
    }

    #[test]
    fn test_encode_decode_bool() {
        let types = &[AbiType::Bool, AbiType::Bool];
        let values = &[AbiValue::Bool(true), AbiValue::Bool(false)];

        let encoded = encode_parameters(types, values).unwrap();
        let decoded = decode_parameters(types, &encoded).unwrap();

        assert_eq!(decoded[0].as_bool(), Some(true));
        assert_eq!(decoded[1].as_bool(), Some(false));
    }

    #[test]
    fn test_encode_decode_string() {
        let types = &[AbiType::String];
        let values = &[AbiValue::String("hello world".to_string())];

        let encoded = encode_parameters(types, values).unwrap();
        let decoded = decode_parameters(types, &encoded).unwrap();

        assert_eq!(decoded[0].as_string(), Some("hello world"));
    }

    #[test]
    fn test_encode_decode_bytes() {
        let types = &[AbiType::Bytes];
        let values = &[AbiValue::Bytes(vec![1, 2, 3, 4, 5])];

        let encoded = encode_parameters(types, values).unwrap();
        let decoded = decode_parameters(types, &encoded).unwrap();

        assert_eq!(decoded[0].as_bytes(), Some(&[1u8, 2, 3, 4, 5][..]));
    }

    #[test]
    fn test_encode_decode_array() {
        let types = &[AbiType::Array(Box::new(AbiType::Uint256))];
        let values = &[AbiValue::Array(vec![
            AbiValue::from_u64(100),
            AbiValue::from_u64(200),
            AbiValue::from_u64(300),
        ])];

        let encoded = encode_parameters(types, values).unwrap();
        let decoded = decode_parameters(types, &encoded).unwrap();

        let arr = decoded[0].as_array().unwrap();
        assert_eq!(arr.len(), 3);
        assert_eq!(arr[0].as_u256().unwrap().to_u64(), Some(100));
        assert_eq!(arr[1].as_u256().unwrap().to_u64(), Some(200));
        assert_eq!(arr[2].as_u256().unwrap().to_u64(), Some(300));
    }

    #[test]
    fn test_encode_decode_mixed() {
        let addr: Address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
            .parse()
            .unwrap();

        let types = &[AbiType::Address, AbiType::Uint256, AbiType::Bool];
        let values = &[
            AbiValue::Address(addr),
            AbiValue::from_u64(1000),
            AbiValue::Bool(true),
        ];

        let encoded = encode_parameters(types, values).unwrap();
        assert_eq!(encoded.len(), 96); // 3 * 32 bytes

        let decoded = decode_parameters(types, &encoded).unwrap();
        assert_eq!(decoded[0].as_address().unwrap(), &addr);
        assert_eq!(decoded[1].as_u256().unwrap().to_u64(), Some(1000));
        assert_eq!(decoded[2].as_bool(), Some(true));
    }

    #[test]
    fn test_encode_function() {
        let addr: Address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
            .parse()
            .unwrap();

        let types = &[AbiType::Address, AbiType::Uint256];
        let values = &[AbiValue::Address(addr), AbiValue::from_u64(1000)];

        let calldata = encode_function("transfer(address,uint256)", types, values).unwrap();

        // Check selector
        assert_eq!(&calldata[..4], &[0xa9, 0x05, 0x9c, 0xbb]);
        assert_eq!(calldata.len(), 4 + 64);
    }

    #[test]
    fn test_decode_function_input() {
        let data = hex::decode(
            "a9059cbb\
             000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045\
             00000000000000000000000000000000000000000000000000000000000003e8"
        )
        .unwrap();

        let types = &[AbiType::Address, AbiType::Uint256];
        let (selector, values) = decode_function_input(types, &data).unwrap();

        assert_eq!(selector, [0xa9, 0x05, 0x9c, 0xbb]);
        assert_eq!(values.len(), 2);
        assert_eq!(values[1].as_u256().unwrap().to_u64(), Some(1000));
    }

    #[test]
    fn test_abi_type_canonical_name() {
        assert_eq!(AbiType::Uint256.canonical_name(), "uint256");
        assert_eq!(AbiType::Address.canonical_name(), "address");
        assert_eq!(
            AbiType::Array(Box::new(AbiType::Uint256)).canonical_name(),
            "uint256[]"
        );
        assert_eq!(
            AbiType::FixedArray(Box::new(AbiType::Address), 3).canonical_name(),
            "address[3]"
        );
        assert_eq!(
            AbiType::Tuple(vec![AbiType::Address, AbiType::Uint256]).canonical_name(),
            "(address,uint256)"
        );
    }

    #[test]
    fn test_signed_integers() {
        let types = &[AbiType::Int32, AbiType::Int64];
        let values = &[AbiValue::Int32(-12345), AbiValue::Int64(-9876543210)];

        let encoded = encode_parameters(types, values).unwrap();
        let decoded = decode_parameters(types, &encoded).unwrap();

        match &decoded[0] {
            AbiValue::Int32(v) => assert_eq!(*v, -12345),
            _ => panic!("expected Int32"),
        }
        match &decoded[1] {
            AbiValue::Int64(v) => assert_eq!(*v, -9876543210),
            _ => panic!("expected Int64"),
        }
    }

    #[test]
    fn test_bytes32() {
        let types = &[AbiType::Bytes32];
        let mut b = [0u8; 32];
        b[0] = 0xde;
        b[1] = 0xad;
        b[2] = 0xbe;
        b[3] = 0xef;
        let values = &[AbiValue::Bytes32(b)];

        let encoded = encode_parameters(types, values).unwrap();
        let decoded = decode_parameters(types, &encoded).unwrap();

        match &decoded[0] {
            AbiValue::Bytes32(v) => {
                assert_eq!(v[0], 0xde);
                assert_eq!(v[1], 0xad);
                assert_eq!(v[2], 0xbe);
                assert_eq!(v[3], 0xef);
            }
            _ => panic!("expected Bytes32"),
        }
    }

    #[test]
    fn test_fixed_array() {
        let types = &[AbiType::FixedArray(Box::new(AbiType::Uint256), 3)];
        let values = &[AbiValue::FixedArray(vec![
            AbiValue::from_u64(1),
            AbiValue::from_u64(2),
            AbiValue::from_u64(3),
        ])];

        let encoded = encode_parameters(types, values).unwrap();
        let decoded = decode_parameters(types, &encoded).unwrap();

        let arr = decoded[0].as_array().unwrap();
        assert_eq!(arr.len(), 3);
        assert_eq!(arr[0].as_u256().unwrap().to_u64(), Some(1));
        assert_eq!(arr[1].as_u256().unwrap().to_u64(), Some(2));
        assert_eq!(arr[2].as_u256().unwrap().to_u64(), Some(3));
    }
}
