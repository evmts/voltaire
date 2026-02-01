import { generateSecretKey } from "./generateSecretKey.js";
import { keypairFromSeed } from "./keypairFromSeed.js";

/**
 * Generate random keypair
 *
 * Uses crypto.getRandomValues for secure random generation
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @returns {{secretKey: import('./SecretKey.js').SecretKey, publicKey: import('./PublicKey.js').PublicKey}} Object with secretKey and publicKey
 * @throws {never}
 * @example
 * ```javascript
 * import { X25519 } from './crypto/X25519/index.js';
 * const keypair = X25519.generateKeypair();
 * console.log(keypair.secretKey.length); // 32
 * console.log(keypair.publicKey.length); // 32
 * ```
 */
export function generateKeypair() {
	const secretKey = generateSecretKey();
	return keypairFromSeed(secretKey);
}
