/**
 * @fileoverview Effect Schema for NetworkId from bigint encoding.
 * Provides bidirectional transformation between bigints and NetworkIdType.
 *
 * @module BigInt
 * @since 0.1.0
 */

import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";
import type { NetworkIdType } from "./Number.js";

/**
 * Internal schema declaration for NetworkIdType.
 * Validates that a value is a non-negative integer.
 *
 * @internal
 */
const NetworkIdTypeSchema = S.declare<NetworkIdType>(
	(u): u is NetworkIdType =>
		typeof u === "number" && Number.isInteger(u) && u >= 0,
	{ identifier: "NetworkId" },
);

/**
 * Schema for NetworkId encoded as a bigint.
 *
 * @description
 * Transforms bigints to NetworkIdType and vice versa.
 * Validates that the input is a non-negative integer within safe number range.
 *
 * @example Decoding
 * ```typescript
 * import * as NetworkId from 'voltaire-effect/primitives/NetworkId'
 * import * as S from 'effect/Schema'
 *
 * const mainnet = S.decodeSync(NetworkId.BigInt)(1n)
 * const sepolia = S.decodeSync(NetworkId.BigInt)(11155111n)
 * ```
 *
 * @example Encoding
 * ```typescript
 * const bigint = S.encodeSync(NetworkId.BigInt)(networkId)
 * // 1n
 * ```
 *
 * @since 0.1.0
 */
export const BigInt: S.Schema<NetworkIdType, bigint> = S.transformOrFail(
	S.BigIntFromSelf,
	NetworkIdTypeSchema,
	{
		strict: true,
		decode: (n, _options, ast) => {
			if (n < 0n) {
				return ParseResult.fail(
					new ParseResult.Type(
						ast,
						n,
						`Network ID must be a non-negative integer, got ${n}`,
					),
				);
			}
			if (n > globalThis.BigInt(globalThis.Number.MAX_SAFE_INTEGER)) {
				return ParseResult.fail(
					new ParseResult.Type(
						ast,
						n,
						`Network ID exceeds safe integer range: ${n}`,
					),
				);
			}
			return ParseResult.succeed(globalThis.Number(n) as NetworkIdType);
		},
		encode: (networkId, _options, _ast) => {
			return ParseResult.succeed(globalThis.BigInt(networkId));
		},
	},
).annotations({ identifier: "NetworkId.BigInt" });
