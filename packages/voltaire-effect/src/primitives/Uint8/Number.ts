/**
 * @fileoverview Schema for Uint8 encoded as a JavaScript number.
 * @module Uint8/Number
 * @since 0.1.0
 */

import { BrandedUint8 } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

type Uint8Type = ReturnType<typeof BrandedUint8.from>;

const Uint8TypeSchema = S.declare<Uint8Type>(
	(u): u is Uint8Type => typeof u === "number" && BrandedUint8.isValid(u),
	{ identifier: "Uint8" },
);

/**
 * Schema for Uint8 encoded as a JavaScript number (0-255).
 *
 * @example Decoding
 * ```typescript
 * import * as Uint8 from 'voltaire-effect/primitives/Uint8'
 * import * as S from 'effect/Schema'
 *
 * const value = S.decodeSync(Uint8.Number)(255)
 * ```
 *
 * @example Encoding
 * ```typescript
 * const num = S.encodeSync(Uint8.Number)(value)
 * // 255
 * ```
 *
 * @since 0.1.0
 */
export const Number: S.Schema<Uint8Type, number> = S.transformOrFail(
	S.Number,
	Uint8TypeSchema,
	{
		strict: true,
		decode: (n, _options, ast) => {
			try {
				return ParseResult.succeed(BrandedUint8.from(n));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, n, (e as Error).message),
				);
			}
		},
		encode: (uint, _options, _ast) => {
			return ParseResult.succeed(BrandedUint8.toNumber(uint));
		},
	},
).annotations({ identifier: "Uint8.Number" });
