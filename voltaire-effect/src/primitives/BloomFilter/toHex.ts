/**
 * @fileoverview Function for serializing bloom filters to hex strings.
 * @module BloomFilter/toHex
 * @since 0.0.1
 *
 * @description
 * Serializes a bloom filter to a hex string for storage or transmission.
 */

import { BrandedBloomFilter } from '@tevm/voltaire'

/**
 * The BloomFilter type from the base library.
 * @internal
 */
type BloomFilterType = BrandedBloomFilter.BloomFilterType

/**
 * Converts a bloom filter to hex string.
 *
 * @description
 * Serializes the bloom filter's byte data to a hex string with 0x prefix.
 * This is useful for:
 * - Storing filters in databases
 * - Transmitting filters over JSON-RPC
 * - Comparing filter contents
 *
 * This is a pure function that never throws. It does not use Effect
 * because serialization is a simple synchronous operation.
 *
 * Note: To restore the filter, you must also save the m and k parameters.
 *
 * @param filter - The bloom filter to serialize
 * @returns Hex-encoded filter data with 0x prefix
 *
 * @example
 * ```typescript
 * import * as BloomFilter from 'voltaire-effect/primitives/BloomFilter'
 * import * as Effect from 'effect/Effect'
 *
 * // Serialize for storage
 * const hex = BloomFilter.toHex(filter)
 * console.log(hex)  // '0x00000000...'
 *
 * // Store filter with parameters
 * const stored = {
 *   data: BloomFilter.toHex(filter),
 *   m: filter.m,
 *   k: filter.k
 * }
 * await saveToDatabase(stored)
 *
 * // Later, restore the filter
 * const program = Effect.gen(function* () {
 *   const stored = yield* loadFromDatabase()
 *   const filter = yield* BloomFilter.fromHex(stored.data, stored.m, stored.k)
 *   return filter
 * })
 * ```
 *
 * @see {@link fromHex} for deserializing filters
 * @since 0.0.1
 */
export const toHex = (filter: BloomFilterType): string =>
  BrandedBloomFilter.toHex(filter)
