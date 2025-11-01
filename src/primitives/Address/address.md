# Address

Complete Ethereum address handling with EIP-55 checksum validation, contract address calculation (CREATE/CREATE2), and type-safe operations.

## Overview

Address represents 20-byte (160-bit) Ethereum addresses used to identify accounts and contracts on the Ethereum blockchain. Includes EIP-55 checksumming, validation, comparison, and contract address derivation utilities.

**Key Features:**
- Type-safe 20-byte address representation
- EIP-55 mixed-case checksum validation
- CREATE and CREATE2 contract address calculation
- Public key to address derivation (secp256k1)
- Constant-time comparison operations
- Universal constructor supporting multiple input types
- Zero-copy conversions

**When to Use:**
- Account and contract identification
- Transaction recipient/sender addresses
- Smart contract deployment
- Public key to address conversion
- Address validation and checksumming
- Address comparison and sorting

## Quick Start

```typescript
import { Address } from '@tevm/voltaire';

// Create from hex string
const addr = Address.fromHex('0x742d35Cc6634C0532925a3b844Bc9e7595f251e3');

// Universal constructor (accepts hex, number, bigint, bytes)
const addr2 = Address.from('0x742d35Cc6634C0532925a3b844Bc9e7595f251e3');
const addr3 = Address.from(12345n);

// EIP-55 checksumming
const checksummed = Address.toChecksumHex.call(addr);
// "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3"

// Validate checksum
if (Address.isValidChecksum('0x742d35Cc6634C0532925a3b844Bc9e7595f251e3')) {
  console.log('Valid checksum');
}

// Compare addresses
if (Address.equals.call(addr1, addr2)) {
  console.log('Addresses match');
}

// Calculate CREATE contract address
const deployer = Address.fromHex('0xa0cf798816d4b9b9866b5330eea46a18382f251e');
const nonce = 0n;
const contractAddr = Address.calculateCreateAddress.call(deployer, nonce);

// Calculate CREATE2 contract address
const salt = new Uint8Array(32);
const initCode = new Uint8Array([0x60, 0x80, ...]);
const create2Addr = Address.calculateCreate2Address.call(deployer, salt, initCode);
```

## Core Type

### Address

20-byte Ethereum address represented as branded Uint8Array.

```typescript
type Address = Uint8Array & { readonly __tag: "Address" };
```

**Properties:**
- Length: Always 20 bytes (160 bits)
- Immutable: Should be treated as immutable
- Brand: Type-branded for safety

```typescript
const addr: Address = Address.fromHex('0x...');
console.log(addr.length); // 20
console.log(addr[0]); // First byte
```

## Constants

### SIZE

Address size in bytes.

```typescript
Address.SIZE = 20;
```

```typescript
const buffer = new Uint8Array(Address.SIZE);
// Create 20-byte buffer
```

### HEX_SIZE

Address hex string size including 0x prefix.

```typescript
Address.HEX_SIZE = 42; // "0x" + 40 hex characters
```

```typescript
const hex = '0x742d35Cc6634C0532925a3b844Bc9e7595f251e3';
console.log(hex.length === Address.HEX_SIZE); // true
```

## Universal Constructor

### from

Create Address from various input types (universal constructor).

```typescript
Address.from(value: number | bigint | string | Uint8Array): Address
```

**Parameters:**
- `value` - Number, bigint, hex string, or Uint8Array

**Returns:** Address

**Throws:**
- `InvalidValueError` - If value type is unsupported or invalid
- `InvalidHexFormatError` - If hex string is invalid
- `InvalidAddressLengthError` - If bytes length is not 20

