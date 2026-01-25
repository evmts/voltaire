/**
 * @fileoverview Effect Schema for Ethereum bloom filters.
 * @module BloomFilter/BloomFilterSchema
 * @since 0.0.1
 *
 * @description
 * Bloom filters are probabilistic data structures used in Ethereum for efficient
 * log searching. Each block contains a logs bloom filter that allows quick checking
 * of whether a block might contain relevant logs without scanning all logs.
 */

import type { BrandedBloomFilter } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as Schema from "effect/Schema";

/**
 * The BloomFilter type representing a validated bloom filter structure.
 *
 * @description
 * A bloom filter is a Uint8Array with additional metadata:
 * - k: Number of hash functions
 * - m: Size of the filter in bits
 *
 * Bloom filters support probabilistic set membership testing:
 * - False positives are possible (says "maybe" when not present)
 * - False negatives are impossible (never says "no" when present)
 *
 * @example
 * ```typescript
 * import * as BloomFilter from 'voltaire-effect/primitives/BloomFilter'
 *
 * // Bloom filter is a Uint8Array with k and m properties
 * const filter: BloomFilterType = ...
 * console.log(filter.k)  // Number of hash functions
 * console.log(filter.m)  // Size in bits
 * ```
 *
 * @see {@link BloomFilterSchema} for validation
 * @see {@link create} for creating new filters
 * @since 0.0.1
 */
type BloomFilterType = BrandedBloomFilter.BloomFilterType;

/**
 * Internal schema for BloomFilter structure validation.
 * @internal
 */
const BloomFilterTypeSchema = Schema.declare<BloomFilterType>(
	(u): u is BloomFilterType => {
		if (typeof u !== "object" || u === null) return false;
		if (!(u instanceof Uint8Array)) return false;
		return "k" in u && "m" in u;
	},
	{ identifier: "BloomFilter" },
);

/**
 * Effect Schema for validating bloom filter structures.
 *
 * @description
 * Validates that the input is a valid bloom filter structure with:
 * - Uint8Array data
 * - k property (number of hash functions)
 * - m property (filter size in bits)
 *
 * This schema is primarily used for validating existing bloom filters
 * rather than creating new ones (use {@link create} for that).
 *
 * @example
 * ```typescript
 * import { BloomFilterSchema } from 'voltaire-effect/primitives/BloomFilter'
 * import * as Schema from 'effect/Schema'
 *
 * // Validate an existing bloom filter
 * const validate = Schema.decodeSync(BloomFilterSchema)
 * const filter = validate(existingFilter)
 *
 * // Check properties
 * console.log(filter.k)  // Number of hash functions
 * console.log(filter.m)  // Size in bits
 * ```
 *
 * @throws {ParseError} When input is not a valid bloom filter structure
 * @see {@link create} for creating new bloom filters
 * @see {@link fromHex} for deserializing from hex
 * @since 0.0.1
 */
export const BloomFilterSchema: Schema.Schema<
	BloomFilterType,
	BloomFilterType,
	never
> = Schema.transformOrFail(BloomFilterTypeSchema, BloomFilterTypeSchema, {
	strict: true,
	decode: (t, _options, _ast) => ParseResult.succeed(t),
	encode: (t) => ParseResult.succeed(t),
}).annotations({ identifier: "BloomFilterSchema" });
