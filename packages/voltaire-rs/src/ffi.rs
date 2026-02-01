//! FFI bindings to the Voltaire native library.
//!
//! This module provides low-level bindings to the C FFI API.
//! Users should prefer the high-level wrappers in other modules.

#![allow(non_camel_case_types)]

use crate::error::{Error, Result};
use crate::primitives::{Address, Hash};

// C types
type c_int = i32;
type c_uchar = u8;

// Error codes
const PRIMITIVES_SUCCESS: c_int = 0;

#[repr(C)]
struct PrimitivesAddress {
    bytes: [u8; 20],
}

#[repr(C)]
struct PrimitivesHash {
    bytes: [u8; 32],
}

#[repr(C)]
struct PrimitivesU256 {
    bytes: [u8; 32],
}

// FFI function declarations
extern "C" {
    // Address API
    fn primitives_address_from_hex(hex: *const c_uchar, out: *mut PrimitivesAddress) -> c_int;
    fn primitives_address_to_hex(addr: *const PrimitivesAddress, buf: *mut c_uchar) -> c_int;
    fn primitives_address_to_checksum_hex(addr: *const PrimitivesAddress, buf: *mut c_uchar) -> c_int;
    fn primitives_address_is_zero(addr: *const PrimitivesAddress) -> bool;
    fn primitives_address_equals(a: *const PrimitivesAddress, b: *const PrimitivesAddress) -> bool;
    fn primitives_address_validate_checksum(hex: *const c_uchar) -> bool;

    // Keccak-256 API
    fn primitives_keccak256(data: *const c_uchar, len: usize, out: *mut PrimitivesHash) -> c_int;
    fn primitives_hash_to_hex(hash: *const PrimitivesHash, buf: *mut c_uchar) -> c_int;
    fn primitives_hash_from_hex(hex: *const c_uchar, out: *mut PrimitivesHash) -> c_int;
    fn primitives_hash_equals(a: *const PrimitivesHash, b: *const PrimitivesHash) -> bool;

    // Hex utilities
    fn primitives_hex_to_bytes(hex: *const c_uchar, out: *mut c_uchar, len: usize) -> c_int;
    fn primitives_bytes_to_hex(data: *const c_uchar, len: usize, out: *mut c_uchar, out_len: usize) -> c_int;

    // U256 API
    fn primitives_u256_from_hex(hex: *const c_uchar, out: *mut PrimitivesU256) -> c_int;
    fn primitives_u256_to_hex(value: *const PrimitivesU256, buf: *mut c_uchar, len: usize) -> c_int;

    // EIP-191
    fn primitives_eip191_hash_message(msg: *const c_uchar, len: usize, out: *mut PrimitivesHash) -> c_int;

    // Address derivation
    fn primitives_calculate_create_address(sender: *const PrimitivesAddress, nonce: u64, out: *mut PrimitivesAddress) -> c_int;

    // secp256k1
    fn primitives_secp256k1_recover_pubkey(
        msg_hash: *const [u8; 32],
        r: *const [u8; 32],
        s: *const [u8; 32],
        v: u8,
        out: *mut [u8; 64],
    ) -> c_int;

    fn primitives_secp256k1_recover_address(
        msg_hash: *const [u8; 32],
        r: *const [u8; 32],
        s: *const [u8; 32],
        v: u8,
        out: *mut PrimitivesAddress,
    ) -> c_int;

    fn primitives_secp256k1_pubkey_from_private(
        private_key: *const [u8; 32],
        out: *mut [u8; 64],
    ) -> c_int;

    fn primitives_secp256k1_validate_signature(
        r: *const [u8; 32],
        s: *const [u8; 32],
    ) -> bool;

    // Hash algorithms
    fn primitives_sha256(data: *const c_uchar, len: usize, out: *mut [u8; 32]) -> c_int;
    fn primitives_ripemd160(data: *const c_uchar, len: usize, out: *mut [u8; 20]) -> c_int;
}

// Safe wrappers

pub fn keccak256(data: &[u8]) -> Hash {
    let mut out = PrimitivesHash { bytes: [0u8; 32] };
    unsafe {
        primitives_keccak256(data.as_ptr(), data.len(), &mut out);
    }
    Hash::new(out.bytes)
}

pub fn address_to_checksum(addr: &Address) -> String {
    let c_addr = PrimitivesAddress { bytes: *addr.as_bytes() };
    let mut buf = [0u8; 42];
    unsafe {
        primitives_address_to_checksum_hex(&c_addr, buf.as_mut_ptr());
    }
    String::from_utf8_lossy(&buf).to_string()
}

pub fn calculate_create_address(sender: &Address, nonce: u64) -> Result<Address> {
    let c_sender = PrimitivesAddress { bytes: *sender.as_bytes() };
    let mut out = PrimitivesAddress { bytes: [0u8; 20] };

    let result = unsafe {
        primitives_calculate_create_address(&c_sender, nonce, &mut out)
    };

    if result != PRIMITIVES_SUCCESS {
        return Err(Error::from_ffi_code(result));
    }

    Ok(Address::new(out.bytes))
}

pub fn recover_pubkey(
    msg_hash: &[u8; 32],
    r: &[u8; 32],
    s: &[u8; 32],
    v: u8,
) -> Result<[u8; 64]> {
    let mut out = [0u8; 64];

    let result = unsafe {
        primitives_secp256k1_recover_pubkey(msg_hash, r, s, v, &mut out)
    };

    if result != PRIMITIVES_SUCCESS {
        return Err(Error::from_ffi_code(result));
    }

    Ok(out)
}

pub fn recover_address(
    msg_hash: &[u8; 32],
    r: &[u8; 32],
    s: &[u8; 32],
    v: u8,
) -> Result<Address> {
    let mut out = PrimitivesAddress { bytes: [0u8; 20] };

    let result = unsafe {
        primitives_secp256k1_recover_address(msg_hash, r, s, v, &mut out)
    };

    if result != PRIMITIVES_SUCCESS {
        return Err(Error::from_ffi_code(result));
    }

    Ok(Address::new(out.bytes))
}

pub fn pubkey_from_private(private_key: &[u8; 32]) -> Result<[u8; 64]> {
    let mut out = [0u8; 64];

    let result = unsafe {
        primitives_secp256k1_pubkey_from_private(private_key, &mut out)
    };

    if result != PRIMITIVES_SUCCESS {
        return Err(Error::from_ffi_code(result));
    }

    Ok(out)
}

pub fn validate_signature(r: &[u8; 32], s: &[u8; 32]) -> bool {
    unsafe { primitives_secp256k1_validate_signature(r, s) }
}

pub fn sha256(data: &[u8]) -> [u8; 32] {
    let mut out = [0u8; 32];
    unsafe {
        primitives_sha256(data.as_ptr(), data.len(), &mut out);
    }
    out
}

pub fn ripemd160(data: &[u8]) -> [u8; 20] {
    let mut out = [0u8; 20];
    unsafe {
        primitives_ripemd160(data.as_ptr(), data.len(), &mut out);
    }
    out
}

pub fn eip191_hash_message(message: &[u8]) -> Result<Hash> {
    let mut out = PrimitivesHash { bytes: [0u8; 32] };

    let result = unsafe {
        primitives_eip191_hash_message(message.as_ptr(), message.len(), &mut out)
    };

    if result != PRIMITIVES_SUCCESS {
        return Err(Error::from_ffi_code(result));
    }

    Ok(Hash::new(out.bytes))
}