```typescript
// From bigint
const addr1 = Address.from(0x742d35Cc6634C0532925a3b844Bc9e7595f251e3n);

// From number
const addr2 = Address.from(12345);

// From hex string
const addr3 = Address.from('0x742d35Cc6634C0532925a3b844Bc9e7595f251e3');

// From Uint8Array
const bytes = new Uint8Array(20);
const addr4 = Address.from(bytes);

// Invalid throws
try {
  Address.from(-1); // Negative number
} catch (e) {
  console.error('Invalid value');
}

try {
  Address.from(null as any); // Unsupported type
} catch (e) {
  console.error('Unsupported type');
}
```

**Note:** Routes to appropriate `from*` method based on input type.

## Creation Functions

### fromHex

Parse hex string to Address.

```typescript
Address.fromHex(hex: string): Address
```

**Parameters:**
- `hex` - Hex string with 0x prefix (must be 42 chars: "0x" + 40 hex)

**Returns:** Address bytes

**Throws:**
- `InvalidHexFormatError` - If missing 0x or wrong length
- `InvalidHexStringError` - If contains invalid hex characters

```typescript
// Valid hex
const addr = Address.fromHex('0x742d35Cc6634C0532925a3b844Bc9e7595f251e3');

// Case insensitive
const addr2 = Address.fromHex('0x742d35cc6634c0532925a3b844bc9e7595f251e3');

// Invalid throws
try {
  Address.fromHex('742d35Cc...'); // Missing 0x
} catch (e) {
  console.error('Invalid format');
}

try {
  Address.fromHex('0x742d35Cc'); // Too short
} catch (e) {
  console.error('Invalid length');
}

try {
  Address.fromHex('0x742d35Cc6634C0532925a3b844Bc9e7595f251eZ'); // Invalid char
} catch (e) {
  console.error('Invalid hex character');
}
```

### fromBytes

Create Address from raw bytes.

```typescript
Address.fromBytes(bytes: Uint8Array): Address
```

**Parameters:**
- `bytes` - Raw 20-byte array

**Returns:** Address (new copy)

**Throws:** `InvalidAddressLengthError` - If length is not 20 bytes

```typescript
const bytes = new Uint8Array(20);
bytes[0] = 0x74;
bytes[1] = 0x2d;
const addr = Address.fromBytes(bytes);

// Creates independent copy
bytes[0] = 0xff;
console.log(addr[0]); // Still 0x74

// Invalid length throws
try {
  Address.fromBytes(new Uint8Array(19)); // Too short
} catch (e) {
  console.error('Invalid length');
}
```

### fromNumber

Create Address from number value (takes lower 160 bits).

```typescript
Address.fromNumber(value: bigint | number): Address
```

**Parameters:**
- `value` - Number or bigint value

**Returns:** Address from lower 160 bits

**Throws:** `InvalidValueError` - If value is negative

```typescript
// From bigint
const addr = Address.fromNumber(0x742d35Cc6634C0532925a3b844Bc9e7595f251e3n);

// From number
const addr2 = Address.fromNumber(12345);
console.log(Address.toHex.call(addr2)); // "0x0000000000000000000000000000000000003039"

// Takes lower 160 bits if larger
const large = (1n << 200n) | 0xffffn;
const addr3 = Address.fromNumber(large);

// Zero address
const zero = Address.fromNumber(0);
console.log(Address.isZero.call(zero)); // true

// Negative throws
try {
  Address.fromNumber(-1);
} catch (e) {
  console.error('Value cannot be negative');
}
```

### fromPublicKey

Create Address from secp256k1 public key.

```typescript
Address.fromPublicKey(x: bigint, y: bigint): Address
```

**Parameters:**
- `x` - Public key x coordinate (32 bytes)
- `y` - Public key y coordinate (32 bytes)

**Returns:** Address derived from `keccak256(pubkey)[12:32]`

```typescript
// Derive address from public key coordinates
const x = 0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798n;
const y = 0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8n;
const addr = Address.fromPublicKey(x, y);

// Deterministic derivation
const addr2 = Address.fromPublicKey(x, y);
console.log(Address.equals.call(addr, addr2)); // true

// Used for account address recovery
function recoverAddress(signature: Signature, messageHash: Hash): Address {
  const { x, y } = recoverPublicKey(signature, messageHash);
  return Address.fromPublicKey(x, y);
}
```

