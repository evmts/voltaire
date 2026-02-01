# Ethers v6 Signer Requirements

## Overview

This document captures the requirements extracted from ethers v6 signer implementation for creating a Voltaire-compatible signer abstraction.

## Class Hierarchy

```
AbstractSigner (abstract base)
    |
    +-- VoidSigner (read-only, no signing)
    |
    +-- BaseWallet (concrete, has SigningKey)
            |
            +-- Wallet (full-featured, JSON keystore support)
            |
            +-- HDNodeWallet (HD wallet derivation)
```

## AbstractSigner API

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `provider` | `Provider \| null` | Connected provider for network operations |

### Abstract Methods (must implement)

| Method | Signature | Description |
|--------|-----------|-------------|
| `getAddress()` | `() => Promise<string>` | Returns signer's checksummed address |
| `connect(provider)` | `(Provider) => Signer` | Returns new signer connected to provider |
| `signTransaction(tx)` | `(TransactionRequest) => Promise<string>` | Signs transaction, returns serialized hex |
| `signMessage(message)` | `(string \| Uint8Array) => Promise<string>` | Signs EIP-191 personal message |
| `signTypedData(domain, types, value)` | `(...) => Promise<string>` | Signs EIP-712 typed data |

### Concrete Methods (inherited)

| Method | Signature | Description |
|--------|-----------|-------------|
| `getNonce(blockTag?)` | `(BlockTag?) => Promise<number>` | Gets transaction count from provider |
| `populateCall(tx)` | `(TransactionRequest) => Promise<TransactionLike>` | Populates tx for eth_call |
| `populateTransaction(tx)` | `(TransactionRequest) => Promise<TransactionLike>` | Populates tx with nonce, gas, chainId |
| `estimateGas(tx)` | `(TransactionRequest) => Promise<bigint>` | Estimates gas via provider |
| `call(tx)` | `(TransactionRequest) => Promise<string>` | Executes eth_call via provider |
| `resolveName(name)` | `(string) => Promise<string \| null>` | Resolves ENS name via provider |
| `sendTransaction(tx)` | `(TransactionRequest) => Promise<TransactionResponse>` | Signs and broadcasts transaction |

## BaseWallet API

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `address` | `string` | Checksummed Ethereum address |
| `signingKey` | `SigningKey` | The secp256k1 signing key |
| `privateKey` | `string` | Hex-encoded private key |

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getAddress()` | `() => Promise<string>` | Returns `this.address` |
| `connect(provider)` | `(Provider) => BaseWallet` | Returns new wallet with same key |
| `signTransaction(tx)` | `(TransactionRequest) => Promise<string>` | Signs and serializes transaction |
| `signMessage(message)` | `(string \| Uint8Array) => Promise<string>` | Signs with EIP-191 prefix |
| `signMessageSync(message)` | `(string \| Uint8Array) => string` | Sync version of signMessage |
| `signTypedData(domain, types, value)` | `(...) => Promise<string>` | Signs EIP-712 typed data |
| `authorize(auth)` | `(Authorization) => Promise<SignedAuthorization>` | EIP-7702 authorization |
| `authorizeSync(auth)` | `(Authorization) => SignedAuthorization` | Sync version |

## Transaction Population Flow

1. `sendTransaction(tx)` called
2. `populateTransaction(tx)` fills missing fields:
   - `from`: signer address (validates if provided)
   - `to`: resolved address (handles ENS)
   - `nonce`: from `getNonce("pending")`
   - `gasLimit`: from `estimateGas(tx)`
   - `chainId`: from `provider.getNetwork()`
   - Gas pricing (auto-detect EIP-1559 vs legacy):
     - EIP-1559: `maxFeePerGas`, `maxPriorityFeePerGas`
     - Legacy: `gasPrice`
   - `type`: auto-detect from fee data
3. Build `Transaction` object
4. Sign with `signTransaction()`
5. Broadcast via `provider.broadcastTransaction()`

## Message Signing

### EIP-191 Personal Sign
```javascript
// hashMessage creates: keccak256("\x19Ethereum Signed Message:\n" + len + message)
const hash = hashMessage(message);
const sig = signingKey.sign(hash);
return sig.serialized; // 0x + r + s + v (65 bytes)
```

### EIP-712 Typed Data
```javascript
// Resolve any ENS names in domain/types/value
const resolved = await TypedDataEncoder.resolveNames(domain, types, value, resolver);
const hash = TypedDataEncoder.hash(resolved.domain, types, resolved.value);
const sig = signingKey.sign(hash);
return sig.serialized;
```

## Error Handling

### Error Types
- `UNSUPPORTED_OPERATION`: Missing provider for network ops
- `INVALID_ARGUMENT`: Invalid transaction fields
- `UNCONFIGURED_NAME`: ENS name not configured

### Provider Required Operations
- `getNonce()`
- `populateTransaction()`
- `estimateGas()`
- `call()`
- `sendTransaction()`
- `resolveName()`

## Signature Format

Ethers uses compact signature format:
- `r`: 32 bytes (big-endian)
- `s`: 32 bytes (big-endian)
- `v`: 1 byte (27 or 28 for legacy, recovery bit for EIP-2718+)

Serialized: `0x` + r (64 hex) + s (64 hex) + v (2 hex) = 132 characters

## Voltaire Implementation Notes

### Use Voltaire Primitives
- `Address` for address handling
- `PrivateKey` for key management
- `Signature` for signature operations
- `Transaction` (EIP1559, Legacy, etc.) for tx construction
- `SignedData.Hash` for EIP-191 message hashing
- `EIP712.signTypedData` for typed data signing

### Provider Interface
Must support:
- `getTransactionCount(address, blockTag)`
- `estimateGas(tx)`
- `call(tx)`
- `getNetwork()` returning `{ chainId }`
- `getFeeData()` returning `{ maxFeePerGas, maxPriorityFeePerGas, gasPrice }`
- `broadcastTransaction(signedTx)`
- `resolveName(name)` (optional)

### Key Differences from Ethers
1. Use Voltaire's branded types instead of ethers' internal types
2. Crypto operations use Voltaire's Keccak256, Secp256k1
3. Transaction serialization uses Voltaire's Transaction primitives
4. No crowdsale/keystore JSON support (can add later)
