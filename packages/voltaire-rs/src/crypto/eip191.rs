//! EIP-191 personal message signing.
//!
//! Implements the Ethereum signed message format used by `eth_sign`.

use crate::primitives::Hash;
use crate::crypto::keccak256;

/// Hash a message using EIP-191 personal message format.
///
/// Prepends `"\x19Ethereum Signed Message:\n" + len(message)` to the message
/// before hashing with Keccak-256.
///
/// # Examples
///
/// ```rust
/// use voltaire::crypto::hash_message;
///
/// let hash = hash_message(b"Hello, World!");
/// ```
pub fn hash_message(message: &[u8]) -> Hash {
    let prefix = format!("\x19Ethereum Signed Message:\n{}", message.len());
    let mut data = prefix.into_bytes();
    data.extend_from_slice(message);
    keccak256(&data)
}


#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hash_message() {
        let hash = hash_message(b"hello");
        // This should match the output from eth_sign
        assert!(!hash.is_zero());
    }

    #[test]
    fn test_hash_message_empty() {
        let hash = hash_message(b"");
        // \x19Ethereum Signed Message:\n0
        assert!(!hash.is_zero());
    }

    #[test]
    fn test_hash_message_known_vector() {
        // Test vector from ethers.js / web3.js
        let hash = hash_message(b"hello world");
        assert_eq!(
            hash.to_hex(),
            "0xd9eba16ed0ecae432b71fe008c98cc872bb4cc214d3220a36f365326cf807d68"
        );
    }
}
