/**
 * @fileoverview Schema for Hex encoded as string.
 * @module voltaire-effect/primitives/Hex/String
 * @since 0.1.0
 */

import { type HexType, Hex as VoltaireHex } from "@tevm/voltaire/Hex";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

const HexTypeSchema = S.declare<HexType>(
	(u): u is HexType => {
		if (typeof u !== "string") return false;
		try {
			VoltaireHex(u);
			return true;
		} catch {
			return false;
		}
	},
	{ identifier: "Hex" },
);

/**
 * Schema for Hex encoded as a string.
 *
 * @description
 * Transforms hex strings to HexType and vice versa.
 * Accepts hex strings with or without 0x prefix.
 * Encodes to lowercase 0x-prefixed hex.
 *
 * @example Decoding
 * ```typescript
 * import * as Hex from 'voltaire-effect/primitives/Hex'
 * import * as S from 'effect/Schema'
 *
 * const hex = S.decodeSync(Hex.String)('0xdeadbeef')
 * ```
 *
 * @example Encoding
 * ```typescript
 * const str = S.encodeSync(Hex.String)(hex)
 * // "0xdeadbeef"
 * ```
 *
 * @since 0.1.0
 */
export const String: S.Schema<HexType, string> = S.transformOrFail(
	S.String,
	HexTypeSchema,
	{
		strict: true,
		decode: (s, _options, ast) => {
			try {
				return ParseResult.succeed(VoltaireHex(s));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, s, (e as Error).message),
				);
			}
		},
		encode: (h) => ParseResult.succeed(h),
	},
).annotations({ identifier: "Hex.String" });
