/**
 * @fileoverview Effect Schema for Int64 encoded as number.
 * @module Int64/Number
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
 * Schema for Int64 encoded as a number.
 *
 * @description
 * Transforms numbers to Int64Type and vice versa.
 * Note: JavaScript numbers can only safely represent integers up to 2^53-1,
 * so this schema may lose precision for large values.
 *
 * @example Decoding
 * ```typescript
 * import * as Int64 from 'voltaire-effect/primitives/Int64'
 * import * as S from 'effect/Schema'
 *
 * const value = S.decodeSync(Int64.Number)(-1000000)
 * ```
 *
 * @since 0.1.0
 */
export const Number: S.Schema<Int64Type, number> = S.transformOrFail(
	S.Number,
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
			return ParseResult.succeed(BrandedInt64.toNumber(value));
		},
	},
).annotations({ identifier: "Int64.Number" });
