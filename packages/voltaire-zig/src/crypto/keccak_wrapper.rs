// ⚠️ UNAUDITED - Uses keccak-asm which is an unaudited assembly-optimized Keccak implementation.
// The keccak-asm crate provides performance optimizations but has NOT been security audited.
// Use audited alternatives in production:
// - @noble/hashes (audited) - https://github.com/paulmillr/noble-hashes
// - sha3 crate (RustCrypto, audited) - https://github.com/RustCrypto/hashes
// - tiny-keccak (portable, audited) - Used as WASM fallback

// Use assembly-optimized version for native targets, portable for WASM.
// When both features are enabled, the portable implementation wins so that
// exactly one backend ever writes the digest.
#[cfg(not(any(feature = "asm", feature = "portable")))]
compile_error!(
    "keccak_wrapper needs a Keccak backend: enable the `asm` feature (keccak-asm) or the `portable` feature (tiny-keccak)"
);

#[cfg(all(feature = "asm", not(feature = "portable")))]
use keccak_asm::{Digest, Keccak256};

#[cfg(feature = "portable")]
use tiny_keccak::{Hasher, Keccak};

/// Hash `input` into the 32-byte `output` with the selected backend.
fn hash_into(input: &[u8], output: &mut [u8]) {
    #[cfg(all(feature = "asm", not(feature = "portable")))]
    {
        let mut hasher = Keccak256::new();
        hasher.update(input);
        output.copy_from_slice(&hasher.finalize());
    }

    #[cfg(feature = "portable")]
    {
        let mut hasher = Keccak::v256();
        hasher.update(input);
        hasher.finalize(output);
    }

    // Unreachable configuration: compile_error! above already fired.
    #[cfg(not(any(feature = "asm", feature = "portable")))]
    {
        let _ = (input, output);
    }
}

/// Borrow `len` bytes at `ptr` as a slice.
///
/// A zero length always yields the empty slice, whatever the pointer:
/// `slice::from_raw_parts` requires a non-null, aligned pointer even for
/// zero-length slices, so it is never called for `(NULL, 0)`. Returns `None`
/// for a null pointer with a non-zero length.
///
/// # Safety
///
/// When `len` is non-zero and `ptr` is non-null, `ptr` must be valid for
/// reads of `len` bytes for the returned lifetime.
unsafe fn input_bytes<'a>(ptr: *const u8, len: usize) -> Option<&'a [u8]> {
    if len == 0 {
        return Some(&[]);
    }
    if ptr.is_null() {
        return None;
    }
    Some(std::slice::from_raw_parts(ptr, len))
}

/// Result codes for Keccak operations
#[repr(C)]
pub enum KeccakResult {
    Success = 0,
    InvalidInput = 1,
    InvalidOutputSize = 2,
}

/// Compute Keccak-256 hash of input data
///
/// # Safety
///
/// This function is safe to call from C/Zig as long as:
/// - `input` points to valid memory of at least `input_len` bytes, or
///   `input_len` is zero (then `input` may be null: the empty message)
/// - `output` points to valid memory of at least `output_len` bytes
/// - `output_len` is at least 32 bytes
#[no_mangle]
pub unsafe extern "C" fn keccak256(
    input: *const u8,
    input_len: usize,
    output: *mut u8,
    output_len: usize,
) -> KeccakResult {
    if output.is_null() {
        return KeccakResult::InvalidInput;
    }

    if output_len < 32 {
        return KeccakResult::InvalidOutputSize;
    }

    let input_slice = match input_bytes(input, input_len) {
        Some(bytes) => bytes,
        None => return KeccakResult::InvalidInput,
    };
    let output_slice = std::slice::from_raw_parts_mut(output, 32);

    hash_into(input_slice, output_slice);

    KeccakResult::Success
}

/// Batch compute Keccak-256 for multiple inputs
///
/// # Safety
///
/// This function is safe to call from C/Zig as long as:
/// - `inputs` points to valid array of pointers
/// - `input_lens` points to valid array of lengths
/// - `outputs` points to valid array of output buffers
/// - All arrays have at least `count` elements
/// - Each input/output pointer is valid for its specified length; an input
///   pointer may be null when its length is zero
#[no_mangle]
pub unsafe extern "C" fn keccak256_batch(
    inputs: *const *const u8,
    input_lens: *const usize,
    outputs: *mut *mut u8,
    count: usize,
) -> KeccakResult {
    if count == 0 {
        return KeccakResult::Success;
    }

    if inputs.is_null() || input_lens.is_null() || outputs.is_null() {
        return KeccakResult::InvalidInput;
    }

    let inputs_slice = std::slice::from_raw_parts(inputs, count);
    let lens_slice = std::slice::from_raw_parts(input_lens, count);
    let outputs_slice = std::slice::from_raw_parts_mut(outputs, count);

    for i in 0..count {
        if outputs_slice[i].is_null() {
            return KeccakResult::InvalidInput;
        }

        let input = match input_bytes(inputs_slice[i], lens_slice[i]) {
            Some(bytes) => bytes,
            None => return KeccakResult::InvalidInput,
        };
        let output = std::slice::from_raw_parts_mut(outputs_slice[i], 32);

        hash_into(input, output);
    }

    KeccakResult::Success
}

