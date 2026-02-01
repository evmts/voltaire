/**
 * @fileoverview Schema for Uint64 encoded as a decimal string.
 * @module Uint64/String
 * @since 0.1.0
 */

import { Uint64 } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

type Uint64Type = ReturnType<typeof Uint64.from>;

const Uint64TypeSchema = S.declare<Uint64Type>(
	(u): u is Uint64Type => typeof u === "bigint" && Uint64.isValid(u),
	{ identifier: "Uint64" },
);

/**
 * Schema for Uint64 encoded as a decimal string.
 *
 * @example Decoding
 * ```typescript
 * import * as Uint64 from 'voltaire-effect/primitives/Uint64'
 * import * as S from 'effect/Schema'
 *
 * const value = S.decodeSync(Uint64.String)('18446744073709551615')
 * ```
 *
 * @example Encoding
 * ```typescript
 * const str = S.encodeSync(Uint64.String)(value)
 * // "18446744073709551615"
 * ```
 *
 * @since 0.1.0
 */
export const String: S.Schema<Uint64Type, string> = S.transformOrFail(
	S.String,
	Uint64TypeSchema,
	{
		strict: true,
		decode: (s, _options, ast) => {
			try {
				return ParseResult.succeed(Uint64.from(s));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, s, (e as Error).message),
				);
			}
		},
		encode: (uint, _options, _ast) => {
			return ParseResult.succeed(Uint64.toString(uint));
		},
	},
).annotations({ identifier: "Uint64.String" });
