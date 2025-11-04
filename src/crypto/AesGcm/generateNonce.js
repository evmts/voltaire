import { NONCE_SIZE } from "./constants.js";

/**
 * Generate random nonce
 *
 * @returns {Uint8Array} 12-byte random nonce
 *
 * @example
 * ```typescript
 * const nonce = generateNonce();
 * ```
 */
export function generateNonce() {
	return crypto.getRandomValues(new Uint8Array(NONCE_SIZE));
}
