import { process } from "./process.js";

/**
 * Process authorization list and return all delegations
 *
 * @param {import("./AuthorizationType.js").AuthorizationType[]} authList - Authorization list
 * @returns {{authority: import("../Address/AddressType.js").AddressType, delegatedAddress: import("../Address/AddressType.js").AddressType}[]} Array of delegation designations
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
