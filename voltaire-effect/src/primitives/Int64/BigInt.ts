/**
 * @fileoverview Effect Schema for Int64 encoded as bigint.
 * @module Int64/BigInt
 * @since 0.1.0
 */

import { BrandedInt64 } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";
import type { Int64Type } from "./Int64Schema.js";

const Int64TypeSchema = S.declare<Int64Type>(
	(u): u is Int64Type => typeof u === "bigint",
	{ identifier: "Int64" },
);

/**
 * Schema for Int64 encoded as a bigint.
 *
 * @description
 * Transforms bigints to Int64Type and vice versa.
 * Accepts bigints in range -2^63 to 2^63-1.
 *
 * @example Decoding
 * ```typescript
 * import * as Int64 from 'voltaire-effect/primitives/Int64'
 * import * as S from 'effect/Schema'
 *
 * const value = S.decodeSync(Int64.BigInt)(-9223372036854775808n)
 * ```
 *
 * @since 0.1.0
 */
export const BigInt: S.Schema<Int64Type, bigint> = S.transformOrFail(
	S.BigIntFromSelf,
	Int64TypeSchema,
	{
		strict: true,
		decode: (n, _options, ast) => {
			try {
				return ParseResult.succeed(BrandedInt64.from(n));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, n, (e as Error).message),
				);
			}
		},
		encode: (value, _options, _ast) => {
			return ParseResult.succeed(BrandedInt64.toBigInt(value));
		},
	},
).annotations({ identifier: "Int64.BigInt" });
