---
title: "hasSavings.js"
---

# hasSavings.js

Check if access list provides net gas savings.

## Signature

```typescript
function hasSavings(list: BrandedAccessList): boolean
```

## Parameters

- `list` - Access list to check

## Returns

`boolean` - True if savings > cost

## Formula

```
hasSavings = gasSavings(list) > gasCost(list)
```

## Example

```typescript
const list = buildAccessList();

if (AccessList.hasSavings(list)) {
  // Include in transaction
  tx.accessList = list;
} else {
  // Skip access list
  tx.accessList = [];
}
```

## Behavior

- Simple benefit check
- Does not account for usage patterns
- Conservative estimate (single access)

## See Also

- [gasCost](./gasCost.js.md) - Calculate cost
- [gasSavings](./gasSavings.js.md) - Calculate savings
