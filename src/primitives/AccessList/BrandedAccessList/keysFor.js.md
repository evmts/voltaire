---
title: "keysFor.js"
---

# keysFor.js

Get all storage keys for an address.

## Signature

```typescript
function keysFor(
  list: BrandedAccessList,
  address: BrandedAddress
): readonly BrandedHash[] | undefined
```

## Parameters

- `list` - Access list to search
- `address` - Address to get keys for

## Returns

`readonly BrandedHash[] | undefined` - Array of keys, or undefined if address not in list

## Example

```typescript
const keys = AccessList.keysFor(list, tokenAddress);

if (keys) {
  console.log(`Token has ${keys.length} storage keys`);
  for (const key of keys) {
    console.log(key.toHex());
  }
} else {
  console.log('Token not in access list');
}
```

## Behavior

- Returns undefined if address not found (not empty array)
- Returns readonly reference to internal array
- May return empty array if address has no keys

## See Also

- [includesAddress](./includesAddress.js.md) - Check if address exists
- [includesStorageKey](./includesStorageKey.js.md) - Check specific key
