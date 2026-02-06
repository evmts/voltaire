//! NIST P-256 (secp256r1) elliptic curve operations.
//!
//! Provides signing, verification, key generation, and ECDH for P-256.
//!
//! # Security
//!
//! P-256 is widely used for:
//! - WebAuthn/FIDO2 passkeys
//! - TLS certificates
//! - Apple Secure Enclave
//! - AWS KMS, Google Cloud HSM
//!
//! # Example
//!
//! ```rust
//! use voltaire::crypto::P256;
//!
//! // Generate keypair
//! let (secret, public) = P256::generate_keypair();
//!
//! // Sign a message hash
//! let message_hash = [0u8; 32];
//! let signature = P256::sign(&message_hash, &secret).unwrap();
//!
//! // Verify signature
//! let valid = P256::verify(&message_hash, &signature, &public).unwrap();
//! assert!(valid);
//! ```

use crate::error::{Error, Result};

/// P-256 secret key (32 bytes).
pub type SecretKey = [u8; 32];

/// P-256 uncompressed public key (64 bytes: x || y coordinates).
pub type PublicKey = [u8; 64];

/// P-256 compressed public key (33 bytes: 02/03 prefix + x coordinate).
pub type CompressedPublicKey = [u8; 33];

/// P-256 signature (64 bytes: r || s).
pub type Signature = [u8; 64];

// P-256 curve parameters
// p = 2^256 - 2^224 + 2^192 + 2^96 - 1
const P256_P: [u8; 32] = [
    0xff, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x01,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
];

// n (curve order)
const P256_N: [u8; 32] = [
    0xff, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x00,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xbc, 0xe6, 0xfa, 0xad, 0xa7, 0x17, 0x9e, 0x84,
    0xf3, 0xb9, 0xca, 0xc2, 0xfc, 0x63, 0x25, 0x51,
];

// n/2 for low-s normalization
const P256_HALF_N: [u8; 32] = [
    0x7f, 0xff, 0xff, 0xff, 0x80, 0x00, 0x00, 0x00,
    0x7f, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xde, 0x73, 0x7d, 0x56, 0xd3, 0x8b, 0xcf, 0x42,
    0x79, 0xdc, 0xe5, 0x61, 0x7e, 0x31, 0x92, 0xa8,
];

// b coefficient
#[allow(dead_code)]
const P256_B: [u8; 32] = [
    0x5a, 0xc6, 0x35, 0xd8, 0xaa, 0x3a, 0x93, 0xe7,
    0xb3, 0xeb, 0xbd, 0x55, 0x76, 0x98, 0x86, 0xbc,
    0x65, 0x1d, 0x06, 0xb0, 0xcc, 0x53, 0xb0, 0xf6,
    0x3b, 0xce, 0x3c, 0x3e, 0x27, 0xd2, 0x60, 0x4b,
];

// Generator point G (uncompressed, x || y)
#[allow(dead_code)]
const P256_G: [u8; 64] = [
    // x
    0x6b, 0x17, 0xd1, 0xf2, 0xe1, 0x2c, 0x42, 0x47,
    0xf8, 0xbc, 0xe6, 0xe5, 0x63, 0xa4, 0x40, 0xf2,
    0x77, 0x03, 0x7d, 0x81, 0x2d, 0xeb, 0x33, 0xa0,
    0xf4, 0xa1, 0x39, 0x45, 0xd8, 0x98, 0xc2, 0x96,
    // y
    0x4f, 0xe3, 0x42, 0xe2, 0xfe, 0x1a, 0x7f, 0x9b,
    0x8e, 0xe7, 0xeb, 0x4a, 0x7c, 0x0f, 0x9e, 0x16,
    0x2b, 0xce, 0x33, 0x57, 0x6b, 0x31, 0x5e, 0xce,
    0xcb, 0xb6, 0x40, 0x68, 0x37, 0xbf, 0x51, 0xf5,
];

