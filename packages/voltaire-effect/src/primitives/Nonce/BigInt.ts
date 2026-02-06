/**
 * @fileoverview Effect Schema for Nonce from bigint encoding.
 * Provides bidirectional transformation between bigints and NonceType.
 *
 * @module BigInt
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
 * Schema for Nonce encoded as a bigint.
 *
 * @description
 * Transforms bigints to NonceType and vice versa.
 * Validates that the input is a non-negative integer.
 *
 * @example Decoding
 * ```typescript
 * import * as Nonce from 'voltaire-effect/primitives/Nonce'
 * import * as S from 'effect/Schema'
 *
 * const nonce = S.decodeSync(Nonce.BigInt)(42n)
 * ```
 *
 * @example Encoding
 * ```typescript
 * const bigint = S.encodeSync(Nonce.BigInt)(nonce)
 * // 42n
 * ```
 *
 * @since 0.1.0
 */
export const BigInt: S.Schema<NonceType, bigint> = S.transformOrFail(
	S.BigIntFromSelf,
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
			return ParseResult.succeed(nonce as bigint);
		},
	},
).annotations({ identifier: "Nonce.BigInt" });
