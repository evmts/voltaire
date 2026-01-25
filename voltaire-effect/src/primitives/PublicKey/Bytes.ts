/**
 * Schema for PublicKey encoded as raw bytes.
 *
 * @description
 * Transforms Uint8Array to PublicKeyType and vice versa.
 * Accepts both compressed (33 bytes) and uncompressed (64 bytes) formats,
 * automatically decompressing compressed keys.
 * Encodes to 64-byte Uint8Array (uncompressed).
 *
 * @example Decoding
 * ```typescript
 * import * as PublicKey from 'voltaire-effect/primitives/PublicKey'
 * import * as S from 'effect/Schema'
 *
 * // Uncompressed 64-byte key
 * const pk1 = S.decodeSync(PublicKey.Bytes)(uncompressedBytes)
 *
 * // Compressed 33-byte key (auto-decompressed)
 * const pk2 = S.decodeSync(PublicKey.Bytes)(compressedBytes)
 * ```
 *
 * @example Encoding
 * ```typescript
 * const bytes = S.encodeSync(PublicKey.Bytes)(pk)
 * // 64-byte Uint8Array
 * ```
 *
 * @module PublicKey/Bytes
 * @since 0.1.0
 */

import { PublicKey, type PublicKeyType } from "@tevm/voltaire/PublicKey";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

const PublicKeyTypeSchema = S.declare<PublicKeyType>(
	(u): u is PublicKeyType => u instanceof Uint8Array && u.length === 64,
	{ identifier: "PublicKey" },
);

export const Bytes: S.Schema<PublicKeyType, Uint8Array> = S.transformOrFail(
	S.Uint8ArrayFromSelf,
	PublicKeyTypeSchema,
	{
		strict: true,
		decode: (bytes, _options, ast) => {
			try {
				if (bytes.length === 33) {
					return ParseResult.succeed(PublicKey.decompress(bytes));
				}
				if (bytes.length === 64) {
					const hexStr = Array.from(bytes)
						.map((b) => b.toString(16).padStart(2, "0"))
						.join("");
					return ParseResult.succeed(PublicKey.from(`0x${hexStr}`));
				}
				throw new Error(
					`Invalid public key length: ${bytes.length} bytes, expected 64 (uncompressed) or 33 (compressed)`,
				);
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, bytes, (e as Error).message),
				);
			}
		},
		encode: (pk) => ParseResult.succeed(new Uint8Array(pk)),
	},
).annotations({ identifier: "PublicKey.Bytes" });
