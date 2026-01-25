# Review 082: ABI Encoding/Decoding Primitives

## Summary

Comprehensive review of voltaire-effect ABI module. Consistent Effect wrapping pattern, good error type definitions. Several issues with error type completeness, missing validation, and null handling.

## Files Reviewed

- `src/primitives/Abi/index.ts`
- `src/primitives/Abi/encodeFunctionData.ts`
- `src/primitives/Abi/decodeFunctionData.ts`
- `src/primitives/Abi/decodeFunctionResult.ts`
- `src/primitives/Abi/encodeEventLog.ts`
- `src/primitives/Abi/decodeEventLog.ts`
- `src/primitives/Abi/encodeError.ts`
- `src/primitives/Abi/decodeError.ts`
- `src/primitives/Abi/parseItem.ts`
- `src/primitives/Abi/parse.ts`
- `src/primitives/Abi/decodeFunction.ts`

---

## Issue 1: decodeFunction Missing AbiDecodingError (Confirmed)

**Severity**: Medium  
**Status**: Confirmed (review 060)  
**Location**: `decodeFunction.ts#L52-58`

```typescript
): Effect.Effect<
  { name: string; params: readonly unknown[] },
  AbiItemNotFoundError | AbiInvalidSelectorError  // Missing AbiDecodingError
> =>
  Effect.try({
    try: () => _decodeFunction(abi, data),
    catch: (e) => e as AbiItemNotFoundError | AbiInvalidSelectorError,
  });
```

**Problem**: `_decodeFunction` can throw `AbiDecodingError` when params malformed. Type assertion hides this.

**Fix**: Add `AbiDecodingError` to error union:
```typescript
import { type AbiDecodingError } from "@tevm/voltaire/Abi";

): Effect.Effect<
  { name: string; params: readonly unknown[] },
  AbiItemNotFoundError | AbiInvalidSelectorError | AbiDecodingError
>
```

---

## Issue 2: parseItem No Schema Validation (Confirmed)

**Severity**: Medium  
**Status**: Confirmed (review 061)  
**Location**: `parseItem.ts#L56-62`

```typescript
Effect.try({
  try: () => JSON.parse(jsonString) as Item.ItemType,  // Unchecked cast
  catch: (e) => new AbiItemParseError(...),
});
```

**Problem**: Any valid JSON passes. `{"foo":1}` accepted as valid ABI item.

**Fix**: Add structural validation:
```typescript
export const parseItem = (
  jsonString: string,
): Effect.Effect<Item.ItemType, AbiItemParseError> =>
  Effect.try({
    try: () => {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('ABI item must be an object');
      }
      if (!('type' in parsed) || typeof parsed.type !== 'string') {
        throw new Error('ABI item must have a "type" property');
      }
      const validTypes = ['function', 'event', 'error', 'constructor', 'fallback', 'receive'];
      if (!validTypes.includes(parsed.type)) {
        throw new Error(`Invalid ABI item type: ${parsed.type}`);
      }
      return parsed as Item.ItemType;
    },
    catch: (e) => new AbiItemParseError(...),
  });
```

---

## Issue 3: encodeEventLog Null Topic Handling (Confirmed)

**Severity**: Medium  
**Status**: Confirmed (review 062)  
**Location**: `encodeEventLog.ts#L79-81`

```typescript
return topics.map((t) =>
  t ? Hex.fromBytes(t as Uint8Array) : ("0x" as HexType),  // Wrong!
);
```

**Problem**: `"0x"` is valid topic (empty bytes). `null` means "match any" in Ethereum log filters.

**Fix**:
```typescript
): Effect.Effect<readonly (HexType | null)[], AbiItemNotFoundError | AbiEncodingError> =>
  Effect.try({
    try: () => {
      // ...
      return topics.map((t) =>
        t ? Hex.fromBytes(t as Uint8Array) : null
      );
    },
    // ...
  });
```

---

## Issue 4: decodeEventLog Missing AbiDecodingError

**Severity**: Medium  
**Status**: New  
**Location**: `decodeEventLog.ts#L130-137`

```typescript
): Effect.Effect<
  { event: string; params: Record<string, unknown> },
  AbiItemNotFoundError  // Missing AbiDecodingError
>
```

**Problem**: `decodeLog` can throw `AbiDecodingError` when log data malformed. Same pattern as decodeFunction.

**Fix**: Add `AbiDecodingError` to error union:
```typescript
import { type AbiDecodingError, type AbiItemNotFoundError, decodeLog } from "@tevm/voltaire/Abi";

): Effect.Effect<
  { event: string; params: Record<string, unknown> },
  AbiItemNotFoundError | AbiDecodingError
>
```

