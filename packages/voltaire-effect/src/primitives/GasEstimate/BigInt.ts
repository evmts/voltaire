/**
 * @fileoverview Schema for GasEstimate from bigint.
 * @module GasEstimate/BigInt
 * @since 0.1.0
 */

import { GasEstimate as VoltaireGasEstimate } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";

export type GasEstimateType = VoltaireGasEstimate.GasEstimateType;

const GasEstimateTypeSchema = S.declare<GasEstimateType>(
	(u): u is GasEstimateType => typeof u === "bigint" && u >= 0n,
	{ identifier: "GasEstimate" },
);

/**
 * Schema for GasEstimate from bigint.
 *
 * @example
 * ```typescript
 * import * as GasEstimate from 'voltaire-effect/primitives/GasEstimate'
 * import * as S from 'effect/Schema'
 *
 * const estimate = S.decodeSync(GasEstimate.BigInt)(52000n)
 * ```
 *
 * @since 0.1.0
 */
export const BigInt: S.Schema<GasEstimateType, bigint> = S.transformOrFail(
	S.BigIntFromSelf,
	GasEstimateTypeSchema,
	{
		strict: true,
		decode: (value, _options, ast) => {
			try {
				return ParseResult.succeed(VoltaireGasEstimate.GasEstimate.from(value));
			} catch (e) {
				return ParseResult.fail(
					new ParseResult.Type(ast, value, (e as Error).message),
				);
			}
		},
		encode: (gasEstimate) => ParseResult.succeed(gasEstimate as bigint),
	},
).annotations({ identifier: "GasEstimate.BigInt" });