/// P-256 elliptic curve operations.
pub struct P256;

impl P256 {
    /// Generate a new random keypair.
    ///
    /// Returns (secret_key, public_key) where public_key is uncompressed (64 bytes).
    #[cfg(feature = "std")]
    pub fn generate_keypair() -> (SecretKey, PublicKey) {
        use p256::elliptic_curve::rand_core::OsRng;
        use p256::ecdsa::SigningKey;

        let signing_key = SigningKey::random(&mut OsRng);
        let verifying_key = signing_key.verifying_key();

        let mut secret = [0u8; 32];
        secret.copy_from_slice(signing_key.to_bytes().as_slice());

        let pubkey_point = verifying_key.to_encoded_point(false);
        let mut public = [0u8; 64];
        // Skip the 0x04 prefix byte
        public.copy_from_slice(&pubkey_point.as_bytes()[1..65]);

        (secret, public)
    }

    /// Derive public key from secret key.
    ///
    /// Returns uncompressed public key (64 bytes: x || y).
    pub fn derive_public_key(secret_key: &SecretKey) -> Result<PublicKey> {
        use p256::ecdsa::SigningKey;

        let signing_key = SigningKey::from_bytes(secret_key.into())
            .map_err(|_| Error::invalid_input("invalid P-256 secret key"))?;

        let verifying_key = signing_key.verifying_key();
        let pubkey_point = verifying_key.to_encoded_point(false);

        let mut public = [0u8; 64];
        public.copy_from_slice(&pubkey_point.as_bytes()[1..65]);

        Ok(public)
    }

    /// Sign a 32-byte message hash.
    ///
    /// Returns 64-byte signature (r || s) in low-s normalized form.
    pub fn sign(message_hash: &[u8; 32], secret_key: &SecretKey) -> Result<Signature> {
        use p256::ecdsa::{SigningKey, signature::Signer};

        let signing_key = SigningKey::from_bytes(secret_key.into())
            .map_err(|_| Error::invalid_input("invalid P-256 secret key"))?;

        let sig: p256::ecdsa::Signature = signing_key.sign(message_hash);

        // Normalize to low-s
        let normalized = sig.normalize_s().unwrap_or(sig);

        let mut signature = [0u8; 64];
        signature.copy_from_slice(normalized.to_bytes().as_slice());

        Ok(signature)
    }

    /// Verify a signature against a message hash and public key.
    ///
    /// Returns `true` if signature is valid, `false` otherwise.
    pub fn verify(
        message_hash: &[u8; 32],
        signature: &Signature,
        public_key: &PublicKey,
    ) -> Result<bool> {
        use p256::ecdsa::{VerifyingKey, Signature as P256Sig, signature::Verifier};
        use p256::EncodedPoint;

        // Construct uncompressed point with 0x04 prefix
        let mut encoded = [0u8; 65];
        encoded[0] = 0x04;
        encoded[1..65].copy_from_slice(public_key);

        let point = EncodedPoint::from_bytes(&encoded)
            .map_err(|_| Error::invalid_input("invalid P-256 public key encoding"))?;

        let verifying_key = VerifyingKey::from_encoded_point(&point)
            .map_err(|_| Error::invalid_input("invalid P-256 public key"))?;

        let sig = P256Sig::from_bytes(signature.into())
            .map_err(|_| Error::invalid_signature("invalid P-256 signature format"))?;

        Ok(verifying_key.verify(message_hash, &sig).is_ok())
    }

