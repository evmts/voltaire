/**
 * @fileoverview Schema for Hex encoded as Uint8Array bytes.
 * @module voltaire-effect/primitives/Hex/Bytes
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
 * Schema for Hex encoded as Uint8Array bytes.
 *
 * @description
 * Transforms Uint8Array to HexType and vice versa.
 * Decodes bytes to 0x-prefixed lowercase hex string.
 * Encodes hex string back to Uint8Array.
 *
 * @example Decoding
 * ```typescript
 * import * as Hex from 'voltaire-effect/primitives/Hex'
 * import * as S from 'effect/Schema'
 *
 * const hex = S.decodeSync(Hex.Bytes)(new Uint8Array([0xde, 0xad, 0xbe, 0xef]))
 * // "0xdeadbeef"
 * ```
 *
 * @example Encoding
 * ```typescript
 * const bytes = S.encodeSync(Hex.Bytes)(hex)
 * // Uint8Array([0xde, 0xad, 0xbe, 0xef])
 * ```
 *
 * @since 0.1.0
 */
export const Bytes: S.Schema<HexType, Uint8Array> = S.transformOrFail(
	S.Uint8ArrayFromSelf,
	HexTypeSchema,
	{
		strict: true,
		decode: (_bytes, _options, _ast) => {
			return ParseResult.succeed(VoltaireHex.fromBytes(_bytes));
		},
		encode: (h, _options, ast) => {
			try {
				return ParseResult.succeed(VoltaireHex.toBytes(h));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, h, (e as Error).message),
				);
			}
		},
	},
).annotations({ identifier: "Hex.Bytes" });
