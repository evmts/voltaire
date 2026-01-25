/**
 * @fileoverview Schema for Bytes32 encoded as hex string.
 * @module voltaire-effect/primitives/Bytes32/Hex
 * @since 0.1.0
 */

import { Bytes32, type Bytes32Type } from "@tevm/voltaire/Bytes";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

const Bytes32TypeSchema = S.declare<Bytes32Type>(
	(u): u is Bytes32Type => u instanceof Uint8Array && u.length === 32,
	{ identifier: "Bytes32" },
);

/**
 * Schema for Bytes32 encoded as a hex string.
 *
 * @description
 * Transforms hex strings (66 chars: 0x + 64 hex chars) to Bytes32Type and vice versa.
 * Encodes to lowercase 0x-prefixed hex.
 *
 * @example Decoding
 * ```typescript
 * import * as Bytes32 from 'voltaire-effect/primitives/Bytes32'
 * import * as S from 'effect/Schema'
 *
 * const b32 = S.decodeSync(Bytes32.Hex)('0x' + 'ab'.repeat(32))
 * ```
 *
 * @example Encoding
 * ```typescript
 * const hex = S.encodeSync(Bytes32.Hex)(b32)
 * // "0xabab..."
 * ```
 *
 * @since 0.1.0
 */
export const Hex: S.Schema<Bytes32Type, string> = S.transformOrFail(
	S.String,
	Bytes32TypeSchema,
	{
		strict: true,
		decode: (s, _options, ast) => {
			try {
				return ParseResult.succeed(Bytes32.fromHex(s));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, s, (e as Error).message),
				);
			}
		},
		encode: (b, _options, _ast) => {
			return ParseResult.succeed(Bytes32.toHex(b));
		},
	},
).annotations({ identifier: "Bytes32.Hex" });
