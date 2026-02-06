//! HMAC (Hash-based Message Authentication Code).
//!
//! HMAC provides message authentication using cryptographic hash functions.
//! This module implements HMAC-SHA256 and HMAC-SHA512.

use super::sha256::sha256;

/// SHA-512 constants.
const SHA512_K: [u64; 80] = [
    0x428a2f98d728ae22, 0x7137449123ef65cd, 0xb5c0fbcfec4d3b2f, 0xe9b5dba58189dbbc,
    0x3956c25bf348b538, 0x59f111f1b605d019, 0x923f82a4af194f9b, 0xab1c5ed5da6d8118,
    0xd807aa98a3030242, 0x12835b0145706fbe, 0x243185be4ee4b28c, 0x550c7dc3d5ffb4e2,
    0x72be5d74f27b896f, 0x80deb1fe3b1696b1, 0x9bdc06a725c71235, 0xc19bf174cf692694,
    0xe49b69c19ef14ad2, 0xefbe4786384f25e3, 0x0fc19dc68b8cd5b5, 0x240ca1cc77ac9c65,
    0x2de92c6f592b0275, 0x4a7484aa6ea6e483, 0x5cb0a9dcbd41fbd4, 0x76f988da831153b5,
    0x983e5152ee66dfab, 0xa831c66d2db43210, 0xb00327c898fb213f, 0xbf597fc7beef0ee4,
    0xc6e00bf33da88fc2, 0xd5a79147930aa725, 0x06ca6351e003826f, 0x142929670a0e6e70,
    0x27b70a8546d22ffc, 0x2e1b21385c26c926, 0x4d2c6dfc5ac42aed, 0x53380d139d95b3df,
    0x650a73548baf63de, 0x766a0abb3c77b2a8, 0x81c2c92e47edaee6, 0x92722c851482353b,
    0xa2bfe8a14cf10364, 0xa81a664bbc423001, 0xc24b8b70d0f89791, 0xc76c51a30654be30,
    0xd192e819d6ef5218, 0xd69906245565a910, 0xf40e35855771202a, 0x106aa07032bbd1b8,
    0x19a4c116b8d2d0c8, 0x1e376c085141ab53, 0x2748774cdf8eeb99, 0x34b0bcb5e19b48a8,
    0x391c0cb3c5c95a63, 0x4ed8aa4ae3418acb, 0x5b9cca4f7763e373, 0x682e6ff3d6b2b8a3,
    0x748f82ee5defb2fc, 0x78a5636f43172f60, 0x84c87814a1f0ab72, 0x8cc702081a6439ec,
    0x90befffa23631e28, 0xa4506cebde82bde9, 0xbef9a3f7b2c67915, 0xc67178f2e372532b,
    0xca273eceea26619c, 0xd186b8c721c0c207, 0xeada7dd6cde0eb1e, 0xf57d4f7fee6ed178,
    0x06f067aa72176fba, 0x0a637dc5a2c898a6, 0x113f9804bef90dae, 0x1b710b35131c471b,
    0x28db77f523047d84, 0x32caab7b40c72493, 0x3c9ebe0a15c9bebc, 0x431d67c49c100d4c,
    0x4cc5d4becb3e42b6, 0x597f299cfc657e2a, 0x5fcb6fab3ad6faec, 0x6c44198c4a475817,
];

/// SHA-512 initial hash values.
const SHA512_H: [u64; 8] = [
    0x6a09e667f3bcc908, 0xbb67ae8584caa73b,
    0x3c6ef372fe94f82b, 0xa54ff53a5f1d36f1,
    0x510e527fade682d1, 0x9b05688c2b3e6c1f,
    0x1f83d9abfb41bd6b, 0x5be0cd19137e2179,
];

