# SIWE (Sign-In with Ethereum)

EIP-4361 implementation for authenticating users with Ethereum accounts.

## Overview

Sign-In with Ethereum (SIWE) provides a standard way for users to authenticate using their Ethereum accounts. It creates a structured message that users sign with their private key, proving ownership of an address without revealing the key.

**Key Benefits:**
- Decentralized authentication (no central identity provider)
- Users control their identity
- Works across chains and applications
- No password storage or management
- Supports session management with timestamps

**When to Use:**
- Web3 application login
- Wallet-based authentication
- Cross-application identity
- Decentralized access control
- Session management

## Quick Start

```typescript
import { Siwe } from '@tevm/primitives';
import type { Address } from '@tevm/primitives';

// Create message
const message = Siwe.create({
  domain: "example.com",
  address: userAddress,
  uri: "https://example.com/login",
  chainId: 1,
  statement: "Sign in to Example App",
});

// Format for wallet signing
const text = Siwe.Message.format(message);
// User signs with wallet...
const signature = await wallet.signMessage(text);

// Validate message structure
const result = Siwe.Message.validate(message);
if (!result.valid) {
  throw new Error(result.error.message);
}

// Verify signature (TODO: not yet implemented)
// const valid = Siwe.Message.verify(message, signature);
```

## Core Types

### Siwe.Message

Structured authentication message conforming to EIP-4361.

```typescript
type Message = {
  domain: string;              // RFC 4501 dns authority
  address: Address;            // Ethereum address (20 bytes)
  uri: string;                 // RFC 3986 URI
  version: "1";                // Current version (must be "1")
  chainId: number;             // EIP-155 Chain ID
  nonce: string;               // Random token (min 8 chars)
  issuedAt: string;            // ISO 8601 timestamp
  statement?: string;          // Human-readable assertion
  expirationTime?: string;     // ISO 8601 expiration
  notBefore?: string;          // ISO 8601 valid-from time
  requestId?: string;          // System-specific identifier
  resources?: string[];        // Referenced resources
};
```

### Siwe.Signature

Signature bytes for verification (65 bytes: r + s + v).

```typescript
type Signature = Uint8Array;
```

### Siwe.ValidationResult

Validation outcome with detailed error information.

```typescript
type ValidationResult =
  | { valid: true }
  | { valid: false; error: ValidationError };
```

### Siwe.ValidationError

Detailed validation error types.

```typescript
type ValidationError =
  | { type: "invalid_domain"; message: string }
  | { type: "invalid_address"; message: string }
  | { type: "invalid_uri"; message: string }
  | { type: "invalid_version"; message: string }
  | { type: "invalid_chain_id"; message: string }
  | { type: "invalid_nonce"; message: string }
  | { type: "invalid_timestamp"; message: string }
  | { type: "expired"; message: string }
  | { type: "not_yet_valid"; message: string }
  | { type: "signature_mismatch"; message: string };
```

## Message Operations

### create

Create new SIWE message with automatic defaults.

```typescript
Siwe.create(params: {
  domain: string;
  address: Address;
  uri: string;
  chainId: number;
  statement?: string;
  expirationTime?: string;
  notBefore?: string;
  requestId?: string;
  resources?: string[];
  nonce?: string;              // Auto-generated if omitted
  issuedAt?: string;           // Auto-set to now if omitted
}): Siwe.Message
```

```typescript
// Minimal creation
const message = Siwe.create({
  domain: "example.com",
  address: userAddress,
  uri: "https://example.com/login",
  chainId: 1,
});
// Auto-generates nonce and issuedAt

// Full creation
const message = Siwe.create({
  domain: "example.com",
  address: userAddress,
  uri: "https://example.com/login",
  chainId: 1,
  statement: "Sign in to access your account",
  expirationTime: "2024-12-31T23:59:59.000Z",
  nonce: "customnonce",
  resources: ["https://example.com/resource1"],
});
```

### Message.format / format

Format message to string for signing (EIP-4361 format).

```typescript
// Standard form
Siwe.Message.format(message: Siwe.Message): string

// this: pattern
Siwe.format.call(message: Siwe.Message): string
```

