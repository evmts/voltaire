//! BLAKE2 hash functions.
//!
//! BLAKE2b is optimized for 64-bit platforms, BLAKE2s for 32-bit.
//! Both are faster than MD5 and SHA-1, yet as secure as SHA-3.

/// BLAKE2b initialization vector (same as SHA-512).
const BLAKE2B_IV: [u64; 8] = [
    0x6a09e667f3bcc908, 0xbb67ae8584caa73b,
    0x3c6ef372fe94f82b, 0xa54ff53a5f1d36f1,
    0x510e527fade682d1, 0x9b05688c2b3e6c1f,
    0x1f83d9abfb41bd6b, 0x5be0cd19137e2179,
];

/// BLAKE2b sigma schedule.
const BLAKE2B_SIGMA: [[usize; 16]; 12] = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    [14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3],
    [11, 8, 12, 0, 5, 2, 15, 13, 10, 14, 3, 6, 7, 1, 9, 4],
    [7, 9, 3, 1, 13, 12, 11, 14, 2, 6, 5, 10, 4, 0, 15, 8],
    [9, 0, 5, 7, 2, 4, 10, 15, 14, 1, 11, 12, 6, 8, 3, 13],
    [2, 12, 6, 10, 0, 11, 8, 3, 4, 13, 7, 5, 15, 14, 1, 9],
    [12, 5, 1, 15, 14, 13, 4, 10, 0, 7, 6, 3, 9, 2, 8, 11],
    [13, 11, 7, 14, 12, 1, 3, 9, 5, 0, 15, 4, 8, 6, 2, 10],
    [6, 15, 14, 9, 11, 3, 0, 8, 12, 2, 13, 7, 1, 4, 10, 5],
    [10, 2, 8, 4, 7, 6, 1, 5, 15, 11, 9, 14, 3, 12, 13, 0],
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    [14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3],
];

/// BLAKE2s initialization vector.
const BLAKE2S_IV: [u32; 8] = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
];

/// BLAKE2s sigma schedule (same permutations as BLAKE2b).
const BLAKE2S_SIGMA: [[usize; 16]; 10] = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    [14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3],
    [11, 8, 12, 0, 5, 2, 15, 13, 10, 14, 3, 6, 7, 1, 9, 4],
    [7, 9, 3, 1, 13, 12, 11, 14, 2, 6, 5, 10, 4, 0, 15, 8],
    [9, 0, 5, 7, 2, 4, 10, 15, 14, 1, 11, 12, 6, 8, 3, 13],
    [2, 12, 6, 10, 0, 11, 8, 3, 4, 13, 7, 5, 15, 14, 1, 9],
    [12, 5, 1, 15, 14, 13, 4, 10, 0, 7, 6, 3, 9, 2, 8, 11],
    [13, 11, 7, 14, 12, 1, 3, 9, 5, 0, 15, 4, 8, 6, 2, 10],
    [6, 15, 14, 9, 11, 3, 0, 8, 12, 2, 13, 7, 1, 4, 10, 5],
    [10, 2, 8, 4, 7, 6, 1, 5, 15, 11, 9, 14, 3, 12, 13, 0],
];

/// Compute BLAKE2b hash with specified output length.
///
/// # Arguments
/// * `data` - Input data to hash
/// * `output_len` - Desired output length (1-64 bytes)
///
/// # Panics
/// Panics if `output_len` is 0 or greater than 64.
///
/// # Examples
///
/// ```rust
/// use voltaire::crypto::blake2b;
///
/// let hash = blake2b(b"hello", 32);
/// assert_eq!(hash.len(), 32);
/// ```
pub fn blake2b(data: &[u8], output_len: usize) -> Vec<u8> {
    assert!(output_len > 0 && output_len <= 64, "output_len must be 1-64");

    let mut hasher = Blake2b::new(output_len);
    hasher.update(data);
    hasher.finalize()
}

