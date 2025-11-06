---
title: "toString.js"
---

# toString.js

Convert StorageKey to string representation for use as Map key.

## Signature

```typescript
function toString(key: StorageKeyLike): string
```

## Parameters

- `key` - Storage key to convert

## Returns

`string` - String representation in format: `{address_hex}_{slot_hex}`

## Format

- Address: 40 hex characters (20 bytes)
- Slot: 64 hex characters (32 bytes, zero-padded)
- Separator: underscore `_`
- No `0x` prefix

**Total length:** 105 characters (40 + 1 + 64)

## Example

```typescript
const key = { address: addr, slot: 42n };
const str = StorageKey.toString(key);
// str = "0101...0101_000000...00002a" (105 chars)

// Use as Map key
const storage = new Map<string, bigint>();
storage.set(str, 1000n);

// Retrieve value
const value = storage.get(str); // 1000n

// Cache string conversion
const keyStr = StorageKey.toString(key);
storage.set(keyStr, value);
console.log(`Set ${keyStr}`);

// Different slots produce different strings
const key0 = { address: addr, slot: 0n };
const key1 = { address: addr, slot: 1n };
StorageKey.toString(key0) !== StorageKey.toString(key1); // true
```

## Use Cases

**Map Keys:**
```typescript
const storage = new Map<string, bigint>();

function get(address, slot) {
  const key = StorageKey.create(address, slot);
  return storage.get(StorageKey.toString(key));
}

function set(address, slot, value) {
  const key = StorageKey.create(address, slot);
  storage.set(StorageKey.toString(key), value);
}
```

**String-Based Storage:**
```typescript
const cache = {};
const keyStr = StorageKey.toString(key);
cache[keyStr] = value;
```

## See Also

- [fromString](./fromString.js.md) - Parse from string
- [equals](./equals.js.md) - Compare keys directly
