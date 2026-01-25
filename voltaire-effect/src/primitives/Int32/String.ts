/**
 * @fileoverview Effect Schema for Int32 encoded as decimal string.
 * @module Int32/String
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
 * Schema for Int32 encoded as a decimal string.
 *
 * @description
 * Transforms decimal strings to Int32Type and vice versa.
 * Accepts strings representing integers in range -2147483648 to 2147483647.
 *
 * @example Decoding
 * ```typescript
 * import * as Int32 from 'voltaire-effect/primitives/Int32'
 * import * as S from 'effect/Schema'
 *
 * const value = S.decodeSync(Int32.String)('-1000000')
 * ```
 *
 * @since 0.1.0
 */
export const String: S.Schema<Int32Type, string> = S.transformOrFail(
	S.String,
	Int32TypeSchema,
	{
		strict: true,
		decode: (s, _options, ast) => {
			try {
				return ParseResult.succeed(BrandedInt32.from(s));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, s, (e as Error).message),
				);
			}
		},
		encode: (value, _options, _ast) => {
			return ParseResult.succeed(BrandedInt32.toNumber(value).toString());
		},
	},
).annotations({ identifier: "Int32.String" });
