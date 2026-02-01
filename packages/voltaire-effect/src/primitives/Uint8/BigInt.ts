/**
 * @fileoverview Schema for Uint8 encoded as a bigint.
 * @module Uint8/BigInt
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
 * Schema for Uint8 encoded as a bigint.
 *
 * @example Decoding
 * ```typescript
 * import * as Uint8 from 'voltaire-effect/primitives/Uint8'
 * import * as S from 'effect/Schema'
 *
 * const value = S.decodeSync(Uint8.BigInt)(255n)
 * ```
 *
 * @example Encoding
 * ```typescript
 * const bigint = S.encodeSync(Uint8.BigInt)(value)
 * // 255n
 * ```
 *
 * @since 0.1.0
 */
export const BigInt: S.Schema<Uint8Type, bigint> = S.transformOrFail(
	S.BigIntFromSelf,
	Uint8TypeSchema,
	{
		strict: true,
		decode: (n, _options, ast) => {
			try {
				return ParseResult.succeed(
					BrandedUint8.fromNumber(globalThis.Number(n)),
				);
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, n, (e as Error).message),
				);
			}
		},
		encode: (uint, _options, _ast) => {
			return ParseResult.succeed(BrandedUint8.toBigint(uint));
		},
	},
).annotations({ identifier: "Uint8.BigInt" });
