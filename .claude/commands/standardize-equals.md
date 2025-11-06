# Standardize equals() Method Names

**Priority: HIGH**

Some primitives use `eq()`, others use `equals()`. Standardize to `equals()`.

## Task
Find and rename all `eq()` methods to `equals()` for consistency.

## Steps
1. Search for primitives using `eq()` instead of `equals()`
2. Rename method in implementation files
3. Update method in index.ts exports
4. Update all test files
5. Update documentation if any references exist

## Pattern
```typescript
// Before
export function eq(this: BrandedType, other: BrandedType): boolean { ... }

// After
export function equals(this: BrandedType, other: BrandedType): boolean { ... }
```

## Search
```bash
grep -r "export function eq(" src/primitives/
grep -r "\.eq\(" src/primitives/ # Find usages
```

## Verification
```bash
zig build test-ts
```
