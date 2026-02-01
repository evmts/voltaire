/**
 * @fileoverview Schema for Uint256 encoded as a decimal string.
 * @module Uint/String
 * @since 0.1.0
 */

import {
	isUint256,
	Uint256,
	type Type as Uint256Type,
} from "@tevm/voltaire/Uint";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

const Uint256TypeSchema = S.declare<Uint256Type>(
	(u): u is Uint256Type => isUint256(u),
	{ identifier: "Uint256" },
);

/**
 * Schema for Uint256 encoded as a decimal string.
 *
 * @example Decoding
 * ```typescript
 * import * as Uint from 'voltaire-effect/primitives/Uint'
 * import * as S from 'effect/Schema'
 *
 * const value = S.decodeSync(Uint.String)('1000000000000000000')
 * ```
 *
 * @example Encoding
 * ```typescript
 * const str = S.encodeSync(Uint.String)(value)
 * // "1000000000000000000"
 * ```
 *
 * @since 0.1.0
 */
export const String: S.Schema<Uint256Type, string> = S.transformOrFail(
	S.String,
	Uint256TypeSchema,
	{
		strict: true,
		decode: (s, _options, ast) => {
			try {
				return ParseResult.succeed(Uint256.from(s));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, s, (e as Error).message),
				);
			}
		},
		encode: (uint, _options, _ast) => {
			return ParseResult.succeed(Uint256.toString(uint));
		},
	},
).annotations({ identifier: "Uint256.String" });