**Algorithm:**
1. Encode uncompressed public key: 64 bytes (32 bytes x + 32 bytes y)
2. Hash with Keccak-256: 32 bytes
3. Take last 20 bytes as address

## Conversion Functions

### toHex

Convert Address to hex string.

```typescript
Address.toHex.call(addr: Address): Hex
```

**Returns:** Lowercase hex string with 0x prefix

```typescript
const addr = Address.fromHex('0x742d35Cc6634C0532925a3b844Bc9e7595f251e3');
const hex = Address.toHex.call(addr);
console.log(hex); // "0x742d35cc6634c0532925a3b844bc9e7595f251e3"

// Always lowercase
const zero = Address.zero();
console.log(Address.toHex.call(zero)); // "0x0000000000000000000000000000000000000000"
```

### toChecksumHex

Convert Address to EIP-55 checksummed hex string.

```typescript
Address.toChecksumHex.call(addr: Address): ChecksumHex
```

**Returns:** Mixed-case checksummed hex string (EIP-55)

```typescript
const addr = Address.fromHex('0x742d35cc6634c0532925a3b844bc9e7595f251e3');
const checksummed = Address.toChecksumHex.call(addr);
console.log(checksummed); // "0x742d35Cc6634c0532925a3b844bc9e7595F251E3"

// Deterministic
const check2 = Address.toChecksumHex.call(addr);
console.log(checksummed === check2); // true

// Zero address
const zero = Address.zero();
console.log(Address.toChecksumHex.call(zero)); // "0x0000000000000000000000000000000000000000"
```

**Algorithm (EIP-55):**
1. Convert address to lowercase hex (no 0x)
2. Hash lowercase hex with Keccak-256
3. For each hex character a-f, uppercase if corresponding hash nibble >= 8

### toU256

Convert Address to uint256 (bigint).

```typescript
Address.toU256.call(addr: Address): bigint
```

**Returns:** Bigint representation

```typescript
const addr = Address.fromNumber(0x742d35Cc6634C0532925a3b844Bc9e7595f251e3n);
const value = Address.toU256.call(addr);
console.log(value); // 0x742d35Cc6634C0532925a3b844Bc9e7595f251e3n

// Round-trip
const original = 12345n;
const addr2 = Address.fromNumber(original);
console.log(Address.toU256.call(addr2) === original); // true

// Zero address
const zero = Address.zero();
console.log(Address.toU256.call(zero)); // 0n
```

## Validation Functions

### isZero

Check if address is zero address.

```typescript
Address.isZero.call(addr: Address): boolean
```

**Returns:** True if all bytes are zero

```typescript
const zero = Address.zero();
console.log(Address.isZero.call(zero)); // true

const nonZero = Address.fromNumber(1);
console.log(Address.isZero.call(nonZero)); // false

// Check for burn address
if (Address.isZero.call(recipient)) {
  throw new Error('Cannot send to zero address');
}
```

### equals

Check if two addresses are equal.

```typescript
Address.equals.call(addr1: Address, addr2: Address): boolean
```

**Returns:** True if addresses are identical (byte-by-byte)

```typescript
const addr1 = Address.fromHex('0x742d35cc6634c0532925a3b844bc9e7595f251e3');
const addr2 = Address.fromHex('0x742d35Cc6634C0532925a3b844Bc9e7595f251e3');
console.log(Address.equals.call(addr1, addr2)); // true (case insensitive)

const addr3 = Address.fromNumber(12345);
console.log(Address.equals.call(addr1, addr3)); // false

// Same instance
console.log(Address.equals.call(addr1, addr1)); // true

// Use in authentication
function verifyOwner(claimed: Address, actual: Address): boolean {
  return Address.equals.call(claimed, actual);
}
```