```typescript
const text = Siwe.Message.format(message);
// Returns:
// example.com wants you to sign in with your Ethereum account:
// 0x742d35Cc6634C0532925a3b844Bc9e7595f251e3
//
// Sign in to access your account
//
// URI: https://example.com/login
// Version: 1
// Chain ID: 1
// Nonce: abc123def456
// Issued At: 2021-09-30T16:25:24.000Z

// Using this: pattern
const text2 = Siwe.format.call(message);
```

### parse

Parse formatted SIWE message string back to object.

```typescript
Siwe.parse(text: string): Siwe.Message
```

```typescript
const text = await wallet.getLastSignedMessage();
const message = Siwe.parse(text);

// Roundtrip
const formatted = Siwe.Message.format(message);
const parsed = Siwe.parse(formatted);
// parsed equals message
```

### Message.validate / validate

Validate message structure and timestamps.

```typescript
// Standard form
Siwe.Message.validate(
  message: Siwe.Message,
  options?: { now?: Date }
): ValidationResult

// this: pattern
Siwe.validate.call(
  message: Siwe.Message,
  options?: { now?: Date }
): ValidationResult
```

```typescript
const result = Siwe.Message.validate(message);
if (!result.valid) {
  console.error(result.error.type);
  console.error(result.error.message);
  return;
}

// Check expiration at specific time
const result = Siwe.Message.validate(message, {
  now: new Date("2024-01-01T00:00:00.000Z"),
});

// Using this: pattern
const result = Siwe.validate.call(message, { now });
```

**Validates:**
- Domain is non-empty
- Address is valid (20 bytes)
- URI is present
- Version is "1"
- Chain ID is positive integer
- Nonce is at least 8 characters
- Timestamps are valid ISO 8601
- Message not expired (if expirationTime set)
- Message valid (if notBefore set)

### generateNonce

Generate cryptographically secure random nonce.

```typescript
Siwe.generateNonce(length: number = 11): string
```

```typescript
const nonce = Siwe.generateNonce();
// Returns: "a7B9c2D4e6F" (11 chars, base62)

const longNonce = Siwe.generateNonce(16);
// Returns 16-character alphanumeric string

// Minimum length
const minNonce = Siwe.generateNonce(8);
```

## Signature Operations (Not Implemented)

The following signature operations are planned but not yet implemented:

### Message.getMessageHash / getMessageHash

Get EIP-191 personal sign message hash.

```typescript
// Standard form
Siwe.Message.getMessageHash(message: Siwe.Message): Uint8Array

// this: pattern
Siwe.getMessageHash.call(message: Siwe.Message): Uint8Array
```

**Status:** Throws "Not implemented"

**Future behavior:**
1. Format message to string
2. Prefix with `\x19Ethereum Signed Message:\n{length}`
3. Hash with keccak256
4. Return 32-byte hash

### Message.verify / verify

Verify SIWE message signature.

```typescript
// Standard form
Siwe.Message.verify(
  message: Siwe.Message,
  signature: Siwe.Signature
): boolean

// this: pattern
Siwe.verify.call(
  message: Siwe.Message,
  signature: Siwe.Signature
): boolean
```

**Status:** Throws "Not implemented"

**Future behavior:**
1. Validate message structure
2. Get message hash with getMessageHash
3. Recover public key from signature (secp256k1)
4. Derive address from public key
5. Compare with message.address
6. Return true if match

### verifyMessage

Validate message and verify signature together.

```typescript
Siwe.verifyMessage(
  message: Siwe.Message,
  signature: Siwe.Signature,
  options?: { now?: Date }
): ValidationResult
```

**Status:** Partial implementation (validates structure, signature verification not implemented)

```typescript
// Current behavior
const result = Siwe.verifyMessage(message, signature);
// Returns validation errors if structure invalid
// Returns signature_mismatch error (signature verification not implemented)

// Future behavior
const result = Siwe.verifyMessage(message, signature);
if (result.valid) {
  // Message structure valid AND signature verified
  authenticateUser(message.address);
} else {
  console.error(result.error.message);
}
```

## Common Patterns

### Basic Authentication Flow

