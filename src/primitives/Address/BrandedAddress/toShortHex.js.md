# toShortHex

Format address with shortened display (prefix...suffix).

## Signature

```typescript
Address.toShortHex(
  address: BrandedAddress,
  prefixLength?: number,
  suffixLength?: number
): string
```

## Parameters

- `address` - Address to format
- `prefixLength` - Chars to show at start (default: 6)
- `suffixLength` - Chars to show at end (default: 4)

## Returns

Shortened hex string like `"0x742d...51e3"`. Returns full hex if prefix+suffix >= 40.

## Example

```typescript
const short = Address.toShortHex(addr);
// "0x742d...51e3"

const custom = Address.toShortHex(addr, 8, 6);
// "0x742d35...251e3"
```

## See Also

- [toHex](./toHex.js.md) - Convert to full hex string
- [format](./format.js.md) - Format with checksum
- [toChecksummed](./toChecksummed.js.md) - Convert to checksummed hex
