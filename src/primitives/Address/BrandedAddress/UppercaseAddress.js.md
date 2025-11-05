# UppercaseAddress.js

Uppercase address hex string.

## Type

```typescript
type Uppercase = Hex.Sized<20> & {
  readonly __tag: 'Hex';
  readonly __variant: 'Address';
  readonly __uppercase: true;
}
```

## Functions

### `from(addr: BrandedAddress): Uppercase`

Create uppercase address hex string from Address.

```typescript
const addr = Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
const upper = UppercaseAddress.from(addr);
// "0x742D35CC6634C0532925A3B844BC9E7595F251E3"
```

## See Also

- [toUppercase](./toUppercase.js.md) - Convert address to uppercase hex
- [LowercaseAddress](./LowercaseAddress.js.md) - Lowercase address type
- [ChecksumAddress](./ChecksumAddress.js.md) - Checksummed address type
