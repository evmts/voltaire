/**
 * @fileoverview Effect Schema for Int256 encoded as number.
 * @module Int256/Number
 * @since 0.1.0
 */

import { BrandedInt256 } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";
import type { Int256Type } from "./Int256Schema.js";

const Int256TypeSchema = S.declare<Int256Type>(
	(u): u is Int256Type => typeof u === "bigint",
	{ identifier: "Int256" },
);

/**
 * Schema for Int256 encoded as a number.
 *
 * @description
 * Transforms numbers to Int256Type and vice versa.
 * Note: JavaScript numbers can only safely represent integers up to 2^53-1,
 * so this schema may lose precision for large values.
 *
 * @example Decoding
 * ```typescript
 * import * as Int256 from 'voltaire-effect/primitives/Int256'
 * import * as S from 'effect/Schema'
 *
 * const value = S.decodeSync(Int256.Number)(-1000000)
 * ```
 *
 * @since 0.1.0
 */
export const Number: S.Schema<Int256Type, number> = S.transformOrFail(
	S.Number,
	Int256TypeSchema,
	{
		strict: true,
		decode: (n, _options, ast) => {
			try {
				return ParseResult.succeed(BrandedInt256.from(n));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, n, (e as Error).message),
				);
			}
		},
		encode: (value, _options, _ast) => {
			return ParseResult.succeed(BrandedInt256.toNumber(value));
		},
	},
).annotations({ identifier: "Int256.Number" });