```typescript
// 1. Backend generates nonce
const nonce = Siwe.generateNonce();
storeNonce(userId, nonce);

// 2. Frontend creates message
const message = Siwe.create({
  domain: window.location.host,
  address: userAddress,
  uri: window.location.origin,
  chainId: await provider.getChainId(),
  statement: "Sign in to Example App",
  nonce: nonce,
});

// 3. Format and request signature
const text = Siwe.Message.format(message);
const signature = await wallet.signMessage(text);

// 4. Send to backend for verification
const response = await fetch('/auth/verify', {
  method: 'POST',
  body: JSON.stringify({ message: text, signature }),
});

// 5. Backend validates and verifies
const parsed = Siwe.parse(messageText);
const result = Siwe.Message.validate(parsed);

if (!result.valid) {
  throw new Error('Invalid message');
}

if (!verifyNonce(parsed.nonce)) {
  throw new Error('Invalid or reused nonce');
}

// TODO: When implemented
// const verified = Siwe.Message.verify(parsed, signature);
// if (verified) {
//   createSession(parsed.address);
// }
```

### Session Management with Timestamps

```typescript
// Create message with expiration
const message = Siwe.create({
  domain: "example.com",
  address: userAddress,
  uri: "https://example.com",
  chainId: 1,
  expirationTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour
  notBefore: new Date().toISOString(),
});

// Validate at session use time
function validateSession(message: Siwe.Message): boolean {
  const result = Siwe.Message.validate(message, { now: new Date() });
  return result.valid;
}

// Check session validity
if (!validateSession(storedMessage)) {
  // Session expired or not yet valid
  requestReauth();
}
```

### Multi-Resource Authorization

```typescript
const message = Siwe.create({
  domain: "example.com",
  address: userAddress,
  uri: "https://example.com/admin",
  chainId: 1,
  statement: "Grant access to admin resources",
  resources: [
    "https://example.com/api/admin/users",
    "https://example.com/api/admin/settings",
    "https://example.com/api/admin/logs",
  ],
});

// Backend checks resources
function hasResourceAccess(message: Siwe.Message, resource: string): boolean {
  return message.resources?.includes(resource) ?? false;
}
```

### Chain-Specific Authentication

```typescript
// Mainnet only
const mainnetMessage = Siwe.create({
  domain: "example.com",
  address: userAddress,
  uri: "https://example.com",
  chainId: 1,
  statement: "Access mainnet features",
});

// Multi-chain support
const chains = [1, 137, 42161]; // Ethereum, Polygon, Arbitrum
for (const chainId of chains) {
  const message = Siwe.create({
    domain: "example.com",
    address: userAddress,
    uri: "https://example.com",
    chainId,
  });
  // Store per-chain authentication
}
```

### Custom Request IDs

```typescript
const requestId = crypto.randomUUID();

const message = Siwe.create({
  domain: "example.com",
  address: userAddress,
  uri: "https://example.com",
  chainId: 1,
  requestId: requestId,
});

// Track authentication request
storeAuthRequest(requestId, {
  timestamp: Date.now(),
  address: userAddress,
  status: 'pending',
});
```

### Validation Error Handling

```typescript
function handleValidationResult(result: Siwe.ValidationResult): void {
  if (result.valid) {
    return; // Success
  }

  switch (result.error.type) {
    case "expired":
      requestReauth("Session expired");
      break;
    case "not_yet_valid":
      showError("Authentication not yet valid");
      break;
    case "invalid_nonce":
      showError("Invalid or reused authentication token");
      break;
    case "signature_mismatch":
      showError("Signature verification failed");
      break;
    default:
      showError(`Validation failed: ${result.error.message}`);
  }
}

const result = Siwe.Message.validate(message);
handleValidationResult(result);
```

## Best Practices

### 1. Always Use Nonces

```typescript
// Good: Generate unique nonce per request
const nonce = Siwe.generateNonce();
storeNonce(userId, nonce); // Store server-side
const message = Siwe.create({ ..., nonce });

// Bad: Reusing or predictable nonces
const message = Siwe.create({ ..., nonce: "12345678" }); // Static nonce
```

### 2. Validate Before Processing

```typescript
// Good: Validate structure first
const result = Siwe.Message.validate(message);
if (!result.valid) {
  return error(result.error.message);
}
// Then process signature

// Bad: Assuming message is valid
const verified = Siwe.Message.verify(message, signature); // May crash
```

