/**
 * @fileoverview Schema for Uint32 encoded as a hex string.
 * @module Uint32/Hex
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
 * Schema for Uint32 encoded as a hex string.
 *
 * @example Decoding
 * ```typescript
 * import * as Uint32 from 'voltaire-effect/primitives/Uint32'
 * import * as S from 'effect/Schema'
 *
 * const value = S.decodeSync(Uint32.Hex)('0xffffffff')
 * ```
 *
 * @example Encoding
 * ```typescript
 * const hex = S.encodeSync(Uint32.Hex)(value)
 * // "0xffffffff"
 * ```
 *
 * @since 0.1.0
 */
export const Hex: S.Schema<Uint32Type, string> = S.transformOrFail(
	S.String,
	Uint32TypeSchema,
	{
		strict: true,
		decode: (hex, _options, ast) => {
			try {
				return ParseResult.succeed(BrandedUint32.fromHex(hex));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, hex, (e as Error).message),
				);
			}
		},
		encode: (uint, _options, _ast) => {
			return ParseResult.succeed(BrandedUint32.toHex(uint));
		},
	},
).annotations({ identifier: "Uint32.Hex" });
