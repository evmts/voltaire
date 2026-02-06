/**
 * @fileoverview Effect Schema for Nonce from hex string encoding.
 * Provides bidirectional transformation between hex strings and NonceType.
 *
 * @module Hex
 * @since 0.1.0
 */

import { Uint } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";
import type { NonceType } from "./Number.js";

/**
 * Internal schema declaration for NonceType.
 * Validates that a value is a non-negative bigint.
 *
 * @internal
 */
const NonceTypeSchema = S.declare<NonceType>(
	(u): u is NonceType => typeof u === "bigint" && u >= 0n,
	{ identifier: "Nonce" },
);

/**
 * Schema for Nonce encoded as a hex string.
 *
 * @description
 * Transforms hex strings to NonceType and vice versa.
 * Validates that the input is a valid hex string representing a non-negative integer.
 *
 * @example Decoding
 * ```typescript
 * import * as Nonce from 'voltaire-effect/primitives/Nonce'
 * import * as S from 'effect/Schema'
 *
 * const nonce = S.decodeSync(Nonce.Hex)('0x2a')
 * ```
 *
 * @example Encoding
 * ```typescript
 * const hex = S.encodeSync(Nonce.Hex)(nonce)
 * // "0x2a"
 * ```
 *
 * @since 0.1.0
 */
export const Hex: S.Schema<NonceType, string> = S.transformOrFail(
	S.String,
	NonceTypeSchema,
	{
		strict: true,
		decode: (s, _options, ast) => {
			try {
				return ParseResult.succeed(Uint.from(s) as unknown as NonceType);
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, s, (e as Error).message),
				);
			}
		},
		encode: (nonce, _options, _ast) => {
			return ParseResult.succeed(`0x${nonce.toString(16)}`);
		},
	},
).annotations({ identifier: "Nonce.Hex" });
