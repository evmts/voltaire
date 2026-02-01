/**
 * Schema for PublicKey in compressed hex format.
 *
 * @description
 * Transforms compressed hex strings (66 chars / 33 bytes) to PublicKeyType.
 * Also accepts uncompressed hex (128 chars) and auto-compresses on decode.
 * Encodes to compressed hex format (0x02... or 0x03... prefix).
 *
 * Compressed keys use SEC1 encoding where the first byte indicates
 * the parity of the y-coordinate (0x02 for even, 0x03 for odd).
 *
 * @example Decoding
 * ```typescript
 * import * as PublicKey from 'voltaire-effect/primitives/PublicKey'
 * import * as S from 'effect/Schema'
 *
 * // From compressed hex
 * const pk = S.decodeSync(PublicKey.Compressed)('0x02...')
 * ```
 *
 * @example Encoding
 * ```typescript
 * const compressedHex = S.encodeSync(PublicKey.Compressed)(pk)
 * // "0x02..." or "0x03..." (66 hex chars)
 * ```
 *
 * @module PublicKey/Compressed
 * @since 0.1.0
 */

import { PublicKey, type PublicKeyType } from "@tevm/voltaire/PublicKey";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

const PublicKeyTypeSchema = S.declare<PublicKeyType>(
	(u): u is PublicKeyType => u instanceof Uint8Array && u.length === 64,
	{ identifier: "PublicKey" },
);

function bytesToHex(bytes: Uint8Array): string {
	return `0x${Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("")}`;
}

export const Compressed: S.Schema<PublicKeyType, string> = S.transformOrFail(
	S.String,
	PublicKeyTypeSchema,
	{
		strict: true,
		decode: (s, _options, ast) => {
			try {
				return ParseResult.succeed(PublicKey.from(s));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, s, (e as Error).message),
				);
			}
		},
		encode: (pk, _options, ast) => {
			try {
				const compressed = PublicKey.compress(pk);
				return ParseResult.succeed(bytesToHex(compressed));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, pk, (e as Error).message),
				);
			}
		},
	},
).annotations({ identifier: "PublicKey.Compressed" });
