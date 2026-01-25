/**
 * @fileoverview Effect Schema for Int128 encoded as decimal string.
 * @module Int128/String
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
 * Schema for Int128 encoded as a decimal string.
 *
 * @description
 * Transforms decimal strings to Int128Type and vice versa.
 * Accepts strings representing integers in range -2^127 to 2^127-1.
 *
 * @example Decoding
 * ```typescript
 * import * as Int128 from 'voltaire-effect/primitives/Int128'
 * import * as S from 'effect/Schema'
 *
 * const value = S.decodeSync(Int128.String)('-170141183460469231731687303715884105728')
 * ```
 *
 * @since 0.1.0
 */
export const String: S.Schema<Int128Type, string> = S.transformOrFail(
	S.String,
	Int128TypeSchema,
	{
		strict: true,
		decode: (s, _options, ast) => {
			try {
				return ParseResult.succeed(BrandedInt128.from(s));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, s, (e as Error).message),
				);
			}
		},
		encode: (value, _options, _ast) => {
			return ParseResult.succeed(BrandedInt128.toBigInt(value).toString());
		},
	},
).annotations({ identifier: "Int128.String" });
