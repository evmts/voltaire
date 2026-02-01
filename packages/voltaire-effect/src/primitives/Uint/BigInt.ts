/**
 * @fileoverview Schema for Uint256 encoded as a bigint.
 * @module Uint/BigInt
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
 * Schema for Uint256 encoded as a bigint.
 *
 * @description
 * Primary schema for large Uint256 values. Supports the full range 0 to 2^256-1.
 *
 * @example Decoding
 * ```typescript
 * import * as Uint from 'voltaire-effect/primitives/Uint'
 * import * as S from 'effect/Schema'
 *
 * const value = S.decodeSync(Uint.BigInt)(1000000000000000000n)
 * ```
 *
 * @example Encoding
 * ```typescript
 * const bigint = S.encodeSync(Uint.BigInt)(value)
 * // 1000000000000000000n
 * ```
 *
 * @since 0.1.0
 */
export const BigInt: S.Schema<Uint256Type, bigint> = S.transformOrFail(
	S.BigIntFromSelf,
	Uint256TypeSchema,
	{
		strict: true,
		decode: (n, _options, ast) => {
			try {
				return ParseResult.succeed(Uint256.fromBigInt(n));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, n, (e as Error).message),
				);
			}
		},
		encode: (uint, _options, _ast) => {
			return ParseResult.succeed(Uint256.toBigInt(uint));
		},
	},
).annotations({ identifier: "Uint256.BigInt" });
