//! Ethereum transaction types.
//!
//! Support for all transaction envelope types:
//! - Legacy (type 0): Original format with fixed gas price
//! - EIP-2930 (type 1): Access list transactions
//! - EIP-1559 (type 2): Dynamic fee transactions
//! - EIP-4844 (type 3): Blob transactions for L2 scaling
//! - EIP-7702 (type 4): EOA code delegation

use core::fmt;

#[cfg(not(feature = "std"))]
use alloc::vec::Vec;

use crate::error::{Error, Result};
use crate::primitives::{
    Address, Hash, U256,
    AccessList, SignedAuthorization,
    rlp::{RlpItem, encode_list},
};
use crate::crypto::{keccak256, Secp256k1, Signature, RecoveryId};

/// Encode a u64 as minimal bytes (no leading zeros).
fn encode_uint_minimal(value: u64) -> Vec<u8> {
    if value == 0 {
        return vec![];
    }
    let bytes = value.to_be_bytes();
    let first_nonzero = bytes.iter().position(|&b| b != 0).unwrap_or(bytes.len());
    bytes[first_nonzero..].to_vec()
}

/// Convert U256 to minimal bytes (no leading zeros).
fn u256_to_minimal_bytes(value: &U256) -> Vec<u8> {
    let bytes = value.as_bytes();
    let first_nonzero = bytes.iter().position(|&b| b != 0);
    match first_nonzero {
        Some(i) => bytes[i..].to_vec(),
        None => vec![],
    }
}

/// Strip leading zeros from a byte array.
fn strip_leading_zeros(bytes: &[u8]) -> &[u8] {
    let first_nonzero = bytes.iter().position(|&b| b != 0);
    match first_nonzero {
        Some(i) => &bytes[i..],
        None => &[],
    }
}

/// Encode an access list as RLP.
fn encode_access_list(access_list: &AccessList) -> RlpItem {
    let items: Vec<RlpItem> = access_list.entries().iter().map(|entry| {
        let storage_keys: Vec<RlpItem> = entry.storage_keys.iter()
            .map(|key| RlpItem::Bytes(key.to_vec()))
            .collect();
        RlpItem::List(vec![
            RlpItem::Bytes(entry.address.as_bytes().to_vec()),
            RlpItem::List(storage_keys),
        ])
    }).collect();
    RlpItem::List(items)
}

/// Blob gas per blob (EIP-4844).
pub const GAS_PER_BLOB: u64 = 131_072;

/// Transaction envelope type.
///
/// Identifies the transaction format based on the EIP that introduced it.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Default)]
#[repr(u8)]
pub enum TransactionType {
    /// Legacy transaction (pre-EIP-2718).
    #[default]
    Legacy = 0x00,
    /// EIP-2930: Access list transaction.
    Eip2930 = 0x01,
    /// EIP-1559: Dynamic fee transaction.
    Eip1559 = 0x02,
    /// EIP-4844: Blob transaction.
    Eip4844 = 0x03,
    /// EIP-7702: EOA code delegation.
    Eip7702 = 0x04,
}

impl TransactionType {
    /// Detect transaction type from raw RLP-encoded bytes.
    ///
    /// Typed transactions (EIP-2718) have a type byte prefix.
    /// Legacy transactions start with RLP encoding (0xc0-0xff range).
    ///
    /// # Examples
    ///
    /// ```rust
    /// use voltaire::primitives::TransactionType;
    ///
    /// // EIP-1559 transaction (type byte 0x02)
    /// let raw = [0x02, 0xf8, 0x70];
    /// assert_eq!(TransactionType::detect(&raw), TransactionType::Eip1559);
    ///
    /// // Legacy transaction (starts with RLP list prefix)
    /// let raw = [0xf8, 0x70];
    /// assert_eq!(TransactionType::detect(&raw), TransactionType::Legacy);
    /// ```
    #[inline]
    pub fn detect(data: &[u8]) -> Self {
        if data.is_empty() {
            return Self::Legacy;
        }

        match data[0] {
            0x01 => Self::Eip2930,
            0x02 => Self::Eip1559,
            0x03 => Self::Eip4844,
            0x04 => Self::Eip7702,
            _ => Self::Legacy,
        }
    }

    /// Check if this is a typed transaction (EIP-2718).
    #[inline]
    pub const fn is_typed(self) -> bool {
        !matches!(self, Self::Legacy)
    }

    /// Check if this transaction type supports access lists.
    #[inline]
    pub const fn supports_access_list(self) -> bool {
        !matches!(self, Self::Legacy)
    }

    /// Check if this transaction type uses EIP-1559 fee market.
    #[inline]
    pub const fn is_eip1559(self) -> bool {
        matches!(self, Self::Eip1559 | Self::Eip4844 | Self::Eip7702)
    }

    /// Get the type byte for typed transactions.
    ///
    /// Returns `None` for legacy transactions which have no type prefix.
    #[inline]
    pub const fn type_byte(self) -> Option<u8> {
        match self {
            Self::Legacy => None,
            Self::Eip2930 => Some(0x01),
            Self::Eip1559 => Some(0x02),
            Self::Eip4844 => Some(0x03),
            Self::Eip7702 => Some(0x04),
        }
    }
}

impl TryFrom<u8> for TransactionType {
    type Error = Error;

