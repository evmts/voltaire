# isValid.js

Validate address string format.

## Signature

```typescript
function isValid(str: string): boolean
```

## Parameters

- `str` - String to validate

## Returns

`boolean` - True if valid 40-char hex (with or without 0x prefix)

## Example

```typescript
if (Address.isValid("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3")) {
  const addr = Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
}
```

## See Also

- [fromHex](./fromHex.js.md) - Parse hex string to Address
- [is](./is.js.md) - Type guard for Address
- [isValidChecksum](./isValidChecksum.js.md) - Validate EIP-55 checksum
