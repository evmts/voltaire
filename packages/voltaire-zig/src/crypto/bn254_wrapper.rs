use ark_bls12_381::{Bls12_381, G1Affine as BlsG1Affine, G2Affine as BlsG2Affine};
use ark_bn254::{Bn254, G1Affine, G2Affine};
use ark_ec::{pairing::Pairing, AffineRepr, CurveGroup, VariableBaseMSM};
use ark_ff::{BigInt, BigInteger, One, PrimeField, Zero};
/// BN254 and BLS12-381 Wrapper Library for Zig Integration
///
/// This library provides C-compatible bindings for the EIP-196 / EIP-197
/// (BN254) and EIP-2537 (BLS12-381) precompile operations using arkworks.
///
/// Every decoder is strict: a coordinate that is not a canonical field
/// element, a point that is off the curve, or a point outside the prime-order
/// subgroup where the EIP requires membership makes the call fail with
/// `InvalidPoint`. A failing call never writes a result and never reports
/// `Success`, because the EVM treats these inputs as an exceptional halt.
use std::os::raw::{c_int, c_uchar, c_uint};

/// Result codes for BN254 operations
#[repr(C)]
pub enum Bn254Result {
    Success = 0,
    InvalidInput = 1,
    InvalidPoint = 2,
    InvalidScalar = 3,
    ComputationFailed = 4,
}

/// Borrow `len` bytes at `ptr`. `(NULL, 0)` and `(dangling, 0)` are the empty
/// slice; `slice::from_raw_parts` is never called with a null pointer.
unsafe fn input_bytes<'a>(ptr: *const c_uchar, len: c_uint) -> Option<&'a [u8]> {
    if len == 0 {
        return Some(&[]);
    }
    if ptr.is_null() {
        return None;
    }
    Some(std::slice::from_raw_parts(ptr, len as usize))
}

/// Read big-endian bytes into little-endian 64-bit limbs.
fn limbs_from_be<const N: usize>(bytes: &[u8]) -> [u64; N] {
    debug_assert_eq!(bytes.len(), N * 8);
    let mut limbs = [0u64; N];
    for (i, chunk) in bytes.rchunks(8).enumerate() {
        let mut word = [0u8; 8];
        word.copy_from_slice(chunk);
        limbs[i] = u64::from_be_bytes(word);
    }
    limbs
}

/// Decode a canonical BN254 base field element: 32 big-endian bytes whose
/// value is strictly less than the field modulus.
fn bn254_fq(bytes: &[u8]) -> Option<ark_bn254::Fq> {
    // from_bigint returns None for a value >= MODULUS.
    ark_bn254::Fq::from_bigint(BigInt::<4>::new(limbs_from_be::<4>(bytes)))
}

/// Decode an EIP-196 G1 point (64 bytes: x || y). `(0, 0)` is infinity.
fn bn254_g1(bytes: &[u8]) -> Option<G1Affine> {
    let x = bn254_fq(&bytes[0..32])?;
    let y = bn254_fq(&bytes[32..64])?;
    if x.is_zero() && y.is_zero() {
        return Some(G1Affine::zero());
    }
    let point = G1Affine::new_unchecked(x, y);
    if point.is_on_curve() && point.is_in_correct_subgroup_assuming_on_curve() {
        Some(point)
    } else {
        None
    }
}

/// Decode an EIP-197 G2 point (128 bytes). Each Fp2 coordinate is encoded
/// imaginary part first: `x_imag || x_real || y_imag || y_real`. The point
/// must be on the twist and in the order-r subgroup. All zeros is infinity.
fn bn254_g2(bytes: &[u8]) -> Option<G2Affine> {
    let x_imag = bn254_fq(&bytes[0..32])?;
    let x_real = bn254_fq(&bytes[32..64])?;
    let y_imag = bn254_fq(&bytes[64..96])?;
    let y_real = bn254_fq(&bytes[96..128])?;
    let x = ark_bn254::Fq2::new(x_real, x_imag);
    let y = ark_bn254::Fq2::new(y_real, y_imag);
    if x.is_zero() && y.is_zero() {
        return Some(G2Affine::zero());
    }
    let point = G2Affine::new_unchecked(x, y);
    if point.is_on_curve() && point.is_in_correct_subgroup_assuming_on_curve() {
        Some(point)
    } else {
        None
    }
}

/// Initialize the BN254 library
/// This function can be called multiple times safely
#[no_mangle]
pub extern "C" fn bn254_init() -> c_int {
    // arkworks doesn't require explicit initialization
    Bn254Result::Success as c_int
}

