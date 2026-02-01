/**
 * @fileoverview Effect Schema for Int8 encoded as decimal string.
 * @module Int8/String
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
 * Schema for Int8 encoded as a decimal string.
 *
 * @description
 * Transforms decimal strings to Int8Type and vice versa.
 * Accepts strings representing integers in range -128 to 127.
 *
 * @example Decoding
 * ```typescript
 * import * as Int8 from 'voltaire-effect/primitives/Int8'
 * import * as S from 'effect/Schema'
 *
 * const value = S.decodeSync(Int8.String)('-42')
 * ```
 *
 * @example Encoding
 * ```typescript
 * const str = S.encodeSync(Int8.String)(value)
 * // "-42"
 * ```
 *
 * @since 0.1.0
 */
export const String: S.Schema<Int8Type, string> = S.transformOrFail(
	S.String,
	Int8TypeSchema,
	{
		strict: true,
		decode: (s, _options, ast) => {
			try {
				return ParseResult.succeed(BrandedInt8.from(s));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, s, (e as Error).message),
				);
			}
		},
		encode: (value, _options, _ast) => {
			return ParseResult.succeed(BrandedInt8.toNumber(value).toString());
		},
	},
).annotations({ identifier: "Int8.String" });
