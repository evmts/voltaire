/**
 * @fileoverview Effect Schema for Hash values encoded as hex strings.
 *
 * @module Hash/Hex
 * @since 0.1.0
 *
 * @example
 * ```typescript
 * import * as Hash from 'voltaire-effect/primitives/Hash'
 * import * as S from 'effect/Schema'
 *
 * // Decode from hex string
 * const hash = S.decodeSync(Hash.Hex)('0x' + 'ab'.repeat(32))
 *
 * // Encode back to hex
 * const hex = S.encodeSync(Hash.Hex)(hash)
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
 * Schema for Hash encoded as a hex string.
 *
 * @description
 * Transforms hex strings to HashType and vice versa.
 * Accepts 0x-prefixed hex strings representing 32 bytes.
 * Encodes to lowercase hex.
 *
 * @example Decoding
 * ```typescript
 * import * as Hash from 'voltaire-effect/primitives/Hash'
 * import * as S from 'effect/Schema'
 *
 * const hash = S.decodeSync(Hash.Hex)('0x88df016429689c079f3b2f6ad39fa052532c56795b733da78a91ebe6a713944b')
 * ```
 *
 * @example Encoding
 * ```typescript
 * const hex = S.encodeSync(Hash.Hex)(hash)
 * // "0x88df016429689c079f3b2f6ad39fa052532c56795b733da78a91ebe6a713944b"
 * ```
 *
 * @since 0.1.0
 */
export const Hex: S.Schema<HashType, string> = S.transformOrFail(
	S.String,
	HashTypeSchema,
	{
		strict: true,
		decode: (s, _options, ast) => {
			try {
				return ParseResult.succeed(Hash.from(s));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, s, (e as Error).message),
				);
			}
		},
		encode: (h, _options, _ast) => {
			return ParseResult.succeed(Hash.toHex(h));
		},
	},
).annotations({ identifier: "Hash.Hex" });