    fn try_from(value: u8) -> Result<Self> {
        match value {
            0x00 => Ok(Self::Legacy),
            0x01 => Ok(Self::Eip2930),
            0x02 => Ok(Self::Eip1559),
            0x03 => Ok(Self::Eip4844),
            0x04 => Ok(Self::Eip7702),
            _ => Err(Error::invalid_input(format!(
                "unknown transaction type: 0x{:02x}",
                value
            ))),
        }
    }
}

impl From<TransactionType> for u8 {
    #[inline]
    fn from(ty: TransactionType) -> Self {
        ty as u8
    }
}

impl fmt::Display for TransactionType {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Legacy => write!(f, "legacy"),
            Self::Eip2930 => write!(f, "eip2930"),
            Self::Eip1559 => write!(f, "eip1559"),
            Self::Eip4844 => write!(f, "eip4844"),
            Self::Eip7702 => write!(f, "eip7702"),
        }
    }
}

/// Legacy transaction (type 0).
///
/// Original Ethereum transaction format with fixed gas price.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LegacyTransaction {
    /// Transaction nonce.
    pub nonce: u64,
    /// Gas price in wei.
    pub gas_price: U256,
    /// Gas limit.
    pub gas_limit: u64,
    /// Recipient address (None for contract creation).
    pub to: Option<Address>,
    /// Value to transfer in wei.
    pub value: U256,
    /// Input data.
    pub data: Vec<u8>,
    /// Signature v value (includes chain ID for EIP-155).
    pub v: u64,
    /// Signature r value.
    pub r: [u8; 32],
    /// Signature s value.
    pub s: [u8; 32],
}

impl Default for LegacyTransaction {
    fn default() -> Self {
        Self {
            nonce: 0,
            gas_price: U256::ZERO,
            gas_limit: 21_000,
            to: None,
            value: U256::ZERO,
            data: Vec::new(),
            v: 0,
            r: [0u8; 32],
            s: [0u8; 32],
        }
    }
}

impl LegacyTransaction {
    /// Check if this transaction is signed.
    #[inline]
    pub fn is_signed(&self) -> bool {
        self.r != [0u8; 32] || self.s != [0u8; 32]
    }

    /// Check if this is a contract creation transaction.
    #[inline]
    pub fn is_contract_creation(&self) -> bool {
        self.to.is_none()
    }

    /// Get chain ID from EIP-155 v value.
    ///
    /// Returns `None` for pre-EIP-155 transactions (v = 27 or 28).
    pub fn chain_id(&self) -> Option<u64> {
        if self.v >= 37 {
            Some((self.v - 35) / 2)
        } else {
            None
        }
    }

    /// Get y-parity from v value.
    pub fn y_parity(&self) -> u8 {
        if self.v >= 37 {
            ((self.v - 35) % 2) as u8
        } else if self.v == 28 {
            1
        } else {
            0
        }
    }

    /// Serialize the transaction to RLP-encoded bytes.
    ///
    /// Returns the full RLP encoding including signature fields.
    pub fn serialize(&self) -> Vec<u8> {
        let items = vec![
            RlpItem::Bytes(encode_uint_minimal(self.nonce)),
            RlpItem::Bytes(u256_to_minimal_bytes(&self.gas_price)),
            RlpItem::Bytes(encode_uint_minimal(self.gas_limit)),
            match &self.to {
                Some(addr) => RlpItem::Bytes(addr.as_bytes().to_vec()),
                None => RlpItem::Bytes(vec![]),
            },
            RlpItem::Bytes(u256_to_minimal_bytes(&self.value)),
            RlpItem::Bytes(self.data.clone()),
            RlpItem::Bytes(encode_uint_minimal(self.v)),
            RlpItem::Bytes(strip_leading_zeros(&self.r).to_vec()),
            RlpItem::Bytes(strip_leading_zeros(&self.s).to_vec()),
        ];
        encode_list(&items)
    }

    /// Serialize the transaction for signing (EIP-155).
    ///
    /// For EIP-155 transactions, includes chain_id, 0, 0 instead of v, r, s.
    /// For pre-EIP-155, excludes signature fields entirely.
    pub fn serialize_for_signing(&self, chain_id: u64) -> Vec<u8> {
        let mut items = vec![
            RlpItem::Bytes(encode_uint_minimal(self.nonce)),
            RlpItem::Bytes(u256_to_minimal_bytes(&self.gas_price)),
            RlpItem::Bytes(encode_uint_minimal(self.gas_limit)),
            match &self.to {
                Some(addr) => RlpItem::Bytes(addr.as_bytes().to_vec()),
                None => RlpItem::Bytes(vec![]),
            },
            RlpItem::Bytes(u256_to_minimal_bytes(&self.value)),
            RlpItem::Bytes(self.data.clone()),
        ];

        // EIP-155: append chain_id, 0, 0
        if chain_id > 0 {
            items.push(RlpItem::Bytes(encode_uint_minimal(chain_id)));
            items.push(RlpItem::Bytes(vec![])); // 0
            items.push(RlpItem::Bytes(vec![])); // 0
        }

        encode_list(&items)
    }

    /// Compute the transaction hash.
    pub fn hash(&self) -> Hash {
        keccak256(&self.serialize())
    }

    /// Compute the hash used for signing.
    pub fn signing_hash(&self, chain_id: u64) -> Hash {
        keccak256(&self.serialize_for_signing(chain_id))
    }

    /// Recover the sender address from the signature.
    pub fn get_sender(&self) -> Result<Address> {
        if !self.is_signed() {
            return Err(Error::invalid_signature("transaction is not signed"));
        }

        let chain_id = self.chain_id().unwrap_or(0);
        let hash = self.signing_hash(chain_id);
        let signature = Signature::new(self.r, self.s);
        let recovery_id = RecoveryId::new(self.y_parity())?;

        Secp256k1::recover_address(hash.as_bytes(), &signature, recovery_id)
    }