/// Perform elliptic curve scalar multiplication (ECMUL, EIP-196)
///
/// Input format (96 bytes; shorter input is right-padded with zeros and
/// longer input is truncated, as EIP-196 requires):
/// - Bytes 0-31: x coordinate (big-endian, canonical)
/// - Bytes 32-63: y coordinate (big-endian, canonical)
/// - Bytes 64-95: scalar (big-endian, any 256-bit value)
///
/// Output format (64 bytes):
/// - Bytes 0-31: result x coordinate (big-endian)
/// - Bytes 32-63: result y coordinate (big-endian)
///
/// Returns Bn254Result::Success on success. Returns InvalidPoint, and leaves
/// the output untouched, when a coordinate is >= the field modulus or the
/// point is not on the curve.
///
/// # Safety
///
/// This function dereferences raw pointers and requires:
/// - `input` must be valid for reads of `input_len` bytes
/// - `output` must be valid for writes of `output_len` bytes
/// - `input` may be null only when `input_len` is zero
/// - Caller must ensure input/output buffers don't overlap
#[no_mangle]
pub unsafe extern "C" fn bn254_ecmul(
    input: *const c_uchar,
    input_len: c_uint,
    output: *mut c_uchar,
    output_len: c_uint,
) -> c_int {
    if output.is_null() || output_len < 64 {
        return Bn254Result::InvalidInput as c_int;
    }
    let input_slice = match input_bytes(input, input_len) {
        Some(bytes) => bytes,
        None => return Bn254Result::InvalidInput as c_int,
    };

    // EIP-196: input is virtually right-padded with zeros to 96 bytes.
    let mut padded_input = [0u8; 96];
    let copy_len = std::cmp::min(input_slice.len(), 96);
    padded_input[..copy_len].copy_from_slice(&input_slice[..copy_len]);

    let point = match bn254_g1(&padded_input[0..64]) {
        Some(point) => point,
        None => return Bn254Result::InvalidPoint as c_int,
    };
    // Any 256-bit scalar is valid; reduction modulo the group order does not
    // change the product because G1 has prime order.
    let scalar = ark_bn254::Fr::from_be_bytes_mod_order(&padded_input[64..96]);

    let result = (point * scalar).into_affine();

    let output_slice = std::slice::from_raw_parts_mut(output, 64);
    output_slice.fill(0);
    if let Some((x, y)) = result.xy() {
        output_slice[0..32].copy_from_slice(&x.into_bigint().to_bytes_be());
        output_slice[32..64].copy_from_slice(&y.into_bigint().to_bytes_be());
    }

    Bn254Result::Success as c_int
}

/// Perform elliptic curve pairing check (ECPAIRING, EIP-197)
///
/// Input format (multiple of 192 bytes):
/// Each 192-byte group contains:
/// - Bytes 0-63: G1 point (x, y coordinates, 32 bytes each)
/// - Bytes 64-191: G2 point (x_imag, x_real, y_imag, y_real, 32 bytes each)
///
/// Output format (32 bytes):
/// - 32-byte boolean result (0x00...00 for false, 0x00...01 for true)
///
/// Returns Bn254Result::Success on success. Returns InvalidPoint, and leaves
/// the output untouched, when any coordinate is >= the field modulus, any
/// point is off its curve, or a G2 point is outside the order-r subgroup.
///
/// # Safety
///
/// This function dereferences raw pointers and requires:
/// - `input` must be valid for reads of `input_len` bytes
/// - `output` must be valid for writes of `output_len` bytes
/// - `input` may be null only when `input_len` is zero
/// - Caller must ensure input/output buffers don't overlap
#[no_mangle]
pub unsafe extern "C" fn bn254_ecpairing(
    input: *const c_uchar,
    input_len: c_uint,
    output: *mut c_uchar,
    output_len: c_uint,
) -> c_int {
    if output.is_null() || output_len < 32 {
        return Bn254Result::InvalidInput as c_int;
    }
    let input_slice = match input_bytes(input, input_len) {
        Some(bytes) => bytes,
        None => return Bn254Result::InvalidInput as c_int,
    };

    // Input must be a multiple of 192 bytes
    if input_slice.len() % 192 != 0 {
        return Bn254Result::InvalidInput as c_int;
    }

    let num_pairs = input_slice.len() / 192;
    let mut g1_points = Vec::with_capacity(num_pairs);
    let mut g2_points = Vec::with_capacity(num_pairs);

    for pair in input_slice.chunks_exact(192) {
        let g1 = match bn254_g1(&pair[0..64]) {
            Some(point) => point,
            None => return Bn254Result::InvalidPoint as c_int,
        };
        let g2 = match bn254_g2(&pair[64..192]) {
            Some(point) => point,
            None => return Bn254Result::InvalidPoint as c_int,
        };
        g1_points.push(g1);
        g2_points.push(g2);
    }

    // The empty product is one, so empty input yields true (EIP-197).
    let is_one = Bn254::multi_pairing(&g1_points, &g2_points).0.is_one();

    let output_slice = std::slice::from_raw_parts_mut(output, 32);
    output_slice.fill(0);
    if is_one {
        output_slice[31] = 1;
    }

    Bn254Result::Success as c_int
}

/// Get the expected output size for ECMUL
#[no_mangle]
pub extern "C" fn bn254_ecmul_output_size() -> c_uint {
    64
}

/// Get the expected output size for ECPAIRING  
#[no_mangle]
pub extern "C" fn bn254_ecpairing_output_size() -> c_uint {
    32
}

/// Validate ECMUL input format
///
/// EIP-196 right-pads short input and truncates long input, so every length
/// is well formed. Only a null pointer with a non-zero length is rejected.
#[no_mangle]
pub extern "C" fn bn254_ecmul_validate_input(input: *const c_uchar, input_len: c_uint) -> c_int {
    if input.is_null() && input_len != 0 {
        return Bn254Result::InvalidInput as c_int;
    }

    Bn254Result::Success as c_int
}

/// Validate ECPAIRING input format
#[no_mangle]
pub extern "C" fn bn254_ecpairing_validate_input(
    input: *const c_uchar,
    input_len: c_uint,
) -> c_int {
    if input.is_null() && input_len != 0 {
        return Bn254Result::InvalidInput as c_int;
    }

    if input_len % 192 != 0 {
        return Bn254Result::InvalidInput as c_int;
    }

    Bn254Result::Success as c_int
}

/// Result codes for BLS12-381 operations
#[repr(C)]
pub enum Bls12381Result {
    Success = 0,
    InvalidInput = 1,
    InvalidPoint = 2,
    InvalidScalar = 3,
    ComputationFailed = 4,
}

/// EIP-2537 encoded sizes.
const BLS_G1_LEN: usize = 128;
const BLS_G2_LEN: usize = 256;
const BLS_SCALAR_LEN: usize = 32;

