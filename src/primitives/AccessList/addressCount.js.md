---
title: "addressCount.js"
---

# addressCount.js

Count total addresses in access list.

## Signature

```typescript
function addressCount(list: BrandedAccessList): number
```

## Parameters

- `list` - Access list to count

## Returns

`number` - Number of addresses

## Example

```typescript
const count = AccessList.addressCount(list);
console.log(`Accessing ${count} contracts`);

if (count > 10) {
  console.warn('Large access list may not be beneficial');
}
```

## Behavior

- Counts all addresses, including duplicates
- O(1) operation (array length)

## See Also

- [storageKeyCount](./storageKeyCount.js.md) - Count storage keys
- [isEmpty](./isEmpty.js.md) - Check if empty
