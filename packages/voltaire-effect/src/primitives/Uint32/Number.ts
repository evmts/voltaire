/**
 * @fileoverview Schema for Uint32 encoded as a JavaScript number.
 * @module Uint32/Number
 * @since 0.1.0
 */

import { BrandedUint32 } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

type Uint32Type = ReturnType<typeof BrandedUint32.from>;

const Uint32TypeSchema = S.declare<Uint32Type>(
	(u): u is Uint32Type => typeof u === "number" && BrandedUint32.isValid(u),
	{ identifier: "Uint32" },
);

/**
 * Schema for Uint32 encoded as a JavaScript number (0-4294967295).
 *
 * @example Decoding
 * ```typescript
 * import * as Uint32 from 'voltaire-effect/primitives/Uint32'
 * import * as S from 'effect/Schema'
 *
 * const value = S.decodeSync(Uint32.Number)(4294967295)
 * ```
 *
 * @example Encoding
 * ```typescript
 * const num = S.encodeSync(Uint32.Number)(value)
 * // 4294967295
 * ```
 *
 * @since 0.1.0
 */
export const Number: S.Schema<Uint32Type, number> = S.transformOrFail(
	S.Number,
	Uint32TypeSchema,
	{
		strict: true,
		decode: (n, _options, ast) => {
			try {
				return ParseResult.succeed(BrandedUint32.from(n));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, n, (e as Error).message),
				);
			}
		},
		encode: (uint, _options, _ast) => {
			return ParseResult.succeed(BrandedUint32.toNumber(uint));
		},
	},
).annotations({ identifier: "Uint32.Number" });