/// Whether a decoder must also prove membership in the order-r subgroup.
/// EIP-2537 requires it for MSM and pairing inputs and forbids requiring it
/// for G1ADD and G2ADD.
#[derive(Clone, Copy, PartialEq)]
enum Subgroup {
    Check,
    Skip,
}

/// Decode an EIP-2537 Fp element: 64 bytes where bytes 0..16 are zero and
/// bytes 16..64 are the 48-byte big-endian value, strictly less than p.
fn bls_fp(bytes: &[u8]) -> Option<ark_bls12_381::Fq> {
    if bytes[..16].iter().any(|&b| b != 0) {
        return None;
    }
    // from_bigint returns None for a value >= MODULUS.
    ark_bls12_381::Fq::from_bigint(BigInt::<6>::new(limbs_from_be::<6>(&bytes[16..64])))
}

/// Decode an EIP-2537 Fp2 element: `encode(c0) || encode(c1)` (128 bytes).
fn bls_fp2(bytes: &[u8]) -> Option<ark_bls12_381::Fq2> {
    let c0 = bls_fp(&bytes[0..64])?;
    let c1 = bls_fp(&bytes[64..128])?;
    Some(ark_bls12_381::Fq2::new(c0, c1))
}

/// Decode an EIP-2537 G1 point (128 bytes: x || y). All zeros is infinity.
fn bls_g1(bytes: &[u8], subgroup: Subgroup) -> Option<BlsG1Affine> {
    let x = bls_fp(&bytes[0..64])?;
    let y = bls_fp(&bytes[64..128])?;
    if x.is_zero() && y.is_zero() {
        return Some(BlsG1Affine::zero());
    }
    let point = BlsG1Affine::new_unchecked(x, y);
    if !point.is_on_curve() {
        return None;
    }
    if subgroup == Subgroup::Check && !point.is_in_correct_subgroup_assuming_on_curve() {
        return None;
    }
    Some(point)
}

/// Decode an EIP-2537 G2 point (256 bytes: x || y in Fp2). All zeros is infinity.
fn bls_g2(bytes: &[u8], subgroup: Subgroup) -> Option<BlsG2Affine> {
    let x = bls_fp2(&bytes[0..128])?;
    let y = bls_fp2(&bytes[128..256])?;
    if x.is_zero() && y.is_zero() {
        return Some(BlsG2Affine::zero());
    }
    let point = BlsG2Affine::new_unchecked(x, y);
    if !point.is_on_curve() {
        return None;
    }
    if subgroup == Subgroup::Check && !point.is_in_correct_subgroup_assuming_on_curve() {
        return None;
    }
    Some(point)
}

/// Encode an Fp element into a zeroed 64-byte slot: value in bytes 16..64.
fn write_bls_fp(slot: &mut [u8], value: &ark_bls12_381::Fq) {
    slot[..16].fill(0);
    slot[16..64].copy_from_slice(&value.into_bigint().to_bytes_be());
}

/// Encode a G1 point into 128 bytes. Infinity is all zeros.
fn write_bls_g1(out: &mut [u8], point: &BlsG1Affine) {
    out.fill(0);
    if let Some((x, y)) = point.xy() {
        write_bls_fp(&mut out[0..64], &x);
        write_bls_fp(&mut out[64..128], &y);
    }
}

/// Encode a G2 point into 256 bytes. Infinity is all zeros.
fn write_bls_g2(out: &mut [u8], point: &BlsG2Affine) {
    out.fill(0);
    if let Some((x, y)) = point.xy() {
        write_bls_fp(&mut out[0..64], &x.c0);
        write_bls_fp(&mut out[64..128], &x.c1);
        write_bls_fp(&mut out[128..192], &y.c0);
        write_bls_fp(&mut out[192..256], &y.c1);
    }
}

/// Decode a 32-byte big-endian scalar. EIP-2537 does not require it to be
/// below the group order; reduction is exact for points of order r.
fn bls_scalar(bytes: &[u8]) -> ark_bls12_381::Fr {
    ark_bls12_381::Fr::from_be_bytes_mod_order(bytes)
}

/// Perform BLS12-381 G1 addition (EIP-2537 BLS12_G1ADD)
///
/// Input format (256 bytes): two G1 points, 128 bytes each. A point is
/// `x || y`; each coordinate is 64 bytes with 16 zero bytes followed by the
/// 48-byte big-endian value, strictly less than the field modulus.
///
/// Output format (128 bytes): the sum, in the same point encoding.
///
/// EIP-2537 specifies no subgroup check for G1ADD. Returns InvalidPoint on a
/// non-canonical coordinate or a point that is not on the curve.
///
/// # Safety
///
/// This function dereferences raw pointers and requires:
/// - `input` must be valid for reads of `input_len` bytes
/// - `output` must be valid for writes of `output_len` bytes
#[no_mangle]
pub unsafe extern "C" fn bls12_381_g1_add(
    input: *const c_uchar,
    input_len: c_uint,
    output: *mut c_uchar,
    output_len: c_uint,
) -> c_int {
    if output.is_null() || (output_len as usize) < BLS_G1_LEN {
        return Bls12381Result::InvalidInput as c_int;
    }
    let input_slice = match input_bytes(input, input_len) {
        Some(bytes) if bytes.len() == 2 * BLS_G1_LEN => bytes,
        _ => return Bls12381Result::InvalidInput as c_int,
    };

    let p1 = match bls_g1(&input_slice[0..128], Subgroup::Skip) {
        Some(point) => point,
        None => return Bls12381Result::InvalidPoint as c_int,
    };
    let p2 = match bls_g1(&input_slice[128..256], Subgroup::Skip) {
        Some(point) => point,
        None => return Bls12381Result::InvalidPoint as c_int,
    };

    let result = (p1 + p2).into_affine();
    write_bls_g1(std::slice::from_raw_parts_mut(output, BLS_G1_LEN), &result);

    Bls12381Result::Success as c_int
}

