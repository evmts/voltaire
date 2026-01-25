# Fix Abi decodeFunction Missing Error Type

## Problem

`decodeFunction` return type is missing `AbiDecodingError` in its error union.

**Location**: `src/primitives/Abi/decodeFunction.ts#L52-55`

```typescript
export const decodeFunction = (
  abi: Abi,
  data: Hex,
): Effect.Effect<
  { name: string; params: readonly unknown[] },
  AbiItemNotFoundError | AbiInvalidSelectorError  // Missing AbiDecodingError!
>
```

## Why This Matters

- Type lies about possible errors
- Callers don't handle decoding errors
- `_decodeFunction` can throw `AbiDecodingError` when params malformed
- Runtime surprises

## Solution

Add `AbiDecodingError` to return type:

```typescript
export const decodeFunction = (
  abi: Abi,
  data: Hex,
): Effect.Effect<
  { name: string; params: readonly unknown[] },
  AbiItemNotFoundError | AbiInvalidSelectorError | AbiDecodingError
> =>
  Effect.try({
    try: () => _decodeFunction(abi, data),
    catch: (e) => {
      if (e instanceof AbiItemNotFoundError) return e;
      if (e instanceof AbiInvalidSelectorError) return e;
      if (e instanceof AbiDecodingError) return e;
      return new AbiDecodingError({
        message: `Failed to decode function: ${e}`,
        cause: e,
      });
    },
  });
```

## Acceptance Criteria

- [ ] Add `AbiDecodingError` to return type
- [ ] Update error handling in catch
- [ ] All existing tests pass
- [ ] Add test for malformed params

## Priority

**Medium** - Type safety
