# LowercaseAddress.js

Lowercase address hex string.

## Type

```typescript
type Lowercase = Hex.Sized<20> & {
  readonly __tag: 'Hex';
  readonly __variant: 'Address';
  readonly __lowercase: true;
}
```

## Functions

### `from(addr: BrandedAddress): Lowercase`

Create lowercase address hex string from Address.

```typescript
const addr = Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
const lower = LowercaseAddress.from(addr);
// "0x742d35cc6634c0532925a3b844bc9e7595f251e3"
```
