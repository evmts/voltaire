/**
 * @fileoverview Schema for Uint256 encoded as bytes.
 * @module Uint/Bytes
 * @since 0.1.0
 */

import {
	isUint256,
	Uint256,
	type Type as Uint256Type,
} from "@tevm/voltaire/Uint";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

const Uint256TypeSchema = S.declare<Uint256Type>(
	(u): u is Uint256Type => isUint256(u),
	{ identifier: "Uint256" },
);

/**
 * Schema for Uint256 encoded as a Uint8Array.
 *
 * @description
 * Accepts big-endian byte arrays (up to 32 bytes).
 * Encodes to a 32-byte Uint8Array.
 *
 * @example Decoding
 * ```typescript
 * import * as Uint from 'voltaire-effect/primitives/Uint'
 * import * as S from 'effect/Schema'
 *
 * const bytes = new Uint8Array([0, 0, 0, 100])
 * const value = S.decodeSync(Uint.Bytes)(bytes)
 * ```
 *
 * @example Encoding
 * ```typescript
 * const bytes = S.encodeSync(Uint.Bytes)(value)
 * // Uint8Array (32 bytes)
 * ```
 *
 * @since 0.1.0
 */
export const Bytes: S.Schema<Uint256Type, Uint8Array> = S.transformOrFail(
	S.Uint8ArrayFromSelf,
	Uint256TypeSchema,
	{
		strict: true,
		decode: (bytes, _options, ast) => {
			try {
				return ParseResult.succeed(Uint256.fromBytes(bytes));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, bytes, (e as Error).message),
				);
			}
		},
		encode: (uint, _options, _ast) => {
			return ParseResult.succeed(Uint256.toBytes(uint));
		},
	},
).annotations({ identifier: "Uint256.Bytes" });
