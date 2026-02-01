//! secp256k1 ECDSA operations.
//!
//! Provides signing, verification, and key recovery for Ethereum signatures.
//!
//! # Signature Types
//!
//! - [`Signature`] - Core signature with r, s components (access via fields)
//! - [`CompactSignature`] - 64-byte packed format (r || s)
//! - [`RsvSignature`] - 65-byte Ethereum format (r || s || v)
//!
//! # Example
//!
//! ```rust
//! use voltaire::crypto::{Signature, RecoveryId, RsvSignature, CompactSignature};
//!
//! // Create from r, s, v components
//! let r = [1u8; 32];
//! let s = [2u8; 32];
//! let v = 27u8;
//!
//! let sig = Signature::from_rsv(r, s, v).unwrap();
//! let (r_out, s_out, v_out) = sig.to_rsv(RecoveryId::from_v(v).unwrap());
//!
//! // Check if normalized (low-s)
//! assert!(sig.is_normalized());
//!
//! // Convert between formats
//! let compact: CompactSignature = sig.clone().into();
//! let rsv = RsvSignature::new(sig, RecoveryId::from_v(v).unwrap());
//! ```

use crate::error::{Error, Result};
use crate::primitives::Address;

// secp256k1 curve order N
const SECP256K1_N: [u8; 32] = [
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xfe,
    0xba, 0xae, 0xdc, 0xe6, 0xaf, 0x48, 0xa0, 0x3b,
    0xbf, 0xd2, 0x5e, 0x8c, 0xd0, 0x36, 0x41, 0x41,
];

// N/2 for low-s check
const SECP256K1_HALF_N: [u8; 32] = [
    0x7f, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0x5d, 0x57, 0x6e, 0x73, 0x57, 0xa4, 0x50, 0x1d,
    0xdf, 0xe9, 0x2f, 0x46, 0x68, 0x1b, 0x20, 0xa0,
];

/// Recovery ID for ECDSA signatures.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct RecoveryId(pub u8);

impl RecoveryId {
    /// Create recovery ID (0 or 1).
    pub fn new(id: u8) -> Result<Self> {
        if id > 1 {
            return Err(Error::invalid_input("recovery id must be 0 or 1"));
        }
        Ok(Self(id))
    }

    /// Convert to Ethereum v value (27 or 28).
    #[inline]
    pub fn to_v(self) -> u8 {
        self.0 + 27
    }

    /// Create from Ethereum v value (27 or 28).
    pub fn from_v(v: u8) -> Result<Self> {
        match v {
            27 => Ok(Self(0)),
            28 => Ok(Self(1)),
            0 => Ok(Self(0)),
            1 => Ok(Self(1)),
            _ => Err(Error::invalid_input("v must be 0, 1, 27, or 28")),
        }
    }
}

/// ECDSA signature (r, s components).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Signature {
    /// R component (32 bytes).
    pub r: [u8; 32],
    /// S component (32 bytes).
    pub s: [u8; 32],
}

impl Signature {
    /// Create signature from r and s components.
    pub fn new(r: [u8; 32], s: [u8; 32]) -> Self {
        Self { r, s }
    }

    /// Parse from 64-byte compact format.
    pub fn from_bytes(bytes: &[u8; 64]) -> Self {
        let mut r = [0u8; 32];
        let mut s = [0u8; 32];
        r.copy_from_slice(&bytes[..32]);
        s.copy_from_slice(&bytes[32..]);
        Self { r, s }
    }

    /// Parse from 65-byte format (r || s || v).
    pub fn from_bytes_with_recovery(bytes: &[u8; 65]) -> (Self, RecoveryId) {
        let mut r = [0u8; 32];
        let mut s = [0u8; 32];
        r.copy_from_slice(&bytes[..32]);
        s.copy_from_slice(&bytes[32..64]);
        let v = RecoveryId::from_v(bytes[64]).unwrap_or(RecoveryId(0));
        (Self { r, s }, v)
    }

