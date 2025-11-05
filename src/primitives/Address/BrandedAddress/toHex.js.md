# toHex

Converts Address to lowercase hex string.

## Signature

```typescript
function toHex(address: BrandedAddress): BrandedHex
```

## Parameters

- `address` - Address bytes to convert

## Returns

Lowercase hex string with `0x` prefix

## Example

```typescript
const hex = Address.toHex(addr);
// "0x742d35cc6634c0532925a3b844bc9e7595f251e3"
```

## See Also

- [toChecksummed](./toChecksummed.js.md) - Convert to checksummed hex
- [toLowercase](./toLowercase.js.md) - Convert to lowercase hex
- [toUppercase](./toUppercase.js.md) - Convert to uppercase hex
- [fromHex](./fromHex.js.md) - Parse hex string to Address
