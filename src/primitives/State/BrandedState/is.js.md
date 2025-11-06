---
title: "is.js"
---

# is.js

Type guard to check if value is valid StorageKey.

## Signature

```typescript
function is(value: unknown): value is BrandedStorageKey
```

## Parameters

- `value` - Value to check

## Returns

`boolean` - True if value is valid BrandedStorageKey

## Validation

Checks that value:
- Is an object (not null)
- Has `address` field as Uint8Array with length 20
- Has `slot` field as bigint

## Example

```typescript
if (StorageKey.is(value)) {
  // TypeScript knows value is BrandedStorageKey
  console.log(`Slot: ${value.slot}`);
}

// Valid keys
StorageKey.is({ address: addr, slot: 0n }); // true
StorageKey.is(StorageKey.create(addr, 42n)); // true

// Invalid inputs
StorageKey.is({ address: addr }); // false - missing slot
StorageKey.is({ slot: 0n }); // false - missing address
StorageKey.is(null); // false
StorageKey.is("string"); // false
StorageKey.is({ address: "wrong", slot: 0n }); // false
```

## See Also

- [from](./from.js.md) - Create StorageKey from value
- [create](./create.js.md) - Create from address and slot
