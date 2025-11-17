import { MaxRefundQuotient } from "./constants.js";

/**
 * Calculate maximum gas refund
 *
 * @param {bigint} gasUsed - Total gas used in transaction
 * @returns {bigint} Maximum refundable gas
 */
export function calculateMaxRefund(gasUsed) {
	return gasUsed / MaxRefundQuotient;
}