    /// Verify that the signature is valid.
    pub fn verify_signature(&self) -> Result<bool> {
        if !self.is_signed() {
            return Ok(false);
        }

        // Check signature components are valid
        let signature = Signature::new(self.r, self.s);
        if !signature.is_valid() {
            return Ok(false);
        }

        // Check signature is normalized (EIP-2)
        if !signature.is_normalized() {
            return Ok(false);
        }

        // Try to recover sender - if it succeeds, signature is valid
        self.get_sender().map(|_| true)
    }
}

/// EIP-2930 access list transaction (type 1).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Eip2930Transaction {
    /// Chain ID.
    pub chain_id: u64,
    /// Transaction nonce.
    pub nonce: u64,
    /// Gas price in wei.
    pub gas_price: U256,
    /// Gas limit.
    pub gas_limit: u64,
    /// Recipient address (None for contract creation).
    pub to: Option<Address>,
    /// Value to transfer in wei.
    pub value: U256,
    /// Input data.
    pub data: Vec<u8>,
    /// Access list.
    pub access_list: AccessList,
    /// Signature y-parity (0 or 1).
    pub y_parity: u8,
    /// Signature r value.
    pub r: [u8; 32],
    /// Signature s value.
    pub s: [u8; 32],
}

impl Default for Eip2930Transaction {
    fn default() -> Self {
        Self {
            chain_id: 1,
            nonce: 0,
            gas_price: U256::ZERO,
            gas_limit: 21_000,
            to: None,
            value: U256::ZERO,
            data: Vec::new(),
            access_list: AccessList::empty(),
            y_parity: 0,
            r: [0u8; 32],
            s: [0u8; 32],
        }
    }
}

impl Eip2930Transaction {
    /// Check if this transaction is signed.
    #[inline]
    pub fn is_signed(&self) -> bool {
        self.r != [0u8; 32] || self.s != [0u8; 32]
    }

    /// Check if this is a contract creation transaction.
    #[inline]
    pub fn is_contract_creation(&self) -> bool {
        self.to.is_none()
    }

    /// Check if access list is non-empty.
    #[inline]
    pub fn has_access_list(&self) -> bool {
        !self.access_list.is_empty()
    }

    /// Serialize the transaction to RLP-encoded bytes with type prefix.
    pub fn serialize(&self) -> Vec<u8> {
        let rlp = self.serialize_rlp_payload(true);
        let mut result = vec![0x01]; // Type byte
        result.extend(rlp);
        result
    }

    /// Serialize the transaction for signing.
    pub fn serialize_for_signing(&self, _chain_id: u64) -> Vec<u8> {
        let rlp = self.serialize_rlp_payload(false);
        let mut result = vec![0x01]; // Type byte
        result.extend(rlp);
        result
    }

    fn serialize_rlp_payload(&self, include_signature: bool) -> Vec<u8> {
        let mut items = vec![
            RlpItem::Bytes(encode_uint_minimal(self.chain_id)),
            RlpItem::Bytes(encode_uint_minimal(self.nonce)),
            RlpItem::Bytes(u256_to_minimal_bytes(&self.gas_price)),
            RlpItem::Bytes(encode_uint_minimal(self.gas_limit)),
            match &self.to {
                Some(addr) => RlpItem::Bytes(addr.as_bytes().to_vec()),
                None => RlpItem::Bytes(vec![]),
            },
            RlpItem::Bytes(u256_to_minimal_bytes(&self.value)),
            RlpItem::Bytes(self.data.clone()),
            encode_access_list(&self.access_list),
        ];

        if include_signature {
            items.push(RlpItem::Bytes(encode_uint_minimal(self.y_parity as u64)));
            items.push(RlpItem::Bytes(strip_leading_zeros(&self.r).to_vec()));
            items.push(RlpItem::Bytes(strip_leading_zeros(&self.s).to_vec()));
        }

        encode_list(&items)
    }

    /// Compute the transaction hash.
    pub fn hash(&self) -> Hash {
        keccak256(&self.serialize())
    }

    /// Compute the hash used for signing.
    pub fn signing_hash(&self, chain_id: u64) -> Hash {
        keccak256(&self.serialize_for_signing(chain_id))
    }

    /// Recover the sender address from the signature.
    pub fn get_sender(&self) -> Result<Address> {
        if !self.is_signed() {
            return Err(Error::invalid_signature("transaction is not signed"));
        }

        let hash = self.signing_hash(self.chain_id);
        let signature = Signature::new(self.r, self.s);
        let recovery_id = RecoveryId::new(self.y_parity)?;

        Secp256k1::recover_address(hash.as_bytes(), &signature, recovery_id)
    }

    /// Verify that the signature is valid.
    pub fn verify_signature(&self) -> Result<bool> {
        if !self.is_signed() {
            return Ok(false);
        }

        let signature = Signature::new(self.r, self.s);
        if !signature.is_valid() || !signature.is_normalized() {
            return Ok(false);
        }

        self.get_sender().map(|_| true)
    }
}

