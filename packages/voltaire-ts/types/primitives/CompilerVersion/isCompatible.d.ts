/**
 * Check if version is compatible with a semver range
 *
 * Supports basic semver ranges:
 * - "^0.8.0" - Compatible with 0.8.x (same major.minor)
 * - "~0.8.20" - Compatible with 0.8.20-0.8.x (same major.minor, patch >= specified)
 * - ">=0.8.0" - Greater than or equal
 * - "0.8.20" - Exact match
 *
 * @param {import('./CompilerVersionType.js').CompilerVersionType} version - Version to check
 * @param {string} range - Semver range
 * @returns {boolean} True if compatible
 *
 * @example
 * ```typescript
 * const compatible = CompilerVersion.isCompatible("v0.8.20", "^0.8.0");
 * console.log(compatible); // true
 * ```
 */
export function isCompatible(version: import("./CompilerVersionType.js").CompilerVersionType, range: string): boolean;
//# sourceMappingURL=isCompatible.d.ts.map