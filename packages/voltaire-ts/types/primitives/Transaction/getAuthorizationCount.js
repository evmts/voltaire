/**
 * Get authorization count for EIP-7702 transaction
 * @param this EIP7702 transaction
 * @returns Number of authorizations
 */
export function getAuthorizationCount() {
    return this.authorizationList.length;
}
