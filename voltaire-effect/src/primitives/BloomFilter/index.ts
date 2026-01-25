/**
 * @fileoverview BloomFilter module for Ethereum log bloom filters.
 * @module BloomFilter
 * @since 0.0.1
 *
 * @description
 * Bloom filters are probabilistic data structures used in Ethereum for efficient
 * log searching. Each block contains a logs bloom filter (2048 bits, 3 hash functions)
 * that allows quick checking of whether a block might contain relevant logs.
 *
 * Key properties:
 * - False positives possible: "maybe in set" could be wrong
 * - False negatives impossible: "not in set" is always correct
 * - Space efficient: Compact representation of set membership
 * - Fast lookups: O(k) where k is number of hash functions
 *
 * This module provides:
 * - Creation of bloom filters with configurable parameters
 * - Adding items to filters
 * - Probabilistic membership testing
 * - Serialization to/from hex
 * - Effect Schema for validation
 *
 * @example
 * ```typescript
 * import * as BloomFilter from 'voltaire-effect/primitives/BloomFilter'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   // Create a filter (Ethereum uses 2048 bits, 3 hash functions)
 *   const filter = yield* BloomFilter.create(2048, 3)
 *
 *   // Add items
 *   yield* BloomFilter.add(filter, transferEventTopic)
 *   yield* BloomFilter.add(filter, contractAddress)
 *
 *   // Check membership
 *   if (BloomFilter.contains(filter, searchTopic)) {
 *     console.log('Topic might be in filter')
 *   }
 *
 *   // Check if empty
 *   console.log(BloomFilter.isEmpty(filter))  // false
 *
 *   // Serialize for storage
 *   const hex = BloomFilter.toHex(filter)
 *
 *   // Restore later
 *   const restored = yield* BloomFilter.fromHex(hex, 2048, 3)
 *
 *   return filter
 * })
 * ```
 *
 * @see {@link create} for creating new filters
 * @see {@link add} for adding items
 * @see {@link contains} for membership testing
 * @see {@link BloomFilterSchema} for Effect Schema validation
 */

export { BloomFilterSchema, BloomFilterSchema as Schema } from './BloomFilterSchema.js'
export { create } from './create.js'
export { fromHex } from './fromHex.js'
export { add } from './add.js'
export { contains } from './contains.js'
export { toHex } from './toHex.js'
export { isEmpty } from './isEmpty.js'
