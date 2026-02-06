//! # Voltaire
//!
//! Idiomatic Rust bindings for Voltaire Ethereum primitives and cryptography.
//!
//! ## Overview
//!
//! Voltaire provides high-performance, type-safe Ethereum primitives implemented
//! in Zig with Rust bindings via C FFI. This crate wraps the native library with
//! idiomatic Rust APIs including:
//!
//! - **Newtype wrappers** with `Deref` for seamless byte access
//! - **`Result` types** instead of error codes
//! - **`From`/`TryFrom` traits** for conversions
//! - **`std::fmt` traits** for display
//! - **`serde` support** (optional)
//! - **Iterator patterns** where applicable
//!
//! ## Modules
//!
//! - [`primitives`] - Core types: Address, Hash, U256, Hex, RLP
//! - [`crypto`] - Cryptographic operations: Keccak256, secp256k1, SHA256
//! - [`state`] - State management with fork support
//! - [`blockchain`] - Blockchain queries and block data
//!
//! ## Example
//!
//! ```rust
//! use voltaire::primitives::{Address, Hash};
//! use voltaire::crypto::keccak256;
//!
//! // Parse address from hex
//! let addr: Address = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045".parse()?;
//! assert!(!addr.is_zero());
//!
//! // Compute keccak256 hash
//! let hash = keccak256(b"hello");
//! println!("Hash: {}", hash);
//!
//! // Derive address from public key
//! let pubkey = [0u8; 64]; // Example public key
//! let derived = Address::from_public_key(&pubkey)?;
//! # Ok::<(), voltaire::Error>(())
//! ```
//!
//! ## Feature Flags
//!
//! - `std` (default) - Standard library support
//! - `native` - Link against native Voltaire FFI library

#![cfg_attr(not(feature = "std"), no_std)]
#![warn(missing_docs)]
#![warn(rust_2018_idioms)]
#![deny(unsafe_op_in_unsafe_fn)]

#[cfg(not(feature = "std"))]
extern crate alloc;

pub mod error;
pub mod primitives;
pub mod crypto;

#[cfg(feature = "native")]
pub mod state;

#[cfg(feature = "native")]
pub mod blockchain;

#[cfg(feature = "native")]
mod ffi;

// Re-exports
pub use error::{Error, Result};
pub use primitives::{Address, Hash, U256, Hex};
pub use primitives::abi;
pub use primitives::rlp;
pub use crypto::keccak256;

/// Prelude for common imports
pub mod prelude {
    pub use crate::primitives::{Address, Hash, U256, Hex};
    pub use crate::crypto::keccak256;
    pub use crate::error::{Error, Result};
}
