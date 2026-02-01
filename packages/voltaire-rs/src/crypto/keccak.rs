//! Keccak-256 hash function.
//!
//! Ethereum uses Keccak-256 (the original Keccak submission, not SHA-3).

use crate::primitives::Hash;

/// Compute Keccak-256 hash of input data.
///
/// # Examples
///
/// ```rust
/// use voltaire::crypto::keccak256;
///
/// let hash = keccak256(b"hello");
/// assert_eq!(
///     hash.to_hex(),
///     "0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8"
/// );
/// ```
#[cfg(feature = "native")]
pub fn keccak256(data: &[u8]) -> Hash {
    crate::ffi::keccak256(data)
}

/// Pure Rust keccak256 implementation.
#[cfg(not(feature = "native"))]
pub fn keccak256(data: &[u8]) -> Hash {
    const RATE: usize = 136; // (1600 - 256*2) / 8

    let mut state = [0u64; 25];

    // Absorb
    let mut offset = 0;
    while offset + RATE <= data.len() {
        for i in 0..(RATE / 8) {
            let word = u64::from_le_bytes(
                data[offset + i * 8..offset + (i + 1) * 8]
                    .try_into()
                    .unwrap(),
            );
            state[i] ^= word;
        }
        keccak_f(&mut state);
        offset += RATE;
    }

    // Final block with padding
    let remaining = data.len() - offset;
    let mut last_block = [0u8; RATE];
    last_block[..remaining].copy_from_slice(&data[offset..]);
    last_block[remaining] = 0x01; // Keccak padding (not SHA-3!)
    last_block[RATE - 1] |= 0x80;

    for i in 0..(RATE / 8) {
        let word = u64::from_le_bytes(last_block[i * 8..(i + 1) * 8].try_into().unwrap());
        state[i] ^= word;
    }
    keccak_f(&mut state);

    // Squeeze (only need 32 bytes)
    let mut output = [0u8; 32];
    for i in 0..4 {
        output[i * 8..(i + 1) * 8].copy_from_slice(&state[i].to_le_bytes());
    }

    Hash::new(output)
}

fn keccak_f(state: &mut [u64; 25]) {
    const RC: [u64; 24] = [
        0x0000000000000001, 0x0000000000008082, 0x800000000000808a,
        0x8000000080008000, 0x000000000000808b, 0x0000000080000001,
        0x8000000080008081, 0x8000000000008009, 0x000000000000008a,
        0x0000000000000088, 0x0000000080008009, 0x000000008000000a,
        0x000000008000808b, 0x800000000000008b, 0x8000000000008089,
        0x8000000000008003, 0x8000000000008002, 0x8000000000000080,
        0x000000000000800a, 0x800000008000000a, 0x8000000080008081,
        0x8000000000008080, 0x0000000080000001, 0x8000000080008008,
    ];

    const ROTATIONS: [u32; 25] = [
        0,  1, 62, 28, 27,
        36, 44,  6, 55, 20,
        3, 10, 43, 25, 39,
        41, 45, 15, 21,  8,
        18,  2, 61, 56, 14,
    ];

    for round in 0..24 {
        // θ (theta)
        let mut c = [0u64; 5];
        for x in 0..5 {
            c[x] = state[x] ^ state[x + 5] ^ state[x + 10] ^ state[x + 15] ^ state[x + 20];
        }

        let mut d = [0u64; 5];
        for x in 0..5 {
            d[x] = c[(x + 4) % 5] ^ c[(x + 1) % 5].rotate_left(1);
        }

        for x in 0..5 {
            for y in 0..5 {
                state[x + 5 * y] ^= d[x];
            }
        }

        // ρ (rho) and π (pi)
        let mut b = [0u64; 25];
        for x in 0..5 {
            for y in 0..5 {
                let idx = x + 5 * y;
                let new_x = y;
                let new_y = (2 * x + 3 * y) % 5;
                b[new_x + 5 * new_y] = state[idx].rotate_left(ROTATIONS[idx]);
            }
        }

        // χ (chi)
        for x in 0..5 {
            for y in 0..5 {
                let idx = x + 5 * y;
                state[idx] = b[idx] ^ ((!b[(x + 1) % 5 + 5 * y]) & b[(x + 2) % 5 + 5 * y]);
            }
        }

        // ι (iota)
        state[0] ^= RC[round];
    }
}

