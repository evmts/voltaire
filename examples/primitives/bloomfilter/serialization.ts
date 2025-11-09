// Demonstrate bloom filter serialization and restoration
import { BloomFilter, BITS, DEFAULT_HASH_COUNT } from '../../../src/primitives/BloomFilter/index.js'
import * as BrandedBloomFilter from '../../../src/primitives/BloomFilter/BrandedBloomFilter/index.js'

console.log('Bloom Filter Serialization\n')

// Create and populate a filter
const original = BloomFilter.create(BITS, DEFAULT_HASH_COUNT)
const encoder = new TextEncoder()

const items = ['Transfer', 'Approval', 'Swap', 'Mint', 'Burn']
console.log('Creating filter with items:', items.join(', '))

for (const item of items) {
  original.add(encoder.encode(item))
}

// Serialize to hex
const hexString = original.toHex()
console.log(`\nSerialized to hex (${hexString.length} chars):`)
console.log(`  ${hexString.slice(0, 40)}...${hexString.slice(-40)}`)

// Show metadata
console.log('\nFilter metadata:')
console.log(`  Bits (m): ${original.m}`)
console.log(`  Hash functions (k): ${original.k}`)
console.log(`  Byte length: ${original.length}`)

// Restore from hex
console.log('\nRestoring filter from hex...')
const restored = BrandedBloomFilter.fromHex(hexString, BITS, DEFAULT_HASH_COUNT)

// Verify restoration
console.log('\nVerifying restored filter:')
for (const item of items) {
  const contains = BrandedBloomFilter.contains(restored, encoder.encode(item))
  console.log(`  Contains "${item}": ${contains ? '✓' : '✗'}`)
}

// Verify metadata
console.log('\nRestored metadata:')
console.log(`  Bits (m): ${restored.m}`)
console.log(`  Hash functions (k): ${restored.k}`)
console.log(`  Byte length: ${restored.length}`)

// Demonstrate storage format
console.log('\nStorage format example (JSON):')
const storageFormat = {
  hex: hexString,
  m: original.m,
  k: original.k,
  timestamp: new Date().toISOString(),
  itemCount: items.length,
}
console.log(JSON.stringify(storageFormat, null, 2).slice(0, 200) + '...')

// Demonstrate round-trip preservation
console.log('\nRound-trip verification:')
const originalHex = original.toHex()
const restoredHex = BrandedBloomFilter.toHex(restored)
const identical = originalHex === restoredHex
console.log(`  Hex strings identical: ${identical ? '✓' : '✗'}`)

// Demonstrate byte-level comparison
let matchingBytes = 0
for (let i = 0; i < original.length; i++) {
  if (original[i] === restored[i]) matchingBytes++
}
console.log(`  Matching bytes: ${matchingBytes}/${original.length}`)

// Example: Multiple filters in storage
console.log('\nExample: Storing multiple block filters')

interface BlockFilter {
  blockNumber: number
  hex: string
  m: number
  k: number
}

const blockFilters: BlockFilter[] = []

for (let blockNum = 1000; blockNum < 1003; blockNum++) {
  const blockFilter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT)

  // Simulate adding block-specific data
  blockFilter.add(encoder.encode(`block-${blockNum}`))
  blockFilter.add(encoder.encode(`data-${blockNum}`))

  blockFilters.push({
    blockNumber: blockNum,
    hex: blockFilter.toHex(),
    m: blockFilter.m,
    k: blockFilter.k,
  })
}

console.log(`Stored ${blockFilters.length} block filters`)
console.log('Sample entry:')
console.log(JSON.stringify({
  blockNumber: blockFilters[0].blockNumber,
  hex: blockFilters[0].hex.slice(0, 40) + '...',
  m: blockFilters[0].m,
  k: blockFilters[0].k,
}, null, 2))

// Restore and query
console.log('\nRestoring and querying block 1001:')
const block1001Data = blockFilters.find(b => b.blockNumber === 1001)!
const block1001Filter = BrandedBloomFilter.fromHex(block1001Data.hex, block1001Data.m, block1001Data.k)

const queryItem = encoder.encode('block-1001')
console.log(`  Contains "block-1001": ${BrandedBloomFilter.contains(block1001Filter, queryItem)}`)

// Demonstrate hex format with/without prefix
console.log('\nHex format handling:')
const withPrefix = original.toHex()  // Returns with 0x
const withoutPrefix = withPrefix.slice(2)

console.log(`  With prefix: ${withPrefix.slice(0, 20)}...`)
console.log(`  Without prefix: ${withoutPrefix.slice(0, 18)}...`)

// Both formats work for fromHex
const fromWith = BrandedBloomFilter.fromHex(withPrefix, BITS, DEFAULT_HASH_COUNT)
const fromWithout = BrandedBloomFilter.fromHex(withoutPrefix, BITS, DEFAULT_HASH_COUNT)

console.log(`  Both restore correctly: ${BrandedBloomFilter.toHex(fromWith) === BrandedBloomFilter.toHex(fromWithout)}`)
