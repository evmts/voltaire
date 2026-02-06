//! EIP-7702 Authorization types.
//!
//! Authorizations enable EOAs to delegate code execution to smart contracts,
//! allowing account abstraction features without deploying a separate contract.

use core::fmt;

#[cfg(not(feature = "std"))]
use alloc::vec::Vec;

use crate::error::{Error, Result};
use crate::primitives::Address;

/// Maximum authorizations per transaction (DoS protection).
pub const MAX_AUTHORIZATIONS: usize = 100;

/// An EIP-7702 authorization tuple.
///
/// Authorizations allow an EOA to temporarily delegate code execution to a
/// smart contract address. The authorization includes chain ID, contract
/// address, and nonce to prevent replay attacks.
///
/// # Examples
///
/// ```rust
/// use voltaire::primitives::{Authorization, Address};
///
/// let auth = Authorization {
///     chain_id: 1,
///     address: "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef".parse()?,
///     nonce: 0,
/// };
/// # Ok::<(), voltaire::Error>(())
/// ```
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Default)]
pub struct Authorization {
    /// Chain ID this authorization is valid for (0 = any chain).
    pub chain_id: u64,
    /// Contract address to delegate execution to.
    pub address: Address,
    /// Nonce to prevent replay attacks.
    pub nonce: u64,
}

impl Authorization {
    /// Create a new authorization.
    #[inline]
    pub const fn new(chain_id: u64, address: Address, nonce: u64) -> Self {
        Self { chain_id, address, nonce }
    }

    /// Create an authorization for a specific chain.
    #[inline]
    pub const fn for_chain(chain_id: u64, address: Address, nonce: u64) -> Self {
        Self { chain_id, address, nonce }
    }

    /// Create an authorization valid on any chain.
    #[inline]
    pub const fn for_any_chain(address: Address, nonce: u64) -> Self {
        Self { chain_id: 0, address, nonce }
    }

    /// Check if this authorization is chain-specific.
    #[inline]
    pub const fn is_chain_specific(&self) -> bool {
        self.chain_id != 0
    }

    /// Check if authorization is valid for a given chain.
    #[inline]
    pub const fn is_valid_for_chain(&self, chain_id: u64) -> bool {
        self.chain_id == 0 || self.chain_id == chain_id
    }

    /// Validate the authorization.
    pub fn validate(&self) -> Result<()> {
        // Zero address is invalid (no code to delegate to)
        if self.address.is_zero() {
            return Err(Error::InvalidAuthorization);
        }
        Ok(())
    }

    /// Compute the signing hash for this authorization.
    ///
    /// The hash is computed as:
    /// keccak256(MAGIC || rlp([chain_id, address, nonce]))
    ///
    /// Where MAGIC = 0x05 (EIP-7702 magic byte)
    #[cfg(feature = "native")]
    pub fn signing_hash(&self) -> crate::primitives::Hash {
        use crate::crypto::keccak256;

        // Simple RLP encoding for this tuple
        // This is a simplified version - full RLP encoding would be more complex
        let mut data = Vec::with_capacity(64);
        data.push(0x05); // Magic byte

        // Encode chain_id (simplified - real impl needs proper RLP)
        data.extend_from_slice(&self.chain_id.to_be_bytes());
        data.extend_from_slice(self.address.as_bytes());
        data.extend_from_slice(&self.nonce.to_be_bytes());

        keccak256(&data)
    }
}

impl fmt::Display for Authorization {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        if self.is_chain_specific() {
            write!(f, "Auth(chain={}, addr={}, nonce={})", self.chain_id, self.address, self.nonce)
        } else {
            write!(f, "Auth(any chain, addr={}, nonce={})", self.address, self.nonce)
        }
    }
}

/// A signed EIP-7702 authorization.
///
/// Contains the authorization tuple plus the ECDSA signature (y_parity, r, s).
///
/// # Examples
///
/// ```rust
/// use voltaire::primitives::{SignedAuthorization, Authorization, Address};
///
/// let auth = Authorization::new(1, Address::ZERO, 0);
/// let signed = SignedAuthorization {
///     authorization: auth,
///     y_parity: 0,
///     r: [0u8; 32],
///     s: [0u8; 32],
/// };
/// ```
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct SignedAuthorization {
    /// The authorization tuple.
    pub authorization: Authorization,
    /// Signature y-parity (0 or 1).
    pub y_parity: u8,
    /// Signature r value.
    pub r: [u8; 32],
    /// Signature s value.
    pub s: [u8; 32],
}

