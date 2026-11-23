//! EIP-4844 blob utilities.
//!
//! Provides types and functions for working with EIP-4844 blob transactions,
//! including blob encoding/decoding, versioned hash computation, and gas calculations.

#[cfg(not(feature = "std"))]
use alloc::vec::Vec;

use crate::crypto::sha256;
use crate::error::{Error, Result};

// ============================================================================
// Constants
// ============================================================================

/// Bytes per field element (32 bytes).
pub const BYTES_PER_FIELD_ELEMENT: usize = 32;

/// Field elements per blob (4096).
pub const FIELD_ELEMENTS_PER_BLOB: usize = 4096;

/// Total bytes per blob (131072 = 32 * 4096).
pub const BYTES_PER_BLOB: usize = BYTES_PER_FIELD_ELEMENT * FIELD_ELEMENTS_PER_BLOB;

/// Maximum blob gas per block (786432).
pub const MAX_BLOB_GAS_PER_BLOCK: u64 = 786432;

/// Target blob gas per block (393216).
pub const TARGET_BLOB_GAS_PER_BLOCK: u64 = 393216;

/// Gas cost per blob (131072).
pub const BLOB_GAS_PER_BLOB: u64 = 131072;

/// Minimum blob gas price in wei (1).
pub const MIN_BLOB_GASPRICE: u64 = 1;

/// Blob gas price update fraction (3338477).
pub const BLOB_GASPRICE_UPDATE_FRACTION: u64 = 3338477;

/// Maximum blobs per block (derived: MAX_BLOB_GAS_PER_BLOCK / BLOB_GAS_PER_BLOB = 6).
pub const MAX_BLOBS_PER_BLOCK: usize = 6;

/// Version byte for versioned hashes (0x01 for KZG commitments).
pub const VERSIONED_HASH_VERSION_KZG: u8 = 0x01;

/// BLS modulus (field element must be < this value).
/// This is the BLS12-381 scalar field modulus.
const BLS_MODULUS: [u8; 32] = [
    0x73, 0xed, 0xa7, 0x53, 0x29, 0x9d, 0x7d, 0x48,
    0x33, 0x39, 0xd8, 0x08, 0x09, 0xa1, 0xd8, 0x05,
    0x53, 0xbd, 0xa4, 0x02, 0xff, 0xfe, 0x5b, 0xfe,
    0xff, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x01,
];

// ============================================================================
// Types
// ============================================================================

/// A blob containing 131072 bytes of data.
pub type Blob = [u8; BYTES_PER_BLOB];

/// A versioned hash (32 bytes: version byte + `sha256(commitment)[1..32]`).
pub type BlobHash = [u8; 32];

// ============================================================================
// Blob Encoding/Decoding
// ============================================================================

/// Encode arbitrary data into blob format.
///
/// The encoding packs data into field elements, ensuring each 32-byte chunk
/// has a leading zero byte (to ensure it's < BLS modulus). The first 4 bytes
/// store the data length.
///
/// # Errors
///
/// Returns error if data is too large to fit in a blob.
pub fn blob_from_data(data: &[u8]) -> Result<Blob> {
    // Each field element can hold 31 bytes of data (first byte must be 0)
    // First field element holds: 1 zero byte + 4 length bytes + 27 data bytes
    // Remaining elements hold: 1 zero byte + 31 data bytes
    let max_data_size = 31 * FIELD_ELEMENTS_PER_BLOB - 4;

    if data.len() > max_data_size {
        return Err(Error::invalid_input(format!(
            "data too large for blob: {} bytes (max {})",
            data.len(),
            max_data_size
        )));
    }

    let mut blob = [0u8; BYTES_PER_BLOB];

    // First field element: [0x00, length (4 bytes BE), data (27 bytes)]
    let len = data.len() as u32;
    blob[1] = (len >> 24) as u8;
    blob[2] = (len >> 16) as u8;
    blob[3] = (len >> 8) as u8;
    blob[4] = len as u8;

    // Copy first chunk of data (up to 27 bytes)
    let first_chunk_size = data.len().min(27);
    blob[5..5 + first_chunk_size].copy_from_slice(&data[..first_chunk_size]);

    // Copy remaining data into subsequent field elements
    let mut data_offset = first_chunk_size;
    let mut field_idx = 1;

    while data_offset < data.len() && field_idx < FIELD_ELEMENTS_PER_BLOB {
        let blob_offset = field_idx * BYTES_PER_FIELD_ELEMENT;
        let chunk_size = (data.len() - data_offset).min(31);

        // First byte of each field element is 0 (to keep < BLS modulus)
        // Data goes in bytes 1-31
        blob[blob_offset + 1..blob_offset + 1 + chunk_size]
            .copy_from_slice(&data[data_offset..data_offset + chunk_size]);

        data_offset += chunk_size;
        field_idx += 1;
    }

    Ok(blob)
}

