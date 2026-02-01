//! EIP-712 Typed Structured Data Hashing and Signing.
//!
//! Implementation of [EIP-712](https://eips.ethereum.org/EIPS/eip-712) for typed
//! structured data hashing and signing.
//!
//! # Overview
//!
//! EIP-712 defines a standard for hashing and signing typed structured data,
//! enabling secure off-chain signatures that can be verified on-chain while
//! being human-readable in wallet interfaces.
//!
//! # Examples
//!
//! ```rust
//! use voltaire::crypto::eip712::{TypedData, Domain, TypeProperty};
//!
//! // Define the domain
//! let domain = Domain::new()
//!     .name("My dApp")
//!     .version("1")
//!     .chain_id(1u64);
//!
//! // Define types
//! let types = vec![
//!     ("Message".to_string(), vec![
//!         TypeProperty::new("content", "string"),
//!     ]),
//! ];
//!
//! // Create typed data
//! let typed_data = TypedData::new(domain, types, "Message")
//!     .with_string("content", "Hello, EIP-712!");
//!
//! // Hash for signing
//! let hash = typed_data.hash();
//! ```

use crate::crypto::keccak256;
use crate::error::{Error, Result};
use crate::primitives::{Address, Hash};

#[cfg(not(feature = "std"))]
use alloc::{
    collections::BTreeMap,
    string::{String, ToString},
    vec,
    vec::Vec,
};

#[cfg(feature = "std")]
use std::collections::BTreeMap;

/// EIP-712 Domain separator.
///
/// The domain separator provides context for the signature to prevent
/// cross-contract and cross-chain replay attacks.
///
/// # Fields
///
/// All fields are optional:
/// - `name` - Human-readable name of the signing domain
/// - `version` - Version of the signing domain
/// - `chain_id` - EIP-155 chain ID
/// - `verifying_contract` - Address of the contract that will verify the signature
/// - `salt` - Disambiguating salt for the protocol
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct Domain {
    /// Human-readable name of the signing domain.
    pub name: Option<String>,
    /// Version of the signing domain.
    pub version: Option<String>,
    /// EIP-155 chain ID.
    pub chain_id: Option<u64>,
    /// Address of the contract that will verify the signature.
    pub verifying_contract: Option<Address>,
    /// Disambiguating salt for the protocol.
    pub salt: Option<Hash>,
}

impl Domain {
    /// Create a new empty domain.
    pub fn new() -> Self {
        Self::default()
    }

    /// Set the domain name.
    pub fn name(mut self, name: impl Into<String>) -> Self {
        self.name = Some(name.into());
        self
    }

    /// Set the domain version.
    pub fn version(mut self, version: impl Into<String>) -> Self {
        self.version = Some(version.into());
        self
    }

    /// Set the chain ID.
    pub fn chain_id(mut self, chain_id: u64) -> Self {
        self.chain_id = Some(chain_id);
        self
    }

    /// Set the verifying contract address.
    pub fn verifying_contract(mut self, address: Address) -> Self {
        self.verifying_contract = Some(address);
        self
    }

    /// Set the salt.
    pub fn salt(mut self, salt: Hash) -> Self {
        self.salt = Some(salt);
        self
    }

    /// Compute the domain separator hash.
    ///
    /// Returns `keccak256(encodeType("EIP712Domain") || encodeData(domain))`.
    pub fn hash(&self) -> Hash {
        hash_domain(self)
    }
}

/// Type property definition.
///
/// Describes a single field in a struct type.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TypeProperty {
    /// Field name.
    pub name: String,
    /// Field type (e.g., "string", "uint256", "address").
    pub type_name: String,
}

impl TypeProperty {
    /// Create a new type property.
    pub fn new(name: impl Into<String>, type_name: impl Into<String>) -> Self {
        Self {
            name: name.into(),
            type_name: type_name.into(),
        }
    }
}