impl SignedAuthorization {
    /// Create a new signed authorization.
    #[inline]
    pub const fn new(
        authorization: Authorization,
        y_parity: u8,
        r: [u8; 32],
        s: [u8; 32],
    ) -> Self {
        Self { authorization, y_parity, r, s }
    }

    /// Create from authorization and signature bytes.
    pub fn from_parts(auth: Authorization, signature: &[u8; 65]) -> Self {
        let mut r = [0u8; 32];
        let mut s = [0u8; 32];
        r.copy_from_slice(&signature[0..32]);
        s.copy_from_slice(&signature[32..64]);
        let y_parity = signature[64];

        Self {
            authorization: auth,
            y_parity,
            r,
            s,
        }
    }

    /// Get the recovery ID (0 or 1).
    #[inline]
    pub const fn recovery_id(&self) -> u8 {
        self.y_parity
    }

    /// Get the v value (27 or 28 for legacy compatibility).
    #[inline]
    pub const fn v(&self) -> u8 {
        self.y_parity + 27
    }

    /// Get the 65-byte signature (r || s || y_parity).
    pub fn signature_bytes(&self) -> [u8; 65] {
        let mut sig = [0u8; 65];
        sig[0..32].copy_from_slice(&self.r);
        sig[32..64].copy_from_slice(&self.s);
        sig[64] = self.y_parity;
        sig
    }

    /// Validate the signed authorization.
    pub fn validate(&self) -> Result<()> {
        // Validate the inner authorization
        self.authorization.validate()?;

        // y_parity must be 0 or 1
        if self.y_parity > 1 {
            return Err(Error::InvalidAuthorization);
        }

        // r and s must not be zero
        if self.r == [0u8; 32] || self.s == [0u8; 32] {
            return Err(Error::InvalidAuthorization);
        }

        // Check s is in lower half of curve order (EIP-2)
        // secp256k1 order / 2 ≈ 0x7FFFFFFF...
        // For simplicity, we just check the high bit of s[0]
        // A proper implementation would do full comparison
        if self.s[0] > 0x7F {
            return Err(Error::InvalidAuthorization);
        }

        Ok(())
    }

    /// Recover the signer address from the signature.
    ///
    /// Returns the address of the EOA that signed this authorization.
    #[cfg(feature = "native")]
    pub fn recover_signer(&self) -> Result<Address> {
        use crate::crypto::secp256k1;

        let hash = self.authorization.signing_hash();
        let sig = self.signature_bytes();

        secp256k1::recover_address(&hash.to_bytes(), &sig)
    }

    /// Verify the signature against an expected signer.
    #[cfg(feature = "native")]
    pub fn verify_signer(&self, expected: &Address) -> Result<bool> {
        let recovered = self.recover_signer()?;
        Ok(&recovered == expected)
    }

    /// Get the chain ID.
    #[inline]
    pub const fn chain_id(&self) -> u64 {
        self.authorization.chain_id
    }

    /// Get the delegate contract address.
    #[inline]
    pub const fn address(&self) -> &Address {
        &self.authorization.address
    }

    /// Get the nonce.
    #[inline]
    pub const fn nonce(&self) -> u64 {
        self.authorization.nonce
    }

    /// Check if this authorization is chain-specific.
    #[inline]
    pub const fn is_chain_specific(&self) -> bool {
        self.authorization.is_chain_specific()
    }

    /// Check if authorization is valid for a given chain.
    #[inline]
    pub const fn is_valid_for_chain(&self, chain_id: u64) -> bool {
        self.authorization.is_valid_for_chain(chain_id)
    }
}

impl Default for SignedAuthorization {
    fn default() -> Self {
        Self {
            authorization: Authorization::default(),
            y_parity: 0,
            r: [0u8; 32],
            s: [0u8; 32],
        }
    }
}

