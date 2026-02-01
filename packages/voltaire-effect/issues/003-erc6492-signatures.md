# ERC-6492 Signature Support

**Priority**: P2
**Status**: Not Started

## Summary

Implement ERC-6492 for counterfactual signature verification (smart accounts that aren't deployed yet).

## Background

ERC-6492 wraps signatures with deployment bytecode so verifiers can deploy the account in a call to verify the signature, even if the account doesn't exist on-chain.

## Implementation

```typescript
// src/crypto/ERC6492/wrapSignature.ts
export const wrapSignature = (params: {
  signature: Hex
  factoryAddress: Address
  factoryData: Hex
}): Effect.Effect<Hex, never>

// src/crypto/ERC6492/verifySignature.ts
export const verifySignature = (params: {
  address: Address
  message: Hex
  signature: Hex
  provider: ProviderService
}): Effect.Effect<boolean, VerifyError>

// src/crypto/ERC6492/unwrapSignature.ts
export const unwrapSignature = (signature: Hex): Effect.Effect<{
  signature: Hex
  factoryAddress: Address
  factoryData: Hex
} | null, never>
```

## Files
- src/crypto/ERC6492/wrapSignature.ts (NEW)
- src/crypto/ERC6492/verifySignature.ts (NEW)
- src/crypto/ERC6492/unwrapSignature.ts (NEW)
- src/crypto/ERC6492/index.ts (NEW)
- src/crypto/ERC6492/ERC6492.test.ts (NEW)
