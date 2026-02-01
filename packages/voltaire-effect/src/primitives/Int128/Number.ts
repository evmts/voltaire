/**
 * @fileoverview Effect Schema for Int128 encoded as number.
 * @module Int128/Number
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
 * Schema for Int128 encoded as a number.
 *
 * @description
 * Transforms numbers to Int128Type and vice versa.
 * Note: JavaScript numbers can only safely represent integers up to 2^53-1,
 * so this schema may lose precision for large values.
 *
 * @example Decoding
 * ```typescript
 * import * as Int128 from 'voltaire-effect/primitives/Int128'
 * import * as S from 'effect/Schema'
 *
 * const value = S.decodeSync(Int128.Number)(-1000000)
 * ```
 *
 * @since 0.1.0
 */
export const Number: S.Schema<Int128Type, number> = S.transformOrFail(
	S.Number,
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
			return ParseResult.succeed(BrandedInt128.toNumber(value));
		},
	},
).annotations({ identifier: "Int128.Number" });