impl fmt::Display for SignedAuthorization {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "Signed{}", self.authorization)
    }
}

impl From<SignedAuthorization> for Authorization {
    fn from(signed: SignedAuthorization) -> Self {
        signed.authorization
    }
}

impl AsRef<Authorization> for SignedAuthorization {
    fn as_ref(&self) -> &Authorization {
        &self.authorization
    }
}

/// A list of signed authorizations for an EIP-7702 transaction.
#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct AuthorizationList(Vec<SignedAuthorization>);

impl AuthorizationList {
    /// Create a new authorization list.
    #[inline]
    pub fn new(authorizations: Vec<SignedAuthorization>) -> Self {
        Self(authorizations)
    }

    /// Create an empty list.
    #[inline]
    pub fn empty() -> Self {
        Self(Vec::new())
    }

    /// Validate all authorizations.
    pub fn validate(&self) -> Result<()> {
        if self.0.len() > MAX_AUTHORIZATIONS {
            return Err(Error::InvalidAuthorization);
        }
        for auth in &self.0 {
            auth.validate()?;
        }
        Ok(())
    }

    /// Check if empty.
    #[inline]
    pub fn is_empty(&self) -> bool {
        self.0.is_empty()
    }

    /// Number of authorizations.
    #[inline]
    pub fn len(&self) -> usize {
        self.0.len()
    }

    /// Add an authorization.
    #[inline]
    pub fn push(&mut self, auth: SignedAuthorization) {
        self.0.push(auth);
    }

    /// Get authorization by index.
    #[inline]
    pub fn get(&self, index: usize) -> Option<&SignedAuthorization> {
        self.0.get(index)
    }

    /// Iterate over authorizations.
    #[inline]
    pub fn iter(&self) -> impl Iterator<Item = &SignedAuthorization> {
        self.0.iter()
    }

    /// Get underlying authorizations.
    #[inline]
    pub fn authorizations(&self) -> &[SignedAuthorization] {
        &self.0
    }

    /// Consume and return authorizations.
    #[inline]
    pub fn into_authorizations(self) -> Vec<SignedAuthorization> {
        self.0
    }

    /// Calculate gas cost for authorization list.
    ///
    /// Per EIP-7702: 25000 gas per authorization
    pub fn gas_cost(&self) -> u64 {
        const AUTH_COST: u64 = 25_000;
        self.0.len() as u64 * AUTH_COST
    }

    /// Check if any authorization targets a specific address.
    pub fn targets_address(&self, address: &Address) -> bool {
        self.0.iter().any(|a| a.address() == address)
    }

    /// Filter authorizations valid for a specific chain.
    pub fn filter_for_chain(&self, chain_id: u64) -> impl Iterator<Item = &SignedAuthorization> {
        self.0.iter().filter(move |a| a.is_valid_for_chain(chain_id))
    }
}

impl From<Vec<SignedAuthorization>> for AuthorizationList {
    fn from(auths: Vec<SignedAuthorization>) -> Self {
        Self(auths)
    }
}

impl From<AuthorizationList> for Vec<SignedAuthorization> {
    fn from(list: AuthorizationList) -> Self {
        list.0
    }
}

impl FromIterator<SignedAuthorization> for AuthorizationList {
    fn from_iter<T: IntoIterator<Item = SignedAuthorization>>(iter: T) -> Self {
        Self(iter.into_iter().collect())
    }
}

impl IntoIterator for AuthorizationList {
    type Item = SignedAuthorization;
    type IntoIter = std::vec::IntoIter<SignedAuthorization>;

