/**
 * @fileoverview Effect Schema for ChainId from number encoding.
 * Provides bidirectional transformation between numbers and ChainIdType.
 *
 * @module Number
 * @since 0.1.0
 */

import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

/**
 * Branded type representing an Ethereum chain ID.
 *
 * @description
 * Chain IDs are positive integers that uniquely identify an Ethereum network.
 * They are defined in EIP-155 and used to prevent replay attacks across chains.
 */
export type ChainIdType = number & { readonly __tag: "ChainId" };

/**
 * Internal schema declaration for ChainIdType.
 * Validates that a value is a positive integer.
 *
 * @internal
 */
const ChainIdTypeSchema = S.declare<ChainIdType>(
	(u): u is ChainIdType =>
		typeof u === "number" && globalThis.Number.isInteger(u) && u > 0,
	{ identifier: "ChainId" },
);

/**
 * Schema for ChainId encoded as a number.
 *
 * @description
 * Transforms numbers to ChainIdType and vice versa.
 * Validates that the input is a positive integer.
 *
 * @example Decoding
 * ```typescript
 * import * as ChainId from 'voltaire-effect/primitives/ChainId'
 * import * as S from 'effect/Schema'
 *
 * const mainnet = S.decodeSync(ChainId.Number)(1)
 * const sepolia = S.decodeSync(ChainId.Number)(11155111)
 * ```
 *
 * @example Encoding
 * ```typescript
 * const num = S.encodeSync(ChainId.Number)(chainId)
 * // 1
 * ```
 *
 * @since 0.1.0
 */
export const Number: S.Schema<ChainIdType, number> = S.transformOrFail(
	S.Number,
	ChainIdTypeSchema,
	{
		strict: true,
		decode: (n, _options, ast) => {
			if (!globalThis.Number.isInteger(n) || n <= 0) {
				return ParseResult.fail(
					new ParseResult.Type(
						ast,
						n,
						`Chain ID must be a positive integer, got ${n}`,
					),
				);
			}
			return ParseResult.succeed(n as ChainIdType);
		},
		encode: (chainId, _options, _ast) => {
			return ParseResult.succeed(chainId as number);
		},
	},
).annotations({ identifier: "ChainId.Number" });
