<div align="center">
  <h1>
    Ethereum primitives and cryptography
    <br/>
    <br/>
    <img width="240" height="240" alt="image" src="https://github.com/user-attachments/assets/492fabbc-d8d0-4f5b-b9f5-ea05adc5f8ca" />
  </h1>
  <sup>
    <a href="https://www.npmjs.com/package/@tevm/primitives">
       <img src="https://img.shields.io/npm/v/@tevm/primitives.svg" alt="npm version" />
    </a>
    <a href="https://github.com/evmts/primitives">
       <img src="https://img.shields.io/badge/zig-0.15.1+-orange.svg" alt="zig version" />
    </a>
    <a href="https://github.com/evmts/primitives/actions/workflows/ci.yml">
      <img src="https://github.com/evmts/primitives/actions/workflows/ci.yml/badge.svg" alt="CI status" />
    </a>
    <a href="https://github.com/evmts/primitives/blob/main/LICENSE">
      <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" />
    </a>
  </sup>
</div>

## Features

- **Simple apis** - The minimal apis needed for Ethereum development
- **Data-first architecture** - Branded primitive types with namespaced methods for optimal tree-shaking
- **All platforms** - Works in any JavaScript environment (Node.js, Bun, Deno, browsers)
- **High-performance** - High-performance Zig and rust implementations available to TypeScript projects
- **Type-safe** - Full TypeScript support with comprehensive type definitions
- **Zig support** - All primitives offered both in TypeScript and [Zig](./ZIG_API.md)

## Installation

```bash
npm install @tevm/primitives
```

```bash
bun add @tevm/primitives
```

```bash
pnpm install @tevm/primitives
```

Or use the [zig api](./ZIG_API.md)

```bash
# Install specific version (recommended)
zig fetch --save https://github.com/evmts/primitives/archive/refs/tags/v0.1.0.tar.gz

# Install latest from main branch
zig fetch --save git+https://github.com/evmts/primitives
```

## Quick Start

This library uses a **data-first architecture** with branded primitive types and namespaced methods:

```typescript
import { Address, Hash, U256, Keccak256 } from '@tevm/primitives';

// Address operations
const addr = Address.fromHex('0xa0cf798816d4b9b9866b5330eea46a18382f251e');
const checksum = Address.toChecksumHex(addr);
const isZero = Address.isZero(addr);

// Hash operations
const data = new Uint8Array([1, 2, 3]);
const hash = Keccak256.hash.call(data);
const hashHex = Hash.toHex(hash);

// U256 arithmetic
const a = U256.fromHex('0x100');
const b = U256.fromHex('0x200');
const sum = U256.add(a, b);
```

### Benefits

- **Tree-shaking**: Only methods you use are included in your bundle
- **Zero overhead**: No class instances, just primitives with type safety
- **Interop**: Easy to serialize, works seamlessly with other libraries
- **Performance**: Direct function calls, no prototype chain lookup

## What's Included

### TypeScript/JavaScript API

This library provides both WASM and native FFI implementations for browser and Node.js/Bun environments. The API is split across multiple modules for different use cases.

**Legend**: 🚧 Partial implementation (stubs for signing/verification, requires C API completion)

