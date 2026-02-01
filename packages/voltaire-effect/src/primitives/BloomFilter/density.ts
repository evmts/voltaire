/**
 * @module density
 * @description Calculate BloomFilter bit density (pure)
 * @since 0.1.0
 */
import { BloomFilter, type BloomFilterType } from "@tevm/voltaire/BloomFilter";

/**
 * Calculate the density (fill ratio) of a BloomFilter
 *
 * @param filter - The bloom filter
 * @returns Density as a number between 0 and 1
 * @example
 * ```typescript
 * import * as BloomFilter from 'voltaire-effect/primitives/BloomFilter'
 *
 * const d = BloomFilter.density(filter)
 * console.log(d) // e.g. 0.15
 * ```
 */
export const density = (filter: BloomFilterType): number =>
	BloomFilter.density(filter);