/// Message value that can be encoded according to EIP-712.
#[derive(Debug, Clone, PartialEq)]
pub enum MessageValue {
    /// String value.
    String(String),
    /// Unsigned integer (any size up to 256 bits).
    Uint(u128),
    /// Large unsigned integer (up to 256 bits) as bytes.
    Uint256([u8; 32]),
    /// Signed integer.
    Int(i128),
    /// Boolean value.
    Bool(bool),
    /// Address value.
    Address(Address),
    /// Fixed bytes (bytes1 to bytes32).
    FixedBytes(Vec<u8>),
    /// Dynamic bytes.
    Bytes(Vec<u8>),
    /// Hash/bytes32.
    Hash(Hash),
    /// Array of values.
    Array(Vec<MessageValue>),
    /// Nested struct.
    Struct(BTreeMap<String, MessageValue>),
}

impl From<&str> for MessageValue {
    fn from(s: &str) -> Self {
        MessageValue::String(s.to_string())
    }
}

impl From<String> for MessageValue {
    fn from(s: String) -> Self {
        MessageValue::String(s)
    }
}

impl From<u64> for MessageValue {
    fn from(n: u64) -> Self {
        MessageValue::Uint(n as u128)
    }
}

impl From<u128> for MessageValue {
    fn from(n: u128) -> Self {
        MessageValue::Uint(n)
    }
}

impl From<i64> for MessageValue {
    fn from(n: i64) -> Self {
        MessageValue::Int(n as i128)
    }
}

impl From<i128> for MessageValue {
    fn from(n: i128) -> Self {
        MessageValue::Int(n)
    }
}

impl From<bool> for MessageValue {
    fn from(b: bool) -> Self {
        MessageValue::Bool(b)
    }
}

impl From<Address> for MessageValue {
    fn from(addr: Address) -> Self {
        MessageValue::Address(addr)
    }
}

impl From<Hash> for MessageValue {
    fn from(hash: Hash) -> Self {
        MessageValue::Hash(hash)
    }
}

impl From<[u8; 32]> for MessageValue {
    fn from(bytes: [u8; 32]) -> Self {
        MessageValue::Uint256(bytes)
    }
}

impl From<Vec<u8>> for MessageValue {
    fn from(bytes: Vec<u8>) -> Self {
        MessageValue::Bytes(bytes)
    }
}

/// Type definitions map.
pub type TypeDefinitions = BTreeMap<String, Vec<TypeProperty>>;

/// Complete EIP-712 typed data structure.
///
/// Contains the domain, type definitions, primary type, and message data.
#[derive(Debug, Clone)]
pub struct TypedData {
    /// Domain separator parameters.
    pub domain: Domain,
    /// Type definitions mapping type names to their properties.
    pub types: TypeDefinitions,
    /// Name of the primary type being signed.
    pub primary_type: String,
    /// Message data to sign.
    pub message: BTreeMap<String, MessageValue>,
}

impl TypedData {
    /// Create new typed data.
    ///
    /// # Arguments
    ///
    /// * `domain` - Domain separator parameters
    /// * `types` - Type definitions as (name, properties) pairs
    /// * `primary_type` - Name of the primary type
    pub fn new(
        domain: Domain,
        types: impl IntoIterator<Item = (String, Vec<TypeProperty>)>,
        primary_type: impl Into<String>,
    ) -> Self {
        Self {
            domain,
            types: types.into_iter().collect(),
            primary_type: primary_type.into(),
            message: BTreeMap::new(),
        }
    }

    /// Add a string field to the message.
    pub fn with_string(mut self, name: impl Into<String>, value: impl Into<String>) -> Self {
        self.message
            .insert(name.into(), MessageValue::String(value.into()));
        self
    }

    /// Add a uint256 field to the message.
    pub fn with_uint(mut self, name: impl Into<String>, value: u128) -> Self {
        self.message.insert(name.into(), MessageValue::Uint(value));
        self
    }

    /// Add a uint256 field from 32 bytes.
    pub fn with_uint256(mut self, name: impl Into<String>, value: [u8; 32]) -> Self {
        self.message
            .insert(name.into(), MessageValue::Uint256(value));
        self
    }