/// Perform BLS12-381 G1 scalar multiplication
///
/// This is the single-pair case of BLS12_G1MSM. The final EIP-2537 has no
/// separate G1MUL precompile.
///
/// Input format (160 bytes): G1 point (128 bytes) || scalar (32 bytes).
/// Output format (128 bytes): the product as a G1 point.
///
/// The point must be in the order-r subgroup.
///
/// # Safety
///
/// This function dereferences raw pointers and requires:
/// - `input` must be valid for reads of `input_len` bytes
/// - `output` must be valid for writes of `output_len` bytes
#[no_mangle]
pub unsafe extern "C" fn bls12_381_g1_mul(
    input: *const c_uchar,
    input_len: c_uint,
    output: *mut c_uchar,
    output_len: c_uint,
) -> c_int {
    if input_len as usize != BLS_G1_LEN + BLS_SCALAR_LEN {
        return Bls12381Result::InvalidInput as c_int;
    }
    bls12_381_g1_multiexp(input, input_len, output, output_len)
}

/// Perform BLS12-381 G1 multi-scalar multiplication (EIP-2537 BLS12_G1MSM)
///
/// Input format (160 * k bytes, k >= 1): k slices of
/// G1 point (128 bytes) || scalar (32 bytes, big-endian, any value).
///
/// Output format (128 bytes): the sum of the products as a G1 point.
///
/// Returns InvalidInput on empty input or a length that is not a multiple of
/// 160. Returns InvalidPoint when any coordinate is non-canonical, any point
/// is off the curve, or any point is outside the order-r subgroup. No pair is
/// ever skipped.
///
/// # Safety
///
/// This function dereferences raw pointers and requires:
/// - `input` must be valid for reads of `input_len` bytes
/// - `output` must be valid for writes of `output_len` bytes
#[no_mangle]
pub unsafe extern "C" fn bls12_381_g1_multiexp(
    input: *const c_uchar,
    input_len: c_uint,
    output: *mut c_uchar,
    output_len: c_uint,
) -> c_int {
    const PAIR_LEN: usize = BLS_G1_LEN + BLS_SCALAR_LEN;

    if output.is_null() || (output_len as usize) < BLS_G1_LEN {
        return Bls12381Result::InvalidInput as c_int;
    }
    let input_slice = match input_bytes(input, input_len) {
        Some(bytes) if !bytes.is_empty() && bytes.len() % PAIR_LEN == 0 => bytes,
        _ => return Bls12381Result::InvalidInput as c_int,
    };

    let num_pairs = input_slice.len() / PAIR_LEN;
    let mut points = Vec::with_capacity(num_pairs);
    let mut scalars = Vec::with_capacity(num_pairs);

    for pair in input_slice.chunks_exact(PAIR_LEN) {
        // Infinity is a valid subgroup member and contributes the identity.
        let point = match bls_g1(&pair[0..BLS_G1_LEN], Subgroup::Check) {
            Some(point) => point,
            None => return Bls12381Result::InvalidPoint as c_int,
        };
        points.push(point);
        scalars.push(bls_scalar(&pair[BLS_G1_LEN..PAIR_LEN]));
    }

    let result = match ark_bls12_381::G1Projective::msm(&points, &scalars) {
        Ok(sum) => sum.into_affine(),
        Err(_) => return Bls12381Result::ComputationFailed as c_int,
    };
    write_bls_g1(std::slice::from_raw_parts_mut(output, BLS_G1_LEN), &result);

    Bls12381Result::Success as c_int
}

/// Perform BLS12-381 pairing check (EIP-2537 BLS12_PAIRING_CHECK)
///
/// Input format (384 * k bytes, k >= 1): k slices of
/// G1 point (128 bytes) || G2 point (256 bytes).
///
/// Output format (32 bytes):
/// - 32-byte boolean result (0x00...00 for false, 0x00...01 for true)
///
/// Returns InvalidInput on empty input or a length that is not a multiple of
/// 384. Returns InvalidPoint when any coordinate is non-canonical, any point
/// is off its curve, or any point is outside the order-r subgroup.
///
/// # Safety
///
/// This function dereferences raw pointers and requires:
/// - `input` must be valid for reads of `input_len` bytes
/// - `output` must be valid for writes of `output_len` bytes
#[no_mangle]
pub unsafe extern "C" fn bls12_381_pairing(
    input: *const c_uchar,
    input_len: c_uint,
    output: *mut c_uchar,
    output_len: c_uint,
) -> c_int {
    const PAIR_LEN: usize = BLS_G1_LEN + BLS_G2_LEN;

    if output.is_null() || output_len < 32 {
        return Bls12381Result::InvalidInput as c_int;
    }
    let input_slice = match input_bytes(input, input_len) {
        Some(bytes) if !bytes.is_empty() && bytes.len() % PAIR_LEN == 0 => bytes,
        _ => return Bls12381Result::InvalidInput as c_int,
    };

    let num_pairs = input_slice.len() / PAIR_LEN;
    let mut g1_points = Vec::with_capacity(num_pairs);
    let mut g2_points = Vec::with_capacity(num_pairs);

    for pair in input_slice.chunks_exact(PAIR_LEN) {
        let g1 = match bls_g1(&pair[0..BLS_G1_LEN], Subgroup::Check) {
            Some(point) => point,
            None => return Bls12381Result::InvalidPoint as c_int,
        };
        let g2 = match bls_g2(&pair[BLS_G1_LEN..PAIR_LEN], Subgroup::Check) {
            Some(point) => point,
            None => return Bls12381Result::InvalidPoint as c_int,
        };
        g1_points.push(g1);
        g2_points.push(g2);
    }

    let is_one = Bls12_381::multi_pairing(&g1_points, &g2_points).0.is_one();

    let output_slice = std::slice::from_raw_parts_mut(output, 32);
    output_slice.fill(0);
    if is_one {
        output_slice[31] = 1;
    }

    Bls12381Result::Success as c_int
}

