/**
 * @fileoverview Schema for EffectiveGasPrice from bigint (wei).
 * @module EffectiveGasPrice/BigInt
 * @since 0.1.0
 */

import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

export type EffectiveGasPriceType = bigint & {
	readonly __tag: "EffectiveGasPrice";
};

const EffectiveGasPriceTypeSchema = S.declare<EffectiveGasPriceType>(
	(u): u is EffectiveGasPriceType => typeof u === "bigint",
	{ identifier: "EffectiveGasPrice" },
);

/**
 * Schema for EffectiveGasPrice from bigint (wei).
 *
 * @example
 * ```typescript
 * import * as EffectiveGasPrice from 'voltaire-effect/primitives/EffectiveGasPrice'
 * import * as S from 'effect/Schema'
 *
 * const price = S.decodeSync(EffectiveGasPrice.BigInt)(22000000000n) // 22 gwei in wei
 * ```
 *
 * @since 0.1.0
 */
export const BigInt: S.Schema<EffectiveGasPriceType, bigint> =
	S.transformOrFail(S.BigIntFromSelf, EffectiveGasPriceTypeSchema, {
		strict: true,
		decode: (value, _options, ast) => {
			try {
				return ParseResult.succeed(
					globalThis.BigInt(value) as EffectiveGasPriceType,
				);
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, value, (e as Error).message),
				);
			}
		},
		encode: (price) => ParseResult.succeed(price as bigint),
	}).annotations({ identifier: "EffectiveGasPrice.BigInt" });
