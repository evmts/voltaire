---
title: "includesStorageKey.js"
---

# includesStorageKey.js

Check if storage key exists for address in access list.

## Signature

```typescript
function includesStorageKey(
  list: BrandedAccessList,
  address: BrandedAddress,
  key: BrandedHash
): boolean
```

## Parameters

- `list` - Access list to search
- `address` - Address to check
- `key` - Storage key to find

## Returns

`boolean` - True if key exists for address

## Example

```typescript
const hasBalance = AccessList.includesStorageKey(
  list,
  tokenAddress,
  balanceSlot
);

if (!hasBalance) {
  list = list.withStorageKey(tokenAddress, balanceSlot);
}
```

## Behavior

- Returns false if address not in list
- Returns false if address has no storage keys
- O(n×m) complexity

## See Also

- [includesAddress](./includesAddress.js.md) - Check address only
- [keysFor](./keysFor.js.md) - Get all keys for address
