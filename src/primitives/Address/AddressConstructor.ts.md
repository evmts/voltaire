# AddressConstructor

TypeScript interface defining Address constructor signatures, prototype methods, and static methods.

## Constructor Signatures

```typescript
new (value: number | bigint | string | Uint8Array): AddressPrototype
(value: number | bigint | string | Uint8Array): AddressPrototype
```

Both `new Address(value)` and `Address(value)` syntax supported. Accept numeric, string, or bytes input.

## AddressPrototype

Extends `BrandedAddress` with instance methods:

**Inherited from Uint8Array:**
- `toBase64()` - encode to base64
- `setFromBase64()` - decode from base64
- `setFromHex()` - decode from hex

**Address-specific:**
- `toHex()` - convert to hex string
- `toChecksummed()` - EIP-55 checksummed format
- `toLowercase()` - lowercase hex
- `toUppercase()` - uppercase hex
- `toU256()` - convert to U256
- `toShortHex()` - short hex representation
- `format()` - format address string
- `compare()` - compare addresses
- `lessThan()` - less-than comparison
- `greaterThan()` - greater-than comparison
- `isZero()` - check if zero address
- `equals()` - equality check
- `toAbiEncoded()` - ABI-encode address
- `calculateCreateAddress()` - compute CREATE address
- `calculateCreate2Address()` - compute CREATE2 address

## Static Methods

**Constructors:**
- `fromBase64(value: string)` - construct from base64
- `fromHex(value: string)` - construct from hex
- `from(value)` - loose constructor, accepts any input type
- `fromBytes(value: Uint8Array)` - construct from bytes
- `fromNumber(value: number | bigint)` - construct from number
- `fromPublicKey(x: bigint, y: bigint)` - derive from public key
- `fromAbiEncoded(value: Uint8Array)` - construct from ABI-encoded bytes

**Conversion (static):**
- `toHex()` - convert to hex
- `toChecksummed()` - convert to checksummed hex
- `toLowercase()` - convert to lowercase hex
- `toUppercase()` - convert to uppercase hex
- `toU256()` - convert to U256
- `toAbiEncoded()` - ABI-encode
- `toShortHex()` - convert to short hex
- `format()` - format address

**Validation:**
- `is()` - type guard
- `isValid()` - validate address format
- `isValidChecksum()` - validate EIP-55 checksum
- `isZero()` - check if zero

**Comparison:**
- `compare()` - compare two addresses
- `lessThan()` - less-than comparison
- `greaterThan()` - greater-than comparison
- `equals()` - equality check

**Utilities:**
- `zero()` - zero address constant
- `calculateCreateAddress()` - compute CREATE address
- `calculateCreate2Address()` - compute CREATE2 address
- `SIZE` - byte size constant (20)

## Pattern

Static methods operate on data passed as first arg. Instance methods operate on `this`. All methods tree-shakable via namespace pattern.
