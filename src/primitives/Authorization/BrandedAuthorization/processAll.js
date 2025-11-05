import { process } from "./process.js";

/**
 * Process authorization list and return all delegations
 *
 * @param {import("./BrandedAuthorization.js").BrandedAuthorization[]} authList - Authorization list
 * @returns {{authority: import("../../Address/BrandedAddress/BrandedAddress.js").BrandedAddress, delegatedAddress: import("../../Address/BrandedAddress/BrandedAddress.js").BrandedAddress}[]} Array of delegation designations
 * @throws {import("./errors.js").ValidationError} if any authorization is invalid
 *
 * @example
 * ```typescript
 * const authList: Item[] = [...];
 * const delegations = processAll(authList);
 * delegations.forEach(d => {
 *   console.log(`${d.authority} -> ${d.delegatedAddress}`);
 * });
 * ```
 */
export function processAll(authList) {
	return authList.map((auth) => process(auth));
}
