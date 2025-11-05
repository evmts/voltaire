# fromNumber.js

Create Address from number value (takes lower 160 bits).

## Signature

```typescript
function fromNumber(value: bigint | number): BrandedAddress
```

## Parameters

- `value` - Number or bigint (lower 160 bits used)

## Returns

`BrandedAddress` - 20-byte address from lower 160 bits

## Throws

- `InvalidValueError` - Negative value

## Example

```typescript
const addr = Address.fromNumber(0x742d35Cc6634C0532925a3b844Bc9e7595f251e3n);
const addr2 = Address.fromNumber(12345);
```
