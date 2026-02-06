/**
 * @fileoverview Schema for Uint16 encoded as a bigint.
 * @module Uint16/BigInt
 * @since 0.1.0
 */

import { BrandedUint16 } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

type Uint16Type = ReturnType<typeof BrandedUint16.from>;

const Uint16TypeSchema = S.declare<Uint16Type>(
	(u): u is Uint16Type => typeof u === "number" && BrandedUint16.isValid(u),
	{ identifier: "Uint16" },
);

/**
 * Schema for Uint16 encoded as a bigint.
 *
 * @example Decoding
 * ```typescript
 * import * as Uint16 from 'voltaire-effect/primitives/Uint16'
 * import * as S from 'effect/Schema'
 *
 * const value = S.decodeSync(Uint16.BigInt)(65535n)
 * ```
 *
 * @example Encoding
 * ```typescript
 * const bigint = S.encodeSync(Uint16.BigInt)(value)
 * // 65535n
 * ```
 *
 * @since 0.1.0
 */
export const BigInt: S.Schema<Uint16Type, bigint> = S.transformOrFail(
	S.BigIntFromSelf,
	Uint16TypeSchema,
	{
		strict: true,
		decode: (n, _options, ast) => {
			try {
				return ParseResult.succeed(
					BrandedUint16.fromNumber(globalThis.Number(n)),
				);
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, n, (e as Error).message),
				);
			}
		},
		encode: (uint, _options, _ast) => {
			return ParseResult.succeed(BrandedUint16.toBigint(uint));
		},
	},
).annotations({ identifier: "Uint16.BigInt" });
