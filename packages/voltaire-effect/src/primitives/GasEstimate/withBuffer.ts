/**
 * @fileoverview Pure function to add buffer to gas estimate.
 * @module GasEstimate/withBuffer
 * @since 0.1.0
 */

import { GasEstimate as VoltaireGasEstimate } from "@tevm/voltaire";
import type { GasEstimateType } from "./BigInt.js";

/**
 * Adds a percentage buffer to a gas estimate for safety margin.
 *
 * Gas estimates can become inaccurate if blockchain state changes between
 * estimation and execution. Adding a buffer (typically 10-20%) helps ensure
 * the transaction has enough gas to complete.
 *
 * Formula: bufferedEstimate = estimate * (1 + percentageBuffer / 100)
 *
 * @param estimate - Base gas estimate to buffer
 * @param percentageBuffer - Buffer percentage (e.g., 20 for 20% increase)
 * @returns Buffered gas estimate
 *
 * @example
 * ```typescript
 * import * as GasEstimate from 'voltaire-effect/primitives/GasEstimate'
 * import * as S from 'effect/Schema'
 *
 * const estimate = S.decodeSync(GasEstimate.BigInt)(50000n)
 * const buffered = GasEstimate.withBuffer(estimate, 20) // 60000n
 * ```
 *
 * @since 0.1.0
 */
export const withBuffer = (
	estimate: GasEstimateType,
	percentageBuffer: number,
): GasEstimateType =>
	VoltaireGasEstimate.GasEstimate.withBuffer(estimate, percentageBuffer);
