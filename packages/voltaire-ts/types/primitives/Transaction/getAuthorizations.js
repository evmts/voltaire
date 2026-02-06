/**
 * Get authorization list for EIP-7702 transaction
 * @param this EIP7702 transaction
 * @returns Array of authorizations
 */
export function getAuthorizations() {
    return this.authorizationList;
}
