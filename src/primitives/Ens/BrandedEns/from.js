/**
 * Create a branded ENS name from a string without validation
 * @param {string} name - ENS name
 * @returns {import('./BrandedEns.js').BrandedEns}
 */
export function from(name) {
	return /** @type {import('./BrandedEns.js').BrandedEns} */ (name);
}
