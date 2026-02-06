import { ADDRESS_COST, STORAGE_KEY_COST } from "./constants.js";

/**
 * Calculate total gas cost for access list (EIP-2930)
 *
 * @see https://voltaire.tevm.sh/primitives/accesslist
 * @since 0.0.0
 * @param {import('../BrandedAccessList.js').BrandedAccessList} list - Access list to calculate cost for
 * @returns {bigint} Total gas cost in wei
 * @throws {never}
 * @example
 * ```javascript
 * import * as AccessList from './primitives/AccessList/index.js';
 * const list = AccessList.from([{ address: '0x742d35Cc...', storageKeys: ['0x00...01', '0x00...02'] }]);
 * const cost = AccessList.gasCost(list);
 * // cost = ADDRESS_COST + (2 * STORAGE_KEY_COST)
 * ```
 */
export function gasCost(list) {
	let totalCost = 0n;
	for (const item of list) {
		totalCost += ADDRESS_COST;
		totalCost += STORAGE_KEY_COST * BigInt(item.storageKeys.length);
	}
	return totalCost;
}

export { ADDRESS_COST, STORAGE_KEY_COST };
