# from.js

Universal constructor for Address from various input types.

## Signature

```typescript
function from(value: number | bigint | string | Uint8Array): BrandedAddress
```

## Parameters

- `value` - Number, bigint, hex string, or Uint8Array

## Returns

`BrandedAddress` - 20-byte address

## Throws

- [`InvalidValueError`](./errors.js.md#invalidvalueerror) - Unsupported type or negative value
- [`InvalidHexFormatError`](./errors.js.md#invalidhexformaterror) - Invalid hex string format
- [`InvalidAddressLengthError`](./errors.js.md#invalidaddresslengtherror) - Bytes length not 20

## Example

```typescript
const addr1 = Address.from(0x742d35Cc6634C0532925a3b844Bc9e7595f251e3n);
const addr2 = Address.from(12345);
const addr3 = Address.from("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
const addr4 = Address.from(new Uint8Array(20));
```

## See Also

- [fromHex](./fromHex.js.md) - Create from hex string
- [fromBytes](./fromBytes.js.md) - Create from raw bytes
- [fromNumber](./fromNumber.js.md) - Create from number
