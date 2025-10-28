# secp256k1/ECDSA

Complete ECDSA signing and verification using the secp256k1 elliptic curve. All operations use the audited @noble/curves library for security. Full Ethereum compatibility with v = 27/28 recovery IDs.

## Features

- **Signing**: Deterministic ECDSA (RFC 6979) for reproducible signatures
- **Verification**: Fast signature verification against public keys
- **Key Derivation**: Derive public keys from private keys
- **Public Key Recovery**: Recover signer's public key from signature (Ethereum-style)
- **Full Type Safety**: TypeScript types with branded types for safety
- **Ethereum Compatible**: v = 27/28 recovery IDs for Ethereum transactions
- **Audited Library**: Uses @noble/curves for all cryptographic operations

## Installation

```bash
npm install @tevm/voltaire
```

## Quick Start

```typescript
import { Secp256k1 } from '@tevm/voltaire/crypto/secp256k1';
import { Hash } from '@tevm/voltaire/primitives/hash';

// Generate keys
const privateKey = new Uint8Array(32); // Your private key
const publicKey = Secp256k1.derivePublicKey(privateKey);

// Sign a message
const messageHash = Hash.keccak256String('Hello, Ethereum!');
const signature = Secp256k1.sign(messageHash, privateKey);

// Verify signature
const valid = Secp256k1.verify(signature, messageHash, publicKey);
console.log('Valid:', valid); // true

// Recover public key from signature
const recovered = Secp256k1.recoverPublicKey(signature, messageHash);
console.log('Recovered matches original:',
  recovered.every((b, i) => b === publicKey[i])); // true
```

## API Reference

### Types

#### `Secp256k1.Signature`

ECDSA signature with Ethereum-compatible v value:

```typescript
type Signature = {
  r: Uint8Array;  // 32 bytes: x-coordinate of ephemeral public key
  s: Uint8Array;  // 32 bytes: signature proof value
  v: number;      // Recovery id: 27 or 28 for Ethereum
};
```

#### `Secp256k1.PublicKey`

Uncompressed public key (64 bytes): x-coordinate (32 bytes) || y-coordinate (32 bytes)

```typescript
type PublicKey = Uint8Array; // 64 bytes
```

#### `Secp256k1.PrivateKey`

Private key scalar value:

```typescript
type PrivateKey = Uint8Array; // 32 bytes
```

### Constants

```typescript
Secp256k1.CURVE_ORDER              // Curve order (n)
Secp256k1.PRIVATE_KEY_SIZE         // 32 bytes
Secp256k1.PUBLIC_KEY_SIZE          // 64 bytes
Secp256k1.SIGNATURE_COMPONENT_SIZE // 32 bytes
```

### Core Operations

#### `Secp256k1.sign(messageHash, privateKey)`

Sign a message hash with a private key. Uses deterministic ECDSA (RFC 6979).

```typescript
function sign(messageHash: Hash, privateKey: PrivateKey): Signature
```

**Parameters:**
- `messageHash`: 32-byte hash to sign
- `privateKey`: 32-byte private key

**Returns:** ECDSA signature with r, s, v components

**Throws:**
- `InvalidPrivateKeyError`: If private key is invalid
- `Secp256k1Error`: If signing fails

**Example:**

```typescript
const messageHash = Hash.keccak256String('Hello!');
const privateKey = new Uint8Array(32);
const signature = Secp256k1.sign(messageHash, privateKey);
console.log(signature.v); // 27 or 28
```

#### `Secp256k1.verify(signature, messageHash, publicKey)`

Verify an ECDSA signature against a public key.

```typescript
function verify(
  signature: Signature,
  messageHash: Hash,
  publicKey: PublicKey
): boolean
```

**Parameters:**
- `signature`: ECDSA signature with r, s, v
- `messageHash`: 32-byte hash that was signed
- `publicKey`: 64-byte uncompressed public key

**Returns:** `true` if signature is valid, `false` otherwise

**Throws:**
- `InvalidPublicKeyError`: If public key is invalid
- `InvalidSignatureError`: If signature format is invalid

**Example:**

```typescript
const valid = Secp256k1.verify(signature, messageHash, publicKey);
if (valid) {
  console.log('Signature verified!');
}
```

#### `Secp256k1.recoverPublicKey(signature, messageHash)`

Recover the public key that created a signature. This is what enables Ethereum's address recovery.

