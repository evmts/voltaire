/**
 * @fileoverview Effect Schema definition for Uint32 validation and transformation.
 *
 * Provides type-safe schema for validating and transforming values into Uint32,
 * supporting number, bigint, and string inputs with range validation (0-4294967295).
 *
 * @module Uint32/Uint32Schema
 * @since 0.0.1
 */

import { BrandedUint32 } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

/**
 * Type representing a 32-bit unsigned integer (0-4294967295).
 *
 * @description
 * Branded type for Uint32 values, ensuring type safety at compile time.
 * Values are validated to be within the range 0 to 4294967295 inclusive.
 *
 * Min value: 0
 * Max value: 4294967295 (2^32 - 1)
 *
 * @example
 * ```typescript
 * import type { Uint32Type } from '@voltaire-effect/primitives/Uint32'
 *
 * function processValue(value: Uint32Type): void {
 *   // Type-safe: only valid Uint32 values accepted
 * }
 * ```
 *
 * @since 0.0.1
 */
export type Uint32Type = ReturnType<typeof BrandedUint32.from>;

/**
 * Internal schema declaration for Uint32 type validation.
 *
 * @description
 * Declares the Uint32 branded type for use in Effect Schema transformations.
 * Validates that values are numbers within the valid Uint32 range.
 *
 * @internal
 * @since 0.0.1
 */
const Uint32TypeSchema = S.declare<Uint32Type>(
	(u): u is Uint32Type => {
		if (typeof u !== "number") return false;
		return BrandedUint32.isValid(u);
	},
	{ identifier: "Uint32" },
);

/**
 * Effect Schema for validating and transforming 32-bit unsigned integers.
 *
 * @description
 * Accepts number, bigint, or string inputs and validates them as Uint32 values.
 * Valid range: 0 to 4294967295 (2^32 - 1).
 *
 * Input types:
 * - `number`: Must be an integer in range 0-4294967295
 * - `bigint`: Must be in range 0n-4294967295n
 * - `string`: Must parse to an integer in range 0-4294967295
 *
 * Encoding converts the Uint32 back to a number for serialization.
 *
 * @example
 * ```typescript
 * import * as Schema from 'effect/Schema'
 * import { Schema as Uint32Schema } from '@voltaire-effect/primitives/Uint32'
 *
 * // Decode from number
 * const fromNumber = Schema.decodeSync(Uint32Schema)(4294967295)
 *
 * // Decode from bigint
 * const fromBigInt = Schema.decodeSync(Uint32Schema)(3000000000n)
 *
 * // Decode from string
 * const fromString = Schema.decodeSync(Uint32Schema)('2147483648')
 *
 * // Encode back to number
 * const encoded = Schema.encodeSync(Uint32Schema)(fromNumber)
 * console.log(typeof encoded) // 'number'
 *
 * // Error cases
 * Schema.decodeSync(Uint32Schema)(4294967296)  // ParseError: out of range
 * Schema.decodeSync(Uint32Schema)(-1)          // ParseError: out of range
 *
 * // Use in Effect pipelines
 * import * as Effect from 'effect/Effect'
 * const parsed = Effect.runSync(Schema.decode(Uint32Schema)(3000000000))
 * ```
 *
 * @throws {ParseError} When value is negative
 * @throws {ParseError} When value exceeds 4294967295
 * @throws {ParseError} When string cannot be parsed as integer
 *
 * @see {@link Uint32Type} for the resulting type
 *
 * @since 0.0.1
 */
export const Schema: S.Schema<Uint32Type, number | bigint | string> =
	S.transformOrFail(
		S.Union(S.Number, S.BigIntFromSelf, S.String),
		Uint32TypeSchema,
		{
			strict: true,
			decode: (value, _options, ast) => {
				try {
					return ParseResult.succeed(BrandedUint32.from(value));
				} catch (e) {
					return ParseResult.fail(
						new ParseResult.Type(ast, value, (e as Error).message),
					);
				}
			},
			encode: (i) => ParseResult.succeed(i as number),
		},
	).annotations({ identifier: "Uint32Schema" });
