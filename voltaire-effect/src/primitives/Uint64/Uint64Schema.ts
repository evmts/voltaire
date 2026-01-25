/**
 * @fileoverview Effect Schema definition for Uint64 validation and transformation.
 *
 * Provides type-safe schema for validating and transforming values into Uint64,
 * supporting number, bigint, and string inputs with range validation (0 to 2^64-1).
 *
 * @module Uint64/Uint64Schema
 * @since 0.0.1
 */

import { Uint64 } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

/**
 * Type representing a 64-bit unsigned integer (0 to 2^64-1).
 *
 * @description
 * Branded type for Uint64 values, ensuring type safety at compile time.
 * Values are validated to be within the range 0 to 18446744073709551615 inclusive.
 *
 * Min value: 0
 * Max value: 18446744073709551615 (2^64 - 1)
 *
 * @example
 * ```typescript
 * import type { Uint64Type } from '@voltaire-effect/primitives/Uint64'
 *
 * function processValue(value: Uint64Type): void {
 *   // Type-safe: only valid Uint64 values accepted
 * }
 * ```
 *
 * @since 0.0.1
 */
export type Uint64Type = ReturnType<typeof Uint64.from>;

/**
 * Internal schema declaration for Uint64 type validation.
 *
 * @description
 * Declares the Uint64 branded type for use in Effect Schema transformations.
 * Validates that values are bigints within the valid Uint64 range.
 *
 * @internal
 * @since 0.0.1
 */
const Uint64TypeSchema = S.declare<Uint64Type>(
	(u): u is Uint64Type => {
		if (typeof u !== "bigint") return false;
		return Uint64.isValid(u);
	},
	{ identifier: "Uint64" },
);

/**
 * Effect Schema for validating and transforming 64-bit unsigned integers.
 *
 * @description
 * Accepts number, bigint, or string inputs and validates them as Uint64 values.
 * Valid range: 0 to 18446744073709551615 (2^64 - 1).
 *
 * Input types:
 * - `number`: Must be a non-negative integer (precision may be lost for values > 2^53-1)
 * - `bigint`: Must be in range 0n to 18446744073709551615n
 * - `string`: Must parse to an integer in the valid range
 *
 * Encoding converts the Uint64 back to a bigint for serialization.
 *
 * @example
 * ```typescript
 * import * as Schema from 'effect/Schema'
 * import { Schema as Uint64Schema } from '@voltaire-effect/primitives/Uint64'
 *
 * // Decode from bigint
 * const fromBigInt = Schema.decodeSync(Uint64Schema)(18446744073709551615n)
 *
 * // Decode from number (for safe integers)
 * const fromNumber = Schema.decodeSync(Uint64Schema)(1000000000000)
 *
 * // Decode from string
 * const fromString = Schema.decodeSync(Uint64Schema)('9223372036854775808')
 *
 * // Encode back to bigint
 * const encoded = Schema.encodeSync(Uint64Schema)(fromBigInt)
 * console.log(typeof encoded) // 'bigint'
 *
 * // Error cases
 * Schema.decodeSync(Uint64Schema)(2n ** 64n)  // ParseError: out of range
 * Schema.decodeSync(Uint64Schema)(-1n)        // ParseError: out of range
 *
 * // Use in Effect pipelines
 * import * as Effect from 'effect/Effect'
 * const parsed = Effect.runSync(Schema.decode(Uint64Schema)(1000000000000n))
 * ```
 *
 * @throws {ParseError} When value is negative
 * @throws {ParseError} When value exceeds 2^64-1
 * @throws {ParseError} When string cannot be parsed as integer
 *
 * @see {@link Uint64Type} for the resulting type
 *
 * @since 0.0.1
 */
export const Schema: S.Schema<Uint64Type, number | bigint | string> =
	S.transformOrFail(
		S.Union(S.Number, S.BigIntFromSelf, S.String),
		Uint64TypeSchema,
		{
			strict: true,
			decode: (value, _options, ast) => {
				try {
					return ParseResult.succeed(Uint64.from(value));
				} catch (e) {
					return ParseResult.fail(
						new ParseResult.Type(ast, value, (e as Error).message),
					);
				}
			},
			encode: (i) => ParseResult.succeed(i as bigint),
		},
	).annotations({ identifier: "Uint64Schema" });
