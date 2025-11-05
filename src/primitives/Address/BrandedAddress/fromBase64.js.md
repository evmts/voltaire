# fromBase64

Create Address from base64 string.

## Signature

```typescript
fromBase64(b64: string): BrandedAddress
```

## Parameters

- `b64` - Base64 encoded string

## Returns

`BrandedAddress` - Address from decoded bytes

## Throws

- `Error` - If invalid base64 string
- [`InvalidAddressLengthError`](./errors.js.md#invalidaddresslengtherror) - If decoded length is not 20 bytes

## Example

```typescript
const addr = Address.fromBase64("dC01zGY0wFMpJaO4RLyedZXyUeM=");
```

## See Also

- [fromHex](./fromHex.js.md) - Create from hex string
- [fromBytes](./fromBytes.js.md) - Create from raw bytes
- [from](./from.js.md) - Universal constructor
