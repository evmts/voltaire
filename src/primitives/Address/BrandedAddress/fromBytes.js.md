# fromBytes.js

Create Address from raw bytes.

## Signature

```typescript
function fromBytes(bytes: Uint8Array): BrandedAddress
```

## Parameters

- `bytes` - Raw 20-byte array

## Returns

`BrandedAddress` - 20-byte address (new copy)

## Throws

- [`InvalidAddressLengthError`](./errors.js.md#invalidaddresslengtherror) - Length not 20 bytes

## Example

```typescript
const bytes = new Uint8Array(20);
const addr = Address.fromBytes(bytes);
```

## See Also

- [from](./from.js.md) - Universal constructor
- [fromHex](./fromHex.js.md) - Create from hex string
- [constants](./constants.js.md#size) - SIZE constant
