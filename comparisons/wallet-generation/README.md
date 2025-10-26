# Wallet/Key Generation Utility Functions Benchmark

Comprehensive comparison of Ethereum wallet and key generation operations across guil (@tevm/primitives), ethers, and viem.

## Security Notice

⚠️ **CRITICAL SECURITY WARNINGS**: These are cryptographic operations that directly affect wallet security.

### Production Usage Requirements

1. **Random Number Generation**: Use cryptographically secure random number generators (CSPRNG)
2. **Private Key Storage**: NEVER store private keys in plain text or version control
3. **Key Derivation**: Follow BIP-32/BIP-39/BIP-44 standards for hierarchical deterministic wallets
4. **Test Keys**: The test private key used in these benchmarks is PUBLIC and must NEVER be used in production
5. **Side-Channel Attacks**: Be aware of timing attacks when performing cryptographic operations

### Test Data

These benchmarks use a known test private key for deterministic testing:

```
Private Key: 0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
⚠️ DO NOT USE IN PRODUCTION - This is a public test key!
```

## Overview

This benchmark suite tests all major wallet/key generation functions including:
- Private key generation (using secure randomness)
- Public key derivation from private keys (secp256k1 elliptic curve)
- Ethereum address derivation (keccak256 hash of public key)
- Combined private key to address conversion (optimized path)
- Public key compression (converting 65-byte uncompressed to 33-byte compressed format)

## Benchmarks

### 1. generatePrivateKey(): string

Generate a cryptographically secure random 32-byte private key. This operation uses platform-specific CSPRNG.

**Implementation Notes:**
- **Guil**: Uses `@noble/curves` - `secp256k1.utils.randomPrivateKey()`
- **Ethers**: Uses `Wallet.createRandom()` with platform crypto APIs
- **Viem**: Uses `generatePrivateKey()` from `viem/accounts`

⚠️ **Special Benchmark Consideration**: This function uses randomness, so timing variations are expected and normal.

**Files:**
- Guil: [`/Users/williamcory/primitives/comparisons/wallet-generation/generatePrivateKey/guil.ts`](/Users/williamcory/primitives/comparisons/wallet-generation/generatePrivateKey/guil.ts)
- Ethers: [`/Users/williamcory/primitives/comparisons/wallet-generation/generatePrivateKey/ethers.ts`](/Users/williamcory/primitives/comparisons/wallet-generation/generatePrivateKey/ethers.ts)
- Viem: [`/Users/williamcory/primitives/comparisons/wallet-generation/generatePrivateKey/viem.ts`](/Users/williamcory/primitives/comparisons/wallet-generation/generatePrivateKey/viem.ts)
- Bench: [`/Users/williamcory/primitives/comparisons/wallet-generation/generatePrivateKey.bench.ts`](/Users/williamcory/primitives/comparisons/wallet-generation/generatePrivateKey.bench.ts)

### 2. privateKeyToPublicKey(privateKey: string): string

Derive the uncompressed 65-byte public key from a 32-byte private key using secp256k1 elliptic curve multiplication.

**Cryptographic Operation:**
- Performs elliptic curve point multiplication: `PublicKey = PrivateKey × G`
- Returns uncompressed format: `0x04 + x-coordinate (32 bytes) + y-coordinate (32 bytes)`
- This is a deterministic operation (same input = same output)

**Implementation Notes:**
- **Guil**: Uses `@noble/curves` - `secp256k1.getPublicKey(privateKey, false)`
- **Ethers**: Uses `SigningKey(privateKey).publicKey`
- **Viem**: Not directly exposed, uses `@noble/curves` internally

**Files:**
- Guil: [`/Users/williamcory/primitives/comparisons/wallet-generation/privateKeyToPublicKey/guil.ts`](/Users/williamcory/primitives/comparisons/wallet-generation/privateKeyToPublicKey/guil.ts)
- Ethers: [`/Users/williamcory/primitives/comparisons/wallet-generation/privateKeyToPublicKey/ethers.ts`](/Users/williamcory/primitives/comparisons/wallet-generation/privateKeyToPublicKey/ethers.ts)
- Viem: [`/Users/williamcory/primitives/comparisons/wallet-generation/privateKeyToPublicKey/viem.ts`](/Users/williamcory/primitives/comparisons/wallet-generation/privateKeyToPublicKey/viem.ts)
- Bench: [`/Users/williamcory/primitives/comparisons/wallet-generation/privateKeyToPublicKey.bench.ts`](/Users/williamcory/primitives/comparisons/wallet-generation/privateKeyToPublicKey.bench.ts)

### 3. publicKeyToAddress(publicKey: string): string

Derive Ethereum address from an uncompressed public key using keccak256 hash.

**Derivation Algorithm:**
1. Remove the `0x04` prefix from uncompressed public key (65 bytes → 64 bytes)
2. Compute keccak256 hash of the 64-byte public key
3. Take the last 20 bytes of the hash
4. Prepend `0x` to create checksummed address

