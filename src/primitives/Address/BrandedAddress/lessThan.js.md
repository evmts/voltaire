# lessThan

Check if first address is less than second.

## Signature

```typescript
function lessThan(address: BrandedAddress, other: BrandedAddress): boolean
```

## Parameters

- `address` - First address
- `other` - Address to compare with

## Returns

`boolean` - True if address < other

## Example

```typescript
if (Address.lessThan(addr1, addr2)) {
  console.log("addr1 comes before addr2");
}
```

## See Also

- [compare](./compare.js.md) - Lexicographic comparison of addresses
- [greaterThan](./greaterThan.js.md) - Check if address is greater than another
- [equals](./equals.js.md) - Check equality between addresses
