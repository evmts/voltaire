/**
 * Convert Int32 to string
 *
 * @param {import('./Int32Type.js').BrandedInt32} value - Int32 value
 * @returns {string} String representation
 */
// biome-ignore lint/suspicious/noShadowRestrictedNames: intentionally named for API consistency
export function toString(value) {
    return value.toString();
}
