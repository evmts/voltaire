# Fix Ed25519 Service Missing Branded Types

## Problem

Ed25519Service returns raw `Uint8Array` types instead of branded types (`Signature`, `PublicKey`, `SecretKey`), losing type safety from the base library.

**Location**: `src/crypto/Ed25519/Ed25519Service.ts#L42-L82`

```typescript
export interface Ed25519ServiceShape {
  readonly sign: (
    message: Uint8Array,
    secretKey: Uint8Array,  // Should be SecretKey
  ) => Effect.Effect<Uint8Array, ...>;  // Should return Signature

  readonly getPublicKey: (
    secretKey: Uint8Array,  // Should be SecretKey
  ) => Effect.Effect<Uint8Array, ...>;  // Should return PublicKey
}
```

## Why This Matters

- Loses compile-time type checking
- Can pass wrong key type (public key where secret key expected)
- Type safety is a key benefit of branded types
- Inconsistent with other services that use branded types

## Solution

Import and use branded types:

```typescript
import type { 
  PublicKey as Ed25519PublicKey, 
  SecretKey as Ed25519SecretKey, 
  Signature as Ed25519Signature 
} from "@tevm/voltaire/Ed25519";

export interface Ed25519ServiceShape {
  readonly sign: (
    message: Uint8Array,
    secretKey: Ed25519SecretKey,
  ) => Effect.Effect<Ed25519Signature, InvalidSecretKeyError | Ed25519Error>;

  readonly verify: (
    signature: Ed25519Signature,
    message: Uint8Array,
    publicKey: Ed25519PublicKey,
  ) => Effect.Effect<boolean, InvalidSignatureError | InvalidPublicKeyError>;

  readonly getPublicKey: (
    secretKey: Ed25519SecretKey,
  ) => Effect.Effect<Ed25519PublicKey, InvalidSecretKeyError>;
}
```

## Acceptance Criteria

- [ ] Import branded types from base library
- [ ] Update all parameter types to use branded types
- [ ] Update all return types to use branded types
- [ ] All existing tests pass (may need casts in tests)

## Priority

**Medium** - Type safety improvement
