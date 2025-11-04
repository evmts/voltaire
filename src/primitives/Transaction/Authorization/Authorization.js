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
 * Factory function for creating Authorization instances
 *
 * @param {{
 *   chainId: bigint,
 *   address: import('../../Address/index.js').BrandedAddress,
 *   nonce: bigint,
 *   yParity: number,
 *   r: Uint8Array,
 *   s: Uint8Array
 * }} auth - Authorization parameters
 * @returns {BrandedAuthorization} Authorization instance
 *
 * @example
 * ```typescript
 * const auth = Authorization({
 *   chainId: 1n,
 *   address: addr,
 *   nonce: 0n,
 *   yParity: 0,
 *   r: new Uint8Array(32),
 *   s: new Uint8Array(32)
 * });
 *
 * // Static methods
 * const hash = Authorization.getSigningHash(auth);
 * const authorizer = Authorization.getAuthorizer(auth);
 * const valid = Authorization.verifySignature(auth);
 *
 * // Instance methods
 * const hash2 = auth.getSigningHash();
 * const authorizer2 = auth.getAuthorizer();
 * const valid2 = auth.verifySignature();
 * ```
 */
export function Authorization(auth) {
	return {
		__tag: "Authorization",
		chainId: auth.chainId,
		address: auth.address,
		nonce: auth.nonce,
		yParity: auth.yParity,
		r: auth.r,
		s: auth.s,
	};
}

Authorization.getSigningHash = getSigningHash;
Authorization.verifySignature = verifySignature;
Authorization.getAuthorizer = getAuthorizer;

Authorization.prototype.getSigningHash =
	Function.prototype.call.bind(getSigningHash);
Authorization.prototype.verifySignature =
	Function.prototype.call.bind(verifySignature);
Authorization.prototype.getAuthorizer = Function.prototype.call.bind(getAuthorizer);
