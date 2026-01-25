/**
 * @fileoverview Schema for Uint32 encoded as a bigint.
 * @module Uint32/BigInt
 * @since 0.1.0
 */

import { BrandedUint32 } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

type Uint32Type = ReturnType<typeof BrandedUint32.from>;

const Uint32TypeSchema = S.declare<Uint32Type>(
	(u): u is Uint32Type => typeof u === "number" && BrandedUint32.isValid(u),
	{ identifier: "Uint32" },
);

/**
 * Schema for Uint32 encoded as a bigint.
 *
 * @example Decoding
 * ```typescript
 * import * as Uint32 from 'voltaire-effect/primitives/Uint32'
 * import * as S from 'effect/Schema'
 *
 * const value = S.decodeSync(Uint32.BigInt)(4294967295n)
 * ```
 *
 * @example Encoding
 * ```typescript
 * const bigint = S.encodeSync(Uint32.BigInt)(value)
 * // 4294967295n
 * ```
 *
 * @since 0.1.0
 */
export const BigInt: S.Schema<Uint32Type, bigint> = S.transformOrFail(
	S.BigIntFromSelf,
	Uint32TypeSchema,
	{
		strict: true,
		decode: (n, _options, ast) => {
			try {
				return ParseResult.succeed(BrandedUint32.fromBigInt(n));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, n, (e as Error).message),
				);
			}
		},
		encode: (uint, _options, _ast) => {
			return ParseResult.succeed(BrandedUint32.toBigInt(uint));
		},
	},
).annotations({ identifier: "Uint32.BigInt" });
