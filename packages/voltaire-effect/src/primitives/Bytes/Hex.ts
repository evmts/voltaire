/**
 * @fileoverview Schema for Bytes encoded as hex string.
 * @module voltaire-effect/primitives/Bytes/Hex
 * @since 0.1.0
 */

import { type BytesType, Bytes as VoltaireBytes } from "@tevm/voltaire/Bytes";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

const BytesTypeSchema = S.declare<BytesType>(
	(u): u is BytesType => u instanceof Uint8Array,
	{ identifier: "Bytes" },
);

/**
 * Schema for Bytes encoded as a hex string.
 *
 * @description
 * Transforms hex strings to BytesType (Uint8Array) and vice versa.
 * Accepts hex strings with 0x prefix.
 * Encodes to lowercase 0x-prefixed hex.
 *
 * @example Decoding
 * ```typescript
 * import * as Bytes from 'voltaire-effect/primitives/Bytes'
 * import * as S from 'effect/Schema'
 *
 * const bytes = S.decodeSync(Bytes.Hex)('0xdeadbeef')
 * // Uint8Array([0xde, 0xad, 0xbe, 0xef])
 * ```
 *
 * @example Encoding
 * ```typescript
 * const hex = S.encodeSync(Bytes.Hex)(bytes)
 * // "0xdeadbeef"
 * ```
 *
 * @since 0.1.0
 */
export const Hex: S.Schema<BytesType, string> = S.transformOrFail(
	S.String,
	BytesTypeSchema,
	{
		strict: true,
		decode: (s, _options, ast) => {
			try {
				return ParseResult.succeed(VoltaireBytes.fromHex(s));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, s, (e as Error).message),
				);
			}
		},
		encode: (b, _options, _ast) => {
			return ParseResult.succeed(VoltaireBytes.toHex(b));
		},
	},
).annotations({ identifier: "Bytes.Hex" });
