# Implement ECDH (Elliptic Curve Diffie-Hellman) Key Agreement

## Context

OX comparison revealed we're missing `Secp256k1.getSharedSecret()` for ECDH key agreement. This is a common cryptographic operation for establishing shared secrets between parties.

## Requirements

1. **TypeScript API**:
   ```typescript
   // In src/crypto/secp256k1/index.ts
   export function getSharedSecret(
     privateKey: BrandedPrivateKey,
     publicKey: BrandedPublicKey
   ): Uint8Array // 32-byte shared secret
   ```

2. **Zig Implementation**:
   - Implement in `src/crypto/secp256k1/secp256k1.zig`
   - Use secp256k1 point multiplication: `sharedSecret = privateKey * publicKey`
   - Return x-coordinate of resulting point (32 bytes)
   - Use existing secp256k1 curve implementation

3. **Security**:
   - Validate public key is on curve before computation
   - Return only x-coordinate (standard ECDH)
   - Consider adding KDF option (SHA256/Keccak256) in future

4. **Testing**:
   - Test vectors from known ECDH test suites
   - Cross-validate with @noble/curves reference
   - Test invalid public key rejection
   - Test that `getSharedSecret(a, B) == getSharedSecret(b, A)`

5. **Documentation**:
   - Add JSDoc with ECDH usage example
   - Document security considerations
   - Note: Caller should hash result with KDF for actual key derivation

## Reference

OX implementation: `node_modules/ox/core/Secp256k1.ts:getSharedSecret()`

## Priority

**HIGH** - Common cryptographic operation, required for many protocols
