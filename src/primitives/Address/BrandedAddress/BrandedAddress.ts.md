# BrandedAddress

Branded type: `Uint8Array & { __tag: "Address" }`

## Instance Methods

```typescript
toBase64(): string
setFromBase64(base64: string): void
toHex(): BrandedHex
setFromHex(hex: string): void
toChecksummed(): Checksummed
toLowercase(): Lowercase
toUppercase(): Uppercase
toU256(): BrandedUint
toShortHex(sliceLength?: number, leadingLength?: number): string
format(): string
compare(other: BrandedAddress): number
lessThan(other: BrandedAddress): boolean
greaterThan(other: BrandedAddress): boolean
isZero(): boolean
equals(other: BrandedAddress): boolean
toAbiEncoded(): Uint8Array
calculateCreateAddress(nonce: bigint): BrandedAddress
calculateCreate2Address(salt: Uint8Array, initCode: Uint8Array): BrandedAddress
```

## Pattern

Branded types add type safety via phantom `__tag` property. Extends Uint8Array with Address-specific methods.