/// Get the expected output size for BLS12-381 G1 operations
#[no_mangle]
pub extern "C" fn bls12_381_g1_output_size() -> c_uint {
    BLS_G1_LEN as c_uint
}

/// Get the expected output size for BLS12-381 pairing
#[no_mangle]
pub extern "C" fn bls12_381_pairing_output_size() -> c_uint {
    32
}

/// Perform BLS12-381 G2 addition (EIP-2537 BLS12_G2ADD)
///
/// Input format (512 bytes): two G2 points, 256 bytes each. A point is
/// `x || y`; each Fp2 coordinate is `encode(c0) || encode(c1)` with 64-byte
/// Fp encodings.
///
/// Output format (256 bytes): the sum, in the same point encoding.
///
/// EIP-2537 specifies no subgroup check for G2ADD. Returns InvalidPoint on a
/// non-canonical coordinate or a point that is not on the curve.
///
/// # Safety
///
/// This function dereferences raw pointers and requires:
/// - `input` must be valid for reads of `input_len` bytes
/// - `output` must be valid for writes of `output_len` bytes
#[no_mangle]
pub unsafe extern "C" fn bls12_381_g2_add(
    input: *const c_uchar,
    input_len: c_uint,
    output: *mut c_uchar,
    output_len: c_uint,
) -> c_int {
    if output.is_null() || (output_len as usize) < BLS_G2_LEN {
        return Bls12381Result::InvalidInput as c_int;
    }
    let input_slice = match input_bytes(input, input_len) {
        Some(bytes) if bytes.len() == 2 * BLS_G2_LEN => bytes,
        _ => return Bls12381Result::InvalidInput as c_int,
    };

    let p1 = match bls_g2(&input_slice[0..256], Subgroup::Skip) {
        Some(point) => point,
        None => return Bls12381Result::InvalidPoint as c_int,
    };
    let p2 = match bls_g2(&input_slice[256..512], Subgroup::Skip) {
        Some(point) => point,
        None => return Bls12381Result::InvalidPoint as c_int,
    };

    let result = (p1 + p2).into_affine();
    write_bls_g2(std::slice::from_raw_parts_mut(output, BLS_G2_LEN), &result);

    Bls12381Result::Success as c_int
}

/// Perform BLS12-381 G2 scalar multiplication
///
/// This is the single-pair case of BLS12_G2MSM. The final EIP-2537 has no
/// separate G2MUL precompile.
///
/// Input format (288 bytes): G2 point (256 bytes) || scalar (32 bytes).
/// Output format (256 bytes): the product as a G2 point.
///
/// The point must be in the order-r subgroup.
///
/// # Safety
///
/// This function dereferences raw pointers and requires:
/// - `input` must be valid for reads of `input_len` bytes
/// - `output` must be valid for writes of `output_len` bytes
#[no_mangle]
pub unsafe extern "C" fn bls12_381_g2_mul(
    input: *const c_uchar,
    input_len: c_uint,
    output: *mut c_uchar,
    output_len: c_uint,
) -> c_int {
    if input_len as usize != BLS_G2_LEN + BLS_SCALAR_LEN {
        return Bls12381Result::InvalidInput as c_int;
    }
    bls12_381_g2_multiexp(input, input_len, output, output_len)
}

/// Perform BLS12-381 G2 multi-scalar multiplication (EIP-2537 BLS12_G2MSM)
///
/// Input format (288 * k bytes, k >= 1): k slices of
/// G2 point (256 bytes) || scalar (32 bytes, big-endian, any value).
///
/// Output format (256 bytes): the sum of the products as a G2 point.
///
/// Returns InvalidInput on empty input or a length that is not a multiple of
/// 288. Returns InvalidPoint when any coordinate is non-canonical, any point
/// is off the curve, or any point is outside the order-r subgroup. No pair is
/// ever skipped.
///
/// # Safety
///
/// This function dereferences raw pointers and requires:
/// - `input` must be valid for reads of `input_len` bytes
/// - `output` must be valid for writes of `output_len` bytes
#[no_mangle]
pub unsafe extern "C" fn bls12_381_g2_multiexp(
    input: *const c_uchar,
    input_len: c_uint,
    output: *mut c_uchar,
    output_len: c_uint,
) -> c_int {
    const PAIR_LEN: usize = BLS_G2_LEN + BLS_SCALAR_LEN;

    if output.is_null() || (output_len as usize) < BLS_G2_LEN {
        return Bls12381Result::InvalidInput as c_int;
    }
    let input_slice = match input_bytes(input, input_len) {
        Some(bytes) if !bytes.is_empty() && bytes.len() % PAIR_LEN == 0 => bytes,
        _ => return Bls12381Result::InvalidInput as c_int,
    };

    let num_pairs = input_slice.len() / PAIR_LEN;
    let mut points = Vec::with_capacity(num_pairs);
    let mut scalars = Vec::with_capacity(num_pairs);

    for pair in input_slice.chunks_exact(PAIR_LEN) {
        // Infinity is a valid subgroup member and contributes the identity.
        let point = match bls_g2(&pair[0..BLS_G2_LEN], Subgroup::Check) {
            Some(point) => point,
            None => return Bls12381Result::InvalidPoint as c_int,
        };
        points.push(point);
        scalars.push(bls_scalar(&pair[BLS_G2_LEN..PAIR_LEN]));
    }

    let result = match ark_bls12_381::G2Projective::msm(&points, &scalars) {
        Ok(sum) => sum.into_affine(),
        Err(_) => return Bls12381Result::ComputationFailed as c_int,
    };
    write_bls_g2(std::slice::from_raw_parts_mut(output, BLS_G2_LEN), &result);

    Bls12381Result::Success as c_int
}

