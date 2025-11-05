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

- `InvalidAddressLengthError` - Length not 20 bytes

## Example

```typescript
const bytes = new Uint8Array(20);
const addr = Address.fromBytes(bytes);
```
