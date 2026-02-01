//! Ethereum primitive types.
//!
//! This module provides core Ethereum data types with idiomatic Rust APIs:
//!
//! - [`Address`] - 20-byte Ethereum address with EIP-55 checksum support
//! - [`Hash`] - 32-byte hash (Keccak256 output)
//! - [`U256`] - 256-bit unsigned integer
//! - [`Hex`] - Hexadecimal encoding/decoding utilities
//! - [`TransactionType`] - Transaction envelope type detection
//! - [`Transaction`] - Unified transaction types (Legacy, EIP-2930, EIP-1559, EIP-4844, EIP-7702)
//! - [`abi`] - ABI encoding/decoding for smart contract interaction
//! - [`rlp`] - RLP (Recursive Length Prefix) encoding/decoding
//!
//! All types implement common traits like `Display`, `FromStr`, `From`/`TryFrom`,
//! and provide constant-time equality where security-relevant.

pub mod abi;
mod access_list;
mod address;
mod authorization;
mod hash;
mod hex;
pub mod rlp;
mod transaction;
mod u256;

pub use access_list::{AccessList, AccessListEntry, MAX_ACCESS_LIST_ENTRIES, MAX_STORAGE_KEYS_PER_ENTRY};
pub use address::Address;
pub use authorization::{Authorization, AuthorizationList, SignedAuthorization, MAX_AUTHORIZATIONS};
pub use hash::Hash;
pub use hex::Hex;
pub use rlp::{
    decode_bytes, decode_item, decode_list, decode_uint, encode_bytes, encode_item, encode_list,
    encode_uint, is_canonical, validate, RlpDecodable, RlpDecoder, RlpEncodable, RlpError, RlpItem,
    RlpResult, MAX_RLP_DEPTH,
};
pub use transaction::{
    TransactionType, Transaction,
    LegacyTransaction, Eip2930Transaction, Eip1559Transaction,
    Eip4844Transaction, Eip7702Transaction,
};
pub use u256::U256;

/// Zero address constant (0x0000...0000).
pub const ZERO_ADDRESS: Address = Address::ZERO;

/// Zero hash constant (0x0000...0000).
pub const ZERO_HASH: Hash = Hash::ZERO;