---

## Issue 5: parse() No Structural Validation

**Severity**: Medium  
**Status**: New  
**Location**: `parse.ts#L56-62`

```typescript
Effect.try({
  try: () => Abi(JSON.parse(jsonString)),  // Abi() may not validate
  catch: (e) => new AbiParseError(...),
});
```

**Problem**: Depends on `Abi()` for validation. If `Abi()` doesn't throw on malformed input, invalid data passes.

**Recommendation**: Verify `Abi()` throws on invalid input, or add explicit array validation:
```typescript
const parsed = JSON.parse(jsonString);
if (!Array.isArray(parsed)) {
  throw new Error('ABI must be an array');
}
```

---

## Issue 6: Inconsistent Error Casting Pattern

**Severity**: Low  
**Status**: New  
**Location**: Multiple files

Some files cast `catch` errors properly, others use unsafe `as`:

**Good** (encodeFunctionData.ts):
```typescript
catch: (e) => e as AbiItemNotFoundError | AbiEncodingError,
```

**Better pattern** (if voltaire can throw unexpected errors):
```typescript
catch: (e) => {
  if (e instanceof AbiItemNotFoundError) return e;
  if (e instanceof AbiEncodingError) return e;
  return new AbiEncodingError(`Unexpected error: ${e}`, { cause: e });
}
```

**Affected files**:
- `encodeFunctionData.ts`
- `decodeFunctionData.ts`
- `decodeFunction.ts`
- `decodeFunctionResult.ts`
- `encodeError.ts`
- `decodeError.ts`
- `encodeEventLog.ts`
- `decodeEventLog.ts`

---

## Issue 7: No Test Coverage

**Severity**: High  
**Status**: Existing (review 071)  
**Location**: N/A

No `*.test.ts` files found in `src/primitives/Abi/`. All encoding/decoding functions lack tests.

**Required tests**:
- Happy path for all encode/decode functions
- Error cases (missing ABI item, invalid data)
- Edge cases: empty arrays, nested tuples, bytes/string types
- Null topic handling for events
- Invalid JSON for parse/parseItem

---

## Issue 8: decodeFunctionResult Manual Lookup

**Severity**: Low  
**Status**: New  
**Location**: `decodeFunctionResult.ts#L130-143`

```typescript
const fn = abi.find(
  (item) => item.type === "function" && item.name === functionName,
);
if (!fn) {
  throw new AbiItemNotFoundError(...);
}
return AbiFunction.decodeResult(fn as AbiFunction.FunctionType, bytes);
```

**Problem**: Manual lookup duplicates logic likely in voltaire. Could miss overloaded functions.

**Recommendation**: Use voltaire's `getFunction` if available, or document that first matching function is used.

---

## Issue 9: encodeError Missing Selector Prefix

**Severity**: Low (verify behavior)  
**Status**: New  
**Location**: `encodeError.ts#L75-79`

```typescript
const encoded = AbiError.encodeParams(
  err as AbiError.ErrorType,
  args as never,
);
return Hex.fromBytes(encoded);
```

**Concern**: Unclear if `encodeParams` includes 4-byte selector or just params. Docstring says "4-byte selector prefix" but implementation doesn't add it explicitly.

**Action**: Verify `AbiError.encodeParams` returns selector+params, not just params.

---

## Positive Observations

1. **Consistent Effect.try pattern** - All functions use same wrapping approach
2. **Good type inference** - Uses `Parameters<typeof fn>` for ABI input types
3. **Proper error classes** - Custom errors extend AbstractError with `_tag`
4. **Comprehensive JSDoc** - Excellent documentation with examples
5. **Clean module exports** - `index.ts` has organized exports with comments

---

## Summary Table

| Issue | Severity | Status | Fix Effort |
|-------|----------|--------|------------|
| decodeFunction missing error type | Medium | Review 060 | 5 min |
| parseItem no validation | Medium | Review 061 | 15 min |
| encodeEventLog null topics | Medium | Review 062 | 10 min |
| decodeEventLog missing error type | Medium | New | 5 min |
| parse() no array validation | Medium | New | 5 min |
| Inconsistent error casting | Low | New | 30 min |
| No test coverage | High | Review 071 | 2 hrs |
| decodeFunctionResult manual lookup | Low | New | 15 min |
| encodeError selector unclear | Low | New | Verify |

---

## Recommended Priority

1. **High**: Add test coverage (blocks validation of fixes)
2. **Medium**: Fix missing error types (060, 062 + new decodeEventLog)
3. **Medium**: Add parseItem validation (061)
4. **Medium**: Fix null topic handling (062)
5. **Low**: Improve error casting pattern
