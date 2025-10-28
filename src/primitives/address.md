# Address

Ethereum address type with EIP-55 checksumming and contract address calculation.

## Overview

`Address` represents a 20-byte Ethereum address as a branded `Uint8Array`. The type provides:
- EIP-55 checksumming for display
- Contract address calculation (CREATE and CREATE2)
- Type-safe address operations
- Zero-cost abstractions (no class overhead)

## Type Definition

```typescript
type Address = Uint8Array & { __tag: "Address" };
```

## API

### Creation

```typescript
// From hex string
const addr = Address.fromHex('0xa0cf798816d4b9b9866b5330eea46a18382f251e');

// From bytes (20-byte Uint8Array)
const addr = Address.fromBytes(bytes);

// From number (padded to 20 bytes)
const addr = Address.fromNumber(12345n);

// From public key (64-byte uncompressed)
const addr = Address.fromPublicKey(publicKey);
```

### Conversion

```typescript
// To lowercase hex string
const hex = Address.toHex.call(addr);  // "0xa0cf7988..."

// To EIP-55 checksummed hex
const checksum = Address.toChecksumHex.call(addr);  // "0xA0Cf7988..."

// To U256 (big-endian)
const u256 = Address.toU256.call(addr);
```

### Validation

```typescript
// Check if zero address
const isZero = Address.isZero.call(addr);  // addr === 0x0000...0000

// Compare addresses
const equal = Address.equals.call(addr1, addr2);

// Compare for sorting
const cmp = Address.compare.call(addr1, addr2);  // -1, 0, or 1

// Validate checksum
const valid = Address.validateChecksum('0xA0Cf798816D4b9b9866b5330EEa46a18382f251e');
```

### Contract Addresses

```typescript
// CREATE address (deployed by sender at nonce)
const contractAddr = Address.calculateCreateAddress(
    senderAddress,
    nonce
);

// CREATE2 address (deterministic deployment)
const contractAddr = Address.calculateCreate2Address(
    deployerAddress,
    salt,          // 32-byte value
    initCodeHash   // keccak256 of contract bytecode
);
```

### Display

```typescript
// Short format for UI (0x1234...5678)
const short = Address.toShortHex.call(addr, 4);  // 4 chars on each side

// Format with custom options
const formatted = Address.format.call(addr, {
    checksum: true,    // Use EIP-55 checksum
    prefix: true,      // Include 0x prefix
});
```

## EIP-55 Checksum

EIP-55 provides a backward-compatible checksum by capitalizing hex digits based on hash output:

```typescript
// Original: 0xa0cf798816d4b9b9866b5330eea46a18382f251e
// Checksum: 0xA0Cf798816D4b9b9866b5330EEa46a18382f251e
//            ↑  ↑       ↑                ↑↑

const checksummed = Address.toChecksumHex.call(addr);

// Validate user input
if (!Address.validateChecksum(userInput)) {
    throw new Error('Invalid checksum - possible typo');
}
```

## Contract Address Calculation

### CREATE (Standard Deployment)

Contract address from `CREATE` opcode:
```
address = keccak256(rlp([sender, nonce]))[12:]
```

```typescript
const deployer = Address.fromHex('0x...');
const nonce = 0;  // First deployment

const contractAddr = Address.calculateCreateAddress(deployer, nonce);
```

### CREATE2 (Deterministic Deployment)

Contract address from `CREATE2` opcode (EIP-1014):
```
address = keccak256(0xff ++ sender ++ salt ++ keccak256(initCode))[12:]
```

```typescript
const deployer = Address.fromHex('0x...');
const salt = new Uint8Array(32);  // User-chosen 32 bytes
const initCodeHash = Keccak256.hash(contractBytecode);

const contractAddr = Address.calculateCreate2Address(
    deployer,
    salt,
    initCodeHash
);
```

## Examples

### Validate User Input

