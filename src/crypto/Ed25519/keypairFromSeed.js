import { ed25519 } from "@noble/curves/ed25519.js";
import { SEED_SIZE } from "./constants.js";
import { Ed25519Error, InvalidSeedError } from "./errors.js";

/**
 * Generate Ed25519 keypair from seed deterministically.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('./Seed.js').Seed} seed - 32-byte seed for deterministic keypair generation
 * @returns {{secretKey: import('./SecretKey.js').SecretKey, publicKey: import('./PublicKey.js').PublicKey}} Object containing 32-byte secretKey and 32-byte publicKey
 * @throws {InvalidSeedError} If seed length is not 32 bytes
 * @throws {Ed25519Error} If keypair generation fails
 * @example
 * ```javascript
 * import * as Ed25519 from './crypto/Ed25519/index.js';
 * const seed = crypto.getRandomValues(new Uint8Array(32));
 * const keypair = Ed25519.keypairFromSeed(seed);
 * console.log(keypair.publicKey); // Uint8Array(32)
 * ```
 */
export function keypairFromSeed(seed) {
	if (seed.length !== SEED_SIZE) {
		throw new InvalidSeedError(
			`Seed must be ${SEED_SIZE} bytes, got ${seed.length}`,
			{
				code: "ED25519_INVALID_SEED_LENGTH",
				context: { length: seed.length, expected: SEED_SIZE },
				docsPath: "/crypto/ed25519/keypair-from-seed#error-handling",
			},
		);
	}

	try {
		const publicKey = ed25519.getPublicKey(seed);
		return {
			secretKey: seed,
			publicKey,
		};
	} catch (error) {
		throw new Ed25519Error(`Keypair generation failed: ${error}`, {
			code: "ED25519_KEYPAIR_GENERATION_FAILED",
			context: { seedLength: seed.length },
			docsPath: "/crypto/ed25519/keypair-from-seed#error-handling",
			cause: /** @type {Error} */ (error),
		});
	}
}