**Note:** Performs byte-by-byte comparison (case insensitive after parsing).

### isValid

Check if string is valid address format.

```typescript
Address.isValid(str: string): boolean
```

**Parameters:**
- `str` - String to validate

**Returns:** True if valid hex format (with or without 0x)

```typescript
// With 0x prefix
console.log(Address.isValid('0x742d35Cc6634C0532925a3b844Bc9e7595f251e3')); // true

// Without 0x prefix
console.log(Address.isValid('742d35Cc6634C0532925a3b844Bc9e7595f251e3')); // true

// Case insensitive
console.log(Address.isValid('0x742D35CC6634C0532925A3B844BC9E7595F251E3')); // true

// Invalid formats
console.log(Address.isValid('0x742d35cc')); // false (too short)
console.log(Address.isValid('')); // false (empty)
console.log(Address.isValid('not-an-address')); // false
console.log(Address.isValid('0x742d35cc6634c0532925a3b844bc9e7595f251eZ')); // false (invalid char)

// Validate before parsing
if (Address.isValid(userInput)) {
  const addr = Address.fromHex(userInput);
}
```

### isValidChecksum

Check if string has valid EIP-55 checksum.

```typescript
Address.isValidChecksum(str: string): boolean
```

**Parameters:**
- `str` - Address string to validate

**Returns:** True if checksum is valid (EIP-55 compliant)

```typescript
// Valid checksums
console.log(Address.isValidChecksum('0x742d35Cc6634c0532925a3b844bc9e7595F251E3')); // true
console.log(Address.isValidChecksum('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed')); // true

// Invalid checksums
console.log(Address.isValidChecksum('0x742d35cc6634c0532925a3b844bc9e7595f251e3')); // false (all lowercase)
console.log(Address.isValidChecksum('0x742D35CC6634C0532925A3B844BC9E7595F251E3')); // false (all uppercase)
console.log(Address.isValidChecksum('0x742d35Cc6634C0532925a3b844Bc9e7595f251e3')); // false (wrong checksum)

// Zero address
console.log(Address.isValidChecksum('0x0000000000000000000000000000000000000000')); // true

// Validate user-provided addresses
if (!Address.isValidChecksum(userAddress)) {
  console.warn('Address checksum invalid - possible typo');
}
```

**Note:** Validates exact EIP-55 mixed-case checksum encoding.

### is

Type guard for Address.

```typescript
Address.is(value: unknown): value is Address
```

**Returns:** True if value is an Address

```typescript
const addr = Address.fromHex('0x742d35cc6634c0532925a3b844bc9e7595f251e3');
console.log(Address.is(addr)); // true

console.log(Address.is(new Uint8Array(20))); // true (correct length)
console.log(Address.is(new Uint8Array(19))); // false (wrong length)
console.log(Address.is('0x742d35cc...')); // false (not Uint8Array)
console.log(Address.is(null)); // false

// Type narrowing
function processValue(value: unknown) {
  if (Address.is(value)) {
    // TypeScript knows value is Address
    const hex = Address.toHex.call(value);
  }
}
```

## Special Address Functions

### zero

Create zero address.

```typescript
Address.zero(): Address
```

**Returns:** Zero address (0x0000...0000)

```typescript
const zero = Address.zero();
console.log(Address.isZero.call(zero)); // true
console.log(Address.toHex.call(zero)); // "0x0000000000000000000000000000000000000000"

// Each call creates new instance
const zero2 = Address.zero();
console.log(zero !== zero2); // true (different objects)
console.log(Address.equals.call(zero, zero2)); // true (same value)

// Use as burn address
function burnTokens(amount: bigint) {
  transfer(Address.zero(), amount);
}
```

## Contract Address Calculation

### calculateCreateAddress

Calculate CREATE contract address from deployer and nonce.

```typescript
Address.calculateCreateAddress.call(
  deployer: Address,
  nonce: bigint
): Address
```

