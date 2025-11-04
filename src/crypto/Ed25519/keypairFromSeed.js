import { ed25519 } from "@noble/curves/ed25519.js";
import { InvalidSeedError, Ed25519Error } from "./errors.js";
import { SEED_SIZE } from "./constants.js";

/**
 * Generate Ed25519 keypair from seed
 *
 * @param {import('./Seed.js').Seed} seed - 32-byte seed for deterministic generation
 * @returns {{secretKey: import('./SecretKey.js').SecretKey, publicKey: import('./PublicKey.js').PublicKey}} Object with secretKey and publicKey
 * @throws {InvalidSeedError} If seed length is invalid
 *
 * @example
 * ```typescript
 * const seed = crypto.getRandomValues(new Uint8Array(32));
 * const keypair = Ed25519.keypairFromSeed(seed);
 * ```
 */
export function keypairFromSeed(seed) {
	if (seed.length !== SEED_SIZE) {
		throw new InvalidSeedError(
			`Seed must be ${SEED_SIZE} bytes, got ${seed.length}`,
		);
	}

	try {
		const publicKey = ed25519.getPublicKey(seed);
		return {
			secretKey: seed,
			publicKey,
		};
	} catch (error) {
		throw new Ed25519Error(`Keypair generation failed: ${error}`);
	}
}
