import { PER_AUTH_BASE_COST, PER_EMPTY_ACCOUNT_COST } from "./constants.js";

/**
 * Calculate gas cost for this authorization
 *
 * @param {import("./BrandedAuthorization.js").BrandedAuthorization} auth - Authorization
 * @param {boolean} isEmpty - Whether the account is empty
 * @returns {bigint} Gas cost for this authorization
 *
 * @example
 * ```typescript
 * const auth: Item = {...};
 * const gas = getGasCost(auth, true);
 * ```
 */
export function getGasCost(auth, isEmpty) {
	return PER_AUTH_BASE_COST + (isEmpty ? PER_EMPTY_ACCOUNT_COST : 0n);
}
