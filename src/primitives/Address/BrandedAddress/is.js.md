# is.js

Type guard for Address.

## Signature

```typescript
function is(value: unknown): value is BrandedAddress
```

## Parameters

- `value` - Value to check

## Returns

`boolean` - True if value is an Address (Uint8Array with 20 bytes)

## Example

```typescript
if (Address.is(value)) {
  const hex = Address.toHex(value);
}
```
