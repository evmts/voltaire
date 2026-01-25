# Review 086: Signature, PublicKey, PrivateKey Primitives

## Summary

Comprehensive review of Effect-TS wrappers for cryptographic key and signature primitives.

**Status**: ⚠️ Several issues requiring attention

## Files Reviewed

- `src/primitives/Signature/` (15 files)
- `src/primitives/PublicKey/` (10 files)
- `src/primitives/PrivateKey/` (5 files)

---

## Security Analysis

### 1. Non-Constant-Time Comparisons ⚠️ CRITICAL

**Location**: [PublicKey/equals.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/PublicKey/equals.ts#L29-L33)

```typescript
for (let i = 0; i < a.length; i++) {
  if (a[i] !== b[i]) return false;  // Early exit leaks timing info
}
```

**Problem**: Uses early-exit comparison on public keys. While public keys aren't secrets, consistent patterns across primitives matter. The underlying voltaire `Signature.equals` also uses early-exit (non-constant-time).

**Impact**: Medium - Could theoretically enable timing attacks in signature verification contexts.

**Fix**: Use XOR accumulator pattern:
```typescript
let diff = 0;
for (let i = 0; i < a.length; i++) {
  diff |= a[i] ^ b[i];
}
return diff === 0;
```

### 2. PrivateKey Hex Encoding May Leak Timing

**Location**: [PrivateKey/Hex.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/PrivateKey/Hex.ts#L54-L61)

The `_toHex.call(pk)` delegates to voltaire's implementation - verify that it uses constant-time hex encoding.

### 3. Random Key Generation ✅ GOOD

**Location**: [PrivateKey/random.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/PrivateKey/random.ts#L23-L26)

Uses `crypto.getRandomValues()` which is cryptographically secure.

---

## Format Handling

### Signature Formats ✅ Comprehensive

| Schema | Input | Output | Status |
|--------|-------|--------|--------|
| `Hex` | hex string | SignatureType | ✅ |
| `Bytes` | Uint8Array (64/65) | SignatureType | ✅ |
| `Compact` | EIP-2098 bytes | SignatureType | ✅ |
| `DER` | DER-encoded | SignatureType | ✅ |
| `Rpc` | `{r, s, yParity?, v?}` | SignatureType | ✅ |
| `Tuple` | `[yParity, r, s]` | SignatureType | ✅ |

### PublicKey Formats ✅ Good

| Schema | Input | Output | Status |
|--------|-------|--------|--------|
| `Hex` | hex string | PublicKeyType | ✅ |
| `Bytes` | Uint8Array (33/64) | PublicKeyType | ✅ |
| `Compressed` | compressed hex | PublicKeyType | ✅ |

### DER Schema Hardcodes Algorithm ⚠️

**Location**: [Signature/DER.ts:67](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/Signature/DER.ts#L67)

```typescript
return ParseResult.succeed(Signature.fromDER(bytes, "secp256k1"));  // Hardcoded!
```

**Problem**: Always assumes secp256k1, ignoring p256 DER signatures.

**Fix**: Consider a parameterized schema or separate `DERSecp256k1` / `DERP256` schemas.

---

## Validation Issues

### 1. Missing toHex Export in Signature ⚠️

**Location**: [Signature/index.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/Signature/index.ts#L51-L55)

Docs reference `Signature.toHex(sig)` but only `toBytes` and `toCompact` are exported. Missing:
- `toHex` (documented but not exported)

### 2. Missing Exports in PublicKey ⚠️

**Location**: [PublicKey/index.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/PublicKey/index.ts#L62-L66)

Files exist but aren't exported:
- `verify.ts` - Not exported (file exists)
- `toAddress.ts` - Not exported (file exists)
- `equals.ts` - Not exported (file exists)
- `toBytes.ts` - Not exported (file exists)

Docs reference these as available but they're not in the public API.

### 3. Missing Exports in PrivateKey ⚠️

**Location**: [PrivateKey/index.ts](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/PrivateKey/index.ts#L59-L62)

Docs reference but not implemented/exported:
- `toPublicKey` - Documented but missing implementation
- `toAddress` - Documented but missing implementation
- `sign` - Documented but missing implementation

---

## Effect Patterns

### Consistent Schema Pattern ✅

All schemas follow the same pattern:
```typescript
S.transformOrFail(InputSchema, TypeSchema, { decode, encode })
```

### Duplicated SignatureTypeSchema ⚠️

**Location**: Every Signature schema file

The same `SignatureTypeSchema` is duplicated 6 times:
- [Bytes.ts:19-31](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/Signature/Bytes.ts#L19-L31)
- [Compact.ts:19-31](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/Signature/Compact.ts#L19-L31)
- [DER.ts:19-31](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/Signature/DER.ts#L19-L31)
- [Hex.ts:19-31](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/Signature/Hex.ts#L19-L31)
- [Rpc.ts:19-31](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/Signature/Rpc.ts#L19-L31)
- [Tuple.ts:19-31](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/Signature/Tuple.ts#L19-L31)

**Fix**: Extract to shared `SignatureTypeSchema.ts`.

### Inconsistent Effect Wrapping ⚠️

Some functions return pure values, others return `Effect.Effect`:
- `PublicKey.equals` → `Effect<boolean>` (unnecessary - always succeeds)
- `PublicKey.toAddress` → `Effect<AddressType>` (unnecessary - pure function)
- `Signature.equals` → `boolean` (correct - pure)

**Recommendation**: Pure functions should return direct values, Effects only for fallible operations.

---

## Test Coverage ❌ CRITICAL

### No Tests Exist

No test files found for:
- `src/primitives/Signature/*.test.ts` - **0 tests**
- `src/primitives/PublicKey/*.test.ts` - **0 tests**
- `src/primitives/PrivateKey/*.test.ts` - **0 tests**

### Known Issue from Review 070

Missing tests identified in [070-add-missing-signature-tests.md](file:///Users/williamcory/voltaire/voltaire-effect/reviews/070-add-missing-signature-tests.md):
- EIP-2930/1559 yParity handling
- Large chainId values
- Invalid signature rejection (r=0, s=0, >= curve order)
- EIP-2098 compact roundtrip

---

## Code Quality

### Ed25519 verify Not Implemented

**Location**: Underlying voltaire [Signature/verify.js:41-49](file:///Users/williamcory/voltaire/src/primitives/Signature/verify.js#L41-L49)

```javascript
if (algorithm === "ed25519") {
  throw new InvalidAlgorithmError("Ed25519 signature verification not yet implemented", ...);
}
```

The algorithm enum allows "ed25519" but verify throws. This is a gap in the underlying implementation.

### bytesToHex Utility Duplication

**Location**: [PublicKey/Compressed.ts:40-44](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/PublicKey/Compressed.ts#L40-L44)

Local `bytesToHex` function should use shared utility.

---

## Action Items

### P0 - Critical
- [ ] Add comprehensive test suite (Signature, PublicKey, PrivateKey)
- [ ] Add missing exports (verify, toAddress, equals, toBytes in PublicKey)
- [ ] Implement missing PrivateKey functions (toPublicKey, toAddress, sign)

### P1 - Security
- [ ] Implement constant-time comparison in PublicKey.equals
- [ ] Verify voltaire Signature.equals uses constant-time comparison

### P2 - Code Quality
- [ ] Extract shared SignatureTypeSchema
- [ ] Extract shared PublicKeyTypeSchema
- [ ] Fix DER schema algorithm hardcoding
- [ ] Add missing Signature.toHex export
- [ ] Standardize Effect wrapping (pure vs Effect)
- [ ] Remove bytesToHex duplication

### P3 - Documentation
- [ ] Update index.ts docs to match actual exports
- [ ] Document Ed25519 verification limitation

---

## Acceptance Criteria

- [ ] All schemas roundtrip correctly (decode → encode → decode)
- [ ] Security-sensitive comparisons use constant-time
- [ ] 100% test coverage for schema transformations
- [ ] All documented functions are exported
- [ ] No duplicated schema definitions
