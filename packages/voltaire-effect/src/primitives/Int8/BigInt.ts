/**
 * @fileoverview Effect Schema for Int8 encoded as bigint.
 * @module Int8/BigInt
 * @since 0.1.0
 */

import { BrandedInt8 } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";
import type { Int8Type } from "./Int8Schema.js";

const Int8TypeSchema = S.declare<Int8Type>(
	(u): u is Int8Type => typeof u === "number" && BrandedInt8.isValid(u),
	{ identifier: "Int8" },
);

/**
 * Schema for Int8 encoded as a bigint.
 *
 * @description
 * Transforms bigints to Int8Type and vice versa.
 * Accepts bigints in range -128n to 127n.
 *
 * @example Decoding
 * ```typescript
 * import * as Int8 from 'voltaire-effect/primitives/Int8'
 * import * as S from 'effect/Schema'
 *
 * const value = S.decodeSync(Int8.BigInt)(-42n)
 * ```
 *
 * @example Encoding
 * ```typescript
 * const bigint = S.encodeSync(Int8.BigInt)(value)
 * // -42n
 * ```
 *
 * @since 0.1.0
 */
export const BigInt: S.Schema<Int8Type, bigint> = S.transformOrFail(
	S.BigIntFromSelf,
	Int8TypeSchema,
	{
		strict: true,
		decode: (n, _options, ast) => {
			try {
				return ParseResult.succeed(BrandedInt8.from(n));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, n, (e as Error).message),
				);
			}
		},
		encode: (value, _options, _ast) => {
			return ParseResult.succeed(
				globalThis.BigInt(BrandedInt8.toNumber(value)),
			);
		},
	},
).annotations({ identifier: "Int8.BigInt" });
