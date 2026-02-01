//! Cryptographic operations.
//!
//! This module provides cryptographic primitives for Ethereum:
//!
//! - [`keccak256`] - Ethereum's primary hash function
//! - [`sha256`] - SHA-256 hash
//! - [`ripemd160`] - RIPEMD-160 hash (for Bitcoin compatibility)
//! - [`blake2b`], [`blake2s`] - BLAKE2 hash functions
//! - [`hmac_sha256`], [`hmac_sha512`] - HMAC authentication
//! - [`secp256k1`] - ECDSA signatures and key operations
//! - [`eip191`] - EIP-191 personal message hashing
//! - [`eip712`] - EIP-712 typed structured data hashing
//!
//! All implementations use constant-time operations where security-relevant.

mod keccak;
mod sha256;
mod ripemd160;
mod secp256k1;
mod eip191;
pub mod eip712;
mod blake2;
mod hmac;

pub use keccak::{keccak256, Keccak256};
pub use sha256::sha256;
pub use ripemd160::ripemd160;
pub use secp256k1::{Secp256k1, Signature, RecoveryId, CompactSignature, RsvSignature};
pub use eip191::hash_message;
pub use eip712::{
    Domain, TypedData, TypeProperty, MessageValue, TypeDefinitions,
    encode_type, hash_type, hash_struct, hash_domain, sign_typed_data,
};
pub use blake2::{blake2b, blake2s, Blake2b, Blake2s};
pub use hmac::{hmac_sha256, hmac_sha512, HmacSha256, HmacSha512};