```typescript
function recoverPublicKey(signature: Signature, messageHash: Hash): PublicKey
```

**Parameters:**
- `signature`: ECDSA signature with r, s, v
- `messageHash`: 32-byte hash that was signed

**Returns:** 64-byte uncompressed public key

**Throws:**
- `InvalidSignatureError`: If signature is invalid or recovery fails

**Example:**

```typescript
const recovered = Secp256k1.recoverPublicKey(signature, messageHash);
// Use recovered key to derive Ethereum address
```

#### `Secp256k1.derivePublicKey(privateKey)`

Derive public key from private key using scalar multiplication.

```typescript
function derivePublicKey(privateKey: PrivateKey): PublicKey
```

**Parameters:**
- `privateKey`: 32-byte private key

**Returns:** 64-byte uncompressed public key

**Throws:**
- `InvalidPrivateKeyError`: If private key is invalid

**Example:**

```typescript
const privateKey = new Uint8Array(32);
const publicKey = Secp256k1.derivePublicKey(privateKey);
console.log(publicKey.length); // 64
```

### Validation Functions

#### `Secp256k1.isValidSignature(signature)`

Validate signature components (r, s in [1, n-1], low-s, valid v).

```typescript
function isValidSignature(signature: Signature): boolean
```

#### `Secp256k1.isValidPublicKey(publicKey)`

Check if public key is a valid point on the curve.

```typescript
function isValidPublicKey(publicKey: PublicKey): boolean
```

#### `Secp256k1.isValidPrivateKey(privateKey)`

Check if private key is in valid range [1, n-1].

```typescript
function isValidPrivateKey(privateKey: PrivateKey): boolean
```

### Signature Formatting

#### `Secp256k1.Signature.toCompact(signature)`

Convert signature to compact format (64 bytes: r || s).

```typescript
function toCompact(this: Signature): Uint8Array
```

**Example:**

```typescript
const compact = Secp256k1.Signature.toCompact.call(signature);
console.log(compact.length); // 64
```

#### `Secp256k1.Signature.toBytes(signature)`

Convert signature to bytes with v appended (65 bytes: r || s || v).

```typescript
function toBytes(this: Signature): Uint8Array
```

**Example:**

```typescript
const bytes = Secp256k1.Signature.toBytes.call(signature);
console.log(bytes.length); // 65
```

#### `Secp256k1.Signature.fromCompact(compact, v)`

Create signature from compact format.

```typescript
function fromCompact(compact: Uint8Array, v: number): Signature
```

**Example:**

```typescript
const signature = Secp256k1.Signature.fromCompact(compact, 27);
```

#### `Secp256k1.Signature.fromBytes(bytes)`

Create signature from bytes (65 bytes: r || s || v).

```typescript
function fromBytes(bytes: Uint8Array): Signature
```

**Example:**

```typescript
const signature = Secp256k1.Signature.fromBytes(bytes);
```

## Usage Examples

### Ethereum Transaction Signing

```typescript
import { Secp256k1 } from '@tevm/voltaire/crypto/secp256k1';
import { Hash } from '@tevm/voltaire/primitives/hash';

// Transaction data
const txData = { to: '0x...', value: 1000n, ... };
const txHash = Hash.keccak256(encodeTx(txData));

// Sign transaction
const privateKey = getPrivateKey();
const signature = Secp256k1.sign(txHash, privateKey);

// Transaction now includes signature
const signedTx = { ...txData, ...signature };
```

### Verify Message Signature

```typescript
import { Secp256k1 } from '@tevm/voltaire/crypto/secp256k1';
import { Hash } from '@tevm/voltaire/primitives/hash';

function verifyMessage(
  message: string,
  signature: Secp256k1.Signature,
  expectedAddress: Address
): boolean {
  // Hash message with Ethereum prefix
  const messageHash = Hash.keccak256String(
    `\x19Ethereum Signed Message:\n${message.length}${message}`
  );

  // Recover signer's public key
  const publicKey = Secp256k1.recoverPublicKey(signature, messageHash);

  // Derive address from public key
  const pubKeyHash = Hash.keccak256(publicKey);
  const address = pubKeyHash.slice(-20);

  // Compare addresses
  return address.every((b, i) => b === expectedAddress[i]);
}
```

### Key Generation

