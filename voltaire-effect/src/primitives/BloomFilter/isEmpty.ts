/**
 * @fileoverview Function for checking if a bloom filter is empty.
 * @module BloomFilter/isEmpty
 * @since 0.0.1
 *
 * @description
 * Checks whether a bloom filter has had any items added to it.
 */

import { BrandedBloomFilter } from '@tevm/voltaire'

/**
 * The BloomFilter type from the base library.
 * @internal
 */
type BloomFilterType = BrandedBloomFilter.BloomFilterType

/**
 * Checks if the bloom filter is empty.
 *
 * @description
 * Returns true if no items have been added to the filter (all bits are 0).
 * This is useful for:
 * - Skipping empty filters during searches
 * - Validating filter state
 * - Optimizing queries
 *
 * This is a pure function that never throws. It does not use Effect
 * because checking emptiness is a simple synchronous operation.
 *
 * @param filter - The bloom filter to check
 * @returns true if no items have been added, false otherwise
 *
 * @example
 * ```typescript
 * import * as BloomFilter from 'voltaire-effect/primitives/BloomFilter'
 * import * as Effect from 'effect/Effect'
 *
 * // Check if filter is empty
 * const program = Effect.gen(function* () {
 *   const filter = yield* BloomFilter.create(2048, 3)
 *
 *   console.log(BloomFilter.isEmpty(filter))  // true (just created)
 *
 *   yield* BloomFilter.add(filter, topic)
 *
 *   console.log(BloomFilter.isEmpty(filter))  // false (has items)
 * })
 *
 * // Skip empty filters in block scanning
 * const blocksWithLogs = blocks.filter(block =>
 *   !BloomFilter.isEmpty(block.logsBloom)
 * )
 * ```
 *
 * @see {@link add} for adding items to filters
 * @see {@link contains} for checking membership
 * @since 0.0.1
 */
export const isEmpty = (filter: BloomFilterType): boolean =>
  BrandedBloomFilter.isEmpty(filter)
