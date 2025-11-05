# is.js

Type guard checking if value is valid AccessList.

## Signature

```typescript
function is(value: unknown): value is BrandedAccessList
```

## Parameters

- `value` - Value to check

## Returns

`boolean` - True if valid AccessList

## Example

```typescript
if (AccessList.is(maybeList)) {
  // TypeScript knows maybeList is BrandedAccessList
  const cost = maybeList.gasCost();
}
```

## Validation

- Checks if value is array
- Checks if each element is valid Item
- Does not validate address/key byte lengths

## See Also

- [isItem](./isItem.js.md) - Check if value is Item
- [assertValid](./assertValid.js.md) - Validate with throws
