# Bn254 and KZG Cryptographic Module Review

## Overview

Review of BN254 (alt_bn128) elliptic curve and KZG polynomial commitment modules in voltaire-effect. Also includes ModExp for completeness.

## Files Reviewed

- `src/crypto/Bn254/Bn254Service.ts`
- `src/crypto/Bn254/operations.ts`
- `src/crypto/Bn254/index.ts`
- `src/crypto/Bn254/Bn254.test.ts`
- `src/crypto/KZG/KZGService.ts`
- `src/crypto/KZG/commit.ts`
- `src/crypto/KZG/verify.ts`
- `src/crypto/KZG/index.ts`
- `src/crypto/KZG/KZG.test.ts`
- `src/crypto/ModExp/ModExpService.ts`
- `src/crypto/ModExp/operations.ts`
- `src/crypto/ModExp/index.ts`
- `src/crypto/ModExp/ModExp.test.ts`

---

## Critical Issues

### 1. Bn254Service uses Effect.sync for throwing operations (CONFIRMED)

**Severity**: Critical  
**Location**: `src/crypto/Bn254/Bn254Service.ts#L209-L222`  
**Reference**: Review 031

```typescript
// Current: Effect.sync for operations that CAN throw
g1Add: (a, b) => Effect.sync(() => BN254.G1.add(a, b)),
g1Mul: (point, scalar) => Effect.sync(() => BN254.G1.mul(point, scalar)),
pairingCheck: (pairs) => Effect.sync(() => BN254.Pairing.pairingCheck(...)),
```

**Analysis**: While the pure JS G1.add/G1.mul implementations declare `@throws {never}`, the underlying fromAffine operations CAN throw:
- `Bn254InvalidPointError` - point not on curve
- `Bn254SubgroupCheckError` - point not in subgroup

The JSDoc in voltaire-effect says `@throws Never` which is misleading.

**Fix**: Use `Effect.try` with proper error typing:

```typescript
import { Bn254Error, Bn254InvalidPointError, Bn254SubgroupCheckError } from "@tevm/voltaire";

g1Add: (a, b) =>
  Effect.try({
    try: () => BN254.G1.add(a, b),
    catch: (e) => {
      if (e instanceof Bn254InvalidPointError) return e;
      if (e instanceof Bn254SubgroupCheckError) return e;
      return new Bn254Error(`G1 add failed: ${e}`, { cause: e as Error });
    },
  }),
```

### 2. KZGService uses Effect.sync for throwing operations (CONFIRMED)

**Severity**: Critical  
**Location**: `src/crypto/KZG/KZGService.ts#L119-L130`  
**Reference**: Review 032

```typescript
// Current: Effect.sync for operations that throw KzgError, KzgNotInitializedError
blobToKzgCommitment: (blob) =>
  Effect.sync(() => KZG.blobToKzgCommitment(blob) as KzgCommitmentType),
```

**Analysis**: The underlying KZG operations throw:
- `KzgNotInitializedError` - trusted setup not loaded
- `KzgError` - commitment/proof computation failures
- `KzgInvalidBlobError` - wrong blob size/format

**Fix**: Use `Effect.try` with proper error typing.

### 3. Bn254 operations declare `never` error type (CONFIRMED)

**Severity**: High  
**Location**: `src/crypto/Bn254/operations.ts`  
**Reference**: Review 048

```typescript
// Current: Claims operations never fail
export const g1Add = (
  a: BN254G1PointType,
  b: BN254G1PointType,
): Effect.Effect<BN254G1PointType, never, Bn254Service> =>
```

**Fix**: Add proper error types once Bn254Service is fixed:

```typescript
type Bn254OpError = Bn254Error | Bn254InvalidPointError | Bn254SubgroupCheckError;

export const g1Add = (
  a: BN254G1PointType,
  b: BN254G1PointType,
): Effect.Effect<BN254G1PointType, Bn254OpError, Bn254Service> =>
```

---

## Medium Issues

### 4. Missing error types in KZG operations

**Severity**: Medium  
**Location**: `src/crypto/KZG/commit.ts`, `src/crypto/KZG/verify.ts`

All KZG operations declare `never` as error type:

```typescript
export const blobToKzgCommitment = (
  blob: KzgBlobType,
): Effect.Effect<KzgCommitmentType, never, KZGService> =>  // ❌ should not be never
```

**Fix**: Add proper error types:

