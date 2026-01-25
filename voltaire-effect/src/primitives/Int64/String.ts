/**
 * @fileoverview Effect Schema for Int64 encoded as decimal string.
 * @module Int64/String
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
 * Schema for Int64 encoded as a decimal string.
 *
 * @description
 * Transforms decimal strings to Int64Type and vice versa.
 * Accepts strings representing integers in range -2^63 to 2^63-1.
 *
 * @example Decoding
 * ```typescript
 * import * as Int64 from 'voltaire-effect/primitives/Int64'
 * import * as S from 'effect/Schema'
 *
 * const value = S.decodeSync(Int64.String)('-9223372036854775808')
 * ```
 *
 * @since 0.1.0
 */
export const String: S.Schema<Int64Type, string> = S.transformOrFail(
	S.String,
	Int64TypeSchema,
	{
		strict: true,
		decode: (s, _options, ast) => {
			try {
				return ParseResult.succeed(BrandedInt64.from(s));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, s, (e as Error).message),
				);
			}
		},
		encode: (value, _options, _ast) => {
			return ParseResult.succeed(BrandedInt64.toBigInt(value).toString());
		},
	},
).annotations({ identifier: "Int64.String" });
