---
title: "equals.js"
---

# equals.js

Check equality between two storage keys.

## Signature

```typescript
function equals(a: StorageKeyLike, b: StorageKeyLike): boolean
```

## Parameters

- `a` - First storage key
- `b` - Second storage key

## Returns

`boolean` - True if both address and slot match exactly

## Comparison

Two keys are equal if:
1. Slot numbers match (bigint equality)
2. All 20 address bytes match

**Performance:** O(20) - compares all address bytes

## Example

```typescript
const key1 = { address: addr, slot: 42n };
const key2 = { address: addr, slot: 42n };
const key3 = { address: addr, slot: 43n };
const key4 = { address: otherAddr, slot: 42n };

StorageKey.equals(key1, key2); // true - same address and slot
StorageKey.equals(key1, key3); // false - different slots
StorageKey.equals(key1, key4); // false - different addresses

// Use in conditional logic
if (StorageKey.equals(currentKey, targetKey)) {
  console.log("Storage location matches");
}

// Map lookup alternative
const keyStr = StorageKey.toString(key);
if (storage.has(keyStr)) {
  // Key exists in map
}
```

## See Also

- [toString](./toString.js.md) - Convert to string for Map keys
- [hashCode](./hashCode.js.md) - Compute hash code
