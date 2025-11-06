import { normalize as ensNormalize } from "@adraffy/ens-normalize";
import { DisallowedCharacterError } from "./errors.js";

/**
 * Normalize ENS name to canonical lowercase form per ENSIP-15
 * @param {import('./BrandedEns.js').BrandedEns} name - ENS name to normalize
 * @returns {import('./BrandedEns.js').BrandedEns}
 */
export function normalize(name) {
	try {
		const normalized = ensNormalize(name);
		return /** @type {import('./BrandedEns.js').BrandedEns} */ (normalized);
	} catch (err) {
		throw new DisallowedCharacterError();
	}
}
