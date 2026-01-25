# Crypto Signatures Security Review

**Modules Reviewed**: Secp256k1, Ed25519, Bls12381
**Date**: 2025-01-25
**Severity Summary**: 2 High, 4 Medium, 2 Low

---

## Summary

Review of voltaire-effect crypto signature modules for security, correctness, and Effect pattern compliance. The wrappers correctly delegate to @tevm/voltaire but inherit upstream timing vulnerabilities and have opportunities for improved type safety.

**Key Findings**:
1. Timing leaks in underlying Secp256k1 verify (upstream - already tracked)
2. Unsafe error type assertions across all modules
3. Missing branded types in Ed25519 service
4. No memory cleanup for sensitive data
5. Test implementation signature size inconsistency
6. Good: No console statements in library code
7. Good: Effect.try pattern used correctly

---

## Issue 1: Inherits Upstream Constant-Time Comparison Bug

**Priority**: High (but tracked separately)
**Location**: Inherited from `@tevm/voltaire/Secp256k1`

The voltaire-effect Secp256k1 wrappers delegate to the upstream library which has timing leaks:
- `src/crypto/Secp256k1/verify.js#L107` - `.every()` comparison
- `src/crypto/Secp256k1/verifyHash.js#L90` - `.every()` comparison

**Status**: Already tracked in [036-fix-secp256k1-non-constant-time-compare.md](file:///Users/williamcory/voltaire/voltaire-effect/reviews/036-fix-secp256k1-non-constant-time-compare.md)

**Impact on voltaire-effect**: When upstream is fixed, no changes needed in effect wrappers.

---

## Issue 2: Unsafe Error Type Assertions

**Priority**: High
**Location**: All crypto modules

All Effect wrappers use unsafe `as` type assertions that can mistype errors:

### Secp256k1/sign.ts#L92-L95
```typescript
Effect.try({
  try: () => Secp256k1.sign(messageHash, privateKey as any, options),
  catch: (e) => e as InvalidPrivateKeyError | CryptoError,  // ❌ Unsafe cast
})
```

### Ed25519/sign.ts#L63-L65
```typescript
Effect.try({
  try: () => Ed25519.sign(message, secretKey as any),
  catch: (e) => e as InvalidSecretKeyError | Ed25519Error,  // ❌ Unsafe cast
})
```

### Bls12381/sign.ts#L62-L65
```typescript
Effect.try({
  try: () => Bls12381.sign(message, privateKey),
  catch: (e) => e as InvalidScalarError | SignatureError,  // ❌ Unsafe cast
})
```

**Solution**:

```typescript
import { InvalidPrivateKeyError, CryptoError } from "@tevm/voltaire";

export const sign = (
  messageHash: HashType,
  privateKey: Uint8Array,
  options?: SignOptions,
): Effect.Effect<Secp256k1SignatureType, InvalidPrivateKeyError | CryptoError> =>
  Effect.try({
    try: () => Secp256k1.sign(messageHash, privateKey as any, options),
    catch: (e) => {
      if (e instanceof InvalidPrivateKeyError) return e;
      if (e instanceof CryptoError) return e;
      return new CryptoError({
        message: `Signing failed: ${e instanceof Error ? e.message : String(e)}`,
        code: "SECP256K1_SIGN_UNEXPECTED",
        cause: e,
      });
    },
  });
```

**Status**: Already tracked in [046-fix-secp256k1-error-type-assertion.md](file:///Users/williamcory/voltaire/voltaire-effect/reviews/046-fix-secp256k1-error-type-assertion.md)

---

## Issue 3: Ed25519 Missing Branded Types

**Priority**: Medium
**Location**: `voltaire-effect/src/crypto/Ed25519/Ed25519Service.ts#L42-L82`

Ed25519 service uses raw `Uint8Array` instead of branded types:

```typescript
// Current
export interface Ed25519ServiceShape {
  readonly sign: (
    message: Uint8Array,
    secretKey: Uint8Array,  // Should be SecretKey branded type
  ) => Effect.Effect<Uint8Array, ...>;  // Should be Signature branded type
}
```

**Solution**: Use branded types from base library:

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
}
```

**Status**: Already tracked in [045-fix-ed25519-missing-branded-types.md](file:///Users/williamcory/voltaire/voltaire-effect/reviews/045-fix-ed25519-missing-branded-types.md)

---

## Issue 4: Bls12381 Missing Branded Types

**Priority**: Medium  
**Location**: `voltaire-effect/src/crypto/Bls12381/Bls12381Service.ts#L26-L80`

Same issue as Ed25519 - uses raw `Uint8Array` instead of branded types:

```typescript
// Current
export interface Bls12381ServiceShape {
  readonly sign: (
    message: Uint8Array,
    privateKey: Uint8Array,  // Should be PrivateKey branded type
  ) => Effect.Effect<Uint8Array, ...>;  // Should be Signature branded type
}
```

**Solution**: Import and use branded types from `@tevm/voltaire/Bls12381`.

---

## Issue 5: No Memory Cleanup for Sensitive Data

**Priority**: Medium
**Location**: All crypto modules

Effect wrappers don't clean up sensitive data. While the underlying Zig code does cleanup, the TypeScript layer should also attempt best-effort cleanup:

```typescript
// Current - no cleanup
export const sign = (messageHash, privateKey, options) =>
  Effect.try({
    try: () => Secp256k1.sign(messageHash, privateKey, options),
    catch: (e) => e as InvalidPrivateKeyError | CryptoError,
  });
```

**Solution**: For services that hold keys, use `Effect.acquireRelease`:

```typescript
export const LocalSigner = (privateKeyHex: Hex) =>
  Layer.scoped(
    SignerService,
    Effect.acquireRelease(
      Effect.sync(() => Hex.toBytes(privateKeyHex)),
      (key) => Effect.sync(() => key.fill(0))  // Best-effort cleanup
    ).pipe(Effect.map((privateKey) => ({
      sign: (hash) => signEffect(hash, privateKey),
    })))
  );
```

**Status**: Already tracked in [038-fix-crypto-no-memory-cleanup.md](file:///Users/williamcory/voltaire/voltaire-effect/reviews/038-fix-crypto-no-memory-cleanup.md)

---

## Issue 6: Bls12381 Test Signature Length Inconsistency

**Priority**: Low
**Location**: `voltaire-effect/src/crypto/Bls12381/Bls12381.test.ts#L19`

Test expects 48-byte signature but docs claim 96-byte:

```typescript
// Test
expect(result.length).toBe(48);  // Actual implementation

// Docs (sign.ts#L29, aggregate.ts#L25)
// "Creates a 96-byte BLS signature..."
```

The implementation returns G1 point (48 bytes) not G2 point (96 bytes). Either:
1. Fix docs to say 48 bytes, or
2. Verify the implementation is correct per BLS spec

**Note**: This appears to be a documentation issue, not a security issue. The underlying implementation is correct; standard BLS12-381 uses G1 for public keys (48 bytes) and G2 for signatures (96 bytes), but some implementations swap this. Need to verify which convention is used.

---

## Issue 7: Secp256k1Test Returns Wrong Mock Signature Shape

**Priority**: Low
**Location**: `voltaire-effect/src/crypto/Secp256k1/Secp256k1Test.ts#L24`

Test layer returns 65-byte Uint8Array but actual signatures have `{r, s, v}` shape:

```typescript
// Current mock
const mockSignature = new Uint8Array(65) as unknown as Secp256k1SignatureType;

// Actual shape per test (Secp256k1.test.ts#L28-L33)
expect(result).toHaveProperty("r");
expect(result).toHaveProperty("s");
expect(result).toHaveProperty("v");
```

**Solution**:

```typescript
const mockSignature = {
  r: new Uint8Array(32),
  s: new Uint8Array(32),
  v: 27,
} as Secp256k1SignatureType;
```

---

## Issue 8: Console Statements in Examples Only

**Priority**: N/A (No Issue)

Verified: All console statements in crypto modules are in JSDoc examples only, not in library code:
- `console.log(signature.length) // 65` in docstrings
- No runtime console.log/warn/error statements

✅ **Compliant with policy**

---

## Test Coverage Analysis

### Secp256k1.test.ts
✅ Sign/verify roundtrip
✅ Deterministic signatures (RFC 6979)
✅ Invalid private key (zero key)
✅ Wrong message hash returns false
✅ Wrong public key returns false
✅ Service layer tests
✅ Known vector tests
❌ Missing: Malformed signature input
❌ Missing: Empty message hash
❌ Missing: Boundary value private keys (n-1, max scalar)

### Ed25519.test.ts
✅ Sign/verify roundtrip
✅ Deterministic signatures
✅ Wrong key length fails
✅ Wrong message returns false
✅ Wrong public key returns false
✅ Service layer tests
✅ Test layer (mock) tests
❌ Missing: Zero secret key
❌ Missing: All-ones secret key

### Bls12381.test.ts
✅ Sign/verify roundtrip
✅ Deterministic signatures
✅ Zero private key fails
✅ Wrong message/key returns false
✅ Aggregation tests
✅ Empty array aggregation fails
✅ Service layer tests
❌ Missing: Single signature aggregation
❌ Missing: Large aggregation (100+ sigs)

**Status**: Edge case tests already tracked in [047-add-missing-crypto-edge-case-tests.md](file:///Users/williamcory/voltaire/voltaire-effect/reviews/047-add-missing-crypto-edge-case-tests.md)

---

## Effect Pattern Compliance

### ✅ Correct Usage
- `Effect.try` used appropriately for throwing operations
- `Effect.succeed` used in test layers
- Service pattern with `Context.Tag` properly implemented
- Layer pattern with `Layer.succeed` properly implemented

### ⚠️ Could Improve
- Error types should be validated, not cast (Issue 2)
- Could use `Effect.sync` instead of `Effect.try` for non-throwing paths

---

## Acceptance Criteria

### High Priority (Security)
- [ ] Fix upstream Secp256k1 constant-time comparison (separate PR)
- [ ] Validate error types instead of unsafe casting

### Medium Priority (Type Safety)
- [ ] Add branded types to Ed25519 service
- [ ] Add branded types to Bls12381 service
- [ ] Implement memory cleanup for key material

### Low Priority (Correctness)
- [ ] Fix Secp256k1Test mock signature shape
- [ ] Clarify/fix Bls12381 signature size documentation
- [ ] Add missing edge case tests

---

## References

- [036-fix-secp256k1-non-constant-time-compare.md](file:///Users/williamcory/voltaire/voltaire-effect/reviews/036-fix-secp256k1-non-constant-time-compare.md)
- [037-fix-secp256k1-non-constant-time-zero-check.md](file:///Users/williamcory/voltaire/voltaire-effect/reviews/037-fix-secp256k1-non-constant-time-zero-check.md)
- [038-fix-crypto-no-memory-cleanup.md](file:///Users/williamcory/voltaire/voltaire-effect/reviews/038-fix-crypto-no-memory-cleanup.md)
- [045-fix-ed25519-missing-branded-types.md](file:///Users/williamcory/voltaire/voltaire-effect/reviews/045-fix-ed25519-missing-branded-types.md)
- [046-fix-secp256k1-error-type-assertion.md](file:///Users/williamcory/voltaire/voltaire-effect/reviews/046-fix-secp256k1-error-type-assertion.md)
- [047-add-missing-crypto-edge-case-tests.md](file:///Users/williamcory/voltaire/voltaire-effect/reviews/047-add-missing-crypto-edge-case-tests.md)
