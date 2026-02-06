/**
 * @fileoverview Effect Schema for Int32 encoded as number.
 * @module Int32/Number
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
 * Schema for Int32 encoded as a number.
 *
 * @description
 * Transforms numbers to Int32Type and vice versa.
 * Accepts integers in range -2147483648 to 2147483647.
 *
 * @example Decoding
 * ```typescript
 * import * as Int32 from 'voltaire-effect/primitives/Int32'
 * import * as S from 'effect/Schema'
 *
 * const value = S.decodeSync(Int32.Number)(-1000000)
 * ```
 *
 * @since 0.1.0
 */
export const Number: S.Schema<Int32Type, number> = S.transformOrFail(
	S.Number,
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
			return ParseResult.succeed(BrandedInt32.toNumber(value));
		},
	},
).annotations({ identifier: "Int32.Number" });
