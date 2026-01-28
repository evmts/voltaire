/**
 * @module create
 * @description Create BloomFilter with Effect error handling
 * @since 0.1.0
 */
import { Effect } from "effect";
import {
	BloomFilter,
	type BloomFilterType,
	InvalidBloomFilterParameterError,
} from "@tevm/voltaire/BloomFilter";

/**
 * Create a new BloomFilter with specified parameters
 *
 * @param m - Number of bits in the filter
 * @param k - Number of hash functions
 * @returns Effect yielding BloomFilterType or failing with InvalidBloomFilterParameterError
 * @example
 * ```typescript
 * import * as BloomFilter from 'voltaire-effect/primitives/BloomFilter'
 * import * as Effect from 'effect/Effect'
 *
 * const program = BloomFilter.create(2048, 3)
 * const filter = await Effect.runPromise(program)
 * ```
 */
export const create = (
	m: number,
	k: number,
): Effect.Effect<BloomFilterType, InvalidBloomFilterParameterError> =>
	Effect.try({
		try: () => BloomFilter.create(m, k),
		catch: (e) => e as InvalidBloomFilterParameterError,
	});
