# Review #104: EIP-4844 Blob and KZG Commitment Primitives

**Date**: 2026-01-25  
**Severity**: 🔴 P0 (Security/Correctness), 🟡 P1 (Important), 🔵 P2 (Minor)  
**Status**: Review Complete

## Executive Summary

Reviewed EIP-4844 Blob and KZG commitment primitives across both `voltaire-effect` and base `voltaire` libraries. The base library implementation is **solid and well-tested**. The Effect wrapper layer has **critical gaps** in test coverage and missing functionality.

### Files Reviewed

**voltaire-effect:**
- [`src/primitives/Blob/BlobSchema.ts`](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/Blob/BlobSchema.ts)
- [`src/primitives/Blob/index.ts`](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/Blob/index.ts)
- [`src/primitives/Blob/isValid.ts`](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/Blob/isValid.ts)
- [`src/primitives/Blob/toData.ts`](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/Blob/toData.ts)
- [`src/primitives/BeaconBlockRoot/Hex.ts`](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/BeaconBlockRoot/Hex.ts)
- [`src/primitives/BeaconBlockRoot/index.ts`](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/BeaconBlockRoot/index.ts)
- [`src/crypto/KZG/commit.ts`](file:///Users/williamcory/voltaire/voltaire-effect/src/crypto/KZG/commit.ts)
- [`src/crypto/KZG/verify.ts`](file:///Users/williamcory/voltaire/voltaire-effect/src/crypto/KZG/verify.ts)
- [`src/crypto/KZG/KZGService.ts`](file:///Users/williamcory/voltaire/voltaire-effect/src/crypto/KZG/KZGService.ts)
- [`src/crypto/KZG/KZG.test.ts`](file:///Users/williamcory/voltaire/voltaire-effect/src/crypto/KZG/KZG.test.ts)

**Base voltaire (cross-reference):**
- [`src/primitives/Blob/`](file:///Users/williamcory/voltaire/src/primitives/Blob) (53 files)
- [`src/crypto/KZG/`](file:///Users/williamcory/voltaire/src/crypto/KZG) (22 files)
- [`src/primitives/BeaconBlockRoot/`](file:///Users/williamcory/voltaire/src/primitives/BeaconBlockRoot) (9 files)

---

## Checklist Results

### 1. Blob Size Validation (131072 bytes) ✅

**Base Library**: Correct
- [`constants.js#L12`](file:///Users/williamcory/voltaire/src/primitives/Blob/constants.js#L12): `SIZE = 131072`
- [`isValid.js#L19-L21`](file:///Users/williamcory/voltaire/src/primitives/Blob/isValid.js#L19-L21): `blob.length === SIZE`
- [`validateBlob.js#L30-L38`](file:///Users/williamcory/voltaire/src/crypto/KZG/validateBlob.js#L30-L38): Enforces `BYTES_PER_BLOB = 131072`

**voltaire-effect**: Correct (delegates to base)
- [`BlobSchema.ts#L69-L77`](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/Blob/BlobSchema.ts#L69-L77): Validates via `BlobNamespace.isValid(arr)`

**Constants verified** per EIP-4844:
| Constant | Value | EIP-4844 Spec | Status |
|----------|-------|---------------|--------|
| SIZE | 131072 | 128 KB | ✅ |
| FIELD_ELEMENTS_PER_BLOB | 4096 | 4096 | ✅ |
| BYTES_PER_FIELD_ELEMENT | 32 | 32 | ✅ |
| MAX_PER_TRANSACTION | 6 | 6 | ✅ |
| COMMITMENT_VERSION_KZG | 0x01 | 0x01 | ✅ |
| GAS_PER_BLOB | 131072 | 2^17 | ✅ |

---

### 2. Blob Versioned Hash Calculation ✅

**Base Library**: Correct implementation at [`toVersionedHash.js#L24-L45`](file:///Users/williamcory/voltaire/src/primitives/Blob/toVersionedHash.js#L24-L45)

```javascript
// Correct formula: COMMITMENT_VERSION_KZG || sha256(commitment)[1:]
const hash = sha256(commitment);
const versionedHash = new Uint8Array(32);
versionedHash[0] = COMMITMENT_VERSION_KZG;  // 0x01
versionedHash.set(hash.slice(1), 1);
```

**Validated against EIP-4844 spec**: Version byte is first, followed by 31 bytes of SHA256 hash.

**Issue**: 🔵 P2 - voltaire-effect has no `toVersionedHash` wrapper exposed

---

### 3. KZG Commitment Format ✅

**Commitment size**: 48 bytes (BLS12-381 G1 point)
- [`KzgCommitmentType.ts#L11-L13`](file:///Users/williamcory/voltaire/src/crypto/KZG/KzgCommitmentType.ts#L11-L13): Branded type
- [`constants.js#L20`](file:///Users/williamcory/voltaire/src/crypto/KZG/constants.js#L20): `BYTES_PER_COMMITMENT = 48`

**Validation in verify**:
- [`verifyBlobKzgProof.js#L31-L37`](file:///Users/williamcory/voltaire/src/crypto/KZG/verifyBlobKzgProof.js#L31-L37): Checks `commitment.length !== BYTES_PER_COMMITMENT`

---

### 4. KZG Proof Verification Integration ✅

**Base Library**: Complete integration
- [`toProof.js`](file:///Users/williamcory/voltaire/src/primitives/Blob/toProof.js): Factory for proof generation
- [`verify.js`](file:///Users/williamcory/voltaire/src/primitives/Blob/verify.js): Factory for verification
- [`verifyBatch.js`](file:///Users/williamcory/voltaire/src/primitives/Blob/verifyBatch.js): Batch verification

**voltaire-effect KZGService**: Proper Effect wrapping
- [`KZGService.ts#L156-L212`](file:///Users/williamcory/voltaire/voltaire-effect/src/crypto/KZG/KZGService.ts#L156-L212): KZGLive layer wraps c-kzg-4844

**Issue**: 🟡 P1 - Field element validation not enforced in fromData encoding

---

### 5. toData/fromData Conversions ✅

**Encoding format** (EIP-4844 compliant):
- Each 32-byte field element has byte[0] = 0x00 (BLS field constraint)
- First 4 bytes of data space (positions 1-4) = length prefix (big-endian)
- Data fills positions 5-31 of field 0, then 1-31 of subsequent fields

[`fromData.js#L27-L73`](file:///Users/williamcory/voltaire/src/primitives/Blob/fromData.js#L27-L73):
```javascript
// Correct: Write 4-byte big-endian length prefix at positions 1-4
view.setUint32(1, data.length, false); // big-endian
// Skip position 0 of each field element (must be 0x00)
if (posInField === 0) {
  blobOffset = fieldStart + 1;
  continue;
}
```

[`toData.js#L31-L83`](file:///Users/williamcory/voltaire/src/primitives/Blob/toData.js#L31-L83): Inverse operation, correctly reads length prefix and extracts data.

**Max data per blob**: 4096 × 31 - 4 = **126,972 bytes** ✅

---

### 6. isValid Checks ✅

**Blob validation** (base): Simple size check at [`isValid.js`](file:///Users/williamcory/voltaire/src/primitives/Blob/isValid.js)

**KZG field element validation** (base): [`validateBlob.js#L41-L53`](file:///Users/williamcory/voltaire/src/crypto/KZG/validateBlob.js#L41-L53)
```javascript
// Critical: Top byte of each field element must be 0
for (let i = 0; i < FIELD_ELEMENTS_PER_BLOB; i++) {
  const offset = i * BYTES_PER_FIELD_ELEMENT;
  if (blob[offset] !== 0) {
    throw new KzgInvalidBlobError(...)
  }
}
```

**Commitment validation**: 48 bytes ✅
**Proof validation**: 48 bytes ✅
**VersionedHash validation**: 32 bytes + version byte 0x01 ✅

---

### 7. Test Coverage

#### Base Library (voltaire) ✅ Excellent

| Test File | Lines | Coverage |
|-----------|-------|----------|
| [`Blob.test.ts`](file:///Users/williamcory/voltaire/src/primitives/Blob/Blob.test.ts) | 880 | Comprehensive |
| [`BrandedBlob.test.ts`](file:///Users/williamcory/voltaire/src/primitives/Blob/BrandedBlob.test.ts) | ~300 | Good |
| [`blob_kzg_integration.test.ts`](file:///Users/williamcory/voltaire/src/primitives/Blob/blob_kzg_integration.test.ts) | 297 | EIP-4844 compliance |
| [`validation.test.ts`](file:///Users/williamcory/voltaire/src/primitives/Blob/validation.test.ts) | - | Field element validation |
| [`field_elements.test.ts`](file:///Users/williamcory/voltaire/src/primitives/Blob/field_elements.test.ts) | - | Element encoding |
| [`BeaconBlockRoot.test.ts`](file:///Users/williamcory/voltaire/src/primitives/BeaconBlockRoot/BeaconBlockRoot.test.ts) | 86 | Good |
| [`KZG.test.ts`](file:///Users/williamcory/voltaire/src/crypto/KZG/KZG.test.ts) | - | KZG operations |

**Key test scenarios covered**:
- ✅ Blob size validation (131072 bytes)
- ✅ Data roundtrip (fromData → toData)
- ✅ Max data size enforcement
- ✅ Oversized data rejection
- ✅ Empty data handling
- ✅ Unicode/binary patterns
- ✅ Split/join for large data
- ✅ Commitment determinism
- ✅ Versioned hash format (EIP-4844)
- ✅ Field element constraints (top byte = 0)
- ✅ KZG proof generation/verification
- ✅ Batch verification

#### voltaire-effect 🔴 Critical Gaps

| Test File | Lines | Status |
|-----------|-------|--------|
| [`KZG.test.ts`](file:///Users/williamcory/voltaire/voltaire-effect/src/crypto/KZG/KZG.test.ts) | 117 | **Mock-only** |
| `Blob/*.test.ts` | 0 | **❌ Missing** |
| `BeaconBlockRoot/*.test.ts` | 0 | **❌ Missing** |

---

## Critical Issues

### 🔴 P0-1: voltaire-effect Blob Module Missing Tests

**Location**: `voltaire-effect/src/primitives/Blob/`

**Problem**: No test file exists. BlobSchema parsing, isValid, toData are untested in Effect context.

**Impact**: Schema validation bugs undetected. ParseResult error handling untested.

**Fix**: Create `Blob.test.ts`:

```typescript
// voltaire-effect/src/primitives/Blob/Blob.test.ts
import * as Schema from "effect/Schema";
import { describe, expect, it } from "vitest";
import { BlobSchema } from "./BlobSchema.js";
import { isValid } from "./isValid.js";
import { toData } from "./toData.js";
import { SIZE, FIELD_ELEMENTS_PER_BLOB, BYTES_PER_FIELD_ELEMENT } from "@tevm/voltaire/Blob";

describe("BlobSchema", () => {
  it("decodes valid 131072-byte blob", () => {
    const blob = new Uint8Array(SIZE);
    const result = Schema.decodeSync(BlobSchema)(blob);
    expect(result.length).toBe(SIZE);
  });

  it("rejects undersized blob", () => {
    const invalid = new Uint8Array(100);
    expect(() => Schema.decodeSync(BlobSchema)(invalid)).toThrow("Invalid blob size");
  });

  it("rejects oversized blob", () => {
    const invalid = new Uint8Array(SIZE + 1);
    expect(() => Schema.decodeSync(BlobSchema)(invalid)).toThrow();
  });

  it("encodes blob back to Uint8Array", () => {
    const blob = new Uint8Array(SIZE);
    const decoded = Schema.decodeSync(BlobSchema)(blob);
    const encoded = Schema.encodeSync(BlobSchema)(decoded);
    expect(encoded.length).toBe(SIZE);
  });

  it("decodes Array<number> input", () => {
    const arr = Array(SIZE).fill(0);
    const result = Schema.decodeSync(BlobSchema)(arr);
    expect(result.length).toBe(SIZE);
  });
});

describe("isValid", () => {
  it("returns true for 131072 bytes", () => {
    expect(isValid(new Uint8Array(SIZE))).toBe(true);
  });

  it("returns false for wrong size", () => {
    expect(isValid(new Uint8Array(100))).toBe(false);
    expect(isValid(new Uint8Array(SIZE + 1))).toBe(false);
  });
});

describe("toData", () => {
  it("extracts data from blob", async () => {
    const { BrandedBlob } = await import("@tevm/voltaire");
    const original = new TextEncoder().encode("Hello EIP-4844");
    const blob = BrandedBlob.fromData(original);
    const extracted = toData(blob);
    expect(extracted).toEqual(original);
  });
});
```

---

### 🔴 P0-2: KZG Tests Only Test Mock Layer

**Location**: [`voltaire-effect/src/crypto/KZG/KZG.test.ts`](file:///Users/williamcory/voltaire/voltaire-effect/src/crypto/KZG/KZG.test.ts)

**Problem**: Tests only use `KZGTest` (mock layer), never test real `KZGLive`.

```typescript
// Current: Only mocks
const result = await Effect.runPromise(
  program.pipe(Effect.provide(KZGTest))  // Always mock
);
```

**Impact**: Real c-kzg-4844 integration untested. Error handling paths untested.

**Fix**: Add conditional live tests:

```typescript
import { hasNativeKzg } from "@tevm/voltaire/crypto/KZG/test-utils";

describe.skipIf(!hasNativeKzg)("KZGLive", () => {
  it("blobToKzgCommitment returns real commitment", async () => {
    const { KZGLive, blobToKzgCommitment } = await import("./index.js");
    const blob = new Uint8Array(131072);
    // Must call loadTrustedSetup first
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const kzg = yield* KZGService;
        yield* kzg.loadTrustedSetup();
        return yield* blobToKzgCommitment(blob);
      }).pipe(Effect.provide(KZGLive))
    );
    expect(result.length).toBe(48);
  });
});
```

---

### 🔴 P0-3: verifyBlobKzgProof Has Wrong Error Type

**Location**: [`voltaire-effect/src/crypto/KZG/verify.ts#L49`](file:///Users/williamcory/voltaire/voltaire-effect/src/crypto/KZG/verify.ts#L49)

**Problem**: Return type claims `never` for error channel but KZGService.verifyBlobKzgProof returns `Effect<boolean, KZGError>`.

```typescript
// Current: WRONG
): Effect.Effect<boolean, never, KZGService> =>

// Should be:
): Effect.Effect<boolean, KZGError, KZGService> =>
```

**Impact**: Type safety violation. Callers won't handle KZGError.

---

### 🟡 P1-1: BeaconBlockRoot Missing Tests

**Location**: `voltaire-effect/src/primitives/BeaconBlockRoot/`

**Problem**: No test file exists. BeaconBlockRootSchema untested.

**Fix**: Create `BeaconBlockRoot.test.ts`:

```typescript
import * as Schema from "effect/Schema";
import { describe, expect, it } from "vitest";
import { BeaconBlockRootSchema } from "./Hex.js";

describe("BeaconBlockRootSchema", () => {
  const validHex = "0x" + "ab".repeat(32);

  it("decodes valid 64-char hex", () => {
    const result = Schema.decodeSync(BeaconBlockRootSchema)(validHex);
    expect(result.length).toBe(32);
  });

  it("rejects short hex", () => {
    expect(() => Schema.decodeSync(BeaconBlockRootSchema)("0x1234")).toThrow();
  });

  it("encodes back to hex", () => {
    const decoded = Schema.decodeSync(BeaconBlockRootSchema)(validHex);
    const encoded = Schema.encodeSync(BeaconBlockRootSchema)(decoded);
    expect(encoded).toBe(validHex.toLowerCase());
  });
});
```

---

### 🟡 P1-2: Blob Module Missing `from` and `fromData` Exports

**Location**: [`voltaire-effect/src/primitives/Blob/index.ts#L48-L49`](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/Blob/index.ts#L48-L49)

**Problem**: Comments indicate exports should exist, but they're missing:

```typescript
/** Create blob from exact 131,072 bytes */
/** Create blob from arbitrary data with padding */
// No actual exports here!
```

**Fix**: Add Effect-wrapped constructors:

```typescript
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import { BlobSchema } from "./BlobSchema.js";

export const from = (bytes: Uint8Array) =>
  Schema.decode(BlobSchema)(bytes);

export const fromData = (data: Uint8Array) =>
  Effect.try({
    try: () => BlobNamespace.fromData(data),
    catch: (e) => new ParseResult.Type(/* ... */)
  });
```

---

### 🟡 P1-3: BeaconBlockRootSchema Validation Uses Try/Catch

**Location**: [`voltaire-effect/src/primitives/BeaconBlockRoot/Hex.ts#L26-L32`](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/BeaconBlockRoot/Hex.ts#L26-L32)

**Problem**: Validation uses try/catch which swallows error details:

```typescript
(u): u is BeaconBlockRootType => {
  try {
    BeaconBlockRoot.toHex(u as BeaconBlockRootType);
    return true;
  } catch {
    return false;  // Lost error context
  }
}
```

**Fix**: Use explicit size check:

```typescript
(u): u is BeaconBlockRootType => {
  if (!(u instanceof Uint8Array)) return false;
  return u.length === 32;
}
```

---

### 🔵 P2-1: Missing toVersionedHash in voltaire-effect

**Location**: `voltaire-effect/src/primitives/Blob/`

**Problem**: Base library has `toVersionedHash` but voltaire-effect doesn't expose it.

**Fix**: Add to exports:

```typescript
// index.ts
export { toVersionedHash } from "@tevm/voltaire/Blob";
```

---

### 🔵 P2-2: Missing Commitment/Proof Nested Types

**Location**: [`voltaire-effect/src/primitives/Blob/index.ts`](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/Blob/index.ts)

**Problem**: Base library has nested namespaces `Blob.Commitment`, `Blob.Proof`, `Blob.VersionedHash` for type-specific validation. voltaire-effect doesn't expose these.

---

## Security Considerations

### ✅ Field Element Constraint Enforced

Base library correctly enforces BLS12-381 field constraint:
- [`validateBlob.js#L41-L53`](file:///Users/williamcory/voltaire/src/crypto/KZG/validateBlob.js#L41-L53): Top byte of each 32-byte element must be 0
- [`fromData.js#L59-L63`](file:///Users/williamcory/voltaire/src/primitives/Blob/fromData.js#L59-L63): Skips position 0 when encoding

### ✅ Length Prefix Bounds Checked

- [`toData.js#L50-L58`](file:///Users/williamcory/voltaire/src/primitives/Blob/toData.js#L50-L58): Validates length prefix doesn't exceed max

### ✅ Commitment/Proof Size Validated

- 48 bytes enforced in [`verifyBlobKzgProof.js`](file:///Users/williamcory/voltaire/src/crypto/KZG/verifyBlobKzgProof.js)

### ⚠️ KZG Trusted Setup Initialization Required

- [`loadTrustedSetup.js`](file:///Users/williamcory/voltaire/src/crypto/KZG/loadTrustedSetup.js): Must be called before any operations
- voltaire-effect KZGService correctly exposes `loadTrustedSetup()` and `isInitialized()`

---

## Summary Table

| Issue | Severity | Category | Status |
|-------|----------|----------|--------|
| P0-1: Missing Blob tests | 🔴 P0 | Test Coverage | Open |
| P0-2: KZG tests mock-only | 🔴 P0 | Test Coverage | Open |
| P0-3: verifyBlobKzgProof wrong error type | 🔴 P0 | Type Safety | Open |
| P1-1: Missing BeaconBlockRoot tests | 🟡 P1 | Test Coverage | Open |
| P1-2: Missing from/fromData exports | 🟡 P1 | API Completeness | Open |
| P1-3: BeaconBlockRoot swallows errors | 🟡 P1 | Error Handling | Open |
| P2-1: Missing toVersionedHash | 🔵 P2 | API Completeness | Open |
| P2-2: Missing nested type namespaces | 🔵 P2 | API Completeness | Open |

---

## Recommendations

### Immediate (P0)

1. Create `voltaire-effect/src/primitives/Blob/Blob.test.ts`
2. Add live KZG tests with `hasNativeKzg` guard
3. Fix `verifyBlobKzgProof` return type: `Effect<boolean, KZGError, KZGService>`

### Short-term (P1)

4. Create `voltaire-effect/src/primitives/BeaconBlockRoot/BeaconBlockRoot.test.ts`
5. Add `from` and `fromData` Effect wrappers to Blob module
6. Fix BeaconBlockRootSchema validation to use size check

### Long-term (P2)

7. Add `toVersionedHash` export
8. Add nested namespaces (`Blob.Commitment`, `Blob.Proof`, `Blob.VersionedHash`)
9. Add Effect Schema for Commitment, Proof, VersionedHash types

---

## Appendix: EIP-4844 Compliance Matrix

| Requirement | Base voltaire | voltaire-effect |
|-------------|---------------|-----------------|
| Blob size 131072 bytes | ✅ | ✅ |
| 4096 field elements × 32 bytes | ✅ | ✅ |
| Field element top byte = 0 | ✅ | ✅ (via base) |
| Commitment 48 bytes (G1) | ✅ | ✅ |
| Proof 48 bytes (G1) | ✅ | ✅ |
| Versioned hash format | ✅ | ❌ Not exposed |
| Version byte 0x01 | ✅ | ❌ Not exposed |
| Max 6 blobs per tx | ✅ | ✅ |
| Gas per blob 2^17 | ✅ | ✅ |
| Data encoding (31 bytes/element) | ✅ | ✅ |
| Max data 126972 bytes | ✅ | ✅ |
