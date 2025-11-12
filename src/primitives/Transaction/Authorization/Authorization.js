// @ts-nocheck
import { getAuthorizer } from "./getAuthorizer.js";
import { getSigningHash } from "./getSigningHash.js";
import { verifySignature } from "./verifySignature.js";

// Export individual functions
export { getAuthorizer, getSigningHash, verifySignature };

/**
 * @typedef {import('./BrandedAuthorization.js').BrandedAuthorization} BrandedAuthorization
 */

/**
 * Factory function for creating Authorization instances.
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.0.0
 * @param {{
 *   chainId: bigint,
 *   address: import('../../Address/index.js').BrandedAddress,
 *   nonce: bigint,
 *   yParity: number,
 *   r: Uint8Array,
 *   s: Uint8Array
 * }} auth - Authorization parameters
 * @returns {BrandedAuthorization} Authorization instance
 * @throws {never} Never throws
 * @example
 * ```javascript
 * import { Authorization } from './primitives/Transaction/Authorization/Authorization.js';
 * const auth = Authorization({
 *   chainId: 1n,
 *   address: addr,
 *   nonce: 0n,
 *   yParity: 0,
 *   r: new Uint8Array(32),
 *   s: new Uint8Array(32)
 * });
 * const hash = Authorization.getSigningHash(auth);
 * ```
 */
export function Authorization(auth) {
	return /** @type {BrandedAuthorization} */ ({
		chainId: auth.chainId,
		address: auth.address,
		nonce: auth.nonce,
		yParity: auth.yParity,
		r: auth.r,
		s: auth.s,
	});
}

Authorization.getSigningHash = getSigningHash;
Authorization.verifySignature = verifySignature;
Authorization.getAuthorizer = getAuthorizer;

Authorization.prototype.getSigningHash =
	Function.prototype.call.bind(getSigningHash);
Authorization.prototype.verifySignature =
	Function.prototype.call.bind(verifySignature);
Authorization.prototype.getAuthorizer =
	Function.prototype.call.bind(getAuthorizer);
