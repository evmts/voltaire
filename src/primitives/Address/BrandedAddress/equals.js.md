# equals

Check if two addresses are equal.

## Signature

```typescript
function equals(address: BrandedAddress, other: BrandedAddress): boolean
```

## Parameters

- `address` - First address
- `other` - Address to compare with

## Returns

`boolean` - True if addresses are identical

## Example

```typescript
if (Address.equals(addr1, addr2)) {
  console.log("Addresses match");
}
```
