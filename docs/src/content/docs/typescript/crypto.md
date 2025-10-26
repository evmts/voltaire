---
title: Crypto API
description: Cryptographic operations for TypeScript/JavaScript
---

## Overview

The crypto module provides TypeScript wrappers for cryptographic operations. Key implementations use audited libraries like @noble/hashes and @noble/curves for maximum security.

## Keccak-256

Keccak-256 hashing via @noble/hashes (audited):

```typescript
import { keccak256, hexToBytes, bytesToHex } from '@tevm/primitives';

// Hash bytes
const data = new TextEncoder().encode('hello world');
const hash = keccak256(data);
console.log('Hash:', bytesToHex(hash));
// Returns: Uint8Array(32)

// Hash hex data
const hexData = '0x1234abcd';
const hash2 = keccak256(hexToBytes(hexData));
```

### `keccak256Empty`

Pre-computed hash of empty input:

```typescript
import { keccak256Empty } from '@tevm/primitives';

// Returns the keccak256 hash of empty bytes
console.log(keccak256Empty);
// 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470
```

## EIP-191 Personal Message Signing

Sign-In with Ethereum personal message hashing:

```typescript
import {
  hashMessage,
  signMessage,
  verifyMessage,
  recoverMessageAddress,
} from '@tevm/primitives';

// Hash a message (adds Ethereum prefix)
const message = 'Sign this message';
const hash = hashMessage(message);
// Adds: "\x19Ethereum Signed Message:\n" + message.length + message

// Sign a message (requires signer)
const signature = await signMessage(message, privateKeySigner);

// Verify a signature
const isValid = await verifyMessage(message, signature, address);

// Recover address from signature
const recovered = await recoverMessageAddress(message, signature);
```

## EIP-712 Typed Data

Structured data hashing and signing:

```typescript
import {
  hashTypedData,
  hashDomain,
  signTypedData,
  verifyTypedData,
  recoverTypedDataAddress,
  type TypedData,
  type TypedDataDomain,
} from '@tevm/primitives';

// Define domain
const domain: TypedDataDomain = {
  name: 'My Dapp',
  version: '1',
  chainId: 1n,
  verifyingContract: '0x...',
};

// Define typed data
const typedData: TypedData = {
  types: {
    Person: [
      { name: 'name', type: 'string' },
      { name: 'wallet', type: 'address' },
    ],
  },
  primaryType: 'Person',
  domain,
  message: {
    name: 'Alice',
    wallet: '0x...',
  },
};

// Hash typed data
const hash = hashTypedData(typedData);

// Hash domain separator
const domainHash = hashDomain(domain);

// Sign typed data
const signature = await signTypedData(typedData, privateKeySigner);

// Verify signature
const isValid = await verifyTypedData(typedData, signature, address);

// Recover address
const recovered = await recoverTypedDataAddress(typedData, signature);
```

## Signers

### Private Key Signer

Sign transactions and messages with a private key:

```typescript
import {
  createPrivateKeySigner,
  sign,
  getAddress,
} from '@tevm/primitives';

// Create signer from private key
const signer = createPrivateKeySigner({
  privateKey: '0x...',
});

// Get address
const address = await getAddress(signer);

// Sign hash
const signature = await sign(signer, hash);

// Sign message
const msgSignature = await signer.signMessage('Hello');

// Sign typed data
const typedSignature = await signer.signTypedData(typedData);
```

### HD Wallet Signer

Hierarchical deterministic wallet (BIP32/BIP39):

```typescript
import {
  createHDWalletSigner,
  type HDWalletSignerOptions,
} from '@tevm/primitives';

// Create from mnemonic
const signer = createHDWalletSigner({
  mnemonic: 'test test test test test test test test test test test junk',
  path: "m/44'/60'/0'/0/0", // Ethereum default path
});

// Or from seed
const signer2 = createHDWalletSigner({
  seed: '0x...',
  path: "m/44'/60'/0'/0/0",
});

// Use same API as PrivateKeySigner
const address = await getAddress(signer);
const signature = await sign(signer, hash);
```

### Hardware Wallet Signer

Interface for hardware wallets (Ledger, Trezor):

```typescript
import {
  createHardwareWalletSigner,
  type HardwareWalletSignerOptions,
} from '@tevm/primitives';

// Create hardware wallet signer
const signer = createHardwareWalletSigner({
  device: 'ledger', // or 'trezor'
  path: "m/44'/60'/0'/0/0",
});

// Connect to device
await signer.connect();

// Use same API
const address = await getAddress(signer);
const signature = await sign(signer, hash);

// Disconnect
await signer.disconnect();
```

## Signature Utilities

### Parse Signature

Parse signature from various formats:

```typescript
import { parseSignature } from '@tevm/primitives';

// Parse compact format (64 bytes r+s, 1 byte v)
const sig1 = parseSignature('0x' + 'r'.repeat(64) + 's'.repeat(64) + '1b');

// Parse from object
const sig2 = parseSignature({
  r: '0x' + 'r'.repeat(64),
  s: '0x' + 's'.repeat(64),
  v: 27,
});
```

### Serialize Signature

Serialize signature to hex string:

```typescript
import { serializeSignature } from '@tevm/primitives';

const signature = {
  r: '0x...',
  s: '0x...',
  v: 27,
};

const hex = serializeSignature(signature);
// "0x{r}{s}{v}"
```

### Canonical Signatures

Check and normalize signatures:

```typescript
import {
  isCanonicalSignature,
  normalizeSignature,
} from '@tevm/primitives';

// Check if signature has low s-value (canonical)
const isCanonical = isCanonicalSignature(signature);

// Normalize signature to canonical form
const normalized = normalizeSignature(signature);
```

### Recover Transaction Address

Recover signer address from transaction:

```typescript
import { recoverTransactionAddress } from '@tevm/primitives';

const address = recoverTransactionAddress(transaction);
```

## Hash Algorithms

Additional hash functions:

```typescript
import { sha256, ripemd160, blake2b } from '@tevm/primitives';

// SHA-256 (via Zig std library)
const sha = sha256(data);

// RIPEMD-160 (⚠️ unaudited Zig implementation)
const ripemd = ripemd160(data);

// Blake2b (⚠️ unaudited Zig implementation)
const blake = blake2b(data, outputLength);
```

**Note:** Only SHA-256 uses standard library implementation. RIPEMD-160 and Blake2b implementations are not audited.

## Security Notes

### Audited Components

The following cryptographic implementations use audited libraries:
- **@noble/hashes** - Keccak-256 and SHA-256
- **@noble/curves** - secp256k1 operations for signers

### Not Audited

The following are not audited:
- TypeScript wrapper code
- RIPEMD-160 implementation
- Blake2b implementation
- FFI/WASM bindings (if using native backend)

### Best Practices

1. **Use audited implementations** - Prefer @noble/hashes and @noble/curves
2. **Validate inputs** - Always validate signatures, addresses, and hashes
3. **Secure private keys** - Never log or expose private keys
4. **Use hardware wallets** - For production use, prefer hardware wallet signers
5. **Test thoroughly** - Validate against test vectors

## Related

- [Getting Started](/typescript/getting-started/) - Basic usage examples
- [Primitives API](/typescript/primitives/) - Core Ethereum primitives
- [Ethereum Types](/typescript/ethereum-types/) - Transaction types
