import { ens_normalize } from "@adraffy/ens-normalize";
import { DisallowedCharacterError } from "./errors.js";

/**
 * Normalize ENS name to canonical lowercase form per ENSIP-15
 * @param {import('./BrandedEns.js').BrandedEns} name - ENS name to normalize
 * @returns {import('./BrandedEns.js').BrandedEns}
 * @throws {DisallowedCharacterError} If ENS name contains disallowed characters
 */
export function normalize(name) {
	try {
		const normalized = ens_normalize(name);
		return /** @type {import('./BrandedEns.js').BrandedEns} */ (normalized);
	} catch (err) {
		throw new DisallowedCharacterError({
			value: name,
			docsPath: "/primitives/ens/normalize#error-handling",
			cause: /** @type {Error} */ (err),
		});
	}
}
