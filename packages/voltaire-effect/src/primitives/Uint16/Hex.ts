/**
 * @fileoverview Schema for Uint16 encoded as a hex string.
 * @module Uint16/Hex
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
 * Schema for Uint16 encoded as a hex string.
 *
 * @example Decoding
 * ```typescript
 * import * as Uint16 from 'voltaire-effect/primitives/Uint16'
 * import * as S from 'effect/Schema'
 *
 * const value = S.decodeSync(Uint16.Hex)('0xffff')
 * ```
 *
 * @example Encoding
 * ```typescript
 * const hex = S.encodeSync(Uint16.Hex)(value)
 * // "0xffff"
 * ```
 *
 * @since 0.1.0
 */
export const Hex: S.Schema<Uint16Type, string> = S.transformOrFail(
	S.String,
	Uint16TypeSchema,
	{
		strict: true,
		decode: (hex, _options, ast) => {
			try {
				return ParseResult.succeed(BrandedUint16.fromHex(hex));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, hex, (e as Error).message),
				);
			}
		},
		encode: (uint, _options, _ast) => {
			return ParseResult.succeed(BrandedUint16.toHex(uint));
		},
	},
).annotations({ identifier: "Uint16.Hex" });
