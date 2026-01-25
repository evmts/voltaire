/**
 * @fileoverview Effect Schema for Int128 encoded as bigint.
 * @module Int128/BigInt
 * @since 0.1.0
 */

import { BrandedInt128 } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";
import type { Int128Type } from "./Int128Schema.js";

const Int128TypeSchema = S.declare<Int128Type>(
	(u): u is Int128Type => typeof u === "bigint",
	{ identifier: "Int128" },
);

/**
 * Schema for Int128 encoded as a bigint.
 *
 * @description
 * Transforms bigints to Int128Type and vice versa.
 * Accepts bigints in range -2^127 to 2^127-1.
 *
 * @example Decoding
 * ```typescript
 * import * as Int128 from 'voltaire-effect/primitives/Int128'
 * import * as S from 'effect/Schema'
 *
 * const value = S.decodeSync(Int128.BigInt)(-170141183460469231731687303715884105728n)
 * ```
 *
 * @since 0.1.0
 */
export const BigInt: S.Schema<Int128Type, bigint> = S.transformOrFail(
	S.BigIntFromSelf,
	Int128TypeSchema,
	{
		strict: true,
		decode: (n, _options, ast) => {
			try {
				return ParseResult.succeed(BrandedInt128.from(n));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, n, (e as Error).message),
				);
			}
		},
		encode: (value, _options, _ast) => {
			return ParseResult.succeed(BrandedInt128.toBigInt(value));
		},
	},
).annotations({ identifier: "Int128.BigInt" });