    /// Perform ECDH key exchange.
    ///
    /// Computes shared secret from our secret key and their public key.
    /// Returns 32-byte shared secret (x-coordinate of shared point).
    pub fn ecdh(secret_key: &SecretKey, their_public: &PublicKey) -> Result<[u8; 32]> {
        use p256::ecdh::EphemeralSecret;
        use p256::{PublicKey as P256PublicKey, EncodedPoint};
        use p256::elliptic_curve::sec1::FromEncodedPoint;

        // Parse their public key
        let mut encoded = [0u8; 65];
        encoded[0] = 0x04;
        encoded[1..65].copy_from_slice(their_public);

        let point = EncodedPoint::from_bytes(&encoded)
            .map_err(|_| Error::invalid_input("invalid P-256 public key encoding"))?;

        let their_pk = P256PublicKey::from_encoded_point(&point)
            .into_option()
            .ok_or_else(|| Error::invalid_input("invalid P-256 public key"))?;

        // Parse our secret key and compute shared secret
        let scalar = p256::NonZeroScalar::try_from(secret_key.as_slice())
            .map_err(|_| Error::invalid_input("invalid P-256 secret key"))?;

        // Compute shared point: their_public * our_secret
        use p256::elliptic_curve::ops::MulByGenerator;
        let _ = p256::ProjectivePoint::mul_by_generator(&scalar); // Verify scalar is valid

        // Use diffie_hellman directly
        let shared = p256::ecdh::diffie_hellman(scalar, their_pk.as_affine());

        let mut result = [0u8; 32];
        result.copy_from_slice(shared.raw_secret_bytes().as_slice());

        Ok(result)
    }

    /// Compress a public key.
    ///
    /// Converts 64-byte uncompressed key to 33-byte compressed format.
    pub fn compress_public_key(public_key: &PublicKey) -> CompressedPublicKey {
        use p256::EncodedPoint;

        // Construct uncompressed point with 0x04 prefix
        let mut encoded = [0u8; 65];
        encoded[0] = 0x04;
        encoded[1..65].copy_from_slice(public_key);

        let point = EncodedPoint::from_bytes(&encoded).expect("valid point");
        let compressed = point.compress();

        let mut result = [0u8; 33];
        result.copy_from_slice(compressed.as_bytes());

        result
    }

    /// Decompress a public key.
    ///
    /// Converts 33-byte compressed key to 64-byte uncompressed format.
    pub fn decompress_public_key(compressed: &CompressedPublicKey) -> Result<PublicKey> {
        use p256::{AffinePoint, EncodedPoint};
        use p256::elliptic_curve::sec1::FromEncodedPoint;

        let point = EncodedPoint::from_bytes(compressed)
            .map_err(|_| Error::invalid_input("invalid compressed P-256 public key"))?;

        let affine = AffinePoint::from_encoded_point(&point)
            .into_option()
            .ok_or_else(|| Error::invalid_input("point not on P-256 curve"))?;

        let uncompressed = EncodedPoint::from(affine);

        let mut result = [0u8; 64];
        result.copy_from_slice(&uncompressed.as_bytes()[1..65]);

        Ok(result)
    }

    /// Validate that a public key is a valid point on the P-256 curve.
    pub fn validate_public_key(public_key: &PublicKey) -> bool {
        use p256::{AffinePoint, EncodedPoint};
        use p256::elliptic_curve::sec1::FromEncodedPoint;

        // Construct uncompressed point with 0x04 prefix
        let mut encoded = [0u8; 65];
        encoded[0] = 0x04;
        encoded[1..65].copy_from_slice(public_key);

        let Ok(point) = EncodedPoint::from_bytes(&encoded) else {
            return false;
        };

        AffinePoint::from_encoded_point(&point).into_option().is_some()
    }

    /// Validate that a secret key is a valid scalar for P-256.
    ///
    /// Secret key must be non-zero and less than the curve order n.
    pub fn validate_secret_key(secret_key: &SecretKey) -> bool {
        // Check non-zero
        if secret_key.iter().all(|&b| b == 0) {
            return false;
        }

        // Check less than n
        if secret_key >= &P256_N {
            return false;
        }

        true
    }

    /// Check if signature s-value is in the lower half of the curve order.
    pub fn is_signature_normalized(signature: &Signature) -> bool {
        let s = &signature[32..64];
        s <= &P256_HALF_N
    }

