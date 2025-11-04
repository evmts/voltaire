import { x25519 } from "@noble/curves/ed25519.js";
import { SECRET_KEY_SIZE } from "./constants.js";
import { InvalidSecretKeyError, X25519Error } from "./errors.js";

/**
 * Generate X25519 keypair from seed
 *
 * @param {Uint8Array} seed - 32-byte seed for deterministic generation
 * @returns {{secretKey: import('./SecretKey.js').SecretKey, publicKey: import('./PublicKey.js').PublicKey}} Object with secretKey and publicKey
 * @throws {InvalidSecretKeyError} If seed length is invalid
 *
 * @example
 * ```typescript
 * const seed = crypto.getRandomValues(new Uint8Array(32));
 * const keypair = X25519.keypairFromSeed(seed);
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
