# Ethereum Signer Interfaces

Comprehensive signer system for Ethereum transactions, messages (EIP-191), and typed data (EIP-712).

## Features

- **PrivateKeySigner**: Sign with raw private keys
- **HDWalletSigner**: Sign with BIP-39 mnemonic phrases and BIP-44 derivation
- **HardwareWalletSigner**: (Stub) Interface for Ledger/Trezor support
- **Signature Verification**: Verify and recover addresses from signatures
- **Full EIP Support**: EIP-191 (personal message), EIP-712 (typed data), EIP-155/1559/7702 (transactions)

## Quick Start

### Private Key Signer

```typescript
import { PrivateKeySignerImpl } from "@tevm/primitives";

// From private key
const signer = PrivateKeySignerImpl.fromPrivateKey({
  privateKey: "0x1234..."
});

// Random generation
const randomSigner = PrivateKeySignerImpl.random();

// Get address
console.log(signer.address); // 0x...

// Sign message
const signature = await signer.signMessage("Hello, Ethereum!");

// Sign transaction
const signedTx = await signer.signTransaction({
  type: "eip1559",
  chainId: 1n,
  nonce: 0n,
  maxPriorityFeePerGas: 1000000000n,
  maxFeePerGas: 20000000000n,
  gasLimit: 21000n,
  to: "0x...",
  value: 1000000000000000000n,
  data: "0x",
  accessList: [],
  v: 0n,
  r: "0x0",
  s: "0x0",
});
```

### HD Wallet Signer

```typescript
import { HDWalletSignerImpl } from "@tevm/primitives";

// From mnemonic
const signer = HDWalletSignerImpl.fromMnemonic({
  mnemonic: "test test test test test test test test test test test junk",
  index: 0, // Account index (default: 0)
  path: "m/44'/60'/0'/0", // BIP-44 path (default: m/44'/60'/0'/0)
});

// Generate random mnemonic
const randomSigner = HDWalletSignerImpl.generate(12); // 12, 15, 18, 21, or 24 words

// Derive at different indices
const signer0 = await signer.deriveIndex(0);
const signer1 = await signer.deriveIndex(1);
const signer2 = await signer.deriveIndex(2);

// Custom path
const customSigner = await signer.derivePath("m/44'/60'/0'/0/5");

// Get mnemonic (use with caution!)
console.log(signer.getMnemonic());
```

### Signature Verification

```typescript
import {
  verifyMessage,
  recoverMessageAddress,
  recoverTransactionAddress,
} from "@tevm/primitives";

// Verify message signature
const isValid = verifyMessage(
  "Hello, Ethereum!",
  signature,
  expectedAddress
);

// Recover address from message signature
const recovered = recoverMessageAddress("Hello, Ethereum!", signature);

// Recover address from transaction signature
const txSigner = await recoverTransactionAddress(signedTransaction);
```

## Architecture

### Implementation Decision: Hybrid Approach

This implementation uses a **hybrid architecture**:

- **Cryptographic Operations**: `@noble/curves` and `@noble/hashes` (well-audited, pure TypeScript)
- **Wallet Management**: Pure TypeScript with `@scure/bip32` and `@scure/bip39`
- **Integration**: Existing Zig implementations via C FFI (for EIP-191 hashing)

**Rationale**:
1. **Security**: Noble libraries are extensively audited and battle-tested
2. **Portability**: Pure TypeScript works in all environments (Node.js, Bun, browsers)
3. **Performance**: Native Zig for hot paths when available
4. **Maintainability**: Well-documented libraries with active maintenance

### Signer Type System

All signers implement the base `Signer` interface:

```typescript
interface Signer {
  readonly type: "privateKey" | "hdWallet" | "hardware" | "custom";
  readonly address: string;

  signTransaction(tx: Transaction): Promise<Transaction>;
  signMessage(message: Uint8Array | string): Promise<string>;
  signTypedData(typedData: TypedMessage): Promise<string>;
}
```

Specialized signers extend this with additional methods:

- **PrivateKeySigner**: `getPrivateKey()`
- **HDWalletSigner**: `getMnemonic()`, `deriveIndex()`, `derivePath()`
- **HardwareWalletSigner**: `connect()`, `disconnect()`, `isConnected()`

## Transaction Signing

Supports all Ethereum transaction types:

### Legacy Transaction (Type 0)

```typescript
const legacyTx = {
  type: "legacy",
  nonce: 0n,
  gasPrice: 20000000000n,
  gasLimit: 21000n,
  to: "0x...",
  value: 1000000000000000000n,
  data: "0x",
  v: 0n,
  r: "0x0",
  s: "0x0",
};

const signed = await signer.signTransaction(legacyTx);
```

### EIP-1559 Transaction (Type 2)

```typescript
const eip1559Tx = {
  type: "eip1559",
  chainId: 1n,
  nonce: 0n,
  maxPriorityFeePerGas: 1000000000n,
  maxFeePerGas: 20000000000n,
  gasLimit: 21000n,
  to: "0x...",
  value: 1000000000000000000n,
  data: "0x",
  accessList: [],
  v: 0n,
  r: "0x0",
  s: "0x0",
};

const signed = await signer.signTransaction(eip1559Tx);
```

### EIP-7702 Transaction (Type 4)

```typescript
const eip7702Tx = {
  type: "eip7702",
  chainId: 1n,
  nonce: 0n,
  maxPriorityFeePerGas: 1000000000n,
  maxFeePerGas: 20000000000n,
  gasLimit: 21000n,
  to: "0x...",
  value: 1000000000000000000n,
  data: "0x",
  accessList: [],
  authorizationList: [],
  v: 0n,
  r: "0x0",
  s: "0x0",
};

const signed = await signer.signTransaction(eip7702Tx);
```

