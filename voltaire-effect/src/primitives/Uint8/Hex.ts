/**
 * @fileoverview Schema for Uint8 encoded as a hex string.
 * @module Uint8/Hex
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
 * Schema for Uint8 encoded as a hex string.
 *
 * @example Decoding
 * ```typescript
 * import * as Uint8 from 'voltaire-effect/primitives/Uint8'
 * import * as S from 'effect/Schema'
 *
 * const value = S.decodeSync(Uint8.Hex)('0xff')
 * ```
 *
 * @example Encoding
 * ```typescript
 * const hex = S.encodeSync(Uint8.Hex)(value)
 * // "0xff"
 * ```
 *
 * @since 0.1.0
 */
export const Hex: S.Schema<Uint8Type, string> = S.transformOrFail(
	S.String,
	Uint8TypeSchema,
	{
		strict: true,
		decode: (hex, _options, ast) => {
			try {
				return ParseResult.succeed(BrandedUint8.fromHex(hex));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, hex, (e as Error).message),
				);
			}
		},
		encode: (uint, _options, _ast) => {
			return ParseResult.succeed(BrandedUint8.toHex(uint));
		},
	},
).annotations({ identifier: "Uint8.Hex" });