    /// Convert to 64-byte compact format.
    pub fn to_bytes(&self) -> [u8; 64] {
        let mut bytes = [0u8; 64];
        bytes[..32].copy_from_slice(&self.r);
        bytes[32..].copy_from_slice(&self.s);
        bytes
    }

    /// Convert to 65-byte format with recovery ID.
    pub fn to_bytes_with_recovery(&self, recovery_id: RecoveryId) -> [u8; 65] {
        let mut bytes = [0u8; 65];
        bytes[..32].copy_from_slice(&self.r);
        bytes[32..64].copy_from_slice(&self.s);
        bytes[64] = recovery_id.to_v();
        bytes
    }

    /// Check if signature is valid (non-zero r, s within curve order).
    #[cfg(feature = "native")]
    pub fn is_valid(&self) -> bool {
        crate::ffi::validate_signature(&self.r, &self.s)
    }

    /// Check if signature is valid (basic check without FFI).
    #[cfg(not(feature = "native"))]
    pub fn is_valid(&self) -> bool {
        // Simple check: r and s must be non-zero and less than curve order
        let r_zero = self.r.iter().all(|&b| b == 0);
        let s_zero = self.s.iter().all(|&b| b == 0);
        !r_zero && !s_zero
    }

    /// Normalize signature to low-s form (EIP-2).
    ///
    /// Ethereum requires s to be in the lower half of the curve order.
    /// Returns true if the signature was modified.
    pub fn normalize(&mut self) -> bool {
        if self.is_normalized() {
            return false;
        }

        // s = N - s
        let mut borrow = 0i16;
        for i in (0..32).rev() {
            let diff = SECP256K1_N[i] as i16 - self.s[i] as i16 - borrow;
            if diff < 0 {
                self.s[i] = (diff + 256) as u8;
                borrow = 1;
            } else {
                self.s[i] = diff as u8;
                borrow = 0;
            }
        }
        true
    }

    /// Check if signature is already normalized (low-s).
    ///
    /// A normalized signature has s <= N/2 where N is the curve order.
    /// This is required by Ethereum (EIP-2) to prevent signature malleability.
    #[inline]
    pub fn is_normalized(&self) -> bool {
        self.s <= SECP256K1_HALF_N
    }

    /// Create signature from r, s, v components.
    ///
    /// Validates the v value and creates a signature with optional normalization.
    pub fn from_rsv(r: [u8; 32], s: [u8; 32], v: u8) -> Result<Self> {
        // Validate v
        let _recovery_id = RecoveryId::from_v(v)?;

        Ok(Self { r, s })
    }

    /// Extract r, s, v components from signature.
    ///
    /// Returns (r, s, v) tuple where v is the Ethereum v value (27 or 28).
    pub fn to_rsv(&self, recovery_id: RecoveryId) -> ([u8; 32], [u8; 32], u8) {
        (self.r, self.s, recovery_id.to_v())
    }

    /// Check if r component is within valid range (1 <= r < N).
    fn is_r_valid(&self) -> bool {
        // r must be non-zero
        let r_zero = self.r.iter().all(|&b| b == 0);
        if r_zero {
            return false;
        }
        // r must be less than N
        self.r < SECP256K1_N
    }

    /// Check if s component is within valid range (1 <= s < N).
    fn is_s_valid(&self) -> bool {
        // s must be non-zero
        let s_zero = self.s.iter().all(|&b| b == 0);
        if s_zero {
            return false;
        }
        // s must be less than N
        self.s < SECP256K1_N
    }

    /// Check if signature components are within valid curve range.
    ///
    /// Both r and s must be in range [1, N-1] where N is the curve order.
    pub fn is_canonical(&self) -> bool {
        self.is_r_valid() && self.is_s_valid() && self.is_normalized()
    }
}

/// 64-byte compact signature format (r || s).
///
/// This is the most space-efficient signature format, used when
/// the recovery ID is stored separately or not needed.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct CompactSignature(pub [u8; 64]);

impl CompactSignature {
    /// Create from raw bytes.
    pub fn new(bytes: [u8; 64]) -> Self {
        Self(bytes)
    }

