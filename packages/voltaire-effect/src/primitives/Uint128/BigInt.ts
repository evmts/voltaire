/**
 * @fileoverview Schema for Uint128 encoded as a bigint.
 * @module Uint128/BigInt
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
 * Schema for Uint128 encoded as a bigint (0 to 2^128-1).
 *
 * @example Decoding
 * ```typescript
 * import * as Uint128 from 'voltaire-effect/primitives/Uint128'
 * import * as S from 'effect/Schema'
 *
 * const value = S.decodeSync(Uint128.BigInt)(2n ** 100n)
 * ```
 *
 * @example Encoding
 * ```typescript
 * const bigint = S.encodeSync(Uint128.BigInt)(value)
 * ```
 *
 * @since 0.1.0
 */
export const BigInt: S.Schema<Uint128Type, bigint> = S.transformOrFail(
	S.BigIntFromSelf,
	Uint128TypeSchema,
	{
		strict: true,
		decode: (n, _options, ast) => {
			try {
				return ParseResult.succeed(BrandedUint128.fromBigInt(n));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, n, (e as Error).message),
				);
			}
		},
		encode: (uint, _options, _ast) => {
			return ParseResult.succeed(BrandedUint128.toBigInt(uint));
		},
	},
).annotations({ identifier: "Uint128.BigInt" });
