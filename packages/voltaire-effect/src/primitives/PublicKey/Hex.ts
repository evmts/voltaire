/**
 * Schema for PublicKey encoded as a hex string.
 *
 * @description
 * Transforms hex strings to PublicKeyType and vice versa.
 * Accepts 128-character hex strings (64 bytes uncompressed, with or without 0x prefix).
 * Also accepts compressed format (66 chars / 33 bytes) and auto-decompresses.
 * Encodes to lowercase hex with 0x prefix.
 *
 * @example Decoding
 * ```typescript
 * import * as PublicKey from 'voltaire-effect/primitives/PublicKey'
 * import * as S from 'effect/Schema'
 *
 * const pk = S.decodeSync(PublicKey.Hex)('0x04...')
 * ```
 *
 * @example Encoding
 * ```typescript
 * const hex = S.encodeSync(PublicKey.Hex)(pk)
 * // "0x..." (128 hex chars, uncompressed)
 * ```
 *
 * @module PublicKey/Hex
 * @since 0.1.0
 */

import {
	_toHex,
	PublicKey,
	type PublicKeyType,
} from "@tevm/voltaire/PublicKey";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

const PublicKeyTypeSchema = S.declare<PublicKeyType>(
	(u): u is PublicKeyType => u instanceof Uint8Array && u.length === 64,
	{ identifier: "PublicKey" },
);

export const Hex: S.Schema<PublicKeyType, string> = S.transformOrFail(
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
		encode: (pk) => ParseResult.succeed(_toHex.call(pk)),
	},
).annotations({ identifier: "PublicKey.Hex" });
