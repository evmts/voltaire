/**
 * @fileoverview Function for deserializing bloom filters from hex strings.
 * @module BloomFilter/fromHex
 * @since 0.0.1
 *
 * @description
 * Restores a previously serialized bloom filter from its hex representation.
 */

import { BrandedBloomFilter } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'

/**
 * The BloomFilter type from the base library.
 * @internal
 */
type BloomFilterType = BrandedBloomFilter.BloomFilterType

/**
 * Creates a bloom filter from hex string.
 *
 * @description
 * Restores a previously serialized bloom filter from its hex representation.
 * The filter parameters (m and k) must match the original filter.
 *
 * @param hex - Hex-encoded filter data (from toHex)
 * @param m - Size of filter in bits (must match original)
 * @param k - Number of hash functions (must match original)
 * @returns Effect yielding BloomFilterType or failing with Error
 *
 * @example
 * ```typescript
 * import * as Effect from 'effect/Effect'
 * import * as BloomFilter from 'voltaire-effect/primitives/BloomFilter'
 *
 * // Restore a serialized filter
 * const hex = '0x00000000...'  // Previously serialized filter
 * const filter = await Effect.runPromise(BloomFilter.fromHex(hex, 2048, 3))
 *
 * // Check if restored filter contains expected items
 * const hasItem = BloomFilter.contains(filter, topic)
 *
 * // In Effect.gen
 * const program = Effect.gen(function* () {
 *   const filter = yield* BloomFilter.fromHex(storedHex, 2048, 3)
 *   if (BloomFilter.contains(filter, searchTopic)) {
 *     console.log('Topic might be in filter')
 *   }
 *   return filter
 * })
 * ```
 *
 * @throws {Error} When hex is invalid or parameters don't match
 * @see {@link toHex} for serializing filters
 * @see {@link create} for creating new filters
 * @since 0.0.1
 */
export const fromHex = (hex: string, m: number, k: number): Effect.Effect<BloomFilterType, Error> =>
  Effect.try({
    try: () => BrandedBloomFilter.fromHex(hex, m, k),
    catch: (e) => e as Error
  })
