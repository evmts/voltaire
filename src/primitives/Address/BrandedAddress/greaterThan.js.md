# greaterThan

Check if first address is greater than second.

## Signature

```typescript
function greaterThan(address: BrandedAddress, other: BrandedAddress): boolean
```

## Parameters

- `address` - First address
- `other` - Address to compare with

## Returns

`boolean` - True if address > other

## Example

```typescript
if (Address.greaterThan(addr1, addr2)) {
  console.log("addr1 comes after addr2");
}
```

## See Also

- [compare](./compare.js.md) - Lexicographic comparison of addresses
- [lessThan](./lessThan.js.md) - Check if address is less than another
- [equals](./equals.js.md) - Check equality between addresses
