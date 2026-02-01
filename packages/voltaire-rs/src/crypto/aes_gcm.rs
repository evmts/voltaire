//! AES-GCM authenticated encryption.
//!
//! Implements AES-128-GCM and AES-256-GCM per NIST SP 800-38D.

use std::error::Error;
use std::fmt;

/// AES-GCM decryption error.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct AesGcmError;

impl fmt::Display for AesGcmError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "AES-GCM authentication failed")
    }
}

impl Error for AesGcmError {}

/// AES S-box for SubBytes transformation.
const SBOX: [u8; 256] = [
    0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76,
    0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0,
    0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15,
    0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75,
    0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84,
    0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf,
    0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8,
    0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2,
    0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73,
    0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb,
    0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79,
    0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08,
    0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a,
    0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e,
    0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf,
    0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16,
];

/// Round constants for key expansion.
const RCON: [u8; 11] = [0x00, 0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36];

/// Galois field multiplication by 2 (xtime operation).
#[inline]
fn xtime(x: u8) -> u8 {
    let carry = (x >> 7) & 1;
    (x << 1) ^ (carry * 0x1b)
}

/// Galois field multiplication.
#[inline]
fn gf_mul(mut a: u8, mut b: u8) -> u8 {
    let mut result = 0u8;
    for _ in 0..8 {
        if b & 1 != 0 {
            result ^= a;
        }
        let hi_bit = a & 0x80;
        a <<= 1;
        if hi_bit != 0 {
            a ^= 0x1b;
        }
        b >>= 1;
    }
    result
}

/// AES state (4x4 matrix of bytes).
type State = [[u8; 4]; 4];

/// SubBytes transformation.
fn sub_bytes(state: &mut State) {
    for row in state.iter_mut() {
        for byte in row.iter_mut() {
            *byte = SBOX[*byte as usize];
        }
    }
}

/// ShiftRows transformation.
fn shift_rows(state: &mut State) {
    // Row 1: shift left by 1
    let tmp = state[1][0];
    state[1][0] = state[1][1];
    state[1][1] = state[1][2];
    state[1][2] = state[1][3];
    state[1][3] = tmp;

    // Row 2: shift left by 2
    let tmp0 = state[2][0];
    let tmp1 = state[2][1];
    state[2][0] = state[2][2];
    state[2][1] = state[2][3];
    state[2][2] = tmp0;
    state[2][3] = tmp1;

    // Row 3: shift left by 3 (= right by 1)
    let tmp = state[3][3];
    state[3][3] = state[3][2];
    state[3][2] = state[3][1];
    state[3][1] = state[3][0];
    state[3][0] = tmp;
}

/// MixColumns transformation.
fn mix_columns(state: &mut State) {
    for c in 0..4 {
        let s0 = state[0][c];
        let s1 = state[1][c];
        let s2 = state[2][c];
        let s3 = state[3][c];

        state[0][c] = gf_mul(0x02, s0) ^ gf_mul(0x03, s1) ^ s2 ^ s3;
        state[1][c] = s0 ^ gf_mul(0x02, s1) ^ gf_mul(0x03, s2) ^ s3;
        state[2][c] = s0 ^ s1 ^ gf_mul(0x02, s2) ^ gf_mul(0x03, s3);
        state[3][c] = gf_mul(0x03, s0) ^ s1 ^ s2 ^ gf_mul(0x02, s3);
    }
}

/// AddRoundKey transformation.
fn add_round_key(state: &mut State, round_key: &[u8]) {
    for c in 0..4 {
        for r in 0..4 {
            state[r][c] ^= round_key[c * 4 + r];
        }
    }
}

/// AES key expansion for 128-bit key (10 rounds, 44 words).
fn expand_key_128(key: &[u8; 16]) -> [u8; 176] {
    let mut w = [0u8; 176];
    w[..16].copy_from_slice(key);

    for i in 4..44 {
        let mut temp = [w[i * 4 - 4], w[i * 4 - 3], w[i * 4 - 2], w[i * 4 - 1]];

        if i % 4 == 0 {
            // RotWord + SubWord + Rcon
            let t = temp[0];
            temp[0] = SBOX[temp[1] as usize] ^ RCON[i / 4];
            temp[1] = SBOX[temp[2] as usize];
            temp[2] = SBOX[temp[3] as usize];
            temp[3] = SBOX[t as usize];
        }

        for j in 0..4 {
            w[i * 4 + j] = w[(i - 4) * 4 + j] ^ temp[j];
        }
    }

    w
}

