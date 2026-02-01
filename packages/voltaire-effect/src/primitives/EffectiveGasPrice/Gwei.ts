/**
 * @fileoverview Schema for EffectiveGasPrice from gwei.
 * @module EffectiveGasPrice/Gwei
 * @since 0.1.0
 */

import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";
import type { EffectiveGasPriceType } from "./BigInt.js";

const GWEI = 1_000_000_000n;

const EffectiveGasPriceTypeSchema = S.declare<EffectiveGasPriceType>(
	(u): u is EffectiveGasPriceType => typeof u === "bigint",
	{ identifier: "EffectiveGasPrice" },
);

/**
 * Schema for EffectiveGasPrice from gwei.
 * Decodes gwei to wei, encodes wei to gwei.
 *
 * @example
 * ```typescript
 * import * as EffectiveGasPrice from 'voltaire-effect/primitives/EffectiveGasPrice'
 * import * as S from 'effect/Schema'
 *
 * const price = S.decodeSync(EffectiveGasPrice.Gwei)(22) // 22 gwei -> wei
 * const gwei = S.encodeSync(EffectiveGasPrice.Gwei)(price) // 22n
 * ```
 *
 * @since 0.1.0
 */
export const Gwei: S.Schema<EffectiveGasPriceType, number | bigint> =
	S.transformOrFail(
		S.Union(S.Number, S.BigIntFromSelf),
		EffectiveGasPriceTypeSchema,
		{
			strict: true,
			decode: (value, _options, ast) => {
				try {
					const gwei =
						typeof value === "number" ? globalThis.BigInt(value) : value;
					return ParseResult.succeed(
						(gwei * GWEI) as unknown as EffectiveGasPriceType,
					);
				} catch (e) {
					return ParseResult.fail(
						new ParseResult.Type(ast, value, (e as Error).message),
					);
				}
			},
			encode: (price) => ParseResult.succeed(price / GWEI),
		},
	).annotations({ identifier: "EffectiveGasPrice.Gwei" });