### 3. Set Expiration Times

```typescript
// Good: Include expiration
const message = Siwe.create({
  ...,
  expirationTime: new Date(Date.now() + 3600000).toISOString(),
});

// Bad: No expiration (indefinite validity)
const message = Siwe.create({ ... }); // Never expires
```

### 4. Use Current Time for Validation

```typescript
// Good: Explicit time check
const result = Siwe.Message.validate(message, { now: new Date() });

// Acceptable: Uses current time by default
const result = Siwe.Message.validate(message);

// Bad: Validating at creation time
const creationTime = new Date();
const message = Siwe.create({ ... });
// Later...
const result = Siwe.Message.validate(message, { now: creationTime }); // Stale
```

### 5. Verify Nonce Server-Side

```typescript
// Good: Server checks nonce
const parsed = Siwe.parse(messageText);
if (!isValidNonce(parsed.nonce)) {
  throw new Error('Invalid nonce');
}
consumeNonce(parsed.nonce); // Prevent reuse

// Bad: Trusting client nonce
const message = Siwe.parse(messageText);
// No nonce validation - replay attacks possible
```

### 6. Match Domain and URI

```typescript
// Good: Verify domain matches origin
const message = Siwe.create({
  domain: window.location.host,
  uri: window.location.origin,
  ...,
});

// Backend verification
if (message.domain !== expectedDomain) {
  throw new Error('Domain mismatch');
}

// Bad: Mismatched domain/URI
const message = Siwe.create({
  domain: "example.com",
  uri: "https://different-site.com", // Mismatch
  ...,
});
```

### 7. Handle Parsing Errors

```typescript
// Good: Catch parsing errors
try {
  const message = Siwe.parse(userInput);
  processMessage(message);
} catch (err) {
  logError('Invalid SIWE message', err);
  return error('Invalid authentication message');
}

// Bad: Assuming parsing succeeds
const message = Siwe.parse(untrustedInput); // May throw
```

### 8. Chain ID Validation

```typescript
// Good: Verify chain ID matches network
const expectedChainId = await provider.getChainId();
const message = Siwe.create({ ..., chainId: expectedChainId });

// Backend checks
if (message.chainId !== expectedChainId) {
  throw new Error('Chain ID mismatch');
}

// Bad: Wrong chain ID
const message = Siwe.create({ ..., chainId: 1 }); // Always mainnet
```

## Security Considerations

### Nonce Requirements

- Minimum 8 characters (spec requirement)
- Must be unique per authentication request
- Should be cryptographically random
- Must be validated and consumed server-side
- Prevents replay attacks

```typescript
// Generate cryptographically secure nonce
const nonce = Siwe.generateNonce(); // Uses crypto.getRandomValues

// Store and verify server-side
const nonceStore = new Map<string, { userId: string, created: Date }>();
nonceStore.set(nonce, { userId, created: new Date() });

// Verify and consume
if (!nonceStore.has(message.nonce)) {
  throw new Error('Invalid or reused nonce');
}
nonceStore.delete(message.nonce); // Consume to prevent reuse
```

### Timestamp Validation

- Always validate timestamps server-side
- Check `expirationTime` against current time
- Check `notBefore` against current time
- Consider clock skew (allow small window)
- Use consistent time source (UTC)

```typescript
// Allow 30-second clock skew
const CLOCK_SKEW_MS = 30000;

function validateWithSkew(message: Siwe.Message): boolean {
  const now = Date.now();

  if (message.expirationTime) {
    const exp = new Date(message.expirationTime).getTime();
    if (now - CLOCK_SKEW_MS > exp) return false;
  }

  if (message.notBefore) {
    const nbf = new Date(message.notBefore).getTime();
    if (now + CLOCK_SKEW_MS < nbf) return false;
  }

  return true;
}
```

### Domain Binding

- Verify domain matches request origin
- Prevents cross-site authentication attacks
- Check both domain and URI fields

### Address Verification

- Signature verification proves address ownership
- Never trust address without verifying signature
- TODO: Implement signature verification

## Performance Considerations

### Operation Complexity

