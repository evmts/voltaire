/**
 * Schema for PrivateKey encoded as raw bytes.
 *
 * @description
 * Transforms Uint8Array to PrivateKeyType and vice versa.
 * Accepts 32-byte arrays. Encodes back to Uint8Array.
 *
 * @example Decoding
 * ```typescript
 * import * as PrivateKey from 'voltaire-effect/primitives/PrivateKey'
 * import * as S from 'effect/Schema'
 *
 * const bytes = new Uint8Array(32).fill(1)
 * const pk = S.decodeSync(PrivateKey.Bytes)(bytes)
 * ```
 *
 * @example Encoding
 * ```typescript
 * const rawBytes = S.encodeSync(PrivateKey.Bytes)(pk)
 * ```
 *
 * @module PrivateKey/Bytes
 * @since 0.1.0
 */

import { PrivateKey, type PrivateKeyType } from "@tevm/voltaire/PrivateKey";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

const PrivateKeyTypeSchema = S.declare<PrivateKeyType>(
	(u): u is PrivateKeyType => u instanceof Uint8Array && u.length === 32,
	{ identifier: "PrivateKey" },
);

export const Bytes: S.Schema<PrivateKeyType, Uint8Array> = S.transformOrFail(
	S.Uint8ArrayFromSelf,
	PrivateKeyTypeSchema,
	{
		strict: true,
		decode: (bytes, _options, ast) => {
			try {
				return ParseResult.succeed(PrivateKey.fromBytes(bytes));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, bytes, (e as Error).message),
				);
			}
		},
		encode: (pk, _options, ast) => {
			try {
				return ParseResult.succeed(new Uint8Array(pk));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, pk, (e as Error).message),
				);
			}
		},
	},
).annotations({ identifier: "PrivateKey.Bytes" });
