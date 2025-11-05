# format

Format address for display with EIP-55 checksum encoding.

## Signature

```typescript
Address.format(address: BrandedAddress): string
```

## Parameters

- `address` - Address to format

## Returns

Checksummed hex string with mixed case per EIP-55.

## Example

```typescript
console.log(Address.format(addr));
// "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3"
```
