/**
 * Type Safety Example
 *
 * Demonstrates:
 * - Using Sized<N> type for compile-time safety
 * - Type guards with isSized
 * - Size assertions with assertSize
 * - Common Ethereum type aliases
 * - Type-safe function parameters
 */

import { Hex } from '@tevm/voltaire'
import type { BrandedHex, Sized } from '@tevm/voltaire/BrandedHex'

console.log('=== Type Safety ===\n')

// 1. Type aliases for common Ethereum sizes
console.log('1. Type aliases for common Ethereum sizes:')

// Define type aliases
type Hash = Sized<32>
type Address = Sized<20>
type Selector = Sized<4>
type U256 = Sized<32>
type Signature = Sized<65>

console.log('  Defined types:')
console.log('    Hash = Sized<32>')
console.log('    Address = Sized<20>')
console.log('    Selector = Sized<4>')
console.log('    U256 = Sized<32>')
console.log('    Signature = Sized<65>')

// 2. Creating sized values
console.log('\n2. Creating sized values:')

// Create and assert sizes
const hash: Hash = Hex.assertSize(Hex.random(32), 32)
const address: Address = Hex.assertSize(Hex('0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e'), 20)
const selector: Selector = Hex.assertSize(Hex('0xa9059cbb'), 4)

console.log(`  Hash: ${hash}`)
console.log(`  Address: ${address}`)
console.log(`  Selector: ${selector}`)

// 3. Type-safe functions
console.log('\n3. Type-safe functions:')

function processHash(hash: Hash): void {
  // TypeScript knows hash is exactly 32 bytes
  console.log(`  Processing hash: ${hash.slice(0, 20)}...`)
  console.log(`  Size: ${Hex.size(hash)} bytes`)
}

function processAddress(address: Address): void {
  // TypeScript knows address is exactly 20 bytes
  console.log(`  Processing address: ${address}`)
  console.log(`  Size: ${Hex.size(address)} bytes`)
}

function processSelector(selector: Selector): void {
  // TypeScript knows selector is exactly 4 bytes
  console.log(`  Processing selector: ${selector}`)
  console.log(`  Size: ${Hex.size(selector)} bytes`)
}

processHash(hash)
processAddress(address)
processSelector(selector)

// 4. Type guards with isSized
console.log('\n4. Type guards with isSized:')

function classifyValue(value: BrandedHex): string {
  if (Hex.isSized(value, 32)) {
    // TypeScript knows value is Sized<32>
    return `Hash or U256: ${value}`
  } else if (Hex.isSized(value, 20)) {
    // TypeScript knows value is Sized<20>
    return `Address: ${value}`
  } else if (Hex.isSized(value, 4)) {
    // TypeScript knows value is Sized<4>
    return `Selector: ${value}`
  } else {
    return `Other (${Hex.size(value)} bytes): ${value}`
  }
}

const values = [
  Hex.random(32),
  Hex.random(20),
  Hex.random(4),
  Hex.random(8),
]

values.forEach(v => {
  console.log(`  ${classifyValue(v)}`)
})

// 5. Size assertions
console.log('\n5. Size assertions:')

function createHash(value: BrandedHex): Hash {
  // Assert and return typed value
  return Hex.assertSize(value, 32)
}

function createAddress(value: BrandedHex): Address {
  return Hex.assertSize(value, 20)
}

try {
  const myHash = createHash(Hex.random(32))
  console.log(`  ✓ Created hash: ${myHash.slice(0, 20)}...`)

  const myAddress = createAddress(Hex('0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e'))
  console.log(`  ✓ Created address: ${myAddress}`)

  // This would throw
  // const wrongHash = createHash(Hex.random(20))
} catch (e) {
  console.log(`  ✗ Size assertion failed`)
}

// 6. Generic size functions
console.log('\n6. Generic size functions:')

function toFixedBytes<N extends number>(value: bigint, size: N): Sized<N> {
  return Hex.assertSize(Hex.fromBigInt(value, size), size)
}

const hash32 = toFixedBytes(0n, 32) // Sized<32>
const addr20 = toFixedBytes(0n, 20) // Sized<20>
const selector4 = toFixedBytes(0xa9059cbbn, 4) // Sized<4>

console.log(`  Hash (32 bytes): ${hash32}`)
console.log(`  Address (20 bytes): ${addr20}`)
console.log(`  Selector (4 bytes): ${selector4}`)

// 7. Discriminated unions with sized types
console.log('\n7. Discriminated unions:')

type EthValue =
  | { type: 'hash'; value: Hash }
  | { type: 'address'; value: Address }
  | { type: 'selector'; value: Selector }
  | { type: 'unknown'; value: BrandedHex }

function classify(hex: BrandedHex): EthValue {
  const size = Hex.size(hex)

  if (size === 32) {
    return { type: 'hash', value: Hex.assertSize(hex, 32) }
  } else if (size === 20) {
    return { type: 'address', value: Hex.assertSize(hex, 20) }
  } else if (size === 4) {
    return { type: 'selector', value: Hex.assertSize(hex, 4) }
  } else {
    return { type: 'unknown', value: hex }
  }
}