    /// Add a bool field to the message.
    pub fn with_bool(mut self, name: impl Into<String>, value: bool) -> Self {
        self.message.insert(name.into(), MessageValue::Bool(value));
        self
    }

    /// Add an address field to the message.
    pub fn with_address(mut self, name: impl Into<String>, value: Address) -> Self {
        self.message
            .insert(name.into(), MessageValue::Address(value));
        self
    }

    /// Add a bytes32/hash field to the message.
    pub fn with_hash(mut self, name: impl Into<String>, value: Hash) -> Self {
        self.message.insert(name.into(), MessageValue::Hash(value));
        self
    }

    /// Add a dynamic bytes field to the message.
    pub fn with_bytes(mut self, name: impl Into<String>, value: Vec<u8>) -> Self {
        self.message.insert(name.into(), MessageValue::Bytes(value));
        self
    }

    /// Add a nested struct field to the message.
    pub fn with_struct(
        mut self,
        name: impl Into<String>,
        value: BTreeMap<String, MessageValue>,
    ) -> Self {
        self.message
            .insert(name.into(), MessageValue::Struct(value));
        self
    }

    /// Add an array field to the message.
    pub fn with_array(mut self, name: impl Into<String>, value: Vec<MessageValue>) -> Self {
        self.message.insert(name.into(), MessageValue::Array(value));
        self
    }

    /// Add any MessageValue field to the message.
    pub fn with_value(mut self, name: impl Into<String>, value: MessageValue) -> Self {
        self.message.insert(name.into(), value);
        self
    }

    /// Compute the EIP-712 hash for signing.
    ///
    /// Returns `keccak256("\x19\x01" || domainSeparator || hashStruct(message))`.
    pub fn hash(&self) -> Hash {
        sign_typed_data(self)
    }

    /// Validate the typed data structure.
    pub fn validate(&self) -> Result<()> {
        // Check primary type exists
        if !self.types.contains_key(&self.primary_type) {
            return Err(Error::invalid_input(format!(
                "Primary type '{}' not found in types",
                self.primary_type
            )));
        }

        // Validate message has all required fields
        if let Some(props) = self.types.get(&self.primary_type) {
            for prop in props {
                if !self.message.contains_key(&prop.name) {
                    return Err(Error::invalid_input(format!(
                        "Missing field '{}' in message",
                        prop.name
                    )));
                }
            }
        }

        Ok(())
    }
}

/// Encode type string for EIP-712 hashing.
///
/// Produces type encoding like:
/// `"Mail(Person from,Person to,string contents)Person(string name,address wallet)"`
///
/// The primary type comes first, followed by referenced types in alphabetical order.
///
/// # Arguments
///
/// * `primary_type` - Name of the primary type to encode
/// * `types` - Type definitions mapping
///
/// # Returns
///
/// Encoded type string.
///
/// # Errors
///
/// Returns error if the primary type or any referenced type is not found.
pub fn encode_type(primary_type: &str, types: &TypeDefinitions) -> Result<String> {
    let mut visited = Vec::new();
    let mut result = Vec::new();

    encode_type_recursive(primary_type, types, &mut visited, &mut result)?;

    Ok(result.join(""))
}

fn encode_type_recursive(
    type_name: &str,
    types: &TypeDefinitions,
    visited: &mut Vec<String>,
    result: &mut Vec<String>,
) -> Result<()> {
    if visited.contains(&type_name.to_string()) {
        return Ok(());
    }

    let props = types
        .get(type_name)
        .ok_or_else(|| Error::invalid_input(format!("Type '{}' not found", type_name)))?;

    visited.push(type_name.to_string());

    // Build type definition
    let fields: Vec<String> = props
        .iter()
        .map(|p| format!("{} {}", p.type_name, p.name))
        .collect();
    result.push(format!("{}({})", type_name, fields.join(",")));

    // Recursively encode referenced custom types (in alphabetical order)
    let mut referenced: Vec<&str> = props
        .iter()
        .filter_map(|p| {
            let base_type = extract_base_type(&p.type_name);
            if types.contains_key(base_type) && !visited.contains(&base_type.to_string()) {
                Some(base_type)
            } else {
                None
            }
        })
        .collect();
    referenced.sort();
    referenced.dedup();

    for ref_type in referenced {
        encode_type_recursive(ref_type, types, visited, result)?;
    }

    Ok(())
}

