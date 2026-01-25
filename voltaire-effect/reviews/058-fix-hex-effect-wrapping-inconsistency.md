# Fix Hex/Address Effect Wrapping Inconsistency

## Problem

Hex module wraps infallible operations in Effect, while Address module returns values directly. This is inconsistent.

**Location**: Various files in `src/primitives/Hex/` and `src/primitives/Address/`

```typescript
// Hex - wraps in Effect even when infallible
export const clone = (hex: HexType): Effect.Effect<HexType> =>
  Effect.succeed(hex.slice() as HexType);

// Address - returns directly
export const clone = (address: AddressType): AddressType =>
  address.slice() as AddressType;
```

## Why This Matters

- Inconsistent API across primitives
- Users must learn per-module patterns
- Unnecessary Effect wrapping adds overhead
- Makes composition harder

## Solution

Standardize approach - prefer direct returns for infallible operations:

```typescript
// Infallible operations return directly:
export const clone = (hex: HexType): HexType => hex.slice() as HexType;
export const equals = (a: HexType, b: HexType): boolean => /* ... */;
export const size = (hex: HexType): number => /* ... */;

// Only fallible operations return Effect:
export const fromString = (str: string): Effect.Effect<HexType, HexParseError> =>
  Effect.try({
    try: () => parseHex(str),
    catch: (e) => new HexParseError({ input: str, cause: e }),
  });
```

Guidelines:
- **Direct return**: clone, equals, size, toBytes (when input is validated)
- **Effect return**: parsing from strings, validation, operations that can fail

## Acceptance Criteria

- [ ] Document which operations are Effect-wrapped vs direct
- [ ] Make pattern consistent across all primitives
- [ ] Prefer direct return for infallible operations
- [ ] Update any affected callers
- [ ] All existing tests pass

## Priority

**Low** - API consistency
