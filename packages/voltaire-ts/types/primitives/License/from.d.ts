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
export function from(value: string): import("./LicenseType.js").LicenseType;
//# sourceMappingURL=from.d.ts.map