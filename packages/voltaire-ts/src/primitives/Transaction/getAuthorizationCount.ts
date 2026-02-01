import type { EIP7702 } from "./types.js";

/**
 * Get authorization count for EIP-7702 transaction
 * @param this EIP7702 transaction
 * @returns Number of authorizations
 */
export function getAuthorizationCount(this: EIP7702): number {
	return this.authorizationList.length;
}
