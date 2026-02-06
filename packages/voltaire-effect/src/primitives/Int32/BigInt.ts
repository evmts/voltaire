/**
 * @fileoverview Effect Schema for Int32 encoded as bigint.
 * @module Int32/BigInt
 * @since 0.1.0
 */

import { BrandedInt32 } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";
import type { Int32Type } from "./Int32Schema.js";

const Int32TypeSchema = S.declare<Int32Type>(
	(u): u is Int32Type => typeof u === "number" && BrandedInt32.isValid(u),
	{ identifier: "Int32" },
);

/**
 * Schema for Int32 encoded as a bigint.
 *
 * @description
 * Transforms bigints to Int32Type and vice versa.
 * Accepts bigints in range -2147483648n to 2147483647n.
 *
 * @example Decoding
 * ```typescript
 * import * as Int32 from 'voltaire-effect/primitives/Int32'
 * import * as S from 'effect/Schema'
 *
 * const value = S.decodeSync(Int32.BigInt)(-1000000n)
 * ```
 *
 * @since 0.1.0
 */
export const BigInt: S.Schema<Int32Type, bigint> = S.transformOrFail(
	S.BigIntFromSelf,
	Int32TypeSchema,
	{
		strict: true,
		decode: (n, _options, ast) => {
			try {
				return ParseResult.succeed(BrandedInt32.from(n));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, n, (e as Error).message),
				);
			}
		},
		encode: (value, _options, _ast) => {
			return ParseResult.succeed(BrandedInt32.toBigInt(value));
		},
	},
).annotations({ identifier: "Int32.BigInt" });
