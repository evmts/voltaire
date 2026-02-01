/**
 * @fileoverview Effect Schema for GasPrice from number encoding.
 * Provides bidirectional transformation between numbers and GasPriceType.
 *
 * @module Number
 * @since 0.1.0
 */

import { Gas } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

/**
 * Branded bigint type representing a gas price in wei.
 */
export type GasPriceType = Gas.GasPriceType;

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
 * Schema for GasPrice encoded as a number (in wei).
 *
 * @description
 * Transforms numbers to GasPriceType and vice versa.
 * Values are in wei. Validates that the input is a non-negative integer.
 *
 * @example Decoding
 * ```typescript
 * import * as GasPrice from 'voltaire-effect/primitives/GasPrice'
 * import * as S from 'effect/Schema'
 *
 * // 1 gwei in wei
 * const price = S.decodeSync(GasPrice.Number)(1000000000)
 * ```
 *
 * @example Encoding
 * ```typescript
 * const num = S.encodeSync(GasPrice.Number)(price)
 * // 1000000000
 * ```
 *
 * @since 0.1.0
 */
export const Number: S.Schema<GasPriceType, number> = S.transformOrFail(
	S.Number,
	GasPriceTypeSchema,
	{
		strict: true,
		decode: (n, _options, ast) => {
			try {
				return ParseResult.succeed(Gas.GasPrice.from(n));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, n, (e as Error).message),
				);
			}
		},
		encode: (gasPrice, _options, _ast) => {
			return ParseResult.succeed(globalThis.Number(gasPrice));
		},
	},
).annotations({ identifier: "GasPrice.Number" });