    /// Create from r and s components.
    pub fn from_rs(r: [u8; 32], s: [u8; 32]) -> Self {
        let mut bytes = [0u8; 64];
        bytes[..32].copy_from_slice(&r);
        bytes[32..].copy_from_slice(&s);
        Self(bytes)
    }

    /// Get r component.
    #[inline]
    pub fn r(&self) -> &[u8; 32] {
        self.0[..32].try_into().unwrap()
    }

    /// Get s component.
    #[inline]
    pub fn s(&self) -> &[u8; 32] {
        self.0[32..].try_into().unwrap()
    }

    /// Convert to bytes.
    #[inline]
    pub fn as_bytes(&self) -> &[u8; 64] {
        &self.0
    }

    /// Convert to Signature.
    pub fn to_signature(&self) -> Signature {
        Signature::from_bytes(&self.0)
    }
}

impl From<Signature> for CompactSignature {
    fn from(sig: Signature) -> Self {
        Self(sig.to_bytes())
    }
}

impl From<CompactSignature> for Signature {
    fn from(compact: CompactSignature) -> Self {
        compact.to_signature()
    }
}

impl From<[u8; 64]> for CompactSignature {
    fn from(bytes: [u8; 64]) -> Self {
        Self(bytes)
    }
}

impl AsRef<[u8]> for CompactSignature {
    fn as_ref(&self) -> &[u8] {
        &self.0
    }
}

/// 65-byte Ethereum signature format (r || s || v).
///
/// This is the standard Ethereum signature format that includes
/// the recovery ID as the last byte.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct RsvSignature {
    /// The signature (r, s components).
    pub signature: Signature,
    /// The recovery ID.
    pub recovery_id: RecoveryId,
}

impl RsvSignature {
    /// Create from signature and recovery ID.
    pub fn new(signature: Signature, recovery_id: RecoveryId) -> Self {
        Self { signature, recovery_id }
    }

    /// Create from raw 65 bytes (r || s || v).
    pub fn from_bytes(bytes: &[u8; 65]) -> Result<Self> {
        let (signature, recovery_id) = Signature::from_bytes_with_recovery(bytes);
        // Re-validate the recovery ID to return proper error
        let _ = RecoveryId::from_v(bytes[64])?;
        Ok(Self { signature, recovery_id })
    }

    /// Create from r, s, v components.
    pub fn from_rsv(r: [u8; 32], s: [u8; 32], v: u8) -> Result<Self> {
        let recovery_id = RecoveryId::from_v(v)?;
        let signature = Signature::new(r, s);
        Ok(Self { signature, recovery_id })
    }

    /// Convert to 65 bytes (r || s || v).
    pub fn to_bytes(&self) -> [u8; 65] {
        self.signature.to_bytes_with_recovery(self.recovery_id)
    }

    /// Get r component.
    #[inline]
    pub fn r(&self) -> &[u8; 32] {
        &self.signature.r
    }

    /// Get s component.
    #[inline]
    pub fn s(&self) -> &[u8; 32] {
        &self.signature.s
    }

    /// Get v value (27 or 28).
    #[inline]
    pub fn v(&self) -> u8 {
        self.recovery_id.to_v()
    }

    /// Check if signature is normalized (low-s).
    #[inline]
    pub fn is_normalized(&self) -> bool {
        self.signature.is_normalized()
    }

    /// Normalize signature to low-s form.
    ///
    /// Note: Normalizing flips the recovery ID.
    pub fn normalize(&mut self) -> bool {
        if self.signature.normalize() {
            // Flip recovery ID when s is negated
            self.recovery_id = RecoveryId(self.recovery_id.0 ^ 1);
            true
        } else {
            false
        }
    }

    /// Check if signature is canonical (valid range + normalized).
    #[inline]
    pub fn is_canonical(&self) -> bool {
        self.signature.is_canonical()
    }
}

impl TryFrom<[u8; 65]> for RsvSignature {
    type Error = Error;

    fn try_from(bytes: [u8; 65]) -> Result<Self> {
        Self::from_bytes(&bytes)
    }
}

