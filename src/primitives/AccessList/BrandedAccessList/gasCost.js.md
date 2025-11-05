# gasCost.js

Calculate total gas cost for including access list in transaction.

## Signature

```typescript
function gasCost(list: BrandedAccessList): bigint
```

## Parameters

- `list` - Access list to calculate cost for

## Returns

`bigint` - Total gas cost in wei

## Formula

```
cost = (addresses × 2400) + (storageKeys × 1900)
```

## Example

```typescript
const list = AccessList.from([
  { address: addr1, storageKeys: [key1, key2] },
  { address: addr2, storageKeys: [key3] }
]);

const cost = AccessList.gasCost(list);
// (2 × 2400) + (3 × 1900) = 4800 + 5700 = 10,500 gas
```

## Constants

- `ADDRESS_COST = 2400n` - Per address
- `STORAGE_KEY_COST = 1900n` - Per storage key

## See Also

- [gasSavings](./gasSavings.js.md) - Calculate savings
- [hasSavings](./hasSavings.js.md) - Check if beneficial
- [constants](./constants.js.md) - Gas cost constants