- [**WASM Primitives**](#wasm-primitives) — High-performance WebAssembly bindings
  - [`Address`](./src/typescript/wasm/primitives/address.wasm.ts) — Ethereum address type with EIP-55 checksumming
    - [`Address.fromHex(hex)`](./src/typescript/wasm/primitives/address.wasm.ts#L27) — create address from hex string
    - [`Address.fromBytes(bytes)`](./src/typescript/wasm/primitives/address.wasm.ts#L37) — create from 20-byte buffer
    - [`toHex()`](./src/typescript/wasm/primitives/address.wasm.ts#L45) — convert to lowercase hex string
    - [`toChecksumHex()`](./src/typescript/wasm/primitives/address.wasm.ts#L53) — convert to EIP-55 checksummed hex
    - [`isZero()`](./src/typescript/wasm/primitives/address.wasm.ts#L61) — check if zero address (0x0000...0000)
    - [`equals(other)`](./src/typescript/wasm/primitives/address.wasm.ts#L70) — compare addresses for equality
    - [`Address.validateChecksum(hex)`](./src/typescript/wasm/primitives/address.wasm.ts#L79) — validate EIP-55 checksum
    - [`Address.calculateCreateAddress(sender, nonce)`](./src/typescript/wasm/primitives/address.wasm.ts#L89) — compute CREATE contract address
    - [`Address.calculateCreate2Address(sender, salt, initCode)`](./src/typescript/wasm/primitives/address.wasm.ts#L101) — compute CREATE2 contract address
  - [`Hash`](./src/typescript/wasm/primitives/keccak.wasm.ts) — Keccak-256 hash type with constant-time comparison
    - [`Hash.keccak256(data)`](./src/typescript/wasm/primitives/keccak.wasm.ts#L26) — compute Keccak-256 hash
    - [`Hash.fromHex(hex)`](./src/typescript/wasm/primitives/keccak.wasm.ts#L39) — create from 32-byte hex string
    - [`Hash.fromBytes(bytes)`](./src/typescript/wasm/primitives/keccak.wasm.ts#L49) — create from 32-byte buffer
    - [`toHex()`](./src/typescript/wasm/primitives/keccak.wasm.ts#L57) — convert to hex string (66 chars: "0x" + 64 hex)
    - [`equals(other)`](./src/typescript/wasm/primitives/keccak.wasm.ts#L66) — constant-time hash comparison
    - [`keccak256(data)`](./src/typescript/wasm/primitives/keccak.wasm.ts#L92) — compute hash and return hex string
    - [`eip191HashMessage(message)`](./src/typescript/wasm/primitives/keccak.wasm.ts#L102) — EIP-191 personal message hash
  - [Hash Algorithms](./src/typescript/wasm/primitives/hash.wasm.ts) — Additional cryptographic hash functions
    - [`sha256(data)`](./src/typescript/wasm/primitives/hash.wasm.ts#L13) — SHA-256 hash (32 bytes)
    - [`ripemd160(data)`](./src/typescript/wasm/primitives/hash.wasm.ts#L30) — RIPEMD-160 hash (20 bytes)
    - [`blake2b(data)`](./src/typescript/wasm/primitives/hash.wasm.ts#L47) — BLAKE2b hash (64 bytes)
    - [`solidityKeccak256(packedData)`](./src/typescript/wasm/primitives/hash.wasm.ts#L64) — Solidity-style Keccak-256
    - [`soliditySha256(packedData)`](./src/typescript/wasm/primitives/hash.wasm.ts#L79) — Solidity-style SHA-256
  - [Hex Utilities](./src/typescript/wasm/primitives/hex.wasm.ts) — Hexadecimal encoding/decoding
    - `hexToBytes(hex)` — convert hex string to Uint8Array
    - `bytesToHex(bytes)` — convert bytes to hex string with 0x prefix
  - [RLP Encoding](./src/typescript/wasm/primitives/rlp.wasm.ts) — Recursive Length Prefix serialization
    - `rlpEncodeBytes(bytes)` — encode byte array to RLP format
    - `rlpEncodeUint(value)` — encode unsigned integer to RLP
    - `rlpEncodeUintFromBigInt(value)` — encode BigInt to RLP
    - `rlpToHex(data)` — encode data to hex string
    - `rlpFromHex(hex)` — decode RLP from hex string
  - [Bytecode Analysis](./src/typescript/wasm/primitives/bytecode.wasm.ts) — EVM bytecode utilities with jump destination analysis
    - `analyzeJumpDestinations(bytecode)` — find all valid JUMPDEST positions
    - `isValidJumpDest(bytecode, position)` — check if position is valid JUMPDEST
    - `validateBytecode(bytecode)` — validate bytecode structure
    - `isBytecodeBoundary(bytecode, position)` — check if at opcode boundary
  - [Signatures (secp256k1)](./src/typescript/wasm/primitives/signature.wasm.ts) — ECDSA signature operations
    - `secp256k1RecoverPubkey(hash, signature)` — recover 64-byte public key from signature
    - `secp256k1RecoverAddress(hash, signature)` — recover address from signature and hash
    - `secp256k1PubkeyFromPrivate(privateKey)` — derive public key from private key
    - `secp256k1ValidateSignature(signature)` — validate signature format and components
    - `signatureNormalize(signature)` — normalize signature to canonical form (low-s)
    - `signatureIsCanonical(signature)` — check if signature is canonical
    - `signatureParse(signature)` — parse signature into r, s, v components
    - `signatureSerialize(r, s, v)` — serialize components into 65-byte signature
  - [Transactions](./src/typescript/wasm/primitives/transaction.wasm.ts) — Transaction type detection
    - `detectTransactionType(data)` — detect type from raw transaction data
    - `TransactionType` — enum (Legacy, EIP1559, EIP2930, EIP4844, EIP7702)
  - [U256 Operations](./src/typescript/wasm/primitives/uint256.wasm.ts) — 256-bit unsigned integer utilities
    - `u256FromHex(hex)` — parse hex string to u256 bytes
    - `u256ToHex(bytes)` — convert u256 bytes to hex string
    - `u256FromBigInt(value)` — convert BigInt to u256 bytes
    - `u256ToBigInt(bytes)` — convert u256 bytes to BigInt
  - [Wallet](./src/typescript/wasm/primitives/wallet.wasm.ts) — Key generation utilities
    - `generatePrivateKey()` — generate cryptographically secure random private key
    - `compressPublicKey(publicKey)` — compress 64-byte public key to 33-byte format
      <br/>
      <br/>
- [**Cryptography (Native FFI)**](#cryptography) — Native Zig implementations via FFI
  - 🚧 [Keccak-256](./src/crypto/keccak.ts) — Primary Ethereum hash function
    - [`keccak256(data)`](./src/crypto/keccak.ts#L53) — compute Keccak-256 hash via native FFI
    - [`keccak256Empty()`](./src/crypto/keccak.ts#L95) — pre-computed empty hash constant
  - 🚧 [EIP-191](./src/crypto/eip191.ts) — Personal message signing (EIP-191: Signed Data Standard)
    - [`hashMessage(message)`](./src/crypto/eip191.ts#L42) — hash with "\x19Ethereum Signed Message:\n{length}" prefix
    - [`signMessage(message, privateKey)`](./src/crypto/eip191.ts#L87) — sign message (stub, requires C API)
    - [`verifyMessage(message, signature, address)`](./src/crypto/eip191.ts#L105) — verify signature (stub, requires C API)
    - [`recoverMessageAddress(message, signature)`](./src/crypto/eip191.ts#L123) — recover signer (stub, requires C API)
  - 🚧 [EIP-712](./src/crypto/eip712.ts) — Typed structured data signing (⚠️ UNAUDITED in Zig)
    - [`hashTypedData(typedData)`](./src/crypto/eip712.ts#L223) — hash typed data (keccak256("\x19\x01" ‖ domainSeparator ‖ hashStruct))
    - [`hashDomain(domain)`](./src/crypto/eip712.ts#L186) — compute EIP-712 domain separator hash
    - [`signTypedData(typedData, privateKey)`](./src/crypto/eip712.ts#L246) — sign typed data (stub, requires C API)
    - [`verifyTypedData(typedData, signature, address)`](./src/crypto/eip712.ts#L264) — verify signature (stub, requires C API)
    - [`recoverTypedDataAddress(typedData, signature)`](./src/crypto/eip712.ts#L282) — recover signer (stub, requires C API)
  - 🚧 [Hash Algorithms](./src/crypto/hash-algorithms.ts) — Additional hash functions (stubs, require C API)
    - `sha256(data)` — SHA-256 hash
    - `ripemd160(data)` — RIPEMD-160 hash
    - `blake2b(data)` — BLAKE2b hash
  - 🚧 [secp256k1](./src/crypto/secp256k1.ts) — Elliptic curve operations (stubs, require C API)
    - Constants: `SECP256K1_P`, `SECP256K1_N`, `SECP256K1_Gx`, `SECP256K1_Gy`
    - Point operations: `isOnCurve`, `add`, `double`, `multiply`, `negate`
    - `extractRecoveryId(signature)` — extract v from signature
  - 🚧 [Wallet & Mnemonic](./src/crypto/wallet.ts) — BIP-32/BIP-39 (stubs)
    - `Mnemonic` — BIP-39 mnemonic phrase management
      - `fromPhrase(phrase)` — create from phrase
      - `fromEntropy(entropy)` — create from entropy
      - `isValidMnemonic(phrase)` — validate phrase
      - `computeSeed(password)` — derive seed
    - `HDNodeWallet` — BIP-32 HD wallet derivation
      - `deriveChild(index)` — derive child at index
      - `derivePath(path)` — derive at path (e.g., "m/44'/60'/0'/0/0")
      - `fromMnemonic(mnemonic)` — create from mnemonic
      - `neuter()` — create neutered wallet (public only)
    - `HDNodeVoidWallet` — neutered HD wallet (no private keys)
    - `Wallet` — wallet with private key
      - `fromPrivateKey(key)` — create from private key
      - `fromMnemonic(mnemonic)` — create from mnemonic
      - `encrypt(password)` — encrypt to JSON keystore
    - `defaultPath`, `getAccountPath(index)`, `getIndexedAccountPath(index)` — derivation paths
  - 🚧 [Keystore](./src/crypto/keystore.ts) — JSON wallet encryption (stubs)
    - `encryptKeystoreJson(privateKey, password)` — encrypt to JSON
    - `decryptKeystoreJson(json, password)` — decrypt from JSON
    - `isKeystoreJson(json)` — validate keystore format
    - `decryptCrowdsaleJson(json, password)` — legacy crowdsale format
    - `isCrowdsaleJson(json)` — validate crowdsale format
  - 🚧 [Wordlists](./src/crypto/wordlists.ts) — BIP-39 wordlists (stubs)
    - `Wordlist` — abstract base class
    - `WordlistOwl` — compressed ASCII-7 format
    - `WordlistOwlA` — compressed Latin-1 with diacritics
    - Languages: `LangEn`, `LangEs`, `LangFr`, `LangIt`, `LangPt`, `LangJa`, `LangKo`, `LangCz`, `LangZhCn`, `LangZhTw`
  - 🚧 [Crypto Extensions](./src/crypto/crypto-extensions.ts) — Additional crypto functions (stubs)
    - `sha512(data)` — SHA2-512 hash
    - `computeHmac(algorithm, key, data)` — HMAC with SHA256/SHA512
    - `pbkdf2(password, salt, iterations, keylen, algo)` — PBKDF2 key derivation
    - `scrypt(password, salt, N, r, p, keylen)` — scrypt (async)
    - `scryptSync(...)` — scrypt (sync)
    - `computeSharedSecret(privateKey, publicKey)` — ECDH
    - `addPoints(p1, p2)` — elliptic curve point addition
      <br/>
      <br/>
- [**Ethereum Types**](#ethereum-types) — Standard TypeScript interfaces
  - [Base Types](./src/ethereum-types/base-types.ts) — Common type aliases
    - `Address` — 20-byte Ethereum address (`0x${string}`)
    - `Bytes`, `Bytes32`, `Bytes256` — Variable and fixed-length byte arrays
    - `Hash32` — 32-byte hash (transaction/block hash)
    - `Uint`, `Uint64`, `Uint256` — Unsigned integers as hex strings
    - `BlockTag`, `BlockNumber`, `BlockIdentifier` — Block reference types
  - [TransactionInfo](./src/ethereum-types/transaction-info.ts) — All transaction types (Legacy, EIP-1559, EIP-2930, EIP-4844, EIP-7702)
  - [ReceiptInfo](./src/ethereum-types/receipt-info.ts) — Transaction receipt with logs and status
  - [Log](./src/ethereum-types/log.ts) — Event log with topics and data
  - [Block](./src/ethereum-types/block.ts) — Block header and body structures
  - [Filter](./src/ethereum-types/filter.ts) — Event filter criteria for eth_getLogs
  - [Withdrawal](./src/ethereum-types/withdrawal.ts) — EIP-4895 beacon chain withdrawal data
    <br/>
    <br/>
- [**Utilities**](#utilities) — Low-level utilities for Ethereum development
  - [ABI Utilities](./src/utils/abi.ts) — Encoding/decoding for function calls, events, and errors
    - `decodeFunctionResult(abi, data)` — decode function return values from bytes
    - `decodeFunctionData(abi, data)` — decode function parameters from calldata
    - `encodeFunctionData(abi, args)` — encode function call with 4-byte selector
    - `encodeFunctionResult(abi, values)` — encode function return values
    - `decodeEventLog(abi, data, topics)` — decode event log data and topics
    - `encodeEventTopics(abi, args)` — encode event topics for filtering
    - `decodeErrorResult(abi, data)` — decode custom error parameters
    - `encodeErrorResult(abi, args)` — encode custom error with selector
    - `getFunctionSelector(signature)` — compute 4-byte function selector
    - `getEventSelector(signature)` — compute 32-byte event topic hash
    - `getErrorSelector(signature)` — compute 4-byte error selector
    - `encodePacked(types, values)` — Solidity-style packed encoding
    - `decodeAbiParameters(types, data)` — decode ABI-encoded parameters
    - `encodeAbiParameters(types, values)` — encode parameters using ABI encoding
  - [Unit Conversion](./src/utils/units.ts) — Convert between wei, gwei, and ether
    - `formatEther(wei, decimals)` — format wei to ether string
    - `formatGwei(wei, decimals)` — format wei to gwei string
    - `formatUnits(wei, unit)` — format wei with custom unit decimals
    - `parseEther(ether)` — parse ether string to wei
    - `parseGwei(gwei)` — parse gwei string to wei
    - `parseUnits(value, unit)` — parse custom unit string to wei
  - [Blob/KZG Utilities](./src/utils/blobs.ts) — EIP-4844 blob transaction utilities
    - `toBlob(data)` — convert data to blob format (128KB)
    - `fromBlob(blob)` — extract original data from blob
    - `blobToKzgCommitment(blob)` — compute KZG commitment (48 bytes)
    - `computeBlobKzgProof(blob, commitment)` — generate KZG proof
    - `verifyBlobKzgProof(blob, commitment, proof)` — verify single KZG proof
    - `verifyBlobKzgProofBatch(blobs, commitments, proofs)` — verify batch of proofs
    - `commitmentToVersionedHash(commitment, version)` — compute versioned hash
    - `extractBlobVersionedHashes(transaction)` — extract hashes from blob tx
    - `computeBlobGasUsed(blobCount)` — compute gas used by blobs
    - `computeBlobGasPrice(excessBlobGas)` — compute blob gas price
  - [Signature Utilities](./src/utils/signatures.ts) — Advanced signature operations
    - `recoverAddress(hash, signature)` — recover address from signature
    - `recoverPublicKey(hash, signature)` — recover public key from signature
    - `signHash(hash, privateKey)` — sign message hash with private key
    - `verifySignature(hash, signature, address)` — verify signature against address
    - `parseSignature(signature)` — parse signature into r, s, v components
    - `serializeSignature(components)` — serialize components to 65-byte signature
    - `normalizeSignature(signature)` — normalize to canonical form (low-s)
    - `isCanonicalSignature(signature)` — check if signature is canonical
    - `compactSignature(signature)` — encode as ERC-2098 compact (64 bytes)
    - `decompactSignature(compact)` — decode compact signature to standard
    - `verifyErc1271Signature(hash, signature, address)` — verify smart contract signature
    - `verifyErc6492Signature(hash, signature, address)` — verify universal signature (undeployed contracts)
    - `verifyErc8010Signature(hash, signature, paymaster)` — verify paymaster signature
    - `extractV(signature)` — extract v (recovery id) from signature
    - `extractYParity(signature)` — extract yParity from signature
    - `vToYParity(v)` — convert v to yParity (0 or 1)
    - `yParityToV(yParity)` — convert yParity to v (27 or 28)
  - [Hex Utilities](./src/utils/hex-utils.ts) — Extended hex string manipulation
    - `boolToHex(value)` — encode boolean as hex
    - `hexToBool(hex)` — decode hex to boolean
    - `numberToHex(value)` — encode number/bigint as hex
    - `hexToNumber(hex)` — decode hex to number
    - `hexToBigInt(hex)` — decode hex to bigint
    - `hexSize(hex)` — get size in bytes
    - `isHex(hex)` — validate hex string format
    - `padHex(hex, size)` — pad with zeros to size
    - `trimHex(hex)` — remove leading zeros
    - `sliceHex(hex, start, end)` — slice by byte positions
    - `concatHex(hexStrings)` — concatenate multiple hex strings
    - `stringToHex(value)` — encode UTF-8 string as hex
    - `hexToString(hex)` — decode hex to UTF-8 string
    - `hexEquals(a, b)` — compare hex strings for equality
  - [ENS Utilities](./src/utils/ens.ts) — Ethereum Name Service utilities
    - `namehash(name)` — compute EIP-137 namehash (32 bytes)
    - `labelHash(label)` — hash single ENS label
    - `normalize(name)` — normalize ENS name (UTS-46)
    - `isValidName(name)` — validate ENS name format
    - `getParentDomain(name)` — extract parent domain
    - `getLabel(name)` — extract first label
    - `encodeDnsName(name)` — encode to DNS wire format
    - `decodeDnsName(encoded)` — decode DNS wire format
  - [SIWE Utilities](./src/utils/siwe.ts) — EIP-4361 Sign-In with Ethereum
    - `parseSiweMessage(message)` — parse SIWE message string
    - `formatSiweMessage(fields)` — format SIWE fields to string
    - `validateSiweMessage(message)` — validate SIWE format and fields
    - `generateSiweNonce(length)` — generate cryptographically secure nonce
    - `verifySiweMessage(message, signature)` — verify SIWE signature
    - `hashSiweMessage(message)` — hash SIWE message for signing
    - `isSiweMessageExpired(message, now)` — check if message is expired
    - `isSiweMessageNotYetValid(message, now)` — check if message is not yet valid
  - [Authorization Utilities](./src/utils/authorization.ts) — EIP-7702 set code authorization
    - `createAuthorization(chainId, address, nonce, privateKey)` — create signed authorization
    - `hashAuthorization(authorization)` — hash authorization for signing
    - `verifyAuthorization(authorization)` — verify authorization signature
    - `recoverAuthorizationAddress(authorization)` — recover signer address
    - `encodeAuthorizationList(authorizations)` — encode authorization list (RLP)
    - `decodeAuthorizationList(encoded)` — decode authorization list from RLP
    - `getAuthority(authorization)` — compute authority (delegating account)
  - 🚧 [ABI Interface](./src/utils/abi-interface.ts) — Enhanced ABI parsing (stubs)
    - `Interface` — comprehensive ABI operations
      - `parseTransaction(data)` — parse tx to `TransactionDescription`
      - `parseLog(log)` — parse event to `LogDescription`
      - `parseError(data)` — parse error to `ErrorDescription`
      - `parseCallResult(data)` — parse call result
      - `getFunction(key)`, `getEvent(key)`, `getError(key)` — get fragments
      - `hasFunction(key)`, `hasEvent(key)` — check existence
      - `forEachFunction()`, `forEachEvent()`, `forEachError()` — iteration
    - Fragment types: `FunctionFragment`, `EventFragment`, `ErrorFragment`, `ConstructorFragment`, `FallbackFragment`
    - `Result` — array with named access
      - `toArray()`, `toObject()`, `getValue(name)`
    - `Typed` — values with explicit type info
      - `uint8()`, `uint256()`, `address()`, `bytes()`, `string()`, `bool()`
    - `Indexed` — indexed event parameter marker
    - `encodeBytes32String(text)`, `decodeBytes32String(data)`
  - 🚧 [Hash Extensions](./src/utils/hash-extensions.ts) — Additional hash utilities (stubs)
    - `id(text)` — keccak256 of UTF-8 string
    - `solidityPacked(types, values)` — non-standard packed encoding
    - `solidityPackedKeccak256(types, values)` — keccak256 of packed
    - `solidityPackedSha256(types, values)` — SHA256 of packed
    - `namehash(name)` — EIP-137 ENS namehash
    - `ensNormalize(name)` — UTS-46 normalization
    - `dnsEncode(name)` — DNS wire format
    - `isValidName(name)` — validate ENS name
    - `labelHash(label)` — hash ENS label
  - 🚧 [Signature Extensions](./src/utils/signature-extensions.ts) — Signature verification (stubs)
    - `Signature` — class with r, s, v components
      - `from(signature)`, `serialize()`, `toCompact()`, `fromCompact()`
    - `verifyMessage(message, signature, address)` — verify EIP-191 signature
    - `verifyTypedData(domain, types, value, signature, address)` — verify EIP-712
    - `verifyAuthorization(auth, signature, signer)` — verify EIP-7702
  - 🚧 [Encoding](./src/utils/encoding.ts) — Base58/Base64/UTF-8 (stubs)
    - `encodeBase58(data)`, `decodeBase58(text)` — Base58 encoding
    - `encodeBase64(data)`, `decodeBase64(text)` — Base64 encoding
    - `toUtf8String(bytes, onError)` — UTF-8 with error handling
    - `toUtf8Bytes(text)` — string to UTF-8 bytes
    - `toUtf8CodePoints(bytes, onError)` — extract code points
    - `Utf8ErrorFuncs` — error/ignore/replace strategies
  - 🚧 [Bytes](./src/utils/bytes.ts) — Byte manipulation (stubs)
    - `concat(arrays)` — combine byte arrays
    - `dataSlice(data, start, end)` — extract portion
    - `stripZerosLeft(data)` — remove leading zeros
    - `zeroPadValue(value, length)` — left-pad
    - `zeroPadBytes(data, length)` — right-pad
    - `isBytesLike(value)`, `isHexString(value, length)` — validators
    - `dataLength(data)` — get byte count
    - `getBytes(value)`, `getBytesCopy(value)` — to Uint8Array
    - `hexlify(value)` — to hex string
  - 🚧 [Math](./src/utils/math.ts) — Math utilities (stubs)
    - `toTwos(value, width)`, `fromTwos(value, width)` — two's complement
    - `mask(value, bitcount)` — apply bitmask
    - `toBeArray(value)` — big-endian byte array
    - `toBeHex(value, width)` — big-endian hex
    - `toQuantity(value)` — safe hex for JSON-RPC
    - `toBigInt(value)`, `toNumber(value)` — conversions
    - `getBigInt(value)`, `getNumber(value)`, `getUint(value)` — safe getters
  - 🚧 [Transaction Utils](./src/utils/transaction-utils.ts) — Transaction helpers (stubs)
    - `Transaction` — class with type detection
      - `serialized`, `unsignedSerialized`, `unsignedHash`
      - `isSigned()`, `clone()`, `inferType()`, `inferTypes()`
    - `inferType(tx)`, `inferTypes(tx)` — type detection
    - `isLegacy(tx)`, `isBerlin(tx)`, `isLondon(tx)`, `isCancun(tx)` — type checks
    - `accessListify(accessList)` — normalize access lists
  - 🚧 [Address Extensions](./src/utils/address-extensions.ts) — Additional address utils (stubs)
    - `isAddress(value)` — validate address
    - `isAddressable(value)` — check Addressable interface
    - `getAddress(address)` — normalized checksummed address
    - `getIcapAddress(address)` — ICAP format (deprecated)
    - `resolveAddress(target)` — resolve from Addressable/promise
  - 🚧 [Constants](./src/utils/constants.ts) — Common constants (stubs)
    - `MaxInt256`, `MinInt256`, `MaxUint256` — integer bounds
    - `N` — secp256k1 curve order
    - `WeiPerEther` — 10^18
    - `ZeroAddress`, `ZeroHash` — zero values
    - `EtherSymbol` — "Ξ" (NFKC normalized)
    - `MessagePrefix` — "\x19Ethereum Signed Message:\n"
  - 🚧 [Contract](./src/utils/contract.ts) — Contract utilities (stubs)
    - `EventLog` — parsed event log with named args
    - `UndecodedEventLog` — decode failure capture
    - `BaseContractMethod` — method fragment access
    - `ContractEvent` — event fragment access
  - 🚧 [Misc](./src/utils/misc.ts) — Miscellaneous utilities (stubs)
    - `uuidV4()` — generate UUID v4
    - `defineProperties(target, properties)` — define properties
    - `resolveProperties(object)` — resolve all promises
      <br/>
      <br/>
- [**Precompiles**](#precompiles) — All 19 EVM precompiled contracts
  - [Precompile Execution](./src/precompiles/precompiles.ts) — Gas cost calculations and dispatch
    - [`isPrecompile(address, hardfork)`](./src/precompiles/precompiles.ts#L42) — check if address is precompile for hardfork
    - [`execute(address, input, gasLimit, hardfork)`](./src/precompiles/precompiles.ts#L116) — execute precompile and return result
    - Individual precompile functions (gas calculations only, crypto requires native bindings):
      - [`ecrecover(input, gasLimit)`](./src/precompiles/precompiles.ts#L196) — 0x01: Recover signer from ECDSA signature (3000 gas)
      - [`sha256(input, gasLimit)`](./src/precompiles/precompiles.ts#L216) — 0x02: SHA-256 hash (60 + 12/word gas)
      - [`ripemd160(input, gasLimit)`](./src/precompiles/precompiles.ts#L233) — 0x03: RIPEMD-160 hash (600 + 120/word gas)
      - [`identity(input, gasLimit)`](./src/precompiles/precompiles.ts#L254) — 0x04: Identity/copy (15 + 3/word gas)
      - [`modexp(input, gasLimit)`](./src/precompiles/precompiles.ts#L274) — 0x05: Modular exponentiation (200 gas base)
      - [`bn254Add(input, gasLimit)`](./src/precompiles/precompiles.ts#L293) — 0x06: BN254 elliptic curve addition (150 gas)
      - [`bn254Mul(input, gasLimit)`](./src/precompiles/precompiles.ts#L313) — 0x07: BN254 scalar multiplication (6000 gas)
      - [`bn254Pairing(input, gasLimit)`](./src/precompiles/precompiles.ts#L333) — 0x08: BN254 pairing check (45000 + 34000k gas)
      - [`blake2f(input, gasLimit)`](./src/precompiles/precompiles.ts#L354) — 0x09: Blake2b compression (rounds gas)
      - [`pointEvaluation(input, gasLimit)`](./src/precompiles/precompiles.ts#L380) — 0x0a: KZG point evaluation for EIP-4844 (50000 gas)
      - BLS12-381 precompiles (EIP-2537, active from Prague hardfork):
        - [`bls12G1Add(input, gasLimit)`](./src/precompiles/precompiles.ts#L399) — 0x0b: G1 addition (500 gas)
        - [`bls12G1Mul(input, gasLimit)`](./src/precompiles/precompiles.ts#L418) — 0x0c: G1 multiplication (12000 gas)
        - [`bls12G1Msm(input, gasLimit)`](./src/precompiles/precompiles.ts#L438) — 0x0d: G1 multi-scalar multiplication (12000k gas)
        - [`bls12G2Add(input, gasLimit)`](./src/precompiles/precompiles.ts#L457) — 0x0e: G2 addition (800 gas)
        - [`bls12G2Mul(input, gasLimit)`](./src/precompiles/precompiles.ts#L476) — 0x0f: G2 multiplication (45000 gas)
        - [`bls12G2Msm(input, gasLimit)`](./src/precompiles/precompiles.ts#L495) — 0x10: G2 multi-scalar multiplication (45000k gas)
        - [`bls12Pairing(input, gasLimit)`](./src/precompiles/precompiles.ts#L515) — 0x11: Pairing check (115000 + 23000k gas)
        - [`bls12MapFpToG1(input, gasLimit)`](./src/precompiles/precompiles.ts#L535) — 0x12: Map field element to G1 (5500 gas)
        - [`bls12MapFp2ToG2(input, gasLimit)`](./src/precompiles/precompiles.ts#L554) — 0x13: Map field element to G2 (75000 gas)

For the complete Zig API with low-level implementations, see [ZIG_API.md](./ZIG_API.md).

## License

MIT License - see [LICENSE](./LICENSE) for details

## Alternatives

- [Viem](https://viem.sh) - A highly popular JavaScript ethereum library
- [Ethers]()

## Dependencies

This library has **zero runtime dependencies** for the TypeScript/JavaScript API. All functionality is provided through:

- **WASM bindings** — Self-contained WebAssembly module compiled from Zig (82KB)
- **Native FFI** — Optional native bindings via Bun FFI or Node.js `ffi-napi` for better performance

### Optional Dependencies

- `ffi-napi` ^4.0.3 — Node.js FFI bindings (optional, for native performance in Node.js)
- `ref-napi` ^3.0.3 — Node.js FFI type helpers (optional, for native bindings)

These are marked as `optionalDependencies` and are only needed if using native FFI mode in Node.js. Bun provides built-in FFI support.

## Dev Dependencies

### Build Tools

- **Zig 0.15.1+** — Systems programming language for native implementations ([download](https://ziglang.org/download/))
- **Cargo (Rust)** — Required for building Rust crypto dependencies ([install](https://www.rust-lang.org/tools/install))
- **TypeScript 5.7.2** — Type checking and compilation
- **Bun** — Fast JavaScript runtime with built-in FFI support

### Testing & Benchmarking

- **Vitest 2.1.8** — Fast unit test framework
- **Mitata 1.0.34** — High-precision benchmarking

### Code Quality

- **Biome 1.9.4** — Fast linter and formatter for TypeScript/JavaScript
- **TypeScript** — Static type checking

### Comparison Libraries (for testing/benchmarks)

- **Viem 2.21.54** — Reference Ethereum library
- **Ethers 6.13.4** — Reference Ethereum library
- **@noble/curves 2.0.1** — Reference elliptic curve implementations
- **@noble/hashes 2.0.1** — Reference hash implementations

### Additional Tools

- **glob 11.0.0** — File pattern matching
- **bindings 1.5.0** — Helper for loading native modules

## Links

- [GitHub Issues](https://github.com/evmts/primitives/issues)
- [Telegram](https://t.me/+ANThR9bHDLAwMjUx)
- [Twitter](https://twitter.com/tevmtools)
