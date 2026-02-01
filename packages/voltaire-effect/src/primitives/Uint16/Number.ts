/**
 * @fileoverview Schema for Uint16 encoded as a JavaScript number.
 * @module Uint16/Number
 * @since 0.1.0
 */

import { BrandedUint16 } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

type Uint16Type = ReturnType<typeof BrandedUint16.from>;

const Uint16TypeSchema = S.declare<Uint16Type>(
	(u): u is Uint16Type => typeof u === "number" && BrandedUint16.isValid(u),
	{ identifier: "Uint16" },
);

/**
 * Schema for Uint16 encoded as a JavaScript number (0-65535).
 *
 * @example Decoding
 * ```typescript
 * import * as Uint16 from 'voltaire-effect/primitives/Uint16'
 * import * as S from 'effect/Schema'
 *
 * const value = S.decodeSync(Uint16.Number)(65535)
 * ```
 *
 * @example Encoding
 * ```typescript
 * const num = S.encodeSync(Uint16.Number)(value)
 * // 65535
 * ```
 *
 * @since 0.1.0
 */
export const Number: S.Schema<Uint16Type, number> = S.transformOrFail(
	S.Number,
	Uint16TypeSchema,
	{
		strict: true,
		decode: (n, _options, ast) => {
			try {
				return ParseResult.succeed(BrandedUint16.from(n));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, n, (e as Error).message),
				);
			}
		},
		encode: (uint, _options, _ast) => {
			return ParseResult.succeed(BrandedUint16.toNumber(uint));
		},
	},
).annotations({ identifier: "Uint16.Number" });