/// EIP-1559 dynamic fee transaction (type 2).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Eip1559Transaction {
    /// Chain ID.
    pub chain_id: u64,
    /// Transaction nonce.
    pub nonce: u64,
    /// Maximum priority fee per gas (tip).
    pub max_priority_fee_per_gas: U256,
    /// Maximum total fee per gas.
    pub max_fee_per_gas: U256,
    /// Gas limit.
    pub gas_limit: u64,
    /// Recipient address (None for contract creation).
    pub to: Option<Address>,
    /// Value to transfer in wei.
    pub value: U256,
    /// Input data.
    pub data: Vec<u8>,
    /// Access list.
    pub access_list: AccessList,
    /// Signature y-parity (0 or 1).
    pub y_parity: u8,
    /// Signature r value.
    pub r: [u8; 32],
    /// Signature s value.
    pub s: [u8; 32],
}

impl Default for Eip1559Transaction {
    fn default() -> Self {
        Self {
            chain_id: 1,
            nonce: 0,
            max_priority_fee_per_gas: U256::ZERO,
            max_fee_per_gas: U256::ZERO,
            gas_limit: 21_000,
            to: None,
            value: U256::ZERO,
            data: Vec::new(),
            access_list: AccessList::empty(),
            y_parity: 0,
            r: [0u8; 32],
            s: [0u8; 32],
        }
    }
}

impl Eip1559Transaction {
    /// Check if this transaction is signed.
    #[inline]
    pub fn is_signed(&self) -> bool {
        self.r != [0u8; 32] || self.s != [0u8; 32]
    }

    /// Check if this is a contract creation transaction.
    #[inline]
    pub fn is_contract_creation(&self) -> bool {
        self.to.is_none()
    }

    /// Check if access list is non-empty.
    #[inline]
    pub fn has_access_list(&self) -> bool {
        !self.access_list.is_empty()
    }

    /// Calculate effective gas price given a base fee.
    pub fn effective_gas_price(&self, base_fee: &U256) -> U256 {
        let priority_fee = self.max_priority_fee_per_gas;
        let max_fee = self.max_fee_per_gas;

        // effective_price = min(max_fee, base_fee + priority_fee)
        if let Some(base_plus_priority) = base_fee.checked_add(priority_fee) {
            if base_plus_priority < max_fee {
                base_plus_priority
            } else {
                max_fee
            }
        } else {
            max_fee
        }
    }

    /// Serialize the transaction to RLP-encoded bytes with type prefix.
    pub fn serialize(&self) -> Vec<u8> {
        let rlp = self.serialize_rlp_payload(true);
        let mut result = vec![0x02]; // Type byte
        result.extend(rlp);
        result
    }

    /// Serialize the transaction for signing.
    pub fn serialize_for_signing(&self, _chain_id: u64) -> Vec<u8> {
        let rlp = self.serialize_rlp_payload(false);
        let mut result = vec![0x02]; // Type byte
        result.extend(rlp);
        result
    }

    fn serialize_rlp_payload(&self, include_signature: bool) -> Vec<u8> {
        let mut items = vec![
            RlpItem::Bytes(encode_uint_minimal(self.chain_id)),
            RlpItem::Bytes(encode_uint_minimal(self.nonce)),
            RlpItem::Bytes(u256_to_minimal_bytes(&self.max_priority_fee_per_gas)),
            RlpItem::Bytes(u256_to_minimal_bytes(&self.max_fee_per_gas)),
            RlpItem::Bytes(encode_uint_minimal(self.gas_limit)),
            match &self.to {
                Some(addr) => RlpItem::Bytes(addr.as_bytes().to_vec()),
                None => RlpItem::Bytes(vec![]),
            },
            RlpItem::Bytes(u256_to_minimal_bytes(&self.value)),
            RlpItem::Bytes(self.data.clone()),
            encode_access_list(&self.access_list),
        ];

        if include_signature {
            items.push(RlpItem::Bytes(encode_uint_minimal(self.y_parity as u64)));
            items.push(RlpItem::Bytes(strip_leading_zeros(&self.r).to_vec()));
            items.push(RlpItem::Bytes(strip_leading_zeros(&self.s).to_vec()));
        }

        encode_list(&items)
    }

    /// Compute the transaction hash.
    pub fn hash(&self) -> Hash {
        keccak256(&self.serialize())
    }

    /// Compute the hash used for signing.
    pub fn signing_hash(&self, chain_id: u64) -> Hash {
        keccak256(&self.serialize_for_signing(chain_id))
    }

    /// Recover the sender address from the signature.
    pub fn get_sender(&self) -> Result<Address> {
        if !self.is_signed() {
            return Err(Error::invalid_signature("transaction is not signed"));
        }

        let hash = self.signing_hash(self.chain_id);
        let signature = Signature::new(self.r, self.s);
        let recovery_id = RecoveryId::new(self.y_parity)?;

        Secp256k1::recover_address(hash.as_bytes(), &signature, recovery_id)
    }

    /// Verify that the signature is valid.
    pub fn verify_signature(&self) -> Result<bool> {
        if !self.is_signed() {
            return Ok(false);
        }

        let signature = Signature::new(self.r, self.s);
        if !signature.is_valid() || !signature.is_normalized() {
            return Ok(false);
        }

        self.get_sender().map(|_| true)
    }
}

