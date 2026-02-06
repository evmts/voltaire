/**
 * @fileoverview Effect Schema for GasPrice from gwei encoding.
 * Provides bidirectional transformation between gwei values and GasPriceType.
 *
 * @module Gwei
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
 * Schema for GasPrice encoded as gwei (number or bigint).
 *
 * @description
 * Transforms gwei values to GasPriceType (stored as wei) and vice versa.
 * This is the more ergonomic schema for user-facing inputs since gas prices
 * are typically expressed in gwei.
 *
 * Conversion: 1 gwei = 1,000,000,000 wei (10^9)
 *
 * @example Decoding
 * ```typescript
 * import * as GasPrice from 'voltaire-effect/primitives/GasPrice'
 * import * as S from 'effect/Schema'
 *
 * // 20 gwei -> 20,000,000,000 wei
 * const price = S.decodeSync(GasPrice.Gwei)(20)
 * ```
 *
 * @example Encoding
 * ```typescript
 * const gwei = S.encodeSync(GasPrice.Gwei)(price)
 * // 20n
 * ```
 *
 * @since 0.1.0
 */
export const Gwei: S.Schema<GasPriceType, number | bigint> = S.transformOrFail(
	S.Union(S.Number, S.BigIntFromSelf),
	GasPriceTypeSchema,
	{
		strict: true,
		decode: (n, _options, ast) => {
			try {
				return ParseResult.succeed(Gas.GasPrice.fromGwei(n));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, n, (e as Error).message),
				);
			}
		},
		encode: (gasPrice, _options, _ast) => {
			return ParseResult.succeed(Gas.GasPrice.toGwei(gasPrice));
		},
	},
).annotations({ identifier: "GasPrice.Gwei" });
