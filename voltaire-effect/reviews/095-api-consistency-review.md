# API Consistency Review - voltaire-effect Primitives

**Date**: 2026-01-25
**Modules Reviewed**: Address, Hex, Bytes, Hash, Signature, Uint

---

## Summary

| Category | Status | Issues |
|----------|--------|--------|
| Naming Conventions | ⚠️ Mixed | Inconsistent function naming patterns |
| Return Types | ❌ Inconsistent | Mixed Effect vs plain returns for same operation types |
| Schema Naming | ✅ Consistent | All use descriptive names (Hex, Bytes, String, etc.) |
| Export Patterns | ✅ Consistent | All use namespace exports |
| Error Types | ⚠️ Unknown | Not visible from index files |
| JSDoc Quality | ✅ Good | All modules have comprehensive JSDoc |

---

## 1. Naming Conventions

### Inconsistencies Found

| Pattern | Address | Hex | Bytes | Hash | Signature | Uint |
|---------|---------|-----|-------|------|-----------|------|
| `isValid` | ✅ `isValid` | ❌ `isHex` | ❌ `isBytes` | ❌ `isValidHex` | ❌ `is`/`isSignature` | ❌ missing |
| `isZero` | ✅ | ❌ missing | ❌ missing | ✅ | ❌ missing | ✅ |
| `equals` | ✅ pure | ⚠️ Effect | ⚠️ Effect | ✅ pure | ✅ pure | ✅ pure |
| `clone` | ✅ | ✅ Effect | ❌ missing | ✅ | ❌ missing | ✅ |
| `random` | ❌ missing | ✅ | ✅ | ✅ | ❌ missing | ❌ missing |

**Issues**:
1. `is*` naming inconsistent: `isValid`, `isHex`, `isBytes`, `isValidHex`, `is`, `isSignature`
2. Signature has redundant `is` and `isSignature` exports
3. Missing common utilities across modules (`random`, `isZero`, `clone`)

### Recommendations
- Standardize on `is{Type}` pattern: `isAddress`, `isHex`, `isBytes`, `isHash`, `isSignature`, `isUint`
- Add `isValid` as alias for type guards
- Remove duplicate `is`/`isSignature` - keep only `isSignature`

---

## 2. Return Types

### Critical Inconsistency

| Module | `equals` Return | `clone` Return |
|--------|-----------------|----------------|
| Address | `boolean` | `AddressType` |
| Hex | `Effect<boolean>` | `Effect<HexType>` |
| Bytes | `Effect<boolean>` | N/A |
| Hash | `boolean` | `HashType` |
| Signature | `boolean` | N/A |
| Uint | `boolean` | `Uint256Type` |

**Problem**: Hex and Bytes return `Effect` for infallible operations. Comparing two typed values should never fail.

**Recommendation**: Pure functions should return plain values. Reserve Effect for:
- Operations requiring services (KeccakService)
- Operations that can fail (parsing, validation)

---

## 3. Schema Naming

✅ **Consistent**: All modules use descriptive schema names:
- `Hex`, `Bytes`, `String`, `Number`, `BigInt`
- `Checksummed`, `Compact`, `DER`, `Rpc`, `Tuple`

No `TypeSchema` pattern used - this is correct.

---

## 4. Export Patterns

✅ **Consistent**: All modules use namespace-style exports suitable for:
```typescript
import * as Address from 'voltaire-effect/primitives/Address'
```

All modules re-export types from `@tevm/voltaire/*`.

---

## 5. Error Types

⚠️ **Not visible from index files**. Need to audit individual function files.

Signature module mentions `InvalidAlgorithmError` in JSDoc but doesn't export it from index.

**Action**: Audit each module's error exports and ensure consistent error type naming.

---

## 6. JSDoc Quality

✅ **Good**: All modules have:
- `@module` tag
- `@description` with usage examples
- Schema tables
- Pure function listings
- `@since 0.1.0`

**Minor issues**:
- Hex JSDoc shows `equals`, `clone` etc. as `Effect<T>` but this seems wrong for pure operations
- Bytes claims `equals`, `concat`, `slice`, `size`, `isBytes` return Effect but only exports `isBytes`, `random`

---

## Action Items

### High Priority
1. **Fix Effect vs pure inconsistency**: Hex/Bytes pure operations should not return Effect
2. **Add missing exports**: Bytes index claims exports not present (`equals`, `concat`, `slice`, `size`)
3. **Standardize `is*` naming**: Pick one pattern and apply everywhere

### Medium Priority
4. **Add missing utilities**: 
   - `random` to Address, Signature, Uint
   - `clone` to Bytes, Signature
   - `isZero` to Hex, Bytes
5. **Remove duplicates**: Signature `is`/`isSignature` → keep one
6. **Export error types**: Ensure all error types are exported from index

### Low Priority
7. **Update JSDoc**: Fix Bytes JSDoc to match actual exports
8. **Verify Hex JSDoc**: Confirm whether pure functions should return Effect

---

## Appendix: Full Export Comparison

| Export | Address | Hex | Bytes | Hash | Signature | Uint |
|--------|---------|-----|-------|------|-----------|------|
| Schemas | Bytes, Checksummed, Hex | Bytes, String | Hex | Bytes, Hex | Hex, Bytes, Compact, DER, Rpc, Tuple | BigInt, Bytes, Hex, Number, String |
| clone | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ |
| equals | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| compare | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| isZero | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ |
| random | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| toBytes | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| toHex | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
