/**
 * @fileoverview Effect Schema for Hash values encoded as Uint8Array.
 *
 * @module Hash/Bytes
 * @since 0.1.0
 *
 * @example
 * ```typescript
 * import * as Hash from 'voltaire-effect/primitives/Hash'
 * import * as S from 'effect/Schema'
 *
 * // Decode from Uint8Array
 * const hash = S.decodeSync(Hash.Bytes)(new Uint8Array(32))
 *
 * // Encode back to Uint8Array
 * const bytes = S.encodeSync(Hash.Bytes)(hash)
 * ```
 */

import type { HashType } from "@tevm/voltaire/Hash";
import * as Hash from "@tevm/voltaire/Hash";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

const HashTypeSchema = S.declare<HashType>(
	(u): u is HashType => u instanceof Uint8Array && u.length === 32,
	{ identifier: "Hash" },
);

/**
 * Schema for Hash encoded as Uint8Array.
 *
 * @description
 * Transforms Uint8Array to HashType and vice versa.
 * Validates that the input is exactly 32 bytes.
 *
 * @example Decoding
 * ```typescript
 * import * as Hash from 'voltaire-effect/primitives/Hash'
 * import * as S from 'effect/Schema'
 *
 * const hash = S.decodeSync(Hash.Bytes)(new Uint8Array(32))
 * ```
 *
 * @example Encoding
 * ```typescript
 * const bytes = S.encodeSync(Hash.Bytes)(hash)
 * // Uint8Array(32)
 * ```
 *
 * @since 0.1.0
 */
export const Bytes: S.Schema<HashType, Uint8Array> = S.transformOrFail(
	S.Uint8ArrayFromSelf,
	HashTypeSchema,
	{
		strict: true,
		decode: (bytes, _options, ast) => {
			try {
				return ParseResult.succeed(Hash.fromBytes(bytes));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, bytes, (e as Error).message),
				);
			}
		},
		encode: (hash, _options, _ast) => {
			return ParseResult.succeed(Hash.toBytes(hash));
		},
	},
).annotations({ identifier: "Hash.Bytes" });
