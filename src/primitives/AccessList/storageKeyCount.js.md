---
title: "storageKeyCount.js"
---

# storageKeyCount.js

Count total storage keys across all addresses.

## Signature

```typescript
function storageKeyCount(list: BrandedAccessList): number
```

## Parameters

- `list` - Access list to count

## Returns

`number` - Total number of storage keys

## Example

```typescript
const keyCount = AccessList.storageKeyCount(list);
console.log(`Accessing ${keyCount} storage slots`);

const avgKeys = keyCount / list.addressCount();
console.log(`Average ${avgKeys} keys per address`);
```

## Behavior

- Sums all keys across all addresses
- Includes duplicates
- O(n) operation

## See Also

- [addressCount](./addressCount.js.md) - Count addresses
- [isEmpty](./isEmpty.js.md) - Check if empty
