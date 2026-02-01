import { OSI_APPROVED_LICENSES } from "./constants.js";
/**
 * Check if license is OSI-approved
 *
 * @param {import('./LicenseType.js').LicenseType} license - License to check
 * @returns {boolean} True if OSI-approved
 *
 * @example
 * ```typescript
 * const isOSI = License.isOSI("MIT");
 * console.log(isOSI); // true
 *
 * const isOSI2 = License.isOSI("UNLICENSED");
 * console.log(isOSI2); // false
 * ```
 */
export function isOSI(license) {
    return OSI_APPROVED_LICENSES.includes(/** @type {any} */ (license));
}
