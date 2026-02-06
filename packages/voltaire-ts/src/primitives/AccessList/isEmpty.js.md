---
title: "isEmpty.js"
---

# isEmpty.js

Check if access list is empty.

## Signature

```typescript
function isEmpty(list: BrandedAccessList): boolean
```

## Parameters

- `list` - Access list to check

## Returns

`boolean` - True if list has no items

## Example

```typescript
if (AccessList.isEmpty(list)) {
  console.log('No access list entries');
  // Skip access list in transaction
  tx.accessList = undefined;
}
```

## Behavior

- Checks only top-level array length
- Does not check if items have storage keys
- O(1) operation

## See Also

- [addressCount](./addressCount.js.md) - Count addresses
- [storageKeyCount](./storageKeyCount.js.md) - Count keys
