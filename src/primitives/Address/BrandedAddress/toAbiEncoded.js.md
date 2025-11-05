# toAbiEncoded

Convert Address to 32-byte ABI encoding (left-padded with 12 zero bytes).

## Signature

```typescript
Address.toAbiEncoded(address: BrandedAddress): Uint8Array
```

## Parameters

- `address` - Address to encode

## Returns

32-byte Uint8Array with address right-aligned (12 zero bytes + 20 address bytes)

## Example

```typescript
const addr = Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
const encoded = Address.toAbiEncoded(addr);
// encoded.length === 32
// [0,0,0,0,0,0,0,0,0,0,0,0, ...20 address bytes]
```

## See Also

- [fromAbiEncoded](./fromAbiEncoded.js.md) - Decode address from ABI encoding