/// Compute BLAKE2s hash with specified output length.
///
/// # Arguments
/// * `data` - Input data to hash
/// * `output_len` - Desired output length (1-32 bytes)
///
/// # Panics
/// Panics if `output_len` is 0 or greater than 32.
///
/// # Examples
///
/// ```rust
/// use voltaire::crypto::blake2s;
///
/// let hash = blake2s(b"hello", 32);
/// assert_eq!(hash.len(), 32);
/// ```
pub fn blake2s(data: &[u8], output_len: usize) -> Vec<u8> {
    assert!(output_len > 0 && output_len <= 32, "output_len must be 1-32");

    let mut hasher = Blake2s::new(output_len);
    hasher.update(data);
    hasher.finalize()
}

/// Streaming BLAKE2b hasher.
///
/// # Examples
///
/// ```rust
/// use voltaire::crypto::Blake2b;
///
/// let mut hasher = Blake2b::new(32);
/// hasher.update(b"hello");
/// hasher.update(b" world");
/// let hash = hasher.finalize();
/// ```
pub struct Blake2b {
    h: [u64; 8],
    t: [u64; 2],      // counter
    buffer: [u8; 128],
    buffer_len: usize,
    output_len: usize,
}

impl Blake2b {
    const BLOCK_SIZE: usize = 128;

    /// Create new BLAKE2b hasher with specified output length.
    ///
    /// # Panics
    /// Panics if `output_len` is 0 or greater than 64.
    pub fn new(output_len: usize) -> Self {
        assert!(output_len > 0 && output_len <= 64, "output_len must be 1-64");

        let mut h = BLAKE2B_IV;
        // Parameter block: fanout=1, depth=1, leaf_length=0, node_offset=0,
        // node_depth=0, inner_length=0, salt=0, personal=0
        // h[0] ^= 0x01010000 ^ (key_len << 8) ^ output_len
        h[0] ^= 0x01010000 ^ (output_len as u64);

        Self {
            h,
            t: [0, 0],
            buffer: [0u8; 128],
            buffer_len: 0,
            output_len,
        }
    }

    /// Update hasher with more data.
    ///
    /// A full block stays buffered until more input arrives, so `finalize`
    /// always compresses the true last block with the final flag set.
    pub fn update(&mut self, mut data: &[u8]) {
        while !data.is_empty() {
            if self.buffer_len == Self::BLOCK_SIZE {
                self.increment_counter(Self::BLOCK_SIZE as u64);
                self.compress(false);
                self.buffer_len = 0;
            }
            let take = (Self::BLOCK_SIZE - self.buffer_len).min(data.len());
            self.buffer[self.buffer_len..self.buffer_len + take].copy_from_slice(&data[..take]);
            self.buffer_len += take;
            data = &data[take..];
        }
    }

    fn increment_counter(&mut self, inc: u64) {
        self.t[0] = self.t[0].wrapping_add(inc);
        if self.t[0] < inc {
            self.t[1] = self.t[1].wrapping_add(1);
        }
    }

    fn compress(&mut self, last: bool) {
        let mut v = [0u64; 16];
        v[..8].copy_from_slice(&self.h);
        v[8..].copy_from_slice(&BLAKE2B_IV);

        v[12] ^= self.t[0];
        v[13] ^= self.t[1];

        if last {
            v[14] = !v[14];
        }

        // Load message words
        let mut m = [0u64; 16];
        for i in 0..16 {
            m[i] = u64::from_le_bytes(
                self.buffer[i * 8..(i + 1) * 8].try_into().unwrap()
            );
        }

        // 12 rounds
        for round in 0..12 {
            let s = &BLAKE2B_SIGMA[round];

            // Column step
            g(&mut v, 0, 4, 8, 12, m[s[0]], m[s[1]]);
            g(&mut v, 1, 5, 9, 13, m[s[2]], m[s[3]]);
            g(&mut v, 2, 6, 10, 14, m[s[4]], m[s[5]]);
            g(&mut v, 3, 7, 11, 15, m[s[6]], m[s[7]]);

            // Diagonal step
            g(&mut v, 0, 5, 10, 15, m[s[8]], m[s[9]]);
            g(&mut v, 1, 6, 11, 12, m[s[10]], m[s[11]]);
            g(&mut v, 2, 7, 8, 13, m[s[12]], m[s[13]]);
            g(&mut v, 3, 4, 9, 14, m[s[14]], m[s[15]]);
        }

        for i in 0..8 {
            self.h[i] ^= v[i] ^ v[i + 8];
        }
    }

