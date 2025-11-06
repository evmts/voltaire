---
title: "from.js"
---

# from.js

Universal constructor for AccessList from items array or RLP bytes.

## Signature

```typescript
function from(value: readonly Item[] | Uint8Array): BrandedAccessList
```

## Parameters

- `value` - Item array or RLP-encoded bytes

## Returns

`BrandedAccessList` - Access list instance

## Example

```typescript
// From items
const list = AccessList.from([
  { address: addr1, storageKeys: [key1, key2] },
  { address: addr2, storageKeys: [] }
]);

// From RLP bytes
const list2 = AccessList.from(bytes);
```

## Behavior

- Delegates to `fromBytes` for Uint8Array input
- Returns items array directly for Item[] input
- No validation performed (use `assertValid` if needed)

## See Also

- [fromBytes](./fromBytes.js.md) - Decode from RLP bytes
- [create](./create.js.md) - Create empty list
