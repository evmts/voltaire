# isItem.js

Type guard checking if value is valid AccessList.Item.

## Signature

```typescript
function isItem(value: unknown): value is Item
```

## Parameters

- `value` - Value to check

## Returns

`boolean` - True if valid Item

## Example

```typescript
const item = { address: addr, storageKeys: [key] };

if (AccessList.isItem(item)) {
  // TypeScript knows item is Item
  console.log(item.address);
  console.log(item.storageKeys.length);
}
```

## Validation

- Must have `address` property
- Must have `storageKeys` property (array)
- Does not validate byte lengths

## See Also

- [is](./is.js.md) - Check if value is AccessList
- [assertValid](./assertValid.js.md) - Deep validation