/// Get the expected output size for BLS12-381 G2 operations
#[no_mangle]
pub extern "C" fn bls12_381_g2_output_size() -> c_uint {
    BLS_G2_LEN as c_uint
}

#[cfg(test)]
mod tests {
    use super::*;

    type Op = unsafe extern "C" fn(*const c_uchar, c_uint, *mut c_uchar, c_uint) -> c_int;

    const SUCCESS: c_int = 0;
    const INVALID_INPUT: c_int = 1;
    const INVALID_POINT: c_int = 2;

    /// Sentinel that a failing call must leave in the output buffer.
    const UNTOUCHED: u8 = 0xA5;

    fn hex(s: &str) -> Vec<u8> {
        assert!(s.len() % 2 == 0, "odd hex length");
        (0..s.len())
            .step_by(2)
            .map(|i| u8::from_str_radix(&s[i..i + 2], 16).expect("hex digit"))
            .collect()
    }

    fn call(op: Op, input: &[u8], out_len: usize) -> (c_int, Vec<u8>) {
        let mut out = vec![UNTOUCHED; out_len];
        let code = unsafe { op(input.as_ptr(), input.len() as c_uint, out.as_mut_ptr(), out_len as c_uint) };
        (code, out)
    }

    /// Run every vector in a `name|input|expected-or-ERR|gas` file.
    /// Returns the number of vectors run.
    fn run_vectors(op: Op, out_len: usize, vectors: &str) -> usize {
        let mut count = 0;
        for line in vectors.lines() {
            if line.is_empty() || line.starts_with('#') {
                continue;
            }
            let fields: Vec<&str> = line.split('|').collect();
            assert_eq!(fields.len(), 4, "malformed vector line: {line}");
            let (name, input) = (fields[0], hex(fields[1]));
            let (code, out) = call(op, &input, out_len);
            if fields[2] == "ERR" {
                assert_ne!(code, SUCCESS, "{name}: expected failure");
                assert!(out.iter().all(|&b| b == UNTOUCHED), "{name}: failure wrote output");
            } else {
                assert_eq!(code, SUCCESS, "{name}: expected success");
                assert_eq!(out, hex(fields[2]), "{name}: wrong output");
            }
            count += 1;
        }
        count
    }

    const BN254_P: &str = "30644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd47";
    const ZERO_32: &str = "0000000000000000000000000000000000000000000000000000000000000000";
    const ONE_32: &str = "0000000000000000000000000000000000000000000000000000000000000001";
    const TWO_32: &str = "0000000000000000000000000000000000000000000000000000000000000002";
    // BN254 G2 generator in EIP-197 order: x_imag, x_real, y_imag, y_real.
    const BN254_G2: [&str; 4] = [
        "198e9393920d483a7260bfb731fb5d25f1aa493335a9e71297e485b7aef312c2",
        "1800deef121f1e76426a00665e5c4479674322d4f75edadd46debd5cd992f6ed",
        "090689d0585ff075ec9e99ad690c3395bc4b313370b38ef355acdadcd122975b",
        "12c85ea5db8c6deb4aab71808dcb408fe3d1e7690c43d37b4ce6cc0166fa7daa",
    ];

    #[test]
    fn test_bn254_init() {
        let result = bn254_init();
        assert_eq!(result, Bn254Result::Success as c_int);
    }

    #[test]
    fn test_output_sizes() {
        assert_eq!(bn254_ecmul_output_size(), 64);
        assert_eq!(bn254_ecpairing_output_size(), 32);
        assert_eq!(bls12_381_g1_output_size(), 128);
        assert_eq!(bls12_381_g2_output_size(), 256);
        assert_eq!(bls12_381_pairing_output_size(), 32);
    }

    #[test]
    fn test_input_validation() {
        // Null pointer with a non-zero length
        assert_eq!(
            bn254_ecmul_validate_input(std::ptr::null(), 96),
            Bn254Result::InvalidInput as c_int
        );

        // EIP-196 right-pads short input, so a short length is valid
        let dummy_data = [0u8; 50];
        assert_eq!(
            bn254_ecmul_validate_input(dummy_data.as_ptr(), 50),
            Bn254Result::Success as c_int
        );
        assert_eq!(
            bn254_ecmul_validate_input(std::ptr::null(), 0),
            Bn254Result::Success as c_int
        );

        // Test valid size
        let dummy_data = [0u8; 96];
        assert_eq!(
            bn254_ecmul_validate_input(dummy_data.as_ptr(), 96),
            Bn254Result::Success as c_int
        );
    }

    #[test]
    fn test_pairing_input_validation() {
        // Test invalid size (not multiple of 192)
        let dummy_data = [0u8; 100];
        assert_eq!(
            bn254_ecpairing_validate_input(dummy_data.as_ptr(), 100),
            Bn254Result::InvalidInput as c_int
        );

        // Test valid size (multiple of 192)
        let dummy_data = [0u8; 192];
        assert_eq!(
            bn254_ecpairing_validate_input(dummy_data.as_ptr(), 192),
            Bn254Result::Success as c_int
        );
    }

    #[test]
    fn eip196_ecmul_official_vectors() {
        let n = run_vectors(
            bn254_ecmul,
            64,
            include_str!("../evm/precompiles/vectors/eip196_mul.txt"),
        );
        assert_eq!(n, 19);
    }

