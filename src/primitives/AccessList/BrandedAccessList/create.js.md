# create.js

Create empty AccessList.

## Signature

```typescript
function create(): BrandedAccessList
```

## Returns

`BrandedAccessList` - Empty access list

## Example

```typescript
let list = AccessList.create();
list = list.withAddress(addr);
list = list.withStorageKey(addr, key);
```

## Use Cases

- Starting point for incremental building
- Default/empty state
- Conditional list building

## See Also

- [withAddress](./withAddress.js.md) - Add address to list
- [withStorageKey](./withStorageKey.js.md) - Add storage key
