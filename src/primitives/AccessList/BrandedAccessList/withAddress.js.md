# withAddress.js

Add address to access list if not already present.

## Signature

```typescript
function withAddress(
  list: BrandedAccessList,
  address: BrandedAddress
): BrandedAccessList
```

## Parameters

- `list` - Original access list
- `address` - Address to add

## Returns

`BrandedAccessList` - New access list with address added

## Example

```typescript
let list = AccessList.create();
list = AccessList.withAddress(list, routerAddress);
list = AccessList.withAddress(list, tokenAddress);
```

## Behavior

- Returns new list (immutable)
- No-op if address already exists
- Adds with empty storageKeys array
- O(n) operation

## See Also

- [withStorageKey](./withStorageKey.js.md) - Add storage key
- [includesAddress](./includesAddress.js.md) - Check if exists
