# merge.js

Combine multiple access lists with automatic deduplication.

## Signature

```typescript
function merge(...lists: readonly BrandedAccessList[]): BrandedAccessList
```

## Parameters

- `...lists` - Access lists to merge

## Returns

`BrandedAccessList` - New merged and deduplicated access list

## Example

```typescript
const list1 = AccessList.from([
  { address: token1, storageKeys: [key1] }
]);
const list2 = AccessList.from([
  { address: token2, storageKeys: [key2] }
]);
const list3 = AccessList.from([
  { address: token1, storageKeys: [key3] }
]);

const merged = AccessList.merge(list1, list2, list3);
// Result: [
//   { address: token1, storageKeys: [key1, key3] },
//   { address: token2, storageKeys: [key2] }
// ]
```

## Behavior

- Concatenates all lists
- Automatically deduplicates result
- Empty lists are ignored
- O(k×n²×m) operation (k = number of lists)

## See Also

- [deduplicate](./deduplicate.js.md) - Remove duplicates
- [withAddress](./withAddress.js.md) - Add single address
