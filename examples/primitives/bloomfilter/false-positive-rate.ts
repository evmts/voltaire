// Demonstrate false positive rates and parameter selection
import { BloomFilter } from '../../../src/primitives/BloomFilter/index.js'

// Test false positive rate with different parameters
function testFalsePositiveRate(m: number, k: number, numItems: number, testItems: number) {
  const filter = BloomFilter.create(m, k)

  // Add known items
  const encoder = new TextEncoder()
  for (let i = 0; i < numItems; i++) {
    filter.add(encoder.encode(`item-${i}`))
  }

  // Test items that were NOT added
  let falsePositives = 0
  for (let i = numItems; i < numItems + testItems; i++) {
    if (filter.contains(encoder.encode(`item-${i}`))) {
      falsePositives++
    }
  }

  const fpRate = falsePositives / testItems
  const theoretical = Math.pow(1 - Math.exp(-k * numItems / m), k)

  console.log(`Parameters: m=${m}, k=${k}, items=${numItems}`)
  console.log(`  Measured FP rate: ${(fpRate * 100).toFixed(2)}%`)
  console.log(`  Theoretical FP rate: ${(theoretical * 100).toFixed(2)}%`)
  console.log(`  Size: ${filter.length} bytes`)
  console.log()
}

console.log('False Positive Rate Analysis\n')

// Standard Ethereum parameters
console.log('Standard Ethereum (2048 bits, 3 hash functions):')
testFalsePositiveRate(2048, 3, 10, 1000)
testFalsePositiveRate(2048, 3, 50, 1000)
testFalsePositiveRate(2048, 3, 100, 1000)
testFalsePositiveRate(2048, 3, 200, 1000)

// Larger filter (lower false positives)
console.log('Larger filter (4096 bits, 5 hash functions):')
testFalsePositiveRate(4096, 5, 50, 1000)
testFalsePositiveRate(4096, 5, 100, 1000)

// Smaller filter (higher false positives)
console.log('Smaller filter (512 bits, 2 hash functions):')
testFalsePositiveRate(512, 2, 20, 1000)
testFalsePositiveRate(512, 2, 50, 1000)

// Demonstrate optimal k calculation
function computeOptimalK(m: number, n: number): number {
  return Math.ceil((m / n) * Math.log(2))
}

console.log('Optimal hash function count (k) for different scenarios:')
console.log(`  2048 bits, 50 items: k = ${computeOptimalK(2048, 50)}`)
console.log(`  2048 bits, 100 items: k = ${computeOptimalK(2048, 100)}`)
console.log(`  4096 bits, 100 items: k = ${computeOptimalK(4096, 100)}`)
console.log(`  1024 bits, 20 items: k = ${computeOptimalK(1024, 20)}`)