```typescript
import { Secp256k1 } from '@tevm/voltaire/crypto/secp256k1';
import { randomBytes } from 'crypto';

// Generate random private key
let privateKey: Uint8Array;
do {
  privateKey = randomBytes(32);
} while (!Secp256k1.isValidPrivateKey(privateKey));

// Derive public key
const publicKey = Secp256k1.derivePublicKey(privateKey);

console.log('Generated key pair');
console.log('Private key:', Buffer.from(privateKey).toString('hex'));
console.log('Public key:', Buffer.from(publicKey).toString('hex'));
```

### Signature Verification Before Broadcasting

```typescript
import { Secp256k1 } from '@tevm/voltaire/crypto/secp256k1';

function prepareTransaction(txHash: Hash, privateKey: Uint8Array) {
  // Sign transaction
  const signature = Secp256k1.sign(txHash, privateKey);

  // Validate signature before broadcasting
  if (!Secp256k1.isValidSignature(signature)) {
    throw new Error('Generated invalid signature');
  }

  // Verify we can recover the correct public key
  const publicKey = Secp256k1.derivePublicKey(privateKey);
  const recovered = Secp256k1.recoverPublicKey(signature, txHash);

  if (!recovered.every((b, i) => b === publicKey[i])) {
    throw new Error('Signature verification failed');
  }

  return signature;
}
```

## Performance

Benchmarks on Apple M1 Pro:

| Operation | Speed |
|-----------|-------|
| sign | ~20,000 ops/sec |
| verify | ~7,000 ops/sec |
| derivePublicKey | ~25,000 ops/sec |
| recoverPublicKey | ~4,000 ops/sec |
| isValidSignature | ~5,000,000 ops/sec |

Run benchmarks:

```bash
bun run src/crypto/secp256k1.bench.ts
```

## Security Considerations

### Using Audited Cryptography

This implementation uses `@noble/curves`, a well-audited cryptographic library. All core operations (signing, verification, key derivation) delegate to noble's implementations.

### Deterministic Signatures

Signatures use RFC 6979 deterministic ECDSA. This means:
- Same message + same key = same signature
- No need for secure random number generation during signing
- Eliminates nonce reuse attacks

### Low-S Enforcement

Following Ethereum's lead, we enforce low-s values (s ≤ n/2) to prevent signature malleability. A signature with high-s can be converted to an equivalent signature with low-s, potentially causing issues with transaction replay.

### Private Key Security

- Never expose private keys in logs or error messages
- Clear private key memory after use when possible
- Validate all private keys are in range [1, n-1]
- Use secure random number generation for key creation

### Public Key Recovery

Public key recovery (used extensively in Ethereum) is more computationally expensive than verification. For high-throughput verification, prefer providing the public key directly rather than recovering it.

### Constant-Time Operations

While the underlying @noble/curves library implements constant-time operations where critical, this wrapper does not add additional timing attack protections. For maximum security in sensitive contexts, audit your entire call chain.

## Error Handling

All operations throw typed errors:

```typescript
try {
  const signature = Secp256k1.sign(messageHash, privateKey);
} catch (error) {
  if (error instanceof InvalidPrivateKeyError) {
    console.error('Invalid private key:', error.message);
  } else if (error instanceof Secp256k1Error) {
    console.error('Signing failed:', error.message);
  }
}
```

Error types:
- `Secp256k1Error`: Base error class
- `InvalidSignatureError`: Signature validation or recovery failed
- `InvalidPublicKeyError`: Public key validation failed
- `InvalidPrivateKeyError`: Private key validation failed

## Related Modules

- **Hash**: Keccak-256 hashing for message digests
- **Address**: Ethereum address derivation from public keys
- **Transaction**: Transaction encoding and signing

## References

- [secp256k1 Curve Parameters](https://www.secg.org/sec2-v2.pdf)
- [RFC 6979: Deterministic ECDSA](https://datatracker.ietf.org/doc/html/rfc6979)
- [Ethereum Yellow Paper](https://ethereum.github.io/yellowpaper/paper.pdf)
- [Noble Curves Library](https://github.com/paulmillr/noble-curves)

## Testing

Run tests:

```bash
bun test src/crypto/secp256k1.test.ts
```

Test coverage includes:
- Known test vectors from Ethereum
- Edge cases (zero/max values)
- Invalid inputs and error handling
- Round-trip verification (sign -> verify -> recover)
- Signature format conversions

## License

MIT