    /// Finalize and return hash.
    pub fn finalize(mut self) -> Vec<u8> {
        // Pad remaining with zeros
        self.buffer[self.buffer_len..].fill(0);
        self.increment_counter(self.buffer_len as u64);
        self.compress(true);

        // Extract output
        let mut output = Vec::with_capacity(self.output_len);
        for word in self.h.iter() {
            output.extend_from_slice(&word.to_le_bytes());
            if output.len() >= self.output_len {
                break;
            }
        }
        output.truncate(self.output_len);
        output
    }
}

/// BLAKE2b G mixing function.
#[inline(always)]
fn g(v: &mut [u64; 16], a: usize, b: usize, c: usize, d: usize, x: u64, y: u64) {
    v[a] = v[a].wrapping_add(v[b]).wrapping_add(x);
    v[d] = (v[d] ^ v[a]).rotate_right(32);
    v[c] = v[c].wrapping_add(v[d]);
    v[b] = (v[b] ^ v[c]).rotate_right(24);
    v[a] = v[a].wrapping_add(v[b]).wrapping_add(y);
    v[d] = (v[d] ^ v[a]).rotate_right(16);
    v[c] = v[c].wrapping_add(v[d]);
    v[b] = (v[b] ^ v[c]).rotate_right(63);
}

/// Streaming BLAKE2s hasher.
///
/// # Examples
///
/// ```rust
/// use voltaire::crypto::Blake2s;
///
/// let mut hasher = Blake2s::new(32);
/// hasher.update(b"hello");
/// hasher.update(b" world");
/// let hash = hasher.finalize();
/// ```
pub struct Blake2s {
    h: [u32; 8],
    t: [u32; 2],      // counter
    buffer: [u8; 64],
    buffer_len: usize,
    output_len: usize,
}

impl Blake2s {
    const BLOCK_SIZE: usize = 64;

    /// Create new BLAKE2s hasher with specified output length.
    ///
    /// # Panics
    /// Panics if `output_len` is 0 or greater than 32.
    pub fn new(output_len: usize) -> Self {
        assert!(output_len > 0 && output_len <= 32, "output_len must be 1-32");

        let mut h = BLAKE2S_IV;
        h[0] ^= 0x01010000 ^ (output_len as u32);

        Self {
            h,
            t: [0, 0],
            buffer: [0u8; 64],
            buffer_len: 0,
            output_len,
        }
    }

    /// Update hasher with more data.
    ///
    /// A full block stays buffered until more input arrives, so `finalize`
    /// always compresses the true last block with the final flag set.
    pub fn update(&mut self, mut data: &[u8]) {
        while !data.is_empty() {
            if self.buffer_len == Self::BLOCK_SIZE {
                self.increment_counter(Self::BLOCK_SIZE as u32);
                self.compress(false);
                self.buffer_len = 0;
            }
            let take = (Self::BLOCK_SIZE - self.buffer_len).min(data.len());
            self.buffer[self.buffer_len..self.buffer_len + take].copy_from_slice(&data[..take]);
            self.buffer_len += take;
            data = &data[take..];
        }
    }

    fn increment_counter(&mut self, inc: u32) {
        self.t[0] = self.t[0].wrapping_add(inc);
        if self.t[0] < inc {
            self.t[1] = self.t[1].wrapping_add(1);
        }
    }

