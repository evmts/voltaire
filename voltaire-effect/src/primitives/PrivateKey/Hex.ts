/**
 * Schema for PrivateKey encoded as a hex string.
 *
 * @description
 * Transforms hex strings to PrivateKeyType and vice versa.
 * Accepts 64-character hex strings (with or without 0x prefix).
 * Encodes to lowercase hex with 0x prefix.
 *
 * @example Decoding
 * ```typescript
 * import * as PrivateKey from 'voltaire-effect/primitives/PrivateKey'
 * import * as S from 'effect/Schema'
 *
 * const pk = S.decodeSync(PrivateKey.Hex)('0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef')
 * ```
 *
 * @example Encoding
 * ```typescript
 * const hex = S.encodeSync(PrivateKey.Hex)(pk)
 * // "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
 * ```
 *
 * @module PrivateKey/Hex
 * @since 0.1.0
 */

import {
	_toHex,
	PrivateKey,
	type PrivateKeyType,
} from "@tevm/voltaire/PrivateKey";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

const PrivateKeyTypeSchema = S.declare<PrivateKeyType>(
	(u): u is PrivateKeyType => u instanceof Uint8Array && u.length === 32,
	{ identifier: "PrivateKey" },
);

export const Hex: S.Schema<PrivateKeyType, string> = S.transformOrFail(
	S.String,
	PrivateKeyTypeSchema,
	{
		strict: true,
		decode: (s, _options, ast) => {
			try {
				return ParseResult.succeed(PrivateKey.from(s));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, s, (e as Error).message),
				);
			}
		},
		encode: (pk, _options, ast) => {
			try {
				return ParseResult.succeed(_toHex.call(pk));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, pk, (e as Error).message),
				);
			}
		},
	},
).annotations({ identifier: "PrivateKey.Hex" });