/// EIP-4844 blob transaction (type 3).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Eip4844Transaction {
    /// Chain ID.
    pub chain_id: u64,
    /// Transaction nonce.
    pub nonce: u64,
    /// Maximum priority fee per gas (tip).
    pub max_priority_fee_per_gas: U256,
    /// Maximum total fee per gas.
    pub max_fee_per_gas: U256,
    /// Gas limit.
    pub gas_limit: u64,
    /// Recipient address (must be non-null for blob transactions).
    pub to: Address,
    /// Value to transfer in wei.
    pub value: U256,
    /// Input data.
    pub data: Vec<u8>,
    /// Access list.
    pub access_list: AccessList,
    /// Maximum fee per blob gas.
    pub max_fee_per_blob_gas: U256,
    /// Blob versioned hashes.
    pub blob_versioned_hashes: Vec<Hash>,
    /// Signature y-parity (0 or 1).
    pub y_parity: u8,
    /// Signature r value.
    pub r: [u8; 32],
    /// Signature s value.
    pub s: [u8; 32],
}

impl Default for Eip4844Transaction {
    fn default() -> Self {
        Self {
            chain_id: 1,
            nonce: 0,
            max_priority_fee_per_gas: U256::ZERO,
            max_fee_per_gas: U256::ZERO,
            gas_limit: 21_000,
            to: Address::ZERO,
            value: U256::ZERO,
            data: Vec::new(),
            access_list: AccessList::empty(),
            max_fee_per_blob_gas: U256::ZERO,
            blob_versioned_hashes: Vec::new(),
            y_parity: 0,
            r: [0u8; 32],
            s: [0u8; 32],
        }
    }
}

impl Eip4844Transaction {
    /// Check if this transaction is signed.
    #[inline]
    pub fn is_signed(&self) -> bool {
        self.r != [0u8; 32] || self.s != [0u8; 32]
    }

    /// Blob transactions cannot be contract creation.
    #[inline]
    pub const fn is_contract_creation(&self) -> bool {
        false
    }

    /// Check if access list is non-empty.
    #[inline]
    pub fn has_access_list(&self) -> bool {
        !self.access_list.is_empty()
    }

    /// Get number of blobs.
    #[inline]
    pub fn blob_count(&self) -> usize {
        self.blob_versioned_hashes.len()
    }

    /// Calculate effective gas price given a base fee.
    pub fn effective_gas_price(&self, base_fee: &U256) -> U256 {
        let priority_fee = self.max_priority_fee_per_gas;
        let max_fee = self.max_fee_per_gas;

        if let Some(base_plus_priority) = base_fee.checked_add(priority_fee) {
            if base_plus_priority < max_fee {
                base_plus_priority
            } else {
                max_fee
            }
        } else {
            max_fee
        }
    }
}

/// EIP-7702 authorization transaction (type 4).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Eip7702Transaction {
    /// Chain ID.
    pub chain_id: u64,
    /// Transaction nonce.
    pub nonce: u64,
    /// Maximum priority fee per gas (tip).
    pub max_priority_fee_per_gas: U256,
    /// Maximum total fee per gas.
    pub max_fee_per_gas: U256,
    /// Gas limit.
    pub gas_limit: u64,
    /// Recipient address (None for contract creation).
    pub to: Option<Address>,
    /// Value to transfer in wei.
    pub value: U256,
    /// Input data.
    pub data: Vec<u8>,
    /// Access list.
    pub access_list: AccessList,
    /// Authorization list.
    pub authorization_list: Vec<SignedAuthorization>,
    /// Signature y-parity (0 or 1).
    pub y_parity: u8,
    /// Signature r value.
    pub r: [u8; 32],
    /// Signature s value.
    pub s: [u8; 32],
}

impl Default for Eip7702Transaction {
    fn default() -> Self {
        Self {
            chain_id: 1,
            nonce: 0,
            max_priority_fee_per_gas: U256::ZERO,
            max_fee_per_gas: U256::ZERO,
            gas_limit: 21_000,
            to: None,
            value: U256::ZERO,
            data: Vec::new(),
            access_list: AccessList::empty(),
            authorization_list: Vec::new(),
            y_parity: 0,
            r: [0u8; 32],
            s: [0u8; 32],
        }
    }
}

impl Eip7702Transaction {
    /// Check if this transaction is signed.
    #[inline]
    pub fn is_signed(&self) -> bool {
        self.r != [0u8; 32] || self.s != [0u8; 32]
    }

    /// Check if this is a contract creation transaction.
    #[inline]
    pub fn is_contract_creation(&self) -> bool {
        self.to.is_none()
    }

    /// Check if access list is non-empty.
    #[inline]
    pub fn has_access_list(&self) -> bool {
        !self.access_list.is_empty()
    }

    /// Get number of authorizations.
    #[inline]
    pub fn authorization_count(&self) -> usize {
        self.authorization_list.len()
    }

    /// Calculate effective gas price given a base fee.
    pub fn effective_gas_price(&self, base_fee: &U256) -> U256 {
        let priority_fee = self.max_priority_fee_per_gas;
        let max_fee = self.max_fee_per_gas;

        if let Some(base_plus_priority) = base_fee.checked_add(priority_fee) {
            if base_plus_priority < max_fee {
                base_plus_priority
            } else {
                max_fee
            }
        } else {
            max_fee
        }
    }
}

/// Unified transaction enum.
///
/// Wraps all transaction types in a single enum for generic handling.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Transaction {
    /// Legacy transaction (type 0).
    Legacy(LegacyTransaction),
    /// EIP-2930 access list transaction (type 1).
    Eip2930(Eip2930Transaction),
    /// EIP-1559 dynamic fee transaction (type 2).
    Eip1559(Eip1559Transaction),
    /// EIP-4844 blob transaction (type 3).
    Eip4844(Eip4844Transaction),
    /// EIP-7702 authorization transaction (type 4).
    Eip7702(Eip7702Transaction),
}

