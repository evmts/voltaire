/**
 * @fileoverview Function for adding items to bloom filters.
 * @module BloomFilter/add
 * @since 0.0.1
 *
 * @description
 * Adds items to bloom filters for later membership testing.
 */

import { BrandedBloomFilter } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'

/**
 * The BloomFilter type from the base library.
 * @internal
 */
type BloomFilterType = BrandedBloomFilter.BloomFilterType

/**
 * Adds an item to the bloom filter.
 *
 * @description
 * Adds the hash of an item to the bloom filter by setting the appropriate bits.
 * This operation mutates the filter in place.
 *
 * After adding an item:
 * - contains(filter, item) will return true
 * - The filter cannot be "un-added" (bloom filters don't support removal)
 *
 * @param filter - The bloom filter to add to
 * @param item - The bytes to add to the filter (will be hashed)
 * @returns Effect yielding void (always succeeds)
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as BloomFilter from 'voltaire-effect/primitives/BloomFilter'
 *
 * // Add a topic to the filter
 * const program = Effect.gen(function* () {
 *   const filter = yield* BloomFilter.create(2048, 3)
 *
 *   // Add event topic
 *   yield* BloomFilter.add(filter, transferEventTopic)
 *
 *   // Add contract address
 *   yield* BloomFilter.add(filter, contractAddress)
 *
 *   // Now contains() will return true for these items
 *   console.log(BloomFilter.contains(filter, transferEventTopic))  // true
 *   console.log(BloomFilter.contains(filter, contractAddress))     // true
 *
 *   return filter
 * })
 *
 * // Simple usage
 * await Effect.runPromise(BloomFilter.add(filter, topic))
 * ```
 *
 * @see {@link contains} for checking membership
 * @see {@link create} for creating filters
 * @since 0.0.1
 */
export const add = (filter: BloomFilterType, item: Uint8Array): Effect.Effect<void, never> =>
  Effect.sync(() => BrandedBloomFilter.add(filter, item))
