/**
 * @fileoverview Schema for Uint64 encoded as a bigint.
 * @module Uint64/BigInt
 * @since 0.1.0
 */

import { Uint64 } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

type Uint64Type = ReturnType<typeof Uint64.from>;

const Uint64TypeSchema = S.declare<Uint64Type>(
	(u): u is Uint64Type => typeof u === "bigint" && Uint64.isValid(u),
	{ identifier: "Uint64" },
);

/**
 * Schema for Uint64 encoded as a bigint (0 to 2^64-1).
 *
 * @example Decoding
 * ```typescript
 * import * as Uint64 from 'voltaire-effect/primitives/Uint64'
 * import * as S from 'effect/Schema'
 *
 * const value = S.decodeSync(Uint64.BigInt)(18446744073709551615n)
 * ```
 *
 * @example Encoding
 * ```typescript
 * const bigint = S.encodeSync(Uint64.BigInt)(value)
 * // 18446744073709551615n
 * ```
 *
 * @since 0.1.0
 */
export const BigInt: S.Schema<Uint64Type, bigint> = S.transformOrFail(
	S.BigIntFromSelf,
	Uint64TypeSchema,
	{
		strict: true,
		decode: (n, _options, ast) => {
			try {
				return ParseResult.succeed(Uint64.fromBigInt(n));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, n, (e as Error).message),
				);
			}
		},
		encode: (uint, _options, _ast) => {
			return ParseResult.succeed(Uint64.toBigInt(uint));
		},
	},
).annotations({ identifier: "Uint64.BigInt" });