/// Decode blob back to original data.
///
/// # Errors
///
/// Returns error if blob has invalid format or length field.
pub fn blob_to_data(blob: &Blob) -> Result<Vec<u8>> {
    // Read length from first field element (bytes 1-4)
    let len = ((blob[1] as u32) << 24)
        | ((blob[2] as u32) << 16)
        | ((blob[3] as u32) << 8)
        | (blob[4] as u32);

    let len = len as usize;
    let max_data_size = 31 * FIELD_ELEMENTS_PER_BLOB - 4;

    if len > max_data_size {
        return Err(Error::invalid_input(format!(
            "invalid blob length: {} (max {})",
            len, max_data_size
        )));
    }

    let mut data = Vec::with_capacity(len);

    // Read first chunk (up to 27 bytes from first field element)
    let first_chunk_size = len.min(27);
    data.extend_from_slice(&blob[5..5 + first_chunk_size]);

    // Read remaining data from subsequent field elements
    let mut remaining = len - first_chunk_size;
    let mut field_idx = 1;

    while remaining > 0 && field_idx < FIELD_ELEMENTS_PER_BLOB {
        let blob_offset = field_idx * BYTES_PER_FIELD_ELEMENT;
        let chunk_size = remaining.min(31);

        data.extend_from_slice(&blob[blob_offset + 1..blob_offset + 1 + chunk_size]);

        remaining -= chunk_size;
        field_idx += 1;
    }

    Ok(data)
}

/// Validate that a blob has valid field elements (each < BLS modulus).
pub fn is_valid_blob(blob: &Blob) -> bool {
    for i in 0..FIELD_ELEMENTS_PER_BLOB {
        let offset = i * BYTES_PER_FIELD_ELEMENT;
        let element = &blob[offset..offset + BYTES_PER_FIELD_ELEMENT];

        if !is_valid_field_element(element) {
            return false;
        }
    }
    true
}

/// Check if a 32-byte value is a valid BLS field element (< modulus).
fn is_valid_field_element(element: &[u8]) -> bool {
    // Compare big-endian: element must be < BLS_MODULUS
    for i in 0..32 {
        if element[i] < BLS_MODULUS[i] {
            return true;
        }
        if element[i] > BLS_MODULUS[i] {
            return false;
        }
    }
    // Equal to modulus is invalid
    false
}

// ============================================================================
// Versioned Hash
// ============================================================================

/// Size of a KZG commitment (48-byte compressed BLS12-381 G1 point).
pub const BYTES_PER_COMMITMENT: usize = 48;

/// A KZG commitment (48-byte compressed BLS12-381 G1 point).
pub type KzgCommitment = [u8; BYTES_PER_COMMITMENT];

/// Compute the EIP-4844 versioned hash of a KZG commitment.
///
/// `versioned_hash = 0x01 || sha256(commitment)[1..32]`
pub fn commitment_to_versioned_hash(commitment: &KzgCommitment) -> BlobHash {
    let mut versioned = sha256(commitment);
    versioned[0] = VERSIONED_HASH_VERSION_KZG;
    versioned
}

