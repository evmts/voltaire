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
    ///
    /// Every tuple is structurally valid per EIP-7702: `chain_id == 0` means
    /// any chain, and the zero delegation address clears an existing
    /// delegation. Signature checks live in [`SignedAuthorization::validate`].
    pub fn validate(&self) -> Result<()> {
        Ok(())
    }

    /// RLP-encode the tuple as `rlp([chain_id, address, nonce])`.
    pub fn rlp_encode(&self) -> Vec<u8> {
        use crate::primitives::rlp::{encode_list, RlpItem};

        fn uint(value: u64) -> RlpItem {
            let bytes = value.to_be_bytes();
            let start = bytes.iter().position(|&b| b != 0).unwrap_or(bytes.len());
            RlpItem::Bytes(bytes[start..].to_vec())
        }

        encode_list(&[
            uint(self.chain_id),
            RlpItem::Bytes(self.address.as_bytes().to_vec()),
            uint(self.nonce),
        ])
    }

    /// Compute the EIP-7702 signing hash for this authorization.
    ///
    /// `keccak256(MAGIC || rlp([chain_id, address, nonce]))` with `MAGIC = 0x05`.
    pub fn signing_hash(&self) -> crate::primitives::Hash {
        use crate::crypto::keccak256;

        let encoded = self.rlp_encode();
        let mut data = Vec::with_capacity(1 + encoded.len());
        data.push(0x05);
        data.extend_from_slice(&encoded);
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

        // 1 <= r < N and 1 <= s <= N / 2 (EIP-2), as full 256-bit integers.
        if !crate::crypto::Secp256k1::validate_signature(&self.r, &self.s) {
            return Err(Error::InvalidAuthorization);
        }

        Ok(())
    }

    /// Recover the signer address from the signature.
    ///
    /// Returns the address of the EOA that signed this authorization.
    #[cfg(feature = "native")]
    pub fn recover_signer(&self) -> Result<Address> {
        use crate::crypto::{RecoveryId, Secp256k1, Signature};

        let hash = self.authorization.signing_hash();
        let signature = Signature::new(self.r, self.s);
        let recovery_id = RecoveryId::new(self.y_parity)?;

        Secp256k1::recover_address(hash.as_bytes(), &signature, recovery_id)
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

        // Zero address clears delegation (EIP-7702) and is valid.
        let clear = Authorization::new(1, Address::ZERO, 0);
        assert!(clear.validate().is_ok());

        // chain_id 0 is a wildcard and is valid.
        let any_chain = Authorization::new(0, Address::new([1u8; 20]), 0);
        assert!(any_chain.validate().is_ok());

        let clear_any_chain = Authorization::new(0, Address::ZERO, 0);
        assert!(clear_any_chain.validate().is_ok());
    }

    // Vectors: private key 0x...01 (signer 0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf),
    // cross-checked with viem `hashAuthorization`/`signAuthorization` and
    // Foundry `cast wallet sign-auth`.
    struct Vector {
        chain_id: u64,
        address: &'static str,
        nonce: u64,
        hash: &'static str,
        r: &'static str,
        s: &'static str,
        y_parity: u8,
    }

    const VECTORS: [Vector; 4] = [
        Vector {
            chain_id: 1,
            address: "0x0000000000000000000000000000000000000000",
            nonce: 0,
            hash: "20aed0d1fcfcae79908c669252609bf10de3cc521c36d631c62eea3e826c79ad",
            r: "f8c5b44f465898f9faa96baf930b85d298d4c12d8c6c5ab4a1222cc0037ab706",
            s: "7fd7b9b96b71f0d9256fc21407cc3040e8db447267f9cdcd632389068c649b5c",
            y_parity: 1,
        },
        Vector {
            chain_id: 1,
            address: "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
            nonce: 5,
            hash: "1b69def58e2b557e4e69e119bc4808484920fdaad3f54dbf57de999198599eaa",
            r: "e36d9b2781965f53a09342f5e094cafb2abfb3885478d288acf18ce4555eee04",
            s: "51f4fbf751b089d752e009ac817cf4ed8d7c5a60e70a6c23c09fac6fa38b205f",
            y_parity: 0,
        },
        Vector {
            chain_id: 0,
            address: "0x1111111111111111111111111111111111111111",
            nonce: 0,
            hash: "bce043d2be6b6a6257ca659ae30d27657722aeedb466b2256c750e0de08654ba",
            r: "5095a0324766b50b31c118372999eff8832e735f07871cb76a76b699900d9a38",
            s: "7f486d50120c05babcfe9988b2c704e3a898960c6b440e0bce26f1d3cb8c4c0c",
            y_parity: 1,
        },
        Vector {
            chain_id: 11155111,
            address: "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
            nonce: 1024,
            hash: "740b3a56fbcb9a2189cc910892f3d5f2ddd32db651d5425149ca0ddb03753f30",
            r: "f4fa0c33f94d52222bad1871eacd5888c4980c150a408de3da91a8da1ce64696",
            s: "652e8f20f092981a28f79f05a26f6587bbdcab4b3dcb9d4e93cd40b8ec5b6872",
            y_parity: 1,
        },
    ];

    fn bytes32(h: &str) -> [u8; 32] {
        let mut out = [0u8; 32];
        out.copy_from_slice(&hex::decode(h).unwrap());
        out
    }

    fn signed(v: &Vector) -> SignedAuthorization {
        let auth = Authorization::new(v.chain_id, v.address.parse().unwrap(), v.nonce);
        SignedAuthorization::new(auth, v.y_parity, bytes32(v.r), bytes32(v.s))
    }

    #[test]
    fn test_rlp_encode_tuple() {
        let auth = Authorization::new(
            1,
            "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef".parse().unwrap(),
            5,
        );
        assert_eq!(
            hex::encode(auth.rlp_encode()),
            "d70194deadbeefdeadbeefdeadbeefdeadbeefdeadbeef05"
        );

        let zero = Authorization::new(0, Address::ZERO, 0);
        assert_eq!(
            hex::encode(zero.rlp_encode()),
            "d78094000000000000000000000000000000000000000080"
        );
    }

    #[test]
    fn test_signing_hash_vectors() {
        for v in &VECTORS {
            let auth = signed(v).authorization;
            assert_eq!(auth.signing_hash().as_bytes(), &bytes32(v.hash), "chain {}", v.chain_id);
        }
    }

    #[test]
    fn test_signed_vectors_validate() {
        for v in &VECTORS {
            assert!(signed(v).validate().is_ok(), "chain {}", v.chain_id);
        }
    }

    #[cfg(feature = "native")]
    #[test]
    fn test_recover_signer_vectors() {
        let expected: Address = "0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf".parse().unwrap();
        for v in &VECTORS {
            assert_eq!(signed(v).recover_signer().unwrap(), expected);
        }
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
    fn test_signed_authorization_validate_full_width_scalars() {
        const N: &str = "fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141";
        const HALF_N: &str = "7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0";
        const HALF_N_PLUS_1: &str =
            "7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a1";
        let auth = Authorization::new(1, Address::new([1u8; 20]), 0);
        let one = [1u8; 32];

        assert!(SignedAuthorization::new(auth, 0, one, bytes32(HALF_N)).validate().is_ok());
        // s = N/2 + 1 has its top bit clear but is high-s.
        assert!(SignedAuthorization::new(auth, 0, one, bytes32(HALF_N_PLUS_1)).validate().is_err());
        assert!(SignedAuthorization::new(auth, 0, one, bytes32(N)).validate().is_err());
        // r = N is out of range.
        assert!(SignedAuthorization::new(auth, 0, bytes32(N), one).validate().is_err());
        assert!(SignedAuthorization::new(auth, 0, [0xff; 32], one).validate().is_err());
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