/// AES key expansion for 256-bit key (14 rounds, 60 words).
fn expand_key_256(key: &[u8; 32]) -> [u8; 240] {
    let mut w = [0u8; 240];
    w[..32].copy_from_slice(key);

    for i in 8..60 {
        let mut temp = [w[i * 4 - 4], w[i * 4 - 3], w[i * 4 - 2], w[i * 4 - 1]];

        if i % 8 == 0 {
            // RotWord + SubWord + Rcon
            let t = temp[0];
            temp[0] = SBOX[temp[1] as usize] ^ RCON[i / 8];
            temp[1] = SBOX[temp[2] as usize];
            temp[2] = SBOX[temp[3] as usize];
            temp[3] = SBOX[t as usize];
        } else if i % 8 == 4 {
            // SubWord only
            for t in &mut temp {
                *t = SBOX[*t as usize];
            }
        }

        for j in 0..4 {
            w[i * 4 + j] = w[(i - 8) * 4 + j] ^ temp[j];
        }
    }

    w
}

/// Encrypt a single 16-byte block with AES-128.
fn aes128_encrypt_block(block: &[u8; 16], expanded_key: &[u8; 176]) -> [u8; 16] {
    let mut state: State = [[0; 4]; 4];

    // Load block into state (column-major order)
    for c in 0..4 {
        for r in 0..4 {
            state[r][c] = block[c * 4 + r];
        }
    }

    // Initial round key
    add_round_key(&mut state, &expanded_key[0..16]);

    // Main rounds (1-9)
    for round in 1..10 {
        sub_bytes(&mut state);
        shift_rows(&mut state);
        mix_columns(&mut state);
        add_round_key(&mut state, &expanded_key[round * 16..(round + 1) * 16]);
    }

    // Final round (no MixColumns)
    sub_bytes(&mut state);
    shift_rows(&mut state);
    add_round_key(&mut state, &expanded_key[160..176]);

    // Extract output
    let mut output = [0u8; 16];
    for c in 0..4 {
        for r in 0..4 {
            output[c * 4 + r] = state[r][c];
        }
    }
    output
}

/// Encrypt a single 16-byte block with AES-256.
fn aes256_encrypt_block(block: &[u8; 16], expanded_key: &[u8; 240]) -> [u8; 16] {
    let mut state: State = [[0; 4]; 4];

    // Load block into state (column-major order)
    for c in 0..4 {
        for r in 0..4 {
            state[r][c] = block[c * 4 + r];
        }
    }

    // Initial round key
    add_round_key(&mut state, &expanded_key[0..16]);

    // Main rounds (1-13)
    for round in 1..14 {
        sub_bytes(&mut state);
        shift_rows(&mut state);
        mix_columns(&mut state);
        add_round_key(&mut state, &expanded_key[round * 16..(round + 1) * 16]);
    }

    // Final round (no MixColumns)
    sub_bytes(&mut state);
    shift_rows(&mut state);
    add_round_key(&mut state, &expanded_key[224..240]);

    // Extract output
    let mut output = [0u8; 16];
    for c in 0..4 {
        for r in 0..4 {
            output[c * 4 + r] = state[r][c];
        }
    }
    output
}

/// GF(2^128) multiplication for GHASH.
/// Polynomial: x^128 + x^7 + x^2 + x + 1
fn gf128_mul(x: &[u8; 16], y: &[u8; 16]) -> [u8; 16] {
    let mut z = [0u8; 16];
    let mut v = *y;

    for i in 0..16 {
        for j in (0..8).rev() {
            if (x[i] >> j) & 1 == 1 {
                for k in 0..16 {
                    z[k] ^= v[k];
                }
            }

            // v = v >> 1, with reduction
            let lsb = v[15] & 1;
            for k in (1..16).rev() {
                v[k] = (v[k] >> 1) | (v[k - 1] << 7);
            }
            v[0] >>= 1;

            if lsb == 1 {
                v[0] ^= 0xe1; // Reduction polynomial
            }
        }
    }

    z
}

