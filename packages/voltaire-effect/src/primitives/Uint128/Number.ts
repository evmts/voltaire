/**
 * @fileoverview Schema for Uint128 encoded as a JavaScript number.
 * @module Uint128/Number
 * @since 0.1.0
 */

import { BrandedUint128 } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

type Uint128Type = ReturnType<typeof BrandedUint128.from>;

const Uint128TypeSchema = S.declare<Uint128Type>(
	(u): u is Uint128Type => typeof u === "bigint" && BrandedUint128.isValid(u),
	{ identifier: "Uint128" },
);

/**
 * Schema for Uint128 encoded as a JavaScript number.
 *
 * @description
 * Warning: All Uint128 values exceed Number.MAX_SAFE_INTEGER.
 * Use BigInt schema for lossless operations.
 *
 * @example Decoding
 * ```typescript
 * import * as Uint128 from 'voltaire-effect/primitives/Uint128'
 * import * as S from 'effect/Schema'
 *
 * const value = S.decodeSync(Uint128.Number)(1000000)
 * ```
 *
 * @example Encoding
 * ```typescript
 * const num = S.encodeSync(Uint128.Number)(value)
 * // May lose precision for large values!
 * ```
 *
 * @since 0.1.0
 */
export const Number: S.Schema<Uint128Type, number> = S.transformOrFail(
	S.Number,
	Uint128TypeSchema,
	{
		strict: true,
		decode: (n, _options, ast) => {
			try {
				return ParseResult.succeed(BrandedUint128.fromNumber(n));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, n, (e as Error).message),
				);
			}
		},
		encode: (uint, _options, _ast) => {
			return ParseResult.succeed(BrandedUint128.toNumber(uint));
		},
	},
).annotations({ identifier: "Uint128.Number" });
