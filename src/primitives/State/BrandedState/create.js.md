---
title: "create.js"
---

# create.js

Create a new StorageKey from address and slot.

## Signature

```typescript
function create(address: BrandedAddress, slot: bigint): BrandedStorageKey
```

## Parameters

- `address` - 20-byte contract address
- `slot` - 256-bit storage slot number

## Returns

`BrandedStorageKey` - New storage key

## Example

```typescript
const key = StorageKey.create(contractAddr, 0n);

// Multiple slots for same contract
const balanceSlot = StorageKey.create(token, 0n);
const totalSupplySlot = StorageKey.create(token, 1n);
const ownerSlot = StorageKey.create(token, 2n);

// Maximum slot value
const maxSlot = (2n ** 256n) - 1n;
const maxKey = StorageKey.create(addr, maxSlot);
```

## See Also

- [from](./from.js.md) - Create from StorageKeyLike object
- [toString](./toString.js.md) - Convert to string
