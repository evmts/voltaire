/**
 * @fileoverview Effect Schema for NetworkId from number encoding.
 * Provides bidirectional transformation between numbers and NetworkIdType.
 *
 * @module Number
 * @since 0.1.0
 */

import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

/**
 * Branded type representing an Ethereum network ID.
 *
 * @description
 * Network IDs are used to identify different Ethereum networks at the
 * networking layer. While chain IDs are used for transaction signing
 * (EIP-155), network IDs are used for peer-to-peer networking.
 */
export type NetworkIdType = number & { readonly __tag: "NetworkId" };

/**
 * Internal schema declaration for NetworkIdType.
 * Validates that a value is a non-negative integer.
 *
 * @internal
 */
const NetworkIdTypeSchema = S.declare<NetworkIdType>(
	(u): u is NetworkIdType =>
		typeof u === "number" && globalThis.Number.isInteger(u) && u >= 0,
	{ identifier: "NetworkId" },
);

/**
 * Schema for NetworkId encoded as a number.
 *
 * @description
 * Transforms numbers to NetworkIdType and vice versa.
 * Validates that the input is a non-negative integer.
 *
 * @example Decoding
 * ```typescript
 * import * as NetworkId from 'voltaire-effect/primitives/NetworkId'
 * import * as S from 'effect/Schema'
 *
 * const mainnet = S.decodeSync(NetworkId.Number)(1)
 * const sepolia = S.decodeSync(NetworkId.Number)(11155111)
 * ```
 *
 * @example Encoding
 * ```typescript
 * const num = S.encodeSync(NetworkId.Number)(networkId)
 * // 1
 * ```
 *
 * @since 0.1.0
 */
export const Number: S.Schema<NetworkIdType, number> = S.transformOrFail(
	S.Number,
	NetworkIdTypeSchema,
	{
		strict: true,
		decode: (n, _options, ast) => {
			if (!globalThis.Number.isInteger(n) || n < 0) {
				return ParseResult.fail(
					new ParseResult.Type(
						ast,
						n,
						`Network ID must be a non-negative integer, got ${n}`,
					),
				);
			}
			return ParseResult.succeed(n as NetworkIdType);
		},
		encode: (networkId, _options, _ast) => {
			return ParseResult.succeed(networkId as number);
		},
	},
).annotations({ identifier: "NetworkId.Number" });

/**
 * Ethereum Mainnet network ID (1).
 * @since 0.1.0
 */
export const MAINNET = 1 as NetworkIdType;

/**
 * Goerli testnet network ID (5).
 * @deprecated Use SEPOLIA or HOLESKY instead
 * @since 0.1.0
 */
export const GOERLI = 5 as NetworkIdType;

/**
 * Sepolia testnet network ID (11155111).
 * @since 0.1.0
 */
export const SEPOLIA = 11155111 as NetworkIdType;

/**
 * Holesky testnet network ID (17000).
 * @since 0.1.0
 */
export const HOLESKY = 17000 as NetworkIdType;
