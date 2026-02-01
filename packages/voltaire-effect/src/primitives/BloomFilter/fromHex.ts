/**
 * @module fromHex
 * @description Create BloomFilter from hex string with Effect error handling
 * @since 0.1.0
 */
import { Effect } from "effect";
import {
	BloomFilter,
	type BloomFilterType,
	InvalidBloomFilterLengthError,
} from "@tevm/voltaire/BloomFilter";

/**
 * Create BloomFilter from hex string
 *
 * @param hex - Hex string (with or without 0x prefix)
 * @param m - Number of bits
 * @param k - Number of hash functions
 * @returns Effect yielding BloomFilterType or failing with InvalidBloomFilterLengthError
 * @example
 * ```typescript
 * import * as BloomFilter from 'voltaire-effect/primitives/BloomFilter'
 * import * as Effect from 'effect/Effect'
 *
 * const program = BloomFilter.fromHex('0x00...', 2048, 3)
 * const filter = await Effect.runPromise(program)
 * ```
 */
export const fromHex = (
	hex: string,
	m: number,
	k: number,
): Effect.Effect<BloomFilterType, InvalidBloomFilterLengthError> =>
	Effect.try({
		try: () => BloomFilter.fromHex(hex, m, k),
		catch: (e) => e as InvalidBloomFilterLengthError,
	});
