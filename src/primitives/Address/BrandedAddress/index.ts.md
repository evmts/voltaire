# BrandedAddress Module

## Exports

### Types
- `BrandedAddress`
- `Checksummed`, `Lowercase`, `Uppercase` (namespace exports)

### Constructors
- `from(value: unknown): BrandedAddress` - loose constructor
- `fromHex(hex: string): BrandedAddress`
- `fromBase64(base64: string): BrandedAddress`
- `fromBytes(bytes: Uint8Array): BrandedAddress`
- `fromNumber(n: number | bigint): BrandedAddress`
- `fromPublicKey(publicKey: Uint8Array): BrandedAddress`
- `fromAbiEncoded(encoded: Uint8Array): BrandedAddress`

### Converters
- `toHex(address: BrandedAddress): BrandedHex`
- `toChecksummed(address: BrandedAddress): Checksummed`
- `toLowercase(address: BrandedAddress): Lowercase`
- `toUppercase(address: BrandedAddress): Uppercase`
- `toU256(address: BrandedAddress): BrandedUint`
- `toAbiEncoded(address: BrandedAddress): Uint8Array`
- `toShortHex(address: BrandedAddress, sliceLength?: number, leadingLength?: number): string`
- `format(address: BrandedAddress): string`

### Validators
- `is(value: unknown): value is BrandedAddress`
- `isValid(value: unknown): boolean`
- `isValidChecksum(address: string): boolean`
- `isZero(address: BrandedAddress): boolean`

### Utilities
- `zero(): BrandedAddress`
- `equals(a: BrandedAddress, b: BrandedAddress): boolean`
- `compare(a: BrandedAddress, b: BrandedAddress): number`
- `lessThan(a: BrandedAddress, b: BrandedAddress): boolean`
- `greaterThan(a: BrandedAddress, b: BrandedAddress): boolean`
- `calculateCreateAddress(from: BrandedAddress, nonce: bigint): BrandedAddress`
- `calculateCreate2Address(from: BrandedAddress, salt: Uint8Array, initCode: Uint8Array): BrandedAddress`

### Constants
- `SIZE: 20`

## Namespace Pattern

All methods exported individually and as `BrandedAddress` namespace:

```typescript
BrandedAddress.fromHex(hex) // namespace usage
fromHex(hex)                 // direct import
```

Tree-shakable: unused methods eliminated by bundler.
