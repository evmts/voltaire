---
title: Address
description: 20-byte Ethereum address with EIP-55 checksumming
---

import { Tabs, TabItem, Code } from '@astrojs/starlight/components';

# Address

20-byte Ethereum address type extending Uint8Array

<Tabs syncKey="view">
  <TabItem label="Documentation">

## Overview

The Address primitive represents a 20-byte Ethereum address. It's implemented as a branded `Uint8Array` with zero overhead, supporting both tree-shakeable namespaced methods and optional class-based instances. 

## Data

**Types:** `BrandedAddress` (branded `Uint8Array` runtime validated to be 20 bytes)

The `BrandedAddress` type represents a Uint8Array that is validated to be a valid 20 byte address.

```typescript
export type BrandedAddress = Uint8Array & {
	readonly __tag: "Address";
};
```

### Address Variants

Addresses can be represented as hex strings in three formats:

- **Checksummed** (`Checksummed`): EIP-55 checksummed hex (mixed case based on hash)
- **Lowercase** (`Lowercase`): All lowercase hex string
- **Uppercase** (`Uppercase`): All uppercase hex string

The `Address` class extends a `BrandedAddress` with useful methods.

```typescript
export class Address extends Uint8Array implements BrandedAddress {
	toBase64: typeof Uint8Array.prototype.setFromBase64;
	setFromBase64: typeof Uint8Array.prototype.setFromBase64;
	toHex(): BrandedLowercaseHex;
	setFromHex: (hex: string) => void;
	toChecksummed(): BrandedChecksummedHex;
	toLowercase(): BrandedLowercaseHex;
	toUppercase(): BrandedUppercaseHex;
	toU256(): BrandedU256;
	toShortHex(): BrandedHex;
	format(): string;
	compare(other: BrandedAddress): number;
	lessThan(other: BrandedAddress): boolean;
	greaterThan(other: BrandedAddress): boolean;
	isZero(): boolean;
	equals(other: BrandedAddress): boolean;
	toAbiEncoded(): Bytes<32>;
	calculateCreateAddress(nonce: bigint): Address;
	calculateCreate2Address(salt: Uint8Array, initCode: Uint8Array): Address;
}
```

## Example

```typescript
import {Address, BrandedAddress, Bytes} from '@tevm/voltaire'

// Create address from different sources
const addr1 = new Address(69n)
const addr2 = Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e")

// Convert between formats
console.log(addr2.toHex())          // "0x742d35cc6634c0532925a3b844bc9e7595f51e3e"
console.log(addr2.toChecksummed())  // "0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e"
console.log(addr2.toUppercase())    // "0x742D35CC6634C0532925A3B844BC9E7595F51E3E"

// Calculate contract addresses
const salt = new Uint8Array(32)
salt[31] = 1 // salt = 0x00...01
const initCode = Bytes.fromHex("0x6080604052...")
const create2Addr = addr2.calculateCreate2Address(salt, initCode)

console.log(create2Addr.format())
```

## Why Uint8Array instead of Hex?

Uint8Array eliminates a common source of casing related bugs and can be explicitly turned into uppercase, lowercase, or checksummed hex.

## Constructors

#### `new Address(value: number | bigint | string | Uint8Array)`

Universal constructor that dispatches to appropriate method based on input type.

```typescript
const addr1 = new Address(69n)
const addr2 = new Address("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e")
const addr3 = new Address(new Uint8Array(20))
```

#### `Address.fromHex(hex: string): Address`

Creates address from hex string. Requires 0x prefix and exactly 40 hex characters (42 total).

**Throws:**
- `InvalidHexFormatError` - Missing 0x prefix or wrong length
- `InvalidHexStringError` - Invalid hex characters

```typescript
const addr = Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e")
// Works with any casing - checksummed, lowercase, or uppercase
const addr2 = Address.fromHex("0x742d35cc6634c0532925a3b844bc9e7595f51e3e")
```

#### `Address.fromBase64(b64: string): Address`

Decodes base64 string to 20-byte address.

```typescript
const addr = Address.fromBase64("dC01zGY0wFMpJaO4RLyedZX1Hj4=")
```

#### `Address.fromBytes(bytes: Uint8Array): Address`

Creates address from raw 20-byte array.

```typescript
const addr = Address.fromBytes(new Uint8Array(20))
```

#### `Address.fromNumber(value: bigint | number): Address`

Takes lower 160 bits of number/bigint. Useful for creating addresses from numeric values.

**Throws:**
- `InvalidValueError` - If value is negative

```typescript
const addr = Address.fromNumber(69n)
const addr2 = Address.fromNumber(0x742d35Cc6634C0532925a3b844Bc9e7595f251e3n)
```

#### `Address.fromPublicKey(x: bigint, y: bigint): Address`

Derives address from secp256k1 public key coordinates. Concatenates x and y (32 bytes each), hashes with keccak256, and takes last 20 bytes.

**Formula:** `keccak256(x || y)[12:32]`

```typescript
// 256-bit secp256k1 public key coordinates
const x = 0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e1234567890abcdef12345678n
const y = 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdefn
const addr = Address.fromPublicKey(x, y)
```

