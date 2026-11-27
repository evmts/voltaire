---
title: "Cryptography and Constant-Time Safety"
tags: [crypto, security, zig, rust, constant-time]
kind: current
owner: evmts
---

# Cryptography and Constant-Time Safety

Cryptographic code in Voltaire (`packages/voltaire-zig/src/crypto/` and `packages/voltaire-ts/src/crypto/`) is mission-critical infrastructure. Every modification to cryptographic code paths is protected by `protectedPaths` in `.smithers/FACTORY.ts` and reviewed under the `safety` lens in `.smithers/flows/checks/review/flow.mdx`.

## Cryptographic Stack

- **Hashing:** Keccak256 (including 2-way ARMv8.2 hardware acceleration), SHA256, RIPEMD160, Blake2b (`blake2.zig`, `blake2_c.zig`)
- **Elliptic Curves & Signatures:**
  - secp256k1 (4-limb arithmetic, SafeGCD modular inverse, ECDSA signing & recovery)
  - P256 (`EIP-7951` / secp256r1) and Ed25519
  - BLS12-381 (`bls12_381.zig` over audited `blst`)
  - BN254 / alt_bn128 (`bn254.zig`, `bn254_arkworks.zig`, `bn254_wrapper.rs` via Cargo)
- **Commitments & Typed Data:** KZG 4844 (`c_kzg.zig` over `c-kzg-4844`), EIP-712 (`eip712.zig`), BIP-39 (`bip39.zig`), HDWallet
- **Symmetric Encryption:** AES-GCM (`aes_gcm.zig`), ChaCha20-Poly1305 (`chacha20_poly1305.zig`)

## Safety Invariants

1. Constant-time helpers live in `packages/voltaire-zig/src/crypto/constant_time.zig`; secret-dependent branches or table lookups are forbidden.
2. Production Zig code must return explicit error unions rather than calling `@panic` or `catch unreachable`.
3. Production Rust FFI wrappers (`bn254_wrapper.rs`, Cargo workspace) must never call `.unwrap()` or `panic!()` across FFI boundaries.
4. Nightly automated security audits run via `.smithers/flows/security-audit/flow.mdx`.

## Related Pages

- [[architecture]]
- [[primitives]]
- [[backpressure-and-audits]]
- [[factory-and-mcp]]