/// Compute SHA-512 hash.
fn sha512(data: &[u8]) -> [u8; 64] {
    let mut h = SHA512_H;

    // Pre-processing: add padding
    let ml = (data.len() as u128) * 8;
    let mut padded = data.to_vec();
    padded.push(0x80);

    while (padded.len() % 128) != 112 {
        padded.push(0x00);
    }

    padded.extend_from_slice(&ml.to_be_bytes());

    // Process each 128-byte chunk
    for chunk in padded.chunks_exact(128) {
        let mut w = [0u64; 80];

        for (i, word) in chunk.chunks_exact(8).enumerate() {
            w[i] = u64::from_be_bytes(word.try_into().unwrap());
        }

        for i in 16..80 {
            let s0 = w[i-15].rotate_right(1) ^ w[i-15].rotate_right(8) ^ (w[i-15] >> 7);
            let s1 = w[i-2].rotate_right(19) ^ w[i-2].rotate_right(61) ^ (w[i-2] >> 6);
            w[i] = w[i-16].wrapping_add(s0).wrapping_add(w[i-7]).wrapping_add(s1);
        }

        let mut a = h[0];
        let mut b = h[1];
        let mut c = h[2];
        let mut d = h[3];
        let mut e = h[4];
        let mut f = h[5];
        let mut g = h[6];
        let mut hh = h[7];

        for i in 0..80 {
            let s1 = e.rotate_right(14) ^ e.rotate_right(18) ^ e.rotate_right(41);
            let ch = (e & f) ^ ((!e) & g);
            let temp1 = hh.wrapping_add(s1).wrapping_add(ch).wrapping_add(SHA512_K[i]).wrapping_add(w[i]);
            let s0 = a.rotate_right(28) ^ a.rotate_right(34) ^ a.rotate_right(39);
            let maj = (a & b) ^ (a & c) ^ (b & c);
            let temp2 = s0.wrapping_add(maj);

            hh = g;
            g = f;
            f = e;
            e = d.wrapping_add(temp1);
            d = c;
            c = b;
            b = a;
            a = temp1.wrapping_add(temp2);
        }

        h[0] = h[0].wrapping_add(a);
        h[1] = h[1].wrapping_add(b);
        h[2] = h[2].wrapping_add(c);
        h[3] = h[3].wrapping_add(d);
        h[4] = h[4].wrapping_add(e);
        h[5] = h[5].wrapping_add(f);
        h[6] = h[6].wrapping_add(g);
        h[7] = h[7].wrapping_add(hh);
    }

    let mut output = [0u8; 64];
    for (i, word) in h.iter().enumerate() {
        output[i*8..(i+1)*8].copy_from_slice(&word.to_be_bytes());
    }
    output
}

/// Compute HMAC-SHA256.
///
/// # Examples
///
/// ```rust
/// use voltaire::crypto::hmac_sha256;
///
/// let mac = hmac_sha256(b"key", b"message");
/// ```
pub fn hmac_sha256(key: &[u8], data: &[u8]) -> [u8; 32] {
    const BLOCK_SIZE: usize = 64;

    // Prepare key
    let mut k = [0u8; BLOCK_SIZE];
    if key.len() > BLOCK_SIZE {
        let hash = sha256(key);
        k[..32].copy_from_slice(&hash);
    } else {
        k[..key.len()].copy_from_slice(key);
    }

    // Inner padding
    let mut ipad = [0x36u8; BLOCK_SIZE];
    for i in 0..BLOCK_SIZE {
        ipad[i] ^= k[i];
    }

    // Outer padding
    let mut opad = [0x5cu8; BLOCK_SIZE];
    for i in 0..BLOCK_SIZE {
        opad[i] ^= k[i];
    }

    // Inner hash: H(K XOR ipad || data)
    let mut inner_input = Vec::with_capacity(BLOCK_SIZE + data.len());
    inner_input.extend_from_slice(&ipad);
    inner_input.extend_from_slice(data);
    let inner_hash = sha256(&inner_input);

    // Outer hash: H(K XOR opad || inner_hash)
    let mut outer_input = Vec::with_capacity(BLOCK_SIZE + 32);
    outer_input.extend_from_slice(&opad);
    outer_input.extend_from_slice(&inner_hash);
    sha256(&outer_input)
}

/// Compute HMAC-SHA512.
///
/// # Examples
///
/// ```rust
/// use voltaire::crypto::hmac_sha512;
///
/// let mac = hmac_sha512(b"key", b"message");
/// ```
pub fn hmac_sha512(key: &[u8], data: &[u8]) -> [u8; 64] {
    const BLOCK_SIZE: usize = 128;

    let mut k = [0u8; BLOCK_SIZE];
    if key.len() > BLOCK_SIZE {
        let hash = sha512(key);
        k[..64].copy_from_slice(&hash);
    } else {
        k[..key.len()].copy_from_slice(key);
    }

    let mut ipad = [0x36u8; BLOCK_SIZE];
    for i in 0..BLOCK_SIZE {
        ipad[i] ^= k[i];
    }

    let mut opad = [0x5cu8; BLOCK_SIZE];
    for i in 0..BLOCK_SIZE {
        opad[i] ^= k[i];
    }

    let mut inner_input = Vec::with_capacity(BLOCK_SIZE + data.len());
    inner_input.extend_from_slice(&ipad);
    inner_input.extend_from_slice(data);
    let inner_hash = sha512(&inner_input);

    let mut outer_input = Vec::with_capacity(BLOCK_SIZE + 64);
    outer_input.extend_from_slice(&opad);
    outer_input.extend_from_slice(&inner_hash);
    sha512(&outer_input)
}