| Operation | Time Complexity | Notes |
|-----------|----------------|-------|
| `create` | O(1) | Fast, generates nonce if needed |
| `generateNonce` | O(n) | n = length, crypto random |
| `Message.format` | O(n) | n = message size |
| `parse` | O(n) | n = text length |
| `Message.validate` | O(1) | Fast validation checks |
| `Message.getMessageHash` | O(n) | Not implemented, will hash message |
| `Message.verify` | O(1) | Not implemented, secp256k1 recovery |

### Optimization Tips

1. **Cache formatted messages** if signing multiple times
2. **Reuse nonces** for same user across retries (with expiration)
3. **Validate before expensive operations** (signature verification)
4. **Store parsed messages** instead of re-parsing
5. **Batch nonce generation** if creating many messages

## Examples

### Complete Authentication Example

```typescript
// Server endpoint to start auth
app.post('/auth/start', async (req, res) => {
  const nonce = Siwe.generateNonce();
  const expiresAt = Date.now() + 300000; // 5 minutes

  await redis.set(`nonce:${nonce}`, JSON.stringify({
    created: Date.now(),
    expiresAt,
  }), 'EX', 300);

  res.json({ nonce });
});

// Client requests signature
async function signIn() {
  const { nonce } = await fetch('/auth/start').then(r => r.json());

  const message = Siwe.create({
    domain: window.location.host,
    address: userAddress,
    uri: window.location.origin,
    chainId: await ethereum.request({ method: 'eth_chainId' }),
    nonce,
    statement: 'Sign in to Example App',
  });

  const text = Siwe.Message.format(message);
  const signature = await ethereum.request({
    method: 'personal_sign',
    params: [text, userAddress],
  });

  const response = await fetch('/auth/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: text, signature }),
  });

  return response.json();
}

// Server verification endpoint
app.post('/auth/verify', async (req, res) => {
  const { message: messageText, signature } = req.body;

  try {
    const message = Siwe.parse(messageText);

    // Validate structure
    const result = Siwe.Message.validate(message);
    if (!result.valid) {
      return res.status(400).json({ error: result.error.message });
    }

    // Verify nonce
    const nonceData = await redis.get(`nonce:${message.nonce}`);
    if (!nonceData) {
      return res.status(400).json({ error: 'Invalid or expired nonce' });
    }
    await redis.del(`nonce:${message.nonce}`); // Consume

    // Verify domain
    if (message.domain !== req.hostname) {
      return res.status(400).json({ error: 'Domain mismatch' });
    }

    // TODO: Verify signature when implemented
    // const verified = Siwe.Message.verify(message, signature);
    // if (!verified) {
    //   return res.status(401).json({ error: 'Invalid signature' });
    // }

    // Create session
    const sessionToken = generateSessionToken();
    await redis.set(`session:${sessionToken}`, JSON.stringify({
      address: message.address,
      chainId: message.chainId,
      createdAt: Date.now(),
    }), 'EX', 86400); // 24 hours

    res.json({ token: sessionToken });
  } catch (err) {
    res.status(400).json({ error: 'Invalid SIWE message' });
  }
});
```

## References

- [EIP-4361: Sign-In with Ethereum](https://eips.ethereum.org/EIPS/eip-4361)
- [EIP-191: Signed Data Standard](https://eips.ethereum.org/EIPS/eip-191)
- [RFC 3986: URI Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986)
- [RFC 4501: Domain Name System Uniform Resource Identifiers](https://www.rfc-editor.org/rfc/rfc4501)
- [ISO 8601: Date and Time Format](https://www.iso.org/iso-8601-date-and-time-format.html)

## API Summary

### Message Creation
- `create(params)` - Create new message with defaults
- `generateNonce(length?)` - Generate secure random nonce

### Formatting
- `Message.format(message)` - Format to string
- `format.call(message)` - Format with this: pattern
- `parse(text)` - Parse from string

### Validation
- `Message.validate(message, options?)` - Validate structure
- `validate.call(message, options?)` - Validate with this: pattern

### Signature (Not Implemented)
- `Message.getMessageHash(message)` - Get EIP-191 hash
- `Message.verify(message, signature)` - Verify signature
- `getMessageHash.call(message)` - Hash with this: pattern
- `verify.call(message, signature)` - Verify with this: pattern
- `verifyMessage(message, signature, options?)` - Combined validation and verification
