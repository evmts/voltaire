# deduplicate.js

Remove duplicate addresses and storage keys.

## Signature

```typescript
function deduplicate(list: BrandedAccessList): BrandedAccessList
```

## Parameters

- `list` - Access list to deduplicate

## Returns

`BrandedAccessList` - New list with duplicates removed

## Example

```typescript
const list = AccessList.from([
  { address: token, storageKeys: [key1, key2] },
  { address: token, storageKeys: [key2, key3] },  // Duplicate address
  { address: router, storageKeys: [key1] }
]);

const deduped = AccessList.deduplicate(list);
// Result: [
//   { address: token, storageKeys: [key1, key2, key3] },
//   { address: router, storageKeys: [key1] }
// ]
```

## Behavior

- Merges duplicate addresses
- Removes duplicate storage keys within merged addresses
- Preserves original item order (first occurrence)
- O(n²×m) operation (byte-by-byte comparison)

## See Also

- [withAddress](./withAddress.js.md) - Add address
- [merge](./merge.js.md) - Combine multiple lists
