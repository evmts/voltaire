# Add Secp256k1 Hash-Level Sign/Verify API

## Context

OX comparison revealed API difference: OX operates at hash level (sign pre-hashed data), we operate at message level (hash internally). This creates interop issues. Add hash-level API alongside existing message-level API.

## Current API

```typescript
// We hash the message internally
sign(privateKey: BrandedPrivateKey, message: Uint8Array, options): Signature
verify(publicKey: BrandedPublicKey, message: Uint8Array, signature: Signature, options): boolean
```

## Proposed Addition

```typescript
// New: operate on pre-hashed data (32-byte hash)
signHash(privateKey: BrandedPrivateKey, hash: Hash): Signature
verifyHash(publicKey: BrandedPublicKey, hash: Hash, signature: Signature): boolean
recoverPublicKeyFromHash(hash: Hash, signature: Signature): BrandedPublicKey
```

## Requirements

1. **TypeScript API**:
   - Add `signHash()`, `verifyHash()`, `recoverPublicKeyFromHash()`
   - Keep existing `sign()`, `verify()`, `recoverPublicKey()` (message-level)
   - Validate hash is exactly 32 bytes
   - Document which API to use when

2. **Zig Implementation**:
   - Implement hash-level functions in `secp256k1.zig`
   - Skip hashing step, operate directly on 32-byte input
   - Maintain same signature format and recovery

3. **Interoperability**:
   - Hash-level API matches OX/viem behavior
   - Message-level API is convenience wrapper
   - Document difference clearly in JSDoc

4. **Testing**:
   - Test vectors from ECDSA specs
   - Cross-validate with OX using same hashes
   - Verify: `signHash(hash) == sign(message)` where `hash = keccak256(message)`
   - Test invalid hash length rejection

5. **Documentation**:
   - JSDoc explaining when to use hash-level vs message-level
   - Note: Hash-level for interop with OX/viem, message-level for convenience
   - Example showing both approaches
   - Security note: Caller responsible for hashing with hash-level API

## Reference

OX implementation: `node_modules/ox/core/Secp256k1.ts`

## Priority

**HIGH** - Required for interoperability with other libraries
