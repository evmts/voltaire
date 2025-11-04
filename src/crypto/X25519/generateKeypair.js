import { generateSecretKey } from "./generateSecretKey.js";
import { keypairFromSeed } from "./keypairFromSeed.js";

/**
 * Generate random keypair
 *
 * Uses crypto.getRandomValues for secure random generation
 *
 * @returns {{secretKey: import('./SecretKey.js').SecretKey, publicKey: import('./PublicKey.js').PublicKey}} Object with secretKey and publicKey
 *
 * @example
 * ```typescript
 * const keypair = X25519.generateKeypair();
 * ```
 */
export function generateKeypair() {
	const secretKey = generateSecretKey();
	return keypairFromSeed(secretKey);
}
