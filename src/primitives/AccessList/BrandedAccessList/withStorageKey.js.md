---
title: "withStorageKey.js"
---

# withStorageKey.js

Add storage key for address (adds address if needed).

## Signature

```typescript
function withStorageKey(
  list: BrandedAccessList,
  address: BrandedAddress,
  key: BrandedHash
): BrandedAccessList
```

## Parameters

- `list` - Original access list
- `address` - Address to add key for
- `key` - Storage key to add

## Returns

`BrandedAccessList` - New access list with key added

## Example

```typescript
let list = AccessList.create();
list = AccessList.withStorageKey(list, tokenAddress, balanceSlot);
list = AccessList.withStorageKey(list, tokenAddress, allowanceSlot);
```

## Behavior

- Returns new list (immutable)
- Adds address if not present
- No-op if key already exists for address
- O(n×m) operation

## See Also

- [withAddress](./withAddress.js.md) - Add address only
- [includesStorageKey](./includesStorageKey.js.md) - Check if exists
