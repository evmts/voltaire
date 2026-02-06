/**
 * @module isEmpty
 * @description Check if BloomFilter is empty (pure predicate)
 * @since 0.1.0
 */
import { BloomFilter, type BloomFilterType } from "@tevm/voltaire/BloomFilter";

/**
 * Check if a BloomFilter is empty (all bits are zero)
 *
 * @param filter - The bloom filter
 * @returns true if filter is empty
 * @example
 * ```typescript
 * import * as BloomFilter from 'voltaire-effect/primitives/BloomFilter'
 *
 * const filter = await Effect.runPromise(BloomFilter.create(2048, 3))
 * BloomFilter.isEmpty(filter) // true
 * ```
 */
export const isEmpty = (filter: BloomFilterType): boolean =>
	BloomFilter.isEmpty(filter);
