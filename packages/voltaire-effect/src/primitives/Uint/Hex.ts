/**
 * @fileoverview Schema for Uint256 encoded as a hex string.
 * @module Uint/Hex
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
 * Schema for Uint256 encoded as a hex string.
 *
 * @description
 * Accepts hex strings with or without '0x' prefix.
 * Encodes to lowercase hex with '0x' prefix (padded to 64 chars).
 *
 * @example Decoding
 * ```typescript
 * import * as Uint from 'voltaire-effect/primitives/Uint'
 * import * as S from 'effect/Schema'
 *
 * const value = S.decodeSync(Uint.Hex)('0xde0b6b3a7640000')
 * ```
 *
 * @example Encoding
 * ```typescript
 * const hex = S.encodeSync(Uint.Hex)(value)
 * // "0x0000000000000000000000000000000000000000000000000de0b6b3a7640000"
 * ```
 *
 * @since 0.1.0
 */
export const Hex: S.Schema<Uint256Type, string> = S.transformOrFail(
	S.String,
	Uint256TypeSchema,
	{
		strict: true,
		decode: (hex, _options, ast) => {
			try {
				return ParseResult.succeed(Uint256.fromHex(hex));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, hex, (e as Error).message),
				);
			}
		},
		encode: (uint, _options, _ast) => {
			return ParseResult.succeed(Uint256.toHex(uint));
		},
	},
).annotations({ identifier: "Uint256.Hex" });