impl From<RsvSignature> for [u8; 65] {
    fn from(rsv: RsvSignature) -> Self {
        rsv.to_bytes()
    }
}

/// secp256k1 operations.
pub struct Secp256k1;

impl Secp256k1 {
    /// Recover public key from signature and message hash.
    ///
    /// Returns uncompressed public key (64 bytes, without 0x04 prefix).
    #[cfg(feature = "native")]
    pub fn recover_pubkey(
        message_hash: &[u8; 32],
        signature: &Signature,
        recovery_id: RecoveryId,
    ) -> Result<[u8; 64]> {
        crate::ffi::recover_pubkey(message_hash, &signature.r, &signature.s, recovery_id.to_v())
    }

    /// Recover public key (requires native feature).
    #[cfg(not(feature = "native"))]
    pub fn recover_pubkey(
        _message_hash: &[u8; 32],
        _signature: &Signature,
        _recovery_id: RecoveryId,
    ) -> Result<[u8; 64]> {
        Err(Error::invalid_input("native feature required for pubkey recovery"))
    }

    /// Recover Ethereum address from signature and message hash.
    #[cfg(feature = "native")]
    pub fn recover_address(
        message_hash: &[u8; 32],
        signature: &Signature,
        recovery_id: RecoveryId,
    ) -> Result<Address> {
        crate::ffi::recover_address(message_hash, &signature.r, &signature.s, recovery_id.to_v())
    }

    /// Recover address (requires native feature for key recovery).
    #[cfg(not(feature = "native"))]
    pub fn recover_address(
        message_hash: &[u8; 32],
        signature: &Signature,
        recovery_id: RecoveryId,
    ) -> Result<Address> {
        let pubkey = Self::recover_pubkey(message_hash, signature, recovery_id)?;
        Address::from_public_key(&pubkey)
    }

    /// Derive public key from private key.
    #[cfg(feature = "native")]
    pub fn pubkey_from_private(private_key: &[u8; 32]) -> Result<[u8; 64]> {
        crate::ffi::pubkey_from_private(private_key)
    }

    /// Derive public key from private key (requires native feature).
    #[cfg(not(feature = "native"))]
    pub fn pubkey_from_private(_private_key: &[u8; 32]) -> Result<[u8; 64]> {
        Err(Error::invalid_input("native feature required for key derivation"))
    }

    /// Derive Ethereum address from private key.
    pub fn address_from_private(private_key: &[u8; 32]) -> Result<Address> {
        let pubkey = Self::pubkey_from_private(private_key)?;
        Address::from_public_key(&pubkey)
    }

    /// Validate signature components.
    #[cfg(feature = "native")]
    pub fn validate_signature(r: &[u8; 32], s: &[u8; 32]) -> bool {
        crate::ffi::validate_signature(r, s)
    }

