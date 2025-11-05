import { PER_AUTH_BASE_COST, PER_EMPTY_ACCOUNT_COST } from "./constants.js";

/**
 * Calculate gas cost for authorization list
 *
 * @param {import("./BrandedAuthorization.js").BrandedAuthorization[]} authList - Authorization list
 * @param {number} emptyAccounts - Number of empty accounts being authorized
 * @returns {bigint} Total gas cost
 *
 * @example
 * ```typescript
 * const authList: Item[] = [...];
 * const gas = calculateGasCost(authList, 2);
 * console.log(`Gas required: ${gas}`);
 * ```
 */
export function calculateGasCost(authList, emptyAccounts) {
	const authCost = BigInt(authList.length) * PER_AUTH_BASE_COST;
	const emptyCost = BigInt(emptyAccounts) * PER_EMPTY_ACCOUNT_COST;
	return authCost + emptyCost;
}