```typescript
type KzgOpError = KzgError | KzgNotInitializedError | KzgInvalidBlobError;

export const blobToKzgCommitment = (
  blob: KzgBlobType,
): Effect.Effect<KzgCommitmentType, KzgOpError, KZGService> =>
```

### 5. Missing error types in Bn254ServiceShape

**Severity**: Medium  
**Location**: `src/crypto/Bn254/Bn254Service.ts#L28-L132`

The service shape interface declares all operations as infallible:

```typescript
interface Bn254ServiceShape {
  readonly g1Add: (a, b) => Effect.Effect<BN254G1PointType>;  // ❌ no error type
}
```

**Fix**: Add error types to interface:

```typescript
interface Bn254ServiceShape {
  readonly g1Add: (
    a: BN254G1PointType, 
    b: BN254G1PointType
  ) => Effect.Effect<BN254G1PointType, Bn254Error | Bn254InvalidPointError>;
}
```

### 6. Missing error types in KZGServiceShape

**Severity**: Medium  
**Location**: `src/crypto/KZG/KZGService.ts#L25-L70`

Same issue as Bn254 - interface declares all operations as infallible.

---

## Test Coverage Issues

### 7. Bn254 tests missing error cases (CONFIRMED)

**Severity**: Medium  
**Location**: `src/crypto/Bn254/Bn254.test.ts`  
**Reference**: Review 049

Missing tests:
- Invalid point handling
- Point not on curve rejection
- Subgroup check failures
- Edge cases: scalar = 0, infinity point

### 8. KZG tests only use mock layer (CONFIRMED)

**Severity**: Medium  
**Location**: `src/crypto/KZG/KZG.test.ts`  
**Reference**: Review 049

Current tests only verify `KZGTest` mock layer:
- No `KZGLive` tests
- No error condition tests
- No blob validation tests

---

## Positive Observations

### Well-designed service pattern
- Clean separation: Service interface + Live layer + Test layer
- Proper Effect Context integration via `Context.Tag`
- Idiomatic use of `Layer.succeed`

### Good documentation
- Comprehensive JSDoc on all functions
- Clear examples showing Effect usage
- EVM precompile address references (0x06, 0x07, 0x08)

### Proper test structure
- Both service-level and standalone function tests
- Test layer for deterministic unit testing
- Good use of Effect.runPromise for async tests

### ModExp implementation is solid
- Uses `Effect.sync` correctly (underlying operations don't throw for valid inputs)
- Proper error type would be good for invalid modulus (modulus <= 0)
- Good gas calculation implementation per EIP-2565
- Comprehensive test coverage including edge cases

---

## Action Items

### P0 - Critical

1. **Replace Effect.sync with Effect.try in Bn254Live**
   - Add error types to all operations
   - Update JSDoc to document actual error behavior
   - See review 031 for detailed fix

2. **Replace Effect.sync with Effect.try in KZGLive**
   - Add error types for KzgError, KzgNotInitializedError
   - Handle loadTrustedSetup errors
   - See review 032 for detailed fix

### P1 - High

3. **Add error types to operation functions**
   - Update Bn254 operations.ts
   - Update KZG commit.ts and verify.ts
   - Ensure type consistency with service shape

4. **Update service shape interfaces**
   - Add error types to Bn254ServiceShape
   - Add error types to KZGServiceShape

### P2 - Medium

5. **Add error handling tests for Bn254**
   - Invalid point tests
   - Subgroup check tests
   - Edge case tests (scalar=0, infinity)

6. **Add KZGLive tests**
   - Skip if trusted setup unavailable
   - Test commitment/proof roundtrip
   - Test error conditions

### P3 - Low

7. **Consider adding input validation**
   - Validate point coordinates before operations
   - Validate blob size in Effect layer
   - Return descriptive errors for invalid inputs

---

## Related Reviews

- Review 031: Fix Bn254 Effect.sync for throwing
- Review 032: Fix KZG Effect.sync for throwing
- Review 048: Fix Bn254 operations missing error types
- Review 049: Add missing Bn254/KZG tests

---

## Summary

The Bn254, KZG, and ModExp modules have clean Effect-TS patterns but suffer from incorrect error handling. Using `Effect.sync` for throwing operations breaks Effect's typed error model - thrown errors become untyped defects. This needs immediate fixing before the modules can be considered production-ready.

ModExp is the cleanest implementation since its underlying operations genuinely don't throw for valid inputs. Bn254 and KZG require Effect.try wrappers with proper error type declarations.
