import { PER_AUTH_BASE_COST, PER_EMPTY_ACCOUNT_COST } from "./constants.js";

/**
 * Calculate gas cost for this authorization
 *
 * @see https://voltaire.tevm.sh/primitives/authorization
 * @since 0.0.0
 * @param {import("./BrandedAuthorization.js").BrandedAuthorization} _auth - Authorization
 * @param {boolean} isEmpty - Whether the account is empty
 * @returns {bigint} Gas cost for this authorization
 * @throws {never}
 * @example
 * ```javascript
 * import * as Authorization from './primitives/Authorization/index.js';
 * const auth = { chainId: 1n, address: '0x742d35Cc...', nonce: 0n, yParity: 0, r: 0n, s: 0n };
 * const gas = Authorization.getGasCost(auth, true);
 * ```
 */
export function getGasCost(_auth, isEmpty) {
	return PER_AUTH_BASE_COST + (isEmpty ? PER_EMPTY_ACCOUNT_COST : 0n);
}
