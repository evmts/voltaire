/**
 * @fileoverview Effect Schema for ChainId from bigint encoding.
 * Provides bidirectional transformation between bigints and ChainIdType.
 *
 * @module BigInt
 * @since 0.1.0
 */

import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";
import type { ChainIdType } from "./Number.js";

/**
 * Internal schema declaration for ChainIdType.
 * Validates that a value is a positive integer.
 *
 * @internal
 */
const ChainIdTypeSchema = S.declare<ChainIdType>(
	(u): u is ChainIdType =>
		typeof u === "number" && Number.isInteger(u) && u > 0,
	{ identifier: "ChainId" },
);

/**
 * Schema for ChainId encoded as a bigint.
 *
 * @description
 * Transforms bigints to ChainIdType and vice versa.
 * Validates that the input is a positive integer within safe number range.
 *
 * @example Decoding
 * ```typescript
 * import * as ChainId from 'voltaire-effect/primitives/ChainId'
 * import * as S from 'effect/Schema'
 *
 * const mainnet = S.decodeSync(ChainId.BigInt)(1n)
 * const sepolia = S.decodeSync(ChainId.BigInt)(11155111n)
 * ```
 *
 * @example Encoding
 * ```typescript
 * const bigint = S.encodeSync(ChainId.BigInt)(chainId)
 * // 1n
 * ```
 *
 * @since 0.1.0
 */
export const BigInt: S.Schema<ChainIdType, bigint> = S.transformOrFail(
	S.BigIntFromSelf,
	ChainIdTypeSchema,
	{
		strict: true,
		decode: (n, _options, ast) => {
			if (n <= 0n) {
				return ParseResult.fail(
					new ParseResult.Type(
						ast,
						n,
						`Chain ID must be a positive integer, got ${n}`,
					),
				);
			}
			if (n > globalThis.BigInt(globalThis.Number.MAX_SAFE_INTEGER)) {
				return ParseResult.fail(
					new ParseResult.Type(
						ast,
						n,
						`Chain ID exceeds safe integer range: ${n}`,
					),
				);
			}
			return ParseResult.succeed(globalThis.Number(n) as ChainIdType);
		},
		encode: (chainId, _options, _ast) => {
			return ParseResult.succeed(globalThis.BigInt(chainId));
		},
	},
).annotations({ identifier: "ChainId.BigInt" });