/// Extract base type from array type (e.g., "uint256[]" -> "uint256").
fn extract_base_type(type_name: &str) -> &str {
    // Handle fixed-size arrays like "uint256[3]"
    if let Some(idx) = type_name.find('[') {
        &type_name[..idx]
    } else {
        type_name
    }
}

/// Hash a type string.
///
/// Returns `keccak256(encodeType(typeName))`.
pub fn hash_type(primary_type: &str, types: &TypeDefinitions) -> Result<Hash> {
    let encoded = encode_type(primary_type, types)?;
    Ok(keccak256(encoded.as_bytes()))
}

/// Hash a struct according to EIP-712.
///
/// Returns `keccak256(typeHash || encodeData(data))`.
pub fn hash_struct(
    primary_type: &str,
    data: &BTreeMap<String, MessageValue>,
    types: &TypeDefinitions,
) -> Result<Hash> {
    let type_hash = hash_type(primary_type, types)?;
    let encoded_data = encode_data(primary_type, data, types)?;

    let mut buffer = Vec::with_capacity(32 + encoded_data.len());
    buffer.extend_from_slice(type_hash.as_bytes());
    buffer.extend_from_slice(&encoded_data);

    Ok(keccak256(&buffer))
}

/// Encode data according to EIP-712.
fn encode_data(
    primary_type: &str,
    data: &BTreeMap<String, MessageValue>,
    types: &TypeDefinitions,
) -> Result<Vec<u8>> {
    let props = types
        .get(primary_type)
        .ok_or_else(|| Error::invalid_input(format!("Type '{}' not found", primary_type)))?;

    let mut result = Vec::new();

    for prop in props {
        let value = data
            .get(&prop.name)
            .ok_or_else(|| Error::invalid_input(format!("Missing field '{}'", prop.name)))?;

        let encoded = encode_value(&prop.type_name, value, types)?;
        result.extend_from_slice(&encoded);
    }

    Ok(result)
}