/// Streaming Keccak-256 hasher.
///
/// # Examples
///
/// ```rust
/// use voltaire::crypto::Keccak256;
///
/// let mut hasher = Keccak256::new();
/// hasher.update(b"hello");
/// hasher.update(b" world");
/// let hash = hasher.finalize();
/// ```
pub struct Keccak256 {
    state: [u64; 25],
    buffer: [u8; 136],
    buffer_len: usize,
}

impl Default for Keccak256 {
    fn default() -> Self {
        Self::new()
    }
}

impl Keccak256 {
    const RATE: usize = 136;

    /// Create new hasher.
    pub fn new() -> Self {
        Self {
            state: [0u64; 25],
            buffer: [0u8; 136],
            buffer_len: 0,
        }
    }

    /// Update with more data.
    pub fn update(&mut self, data: &[u8]) {
        let mut offset = 0;

        // Fill buffer
        if self.buffer_len > 0 {
            let needed = Self::RATE - self.buffer_len;
            if data.len() < needed {
                self.buffer[self.buffer_len..self.buffer_len + data.len()]
                    .copy_from_slice(data);
                self.buffer_len += data.len();
                return;
            }

            self.buffer[self.buffer_len..].copy_from_slice(&data[..needed]);
            self.absorb_block();
            offset = needed;
        }

        // Process full blocks
        while offset + Self::RATE <= data.len() {
            self.buffer.copy_from_slice(&data[offset..offset + Self::RATE]);
            self.absorb_block();
            offset += Self::RATE;
        }

        // Store remainder
        let remaining = data.len() - offset;
        self.buffer[..remaining].copy_from_slice(&data[offset..]);
        self.buffer_len = remaining;
    }

    fn absorb_block(&mut self) {
        for i in 0..(Self::RATE / 8) {
            let word = u64::from_le_bytes(
                self.buffer[i * 8..(i + 1) * 8].try_into().unwrap()
            );
            self.state[i] ^= word;
        }
        keccak_f(&mut self.state);
        self.buffer_len = 0;
    }

    /// Finalize and return hash.
    pub fn finalize(mut self) -> Hash {
        // Pad
        self.buffer[self.buffer_len] = 0x01;
        self.buffer[self.buffer_len + 1..].fill(0);
        self.buffer[Self::RATE - 1] |= 0x80;

        self.absorb_block();

        // Squeeze
        let mut output = [0u8; 32];
        for i in 0..4 {
            output[i * 8..(i + 1) * 8].copy_from_slice(&self.state[i].to_le_bytes());
        }

        Hash::new(output)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_keccak256_empty() {
        let hash = keccak256(b"");
        assert_eq!(
            hash.to_hex(),
            "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470"
        );
    }

    #[test]
    fn test_keccak256_hello() {
        let hash = keccak256(b"hello");
        assert_eq!(
            hash.to_hex(),
            "0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8"
        );
    }

    #[test]
    fn test_keccak256_streaming() {
        let mut hasher = Keccak256::new();
        hasher.update(b"hello");
        hasher.update(b" ");
        hasher.update(b"world");
        let hash1 = hasher.finalize();

        let hash2 = keccak256(b"hello world");
        assert_eq!(hash1, hash2);
    }

    #[test]
    fn test_keccak256_function_selector() {
        // transfer(address,uint256)
        let hash = keccak256(b"transfer(address,uint256)");
        let selector = &hash.as_bytes()[..4];
        assert_eq!(selector, &[0xa9, 0x05, 0x9c, 0xbb]);
    }
}