impl Transaction {
    /// Get the transaction type.
    #[inline]
    pub fn tx_type(&self) -> TransactionType {
        match self {
            Self::Legacy(_) => TransactionType::Legacy,
            Self::Eip2930(_) => TransactionType::Eip2930,
            Self::Eip1559(_) => TransactionType::Eip1559,
            Self::Eip4844(_) => TransactionType::Eip4844,
            Self::Eip7702(_) => TransactionType::Eip7702,
        }
    }

    /// Get the nonce.
    pub fn nonce(&self) -> u64 {
        match self {
            Self::Legacy(tx) => tx.nonce,
            Self::Eip2930(tx) => tx.nonce,
            Self::Eip1559(tx) => tx.nonce,
            Self::Eip4844(tx) => tx.nonce,
            Self::Eip7702(tx) => tx.nonce,
        }
    }

    /// Get the gas limit.
    pub fn gas_limit(&self) -> u64 {
        match self {
            Self::Legacy(tx) => tx.gas_limit,
            Self::Eip2930(tx) => tx.gas_limit,
            Self::Eip1559(tx) => tx.gas_limit,
            Self::Eip4844(tx) => tx.gas_limit,
            Self::Eip7702(tx) => tx.gas_limit,
        }
    }

    /// Get the recipient address.
    ///
    /// Returns `None` for contract creation transactions.
    pub fn to(&self) -> Option<Address> {
        match self {
            Self::Legacy(tx) => tx.to,
            Self::Eip2930(tx) => tx.to,
            Self::Eip1559(tx) => tx.to,
            Self::Eip4844(tx) => Some(tx.to),
            Self::Eip7702(tx) => tx.to,
        }
    }

    /// Get the value in wei.
    pub fn value(&self) -> U256 {
        match self {
            Self::Legacy(tx) => tx.value,
            Self::Eip2930(tx) => tx.value,
            Self::Eip1559(tx) => tx.value,
            Self::Eip4844(tx) => tx.value,
            Self::Eip7702(tx) => tx.value,
        }
    }

    /// Get the input data.
    pub fn data(&self) -> &[u8] {
        match self {
            Self::Legacy(tx) => &tx.data,
            Self::Eip2930(tx) => &tx.data,
            Self::Eip1559(tx) => &tx.data,
            Self::Eip4844(tx) => &tx.data,
            Self::Eip7702(tx) => &tx.data,
        }
    }

    /// Get the chain ID.
    ///
    /// Returns `None` for pre-EIP-155 legacy transactions.
    pub fn chain_id(&self) -> Option<u64> {
        match self {
            Self::Legacy(tx) => tx.chain_id(),
            Self::Eip2930(tx) => Some(tx.chain_id),
            Self::Eip1559(tx) => Some(tx.chain_id),
            Self::Eip4844(tx) => Some(tx.chain_id),
            Self::Eip7702(tx) => Some(tx.chain_id),
        }
    }

    /// Check if this transaction is signed.
    pub fn is_signed(&self) -> bool {
        match self {
            Self::Legacy(tx) => tx.is_signed(),
            Self::Eip2930(tx) => tx.is_signed(),
            Self::Eip1559(tx) => tx.is_signed(),
            Self::Eip4844(tx) => tx.is_signed(),
            Self::Eip7702(tx) => tx.is_signed(),
        }
    }

    /// Check if this is a contract creation transaction.
    pub fn is_contract_creation(&self) -> bool {
        match self {
            Self::Legacy(tx) => tx.is_contract_creation(),
            Self::Eip2930(tx) => tx.is_contract_creation(),
            Self::Eip1559(tx) => tx.is_contract_creation(),
            Self::Eip4844(tx) => tx.is_contract_creation(),
            Self::Eip7702(tx) => tx.is_contract_creation(),
        }
    }

    /// Get the access list.
    ///
    /// Returns `None` for legacy transactions which don't support access lists.
    pub fn access_list(&self) -> Option<&AccessList> {
        match self {
            Self::Legacy(_) => None,
            Self::Eip2930(tx) => Some(&tx.access_list),
            Self::Eip1559(tx) => Some(&tx.access_list),
            Self::Eip4844(tx) => Some(&tx.access_list),
            Self::Eip7702(tx) => Some(&tx.access_list),
        }
    }

    /// Check if the transaction has a non-empty access list.
    pub fn has_access_list(&self) -> bool {
        match self {
            Self::Legacy(_) => false,
            Self::Eip2930(tx) => !tx.access_list.is_empty(),
            Self::Eip1559(tx) => !tx.access_list.is_empty(),
            Self::Eip4844(tx) => !tx.access_list.is_empty(),
            Self::Eip7702(tx) => !tx.access_list.is_empty(),
        }
    }
}

impl From<LegacyTransaction> for Transaction {
    fn from(tx: LegacyTransaction) -> Self {
        Self::Legacy(tx)
    }
}

impl From<Eip2930Transaction> for Transaction {
    fn from(tx: Eip2930Transaction) -> Self {
        Self::Eip2930(tx)
    }
}

impl From<Eip1559Transaction> for Transaction {
    fn from(tx: Eip1559Transaction) -> Self {
        Self::Eip1559(tx)
    }
}

impl From<Eip4844Transaction> for Transaction {
    fn from(tx: Eip4844Transaction) -> Self {
        Self::Eip4844(tx)
    }
}