**Parameters:**
- `deployer` - Deployer address
- `nonce` - Transaction nonce

**Returns:** Calculated contract address

**Throws:** `InvalidValueError` - If nonce is negative

**Algorithm:** `address = keccak256(rlp([sender, nonce]))[12:32]`

```typescript
// Known test vectors (verified against ethers.js v6.15.0)
const deployer = Address.fromHex('0xa0cf798816d4b9b9866b5330eea46a18382f251e');

const addr0 = Address.calculateCreateAddress.call(deployer, 0n);
console.log(Address.toHex.call(addr0)); // "0xfa0d70e1d133b2f6cf2777547e8b12810d31b69a"

const addr1 = Address.calculateCreateAddress.call(deployer, 1n);
console.log(Address.toHex.call(addr1)); // "0xc244efd33e63b31c1c5e15c17e31040318e68ffa"

const addr2 = Address.calculateCreateAddress.call(deployer, 2n);
console.log(Address.toHex.call(addr2)); // "0xfc17cf067a73c2229a3b463e350143b77a3d8604"

// Deterministic
const addrA = Address.calculateCreateAddress.call(deployer, 42n);
const addrB = Address.calculateCreateAddress.call(deployer, 42n);
console.log(Address.equals.call(addrA, addrB)); // true

// Different nonces produce different addresses
const diff1 = Address.calculateCreateAddress.call(deployer, 1n);
const diff2 = Address.calculateCreateAddress.call(deployer, 2n);
console.log(Address.equals.call(diff1, diff2)); // false

// Negative nonce throws
try {
  Address.calculateCreateAddress.call(deployer, -1n);
} catch (e) {
  console.error('Nonce cannot be negative');
}

// Practical usage
async function predictContractAddress(
  signer: Signer
): Promise<Address> {
  const deployerAddr = await signer.getAddress();
  const deployer = Address.fromHex(deployerAddr);
  const nonce = await signer.getTransactionCount();
  return Address.calculateCreateAddress.call(deployer, BigInt(nonce));
}
```

**Special Cases:**
- Nonce 0 encodes as empty bytes in RLP
- Large nonces supported (up to u64::MAX)
- Handles zero address deployer

### calculateCreate2Address

Calculate CREATE2 contract address from deployer, salt, and init code.

```typescript
Address.calculateCreate2Address.call(
  deployer: Address,
  salt: Uint8Array,
  initCode: Uint8Array
): Address
```

**Parameters:**
- `deployer` - Deployer address
- `salt` - 32-byte salt
- `initCode` - Contract initialization code

**Returns:** Calculated contract address

**Throws:** If salt is not exactly 32 bytes

**Algorithm:** `address = keccak256(0xff ++ sender ++ salt ++ keccak256(initCode))[12:32]`

```typescript
// Basic CREATE2
const deployer = Address.fromHex('0x0000000000000000000000000000000000000000');
const salt = new Uint8Array(32); // All zeros
const initCode = new Uint8Array([0]); // Single byte: 0x00

const addr = Address.calculateCreate2Address.call(deployer, salt, initCode);
// Verified against ethers.js v6.15.0 and EIP-1014 spec
console.log(Address.toHex.call(addr)); // "0x4d1a2e2bb4f88f0250f26ffff098b0b30b26bf38"

// Deterministic
const addr2 = Address.calculateCreate2Address.call(deployer, salt, initCode);
console.log(Address.equals.call(addr, addr2)); // true

// Different salts produce different addresses
const salt2 = new Uint8Array(32);
salt2[0] = 0x01;
const addrDiff = Address.calculateCreate2Address.call(deployer, salt2, initCode);
console.log(Address.equals.call(addr, addrDiff)); // false

// Invalid salt length throws
try {
  Address.calculateCreate2Address.call(deployer, new Uint8Array(31), initCode);
} catch (e) {
  console.error('Salt must be 32 bytes');
}

// Practical usage with constructor args
function predictCreate2Address(
  factory: Address,
  salt: Uint8Array,
  bytecode: Uint8Array,
  constructorArgs: Uint8Array
): Address {
  // Combine bytecode and constructor args
  const initCode = new Uint8Array(bytecode.length + constructorArgs.length);
  initCode.set(bytecode);
  initCode.set(constructorArgs, bytecode.length);

  return Address.calculateCreate2Address.call(factory, salt, initCode);
}
```

