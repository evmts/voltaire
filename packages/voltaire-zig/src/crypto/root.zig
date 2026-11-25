//! Cryptographic Operations - Ethereum cryptography primitives and utilities
//!
//! This module provides the essential cryptographic functions used throughout
//! Ethereum, including hash functions, digital signatures, key generation,
//! and address derivation. It serves as the foundation for transaction
//! signing, account management, and cryptographic verification.
//!
//! ## Core Cryptographic Primitives
//!
//! ### Hash Functions
//! - **Keccak256**: Primary hash function used in Ethereum
//! - **SHA256**: Used in precompiles and some legacy operations
//! - **RIPEMD160**: Used in Bitcoin-compatible operations
//! - **Blake2b**: High-performance alternative hash function
//!
//! ### Message Authentication
//! - **HMAC**: SHA-256, SHA-512, Keccak-256, and generic streaming support
//!
//! ### Digital Signatures
//! - **ECDSA**: Elliptic Curve Digital Signature Algorithm
//! - **secp256k1**: Bitcoin/Ethereum curve for signatures
//! - **Recovery**: Public key recovery from signatures
//! - **Verification**: Signature validation and authenticity
//!
//! ### Key Management
//! - **Private Keys**: 256-bit random values for signing
//! - **Public Keys**: Derived from private keys via ECDSA
//! - **Addresses**: 160-bit identifiers derived from public keys
//! - **Deterministic Generation**: HD wallet support

// Core cryptographic modules
pub const Crypto = @import("crypto.zig");
pub const secp256k1 = @import("secp256k1.zig");
pub const constant_time = @import("constant_time.zig");
pub const p256 = @import("p256.zig");
pub const ed25519 = @import("ed25519.zig");
pub const x25519 = @import("x25519.zig");
pub const aes_gcm = @import("aes_gcm.zig");
pub const chacha20_poly1305 = @import("chacha20_poly1305.zig");
pub const keystore = @import("keystore.zig");
pub const signers = @import("signers.zig");
const modexp_module = @import("modexp.zig");
pub const ModExp = modexp_module.ModExp;

/// No declaration is skipped: every crypto file's inline tests compile and run.
const untested_decls = [_][]const u8{};

test {
    // `pub const x = @import(...)` alone never analyzes a file's tests.
    // Resolving every public declaration of this file pulls each imported
    // file into the test build (`std.testing.refAllDecls`, minus the
    // `untested_decls` list). Files with no public declaration here are
    // imported by name below.
    const std = @import("std");
    inline for (comptime std.meta.declarations(@This())) |decl| {
        const skip = comptime for (untested_decls) |name| {
            if (std.mem.eql(u8, name, decl)) break true;
        } else false;
        if (!skip) _ = &@field(@This(), decl);
    }

    _ = modexp_module;
    _ = blake2_module;
    _ = ripemd160_module;
    _ = @import("c_kzg.zig");
    _ = @import("crypto.zig");
    _ = @import("log.zig");
    _ = @import("nfkd.zig");
    _ = @import("blake2_c.zig");
    _ = @import("bn254/FpMont.zig");
    _ = @import("bn254/Fp2Mont.zig");
    _ = @import("bn254/Fp4Mont.zig");
    _ = @import("bn254/Fp6Mont.zig");
    _ = @import("bn254/Fp12Mont.zig");
    _ = @import("bn254/Fr.zig");
    _ = @import("bn254/G1.zig");
    _ = @import("bn254/G2.zig");
    _ = @import("bn254/NAF.zig");
    _ = @import("bn254/curve_parameters.zig");
    _ = @import("bn254/pairing.zig");
    _ = @import("HDWallet/hdwallet.fuzz.zig");
}

// Hash implementations
pub const Hash = @import("hash.zig");
pub const HashAlgorithms = @import("hash_algorithms.zig");
pub const HashUtils = @import("hash_utils.zig");
const blake2_module = @import("blake2.zig");
pub const Blake2 = blake2_module.Blake2;
const ripemd160_module = @import("ripemd160.zig");
pub const Ripemd160 = ripemd160_module.Ripemd160;

const hmac = @import("std").crypto.auth.hmac;

/// Construct a streaming HMAC type for a Zig standard-library compatible hash.
pub const Hmac = hmac.Hmac;
/// Write a SHA-256 authentication tag to the 32-byte output using (out, message, key).
pub const hmacSha256 = hmac.sha2.HmacSha256.create;
/// Write a SHA-512 authentication tag to the 64-byte output using (out, message, key).
pub const hmacSha512 = hmac.sha2.HmacSha512.create;
/// Write a Keccak-256 authentication tag to the 32-byte output using (out, message, key).
pub const hmacKeccak256 = Hmac(Keccak256).create;

// Ethereum standards
pub const Eip712 = @import("eip712.zig");

// Hardware acceleration
pub const CpuFeatures = @import("cpu_features.zig");
pub const SHA256_Accel = @import("sha256_accel.zig");
pub const Keccak256_Accel = @import("keccak256_accel.zig");
pub const keccak_asm = @import("keccak_asm.zig");

// Rust FFI wrappers (src/crypto/bn254_wrapper.rs, keccak_wrapper.rs) are linked
// as libcrypto_wrappers.a. Reach them through `bn254_arkworks` and `keccak_asm`.

// KZG commitments for EIP-4844
// c-kzg-4844 works in WASM as pure C (no platform-specific dependencies)
const builtin = @import("builtin");
pub const kzg_trusted_setup = @import("kzg_trusted_setup.zig");
pub const kzg_setup = @import("kzg_setup.zig");
pub const c_kzg = @import("c_kzg");

// EIP-7594 PeerDAS: cells and cell KZG proofs
pub const peerdas = @import("peerdas.zig");

// BN254 elliptic curve - dual implementations
pub const bn254 = @import("bn254.zig"); // Pure Zig implementation
pub const bn254_arkworks = if (builtin.target.cpu.arch != .wasm32)
    @import("bn254_arkworks.zig") // Rust arkworks - production-grade, audited
else
    struct {
        // Stub for WASM builds - Rust FFI not supported
        pub const BN254Error = error{NotSupported};
        pub fn init() BN254Error!void {
            return error.NotSupported;
        }
        pub fn ecmul(input: []const u8, output: []u8) BN254Error!void {
            _ = input;
            _ = output;
            return error.NotSupported;
        }
        pub fn ecpairing(input: []const u8, output: []u8) BN254Error!void {
            _ = input;
            _ = output;
            return error.NotSupported;
        }
    };

// BLS12-381 elliptic curve - full signature support
pub const bls12_381 = @import("bls12_381.zig");
// Also export the low-level FFI bindings from crypto.zig for backwards compatibility
pub const bls12_381_ffi = Crypto.bls12_381;

// BIP-39 mnemonic implementation
pub const bip39 = @import("bip39.zig");

// BIP-32 hierarchical deterministic wallets
pub const HDWallet = @import("HDWallet/hdwallet.zig");

// Export Keccak256 from std.crypto for primitives modules
pub const Keccak256 = @import("std").crypto.hash.sha3.Keccak256;

test "public HMAC matches known tags" {
    try @import("hmac_test.zig").checkKnownTags(@This());
}
