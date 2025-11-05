# fromAbiEncoded

Decode Address from 32-byte ABI encoding.

## Signature

```typescript
fromAbiEncoded(bytes: Uint8Array): BrandedAddress
```

## Parameters

- `bytes` - 32-byte ABI-encoded data

## Returns

`BrandedAddress` - Last 20 bytes of ABI-encoded data

## Throws

- `Error` - If bytes length is not 32

## Example

```typescript
const encoded = new Uint8Array(32);
// ... set encoded[12:32] to address bytes ...
const addr = Address.fromAbiEncoded(encoded);
```

## See Also

- [toAbiEncoded](./toAbiEncoded.js.md) - Convert address to ABI encoding
- [fromBytes](./fromBytes.js.md) - Create from raw bytes