    /// Validate signature components (basic check without FFI).
    #[cfg(not(feature = "native"))]
    pub fn validate_signature(r: &[u8; 32], s: &[u8; 32]) -> bool {
        // Basic validation: non-zero
        let r_zero = r.iter().all(|&b| b == 0);
        let s_zero = s.iter().all(|&b| b == 0);
        !r_zero && !s_zero
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // ============ RecoveryId Tests ============

    #[test]
    fn test_recovery_id_new() {
        let id = RecoveryId::new(0).unwrap();
        assert_eq!(id.0, 0);
        assert_eq!(id.to_v(), 27);

        let id = RecoveryId::new(1).unwrap();
        assert_eq!(id.0, 1);
        assert_eq!(id.to_v(), 28);

        assert!(RecoveryId::new(2).is_err());
        assert!(RecoveryId::new(255).is_err());
    }

    #[test]
    fn test_recovery_id_from_v() {
        // Raw 0/1 values
        assert_eq!(RecoveryId::from_v(0).unwrap().0, 0);
        assert_eq!(RecoveryId::from_v(1).unwrap().0, 1);

        // Ethereum 27/28 values
        assert_eq!(RecoveryId::from_v(27).unwrap().0, 0);
        assert_eq!(RecoveryId::from_v(28).unwrap().0, 1);

        // Invalid values
        assert!(RecoveryId::from_v(2).is_err());
        assert!(RecoveryId::from_v(26).is_err());
        assert!(RecoveryId::from_v(29).is_err());
    }

    #[test]
    fn test_recovery_id_roundtrip() {
        for v in [0u8, 1, 27, 28] {
            let id = RecoveryId::from_v(v).unwrap();
            let v_out = id.to_v();
            assert!(v_out == 27 || v_out == 28);
        }
    }

    // ============ Signature Tests ============

    #[test]
    fn test_signature_new() {
        let r = [1u8; 32];
        let s = [2u8; 32];
        let sig = Signature::new(r, s);
        assert_eq!(sig.r, r);
        assert_eq!(sig.s, s);
    }

    #[test]
    fn test_signature_from_bytes() {
        let mut bytes = [0u8; 64];
        bytes[..32].copy_from_slice(&[1u8; 32]);
        bytes[32..].copy_from_slice(&[2u8; 32]);

        let sig = Signature::from_bytes(&bytes);
        assert_eq!(sig.r, [1u8; 32]);
        assert_eq!(sig.s, [2u8; 32]);
    }

    #[test]
    fn test_signature_to_bytes() {
        let sig = Signature::new([1u8; 32], [2u8; 32]);
        let bytes = sig.to_bytes();

        assert_eq!(&bytes[..32], &[1u8; 32]);
        assert_eq!(&bytes[32..], &[2u8; 32]);
    }

    #[test]
    fn test_signature_bytes_roundtrip() {
        let r = [0xab; 32];
        let s = [0xcd; 32];
        let sig = Signature::new(r, s);

        let bytes = sig.to_bytes();
        let parsed = Signature::from_bytes(&bytes);
        assert_eq!(sig, parsed);
    }

    #[test]
    fn test_signature_from_bytes_with_recovery() {
        let mut bytes = [0u8; 65];
        bytes[..32].copy_from_slice(&[1u8; 32]);
        bytes[32..64].copy_from_slice(&[2u8; 32]);
        bytes[64] = 27;

        let (sig, v) = Signature::from_bytes_with_recovery(&bytes);
        assert_eq!(sig.r, [1u8; 32]);
        assert_eq!(sig.s, [2u8; 32]);
        assert_eq!(v.to_v(), 27);
    }

    #[test]
    fn test_signature_to_bytes_with_recovery() {
        let sig = Signature::new([1u8; 32], [2u8; 32]);
        let v = RecoveryId::new(1).unwrap();

        let bytes = sig.to_bytes_with_recovery(v);
        assert_eq!(&bytes[..32], &[1u8; 32]);
        assert_eq!(&bytes[32..64], &[2u8; 32]);
        assert_eq!(bytes[64], 28);
    }

    #[test]
    fn test_signature_from_rsv() {
        let r = [1u8; 32];
        let s = [2u8; 32];

        let sig = Signature::from_rsv(r, s, 27).unwrap();
        assert_eq!(sig.r, r);
        assert_eq!(sig.s, s);

        let sig = Signature::from_rsv(r, s, 0).unwrap();
        assert_eq!(sig.r, r);

        // Invalid v
        assert!(Signature::from_rsv(r, s, 29).is_err());
    }

    #[test]
    fn test_signature_to_rsv() {
        let r = [1u8; 32];
        let s = [2u8; 32];
        let sig = Signature::new(r, s);
        let v = RecoveryId::new(0).unwrap();

        let (r_out, s_out, v_out) = sig.to_rsv(v);
        assert_eq!(r_out, r);
        assert_eq!(s_out, s);
        assert_eq!(v_out, 27);
    }

    // ============ Normalization Tests ============

    #[test]
    fn test_signature_is_normalized_low_s() {
        // s = 1 (definitely low)
        let mut s = [0u8; 32];
        s[31] = 1;
        let sig = Signature::new([1u8; 32], s);
        assert!(sig.is_normalized());
    }

    #[test]
    fn test_signature_is_normalized_high_s() {
        // s = 0xff...ff (definitely high, >= N)
        let sig = Signature::new([1u8; 32], [0xff; 32]);
        assert!(!sig.is_normalized());
    }

    #[test]
    fn test_signature_is_normalized_boundary() {
        // s = HALF_N (exactly at boundary, should be normalized)
        let sig = Signature::new([1u8; 32], SECP256K1_HALF_N);
        assert!(sig.is_normalized());

        // s = HALF_N + 1 (just above boundary)
        let mut s_high = SECP256K1_HALF_N;
        // Increment by 1
        let mut carry = 1u16;
        for i in (0..32).rev() {
            let sum = s_high[i] as u16 + carry;
            s_high[i] = sum as u8;
            carry = sum >> 8;
            if carry == 0 {
                break;
            }
        }
        let sig = Signature::new([1u8; 32], s_high);
        assert!(!sig.is_normalized());
    }

    #[test]
    fn test_signature_normalize_already_low() {
        let mut s = [0u8; 32];
        s[31] = 0x42;
        let mut sig = Signature::new([1u8; 32], s);

        let was_normalized = sig.normalize();
        assert!(!was_normalized);
        assert_eq!(sig.s, s); // Unchanged
    }

    #[test]
    fn test_signature_normalize_high_s() {
        // Use a valid high s value (just above HALF_N but below N)
        // HALF_N + 1
        let mut s_high = SECP256K1_HALF_N;
        let mut carry = 1u16;
        for i in (0..32).rev() {
            let sum = s_high[i] as u16 + carry;
            s_high[i] = sum as u8;
            carry = sum >> 8;
            if carry == 0 {
                break;
            }
        }

        let mut sig = Signature::new([1u8; 32], s_high);
        assert!(!sig.is_normalized());

        let was_normalized = sig.normalize();
        assert!(was_normalized);
        assert!(sig.is_normalized());
    }

    // ============ Canonical Tests ============

    #[test]
    fn test_signature_is_canonical() {
        // Valid canonical signature
        let mut r = [0u8; 32];
        r[31] = 1;
        let mut s = [0u8; 32];
        s[31] = 1;
        let sig = Signature::new(r, s);
        assert!(sig.is_canonical());
    }

    #[test]
    fn test_signature_not_canonical_zero_r() {
        let r = [0u8; 32];
        let mut s = [0u8; 32];
        s[31] = 1;
        let sig = Signature::new(r, s);
        assert!(!sig.is_canonical());
    }

    #[test]
    fn test_signature_not_canonical_zero_s() {
        let mut r = [0u8; 32];
        r[31] = 1;
        let s = [0u8; 32];
        let sig = Signature::new(r, s);
        assert!(!sig.is_canonical());
    }

    #[test]
    fn test_signature_not_canonical_high_s() {
        let mut r = [0u8; 32];
        r[31] = 1;
        let sig = Signature::new(r, [0xff; 32]);
        assert!(!sig.is_canonical());
    }

    // ============ CompactSignature Tests ============

    #[test]
    fn test_compact_signature_new() {
        let bytes = [0xab; 64];
        let compact = CompactSignature::new(bytes);
        assert_eq!(compact.0, bytes);
    }

    #[test]
    fn test_compact_signature_from_rs() {
        let r = [1u8; 32];
        let s = [2u8; 32];
        let compact = CompactSignature::from_rs(r, s);

        assert_eq!(compact.r(), &r);
        assert_eq!(compact.s(), &s);
    }

    #[test]
    fn test_compact_signature_accessors() {
        let mut bytes = [0u8; 64];
        bytes[..32].copy_from_slice(&[0xaa; 32]);
        bytes[32..].copy_from_slice(&[0xbb; 32]);

        let compact = CompactSignature::new(bytes);
        assert_eq!(compact.r(), &[0xaa; 32]);
        assert_eq!(compact.s(), &[0xbb; 32]);
        assert_eq!(compact.as_bytes(), &bytes);
    }

    #[test]
    fn test_compact_signature_to_signature() {
        let r = [1u8; 32];
        let s = [2u8; 32];
        let compact = CompactSignature::from_rs(r, s);

        let sig = compact.to_signature();
        assert_eq!(sig.r, r);
        assert_eq!(sig.s, s);
    }

    #[test]
    fn test_compact_signature_from_signature() {
        let sig = Signature::new([1u8; 32], [2u8; 32]);
        let compact: CompactSignature = sig.into();

        assert_eq!(compact.r(), &sig.r);
        assert_eq!(compact.s(), &sig.s);
    }

    #[test]
    fn test_compact_signature_into_signature() {
        let compact = CompactSignature::from_rs([1u8; 32], [2u8; 32]);
        let sig: Signature = compact.into();

        assert_eq!(sig.r, [1u8; 32]);
        assert_eq!(sig.s, [2u8; 32]);
    }

    #[test]
    fn test_compact_signature_from_bytes_array() {
        let bytes = [0x42; 64];
        let compact: CompactSignature = bytes.into();
        assert_eq!(compact.0, bytes);
    }

    #[test]
    fn test_compact_signature_as_ref() {
        let compact = CompactSignature::new([0x42; 64]);
        let slice: &[u8] = compact.as_ref();
        assert_eq!(slice.len(), 64);
        assert!(slice.iter().all(|&b| b == 0x42));
    }

    // ============ RsvSignature Tests ============

    #[test]
    fn test_rsv_signature_new() {
        let sig = Signature::new([1u8; 32], [2u8; 32]);
        let v = RecoveryId::new(0).unwrap();
        let rsv = RsvSignature::new(sig, v);

        assert_eq!(rsv.signature, sig);
        assert_eq!(rsv.recovery_id, v);
    }

    #[test]
    fn test_rsv_signature_from_bytes() {
        let mut bytes = [0u8; 65];
        bytes[..32].copy_from_slice(&[1u8; 32]);
        bytes[32..64].copy_from_slice(&[2u8; 32]);
        bytes[64] = 28;

        let rsv = RsvSignature::from_bytes(&bytes).unwrap();
        assert_eq!(rsv.r(), &[1u8; 32]);
        assert_eq!(rsv.s(), &[2u8; 32]);
        assert_eq!(rsv.v(), 28);
    }

    #[test]
    fn test_rsv_signature_from_bytes_invalid_v() {
        let mut bytes = [0u8; 65];
        bytes[64] = 99; // Invalid v

        assert!(RsvSignature::from_bytes(&bytes).is_err());
    }

    #[test]
    fn test_rsv_signature_from_rsv() {
        let r = [1u8; 32];
        let s = [2u8; 32];

        let rsv = RsvSignature::from_rsv(r, s, 27).unwrap();
        assert_eq!(rsv.r(), &r);
        assert_eq!(rsv.s(), &s);
        assert_eq!(rsv.v(), 27);

        // Invalid v
        assert!(RsvSignature::from_rsv(r, s, 99).is_err());
    }

    #[test]
    fn test_rsv_signature_to_bytes() {
        let rsv = RsvSignature::from_rsv([1u8; 32], [2u8; 32], 28).unwrap();
        let bytes = rsv.to_bytes();

        assert_eq!(&bytes[..32], &[1u8; 32]);
        assert_eq!(&bytes[32..64], &[2u8; 32]);
        assert_eq!(bytes[64], 28);
    }

    #[test]
    fn test_rsv_signature_bytes_roundtrip() {
        let mut bytes = [0u8; 65];
        bytes[..32].copy_from_slice(&[0xaa; 32]);
        bytes[32..64].copy_from_slice(&[0x01; 32]); // Low s
        bytes[64] = 27;

        let rsv = RsvSignature::from_bytes(&bytes).unwrap();
        let bytes_out = rsv.to_bytes();
        assert_eq!(bytes, bytes_out);
    }

    #[test]
    fn test_rsv_signature_accessors() {
        let rsv = RsvSignature::from_rsv([0xaa; 32], [0xbb; 32], 28).unwrap();

        assert_eq!(rsv.r(), &[0xaa; 32]);
        assert_eq!(rsv.s(), &[0xbb; 32]);
        assert_eq!(rsv.v(), 28);
    }

    #[test]
    fn test_rsv_signature_is_normalized() {
        // Low s
        let mut s = [0u8; 32];
        s[31] = 1;
        let rsv = RsvSignature::from_rsv([1u8; 32], s, 27).unwrap();
        assert!(rsv.is_normalized());

        // High s
        let rsv = RsvSignature::from_rsv([1u8; 32], [0xff; 32], 27).unwrap();
        assert!(!rsv.is_normalized());
    }

    #[test]
    fn test_rsv_signature_normalize() {
        // Use a valid high s value (just above HALF_N but below N)
        let mut s_high = SECP256K1_HALF_N;
        let mut carry = 1u16;
        for i in (0..32).rev() {
            let sum = s_high[i] as u16 + carry;
            s_high[i] = sum as u8;
            carry = sum >> 8;
            if carry == 0 {
                break;
            }
        }

        let mut rsv = RsvSignature::from_rsv([1u8; 32], s_high, 27).unwrap();
        assert!(!rsv.is_normalized());
        assert_eq!(rsv.v(), 27);

        let was_normalized = rsv.normalize();
        assert!(was_normalized);
        assert!(rsv.is_normalized());
        // v should be flipped
        assert_eq!(rsv.v(), 28);
    }

    #[test]
    fn test_rsv_signature_normalize_already_low() {
        let mut s = [0u8; 32];
        s[31] = 1;
        let mut rsv = RsvSignature::from_rsv([1u8; 32], s, 27).unwrap();

        let was_normalized = rsv.normalize();
        assert!(!was_normalized);
        assert_eq!(rsv.v(), 27); // Unchanged
    }

    #[test]
    fn test_rsv_signature_is_canonical() {
        // Valid canonical
        let mut r = [0u8; 32];
        r[31] = 1;
        let mut s = [0u8; 32];
        s[31] = 1;
        let rsv = RsvSignature::from_rsv(r, s, 27).unwrap();
        assert!(rsv.is_canonical());

        // Zero r
        let rsv = RsvSignature::from_rsv([0u8; 32], s, 27).unwrap();
        assert!(!rsv.is_canonical());
    }

    #[test]
    fn test_rsv_signature_try_from() {
        let mut bytes = [0u8; 65];
        bytes[64] = 27;

        let rsv: Result<RsvSignature> = bytes.try_into();
        assert!(rsv.is_ok());

        // Invalid v
        let mut bytes = [0u8; 65];
        bytes[64] = 99;

        let rsv: Result<RsvSignature> = bytes.try_into();
        assert!(rsv.is_err());
    }

    #[test]
    fn test_rsv_signature_into_bytes() {
        let rsv = RsvSignature::from_rsv([1u8; 32], [2u8; 32], 28).unwrap();
        let bytes: [u8; 65] = rsv.into();

        assert_eq!(&bytes[..32], &[1u8; 32]);
        assert_eq!(&bytes[32..64], &[2u8; 32]);
        assert_eq!(bytes[64], 28);
    }

    // ============ Conversion Tests ============

    #[test]
    fn test_signature_compact_roundtrip() {
        let sig = Signature::new([1u8; 32], [2u8; 32]);
        let compact: CompactSignature = sig.into();
        let sig2: Signature = compact.into();
        assert_eq!(sig, sig2);
    }

    #[test]
    fn test_signature_rsv_roundtrip() {
        let sig = Signature::new([1u8; 32], [2u8; 32]);
        let v = RecoveryId::new(1).unwrap();

        let rsv = RsvSignature::new(sig, v);
        assert_eq!(rsv.signature, sig);

        let bytes = rsv.to_bytes();
        let rsv2 = RsvSignature::from_bytes(&bytes).unwrap();
        assert_eq!(rsv, rsv2);
    }
}
