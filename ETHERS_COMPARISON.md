# Missing Features vs ethers.js v6

Excludes: JSON-RPC, HTTP, Provider, Network features (separate client package)

## HIGH Priority

### Wallet/Mnemonic (BIP-32/BIP-39)
- `Mnemonic` class: phrase generation, entropy↔phrase, validation
- `HDNodeWallet`: BIP-32 hierarchical derivation
  - `deriveChild(index)`, `derivePath(path)`
  - `defaultPath` ("m/44'/60'/0'/0/0")
  - `getAccountPath(index)`, `getIndexedAccountPath(index)`
- `Wallet` class: create from mnemonic/private key/JSON
- JSON Keystore: `encryptKeystoreJson()`, `decryptKeystoreJson()`, `isKeystoreJson()`
- Crowdsale format: `decryptCrowdsaleJson()`, `isCrowdsaleJson()`
- BIP-39 Wordlists: 10 languages (en, es, fr, it, pt, ja, ko, cz, zh_cn, zh_tw)
  - `Wordlist.getWord(index)`, `getWordIndex(word)`, `split()`, `join()`
- Mnemonic lengths: 12/15/18/21/24 words

### ABI Enhancements
- `Interface` class: comprehensive ABI parsing/encoding
  - `parseTransaction(data)` → `TransactionDescription`
  - `parseLog(log)` → `LogDescription`
  - `parseError(data)` → `ErrorDescription`
  - `parseCallResult(data)`
  - `getFunction(key)`, `getEvent(key)`, `getError(key)`
  - `hasFunction()`, `hasEvent()`, iteration methods
- Fragment types: `FunctionFragment`, `EventFragment`, `ErrorFragment`, `ConstructorFragment`, `FallbackFragment`
- `Result` class: array subclass with named access
  - `toArray()`, `toObject()`, `getValue(name)`
- `Typed` class: values with explicit type info
- `encodeBytes32String()` / `decodeBytes32String()`
- `checkResultErrors()`

### Hash Utilities
- `id(text)`: keccak256 UTF-8 string → 32-byte identifier
- `solidityPacked(types, values)`: non-standard packed mode
- `solidityPackedKeccak256(types, values)`
- `solidityPackedSha256(types, values)`
- ENS:
  - `namehash(name)`: EIP-137 namehash
  - `ensNormalize(name)`: UTS-46 normalization
  - `dnsEncode(name)`, `isValidName(name)`
  - `labelHash(label)`

### Signature Utilities
- `verifyMessage(msg, sig)`: recover + compare
- `verifyTypedData(domain, types, value, sig)`
- `verifyAuthorization(auth, sig)`: EIP-7702
- `Signature` class: r, s, v management

## MEDIUM Priority

### Crypto Extensions
- `sha512(data)`: SHA2-512 hash
- `computeHmac(algorithm, key, data)`: SHA256/SHA512 HMAC
- `pbkdf2(password, salt, iterations, keylen, algo)`
- `scrypt(password, salt, N, r, p, keylen)`, `scryptSync()`
- `computeSharedSecret(privateKey, publicKey)`: ECDH
- `addPoints(p1, p2)`: EC point addition

### Encoding
- Base58: `encodeBase58(data)`, `decodeBase58(text)`
- Base64: `encodeBase64(data)`, `decodeBase64(text)`
- UTF-8 error handling: `Utf8ErrorFuncs` (error/ignore/replace)
  - `toUtf8CodePoints(bytes, onError)`

### Byte Utilities
- `concat(arrays)`: combine byte arrays
- `dataSlice(data, start, end)`: extract portion
- `stripZerosLeft(data)`: remove leading zeros
- `zeroPadValue(value, length)`: left-pad
- `zeroPadBytes(data, length)`: right-pad
- `isBytesLike(value)`, `isHexString(value, length?)`
- `dataLength(data)`: byte count

### Math Utilities
- `toTwos(value, width)` / `fromTwos(value, width)`: two's complement
- `mask(value, bitcount)`: apply bitmask
- `toBeArray(value)`: big-endian byte array
- `toBeHex(value, width?)`: big-endian hex
- `toQuantity(value)`: safe hex for JSON-RPC

### Transaction Utilities
- `Transaction` class methods:
  - `serialized`, `unsignedSerialized`, `unsignedHash`
  - `isSigned()`, `clone()`
- `inferType()`: determine tx type from properties
- `inferTypes()`: list all compatible types
- `isLegacy()`, `isBerlin()`, `isLondon()`, `isCancun()`
- `accessListify(accessList)`: normalize access lists

## LOW Priority

### Address Utilities
- `isAddress(value)`: validate with checksum
- `isAddressable(value)`: check Addressable interface
- `getIcapAddress(address)`: ICAP format (deprecated)
- `resolveAddress(target)`: handle Addressable/promises

### Constants
- `MaxInt256`: max signed 256-bit int
- `MinInt256`: min signed 256-bit int
- `MaxUint256`: max unsigned 256-bit int (we have via u256)
- `N`: secp256k1 curve order (we have in secp256k1.zig)
- `WeiPerEther`: 10^18 (we have unit conversions)
- `EtherSymbol`: "Ξ" (NFKC normalized)
- `MessagePrefix`: "\x19Ethereum Signed Message:\n" (we have in EIP-191)

### Contract Utilities
- `ContractInterface`: offline ABI manipulation
- `EventLog`: parsed log with named args
- `UndecodedEventLog`: capture decode failures
- `BaseContractMethod`: method fragment access
- `ContractEvent`: event fragment access

### Misc
- `uuidV4()`: generate UUID v4
- `defineProperties()` / `resolveProperties()`
- Signature methods:
  - `lock()`: freeze crypto primitive implementations

## Implementation Notes

### Already Have (Don't Need)
- ✅ Address: checksum, CREATE/CREATE2, conversions, zero address
- ✅ Hash: keccak256, sha256, ripemd160, blake2b
- ✅ Transactions: all types (0-4), serialization
- ✅ ABI: encode/decode types, selectors, event topics, packed
- ✅ Crypto: ECDSA, key derivation, EIP-712
- ✅ RLP: encode/decode
- ✅ Hex: utilities, validation, conversion
- ✅ Units: wei/gwei/ether conversions, parseEther/formatEther
- ✅ Precompiles: all 19 standard precompiles
- ✅ Advanced crypto: BN254, BLS12-381, KZG
- ✅ EIP-191: message hashing
- ✅ SIWE: EIP-4361 support
- ✅ Authorization: EIP-7702

### Scope Differences
- ethers.js: High-level abstractions, developer ergonomics
- primitives: Low-level building blocks, performance focus
- Many ethers.js features are conveniences wrapping existing functionality
