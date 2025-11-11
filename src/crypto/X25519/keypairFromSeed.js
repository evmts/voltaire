import { x25519 } from "@noble/curves/ed25519.js";
import { SECRET_KEY_SIZE } from "./constants.js";
import { InvalidSecretKeyError, X25519Error } from "./errors.js";

/**
 * Generate X25519 keypair from seed
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {Uint8Array} seed - 32-byte seed for deterministic generation
 * @returns {{secretKey: import('./SecretKey.js').SecretKey, publicKey: import('./PublicKey.js').PublicKey}} Object with secretKey and publicKey
 * @throws {InvalidSecretKeyError} If seed length is invalid
 * @example
 * ```javascript
 * import { X25519 } from './crypto/X25519/index.js';
 * const seed = crypto.getRandomValues(new Uint8Array(32));
 * const keypair = X25519.keypairFromSeed(seed);
 * console.log(keypair.secretKey.length); // 32
 * console.log(keypair.publicKey.length); // 32
 * ```
 */
export function keypairFromSeed(seed) {
	if (seed.length !== SECRET_KEY_SIZE) {
		throw new InvalidSecretKeyError(
			`Seed must be ${SECRET_KEY_SIZE} bytes, got ${seed.length}`,
		);
	}

	try {
		const publicKey = x25519.getPublicKey(seed);
		return {
			secretKey: seed,
			publicKey,
		};
	} catch (error) {
		throw new X25519Error(`Keypair generation failed: ${error}`);
	}
}