#### `Address.fromAbiEncoded(bytes: Uint8Array): Address`

Extracts last 20 bytes from 32-byte ABI-encoded data.

```typescript
const abiEncoded = new Uint8Array(32) // last 20 bytes are address
const addr = Address.fromAbiEncoded(abiEncoded)
```

#### `Address.zero(): Address`

Returns zero address (0x0000...0000).

```typescript
const zeroAddr = Address.zero()
```

## Instance methods

### Conversions

#### `toHex(): BrandedHex`

Converts to lowercase hex string with 0x prefix. Always returns lowercase regardless of how the address was created.

```typescript
const addr = new Address(69n)
addr.toHex() // "0x0000000000000000000000000000000000000045"

const addr2 = Address.fromHex("0x742D35CC6634C0532925A3B844BC9E7595F51E3E")
addr2.toHex() // "0x742d35cc6634c0532925a3b844bc9e7595f51e3e" (lowercase)
```

#### `toChecksummed(): Checksummed`

Converts to EIP-55 checksummed hex string. Uses keccak256 hash to determine character casing for integrity verification.

```typescript
const addr = Address.fromHex("0x742d35cc6634c0532925a3b844bc9e7595f51e3e")
addr.toChecksummed() // "0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e" (mixed case)
```

#### `toLowercase(): Lowercase`

Converts to lowercase hex string.

```typescript
addr.toLowercase() // "0x0000000000000000000000000000000000000045"
```

#### `toUppercase(): Uppercase`

Converts to uppercase hex string.

```typescript
addr.toUppercase() // "0x0000000000000000000000000000000000000045"
```

#### `toU256(): bigint`

Converts to bigint representation.

```typescript
addr.toU256() // 69n
```

#### `toAbiEncoded(): Uint8Array`

Returns 32-byte ABI-encoded representation (left-padded with 12 zero bytes).

```typescript
addr.toAbiEncoded() // Uint8Array(32)
```

#### `toShortHex(prefixLength?: number, suffixLength?: number): string`

Returns shortened display format (default: 6 + 4 chars).

```typescript
addr.toShortHex() // "0x0000...0045"
addr.toShortHex(8, 6) // "0x00000000...000045"
```

#### `toBase64(): string`

Converts to base64 string (inherited from Uint8Array).

```typescript
addr.toBase64() // "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAF"
```

### Formatting

#### `format(): string`

Returns checksummed hex string for display. Recommended for showing addresses to users.

```typescript
const addr = Address.fromHex("0x742d35cc6634c0532925a3b844bc9e7595f51e3e")
addr.format() // "0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e" (checksummed)
```

### Comparisons

#### `isZero(): boolean`

Checks if all bytes are zero.

```typescript
Address.zero().isZero() // true
new Address(69n).isZero() // false
```

#### `equals(other: BrandedAddress): boolean`

Byte-by-byte equality comparison.

```typescript
const addr1 = new Address(69n)
const addr2 = new Address(69n)
addr1.equals(addr2) // true
```

#### `compare(other: BrandedAddress): number`

Lexicographic comparison: -1 (less), 0 (equal), 1 (greater).

```typescript
const result = addr.compare(otherAddr)
if (result < 0) { /* addr is less */ }
else if (result > 0) { /* addr is greater */ }
else { /* equal */ }
```

#### `lessThan(other: BrandedAddress): boolean`

Returns true if this address is less than other.

```typescript
if (addr.lessThan(otherAddr)) {
  // addr comes before otherAddr
}
```

#### `greaterThan(other: BrandedAddress): boolean`

Returns true if this address is greater than other.

```typescript
if (addr.greaterThan(otherAddr)) {
  // addr comes after otherAddr
}
```

### Contract Address Calculations

#### `calculateCreateAddress(nonce: bigint): Address`

Calculates CREATE address: `keccak256(rlp([sender, nonce]))[12:32]`

```typescript
const deployerAddr = new Address("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e")
const contractAddr = deployerAddr.calculateCreateAddress(0n)
```

#### `calculateCreate2Address(salt: Uint8Array, initCode: Uint8Array): Address`

Calculates CREATE2 address. First hashes the initialization code, then computes: `keccak256(0xff ++ sender ++ salt ++ keccak256(initCode))[12:32]`

**Throws:**
- `Error` - If salt is not exactly 32 bytes

```typescript
const deployerAddr = new Address("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e")
const salt = new Uint8Array(32) // Must be 32 bytes
const initCode = Bytes.fromHex("0x6080604052...") // Contract bytecode
const contractAddr = deployerAddr.calculateCreate2Address(salt, initCode)
```

### Uint8Array Methods

#### `setFromBase64(b64: string): void`

Sets bytes from base64 string (inherited from Uint8Array).

```typescript
addr.setFromBase64("dC01zGY0wFMpJaO4RLyedZX1Hj4=")
```

#### `setFromHex(hex: string): void`

Sets bytes from hex string (inherited from Uint8Array).

```typescript
addr.setFromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e")
```

