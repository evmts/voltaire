# toLowercase

Converts Address to lowercase hex string.

## Signature

```typescript
function toLowercase(address: BrandedAddress): Lowercase
```

## Parameters

- `address` - Address bytes to convert

## Returns

Lowercase hex string

## Example

```typescript
const lower = Address.toLowercase(addr);
// "0x742d35cc6634c0532925a3b844bc9e7595f251e3"
```
