/**
 * @fileoverview Pure function to convert gas estimate to gas limit.
 * @module GasEstimate/toGasLimit
 * @since 0.1.0
 */

import { type Gas, GasEstimate as VoltaireGasEstimate } from "@tevm/voltaire";
import type { GasEstimateType } from "./BigInt.js";

export type GasLimitType = Gas.GasLimitType;

/**
 * Converts a gas estimate to a gas limit for transaction submission.
 *
 * Transforms a GasEstimateType to a GasLimitType for use in transaction
 * parameters. The gas limit is the maximum gas the transaction can use.
 *
 * @param estimate - Gas estimate to convert
 * @returns Gas limit for transaction submission
 *
 * @example
 * ```typescript
 * import * as GasEstimate from 'voltaire-effect/primitives/GasEstimate'
 * import * as S from 'effect/Schema'
 *
 * const estimate = S.decodeSync(GasEstimate.BigInt)(52000n)
 * const buffered = GasEstimate.withBuffer(estimate, 20)
 * const gasLimit = GasEstimate.toGasLimit(buffered)
 * ```
 *
 * @since 0.1.0
 */
export const toGasLimit = (estimate: GasEstimateType): GasLimitType =>
	VoltaireGasEstimate.GasEstimate.toGasLimit(estimate) as GasLimitType;
