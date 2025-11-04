import { SEED_SIZE } from "./constants.js";

/**
 * Validate a seed
 *
 * Checks if seed has correct length
 *
 * @param {import('./Seed.js').Seed} seed - Seed to validate
 * @returns {boolean} True if valid, false otherwise
 */
export function validateSeed(seed) {
	return seed.length === SEED_SIZE;
}