/// GHASH function for GCM authentication.
fn ghash(h: &[u8; 16], aad: &[u8], ciphertext: &[u8]) -> [u8; 16] {
    let mut y = [0u8; 16];

    // Process AAD (padded to 16-byte blocks)
    let aad_blocks = (aad.len() + 15) / 16;
    for i in 0..aad_blocks {
        let start = i * 16;
        let end = std::cmp::min(start + 16, aad.len());
        let mut block = [0u8; 16];
        block[..end - start].copy_from_slice(&aad[start..end]);

        for k in 0..16 {
            y[k] ^= block[k];
        }
        y = gf128_mul(&y, h);
    }

    // Process ciphertext (padded to 16-byte blocks)
    let ct_blocks = (ciphertext.len() + 15) / 16;
    for i in 0..ct_blocks {
        let start = i * 16;
        let end = std::cmp::min(start + 16, ciphertext.len());
        let mut block = [0u8; 16];
        block[..end - start].copy_from_slice(&ciphertext[start..end]);

        for k in 0..16 {
            y[k] ^= block[k];
        }
        y = gf128_mul(&y, h);
    }

    // Final block: [len(A)]_64 || [len(C)]_64
    let aad_bits = (aad.len() as u64) * 8;
    let ct_bits = (ciphertext.len() as u64) * 8;
    let mut len_block = [0u8; 16];
    len_block[0..8].copy_from_slice(&aad_bits.to_be_bytes());
    len_block[8..16].copy_from_slice(&ct_bits.to_be_bytes());

    for k in 0..16 {
        y[k] ^= len_block[k];
    }
    y = gf128_mul(&y, h);

    y
}

/// Increment counter for CTR mode (big-endian, rightmost 32 bits).
fn inc32(counter: &mut [u8; 16]) {
    let mut c = u32::from_be_bytes([counter[12], counter[13], counter[14], counter[15]]);
    c = c.wrapping_add(1);
    counter[12..16].copy_from_slice(&c.to_be_bytes());
}

/// AES-128-GCM authenticated encryption.
pub struct Aes128Gcm;

impl Aes128Gcm {
    /// Encrypt plaintext with AES-128-GCM.
    ///
    /// Returns ciphertext concatenated with 16-byte authentication tag.
    ///
    /// # Examples
    ///
    /// ```rust
    /// use voltaire::crypto::Aes128Gcm;
    ///
    /// let key = [0u8; 16];
    /// let nonce = [0u8; 12];
    /// let aad = b"additional data";
    /// let plaintext = b"secret message";
    ///
    /// let ciphertext = Aes128Gcm::encrypt(plaintext, &key, &nonce, aad);
    /// assert_eq!(ciphertext.len(), plaintext.len() + 16);
    /// ```
    pub fn encrypt(plaintext: &[u8], key: &[u8; 16], nonce: &[u8; 12], aad: &[u8]) -> Vec<u8> {
        let expanded_key = expand_key_128(key);

        // Compute H = E(K, 0^128)
        let h = aes128_encrypt_block(&[0u8; 16], &expanded_key);

        // Initialize counter: nonce || 0x00000001
        let mut counter = [0u8; 16];
        counter[0..12].copy_from_slice(nonce);
        counter[15] = 1;

        // J0 = initial counter for tag computation
        let j0 = counter;

        // Encrypt plaintext using CTR mode
        let mut ciphertext = Vec::with_capacity(plaintext.len() + 16);

        for chunk in plaintext.chunks(16) {
            inc32(&mut counter);
            let keystream = aes128_encrypt_block(&counter, &expanded_key);

            for (i, &p) in chunk.iter().enumerate() {
                ciphertext.push(p ^ keystream[i]);
            }
        }

        // Compute GHASH
        let s = ghash(&h, aad, &ciphertext);

        // Compute tag: T = MSB_t(GCTR(J0, S))
        let e_j0 = aes128_encrypt_block(&j0, &expanded_key);
        let mut tag = [0u8; 16];
        for i in 0..16 {
            tag[i] = s[i] ^ e_j0[i];
        }

        ciphertext.extend_from_slice(&tag);
        ciphertext
    }

