/**
 * @fileoverview Schema for Uint8 encoded as a decimal string.
 * @module Uint8/String
 * @since 0.1.0
 */

import { BrandedUint8 } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

type Uint8Type = ReturnType<typeof BrandedUint8.from>;

const Uint8TypeSchema = S.declare<Uint8Type>(
	(u): u is Uint8Type => typeof u === "number" && BrandedUint8.isValid(u),
	{ identifier: "Uint8" },
);

/**
 * Schema for Uint8 encoded as a decimal string.
 *
 * @example Decoding
 * ```typescript
 * import * as Uint8 from 'voltaire-effect/primitives/Uint8'
 * import * as S from 'effect/Schema'
 *
 * const value = S.decodeSync(Uint8.String)('255')
 * ```
 *
 * @example Encoding
 * ```typescript
 * const str = S.encodeSync(Uint8.String)(value)
 * // "255"
 * ```
 *
 * @since 0.1.0
 */
export const String: S.Schema<Uint8Type, string> = S.transformOrFail(
	S.String,
	Uint8TypeSchema,
	{
		strict: true,
		decode: (s, _options, ast) => {
			try {
				return ParseResult.succeed(BrandedUint8.from(s));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, s, (e as Error).message),
				);
			}
		},
		encode: (uint, _options, _ast) => {
			return ParseResult.succeed(BrandedUint8.toString(uint));
		},
	},
).annotations({ identifier: "Uint8.String" });