    fn compress(&mut self, last: bool) {
        let mut v = [0u32; 16];
        v[..8].copy_from_slice(&self.h);
        v[8..].copy_from_slice(&BLAKE2S_IV);

        v[12] ^= self.t[0];
        v[13] ^= self.t[1];

        if last {
            v[14] = !v[14];
        }

        let mut m = [0u32; 16];
        for i in 0..16 {
            m[i] = u32::from_le_bytes(
                self.buffer[i * 4..(i + 1) * 4].try_into().unwrap()
            );
        }

        // 10 rounds
        for round in 0..10 {
            let s = &BLAKE2S_SIGMA[round];

            gs(&mut v, 0, 4, 8, 12, m[s[0]], m[s[1]]);
            gs(&mut v, 1, 5, 9, 13, m[s[2]], m[s[3]]);
            gs(&mut v, 2, 6, 10, 14, m[s[4]], m[s[5]]);
            gs(&mut v, 3, 7, 11, 15, m[s[6]], m[s[7]]);

            gs(&mut v, 0, 5, 10, 15, m[s[8]], m[s[9]]);
            gs(&mut v, 1, 6, 11, 12, m[s[10]], m[s[11]]);
            gs(&mut v, 2, 7, 8, 13, m[s[12]], m[s[13]]);
            gs(&mut v, 3, 4, 9, 14, m[s[14]], m[s[15]]);
        }

        for i in 0..8 {
            self.h[i] ^= v[i] ^ v[i + 8];
        }
    }

    /// Finalize and return hash.
    pub fn finalize(mut self) -> Vec<u8> {
        self.buffer[self.buffer_len..].fill(0);
        self.increment_counter(self.buffer_len as u32);
        self.compress(true);

        let mut output = Vec::with_capacity(self.output_len);
        for word in self.h.iter() {
            output.extend_from_slice(&word.to_le_bytes());
            if output.len() >= self.output_len {
                break;
            }
        }
        output.truncate(self.output_len);
        output
    }
}

/// BLAKE2s G mixing function.
#[inline(always)]
fn gs(v: &mut [u32; 16], a: usize, b: usize, c: usize, d: usize, x: u32, y: u32) {
    v[a] = v[a].wrapping_add(v[b]).wrapping_add(x);
    v[d] = (v[d] ^ v[a]).rotate_right(16);
    v[c] = v[c].wrapping_add(v[d]);
    v[b] = (v[b] ^ v[c]).rotate_right(12);
    v[a] = v[a].wrapping_add(v[b]).wrapping_add(y);
    v[d] = (v[d] ^ v[a]).rotate_right(8);
    v[c] = v[c].wrapping_add(v[d]);
    v[b] = (v[b] ^ v[c]).rotate_right(7);
}

#[cfg(test)]
mod tests {
    use super::*;

    // RFC 7693 test vectors

    #[test]
    fn test_blake2b_empty() {
        let hash = blake2b(b"", 64);
        assert_eq!(
            hex::encode(&hash),
            "786a02f742015903c6c6fd852552d272912f4740e15847618a86e217f71f5419\
             d25e1031afee585313896444934eb04b903a685b1448b755d56f701afe9be2ce"
        );
    }

    #[test]
    fn test_blake2b_abc() {
        let hash = blake2b(b"abc", 64);
        assert_eq!(
            hex::encode(&hash),
            "ba80a53f981c4d0d6a2797b69f12f6e94c212f14685ac4b74b12bb6fdbffa2d1\
             7d87c5392aab792dc252d5de4533cc9518d38aa8dbf1925ab92386edd4009923"
        );
    }

    #[test]
    fn test_blake2b_32_bytes() {
        let hash = blake2b(b"hello", 32);
        assert_eq!(hash.len(), 32);
        assert_eq!(
            hex::encode(&hash),
            "324dcf027dd4a30a932c441f365a25e86b173defa4b8e58948253471b81b72cf"
        );
    }

