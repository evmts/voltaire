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

- `InvalidHexFormatError` - Invalid format or length
- `InvalidHexStringError` - Invalid hex characters

## Example

```typescript
const addr = Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
```