/// Incremental HMAC-SHA256.
///
/// # Examples
///
/// ```rust
/// use voltaire::crypto::HmacSha256;
///
/// let mut hmac = HmacSha256::new(b"key");
/// hmac.update(b"hello");
/// hmac.update(b" world");
/// let mac = hmac.finalize();
/// ```
pub struct HmacSha256 {
    opad: [u8; 64],
    data: Vec<u8>,
}

impl HmacSha256 {
    const BLOCK_SIZE: usize = 64;

    /// Create new HMAC-SHA256 instance.
    pub fn new(key: &[u8]) -> Self {
        let mut k = [0u8; Self::BLOCK_SIZE];
        if key.len() > Self::BLOCK_SIZE {
            let hash = sha256(key);
            k[..32].copy_from_slice(&hash);
        } else {
            k[..key.len()].copy_from_slice(key);
        }

        let mut ipad = [0x36u8; Self::BLOCK_SIZE];
        let mut opad = [0x5cu8; Self::BLOCK_SIZE];
        for i in 0..Self::BLOCK_SIZE {
            ipad[i] ^= k[i];
            opad[i] ^= k[i];
        }

        let mut data = Vec::with_capacity(Self::BLOCK_SIZE + 256);
        data.extend_from_slice(&ipad);

        Self { opad, data }
    }

    /// Update with more data.
    pub fn update(&mut self, data: &[u8]) {
        self.data.extend_from_slice(data);
    }

    /// Finalize and return MAC.
    pub fn finalize(self) -> [u8; 32] {
        let inner_hash = sha256(&self.data);

        let mut outer_input = Vec::with_capacity(Self::BLOCK_SIZE + 32);
        outer_input.extend_from_slice(&self.opad);
        outer_input.extend_from_slice(&inner_hash);
        sha256(&outer_input)
    }
}

/// Incremental HMAC-SHA512.
///
/// # Examples
///
/// ```rust
/// use voltaire::crypto::HmacSha512;
///
/// let mut hmac = HmacSha512::new(b"key");
/// hmac.update(b"hello");
/// hmac.update(b" world");
/// let mac = hmac.finalize();
/// ```
pub struct HmacSha512 {
    opad: [u8; 128],
    data: Vec<u8>,
}

impl HmacSha512 {
    const BLOCK_SIZE: usize = 128;

    /// Create new HMAC-SHA512 instance.
    pub fn new(key: &[u8]) -> Self {
        let mut k = [0u8; Self::BLOCK_SIZE];
        if key.len() > Self::BLOCK_SIZE {
            let hash = sha512(key);
            k[..64].copy_from_slice(&hash);
        } else {
            k[..key.len()].copy_from_slice(key);
        }

        let mut ipad = [0x36u8; Self::BLOCK_SIZE];
        let mut opad = [0x5cu8; Self::BLOCK_SIZE];
        for i in 0..Self::BLOCK_SIZE {
            ipad[i] ^= k[i];
            opad[i] ^= k[i];
        }

        let mut data = Vec::with_capacity(Self::BLOCK_SIZE + 256);
        data.extend_from_slice(&ipad);

        Self { opad, data }
    }

    /// Update with more data.
    pub fn update(&mut self, data: &[u8]) {
        self.data.extend_from_slice(data);
    }

