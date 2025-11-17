import { SelfdestructRefund } from "./constants.js";
import { hasEIP3529 } from "./hasEIP3529.js";

/**
 * Get selfdestruct refund for hardfork
 *
 * @param {import('../types.js').Hardfork} hardfork - EVM hardfork
 * @returns {bigint} Gas refund amount
 */
export function getSelfdestructRefund(hardfork) {
	return hasEIP3529(hardfork) ? 0n : SelfdestructRefund;
}
