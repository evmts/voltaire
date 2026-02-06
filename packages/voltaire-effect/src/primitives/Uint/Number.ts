/**
 * @fileoverview Schema for Uint256 encoded as a JavaScript number.
 * @module Uint/Number
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
 * Schema for Uint256 encoded as a JavaScript number.
 *
 * @description
 * Warning: Numbers larger than Number.MAX_SAFE_INTEGER (2^53-1) may lose precision.
 * Use BigInt schema for large values.
 *
 * @example Decoding
 * ```typescript
 * import * as Uint from 'voltaire-effect/primitives/Uint'
 * import * as S from 'effect/Schema'
 *
 * const value = S.decodeSync(Uint.Number)(1000)
 * ```
 *
 * @example Encoding
 * ```typescript
 * const num = S.encodeSync(Uint.Number)(value)
 * // 1000
 * ```
 *
 * @since 0.1.0
 */
export const Number: S.Schema<Uint256Type, number> = S.transformOrFail(
	S.Number,
	Uint256TypeSchema,
	{
		strict: true,
		decode: (n, _options, ast) => {
			try {
				return ParseResult.succeed(Uint256.fromNumber(n));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, n, (e as Error).message),
				);
			}
		},
		encode: (uint, _options, _ast) => {
			return ParseResult.succeed(Uint256.toNumber(uint));
		},
	},
).annotations({ identifier: "Uint256.Number" });