**Use Cases:**
- Deterministic contract deployment
- Counterfactual instantiation
- Minimal proxy pattern (EIP-1167)
- Cross-chain address consistency

## Comparison Operations

### compare

Compare two addresses lexicographically.

```typescript
Address.compare.call(addr1: Address, addr2: Address): number
```

**Returns:**
- `-1` if addr1 < addr2
- `0` if equal
- `1` if addr1 > addr2

```typescript
const addr1 = Address.fromNumber(1);
const addr2 = Address.fromNumber(2);
const addr3 = Address.fromNumber(1);

console.log(Address.compare.call(addr1, addr2)); // -1
console.log(Address.compare.call(addr2, addr1)); // 1
console.log(Address.compare.call(addr1, addr3)); // 0

// Sort addresses
const addresses = [
  Address.fromNumber(3),
  Address.fromNumber(1),
  Address.fromNumber(2),
];
addresses.sort((a, b) => Address.compare.call(a, b));
// [addr1, addr2, addr3] - sorted ascending
```

### lessThan

Check if this address is less than other.

```typescript
Address.lessThan.call(addr1: Address, addr2: Address): boolean
```

**Returns:** True if addr1 < addr2

```typescript
const addr1 = Address.fromNumber(1);
const addr2 = Address.fromNumber(2);

console.log(Address.lessThan.call(addr1, addr2)); // true
console.log(Address.lessThan.call(addr2, addr1)); // false
console.log(Address.lessThan.call(addr1, addr1)); // false
```

### greaterThan

Check if this address is greater than other.

```typescript
Address.greaterThan.call(addr1: Address, addr2: Address): boolean
```

**Returns:** True if addr1 > addr2

```typescript
const addr1 = Address.fromNumber(2);
const addr2 = Address.fromNumber(1);

console.log(Address.greaterThan.call(addr1, addr2)); // true
console.log(Address.greaterThan.call(addr2, addr1)); // false
console.log(Address.greaterThan.call(addr1, addr1)); // false
```

## Formatting Operations

### toShortHex

Format address with shortened display.

```typescript
Address.toShortHex.call(
  addr: Address,
  prefixLength?: number,
  suffixLength?: number
): string
```

**Parameters:**
- `prefixLength` - Number of chars to show at start (default: 6)
- `suffixLength` - Number of chars to show at end (default: 4)

**Returns:** Shortened address like "0x742d...51e3"

```typescript
const addr = Address.fromHex('0x742d35cc6634c0532925a3b844bc9e7595f251e3');

// Default formatting
console.log(Address.toShortHex.call(addr)); // "0x742d35...51e3"

// Custom lengths
console.log(Address.toShortHex.call(addr, 8, 6)); // "0x742d35cc...f251e3"

// Full address if lengths exceed 40
console.log(Address.toShortHex.call(addr, 20, 20)); // Full address

// UI display
function displayAddress(addr: Address): string {
  return `Address: ${Address.toShortHex.call(addr)}`;
}
```

### format

Format address for display (checksummed).

```typescript
Address.format.call(addr: Address): string
```

**Returns:** Checksummed hex string (EIP-55)

```typescript
const addr = Address.fromHex('0x742d35cc6634c0532925a3b844bc9e7595f251e3');
console.log(Address.format.call(addr));
// "0x742d35Cc6634c0532925a3b844bc9e7595F251E3"

// Alias for toChecksumHex
const checksummed = Address.toChecksumHex.call(addr);
console.log(Address.format.call(addr) === checksummed); // true
```

