/**
 * @fileoverview Effect Schema for GasPrice from hex string encoding.
 * Provides bidirectional transformation between hex strings and GasPriceType.
 *
 * @module Hex
 * @since 0.1.0
 */

import { Gas } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";
import type { GasPriceType } from "./Number.js";

/**
 * Internal schema declaration for GasPriceType.
 * Validates that a value is a non-negative bigint.
 *
 * @internal
 */
const GasPriceTypeSchema = S.declare<GasPriceType>(
	(u): u is GasPriceType => typeof u === "bigint" && u >= 0n,
	{ identifier: "GasPrice" },
);

/**
 * Schema for GasPrice encoded as a hex string (in wei).
 *
 * @description
 * Transforms hex strings to GasPriceType and vice versa.
 * Values are in wei. Common format from RPC responses.
 *
 * @example Decoding
 * ```typescript
 * import * as GasPrice from 'voltaire-effect/primitives/GasPrice'
 * import * as S from 'effect/Schema'
 *
 * // 1 gwei in wei as hex
 * const price = S.decodeSync(GasPrice.Hex)('0x3b9aca00')
 * ```
 *
 * @example Encoding
 * ```typescript
 * const hex = S.encodeSync(GasPrice.Hex)(price)
 * // "0x3b9aca00"
 * ```
 *
 * @since 0.1.0
 */
export const Hex: S.Schema<GasPriceType, string> = S.transformOrFail(
	S.String,
	GasPriceTypeSchema,
	{
		strict: true,
		decode: (s, _options, ast) => {
			try {
				return ParseResult.succeed(Gas.GasPrice.from(s));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, s, (e as Error).message),
				);
			}
		},
		encode: (gasPrice, _options, _ast) => {
			return ParseResult.succeed(`0x${gasPrice.toString(16)}`);
		},
	},
).annotations({ identifier: "GasPrice.Hex" });
