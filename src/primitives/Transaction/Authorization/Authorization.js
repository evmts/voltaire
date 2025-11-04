/**
 * Authorization Factory (EIP-7702)
 *
 * Factory function pattern with both static and instance methods.
 *
 * @example
 * ```typescript
 * import { Authorization } from './Authorization.js';
 *
 * // Factory function
 * const auth = Authorization({ chainId: 1n, address: addr, nonce: 0n, ... });
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

// Import all method functions
import { getAuthorizer } from "./getAuthorizer.js";
import { getSigningHash } from "./getSigningHash.js";
import { verifySignature } from "./verifySignature.js";

// Re-export types
export * from "./BrandedAuthorization.js";

// Re-export method functions for tree-shaking
export { getAuthorizer, getSigningHash, verifySignature };

/**
 * @typedef {import('./BrandedAuthorization.js').BrandedAuthorization} BrandedAuthorization
 * @typedef {import('./AuthorizationConstructor.js').AuthorizationConstructor} AuthorizationConstructor
 */

/**
 * Factory function for creating Authorization instances
 *
 * @type {AuthorizationConstructor}
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

// Attach static methods
Authorization.getSigningHash = getSigningHash;
Authorization.verifySignature = verifySignature;
Authorization.getAuthorizer = getAuthorizer;

// Bind prototype methods using Function.prototype.call.bind
Authorization.prototype.getSigningHash =
	Function.prototype.call.bind(getSigningHash);
Authorization.prototype.verifySignature =
	Function.prototype.call.bind(verifySignature);
Authorization.prototype.getAuthorizer = Function.prototype.call.bind(getAuthorizer);
