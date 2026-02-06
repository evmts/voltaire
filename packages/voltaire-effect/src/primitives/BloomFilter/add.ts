/**
 * @module add
 * @description Add item to BloomFilter (pure, in-place mutation)
 * @since 0.1.0
 */
import { BloomFilter, type BloomFilterType } from "@tevm/voltaire/BloomFilter";

/**
 * Add an item to a BloomFilter (mutates in place)
 *
 * @param filter - The bloom filter
 * @param item - Item to add (Uint8Array)
 * @example
 * ```typescript
 * import * as BloomFilter from 'voltaire-effect/primitives/BloomFilter'
 * import * as Effect from 'effect/Effect'
 *
 * const filter = await Effect.runPromise(BloomFilter.create(2048, 3))
 * BloomFilter.add(filter, new Uint8Array([1, 2, 3]))
 * ```
 */
export const add = (filter: BloomFilterType, item: Uint8Array): void =>
	BloomFilter.add(filter, item);