**Implementation Notes:**
- **Guil**: Manual implementation - `keccak256(publicKey.slice(1)).slice(-20)`
- **Ethers**: Uses `computeAddress(publicKey)`
- **Viem**: Uses `publicKeyToAddress(publicKey)` from utils

**Files:**
- Guil: [`/Users/williamcory/primitives/comparisons/wallet-generation/publicKeyToAddress/guil.ts`](/Users/williamcory/primitives/comparisons/wallet-generation/publicKeyToAddress/guil.ts)
- Ethers: [`/Users/williamcory/primitives/comparisons/wallet-generation/publicKeyToAddress/ethers.ts`](/Users/williamcory/primitives/comparisons/wallet-generation/publicKeyToAddress/ethers.ts)
- Viem: [`/Users/williamcory/primitives/comparisons/wallet-generation/publicKeyToAddress/viem.ts`](/Users/williamcory/primitives/comparisons/wallet-generation/publicKeyToAddress/viem.ts)
- Bench: [`/Users/williamcory/primitives/comparisons/wallet-generation/publicKeyToAddress.bench.ts`](/Users/williamcory/primitives/comparisons/wallet-generation/publicKeyToAddress.bench.ts)

### 4. privateKeyToAddress(privateKey: string): string

Derive Ethereum address directly from private key. This combines public key derivation and address generation.

**Combined Operation:**
1. Derive uncompressed public key from private key (secp256k1 multiplication)
2. Hash the public key with keccak256 and take last 20 bytes

**Performance Consideration:**
This is the most commonly used operation in wallet applications. Libraries may optimize this path differently.

**Implementation Notes:**
- **Guil**: Combines `secp256k1.getPublicKey()` + manual keccak256 + slice
- **Ethers**: Uses `new Wallet(privateKey).address`
- **Viem**: Uses `privateKeyToAccount(privateKey).address` from accounts

**Files:**
- Guil: [`/Users/williamcory/primitives/comparisons/wallet-generation/privateKeyToAddress/guil.ts`](/Users/williamcory/primitives/comparisons/wallet-generation/privateKeyToAddress/guil.ts)
- Ethers: [`/Users/williamcory/primitives/comparisons/wallet-generation/privateKeyToAddress/ethers.ts`](/Users/williamcory/primitives/comparisons/wallet-generation/privateKeyToAddress/ethers.ts)
- Viem: [`/Users/williamcory/primitives/comparisons/wallet-generation/privateKeyToAddress/viem.ts`](/Users/williamcory/primitives/comparisons/wallet-generation/privateKeyToAddress/viem.ts)
- Bench: [`/Users/williamcory/primitives/comparisons/wallet-generation/privateKeyToAddress.bench.ts`](/Users/williamcory/primitives/comparisons/wallet-generation/privateKeyToAddress.bench.ts)

### 5. compressPublicKey(publicKey: string): string

Convert uncompressed 65-byte public key to compressed 33-byte format.

**Compression Algorithm:**
- **Uncompressed**: `0x04 + x-coordinate (32 bytes) + y-coordinate (32 bytes)` = 65 bytes
- **Compressed**: `(0x02 or 0x03) + x-coordinate (32 bytes)` = 33 bytes
- The prefix `0x02` (even y) or `0x03` (odd y) allows reconstruction of the y-coordinate

**Use Cases:**
- Reducing transaction size (Bitcoin-style addresses)
- Network bandwidth optimization
- Storage efficiency

⚠️ **Note**: Ethereum addresses always use uncompressed public keys, but compression is useful for signatures and other protocols.

**Implementation Notes:**
- **Guil**: Uses `@noble/curves` - `ProjectivePoint.fromHex().toHex(true)`
- **Ethers**: Uses `SigningKey.computePublicKey(publicKey, true)`
- **Viem**: Not exposed, uses `@noble/curves` internally

**Files:**
- Guil: [`/Users/williamcory/primitives/comparisons/wallet-generation/compressPublicKey/guil.ts`](/Users/williamcory/primitives/comparisons/wallet-generation/compressPublicKey/guil.ts)
- Ethers: [`/Users/williamcory/primitives/comparisons/wallet-generation/compressPublicKey/ethers.ts`](/Users/williamcory/primitives/comparisons/wallet-generation/compressPublicKey/ethers.ts)
- Viem: [`/Users/williamcory/primitives/comparisons/wallet-generation/compressPublicKey/viem.ts`](/Users/williamcory/primitives/comparisons/wallet-generation/compressPublicKey/viem.ts)
- Bench: [`/Users/williamcory/primitives/comparisons/wallet-generation/compressPublicKey.bench.ts`](/Users/williamcory/primitives/comparisons/wallet-generation/compressPublicKey.bench.ts)

## Running Benchmarks

To run all wallet-generation benchmarks:

