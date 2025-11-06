/**
 * Check if a value is a branded ENS name
 * @param {unknown} value - Value to check
 * @returns {value is import('./BrandedEns.js').BrandedEns}
 */
export function is(value) {
	return typeof value === "string" && value.length > 0;
}
