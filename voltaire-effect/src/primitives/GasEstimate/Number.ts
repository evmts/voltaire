/**
 * @fileoverview Schema for GasEstimate from number.
 * @module GasEstimate/Number
 * @since 0.1.0
 */

import { GasEstimate as VoltaireGasEstimate } from "@tevm/voltaire";
import * as ParseResult from "effect/ParseResult";
import * as S from "effect/Schema";
import type { GasEstimateType } from "./BigInt.js";

const GasEstimateTypeSchema = S.declare<GasEstimateType>(
	(u): u is GasEstimateType => typeof u === "bigint" && u >= 0n,
	{ identifier: "GasEstimate" },
);

/**
 * Schema for GasEstimate from number.
 *
 * @example
 * ```typescript
 * import * as GasEstimate from 'voltaire-effect/primitives/GasEstimate'
 * import * as S from 'effect/Schema'
 *
 * const estimate = S.decodeSync(GasEstimate.Number)(52000)
 * ```
 *
 * @since 0.1.0
 */
export const Number: S.Schema<GasEstimateType, number> = S.transformOrFail(
	S.Number,
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
		encode: (gasEstimate) =>
			ParseResult.succeed(globalThis.Number(gasEstimate)),
	},
).annotations({ identifier: "GasEstimate.Number" });