/// Compute the EIP-4844 versioned hash of a blob.
///
/// The versioned hash commits to the blob's KZG commitment, not to the raw
/// blob bytes. This crate has no KZG implementation, so it cannot derive the
/// commitment.
///
/// # Errors
///
/// Always returns [`Error::Unsupported`]. Compute the KZG commitment with a
/// KZG library and pass it to [`commitment_to_versioned_hash`].
pub fn blob_to_versioned_hash(blob: &Blob) -> Result<BlobHash> {
    let _ = blob;
    Err(Error::unsupported(
        "blob_to_versioned_hash needs a KZG commitment; compute it with a KZG library and call commitment_to_versioned_hash",
    ))
}

/// Validate that a versioned hash has a valid version byte.
pub fn validate_versioned_hash(hash: &BlobHash) -> bool {
    hash[0] == VERSIONED_HASH_VERSION_KZG
}

// ============================================================================
// Gas Calculations
// ============================================================================

/// Calculate blob gas for a given number of blobs.
#[inline]
pub const fn calculate_blob_gas(blob_count: u32) -> u64 {
    blob_count as u64 * BLOB_GAS_PER_BLOB
}

/// Estimate number of blobs needed for given data size.
///
/// Each blob can hold approximately 127KB of data (31 bytes per field element).
/// Saturates at `u32::MAX` when the count does not fit in a `u32`.
pub fn estimate_blob_count(data_size: usize) -> u32 {
    if data_size == 0 {
        return 0;
    }

    // Usable bytes per blob: 31 * 4096 - 4 = 126972
    let usable_per_blob = 31 * FIELD_ELEMENTS_PER_BLOB - 4;

    // Overflow-safe ceiling division
    let count = (data_size - 1) / usable_per_blob + 1;
    u32::try_from(count).unwrap_or(u32::MAX)
}

/// Calculate blob gas price using EIP-4844 exponential formula.
///
/// Formula: min_price * e^(excess / fraction)
/// Uses integer approximation via `fake_exponential`.
pub fn calculate_blob_gas_price(excess_blob_gas: u64) -> u64 {
    fake_exponential(
        MIN_BLOB_GASPRICE,
        excess_blob_gas,
        BLOB_GASPRICE_UPDATE_FRACTION,
    )
}

/// Calculate excess blob gas for the next block.
///
/// excess = max(0, parent_excess + parent_used - target)
pub fn calculate_excess_blob_gas(parent_excess: u64, parent_used: u64) -> u64 {
    let total = parent_excess.saturating_add(parent_used);
    total.saturating_sub(TARGET_BLOB_GAS_PER_BLOCK)
}

/// Integer approximation of factor * e^(numerator / denominator).
///
/// Uses Taylor series: e^x = 1 + x + x^2/2! + x^3/3! + ...
/// Computes: factor * (1 + numerator/denominator + (numerator/denominator)^2/2 + ...)
pub fn fake_exponential(factor: u64, numerator: u64, denominator: u64) -> u64 {
    if denominator == 0 {
        return u64::MAX;
    }

    let mut output = 0u128;
    let mut numerator_accum = factor as u128 * denominator as u128;
    let denominator = denominator as u128;
    let numerator = numerator as u128;
    // Once output / denominator exceeds this, the result saturates to u64::MAX.
    let limit = (u64::MAX as u128 + 1) * denominator;

    let mut i = 1u128;
    while numerator_accum > 0 {
        // Terms are non-negative, so output only grows: saturate once it passes the limit.
        output = match output.checked_add(numerator_accum) {
            Some(sum) if sum < limit => sum,
            _ => return u64::MAX,
        };
        // denominator < 2^64 and i < 2^64 before the output saturates, so this fits.
        let divisor = denominator * i;
        numerator_accum = match mul_div_u128(numerator_accum, numerator, divisor) {
            Some(next) => next,
            // The next term exceeds 2^128, so the result exceeds 2^128 / 2^64.
            None => return u64::MAX,
        };
        i += 1;
    }

    (output / denominator) as u64
}

