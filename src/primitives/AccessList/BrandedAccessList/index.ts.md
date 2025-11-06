---
title: "BrandedAccessList Module"
---

# BrandedAccessList Module

## Exports

### Types
- `BrandedAccessList` - Branded access list type
- `Item` - Access list item type

### Constructors
- `from(value: readonly Item[] | Uint8Array): BrandedAccessList` - Universal constructor
- `fromBytes(bytes: Uint8Array): BrandedAccessList` - From RLP bytes
- `create(): BrandedAccessList` - Empty list

### Type Guards
- `is(value: unknown): value is BrandedAccessList` - Type guard
- `isItem(value: unknown): value is Item` - Item type guard
- `assertValid(list: unknown): asserts list is BrandedAccessList` - Validate with throws

### Queries
- `includesAddress(list: BrandedAccessList, address: BrandedAddress): boolean`
- `includesStorageKey(list: BrandedAccessList, address: BrandedAddress, key: BrandedHash): boolean`
- `keysFor(list: BrandedAccessList, address: BrandedAddress): readonly BrandedHash[] | undefined`
- `addressCount(list: BrandedAccessList): number`
- `storageKeyCount(list: BrandedAccessList): number`
- `isEmpty(list: BrandedAccessList): boolean`

### Manipulation
- `withAddress(list: BrandedAccessList, address: BrandedAddress): BrandedAccessList`
- `withStorageKey(list: BrandedAccessList, address: BrandedAddress, key: BrandedHash): BrandedAccessList`
- `deduplicate(list: BrandedAccessList): BrandedAccessList`
- `merge(...lists: readonly BrandedAccessList[]): BrandedAccessList`

### Gas Analysis
- `gasCost(list: BrandedAccessList): bigint`
- `gasSavings(list: BrandedAccessList): bigint`
- `hasSavings(list: BrandedAccessList): boolean`

### Conversions
- `toBytes(list: BrandedAccessList): Uint8Array`

### Constants
- `ADDRESS_COST: 2400n`
- `STORAGE_KEY_COST: 1900n`
- `COLD_ACCOUNT_ACCESS_COST: 2600n`
- `COLD_STORAGE_ACCESS_COST: 2100n`
- `WARM_STORAGE_ACCESS_COST: 100n`

## Namespace Pattern

All methods exported individually and as `BrandedAccessList` namespace:

```typescript
BrandedAccessList.from(items)  // namespace usage
from(items)                    // direct import
```

Tree-shakable: unused methods eliminated by bundler.