    #[test]
    fn test_blake2s_empty() {
        let hash = blake2s(b"", 32);
        assert_eq!(
            hex::encode(&hash),
            "69217a3079908094e11121d042354a7c1f55b6482ca1a51e1b250dfd1ed0eef9"
        );
    }

    #[test]
    fn test_blake2s_abc() {
        let hash = blake2s(b"abc", 32);
        assert_eq!(
            hex::encode(&hash),
            "508c5e8c327c14e2e1a72ba34eeb452f37458b209ed63a294d999b4c86675982"
        );
    }

    #[test]
    fn test_blake2b_streaming() {
        let mut hasher = Blake2b::new(64);
        hasher.update(b"abc");
        let hash1 = hasher.finalize();

        let hash2 = blake2b(b"abc", 64);
        assert_eq!(hash1, hash2);
    }

    #[test]
    fn test_blake2b_streaming_incremental() {
        let mut hasher = Blake2b::new(64);
        hasher.update(b"a");
        hasher.update(b"b");
        hasher.update(b"c");
        let hash1 = hasher.finalize();

        let hash2 = blake2b(b"abc", 64);
        assert_eq!(hash1, hash2);
    }

    #[test]
    fn test_blake2s_streaming() {
        let mut hasher = Blake2s::new(32);
        hasher.update(b"abc");
        let hash1 = hasher.finalize();

        let hash2 = blake2s(b"abc", 32);
        assert_eq!(hash1, hash2);
    }

    #[test]
    fn test_blake2b_variable_length() {
        let hash16 = blake2b(b"test", 16);
        let hash32 = blake2b(b"test", 32);
        let hash64 = blake2b(b"test", 64);

        assert_eq!(hash16.len(), 16);
        assert_eq!(hash32.len(), 32);
        assert_eq!(hash64.len(), 64);

        // Different output lengths should give different prefixes
        assert_ne!(&hash16[..], &hash32[..16]);
        assert_ne!(&hash32[..], &hash64[..32]);
    }

    #[test]
    fn test_blake2s_variable_length() {
        let hash16 = blake2s(b"test", 16);
        let hash32 = blake2s(b"test", 32);

        assert_eq!(hash16.len(), 16);
        assert_eq!(hash32.len(), 32);

        assert_ne!(&hash16[..], &hash32[..16]);
    }

    #[test]
    #[should_panic(expected = "output_len must be 1-64")]
    fn test_blake2b_invalid_output_len_zero() {
        blake2b(b"test", 0);
    }

    #[test]
    #[should_panic(expected = "output_len must be 1-64")]
    fn test_blake2b_invalid_output_len_too_large() {
        blake2b(b"test", 65);
    }

    #[test]
    #[should_panic(expected = "output_len must be 1-32")]
    fn test_blake2s_invalid_output_len_too_large() {
        blake2s(b"test", 33);
    }

    #[test]
    fn test_blake2b_large_input() {
        // Test with input larger than block size (128 bytes)
        let data = vec![0xABu8; 256];
        let hash = blake2b(&data, 64);
        assert_eq!(hash.len(), 64);

        // Streaming should match
        let mut hasher = Blake2b::new(64);
        hasher.update(&data);
        assert_eq!(hasher.finalize(), hash);
    }

    #[test]
    fn test_blake2s_large_input() {
        // Test with input larger than block size (64 bytes)
        let data = vec![0xCDu8; 128];
        let hash = blake2s(&data, 32);
        assert_eq!(hash.len(), 32);

        let mut hasher = Blake2s::new(32);
        hasher.update(&data);
        assert_eq!(hasher.finalize(), hash);
    }

    fn pattern(n: usize) -> Vec<u8> {
        (0..n).map(|i| (i % 251) as u8).collect()
    }

