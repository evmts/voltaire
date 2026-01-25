/**
 * @fileoverview Effect Schema for ChainId from hex string encoding.
 * Provides bidirectional transformation between hex strings and ChainIdType.
 *
 * @module Hex
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
 * Schema for ChainId encoded as a hex string.
 *
 * @description
 * Transforms hex strings to ChainIdType and vice versa.
 * Validates that the input is a valid hex string representing a positive integer.
 *
 * @example Decoding
 * ```typescript
 * import * as ChainId from 'voltaire-effect/primitives/ChainId'
 * import * as S from 'effect/Schema'
 *
 * const mainnet = S.decodeSync(ChainId.Hex)('0x1')
 * const sepolia = S.decodeSync(ChainId.Hex)('0xaa36a7')
 * ```
 *
 * @example Encoding
 * ```typescript
 * const hex = S.encodeSync(ChainId.Hex)(chainId)
 * // "0x1"
 * ```
 *
 * @since 0.1.0
 */
export const Hex: S.Schema<ChainIdType, string> = S.transformOrFail(
	S.String,
	ChainIdTypeSchema,
	{
		strict: true,
		decode: (s, _options, ast) => {
			try {
				const trimmed = s.startsWith("0x") ? s.slice(2) : s;
				if (!/^[0-9a-fA-F]+$/.test(trimmed)) {
					return ParseResult.fail(
						new ParseResult.Type(ast, s, `Invalid hex string: ${s}`),
					);
				}
				const value = parseInt(trimmed, 16);
				if (!Number.isFinite(value) || value <= 0) {
					return ParseResult.fail(
						new ParseResult.Type(
							ast,
							s,
							`Chain ID must be a positive integer, got ${value}`,
						),
					);
				}
				return ParseResult.succeed(value as ChainIdType);
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, s, (e as Error).message),
				);
			}
		},
		encode: (chainId, _options, _ast) => {
			return ParseResult.succeed(`0x${chainId.toString(16)}`);
		},
	},
).annotations({ identifier: "ChainId.Hex" });
