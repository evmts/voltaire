/**
 * Create License from SPDX identifier string
 *
 * @param {string} value - SPDX license identifier (e.g., "MIT", "Apache-2.0")
 * @returns {import('./LicenseType.js').LicenseType} License
 *
 * @example
 * ```typescript
 * const license = License.from("MIT");
 * const unlicensed = License.from("UNLICENSED");
 * ```
 */
export function from(value) {
    if (typeof value !== "string") {
        throw new Error(`License must be a string, got ${typeof value}`);
    }
    // Normalize: trim whitespace
    const normalized = value.trim();
    if (normalized.length === 0) {
        throw new Error("License cannot be empty");
    }
    return /** @type {import('./LicenseType.js').LicenseType} */ (normalized);
}
