// Demonstrate merging multiple bloom filters for range queries
import { BloomFilter, BITS, DEFAULT_HASH_COUNT } from '../../../src/primitives/BloomFilter/index.js'

console.log('Merging Bloom Filters\n')

// Create filters for simulated "blocks"
const encoder = new TextEncoder()

const block1Filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT)
block1Filter.add(encoder.encode('address1'))
block1Filter.add(encoder.encode('Transfer'))
block1Filter.add(encoder.encode('topic1'))

const block2Filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT)
block2Filter.add(encoder.encode('address2'))
block2Filter.add(encoder.encode('Approval'))
block2Filter.add(encoder.encode('topic2'))

const block3Filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT)
block3Filter.add(encoder.encode('address3'))
block3Filter.add(encoder.encode('Swap'))
block3Filter.add(encoder.encode('topic3'))

console.log('Created 3 block filters with different items')
console.log(`  Block 1: address1, Transfer, topic1`)
console.log(`  Block 2: address2, Approval, topic2`)
console.log(`  Block 3: address3, Swap, topic3`)

// Merge individual filters
console.log('\nMerging block 1 and block 2:')
const merged12 = block1Filter.merge(block2Filter)
console.log(`  Contains address1: ${merged12.contains(encoder.encode('address1'))}`)
console.log(`  Contains address2: ${merged12.contains(encoder.encode('address2'))}`)
console.log(`  Contains address3: ${merged12.contains(encoder.encode('address3'))}`)

// Merge all three filters using reduce pattern
console.log('\nMerging all blocks using reduce:')
const filters = [block1Filter, block2Filter, block3Filter]
const rangeFilter = filters.reduce(
  (acc, filter) => acc.merge(filter),
  BloomFilter.create(BITS, DEFAULT_HASH_COUNT)
)

console.log('Merged filter contains items from all blocks:')
console.log(`  Contains address1: ${rangeFilter.contains(encoder.encode('address1'))}`)
console.log(`  Contains address2: ${rangeFilter.contains(encoder.encode('address2'))}`)
console.log(`  Contains address3: ${rangeFilter.contains(encoder.encode('address3'))}`)
console.log(`  Contains Transfer: ${rangeFilter.contains(encoder.encode('Transfer'))}`)
console.log(`  Contains Approval: ${rangeFilter.contains(encoder.encode('Approval'))}`)
console.log(`  Contains Swap: ${rangeFilter.contains(encoder.encode('Swap'))}`)

// Check for non-member (quick rejection)
console.log('\nQuick rejection of non-members:')
const nonMember = encoder.encode('Burn')
if (!rangeFilter.contains(nonMember)) {
  console.log('  "Burn" definitely not in any block - skip detailed scan')
} else {
  console.log('  "Burn" might be in range - need to check individual blocks')
}

// Demonstrate use case: block range query
console.log('\nUse case - Block range query:')
console.log('Given: blocks 1000-1002, want to find Transfer events')
const transferBytes = encoder.encode('Transfer')

// Quick check with merged filter
if (rangeFilter.contains(transferBytes)) {
  console.log('1. Merged filter says Transfer might exist in range')
  console.log('2. Check individual blocks:')

  if (block1Filter.contains(transferBytes)) console.log('   - Block 1000 might contain Transfer')
  if (block2Filter.contains(transferBytes)) console.log('   - Block 1001 might contain Transfer')
  if (block3Filter.contains(transferBytes)) console.log('   - Block 1002 might contain Transfer')

  console.log('3. Fetch logs only from candidate blocks')
} else {
  console.log('Transfer definitely not in range - skip all blocks')
}
