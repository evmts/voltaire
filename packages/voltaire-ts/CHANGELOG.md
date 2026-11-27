# @tevm/voltaire

## 0.6.1

### Patch Changes

- Wire prebuilt native platform packages (`@tevm/voltaire-{darwin-arm64,darwin-x64,linux-arm64,linux-x64,win32-x64}@0.6.1`) into `optionalDependencies` on npm publication so `npm install @tevm/voltaire` installs prebuilt native Zig shared libraries automatically without racing npm's async registry propagation queue.
- Publish all `@tevm/voltaire` and `@tevm/voltaire-<platform>` packages via npm OIDC Trusted Publishing and automatically attach verified C99 ABI release tarballs + `SHA256SUMS.txt` to GitHub Releases.

## 0.6.0

### Minor Changes

- **Zero competitor / chain-registry runtime deps**: Removed `ox` and `@tevm/chains` from runtime `dependencies` (native pure-JS `Base64`, canonical `Rlp`, EIP-4361 `Siwe`, `EventLog` RPC, `EIP712.validate`, and self-contained `Chain` registry with 17 canonical EVM chains).
- **Sub-350 kB real WASM backend (`@tevm/voltaire/wasm`)**: Reduced `primitives.wasm` from 1.25 MB to **336.7 kB raw (117.4 kB gzip)** by splitting the 788 KB KZG trusted setup into a lazy runtime loader (`kzgLoadTrustedSetupBytes` / lazy Node-Bun auto-load). `@tevm/voltaire/wasm` now executes real Zig WASM synchronously in Node/Bun (and after `await initWasm()` in browsers) instead of falling back to pure JS, and subpath WASM imports (`Keccak256/wasm`, `Blake2`, `Ripemd160`) load standalone 1.5–3.1 kB micro-WASMs.
- **Synchronous Native Zig FFI (`@tevm/voltaire/native`) & cross-platform binary packaging**: Replaced the async-only Keccak native shim with synchronous drop-in Zig FFI across 13 crypto modules (`Keccak256`, `SHA256`, `Blake2`, `Ripemd160`, `Secp256k1`, `P256`, `Ed25519`, `X25519`, `AesGcm`, `KZG`, `BN254`, `Bls12381`, `ModExp`, 137 C ABI symbols), plus automated `@tevm/voltaire-<platform>` (`darwin-arm64`, `darwin-x64`, `linux-x64`, `linux-arm64`, `win32-x64`) and C99 ABI tarball release packaging.
- **TypeScript soundness & API consistency (#67, #100, #300)**: Eliminated all 193 `@ts-nocheck`/`@ts-ignore`/`@ts-expect-error` suppressions and all 159 explicit `any` usages (Uphill TypeScript Quality 184/184 pass across `console-policy`, `explicit-any`, and `ts-suppressions`); standardized all `Uint8`–`Uint256` widths on checked-throw arithmetic by default with explicit `*Wrapping` / `*Checked` methods (#67); hardened `from()` input validation across all core primitives (#100); added viem-compatible `{ format: "viem" }` option to `Abi.decodeParameters` alongside `Abi.decodeAbiParameters` (#300).
- **Ethereum Yellow Paper MPT fix & Spec Compliance**: Fixed inline `< 32`-byte child node RLP embedding in `Trie/hashNode.js`, added 1,000+ official Ethereum Execution Spec + Wycheproof compliance vectors (`spec-compliance.mdx`), added reproducible multi-workload benchmarks vs `viem`, `ox`, and `ethers` (`benchmarks.mdx`), upgraded `apps/playground` with 4 showcase demos, and added Context7 indexing (`context7.json`, #330).

## 0.5.1

### Patch Changes

- [#402](https://github.com/evmts/voltaire/pull/402) [`9c53e46`](https://github.com/evmts/voltaire/commit/9c53e4616ca6ed8a1c9bbee8ec1ce69a2a18e509) Thanks [@roninjin10](https://github.com/roninjin10)! - Upgrade JavaScript/TypeScript dependencies and toolchain:
  - `@tevm/voltaire`: upgrade runtime dependency `ox` from `^0.11.1` to `^1.9.0` (preserving multiline statement and field-level error semantics in `Siwe.parse`), and upgrade dev toolchain (`typescript@^6.0.3`, `vitest@5.1.2`, `tsup@^9.0.0`, `@biomejs/biome@^2.6.9`).

## 0.5.0

### Minor Changes

- [`a7a7d94`](https://github.com/evmts/voltaire/commit/a7a7d949885a207fdcd1ac1662a352d402211080) Thanks [@roninjin10](https://github.com/roninjin10)! - Add Amsterdam (Glamsterdam) primitives in TypeScript and Zig.
  - `BlockAccessList` implements EIP-7928 block-level access lists:
    `AccountChanges`, `SlotChanges`, `StorageChange`, `BalanceChange`,
    `NonceChange`, and `CodeChange`, with canonical RLP encoding, strict RLP
    decoding, validation of ordering and uniqueness, and the
    `keccak256(rlp(list))` header commitment. TypeScript and Zig assert the same
    byte vector and hash.
  - `BlockHeader` accepts an optional `blockAccessListHash`
    (`block_access_list_hash` in Zig) and hashes it as the 22nd RLP field, after
    `requestsHash`. Headers without the field encode and hash as before.
  - `GasConstants` exports the EIP-8037 state gas and EIP-8038 state access
    parameters under an `Amsterdam` prefix. Both EIPs were in Last Call when
    recorded; existing constants are unchanged.
  - `ExecutionPayloadBid` adds the EIP-7732 (ePBS) `ExecutionPayloadBid` and
    `SignedExecutionPayloadBid` types with length- and range-checking
    constructors (TypeScript only).

- [`a7a7d94`](https://github.com/evmts/voltaire/commit/a7a7d949885a207fdcd1ac1662a352d402211080) Thanks [@roninjin10](https://github.com/roninjin10)! - Accept human-readable signatures in `Abi()` and `Abi.from()`, alone or mixed
  with JSON items (`"function transfer(address to, uint256 amount) returns (bool)"`).
  `Abi.parseHumanReadable` and the `parseHumanReadable` export parse signatures,
  including `struct` declarations, into JSON ABI items; malformed input throws
  `AbiParseError`. `Abi.from()` now returns a typed `Abi` instead of `any`. (#320)

  Add `Transaction.serializeUnsigned` and `Transaction.deserializeUnsigned` for the
  signing payload of legacy (with EIP-155 chain ID) and typed 1, 2, 3 and 4
  transactions. Signature fields on the input are ignored, so a signed transaction
  yields its unsigned envelope. (#292)

- [`a7a7d94`](https://github.com/evmts/voltaire/commit/a7a7d949885a207fdcd1ac1662a352d402211080) Thanks [@roninjin10](https://github.com/roninjin10)! - Add `ReceiptManager`, an in-memory receipt store for Tevm and ZEVM dev nodes (#390). It saves receipts per block hash, looks receipts up by transaction hash (`{ receipt, blockHash, txIndex }`), and filters logs with eth_getLogs semantics: `blockHashes`, single or OR-list `address`, and positional `topics` with `null` wildcards and OR-arrays. `deleteReceipts` removes a block's receipts, logs, and transaction index entries together for reorgs, and keeps the index entry of a transaction re-included in another block.

  TypeScript: `Receipt.ReceiptManager()`. Zig: `state-manager.ReceiptManager` with allocator-owned, leak-tested storage.

- [`a7a7d94`](https://github.com/evmts/voltaire/commit/a7a7d949885a207fdcd1ac1662a352d402211080) Thanks [@roninjin10](https://github.com/roninjin10)! - Make Uint overflow behavior explicit across sizes and add a viem-compatible ABI parameter decoder.

  **Uint overflow (#67).** Every Uint size (`Uint8`, `Uint16`, `Uint32`, `Uint64`, `Uint128`, `Uint`/`Uint256`) now exports the same six functions:
  - `plusChecked`, `minusChecked`, `timesChecked`: throw a subclass of `IntegerOverflowError` or `IntegerUnderflowError` when the exact result does not fit.
  - `plusWrapping`, `minusWrapping`, `timesWrapping`: return the result modulo 2^bits and never throw.

  `plus`, `minus`, and `times` are unchanged: Uint8 and Uint16 throw, Uint32 and wider wrap. Their JSDoc and the Uint256 docs now state the mode. Use the explicit functions in code that handles more than one Uint size.

  **ABI decoding (#300).** `Abi.decodeParameters` is unchanged and its Voltaire-native output is now pinned by regression tests: always an array with one entry per parameter (including one output and empty inputs), lowercase address strings, `Uint8Array` bytes, `bigint` integers, and arrays for tuples.

  New `Abi.decodeAbiParameters(params, data)` returns what viem's `decodeAbiParameters` returns: EIP-55 checksummed addresses, hex strings for `bytes`/`bytesN`, `number` for integers up to 48 bits and `bigint` above, objects for tuples whose components are all named, and arrays for tuples with any unnamed component. It accepts `Uint8Array` or hex input. `Abi.DecodeAbiParameters({ keccak256 })` is the factory form. Errors remain Voltaire's `AbiDecodingError`, not viem's error classes.

- [`a7a7d94`](https://github.com/evmts/voltaire/commit/a7a7d949885a207fdcd1ac1662a352d402211080) Thanks [@roninjin10](https://github.com/roninjin10)! - Expose Osaka's EIP-7939 CLZ opcode (0x1e), including its name, five-gas cost,
  one-input/one-output stack contract, classification and disassembly. The Zig
  opcode metadata and hardfork EIP registry now describe the same instruction.

- [`a7a7d94`](https://github.com/evmts/voltaire/commit/a7a7d949885a207fdcd1ac1662a352d402211080) Thanks [@roninjin10](https://github.com/roninjin10)! - Set Osaka as the default hardfork and document its mainnet activation. Add
  Amsterdam and its `glamsterdam` alias, and update Zig's Prague, Osaka, and
  Amsterdam EIP registry. Export the EIP-7934 block size constants and an 8 MiB
  limit check for RLP-encoded execution blocks in TypeScript and Zig.

- [`a7a7d94`](https://github.com/evmts/voltaire/commit/a7a7d949885a207fdcd1ac1662a352d402211080) Thanks [@roninjin10](https://github.com/roninjin10)! - Implement Osaka ModExp operand bounds and gas pricing in Zig and TypeScript.
  Both TypeScript gas helpers accept an optional branded hardfork, defaulting to
  Berlin for compatibility. The precompile dispatcher forwards the selected fork.
  Export Zig's Osaka minimum gas and operand-length limit through the existing
  ModExp module. Preserve historical pricing and right-padded input behavior,
  and reject oversized operands before empty-output shortcuts.

- [`a7a7d94`](https://github.com/evmts/voltaire/commit/a7a7d949885a207fdcd1ac1662a352d402211080) Thanks [@roninjin10](https://github.com/roninjin10)! - Implement Fusaka/Osaka consensus core across TypeScript and Zig:
  - **EIP-7951 (`P256VERIFY` precompile at `0x0100`, Osaka+)**: 6900 fixed gas cost, strict 160-byte input (`h || r || s || qx || qy`), accepts high-s signatures (`n/2 < s < n`), raw 32-byte digest with `h mod n == 0` support, `R.x mod n == r` reduction, canonical field/curve/infinity validation, non-reverting empty output on invalid input/signature, Out-of-Gas halt when `gasLimit < 6900`, Osaka+ hardfork gating, and full 782-vector go-ethereum/Wycheproof conformance suite in both TS and Zig.
  - **EIP-7691 / EIP-7892 / EIP-7918 Blob Fee Market & BPO Schedules**: Added `BlobSchedule` presets (`cancun`, `prague`, `osaka`, `bpo1` at `1765290071`, `bpo2` at `1767747671`), hardfork and mainnet timestamp lookups, overflow-safe exact exponential blob base fee calculation (`u512` in Zig, early-exit threshold bound in TS and Zig), and EIP-7918 execution-bounded reserve-price `calculateExcessBlobGas` with 100% backwards compatibility for the 2-argument Cancun API.

- [`a7a7d94`](https://github.com/evmts/voltaire/commit/a7a7d949885a207fdcd1ac1662a352d402211080) Thanks [@roninjin10](https://github.com/roninjin10)! - Export EIP-7825's Osaka transaction gas limit as `GasConstants.TxGasLimitOsaka`
  in TypeScript and Zig for shared admission and execution validation.

- [`a7a7d94`](https://github.com/evmts/voltaire/commit/a7a7d949885a207fdcd1ac1662a352d402211080) Thanks [@roninjin10](https://github.com/roninjin10)! - Harden elliptic curve public key validation, audit and harden constant-time secret comparisons, and add the EIP-7594 PeerDAS KZG wrapper API across TypeScript and Zig:
  - **Weak Public Key Validation (#86)**: Full curve-membership, canonical-coordinate, and point-at-infinity validation for P-256 (64-byte raw, 65-byte uncompressed SEC1, and 33-byte compressed SEC1); constant-time RFC 7748 low-order point detection (`isWeakPublicKey`, covering all 14 weak byte encodings) and all-zero shared secret rejection for X25519; strict RFC 8032 canonical decoding (including negative-zero rejection), small-order rejection, and prime-order subgroup validation for Ed25519 in both TypeScript (Noble + WASM wrappers) and Zig.
  - **Constant-Time Audit & Hardening (#49)**: Added the `ConstantTime` module (`constantTimeEqual`, `constantTimeIsZero`, `constantTimeIsValidScalar`) in TypeScript and expanded `constant_time.zig` in Zig; replaced variable-time comparisons and scalar range checks across Keystore, EIP-712 (including `eip712.wasm.ts`), Secp256k1, P-256, BLS12-381, X25519, BIP-39, hash utilities, and signers, with volatile in-place secret zeroing in Zig keystore operations.
  - **EIP-7594 PeerDAS KZG API**: Exposed `computeCells`, `computeCellsAndKzgProofs`, `verifyCellKzgProofBatch`, and `recoverCellsAndKzgProofs` plus PeerDAS constants and input validation in both Zig (`peerdas.zig`, `c_kzg.zig`, and `c-kzg-4844/bindings/zig/root.zig`) and TypeScript (`KZG`). Zig calls c-kzg-4844 directly. TypeScript ships the API and input validation only: the built-in `KZG.computeCells`, `KZG.computeCellsAndKzgProofs`, `KZG.verifyCellKzgProofBatch`, and `KZG.recoverCellsAndKzgProofs` throw `KzgNotSupportedError` because the WASM loader does not export the C PeerDAS functions yet. Inject a backend (for example the `c-kzg` native package) through the `ComputeCells`, `ComputeCellsAndKzgProofs`, `VerifyCellKzgProofBatch`, and `RecoverCellsAndKzgProofs` factories until the C/WASM PeerDAS export ships.

### Patch Changes

- [`a7a7d94`](https://github.com/evmts/voltaire/commit/a7a7d949885a207fdcd1ac1662a352d402211080) Thanks [@roninjin10](https://github.com/roninjin10)! - Ship complete npm metadata, a README and a LICENSE in every published package, and stop publishing test, benchmark and stale build files.
  - `@tevm/voltaire`: add `homepage` and `bugs`; add `typesVersions` fallbacks for the 17 subpaths that lacked them (`ContractCode`, `InitCode`, `LogFilter`, `PrivateKey`, `PublicKey`, `signers`, `block`, `contract`, `transaction`, `stream`, `AesGcm`, `Bls12381`, `BN254`, `HMAC`, `Keystore`, `ModExp`, `X25519`); block `@tevm/voltaire/evm/system/lib`, which had types but no runtime module; drop compiled test declarations and stray `.js` files from `types/`.
  - `voltaire-effect`: build the `voltaire-effect/jsonrpc` entry point, which the `exports` map declared but the build never emitted; correct `repository.directory` and `homepage`; stop publishing test and benchmark sources.
  - `@tevm/zig`: add `homepage` and `bugs`; remove `files` entries that matched nothing; stop publishing benchmark sources.

- [`a7a7d94`](https://github.com/evmts/voltaire/commit/a7a7d949885a207fdcd1ac1662a352d402211080) Thanks [@roninjin10](https://github.com/roninjin10)! - Prepare for the Zig 0.17, TypeScript 7, and Effect 4 upgrades without changing the supported toolchain. `build.zig` now links through `root_module` (the `Step.Compile` helpers are removed in Zig 0.17) and follows `CARGO_TARGET_DIR`. JSDoc types that TypeScript 7 rejects are rewritten, so both packages typecheck on TypeScript 5.9.3 and 7.0.2. Migration guides: `docs/MIGRATION_ZIG_017.md`, `docs/TOOLCHAIN_UPGRADE_PLAN.md`, `packages/voltaire-effect/EFFECT_V4_MIGRATION.md`.

- [`a7a7d94`](https://github.com/evmts/voltaire/commit/a7a7d949885a207fdcd1ac1662a352d402211080) Thanks [@roninjin10](https://github.com/roninjin10)! - Update Noble and Scure cryptography dependencies and refresh WhatsABI, ABIType, Biome, viem, and ethers. Remove the unused Smithers development dependency and the BIP39 patch now that the Traditional Chinese wordlist export is fixed upstream.

- [`a7a7d94`](https://github.com/evmts/voltaire/commit/a7a7d949885a207fdcd1ac1662a352d402211080) Thanks [@roninjin10](https://github.com/roninjin10)! - Fix ABI decoding of fixed-size arrays and `BinaryTree` lookups below internal nodes.
  - `Abi.decodeParameters` now advances past static fixed-size arrays by their full static size, so parameters after `uint256[2][3]` or a static `tuple[N]` decode from the correct offset (#72).
  - `tuple[N]` whose tuple has a dynamic component (for example `(uint256,string)[2]`) is now treated as dynamic and decoded through its offset word (#72).
  - `BinaryTree` internal nodes now keep their child subtrees (`leftChild`/`rightChild`) next to the cached child hashes. `BinaryTree.get` walks internal nodes instead of returning `null`, and `BinaryTree.insert` adds keys below an existing internal node instead of throwing. A hash-only (pruned) child with a non-zero hash throws `InvalidTreeStateError`; root hashes are unchanged (#58).

- [`a7a7d94`](https://github.com/evmts/voltaire/commit/a7a7d949885a207fdcd1ac1662a352d402211080) Thanks [@roninjin10](https://github.com/roninjin10)! - Fix `FeeMarket.gweiToWei` returning one wei too little for decimal inputs such as
  `2.01` and `33.3`. Convert the input's decimal representation exactly and floor
  any fractional wei. See [issue #399](https://github.com/evmts/voltaire/issues/399).

- [`a7a7d94`](https://github.com/evmts/voltaire/commit/a7a7d949885a207fdcd1ac1662a352d402211080) Thanks [@roninjin10](https://github.com/roninjin10)! - Expose the JavaScript HDWallet API from `@tevm/voltaire` and include its live
  service in `CryptoLive`. Keep libwally mnemonic operations available through
  `@tevm/voltaire/native`. Verify that Zig's blockchain module re-exports
  `Blockchain.BlockTag`.

- [`a7a7d94`](https://github.com/evmts/voltaire/commit/a7a7d949885a207fdcd1ac1662a352d402211080) Thanks [@roninjin10](https://github.com/roninjin10)! - Harden keystore decryption and BIP-32 index parsing:
  - `Keystore.decrypt` throws `DecryptionError` unless `cipher` is `aes-128-ctr`, the IV is 16 bytes, the MAC is 32 bytes, and `dklen` is an integer >= 32. A forged keystore with `dklen: 16` previously produced an empty MAC key, so `mac = keccak256(ciphertext)` passed for any password.
  - `HDWallet.parseIndex` accepts only a whole decimal integer in `[0, 2^31 - 1]` with an optional `'`, `h`, or `H` suffix. It now throws `InvalidPathError` for `"1.5"`, `"1abc"`, `"0x10"`, and indices >= 2^31, which it previously truncated or passed through.

- [`a7a7d94`](https://github.com/evmts/voltaire/commit/a7a7d949885a207fdcd1ac1662a352d402211080) Thanks [@roninjin10](https://github.com/roninjin10)! - Fix `P256.sign` and `P256.verify` hashing `messageHash` a second time. Both now pass `prehash: false` to `@noble/curves`, so `P256.sign(sha256(msg), key)` produces the standard ECDSA signature over `sha256(msg)`. Signatures now verify under EIP-7951 `P256VERIFY`, WebAuthn, and the Zig implementation, and match RFC 6979 A.2.5 test vectors.
  - `P256.sign` rejects private keys outside `[1, n-1]` with `InvalidPrivateKeyError` (constant-time check). Callers cannot re-enable prehashing through `options`.
  - `P256.verify` accepts high-S signatures (`lowS: false`), matching EIP-7951 and WebAuthn. P-256 has no low-S rule.

  **Breaking for stored signatures:** a signature produced by an earlier `P256.sign` signed `sha256(messageHash)` and no longer verifies against `messageHash`. Re-sign, or verify it against `sha256(messageHash)`.

- [`a7a7d94`](https://github.com/evmts/voltaire/commit/a7a7d949885a207fdcd1ac1662a352d402211080) Thanks [@roninjin10](https://github.com/roninjin10)! - Install fewer packages with `@tevm/voltaire`. Remove Sandpack and Monaco from the runtime dependencies, drop the unused `@shazow/whatsabi` dependency, and move the test-only `@noble/secp256k1` to `devDependencies`. A fresh `npm install @tevm/voltaire` now adds 19 packages instead of 82. See [issue #391](https://github.com/evmts/voltaire/issues/391).

- [#396](https://github.com/evmts/voltaire/pull/396) [`3b6d41a`](https://github.com/evmts/voltaire/commit/3b6d41a9dc7e3a49207086007b93b13af91188fd) Thanks [@roninjin10](https://github.com/roninjin10)! - Expose native light-client primitives and an optional synchronous fork resolver for ZEVM embedding. Preserve the asynchronous request/continue interface for existing hosts and add a focused state-manager test target.

  Correct target-specific Rust archive selection for native cross builds and enable the C API targets used by Swift/native release jobs.

- [`a7a7d94`](https://github.com/evmts/voltaire/commit/a7a7d949885a207fdcd1ac1662a352d402211080) Thanks [@roninjin10](https://github.com/roninjin10)! - Preserve EIP-7685 execution-requests hashes in Prague and Osaka block headers,
  RPC conversion, hashing, and Zig RLP encoding/decoding. Verify the public
  TypeScript hash against an execution-specs tests@v20.0.2 Osaka fixture.

  Zig header decoding now preserves `extra_data`. The caller owns this returned
  slice and must free it with the allocator passed to `rlpDecode`.

## 0.4.0

### Minor Changes

- [`20b3b59`](https://github.com/evmts/voltaire/commit/20b3b5954796d960ca61b9ea7b38e07987790fe3) Thanks [@roninjin10](https://github.com/roninjin10)! - Add Merkle Patricia Trie primitive with put, get, delete, prove, and verify operations

### Patch Changes

- [`20b3b59`](https://github.com/evmts/voltaire/commit/20b3b5954796d960ca61b9ea7b38e07987790fe3) Thanks [@roninjin10](https://github.com/roninjin10)! - Fix docs examples to use real mainnet values and public endpoints

- [`20b3b59`](https://github.com/evmts/voltaire/commit/20b3b5954796d960ca61b9ea7b38e07987790fe3) Thanks [@roninjin10](https://github.com/roninjin10)! - Fix all lint errors, TS2742 type annotation errors, and regenerate type definitions

- [`20b3b59`](https://github.com/evmts/voltaire/commit/20b3b5954796d960ca61b9ea7b38e07987790fe3) Thanks [@roninjin10](https://github.com/roninjin10)! - Fix type soundness bugs in public API: all toHex() returns HexType, brand symbol exported from main entrypoint, ABI bytes mapped to Uint8Array, dead bun:ffi NativeExports removed, Domain chainId unified on ChainIdType

## 0.2.29

### Patch Changes

- [`7217d2d`](https://github.com/evmts/voltaire/commit/7217d2d52772469a4d4261d88071d11560a3c45a) Thanks [@roninjin10](https://github.com/roninjin10)! - Fixing bad publish
