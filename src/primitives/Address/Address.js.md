# Address.js

Factory function creating Ethereum address instances backed by Uint8Array.

## Factory

```typescript
Address(value: AddressInput): Address
```

Creates Address instance from various input types.

**Parameters:**
- `value`: string (hex), Uint8Array, number, or Address

**Returns:** Address instance

**Throws:** InvalidAddressError if invalid

## Static Constructors

### Address.from(value)
Loose constructor accepting multiple formats. Same as factory.

### Address.fromBase64(value)
```typescript
fromBase64(value: string): Address
```
Decodes base64 string to Address.

### Address.fromHex(value)
```typescript
fromHex(value: string): Address
```
Parses hex string (with/without 0x prefix).

**Throws:** InvalidAddressError if not 40 hex chars

### Address.fromBytes(value)
```typescript
fromBytes(value: Uint8Array): Address
```
Creates from byte array.

**Throws:** InvalidAddressError if length !== 20

### Address.fromNumber(value)
```typescript
fromNumber(value: number | bigint): Address
```
Creates from numeric value, zero-padded left to 20 bytes.

### Address.fromPublicKey(x, y)
```typescript
fromPublicKey(x: Uint8Array, y: Uint8Array): Address
```
Derives address from ECDSA public key coordinates. Keccak-256 hash of concatenated x||y, last 20 bytes.

**Parameters:**
- `x`: 32-byte x coordinate
- `y`: 32-byte y coordinate

### Address.fromAbiEncoded(value)
```typescript
fromAbiEncoded(value: Uint8Array): Address
```
Decodes from ABI-encoded 32-byte format (12 zero bytes + 20 address bytes).

**Throws:** InvalidAddressError if invalid padding

## Static Utilities

### Address.toHex(addr)
```typescript
toHex(addr: Address): string
```
Returns lowercase hex string with 0x prefix.

### Address.toChecksummed(addr)
```typescript
toChecksummed(addr: Address): string
```
Returns EIP-55 checksummed hex string.

### Address.toLowercase(addr)
```typescript
toLowercase(addr: Address): string
```
Returns lowercase hex (no 0x).

### Address.toUppercase(addr)
```typescript
toUppercase(addr: Address): string
```
Returns uppercase hex (no 0x).

### Address.toU256(addr)
```typescript
toU256(addr: Address): bigint
```
Converts to uint256 bigint.

### Address.toAbiEncoded(addr)
```typescript
toAbiEncoded(addr: Address): Uint8Array
```
Returns 32-byte ABI-encoded format.

### Address.toShortHex(addr)
```typescript
toShortHex(addr: Address): string
```
Returns abbreviated format: `0x1234...5678`

### Address.format(addr)
```typescript
format(addr: Address): string
```
Returns checksummed representation.

### Address.isZero(addr)
```typescript
isZero(addr: Address): boolean
```
Checks if all bytes are zero.

### Address.equals(a, b)
```typescript
equals(a: Address, b: Address): boolean
```
Constant-time equality comparison.

### Address.isValid(value)
```typescript
isValid(value: unknown): boolean
```
Validates if value is valid address format.

### Address.isValidChecksum(value)
```typescript
isValidChecksum(value: string): boolean
```
Validates EIP-55 checksum correctness.

### Address.is(value)
```typescript
is(value: unknown): value is Address
```
Type guard checking if value is Address instance.

### Address.zero()
```typescript
zero(): Address
```
Returns zero address (0x0000...0000).

### Address.compare(a, b)
```typescript
compare(a: Address, b: Address): -1 | 0 | 1
```
Lexicographic comparison.

**Returns:**
- `-1` if a < b
- `0` if a === b
- `1` if a > b

### Address.lessThan(a, b)
```typescript
lessThan(a: Address, b: Address): boolean
```

### Address.greaterThan(a, b)
```typescript
greaterThan(a: Address, b: Address): boolean
```

### Address.calculateCreateAddress(addr, nonce)
```typescript
calculateCreateAddress(addr: Address, nonce: bigint): Address
```
Calculates contract address from CREATE opcode. RLP-encodes [address, nonce], takes Keccak-256 hash.

### Address.calculateCreate2Address(addr, salt, initCode)
```typescript
calculateCreate2Address(addr: Address, salt: Uint8Array, initCode: Uint8Array): Address
```
Calculates contract address from CREATE2 opcode.

Formula: `keccak256(0xff ++ address ++ salt ++ keccak256(initCode))`

**Parameters:**
- `salt`: 32-byte salt
- `initCode`: contract initialization bytecode

## Instance Methods

All static utilities available as instance methods:

```javascript
const addr = Address.fromHex('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2');
addr.toChecksummed() // '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2'
addr.toU256()        // 663494435638116163892844969031611177715468288434n
addr.isZero()        // false
addr.equals(other)   // boolean
addr.compare(other)  // -1 | 0 | 1
addr.calculateCreateAddress(1n) // Address
```

Instance methods delegate to BrandedAddress namespace functions.

## Constants

```typescript
Address.SIZE = 20
```

## Implementation

- Extends Uint8Array.prototype
- 20-byte fixed size
- Delegates to BrandedAddress namespace
- Polyfills for toBase64/setFromBase64/toHex/setFromHex when native unavailable

## Example

```javascript
import { Address } from './Address.js';

// Create
const addr = Address.fromHex('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2');

// Format
console.log(addr.toChecksummed());
console.log(Address.toShortHex(addr)); // '0x742d...bEb2'

// Derive contract address
const contract = addr.calculateCreateAddress(1n);

// Compare
const zero = Address.zero();
addr.greaterThan(zero); // true
```