    /// Finalize and return MAC.
    pub fn finalize(self) -> [u8; 64] {
        let inner_hash = sha512(&self.data);

        let mut outer_input = Vec::with_capacity(Self::BLOCK_SIZE + 64);
        outer_input.extend_from_slice(&self.opad);
        outer_input.extend_from_slice(&inner_hash);
        sha512(&outer_input)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // RFC 4231 test vectors

    #[test]
    fn test_hmac_sha256_rfc4231_1() {
        // Test case 1: key=0x0b repeated 20 times, data="Hi There"
        let key = [0x0bu8; 20];
        let data = b"Hi There";
        let mac = hmac_sha256(&key, data);
        assert_eq!(
            hex::encode(mac),
            "b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7"
        );
    }

    #[test]
    fn test_hmac_sha256_rfc4231_2() {
        // Test case 2: key="Jefe", data="what do ya want for nothing?"
        let mac = hmac_sha256(b"Jefe", b"what do ya want for nothing?");
        assert_eq!(
            hex::encode(mac),
            "5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843"
        );
    }

    #[test]
    fn test_hmac_sha256_rfc4231_3() {
        // Test case 3: key=0xaa repeated 20 times, data=0xdd repeated 50 times
        let key = [0xaau8; 20];
        let data = [0xddu8; 50];
        let mac = hmac_sha256(&key, &data);
        assert_eq!(
            hex::encode(mac),
            "773ea91e36800e46854db8ebd09181a72959098b3ef8c122d9635514ced565fe"
        );
    }

    #[test]
    fn test_hmac_sha512_rfc4231_1() {
        let key = [0x0bu8; 20];
        let data = b"Hi There";
        let mac = hmac_sha512(&key, data);
        assert_eq!(
            hex::encode(mac),
            "87aa7cdea5ef619d4ff0b4241a1d6cb02379f4e2ce4ec2787ad0b30545e17cde\
             daa833b7d6b8a702038b274eaea3f4e4be9d914eeb61f1702e696c203a126854"
        );
    }

    #[test]
    fn test_hmac_sha512_rfc4231_2() {
        let mac = hmac_sha512(b"Jefe", b"what do ya want for nothing?");
        assert_eq!(
            hex::encode(mac),
            "164b7a7bfcf819e2e395fbe73b56e0a387bd64222e831fd610270cd7ea250554\
             9758bf75c05a994a6d034f65f8f0e6fdcaeab1a34d4a6b4b636e070a38bce737"
        );
    }

    #[test]
    fn test_hmac_sha512_rfc4231_3() {
        let key = [0xaau8; 20];
        let data = [0xddu8; 50];
        let mac = hmac_sha512(&key, &data);
        assert_eq!(
            hex::encode(mac),
            "fa73b0089d56a284efb0f0756c890be9b1b5dbdd8ee81a3655f83e33b2279d39\
             bf3e848279a722c806b485a47e67c807b946a337bee8942674278859e13292fb"
        );
    }

    #[test]
    fn test_hmac_sha256_streaming() {
        let mut hmac = HmacSha256::new(b"Jefe");
        hmac.update(b"what do ya want ");
        hmac.update(b"for nothing?");
        let mac = hmac.finalize();

        let expected = hmac_sha256(b"Jefe", b"what do ya want for nothing?");
        assert_eq!(mac, expected);
    }

    #[test]
    fn test_hmac_sha512_streaming() {
        let mut hmac = HmacSha512::new(b"Jefe");
        hmac.update(b"what do ya want ");
        hmac.update(b"for nothing?");
        let mac = hmac.finalize();

        let expected = hmac_sha512(b"Jefe", b"what do ya want for nothing?");
        assert_eq!(mac, expected);
    }

    #[test]
    fn test_hmac_sha256_long_key() {
        // Key longer than block size (64 bytes) should be hashed
        let key = [0xaau8; 131];
        let data = b"Test Using Larger Than Block-Size Key - Hash Key First";
        let mac = hmac_sha256(&key, data);
        assert_eq!(
            hex::encode(mac),
            "60e431591ee0b67f0d8a26aacbf5b77f8e0bc6213728c5140546040f0ee37f54"
        );
    }

    #[test]
    fn test_hmac_sha512_long_key() {
        // Key longer than block size (128 bytes) should be hashed
        let key = [0xaau8; 131];
        let data = b"Test Using Larger Than Block-Size Key - Hash Key First";
        let mac = hmac_sha512(&key, data);
        assert_eq!(
            hex::encode(mac),
            "80b24263c7c1a3ebb71493c1dd7be8b49b46d1f41b4aeec1121b013783f8f352\
             6b56d037e05f2598bd0fd2215d6a1e5295e64f73f63f0aec8b915a985d786598"
        );
    }

    #[test]
    fn test_sha512_empty() {
        let hash = sha512(b"");
        assert_eq!(
            hex::encode(hash),
            "cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce\
             47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e"
        );
    }

    #[test]
    fn test_sha512_hello() {
        let hash = sha512(b"hello");
        assert_eq!(
            hex::encode(hash),
            "9b71d224bd62f3785d96d46ad3ea3d73319bfbc2890caadae2dff72519673ca7\
             2323c3d99ba5c11d7c7acc6e14b8c5da0c4663475c2e5c3adef46f73bcdec043"
        );
    }
}
