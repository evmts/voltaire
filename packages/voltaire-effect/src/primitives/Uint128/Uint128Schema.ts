/**
 * @fileoverview Effect Schema definition for Uint128 validation and transformation.
 *
 * Provides type-safe schema for validating and transforming values into Uint128,
 * supporting number, bigint, and string inputs with range validation (0 to 2^128-1).
 *
 * @module Uint128/Uint128Schema
 * @since 0.0.1
 */

import { BrandedUint128 } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

/**
 * Type representing a 128-bit unsigned integer (0 to 2^128-1).
 *
 * @description
 * Branded type for Uint128 values, ensuring type safety at compile time.
 * Values are validated to be within the range 0 to 340282366920938463463374607431768211455 inclusive.
 *
 * Min value: 0
 * Max value: 340282366920938463463374607431768211455 (2^128 - 1)
 *
 * @example
 * ```typescript
 * import type { Uint128Type } from '@voltaire-effect/primitives/Uint128'
 *
 * function processValue(value: Uint128Type): void {
 *   // Type-safe: only valid Uint128 values accepted
 * }
 * ```
 *
 * @since 0.0.1
 */
export type Uint128Type = ReturnType<typeof BrandedUint128.from>;

/**
 * Internal schema declaration for Uint128 type validation.
 *
 * @description
 * Declares the Uint128 branded type for use in Effect Schema transformations.
 * Validates that values are bigints within the valid Uint128 range.
 *
 * @internal
 * @since 0.0.1
 */
const Uint128TypeSchema = S.declare<Uint128Type>(
	(u): u is Uint128Type => {
		if (typeof u !== "bigint") return false;
		return BrandedUint128.isValid(u);
	},
	{ identifier: "Uint128" },
);

/**
 * Effect Schema for validating and transforming 128-bit unsigned integers.
 *
 * @description
 * Accepts number, bigint, or string inputs and validates them as Uint128 values.
 * Valid range: 0 to 340282366920938463463374607431768211455 (2^128 - 1).
 *
 * Input types:
 * - `number`: Must be a non-negative integer (limited precision, use bigint for large values)
 * - `bigint`: Must be in range 0n to 2^128-1
 * - `string`: Must parse to an integer in the valid range
 *
 * Encoding converts the Uint128 back to a bigint for serialization.
 *
 * @example
 * ```typescript
 * import * as Schema from 'effect/Schema'
 * import { Schema as Uint128Schema } from '@voltaire-effect/primitives/Uint128'
 *
 * // Decode from bigint
 * const fromBigInt = Schema.decodeSync(Uint128Schema)(2n ** 100n)
 *
 * // Decode from string (for very large numbers)
 * const fromString = Schema.decodeSync(Uint128Schema)('170141183460469231731687303715884105728')
 *
 * // Encode back to bigint
 * const encoded = Schema.encodeSync(Uint128Schema)(fromBigInt)
 * console.log(typeof encoded) // 'bigint'
 *
 * // Error cases
 * Schema.decodeSync(Uint128Schema)(2n ** 128n)  // ParseError: out of range
 * Schema.decodeSync(Uint128Schema)(-1n)         // ParseError: out of range
 *
 * // Use in Effect pipelines
 * import * as Effect from 'effect/Effect'
 * const parsed = Effect.runSync(Schema.decode(Uint128Schema)(2n ** 100n))
 * ```
 *
 * @throws {ParseError} When value is negative
 * @throws {ParseError} When value exceeds 2^128-1
 * @throws {ParseError} When string cannot be parsed as integer
 *
 * @see {@link Uint128Type} for the resulting type
 *
 * @since 0.0.1
 */
export const Schema: S.Schema<Uint128Type, number | bigint | string> =
	S.transformOrFail(
		S.Union(S.Number, S.BigIntFromSelf, S.String),
		Uint128TypeSchema,
		{
			strict: true,
			decode: (value, _options, ast) => {
				try {
					return ParseResult.succeed(BrandedUint128.from(value));
				} catch (e) {
					return ParseResult.fail(
						new ParseResult.Type(ast, value, (e as Error).message),
					);
				}
			},
			encode: (i) => ParseResult.succeed(i as bigint),
		},
	).annotations({ identifier: "Uint128Schema" });
