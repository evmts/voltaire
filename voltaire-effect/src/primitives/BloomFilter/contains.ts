/**
 * @fileoverview Function for checking membership in bloom filters.
 * @module BloomFilter/contains
 * @since 0.0.1
 *
 * @description
 * Tests whether an item might be in the bloom filter.
 * Returns false negatives never, but may return false positives.
 */

import { BrandedBloomFilter } from '@tevm/voltaire'

/**
 * The BloomFilter type from the base library.
 * @internal
 */
type BloomFilterType = BrandedBloomFilter.BloomFilterType

/**
 * Checks if an item might be in the bloom filter.
 *
 * @description
 * Tests set membership probabilistically:
 * - Returns true: Item MIGHT be in the filter (could be false positive)
 * - Returns false: Item is DEFINITELY NOT in the filter
 *
 * This is a pure function that never throws. It does not use Effect
 * because membership testing is a simple synchronous operation.
 *
 * @param filter - The bloom filter to check
 * @param item - The bytes to check for membership
 * @returns true if possibly in set, false if definitely not
 *
 * @example
 * ```typescript
 * import * as BloomFilter from 'voltaire-effect/primitives/BloomFilter'
 * import * as Effect from 'effect/Effect'
 *
 * // Check if topic might be in filter
 * if (BloomFilter.contains(filter, transferEventTopic)) {
 *   // Topic MIGHT be in filter - need to verify with actual log scan
 *   console.log('Possible match, checking logs...')
 * } else {
 *   // Topic is DEFINITELY NOT in filter - can skip this block
 *   console.log('No matching logs in this block')
 * }
 *
 * // In Effect.gen for filtering blocks
 * const program = Effect.gen(function* () {
 *   const blocks = yield* getBlocks()
 *
 *   // Quick filter using bloom
 *   const possibleMatches = blocks.filter(block =>
 *     BloomFilter.contains(block.logsBloom, searchTopic)
 *   )
 *
 *   // Only scan logs in blocks that might have matches
 *   return yield* scanLogsInBlocks(possibleMatches)
 * })
 * ```
 *
 * @see {@link add} for adding items to filters
 * @see {@link isEmpty} for checking if filter is empty
 * @since 0.0.1
 */
export const contains = (filter: BloomFilterType, item: Uint8Array): boolean =>
  BrandedBloomFilter.contains(filter, item)
