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
    - `from_limbs()`, `from_u64()`, `from_str()` &mdash; construction from various types
    - `to_u64()`, `to_le_bytes()`, `to_be_bytes()` &mdash; conversion to basic types
    - `overflowing_add()`, `checked_add()`, `wrapping_add()` &mdash; addition with overflow handling
    - `overflowing_sub()`, `checked_sub()`, `wrapping_sub()` &mdash; subtraction with overflow handling
    - `overflowing_mul()`, `checked_mul()`, `wrapping_mul()`, `saturating_mul()` &mdash; multiplication variants
    - `div_rem()`, `wrapping_div()`, `checked_div()` &mdash; division and modulo operations
    - `eq()`, `lt()`, `gt()`, `le()`, `ge()`, `cmp()` &mdash; comparison operations
    - `ltBranchFree()`, `gtBranchFree()` &mdash; constant-time comparisons
    - `bit_and()`, `bit_or()`, `bit_xor()`, `bit_not()` &mdash; bitwise operations
    - `wrapping_shl()`, `wrapping_shr()`, `rotate_left()`, `rotate_right()` &mdash; bit shifting
    - `set_bit()`, `get_bit()`, `set_byte()`, `byte()` &mdash; bit/byte manipulation
    - `count_ones()`, `count_zeros()`, `leading_zeros()`, `trailing_zeros()` &mdash; bit counting
    - `add_mod()`, `mul_mod()`, `pow_mod()` &mdash; modular arithmetic
    - `gcd()`, `lcm()`, `sqrt()`, `pow()` &mdash; number theory operations
  - [`Address`](./src/primitives/address.zig) &mdash; Ethereum address type with EIP-55 checksumming
    - `from_hex()`, `from_u256()`, `fromBytes()` &mdash; parse from various formats
    - `from_public_key()`, `address_from_public_key()` &mdash; derive from ECDSA public key
    - `to_u256()`, `to_hex()`, `to_checksum_hex()` &mdash; convert to different formats
    - `is_valid()`, `is_valid_checksum()` &mdash; validate address format and EIP-55 checksum
    - `is_zero()`, `equals()`, `eql()` &mdash; comparison operations
    - `calculate_create_address()` &mdash; compute CREATE opcode contract address
    - `calculate_create2_address()` &mdash; compute CREATE2 opcode contract address
  - [`Hex`](./src/primitives/hex.zig) &mdash; hexadecimal encoding and decoding utilities
    - `is_hex()` &mdash; validate hex string format
    - `hex_to_bytes()`, `bytes_to_hex()` &mdash; convert between hex strings and byte arrays
    - `hex_to_bytes_fixed()`, `bytes_to_hex_fixed()` &mdash; fixed-size conversions without allocator
    - `hex_to_string()`, `string_to_hex()` &mdash; UTF-8 string conversions
    - `hex_to_u256()`, `u256_to_hex()` &mdash; numeric conversions
    - `pad_left()`, `pad_right()`, `pad()` &mdash; zero-padding operations
    - `trim_left_zeros()`, `trim_right_zeros()`, `trim()` &mdash; remove leading/trailing zeros
    - `size()`, `slice()`, `concat()` &mdash; byte array utilities
  - [`RLP`](./src/primitives/rlp.zig) &mdash; Recursive Length Prefix serialization
    - `encode()` &mdash; generic RLP encoding for any type
    - `encode_bytes()` &mdash; encode byte strings
    - `encode_length()` &mdash; encode length prefixes
    - `decode()` &mdash; decode RLP data into structured types
    - `bytes_to_hex()`, `hex_to_bytes()` &mdash; hex conversion utilities
    - `concat_bytes()` &mdash; concatenate byte arrays
  - [`ABI`](./src/primitives/abi.zig) &mdash; Application Binary Interface encoding/decoding
    - `encodeAbiParameters()`, `decodeAbiParameters()` &mdash; encode/decode function parameters
    - `encodeFunctionData()`, `decodeFunctionData()` &mdash; encode/decode complete function calls
    - `encodeEventTopics()` &mdash; encode event log topics for filtering
    - `encodePacked()` &mdash; packed encoding for keccak256 hashing
    - `computeSelector()` &mdash; calculate 4-byte function selector
    - `createFunctionSignature()` &mdash; build canonical function signature
    - `uint256Value()`, `boolValue()`, `addressValue()` &mdash; wrap primitive values
  - [`Transaction`](./src/primitives/transaction.zig) &mdash; all transaction types (Legacy, EIP-1559, EIP-2930, EIP-4844, EIP-7702)
    - `encode_legacy_for_signing()` &mdash; prepare legacy transaction for signing
    - `encode_eip1559_for_signing()` &mdash; prepare EIP-1559 transaction for signing
    - `encode_access_list()` &mdash; encode EIP-2930 access list
    - `sign_legacy_transaction()` &mdash; sign transaction with private key
    - `compute_legacy_transaction_hash()` &mdash; calculate transaction hash
    - `detect_transaction_type()` &mdash; identify transaction type from raw data
  - [`Logs`](./src/primitives/logs.zig) &mdash; event log structures with topic handling
    - `Log` struct with `address`, `topics[]`, `data` fields
  - [`Bytecode`](./src/primitives/bytecode.zig) &mdash; EVM bytecode utilities with jump destination analysis
    - `init()`, `deinit()` &mdash; initialize with automatic JUMPDEST analysis
    - `isValidJumpDest()` &mdash; check if program counter is valid jump destination
    - `len()` &mdash; get bytecode length
    - `getOpcode()` &mdash; read byte at position
    - `getOpcodeEnum()` &mdash; get Opcode enum at position
    - `readImmediate()` &mdash; read PUSH instruction immediate data
  - [`Opcode`](./src/primitives/opcode.zig) &mdash; EVM opcode enumeration with utility methods
    - All 256 EVM opcodes: `STOP`, `ADD`, `MUL`, `SUB`, `DIV`, `SDIV`, `MOD`, `SMOD`, `ADDMOD`, `MULMOD`, `EXP`, `SIGNEXTEND`
    - Stack: `PUSH0`-`PUSH32`, `POP`, `DUP1`-`DUP16`, `SWAP1`-`SWAP16`
    - Memory: `MLOAD`, `MSTORE`, `MSTORE8`, `MSIZE`
    - Storage: `SLOAD`, `SSTORE`
    - Control: `JUMP`, `JUMPI`, `JUMPDEST`, `PC`, `GAS`
    - System: `CREATE`, `CREATE2`, `CALL`, `CALLCODE`, `DELEGATECALL`, `STATICCALL`, `RETURN`, `REVERT`, `SELFDESTRUCT`
    - Environmental: `ADDRESS`, `BALANCE`, `CALLER`, `CALLVALUE`, `CALLDATALOAD`, `CALLDATASIZE`, `CALLDATACOPY`, `CODESIZE`, `CODECOPY`
    - Block: `BLOCKHASH`, `COINBASE`, `TIMESTAMP`, `NUMBER`, `DIFFICULTY`, `GASLIMIT`, `CHAINID`, `BASEFEE`, `BLOBHASH`, `BLOBBASEFEE`
    - Crypto: `KECCAK256`
    - Logs: `LOG0`, `LOG1`, `LOG2`, `LOG3`, `LOG4`
  - [`OpcodeInfo`](./src/primitives/opcode_info.zig) &mdash; gas costs and stack metadata for all opcodes
    - `OpcodeInfo` struct with `gas_cost`, `stack_inputs`, `stack_outputs` fields
    - `OPCODE_INFO[256]` &mdash; static array with metadata for all opcodes
    - `HARDFORK_OPCODES` &mdash; hardfork-specific opcode availability
  - [`Hardfork`](./src/primitives/hardfork.zig) &mdash; Ethereum hardfork identifiers with version comparison
    - All hardforks: `FRONTIER`, `HOMESTEAD`, `DAO`, `TANGERINE_WHISTLE`, `SPURIOUS_DRAGON`, `BYZANTIUM`, `CONSTANTINOPLE`, `PETERSBURG`, `ISTANBUL`, `MUIR_GLACIER`, `BERLIN`, `LONDON`, `ARROW_GLACIER`, `GRAY_GLACIER`, `MERGE`, `SHANGHAI`, `CANCUN`, `PRAGUE`, `OSAKA`
    - `toInt()` &mdash; convert to numeric value
    - `isAtLeast()`, `isBefore()` &mdash; version comparison
    - `fromString()` &mdash; parse from name (case-insensitive)
  - [`Trie`](./src/primitives/trie.zig) &mdash; Merkle Patricia Trie for state storage with proof generation
    - `init()`, `deinit()` &mdash; lifecycle management
    - `root_hash()` &mdash; get Merkle root hash
    - `put()`, `get()`, `delete()` &mdash; key-value operations
    - `clear()` &mdash; remove all entries
    - `TrieMask` with `set()`, `unset()`, `is_set()`, `bit_count()` &mdash; bit mask for branch children
    <br/>
    <br/>
