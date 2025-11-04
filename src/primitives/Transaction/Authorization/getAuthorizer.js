import { recoverAddress } from "../utils.ts";
import { getSigningHash } from "./getSigningHash.js";

/**
 * Get authorizing address from signature
 *
 * Recovers the Ethereum address that signed the authorization
 * using the signature components (r, s, yParity) and the signing hash.
 *
 * @param {import('./BrandedAuthorization.js').BrandedAuthorization} auth - Authorization to recover from
 * @returns {import('../../Address/index.js').BrandedAddress} Recovered authorizer address
 *
 * @example
 * ```typescript
 * const authorizerAddr = getAuthorizer(auth);
 * ```
 */
export function getAuthorizer(auth) {
	const signingHash = getSigningHash(auth);
	const v = 27 + auth.yParity;
	return recoverAddress({ r: auth.r, s: auth.s, v }, signingHash);
}
