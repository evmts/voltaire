/**
 * Normalize ENS name to canonical lowercase form per ENSIP-15
 * @param {import('./BrandedEns.js').BrandedEns} name - ENS name to normalize
 * @returns {import('./BrandedEns.js').BrandedEns}
 */
export function normalize(name) {
	// Import dynamically to avoid circular dependencies
	const { normalize: ensNormalize } = require("@adraffy/ens-normalize");
	try {
		const normalized = ensNormalize(name);
		return /** @type {import('./BrandedEns.js').BrandedEns} */ (normalized);
	} catch (err) {
		const { DisallowedCharacterError } = require("./errors.js");
		throw new DisallowedCharacterError();
	}
}
