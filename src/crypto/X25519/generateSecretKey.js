import { SECRET_KEY_SIZE } from "./constants.js";

/**
 * Generate random secret key
 *
 * Uses crypto.getRandomValues for secure random generation
 *
 * @returns {import('./SecretKey.js').SecretKey} 32-byte random secret key
 *
 * @example
 * ```typescript
 * const secretKey = X25519.generateSecretKey();
 * const publicKey = X25519.derivePublicKey(secretKey);
 * ```
 */
export function generateSecretKey() {
	return crypto.getRandomValues(new Uint8Array(SECRET_KEY_SIZE));
}