- [**Cryptography primitives**](#cryptography)
  - [`keccak256`](./src/crypto/hash_utils.zig) &mdash; Keccak-256 via Zig std library
    - `Hash.keccak256()` &mdash; compute Keccak-256 hash
    - `Hash.from_bytes()`, `Hash.from_hex()` &mdash; create from existing hash
    - `Hash.to_bytes()`, `Hash.to_hex()` &mdash; convert to bytes or hex string
    - `Hash.eql()` &mdash; constant-time hash comparison
    - `Hash.bit_and()`, `Hash.bit_or()`, `Hash.bit_xor()` &mdash; bitwise operations
    - `compute_selector()` &mdash; compute 4-byte function selector
    - `hash_message_eip191()` &mdash; EIP-191 personal message hashing
  - [`keccak256 (asm)`](./src/crypto/keccak_asm.zig) &mdash; ⚠️ (unaudited) assembly-optimized Keccak-256 (via keccak-asm)
    - `keccak256()`, `keccak224()`, `keccak384()`, `keccak512()` &mdash; optimized Keccak variants
    - `keccak256_batch()` &mdash; batch processing for multiple inputs
  - [`secp256k1`](./src/crypto/secp256k1.zig) &mdash; ⚠️ (unaudited) ECDSA signatures for transaction signing
    - `AffinePoint.add()`, `AffinePoint.double()`, `AffinePoint.scalar_mul()` &mdash; elliptic curve operations
    - `validate_signature()` &mdash; verify ECDSA signature
    - `recover_address()` &mdash; recover Ethereum address from signature
    - `mulmod()`, `addmod()`, `submod()`, `powmod()`, `invmod()` &mdash; field arithmetic (⚠️ timing attack vulnerable)
  - [`BLS12-381`](./src/crypto/crypto.zig) &mdash; pairing-friendly curve operations (via BLST)
    - `bls_g1_add()`, `bls_g1_mul()`, `bls_g1_msm()` &mdash; G1 group operations
    - `bls_g2_add()`, `bls_g2_mul()`, `bls_g2_msm()` &mdash; G2 group operations
    - `bls_pairing()` &mdash; pairing check operation
    - `bls_map_fp_to_g1()`, `bls_map_fp2_to_g2()` &mdash; hash-to-curve operations
    - `generate_private_key()`, `derive_public_key()` &mdash; key generation
    - `sign_message()`, `verify_signature()` &mdash; ECDSA signature operations
  - [`BN254`](./src/crypto/bn254/) &mdash; ⚠️ (unaudited) pure Zig alt_bn128 curve implementation
    - `FpMont` &mdash; Montgomery field arithmetic: `mul()`, `add()`, `sub()`, `neg()`, `inv()`, `pow()`, `sqrt()`
    - `Fp2Mont`, `Fp4Mont`, `Fp6Mont`, `Fp12Mont` &mdash; extension field operations
    - `G1`, `G2` &mdash; elliptic curve point operations: `add()`, `double()`, `scalar_mul()`, `is_on_curve()`
    - `pairing()` &mdash; optimal ate pairing computation
    - `miller_loop()`, `final_exponentiation()` &mdash; pairing components
  - [`BN254 Arkworks`](./src/crypto/bn254_arkworks.zig) &mdash; audited Rust arkworks (ECMUL/ECPAIRING)
    - `bn254_add()` &mdash; G1 point addition (precompile 0x06)
    - `bn254_mul()` &mdash; G1 scalar multiplication (precompile 0x07)
    - `bn254_pairing()` &mdash; pairing check (precompile 0x08)
    - `validate_g1_point()`, `validate_g2_point()` &mdash; point validation
  - [`KZG`](./src/crypto/root.zig) &mdash; polynomial commitments for EIP-4844 blobs (via c-kzg-4844)
    - `verify_blob_kzg_proof()` &mdash; verify KZG proof for blob
    - `verify_blob_kzg_proof_batch()` &mdash; batch proof verification
    - `compute_blob_kzg_proof()` &mdash; generate proof for blob
    - `blob_to_kzg_commitment()` &mdash; compute commitment from blob
  - [`KZG Trusted Setup`](./src/crypto/kzg_trusted_setup.zig) &mdash; embedded trusted setup data
    - Embedded mainnet trusted setup parameters for EIP-4844
  - [`KZG Setup`](./src/crypto/kzg_setup.zig) &mdash; thread-safe initialization and management
    - `ensure_kzg_initialized()` &mdash; thread-safe lazy initialization
    - `get_kzg_settings()` &mdash; access global KZG settings
    - `deinit_kzg()` &mdash; cleanup KZG resources
  - [`SHA256`](./src/crypto/hash_algorithms.zig) &mdash; standard SHA-256 hashing via Zig std library
    - `sha256_hash()` &mdash; compute SHA-256 hash
  - [`RIPEMD160`](./src/crypto/hash_algorithms.zig) &mdash; ⚠️ (unaudited) legacy hash function
    - `ripemd160_hash()` &mdash; compute RIPEMD-160 hash
  - [`Blake2`](./src/crypto/blake2.zig) &mdash; ⚠️ (unaudited) high-performance hashing
    - `blake2f()` &mdash; Blake2b compression function (EIP-152)
    - `blake2b_mix()` &mdash; Blake2b mixing function
    - `blake2b_round()` &mdash; single Blake2b round
  - [`ModExp`](./src/crypto/modexp.zig) &mdash; ⚠️ (unaudited) modular exponentiation
    - `modexp()` &mdash; big-integer modular exponentiation
    - `calculate_modexp_gas()` &mdash; EIP-198 gas cost calculation
    - `bytes_to_bigint()`, `bigint_to_bytes()` &mdash; big-integer conversions
    <br/>

  > **Note**: Additional cryptographic primitives are available in [Zig's standard library](https://ziglang.org/documentation/master/std/#std.crypto).
    <br/>
    <br/>
- [**Ethereum precompiles**](#precompiles)
  - [`ECRECOVER`](./src/precompiles/ecrecover.zig) &mdash; ⚠️ (unaudited) 0x01: recover signer address from signature
    - `run()` &mdash; recover Ethereum address from ECDSA signature (r, s, v) and message hash
    - `calculate_gas()` &mdash; returns fixed gas cost of 3000
  - [`SHA256`](./src/precompiles/sha256.zig) &mdash; 0x02: SHA-256 hash function
    - `run()` &mdash; compute SHA-256 hash of input data
    - `calculate_gas()` &mdash; 60 + 12 per word (32 bytes)
  - [`RIPEMD160`](./src/precompiles/ripemd160.zig) &mdash; ⚠️ (unaudited) 0x03: RIPEMD-160 hash function
    - `run()` &mdash; compute RIPEMD-160 hash, left-padded to 32 bytes
    - `calculate_gas()` &mdash; 600 + 120 per word
  - [`IDENTITY`](./src/precompiles/identity.zig) &mdash; 0x04: identity/copy function
    - `run()` &mdash; return input data unchanged (memory copy)
    - `calculate_gas()` &mdash; 15 + 3 per word
  - [`MODEXP`](./src/precompiles/modexp.zig) &mdash; ⚠️ (unaudited) 0x05: modular exponentiation
    - `run()` &mdash; compute (base^exp) mod modulus for arbitrary-precision integers
    - `calculate_gas()` &mdash; EIP-198/EIP-2565 complexity-based gas calculation
  - [`ECADD`](./src/precompiles/bn254_add.zig) &mdash; 0x06: BN254 elliptic curve addition (via Arkworks)
    - `run()` &mdash; add two BN254 G1 points (alt_bn128 curve)
    - `calculate_gas()` &mdash; returns fixed gas cost of 150
  - [`ECMUL`](./src/precompiles/bn254_mul.zig) &mdash; 0x07: BN254 elliptic curve multiplication (via Arkworks)
    - `run()` &mdash; scalar multiplication of BN254 G1 point
    - `calculate_gas()` &mdash; returns fixed gas cost of 6000
  - [`ECPAIRING`](./src/precompiles/bn254_pairing.zig) &mdash; 0x08: BN254 pairing check (via Arkworks)
    - `run()` &mdash; verify BN254 pairing equation for zkSNARK verification
    - `calculate_gas()` &mdash; 45000 + 34000 per pairing pair
  - [`BLAKE2F`](./src/precompiles/blake2f.zig) &mdash; ⚠️ (unaudited) 0x09: Blake2b compression function
    - `run()` &mdash; Blake2b F compression function (EIP-152)
    - `calculate_gas()` &mdash; 1 gas per round
  - [`POINT_EVALUATION`](./src/precompiles/point_evaluation.zig) &mdash; 0x0A: KZG point evaluation (EIP-4844)
    - `run()` &mdash; verify KZG commitment opens to claimed value at point
    - `calculate_gas()` &mdash; returns fixed gas cost of 50000
  - [`BLS12_G1ADD`](./src/precompiles/bls12_g1_add.zig) &mdash; 0x0B: BLS12-381 G1 addition
    - `run()` &mdash; add two BLS12-381 G1 points
    - `calculate_gas()` &mdash; returns fixed gas cost of 500
  - [`BLS12_G1MUL`](./src/precompiles/bls12_g1_mul.zig) &mdash; 0x0C: BLS12-381 G1 multiplication
    - `run()` &mdash; scalar multiplication of BLS12-381 G1 point
    - `calculate_gas()` &mdash; returns fixed gas cost of 12000
  - [`BLS12_G1MSM`](./src/precompiles/bls12_g1_msm.zig) &mdash; 0x0D: BLS12-381 G1 multi-scalar multiplication
    - `run()` &mdash; multi-scalar multiplication for multiple G1 points (optimized)
    - `calculate_gas()` &mdash; discount schedule: 12000 per pair with discounts for batching
  - [`BLS12_G2ADD`](./src/precompiles/bls12_g2_add.zig) &mdash; 0x0E: BLS12-381 G2 addition
    - `run()` &mdash; add two BLS12-381 G2 points
    - `calculate_gas()` &mdash; returns fixed gas cost of 800
  - [`BLS12_G2MUL`](./src/precompiles/bls12_g2_mul.zig) &mdash; 0x0F: BLS12-381 G2 multiplication
    - `run()` &mdash; scalar multiplication of BLS12-381 G2 point
    - `calculate_gas()` &mdash; returns fixed gas cost of 45000
  - [`BLS12_G2MSM`](./src/precompiles/bls12_g2_msm.zig) &mdash; 0x10: BLS12-381 G2 multi-scalar multiplication
    - `run()` &mdash; multi-scalar multiplication for multiple G2 points (optimized)
    - `calculate_gas()` &mdash; discount schedule: 45000 per pair with discounts for batching
  - [`BLS12_PAIRING`](./src/precompiles/bls12_pairing.zig) &mdash; 0x11: BLS12-381 pairing check
    - `run()` &mdash; verify BLS12-381 pairing equation
    - `calculate_gas()` &mdash; 115000 + 23000 per G1/G2 pair
  - [`BLS12_MAP_FP_TO_G1`](./src/precompiles/bls12_map_fp_to_g1.zig) &mdash; 0x12: BLS12-381 map field to G1
    - `run()` &mdash; hash-to-curve: map field element to G1 point
    - `calculate_gas()` &mdash; returns fixed gas cost of 5500
  - [`BLS12_MAP_FP2_TO_G2`](./src/precompiles/bls12_map_fp2_to_g2.zig) &mdash; 0x13: BLS12-381 map field to G2
    - `run()` &mdash; hash-to-curve: map Fp2 element to G2 point
    - `calculate_gas()` &mdash; returns fixed gas cost of 75000
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
