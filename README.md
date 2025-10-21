<div align="center">
  <h1>
    <br/>
    <br/>
    ⚡
    <br />
    primitives
    <br />
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
    <em>Ethereum primitives and cryptography for Zig.</em>
  </sup>
  <br />
  <br />
  <br />
  <br />
  <pre>zig fetch --save https://github.com/evmts/primitives</pre>
  <br />
  <br />
  <br />
  <br />
  <br />
</div>

- [**Primitives**](#primitives)
  - [`uint256`](./src/primitives/uint256.zig) &mdash; 256-bit unsigned integer with overflow-checked arithmetic
  - [`Address`](./src/primitives/address.zig) &mdash; Ethereum address type with EIP-55 checksumming
  - [`Hex`](./src/primitives/hex.zig) &mdash; hexadecimal encoding and decoding utilities
  - [`RLP`](./src/primitives/rlp.zig) &mdash; Recursive Length Prefix serialization
  - [`ABI`](./src/primitives/abi.zig) &mdash; Application Binary Interface encoding/decoding
  - [`Transaction`](./src/primitives/transaction.zig) &mdash; all transaction types (Legacy, EIP-1559, EIP-2930, EIP-4844, EIP-7702)
  - [`Logs`](./src/primitives/logs.zig) &mdash; event log structures with topic handling
    <br/>
    <br/>
- [**Cryptography**](#cryptography)
  - [`keccak256`](./src/crypto/keccak_asm.zig) &mdash; assembly-optimized Keccak-256 (via keccak-asm)
  - [`secp256k1`](./src/crypto/secp256k1.zig) &mdash; ECDSA signatures for transaction signing
  - [`BLS12-381`](./src/crypto/crypto.zig) &mdash; pairing-friendly curve operations (via BLST)
  - [`BN254`](./src/crypto/bn254/) &mdash; pure Zig alt_bn128 curve implementation
  - [`BN254 Arkworks`](./src/crypto/bn254_arkworks.zig) &mdash; audited Rust arkworks (ECMUL/ECPAIRING)
  - [`KZG`](./src/crypto/root.zig) &mdash; polynomial commitments for EIP-4844 blobs
  - [`SHA256`](./src/crypto/hash_algorithms.zig) &mdash; standard SHA-256 hashing
  - [`RIPEMD160`](./src/crypto/hash_algorithms.zig) &mdash; legacy hash function
  - [`Blake2`](./src/crypto/blake2.zig) &mdash; high-performance hashing
  - [`ModExp`](./src/crypto/modexp.zig) &mdash; modular exponentiation
    <br/>
    <br/>
- [**External Libraries**](#external-libraries)
  - [`lib/blst`](./lib/blst.zig) &mdash; BLS12-381 C implementation (via c-kzg-4844)
  - [`lib/c-kzg-4844`](./lib/c-kzg.zig) &mdash; KZG commitments (Ethereum Foundation)
  - [`lib/ark`](./lib/ark/) &mdash; BN254/BLS12-381 Rust (arkworks) - audited, production-grade
  - [`lib/keccak`](./lib/keccak/) &mdash; Keccak-256 Rust (keccak-asm) - assembly-optimized
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
