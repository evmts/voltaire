import { SEED_SIZE } from "./constants.js";

/**
 * Validate Ed25519 seed format.
 *
 * Checks if seed has correct 32-byte length.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @param {import('./Seed.js').Seed} seed - Ed25519 seed to validate
 * @returns {boolean} True if seed is exactly 32 bytes, false otherwise
 * @throws {never}
 * @example
 * ```javascript
 * import * as Ed25519 from './crypto/Ed25519/index.js';
 * const seed = crypto.getRandomValues(new Uint8Array(32));
 * const isValid = Ed25519.validateSeed(seed); // true
 * ```
 */
export function validateSeed(seed) {
	return seed.length === SEED_SIZE;
}