function handleValue(classified: EthValue): void {
  switch (classified.type) {
    case 'hash':
      console.log(`  Hash: ${classified.value.slice(0, 20)}...`)
      break
    case 'address':
      console.log(`  Address: ${classified.value}`)
      break
    case 'selector':
      console.log(`  Selector: ${classified.value}`)
      break
    case 'unknown':
      console.log(`  Unknown (${Hex.size(classified.value)} bytes)`)
      break
  }
}

const testValues = [
  Hex.random(32),
  Hex('0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e'),
  Hex('0xa9059cbb'),
  Hex.random(8),
]

testValues.forEach(v => handleValue(classify(v)))

// 8. Arrays of sized values
console.log('\n8. Arrays of sized values:')

const hashes: Hash[] = [
  Hex.assertSize(Hex.random(32), 32),
  Hex.assertSize(Hex.random(32), 32),
  Hex.assertSize(Hex.random(32), 32),
]

console.log(`  Created ${hashes.length} hashes:`)
hashes.forEach((h, i) => {
  console.log(`    ${i}: ${h.slice(0, 20)}...`)
})

const addresses: Address[] = [
  Hex.assertSize(Hex.random(20), 20),
  Hex.assertSize(Hex.random(20), 20),
]

console.log(`  Created ${addresses.length} addresses:`)
addresses.forEach((a, i) => {
  console.log(`    ${i}: ${a}`)
})

// 9. Safe conversions
console.log('\n9. Safe conversions:')

function hexToAddress(hex: BrandedHex): Address | null {
  if (!Hex.isSized(hex, 20)) {
    return null
  }
  return hex // TypeScript knows it's Sized<20>
}

function hexToHash(hex: BrandedHex): Hash | null {
  if (!Hex.isSized(hex, 32)) {
    return null
  }
  return hex // TypeScript knows it's Sized<32>
}

const testHex1 = Hex.random(20)
const testHex2 = Hex.random(32)
const testHex3 = Hex.random(8)

const addr1 = hexToAddress(testHex1)
const addr2 = hexToAddress(testHex2)
const addr3 = hexToAddress(testHex3)

console.log(`  20-byte hex → Address: ${addr1 ? '✓' : '✗'}`)
console.log(`  32-byte hex → Address: ${addr2 ? '✓' : '✗'}`)
console.log(`  8-byte hex → Address: ${addr3 ? '✓' : '✗'}`)

const hash1 = hexToHash(testHex1)
const hash2 = hexToHash(testHex2)

console.log(`  20-byte hex → Hash: ${hash1 ? '✓' : '✗'}`)
console.log(`  32-byte hex → Hash: ${hash2 ? '✓' : '✗'}`)

// 10. Compile-time size constants
console.log('\n10. Size constants:')

const HASH_SIZE = 32
const ADDRESS_SIZE = 20
const SELECTOR_SIZE = 4
const U256_SIZE = 32
const SIGNATURE_SIZE = 65

console.log(`  HASH_SIZE: ${HASH_SIZE} bytes`)
console.log(`  ADDRESS_SIZE: ${ADDRESS_SIZE} bytes`)
console.log(`  SELECTOR_SIZE: ${SELECTOR_SIZE} bytes`)
console.log(`  U256_SIZE: ${U256_SIZE} bytes`)
console.log(`  SIGNATURE_SIZE: ${SIGNATURE_SIZE} bytes`)

// Use in validation
function validateHash(hex: BrandedHex): Hash {
  return Hex.assertSize(hex, HASH_SIZE)
}

function validateAddress(hex: BrandedHex): Address {
  return Hex.assertSize(hex, ADDRESS_SIZE)
}

const validHash = validateHash(Hex.random(32))
const validAddr = validateAddress(Hex.random(20))

console.log(`  ✓ Validated hash: ${validHash.slice(0, 20)}...`)
console.log(`  ✓ Validated address: ${validAddr}`)

// 11. Zero values with types
console.log('\n11. Zero values with types:')

const ZERO_HASH: Hash = Hex.assertSize(Hex.zero(32), 32)
const ZERO_ADDRESS: Address = Hex.assertSize(Hex.zero(20), 20)

console.log(`  Zero hash: ${ZERO_HASH}`)
console.log(`  Zero address: ${ZERO_ADDRESS}`)

function isZeroHash(hash: Hash): boolean {
  return Hex.equals(hash, ZERO_HASH)
}

function isZeroAddress(address: Address): boolean {
  return Hex.equals(address, ZERO_ADDRESS)
}

const someHash = Hex.assertSize(Hex.random(32), 32)
const someAddr = Hex.assertSize(Hex.random(20), 20)

console.log(`  Random hash is zero: ${isZeroHash(someHash)}`)
console.log(`  Random address is zero: ${isZeroAddress(someAddr)}`)
console.log(`  Zero hash is zero: ${isZeroHash(ZERO_HASH)}`)
console.log(`  Zero address is zero: ${isZeroAddress(ZERO_ADDRESS)}`)

console.log('\n=== Example completed ===\n')