    #[test]
    fn eip197_ecpairing_official_vectors() {
        let n = run_vectors(
            bn254_ecpairing,
            32,
            include_str!("../evm/precompiles/vectors/eip197_pairing.txt"),
        );
        assert_eq!(n, 14);
    }

    #[test]
    fn ecmul_right_pads_short_input() {
        // Empty input is the point at infinity times zero.
        let (code, out) = unsafe {
            let mut out = vec![UNTOUCHED; 64];
            let code = bn254_ecmul(std::ptr::null(), 0, out.as_mut_ptr(), 64);
            (code, out)
        };
        assert_eq!(code, SUCCESS);
        assert_eq!(out, vec![0u8; 64]);

        // G1 generator with the scalar omitted: scalar pads to zero.
        let (code, out) = call(bn254_ecmul, &hex(&[ONE_32, TWO_32].concat()), 64);
        assert_eq!(code, SUCCESS);
        assert_eq!(out, vec![0u8; 64]);

        // 2 * G with the scalar's low-order zero bytes omitted equals the
        // same call with a full scalar of 0x02 followed by 31 zero bytes.
        let short = hex(&[ONE_32, TWO_32, "02"].concat());
        let mut full = short.clone();
        full.resize(96, 0);
        let (short_code, short_out) = call(bn254_ecmul, &short, 64);
        let (full_code, full_out) = call(bn254_ecmul, &full, 64);
        assert_eq!(short_code, SUCCESS);
        assert_eq!(full_code, SUCCESS);
        assert_eq!(short_out, full_out);
        assert_ne!(short_out, vec![0u8; 64]);

        // Bytes past 96 are ignored.
        let mut long = full.clone();
        long.extend_from_slice(&[0xFF; 40]);
        assert_eq!(call(bn254_ecmul, &long, 64), (SUCCESS, full_out));
    }

    #[test]
    fn ecmul_rejects_invalid_points() {
        let cases = [
            // Off curve.
            [ONE_32, ONE_32, ONE_32].concat(),
            // x = p is the non-canonical encoding of 0, so (p, 0) aliases
            // infinity under reduction.
            [BN254_P, ZERO_32, ONE_32].concat(),
            // x = p + 1 with y = 2 aliases the generator under reduction.
            [
                "30644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd48",
                TWO_32,
                ONE_32,
            ]
            .concat(),
            // y = p + 2 with x = 1 aliases the generator under reduction.
            [
                ONE_32,
                "30644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd49",
                ONE_32,
            ]
            .concat(),
        ];
        for case in cases {
            let (code, out) = call(bn254_ecmul, &hex(&case), 64);
            assert_eq!(code, INVALID_POINT, "{case}");
            assert!(out.iter().all(|&b| b == UNTOUCHED), "{case}");
        }
    }

    #[test]
    fn ecpairing_fp2_is_imaginary_first() {
        // e(G1, G2) * e(-G1, G2) == 1 with G2 in the EIP-197 byte order.
        let neg_g1_y = "30644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd45";
        let g2 = BN254_G2.concat();
        let input = [ONE_32, TWO_32, &g2, ONE_32, neg_g1_y, &g2].concat();
        let (code, out) = call(bn254_ecpairing, &hex(&input), 32);
        assert_eq!(code, SUCCESS);
        assert_eq!(out, hex(ONE_32));

        // The same G2 with real and imaginary parts swapped is not on the twist.
        let swapped = [BN254_G2[1], BN254_G2[0], BN254_G2[3], BN254_G2[2]].concat();
        let input = [ONE_32, TWO_32, &swapped].concat();
        let (code, out) = call(bn254_ecpairing, &hex(&input), 32);
        assert_eq!(code, INVALID_POINT);
        assert!(out.iter().all(|&b| b == UNTOUCHED));
    }

    #[test]
    fn ecpairing_rejects_invalid_points() {
        let g2 = BN254_G2.concat();

        // Find a point on the twist that is outside the order-r subgroup. The
        // twist cofactor is ~2^254, so the first x with a square right-hand
        // side gives one.
        let outside = (1u64..)
            .find_map(|i| {
                let x = ark_bn254::Fq2::new(ark_bn254::Fq::from(i), ark_bn254::Fq::one());
                G2Affine::get_point_from_x_unchecked(x, false)
            })
            .expect("a twist point exists");
        assert!(outside.is_on_curve());
        assert!(!outside.is_in_correct_subgroup_assuming_on_curve());
        let be = |f: ark_bn254::Fq| -> String {
            f.into_bigint().to_bytes_be().iter().map(|b| format!("{b:02x}")).collect()
        };
        let outside_hex = [be(outside.x.c1), be(outside.x.c0), be(outside.y.c1), be(outside.y.c0)].concat();

        let cases = [
            // G1 off curve.
            [ONE_32, ONE_32, &g2].concat(),
            // G1 x = p + 1 aliases the generator under reduction.
            [
                "30644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd48",
                TWO_32,
                &g2,
            ]
            .concat(),
            // G2 x_imag >= p.
            [ONE_32, TWO_32, BN254_P, BN254_G2[1], BN254_G2[2], BN254_G2[3]].concat(),
            // G2 off the twist.
            [ONE_32, TWO_32, ONE_32, ONE_32, ONE_32, ONE_32].concat(),
            // G2 on the twist but outside the order-r subgroup.
            [ZERO_32, ZERO_32, &outside_hex].concat(),
        ];
        for case in cases {
            let (code, out) = call(bn254_ecpairing, &hex(&case), 32);
            assert_eq!(code, INVALID_POINT, "{case}");
            assert!(out.iter().all(|&b| b == UNTOUCHED), "{case}");
        }

        // Length that is not a multiple of 192.
        let (code, _) = call(bn254_ecpairing, &[0u8; 191], 32);
        assert_eq!(code, INVALID_INPUT);
    }

