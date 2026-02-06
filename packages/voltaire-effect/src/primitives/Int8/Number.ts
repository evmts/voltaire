/**
 * @fileoverview Effect Schema for Int8 encoded as number.
 * @module Int8/Number
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
 * Schema for Int8 encoded as a number.
 *
 * @description
 * Transforms numbers to Int8Type and vice versa.
 * Accepts integers in range -128 to 127.
 *
 * @example Decoding
 * ```typescript
 * import * as Int8 from 'voltaire-effect/primitives/Int8'
 * import * as S from 'effect/Schema'
 *
 * const value = S.decodeSync(Int8.Number)(-42)
 * ```
 *
 * @example Encoding
 * ```typescript
 * const num = S.encodeSync(Int8.Number)(value)
 * // -42
 * ```
 *
 * @since 0.1.0
 */
export const Number: S.Schema<Int8Type, number> = S.transformOrFail(
	S.Number,
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
			return ParseResult.succeed(BrandedInt8.toNumber(value));
		},
	},
).annotations({ identifier: "Int8.Number" });