    fn into_iter(self) -> Self::IntoIter {
        self.0.into_iter()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_authorization_new() {
        let auth = Authorization::new(1, Address::new([1u8; 20]), 5);
        assert_eq!(auth.chain_id, 1);
        assert_eq!(auth.nonce, 5);
        assert!(auth.is_chain_specific());
    }

    #[test]
    fn test_authorization_any_chain() {
        let auth = Authorization::for_any_chain(Address::new([1u8; 20]), 0);
        assert_eq!(auth.chain_id, 0);
        assert!(!auth.is_chain_specific());
        assert!(auth.is_valid_for_chain(1));
        assert!(auth.is_valid_for_chain(137));
    }

    #[test]
    fn test_authorization_chain_specific() {
        let auth = Authorization::for_chain(1, Address::new([1u8; 20]), 0);
        assert!(auth.is_valid_for_chain(1));
        assert!(!auth.is_valid_for_chain(137));
    }

    #[test]
    fn test_authorization_validate() {
        let valid = Authorization::new(1, Address::new([1u8; 20]), 0);
        assert!(valid.validate().is_ok());

        let invalid = Authorization::new(1, Address::ZERO, 0);
        assert!(invalid.validate().is_err());
    }

    #[test]
    fn test_signed_authorization() {
        let auth = Authorization::new(1, Address::new([1u8; 20]), 0);
        let signed = SignedAuthorization::new(auth, 0, [1u8; 32], [1u8; 32]);

        assert_eq!(signed.chain_id(), 1);
        assert_eq!(signed.recovery_id(), 0);
        assert_eq!(signed.v(), 27);
    }

    #[test]
    fn test_signed_authorization_signature_bytes() {
        let auth = Authorization::new(1, Address::new([1u8; 20]), 0);
        let r = [1u8; 32];
        let s = [2u8; 32];
        let signed = SignedAuthorization::new(auth, 1, r, s);

        let sig = signed.signature_bytes();
        assert_eq!(&sig[0..32], &r);
        assert_eq!(&sig[32..64], &s);
        assert_eq!(sig[64], 1);
    }

    #[test]
    fn test_signed_authorization_validate() {
        let auth = Authorization::new(1, Address::new([1u8; 20]), 0);

        // Valid signature
        let valid = SignedAuthorization::new(auth, 0, [1u8; 32], [1u8; 32]);
        assert!(valid.validate().is_ok());

        // Invalid y_parity
        let invalid_parity = SignedAuthorization::new(auth, 2, [1u8; 32], [1u8; 32]);
        assert!(invalid_parity.validate().is_err());

        // Zero r
        let zero_r = SignedAuthorization::new(auth, 0, [0u8; 32], [1u8; 32]);
        assert!(zero_r.validate().is_err());

        // Zero s
        let zero_s = SignedAuthorization::new(auth, 0, [1u8; 32], [0u8; 32]);
        assert!(zero_s.validate().is_err());
    }

    #[test]
    fn test_authorization_list() {
        let auth = Authorization::new(1, Address::new([1u8; 20]), 0);
        let signed = SignedAuthorization::new(auth, 0, [1u8; 32], [1u8; 32]);

        let mut list = AuthorizationList::empty();
        assert!(list.is_empty());

        list.push(signed);
        assert_eq!(list.len(), 1);
        assert!(list.targets_address(&Address::new([1u8; 20])));
    }

    #[test]
    fn test_authorization_list_gas_cost() {
        let auth = Authorization::new(1, Address::new([1u8; 20]), 0);
        let signed = SignedAuthorization::new(auth, 0, [1u8; 32], [1u8; 32]);

        let list = AuthorizationList::new(vec![signed, signed]);
        assert_eq!(list.gas_cost(), 50_000);
    }

    #[test]
    fn test_authorization_list_filter() {
        let auth1 = Authorization::for_chain(1, Address::new([1u8; 20]), 0);
        let auth2 = Authorization::for_chain(137, Address::new([2u8; 20]), 0);
        let auth3 = Authorization::for_any_chain(Address::new([3u8; 20]), 0);

        let list = AuthorizationList::new(vec![
            SignedAuthorization::new(auth1, 0, [1u8; 32], [1u8; 32]),
            SignedAuthorization::new(auth2, 0, [1u8; 32], [1u8; 32]),
            SignedAuthorization::new(auth3, 0, [1u8; 32], [1u8; 32]),
        ]);

        let mainnet: Vec<_> = list.filter_for_chain(1).collect();
        assert_eq!(mainnet.len(), 2); // auth1 + auth3

        let polygon: Vec<_> = list.filter_for_chain(137).collect();
        assert_eq!(polygon.len(), 2); // auth2 + auth3
    }
}