    /// Decrypt ciphertext with AES-128-GCM.
    ///
    /// The ciphertext must include the 16-byte authentication tag at the end.
    ///
    /// # Errors
    ///
    /// Returns `AesGcmError` if authentication fails.
    pub fn decrypt(
        ciphertext: &[u8],
        key: &[u8; 16],
        nonce: &[u8; 12],
        aad: &[u8],
    ) -> Result<Vec<u8>, AesGcmError> {
        if ciphertext.len() < 16 {
            return Err(AesGcmError);
        }

        let tag_start = ciphertext.len() - 16;
        let ct = &ciphertext[..tag_start];
        let tag = &ciphertext[tag_start..];

        let expanded_key = expand_key_128(key);

        // Compute H = E(K, 0^128)
        let h = aes128_encrypt_block(&[0u8; 16], &expanded_key);

        // Initialize counter
        let mut counter = [0u8; 16];
        counter[0..12].copy_from_slice(nonce);
        counter[15] = 1;
        let j0 = counter;

        // Compute GHASH and verify tag
        let s = ghash(&h, aad, ct);
        let e_j0 = aes128_encrypt_block(&j0, &expanded_key);
        let mut expected_tag = [0u8; 16];
        for i in 0..16 {
            expected_tag[i] = s[i] ^ e_j0[i];
        }

        // Constant-time tag comparison
        let mut diff = 0u8;
        for i in 0..16 {
            diff |= tag[i] ^ expected_tag[i];
        }
        if diff != 0 {
            return Err(AesGcmError);
        }

        // Decrypt ciphertext
        let mut plaintext = Vec::with_capacity(ct.len());
        for chunk in ct.chunks(16) {
            inc32(&mut counter);
            let keystream = aes128_encrypt_block(&counter, &expanded_key);

            for (i, &c) in chunk.iter().enumerate() {
                plaintext.push(c ^ keystream[i]);
            }
        }

        Ok(plaintext)
    }
}

/// AES-256-GCM authenticated encryption.
pub struct Aes256Gcm;

impl Aes256Gcm {
    /// Encrypt plaintext with AES-256-GCM.
    ///
    /// Returns ciphertext concatenated with 16-byte authentication tag.
    pub fn encrypt(plaintext: &[u8], key: &[u8; 32], nonce: &[u8; 12], aad: &[u8]) -> Vec<u8> {
        let expanded_key = expand_key_256(key);

        // Compute H = E(K, 0^128)
        let h = aes256_encrypt_block(&[0u8; 16], &expanded_key);

        // Initialize counter
        let mut counter = [0u8; 16];
        counter[0..12].copy_from_slice(nonce);
        counter[15] = 1;
        let j0 = counter;

        // Encrypt plaintext
        let mut ciphertext = Vec::with_capacity(plaintext.len() + 16);
        for chunk in plaintext.chunks(16) {
            inc32(&mut counter);
            let keystream = aes256_encrypt_block(&counter, &expanded_key);

            for (i, &p) in chunk.iter().enumerate() {
                ciphertext.push(p ^ keystream[i]);
            }
        }

        // Compute GHASH and tag
        let s = ghash(&h, aad, &ciphertext);
        let e_j0 = aes256_encrypt_block(&j0, &expanded_key);
        let mut tag = [0u8; 16];
        for i in 0..16 {
            tag[i] = s[i] ^ e_j0[i];
        }

        ciphertext.extend_from_slice(&tag);
        ciphertext
    }