/// Get the output size for Keccak-256 (always 32 bytes)
#[no_mangle]
pub extern "C" fn keccak256_output_size() -> usize {
    32
}

#[cfg(test)]
mod tests {
    use super::*;

    /// keccak256("")
    const EMPTY: [u8; 32] = [
        0xc5, 0xd2, 0x46, 0x01, 0x86, 0xf7, 0x23, 0x3c, 0x92, 0x7e, 0x7d, 0xb2, 0xdc, 0xc7, 0x03,
        0xc0, 0xe5, 0x00, 0xb6, 0x53, 0xca, 0x82, 0x27, 0x3b, 0x7b, 0xfa, 0xd8, 0x04, 0x5d, 0x85,
        0xa4, 0x70,
    ];

    /// keccak256("abc")
    const ABC: [u8; 32] = [
        0x4e, 0x03, 0x65, 0x7a, 0xea, 0x45, 0xa9, 0x4f, 0xc7, 0xd4, 0x7b, 0xa8, 0x26, 0xc8, 0xd6,
        0x67, 0xc0, 0xd1, 0xe6, 0xe3, 0x3a, 0x64, 0xa0, 0x36, 0xec, 0x44, 0xf5, 0x8f, 0xa1, 0x2d,
        0x6c, 0x45,
    ];

    #[test]
    fn keccak256_null_zero_is_the_empty_message() {
        let mut out = [0u8; 32];
        let result = unsafe { keccak256(std::ptr::null(), 0, out.as_mut_ptr(), 32) };
        assert!(matches!(result, KeccakResult::Success));
        assert_eq!(out, EMPTY);
    }

    #[test]
    fn keccak256_non_null_zero_is_the_empty_message() {
        let data = [0xFFu8; 4];
        let mut out = [0u8; 32];
        let result = unsafe { keccak256(data.as_ptr(), 0, out.as_mut_ptr(), 32) };
        assert!(matches!(result, KeccakResult::Success));
        assert_eq!(out, EMPTY);
    }

    #[test]
    fn keccak256_null_with_length_is_rejected() {
        let mut out = [0xA5u8; 32];
        let result = unsafe { keccak256(std::ptr::null(), 3, out.as_mut_ptr(), 32) };
        assert!(matches!(result, KeccakResult::InvalidInput));
        assert_eq!(out, [0xA5u8; 32]);
    }

    #[test]
    fn keccak256_rejects_null_or_short_output() {
        let data = *b"abc";
        let result = unsafe { keccak256(data.as_ptr(), 3, std::ptr::null_mut(), 32) };
        assert!(matches!(result, KeccakResult::InvalidInput));

        let mut out = [0xA5u8; 32];
        let result = unsafe { keccak256(data.as_ptr(), 3, out.as_mut_ptr(), 31) };
        assert!(matches!(result, KeccakResult::InvalidOutputSize));
        assert_eq!(out, [0xA5u8; 32]);
    }

    #[test]
    fn keccak256_known_vector() {
        let data = *b"abc";
        let mut out = [0u8; 32];
        let result = unsafe { keccak256(data.as_ptr(), 3, out.as_mut_ptr(), 32) };
        assert!(matches!(result, KeccakResult::Success));
        assert_eq!(out, ABC);
        assert_eq!(keccak256_output_size(), 32);
    }

    #[test]
    fn keccak256_batch_accepts_null_empty_inputs() {
        let abc = *b"abc";
        let inputs = [std::ptr::null(), abc.as_ptr()];
        let lens = [0usize, 3];
        let mut out0 = [0u8; 32];
        let mut out1 = [0u8; 32];
        let mut outputs = [out0.as_mut_ptr(), out1.as_mut_ptr()];
        let result =
            unsafe { keccak256_batch(inputs.as_ptr(), lens.as_ptr(), outputs.as_mut_ptr(), 2) };
        assert!(matches!(result, KeccakResult::Success));
        assert_eq!(out0, EMPTY);
        assert_eq!(out1, ABC);

        // Null input with a non-zero length is rejected.
        let lens = [1usize, 3];
        let result =
            unsafe { keccak256_batch(inputs.as_ptr(), lens.as_ptr(), outputs.as_mut_ptr(), 2) };
        assert!(matches!(result, KeccakResult::InvalidInput));

        // An empty batch needs no arrays.
        let result = unsafe {
            keccak256_batch(std::ptr::null(), std::ptr::null(), std::ptr::null_mut(), 0)
        };
        assert!(matches!(result, KeccakResult::Success));
    }
}
