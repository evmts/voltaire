# fromString.js

Parse StorageKey from its string representation.

## Signature

```typescript
function fromString(str: string): BrandedStorageKey | undefined
```

## Parameters

- `str` - String from `toString()` in format `{address_hex}_{slot_hex}`

## Returns

`BrandedStorageKey | undefined` - Parsed key, or undefined if invalid

## Validation

Returns undefined if:
- Wrong format (no underscore separator)
- Wrong length (not 40 + 1 + 64 chars)
- Invalid hex characters
- Parse error

## Example

```typescript
const key = StorageKey.create(addr, 42n);
const str = StorageKey.toString(key);

// Round-trip conversion
const parsed = StorageKey.fromString(str);
if (parsed) {
  StorageKey.equals(key, parsed); // true
}

// Handle invalid strings
const invalid = StorageKey.fromString("not_a_key");
if (invalid === undefined) {
  console.log("Invalid key string");
}

// Reconstruct from stored string
const stored = storage.keys();
for (const keyStr of stored) {
  const key = StorageKey.fromString(keyStr);
  if (key) {
    console.log(`Address: ${key.address}, Slot: ${key.slot}`);
  }
}
```

## Invalid Inputs

```typescript
StorageKey.fromString("invalid"); // undefined
StorageKey.fromString("no_separator"); // undefined
StorageKey.fromString("abc_def"); // undefined - wrong length
StorageKey.fromString(""); // undefined
StorageKey.fromString("0x123_456"); // undefined - has 0x prefix
```

## See Also

- [toString](./toString.js.md) - Convert to string
- [is](./is.js.md) - Validate StorageKey
