import { ColdSload, Sload } from "./constants.js";
import { hasEIP2929 } from "./hasEIP2929.js";

/**
 * Get cold storage cost for hardfork
 *
 * @param {import('./types.js').Hardfork} hardfork - EVM hardfork
 * @returns {bigint} Gas cost
 */
export function getColdSloadCost(hardfork) {
	return hasEIP2929(hardfork) ? ColdSload : Sload;
}
