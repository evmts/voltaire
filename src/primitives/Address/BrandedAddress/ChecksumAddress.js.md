# ChecksumAddress.js

EIP-55 checksummed address - uppercase chars where hash nibble ≥ 8.

## Type

```typescript
type Checksummed = Hex.Sized<20> & {
  readonly __tag: 'Hex';
  readonly __variant: 'Address';
  readonly __checksummed: true;
}
```

## Functions

### `from(addr: BrandedAddress): Checksummed`

Create checksummed address from Address.

```typescript
const addr = Address.fromHex("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
const checksummed = ChecksumAddress.from(addr);
// "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3"
```

### `isValid(str: string): boolean`

Check if string has valid EIP-55 checksum.

```typescript
if (ChecksumAddress.isValid("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3")) {
  console.log("Valid checksum");
}
```
