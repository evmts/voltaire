// Simulate Ethereum log filtering with bloom filters
import { BloomFilter, BITS, DEFAULT_HASH_COUNT } from '../../../src/primitives/BloomFilter/index.js'

// Simulate Ethereum address (20 bytes)
function createAddress(name: string): Uint8Array {
  const encoder = new TextEncoder()
  const bytes = encoder.encode(name)
  const address = new Uint8Array(20)
  address.set(bytes.slice(0, Math.min(20, bytes.length)))
  return address
}

// Simulate event topic hash (32 bytes)
function createTopic(signature: string): Uint8Array {
  const encoder = new TextEncoder()
  const bytes = encoder.encode(signature)
  const topic = new Uint8Array(32)
  topic.set(bytes.slice(0, Math.min(32, bytes.length)))
  return topic
}

// Simulate an Ethereum log
interface Log {
  address: Uint8Array
  topics: Uint8Array[]
  data: string
}

// Build bloom filter for a block's logs
function buildBlockBloom(logs: Log[]): typeof BloomFilter.prototype {
  const filter = BloomFilter.create(BITS, DEFAULT_HASH_COUNT)

  for (const log of logs) {
    // Add address
    filter.add(log.address)

    // Add each topic
    for (const topic of log.topics) {
      filter.add(topic)
    }
  }

  return filter
}

console.log('Ethereum Log Filtering with Bloom Filters\n')

// Create some simulated logs
const usdcAddress = createAddress('USDC')
const daiAddress = createAddress('DAI')
const transferTopic = createTopic('Transfer(address,address,uint256)')
const approvalTopic = createTopic('Approval(address,address,uint256)')

// Block 1000 logs
const block1000Logs: Log[] = [
  { address: usdcAddress, topics: [transferTopic], data: '0x...' },
  { address: daiAddress, topics: [transferTopic], data: '0x...' },
]

// Block 1001 logs
const block1001Logs: Log[] = [
  { address: usdcAddress, topics: [approvalTopic], data: '0x...' },
]

// Block 1002 logs (empty)
const block1002Logs: Log[] = []

// Build bloom filters for each block
console.log('Building bloom filters for blocks 1000-1002...')
const block1000Bloom = buildBlockBloom(block1000Logs)
const block1001Bloom = buildBlockBloom(block1001Logs)
const block1002Bloom = buildBlockBloom(block1002Logs)

console.log(`  Block 1000: ${block1000Bloom.isEmpty() ? 'empty' : 'has logs'}`)
console.log(`  Block 1001: ${block1001Bloom.isEmpty() ? 'empty' : 'has logs'}`)
console.log(`  Block 1002: ${block1002Bloom.isEmpty() ? 'empty' : 'has logs'}`)

// Query 1: Find blocks with USDC transfers
console.log('\nQuery 1: Find blocks with USDC Transfer events')
console.log('Checking bloom filters:')

const targetAddress = usdcAddress
const targetTopic = transferTopic

let candidateBlocks: number[] = []

if (block1000Bloom.contains(targetAddress) && block1000Bloom.contains(targetTopic)) {
  console.log('  Block 1000: might contain USDC Transfer ✓')
  candidateBlocks.push(1000)
}

if (block1001Bloom.contains(targetAddress) && block1001Bloom.contains(targetTopic)) {
  console.log('  Block 1001: might contain USDC Transfer ✓')
  candidateBlocks.push(1001)
}

if (block1002Bloom.contains(targetAddress) && block1002Bloom.contains(targetTopic)) {
  console.log('  Block 1002: might contain USDC Transfer ✓')
  candidateBlocks.push(1002)
}

console.log(`\nCandidate blocks: ${candidateBlocks.join(', ')}`)
console.log('Next step: fetch logs only from candidate blocks')

// Query 2: Find blocks with DAI activity
console.log('\nQuery 2: Find blocks with DAI activity (any event)')
candidateBlocks = []

if (block1000Bloom.contains(daiAddress)) {
  console.log('  Block 1000: might have DAI logs ✓')
  candidateBlocks.push(1000)
}

if (block1001Bloom.contains(daiAddress)) {
  console.log('  Block 1001: might have DAI logs ✓')
  candidateBlocks.push(1001)
}

if (block1002Bloom.contains(daiAddress)) {
  console.log('  Block 1002: might have DAI logs ✓')
  candidateBlocks.push(1002)
}

if (candidateBlocks.length === 0) {
  console.log('  No candidate blocks - DAI definitely not active in range')
}

// Demonstrate efficiency
console.log('\nEfficiency demonstration:')
const totalBlocks = 3
const blocksScanned = candidateBlocks.length
const blocksSkipped = totalBlocks - blocksScanned
console.log(`  Total blocks: ${totalBlocks}`)
console.log(`  Blocks with bloom match: ${blocksScanned}`)
console.log(`  Blocks skipped: ${blocksSkipped} (${(blocksSkipped / totalBlocks * 100).toFixed(0)}% reduction)`)

// Demonstrate block range filter
console.log('\nBlock range optimization:')
const rangeBloom = block1000Bloom.merge(block1001Bloom).merge(block1002Bloom)

const wethAddress = createAddress('WETH')
if (!rangeBloom.contains(wethAddress)) {
  console.log('  WETH definitely not in blocks 1000-1002 - skip entire range ✓')
} else {
  console.log('  WETH might be in range - scan individual blocks')
}