/// Encode a single value according to EIP-712.
pub fn encode_value(
    type_name: &str,
    value: &MessageValue,
    types: &TypeDefinitions,
) -> Result<[u8; 32]> {
    let mut result = [0u8; 32];

    // Handle arrays
    if type_name.ends_with(']') {
        return encode_array_value(type_name, value, types);
    }

    // Handle custom struct types
    if types.contains_key(type_name) {
        return encode_struct_value(type_name, value, types);
    }

    match type_name {
        // Dynamic types - hash the value
        "string" => {
            if let MessageValue::String(s) = value {
                let hash = keccak256(s.as_bytes());
                result.copy_from_slice(hash.as_bytes());
            } else {
                return Err(Error::invalid_input("Expected string value"));
            }
        }
        "bytes" => {
            if let MessageValue::Bytes(b) = value {
                let hash = keccak256(b);
                result.copy_from_slice(hash.as_bytes());
            } else {
                return Err(Error::invalid_input("Expected bytes value"));
            }
        }

        // Static types
        "address" => {
            if let MessageValue::Address(addr) = value {
                // Right-align address (last 20 bytes)
                result[12..32].copy_from_slice(addr.as_bytes());
            } else {
                return Err(Error::invalid_input("Expected address value"));
            }
        }
        "bool" => {
            if let MessageValue::Bool(b) = value {
                result[31] = if *b { 1 } else { 0 };
            } else {
                return Err(Error::invalid_input("Expected bool value"));
            }
        }
        "bytes32" => {
            match value {
                MessageValue::Hash(h) => result.copy_from_slice(h.as_bytes()),
                MessageValue::FixedBytes(b) if b.len() == 32 => result.copy_from_slice(b),
                MessageValue::Uint256(b) => result.copy_from_slice(b),
                _ => return Err(Error::invalid_input("Expected bytes32 value")),
            }
        }

        // Handle bytesN (1-32)
        t if t.starts_with("bytes") && t.len() > 5 => {
            let size: usize = t[5..]
                .parse()
                .map_err(|_| Error::invalid_input(format!("Invalid bytes size: {}", t)))?;
            if size > 32 {
                return Err(Error::invalid_input(format!("Invalid bytes size: {}", size)));
            }
            if let MessageValue::FixedBytes(b) = value {
                if b.len() != size {
                    return Err(Error::invalid_input(format!(
                        "Expected {} bytes, got {}",
                        size,
                        b.len()
                    )));
                }
                // Left-align fixed bytes
                result[..size].copy_from_slice(b);
            } else if let MessageValue::Hash(h) = value {
                if size != 32 {
                    return Err(Error::invalid_input("Hash can only be used for bytes32"));
                }
                result.copy_from_slice(h.as_bytes());
            } else {
                return Err(Error::invalid_input(format!("Expected bytes{} value", size)));
            }
        }

        // Handle uintN
        t if t.starts_with("uint") => {
            let bits: usize = t[4..]
                .parse()
                .map_err(|_| Error::invalid_input(format!("Invalid uint size: {}", t)))?;
            if bits > 256 || bits % 8 != 0 {
                return Err(Error::invalid_input(format!("Invalid uint size: {}", bits)));
            }
            match value {
                MessageValue::Uint(n) => {
                    let max_val = if bits >= 128 { u128::MAX } else { (1u128 << bits) - 1 };
                    if *n > max_val {
                        return Err(Error::invalid_input(format!(
                            "Value {} out of range for uint{}",
                            n, bits
                        )));
                    }
                    // Big-endian encoding
                    let bytes = n.to_be_bytes();
                    result[16..32].copy_from_slice(&bytes);
                }
                MessageValue::Uint256(bytes) => {
                    result.copy_from_slice(bytes);
                }
                _ => return Err(Error::invalid_input("Expected uint value")),
            }
        }

        // Handle intN
        t if t.starts_with("int") => {
            let bits: usize = t[3..]
                .parse()
                .map_err(|_| Error::invalid_input(format!("Invalid int size: {}", t)))?;
            if bits > 256 || bits % 8 != 0 {
                return Err(Error::invalid_input(format!("Invalid int size: {}", bits)));
            }
            if let MessageValue::Int(n) = value {
                // Check range for intN
                if bits < 128 {
                    let min = -(1i128 << (bits - 1));
                    let max = (1i128 << (bits - 1)) - 1;
                    if *n < min || *n > max {
                        return Err(Error::invalid_input(format!(
                            "Value {} out of range for int{}",
                            n, bits
                        )));
                    }
                }
                // Two's complement big-endian encoding
                let bytes = n.to_be_bytes();
                // Sign extend for negative numbers
                if *n < 0 {
                    result.fill(0xff);
                }
                result[16..32].copy_from_slice(&bytes);
            } else {
                return Err(Error::invalid_input("Expected int value"));
            }
        }

        _ => {
            return Err(Error::invalid_input(format!("Unknown type: {}", type_name)));
        }
    }

    Ok(result)
}

/// Encode array value.
fn encode_array_value(
    type_name: &str,
    value: &MessageValue,
    types: &TypeDefinitions,
) -> Result<[u8; 32]> {
    let base_type = extract_base_type(type_name);

    if let MessageValue::Array(arr) = value {
        // Encode each element and concatenate
        let mut concat = Vec::new();
        for item in arr {
            let encoded = encode_value(base_type, item, types)?;
            concat.extend_from_slice(&encoded);
        }
        // Hash the concatenation
        let hash = keccak256(&concat);
        Ok(*hash.as_bytes())
    } else {
        Err(Error::invalid_input("Expected array value"))
    }
}

