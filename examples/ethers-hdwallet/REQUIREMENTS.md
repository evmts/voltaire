# Ethers v6 HD Wallet API Requirements

Extracted from ethers v6.13.x source code for compatibility.

## Overview

The ethers HD wallet implementation provides BIP-32 hierarchical deterministic key derivation with BIP-39 mnemonic support.

## Mnemonic Class

### Properties
- `phrase: string` - 12/15/18/21/24 word mnemonic phrase
- `password: string` - Optional passphrase (default: "")
- `wordlist: Wordlist` - BIP-39 wordlist (default: English)
- `entropy: string` - Underlying entropy as hex string

### Static Methods
- `fromPhrase(phrase, password?, wordlist?)` - Create from phrase
- `fromEntropy(entropy, password?, wordlist?)` - Create from entropy bytes
- `entropyToPhrase(entropy, wordlist?)` - Convert entropy to phrase
- `phraseToEntropy(phrase, wordlist?)` - Convert phrase to entropy
- `isValidMnemonic(phrase, wordlist?)` - Validate mnemonic

### Instance Methods
- `computeSeed()` - Returns 64-byte seed via PBKDF2 (2048 iterations, SHA-512)

## HDNodeWallet Class

### Properties
- `publicKey: string` - Compressed public key (33 bytes hex)
- `fingerprint: string` - 4-byte fingerprint (hex)
- `parentFingerprint: string` - Parent's fingerprint
- `mnemonic: Mnemonic | null` - Source mnemonic if available
- `chainCode: string` - 32-byte chain code (hex)
- `path: string | null` - Full derivation path
- `index: number` - Child index
- `depth: number` - Derivation depth
- `privateKey: string` - Private key (hex, from BaseWallet)
- `address: string` - Ethereum address (from BaseWallet)

### Static Methods
- `fromMnemonic(mnemonic, path?)` - Create from Mnemonic instance
- `fromPhrase(phrase, password?, path?, wordlist?)` - Create from phrase string
- `fromSeed(seed)` - Create from raw seed bytes
- `fromExtendedKey(extendedKey)` - Create from xprv/xpub string
- `createRandom(password?, path?, wordlist?)` - Generate new random wallet

### Instance Methods
- `derivePath(path)` - Derive child by path string
- `deriveChild(index)` - Derive child by index
- `neuter()` - Return HDNodeVoidWallet (public-only)
- `connect(provider)` - Connect to provider
- `encrypt(password, progressCallback?)` - Encrypt to JSON keystore (async)
- `encryptSync(password)` - Encrypt to JSON keystore (sync)
- `hasPath()` - Type guard for path !== null

### Computed Properties
- `extendedKey: string` - Base58-encoded xprv key

## HDNodeVoidWallet Class

Public-key-only variant for address derivation without private keys.

### Properties
Same as HDNodeWallet except no `privateKey` or `mnemonic`

### Static Methods
- Created via `HDNodeWallet.neuter()` or `fromExtendedKey(xpub)`

### Instance Methods
- `derivePath(path)` - Derive child (non-hardened only)
- `deriveChild(index)` - Derive child (non-hardened only)
- `connect(provider)` - Connect to provider
- `hasPath()` - Type guard

## Helper Functions

- `defaultPath = "m/44'/60'/0'/0/0"` - Standard Ethereum path
- `getAccountPath(index)` - Returns `m/44'/60'/${index}'/0/0` (Ledger style)
- `getIndexedAccountPath(index)` - Returns `m/44'/60'/0'/0/${index}` (MetaMask style)

## Constants

- `HardenedBit = 0x80000000` - Bit for hardened derivation
- `N` - secp256k1 curve order
- `MasterSecret = "Bitcoin seed"` - HMAC key for master derivation

## Implementation Notes

### Derivation Path Parsing
- Paths start with "m" for root
- Components separated by "/"
- Hardened indices marked with "'" suffix
- Normal indices are just numbers

### Key Derivation (ser_I)
- Hardened: HMAC-SHA512(chainCode, 0x00 || privateKey || index)
- Normal: HMAC-SHA512(chainCode, publicKey || index)
- IL used for key derivation, IR becomes new chainCode

### Fingerprint Calculation
- RIPEMD160(SHA256(compressedPublicKey)).slice(0, 4)

### Extended Key Format (Base58Check)
- 4 bytes: version (0x0488ADE4=xprv, 0x0488B21E=xpub)
- 1 byte: depth
- 4 bytes: parent fingerprint
- 4 bytes: child index
- 32 bytes: chain code
- 33 bytes: key (0x00 || privateKey or compressedPublicKey)
- 4 bytes: checksum (first 4 bytes of double SHA256)

## Test Vectors

### BIP-39 Standard Vector
- Mnemonic: "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"
- Password: ""
- Seed: 0x5eb00bbddcf069084889a8ab9155568165f5c453ccb85e70811aaed6f6da5fc19a5ac40b389cd370d086206dec8aa6c43daea6690f20ad3d8d48b2d2ce9e38e4

### Derivation Test (m/44'/60'/0'/0/0)
- Address: 0x9858EfFD232B4033E47d90003D41EC34EcaEda94
- Private Key: 0x1ab42cc412b618bdea3a599e3c9bae199ebf030895b039e9db1e30dafb12b727