## Performance Characteristics

### Operation Complexity

| Operation | Complexity | Notes |
|-----------|-----------|-------|
| `fromHex` | O(n) | n = 20 bytes |
| `fromBytes` | O(n) | Copy operation |
| `fromNumber` | O(1) | Bit operations |
| `fromPublicKey` | O(m) | m = 64 bytes + keccak256 |
| `toHex` | O(n) | String conversion |
| `toChecksumHex` | O(n) | Includes keccak256 |
| `toU256` | O(n) | Bit shift loop |
| `isZero` | O(n) | Constant-time check |
| `equals` | O(n) | Byte comparison |
| `isValid` | O(n) | String validation |
| `isValidChecksum` | O(n) | Checksum verification |
| `is` | O(1) | Type check |
| `zero` | O(n) | Allocation |
| `calculateCreateAddress` | O(k) | k = RLP + keccak256 |
| `calculateCreate2Address` | O(m) | m = initCode size + keccak256 |
| `compare` | O(n) | Byte comparison |
| `lessThan` | O(n) | Via compare |
| `greaterThan` | O(n) | Via compare |
| `toShortHex` | O(n) | String formatting |
| `format` | O(n) | Via toChecksumHex |

Where n = 20 bytes (address size)

### Benchmark Results

Based on comparative benchmarks against ethers.js and viem:

**Address Parsing:**
- `Address.fromHex()`: 2-5x faster than ethers/viem (native/WASM)
- Simple hex parsing with validation

**Checksumming:**
- `Address.toChecksumHex()`: Comparable to ethers/viem
- Dominated by Keccak-256 hashing cost

**Validation:**
- `Address.isValid()`: 10-20x faster (no parsing needed)
- `Address.isValidChecksum()`: Comparable (requires keccak256)

**Comparison:**
- `Address.equals()`: 5-10x faster than string comparison
- Direct byte comparison

**Contract Address Calculation:**
- `calculateCreateAddress()`: Comparable to ethers/viem
- Dominated by RLP encoding + Keccak-256
- `calculateCreate2Address()`: Comparable performance
- Dominated by Keccak-256 hashing

## Best Practices

### 1. Validate User Input

```typescript
// Good: Validate before parsing
function acceptAddress(input: string): Address {
  if (!Address.isValid(input)) {
    throw new Error('Invalid address format');
  }
  return Address.fromHex(input.startsWith('0x') ? input : `0x${input}`);
}

// Bad: Assuming valid input
function unsafeAccept(input: string): Address {
  return Address.fromHex(input); // May throw cryptic errors
}
```

### 2. Use Checksum Validation

```typescript
// Good: Warn on invalid checksum
function parseAddress(hex: string): Address {
  const addr = Address.fromHex(hex);
  if (!Address.isValidChecksum(hex)) {
    console.warn('Address checksum invalid - possible typo');
  }
  return addr;
}

// Bad: Ignoring checksum
function noChecksum(hex: string): Address {
  return Address.fromHex(hex); // Loses checksum safety
}
```

### 3. Handle Zero Address

```typescript
// Good: Check for zero address
function transfer(to: Address, amount: bigint): void {
  if (Address.isZero.call(to)) {
    throw new Error('Cannot transfer to zero address');
  }
  // Proceed with transfer
}

// Bad: Allowing zero address
function unsafeTransfer(to: Address, amount: bigint): void {
  // No validation - burns tokens!
}
```

### 4. Use Type Guards

```typescript
// Good: Check types before operations
function processValue(value: unknown): string {
  if (Address.is(value)) {
    return Address.toHex.call(value);
  }
  throw new Error('Not an address');
}

// Bad: Assuming types
function unsafeProcess(value: any): string {
  return Address.toHex.call(value); // May crash
}
```

## WASM Usage

