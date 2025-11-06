import { SstoreRefund } from "./constants.js";
import { hasEIP3529 } from "./hasEIP3529.js";

/**
 * Get storage refund for hardfork
 *
 * @param {import('../types.js').Hardfork} hardfork - EVM hardfork
 * @returns {bigint} Gas refund amount
 */
export function getSstoreRefund(hardfork) {
	return hasEIP3529(hardfork) ? SstoreRefund : 15000n;
}
