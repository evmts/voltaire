# Fix BrandedEther Implementation

**Priority: CRITICAL**

BrandedEther type exists but missing complete implementation.

## Task
Implement full BrandedEther API following BrandedWei/BrandedGwei pattern.

## Files to Create
Based on `src/primitives/Denomination/BrandedGwei/` structure:

1. `from.ts` - Constructor from various inputs
2. `toHex.ts` - Convert to Hex
3. `toBytes.ts` - Convert to Uint8Array
4. `toU256.ts` - Convert to Uint256
5. `toWei.ts` - Convert to BrandedWei
6. `toGwei.ts` - Convert to BrandedGwei
7. `equals.ts` - Equality check
8. `index.ts` - Dual exports (_internal + wrappers)
9. `from.test.ts` - Constructor tests
10. `toU256.test.ts` - Conversion tests
11. Other conversion tests

## Pattern
```typescript
// Internal method with this: param (*.js files)
export function toWei(this: BrandedEther): BrandedWei { ... }

// Index: dual export
export { toWei as _toWei } from "./toWei.js";
export function toWei(value: EtherInput): BrandedWei {
  return _toWei.call(from(value));
}
```

## Reference
- Copy structure from `src/primitives/Denomination/BrandedGwei/`
- Ether = 10^18 Wei = 10^9 Gwei
- Update `src/primitives/Denomination/index.ts` exports

## Verification
```bash
zig build test-ts -- BrandedEther
```