/// Compute `a * b / d` with a 256-bit intermediate product.
///
/// Returns `None` if the quotient does not fit in a u128. `d` must be non-zero.
fn mul_div_u128(a: u128, b: u128, d: u128) -> Option<u128> {
    const MASK: u128 = u64::MAX as u128;
    let (a_hi, a_lo) = (a >> 64, a & MASK);
    let (b_hi, b_lo) = (b >> 64, b & MASK);

    // Schoolbook multiply into (hi, lo) 128-bit halves.
    let ll = a_lo * b_lo;
    let lh = a_lo * b_hi;
    let hl = a_hi * b_lo;
    let hh = a_hi * b_hi;
    let mid = (ll >> 64) + (lh & MASK) + (hl & MASK);
    let lo = (ll & MASK) | (mid << 64);
    let hi = hh + (lh >> 64) + (hl >> 64) + (mid >> 64);

    // The quotient fits in a u128 exactly when hi < d.
    if hi >= d {
        return None;
    }

    // Restoring long division of (hi, lo) by d; remainder starts at hi < d.
    let mut rem = hi;
    let mut quot = 0u128;
    for bit in (0..128).rev() {
        let carry = rem >> 127;
        rem = (rem << 1) | ((lo >> bit) & 1);
        quot <<= 1;
        if carry == 1 || rem >= d {
            rem = rem.wrapping_sub(d);
            quot |= 1;
        }
    }
    Some(quot)
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_constants() {
        assert_eq!(BYTES_PER_BLOB, 131072);
        assert_eq!(BYTES_PER_FIELD_ELEMENT, 32);
        assert_eq!(FIELD_ELEMENTS_PER_BLOB, 4096);
        assert_eq!(MAX_BLOB_GAS_PER_BLOCK / BLOB_GAS_PER_BLOB, 6);
    }

    #[test]
    fn test_blob_encoding_empty() {
        let blob = blob_from_data(&[]).unwrap();
        let decoded = blob_to_data(&blob).unwrap();
        assert!(decoded.is_empty());
    }

    #[test]
    fn test_blob_encoding_small() {
        let data = b"hello world";
        let blob = blob_from_data(data).unwrap();
        let decoded = blob_to_data(&blob).unwrap();
        assert_eq!(&decoded, data);
    }

    #[test]
    fn test_blob_encoding_exact_27_bytes() {
        // Exactly fills first field element's data portion
        let data = vec![0xab; 27];
        let blob = blob_from_data(&data).unwrap();
        let decoded = blob_to_data(&blob).unwrap();
        assert_eq!(decoded, data);
    }

    #[test]
    fn test_blob_encoding_crosses_field_element() {
        // More than 27 bytes, crosses into second field element
        let data = vec![0xcd; 50];
        let blob = blob_from_data(&data).unwrap();
        let decoded = blob_to_data(&blob).unwrap();
        assert_eq!(decoded, data);
    }

    #[test]
    fn test_blob_encoding_large() {
        // Multiple field elements
        let data = vec![0xef; 1000];
        let blob = blob_from_data(&data).unwrap();
        let decoded = blob_to_data(&blob).unwrap();
        assert_eq!(decoded, data);
    }

    #[test]
    fn test_blob_encoding_max_size() {
        let max_size = 31 * FIELD_ELEMENTS_PER_BLOB - 4;
        let data = vec![0x42; max_size];
        let blob = blob_from_data(&data).unwrap();
        let decoded = blob_to_data(&blob).unwrap();
        assert_eq!(decoded.len(), max_size);
    }

    #[test]
    fn test_blob_encoding_too_large() {
        let max_size = 31 * FIELD_ELEMENTS_PER_BLOB - 4;
        let data = vec![0x00; max_size + 1];
        let result = blob_from_data(&data);
        assert!(result.is_err());
    }

    #[test]
    fn test_is_valid_blob() {
        // Valid blob (all zeros is valid since 0 < modulus)
        let blob = [0u8; BYTES_PER_BLOB];
        assert!(is_valid_blob(&blob));

        // Blob from data should be valid (first byte of each element is 0)
        let blob = blob_from_data(b"test data").unwrap();
        assert!(is_valid_blob(&blob));
    }

    #[test]
    fn test_is_valid_field_element() {
        // Zero is valid
        assert!(is_valid_field_element(&[0u8; 32]));

        // Small values are valid
        let mut small = [0u8; 32];
        small[31] = 1;
        assert!(is_valid_field_element(&small));

        // Value equal to modulus is invalid
        assert!(!is_valid_field_element(&BLS_MODULUS));

        // Value greater than modulus is invalid
        let mut large = BLS_MODULUS;
        large[31] = large[31].wrapping_add(1);
        assert!(!is_valid_field_element(&large));
    }

    #[test]
    fn test_commitment_to_versioned_hash_empty_blob_vector() {
        // KZG commitment of the all-zero blob is the compressed G1 identity.
        let mut commitment = [0u8; BYTES_PER_COMMITMENT];
        commitment[0] = 0xc0;
        let hash = commitment_to_versioned_hash(&commitment);
        let expected =
            hex::decode("010657f37554c781402a22917dee2f75def7ab966d7b770905398eba3c444014")
                .unwrap();
        assert_eq!(hash.as_slice(), expected.as_slice());
        assert!(validate_versioned_hash(&hash));
    }

    #[test]
    fn test_commitment_to_versioned_hash_is_sha256_not_keccak() {
        let commitment = [0x42u8; BYTES_PER_COMMITMENT];
        let hash = commitment_to_versioned_hash(&commitment);
        let digest = sha256(&commitment);
        assert_eq!(hash[0], VERSIONED_HASH_VERSION_KZG);
        assert_eq!(&hash[1..], &digest[1..]);
        let keccak = crate::crypto::keccak256(&commitment);
        assert_ne!(&hash[1..], &keccak.as_bytes()[1..]);
    }

    #[test]
    fn test_blob_to_versioned_hash_is_unsupported() {
        let blob = [0u8; BYTES_PER_BLOB];
        assert!(matches!(
            blob_to_versioned_hash(&blob),
            Err(Error::Unsupported(_))
        ));
    }

    #[test]
    fn test_validate_versioned_hash() {
        let mut valid = [0u8; 32];
        valid[0] = VERSIONED_HASH_VERSION_KZG;
        assert!(validate_versioned_hash(&valid));

        let invalid = [0u8; 32]; // Version 0 is invalid
        assert!(!validate_versioned_hash(&invalid));

        let mut also_invalid = [0u8; 32];
        also_invalid[0] = 0x02; // Version 2 is invalid
        assert!(!validate_versioned_hash(&also_invalid));
    }

    #[test]
    fn test_calculate_blob_gas() {
        assert_eq!(calculate_blob_gas(0), 0);
        assert_eq!(calculate_blob_gas(1), BLOB_GAS_PER_BLOB);
        assert_eq!(calculate_blob_gas(6), MAX_BLOB_GAS_PER_BLOCK);
    }

    #[test]
    fn test_estimate_blob_count() {
        assert_eq!(estimate_blob_count(0), 0);
        assert_eq!(estimate_blob_count(1), 1);
        assert_eq!(estimate_blob_count(100), 1);
        assert_eq!(estimate_blob_count(126972), 1); // Max per blob
        assert_eq!(estimate_blob_count(126973), 2); // Just over one blob
    }

    #[test]
    fn test_estimate_blob_count_boundaries_do_not_overflow() {
        let per_blob = 31 * FIELD_ELEMENTS_PER_BLOB - 4;
        // u32::MAX bytes: ceil(4294967295 / 126972) = 33827
        assert_eq!(estimate_blob_count(u32::MAX as usize), 33827);
        assert_eq!(
            estimate_blob_count(usize::MAX),
            u32::try_from((usize::MAX - 1) / per_blob + 1).unwrap_or(u32::MAX)
        );
        #[cfg(target_pointer_width = "64")]
        assert_eq!(estimate_blob_count(usize::MAX), u32::MAX);
    }

    #[test]
    fn test_calculate_excess_blob_gas() {
        // No excess when under target
        assert_eq!(
            calculate_excess_blob_gas(0, TARGET_BLOB_GAS_PER_BLOCK),
            0
        );

        // Excess accumulates when over target
        assert_eq!(
            calculate_excess_blob_gas(0, MAX_BLOB_GAS_PER_BLOCK),
            MAX_BLOB_GAS_PER_BLOCK - TARGET_BLOB_GAS_PER_BLOCK
        );

        // Excess carries over
        assert_eq!(
            calculate_excess_blob_gas(1000, TARGET_BLOB_GAS_PER_BLOCK),
            1000
        );

        // Excess can decrease
        assert_eq!(
            calculate_excess_blob_gas(1000, 0),
            0 // 1000 + 0 - TARGET = negative, saturates to 0
        );
    }

    #[test]
    fn test_fake_exponential() {
        // Base case: e^0 = 1
        assert_eq!(fake_exponential(1, 0, 1), 1);

        // factor * e^0 = factor
        assert_eq!(fake_exponential(100, 0, 1), 100);

        // Known values from EIP-4844 spec
        // When excess = 0, price = MIN_BLOB_GASPRICE = 1
        assert_eq!(calculate_blob_gas_price(0), 1);

        // Price increases with excess
        let price_low = calculate_blob_gas_price(BLOB_GASPRICE_UPDATE_FRACTION);
        let price_high = calculate_blob_gas_price(BLOB_GASPRICE_UPDATE_FRACTION * 2);
        assert!(price_high > price_low);
        assert!(price_low > 1);
    }

    #[test]
    fn test_fake_exponential_overflow_protection() {
        // Should not panic on large values
        let result = fake_exponential(u64::MAX, u64::MAX, 1);
        assert_eq!(result, u64::MAX);

        // Zero denominator returns max
        assert_eq!(fake_exponential(1, 1, 0), u64::MAX);
    }

    #[test]
    fn test_fake_exponential_wide_intermediate_small_result() {
        // factor * denominator * numerator exceeds u128, but the result is
        // factor * e^(2^20 / (2^64 - 1)), which is just above factor.
        let factor = 1u64 << 63;
        let result = fake_exponential(factor, 1 << 20, u64::MAX);
        assert!(result >= factor && result < factor + (1 << 44));
    }

    #[test]
    fn test_fake_exponential_eip4844_vectors() {
        // Vectors from the EIP-4844 reference test table.
        assert_eq!(fake_exponential(1, 0, 1), 1);
        assert_eq!(fake_exponential(38493, 0, 1000), 38493);
        assert_eq!(fake_exponential(0, 1234, 2345), 0);
        assert_eq!(fake_exponential(1, 2, 1), 6);
        assert_eq!(fake_exponential(2, 5, 2), 23);
        assert_eq!(fake_exponential(1, 50000000, 2225652), 5709098764);
    }

    #[test]
    fn test_mul_div_u128() {
        assert_eq!(mul_div_u128(u128::MAX, u128::MAX, u128::MAX), Some(u128::MAX));
        assert_eq!(mul_div_u128(u128::MAX, 2, 2), Some(u128::MAX));
        assert_eq!(mul_div_u128(u128::MAX, 2, 1), None);
        assert_eq!(mul_div_u128(1 << 100, 1 << 100, 1 << 90), Some(1 << 110));
        assert_eq!(mul_div_u128(7, 9, 4), Some(15));
    }

    #[test]
    fn test_blob_roundtrip_various_sizes() {
        for size in [0, 1, 27, 28, 31, 32, 100, 1000, 10000] {
            let data: Vec<u8> = (0..size).map(|i| i as u8).collect();
            let blob = blob_from_data(&data).unwrap();
            let decoded = blob_to_data(&blob).unwrap();
            assert_eq!(decoded, data, "Failed for size {}", size);
        }
    }

    #[test]
    fn test_versioned_hash_deterministic() {
        let commitment = [0x07u8; BYTES_PER_COMMITMENT];
        let hash1 = commitment_to_versioned_hash(&commitment);
        let hash2 = commitment_to_versioned_hash(&commitment);

        assert_eq!(hash1, hash2);
    }

    #[test]
    fn test_blob_gas_price_progression() {
        // Test that price increases exponentially with excess
        let mut prev_price = 0;
        for i in 0..10 {
            let excess = BLOB_GASPRICE_UPDATE_FRACTION * i;
            let price = calculate_blob_gas_price(excess);

            if i > 0 {
                // Price should be increasing
                assert!(price > prev_price);
            }
            prev_price = price;
        }
    }
}