## Message Signing (EIP-191)

EIP-191 defines the personal message signing format:

```typescript
// Sign string message
const signature1 = await signer.signMessage("Hello, Ethereum!");

// Sign binary data
const data = new Uint8Array([1, 2, 3, 4]);
const signature2 = await signer.signMessage(data);

// Verify signature
const isValid = verifyMessage("Hello, Ethereum!", signature1, signer.address);

// Recover address
const recovered = recoverMessageAddress("Hello, Ethereum!", signature1);
```

### EIP-191 Format

```
"\x19Ethereum Signed Message:\n" + len(message) + message
```

The message is hashed with Keccak-256 before signing.

## Typed Data Signing (EIP-712)

**Note**: EIP-712 support requires the EIP-712 implementation to be completed.

```typescript
const typedData = {
  types: {
    Person: [
      { name: "name", type: "string" },
      { name: "wallet", type: "address" }
    ]
  },
  primaryType: "Person",
  domain: {
    name: "Example DApp",
    version: "1",
    chainId: 1,
    verifyingContract: "0x..."
  },
  message: {
    name: "Alice",
    wallet: "0x..."
  }
};

const signature = await signer.signTypedData(typedData);
```

## Security Considerations

### Private Key Management

- **Never log private keys** in production
- **Clear sensitive data** from memory when possible
- **Use environment variables** or secure vaults for key storage
- **Implement access controls** for key material

### Signature Verification

- **Always verify signatures** before processing
- **Check address matches** expected signer
- **Validate signature canonicality** to prevent malleability
- **Handle recovery errors** gracefully

### HD Wallet Security

- **Protect mnemonic phrases** like private keys
- **Use BIP-39 passphrases** for additional security
- **Derive keys deterministically** for reproducibility
- **Backup mnemonic safely** (offline, encrypted)

## Testing

Run comprehensive test suite:

```bash
bun test src/crypto/signers/
```

Tests include:
- Known test vectors from Ethereum specifications
- BIP-39/44 test vectors for HD wallets
- Cross-validation with reference implementations
- Edge case testing (empty messages, special characters)
- Signature recovery verification

## Hardware Wallet Support

Hardware wallet support is stubbed out but not yet implemented.

To implement:

1. **Ledger**: Install `@ledgerhq/hw-app-eth` and `@ledgerhq/hw-transport-webusb`
2. **Trezor**: Install `trezor-connect`
3. Implement device communication in `hardware-signer.ts`
4. Handle user confirmation flows
5. Test with device emulators

See `hardware-signer.ts` for implementation guidance.

## Dependencies

- **[@noble/curves](https://github.com/paulmillr/noble-curves)**: Audited cryptographic library for secp256k1
- **[@noble/hashes](https://github.com/paulmillr/noble-hashes)**: Audited hashing library (Keccak-256)
- **[@scure/bip32](https://github.com/paulmillr/scure-bip32)**: BIP-32 hierarchical deterministic wallets
- **[@scure/bip39](https://github.com/paulmillr/scure-bip39)**: BIP-39 mnemonic phrases

All dependencies are:
- MIT licensed
- Actively maintained
- Extensively tested
- Widely used in production

## Examples

### Complete Workflow

```typescript
import {
  PrivateKeySignerImpl,
  HDWalletSignerImpl,
  verifyMessage,
  recoverMessageAddress,
} from "@tevm/primitives";

// 1. Create signers
const privateSigner = PrivateKeySignerImpl.random();
const hdSigner = HDWalletSignerImpl.generate(12);

// 2. Sign message
const message = "Important message";
const sig1 = await privateSigner.signMessage(message);
const sig2 = await hdSigner.signMessage(message);

// 3. Verify signatures
console.log(verifyMessage(message, sig1, privateSigner.address)); // true
console.log(verifyMessage(message, sig2, hdSigner.address)); // true

// 4. Recover addresses
const addr1 = recoverMessageAddress(message, sig1);
const addr2 = recoverMessageAddress(message, sig2);

console.log(addr1 === privateSigner.address); // true
console.log(addr2 === hdSigner.address); // true

// 5. Sign transaction
const tx = {
  type: "eip1559" as const,
  chainId: 1n,
  nonce: 0n,
  maxPriorityFeePerGas: 1000000000n,
  maxFeePerGas: 20000000000n,
  gasLimit: 21000n,
  to: "0x...",
  value: 1000000000000000000n,
  data: "0x",
  accessList: [],
  v: 0n,
  r: "0x0",
  s: "0x0",
};

const signedTx = await privateSigner.signTransaction(tx);
console.log(signedTx.r); // Signature component
console.log(signedTx.s); // Signature component
console.log(signedTx.v); // Recovery id
```

## References

- [EIP-155](https://eips.ethereum.org/EIPS/eip-155): Simple replay attack protection
- [EIP-191](https://eips.ethereum.org/EIPS/eip-191): Signed Data Standard
- [EIP-712](https://eips.ethereum.org/EIPS/eip-712): Typed structured data hashing
- [EIP-1559](https://eips.ethereum.org/EIPS/eip-1559): Fee market change
- [EIP-7702](https://eips.ethereum.org/EIPS/eip-7702): Set EOA account code
- [BIP-32](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki): Hierarchical Deterministic Wallets
- [BIP-39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki): Mnemonic code for generating deterministic keys
- [BIP-44](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki): Multi-Account Hierarchy for Deterministic Wallets

## License

MIT
