<div align="center">
  <h1>
    Ethereum primitives and cryptography for Zig.
    <br/>
    <br/>
    <img width="1024" height="1024" alt="image" src="https://github.com/user-attachments/assets/492fabbc-d8d0-4f5b-b9f5-ea05adc5f8ca" />
    <br />
    <br />
    <br />
  </h1>
  <sup>
    <br />
    <br />
    <a href="https://github.com/evmts/primitives">
       <img src="https://img.shields.io/badge/zig-0.15.1+-orange.svg" alt="zig version" />
    </a>
    <a href="https://github.com/evmts/primitives/actions">
      <img src="https://img.shields.io/badge/build-passing-brightgreen.svg" alt="build status" />
    </a>
    <a href="https://github.com/evmts/primitives">
      <img src="https://img.shields.io/badge/tests-passing-brightgreen.svg" alt="tests" />
    </a>
    <br />
  </sup>
  <br />
  <br />
  <pre>zig fetch --save https://github.com/evmts/primitives</pre>
  <br />
  <br />
  <br />
</div>

- [**Ethereum primitives**](#primitives)
  - [`uint256`](./src/primitives/uint256.zig) &mdash; 256-bit unsigned integer with overflow-checked arithmetic
  - [`Address`](./src/primitives/address.zig) &mdash; Ethereum address type with EIP-55 checksumming
  - [`Hex`](./src/primitives/hex.zig) &mdash; hexadecimal encoding and decoding utilities
  - [`RLP`](./src/primitives/rlp.zig) &mdash; Recursive Length Prefix serialization
  - [`ABI`](./src/primitives/abi.zig) &mdash; Application Binary Interface encoding/decoding
  - [`Transaction`](./src/primitives/transaction.zig) &mdash; all transaction types (Legacy, EIP-1559, EIP-2930, EIP-4844, EIP-7702)
  - [`Logs`](./src/primitives/logs.zig) &mdash; event log structures with topic handling
  - [`Bytecode`](./src/primitives/bytecode.zig) &mdash; EVM bytecode utilities with jump destination analysis
  - [`Opcode`](./src/primitives/opcode.zig) &mdash; EVM opcode enumeration with utility methods
  - [`OpcodeInfo`](./src/primitives/opcode_info.zig) &mdash; gas costs and stack metadata for all opcodes
  - [`Hardfork`](./src/primitives/hardfork.zig) &mdash; Ethereum hardfork identifiers with version comparison
  - [`Trie`](./src/primitives/trie.zig) &mdash; Merkle Patricia Trie for state storage with proof generation
    <br/>
    <br/>
- [**Cryptography primitives**](#cryptography)
  - [`keccak256`](./src/crypto/keccak_asm.zig) &mdash; assembly-optimized Keccak-256 (via keccak-asm)
  - [`secp256k1`](./src/crypto/secp256k1.zig) &mdash; ECDSA signatures for transaction signing
  - [`BLS12-381`](./src/crypto/crypto.zig) &mdash; pairing-friendly curve operations (via BLST)
  - [`BN254`](./src/crypto/bn254/) &mdash; pure Zig alt_bn128 curve implementation
  - [`BN254 Arkworks`](./src/crypto/bn254_arkworks.zig) &mdash; audited Rust arkworks (ECMUL/ECPAIRING)
  - [`KZG`](./src/crypto/root.zig) &mdash; polynomial commitments for EIP-4844 blobs
  - [`KZG Trusted Setup`](./src/crypto/kzg_trusted_setup.zig) &mdash; embedded trusted setup data
  - [`KZG Setup`](./src/crypto/kzg_setup.zig) &mdash; thread-safe initialization and management
  - [`SHA256`](./src/crypto/hash_algorithms.zig) &mdash; standard SHA-256 hashing
  - [`RIPEMD160`](./src/crypto/hash_algorithms.zig) &mdash; legacy hash function
  - [`Blake2`](./src/crypto/blake2.zig) &mdash; high-performance hashing
  - [`ModExp`](./src/crypto/modexp.zig) &mdash; modular exponentiation
    <br/>
    <br/>
- [**Ethereum precompiles**](#precompiles)
  - [`ECRECOVER`](./src/precompiles/ecrecover.zig) &mdash; 0x01: recover signer address from signature
  - [`SHA256`](./src/precompiles/sha256.zig) &mdash; 0x02: SHA-256 hash function
  - [`RIPEMD160`](./src/precompiles/ripemd160.zig) &mdash; 0x03: RIPEMD-160 hash function
  - [`IDENTITY`](./src/precompiles/identity.zig) &mdash; 0x04: identity/copy function
  - [`MODEXP`](./src/precompiles/modexp.zig) &mdash; 0x05: modular exponentiation
  - [`ECADD`](./src/precompiles/bn254_add.zig) &mdash; 0x06: BN254 elliptic curve addition
  - [`ECMUL`](./src/precompiles/bn254_mul.zig) &mdash; 0x07: BN254 elliptic curve multiplication
  - [`ECPAIRING`](./src/precompiles/bn254_pairing.zig) &mdash; 0x08: BN254 pairing check
  - [`BLAKE2F`](./src/precompiles/blake2f.zig) &mdash; 0x09: Blake2b compression function
  - [`POINT_EVALUATION`](./src/precompiles/point_evaluation.zig) &mdash; 0x0A: KZG point evaluation (EIP-4844)
  - [`BLS12_G1ADD`](./src/precompiles/bls12_g1_add.zig) &mdash; 0x0B: BLS12-381 G1 addition
  - [`BLS12_G1MUL`](./src/precompiles/bls12_g1_mul.zig) &mdash; 0x0C: BLS12-381 G1 multiplication
  - [`BLS12_G1MSM`](./src/precompiles/bls12_g1_msm.zig) &mdash; 0x0D: BLS12-381 G1 multi-scalar multiplication
  - [`BLS12_G2ADD`](./src/precompiles/bls12_g2_add.zig) &mdash; 0x0E: BLS12-381 G2 addition
  - [`BLS12_G2MUL`](./src/precompiles/bls12_g2_mul.zig) &mdash; 0x0F: BLS12-381 G2 multiplication
  - [`BLS12_G2MSM`](./src/precompiles/bls12_g2_msm.zig) &mdash; 0x10: BLS12-381 G2 multi-scalar multiplication
  - [`BLS12_PAIRING`](./src/precompiles/bls12_pairing.zig) &mdash; 0x11: BLS12-381 pairing check
  - [`BLS12_MAP_FP_TO_G1`](./src/precompiles/bls12_map_fp_to_g1.zig) &mdash; 0x12: BLS12-381 map field to G1
  - [`BLS12_MAP_FP2_TO_G2`](./src/precompiles/bls12_map_fp2_to_g2.zig) &mdash; 0x13: BLS12-381 map field to G2
    <br/>
    <br/>
<br />
<br />
<br />
<br />
<br />
<br />
<br />

<p align="center">
  <a href="./CLAUDE.md"><strong>Development</strong></a> &mdash; coding standards and guidelines.
  <br />
  <a href="./CONTRIBUTING.md"><strong>Contributing</strong></a> &mdash; how to contribute.
  <br />
  <a href="./src/README.md"><strong>Documentation</strong></a> &mdash; source code organization.
</p>

<br />
<br />
<br />
<br />
<br />
