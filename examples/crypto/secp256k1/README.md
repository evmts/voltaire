# Secp256k1 Examples

Comprehensive examples demonstrating secp256k1 ECDSA signatures for Ethereum.

## Overview

Secp256k1 is the elliptic curve used by Ethereum for digital signatures. These examples cover all core functionality from basic signing to advanced use cases like transaction signing and EIP-191 personal messages.

## Examples

### 1. Basic Signing (`basic-signing.ts` / `basic-signing.zig`)

**Demonstrates:**
- Signing a message hash with a private key
- Deriving public key from private key
- Verifying signature with public key
- RFC 6979 deterministic signatures

**Key Concepts:**
- ECDSA signature generation
- Signature components (r, s, v)
- Deterministic nonces prevent key leakage
- Signature verification

**Run:**
```bash
bun run examples/crypto/secp256k1/basic-signing.ts
zig build && ./zig-out/bin/basic-signing
```

### 2. Address Recovery (`address-recovery.ts` / `address-recovery.zig`)

**Demonstrates:**
- Recovering public key from signature (ecRecover)
- Deriving Ethereum address from public key
- Verifying recovered address matches signer
- Critical role of recovery ID (v value)

**Key Concepts:**
- Public key recovery algorithm
- Ethereum address derivation (Keccak256 + last 20 bytes)
- Recovery ID determines which of two possible public keys
- Address-based authentication without storing public keys

**Run:**
```bash
bun run examples/crypto/secp256k1/address-recovery.ts
zig build && ./zig-out/bin/address-recovery
```

### 3. Personal Message Signing (`personal-sign.ts` / `personal-sign.zig`)

**Demonstrates:**
- EIP-191 personal message signing
- Preventing transaction signature reuse
- Recovering signer from personal_sign signature
- Wallet authentication pattern

**Key Concepts:**
- EIP-191 prefix: `\x19Ethereum Signed Message:\n{length}{message}`
- Prevents transaction replay attacks
- Used by MetaMask, WalletConnect, etc.
- Wallet authentication without passwords

**Run:**
```bash
bun run examples/crypto/secp256k1/personal-sign.ts
zig build && ./zig-out/bin/personal-sign
```

### 4. Key Derivation (`key-derivation.ts` / `key-derivation.zig`)

**Demonstrates:**
- Secure private key generation
- Public key derivation from private key
- Ethereum address derivation from public key
- Key validation
- One-way nature of derivation

**Key Concepts:**
- Elliptic curve point multiplication (private_key * G)
- Generator point G for secp256k1
- Cryptographically secure random generation
- Valid key ranges (0 < key < curve order)
- Deterministic derivation

**Run:**
```bash
bun run examples/crypto/secp256k1/key-derivation.ts
zig build && ./zig-out/bin/key-derivation
```

### 5. Transaction Signing (`transaction-signing.ts` / `transaction-signing.zig`)

**Demonstrates:**
- Legacy transaction signing (pre-EIP-1559)
- EIP-155 replay protection
- Transaction hash computation
- Sender recovery from transaction signature
- Transaction verification

**Key Concepts:**
- EIP-155 chain ID in v value
- Transaction RLP encoding (simplified in examples)
- Replay protection across chains
- Sender derivation from signature
- Transaction authentication

**Run:**
```bash
bun run examples/crypto/secp256k1/transaction-signing.ts
zig build && ./zig-out/bin/transaction-signing
```

### 6. Signature Validation (`signature-validation.ts` / `signature-validation.zig`)

**Demonstrates:**
- Signature component validation
- Low-s malleability protection
- Invalid signature detection
- Edge case handling
- Security best practices

**Key Concepts:**
- Signature component ranges (r, s must be in [1, n-1])
- Low-s enforcement (s ≤ n/2)
- Malleability prevention
- Private/public key validation
- Point-on-curve verification

**Run:**
```bash
bun run examples/crypto/secp256k1/signature-validation.ts
zig build && ./zig-out/bin/signature-validation
```

## Security Considerations

### Critical Warnings

⚠️ **NEVER reuse nonces**: These examples use RFC 6979 deterministic signatures to prevent nonce reuse. Custom nonce generation is dangerous and can leak private keys.

⚠️ **Validate all inputs**: Always validate private keys, public keys, and signature components before use.

⚠️ **Low-s enforcement**: Ethereum requires low-s signatures (s ≤ n/2) to prevent malleability. All examples enforce this.

⚠️ **Use cryptographically secure random**: For private key generation, use `crypto.getRandomValues()` or equivalent CSPRNG. Never use `Math.random()`.

### Implementation Notes

**TypeScript**: Uses `@noble/curves/secp256k1` - audited, constant-time, production-ready
**Zig**: Custom implementation - ⚠️ UNAUDITED, NOT constant-time, educational purposes only

For production use:
1. TypeScript implementation (audited @noble/curves)
2. Ethereum precompile `ecRecover` for signature recovery
3. Hardware wallet signing for sensitive operations

## Common Patterns

### Sign a message
```typescript
import * as Secp256k1 from './crypto/Secp256k1';
import { keccak256 } from './primitives/Hash';

const messageBytes = new TextEncoder().encode('Hello, Ethereum!');
const messageHash = keccak256(messageBytes);
const signature = Secp256k1.sign(messageHash, privateKey);
```

### Recover signer address
```typescript
const publicKey = Secp256k1.recoverPublicKey(signature, messageHash);
const hash = keccak256(publicKey);
const address = '0x' + Buffer.from(hash.slice(12)).toString('hex');
```

### Verify signature
```typescript
const publicKey = Secp256k1.derivePublicKey(privateKey);
const isValid = Secp256k1.verify(signature, messageHash, publicKey);
```

## Documentation

For comprehensive technical documentation, see:
- [Secp256k1 Overview](/src/content/docs/crypto/secp256k1/index.mdx)
- [Signing](/src/content/docs/crypto/secp256k1/signing.mdx)
- [Verification](/src/content/docs/crypto/secp256k1/verification.mdx)
- [Recovery](/src/content/docs/crypto/secp256k1/recovery.mdx)
- [Key Derivation](/src/content/docs/crypto/secp256k1/key-derivation.mdx)
- [Security](/src/content/docs/crypto/secp256k1/security.mdx)
- [Usage Patterns](/src/content/docs/crypto/secp256k1/usage-patterns.mdx)

## Related Examples

- [Keccak256](/examples/crypto/keccak256/) - Hash function examples
- [Primitives](/examples/primitives/) - Ethereum primitive types
- [Transactions](/examples/typescript/03-transactions.ts) - Full transaction examples
