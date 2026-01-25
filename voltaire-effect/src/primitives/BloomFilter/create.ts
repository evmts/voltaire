/**
 * @fileoverview Function for creating new bloom filters.
 * @module BloomFilter/create
 * @since 0.0.1
 *
 * @description
 * Creates empty bloom filters with specified size and hash function count.
 */

import { BrandedBloomFilter } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'

/**
 * The BloomFilter type from the base library.
 * @internal
 */
type BloomFilterType = BrandedBloomFilter.BloomFilterType

/**
 * Creates a new empty bloom filter.
 *
 * @description
 * Creates a bloom filter with the specified parameters:
 * - m: Size of the filter in bits (larger = fewer false positives, more memory)
 * - k: Number of hash functions (more = fewer false positives, slower operations)
 *
 * Optimal k for a given m and expected n items: k = (m/n) * ln(2)
 *
 * @param m - Size of filter in bits
 * @param k - Number of hash functions
 * @returns Effect yielding BloomFilterType or failing with Error
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as BloomFilter from 'voltaire-effect/primitives/BloomFilter'
 *
 * // Create a standard Ethereum logs bloom (2048 bits, 3 hash functions)
 * const filter = await Effect.runPromise(BloomFilter.create(2048, 3))
 *
 * // Create a larger filter for fewer false positives
 * const largeFilter = await Effect.runPromise(BloomFilter.create(4096, 5))
 *
 * // In Effect.gen
 * const program = Effect.gen(function* () {
 *   const filter = yield* BloomFilter.create(2048, 3)
 *   yield* BloomFilter.add(filter, topic)
 *   return filter
 * })
 * ```
 *
 * @throws {Error} When parameters are invalid (e.g., m <= 0 or k <= 0)
 * @see {@link fromHex} for restoring serialized filters
 * @see {@link add} for adding items to filters
 * @since 0.0.1
 */
export const create = (m: number, k: number): Effect.Effect<BloomFilterType, Error> =>
  Effect.try({
    try: () => BrandedBloomFilter.create(m, k),
    catch: (e) => e as Error
  })
