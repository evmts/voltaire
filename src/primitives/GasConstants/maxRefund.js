import { calculateMaxRefund } from "./calculateMaxRefund.js";

/**
 * Calculate maximum gas refund (convenience form with this:)
 *
 * @this {bigint}
 * @returns {bigint}
 */
export function maxRefund() {
	return calculateMaxRefund(this);
}
