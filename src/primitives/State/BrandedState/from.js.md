---
title: "from.js"
---

# from.js

Universal constructor for StorageKey from StorageKeyLike input.

## Signature

```typescript
function from(value: StorageKeyLike): BrandedStorageKey
```

## Parameters

- `value` - StorageKeyLike object with address and slot

## Returns

`BrandedStorageKey` - Composite key with address and slot

## Example

```typescript
const key = StorageKey.from({ address: addr, slot: 0n });

// Already a StorageKey
const key2 = StorageKey.from(key);

// From any compatible object
const obj = { address: contractAddr, slot: 42n };
const key3 = StorageKey.from(obj);
```

## See Also

- [create](./create.js.md) - Create StorageKey from address and slot
- [is](./is.js.md) - Validate StorageKey
