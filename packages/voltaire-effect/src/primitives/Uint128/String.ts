/**
 * @fileoverview Schema for Uint128 encoded as a decimal string.
 * @module Uint128/String
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
 * Schema for Uint128 encoded as a decimal string.
 *
 * @example Decoding
 * ```typescript
 * import * as Uint128 from 'voltaire-effect/primitives/Uint128'
 * import * as S from 'effect/Schema'
 *
 * const value = S.decodeSync(Uint128.String)('340282366920938463463374607431768211455')
 * ```
 *
 * @example Encoding
 * ```typescript
 * const str = S.encodeSync(Uint128.String)(value)
 * // "340282366920938463463374607431768211455"
 * ```
 *
 * @since 0.1.0
 */
export const String: S.Schema<Uint128Type, string> = S.transformOrFail(
	S.String,
	Uint128TypeSchema,
	{
		strict: true,
		decode: (s, _options, ast) => {
			try {
				return ParseResult.succeed(BrandedUint128.from(s));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, s, (e as Error).message),
				);
			}
		},
		encode: (uint, _options, _ast) => {
			return ParseResult.succeed(BrandedUint128.toString(uint));
		},
	},
).annotations({ identifier: "Uint128.String" });