impl From<Eip7702Transaction> for Transaction {
    fn from(tx: Eip7702Transaction) -> Self {
        Self::Eip7702(tx)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::primitives::AccessListEntry;

    #[test]
    fn test_transaction_type_detect_legacy() {
        // RLP list prefix 0xf8 indicates legacy
        let data = [0xf8, 0x70, 0x80];
        assert_eq!(TransactionType::detect(&data), TransactionType::Legacy);

        // Empty data is legacy
        assert_eq!(TransactionType::detect(&[]), TransactionType::Legacy);

        // 0xc0+ is RLP list prefix, so legacy
        let data = [0xc0];
        assert_eq!(TransactionType::detect(&data), TransactionType::Legacy);
    }

    #[test]
    fn test_transaction_type_detect_typed() {
        // EIP-2930
        let data = [0x01, 0xf8, 0x70];
        assert_eq!(TransactionType::detect(&data), TransactionType::Eip2930);

        // EIP-1559
        let data = [0x02, 0xf8, 0x70];
        assert_eq!(TransactionType::detect(&data), TransactionType::Eip1559);

        // EIP-4844
        let data = [0x03, 0xf8, 0x70];
        assert_eq!(TransactionType::detect(&data), TransactionType::Eip4844);

        // EIP-7702
        let data = [0x04, 0xf8, 0x70];
        assert_eq!(TransactionType::detect(&data), TransactionType::Eip7702);
    }

    #[test]
    fn test_transaction_type_try_from() {
        assert_eq!(TransactionType::try_from(0x00).unwrap(), TransactionType::Legacy);
        assert_eq!(TransactionType::try_from(0x01).unwrap(), TransactionType::Eip2930);
        assert_eq!(TransactionType::try_from(0x02).unwrap(), TransactionType::Eip1559);
        assert_eq!(TransactionType::try_from(0x03).unwrap(), TransactionType::Eip4844);
        assert_eq!(TransactionType::try_from(0x04).unwrap(), TransactionType::Eip7702);

        // Unknown type
        assert!(TransactionType::try_from(0x05).is_err());
        assert!(TransactionType::try_from(0xff).is_err());
    }

    #[test]
    fn test_transaction_type_into_u8() {
        assert_eq!(u8::from(TransactionType::Legacy), 0x00);
        assert_eq!(u8::from(TransactionType::Eip2930), 0x01);
        assert_eq!(u8::from(TransactionType::Eip1559), 0x02);
        assert_eq!(u8::from(TransactionType::Eip4844), 0x03);
        assert_eq!(u8::from(TransactionType::Eip7702), 0x04);
    }

    #[test]
    fn test_transaction_type_display() {
        assert_eq!(format!("{}", TransactionType::Legacy), "legacy");
        assert_eq!(format!("{}", TransactionType::Eip1559), "eip1559");
    }

    #[test]
    fn test_transaction_type_is_typed() {
        assert!(!TransactionType::Legacy.is_typed());
        assert!(TransactionType::Eip2930.is_typed());
        assert!(TransactionType::Eip1559.is_typed());
        assert!(TransactionType::Eip4844.is_typed());
        assert!(TransactionType::Eip7702.is_typed());
    }

    #[test]
    fn test_transaction_type_supports_access_list() {
        assert!(!TransactionType::Legacy.supports_access_list());
        assert!(TransactionType::Eip2930.supports_access_list());
        assert!(TransactionType::Eip1559.supports_access_list());
        assert!(TransactionType::Eip4844.supports_access_list());
        assert!(TransactionType::Eip7702.supports_access_list());
    }

    #[test]
    fn test_transaction_type_is_eip1559() {
        assert!(!TransactionType::Legacy.is_eip1559());
        assert!(!TransactionType::Eip2930.is_eip1559());
        assert!(TransactionType::Eip1559.is_eip1559());
        assert!(TransactionType::Eip4844.is_eip1559());
        assert!(TransactionType::Eip7702.is_eip1559());
    }

    #[test]
    fn test_transaction_type_type_byte() {
        assert_eq!(TransactionType::Legacy.type_byte(), None);
        assert_eq!(TransactionType::Eip2930.type_byte(), Some(0x01));
        assert_eq!(TransactionType::Eip1559.type_byte(), Some(0x02));
        assert_eq!(TransactionType::Eip4844.type_byte(), Some(0x03));
        assert_eq!(TransactionType::Eip7702.type_byte(), Some(0x04));
    }

    #[test]
    fn test_legacy_transaction_default() {
        let tx = LegacyTransaction::default();
        assert_eq!(tx.nonce, 0);
        assert_eq!(tx.gas_limit, 21_000);
        assert!(tx.to.is_none());
        assert!(!tx.is_signed());
        assert!(tx.is_contract_creation());
    }

    #[test]
    fn test_legacy_transaction_chain_id() {
        // Pre-EIP-155 (v = 27 or 28)
        let tx = LegacyTransaction {
            v: 27,
            ..Default::default()
        };
        assert_eq!(tx.chain_id(), None);

        let tx = LegacyTransaction {
            v: 28,
            ..Default::default()
        };
        assert_eq!(tx.chain_id(), None);

        // EIP-155 mainnet (chainId=1): v = chainId * 2 + 35 = 37 or 38
        let tx = LegacyTransaction {
            v: 37,
            ..Default::default()
        };
        assert_eq!(tx.chain_id(), Some(1));

        let tx = LegacyTransaction {
            v: 38,
            ..Default::default()
        };
        assert_eq!(tx.chain_id(), Some(1));

        // Goerli (chainId=5): v = 45 or 46
        let tx = LegacyTransaction {
            v: 45,
            ..Default::default()
        };
        assert_eq!(tx.chain_id(), Some(5));
    }

    #[test]
    fn test_legacy_transaction_y_parity() {
        // Pre-EIP-155
        let tx = LegacyTransaction {
            v: 27,
            ..Default::default()
        };
        assert_eq!(tx.y_parity(), 0);

        let tx = LegacyTransaction {
            v: 28,
            ..Default::default()
        };
        assert_eq!(tx.y_parity(), 1);

        // EIP-155
        let tx = LegacyTransaction {
            v: 37,
            ..Default::default()
        };
        assert_eq!(tx.y_parity(), 0);

        let tx = LegacyTransaction {
            v: 38,
            ..Default::default()
        };
        assert_eq!(tx.y_parity(), 1);
    }

    #[test]
    fn test_legacy_transaction_is_signed() {
        let tx = LegacyTransaction::default();
        assert!(!tx.is_signed());

        let tx = LegacyTransaction {
            r: [1u8; 32],
            ..Default::default()
        };
        assert!(tx.is_signed());

        let tx = LegacyTransaction {
            s: [1u8; 32],
            ..Default::default()
        };
        assert!(tx.is_signed());
    }

    #[test]
    fn test_eip1559_transaction_default() {
        let tx = Eip1559Transaction::default();
        assert_eq!(tx.chain_id, 1);
        assert_eq!(tx.nonce, 0);
        assert_eq!(tx.gas_limit, 21_000);
        assert!(tx.to.is_none());
        assert!(!tx.is_signed());
        assert!(tx.is_contract_creation());
        assert!(!tx.has_access_list());
    }

    #[test]
    fn test_eip1559_effective_gas_price() {
        let tx = Eip1559Transaction {
            max_priority_fee_per_gas: U256::from(2_000_000_000u64), // 2 gwei
            max_fee_per_gas: U256::from(50_000_000_000u64),         // 50 gwei
            ..Default::default()
        };

        // Base fee 10 gwei -> effective = 10 + 2 = 12 gwei
        let base_fee = U256::from(10_000_000_000u64);
        let effective = tx.effective_gas_price(&base_fee);
        assert_eq!(effective, U256::from(12_000_000_000u64));

        // Base fee 100 gwei -> effective = min(100 + 2, 50) = 50 gwei
        let base_fee = U256::from(100_000_000_000u64);
        let effective = tx.effective_gas_price(&base_fee);
        assert_eq!(effective, U256::from(50_000_000_000u64));
    }

    #[test]
    fn test_eip4844_transaction_default() {
        let tx = Eip4844Transaction::default();
        assert_eq!(tx.chain_id, 1);
        assert!(!tx.is_contract_creation()); // Blob txs cannot create contracts
        assert_eq!(tx.blob_count(), 0);
    }

    #[test]
    fn test_eip7702_transaction_default() {
        let tx = Eip7702Transaction::default();
        assert_eq!(tx.chain_id, 1);
        assert!(tx.is_contract_creation());
        assert_eq!(tx.authorization_count(), 0);
    }

    #[test]
    fn test_unified_transaction_enum() {
        let legacy = LegacyTransaction {
            nonce: 42,
            gas_limit: 100_000,
            to: Some(Address::new([1u8; 20])),
            value: U256::from(1000u64),
            data: vec![0xde, 0xad, 0xbe, 0xef],
            v: 37, // mainnet EIP-155
            ..Default::default()
        };

        let tx = Transaction::from(legacy.clone());
        assert_eq!(tx.tx_type(), TransactionType::Legacy);
        assert_eq!(tx.nonce(), 42);
        assert_eq!(tx.gas_limit(), 100_000);
        assert_eq!(tx.to(), Some(Address::new([1u8; 20])));
        assert_eq!(tx.value(), U256::from(1000u64));
        assert_eq!(tx.data(), &[0xde, 0xad, 0xbe, 0xef]);
        assert_eq!(tx.chain_id(), Some(1));
        assert!(!tx.is_signed());
        assert!(!tx.is_contract_creation());
        assert!(tx.access_list().is_none()); // Legacy has no access list
    }

    #[test]
    fn test_unified_transaction_eip1559() {
        let mut access_list = AccessList::empty();
        access_list.push(AccessListEntry::address_only(Address::new([2u8; 20])));

        let eip1559 = Eip1559Transaction {
            chain_id: 5,
            nonce: 100,
            gas_limit: 200_000,
            to: None,
            access_list,
            ..Default::default()
        };

        let tx = Transaction::from(eip1559);
        assert_eq!(tx.tx_type(), TransactionType::Eip1559);
        assert_eq!(tx.nonce(), 100);
        assert_eq!(tx.chain_id(), Some(5));
        assert!(tx.is_contract_creation());
        assert_eq!(tx.access_list().unwrap().len(), 1);
    }

    #[test]
    fn test_unified_transaction_eip4844() {
        let recipient = Address::new([3u8; 20]);
        let blob_hash = Hash::new([4u8; 32]);

        let eip4844 = Eip4844Transaction {
            chain_id: 1,
            to: recipient,
            blob_versioned_hashes: vec![blob_hash],
            ..Default::default()
        };

        let tx = Transaction::from(eip4844);
        assert_eq!(tx.tx_type(), TransactionType::Eip4844);
        assert_eq!(tx.to(), Some(recipient));
        assert!(!tx.is_contract_creation());
    }
}
