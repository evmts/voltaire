/**
 * @fileoverview Schema for Uint64 encoded as a JavaScript number.
 * @module Uint64/Number
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
 * Schema for Uint64 encoded as a JavaScript number.
 *
 * @description
 * Warning: Numbers larger than Number.MAX_SAFE_INTEGER (2^53-1) may lose precision.
 * Use BigInt schema for large values.
 *
 * @example Decoding
 * ```typescript
 * import * as Uint64 from 'voltaire-effect/primitives/Uint64'
 * import * as S from 'effect/Schema'
 *
 * const value = S.decodeSync(Uint64.Number)(1000000)
 * ```
 *
 * @example Encoding
 * ```typescript
 * const num = S.encodeSync(Uint64.Number)(value)
 * // 1000000
 * ```
 *
 * @since 0.1.0
 */
export const Number: S.Schema<Uint64Type, number> = S.transformOrFail(
	S.Number,
	Uint64TypeSchema,
	{
		strict: true,
		decode: (n, _options, ast) => {
			try {
				return ParseResult.succeed(Uint64.fromNumber(n));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, n, (e as Error).message),
				);
			}
		},
		encode: (uint, _options, _ast) => {
			return ParseResult.succeed(Uint64.toNumber(uint));
		},
	},
).annotations({ identifier: "Uint64.Number" });
