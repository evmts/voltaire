/**
 * Convert Int64 to string
 *
 * @param {import('./Int64Type.js').BrandedInt64} value - Int64 value
 * @returns {string} String representation
 */
// biome-ignore lint/suspicious/noShadowRestrictedNames: intentionally named for API consistency
export function toString(value) {
	return value.toString();
}
