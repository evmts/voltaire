/**
 * @fileoverview Pure function to calculate capped gas refund.
 * @module GasRefund/cappedRefund
 * @since 0.1.0
 */

import { GasRefund } from "@tevm/voltaire";
import type { GasRefundType } from "./BigInt.js";

/**
 * Calculates the capped refund per EIP-3529 (max refund is gasUsed/5).
 *
 * EIP-3529 introduced a 20% cap on gas refunds to prevent gas token abuse.
 * Formula: actualRefund = min(accumulatedRefund, gasUsed / 5)
 *
 * @param refund - Accumulated refund amount from execution
 * @param gasUsed - Total gas used in transaction
 * @returns Capped refund amount
 *
 * @example
 * ```typescript
 * import * as GasRefund from 'voltaire-effect/primitives/GasRefund'
 *
 * // Refund exceeds cap
 * const capped1 = GasRefund.cappedRefund(30000n, 100000n)
 * // max = 100000/5 = 20000, so capped = 20000n
 *
 * // Refund under cap
 * const capped2 = GasRefund.cappedRefund(15000n, 100000n)
 * // max = 20000, refund = 15000, so capped = 15000n
 * ```
 *
 * @since 0.1.0
 */
export const cappedRefund = (
	refund: bigint | number | string,
	gasUsed: bigint,
): GasRefundType => GasRefund.cappedRefund(refund, gasUsed);
