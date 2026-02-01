/**
 * Get authorizing address from signature.
 *
 * Recovers the Ethereum address that signed the authorization
 * using the signature components (r, s, yParity) and the signing hash.
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @param {import('./BrandedAuthorization.d.js').BrandedAuthorization} auth - Authorization to recover from
 * @returns {import('../../Address/index.js').AddressType} Recovered authorizer address
 * @throws {Error} If signature recovery fails
 * @example
 * ```javascript
 * import { getAuthorizer } from './primitives/Transaction/Authorization/getAuthorizer.js';
 * const authorizerAddr = getAuthorizer(auth);
 * ```
 */
export function getAuthorizer(auth: import("./BrandedAuthorization.d.js").BrandedAuthorization): import("../../Address/index.js").AddressType;
//# sourceMappingURL=getAuthorizer.d.ts.map