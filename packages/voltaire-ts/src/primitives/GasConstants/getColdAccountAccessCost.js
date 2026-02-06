import { ColdAccountAccess, ExtStep } from "./constants.js";
import { hasEIP2929 } from "./hasEIP2929.js";

/**
 * Get cold account access cost for hardfork
 *
 * @param {import('./types.js').Hardfork} hardfork - EVM hardfork
 * @returns {bigint} Gas cost
 */
export function getColdAccountAccessCost(hardfork) {
	return hasEIP2929(hardfork) ? ColdAccountAccess : ExtStep;
}
