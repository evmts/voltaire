import { BrandedBloomFilter } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'

type BloomFilterType = BrandedBloomFilter.BloomFilterType

/**
 * Adds an item to the bloom filter.
 * Mutates the filter in place.
 * 
 * @param filter - The bloom filter to add to
 * @param item - The bytes to add to the filter
 * @returns Effect yielding void (always succeeds)
 * 
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as BloomFilter from 'voltaire-effect/primitives/BloomFilter'
 * 
 * await Effect.runPromise(BloomFilter.add(filter, topic))
 * ```
 * 
 * @since 0.0.1
 */
export const add = (filter: BloomFilterType, item: Uint8Array): Effect.Effect<void, never> =>
  Effect.sync(() => BrandedBloomFilter.add(filter, item))
