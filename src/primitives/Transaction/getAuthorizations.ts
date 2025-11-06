import type { AuthorizationList, EIP7702 } from "./types.js";

/**
 * Get authorization list for EIP-7702 transaction
 * @param this EIP7702 transaction
 * @returns Array of authorizations
 */
export function getAuthorizations(this: EIP7702): AuthorizationList {
	return this.authorizationList;
}