    /// Normalize signature to low-s form if needed.
    ///
    /// Returns normalized signature. This is important for signature malleability.
    pub fn normalize_signature(signature: &Signature) -> Result<Signature> {
        use p256::ecdsa::Signature as P256Sig;

        let sig = P256Sig::from_bytes(signature.into())
            .map_err(|_| Error::invalid_signature("invalid P-256 signature format"))?;

        let normalized = sig.normalize_s().unwrap_or(sig);

        let mut result = [0u8; 64];
        result.copy_from_slice(normalized.to_bytes().as_slice());

        Ok(result)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // ============ Key Generation Tests ============

    #[test]
    fn test_generate_keypair() {
        let (secret, public) = P256::generate_keypair();

        // Secret key should be valid
        assert!(P256::validate_secret_key(&secret));

        // Public key should be valid
        assert!(P256::validate_public_key(&public));

        // Derive should match
        let derived = P256::derive_public_key(&secret).unwrap();
        assert_eq!(public, derived);
    }

    #[test]
    fn test_derive_public_key() {
        // NIST test vector (P-256)
        // From NIST CAVP ECDSA test vectors
        let secret: SecretKey = [
            0xc9, 0xaf, 0xa9, 0xd8, 0x45, 0xba, 0x75, 0x16,
            0x6b, 0x5c, 0x21, 0x57, 0x67, 0xb1, 0xd6, 0x93,
            0x4e, 0x50, 0xc3, 0xdb, 0x36, 0xe8, 0x9b, 0x12,
            0x7b, 0x8a, 0x62, 0x2b, 0x12, 0x0f, 0x67, 0x21,
        ];

        let expected_x: [u8; 32] = [
            0x60, 0xfe, 0xd4, 0xba, 0x25, 0x5a, 0x9d, 0x31,
            0xc9, 0x61, 0xeb, 0x74, 0xc6, 0x35, 0x6d, 0x68,
            0xc0, 0x49, 0xb8, 0x92, 0x3b, 0x61, 0xfa, 0x6c,
            0xe6, 0x69, 0x62, 0x2e, 0x60, 0xf2, 0x9f, 0xb6,
        ];

        let expected_y: [u8; 32] = [
            0x79, 0x03, 0xfe, 0x10, 0x08, 0xb8, 0xbc, 0x99,
            0xa4, 0x1a, 0xe9, 0xe9, 0x56, 0x28, 0xbc, 0x64,
            0xf2, 0xf1, 0xb2, 0x0c, 0x2d, 0x7e, 0x9f, 0x51,
            0x77, 0xa3, 0xc2, 0x94, 0xd4, 0x46, 0x22, 0x99,
        ];

        let public = P256::derive_public_key(&secret).unwrap();
        assert_eq!(&public[0..32], &expected_x);
        assert_eq!(&public[32..64], &expected_y);
    }

    #[test]
    fn test_derive_invalid_secret() {
        // Zero key
        let zero = [0u8; 32];
        assert!(P256::derive_public_key(&zero).is_err());

        // Key >= n
        let mut too_large = P256_N;
        too_large[31] = 0xff; // Make it larger
        assert!(P256::derive_public_key(&too_large).is_err());
    }

    // ============ Signing Tests ============

    #[test]
    fn test_sign_verify() {
        let (secret, public) = P256::generate_keypair();
        let message_hash = [0x42u8; 32];

        let signature = P256::sign(&message_hash, &secret).unwrap();

        // Signature should be normalized
        assert!(P256::is_signature_normalized(&signature));

        // Verify should succeed
        let valid = P256::verify(&message_hash, &signature, &public).unwrap();
        assert!(valid);
    }

    #[test]
    fn test_verify_wrong_message() {
        let (secret, public) = P256::generate_keypair();
        let message_hash = [0x42u8; 32];
        let wrong_hash = [0x43u8; 32];

        let signature = P256::sign(&message_hash, &secret).unwrap();

        let valid = P256::verify(&wrong_hash, &signature, &public).unwrap();
        assert!(!valid);
    }

    #[test]
    fn test_verify_wrong_key() {
        let (secret1, _public1) = P256::generate_keypair();
        let (_secret2, public2) = P256::generate_keypair();
        let message_hash = [0x42u8; 32];

        let signature = P256::sign(&message_hash, &secret1).unwrap();

        let valid = P256::verify(&message_hash, &signature, &public2).unwrap();
        assert!(!valid);
    }

    #[test]
    fn test_sign_nist_vector() {
        // RFC 6979 test vector for P-256 with SHA-256
        // Message: "sample"
        // SHA-256("sample") = af2bdbe1aa9b6ec1e2ade1d694f41fc71a831d0268e9891562113d8a62add1bf
        let secret: SecretKey = [
            0xc9, 0xaf, 0xa9, 0xd8, 0x45, 0xba, 0x75, 0x16,
            0x6b, 0x5c, 0x21, 0x57, 0x67, 0xb1, 0xd6, 0x93,
            0x4e, 0x50, 0xc3, 0xdb, 0x36, 0xe8, 0x9b, 0x12,
            0x7b, 0x8a, 0x62, 0x2b, 0x12, 0x0f, 0x67, 0x21,
        ];

        let message_hash: [u8; 32] = [
            0xaf, 0x2b, 0xdb, 0xe1, 0xaa, 0x9b, 0x6e, 0xc1,
            0xe2, 0xad, 0xe1, 0xd6, 0x94, 0xf4, 0x1f, 0xc7,
            0x1a, 0x83, 0x1d, 0x02, 0x68, 0xe9, 0x89, 0x15,
            0x62, 0x11, 0x3d, 0x8a, 0x62, 0xad, 0xd1, 0xbf,
        ];

        let public = P256::derive_public_key(&secret).unwrap();
        let signature = P256::sign(&message_hash, &secret).unwrap();

        // Verify the signature
        let valid = P256::verify(&message_hash, &signature, &public).unwrap();
        assert!(valid);
    }

    // ============ ECDH Tests ============

    #[test]
    fn test_ecdh_shared_secret() {
        let (secret_a, public_a) = P256::generate_keypair();
        let (secret_b, public_b) = P256::generate_keypair();

        // Both parties compute same shared secret
        let shared_ab = P256::ecdh(&secret_a, &public_b).unwrap();
        let shared_ba = P256::ecdh(&secret_b, &public_a).unwrap();

        assert_eq!(shared_ab, shared_ba);
    }

    #[test]
    fn test_ecdh_deterministic() {
        let (secret_a, _) = P256::generate_keypair();
        let (_, public_b) = P256::generate_keypair();

        let shared1 = P256::ecdh(&secret_a, &public_b).unwrap();
        let shared2 = P256::ecdh(&secret_a, &public_b).unwrap();

        assert_eq!(shared1, shared2);
    }

    #[test]
    fn test_ecdh_invalid_public_key() {
        let (secret, _) = P256::generate_keypair();
        let invalid_public = [0xffu8; 64]; // Not a valid point

        assert!(P256::ecdh(&secret, &invalid_public).is_err());
    }

    // ============ Compression Tests ============

    #[test]
    fn test_compress_decompress() {
        let (_, public) = P256::generate_keypair();

        let compressed = P256::compress_public_key(&public);
        assert_eq!(compressed.len(), 33);
        assert!(compressed[0] == 0x02 || compressed[0] == 0x03);

        let decompressed = P256::decompress_public_key(&compressed).unwrap();
        assert_eq!(public, decompressed);
    }

    #[test]
    fn test_compress_nist_vector() {
        // Known test vector
        let public: PublicKey = [
            // x
            0x60, 0xfe, 0xd4, 0xba, 0x25, 0x5a, 0x9d, 0x31,
            0xc9, 0x61, 0xeb, 0x74, 0xc6, 0x35, 0x6d, 0x68,
            0xc0, 0x49, 0xb8, 0x92, 0x3b, 0x61, 0xfa, 0x6c,
            0xe6, 0x69, 0x62, 0x2e, 0x60, 0xf2, 0x9f, 0xb6,
            // y
            0x79, 0x03, 0xfe, 0x10, 0x08, 0xb8, 0xbc, 0x99,
            0xa4, 0x1a, 0xe9, 0xe9, 0x56, 0x28, 0xbc, 0x64,
            0xf2, 0xf1, 0xb2, 0x0c, 0x2d, 0x7e, 0x9f, 0x51,
            0x77, 0xa3, 0xc2, 0x94, 0xd4, 0x46, 0x22, 0x99,
        ];

        let compressed = P256::compress_public_key(&public);

        // y is odd (0x79... ends in 0x99 which is odd), so prefix should be 0x03
        assert_eq!(compressed[0], 0x03);

        // x coordinate should match
        assert_eq!(&compressed[1..33], &public[0..32]);

        // Roundtrip
        let decompressed = P256::decompress_public_key(&compressed).unwrap();
        assert_eq!(public, decompressed);
    }

    #[test]
    fn test_decompress_invalid() {
        // Invalid prefix
        let mut invalid = [0u8; 33];
        invalid[0] = 0x05; // Should be 0x02 or 0x03
        assert!(P256::decompress_public_key(&invalid).is_err());

        // Point not on curve
        let mut invalid = [0u8; 33];
        invalid[0] = 0x02;
        invalid[1..].copy_from_slice(&[0xffu8; 32]);
        assert!(P256::decompress_public_key(&invalid).is_err());
    }

    // ============ Validation Tests ============

    #[test]
    fn test_validate_public_key() {
        let (_, public) = P256::generate_keypair();
        assert!(P256::validate_public_key(&public));

        // Zero point is invalid
        let zero = [0u8; 64];
        assert!(!P256::validate_public_key(&zero));

        // Random bytes unlikely to be on curve
        let random = [0xffu8; 64];
        assert!(!P256::validate_public_key(&random));
    }

    #[test]
    fn test_validate_secret_key() {
        // Valid key
        let (secret, _) = P256::generate_keypair();
        assert!(P256::validate_secret_key(&secret));

        // Zero is invalid
        let zero = [0u8; 32];
        assert!(!P256::validate_secret_key(&zero));

        // n is invalid (must be < n)
        assert!(!P256::validate_secret_key(&P256_N));

        // n-1 is valid
        let mut n_minus_1 = P256_N;
        let mut borrow = 1u16;
        for i in (0..32).rev() {
            let diff = n_minus_1[i] as i16 - borrow as i16;
            if diff < 0 {
                n_minus_1[i] = (diff + 256) as u8;
                borrow = 1;
            } else {
                n_minus_1[i] = diff as u8;
                borrow = 0;
            }
        }
        assert!(P256::validate_secret_key(&n_minus_1));
    }

    // ============ Signature Normalization Tests ============

    #[test]
    fn test_signature_normalization() {
        let (secret, public) = P256::generate_keypair();
        let message_hash = [0x42u8; 32];

        let signature = P256::sign(&message_hash, &secret).unwrap();

        // sign() should always return normalized signatures
        assert!(P256::is_signature_normalized(&signature));

        // Normalizing again should be a no-op
        let normalized = P256::normalize_signature(&signature).unwrap();
        assert_eq!(signature, normalized);

        // Should still verify
        let valid = P256::verify(&message_hash, &normalized, &public).unwrap();
        assert!(valid);
    }

    // ============ Edge Cases ============

    #[test]
    fn test_zero_message_hash() {
        let (secret, public) = P256::generate_keypair();
        let zero_hash = [0u8; 32];

        let signature = P256::sign(&zero_hash, &secret).unwrap();
        let valid = P256::verify(&zero_hash, &signature, &public).unwrap();
        assert!(valid);
    }

    #[test]
    fn test_max_message_hash() {
        let (secret, public) = P256::generate_keypair();
        let max_hash = [0xffu8; 32];

        let signature = P256::sign(&max_hash, &secret).unwrap();
        let valid = P256::verify(&max_hash, &signature, &public).unwrap();
        assert!(valid);
    }

    #[test]
    fn test_multiple_signatures_same_message() {
        // Due to RFC 6979, signatures should be deterministic
        let (secret, public) = P256::generate_keypair();
        let message_hash = [0x42u8; 32];

        let sig1 = P256::sign(&message_hash, &secret).unwrap();
        let sig2 = P256::sign(&message_hash, &secret).unwrap();

        // RFC 6979 makes this deterministic
        assert_eq!(sig1, sig2);

        // Both should verify
        assert!(P256::verify(&message_hash, &sig1, &public).unwrap());
        assert!(P256::verify(&message_hash, &sig2, &public).unwrap());
    }

    // ============ Cross-validation with known vectors ============

    #[test]
    fn test_wycheproof_vector() {
        // Wycheproof test vector
        // https://github.com/google/wycheproof
        // tcId: 1 from ecdsa_secp256r1_sha256_test.json

        let public: PublicKey = [
            // x
            0x29, 0x27, 0xb1, 0x05, 0x12, 0xba, 0xe3, 0xed,
            0xdc, 0xfe, 0x46, 0x78, 0x28, 0x12, 0x8b, 0xad,
            0x29, 0x03, 0x26, 0x99, 0x19, 0xf7, 0x08, 0x60,
            0x69, 0xc8, 0xc4, 0xdf, 0x6c, 0x73, 0x28, 0x38,
            // y
            0xc7, 0x78, 0x79, 0x64, 0xea, 0xac, 0x00, 0xe5,
            0x92, 0x1f, 0xb1, 0x49, 0x8a, 0x60, 0xf4, 0x60,
            0x67, 0x66, 0xb3, 0xd9, 0x68, 0x50, 0x01, 0x55,
            0x8d, 0x1a, 0x97, 0x4e, 0x73, 0x41, 0x51, 0x3e,
        ];

        let message_hash: [u8; 32] = [
            0xbb, 0x5a, 0x52, 0xf4, 0x2f, 0x9c, 0x92, 0x61,
            0xed, 0x43, 0x61, 0xf5, 0x94, 0x22, 0xa1, 0xe3,
            0x00, 0x36, 0xe7, 0xc3, 0x2b, 0x27, 0x0c, 0x88,
            0x07, 0xa4, 0x19, 0xfe, 0xca, 0x60, 0x50, 0x23,
        ];

        let signature: Signature = [
            // r
            0x2b, 0xa3, 0xa8, 0xbe, 0x6b, 0x94, 0xd5, 0xec,
            0x80, 0xa6, 0xd9, 0xd1, 0x19, 0x0a, 0x43, 0x6e,
            0xff, 0xe5, 0x0d, 0x85, 0xa1, 0xee, 0xe8, 0x59,
            0xb8, 0xcc, 0x6a, 0xf9, 0xbd, 0x5c, 0x2e, 0x18,
            // s
            0x4c, 0xd6, 0x0b, 0x85, 0x5d, 0x44, 0x2f, 0x5a,
            0x3c, 0x7b, 0x11, 0xeb, 0x6c, 0x4e, 0x0a, 0xe7,
            0x52, 0x5f, 0xe7, 0x10, 0xfa, 0xb9, 0xaa, 0x7c,
            0x77, 0xa6, 0x7f, 0x79, 0xe6, 0xfa, 0xdd, 0x76,
        ];

        let valid = P256::verify(&message_hash, &signature, &public).unwrap();
        assert!(valid);
    }
}