/// Encode struct value (custom type).
fn encode_struct_value(
    type_name: &str,
    value: &MessageValue,
    types: &TypeDefinitions,
) -> Result<[u8; 32]> {
    if let MessageValue::Struct(data) = value {
        let hash = hash_struct(type_name, data, types)?;
        Ok(*hash.as_bytes())
    } else {
        Err(Error::invalid_input("Expected struct value"))
    }
}

/// Hash domain separator.
///
/// Computes the EIP-712 domain separator hash.
pub fn hash_domain(domain: &Domain) -> Hash {
    // Build EIP712Domain type dynamically based on which fields are present
    let mut domain_type = Vec::new();
    let mut domain_data: BTreeMap<String, MessageValue> = BTreeMap::new();

    if let Some(ref name) = domain.name {
        domain_type.push(TypeProperty::new("name", "string"));
        domain_data.insert("name".to_string(), MessageValue::String(name.clone()));
    }
    if let Some(ref version) = domain.version {
        domain_type.push(TypeProperty::new("version", "string"));
        domain_data.insert("version".to_string(), MessageValue::String(version.clone()));
    }
    if let Some(chain_id) = domain.chain_id {
        domain_type.push(TypeProperty::new("chainId", "uint256"));
        domain_data.insert("chainId".to_string(), MessageValue::Uint(chain_id as u128));
    }
    if let Some(ref addr) = domain.verifying_contract {
        domain_type.push(TypeProperty::new("verifyingContract", "address"));
        domain_data.insert("verifyingContract".to_string(), MessageValue::Address(*addr));
    }
    if let Some(ref salt) = domain.salt {
        domain_type.push(TypeProperty::new("salt", "bytes32"));
        domain_data.insert("salt".to_string(), MessageValue::Hash(*salt));
    }

    // Create types map
    let mut types = TypeDefinitions::new();
    types.insert("EIP712Domain".to_string(), domain_type);

    // Hash the domain struct
    hash_struct("EIP712Domain", &domain_data, &types).expect("Domain hashing should not fail")
}

