# @tevm/zig

## 0.4.0

### Minor Changes

- [#402](https://github.com/evmts/voltaire/pull/402) [`9c53e46`](https://github.com/evmts/voltaire/commit/9c53e4616ca6ed8a1c9bbee8ec1ce69a2a18e509) Thanks [@roninjin10](https://github.com/roninjin10)! - Upgrade Zig toolchain from 0.15.2 to 0.17.1 and update Zig dependencies (`z_ens_normalize`, `zbench` 0.14.1, `clap` 0.12.0).
  
  ### Breaking API Changes (`std.Io`)
  
  Functions that read the system clock, draw randomness, or read files now accept an explicit `io: std.Io` parameter following Zig 0.17's `std.Io` model:
  
  - `crypto.bls12_381.SecretKey.generate(io: std.Io)` (uses `io.randomSecure`, adds `Error.EntropyUnavailable`)
  - `crypto.bip39.generateMnemonic(io: std.Io, entropy_bits: u16, out_indices: []u11)` (uses `io.randomSecure`, adds `Bip39Error.EntropyUnavailable`)
  - `crypto.Crypto.unaudited_randomPrivateKey(io: std.Io)` (uses `io.randomSecure`)
  - `crypto.signers.LocalSigner.random(io: std.Io)`, `createRandomSigner(io: std.Io)`, and `createSigner(.{ .random = true, .io = io })`
  - `crypto.keystore.encrypt(allocator, io: std.Io, private_key, password, options)` (uses `io.randomSecure` for salt/IV, adds `KeystoreError.EntropyUnavailable`)
  - `crypto.c_kzg.loadTrustedSetupFile(io: std.Io, trusted_setup_path: []const u8, precompute: u64)`
  - `crypto.keccak_asm.benchmark_comparison(io: std.Io, data: []const u8, iterations: u32)`
  - `primitives.consensus.expectedCurrentSlot(io: std.Io, genesis_time: u64)`
  - `primitives.BundleHash.random(io: std.Io)`
  - `primitives.BeaconBlockRoot.random(io: std.Io)`
  - `primitives.Bytes.random(allocator, io: std.Io, len: usize)`
  - `primitives.Hash.random(io: std.Io)`
  - `primitives.TransactionHash.random(io: std.Io)`
  - `primitives.BlockHash.random(io: std.Io)`
  - `primitives.StorageValue.random(io: std.Io)`
  - `primitives.Hex.random(allocator, io: std.Io, size_bytes: usize)`
  - `primitives.Address.format` updated to the Zig 0.17 `*std.Io.Writer` formatter signature
  
  ### Other Changes
  
  - Replaced `@cImport` sites (`bn254_arkworks.zig`, `keccak_asm.zig`, and a standalone `lib/c_kzg_root.zig` wrapper) with `b.addTranslateC` build modules without mutating vendored `c-kzg-4844`.
  - Raised `.minimum_zig_version` in `build.zig.zon` to `"0.17.1"`.
  - Ported `build.zig`, `lib/c_libs.zig`, benchmarks, scripts, and `HDWallet/hdwallet.fuzz.zig` to Zig 0.17.1 APIs and removed unreachable broken `*.fuzz.zig` files.

## 0.3.0

### Minor Changes

- [`a7a7d94`](https://github.com/evmts/voltaire/commit/a7a7d949885a207fdcd1ac1662a352d402211080) Thanks [@roninjin10](https://github.com/roninjin10)! - Add `ReceiptManager`, an in-memory receipt store for Tevm and ZEVM dev nodes (#390). It saves receipts per block hash, looks receipts up by transaction hash (`{ receipt, blockHash, txIndex }`), and filters logs with eth_getLogs semantics: `blockHashes`, single or OR-list `address`, and positional `topics` with `null` wildcards and OR-arrays. `deleteReceipts` removes a block's receipts, logs, and transaction index entries together for reorgs, and keeps the index entry of a transaction re-included in another block.

  TypeScript: `Receipt.ReceiptManager()`. Zig: `state-manager.ReceiptManager` with allocator-owned, leak-tested storage.

- [#396](https://github.com/evmts/voltaire/pull/396) [`3b6d41a`](https://github.com/evmts/voltaire/commit/3b6d41a9dc7e3a49207086007b93b13af91188fd) Thanks [@roninjin10](https://github.com/roninjin10)! - Expose native light-client primitives and an optional synchronous fork resolver for ZEVM embedding. Preserve the asynchronous request/continue interface for existing hosts and add a focused state-manager test target.

  Correct target-specific Rust archive selection for native cross builds and enable the C API targets used by Swift/native release jobs.

- [`a7a7d94`](https://github.com/evmts/voltaire/commit/a7a7d949885a207fdcd1ac1662a352d402211080) Thanks [@roninjin10](https://github.com/roninjin10)! - Implement Fusaka/Osaka consensus core across TypeScript and Zig:

  - **EIP-7951 (`P256VERIFY` precompile at `0x0100`, Osaka+)**: 6900 fixed gas cost, strict 160-byte input (`h || r || s || qx || qy`), accepts high-s signatures (`n/2 < s < n`), raw 32-byte digest with `h mod n == 0` support, `R.x mod n == r` reduction, canonical field/curve/infinity validation, non-reverting empty output on invalid input/signature, Out-of-Gas halt when `gasLimit < 6900`, Osaka+ hardfork gating, and full 782-vector go-ethereum/Wycheproof conformance suite in both TS and Zig.
  - **EIP-7691 / EIP-7892 / EIP-7918 Blob Fee Market & BPO Schedules**: Added `BlobSchedule` presets (`cancun`, `prague`, `osaka`, `bpo1` at `1765290071`, `bpo2` at `1767747671`), hardfork and mainnet timestamp lookups, overflow-safe exact exponential blob base fee calculation (`u512` in Zig, early-exit threshold bound in TS and Zig), and EIP-7918 execution-bounded reserve-price `calculateExcessBlobGas` with 100% backwards compatibility for the 2-argument Cancun API.

- [`a7a7d94`](https://github.com/evmts/voltaire/commit/a7a7d949885a207fdcd1ac1662a352d402211080) Thanks [@roninjin10](https://github.com/roninjin10)! - Harden elliptic curve public key validation, audit and harden constant-time secret comparisons, and add the EIP-7594 PeerDAS KZG wrapper API across TypeScript and Zig:

  - **Weak Public Key Validation (#86)**: Full curve-membership, canonical-coordinate, and point-at-infinity validation for P-256 (64-byte raw, 65-byte uncompressed SEC1, and 33-byte compressed SEC1); constant-time RFC 7748 low-order point detection (`isWeakPublicKey`, covering all 14 weak byte encodings) and all-zero shared secret rejection for X25519; strict RFC 8032 canonical decoding (including negative-zero rejection), small-order rejection, and prime-order subgroup validation for Ed25519 in both TypeScript (Noble + WASM wrappers) and Zig.
  - **Constant-Time Audit & Hardening (#49)**: Added the `ConstantTime` module (`constantTimeEqual`, `constantTimeIsZero`, `constantTimeIsValidScalar`) in TypeScript and expanded `constant_time.zig` in Zig; replaced variable-time comparisons and scalar range checks across Keystore, EIP-712 (including `eip712.wasm.ts`), Secp256k1, P-256, BLS12-381, X25519, BIP-39, hash utilities, and signers, with volatile in-place secret zeroing in Zig keystore operations.
  - **EIP-7594 PeerDAS KZG API**: Exposed `computeCells`, `computeCellsAndKzgProofs`, `verifyCellKzgProofBatch`, and `recoverCellsAndKzgProofs` plus PeerDAS constants and input validation in both Zig (`peerdas.zig`, `c_kzg.zig`, and `c-kzg-4844/bindings/zig/root.zig`) and TypeScript (`KZG`). Zig calls c-kzg-4844 directly. TypeScript ships the API and input validation only: the built-in `KZG.computeCells`, `KZG.computeCellsAndKzgProofs`, `KZG.verifyCellKzgProofBatch`, and `KZG.recoverCellsAndKzgProofs` throw `KzgNotSupportedError` because the WASM loader does not export the C PeerDAS functions yet. Inject a backend (for example the `c-kzg` native package) through the `ComputeCells`, `ComputeCellsAndKzgProofs`, `VerifyCellKzgProofBatch`, and `RecoverCellsAndKzgProofs` factories until the C/WASM PeerDAS export ships.

### Patch Changes

- [`3f0245b`](https://github.com/evmts/voltaire/commit/3f0245b505b590cb48029a0920b235eb95e9b14f) Thanks [@roninjin10](https://github.com/roninjin10)! - Widen EIP-7702 `Authorization.chain_id` to `u256`, add canonical EIP-1186 MPT proof verification (including embedded `<32`-byte `.List` nodes, divergent exclusion proofs, strict terminal checks, and `OutOfMemory` propagation), fix `Rlp._decode` OOM leak, and make `JournaledState`/`StateCache` checkpoints and `StateManager` snapshots OOM-atomic.

- [`a7a7d94`](https://github.com/evmts/voltaire/commit/a7a7d949885a207fdcd1ac1662a352d402211080) Thanks [@roninjin10](https://github.com/roninjin10)! - Ship complete npm metadata, a README and a LICENSE in every published package, and stop publishing test, benchmark and stale build files.

  - `@tevm/voltaire`: add `homepage` and `bugs`; add `typesVersions` fallbacks for the 17 subpaths that lacked them (`ContractCode`, `InitCode`, `LogFilter`, `PrivateKey`, `PublicKey`, `signers`, `block`, `contract`, `transaction`, `stream`, `AesGcm`, `Bls12381`, `BN254`, `HMAC`, `Keystore`, `ModExp`, `X25519`); block `@tevm/voltaire/evm/system/lib`, which had types but no runtime module; drop compiled test declarations and stray `.js` files from `types/`.
  - `voltaire-effect`: build the `voltaire-effect/jsonrpc` entry point, which the `exports` map declared but the build never emitted; correct `repository.directory` and `homepage`; stop publishing test and benchmark sources.
  - `@tevm/zig`: add `homepage` and `bugs`; remove `files` entries that matched nothing; stop publishing benchmark sources.

- [`a7a7d94`](https://github.com/evmts/voltaire/commit/a7a7d949885a207fdcd1ac1662a352d402211080) Thanks [@roninjin10](https://github.com/roninjin10)! - Prepare for the Zig 0.17, TypeScript 7, and Effect 4 upgrades without changing the supported toolchain. `build.zig` now links through `root_module` (the `Step.Compile` helpers are removed in Zig 0.17) and follows `CARGO_TARGET_DIR`. JSDoc types that TypeScript 7 rejects are rewritten, so both packages typecheck on TypeScript 5.9.3 and 7.0.2. Migration guides: `docs/MIGRATION_ZIG_017.md`, `docs/TOOLCHAIN_UPGRADE_PLAN.md`, `packages/voltaire-effect/EFFECT_V4_MIGRATION.md`.

- [`a7a7d94`](https://github.com/evmts/voltaire/commit/a7a7d949885a207fdcd1ac1662a352d402211080) Thanks [@roninjin10](https://github.com/roninjin10)! - Update vendored c-kzg-4844 to v2.1.8 and blst to v0.3.17 from the official release tarballs. Drop blst's `.github` workflows from the vendored tree. Build paths and C flags are unchanged.

- [`a7a7d94`](https://github.com/evmts/voltaire/commit/a7a7d949885a207fdcd1ac1662a352d402211080) Thanks [@roninjin10](https://github.com/roninjin10)! - Upgrade the Rust crypto dependencies to arkworks 0.6.0 and keccak-asm 0.1.9 while preserving the Zig FFI signatures.

- [`a7a7d94`](https://github.com/evmts/voltaire/commit/a7a7d949885a207fdcd1ac1662a352d402211080) Thanks [@roninjin10](https://github.com/roninjin10)! - Harden Zig signing, constant-time helpers, and the KZG trusted setup lifecycle:

  - `unaudited_signHash` computes `s = k^-1 (e + r d) mod n` with constant-time `std.crypto.ecc.Secp256k1.scalar.Scalar` arithmetic instead of variable-time `mulmod`/`addmod`/`invmod`. RFC 6979 nonce generation reduces the hash mod `n` (`bits2octets`) and wipes `data`, `k`, `v`, `t`, and `candidate_k`.
  - `constantTimeEqBytes` and `constantTimeIsZeroBytes` use a volatile accumulator so the optimizer cannot add an early exit. P-256 `ecdh` wipes the secret scalar and shared point. BIP-39 word lookup compares fixed 9-byte padded buffers, so dictionary word length no longer affects timing.
  - c-kzg bindings: `loadTrustedSetupFile` returns `BadArgs` for paths of 256+ bytes or with an embedded NUL. `verifyKZGProof`, `computeBlobKZGProof`, and `verifyBlobKZGProof` return `TrustedSetupNotLoaded` instead of panicking. A binding-owned `RwLock` is held exclusively across load and free and shared across every C call, so freeing the setup waits for in-flight computations and verifications (including PeerDAS).

- [`8b51368`](https://github.com/evmts/voltaire/commit/8b5136835ce40c887ad579ec07137c82199a7eeb) Thanks [@roninjin10](https://github.com/roninjin10)! - Make exported modules build their Rust crypto archive before linking in downstream projects, including Guillotine Mini WASM. Run WASM archive filtering from Voltaire's root and include its script in the Zig package so dependency builds work from other working directories.
