# includesAddress.js

Check if address exists in access list.

## Signature

```typescript
function includesAddress(list: BrandedAccessList, address: BrandedAddress): boolean
```

## Parameters

- `list` - Access list to search
- `address` - Address to find

## Returns

`boolean` - True if address is in list

## Example

```typescript
const hasToken = AccessList.includesAddress(list, tokenAddress);

if (!hasToken) {
  list = list.withAddress(tokenAddress);
}
```

## Complexity

O(n) - byte-by-byte comparison

## See Also

- [includesStorageKey](./includesStorageKey.js.md) - Check storage key
- [keysFor](./keysFor.js.md) - Get all keys for address