/// Hash typed data for signing.
///
/// Computes `keccak256("\x19\x01" || domainSeparator || hashStruct(message))`.
///
/// This is the hash that should be signed.
pub fn sign_typed_data(typed_data: &TypedData) -> Hash {
    let domain_separator = hash_domain(&typed_data.domain);
    let message_hash =
        hash_struct(&typed_data.primary_type, &typed_data.message, &typed_data.types)
            .expect("Message hashing should not fail");

    // Concatenate: 0x19 0x01 || domainSeparator || messageHash
    let mut data = [0u8; 66];
    data[0] = 0x19;
    data[1] = 0x01;
    data[2..34].copy_from_slice(domain_separator.as_bytes());
    data[34..66].copy_from_slice(message_hash.as_bytes());

    keccak256(&data)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encode_type_simple() {
        let mut types = TypeDefinitions::new();
        types.insert(
            "Person".to_string(),
            vec![
                TypeProperty::new("name", "string"),
                TypeProperty::new("wallet", "address"),
            ],
        );

        let encoded = encode_type("Person", &types).unwrap();
        assert_eq!(encoded, "Person(string name,address wallet)");
    }

    #[test]
    fn test_encode_type_nested() {
        let mut types = TypeDefinitions::new();
        types.insert(
            "Person".to_string(),
            vec![
                TypeProperty::new("name", "string"),
                TypeProperty::new("wallet", "address"),
            ],
        );
        types.insert(
            "Mail".to_string(),
            vec![
                TypeProperty::new("from", "Person"),
                TypeProperty::new("to", "Person"),
                TypeProperty::new("contents", "string"),
            ],
        );

        let encoded = encode_type("Mail", &types).unwrap();
        assert!(encoded.starts_with("Mail("));
        assert!(encoded.contains("Person("));
    }

    #[test]
    fn test_domain_hash() {
        let domain = Domain::new().name("Test").version("1").chain_id(1);

        let hash = domain.hash();
        assert!(!hash.is_zero());
    }

    #[test]
    fn test_domain_hash_deterministic() {
        let domain = Domain::new().name("Test").version("1").chain_id(1);

        let hash1 = domain.hash();
        let hash2 = domain.hash();
        assert_eq!(hash1, hash2);
    }

    #[test]
    fn test_encode_value_string() {
        let types = TypeDefinitions::new();
        let value = MessageValue::String("hello".to_string());
        let encoded = encode_value("string", &value, &types).unwrap();

        // String is hashed
        let expected = keccak256(b"hello");
        assert_eq!(encoded, *expected.as_bytes());
    }

    #[test]
    fn test_encode_value_uint256() {
        let types = TypeDefinitions::new();
        let value = MessageValue::Uint(42);
        let encoded = encode_value("uint256", &value, &types).unwrap();

        assert_eq!(encoded[31], 42);
        assert!(encoded[..31].iter().all(|&b| b == 0));
    }

    #[test]
    fn test_encode_value_address() {
        let types = TypeDefinitions::new();
        let addr = Address::new([0xaa; 20]);
        let value = MessageValue::Address(addr);
        let encoded = encode_value("address", &value, &types).unwrap();

        // First 12 bytes should be zero, last 20 bytes should be the address
        assert!(encoded[..12].iter().all(|&b| b == 0));
        assert_eq!(&encoded[12..], addr.as_bytes());
    }

    #[test]
    fn test_encode_value_bool() {
        let types = TypeDefinitions::new();

        let value_true = MessageValue::Bool(true);
        let encoded_true = encode_value("bool", &value_true, &types).unwrap();
        assert_eq!(encoded_true[31], 1);

        let value_false = MessageValue::Bool(false);
        let encoded_false = encode_value("bool", &value_false, &types).unwrap();
        assert_eq!(encoded_false[31], 0);
    }

    #[test]
    fn test_typed_data_hash() {
        let domain = Domain::new().name("Test App").version("1").chain_id(1);

        let types = vec![(
            "Message".to_string(),
            vec![TypeProperty::new("content", "string")],
        )];

        let typed_data = TypedData::new(domain, types, "Message")
            .with_string("content", "Hello, EIP-712!");

        let hash = typed_data.hash();
        assert!(!hash.is_zero());
        assert_eq!(hash.as_bytes().len(), 32);
    }

    #[test]
    fn test_typed_data_hash_deterministic() {
        let domain = Domain::new().name("Test").version("1");

        let types = vec![(
            "Message".to_string(),
            vec![TypeProperty::new("text", "string")],
        )];

        let typed_data = TypedData::new(domain.clone(), types.clone(), "Message")
            .with_string("text", "test");

        let hash1 = typed_data.hash();

        let typed_data2 =
            TypedData::new(domain, types, "Message").with_string("text", "test");

        let hash2 = typed_data2.hash();

        assert_eq!(hash1, hash2);
    }

    #[test]
    fn test_different_messages_different_hashes() {
        let domain = Domain::new().name("App");

        let types = vec![(
            "Message".to_string(),
            vec![TypeProperty::new("text", "string")],
        )];

        let typed_data1 = TypedData::new(domain.clone(), types.clone(), "Message")
            .with_string("text", "message1");

        let typed_data2 =
            TypedData::new(domain, types, "Message").with_string("text", "message2");

        assert_ne!(typed_data1.hash(), typed_data2.hash());
    }

    #[test]
    fn test_different_domains_different_hashes() {
        let domain1 = Domain::new().name("App1");
        let domain2 = Domain::new().name("App2");

        let types = vec![(
            "Message".to_string(),
            vec![TypeProperty::new("text", "string")],
        )];

        let typed_data1 = TypedData::new(domain1, types.clone(), "Message")
            .with_string("text", "test");

        let typed_data2 =
            TypedData::new(domain2, types, "Message").with_string("text", "test");

        assert_ne!(typed_data1.hash(), typed_data2.hash());
    }

    #[test]
    fn test_validate_typed_data() {
        let domain = Domain::new().name("Test");

        let types = vec![(
            "Message".to_string(),
            vec![TypeProperty::new("content", "string")],
        )];

        let valid = TypedData::new(domain.clone(), types.clone(), "Message")
            .with_string("content", "hello");
        assert!(valid.validate().is_ok());

        // Missing field
        let invalid = TypedData::new(domain.clone(), types.clone(), "Message");
        assert!(invalid.validate().is_err());

        // Missing type
        let invalid_type = TypedData::new(domain, types, "NonExistent");
        assert!(invalid_type.validate().is_err());
    }

    #[test]
    fn test_erc2612_permit_structure() {
        let domain = Domain::new()
            .name("USD Coin")
            .version("2")
            .chain_id(1)
            .verifying_contract(Address::new([0xcc; 20]));

        let types = vec![(
            "Permit".to_string(),
            vec![
                TypeProperty::new("owner", "address"),
                TypeProperty::new("spender", "address"),
                TypeProperty::new("value", "uint256"),
                TypeProperty::new("nonce", "uint256"),
                TypeProperty::new("deadline", "uint256"),
            ],
        )];

        let typed_data = TypedData::new(domain, types, "Permit")
            .with_address("owner", Address::new([0xaa; 20]))
            .with_address("spender", Address::new([0xbb; 20]))
            .with_uint("value", 1_000_000)
            .with_uint("nonce", 0)
            .with_uint("deadline", 1735689600);

        let hash = typed_data.hash();
        assert!(!hash.is_zero());
    }

    #[test]
    fn test_nested_struct() {
        let mut types = TypeDefinitions::new();
        types.insert(
            "Person".to_string(),
            vec![
                TypeProperty::new("name", "string"),
                TypeProperty::new("wallet", "address"),
            ],
        );
        types.insert(
            "Mail".to_string(),
            vec![
                TypeProperty::new("from", "Person"),
                TypeProperty::new("to", "Person"),
                TypeProperty::new("contents", "string"),
            ],
        );

        let domain = Domain::new().name("Ether Mail").version("1").chain_id(1);

        let mut from_person = BTreeMap::new();
        from_person.insert("name".to_string(), MessageValue::String("Alice".to_string()));
        from_person.insert(
            "wallet".to_string(),
            MessageValue::Address(Address::new([0xaa; 20])),
        );

        let mut to_person = BTreeMap::new();
        to_person.insert("name".to_string(), MessageValue::String("Bob".to_string()));
        to_person.insert(
            "wallet".to_string(),
            MessageValue::Address(Address::new([0xbb; 20])),
        );

        let typed_data = TypedData {
            domain,
            types,
            primary_type: "Mail".to_string(),
            message: {
                let mut m = BTreeMap::new();
                m.insert("from".to_string(), MessageValue::Struct(from_person));
                m.insert("to".to_string(), MessageValue::Struct(to_person));
                m.insert(
                    "contents".to_string(),
                    MessageValue::String("Hello, Bob!".to_string()),
                );
                m
            },
        };

        let hash = typed_data.hash();
        assert!(!hash.is_zero());
    }

    #[test]
    fn test_encode_array() {
        let types = TypeDefinitions::new();
        let value = MessageValue::Array(vec![
            MessageValue::Uint(1),
            MessageValue::Uint(2),
            MessageValue::Uint(3),
        ]);
        let encoded = encode_value("uint256[]", &value, &types).unwrap();

        // Array is hashed
        assert!(encoded != [0u8; 32]);
    }

    #[test]
    fn test_fixed_bytes() {
        let types = TypeDefinitions::new();
        let value = MessageValue::FixedBytes(vec![0xab; 4]);
        let encoded = encode_value("bytes4", &value, &types).unwrap();

        // First 4 bytes should be the data (left-aligned)
        assert_eq!(&encoded[..4], &[0xab; 4]);
        // Rest should be zero
        assert!(encoded[4..].iter().all(|&b| b == 0));
    }

    #[test]
    fn test_int_negative() {
        let types = TypeDefinitions::new();
        let value = MessageValue::Int(-1);
        let encoded = encode_value("int256", &value, &types).unwrap();

        // -1 in two's complement is all 0xff
        assert!(encoded.iter().all(|&b| b == 0xff));
    }
}