WASM-accelerated address operations available via separate module:

```typescript
import { Address as WasmAddress } from '@tevm/voltaire';

// Same API as TypeScript implementation
const addr = WasmAddress.fromHex('0x742d35Cc6634C0532925a3b844Bc9e7595f251e3');
const checksummed = addr.toChecksumHex();

// Contract address calculation
const contractAddr = WasmAddress.calculateCreateAddress(deployer, nonce);
const create2Addr = WasmAddress.calculateCreate2Address(deployer, salt, initCode);
```

**When to Use WASM:**
- High-frequency address operations
- Large-scale address validation
- Contract address calculation in loops
- Performance-critical applications

**When to Use TypeScript:**
- Simple one-off operations
- Minimal bundle size required
- Development and debugging
- Maximum compatibility

## Implementation Status

### ✅ Fully Implemented (TypeScript)
- All creation functions (fromHex, fromBytes, fromNumber, fromPublicKey)
- Universal constructor (from)
- All conversion functions (toHex, toChecksumHex, toU256)
- All validation functions (isZero, equals, isValid, isValidChecksum, is)
- Special addresses (zero)
- Contract address calculation (CREATE and CREATE2)
- All comparison operations (compare, lessThan, greaterThan)
- All formatting operations (toShortHex, format)
- Complete test coverage (300+ tests)

### ✅ Fully Implemented (Zig)
- All address operations
- CREATE/CREATE2 address calculation
- EIP-55 checksum validation
- Public key derivation
- Comprehensive test coverage

### ✅ Available (WASM)
- All TypeScript operations available via WASM
- Same API surface
- Performance optimized for high-frequency operations

## References

- [EIP-55: Mixed-case checksum address encoding](https://eips.ethereum.org/EIPS/eip-55)
- [EIP-1014: Skinny CREATE2](https://eips.ethereum.org/EIPS/eip-1014)
- [Ethereum Yellow Paper](https://ethereum.github.io/yellowpaper/paper.pdf) - Address derivation
- [secp256k1](https://en.bitcoin.it/wiki/Secp256k1) - Public key cryptography

## API Summary

### Constants
- `SIZE` - Address size (20 bytes)
- `HEX_SIZE` - Hex string size (42 chars)

### Creation
- `from(value)` - Universal constructor
- `fromHex(hex)` - Parse hex string
- `fromBytes(bytes)` - From raw bytes
- `fromNumber(value)` - From number/bigint
- `fromPublicKey(x, y)` - From secp256k1 public key
- `zero()` - Create zero address

### Conversion
- `toHex.call(addr)` - To lowercase hex
- `toChecksumHex.call(addr)` - To EIP-55 checksummed hex
- `toU256.call(addr)` - To bigint
- `format.call(addr)` - To checksummed hex (alias)
- `toShortHex.call(addr, prefix?, suffix?)` - To shortened display

### Validation
- `isZero.call(addr)` - Check if zero address
- `equals.call(addr1, addr2)` - Check equality
- `isValid(str)` - Validate format
- `isValidChecksum(str)` - Validate EIP-55 checksum
- `is(value)` - Type guard

### Contract Addresses
- `calculateCreateAddress.call(deployer, nonce)` - CREATE address
- `calculateCreate2Address.call(deployer, salt, initCode)` - CREATE2 address

### Comparison
- `compare.call(addr1, addr2)` - Lexicographic comparison
- `lessThan.call(addr1, addr2)` - Less than check
- `greaterThan.call(addr1, addr2)` - Greater than check

### Error Types
- `InvalidHexFormatError` - Invalid hex format
- `InvalidHexStringError` - Invalid hex characters
- `InvalidAddressLengthError` - Wrong length
- `InvalidValueError` - Invalid value input
- `NotImplementedError` - Feature not implemented

### Branded Types
- `Address` - 20-byte address type
- `ChecksumHex` - EIP-55 checksummed hex string
