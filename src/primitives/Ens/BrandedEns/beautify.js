import { ens_beautify } from "@adraffy/ens-normalize";
import { DisallowedCharacterError } from "./errors.js";

/**
 * Beautify ENS name (normalize but preserve emoji presentation)
 * @param {import('./BrandedEns.js').BrandedEns} name - ENS name to beautify
 * @returns {import('./BrandedEns.js').BrandedEns}
 * @throws {DisallowedCharacterError} If ENS name contains disallowed characters
 */
export function beautify(name) {
	try {
		const beautified = ens_beautify(name);
		return /** @type {import('./BrandedEns.js').BrandedEns} */ (beautified);
	} catch (err) {
		throw new DisallowedCharacterError({
			value: name,
			docsPath: "/primitives/ens/beautify#error-handling",
			cause: /** @type {Error} */ (err),
		});
	}
}
