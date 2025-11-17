---
title: "gasSavings.js"
---

# gasSavings.js

Calculate potential gas savings from using access list.

## Signature

```typescript
function gasSavings(list: BrandedAccessList): bigint
```

## Parameters

- `list` - Access list to calculate savings for

## Returns

`bigint` - Maximum potential savings in wei

## Formula

```
addressSavings = addresses × (2600 - 2400) = addresses × 200
keySavings = keys × (2100 - 1900) = keys × 200
totalSavings = addressSavings + keySavings
```

## Example

```typescript
const list = AccessList.from([
  { address: addr1, storageKeys: [key1, key2] },
  { address: addr2, storageKeys: [] }
]);

const savings = AccessList.gasSavings(list);
// (2 × 200) + (2 × 200) = 400 + 400 = 800 gas
```

## Important

- Only realized if transaction actually accesses those slots
- Assumes single access per slot
- Multiple accesses to same slot increase savings

## See Also

- [gasCost](./gasCost.js.md) - Calculate cost
- [hasSavings](./hasSavings.js.md) - Check if beneficial
- [constants](./constants.js.md) - Gas cost constants