    #[test]
    fn eip2537_g1_add_official_vectors() {
        assert_eq!(
            run_vectors(bls12_381_g1_add, 128, include_str!("../evm/precompiles/vectors/eip2537_g1_add.txt")),
            9
        );
        assert_eq!(
            run_vectors(bls12_381_g1_add, 128, include_str!("../evm/precompiles/vectors/eip2537_g1_add_fail.txt")),
            7
        );
    }

    #[test]
    fn eip2537_g1_mul_official_vectors() {
        assert_eq!(
            run_vectors(bls12_381_g1_mul, 128, include_str!("../evm/precompiles/vectors/eip2537_g1_mul.txt")),
            11
        );
        assert_eq!(
            run_vectors(bls12_381_g1_mul, 128, include_str!("../evm/precompiles/vectors/eip2537_g1_mul_fail.txt")),
            8
        );
    }

    #[test]
    fn eip2537_g1_msm_official_vectors() {
        assert_eq!(
            run_vectors(bls12_381_g1_multiexp, 128, include_str!("../evm/precompiles/vectors/eip2537_g1_msm.txt")),
            30
        );
        assert_eq!(
            run_vectors(bls12_381_g1_multiexp, 128, include_str!("../evm/precompiles/vectors/eip2537_g1_msm_fail.txt")),
            8
        );
    }

    #[test]
    fn eip2537_g2_add_official_vectors() {
        assert_eq!(
            run_vectors(bls12_381_g2_add, 256, include_str!("../evm/precompiles/vectors/eip2537_g2_add.txt")),
            9
        );
        assert_eq!(
            run_vectors(bls12_381_g2_add, 256, include_str!("../evm/precompiles/vectors/eip2537_g2_add_fail.txt")),
            7
        );
    }

    #[test]
    fn eip2537_g2_mul_official_vectors() {
        assert_eq!(
            run_vectors(bls12_381_g2_mul, 256, include_str!("../evm/precompiles/vectors/eip2537_g2_mul.txt")),
            11
        );
        assert_eq!(
            run_vectors(bls12_381_g2_mul, 256, include_str!("../evm/precompiles/vectors/eip2537_g2_mul_fail.txt")),
            8
        );
    }

    #[test]
    fn eip2537_g2_msm_official_vectors() {
        assert_eq!(
            run_vectors(bls12_381_g2_multiexp, 256, include_str!("../evm/precompiles/vectors/eip2537_g2_msm.txt")),
            31
        );
        assert_eq!(
            run_vectors(bls12_381_g2_multiexp, 256, include_str!("../evm/precompiles/vectors/eip2537_g2_msm_fail.txt")),
            8
        );
    }

    #[test]
    fn eip2537_pairing_official_vectors() {
        assert_eq!(
            run_vectors(bls12_381_pairing, 32, include_str!("../evm/precompiles/vectors/eip2537_pairing.txt")),
            15
        );
        assert_eq!(
            run_vectors(bls12_381_pairing, 32, include_str!("../evm/precompiles/vectors/eip2537_pairing_fail.txt")),
            25
        );
    }

    #[test]
    fn eip2537_g1_layout_is_64_byte_coordinates() {
        // G1 generator + infinity = generator, with the value in bytes 16..64
        // of each coordinate and zero padding in bytes 0..16.
        let gx = "17f1d3a73197d7942695638c4fa9ac0fc3688c4f9774b905a14e3a3f171bac586c55e83ff97a1aeffb3af00adb22c6bb";
        let gy = "08b3f481e3aaa0f1a09e30ed741d8ae4fcf5e095d5d00af600db18cb2c04b3edd03cc744a2888ae40caa232946c5e7e1";
        let pad = "00000000000000000000000000000000";
        let g1 = hex(&[pad, gx, pad, gy].concat());
        let mut input = g1.clone();
        input.extend_from_slice(&[0u8; 128]);
        let (code, out) = call(bls12_381_g1_add, &input, 128);
        assert_eq!(code, SUCCESS);
        assert_eq!(out, g1);
        assert!(out[0..16].iter().all(|&b| b == 0));
        assert!(out[64..80].iter().all(|&b| b == 0));

        // The old 48-byte-packed layout puts value bytes in the padding and
        // must be rejected.
        let mut packed = hex(&[gx, gy].concat());
        packed.resize(256, 0);
        let (code, out) = call(bls12_381_g1_add, &packed, 128);
        assert_eq!(code, INVALID_POINT);
        assert!(out.iter().all(|&b| b == UNTOUCHED));
    }

    #[test]
    fn eip2537_empty_and_null_inputs_are_errors() {
        let ops: [(Op, usize); 7] = [
            (bls12_381_g1_add, 128),
            (bls12_381_g1_mul, 128),
            (bls12_381_g1_multiexp, 128),
            (bls12_381_g2_add, 256),
            (bls12_381_g2_mul, 256),
            (bls12_381_g2_multiexp, 256),
            (bls12_381_pairing, 32),
        ];
        for (op, out_len) in ops {
            let mut out = vec![UNTOUCHED; out_len];
            let code = unsafe { op(std::ptr::null(), 0, out.as_mut_ptr(), out_len as c_uint) };
            assert_eq!(code, INVALID_INPUT);
            assert!(out.iter().all(|&b| b == UNTOUCHED));

            let code = unsafe { op(std::ptr::null(), 160, out.as_mut_ptr(), out_len as c_uint) };
            assert_eq!(code, INVALID_INPUT);

            let input = [0u8; 1];
            let code = unsafe { op(input.as_ptr(), 1, std::ptr::null_mut(), out_len as c_uint) };
            assert_eq!(code, INVALID_INPUT);
        }
    }
}
