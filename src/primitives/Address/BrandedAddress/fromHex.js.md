# fromHex.js

Parse hex string to Address.

## Signature

```typescript
function fromHex(hex: string): BrandedAddress
```

## Parameters

- `hex` - Hex string with 0x prefix (42 chars total)

## Returns

`BrandedAddress` - 20-byte address

## Throws

- [`InvalidHexFormatError`](./errors.js.md#invalidhexformaterror) - Invalid format or length
- [`InvalidHexStringError`](./errors.js.md#invalidhexstringerror) - Invalid hex characters

## Example

```typescript
const addr = Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
```

## See Also

- [from](./from.js.md) - Universal constructor
- [fromBytes](./fromBytes.js.md) - Create from raw bytes
- [toHex](./toHex.js.md) - Convert to hex string
- [constants](./constants.js.md#hex_size) - HEX_SIZE constant
