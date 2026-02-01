/**
 * @fileoverview Effect Schema for NetworkId from hex string encoding.
 * Provides bidirectional transformation between hex strings and NetworkIdType.
 *
 * @module Hex
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
 * Schema for NetworkId encoded as a hex string.
 *
 * @description
 * Transforms hex strings to NetworkIdType and vice versa.
 * Validates that the input is a valid hex string representing a non-negative integer.
 *
 * @example Decoding
 * ```typescript
 * import * as NetworkId from 'voltaire-effect/primitives/NetworkId'
 * import * as S from 'effect/Schema'
 *
 * const mainnet = S.decodeSync(NetworkId.Hex)('0x1')
 * const sepolia = S.decodeSync(NetworkId.Hex)('0xaa36a7')
 * ```
 *
 * @example Encoding
 * ```typescript
 * const hex = S.encodeSync(NetworkId.Hex)(networkId)
 * // "0x1"
 * ```
 *
 * @since 0.1.0
 */
export const Hex: S.Schema<NetworkIdType, string> = S.transformOrFail(
	S.String,
	NetworkIdTypeSchema,
	{
		strict: true,
		decode: (s, _options, ast) => {
			try {
				const trimmed = s.startsWith("0x") ? s.slice(2) : s;
				if (trimmed.length === 0) {
					return ParseResult.succeed(0 as NetworkIdType);
				}
				if (!/^[0-9a-fA-F]+$/.test(trimmed)) {
					return ParseResult.fail(
						new ParseResult.Type(ast, s, `Invalid hex string: ${s}`),
					);
				}
				const value = parseInt(trimmed, 16);
				if (!Number.isFinite(value) || value < 0) {
					return ParseResult.fail(
						new ParseResult.Type(
							ast,
							s,
							`Network ID must be a non-negative integer, got ${value}`,
						),
					);
				}
				return ParseResult.succeed(value as NetworkIdType);
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, s, (e as Error).message),
				);
			}
		},
		encode: (networkId, _options, _ast) => {
			return ParseResult.succeed(`0x${networkId.toString(16)}`);
		},
	},
).annotations({ identifier: "NetworkId.Hex" });
