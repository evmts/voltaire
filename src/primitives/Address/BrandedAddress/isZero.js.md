# isZero.js

Check if address is zero address.

## Signature

```typescript
function isZero(address: BrandedAddress): boolean
```

## Parameters

- `address` - Address to check

## Returns

`boolean` - True if all bytes are zero

## Example

```typescript
if (Address.isZero(addr)) {
  console.log("Zero address");
}
```
