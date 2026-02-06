/**
 * @fileoverview Effect Schema for Nonce from number encoding.
 * Provides bidirectional transformation between numbers and NonceType.
 *
 * @module Number
 * @since 0.1.0
 */

import { Uint } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

/**
 * Branded type representing an Ethereum account nonce.
 *
 * @description
 * A nonce is a counter that tracks the number of transactions sent from an account.
 * Nonces are used to prevent replay attacks and order transactions.
 */
export type NonceType = bigint & { readonly __tag: "Nonce" };

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
 * Schema for Nonce encoded as a number.
 *
 * @description
 * Transforms numbers to NonceType and vice versa.
 * Validates that the input is a non-negative integer.
 *
 * @example Decoding
 * ```typescript
 * import * as Nonce from 'voltaire-effect/primitives/Nonce'
 * import * as S from 'effect/Schema'
 *
 * const nonce = S.decodeSync(Nonce.Number)(42)
 * ```
 *
 * @example Encoding
 * ```typescript
 * const num = S.encodeSync(Nonce.Number)(nonce)
 * // 42
 * ```
 *
 * @since 0.1.0
 */
export const Number: S.Schema<NonceType, number> = S.transformOrFail(
	S.Number,
	NonceTypeSchema,
	{
		strict: true,
		decode: (n, _options, ast) => {
			try {
				return ParseResult.succeed(Uint.from(n) as unknown as NonceType);
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, n, (e as Error).message),
				);
			}
		},
		encode: (nonce, _options, _ast) => {
			return ParseResult.succeed(globalThis.Number(nonce));
		},
	},
).annotations({ identifier: "Nonce.Number" });