    // Reference digests from Python hashlib (RFC 7693 implementations).
    const B128: &str = "2319e3789c47e2daa5fe807f61bec2a1a6537fa03f19ff32e87eecbfd64b7e0e8ccff439ac333b040f19b0c4ddd11a61e24ac1fe0f10a039806c5dcc0da3d115";
    const B256: &str = "93463ac058b6163eb43be3f5bb32b28541498f4e3366f1effe253ad44e1e076e41c3616046027c82a7124f8f4746668ad10b12e8e25a95ac8f3151df01cd5a93";
    const B129: &str = "f59711d44a031d5f97a9413c065d1e614c417ede998590325f49bad2fd444d3e4418be19aec4e11449ac1a57207898bc57d76a1bcf3566292c20c683a5c4648f";
    const S64: &str = "56f34e8b96557e90c1f24b52d0c89d51086acf1b00f634cf1dde9233b8eaaa3e";
    const S128: &str = "1fa877de67259d19863a2a34bcc6962a2b25fcbf5cbecd7ede8f1fa36688a796";
    const S65: &str = "1b53ee94aaf34e4b159d48de352c7f0661d0a40edff95a0b1639b4090e974472";

    fn b2b_split(data: &[u8], cuts: &[usize]) -> String {
        let mut h = Blake2b::new(64);
        let mut prev = 0;
        for &c in cuts {
            h.update(&data[prev..c]);
            prev = c;
        }
        h.update(&data[prev..]);
        hex::encode(h.finalize())
    }

    fn b2s_split(data: &[u8], cuts: &[usize]) -> String {
        let mut h = Blake2s::new(32);
        let mut prev = 0;
        for &c in cuts {
            h.update(&data[prev..c]);
            prev = c;
        }
        h.update(&data[prev..]);
        hex::encode(h.finalize())
    }

    #[test]
    fn test_blake2b_block_boundary_vectors() {
        let d128 = pattern(128);
        assert_eq!(hex::encode(blake2b(&d128, 64)), B128);
        assert_eq!(b2b_split(&d128, &[]), B128);
        assert_eq!(b2b_split(&d128, &[64]), B128);
        assert_eq!(b2b_split(&d128, &[128]), B128); // trailing empty update
        assert_eq!(b2b_split(&d128, &[0, 1, 127]), B128);

        let d256 = pattern(256);
        assert_eq!(hex::encode(blake2b(&d256, 64)), B256);
        assert_eq!(b2b_split(&d256, &[128]), B256);
        assert_eq!(b2b_split(&d256, &[64, 128, 192]), B256);
        assert_eq!(b2b_split(&d256, &[100, 228]), B256);

        let d129 = pattern(129);
        assert_eq!(hex::encode(blake2b(&d129, 64)), B129);
        assert_eq!(b2b_split(&d129, &[128]), B129);
        assert_eq!(b2b_split(&d129, &[64, 128]), B129);
    }

    #[test]
    fn test_blake2s_block_boundary_vectors() {
        let d64 = pattern(64);
        assert_eq!(hex::encode(blake2s(&d64, 32)), S64);
        assert_eq!(b2s_split(&d64, &[]), S64);
        assert_eq!(b2s_split(&d64, &[32]), S64);
        assert_eq!(b2s_split(&d64, &[64]), S64);
        assert_eq!(b2s_split(&d64, &[0, 1, 63]), S64);

        let d128 = pattern(128);
        assert_eq!(hex::encode(blake2s(&d128, 32)), S128);
        assert_eq!(b2s_split(&d128, &[64]), S128);
        assert_eq!(b2s_split(&d128, &[32, 64, 96]), S128);
        assert_eq!(b2s_split(&d128, &[50, 114]), S128);

        let d65 = pattern(65);
        assert_eq!(hex::encode(blake2s(&d65, 32)), S65);
        assert_eq!(b2s_split(&d65, &[64]), S65);
        assert_eq!(b2s_split(&d65, &[32, 64]), S65);
    }
}