    /// Decrypt ciphertext with AES-256-GCM.
    ///
    /// # Errors
    ///
    /// Returns `AesGcmError` if authentication fails.
    pub fn decrypt(
        ciphertext: &[u8],
        key: &[u8; 32],
        nonce: &[u8; 12],
        aad: &[u8],
    ) -> Result<Vec<u8>, AesGcmError> {
        if ciphertext.len() < 16 {
            return Err(AesGcmError);
        }

        let tag_start = ciphertext.len() - 16;
        let ct = &ciphertext[..tag_start];
        let tag = &ciphertext[tag_start..];

        let expanded_key = expand_key_256(key);

        // Compute H
        let h = aes256_encrypt_block(&[0u8; 16], &expanded_key);

        // Initialize counter
        let mut counter = [0u8; 16];
        counter[0..12].copy_from_slice(nonce);
        counter[15] = 1;
        let j0 = counter;

        // Verify tag
        let s = ghash(&h, aad, ct);
        let e_j0 = aes256_encrypt_block(&j0, &expanded_key);
        let mut expected_tag = [0u8; 16];
        for i in 0..16 {
            expected_tag[i] = s[i] ^ e_j0[i];
        }

        let mut diff = 0u8;
        for i in 0..16 {
            diff |= tag[i] ^ expected_tag[i];
        }
        if diff != 0 {
            return Err(AesGcmError);
        }

        // Decrypt
        let mut plaintext = Vec::with_capacity(ct.len());
        for chunk in ct.chunks(16) {
            inc32(&mut counter);
            let keystream = aes256_encrypt_block(&counter, &expanded_key);

            for (i, &c) in chunk.iter().enumerate() {
                plaintext.push(c ^ keystream[i]);
            }
        }

        Ok(plaintext)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // NIST SP 800-38D Test Case 1: AES-128 with zero key, no AAD, no plaintext
    #[test]
    fn test_aes128_gcm_nist_case1() {
        let key = [0u8; 16];
        let nonce = [0u8; 12];
        let aad = [];
        let plaintext = [];

        let ciphertext = Aes128Gcm::encrypt(&plaintext, &key, &nonce, &aad);
        // Expected tag: 58e2fccefa7e3061367f1d57a4e7455a
        let expected_tag = hex::decode("58e2fccefa7e3061367f1d57a4e7455a").unwrap();
        assert_eq!(&ciphertext[..], &expected_tag[..]);

        let decrypted = Aes128Gcm::decrypt(&ciphertext, &key, &nonce, &aad).unwrap();
        assert_eq!(decrypted, plaintext);
    }

    // NIST SP 800-38D Test Case 2: AES-128 with zero key, no AAD
    #[test]
    fn test_aes128_gcm_nist_case2() {
        let key = [0u8; 16];
        let nonce = [0u8; 12];
        let aad = [];
        let plaintext = [0u8; 16];

        let ciphertext = Aes128Gcm::encrypt(&plaintext, &key, &nonce, &aad);
        // Expected: 0388dace60b6a392f328c2b971b2fe78 + tag ab6e47d42cec13bdf53a67b21257bddf
        let expected = hex::decode("0388dace60b6a392f328c2b971b2fe78ab6e47d42cec13bdf53a67b21257bddf").unwrap();
        assert_eq!(ciphertext, expected);

        let decrypted = Aes128Gcm::decrypt(&ciphertext, &key, &nonce, &aad).unwrap();
        assert_eq!(decrypted, plaintext);
    }

    // NIST Test Case 3: AES-128-GCM with specific key and plaintext
    #[test]
    fn test_aes128_gcm_nist_case3() {
        let key = hex::decode("feffe9928665731c6d6a8f9467308308").unwrap();
        let nonce = hex::decode("cafebabefacedbaddecaf888").unwrap();
        let plaintext = hex::decode(
            "d9313225f88406e5a55909c5aff5269a86a7a9531534f7da2e4c303d8a318a721c3c0c95956809532fcf0e2449a6b525b16aedf5aa0de657ba637b391aafd255"
        ).unwrap();
        let aad = [];

        let mut key_arr = [0u8; 16];
        key_arr.copy_from_slice(&key);
        let mut nonce_arr = [0u8; 12];
        nonce_arr.copy_from_slice(&nonce);

        let ciphertext = Aes128Gcm::encrypt(&plaintext, &key_arr, &nonce_arr, &aad);

        // Expected ciphertext + tag from NIST
        let expected = hex::decode(
            "42831ec2217774244b7221b784d0d49ce3aa212f2c02a4e035c17e2329aca12e21d514b25466931c7d8f6a5aac84aa051ba30b396a0aac973d58e091473f59854d5c2af327cd64a62cf35abd2ba6fab4"
        ).unwrap();
        assert_eq!(ciphertext, expected);

        let decrypted = Aes128Gcm::decrypt(&ciphertext, &key_arr, &nonce_arr, &aad).unwrap();
        assert_eq!(decrypted, plaintext);
    }

    // NIST Test Case 4: AES-128-GCM with AAD
    #[test]
    fn test_aes128_gcm_nist_case4() {
        let key = hex::decode("feffe9928665731c6d6a8f9467308308").unwrap();
        let nonce = hex::decode("cafebabefacedbaddecaf888").unwrap();
        let plaintext = hex::decode(
            "d9313225f88406e5a55909c5aff5269a86a7a9531534f7da2e4c303d8a318a721c3c0c95956809532fcf0e2449a6b525b16aedf5aa0de657ba637b39"
        ).unwrap();
        let aad = hex::decode("feedfacedeadbeeffeedfacedeadbeefabaddad2").unwrap();

        let mut key_arr = [0u8; 16];
        key_arr.copy_from_slice(&key);
        let mut nonce_arr = [0u8; 12];
        nonce_arr.copy_from_slice(&nonce);

        let ciphertext = Aes128Gcm::encrypt(&plaintext, &key_arr, &nonce_arr, &aad);

        let expected = hex::decode(
            "42831ec2217774244b7221b784d0d49ce3aa212f2c02a4e035c17e2329aca12e21d514b25466931c7d8f6a5aac84aa051ba30b396a0aac973d58e0915bc94fbc3221a5db94fae95ae7121a47"
        ).unwrap();
        assert_eq!(ciphertext, expected);

        let decrypted = Aes128Gcm::decrypt(&ciphertext, &key_arr, &nonce_arr, &aad).unwrap();
        assert_eq!(decrypted, plaintext);
    }

    // AES-256-GCM test
    #[test]
    fn test_aes256_gcm_basic() {
        let key = [0u8; 32];
        let nonce = [0u8; 12];
        let aad = b"additional data";
        let plaintext = b"hello world";

        let ciphertext = Aes256Gcm::encrypt(plaintext, &key, &nonce, aad);
        assert_eq!(ciphertext.len(), plaintext.len() + 16);

        let decrypted = Aes256Gcm::decrypt(&ciphertext, &key, &nonce, aad).unwrap();
        assert_eq!(decrypted, plaintext);
    }

    // NIST Test Case 13: AES-256-GCM with zero key
    #[test]
    fn test_aes256_gcm_nist_case13() {
        let key = [0u8; 32];
        let nonce = [0u8; 12];
        let aad = [];
        let plaintext = [];

        let ciphertext = Aes256Gcm::encrypt(&plaintext, &key, &nonce, &aad);
        // Expected tag
        let expected_tag = hex::decode("530f8afbc74536b9a963b4f1c4cb738b").unwrap();
        assert_eq!(&ciphertext[..], &expected_tag[..]);
    }

    // NIST Test Case 14: AES-256-GCM with zero key and 16-byte plaintext
    #[test]
    fn test_aes256_gcm_nist_case14() {
        let key = [0u8; 32];
        let nonce = [0u8; 12];
        let aad = [];
        let plaintext = [0u8; 16];

        let ciphertext = Aes256Gcm::encrypt(&plaintext, &key, &nonce, &aad);
        // Expected ciphertext + tag
        let expected = hex::decode("cea7403d4d606b6e074ec5d3baf39d18d0d1c8a799996bf0265b98b5d48ab919").unwrap();
        assert_eq!(ciphertext, expected);
    }

    // Authentication failure test
    #[test]
    fn test_aes128_gcm_auth_failure() {
        let key = [0u8; 16];
        let nonce = [0u8; 12];
        let aad = [];
        let plaintext = b"test";

        let mut ciphertext = Aes128Gcm::encrypt(plaintext, &key, &nonce, &aad);
        // Tamper with ciphertext
        ciphertext[0] ^= 1;

        let result = Aes128Gcm::decrypt(&ciphertext, &key, &nonce, &aad);
        assert!(result.is_err());
    }

    // Wrong AAD test
    #[test]
    fn test_aes128_gcm_wrong_aad() {
        let key = [0u8; 16];
        let nonce = [0u8; 12];
        let aad = b"correct aad";
        let plaintext = b"test";

        let ciphertext = Aes128Gcm::encrypt(plaintext, &key, &nonce, aad);

        let result = Aes128Gcm::decrypt(&ciphertext, &key, &nonce, b"wrong aad");
        assert!(result.is_err());
    }

    // Round-trip test with various lengths
    #[test]
    fn test_aes_gcm_various_lengths() {
        let key128 = [1u8; 16];
        let key256 = [2u8; 32];
        let nonce = [3u8; 12];
        let aad = b"some aad";

        for len in [0, 1, 15, 16, 17, 31, 32, 64, 100] {
            let plaintext: Vec<u8> = (0..len).map(|i| i as u8).collect();

            // AES-128
            let ct128 = Aes128Gcm::encrypt(&plaintext, &key128, &nonce, aad);
            let pt128 = Aes128Gcm::decrypt(&ct128, &key128, &nonce, aad).unwrap();
            assert_eq!(pt128, plaintext);

            // AES-256
            let ct256 = Aes256Gcm::encrypt(&plaintext, &key256, &nonce, aad);
            let pt256 = Aes256Gcm::decrypt(&ct256, &key256, &nonce, aad).unwrap();
            assert_eq!(pt256, plaintext);
        }
    }
}
