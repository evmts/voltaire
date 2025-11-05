# isValidChecksum.js

Validate EIP-55 checksum.

## Signature

```typescript
function isValidChecksum(str: string): boolean
```

## Parameters

- `str` - Address string to validate

## Returns

`boolean` - True if checksum is valid per EIP-55

## Example

```typescript
if (Address.isValidChecksum("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3")) {
  console.log("Valid checksum");
}
```
