# toChecksummed

Converts Address to EIP-55 checksummed hex string.

## Signature

```typescript
function toChecksummed(address: BrandedAddress): Checksummed
```

## Parameters

- `address` - Address bytes to convert

## Returns

[EIP-55](https://eips.ethereum.org/EIPS/eip-55) checksummed hex string with mixed case

## Example

```typescript
const checksummed = Address.toChecksummed(addr);
// "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3"
```

## See Also

- [toHex](./toHex.js.md) - Convert to lowercase hex
- [format](./format.js.md) - Format with checksum
- [isValidChecksum](./isValidChecksum.js.md) - Validate checksum
- [ChecksumAddress](./ChecksumAddress.js.md) - Checksummed address type
