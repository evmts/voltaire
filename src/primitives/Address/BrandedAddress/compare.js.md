# compare

Compare two addresses lexicographically.

## Signature

```typescript
function compare(address: BrandedAddress, other: BrandedAddress): number
```

## Parameters

- `address` - First address
- `other` - Address to compare with

## Returns

`number` - `-1` if address < other, `0` if equal, `1` if address > other

## Example

```typescript
const sorted = addresses.sort((a, b) => Address.compare(a, b));
```

## See Also

- [equals](./equals.js.md) - Check equality between addresses
- [lessThan](./lessThan.js.md) - Check if address is less than another
- [greaterThan](./greaterThan.js.md) - Check if address is greater than another
