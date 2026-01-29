---
"voltaire-effect": patch
---

Use pre-computed typed examples in schema annotations

Before:
```typescript
export const Hex = S.transformOrFail(/* ... */).annotations({
  examples: [
    "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
    "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  ],
})
```

After:
```typescript
const EXAMPLE_ADDRESSES: readonly [AddressType, AddressType] = [
  Address("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"),
  Address("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"),
] as const;

export const Hex = S.transformOrFail(/* ... */).annotations({
  examples: EXAMPLE_ADDRESSES,
})
```

Ensures schema examples match the actual decoded types.

Commit: 61fa44f6e
