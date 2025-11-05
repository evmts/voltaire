# toUppercase

Converts Address to uppercase hex string.

## Signature

```typescript
function toUppercase(address: BrandedAddress): Uppercase
```

## Parameters

- `address` - Address bytes to convert

## Returns

Uppercase hex string

## Example

```typescript
const upper = Address.toUppercase(addr);
// "0x742D35CC6634C0532925A3B844BC9E7595F251E3"
```

## See Also

- [toHex](./toHex.js.md) - Convert to lowercase hex
- [toLowercase](./toLowercase.js.md) - Convert to lowercase hex
- [toChecksummed](./toChecksummed.js.md) - Convert to checksummed hex
- [UppercaseAddress](./UppercaseAddress.js.md) - Uppercase address type