```typescript
function validateAddress(input: string): Address {
    // Check format
    if (!input.match(/^0x[0-9a-fA-F]{40}$/)) {
        throw new Error('Invalid address format');
    }

    // Validate checksum if mixed case
    if (input !== input.toLowerCase() && input !== input.toUpperCase()) {
        if (!Address.validateChecksum(input)) {
            throw new Error('Invalid checksum');
        }
    }

    return Address.fromHex(input);
}
```

### Predict Contract Deployment

```typescript
import { Address, Keccak256 } from '@tevm/primitives';

// Deployer's address and current nonce
const deployer = Address.fromHex('0x742d35Cc6634C0532925a3b844Bc9e7595f0251e');
const nonce = 5;

// Predict where next contract will deploy
const futureAddress = Address.calculateCreateAddress(deployer, nonce);

console.log(`Next contract will deploy to: ${Address.toChecksumHex.call(futureAddress)}`);
```

### CREATE2 Factory Pattern

```typescript
// Deterministic deployment factory
function predictCreate2Address(
    factory: Address,
    bytecode: Uint8Array,
    salt: bigint
): Address {
    const initCodeHash = Keccak256.hash(bytecode);
    const saltBytes = new Uint8Array(32);
    new DataView(saltBytes.buffer).setBigUint64(24, salt, false);

    return Address.calculateCreate2Address(factory, saltBytes, initCodeHash);
}

// Usage
const factoryAddr = Address.fromHex('0x...');
const contractBytecode = new Uint8Array([0x60, 0x80, ...]);
const userSalt = 12345n;

const predictedAddr = predictCreate2Address(factoryAddr, contractBytecode, userSalt);
```

## Implementation Notes

### Data-First Architecture

`Address` is a branded `Uint8Array`, not a class:

```typescript
// ✅ Good - data-first
const addr: Address = Address.fromHex('0x...');
const hex = Address.toHex.call(addr);

// ❌ Not available - no classes
const addr = new Address('0x...');  // Doesn't exist
addr.toHex();  // Doesn't exist
```

### Performance

All operations are zero-copy where possible:
- `fromBytes()` validates but doesn't copy
- `toHex()` returns new string (required)
- Checksum validation is single-pass

### Zero Address

Special address `0x0000000000000000000000000000000000000000`:

```typescript
const zero = Address.zero();
const isZero = Address.isZero.call(addr);
```

Used for:
- Native ETH transfers (`to` field)
- Contract self-destruction (`SELFDESTRUCT`)
- Default/uninitialized values

## Zig API

The Zig implementation mirrors the TypeScript API:

```zig
const primitives = @import("primitives");
const Address = primitives.Address;

// Creation
const addr = try Address.fromHex("0xa0cf798816d4b9b9866b5330eea46a18382f251e");
const addr2 = try Address.fromBytes(&bytes);
const addr3 = Address.fromU256(u256_value);

// Conversion
const hex = addr.toHex();
const checksum = addr.toChecksumHex();
const u256 = addr.toU256();

// Validation
const is_zero = addr.isZero();
const is_equal = addr1.equals(addr2);
const is_valid = Address.isValidChecksum("0xA0Cf...");

// Contract addresses
const create_addr = try Address.calculateCreateAddress(allocator, sender, nonce);
defer allocator.free(create_addr);

const create2_addr = try Address.calculateCreate2Address(allocator, sender, salt, init_code);
defer allocator.free(create2_addr);
```

## References

- [EIP-55: Mixed-case checksum address encoding](https://eips.ethereum.org/EIPS/eip-55)
- [EIP-1014: Skinny CREATE2](https://eips.ethereum.org/EIPS/eip-1014)
- [Ethereum Yellow Paper](https://ethereum.github.io/yellowpaper/paper.pdf) (Address format: Section 4.1)

## Testing

Comprehensive test coverage in:
- `address.test.ts` - TypeScript unit tests (all scenarios)
- `address.zig` - Zig unit tests (41 test blocks)

Test vectors include:
- Valid/invalid hex strings
- Checksum validation (all-caps, all-lowercase, mixed-case)
- CREATE address calculation with known deployments
- CREATE2 address calculation with EIP-1014 test vectors
- Edge cases (zero address, max address)
- Public key to address derivation
