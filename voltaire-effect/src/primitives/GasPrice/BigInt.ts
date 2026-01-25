/**
 * @fileoverview Effect Schema for GasPrice from bigint encoding.
 * Provides bidirectional transformation between bigints and GasPriceType.
 *
 * @module BigInt
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
 * Schema for GasPrice encoded as a bigint (in wei).
 *
 * @description
 * Transforms bigints to GasPriceType and vice versa.
 * Values are in wei. Validates that the input is a non-negative integer.
 *
 * @example Decoding
 * ```typescript
 * import * as GasPrice from 'voltaire-effect/primitives/GasPrice'
 * import * as S from 'effect/Schema'
 *
 * // 1 gwei in wei
 * const price = S.decodeSync(GasPrice.BigInt)(1000000000n)
 * ```
 *
 * @example Encoding
 * ```typescript
 * const bigint = S.encodeSync(GasPrice.BigInt)(price)
 * // 1000000000n
 * ```
 *
 * @since 0.1.0
 */
export const BigInt: S.Schema<GasPriceType, bigint> = S.transformOrFail(
	S.BigIntFromSelf,
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
			return ParseResult.succeed(gasPrice as bigint);
		},
	},
).annotations({ identifier: "GasPrice.BigInt" });
