/**
 * Convert License to string
 *
 * @param {import('./LicenseType.js').LicenseType} license - License to convert
 * @returns {string} String representation
 *
 * @example
 * ```typescript
 * const str = License.toString(license);
 * console.log(str); // "MIT"
 * ```
 */
// biome-ignore lint/suspicious/noShadowRestrictedNames: intentional wrapper for branded type
export function toString(license) {
    return license;
}