```bash
# Run all wallet-generation benchmarks
bun run vitest bench comparisons/wallet-generation

# Run specific benchmark
bun run vitest bench comparisons/wallet-generation/generatePrivateKey.bench.ts
bun run vitest bench comparisons/wallet-generation/privateKeyToPublicKey.bench.ts
bun run vitest bench comparisons/wallet-generation/publicKeyToAddress.bench.ts
bun run vitest bench comparisons/wallet-generation/privateKeyToAddress.bench.ts
bun run vitest bench comparisons/wallet-generation/compressPublicKey.bench.ts
```

## Key Insights

- **generatePrivateKey**: Measures CSPRNG performance (expect variability)
- **privateKeyToPublicKey**: Tests secp256k1 elliptic curve multiplication performance
- **publicKeyToAddress**: Compares keccak256 hashing and slicing strategies
- **privateKeyToAddress**: Combined operation - most common in wallet apps, shows optimization potential
- **compressPublicKey**: Tests elliptic curve point manipulation

## Cryptographic Dependencies

All implementations ultimately depend on well-audited cryptographic libraries:

- **@noble/curves**: Pure TypeScript secp256k1 implementation (used by guil and viem)
- **@noble/hashes**: Pure TypeScript keccak256 implementation
- **Ethers**: Uses platform-specific crypto APIs when available, with fallbacks

## Security Best Practices

1. **Never roll your own crypto**: Use well-audited libraries like those tested here
2. **Validate inputs**: Always validate private keys are 32 bytes and public keys are valid curve points
3. **Secure key storage**: Use hardware wallets, encrypted keystores, or secure enclaves in production
4. **Key derivation**: Follow BIP-32/39/44 standards for hierarchical deterministic wallets
5. **Test vectors**: Always validate implementations against known test vectors

## Cryptographic Concepts

### secp256k1 Elliptic Curve

Ethereum uses the secp256k1 elliptic curve (same as Bitcoin):
- **Domain parameters**: Defined by the equation y² = x³ + 7 over a finite field
- **Private key**: A 32-byte (256-bit) random number
- **Public key**: A point (x, y) on the curve derived by multiplying the generator point G by the private key
- **Security**: Based on the elliptic curve discrete logarithm problem (ECDLP)

### Key Formats

- **Private Key**: 32 bytes (0x-prefixed hex string = 66 characters)
- **Uncompressed Public Key**: 65 bytes (0x04 prefix + 32-byte x + 32-byte y)
- **Compressed Public Key**: 33 bytes (0x02/0x03 prefix + 32-byte x)
- **Ethereum Address**: 20 bytes (last 20 bytes of keccak256(uncompressed_public_key))

### Address Derivation Flow

```
Private Key (32 bytes)
    ↓ secp256k1 point multiplication
Uncompressed Public Key (65 bytes: 0x04 + x + y)
    ↓ Remove 0x04 prefix
Public Key Coordinates (64 bytes: x + y)
    ↓ keccak256 hash
Hash (32 bytes)
    ↓ Take last 20 bytes
Ethereum Address (20 bytes)
    ↓ Add 0x prefix
0x-prefixed Address (42 characters)
```

## Why This Matters

These wallet/key generation operations are fundamental to Ethereum:

1. **Wallet Creation**: Every wallet starts with `generatePrivateKey()`
2. **Account Recovery**: Hierarchical deterministic wallets use these operations millions of times
3. **Transaction Signing**: Public key derivation is required for every signature verification
4. **dApp Integration**: Address derivation happens constantly in web3 applications
5. **Performance Critical**: Wallet apps may generate hundreds of addresses during initialization

Small performance differences in these operations compound quickly in real-world usage.

## Related Benchmarks

- [`/Users/williamcory/primitives/comparisons/secp256k1`](/Users/williamcory/primitives/comparisons/secp256k1) - Low-level secp256k1 operations
- [`/Users/williamcory/primitives/comparisons/keccak256`](/Users/williamcory/primitives/comparisons/keccak256) - Keccak256 hashing benchmarks
- [`/Users/williamcory/primitives/comparisons/address`](/Users/williamcory/primitives/comparisons/address) - Address utility functions
- [`/Users/williamcory/primitives/comparisons/signature-utils`](/Users/williamcory/primitives/comparisons/signature-utils) - Signature operations

## References

- [EIP-55: Mixed-case checksum address encoding](https://eips.ethereum.org/EIPS/eip-55)
- [BIP-32: Hierarchical Deterministic Wallets](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki)
- [BIP-39: Mnemonic code for generating deterministic keys](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki)
- [BIP-44: Multi-Account Hierarchy for Deterministic Wallets](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki)
- [secp256k1 Curve Parameters](https://www.secg.org/sec2-v2.pdf)
- [@noble/curves Documentation](https://github.com/paulmillr/noble-curves)
- [Ethereum Yellow Paper](https://ethereum.github.io/yellowpaper/paper.pdf) - Section 4.2 (Address calculation)

## License

MIT
