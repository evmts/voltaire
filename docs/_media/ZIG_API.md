# Zig API Reference

This document covers the native Zig implementation of Ethereum primitives and cryptography. For TypeScript/JavaScript usage, see the [main README](./README.md).

## Requirements

[Zig 0.15.1+](https://ziglang.org/download/) — [Cargo (Rust)](https://www.rust-lang.org/tools/install)

## Installation

**Recommended:** Build from source

```bash
git clone https://github.com/evmts/primitives.git
cd primitives
zig build
```

**Note:** Requires [Cargo (Rust)](https://www.rust-lang.org/tools/install) to be installed. The build system will automatically compile Rust dependencies.

**Alternative:** Use zig fetch

```bash
# Install specific version (recommended)
zig fetch --save https://github.com/evmts/primitives/archive/refs/tags/v0.1.0.tar.gz

# Install latest from main branch
zig fetch --save git+https://github.com/evmts/primitives
```

## Using as a Dependency

When using primitives in your Zig project, you need to import the modules and link the C artifact libraries.

### Required Steps

1. **Add dependency to build.zig.zon**

   ```zig
   .dependencies = .{
       .guillotine_primitives = .{
           .url = "https://github.com/evmts/primitives/archive/refs/tags/v0.1.0.tar.gz",
           .hash = "1220d8e9c88e3e9e7e7c3f3b2b6a5a5b2b6a5a5b2b6a5a5b2b6a5a5b2b6a5a5",
       },
   },
   ```

   Run `zig build` to automatically fetch and compute the correct hash, or use `zig fetch --save` as shown in the Installation section.

2. **Import modules and link artifacts in build.zig**

   ```zig
   const primitives_dep = b.dependency("guillotine_primitives", .{
       .target = target,
       .optimize = optimize,
   });

   // Import Zig modules
   const primitives_mod = primitives_dep.module("primitives");
   const crypto_mod = primitives_dep.module("crypto");
   const precompiles_mod = primitives_dep.module("precompiles");

   // Add imports to your executable/library
   exe.root_module.addImport("primitives", primitives_mod);
   exe.root_module.addImport("crypto", crypto_mod);
   exe.root_module.addImport("precompiles", precompiles_mod);

   // Link required C artifacts
   exe.linkLibrary(primitives_dep.artifact("blst"));
   exe.linkLibrary(primitives_dep.artifact("c_kzg"));

   // Link optional Rust artifacts (not available in WASM builds)
   if (primitives_dep.builder.lazyDependency("crypto_wrappers", .{})) |_| {
       if (primitives_dep.artifact("bn254")) |bn254| exe.linkLibrary(bn254);
       if (primitives_dep.artifact("keccak-asm")) |keccak| exe.linkLibrary(keccak);
   }

   exe.linkLibC();
   ```

### Artifacts Reference

| Artifact     | Type          | Purpose                             | Required   |
| ------------ | ------------- | ----------------------------------- | ---------- |
| `blst`       | C (static)    | BLS12-381 curve operations          | Yes        |
| `c_kzg`      | C (static)    | KZG commitments for EIP-4844        | Yes        |
| `bn254`      | Rust (static) | BN254 precompiles via Arkworks      | Optional\* |
| `keccak-asm` | Rust (static) | Hardware-accelerated Keccak hashing | Optional\* |

\* Not available in WASM builds. The library falls back to pure Zig implementations.

### Undefined Symbol Errors

If you see errors like:

```
Undefined symbols:
  "_bls12_381_g1_add"
  "_keccak256"
```

You're missing the required C artifact linkage. Add the corresponding `linkLibrary()` calls shown above.

## Module System

Use `zig build test` not `zig test`. Common error: "primitives" package requires module system.

### Import Rules

```zig
// Good
const primitives = @import("primitives");
const crypto = @import("crypto");

// Bad - no parent imports
const Address = @import("../primitives/address.zig");
```

## API

**Legend**: 🚧 Unstable API, unaudited, or unsafe implementation

- [**Ethereum primitives**](#primitives)
  - 🚧 [`Uint`](./src/primitives/uint.zig) &mdash; unsigned integer with overflow-checked arithmetic (Note: Zig 0.14+ includes native `u256` support which is recommended for most use cases. This library provides additional micro-performance optimizations when needed)
  - [`Address`](./src/primitives/address.zig) &mdash; Ethereum address type with EIP-55 checksumming
    - [`fromHex`](./src/primitives/address.zig#L70) &mdash; construct Address from hex string
    - [`fromU256`](./src/primitives/address.zig#L60) &mdash; construct Address from u256 value
    - [`fromBytes`](./src/primitives/address.zig#L115) &mdash; construct Address from 20-byte slice
    - [`fromPublicKey`](./src/primitives/address.zig#L80) &mdash; derive address from public key components
    - [`toU256`](./src/primitives/address.zig#L52) &mdash; convert Address to u256 integer
    - [`toHex`](./src/primitives/address.zig#L93) &mdash; convert to 42-byte hex string
    - [`toChecksumHex`](./src/primitives/address.zig#L97) &mdash; convert to EIP-55 checksummed hex
    - [`isValid`](./src/primitives/address.zig#L122) &mdash; validate address string format
    - [`isValidChecksum`](./src/primitives/address.zig#L126) &mdash; validate EIP-55 checksum
    - [`isZero`](./src/primitives/address.zig#L101) &mdash; check if zero address
    - [`equals`](./src/primitives/address.zig#L105) &mdash; compare two addresses
    - [`calculateCreateAddress`](./src/primitives/address.zig#L307) &mdash; compute CREATE opcode contract address
    - [`calculateCreate2Address`](./src/primitives/address.zig#L344) &mdash; compute CREATE2 opcode contract address
  - 🚧 [`Hex`](./src/primitives/hex.zig) &mdash; hexadecimal encoding and decoding utilities
    - [`isHex`](./src/primitives/hex.zig#L100) &mdash; validate hex string format (requires 0x prefix)
    - [`hexToBytes`](./src/primitives/hex.zig#L115) &mdash; convert hex string to byte array
    - [`bytesToHex`](./src/primitives/hex.zig#L139) &mdash; convert byte array to hex string
    - [`hexToBytesFixed`](./src/primitives/hex.zig#L155) &mdash; convert to fixed-size array (no allocator)
    - [`bytesToHexFixed`](./src/primitives/hex.zig#L177) &mdash; convert fixed array to hex (no allocator)
    - [`hexToString`](./src/primitives/hex.zig#L202) &mdash; convert hex to UTF-8 string
    - [`stringToHex`](./src/primitives/hex.zig#L208) &mdash; convert UTF-8 string to hex
    - [`hexToU256`](./src/primitives/hex.zig#L292) &mdash; parse hex string to u256 integer
    - [`u256ToHex`](./src/primitives/hex.zig#L316) &mdash; convert u256 integer to hex string
    - [`u64ToHex`](./src/primitives/hex.zig#L344) &mdash; convert u64 integer to hex string
    - [`padLeft`](./src/primitives/hex.zig#L241) &mdash; left-pad bytes with zeros
    - [`padRight`](./src/primitives/hex.zig#L254) &mdash; right-pad bytes with zeros
    - [`trimLeftZeros`](./src/primitives/hex.zig#L271) &mdash; remove leading zero bytes
    - [`trimRightZeros`](./src/primitives/hex.zig#L279) &mdash; remove trailing zero bytes
    - [`concat`](./src/primitives/hex.zig#L224) &mdash; concatenate multiple byte arrays
  - 🚧 [`RLP`](./src/primitives/rlp.zig) &mdash; Recursive Length Prefix serialization
    - [`encode`](./src/primitives/rlp.zig#L137) &mdash; encode input into RLP format (generic)
    - [`encodeBytes`](./src/primitives/rlp.zig#L235) &mdash; encode byte array according to RLP rules
    - [`encodeLength`](./src/primitives/rlp.zig#L264) &mdash; encode integer length as bytes
    - [`decode`](./src/primitives/rlp.zig#L281) &mdash; decode RLP data with optional streaming
  - 🚧 [`ABI`](./src/primitives/abi.zig) &mdash; Application Binary Interface encoding/decoding
    - [`computeSelector`](./src/primitives/abi_encoding.zig#L238) &mdash; compute 4-byte function selector from signature string
    - [`createFunctionSignature`](./src/primitives/abi_encoding.zig#L244) &mdash; create function signature string from name and types
    - [`encodeAbiParameters`](./src/primitives/abi_encoding.zig#L720) &mdash; encode values according to ABI specification
    - [`decodeAbiParameters`](./src/primitives/abi_encoding.zig#L399) &mdash; decode ABI-encoded parameter data
    - [`encodeFunctionData`](./src/primitives/abi_encoding.zig#L808) &mdash; encode function call (selector + parameters)
    - [`decodeFunctionData`](./src/primitives/abi_encoding.zig#L421) &mdash; decode function call data into selector and parameters
    - [`encodeFunctionResult`](./src/primitives/abi_encoding.zig#L1045) &mdash; encode function return values
    - [`decodeFunctionResult`](./src/primitives/abi_encoding.zig#L1050) &mdash; decode function return values
    - [`encodeErrorResult`](./src/primitives/abi_encoding.zig#L1055) &mdash; encode error data (selector + parameters)
    - [`encodeEventTopics`](./src/primitives/abi_encoding.zig#L818) &mdash; encode event signature and indexed parameters as topics
    - [`encodePacked`](./src/primitives/abi_encoding.zig#L855) &mdash; packed encoding without padding
    - [`estimateGasForData`](./src/primitives/abi_encoding.zig#L887) &mdash; estimate gas cost for calldata
    - [`createFunctionResult`](./src/primitives/abi_encoding.zig#L1104) &mdash; create function execution result structure
    - [`decodeFunctionResultWithTypes`](./src/primitives/abi_encoding.zig#L1113) &mdash; decode function result with type information
    - [`createErrorResult`](./src/primitives/abi_encoding.zig#L1117) &mdash; create error result structure
    - [`decodeErrorResultWithTypes`](./src/primitives/abi_encoding.zig#L1125) &mdash; decode error result with type information
  - 🚧 [`Transaction`](./src/primitives/transaction.zig) &mdash; all transaction types (Legacy, EIP-1559, EIP-2930, EIP-4844, EIP-7702)
    - [`encodeLegacyForSigning`](./src/primitives/transaction.zig#L174) &mdash; encode legacy transaction for signature (EIP-155)
    - [`encode_eip1559_for_signing`](./src/primitives/transaction.zig#L220) &mdash; encode EIP-1559 transaction for signature
    - [`encodeAccessList`](./src/primitives/transaction.zig#L276) &mdash; encode access list to RLP format
    - [`signLegacyTransaction`](./src/primitives/transaction.zig#L337) &mdash; sign transaction with private key
    - [`computeLegacyTransactionHash`](./src/primitives/transaction.zig#L358) &mdash; compute transaction hash (keccak256)
    - [`detectTransactionType`](./src/primitives/transaction.zig#L368) &mdash; detect transaction type from raw data
  - 🚧 [`EventLog`](./src/primitives/event_log.zig) &mdash; event log structures with topic handling
    - [`parseEventLog`](./src/primitives/event_log.zig#L42) &mdash; parse event log with signature
    - [`filterLogsByTopics`](./src/primitives/event_log.zig#L109) &mdash; filter logs by topics
  - 🚧 [`FeeMarket`](./src/primitives/fee_market.zig) &mdash; EIP-1559 fee market mechanism
    - [`initialBaseFee`](./src/primitives/fee_market.zig#L24) &mdash; initialize base fee for first EIP-1559 block
    - [`nextBaseFee`](./src/primitives/fee_market.zig#L59) &mdash; calculate next block's base fee
    - [`getEffectiveGasPrice`](./src/primitives/fee_market.zig#L127) &mdash; calculate effective gas price and miner fee
    - [`getGasTarget`](./src/primitives/fee_market.zig#L160) &mdash; get gas target for a block
  - 🚧 [`Numeric`](./src/primitives/numeric.zig) &mdash; Ethereum unit conversions and safe math utilities
    - [`parseEther`](./src/primitives/numeric.zig#L79) &mdash; parse ether string to wei
    - [`parseGwei`](./src/primitives/numeric.zig#L84) &mdash; parse gwei string to wei
    - [`parseUnits`](./src/primitives/numeric.zig#L89) &mdash; parse units string to wei
    - [`formatEther`](./src/primitives/numeric.zig#L123) &mdash; format wei to ether string
    - [`formatGwei`](./src/primitives/numeric.zig#L128) &mdash; format wei to gwei string
    - [`formatUnits`](./src/primitives/numeric.zig#L133) &mdash; format wei to specified units
    - [`convertUnits`](./src/primitives/numeric.zig#L164) &mdash; convert between units
    - [`calculateGasCost`](./src/primitives/numeric.zig#L176) &mdash; calculate gas cost in wei
    - [`safeAdd`](./src/primitives/numeric.zig#L266) &mdash; checked addition
    - [`safeSub`](./src/primitives/numeric.zig#L271) &mdash; checked subtraction
    - [`safeMul`](./src/primitives/numeric.zig#L275) &mdash; checked multiplication
    - [`safeDiv`](./src/primitives/numeric.zig#L281) &mdash; checked division
  - 🚧 [`GasConstants`](./src/primitives/gas_constants.zig) &mdash; EVM gas cost constants and calculation functions
    - [`memoryGasCost`](./src/primitives/gas_constants.zig#L395) &mdash; calculate memory expansion gas cost
    - [`callGasCost`](./src/primitives/gas_constants.zig#L451) &mdash; calculate CALL operation gas cost
    - [`sstoreGasCost`](./src/primitives/gas_constants.zig#L488) &mdash; calculate SSTORE operation gas cost
    - [`createGasCost`](./src/primitives/gas_constants.zig#L533) &mdash; calculate CREATE operation gas cost
    - [`logGasCost`](./src/primitives/gas_constants.zig#L555) &mdash; calculate LOG operation gas cost
    - [`keccak256GasCost`](./src/primitives/gas_constants.zig#L598) &mdash; calculate KECCAK256 gas cost
  - 🚧 [`AccessList`](./src/primitives/access_list.zig) &mdash; EIP-2930 access list support
    - [`calculateAccessListGasCost`](./src/primitives/access_list.zig#L32) &mdash; calculate total gas cost for access list
    - [`isAddressInAccessList`](./src/primitives/access_list.zig#L47) &mdash; check if address is in access list
    - [`isStorageKeyInAccessList`](./src/primitives/access_list.zig#L57) &mdash; check if storage key is in access list
    - [`encodeAccessList`](./src/primitives/access_list.zig#L75) &mdash; RLP encode access list
    - [`calculateGasSavings`](./src/primitives/access_list.zig#L119) &mdash; calculate gas savings from access list
  - 🚧 [`Blob`](./src/primitives/blob.zig) &mdash; EIP-4844 blob transaction support with KZG commitments
    - [`commitmentToVersionedHash`](./src/primitives/blob.zig#L36) &mdash; create versioned hash from KZG commitment
    - [`isValidVersionedHash`](./src/primitives/blob.zig#L50) &mdash; validate versioned hash format
  - 🚧 [`Authorization`](./src/primitives/authorization.zig) &mdash; EIP-7702 authorization list for account abstraction
    - [`authority`](./src/primitives/authorization.zig#L31) &mdash; recover authority (signer) from authorization
    - [`signing_hash`](./src/primitives/authorization.zig#L45) &mdash; compute hash for authorization signing
  - 🚧 [`SIWE`](./src/primitives/siwe.zig) &mdash; Sign-In with Ethereum (EIP-4361) message handling
    - [`SiweMessage.format`](./src/primitives/siwe.zig#L40) &mdash; format SIWE message for signing
    - [`SiweMessage.validate`](./src/primitives/siwe.zig) &mdash; validate SIWE message structure
    - [`SiweMessage.parse`](./src/primitives/siwe.zig) &mdash; parse SIWE message from string
  - 🚧 [`Bytecode`](./src/primitives/bytecode.zig) &mdash; EVM bytecode utilities with jump destination analysis
    - [`init`](./src/primitives/bytecode.zig#L16) &mdash; initialize bytecode with jump destination analysis
    - [`deinit`](./src/primitives/bytecode.zig#L29) &mdash; clean up resources
    - [`isValidJumpDest`](./src/primitives/bytecode.zig#L34) &mdash; check if position is valid JUMPDEST
    - [`len`](./src/primitives/bytecode.zig#L39) &mdash; get bytecode length
    - [`getOpcode`](./src/primitives/bytecode.zig#L44) &mdash; get opcode byte at position
    - [`getOpcodeEnum`](./src/primitives/bytecode.zig#L52) &mdash; get typed Opcode enum at position
    - [`readImmediate`](./src/primitives/bytecode.zig#L59) &mdash; read immediate data for PUSH operations
  - 🚧 [`Opcode`](./src/primitives/opcode.zig) &mdash; EVM opcode enumeration with utility methods
    - [`isPush`](./src/primitives/opcode.zig#L170) &mdash; check if opcode is PUSH (0x5f-0x7f)
    - [`pushSize`](./src/primitives/opcode.zig#L176) &mdash; get number of bytes pushed (0-32)
    - [`isDup`](./src/primitives/opcode.zig#L185) &mdash; check if opcode is DUP (0x80-0x8f)
    - [`isSwap`](./src/primitives/opcode.zig#L198) &mdash; check if opcode is SWAP (0x90-0x9f)
    - [`isLog`](./src/primitives/opcode.zig#L211) &mdash; check if opcode is LOG (0xa0-0xa4)
    - [`isTerminating`](./src/primitives/opcode.zig#L224) &mdash; check if opcode terminates execution
    - [`isStateModifying`](./src/primitives/opcode.zig#L232) &mdash; check if opcode modifies state
    - [`name`](./src/primitives/opcode.zig#L264) &mdash; get opcode name as string
  - 🚧 [`OpcodeInfo`](./src/primitives/opcode_info.zig) &mdash; gas costs and stack metadata for all opcodes
  - 🚧 [`Hardfork`](./src/primitives/hardfork.zig) &mdash; Ethereum hardfork identifiers with version comparison
    - [`toInt`](./src/primitives/hardfork.zig#L123) &mdash; convert hardfork to numeric representation
    - [`isAtLeast`](./src/primitives/hardfork.zig#L128) &mdash; check if at or after specified version
    - [`isBefore`](./src/primitives/hardfork.zig#L133) &mdash; check if before specified version
    - [`fromString`](./src/primitives/hardfork.zig#L139) &mdash; parse hardfork from string (case-insensitive)
  - 🚧 [`Trie`](./src/primitives/trie.zig) &mdash; Merkle Patricia Trie for state storage with proof generation
    - [`init`](./src/primitives/trie.zig#L785) &mdash; initialize empty trie
    - [`deinit`](./src/primitives/trie.zig#L793) &mdash; free trie resources
    - [`root_hash`](./src/primitives/trie.zig#L804) &mdash; get root hash of trie
    - [`put`](./src/primitives/trie.zig#L809) &mdash; insert key-value pair into trie
    - [`get`](./src/primitives/trie.zig#L827) &mdash; retrieve value from trie
    - [`delete`](./src/primitives/trie.zig#L837) &mdash; delete key from trie
    - [`clear`](./src/primitives/trie.zig#L848) &mdash; clear trie to empty state
      <br/>
      <br/>
- [**Cryptography primitives**](#cryptography)
  - [`keccak256`](./src/crypto/hash_utils.zig) &mdash; Keccak-256 via Zig std library
    - [`keccak256`](./src/crypto/hash_utils.zig#L92) &mdash; compute Keccak-256 hash
    - [`fromBytes`](./src/crypto/hash_utils.zig#L31) &mdash; create Hash from [32]u8 array
    - [`fromHex`](./src/crypto/hash_utils.zig#L42) &mdash; create Hash from 0x-prefixed hex string
    - [`toHex`](./src/crypto/hash_utils.zig#L65) &mdash; convert Hash to [66]u8 hex string
    - [`equal`](./src/crypto/hash_utils.zig#L87) &mdash; constant-time hash comparison
    - [`bitAnd`](./src/crypto/hash_utils.zig#L149) &mdash; bitwise AND of two hashes
    - [`bitOr`](./src/crypto/hash_utils.zig#L159) &mdash; bitwise OR of two hashes
    - [`xor`](./src/crypto/hash_utils.zig#L139) &mdash; bitwise XOR of two hashes
    - [`eip191HashMessage`](./src/crypto/hash_utils.zig#L103) &mdash; EIP-191 personal message hashing
  - 🚧 [`keccak256 (asm)`](./src/crypto/keccak_asm.zig) &mdash; ⚠️ (unaudited) assembly-optimized Keccak-256 (via [keccak-asm](https://github.com/DaniPopes/keccak-asm)). Uses hardware-accelerated x86-64/ARM assembly. Falls back to pure Zig in WASM builds.
    - [`keccak256`](./src/crypto/keccak_asm.zig#L43) &mdash; assembly-optimized KECCAK256 (hardware accelerated)
    - [`keccak224`](./src/crypto/keccak_asm.zig#L60) &mdash; Keccak-224 (28-byte output)
    - [`keccak384`](./src/crypto/keccak_asm.zig#L66) &mdash; Keccak-384 (48-byte output)
    - [`keccak512`](./src/crypto/keccak_asm.zig#L72) &mdash; Keccak-512 (64-byte output)
    - [`keccak256_batch`](./src/crypto/keccak_asm.zig#L80) &mdash; batch process multiple inputs
  - 🚧 [`secp256k1`](./src/crypto/secp256k1.zig) &mdash; ⚠️ (unaudited) ECDSA signatures for transaction signing
    - [`unaudited_validate_signature`](./src/crypto/secp256k1.zig#L130) &mdash; validate ECDSA signature parameters
    - [`unaudited_recover_address`](./src/crypto/secp256k1.zig#L147) &mdash; recover Ethereum address from signature
    - [`unaudited_mulmod`](./src/crypto/secp256k1.zig#L253) &mdash; modular multiplication (⚠️ timing attack vulnerable)
    - [`unaudited_invmod`](./src/crypto/secp256k1.zig#L337) &mdash; modular inverse using Extended Euclidean
  - 🚧 [`EIP-712`](./src/crypto/eip712.zig) &mdash; ⚠️ (unaudited) typed structured data hashing and signing
    - [`unaudited_hashTypedData`](./src/crypto/eip712.zig#L407) &mdash; hash typed data according to EIP-712
    - [`unaudited_signTypedData`](./src/crypto/eip712.zig#L435) &mdash; sign typed data with private key
    - [`unaudited_verifyTypedData`](./src/crypto/eip712.zig#L445) &mdash; verify typed data signature
    - [`unaudited_recoverTypedDataAddress`](./src/crypto/eip712.zig#L455) &mdash; recover address from typed data signature
    - [`create_domain`](./src/crypto/eip712.zig#L476) &mdash; create EIP-712 domain separator
    - [`create_simple_typed_data`](./src/crypto/eip712.zig#L463) &mdash; create simple typed data structure
  - 🚧 [`BLS12-381`](./src/crypto/crypto.zig) &mdash; pairing-friendly curve operations (via [BLST](https://github.com/supranational/blst))
    - [`unaudited_getPublicKey`](./src/crypto/crypto.zig#L353) &mdash; derive public key from private key
    - [`unaudited_signHash`](./src/crypto/crypto.zig#L379) &mdash; sign hash with private key using ECDSA
    - [`unaudited_signMessage`](./src/crypto/crypto.zig#L459) &mdash; sign EIP-191 message with private key
    - [`unaudited_recoverAddress`](./src/crypto/crypto.zig#L468) &mdash; recover address from signature and hash
    - [`unaudited_verifySignature`](./src/crypto/crypto.zig#L494) &mdash; verify signature against hash and address
  - 🚧 [`BN254`](./src/crypto/bn254/) &mdash; ⚠️ (unaudited) pure Zig alt_bn128 curve implementation
  - [`BN254 Arkworks`](./src/crypto/bn254_arkworks.zig) &mdash; audited Rust [arkworks](https://github.com/arkworks-rs/curves) (ECMUL/ECPAIRING). Not available in WASM builds (requires linking Rust library).
    - [`ecmul`](./src/crypto/bn254_arkworks.zig#L56) &mdash; scalar multiplication on BN254 G1 (precompile 0x07)
    - [`ecpairing`](./src/crypto/bn254_arkworks.zig#L71) &mdash; pairing check on BN254 (precompile 0x08)
  - 🚧 [`KZG`](./src/crypto/c_kzg.zig) &mdash; polynomial commitments for EIP-4844 blobs (via [c-kzg-4844](https://github.com/ethereum/c-kzg-4844))
    - [`blobToKzgCommitment`](./src/crypto/c_kzg.zig#L43) &mdash; compute KZG commitment from blob
    - [`computeKZGProof`](./src/crypto/c_kzg.zig#L48) &mdash; compute KZG proof at point z
    - [`verifyKZGProof`](./src/crypto/c_kzg.zig#L53) &mdash; verify KZG proof
  - 🚧 [`KZG Trusted Setup`](./src/crypto/kzg_trusted_setup.zig) &mdash; embedded trusted setup data
  - 🚧 [`KZG Setup`](./src/crypto/kzg_setup.zig) &mdash; thread-safe initialization and management
    - [`init`](./src/crypto/kzg_setup.zig#L22) &mdash; initialize KZG with embedded trusted setup (thread-safe)
    - [`deinit`](./src/crypto/kzg_setup.zig#L73) &mdash; deinitialize KZG trusted setup
  - [`SHA256`](./src/crypto/hash_algorithms.zig) &mdash; standard SHA-256 hashing via Zig std library
    - [`hash`](./src/crypto/hash_algorithms.zig#L11) &mdash; compute SHA256 hash into output buffer
  - 🚧 [`RIPEMD160`](./src/crypto/hash_algorithms.zig) &mdash; ⚠️ (unaudited) legacy hash function
    - [`hash`](./src/crypto/hash_algorithms.zig#L64) &mdash; compute RIPEMD160 hash into output buffer
  - 🚧 [`Blake2`](./src/crypto/blake2.zig) &mdash; ⚠️ (unaudited) high-performance hashing
    - [`unaudited_blake2f_compress`](./src/crypto/blake2.zig#L100) &mdash; BLAKE2F wrapper for EIP-152 precompile
  - 🚧 [`ModExp`](./src/crypto/modexp.zig) &mdash; ⚠️ (unaudited) modular exponentiation
    - [`unaudited_modexp`](./src/crypto/modexp.zig#L42) &mdash; modular exponentiation (base^exp mod m)
      <br/>
      <br/>
- [**Ethereum precompiles**](#precompiles)
  - 🚧 [`ECRECOVER`](./src/precompiles/ecrecover.zig#L11) &mdash; ⚠️ (unaudited) 0x01: recover signer address from signature
  - [`SHA256`](./src/precompiles/sha256.zig#L12) &mdash; 0x02: SHA-256 hash function
  - 🚧 [`RIPEMD160`](./src/precompiles/ripemd160.zig#L12) &mdash; ⚠️ (unaudited) 0x03: RIPEMD-160 hash function
  - [`IDENTITY`](./src/precompiles/identity.zig#L10) &mdash; 0x04: identity/copy function
  - 🚧 [`MODEXP`](./src/precompiles/modexp.zig#L13) &mdash; ⚠️ (unaudited) 0x05: modular exponentiation
  - [`ECADD`](./src/precompiles/bn254_add.zig#L11) &mdash; 0x06: BN254 elliptic curve addition (via [Arkworks](https://github.com/arkworks-rs/curves))
  - [`ECMUL`](./src/precompiles/bn254_mul.zig#L11) &mdash; 0x07: BN254 elliptic curve multiplication (via [Arkworks](https://github.com/arkworks-rs/curves))
  - [`ECPAIRING`](./src/precompiles/bn254_pairing.zig#L12) &mdash; 0x08: BN254 pairing check (via [Arkworks](https://github.com/arkworks-rs/curves))
  - 🚧 [`BLAKE2F`](./src/precompiles/blake2f.zig#L11) &mdash; ⚠️ (unaudited) 0x09: Blake2b compression function
  - 🚧 [`POINT_EVALUATION`](./src/precompiles/point_evaluation.zig#L12) &mdash; 0x0A: KZG point evaluation (EIP-4844)
  - 🚧 [`BLS12_G1ADD`](./src/precompiles/bls12_g1_add.zig#L10) &mdash; 0x0B: BLS12-381 G1 addition
  - 🚧 [`BLS12_G1MUL`](./src/precompiles/bls12_g1_mul.zig#L10) &mdash; 0x0C: BLS12-381 G1 multiplication
  - 🚧 [`BLS12_G1MSM`](./src/precompiles/bls12_g1_msm.zig#L12) &mdash; 0x0D: BLS12-381 G1 multi-scalar multiplication
  - 🚧 [`BLS12_G2ADD`](./src/precompiles/bls12_g2_add.zig#L10) &mdash; 0x0E: BLS12-381 G2 addition
  - 🚧 [`BLS12_G2MUL`](./src/precompiles/bls12_g2_mul.zig#L10) &mdash; 0x0F: BLS12-381 G2 multiplication
  - 🚧 [`BLS12_G2MSM`](./src/precompiles/bls12_g2_msm.zig#L12) &mdash; 0x10: BLS12-381 G2 multi-scalar multiplication
  - 🚧 [`BLS12_PAIRING`](./src/precompiles/bls12_pairing.zig#L11) &mdash; 0x11: BLS12-381 pairing check
  - 🚧 [`BLS12_MAP_FP_TO_G1`](./src/precompiles/bls12_map_fp_to_g1.zig#L10) &mdash; 0x12: BLS12-381 map field to G1
  - 🚧 [`BLS12_MAP_FP2_TO_G2`](./src/precompiles/bls12_map_fp2_to_g2.zig#L10) &mdash; 0x13: BLS12-381 map field to G2

## Build Commands

```bash
# Build the project
zig build

# Run all tests
zig build test

# Build with optimizations
zig build -Doptimize=ReleaseFast

# Build for WASM
zig build -Dtarget=wasm32-freestanding
```

## Documentation

- [Main README](./README.md) — TypeScript/JavaScript usage and overview
- [WASM Support](./WASM_SUPPORT.md) — WebAssembly build guide
- [Development Guidelines](./CLAUDE.md) — Coding standards for contributors
- [Contributing](./CONTRIBUTING.md) — How to contribute
- [Source Documentation](./src/README.md) — Source code organization

## Related Projects

[**Guillotine**](https://github.com/evmts/guillotine) — EVM execution engine using these primitives

[**Guillotine Mini**](https://github.com/evmts/guillotine-mini) — Minimal EVM implementation
